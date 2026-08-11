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
  facultyBatches, facultyStudents, getStudentAttempts,
} from '@/intelligence/faculty/datasets/students-directory'
import {
  computeStudentIssueFingerprints, groupSimilarIssues, computeInterventions,
  buildInterventionFromGroup, canTransition, selectPracticeQuestions,
  buildRetestEntity, computeEffectiveness,
} from '@/intelligence/faculty'
import { normalizeExamAttempt } from '@/intelligence'
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
  const raw = studentId === 'u_stu_001'
    ? readAllAttempts(true)
    : (getStudentAttempts(studentId) ?? [])
  return raw
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

/** Canonical intervention record for a group (with persisted overrides). */
function interventionFor(group) {
  const overrides = readStatus()
  return buildInterventionFromGroup(group, overrides[group.id] ?? null)
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
      subject: q.subjectName, chapter: q.chapter, topic: q.topic, difficulty: q.difficulty, questionType: q.questionType,
      isPyq: true, pyq: q.pyq, year: q.year, source: 'university-pyq',
    }))
  return { questions: pyqs, includePyqByDefault: true }
}

/* ------------------------------------------------------------------ */
/* Faculty: similarity (Phase 5, unchanged)                           */
/* ------------------------------------------------------------------ */
mockRoute('get', '/faculty/similar-issues', ({ params }) => {
  const scope = params?.scope ?? 'all'
  const { groups } = groupedPayload()
  const fps = fingerprintsForAll()
  const { individuals } = groupSimilarIssues(fps)
  const scopeGroups = scope === 'batch'
    ? groups
    : groups
  return {
    groups: scopeGroups,
    individuals: individuals.map((f) => ({
      studentId: f.studentId, roll: f.roll, name: f.name, batchId: f.batchId,
      domain: f.domain, examFamily: f.examFamily, subject: f.subject, chapter: f.chapter,
      issueType: f.issueType, severity: f.severity, accuracy: f.accuracy, avgTime: f.avgTime,
      trend: f.trend, evidence: f.evidence, lastExam: f.lastExam,
    })),
    count: groups.length,
    individualCount: individuals.length,
    scope,
    demoExcluded: true,
    note: 'AI Similarity Score — prototype grouping, not a validated measure.',
  }
})

