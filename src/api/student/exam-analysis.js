/**
 * Student API — AI Exam Analysis.
 *
 * Options and per-attempt analysis are DERIVED from canonical ExamAttempt
 * records (Phase 1 contract) merged with the deterministic analysis
 * variants. Seed attempts stay honestly labelled "Sample"; demo attempts are
 * excluded. Endpoint contracts unchanged.
 */
import { defineRoute } from '../core/router'
import { examAnalysis, examAnalysisOptions, examAnalysisVariants, universityExamOptions } from '@/datasets/exams/exam-analysis.js'
import { EXAM_AGENT_EXAMS } from '@/datasets/exams/exam-agent.js'
import { normalizeExamAttempt, filterExamAttempts, buildAttemptAnalysisVariant } from '@/intelligence'
import { readAllAttempts } from '../core/exam-attempts-store'

/* ---------------- AI Exam Analysis (student) ---------------- */
/* Phase 3 — retired the unused base GET /student/exam-analysis read (the
   static dataset remains the fallback inside the :id handler below). */

/* Phase 2 — canonical exam attempts join the AI Exam Analysis option set
   (marked "Sample" when from the deterministic seed history). Demo
   attempts are excluded. The page itself is untouched: selecting an
   attempt and generating routes to /student/exam-analysis/:attemptId. */
defineRoute('get', '/student/exam-analysis/options', () => {
  const normalized = readAllAttempts(true)
    .map((a) => normalizeExamAttempt(a, EXAM_AGENT_EXAMS))
    .filter(Boolean)
  const manual = filterExamAttempts(normalized, { includeDemo: false })
  const attemptOptions = manual.map((a) => {
    const subjects = [...new Set((a.questionAttempts ?? []).map((q) => q.academicContext?.subject).filter(Boolean))]
    const family = a.examFamily
    const pattern = a.examMode === 'University' ? 'University' : family === 'NEET' ? 'NEET UG' : 'JEE Main'
    return {
      id: a.id,
      category: a.examMode,
      name: `${a.examName ?? 'Practice attempt'} (practice attempt)`,
      shortName: `${a.mock ? 'Sample' : 'Practice'} · ${a.shortTitle ?? a.examName ?? 'attempt'}`,
      date: (a.submittedAt ?? a.completedAt ?? '').slice(0, 10),
      pattern,
      subjects: ['All Subjects', ...subjects],
      attempt: true,
      attemptId: a.id,
      mock: !!a.mock,
    }
  })
  return { items: [...examAnalysisOptions, ...universityExamOptions, ...attemptOptions] }
})

/* Phase 2 — attempt-aware analysis: if the id matches a canonical attempt,
   the analysis is DERIVED from the attempt's own embedded question
   metadata (never re-fetched from the exam dataset). Previous attempts of
   the same domain feed the comparison/trajectory sections. Falls back to
   the existing static variants otherwise. */
defineRoute('get', '/student/exam-analysis/:id', ({ params }) => {
  const id = params.id
  const normalized = readAllAttempts(true)
    .map((a) => normalizeExamAttempt(a, EXAM_AGENT_EXAMS))
    .filter(Boolean)
  const manual = filterExamAttempts(normalized, { includeDemo: false })
  const attempt = manual.find((a) => a.id === id)
  if (attempt) {
    const family = attempt.examFamily
    const previous = manual
      .filter((a) => a.id !== id && (family ? a.examFamily === family : a.examMode === 'University'))
      .sort((a, b) => String(a.submittedAt ?? '').localeCompare(String(b.submittedAt ?? '')))
    return buildAttemptAnalysisVariant(attempt, previous)
  }
  return examAnalysisVariants[id] ?? examAnalysis
})
