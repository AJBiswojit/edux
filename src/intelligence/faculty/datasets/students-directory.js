/**
 * Faculty Intelligence — STUDENT DIRECTORY dataset (Phase 3).
 *
 * ONE source of truth for the Faculty → My Students → Batch → Student
 * foundation:
 *   · facultyBatches  — a single canonical batch model covering University,
 *     JEE and NEET batches (no separate batch systems per domain)
 *   · facultyStudents — every student assigned to Dr. Meera Krishnan
 *     (stable ids + rolls; the 16 existing STUDENT_ROSTER identities are
 *     reused where they exist — never duplicated)
 *   · getStudentAttempts(studentId) — deterministic per-student exam
 *     history in the canonical attempt contract (Phase 1). Aarav
 *     (u_stu_001) uses his REAL attempts (localStorage + Phase 2 seeds);
 *     every other student gets a seeded, varied history (strong /
 *     improving / stable / needs-attention archetypes) so the directory
 *     looks realistic — all records `mode: 'manual'`, clearly demo data.
 *
 * No status/accuracy values are hardcoded — everything the UI shows is
 * derived from these attempts by the students-directory engine.
 */

import { EXAM_AGENT_EXAMS } from '@/mock-data/exam-agent'
import { buildExamAgentReport } from '@/intelligence/engine/exam-agent.js'
import { weakStudentDetection } from '@/mock-data/faculty-extra.js'

