/**
 * Faculty — Similar-Issue + Intervention lifecycle mock API (Phase 5/6).
 *
 * Phase 5: similarity grouping + recommendations.
 * Phase 6: actionable lifecycle — approval → modify → student selection →
 *   prototype assignment → targeted practice (student) → re-test (linked) →
 *   before/after effectiveness (deterministic, prototype-labelled).
 *
 * Persistence (frontend prototype only):
 *   aurora_faculty_interventions        → groupId → intervention record
 *   aurora_intervention_practice_attempts → practice/re-test attempts
 *   aurora_intervention_retests         → re-test entities
 * Practice attempts are SEPARATE from official exams (mode
 * 'intervention-practice' | 'intervention-retest') — they never
 * contaminate university/JEE/NEET performance.
 */
import { mockRoute } from './mock-server'
import {
  facultyStudents, getStudentAttempts,
} from '@/intelligence/faculty/datasets/students-directory'
import {
  computeStudentIssueFingerprints, computeStudentQuestionIntelligence,
  groupSimilarIssues, buildIndividualIssue, buildIndividualWhyDetected, buildRecommendation,
  buildInterventionFromGroup, canTransition, selectPracticeQuestions,
  buildRetestEntity, sameInterventionTarget, matchInterventionExamAttempts,
  computeEffectiveness, computeGroupEffectiveness,
} from '@/intelligence/faculty'
import { normalizeExamAttempt, classifyAttemptContext } from '@/intelligence'
import { EXAM_AGENT_EXAMS } from '@/mock-data/exam-agent'
import { readAllAttempts } from './exam-attempts-store'

const STATUS_KEY = 'aurora_faculty_interventions'
const PRACTICE_KEY = 'aurora_intervention_practice_attempts'
const RETEST_KEY = 'aurora_intervention_retests'

function readJSON(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || 'null') ?? fallback
  } catch {
    return fallback
  }
}
function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch { /* storage unavailable */ }
}

const readStatus = () => readJSON(STATUS_KEY, {})
const writeStatus = (v) => writeJSON(STATUS_KEY, v)
const readPractice = () => readJSON(PRACTICE_KEY, [])
const writePractice = (v) => writeJSON(PRACTICE_KEY, v)
const readRetests = () => readJSON(RETEST_KEY, [])
const writeRetests = (v) => writeJSON(RETEST_KEY, v)

function canonicalAttemptsFor(studentId) {
  /* Canonical Exam Agent storage can contain attempts for any student. Merge
     those records with the existing deterministic history; IDs de-duplicate
     so a stored attempt can never be counted twice. */
  const stored = readAllAttempts(false).filter((a) => a?.studentId === studentId)
  const history = studentId === 'u_stu_001'
    ? readAllAttempts(true).filter((a) => a?.studentId === studentId)
    : (getStudentAttempts(studentId) ?? [])
  const byId = new Map([...history, ...stored].map((a) => [a.id, a]))
  return [...byId.values()]
    .map((a) => normalizeExamAttempt(a, EXAM_AGENT_EXAMS))
    .filter((a) => a && a.studentId === studentId && a.mode !== 'demo')
}

const fingerprintCache = new Map()
function fingerprintsForAll() {
  return facultyStudents.map((s) => {
    if (!fingerprintCache.has(s.id)) {
      fingerprintCache.set(s.id, computeStudentIssueFingerprints(s, canonicalAttemptsFor(s.id)))
    }
    return fingerprintCache.get(s.id)
  }).flat()
}

function groupedPayload() {
  const { groups } = groupSimilarIssues(fingerprintsForAll())
  return { groups }
}

/* ------------------------------------------------------------------ */
/* Phase 5 hardening — Student 360-sourced individual interventions    */
/* ------------------------------------------------------------------ */

const slug = (v) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/**
 * Student-360-created interventions are stored in the SAME
 * aurora_faculty_interventions record map. Their override entry carries the
 * full synthetic single-student group (`s360Group`) so they flow through the
 * EXISTING lifecycle routes (detail/status/assign/practice/retest/student)
 * unchanged — one intervention system, one status machine.
 */
function storedInterventionRecords() {
  const overrides = readStatus()
  return Object.entries(overrides)
    .filter(([, v]) => v && (v.interventionGroup || v.s360Group))
    .map(([id, v]) => ({ id, group: v.interventionGroup ?? v.s360Group, record: v }))
}

