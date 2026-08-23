/**
 * Intervention API — student surface.
 *
 * Assigned interventions, targeted practice runs and the linked re-test.
 * Shares the SAME store and lifecycle helpers as the faculty surface
 * (one intervention system). Endpoint contracts unchanged.
 */
import { defineRoute } from '../core/router'
import { selectPracticeQuestions, computeEffectiveness } from '@/intelligence/faculty'
import { readStatus, writeStatus, readPractice, writePractice, readRetests } from './store'
import { allInterventionGroups, findGroupById, interventionFor, postExamOutcomeFor, questionPoolFor } from './lifecycle'

/* ------------------------------------------------------------------ */
/* Student: assigned interventions + practice + re-test               */
/* ------------------------------------------------------------------ */
defineRoute('get', '/student/interventions', async ({ params }) => {
  const studentId = params?.studentId ?? 'u_stu_001'
  const groups = allInterventionGroups()
  const practice = readPractice()
  const retests = readRetests()
  const items = groups
    .map((g) => interventionFor(g))
    .filter((iv) => (iv.studentIds ?? []).includes(studentId))
    .filter((iv) => ['Assigned', 'In Progress', 'Completed', 'Re-test Pending', 'Evaluating', 'Resolved', 'Improving', 'Persistent'].includes(iv.status))
    .map((iv) => {
      const myPractice = practice.filter((p) => p.interventionId === iv.id && p.studentId === studentId)
      const practiceAttempts = myPractice.filter((p) => p.kind === 'practice')
      const retestAttempts = myPractice.filter((p) => p.kind === 'retest')
      const rawRetest = retests.find((r) => r.interventionId === iv.id && (r.studentIds ?? []).includes(studentId))
      const member = (iv.students ?? []).find((s) => s.studentId === studentId)
      const individualIv = iv.studentId ? iv : {
        ...iv,
        studentId,
        baseline: {
          ...iv.baseline,
          accuracy: member?.accuracy ?? iv.baseline?.accuracy,
          avgTime: member?.avgTime ?? iv.baseline?.avgTime,
          incorrect: member?.evidence?.incorrect ?? iv.baseline?.incorrect,
          skipped: member?.evidence?.skipped ?? iv.baseline?.skipped,
          questions: member?.evidence?.questions ?? iv.baseline?.questions,
        },
      }
      const outcome = postExamOutcomeFor(individualIv, practice, retests)
      const retest = rawRetest ? {
        id: rawRetest.id, interventionId: rawRetest.interventionId, title: rawRetest.title,
        domain: rawRetest.domain, examFamily: rawRetest.examFamily, subject: rawRetest.subject,
        chapter: rawRetest.chapter, difficulty: rawRetest.difficulty,
        questionCount: rawRetest.questionCount, timeLimit: rawRetest.timeLimit,
        status: rawRetest.status, createdAt: rawRetest.createdAt,
      } : null
      /* Deliberately explicit allow-list: no group id/name, other students,
         group averages, faculty notes, or faculty-only reasoning. */
      return {
        id: iv.id,
        interventionId: iv.id,
        studentId,
        title: iv.title,
        domain: iv.domain,
        examFamily: iv.examFamily,
        subject: iv.subject,
        chapter: iv.chapter,
        issueType: iv.issueType,
        priority: iv.priority,
        status: iv.status,
        objective: iv.objectives?.[0] ?? null,
        objectives: iv.objectives ?? [],
        practiceConfig: iv.practiceConfig,
        createdAt: iv.createdAt,
        whyAssigned: `Your recent assessments show repeated difficulty with ${iv.chapter} (${iv.issueType.toLowerCase()}).`,
        practiceDone: practiceAttempts.length > 0,
        practiceRequired: iv.practiceConfig?.count ?? 8,
        practiceAccuracy: practiceAttempts.length ? Math.round(practiceAttempts.reduce((n, p) => n + p.accuracy, 0) / practiceAttempts.length) : null,
        retest,
        retestDone: retestAttempts.length > 0,
        outcome: outcome.effectiveness.outcome,
        effectiveness: outcome.effectiveness,
        postExam: outcome.postExam,
      }
    })
  return { items, count: items.length, studentId }
})

