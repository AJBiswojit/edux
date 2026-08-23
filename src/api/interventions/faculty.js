/**
 * Intervention API — faculty surface.
 *
 * Similar Issues (Phase 5) + the actionable intervention lifecycle (Phase 6):
 * approval → modify → student selection → prototype assignment → targeted
 * practice → linked re-test → before/after effectiveness. Endpoint contracts,
 * IDs, payloads and status codes are unchanged.
 *
 * Practice attempts are SEPARATE from official exams (mode
 * 'intervention-practice' | 'intervention-retest') — they never contaminate
 * university/JEE/NEET performance.
 */
import { defineRoute } from '../core/router'
import {
  facultyStudents, getStudentAttempts,
} from '@/intelligence/faculty/datasets/students-directory'
import {
  computeStudentIssueFingerprints, computeStudentQuestionIntelligence, groupSimilarIssues,
  buildIndividualIssue, buildIndividualWhyDetected, buildRecommendation,
  buildInterventionFromGroup, canTransition, selectPracticeQuestions,
  buildRetestEntity, sameInterventionTarget,
  computeEffectiveness,
} from '@/intelligence/faculty'
import { normalizeExamAttempt, classifyAttemptContext } from '@/intelligence'
import { EXAM_AGENT_EXAMS } from '@/datasets/exams/exam-agent.js'
import {
  readStatus, writeStatus, readPractice, writePractice, readRetests, writeRetests,
} from './store'
import {
  canonicalAttemptsFor, fingerprintsForAll, groupedPayload, slug, storedInterventionRecords,
  allInterventionGroups, findGroupById, interventionFor, persistedInterventions,
  activeInterventionForStudent, evidenceRowsForGroup, postExamOutcomeFor,
  questionPoolFor, presentGroup,
} from './lifecycle'

/* ------------------------------------------------------------------ */
/* Faculty: similarity (Phase 5 + multi-student outcome extension)     */
/* ------------------------------------------------------------------ */
defineRoute('get', '/faculty/similar-issues', ({ params }) => {
  const scope = params?.scope ?? 'all'
  const { groups } = groupedPayload()
  const fps = fingerprintsForAll()
  const { individuals } = groupSimilarIssues(fps)
  const scopeGroups = scope === 'batch'
    ? groups
    : groups
  const active = persistedInterventions()
  return {
    groups: scopeGroups.map((group) => presentGroup(group, active)),
    individuals: individuals.map((f) => buildIndividualIssue(f)),
    count: groups.length,
    individualCount: individuals.length,
    scope,
    demoExcluded: true,
    note: 'AI Similarity Score — prototype grouping, not a validated measure.',
  }
})

function requireIssueGroup(id) {
  const group = groupedPayload().groups.find((g) => g.id === id)
  if (group) return group
  const err = new Error('Similar Issue Group not found.')
  err.response = { status: 404, data: { message: err.message } }
  throw err
}

function practiceRequest(raw = {}) {
  return {
    count: Number(raw.count ?? raw.questionCount ?? 8),
    difficulty: raw.difficulty ?? 'Medium',
    questionType: raw.questionType ?? 'Any',
    pyqPreference: raw.pyqPreference ?? 'Preferred',
    selectionLevel: raw.selectionLevel ?? raw.level ?? 'exact',
  }
}

async function practiceAvailability(group, config) {
  const pool = await questionPoolFor(group)
  const result = selectPracticeQuestions({
    domain: group.domain, examFamily: group.examFamily, subject: group.subject, chapter: group.chapter,
    difficulty: config.difficulty, count: config.count, questionType: config.questionType,
    includePyq: config.pyqPreference !== 'No', pyqPreference: config.pyqPreference,
    pool: pool.questions, level: config.selectionLevel,
  })
  return {
    availableQuestions: result.available,
    requiredQuestions: result.required,
    shortfall: Math.max(0, result.required - result.available),
    insufficient: result.insufficient,
    selectionLevel: result.level,
    requestedSelectionLevel: config.selectionLevel,
  }
}

/* Group evidence is canonical question-attempt evidence. It is faculty-only
   and partitioned by the selected group context. */
