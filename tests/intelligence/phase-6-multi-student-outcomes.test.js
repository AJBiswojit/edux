import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  canTransition, computeEffectiveness, computeGroupEffectiveness,
  matchInterventionExamAttempts, metricsFromCanonicalAttempt,
  sameInterventionTarget, selectPracticeQuestions,
} from '../../src/intelligence/faculty/engine/index.js'
import { installTestStorage, initApi, makeHelpers } from '../setup/api.js'
import { canonicalExamAttempt as canonicalAttempt } from '../fixtures/attempts.js'

/**
 * Multi-student intervention + canonical ExamAttempt outcomes.
 * Logic/API coverage follows the 25 requested areas. No DOM, random data,
 * backend, second store, or second lifecycle is used.
 */
const { storage, clear } = installTestStorage()

let server
let groups
let jeeGroup
let neetGroup
let universityGroup
let get
let post
let fail

beforeAll(async () => {
  server = await initApi()
  ;({ get, post, fail } = makeHelpers(server))
  const payload = await get('/faculty/similar-issues')
  groups = payload.groups
  jeeGroup = groups.find((group) => group.examFamily === 'JEE' && group.students.length >= 2)
  neetGroup = groups.find((group) => group.examFamily === 'NEET' && group.students.length >= 2)
  universityGroup = groups.find((group) => group.domain === 'University' && group.students.length >= 2)
})

beforeEach(() => clear())

const config = (overrides = {}) => ({
  count: 1, difficulty: 'Mixed', questionType: 'Any',
  pyqPreference: 'Preferred', selectionLevel: 'subject', ...overrides,
})

async function createFor(group, studentIds, overrides = {}) {
  return post(`/faculty/similar-issues/${group.id}/interventions`, {
    studentIds,
    title: `${group.chapter} Recovery`, priority: group.priority,
    objective: `Improve ${group.chapter} accuracy.`,
    practiceConfig: config(overrides),
    notes: 'Faculty-reviewed prototype plan.',
  })
}

async function assign(interventionId) {
  await post(`/faculty/interventions/${interventionId}/status`, { status: 'Approved' })
  await post(`/faculty/interventions/${interventionId}/status`, { status: 'Planned' })
  await post(`/faculty/interventions/${interventionId}/assign`, {})
}

const target = (extra = {}) => ({
  id: 'iv-a', interventionId: 'iv-a', studentId: 'student-a', studentIds: ['student-a'],
  domain: 'Competitive', examFamily: 'JEE', subject: 'Physics', chapter: 'Rotational Motion',
  createdAt: '2026-08-20T10:00:00.000Z', ...extra,
})