/** Grouped recommendations + every persisted per-student record (one store,
 * one lifecycle). `s360Group` remains readable for Phase 5 compatibility. */
function allInterventionGroups() {
  return [...groupedPayload().groups, ...storedInterventionRecords().map((r) => r.group)]
}

function findGroupById(id) {
  return allInterventionGroups().find((g) => g.id === id) ?? null
}

/** Canonical intervention record for a group (with persisted overrides). */
function interventionFor(group) {
  const overrides = readStatus()
  const o = overrides[group.id] ?? null
  return buildInterventionFromGroup(group, o)
}

function persistedInterventions() {
  const overrides = readStatus()
  const stored = storedInterventionRecords().map(({ group }) => interventionFor(group))
  const storedIds = new Set(stored.map((iv) => iv.id))
  const reviewedGroups = groupedPayload().groups
    .filter((group) => !storedIds.has(group.id) && overrides[group.id]?.status)
    .map((group) => interventionFor(group))
  return [...stored, ...reviewedGroups].filter((iv) => iv.status && iv.status !== 'Dismissed')
}

function activeInterventionForStudent(studentId, target, candidates = null) {
  for (const iv of candidates ?? persistedInterventions()) {
    if ((iv.studentIds ?? []).includes(studentId) && sameInterventionTarget(iv, target)) return iv
  }
  return null
}

function evidenceRowsForGroup(group) {
  return (group.students ?? []).flatMap((member) => {
    const rows = computeStudentQuestionIntelligence({ attempts: canonicalAttemptsFor(member.studentId) }).rows ?? []
    return rows
      .filter((row) => row.subject === group.subject && row.chapter === group.chapter)
      .filter((row) => group.domain === 'University'
        ? row.domain === 'university'
        : row.domain === 'competitive' && row.examFamily === group.examFamily)
      .map((row) => ({ ...row, studentId: member.studentId, studentName: member.name, roll: member.roll }))
  })
}

function postExamOutcomeFor(iv, practice, retests) {
  const practiceRows = practice.filter((p) => p.interventionId === iv.id && p.studentId === iv.studentId)
  const retestRows = practiceRows.filter((p) => p.kind === 'retest')
  const latestRetest = [...retestRows].sort((a, b) => String(b.submittedAt ?? '').localeCompare(String(a.submittedAt ?? '')))[0]
  const matches = matchInterventionExamAttempts({
    intervention: iv,
    attempts: canonicalAttemptsFor(iv.studentId ?? iv.studentIds?.[0]),
    after: latestRetest?.submittedAt ?? iv.retestCreatedAt ?? iv.createdAt,
  })
  /* The first strict subsequent attempt is the deterministic comparison
     endpoint. Later attempts remain visible in Exam Analysis, but are not
     averaged into this intervention outcome. */
  const postMatch = matches[0] ?? null
  const effectiveness = {
    ...computeEffectiveness({
      baseline: iv.baseline,
      practiceAttempts: practiceRows.filter((p) => p.kind === 'practice'),
      retestAttempts: retestRows,
      postExamAttempts: postMatch ? [postMatch.metrics] : [],
    }),
    interventionId: iv.id,
    studentId: iv.studentId,
  }
  return {
    effectiveness,
    postExam: postMatch ? { ...postMatch.metrics, matchType: postMatch.matchType, studentId: iv.studentId, interventionId: iv.id } : null,
    retestEntity: retests.find((r) => r.interventionId === iv.id && (r.studentIds ?? []).includes(iv.studentId)) ?? null,
  }
}