defineRoute('get', '/faculty/similar-issues/:groupId/evidence', ({ params }) => {
  const group = requireIssueGroup(params.groupId)
  const rows = evidenceRowsForGroup(group)
  return {
    groupId: group.id,
    domain: group.domain, examFamily: group.examFamily, subject: group.subject, chapter: group.chapter,
    summary: { ...group.evidence, evidenceQuestions: rows.length },
    rows,
    students: group.students.map((s) => ({
      ...s,
      evidenceCount: rows.filter((r) => r.studentId === s.studentId).length,
      rows: rows.filter((r) => r.studentId === s.studentId),
    })),
  }
})

defineRoute('get', '/faculty/similar-issues/:groupId/intervention-preflight', async ({ params }) => {
  const group = requireIssueGroup(params.groupId)
  const config = practiceRequest(params)
  const evidenceRows = evidenceRowsForGroup(group)
  const availability = await practiceAvailability(group, config)
  const presented = presentGroup(group)
  return {
    group: presented,
    groupEvidence: { ...group.evidence, evidenceQuestions: evidenceRows.length },
    students: presented.students.map((s) => ({
      ...s,
      evidenceRows: evidenceRows.filter((r) => r.studentId === s.studentId),
      selectableByDefault: !s.existingIntervention,
      exclusionReason: s.existingIntervention ? `Existing active intervention (${s.existingIntervention.status})` : null,
    })),
    practiceConfig: config,
    practiceAvailability: availability,
  }
})

/** Faculty-confirmed group creation. One persisted lifecycle record is written
 * per selected student; duplicates become explicit skips, never silent loss. */
defineRoute('post', '/faculty/similar-issues/:groupId/interventions', async ({ params, body }) => {
  const group = requireIssueGroup(params.groupId)
  const requestedIds = [...new Set(Array.isArray(body?.studentIds) ? body.studentIds : [])]
  if (!requestedIds.length) {
    const err = new Error('Select at least one student from this Similar Issue Group.')
    err.response = { status: 400, data: { message: err.message } }
    throw err
  }
  const config = practiceRequest(body?.practiceConfig)
  if (!Number.isFinite(config.count) || config.count < 1 || config.count > 30) {
    const err = new Error('Requested question count must be between 1 and 30.')
    err.response = { status: 400, data: { message: err.message } }
    throw err
  }
  const availability = await practiceAvailability(group, config)
  if (availability.insufficient) {
    const err = new Error('Not enough questions match this configuration.')
    err.response = { status: 400, data: { message: err.message, ...availability } }
    throw err
  }

  const overrides = readStatus()
  const created = []
  const skipped = []
  const createdAt = new Date().toISOString()
  const activeCandidates = persistedInterventions()

  requestedIds.forEach((studentId) => {
    const member = group.students.find((s) => s.studentId === studentId)
    if (!member) {
      skipped.push({ studentId, name: 'Unknown student', reason: 'Student does not belong to this Similar Issue Group.' })
      return
    }
    const existing = activeInterventionForStudent(studentId, group, activeCandidates)
    if (existing) {
      skipped.push({ studentId, name: member.name, reason: 'Existing active intervention', interventionId: existing.id, status: existing.status })
      return
    }

    const interventionId = `similar-${slug(group.id)}-${slug(studentId)}`
    const evidence = {
      students: 1, subject: group.subject, chapter: group.chapter, issueType: group.issueType,
      avgAccuracy: member.accuracy ?? null, avgTime: member.avgTime ?? null,
      questions: member.evidence?.questions ?? 0, attempted: member.evidence?.attempted ?? null,
      incorrect: member.evidence?.incorrect ?? 0, skipped: member.evidence?.skipped ?? 0,
      affectedExams: member.evidence?.attempts ?? 0, attempts: member.evidence?.attempts ?? 0,
      persistence: member.evidence?.attempts ?? 1, trend: member.trend ?? null,
    }
    const oneStudentGroup = {
      ...group,
      id: interventionId,
      issueGroupId: group.id,
      studentCount: 1,
      students: [member],
      evidence,
    }
    const objective = body?.objective ?? `Improve ${group.chapter} accuracy.`
    const record = {
      interventionGroup: oneStudentGroup,
      interventionId,
      studentId,
      studentIds: [studentId],
      source: 'Similar Issues',
      groupId: group.id,
      domain: group.domain,
      examFamily: group.examFamily ?? null,
      subject: group.subject,
      chapter: group.chapter,
      issueType: group.issueType,
      priority: body?.priority ?? group.priority,
      title: body?.title ?? `${group.chapter} Accuracy Recovery — ${member.name.split(' ')[0]}`,
      objectives: [objective],
      objective,
      evidence,
      practiceConfig: {
        type: body?.practiceConfig?.type,
        count: config.count,
        difficulty: config.difficulty,
        duration: Number(body?.practiceConfig?.duration ?? 20),
        questionType: config.questionType,
        includePyq: config.pyqPreference !== 'No',
        pyqPreference: config.pyqPreference,
        selectionLevel: config.selectionLevel,
      },
      pyqPreference: config.pyqPreference,
      notes: body?.notes ?? '',
      createdBy: body?.createdBy ?? 'Dr. Meera Krishnan',
      createdAt,
      updatedAt: createdAt,
      status: 'Recommended',
      practiceAvailability: availability,
    }
    overrides[interventionId] = record
    created.push({ interventionId, studentId, name: member.name, status: 'Recommended' })
  })

  writeStatus(overrides)
  return {
    ok: created.length > 0,
    groupId: group.id,
    created, skipped,
    createdCount: created.length,
    skippedCount: skipped.length,
    commonTarget: `${group.examFamily ?? group.domain} ${group.subject} → ${group.chapter}`,
    priority: body?.priority ?? group.priority,
    note: 'One intervention record per student. Faculty approval is still required; nothing was assigned automatically.',
  }
})

