/**
 * Faculty — My Students / Batch foundation mock API (Phase 3).
 *
 * Serves the canonical student directory: batches, students and each
 * student's exam history derived from the canonical ExamAttempt contract
 * (Phase 1) via the faculty students-directory engine. Demo attempts are
 * excluded from every endpoint (mode !== 'demo').
 *
 * Student → Batch → Faculty → ExamAttempt flow:
 *   facultyBatches / facultyStudents (one source of truth)
 *     → getStudentAttempts(studentId) (deterministic history; Aarav uses
 *       his REAL canonical attempts from the shared intelligence store)
 *     → students-directory engine (statuses, aggregates, DNA evidence)
 *     → UI (My Students · Batches · Student Profile)
 */
import { mockRoute } from './mock-server'
import {
  facultyBatches, facultyStudents, getStudentAttempts, attentionSignalsByRoll,
} from '@/intelligence/faculty/datasets/students-directory'
import {
  computeMyStudentsDirectory, computeBatchDetail, computeStudentProfileBundle,
  computeStudentExamHistory, computeAttemptAnalysis, computeStudent360,
} from '@/intelligence/faculty'
import { normalizeExamAttempt } from '@/intelligence'
import { EXAM_AGENT_EXAMS } from '@/mock-data/exam-agent'
import { readAllAttempts } from './exam-attempts-store'

/** Canonical attempts for one student (manual only). Aarav → shared
    intelligence store (real attempts + Phase 2 seeds); others →
    deterministic faculty dataset history. */
function canonicalAttemptsFor(studentId) {
  const raw = studentId === 'u_stu_001'
    ? readAllAttempts(true)
    : (getStudentAttempts(studentId) ?? [])
  return raw
    .map((a) => normalizeExamAttempt(a, EXAM_AGENT_EXAMS))
    .filter((a) => a && a.studentId === studentId && a.mode !== 'demo')
}

/* attention flags from the existing at-risk model (roll-keyed) */
function attentionMap() {
  const byRoll = attentionSignalsByRoll()
  const map = new Map()
  facultyStudents.forEach((s) => {
    const flag = byRoll.get(s.roll)
    if (flag) map.set(s.id, { weakFlag: flag.status !== 'Cleared', reason: flag.reason })
  })
  return map
}

function directoryPayload() {
  const att = attentionMap()
  return computeMyStudentsDirectory({
    batches: facultyBatches,
    students: facultyStudents.map((s) => ({
      ...s,
      _weakFlag: att.get(s.id)?.weakFlag ?? false,
      _attentionReason: att.get(s.id)?.reason ?? null,
    })),
    attemptsFor: (id) => canonicalAttemptsFor(id),
  })
}

mockRoute('get', '/faculty/students', () => directoryPayload())

mockRoute('get', '/faculty/batches', () => ({ batches: directoryPayload().batches }))

mockRoute('get', '/faculty/batches/:id', ({ params }) => {
  const dir = directoryPayload()
  const batch = computeBatchDetail(params.id, dir)
  if (!batch) {
    const err = new Error('Batch not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  return { batch }
})

/* Phase 4 — weak-topic → existing Question Bank connection: given a
   subject + chapter, return the bank questions matching (same chapter,
   subject-code prefix for university courses). The UI opens the existing
   Question Intelligence page; this endpoint only supplies the related
   questions so the profile can show them inline without duplicating the
   bank dataset. */
mockRoute('get', '/faculty/students/weak-topic-questions', async ({ params }) => {
  const { subject, chapter } = params ?? {}
  if (!subject || !chapter) return { items: [] }
  /* university question bank lives in mock-data/faculty.js (questionBank) —
     deferred import keeps route registration side-effect free */
  const { questionBank } = await import('@/mock-data/faculty.js')
  const code = subject.startsWith('Data Structures') ? 'CS501'
    : subject.startsWith('Operating') ? 'CS503'
      : subject.startsWith('Machine') ? 'CS505'
        : subject.startsWith('Database') ? 'CS502'
          : subject.startsWith('Computer Networks') ? 'CS504'
            : subject.startsWith('Theory') ? 'CS506' : null
  const items = (questionBank.questions ?? [])
    .filter((q) => {
      if (code && q.subject !== code) return false
      if (code == null && !(q.subject ?? '').toLowerCase().includes(subject.toLowerCase())) return false
      return (q.chapter ?? '').toLowerCase() === String(chapter).toLowerCase() || (q.topic ?? '').toLowerCase().includes(String(chapter).toLowerCase())
    })
    .slice(0, 6)
    .map((q) => ({ id: q.id, text: q.text, subject: q.subject, chapter: q.chapter, topic: q.topic, difficulty: q.difficulty, type: q.type, status: q.status }))
  return { items, count: items.length, subject, chapter }
})


/* Phase 4 — 360° individual student intelligence: executive overview,
   AI summary, strengths/weaknesses (Phase 2 evidence), subject/chapter/
   question/time/behaviour/error intelligence, longitudinal trends, exam
   comparison, persistent/resolved issues. All derived from canonical
   attempts (demo excluded) via the Phase 2 adapter — no second engine. */

mockRoute('get', '/faculty/students/:id', ({ params }) => {
  const student = facultyStudents.find((s) => s.id === params.id)
  if (!student) {
    const err = new Error('Student not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const att = attentionMap().get(student.id)
  return computeStudentProfileBundle({
    student,
    batches: facultyBatches,
    attempts: canonicalAttemptsFor(student.id),
    weakFlag: att?.weakFlag ?? false,
    attentionReason: att?.reason ?? null,
  })
})

mockRoute('get', '/faculty/students/:id/360', ({ params }) => {
  const student = facultyStudents.find((s) => s.id === params.id)
  if (!student) {
    const err = new Error('Student not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  return computeStudent360({
    student,
    batches: facultyBatches,
    attempts: canonicalAttemptsFor(student.id),
  })
})

mockRoute('get', '/faculty/students/:id/exams', ({ params }) => {
  const student = facultyStudents.find((s) => s.id === params.id)
  if (!student) {
    const err = new Error('Student not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const items = computeStudentExamHistory(canonicalAttemptsFor(student.id), params ?? {})
  return { items, count: items.length, studentId: student.id }
})

/* Per-attempt analysis in the EXISTING AI Exam Analysis shape — reuses the
   Phase 2 buildAttemptAnalysisVariant; previous attempts of the same domain
   feed the comparison/trajectory sections. */
mockRoute('get', '/faculty/students/:id/exams/:attemptId/analysis', ({ params }) => {
  const student = facultyStudents.find((s) => s.id === params.id)
  if (!student) {
    const err = new Error('Student not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const all = canonicalAttemptsFor(student.id)
  const attempt = all.find((a) => a.id === params.attemptId)
  if (!attempt) {
    const err = new Error('Attempt not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const family = attempt.examFamily
  const previous = all
    .filter((a) => a.id !== attempt.id && (family ? a.examFamily === family : (a.examMode ?? a.category) === 'University'))
    .sort((a, b) => String(a.submittedAt ?? '').localeCompare(String(b.submittedAt ?? '')))
  return computeAttemptAnalysis(attempt, previous)
})
