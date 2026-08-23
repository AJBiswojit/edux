/**
 * AI Exam Conducting Agent — mock API routes (student).
 *
 * Serves the 9 practice papers and persists completed attempts to
 * localStorage (per-browser, prototype persistence — exactly like the
 * faculty paper-share registry).
 */
import { mockRoute } from './mock-server'
import { EXAM_AGENT_EXAMS } from '@/mock-data/exam-agent'

const STORAGE_KEY = 'aurora_student_exam_attempts'

function readAttempts() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function writeAttempts(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* storage unavailable */
  }
}

mockRoute('get', '/student/exam-agent/exams', () => ({ items: EXAM_AGENT_EXAMS }))

mockRoute('get', '/student/exam-agent/attempts', () => {
  const items = readAttempts()
  return {
    items: items.map((a) => ({
      id: a.id,
      examId: a.examId,
      examTitle: a.examTitle,
      shortTitle: a.shortTitle,
      examType: a.examType,
      category: a.category,
      subject: a.subject,
      mode: a.mode,
      source: a.source ?? 'exam-agent',
      studentId: a.studentId ?? null,
      interventionId: a.interventionId ?? null,
      roll: a.roll ?? null,
      startedAt: a.startedAt ?? null,
      submittedAt: a.submittedAt ?? null,
      completedAt: a.completedAt,
      elapsedSeconds: a.elapsedSeconds,
      examMode: a.examMode ?? null,
      examFamily: a.examFamily ?? null,
      scoring: a.scoring ?? null,
      summary: a.summary,
    })),
  }
})

mockRoute('get', '/student/exam-agent/attempts/:id', ({ params }) => {
  const attempt = readAttempts().find((a) => a.id === params.id)
  if (!attempt) {
    const err = new Error('Attempt not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  return { attempt }
})

mockRoute('post', '/student/exam-agent/attempts', ({ body }) => {
  /* Phase 1 — canonical ExamAttempt storage. The record carries identity
     (studentId · roll), provenance (source), started/submitted timestamps,
     the denormalized exam + question snapshot, canonical questionAttempts,
     AND the legacy raw interactions + summary for backward compatibility
     (history list, report re-derivation, old consumers). */
  const submittedAt = body?.submittedAt ?? body?.completedAt ?? new Date().toISOString()
  const attempt = {
    id: body?.id ?? `ea-attempt-${Date.now()}`,
    studentId: body?.studentId ?? null,
    interventionId: body?.interventionId ?? null,
    roll: body?.roll ?? null,
    examId: body?.examId,
    examName: body?.examName ?? body?.examTitle ?? null,
    examTitle: body?.examTitle,
    shortTitle: body?.shortTitle,
    examMode: body?.examMode ?? null,
    examFamily: body?.examFamily ?? null,
    examType: body?.examType,
    category: body?.category,
    subject: body?.subject,
    mode: body?.mode ?? 'manual',
    source: body?.source ?? 'exam-agent',
    startedAt: body?.startedAt ?? null,
    submittedAt,
    completedAt: body?.completedAt ?? submittedAt,
    batchId: body?.batchId ?? null,
    sectionId: body?.sectionId ?? null,
    exam: body?.exam ?? null,
    timing: body?.timing ?? null,
    scoring: body?.scoring ?? null,
    questionAttempts: Array.isArray(body?.questionAttempts) ? body.questionAttempts : [],
    elapsedSeconds: body?.elapsedSeconds ?? body?.timing?.elapsedSeconds ?? 0,
    interactions: body?.interactions ?? {},
    summary: body?.summary ?? {},
  }
  const items = readAttempts()
  items.unshift(attempt)
  writeAttempts(items)
  return { ok: true, attempt }
})

export default EXAM_AGENT_EXAMS