/* ------------------------------------------------------------------ */
/* Question pools (existing datasets — never a second bank)           */
/* ------------------------------------------------------------------ */
async function questionPoolFor(intervention) {
  if (intervention.domain === 'Competitive') {
    const { competitiveQuestions } = await import('@/intelligence/faculty/datasets/competitive-questions.js')
    const label = intervention.examFamily === 'JEE' ? 'JEE Main' : 'NEET UG'
    return {
      questions: competitiveQuestions
        .filter((q) => q.exam === label && q.subject === intervention.subject)
        .map((q) => ({
          id: q.id, question: q.question, options: q.options, answer: q.answer,
          domain: 'Competitive', examFamily: intervention.examFamily,
          subject: q.subject, chapter: q.chapter, topic: q.topic, difficulty: q.difficulty, questionType: q.questionType,
          isPyq: true, pyq: q.pyq, year: q.year, source: 'competitive-foundation',
        })),
      includePyqByDefault: true,
    }
  }
  const { universityPyqQuestions } = await import('@/intelligence/faculty/datasets/competitive-questions.js')
  const code = intervention.subject?.startsWith('Data Structures') ? 'CS501'
    : intervention.subject?.startsWith('Operating') ? 'CS503'
      : intervention.subject?.startsWith('Machine') ? 'CS505'
        : intervention.subject?.startsWith('Database') ? 'CS502'
          : intervention.subject?.startsWith('Computer Networks') ? 'CS504'
            : intervention.subject?.startsWith('Theory') ? 'CS506' : null
  /* University practice uses the option-bearing PYQ records (the bank's
     subjective questions have no MCQ options) — honest and reusable. */
  const pyqs = universityPyqQuestions
    .filter((q) => (code ? q.subjectCode === code : (q.subjectName ?? '').toLowerCase().includes(String(intervention.subject ?? '').toLowerCase())))
    .map((q) => ({
      id: q.id, question: q.question, options: q.options, answer: q.answer,
      domain: 'University', examFamily: null,
      subject: q.subjectName, chapter: q.chapter, topic: q.topic, difficulty: q.difficulty, questionType: q.questionType,
      isPyq: true, pyq: q.pyq, year: q.year, source: 'university-pyq',
    }))
  return { questions: pyqs, includePyqByDefault: true }
}

function groupOutcome(group) {
  const practice = readPractice()
  const retests = readRetests()
  const records = storedInterventionRecords()
    .filter(({ record }) => record.source === 'Similar Issues' && record.groupId === group.id)
    .map(({ group: storedGroup }) => {
      const iv = interventionFor(storedGroup)
      const outcome = postExamOutcomeFor(iv, practice, retests)
      return { ...iv, effectiveness: outcome.effectiveness, postExam: outcome.postExam }
    })
  return computeGroupEffectiveness(records)
}

function presentGroup(group, activeCandidates = null) {
  const candidates = activeCandidates ?? persistedInterventions()
  const students = (group.students ?? []).map((member) => {
    const existing = activeInterventionForStudent(member.studentId, group, candidates)
    return {
      ...member,
      priority: member.severity === 'Critical' || member.severity === 'High' ? 'High' : group.priority,
      evidenceCount: member.evidence?.questions ?? 0,
      existingIntervention: existing ? { id: existing.id, status: existing.status, source: existing.source } : null,
    }
  })
  return { ...group, students, interventionOutcome: groupOutcome(group) }
}

