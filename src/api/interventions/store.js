/**
 * Intervention prototype persistence (localStorage).
 *
 * Storage keys (UNCHANGED — Phase 7 is an architectural relocation):
 *   aurora_faculty_interventions          → groupId → intervention record
 *   aurora_intervention_practice_attempts → practice / re-test attempts
 *   aurora_intervention_retests           → re-test entities
 *
 * CURRENT: per-browser prototype persistence (one store, one lifecycle).
 * FUTURE : backend-owned intervention persistence — this module is the single
 *          seam that has to change.
 */

export const STATUS_KEY = 'aurora_faculty_interventions'
export const PRACTICE_KEY = 'aurora_intervention_practice_attempts'
export const RETEST_KEY = 'aurora_intervention_retests'

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

export const readStatus = () => readJSON(STATUS_KEY, {})
export const writeStatus = (v) => writeJSON(STATUS_KEY, v)
export const readPractice = () => readJSON(PRACTICE_KEY, [])
export const writePractice = (v) => writeJSON(PRACTICE_KEY, v)
export const readRetests = () => readJSON(RETEST_KEY, [])
export const writeRetests = (v) => writeJSON(RETEST_KEY, v)