describe('1-10. selection, isolation, evidence, availability, and per-student creation', () => {
  it('1. multi-student selection exposes only group members and defaults eligible members', async () => {
    const data = await get(`/faculty/similar-issues/${jeeGroup.id}/intervention-preflight`, config())
    expect(data.students.map((s) => s.studentId)).toEqual(jeeGroup.students.map((s) => s.studentId))
    expect(data.students.every((s) => s.selectableByDefault)).toBe(true)
  })

  it('2. rejects cross-group/domain selection without inferring from subject names', async () => {
    const outsider = neetGroup.students.find((student) => !jeeGroup.students.some((member) => member.studentId === student.studentId))
    const result = await createFor(jeeGroup, [outsider.studentId])
    expect(result.createdCount).toBe(0)
    expect(result.skipped[0].reason).toContain('does not belong')
  })

  it('3. marks an existing active intervention and excludes it by default', async () => {
    const member = jeeGroup.students[0]
    await createFor(jeeGroup, [member.studentId])
    const data = await get(`/faculty/similar-issues/${jeeGroup.id}/intervention-preflight`, config())
    const row = data.students.find((student) => student.studentId === member.studentId)
    expect(row.existingIntervention.status).toBe('Recommended')
    expect(row.selectableByDefault).toBe(false)
    expect(row.exclusionReason).toContain('Existing active intervention')
  })

  it('4. group evidence is aggregated inside the canonical partition', async () => {
    const data = await get(`/faculty/similar-issues/${neetGroup.id}/evidence`)
    expect(data.summary.evidenceQuestions).toBe(data.rows.length)
    expect(data.rows.every((row) => row.domain === 'competitive' && row.examFamily === 'NEET')).toBe(true)
    expect(data.rows.every((row) => row.subject === neetGroup.subject && row.chapter === neetGroup.chapter)).toBe(true)
  })

  it('5. student evidence remains individually attributable for the shared dialog', async () => {
    const data = await get(`/faculty/similar-issues/${universityGroup.id}/evidence`)
    const member = data.students[0]
    expect(member.rows.every((row) => row.studentId === member.studentId)).toBe(true)
    expect(member.evidenceCount).toBe(member.rows.length)
  })

  it('6. practice availability reports actual available/required/shortfall values', async () => {
    const data = await get(`/faculty/similar-issues/${jeeGroup.id}/intervention-preflight`, config({ count: 4 }))
    const available = data.practiceAvailability
    expect(available.requiredQuestions).toBe(4)
    expect(available.shortfall).toBe(Math.max(0, 4 - available.availableQuestions))
  })

  it('7. an insufficient pool is explicit and creation never silently reduces count', async () => {
    const exact = await get(`/faculty/similar-issues/${jeeGroup.id}/intervention-preflight`, config({ count: 30, selectionLevel: 'exact' }))
    expect(exact.practiceAvailability.insufficient).toBe(true)
    const error = await fail(() => createFor(jeeGroup, [jeeGroup.students[0].studentId], { count: 30, selectionLevel: 'exact' }))
    expect(error.response.data.message).toBe('Not enough questions match this configuration.')
    expect(error.response.data.requiredQuestions).toBe(30)
  })

  it('8. creates one persisted intervention record per selected student', async () => {
    const selected = jeeGroup.students.slice(0, 2).map((student) => student.studentId)
    const result = await createFor(jeeGroup, selected)
    expect(result.createdCount).toBe(2)
    expect(new Set(result.created.map((item) => item.interventionId)).size).toBe(2)
    const store = JSON.parse(storage.getItem('EduX_faculty_interventions'))
    result.created.forEach((item) => {
      expect(store[item.interventionId].studentId).toBe(item.studentId)
      expect(store[item.interventionId].studentIds).toEqual([item.studentId])
      expect(store[item.interventionId].source).toBe('Similar Issues')
      expect(store[item.interventionId].status).toBe('Recommended')
    })
  })

  it('9. partial creation returns created and skipped students with reasons', async () => {
    const [existing, fresh] = neetGroup.students.slice(0, 2)
    await createFor(neetGroup, [existing.studentId])
    const result = await createFor(neetGroup, [existing.studentId, fresh.studentId])
    expect(result.createdCount).toBe(1)
    expect(result.skippedCount).toBe(1)
    expect(result.skipped[0].reason).toBe('Existing active intervention')
  })

  it('10. duplicate prevention produces no second record', async () => {
    const member = universityGroup.students[0]
    const first = await createFor(universityGroup, [member.studentId])
    const second = await createFor(universityGroup, [member.studentId])
    expect(first.createdCount).toBe(1)
    expect(second.createdCount).toBe(0)
    expect(JSON.parse(storage.getItem('EduX_faculty_interventions'))).toHaveProperty(first.created[0].interventionId)
  })
})

describe('11-13. Student 360, practice, and re-test linkage', () => {
  it('11. Student 360 immediately receives the Similar Issue record', async () => {
    const member = jeeGroup.students[0]
    const created = await createFor(jeeGroup, [member.studentId])
    const data = await get(`/faculty/students/${member.studentId}/interventions`)
    const item = data.items.find((iv) => iv.id === created.created[0].interventionId)
    expect(item).toMatchObject({ studentId: member.studentId, source: 'Similar Issues', status: 'Recommended', practiceStatus: 'Not started', retestStatus: 'Not created' })
  })

  it('12. practice attempts preserve interventionId and studentId', async () => {
    const member = neetGroup.students[0]
    const created = await createFor(neetGroup, [member.studentId])
    const interventionId = created.created[0].interventionId
    await assign(interventionId)
    const practice = await get(`/student/interventions/${interventionId}/practice`)
    expect(practice.insufficient).toBe(false)
    const submitted = await post(`/student/interventions/${interventionId}/practice-attempts`, {
      studentId: member.studentId, kind: 'practice', accuracy: 70, avgTime: 65,
      incorrect: 0, skipped: 0, questionAttempts: [{ questionId: practice.questions[0].id, selectedAnswer: 0 }],
    })
    expect(submitted.attempt).toMatchObject({ interventionId, studentId: member.studentId, kind: 'practice' })
  })

  it('13. re-tests and re-test attempts preserve both linkage keys', async () => {
    const member = jeeGroup.students[0]
    const created = await createFor(jeeGroup, [member.studentId])
    const interventionId = created.created[0].interventionId
    await assign(interventionId)
    const practice = await get(`/student/interventions/${interventionId}/practice`)
    await post(`/student/interventions/${interventionId}/practice-attempts`, {
      studentId: member.studentId, kind: 'practice', accuracy: 60, avgTime: 70,
      incorrect: 0, questionAttempts: [{ questionId: practice.questions[0].id, selectedAnswer: 0 }],
    })
    const retest = await post(`/faculty/interventions/${interventionId}/retest`, {
      count: 1, difficulty: 'Mixed', level: 'subject', studentIds: [member.studentId],
    })
    expect(retest.retest).toMatchObject({ interventionId, studentId: member.studentId })
    const submitted = await post(`/student/interventions/${interventionId}/practice-attempts`, {
      studentId: member.studentId, kind: 'retest', accuracy: 80, avgTime: 55,
      incorrect: 0, questionAttempts: [{ questionId: retest.retest.questions[0].id, selectedAnswer: 0 }],
    })
    expect(submitted.attempt).toMatchObject({ interventionId, studentId: member.studentId, kind: 'retest' })
  })
})