/* ------------------------------------------------------------------ */
/* Faculty: similarity (Phase 5 + multi-student outcome extension)     */
/* ------------------------------------------------------------------ */
mockRoute('get', '/faculty/similar-issues', ({ params }) => {
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
mockRoute('get', '/faculty/similar-issues/:groupId/evidence', ({ params }) => {
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

mockRoute('get', '/faculty/similar-issues/:groupId/intervention-preflight', async ({ params }) => {
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
mockRoute('post', '/faculty/similar-issues/:groupId/interventions', async ({ params, body }) => {
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
mockRoute('get', '/faculty/interventions', async () => {
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

mockRoute('get', '/faculty/interventions/:id', async ({ params }) => {
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
mockRoute('post', '/faculty/interventions/:groupId/status', ({ params, body }) => {
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
mockRoute('post', '/faculty/interventions/:groupId/modify', ({ params, body }) => {
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
mockRoute('post', '/faculty/interventions/:groupId/assign', ({ params }) => {
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
mockRoute('get', '/faculty/interventions/:id/practice', async ({ params }) => {
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
mockRoute('post', '/faculty/interventions/:groupId/retest', async ({ params, body }) => {
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
mockRoute('get', '/faculty/students/:id/interventions', async ({ params }) => {
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
 *     aurora_faculty_interventions map;
 *   · it enters the lifecycle at 'Recommended' (faculty already reviewed);
 *     every later transition goes through the validated /status route.
 * Nothing is assigned automatically.
 */
mockRoute('post', '/faculty/students/:studentId/interventions', ({ params, body }) => {
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
/* Student: assigned interventions + practice + re-test               */
/* ------------------------------------------------------------------ */
mockRoute('get', '/student/interventions', async ({ params }) => {
  const studentId = params?.studentId ?? 'u_stu_001'
  const groups = allInterventionGroups()
  const practice = readPractice()
  const retests = readRetests()
  const items = groups
    .map((g) => interventionFor(g))
    .filter((iv) => (iv.studentIds ?? []).includes(studentId))
    .filter((iv) => ['Assigned', 'In Progress', 'Completed', 'Re-test Pending', 'Evaluating', 'Resolved', 'Improving', 'Persistent'].includes(iv.status))
    .map((iv) => {
      const myPractice = practice.filter((p) => p.interventionId === iv.id && p.studentId === studentId)
      const practiceAttempts = myPractice.filter((p) => p.kind === 'practice')
      const retestAttempts = myPractice.filter((p) => p.kind === 'retest')
      const rawRetest = retests.find((r) => r.interventionId === iv.id && (r.studentIds ?? []).includes(studentId))
      const member = (iv.students ?? []).find((s) => s.studentId === studentId)
      const individualIv = iv.studentId ? iv : {
        ...iv,
        studentId,
        baseline: {
          ...iv.baseline,
          accuracy: member?.accuracy ?? iv.baseline?.accuracy,
          avgTime: member?.avgTime ?? iv.baseline?.avgTime,
          incorrect: member?.evidence?.incorrect ?? iv.baseline?.incorrect,
          skipped: member?.evidence?.skipped ?? iv.baseline?.skipped,
          questions: member?.evidence?.questions ?? iv.baseline?.questions,
        },
      }
      const outcome = postExamOutcomeFor(individualIv, practice, retests)
      const retest = rawRetest ? {
        id: rawRetest.id, interventionId: rawRetest.interventionId, title: rawRetest.title,
        domain: rawRetest.domain, examFamily: rawRetest.examFamily, subject: rawRetest.subject,
        chapter: rawRetest.chapter, difficulty: rawRetest.difficulty,
        questionCount: rawRetest.questionCount, timeLimit: rawRetest.timeLimit,
        status: rawRetest.status, createdAt: rawRetest.createdAt,
      } : null
      /* Deliberately explicit allow-list: no group id/name, other students,
         group averages, faculty notes, or faculty-only reasoning. */
      return {
        id: iv.id,
        interventionId: iv.id,
        studentId,
        title: iv.title,
        domain: iv.domain,
        examFamily: iv.examFamily,
        subject: iv.subject,
        chapter: iv.chapter,
        issueType: iv.issueType,
        priority: iv.priority,
        status: iv.status,
        objective: iv.objectives?.[0] ?? null,
        objectives: iv.objectives ?? [],
        practiceConfig: iv.practiceConfig,
        createdAt: iv.createdAt,
        whyAssigned: `Your recent assessments show repeated difficulty with ${iv.chapter} (${iv.issueType.toLowerCase()}).`,
        practiceDone: practiceAttempts.length > 0,
        practiceRequired: iv.practiceConfig?.count ?? 8,
        practiceAccuracy: practiceAttempts.length ? Math.round(practiceAttempts.reduce((n, p) => n + p.accuracy, 0) / practiceAttempts.length) : null,
        retest,
        retestDone: retestAttempts.length > 0,
        outcome: outcome.effectiveness.outcome,
        effectiveness: outcome.effectiveness,
        postExam: outcome.postExam,
      }
    })
  return { items, count: items.length, studentId }
})

mockRoute('get', '/student/interventions/:id/practice', async ({ params }) => {
  const group = findGroupById(params.id)
  if (!group) {
    const err = new Error('Intervention not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const iv = interventionFor(group)
  const pool = await questionPoolFor(iv)
  const res = selectPracticeQuestions({
    domain: iv.domain, examFamily: iv.examFamily, subject: iv.subject, chapter: iv.chapter,
    difficulty: iv.practiceConfig?.difficulty ?? 'Medium', count: iv.practiceConfig?.count ?? 8,
    questionType: iv.practiceConfig?.questionType ?? 'Any',
    includePyq: iv.practiceConfig?.includePyq ?? true, pyqPreference: iv.practiceConfig?.pyqPreference,
    pool: pool.questions, level: iv.practiceConfig?.selectionLevel ?? 'subject',
  })
  return { ...res, interventionId: iv.id, practiceType: iv.practiceConfig?.type, durationMinutes: iv.practiceConfig?.duration ?? 20, whyAssigned: `Your recent assessments show repeated difficulty with ${iv.chapter}.` }
})

mockRoute('post', '/student/interventions/:id/practice-attempts', async ({ params, body }) => {
  const group = findGroupById(params.id)
  if (!group) {
    const err = new Error('Intervention not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const iv = interventionFor(group)
  const studentId = body?.studentId ?? 'u_stu_001'
  if (!(iv.studentIds ?? []).includes(studentId)) {
    const err = new Error('This intervention does not belong to the selected student.')
    err.response = { status: 403, data: { message: err.message } }
    throw err
  }
  const kind = body?.kind ?? 'practice'
  if (kind === 'retest' && !readRetests().some((r) => r.interventionId === iv.id && (r.studentIds ?? []).includes(studentId))) {
    const err = new Error('No linked re-test exists for this intervention and student.')
    err.response = { status: 400, data: { message: err.message } }
    throw err
  }
  const attempt = {
    id: `ip-${Date.now()}`,
    interventionId: iv.id,
    studentId,
    kind, /* practice | retest */
    domain: iv.domain,
    examFamily: iv.examFamily,
    subject: iv.subject,
    chapter: iv.chapter,
    topic: null,
    questionAttempts: Array.isArray(body?.questionAttempts) ? body.questionAttempts : [],
    score: body?.score ?? 0,
    maxScore: body?.maxScore ?? 0,
    accuracy: body?.accuracy ?? 0,
    attemptRate: body?.attemptRate ?? 0,
    avgTime: body?.avgTime ?? 0,
    incorrect: body?.incorrect ?? 0,
    skipped: body?.skipped ?? 0,
    attempted: body?.attempted ?? body?.questionAttempts?.filter?.((q) => q.selectedAnswer != null)?.length ?? null,
    questions: body?.questionAttempts?.length ?? 0,
    startedAt: body?.startedAt ?? null,
    submittedAt: new Date().toISOString(),
    mode: body?.kind === 'retest' ? 'intervention-retest' : 'intervention-practice',
  }
  const attempts = readPractice()
  attempts.push(attempt)
  writePractice(attempts)

  const overrides = readStatus()
  const current = overrides[iv.id] ?? {}
  if (attempt.kind === 'practice') {
    if (current.status === 'Assigned') { current.status = 'In Progress' }
    if (current.status === 'In Progress') { current.status = 'Completed'; current.completedAt = new Date().toISOString() }
  } else {
    /* re-test attempt → evaluate */
    if (current.status === 'Re-test Pending' || current.status === 'Evaluating') {
      const retestAttempts = attempts.filter((p) => p.kind === 'retest' && p.interventionId === iv.id)
      const eff = computeEffectiveness({ baseline: iv.baseline, practiceAttempts: attempts.filter((p) => p.kind === 'practice' && p.interventionId === iv.id), retestAttempts })
      current.status = 'Evaluating'
      if (eff.completed && eff.outcome !== 'Pending' && ['Resolved', 'Improving', 'Persistent'].includes(eff.outcome)) {
        current.status = eff.outcome
        current.evaluatedAt = new Date().toISOString()
        current.effectiveness = eff
      }
    }
  }
  current.updatedAt = new Date().toISOString()
  overrides[iv.id] = current
  writeStatus(overrides)
  return { ok: true, attempt, status: current.status }
})

mockRoute('get', '/student/interventions/:id/retest', async ({ params }) => {
  const retests = readRetests()
  const retest = retests.find((r) => r.interventionId === params.id)
  if (!retest) {
    const err = new Error('No re-test assigned for this intervention.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const { studentIds: _privateStudentIds, ...studentSafeRetest } = retest
  return { retest: studentSafeRetest }
})

/* ------------------------------------------------------------------ */
/* Related resources (Phase 5, kept)                                   */
/* ------------------------------------------------------------------ */
mockRoute('get', '/faculty/interventions/related-resources', async ({ params }) => {
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
    const { questionBank } = await import('@/mock-data/faculty.js')
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
