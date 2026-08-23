/**
 * AI Exam Conducting Agent — deterministic seed attempt history (Phase 2).
 *
 * Sample canonical attempts used ONLY to demonstrate longitudinal
 * intelligence (AI Exam Analysis history + AI Academic DNA trends) on a
 * fresh browser. Clearly marked `mock: true`; they are normal "manual"
 * attempts from the intelligence layer's perspective (mode: 'manual'),
 * so they contribute to the demo evidence pools, but they are stored in
 * this dataset — NOT in the student's localStorage — so the Exam Agent's
 * own "Recent attempts" history never shows them.
 *
 * Behaviour is realistic and VARIED on purpose (per phase brief §18):
 *   · improvement (Kinematics 0% → 100%)
 *   · decline (Thermodynamics 100% → 0%)
 *   · stable strong areas (Mole Concept 100% ×3)
 *   · persistent weaknesses (GOC 0% ×3)
 *   · resolved weakness (Rotational Motion 0% → 0% → 100%)
 *
 * Records are authored in the legacy attempt shape (examId + interactions
 * + summary) and upgraded to the canonical shape by normalizeExamAttempt
 * at read time — exactly like the backward-compatibility path.
 */

import { EXAM_AGENT_EXAMS } from './exam-agent.js'
import { buildExamAgentReport } from '@/intelligence/engine/exam-agent.js'

const examOf = (id) => EXAM_AGENT_EXAMS.find((e) => e.id === id)

/**
 * Compact interaction builder: one spec string per question in order.
 *   'c<sec>'  correct in <sec> seconds   · 'w<sec>'  wrong in <sec> seconds
 *   's<sec>'  skipped after <sec>        · 'nv'      never visited
 */
const I = (exam, spec) => {
  const interactions = {}
  exam.questions.forEach((qq, i) => {
    const s = spec[i] ?? 'nv'
    if (s === 'nv') {
      interactions[qq.id] = { selected: null, timeSpent: 0, visits: 0, answerChanges: 0, markedForReview: false, visited: false }
      return
    }
    const m = s.match(/^([cws])(\d+)$/)
    const kind = m?.[1]
    const sec = Number(m?.[2] ?? 30)
    if (kind === 's') {
      interactions[qq.id] = { selected: null, timeSpent: sec, visits: 1, answerChanges: 0, markedForReview: false, visited: true }
      return
    }
    const correct = kind === 'c'
    interactions[qq.id] = {
      selected: correct ? qq.correctAnswer : (qq.correctAnswer + 1) % 4,
      timeSpent: sec,
      visits: 1,
      answerChanges: 0,
      markedForReview: false,
      visited: true,
    }
  })
  return interactions
}

const seed = ({ id, examId, submittedAt, startedAt, elapsedSeconds, spec }) => {
  const exam = examOf(examId)
  const interactions = I(exam, spec)
  /* elapsed = sum of per-question timings so avg-time math is consistent */
  const used = Object.values(interactions).reduce((n, it) => n + (it.timeSpent ?? 0), 0)
  const finalElapsed = elapsedSeconds ?? Math.min(used, (exam.durationMinutes ?? 1) * 60)
  const summary = buildExamAgentReport({ exam, interactions, elapsedSeconds: finalElapsed }).overall
  return {
    id,
    examId,
    examTitle: exam.title,
    shortTitle: exam.shortTitle,
    examType: exam.type,
    category: exam.category,
    subject: exam.subject,
    mode: 'manual',
    source: 'exam-agent',
    mock: true,
    studentId: 'u_stu_001',
    roll: '21CS114',
    startedAt,
    submittedAt,
    completedAt: submittedAt,
    elapsedSeconds: finalElapsed,
    interactions,
    summary,
  }
}