/* ------------------------------------------------------------------ */
/* Faculty: intervention center + lifecycle                           */
/* ------------------------------------------------------------------ */
defineRoute('get', '/faculty/interventions', async () => {
  const groups = allInterventionGroups()
  const practice = readPractice()
  const retests = readRetests()
  const items = groups.map((g) => {
    const iv = interventionFor(g)
    const ivPractice = practice.filter((p) => p.interventionId === iv.id)
    const ivRetests = retests.filter((r) => r.interventionId === iv.id)
    const retestAttempts = practice.filter((p) => p.kind === 'retest' && p.interventionId === iv.id)
    const outcome = iv.studentId
      ? postExamOutcomeFor(iv, practice, retests)
      : { effectiveness: computeEffectiveness({ baseline: iv.baseline, practiceAttempts: ivPractice.filter((p) => p.kind === 'practice'), retestAttempts }), postExam: null }
    return {
      ...iv,
      practiceProgress: ivPractice.filter((p) => p.kind === 'practice').length,
      practiceRequired: iv.practiceConfig?.count ?? 8,
      practiceAccuracy: ivPractice.filter((p) => p.kind === 'practice').length ? Math.round(ivPractice.filter((p) => p.kind === 'practice').reduce((n, p) => n + p.accuracy, 0) / ivPractice.filter((p) => p.kind === 'practice').length) : null,
      retests: ivRetests.length,
      retestPending: ivRetests.length > 0 && !retestAttempts.length,
      effectiveness: outcome.effectiveness,
      postExam: outcome.postExam,
    }
  })
  return {
    items,
    count: items.length,
    byStatus: items.reduce((acc, i) => { acc[i.status] = (acc[i.status] ?? 0) + 1; return acc }, {}),
  }
})

