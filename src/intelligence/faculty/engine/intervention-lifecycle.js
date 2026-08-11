/**
 * Faculty Intelligence Engine — INTERVENTION LIFECYCLE (Phase 6).
 *
 * Implements the actionable intervention lifecycle on top of the Phase 5
 * foundation:
 *
 *   Detected → Recommended → Approved → Planned → Assigned → In Progress
 *   → Completed → Re-test Pending → Evaluating → Resolved / Improving /
 *   Persistent        (Dismissed allowed before assignment)
 *
 * Faculty approval is MANDATORY (approvedBy/approvedAt); no automatic
 * delivery; all persistence is prototype localStorage. This module is
 * pure/Node-testable and contains:
 *
 *   · INTERVENTION_STATUSES / TRANSITIONS / canTransition
 *   · buildInterventionFromGroup()      — canonical intervention entity
 *   · practiceTypeFor()                 — practice-set type per issue
 *   · selectPracticeQuestions()         — existing Question Bank / PYQ
 *     selection with honest insufficiency + broaden levels
 *   · buildRetest()                     — re-test entity (different
 *     questions, linked to interventionId)
 *   · computeEffectiveness()            — deterministic before/after
 *     outcome ("Prototype Intervention Effectiveness" — NOT validated)
 */

import { round1, avg } from './scores.js'

/* ------------------------------------------------------------------ */
/* Status machine                                                     */
/* ------------------------------------------------------------------ */

export const INTERVENTION_STATUSES = [
  'Detected', 'Recommended', 'Approved', 'Planned', 'Assigned', 'In Progress',
  'Completed', 'Re-test Pending', 'Evaluating', 'Resolved', 'Improving', 'Persistent', 'Dismissed',
]

export const TRANSITIONS = {
  Detected: ['Recommended', 'Dismissed'],
  Recommended: ['Approved', 'Dismissed'],
  Approved: ['Planned', 'Dismissed'],
  Planned: ['Assigned', 'Dismissed'],
  Assigned: ['In Progress', 'Dismissed'],
  'In Progress': ['Completed'],
  Completed: ['Re-test Pending'],
  'Re-test Pending': ['Evaluating'],
  Evaluating: ['Resolved', 'Improving', 'Persistent'],
  Resolved: [],
  Improving: [],
  Persistent: [],
  Dismissed: [],
}

export function canTransition(from, to) {
  return (TRANSITIONS[from] ?? []).includes(to)
}

/* ------------------------------------------------------------------ */
/* Practice-set types per issue                                       */
/* ------------------------------------------------------------------ */

export function practiceTypeFor(issueType) {
  switch (issueType) {
    case 'Persistent Weakness': return 'Concept + Targeted + PYQ'
    case 'Time Management': return 'Timed Practice'
    case 'High Skip Rate': return 'Mixed Practice'
    case 'Careless Errors': return 'Concept + Targeted'
    case 'Declining Performance': return 'Targeted Practice'
    case 'Performance Gap': return 'Concept Practice'
    default: return 'Targeted Practice'
  }
}

export function objectivesFor(issueType, chapter) {
  const base = [`Achieve ≥70% accuracy on ${chapter} questions`, 'Reduce average solving time below 100 seconds per question']
  if (issueType === 'Persistent Weakness') base.push('Resolve the recurring pattern across at least 2 consecutive assessments')
  if (issueType === 'High Skip Rate') base.push('Increase attempt rate to ≥85% on the targeted set')
  if (issueType === 'Careless Errors') base.push('Zero fast-incorrect answers on the final drill')
  return base
}

/* ------------------------------------------------------------------ */
/* Canonical intervention entity                                      */
/* ------------------------------------------------------------------ */

