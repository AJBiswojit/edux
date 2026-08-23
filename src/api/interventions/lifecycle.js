/**
 * Intervention lifecycle support — shared derivation helpers for the faculty
 * and student intervention endpoints (one intervention system, one status
 * machine, one question pool).
 *
 * Pure relocation of the Phase 5/6 helpers: canonical attempt reads,
 * similar-issue fingerprinting/grouping, persisted record resolution,
 * question pools (existing datasets — never a second bank) and
 * effectiveness/outcome computation.
 */
import {
  facultyStudents, getStudentAttempts,
} from '@/intelligence/faculty/datasets/students-directory'
import {
  computeStudentIssueFingerprints, computeStudentQuestionIntelligence,
  groupSimilarIssues, buildInterventionFromGroup,
  sameInterventionTarget, matchInterventionExamAttempts,
  computeEffectiveness, computeGroupEffectiveness,
} from '@/intelligence/faculty'
import { normalizeExamAttempt } from '@/intelligence'
import { EXAM_AGENT_EXAMS } from '@/datasets/exams/exam-agent.js'
import { readAllAttempts } from '../core/exam-attempts-store'
import { readStatus, readPractice, readRetests } from './store'

export function canonicalAttemptsFor(studentId) {
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
export function fingerprintsForAll() {
  return facultyStudents.map((s) => {
    if (!fingerprintCache.has(s.id)) {
      fingerprintCache.set(s.id, computeStudentIssueFingerprints(s, canonicalAttemptsFor(s.id)))
    }
    return fingerprintCache.get(s.id)
  }).flat()
}

export function groupedPayload() {
  const { groups } = groupSimilarIssues(fingerprintsForAll())
  return { groups }
}

/* ------------------------------------------------------------------ */
/* Phase 5 hardening — Student 360-sourced individual interventions    */
/* ------------------------------------------------------------------ */

export const slug = (v) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/**
 * Student-360-created interventions are stored in the SAME
 * aurora_faculty_interventions record map. Their override entry carries the
 * full synthetic single-student group (`s360Group`) so they flow through the
 * EXISTING lifecycle routes (detail/status/assign/practice/retest/student)
 * unchanged — one intervention system, one status machine.
 */
export function storedInterventionRecords() {
  const overrides = readStatus()
  return Object.entries(overrides)
    .filter(([, v]) => v && (v.interventionGroup || v.s360Group))
    .map(([id, v]) => ({ id, group: v.interventionGroup ?? v.s360Group, record: v }))
}

/** Grouped recommendations + every persisted per-student record (one store,
 * one lifecycle). `s360Group` remains readable for Phase 5 compatibility. */
export function allInterventionGroups() {
  return [...groupedPayload().groups, ...storedInterventionRecords().map((r) => r.group)]
}

export function findGroupById(id) {
  return allInterventionGroups().find((g) => g.id === id) ?? null
}

/** Canonical intervention record for a group (with persisted overrides). */
export function interventionFor(group) {
  const overrides = readStatus()
  const o = overrides[group.id] ?? null
  return buildInterventionFromGroup(group, o)
}

export function persistedInterventions() {
  const overrides = readStatus()
  const stored = storedInterventionRecords().map(({ group }) => interventionFor(group))
  const storedIds = new Set(stored.map((iv) => iv.id))
  const reviewedGroups = groupedPayload().groups
    .filter((group) => !storedIds.has(group.id) && overrides[group.id]?.status)
    .map((group) => interventionFor(group))
  return [...stored, ...reviewedGroups].filter((iv) => iv.status && iv.status !== 'Dismissed')
}

export function activeInterventionForStudent(studentId, target, candidates = null) {
  for (const iv of candidates ?? persistedInterventions()) {
    if ((iv.studentIds ?? []).includes(studentId) && sameInterventionTarget(iv, target)) return iv
  }
  return null
}

export function evidenceRowsForGroup(group) {
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

export function postExamOutcomeFor(iv, practice, retests) {
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
export async function questionPoolFor(intervention) {
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

export function groupOutcome(group) {
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

export function presentGroup(group, activeCandidates = null) {
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