describe('14-20. canonical ExamAttempt matching and before/after intelligence', () => {
  it('14. matches a subsequent canonical ExamAttempt by strict context', () => {
    const matches = matchInterventionExamAttempts({ intervention: target(), attempts: [canonicalAttempt({})] })
    expect(matches).toHaveLength(1)
    expect(matches[0].metrics.attemptId).toBe('exam-after-1')
  })

  it('15. explicit interventionId is preferred over contextual fallback', () => {
    const fallback = canonicalAttempt({ id: 'fallback', submittedAt: '2026-08-25T10:00:00.000Z' })
    const explicit = canonicalAttempt({ id: 'explicit', interventionId: 'iv-a', submittedAt: '2026-09-02T10:00:00.000Z' })
    const matches = matchInterventionExamAttempts({ intervention: target(), attempts: [fallback, explicit] })
    expect(matches.map((item) => item.metrics.attemptId)).toEqual(['explicit'])
    expect(matches[0].matchType).toBe('explicit-intervention-id')
  })

  it('16. contextual fallback requires student+domain+family+subject+chapter+chronology', () => {
    const valid = canonicalAttempt({ id: 'valid' })
    const wrongStudent = canonicalAttempt({ id: 'wrong-student', studentId: 'student-b' })
    const before = canonicalAttempt({ id: 'before', submittedAt: '2026-08-01T10:00:00.000Z' })
    expect(matchInterventionExamAttempts({ intervention: target(), attempts: [valid, wrongStudent, before] }).map((m) => m.metrics.attemptId)).toEqual(['valid'])
  })

  it('17. never matches JEE Physics with NEET Physics', () => {
    const neet = canonicalAttempt({ id: 'neet', examFamily: 'NEET' })
    expect(matchInterventionExamAttempts({ intervention: target(), attempts: [neet] })).toEqual([])
    expect(sameInterventionTarget(target(), { ...target(), examFamily: 'NEET' })).toBe(false)
  })

  it('18. University context never matches Competitive context', () => {
    const university = target({ domain: 'University', examFamily: null, subject: 'Data Structures & Algorithms', chapter: 'Graph Algorithms' })
    const competitive = canonicalAttempt({ subject: university.subject, chapter: university.chapter })
    expect(matchInterventionExamAttempts({ intervention: university, attempts: [competitive] })).toEqual([])
  })

  it('19. calculates real before/after deltas including accuracy, time, incorrect, and skipped', () => {
    const effectiveness = computeEffectiveness({
      baseline: { accuracy: 50, avgTime: 80, incorrect: 5, skipped: 2, questions: 10 },
      practiceAttempts: [{ accuracy: 70, avgTime: 65, incorrect: 2, skipped: 1, questions: 10 }],
      retestAttempts: [{ accuracy: 82, avgTime: 60, incorrect: 2, skipped: 0, questions: 10 }],
    })
    expect(effectiveness.deltas).toEqual({ accuracyDelta: 32, timeDelta: 20, errorDelta: 3, skippedDelta: 2 })
    expect(effectiveness.outcome).toBe('Resolved')
  })

  it('20. keeps unavailable metrics as null/N/A-ready instead of inventing values', () => {
    const metrics = metricsFromCanonicalAttempt(canonicalAttempt({ correct: 0, incorrect: 0, skipped: 2 }), target())
    expect(metrics.accuracy).toBeNull()
    expect(metrics.avgTime).toBeNull()
    const effectiveness = computeEffectiveness({ baseline: { accuracy: null }, retestAttempts: [{ accuracy: 80 }] })
    expect(effectiveness.completed).toBe(false)
    expect(effectiveness.deltas).toBeNull()
  })
})