export function buildInterventionFromGroup(group, overrides = null) {
  const o = overrides ?? {}
  const issue = group.evidence ?? {}
  const rec = group.recommendation ?? {}
  return {
    id: group.id,
    issueGroupId: group.id,
    title: o.title ?? `Recovery — ${group.subject} — ${group.chapter}`,
    domain: group.domain,
    examFamily: group.examFamily ?? null,
    subject: group.subject,
    chapter: group.chapter,
    topic: null,
    issueType: group.issueType,
    priority: o.priority ?? group.priority,
    studentIds: o.studentIds ?? group.students.map((s) => s.studentId),
    allGroupStudentIds: group.students.map((s) => s.studentId),
    recommendation: {
      title: rec.title,
      actions: rec.actions ?? [],
      detail: rec.detail,
    },
    objectives: o.objectives ?? objectivesFor(group.issueType, group.chapter),
    expectedOutcome: `≥70% accuracy and reduced time on ${group.chapter} across ${group.students.length} student(s).`,
    practiceConfig: {
      type: o.practiceConfig?.type ?? practiceTypeFor(group.issueType),
      count: o.practiceConfig?.count ?? 8,
      difficulty: o.practiceConfig?.difficulty ?? 'Medium',
      duration: o.practiceConfig?.duration ?? 20,
      includePyq: o.practiceConfig?.includePyq ?? (group.issueType === 'Persistent Weakness'),
    },
    pyqPreference: o.pyqPreference ?? (group.issueType === 'Persistent Weakness' ? 'Yes' : 'No'),
    status: o.status ?? 'Detected',
    createdAt: o.createdAt ?? new Date().toISOString(),
    approvedAt: o.approvedAt ?? null,
    approvedBy: o.approvedBy ?? null,
    assignedAt: o.assignedAt ?? null,
    completedAt: o.completedAt ?? null,
    retestCreatedAt: o.retestCreatedAt ?? null,
    evaluatedAt: o.evaluatedAt ?? null,
    facultyId: 'fac_meera_krishnan',
    notes: o.notes ?? '',
    action: o.action ?? null,
    updatedAt: o.updatedAt ?? null,
    evidence: issue,
    whyDetected: group.whyDetected,
    students: group.students,
    baseline: {
      accuracy: issue.avgAccuracy ?? 0,
      avgTime: issue.avgTime ?? 0,
      incorrect: issue.incorrect ?? 0,
      questions: issue.questions ?? 0,
      affectedExams: issue.affectedExams ?? 0,
      persistence: issue.persistence ?? 1,
    },
  }
}

/* ------------------------------------------------------------------ */
/* Question selection (existing Question Bank / PYQ datasets)         */
/* ------------------------------------------------------------------ */

/**
 * Selects practice/re-test questions for an intervention.
 *   level: 'exact' | 'difficulty' | 'subject' | 'related-topics'
 * Returns { questions, available, required, insufficient, level }.
 * Questions carry { id, text, options, answer, chapter, topic, difficulty,
 * type, isPyq, source }.
 */
export function selectPracticeQuestions({
  domain, examFamily, subject, chapter, difficulty = 'Medium', count = 8,
  includePyq = false, excludeIds = [], pool = null, level = 'exact',
}) {
  const LETTERS = ['A', 'B', 'C', 'D']
const answerIndex = (a) => (typeof a === 'number' ? a : typeof a === 'string' && /^[A-D]$/i.test(a) ? LETTERS.indexOf(a.toUpperCase()) : null)
  const required = Math.max(1, count)
  const exact = (pool ?? []).filter((q) => {
    if (q.subject !== subject) return false
    if (q.chapter !== chapter) return false
    if (difficulty && difficulty !== 'Mixed' && q.difficulty !== difficulty) return false
    return (q.options ?? []).length === 4
  })
  const usable = (arr) => arr.filter((q) => !excludeIds.includes(q.id))
  let candidates = usable(exact)
  let actualLevel = 'exact'
  const mcqOnly = (arr) => (arr ?? []).filter((q) => (q.options ?? []).length === 4)
  if (candidates.length < required && level !== 'exact') {
    /* difficulty broaden: same chapter, any difficulty */
    const byChapter = usable(mcqOnly((pool ?? []).filter((q) => q.subject === subject && q.chapter === chapter)))
    if (byChapter.length > candidates.length) { candidates = byChapter; actualLevel = 'difficulty' }
  }
  if (candidates.length < required && (level === 'subject' || level === 'related-topics')) {
    const bySubject = usable(mcqOnly((pool ?? []).filter((q) => q.subject === subject)))
    if (bySubject.length > candidates.length) { candidates = bySubject; actualLevel = 'subject' }
  }
  if (candidates.length < required && level === 'related-topics') {
    const byTopic = usable(mcqOnly((pool ?? []).filter((q) => (q.topic ?? '').toLowerCase().includes(String(chapter).toLowerCase().split(' ')[0].toLowerCase()) || (q.chapter ?? '').toLowerCase().includes(String(chapter).toLowerCase().split(' ')[0].toLowerCase()))))
    if (byTopic.length > candidates.length) { candidates = byTopic; actualLevel = 'related-topics' }
  }
  const selected = candidates.slice(0, required)
  return {
    questions: selected.map((q) => ({
      id: q.id, text: q.question ?? q.text, options: q.options ?? [], answer: q.answer,
      correctAnswerIndex: answerIndex(q.answer),
      chapter: q.chapter, topic: q.topic, difficulty: q.difficulty, type: q.questionType ?? q.type,
      isPyq: !!q.isPyq || !!q.pyqFrequency, source: q.source ?? 'bank', year: q.year ?? q.pyq?.year ?? null,
    })),
    available: candidates.length,
    required,
    insufficient: candidates.length < required,
    level: actualLevel,
  }
}