/* ================================================================== */
/* JEE Main — EA-JEE-FULL-01 (15 q · Physics 5 / Chemistry 5 / Maths 5) */
/* Chapters: Kinematics · Rotational Motion · Electrostatics · Current  */
/* Electricity · Modern Physics · Chemical Equilibrium · Thermodynamics */
/* GOC · Coordination Compounds · Mole Concept · Limits · Quadratic ·   */
/* Coordinate Geometry · Vectors & 3D · Integration                     */
/* ================================================================== */
export const seedJeeAttempts = [
  seed({
    id: 'seed-ea-jee-01', examId: 'EA-JEE-FULL-01',
    submittedAt: '2026-07-05T10:30:00.000Z', startedAt: '2026-07-05T09:45:00.000Z',
    /* 8 correct / 7 wrong ≈ 53% — Kinematics, Rotational, Modern,
       Thermodynamics, GOC, Vectors, Integration wrong */
    spec: ['w85', 'w150', 'w55', 'c40', 'w95', 'c50', 'c70', 'w160', 'c45', 'c30', 'c40', 'c25', 'c35', 'w140', 'w120'],
  }),
  seed({
    id: 'seed-ea-jee-02', examId: 'EA-JEE-FULL-01',
    submittedAt: '2026-07-19T10:30:00.000Z', startedAt: '2026-07-19T09:45:00.000Z',
    /* 9 correct / 6 wrong ≈ 60% — Kinematics improves, Modern still wrong,
       Thermodynamics declines, GOC persistent, Integration declines */
    spec: ['c45', 'w140', 'c50', 'c32', 'w90', 'c45', 'w105', 'w150', 'c40', 'c28', 'w100', 'c25', 'c35', 'c90', 'w115'],
  }),
  seed({
    id: 'seed-ea-jee-03', examId: 'EA-JEE-FULL-01',
    submittedAt: '2026-08-02T10:30:00.000Z', startedAt: '2026-08-02T09:45:00.000Z',
    /* 10 correct / 5 wrong ≈ 67% — Rotational Motion resolves (slow but
       correct), Modern + GOC + Thermodynamics persist as weak */
    spec: ['c40', 'c120', 'c48', 'c30', 'w85', 'c42', 'w100', 'w150', 'c38', 'c26', 'w95', 'c24', 'c32', 'w130', 'c90'],
  }),
]

/* ================================================================== */
/* NEET UG — EA-NEET-FULL-01 (15 q · Physics 5 / Chemistry 5 / Bio 5)  */
/* ================================================================== */
export const seedNeetAttempts = [
  seed({
    id: 'seed-ea-neet-01', examId: 'EA-NEET-FULL-01',
    submittedAt: '2026-07-12T10:30:00.000Z', startedAt: '2026-07-12T10:00:00.000Z',
    /* 9 correct / 6 wrong ≈ 60% — Modern Physics + Physical Chem weak,
       Human Physiology wrong, Ecology correct */
    spec: ['c30', 'c45', 'w55', 'w70', 'w90', 'c40', 'c35', 'w50', 'c35', 'w85', 'w60', 'c45', 'c30', 'c40', 'c50'],
  }),
  seed({
    id: 'seed-ea-neet-02', examId: 'EA-NEET-FULL-01',
    submittedAt: '2026-08-04T10:30:00.000Z', startedAt: '2026-08-04T10:00:00.000Z',
    /* 11 correct / 4 wrong ≈ 73% — Physiology improves, Modern persistent,
       Physical Chem improves */
    spec: ['c28', 'c42', 'c50', 'w65', 'w85', 'c38', 'c32', 'c48', 'c32', 'w80', 'c40', 'c42', 'c28', 'c38', 'c48'],
  }),
]

/* ================================================================== */
/* University — EA-UNI-CS501-M1 (12 q · DSA)                          */
/* Chapters: Graph Algorithms ×3 · Trees & Heaps ×3 · Sorting ×2 ·     */
/* Dynamic Programming ×2 · String Algorithms ×2                       */
/* ================================================================== */
export const seedUniversityAttempts = [
  seed({
    id: 'seed-ea-uni-01', examId: 'EA-UNI-CS501-M1',
    submittedAt: '2026-07-15T10:30:00.000Z', startedAt: '2026-07-15T09:50:00.000Z',
    /* 7 correct / 5 wrong ≈ 58% — String Algorithms both wrong (weak),
       Graph all correct (strong), Trees mostly correct */
    spec: ['c40', 'c55', 'c70', 'c45', 'c30', 'w60', 'c50', 'w35', 'c120', 'w140', 'w130', 'w90'],
  }),
  seed({
    id: 'seed-ea-uni-02', examId: 'EA-UNI-CS501-M1',
    submittedAt: '2026-08-06T10:30:00.000Z', startedAt: '2026-08-06T09:50:00.000Z',
    /* 9 correct / 3 wrong ≈ 75% — String improves (KMP correct), DP LCS
       still wrong (persistent developing), Trees fully correct */
    spec: ['c35', 'c50', 'c65', 'c40', 'c28', 'c45', 'c42', 'w30', 'c100', 'w120', 'c95', 'c85'],
  }),
]

export const examAttemptSeeds = [...seedJeeAttempts, ...seedNeetAttempts, ...seedUniversityAttempts]

export default examAttemptSeeds