defineRoute('get', '/faculty/interventions/:id', async ({ params }) => {
  const group = findGroupById(params.id)
  if (!group) {
    const err = new Error('Intervention not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const practice = readPractice()
  const retests = readRetests()
  const iv = interventionFor(group)
  const retestAttempts = practice.filter((p) => p.kind === 'retest' && p.interventionId === iv.id)
  const outcome = iv.studentId
    ? postExamOutcomeFor(iv, practice, retests)
    : { effectiveness: computeEffectiveness({ baseline: iv.baseline, practiceAttempts: practice.filter((p) => p.kind === 'practice' && p.interventionId === iv.id), retestAttempts }), postExam: null }
  return {
    intervention: {
      ...iv,
      effectiveness: outcome.effectiveness,
      postExam: outcome.postExam,
      practiceAttempts: practice.filter((p) => p.interventionId === iv.id),
      retests: retests.filter((r) => r.interventionId === iv.id),
    },
  }
})

/* Controlled status transitions (faculty) */
defineRoute('post', '/faculty/interventions/:groupId/status', ({ params, body }) => {
  const group = findGroupById(params.groupId)
  if (!group) {
    const err = new Error('Intervention not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const overrides = readStatus()
  const current = overrides[group.id] ?? {}
  const from = current.status ?? 'Detected'
  const to = body?.status
  if (!to || !canTransition(from, to)) {
    const err = new Error(`Invalid transition ${from} → ${to}.`)
    err.response = { status: 400, data: { message: err.message, from, to, allowed: TRANSITIONS_ALLOWED[from] ?? [] } }
    throw err
  }
  const next = { ...current, status: to, action: body?.action ?? current.action ?? null, updatedAt: new Date().toISOString() }
  if (to === 'Approved') { next.approvedAt = next.approvedAt ?? new Date().toISOString(); next.approvedBy = body?.approvedBy ?? 'Dr. Meera Krishnan' }
  if (to === 'Assigned') next.assignedAt = next.assignedAt ?? new Date().toISOString()
  if (to === 'Completed') next.completedAt = next.completedAt ?? new Date().toISOString()
  overrides[group.id] = next
  writeStatus(overrides)
  return { ok: true, groupId: group.id, status: to, record: next }
})

const TRANSITIONS_ALLOWED = {
  Detected: ['Recommended', 'Dismissed'], Recommended: ['Approved', 'Dismissed'],
  Approved: ['Planned', 'Dismissed'], Planned: ['Assigned', 'Dismissed'],
  Assigned: ['In Progress', 'Dismissed'], 'In Progress': ['Completed'],
  Completed: ['Re-test Pending'], 'Re-test Pending': ['Evaluating'],
  Evaluating: ['Resolved', 'Improving', 'Persistent'], Resolved: [], Improving: [], Persistent: [], Dismissed: [],
}

/* Faculty modify — evidence is never editable */
defineRoute('post', '/faculty/interventions/:groupId/modify', ({ params, body }) => {
  const overrides = readStatus()
  const current = overrides[params.groupId] ?? {}
  const next = {
    ...current,
    title: body?.title ?? current.title,
    objectives: body?.objectives ?? current.objectives,
    priority: body?.priority ?? current.priority,
    studentIds: Array.isArray(body?.studentIds) ? body.studentIds : current.studentIds,
    practiceConfig: { ...(current.practiceConfig ?? {}), ...(body?.practiceConfig ?? {}) },
    pyqPreference: body?.pyqPreference ?? current.pyqPreference,
    notes: body?.notes ?? current.notes,
    updatedAt: new Date().toISOString(),
  }
  overrides[params.groupId] = next
  writeStatus(overrides)
  return { ok: true, groupId: params.groupId, record: next }
})

/* Prototype assignment (Planned → Assigned) */
defineRoute('post', '/faculty/interventions/:groupId/assign', ({ params }) => {
  const overrides = readStatus()
  const current = overrides[params.groupId] ?? {}
  const from = current.status ?? 'Detected'
  if (!canTransition(from, 'Assigned')) {
    const err = new Error(`Cannot assign from ${from}.`)
    err.response = { status: 400, data: { message: err.message } }
    throw err
  }
  const next = { ...current, status: 'Assigned', assignedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  overrides[params.groupId] = next
  writeStatus(overrides)
  return { ok: true, groupId: params.groupId, status: 'Assigned', note: 'Prototype assignment — nothing is delivered outside this prototype.' }
})

/* Practice set for an intervention */
defineRoute('get', '/faculty/interventions/:id/practice', async ({ params }) => {
  const group = findGroupById(params.id)
  if (!group) {
    const err = new Error('Intervention not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const iv = interventionFor(group)
  const pool = await questionPoolFor(iv)
  const used = readPractice().filter((p) => p.interventionId === iv.id && p.kind === 'practice').flatMap((p) => p.questionAttempts?.map((q) => q.questionId) ?? [])
  const res = selectPracticeQuestions({
    domain: iv.domain, examFamily: iv.examFamily, subject: iv.subject, chapter: iv.chapter,
    difficulty: iv.practiceConfig?.difficulty ?? 'Medium', count: iv.practiceConfig?.count ?? 8,
    questionType: iv.practiceConfig?.questionType ?? 'Any',
    includePyq: iv.practiceConfig?.includePyq ?? true, pyqPreference: iv.practiceConfig?.pyqPreference,
    excludeIds: used, pool: pool.questions, level: iv.practiceConfig?.selectionLevel ?? 'subject',
  })
  return { ...res, interventionId: iv.id, practiceType: iv.practiceConfig?.type, durationMinutes: iv.practiceConfig?.duration ?? 20 }
})

/* Create re-test (Completed → Re-test Pending) */
defineRoute('post', '/faculty/interventions/:groupId/retest', async ({ params, body }) => {
  const group = findGroupById(params.groupId)
  if (!group) {
    const err = new Error('Intervention not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const overrides = readStatus()
  const current = overrides[group.id] ?? {}
  if (!['Completed', 'Re-test Pending', 'Assigned', 'In Progress'].includes(current.status ?? 'Detected')) {
    const err = new Error(`Re-test requires a completed practice (current: ${current.status ?? 'Detected'}).`)
    err.response = { status: 400, data: { message: err.message } }
    throw err
  }
  const iv = interventionFor(group)
  const pool = await questionPoolFor(iv)
  const practiceIds = readPractice().filter((p) => p.interventionId === iv.id).flatMap((p) => p.questionAttempts?.map((q) => q.questionId) ?? [])
  const difficulty = body?.difficulty ?? 'Medium'
  const count = Number(body?.count ?? 10)
  const pyqPreference = body?.pyqPreference ?? 'Yes'
  const level = body?.level ?? 'subject'
  const res = selectPracticeQuestions({
    domain: iv.domain, examFamily: iv.examFamily, subject: iv.subject, chapter: iv.chapter,
    difficulty, count, includePyq: pyqPreference === 'Yes', excludeIds: practiceIds, pool: pool.questions, level,
  })
  if (res.insufficient) {
    const err = new Error('Not enough unused questions match this re-test configuration.')
    err.response = { status: 400, data: { message: err.message, available: res.available, required: res.required, shortfall: res.required - res.available } }
    throw err
  }
  const retest = buildRetestEntity({
    intervention: iv,
    title: body?.title ?? `Recovery Test — ${iv.chapter}`,
    difficulty, count: res.questions.length, timeLimit: Number(body?.timeLimit ?? 20),
    pyqPreference, studentIds: Array.isArray(body?.studentIds) ? body.studentIds : iv.studentIds,
    questions: res.questions,
  })
  const retests = readRetests()
  retests.push(retest)
  writeRetests(retests)
  const next = { ...current, status: 'Re-test Pending', retestCreatedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  overrides[group.id] = next
  writeStatus(overrides)
  return { ok: true, retest, insufficient: res.insufficient, available: res.available, required: res.required }
})

/* Effectiveness — Phase 3: the standalone read route was retired (zero
   consumers). Effectiveness itself is unchanged: it is still computed into
   every intervention payload (list/detail) and updated by practice/re-test
   writes, so the lifecycle keeps full visibility. */

/* Faculty: a student's intervention history (for the 360 profile).
   Phase 5 hardening: includes Student-360-created interventions from
   'Recommended' onward (so "Intervention Created" is visible immediately
   after faculty review) and reports per-student practice / re-test /
   effectiveness status via the SAME lifecycle data. */
defineRoute('get', '/faculty/students/:id/interventions', async ({ params }) => {
  const practice = readPractice()
  const retests = readRetests()
  const items = allInterventionGroups()
    .map((g) => interventionFor(g))
    .filter((iv) => (iv.studentIds ?? []).includes(params.id))
    .filter((iv) => ['Recommended', 'Approved', 'Planned', 'Assigned', 'In Progress', 'Completed', 'Re-test Pending', 'Evaluating', 'Resolved', 'Improving', 'Persistent'].includes(iv.status))
    .map((iv) => {
      const myPractice = practice.filter((p) => p.interventionId === iv.id && p.studentId === params.id)
      const practiceRows = myPractice.filter((p) => p.kind === 'practice')
      const retestRows = myPractice.filter((p) => p.kind === 'retest')
      const myRetests = retests.filter((r) => r.interventionId === iv.id && (r.studentIds ?? []).includes(params.id))
      const outcome = iv.studentId
        ? postExamOutcomeFor(iv, practice, retests)
        : { effectiveness: computeEffectiveness({ baseline: iv.baseline, practiceAttempts: practiceRows, retestAttempts: retestRows }), postExam: null }
      const eff = outcome.effectiveness
      return {
        id: iv.id,
        interventionId: iv.id,
        studentId: params.id,
        groupId: iv.groupId ?? iv.issueGroupId ?? null,
        title: iv.title,
        domain: iv.domain,
        examFamily: iv.examFamily,
        subject: iv.subject,
        chapter: iv.chapter,
        issueType: iv.issueType,
        priority: iv.priority,
        status: iv.status,
        source: iv.source ?? 'Similar Issues',
        createdAt: iv.createdAt ?? null,
        objectives: iv.objectives ?? [],
        practiceConfig: iv.practiceConfig ?? null,
        evidence: iv.evidence ?? null,
        practiceDone: practiceRows.length > 0,
        practiceStatus: practiceRows.length === 0
          ? 'Not started'
          : iv.status === 'Completed' || ['Re-test Pending', 'Evaluating', 'Resolved', 'Improving', 'Persistent'].includes(iv.status) ? 'Completed' : 'In progress',
        practiceProgress: practiceRows.length,
        practiceRequired: iv.practiceConfig?.count ?? 8,
        practiceAccuracy: practiceRows.length ? Math.round(practiceRows.reduce((n, p) => n + p.accuracy, 0) / practiceRows.length) : null,
        retestStatus: retestRows.length > 0 ? 'Completed' : myRetests.length > 0 ? 'Pending' : 'Not created',
        retests: myRetests.length,
        effectivenessStatus: eff?.outcome ?? 'Pending',
        outcome: eff?.completed ? eff.outcome : null,
        effectivenessEvidence: eff?.evidence ?? null,
        effectiveness: eff,
        postExam: outcome.postExam,
      }
    })
  return { items, count: items.length, studentId: params.id }
})

/* ------------------------------------------------------------------ */
/* Phase 5 hardening — Weakness → Evidence → Review → CREATE          */
/* ------------------------------------------------------------------ */
/**
 * Faculty reviewed an individual weakness/issue inside Student 360 and chose
 * to create an intervention. This is NOT a second intervention system:
 *   · evidence is RE-DERIVED server-side from the student's canonical
 *     attempts (fingerprints → question rows) — the client payload never
 *     fabricates evidence;
 *   · the record is built by the EXISTING buildInterventionFromGroup() from
 *     a synthetic single-student group and stored in the EXISTING
 *     EduX_faculty_interventions map;
 *   · it enters the lifecycle at 'Recommended' (faculty already reviewed);
 *     every later transition goes through the validated /status route.
 * Nothing is assigned automatically.
 */
defineRoute('post', '/faculty/students/:studentId/interventions', ({ params, body }) => {
  const student = facultyStudents.find((s) => s.id === params.studentId)
  if (!student) {
    const err = new Error('Student not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const payload = body ?? {}
  const { subject, chapter } = payload
  if (!subject || !chapter) {
    const err = new Error('Subject and chapter are required to create an intervention.')
    err.response = { status: 400, data: { message: err.message } }
    throw err
  }

  const examFamily = payload.examFamily ?? (student.examFamily || null)
  const domain = payload.domain ?? (examFamily ? 'Competitive' : 'University')

  /* canonical evidence — fingerprints first, raw question rows as fallback */
  const attempts = canonicalAttemptsFor(student.id)
  const fingerprints = computeStudentIssueFingerprints(student, attempts)
  const fp = fingerprints.find((f) =>
    f.subject === subject && f.chapter === chapter
    && (domain === 'University' ? f.domain === 'University' : f.domain === 'Competitive' && f.examFamily === examFamily))

  let evidence = null
  let issueType = payload.issueType ?? fp?.issueType ?? 'Performance Gap'
  let whyDetected = payload.whyDetected ?? null
  let accuracy = null
  let avgTime = null

  if (fp) {
    evidence = {
      students: 1, subject, chapter, issueType: fp.issueType,
      avgAccuracy: fp.accuracy ?? 0, avgTime: fp.avgTime ?? 0,
      questions: fp.questions ?? 0, incorrect: fp.incorrect ?? 0, skipped: fp.skipped ?? 0,
      attempts: fp.evidence?.attempts ?? fp.persistence ?? 1,
      affectedExams: [...new Set((fp.series ?? []).map((s) => s.date))].size,
      persistence: fp.persistence ?? 1,
      trend: fp.trend ?? null,
    }
    accuracy = fp.accuracy ?? null
    avgTime = fp.avgTime ?? null
    issueType = fp.issueType
    whyDetected = whyDetected ?? buildIndividualWhyDetected(fp)
  } else {
    /* fallback: aggregate the student's actual question rows for this chapter
       (domain-scoped — never mixes University with JEE/NEET attempts) */
    const scopedAttempts = attempts.filter((a) => {
      const ctx = classifyAttemptContext(a)
      return domain === 'University'
        ? ctx.domain === 'university'
        : ctx.examFamily === examFamily
    })
    const rows = scopedAttempts.flatMap((a) => (a.questionAttempts ?? [])
      .map((qa) => ({
        subject: qa.academicContext?.subject ?? null,
        chapter: qa.academicContext?.chapter ?? null,
        isCorrect: qa.evaluation?.isCorrect ?? false,
        isSkipped: qa.evaluation?.isSkipped ?? qa.response?.status === 'skipped',
        attempted: qa.response?.selectedAnswer != null,
        time: qa.timing?.timeSpent ?? 0,
        date: (a.submittedAt ?? '').slice(0, 10),
      })))
      .filter((r) => r.subject === subject && r.chapter === chapter)
    if (!rows.length) {
      const err = new Error(`No question-level evidence available for ${chapter} (${subject}) — an intervention cannot be created without evidence.`)
      err.response = { status: 400, data: { message: err.message } }
      throw err
    }
    const correct = rows.filter((r) => r.isCorrect).length
    const attempted = rows.filter((r) => r.attempted).length
    const incorrect = rows.filter((r) => r.isCorrect === false && r.attempted).length
    const skipped = rows.filter((r) => r.isSkipped).length
    accuracy = attempted ? Math.round((correct / attempted) * 100) : 0
    avgTime = attempted ? Math.round(rows.reduce((n, r) => n + r.time, 0) / attempted) : 0
    evidence = {
      students: 1, subject, chapter, issueType,
      avgAccuracy: accuracy, avgTime,
      questions: rows.length, incorrect, skipped,
      attempts: [...new Set(rows.map((r) => r.date))].length,
      affectedExams: [...new Set(rows.map((r) => r.date))].size,
      persistence: [...new Set(rows.map((r) => r.date))].length,
      trend: null,
    }
    whyDetected = whyDetected ?? `${incorrect} incorrect and ${skipped} skipped of ${rows.length} question(s) recorded for ${chapter} across ${evidence.attempts} assessment(s).`
  }

  const id = `s360-${student.id}-${slug(subject)}-${slug(chapter)}`
  const overrides = readStatus()
  const existing = overrides[id]
  if (existing && existing.status && existing.status !== 'Dismissed') {
    const err = new Error(`An intervention for ${student.name} — ${subject} ${chapter} already exists (status: ${existing.status}). Open the Intervention Center to manage it.`)
    err.response = { status: 400, data: { message: err.message } }
    throw err
  }

  /* recommendation re-derived by the EXISTING Phase 5 builder when a
     fingerprint exists; otherwise the faculty-reviewed payload's summary */
  const recommendation = fp
    ? buildRecommendation(fp, {
        avgAcc: evidence.avgAccuracy, highTime: !!fp.highTime,
        persistent: fp.status === 'persistent', declining: fp.trend === 'declining',
        skipRate: fp.skipRate ?? 0,
      })
    : (payload.recommendation ?? { title: 'Targeted practice', actions: [], detail: `${issueType} in ${chapter}.` })

  const group = {
    id,
    name: `${domain === 'University' ? 'University' : examFamily} ${subject} — ${chapter}`,
    domain,
    examFamily,
    subject,
    chapter,
    issueType,
    severity: fp?.severity ?? (accuracy != null && accuracy < 55 ? 'High' : 'Medium'),
    priority: payload.priority ?? 'Medium',
    students: [{
      studentId: student.id, roll: student.roll, name: student.name, batchId: student.batchId,
      accuracy, severity: fp?.severity ?? null, avgTime,
      trend: fp?.trend ?? null, status: fp?.status ?? null,
      evidence: fp?.evidence ?? null, lastExam: fp?.lastExam ?? null,
    }],
    evidence,
    whyDetected,
    recommendation,
  }

  const count = Math.min(30, Math.max(1, Number(payload.practiceConfig?.count ?? 8) || 8))
  const record = {
    s360Group: group,
    interventionId: id,
    studentId: student.id,
    studentIds: [student.id],
    groupId: id,
    domain,
    examFamily,
    subject,
    chapter,
    issueType,
    evidence,
    source: 'Student 360',
    createdBy: payload.createdBy ?? 'Dr. Meera Krishnan',
    title: payload.title ?? `${chapter} Accuracy Recovery — ${student.name.split(' ')[0]}`,
    priority: payload.priority ?? 'Medium',
    objectives: payload.objective ? [payload.objective] : undefined,
    practiceConfig: {
      count,
      difficulty: payload.practiceConfig?.difficulty ?? 'Medium',
      duration: Math.max(5, Math.min(120, Number(payload.practiceConfig?.duration ?? Math.round(count * 2)) || 20)),
      questionType: payload.practiceConfig?.questionType ?? 'Any',
      includePyq: payload.practiceConfig?.pyqPreference !== 'No',
      pyqPreference: payload.practiceConfig?.pyqPreference ?? 'Yes',
      selectionLevel: payload.practiceConfig?.selectionLevel ?? 'subject',
    },
    pyqPreference: payload.practiceConfig?.pyqPreference ?? 'Yes',
    notes: payload.notes ?? '',
    status: 'Recommended', /* faculty already reviewed → enters the lifecycle here */
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  overrides[id] = record
  writeStatus(overrides)
  const intervention = interventionFor(group)
  return {
    ok: true,
    intervention,
    note: 'Recommendation recorded. Faculty approval is still required before planning/assignment — nothing is delivered automatically.',
  }
})

/* ------------------------------------------------------------------ */
/* Related resources (Phase 5, kept)                                   */
/* ------------------------------------------------------------------ */
defineRoute('get', '/faculty/interventions/related-resources', async ({ params }) => {
  const { subject, chapter, examFamily, difficulty } = params ?? {}
  const questions = []
  const pyqs = []
  if (examFamily === 'JEE' || examFamily === 'NEET') {
    const { competitiveQuestions } = await import('@/intelligence/faculty/datasets/competitive-questions.js')
    const familyLabel = examFamily === 'JEE' ? 'JEE Main' : 'NEET UG'
    competitiveQuestions
      .filter((q) => q.exam === familyLabel && q.subject === subject && (q.chapter ?? '').toLowerCase() === String(chapter ?? '').toLowerCase())
      .slice(0, 8)
      .forEach((q) => pyqs.push({ id: q.id, text: q.question, subject: q.subject, chapter: q.chapter, topic: q.topic, difficulty: q.difficulty, type: q.questionType, year: q.year, exam: q.exam }))
  } else {
    const { universityPyqQuestions } = await import('@/intelligence/faculty/datasets/competitive-questions.js')
    const { questionBank } = await import('@/datasets/faculty/workspace.js')
    const code = subject?.startsWith('Data Structures') ? 'CS501'
      : subject?.startsWith('Operating') ? 'CS503'
        : subject?.startsWith('Machine') ? 'CS505'
          : subject?.startsWith('Database') ? 'CS502'
            : subject?.startsWith('Computer Networks') ? 'CS504'
              : subject?.startsWith('Theory') ? 'CS506' : null
    ;(questionBank.questions ?? []).filter((q) => (code ? q.subject === code : true) && (q.chapter ?? '').toLowerCase() === String(chapter ?? '').toLowerCase()).slice(0, 8)
      .forEach((q) => questions.push({ id: q.id, text: q.text, subject: q.subject, chapter: q.chapter, topic: q.topic, difficulty: q.difficulty, type: q.type, status: q.status, pyqFrequency: q.pyqFrequency ?? 0 }))
    universityPyqQuestions
      .filter((q) => (code ? q.subjectCode === code : true) && ((q.chapter ?? '').toLowerCase() === String(chapter ?? '').toLowerCase() || (q.topic ?? '').toLowerCase().includes(String(chapter ?? '').toLowerCase())))
      .slice(0, 8)
      .forEach((q) => pyqs.push({ id: q.id, text: q.question, subject: q.subjectCode, chapter: q.chapter, topic: q.topic, difficulty: q.difficulty, type: q.questionType, year: q.year, exam: 'University' }))
  }
  return { questions, pyqs, count: questions.length + pyqs.length, subject, chapter, examFamily, difficulty }
})