/* ------------------------------------------------------------------ */
/* Re-test                                                             */
/* ------------------------------------------------------------------ */

export function buildRetestEntity({
  intervention, title, difficulty = 'Medium', count = 10, timeLimit = 20,
  pyqPreference = 'No', studentIds = null, questions = [],
}) {
  return {
    id: `retest-${Date.now()}`,
    interventionId: intervention.id,
    title: title ?? `Recovery Test — ${intervention.chapter}`,
    domain: intervention.domain,
    examFamily: intervention.examFamily,
    subject: intervention.subject,
    chapter: intervention.chapter,
    topic: null,
    difficulty,
    questionCount: questions.length,
    timeLimit,
    pyqPreference,
    studentIds: studentIds ?? intervention.studentIds,
    questions,
    status: 'Assigned',
    createdAt: new Date().toISOString(),
    interventionTitle: intervention.title,
  }
}

/* ------------------------------------------------------------------ */
/* Effectiveness (deterministic, prototype-labelled)                  */
/* ------------------------------------------------------------------ */

/**
 * Outcome rules (documented; prototype, not validated):
 *   Resolved             retestAcc ≥ 75 AND Δaccuracy ≥ +20 AND Δtime ≥ +5
 *                        (or retestAcc ≥ 80 AND Δaccuracy ≥ +15)
 *   Improving            retestAcc ≥ 60 AND Δaccuracy ≥ +10 (not resolved)
 *   Persistent           Δaccuracy < +5 AND retestAcc < 60
 *   No Significant Change  |Δaccuracy| ≤ 5 (not persistent)
 *   Partially Effective  otherwise (some improvement, below thresholds)
 */
export function computeEffectiveness({ baseline, practiceAttempts = [], retestAttempts = [] }) {
  const b = baseline ?? { accuracy: 0, avgTime: 0, incorrect: 0 }
  const agg = (attempts) => {
    if (!attempts?.length) return null
    return {
      accuracy: round1(avg(attempts.map((a) => a.accuracy ?? 0))),
      avgTime: round1(avg(attempts.map((a) => a.avgTime ?? 0))),
      incorrect: attempts.reduce((n, a) => n + (a.incorrect ?? 0), 0),
      attempts: attempts.length,
    }
  }
  const practice = agg(practiceAttempts)
  const retest = agg(retestAttempts)

  if (!retest) {
    return { outcome: 'Pending', practice, retest: null, deltas: null, evidence: 'No re-test completed yet — completion is not effectiveness.', completed: false }
  }

  const accuracyDelta = round1(retest.accuracy - b.accuracy)
  const timeDelta = round1(b.avgTime - retest.avgTime) /* positive = faster */
  const errorDelta = b.incorrect - retest.incorrect
  const deltas = { accuracyDelta, timeDelta, errorDelta }

  let outcome
  if (retest.accuracy >= 75 && accuracyDelta >= 20 && timeDelta >= 5) outcome = 'Resolved'
  else if (retest.accuracy >= 80 && accuracyDelta >= 15) outcome = 'Resolved'
  else if (retest.accuracy >= 60 && accuracyDelta >= 10) outcome = 'Improving'
  else if (accuracyDelta < 5 && retest.accuracy < 60) outcome = 'Persistent'
  else if (Math.abs(accuracyDelta) <= 5) outcome = 'No Significant Change'
  else outcome = 'Partially Effective'

  const parts = []
  parts.push(`Accuracy ${b.accuracy}% → ${retest.accuracy}% (${accuracyDelta >= 0 ? '+' : '−'}${Math.abs(accuracyDelta)}pp)`)
  if (retest.avgTime) parts.push(`average time ${b.avgTime || '—'}s → ${retest.avgTime}s (${timeDelta >= 0 ? '−' : '+'}${Math.abs(timeDelta)}s)`)
  if (b.incorrect != null && retest.incorrect != null) parts.push(`incorrect ${b.incorrect} → ${retest.incorrect} (${errorDelta >= 0 ? '−' : '+'}${Math.abs(errorDelta)})`)
  const evidence = `${parts.join('; ')}. Across ${retest.attempts} re-test assessment(s)${practice ? ` after practice accuracy ${practice.accuracy}%.` : '.'}`

  return { outcome, practice, retest, deltas, evidence, completed: true }
}

export default { INTERVENTION_STATUSES, TRANSITIONS, canTransition, practiceTypeFor, objectivesFor, buildInterventionFromGroup, selectPracticeQuestions, buildRetestEntity, computeEffectiveness }
