/**
 * Exam-attempt storage helpers (mock API layer).
 *
 * Single reader for canonical exam attempts shared by the intelligence
 * endpoints AND the AI Exam Analysis endpoints:
 *   · localStorage (real attempts produced by the Exam Conducting Agent)
 *   · deterministic seed history (sample attempts, `mock: true`) — merged
 *     so longitudinal DNA / Exam Analysis demos work on a fresh browser.
 * The Exam Agent's OWN endpoints (`/student/exam-agent/*`) intentionally
 * read localStorage only — seeds never appear in the student's history.
 */
import { examAttemptSeeds } from '@/mock-data/exam-attempt-seeds'

export const ATTEMPTS_STORAGE_KEY = 'aurora_student_exam_attempts'

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