/* ------------------------------------------------------------------ */
/* Seeded PRNG (deterministic per student)                            */
/* ------------------------------------------------------------------ */
function mulberry32(seed) {
  let a = seed >>> 0
  return function rand() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function seedFromString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/* ------------------------------------------------------------------ */
/* Name pool (deterministic assignment — no duplicate rolls)           */
/* ------------------------------------------------------------------ */
const FIRST = ['Aarav', 'Ishita', 'Rohan', 'Sneha', 'Karan', 'Divya', 'Aditya', 'Pooja', 'Nikhil', 'Ananya', 'Vivek', 'Ritika', 'Arjun', 'Neha', 'Sanjay', 'Kavya', 'Farhan', 'Meera', 'Tanvi', 'Rahul', 'Simran', 'Yash', 'Priyanka', 'Om', 'Sara', 'Dev', 'Naina', 'Ravi', 'Zoya', 'Ibrahim']
const LAST = ['Sharma', 'Gupta', 'Verma', 'Patil', 'Mehta', 'Krishnan', 'Singh', 'Reddy', 'Joshi', 'Desai', 'Kumar', 'Nair', 'Kulkarni', 'Menon', 'Patel', 'Iyer', 'Khan', 'Bose', 'Chopra', 'Das', 'Mishra', 'Rao', 'Pillai', 'Agarwal', 'Shetty', 'Gill', 'Bhat', 'Kapoor', 'Saxena', 'Naidu']

function nameFor(batchIdx, j) {
  const f = FIRST[(batchIdx * 18 + j) % FIRST.length]
  const l = LAST[(batchIdx * 31 + j * 7) % LAST.length]
  return `${f} ${l}`
}

/* ------------------------------------------------------------------ */
/* Batches — one canonical model for all domains                      */
/* ------------------------------------------------------------------ */
export const facultyBatches = [
  {
    id: 'batch_uni_cse_a', name: 'CSE-2026-A', domain: 'University', examFamily: null,
    academicSession: '2026–27', program: 'B.Tech — CSE', course: 'Data Structures & Algorithms',
    courseCode: 'CS501', semester: 'VI', section: 'A', facultyIds: ['fac_meera_krishnan'], status: 'Active',
  },
  {
    id: 'batch_uni_cse_b', name: 'CSE-2026-B', domain: 'University', examFamily: null,
    academicSession: '2026–27', program: 'B.Tech — CSE', course: 'Operating Systems',
    courseCode: 'CS503', semester: 'VI', section: 'B', facultyIds: ['fac_meera_krishnan'], status: 'Active',
  },
  {
    id: 'batch_uni_cse_c', name: 'CSE-2026-C', domain: 'University', examFamily: null,
    academicSession: '2026–27', program: 'B.Tech — CSE', course: 'Machine Learning',
    courseCode: 'CS505', semester: 'VI', section: 'C', facultyIds: ['fac_meera_krishnan'], status: 'Active',
  },
  {
    id: 'batch_jee_2027_a', name: 'JEE-2027-A', domain: 'Competitive', examFamily: 'JEE', examLabel: 'JEE Main',
    academicSession: '2026–27', program: 'B.Tech — CSE', course: null, courseCode: null,
    semester: null, section: null, facultyIds: ['fac_meera_krishnan'], status: 'Active',
  },
  {
    id: 'batch_jee_2027_b', name: 'JEE-2027-B', domain: 'Competitive', examFamily: 'JEE', examLabel: 'JEE Main',
    academicSession: '2026–27', program: 'B.Tech — CSE', course: null, courseCode: null,
    semester: null, section: null, facultyIds: ['fac_meera_krishnan'], status: 'Active',
  },
  {
    id: 'batch_neet_2027_a', name: 'NEET-2027-A', domain: 'Competitive', examFamily: 'NEET', examLabel: 'NEET UG',
    academicSession: '2026–27', program: 'B.Tech — CSE', course: null, courseCode: null,
    semester: null, section: null, facultyIds: ['fac_meera_krishnan'], status: 'Active',
  },
  {
    id: 'batch_neet_2027_b', name: 'NEET-2027-B', domain: 'Competitive', examFamily: 'NEET', examLabel: 'NEET UG',
    academicSession: '2026–27', program: 'B.Tech — CSE', course: null, courseCode: null,
    semester: null, section: null, facultyIds: ['fac_meera_krishnan'], status: 'Active',
  },
]

/* ------------------------------------------------------------------ */
/* Students — stable ids + rolls, roster identities reused             */
/* ------------------------------------------------------------------ */
const STUDENTS_PER_BATCH = 18

/** First 16 university-A students = the existing STUDENT_ROSTER identities. */
const ROSTER = [
  { id: 's1', name: 'Aarav Sharma', roll: '21CS114' },
  { id: 's2', name: 'Ishita Gupta', roll: '21CS101' },
  { id: 's3', name: 'Rohan Verma', roll: '21CS102' },
  { id: 's4', name: 'Sneha Patil', roll: '21CS103' },
  { id: 's5', name: 'Karan Mehta', roll: '21CS104' },
  { id: 's6', name: 'Divya Krishnan', roll: '21CS105' },
  { id: 's7', name: 'Aditya Singh', roll: '21CS106' },
  { id: 's8', name: 'Pooja Reddy', roll: '21CS107' },
  { id: 's9', name: 'Nikhil Joshi', roll: '21CS108' },
  { id: 's10', name: 'Ananya Desai', roll: '21CS109' },
  { id: 's11', name: 'Vivek Kumar', roll: '21CS110' },
  { id: 's12', name: 'Ritika Sharma', roll: '21CS111' },
  { id: 's13', name: 'Arjun Nair', roll: '21CS112' },
  { id: 's14', name: 'Neha Kulkarni', roll: '21CS113' },
  { id: 's15', name: 'Sanjay Patel', roll: '21CS115' },
  { id: 's16', name: 'Kavya Menon', roll: '21CS116' },
]

export const facultyStudents = (() => {
  const list = []
  const batchMeta = [
    { batchId: 'batch_uni_cse_a', prefix: 'fs_uni_a', rollBase: 101, rollPrefix: '21CS' },
    { batchId: 'batch_uni_cse_b', prefix: 'fs_uni_b', rollBase: 119, rollPrefix: '21CS' },
    { batchId: 'batch_uni_cse_c', prefix: 'fs_uni_c', rollBase: 137, rollPrefix: '21CS' },
    { batchId: 'batch_jee_2027_a', prefix: 'fs_jee_a', rollBase: 101, rollPrefix: 'J24-' },
    { batchId: 'batch_jee_2027_b', prefix: 'fs_jee_b', rollBase: 119, rollPrefix: 'J24-' },
    { batchId: 'batch_neet_2027_a', prefix: 'fs_neet_a', rollBase: 101, rollPrefix: 'N24-' },
    { batchId: 'batch_neet_2027_b', prefix: 'fs_neet_b', rollBase: 119, rollPrefix: 'N24-' },
  ]
  batchMeta.forEach((meta, bi) => {
    for (let j = 0; j < STUDENTS_PER_BATCH; j += 1) {
      /* batch A university: reuse the 16 roster identities for realism */
      let id, name, roll
      if (bi === 0 && j < ROSTER.length) {
        const r = ROSTER[j]
        id = r.id === 's1' ? 'u_stu_001' : `fs_${r.id}`
        name = r.name
        roll = r.roll
      } else {
        id = `${meta.prefix}_${String(j + 1).padStart(2, '0')}`
        name = nameFor(bi, j)
        roll = `${meta.rollPrefix}${meta.rollBase + j}`
      }
      list.push({
        id,
        roll,
        name,
        batchId: meta.batchId,
        domain: bi < 3 ? 'University' : 'Competitive',
        examFamily: bi >= 3 ? (bi < 5 ? 'JEE' : 'NEET') : null,
        status: 'Enrolled',
      })
    }
  })
  return list
})()

const batchOf = (batchId) => facultyBatches.find((b) => b.id === batchId)
const studentOf = (id) => facultyStudents.find((s) => s.id === id)

/* ------------------------------------------------------------------ */
/* Deterministic per-student exam history (canonical attempt contract) */
/* ------------------------------------------------------------------ */

const EXAMS_BY_BATCH = {
  batch_uni_cse_a: ['EA-UNI-CS501-M1'],
  batch_uni_cse_b: ['EA-UNI-CS503-M1'],
  batch_uni_cse_c: ['EA-UNI-CS505-M1'],
  batch_jee_2027_a: ['EA-JEE-FULL-01', 'EA-JEE-PHY-01', 'EA-JEE-FULL-02'],
  batch_jee_2027_b: ['EA-JEE-FULL-01', 'EA-JEE-FULL-02', 'EA-JEE-PHY-01'],
  batch_neet_2027_a: ['EA-NEET-FULL-01', 'EA-NEET-BIO-01', 'EA-NEET-FULL-02'],
  batch_neet_2027_b: ['EA-NEET-FULL-01', 'EA-NEET-FULL-02', 'EA-NEET-BIO-01'],
}

const DATES = ['2026-05-16', '2026-05-30', '2026-06-13', '2026-06-27', '2026-07-11', '2026-07-25', '2026-08-08']

/* Archetype → base accuracy + trend + time profile */
const ARCHETYPES = [
  { key: 'strong', prob: 0.2, base: 0.82, drift: 0.02, time: 0.9, skip: 0.03, rev: 0.08 },
  { key: 'improving', prob: 0.25, base: 0.48, drift: 0.07, time: 1.0, skip: 0.08, rev: 0.12 },
  { key: 'stable', prob: 0.35, base: 0.63, drift: 0.005, time: 1.05, skip: 0.06, rev: 0.1 },
  { key: 'attention', prob: 0.2, base: 0.45, drift: -0.045, time: 1.3, skip: 0.16, rev: 0.14 },
]

const attemptCache = new Map()

/**
 * Builds a student's exam history (legacy attempt shape, upgraded to
 * canonical by normalizeExamAttempt at read time). Deterministic per
 * student; varied across students. `mode: 'manual'` (these are demo
 * records but represent REAL (non-demo) attempts from the faculty
 * intelligence perspective).
 */
export function getStudentAttempts(studentId) {
  if (attemptCache.has(studentId)) return attemptCache.get(studentId)
  const student = studentOf(studentId)
  if (!student) return []

  /* Aarav — the real student: attempts come from the shared intelligence
     store (his actual agent attempts + Phase 2 seeds). Returned empty here;
     the routes merge the shared store for u_stu_001. */
  if (studentId === 'u_stu_001') {
    attemptCache.set(studentId, null)
    return null
  }

  const rand = mulberry32(seedFromString(studentId))
  const archetype = ARCHETYPES[Math.floor(rand() * ARCHETYPES.length)]
  const examIds = EXAMS_BY_BATCH[student.batchId] ?? []
  const attemptCount = 3 + Math.floor(rand() * 3) // 3–5 attempts
  const attempts = []

  for (let i = 0; i < attemptCount; i += 1) {
    const examId = examIds[i % examIds.length]
    const exam = EXAM_AGENT_EXAMS.find((e) => e.id === examId)
    if (!exam) continue
    const p = Math.min(0.96, Math.max(0.22, archetype.base + archetype.drift * i + (rand() - 0.5) * 0.08))
    const interactions = {}
    exam.questions.forEach((qq) => {
      const r = rand()
      const skip = r < archetype.skip
      const correct = rand() < p
      const base = { Easy: 30, Medium: 60, Hard: 110 }
      const time = Math.round((base[qq.difficulty] ?? 60) * archetype.time * (0.7 + rand() * 0.8))
      const visits = rand() < archetype.rev ? 2 : 1
      interactions[qq.id] = skip
        ? { selected: null, timeSpent: Math.round(time * 0.6), visits: 1, answerChanges: 0, markedForReview: rand() < 0.2, visited: true }
        : {
            selected: correct ? qq.correctAnswer : (qq.correctAnswer + 1) % 4,
            timeSpent: time,
            visits,
            answerChanges: visits > 1 ? 1 : 0,
            markedForReview: rand() < 0.12,
            visited: true,
          }
    })
    const elapsedSeconds = Math.min(Object.values(interactions).reduce((n, it) => n + (it.timeSpent ?? 0), 0), (exam.durationMinutes ?? 1) * 60)
    const summary = buildExamAgentReport({ exam, interactions, elapsedSeconds }).overall
    attempts.push({
      id: `fac-${studentId}-${i + 1}`,
      examId,
      examTitle: exam.title,
      shortTitle: exam.shortTitle,
      examType: exam.type,
      category: exam.category,
      subject: exam.subject,
      mode: 'manual',
      source: 'exam-agent',
      mock: true,
      studentId,
      roll: student.roll,
      submittedAt: `${DATES[i % DATES.length]}T10:30:00.000Z`,
      completedAt: `${DATES[i % DATES.length]}T10:30:00.000Z`,
      elapsedSeconds,
      interactions,
      summary,
    })
  }
  attempts.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  attemptCache.set(studentId, attempts)
  return attempts
}

/** Attention signals from the existing weak-student detection model. */
export function attentionSignalsByRoll() {
  const map = new Map()
  ;(weakStudentDetection?.detections ?? []).forEach((d) => {
    map.set(d.roll, { reason: d.signals?.[0] ?? 'Flagged by the at-risk model', risk: d.risk, status: d.status })
  })
  return map
}

export const studentDirectoryDatasets = { facultyBatches, facultyStudents }

export default studentDirectoryDatasets