defineRoute('get', '/student/interventions/:id/practice', async ({ params }) => {
  const group = findGroupById(params.id)
  if (!group) {
    const err = new Error('Intervention not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const iv = interventionFor(group)
  const pool = await questionPoolFor(iv)
  const res = selectPracticeQuestions({
    domain: iv.domain, examFamily: iv.examFamily, subject: iv.subject, chapter: iv.chapter,
    difficulty: iv.practiceConfig?.difficulty ?? 'Medium', count: iv.practiceConfig?.count ?? 8,
    questionType: iv.practiceConfig?.questionType ?? 'Any',
    includePyq: iv.practiceConfig?.includePyq ?? true, pyqPreference: iv.practiceConfig?.pyqPreference,
    pool: pool.questions, level: iv.practiceConfig?.selectionLevel ?? 'subject',
  })
  return { ...res, interventionId: iv.id, practiceType: iv.practiceConfig?.type, durationMinutes: iv.practiceConfig?.duration ?? 20, whyAssigned: `Your recent assessments show repeated difficulty with ${iv.chapter}.` }
})

defineRoute('post', '/student/interventions/:id/practice-attempts', async ({ params, body }) => {
  const group = findGroupById(params.id)
  if (!group) {
    const err = new Error('Intervention not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const iv = interventionFor(group)
  const studentId = body?.studentId ?? 'u_stu_001'
  if (!(iv.studentIds ?? []).includes(studentId)) {
    const err = new Error('This intervention does not belong to the selected student.')
    err.response = { status: 403, data: { message: err.message } }
    throw err
  }
  const kind = body?.kind ?? 'practice'
  if (kind === 'retest' && !readRetests().some((r) => r.interventionId === iv.id && (r.studentIds ?? []).includes(studentId))) {
    const err = new Error('No linked re-test exists for this intervention and student.')
    err.response = { status: 400, data: { message: err.message } }
    throw err
  }
  const attempt = {
    id: `ip-${Date.now()}`,
    interventionId: iv.id,
    studentId,
    kind, /* practice | retest */
    domain: iv.domain,
    examFamily: iv.examFamily,
    subject: iv.subject,
    chapter: iv.chapter,
    topic: null,
    questionAttempts: Array.isArray(body?.questionAttempts) ? body.questionAttempts : [],
    score: body?.score ?? 0,
    maxScore: body?.maxScore ?? 0,
    accuracy: body?.accuracy ?? 0,
    attemptRate: body?.attemptRate ?? 0,
    avgTime: body?.avgTime ?? 0,
    incorrect: body?.incorrect ?? 0,
    skipped: body?.skipped ?? 0,
    attempted: body?.attempted ?? body?.questionAttempts?.filter?.((q) => q.selectedAnswer != null)?.length ?? null,
    questions: body?.questionAttempts?.length ?? 0,
    startedAt: body?.startedAt ?? null,
    submittedAt: new Date().toISOString(),
    mode: body?.kind === 'retest' ? 'intervention-retest' : 'intervention-practice',
  }
  const attempts = readPractice()
  attempts.push(attempt)
  writePractice(attempts)

  const overrides = readStatus()
  const current = overrides[iv.id] ?? {}
  if (attempt.kind === 'practice') {
    if (current.status === 'Assigned') { current.status = 'In Progress' }
    if (current.status === 'In Progress') { current.status = 'Completed'; current.completedAt = new Date().toISOString() }
  } else {
    /* re-test attempt → evaluate */
    if (current.status === 'Re-test Pending' || current.status === 'Evaluating') {
      const retestAttempts = attempts.filter((p) => p.kind === 'retest' && p.interventionId === iv.id)
      const eff = computeEffectiveness({ baseline: iv.baseline, practiceAttempts: attempts.filter((p) => p.kind === 'practice' && p.interventionId === iv.id), retestAttempts })
      current.status = 'Evaluating'
      if (eff.completed && eff.outcome !== 'Pending' && ['Resolved', 'Improving', 'Persistent'].includes(eff.outcome)) {
        current.status = eff.outcome
        current.evaluatedAt = new Date().toISOString()
        current.effectiveness = eff
      }
    }
  }
  current.updatedAt = new Date().toISOString()
  overrides[iv.id] = current
  writeStatus(overrides)
  return { ok: true, attempt, status: current.status }
})

defineRoute('get', '/student/interventions/:id/retest', async ({ params }) => {
  const retests = readRetests()
  const retest = retests.find((r) => r.interventionId === params.id)
  if (!retest) {
    const err = new Error('No re-test assigned for this intervention.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const { studentIds: _privateStudentIds, ...studentSafeRetest } = retest
  return { retest: studentSafeRetest }
})