describe('21-25. effectiveness, privacy, and regressions', () => {
  it('21. reuses the five existing individual effectiveness labels', () => {
    const evaluate = (baseline, accuracy, avgTime = 70) => computeEffectiveness({ baseline, retestAttempts: [{ accuracy, avgTime, incorrect: 2 }] }).outcome
    expect(evaluate({ accuracy: 50, avgTime: 90, incorrect: 5 }, 80, 70)).toBe('Resolved')
    expect(evaluate({ accuracy: 50, avgTime: 90, incorrect: 5 }, 65)).toBe('Improving')
    expect(evaluate({ accuracy: 50, avgTime: 90, incorrect: 5 }, 58)).toBe('Partially Effective')
    expect(evaluate({ accuracy: 65, avgTime: 90, incorrect: 5 }, 68)).toBe('No Significant Change')
    expect(evaluate({ accuracy: 50, avgTime: 90, incorrect: 5 }, 52)).toBe('Persistent')
  })

  it('22. group effectiveness keeps individuals and averages only available deltas', () => {
    const outcome = computeGroupEffectiveness([
      { id: 'a', studentId: 'a', status: 'Resolved', effectiveness: { completed: true, outcome: 'Resolved', retest: {}, deltas: { accuracyDelta: 20, timeDelta: 8 } } },
      { id: 'b', studentId: 'b', status: 'Improving', effectiveness: { completed: true, outcome: 'Improving', retest: {}, deltas: { accuracyDelta: 10, timeDelta: 4 } } },
      { id: 'c', studentId: 'c', status: 'Recommended', effectiveness: { completed: false, outcome: 'Pending', deltas: null } },
    ])
    expect(outcome).toMatchObject({ label: 'Prototype group outcome', received: 3, resolved: 1, improving: 1, averageAccuracyChange: 15, averageTimeChange: 6 })
    expect(outcome.individuals).toHaveLength(3)
  })

  it('23. student payload excludes group membership, peer data, averages, and faculty notes', async () => {
    const member = jeeGroup.students[0]
    const result = await createFor(jeeGroup, [member.studentId])
    await assign(result.created[0].interventionId)
    const payload = await get('/student/interventions', { studentId: member.studentId })
    const item = payload.items.find((iv) => iv.id === result.created[0].interventionId)
    expect(item.studentId).toBe(member.studentId)
    for (const privateKey of ['students', 'studentIds', 'allGroupStudentIds', 'groupId', 'issueGroupId', 'evidence', 'notes', 'source']) {
      expect(item).not.toHaveProperty(privateKey)
    }
  })

  it('24. existing lifecycle transition validation remains unchanged', () => {
    expect(canTransition('Recommended', 'Approved')).toBe(true)
    expect(canTransition('Recommended', 'Resolved')).toBe(false)
    expect(canTransition('Planned', 'Assigned')).toBe(true)
  })

  it('25. Phase 5 Student 360 evidence-action creation still enters the same store/lifecycle', async () => {
    const result = await post('/faculty/students/fs_jee_a_03/interventions', {
      domain: 'Competitive', examFamily: 'JEE', subject: 'Physics', chapter: 'Rotational Motion',
      issueType: 'Performance Gap', priority: 'High', objective: 'Improve accuracy.',
      practiceConfig: { count: 1, difficulty: 'Mixed', pyqPreference: 'Yes', selectionLevel: 'subject' },
    })
    expect(result.intervention).toMatchObject({ source: 'Student 360', status: 'Recommended', studentId: 'fs_jee_a_03' })
    const store = JSON.parse(storage.getItem('EduX_faculty_interventions'))
    expect(store[result.intervention.id].s360Group).toBeTruthy()
  })

  it('connects the API outcome to an actual stored canonical attempt ID', async () => {
    const member = jeeGroup.students[0]
    const result = await createFor(jeeGroup, [member.studentId])
    const interventionId = result.created[0].interventionId
    storage.setItem('EduX_student_exam_attempts', JSON.stringify([
      canonicalAttempt({
        id: 'stored-post-exam', studentId: member.studentId, interventionId,
        domain: 'Competitive', examFamily: 'JEE', subject: jeeGroup.subject, chapter: jeeGroup.chapter,
      }),
    ]))
    const detail = await get(`/faculty/interventions/${interventionId}`)
    expect(detail.intervention.postExam).toMatchObject({ attemptId: 'stored-post-exam', studentId: member.studentId, interventionId, matchType: 'explicit-intervention-id' })
    expect(detail.intervention.effectiveness.comparisonBasis).toBe('Exam Agent')
    const analysis = await get(`/faculty/students/${member.studentId}/exams/stored-post-exam/analysis`)
    expect(analysis).toBeTruthy()
  })
})
