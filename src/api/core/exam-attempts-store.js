/**
 * Exam-attempt storage helpers (frontend API layer).
 *
 * Single reader for canonical exam attempts shared by the intelligence
 * endpoints AND the AI Exam Analysis endpoints:
 *   · localStorage (real attempts produced by the Exam Conducting Agent)
 *   · deterministic seed history (sample attempts, flagged `mock: true`
 *     in the canonical ExamAttempt contract — the field name is part of the
 *     preserved contract and means "sample/seed attempt") — merged
 *     so longitudinal DNA / Exam Analysis demos work on a fresh browser.
 * The Exam Agent's OWN endpoints (`/student/exam-agent/*`) intentionally
 * read localStorage only — seeds never appear in the student's history.
 */
import { examAttemptSeeds } from '@/datasets/exams/attempt-seeds.js'

export const ATTEMPTS_STORAGE_KEY = 'EduX_student_exam_attempts'

export function readStoredAttempts() {
  try {
    return JSON.parse(window.localStorage.getItem(ATTEMPTS_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function readAllAttempts(includeSeeds = true) {
  const stored = readStoredAttempts()
  return includeSeeds ? [...stored, ...examAttemptSeeds] : stored
}