mockRoute('get', '/faculty/similar-issues/:id', ({ params }) => {
  const { groups } = groupedPayload()
  const group = groups.find((g) => g.id === params.id)
  if (!group) {
    const err = new Error('Issue group not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  return { group }
})

/* ------------------------------------------------------------------ */
/* Faculty: intervention center + lifecycle                           */
/* ------------------------------------------------------------------ */
mockRoute('get', '/faculty/interventions', async () => {
  const { groups } = groupedPayload()
  const practice = readPractice()
  const retests = readRetests()
  const items = groups.map((g) => {
    const iv = interventionFor(g)
    const ivPractice = practice.filter((p) => p.interventionId === iv.id)
    const ivRetests = retests.filter((r) => r.interventionId === iv.id)
    const retestAttempts = practice.filter((p) => p.kind === 'retest' && p.interventionId === iv.id)
    const eff = computeEffectiveness({ baseline: iv.baseline, practiceAttempts: ivPractice.filter((p) => p.kind === 'practice'), retestAttempts })
    return {
      ...iv,
      practiceProgress: ivPractice.filter((p) => p.kind === 'practice').length,
      practiceRequired: iv.practiceConfig?.count ?? 8,
      practiceAccuracy: ivPractice.filter((p) => p.kind === 'practice').length ? Math.round(ivPractice.filter((p) => p.kind === 'practice').reduce((n, p) => n + p.accuracy, 0) / ivPractice.filter((p) => p.kind === 'practice').length) : null,
      retests: ivRetests.length,
      retestPending: ivRetests.length > 0 && !retestAttempts.length,
      effectiveness: eff,
    }
  })
  return {
    items,
    count: items.length,
    byStatus: items.reduce((acc, i) => { acc[i.status] = (acc[i.status] ?? 0) + 1; return acc }, {}),
  }
})

mockRoute('get', '/faculty/interventions/:id', async ({ params }) => {
  const { groups } = groupedPayload()
  const group = groups.find((g) => g.id === params.id)
  if (!group) {
    const err = new Error('Intervention not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const practice = readPractice()
  const retests = readRetests()
  const iv = interventionFor(group)
  const retestAttempts = practice.filter((p) => p.kind === 'retest' && p.interventionId === iv.id)
  return {
    intervention: {
      ...iv,
      effectiveness: computeEffectiveness({ baseline: iv.baseline, practiceAttempts: practice.filter((p) => p.kind === 'practice' && p.interventionId === iv.id), retestAttempts }),
      practiceAttempts: practice.filter((p) => p.interventionId === iv.id),
      retests,
    },
  }
})

/* Controlled status transitions (faculty) */
mockRoute('post', '/faculty/interventions/:groupId/status', ({ params, body }) => {
  const { groups } = groupedPayload()
  const group = groups.find((g) => g.id === params.groupId)
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
  const { groups } = groupedPayload()
  const group = groups.find((g) => g.id === params.id)
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
    includePyq: iv.practiceConfig?.includePyq ?? true, excludeIds: used, pool: pool.questions, level: 'subject',
  })
  return { ...res, interventionId: iv.id, practiceType: iv.practiceConfig?.type, durationMinutes: iv.practiceConfig?.duration ?? 20 }
})

/* Create re-test (Completed → Re-test Pending) */
mockRoute('post', '/faculty/interventions/:groupId/retest', async ({ params, body }) => {
  const { groups } = groupedPayload()
  const group = groups.find((g) => g.id === params.groupId)
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

/* Effectiveness */
mockRoute('get', '/faculty/interventions/:id/effectiveness', async ({ params }) => {
  const { groups } = groupedPayload()
  const group = groups.find((g) => g.id === params.id)
  if (!group) {
    const err = new Error('Intervention not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const iv = interventionFor(group)
  const practice = readPractice()
  return computeEffectiveness({
    baseline: iv.baseline,
    practiceAttempts: practice.filter((p) => p.kind === 'practice' && p.interventionId === iv.id),
    retestAttempts: practice.filter((p) => p.kind === 'retest' && p.interventionId === iv.id),
  })
})

/* Faculty: a student's intervention history (for the 360 profile) */
mockRoute('get', '/faculty/students/:id/interventions', async ({ params }) => {
  const { groups } = groupedPayload()
  const practice = readPractice()
  const items = groups
    .map((g) => interventionFor(g))
    .filter((iv) => (iv.studentIds ?? []).includes(params.id))
    .filter((iv) => ['Assigned', 'In Progress', 'Completed', 'Re-test Pending', 'Evaluating', 'Resolved', 'Improving', 'Persistent'].includes(iv.status))
    .map((iv) => {
      const myPractice = practice.filter((p) => p.interventionId === iv.id && p.studentId === params.id)
      return {
        id: iv.id,
        title: iv.title,
        domain: iv.domain,
        examFamily: iv.examFamily,
        subject: iv.subject,
        chapter: iv.chapter,
        issueType: iv.issueType,
        priority: iv.priority,
        status: iv.status,
        practiceDone: myPractice.filter((p) => p.kind === 'practice').length > 0,
        practiceAccuracy: myPractice.filter((p) => p.kind === 'practice').length ? Math.round(myPractice.filter((p) => p.kind === 'practice').reduce((n, p) => n + p.accuracy, 0) / myPractice.filter((p) => p.kind === 'practice').length) : null,
        outcome: null,
      }
    })
  return { items, count: items.length, studentId: params.id }
})

/* ------------------------------------------------------------------ */
/* Student: assigned interventions + practice + re-test               */
/* ------------------------------------------------------------------ */
mockRoute('get', '/student/interventions', async ({ params }) => {
  const studentId = params?.studentId ?? 'u_stu_001'
  const { groups } = groupedPayload()
  const practice = readPractice()
  const retests = readRetests()
  const items = groups
    .map((g) => interventionFor(g))
    .filter((iv) => (iv.studentIds ?? []).includes(studentId))
    .filter((iv) => ['Assigned', 'In Progress', 'Completed', 'Re-test Pending', 'Evaluating', 'Resolved', 'Improving', 'Persistent'].includes(iv.status))
    .map((iv) => {
      const myPractice = practice.filter((p) => p.interventionId === iv.id && p.studentId === studentId)
      const myRetest = retests.find((r) => r.interventionId === iv.id && (r.studentIds ?? []).includes(studentId))
      const retestAttempts = myPractice.filter((p) => p.kind === 'retest')
      return {
        ...iv,
        whyAssigned: `Your recent assessments show repeated difficulty with ${iv.chapter} (${iv.issueType.toLowerCase()}).`,
        practiceDone: myPractice.filter((p) => p.kind === 'practice').length > 0,
        practiceRequired: iv.practiceConfig?.count ?? 8,
        practiceAccuracy: myPractice.filter((p) => p.kind === 'practice').length ? Math.round(myPractice.filter((p) => p.kind === 'practice').reduce((n, p) => n + p.accuracy, 0) / myPractice.filter((p) => p.kind === 'practice').length) : null,
        retest: myRetest ?? null,
        retestDone: retestAttempts.length > 0,
        outcome: computeEffectiveness({ baseline: iv.baseline, practiceAttempts: myPractice.filter((p) => p.kind === 'practice'), retestAttempts }).outcome,
      }
    })
  return { items, count: items.length, studentId }
})

mockRoute('get', '/student/interventions/:id/practice', async ({ params }) => {
  const { groups } = groupedPayload()
  const group = groups.find((g) => g.id === params.id)
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
    includePyq: iv.practiceConfig?.includePyq ?? true, pool: pool.questions, level: 'subject',
  })
  return { ...res, interventionId: iv.id, practiceType: iv.practiceConfig?.type, durationMinutes: iv.practiceConfig?.duration ?? 20, whyAssigned: `Your recent assessments show repeated difficulty with ${iv.chapter}.` }
})

mockRoute('post', '/student/interventions/:id/practice-attempts', async ({ params, body }) => {
  const { groups } = groupedPayload()
  const group = groups.find((g) => g.id === params.id)
  if (!group) {
    const err = new Error('Intervention not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const iv = interventionFor(group)
  const attempt = {
    id: `ip-${Date.now()}`,
    interventionId: iv.id,
    studentId: body?.studentId ?? 'u_stu_001',
    kind: body?.kind ?? 'practice', /* practice | retest */
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
  return { retest }
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
