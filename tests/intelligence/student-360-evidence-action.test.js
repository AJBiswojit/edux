import { beforeAll, describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * PHASE 5 — STUDENT 360 EVIDENCE → ACTION HARDENING test suite.
 *
 * Logic-level coverage (engine + mock API, no DOM):
 *   1.  duplicate test consolidation (canonical file present, duplicate gone)
 *   2.  individual issue detection (buildIndividualIssue from fingerprints)
 *   3.  grouped vs individual issue separation
 *   4-6. University / JEE / NEET isolation for individual issues + creation
 *   7.  evidence question retrieval (real canonical rows per issue)
 *   8.  empty evidence behavior
 *   9.  subject → chapter drilldown (derived metrics)
 *   10. chapter → evidence questions
 *   11. weakness → recommendation (existing engine reuse)
 *   12. recommendation → intervention creation (existing lifecycle)
 *   13. intervention payload integrity (§12 fields)
 *   14. existing intervention lifecycle preservation (valid/invalid transitions)
 *   15. URL state helpers (?context=&tab=&subject=&chapter=)
 *   16. no unsupported AI claims (deterministic, data-grounded why-detected)
 */
import {
  computeStudent360,
  computeStudentIssueFingerprints,
  groupSimilarIssues,
  buildIndividualIssue,
  buildIndividualWhyDetected,
  canTransition,
} from '../../src/intelligence/faculty/engine/index.js'
import { generateInterventionRecommendation } from '../../src/intelligence/faculty/engine/ground-level-intelligence.js'
import { domainPool, domainSwPool, evidenceRowsFor, issueMatchesDomain } from '../../src/components/students-workspace/student-360-panels.jsx'
import { chapterIsActionable } from '../../src/components/students-workspace/student-intelligence-tabs.jsx'
import { EVIDENCE_EMPTY_MESSAGE, filterEvidenceRows } from '../../src/components/students-workspace/student-evidence.jsx'
import {
  DOMAIN_PARAM, DOMAIN_TO_PARAM, readContextParam, readTabParam,
  build360SearchParams, student360Url,
} from '../../src/utils/student-360-url.js'

/* ---------- localStorage shim (mock handlers persist via window.localStorage) ---------- */
const mem = new Map()
const storage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
}
globalThis.window = { localStorage: storage }
globalThis.localStorage = storage

let server
const get = (url, params = {}) => server.handleMockRequest({ method: 'get', url, params }).then((r) => r.data)
const post = (url, data, params = {}) => server.handleMockRequest({ method: 'post', url, data, params }).then((r) => r.data)
const failing = async (fn) => {
  try {
    await fn()
  } catch (e) {
    return e
  }
  throw new Error('expected the request to fail')
}

beforeAll(async () => {
  await import('../../src/api/mock-routes.js')
  await import('../../src/api/mock-routes-extra.js')
  await import('../../src/api/mock-routes-intelligence.js')
  await import('../../src/api/mock-routes-faculty-intelligence.js')
  await import('../../src/api/mock-routes-admin-intelligence.js')
  await import('../../src/api/mock-routes-exam-agent.js')
  await import('../../src/api/mock-routes-faculty-students.js')
  await import('../../src/api/mock-routes-faculty-interventions.js')
  await import('../../src/api/mock-routes-question-studio.js')
  server = await import('../../src/api/mock-server.js')
  server.setMockLatency([0, 0])
})

/* ---------- shared fixtures (canonical attempt contract) ---------- */
const student = { id: 'fixture-student', roll: 'FIX-001', name: 'Fixture Student', batchId: 'fixture-batch' }
const studentB = { id: 'fixture-student-b', roll: 'FIX-002', name: 'Fixture Student B', batchId: 'fixture-batch' }

function attempt({ id, examMode, examFamily = null, subject, chapter, topic = chapter, outcomes, submittedAt }) {
  return {
    id,
    studentId: student.id,
    roll: student.roll,
    mode: 'manual',
    examMode,
    examFamily,
    examType: examFamily,
    category: examMode,
    examId: id,
    examName: id,
    submittedAt: submittedAt ?? `2026-08-${String(Number(id.slice(-2)) || 1).padStart(2, '0')}T10:00:00.000Z`,
    scoring: { pct: 50, accuracy: 50, attemptRate: 100 },
    questionAttempts: outcomes.map((o, index) => ({
      questionId: `${id}-q${index + 1}`,
      academicContext: { subject, chapter, topic },
      question: { difficulty: o.diff ?? 'Medium', marks: 4, type: 'MCQ', correctAnswer: 0, text: `${chapter} q${index + 1}` },
      response: {
        selectedAnswer: o.skipped ? null : (o.correct ? 0 : 1),
        status: o.skipped ? 'skipped' : 'answered',
        answerChanges: o.changes ?? 0,
        markedForReview: !!o.marked,
      },
      timing: { timeSpent: o.time ?? 60 },
      behaviour: { visits: o.visits ?? 1 },
      evaluation: {
        isCorrect: !!o.correct,
        isSkipped: !!o.skipped,
        classification: o.classification ?? null,
      },
    })),
  }
}

const jeeWeak = attempt({
  id: 'jee-02', examMode: 'Competitive', examFamily: 'JEE',
  subject: 'Physics', chapter: 'Rotational Motion',
  outcomes: [
    { correct: false, time: 25 }, { correct: false, time: 110 }, { correct: true, time: 90 },
  ],
})
const jeeWeak2 = attempt({
  id: 'jee-03', examMode: 'Competitive', examFamily: 'JEE', subject: 'Physics', chapter: 'Rotational Motion',
  submittedAt: '2026-08-20T10:00:00.000Z',
  outcomes: [
    { correct: false, time: 25 }, { correct: false, time: 110 }, { correct: false, time: 60 },
  ],
})
const jeeSolo = attempt({
  id: 'jee-04', examMode: 'Competitive', examFamily: 'JEE',
  subject: 'Mathematics', chapter: 'Calculus',
  outcomes: [{ correct: false, time: 120 }, { correct: false, time: 130 }, { correct: false, time: 60 }],
})
const neetSolo = attempt({
  id: 'neet-05', examMode: 'Competitive', examFamily: 'NEET',
  subject: 'Biology', chapter: 'Human Physiology',
  outcomes: [{ correct: false, time: 120 }, { skipped: true, time: 0 }, { correct: false, time: 60 }],
})
const uniS0 = attempt({
  id: 'uni-01', examMode: 'University', subject: 'CS501', chapter: 'Graph Algorithms',
  outcomes: [{ correct: false, time: 100 }, { correct: false, time: 110 }],
})
const uniSolo = attempt({
  id: 'uni-02', examMode: 'University', subject: 'CS501', chapter: 'Graph Algorithms',
  submittedAt: '2026-08-18T10:00:00.000Z',
  outcomes: [{ correct: false, time: 100 }, { correct: false, time: 110 }],
})
const allAttempts = [jeeWeak, jeeWeak2, jeeSolo, neetSolo, uniS0, uniSolo]

/* student B shares the JEE Physics Rotational Motion partition with a
   similar issue → a REAL ≥2-student group; A's other chapters stay individual. */
const bWeak = attempt({
  id: 'bjee-02', examMode: 'Competitive', examFamily: 'JEE',
  subject: 'Physics', chapter: 'Rotational Motion',
  outcomes: [{ correct: false, time: 30 }, { correct: false, time: 115 }, { correct: true, time: 80 }],
})
const bWeak2 = attempt({
  id: 'bjee-03', examMode: 'Competitive', examFamily: 'JEE', subject: 'Physics', chapter: 'Rotational Motion',
  submittedAt: '2026-08-21T10:00:00.000Z',
  outcomes: [{ correct: false, time: 20 }, { correct: false, time: 105 }, { correct: false, time: 55 }],
})
const bAttempts = [bWeak, bWeak2]

const fingerprintsFor = (attempts) => computeStudentIssueFingerprints(student, attempts)
const allFingerprints = [...computeStudentIssueFingerprints(student, allAttempts), ...computeStudentIssueFingerprints(studentB, bAttempts)]
const s360 = computeStudent360({ student, attempts: allAttempts })

/* ================================================================ */

describe('1. duplicate test consolidation', () => {
  it('the canonical domain-isolation suite exists and the Phase 4 duplicate was removed', () => {
    const here = fileURLToPath(import.meta.url)
    const canonical = new URL('../../tests/intelligence/student-360-domain-isolation.test.js', import.meta.url).pathname
    expect(existsSync(canonical)).toBe(true)
    expect(canonical).not.toBe(here)
    const duplicate = new URL('../../test/student-360-domain-isolation.test.js', import.meta.url).pathname
    expect(existsSync(duplicate)).toBe(false)
    const fixture = new URL('../../test/fixtures/intelligence-attempts.js', import.meta.url).pathname
    expect(existsSync(fixture)).toBe(false)
  })

  it('the consolidated suite still covers every required isolation surface', async () => {
    const src = await import('node:fs').then((fs) => fs.readFileSync(
      new URL('../../tests/intelligence/student-360-domain-isolation.test.js', import.meta.url).pathname, 'utf8'))
    for (const marker of [
      'University plus JEE', 'University plus NEET', 'DNA evidence', 'cross-domain',
      'Similar Issues partition', 'individual', 'comparison',
    ]) {
      expect(src).toContain(marker)
    }
  })
})

describe('2. individual issue detection', () => {
  it('derives individual issues from fingerprints with whyDetected, priority and evidence counts', () => {
    const fps = fingerprintsFor([jeeSolo, neetSolo, uniSolo])
    expect(fps.length).toBeGreaterThan(0)
    const issue = buildIndividualIssue(fps[0])
    for (const key of ['studentId', 'domain', 'examFamily', 'subject', 'chapter', 'issueType', 'severity', 'priority', 'accuracy', 'avgTime', 'trend', 'whyDetected', 'evidenceQuestionCount', 'evidence']) {
      expect(issue).toHaveProperty(key)
    }
    expect(issue.whyDetected).toMatch(/\.$/)
    expect(issue.evidenceQuestionCount).toBeGreaterThan(0)
    expect(issue.grouped).toBe(false)
  })

  it('reuses the existing fingerprint fields — no second classifier', () => {
    const fp = fingerprintsFor([jeeSolo])[0]
    const issue = buildIndividualIssue(fp)
    expect(issue.issueType).toBe(fp.issueType)
    expect(issue.severity).toBe(fp.severity)
    expect(issue.accuracy).toBe(fp.accuracy)
    expect(issue.trend).toBe(fp.trend)
  })
})

describe('3. grouped vs individual issue separation', () => {
  it('a shared partition becomes a group; unique partitions stay individual', () => {
    const { groups, individuals } = groupSimilarIssues(allFingerprints)
    expect(groups.length).toBeGreaterThan(0)
    expect(individuals.length).toBeGreaterThan(0)
    const rotGroup = groups.find((g) => g.subject === 'Physics' && g.chapter === 'Rotational Motion')
    expect(rotGroup).toBeTruthy()
    expect(rotGroup.studentCount).toBe(2)
    const groupKeys = groups.map((g) => `${g.domain}|${g.examFamily ?? 'uni'}|${g.subject}|${g.chapter}`)
    const individualKeys = individuals.map((f) => `${f.domain}|${f.examFamily ?? 'uni'}|${f.subject}|${f.chapter}`)
    individualKeys.forEach((k) => expect(groupKeys).not.toContain(k))
  })

  it('similar-issues API returns BOTH shapes, individuals enriched with whyDetected + priority', async () => {
    const data = await get('/faculty/similar-issues')
    expect(Array.isArray(data.groups)).toBe(true)
    expect(Array.isArray(data.individuals)).toBe(true)
    data.individuals.forEach((f) => {
      expect(f.whyDetected).toBeTruthy()
      expect(['Critical', 'High', 'Medium', 'Low']).toContain(f.priority)
    })
  })
})

describe('4-6. University / JEE / NEET isolation of individual issues', () => {
  const fps = fingerprintsFor(allAttempts)
  const issues = fps.map((f) => buildIndividualIssue(f))

  it('every issue carries domain + examFamily + subject + chapter (never inferred from subject names)', () => {
    issues.forEach((i) => {
      expect(['University', 'Competitive']).toContain(i.domain)
      if (i.domain === 'University') expect(i.examFamily).toBeNull()
      else expect(['JEE', 'NEET']).toContain(i.examFamily)
      expect(i.subject).toBeTruthy()
      expect(i.chapter).toBeTruthy()
    })
  })

  it('the domain filter never mixes University, JEE and NEET issues', () => {
    expect(issues.filter((i) => issueMatchesDomain(i, 'University')).every((i) => i.domain === 'University')).toBe(true)
    expect(issues.filter((i) => issueMatchesDomain(i, 'JEE')).every((i) => i.domain === 'Competitive' && i.examFamily === 'JEE')).toBe(true)
    expect(issues.filter((i) => issueMatchesDomain(i, 'NEET')).every((i) => i.domain === 'Competitive' && i.examFamily === 'NEET')).toBe(true)
    const uni = issues.filter((i) => issueMatchesDomain(i, 'University')).map((i) => i.subject)
    expect(uni).toEqual(['CS501']) // JEE/NEET Physics never leaks into University
  })

  it('Physics exists in JEE but NEET issues stay Biology-only here (same-named chapters never merge)', () => {
    const jeeSubjects = issues.filter((i) => issueMatchesDomain(i, 'JEE')).map((i) => i.subject).sort()
    const neetSubjects = issues.filter((i) => issueMatchesDomain(i, 'NEET')).map((i) => i.subject).sort()
    expect(jeeSubjects).toContain('Physics')
    expect(neetSubjects).toEqual(['Biology'])
  })
})

describe('7. evidence question retrieval', () => {
  it('each issue resolves to the student’s REAL canonical question rows (with text + answers)', () => {
    const rows = evidenceRowsFor(s360, 'JEE', 'Physics', 'Rotational Motion')
    expect(rows.length).toBeGreaterThan(0)
    rows.forEach((r) => {
      expect(r.subject).toBe('Physics')
      expect(r.chapter).toBe('Rotational Motion')
      expect(r.examFamily).toBe('JEE')
      expect(r.text).toMatch(/Rotational Motion q\d/)
      expect(r.correctAnswer).toBe(0)
    })
  })

  it('rows carry status, time, answer changes, revisits and student answer', () => {
    const rows = evidenceRowsFor(s360, 'NEET', 'Biology', 'Human Physiology')
    expect(rows.length).toBeGreaterThan(0)
    rows.forEach((r) => {
      for (const key of ['status', 'timeSpent', 'answerChanges', 'revisits', 'selected', 'correctAnswer', 'difficulty', 'type']) {
        expect(r).toHaveProperty(key)
      }
    })
    expect(rows.some((r) => r.status === 'Skipped')).toBe(true)
  })
})

describe('8. empty evidence behavior', () => {
  it('an unknown chapter yields zero rows and the canonical empty message exists', () => {
    expect(evidenceRowsFor(s360, 'JEE', 'Physics', 'No Such Chapter')).toEqual([])
    expect(EVIDENCE_EMPTY_MESSAGE).toBe('No question-level evidence available.')
  })

  it('the shared dialog filter handles empty input and status partitions', () => {
    expect(filterEvidenceRows([])).toEqual([])
    const rows = evidenceRowsFor(s360, 'JEE', 'Physics', 'Rotational Motion')
    expect(filterEvidenceRows(rows, { status: 'All' })).toHaveLength(rows.length)
    expect(filterEvidenceRows(rows, { status: 'Incorrect' }).every((r) => r.status === 'Incorrect')).toBe(true)
    expect(filterEvidenceRows(rows, { status: 'Slow' }).every((r) => r.timeSpent >= 90)).toBe(true)
  })

  it('creation is rejected with a readable error when no question-level evidence exists', async () => {
    const err = await failing(() => post('/faculty/students/fs_jee_a_03/interventions', {
      domain: 'JEE', subject: 'Physics', chapter: 'Chapter That Does Not Exist', examFamily: 'JEE',
    }))
    expect(err.response.status).toBe(400)
    expect(err.message).toContain('No question-level evidence available')
  })
})

describe('9. subject → chapter drilldown', () => {
  it('subject pools summarize; chapter pools carry the full derived metrics', () => {
    const jeeSubjects = domainPool(s360, 'JEE', 'subjects')
    const jeeChapters = domainPool(s360, 'JEE', 'chapters')
    expect(jeeSubjects.length).toBeGreaterThan(0)
    jeeChapters.forEach((c) => {
      for (const key of ['chapter', 'subject', 'accuracy', 'attempts', 'correct', 'incorrect', 'skipped', 'avgTime', 'trend', 'priority', 'evidence']) {
        expect(c).toHaveProperty(key)
      }
    })
  })

  it('chapter actionability is derived from the engine metrics (weak/declining/priority)', () => {
    const weak = domainPool(s360, 'JEE', 'chapters').find((c) => c.accuracy < 50)
    expect(weak).toBeTruthy()
    expect(chapterIsActionable(weak)).toBe(true)
  })

  it('drilldown stays domain-isolated (University chapters never inside the JEE pool)', () => {
    const jeeChapters = domainPool(s360, 'JEE', 'chapters').map((c) => c.chapter)
    expect(jeeChapters).not.toContain('Graph Algorithms')
    const uniChapters = domainPool(s360, 'University', 'chapters').map((c) => c.chapter)
    expect(uniChapters).toEqual(['Graph Algorithms'])
  })
})

describe('10. chapter → evidence questions', () => {
  it('every actionable chapter resolves real evidence rows in its own domain', () => {
    const chapters = [...domainPool(s360, 'JEE', 'chapters'), ...domainPool(s360, 'NEET', 'chapters'), ...domainPool(s360, 'University', 'chapters')]
    const actionable = chapters.filter((c) => chapterIsActionable(c))
    expect(actionable.length).toBeGreaterThan(0)
    actionable.forEach((c) => {
      const domain = c.domain === 'university' ? 'University' : c.domain
      const rows = evidenceRowsFor(s360, domain, c.subject, c.chapter)
      expect(rows.length).toBe(c.questions)
    })
  })
})

describe('11. weakness → recommendation (existing engine reuse)', () => {
  it('a weakness derives a full recommendation from its actual rows (no side effects)', () => {
    const { weaknesses } = domainSwPool(s360, 'JEE')
    expect(weaknesses.length).toBeGreaterThan(0)
    const w = weaknesses[0]
    const rows = evidenceRowsFor(s360, 'JEE', w.subject, w.chapter)
    const rec = generateInterventionRecommendation(rows, { subject: w.subject, chapter: w.chapter })
    expect(rec).toBeTruthy()
    expect(rec.issueType).not.toBe('Strong Performance')
    expect(rec.practiceConfig.questionCount).toBeGreaterThan(0)
    expect(rec.practiceConfig.difficultyProgression).toBeTruthy()
    expect(rec.stats.questions).toBe(rows.length)
    expect(rec.evidence.length).toBeGreaterThan(0)
  })
})

describe('12-13. recommendation → intervention creation + payload integrity (existing lifecycle)', () => {
  let created = null
  const studentId = 'fs_jee_a_03'

  it('creates a JEE intervention from a real weakness via the existing lifecycle storage', async () => {
    const bundle = await get(`/faculty/students/${studentId}/360`)
    const weaknesses = bundle.strengthsWeaknesses?.competitive?.JEE?.weaknesses ?? []
    expect(weaknesses.length).toBeGreaterThan(0)
    const w = weaknesses[0]
    const res = await post(`/faculty/students/${studentId}/interventions`, {
      title: `${w.chapter} Accuracy Recovery`,
      domain: 'Competitive',
      examFamily: 'JEE',
      subject: w.subject,
      chapter: w.chapter,
      issueType: 'Low Accuracy',
      priority: 'High',
      objective: `Improve accuracy on ${w.chapter} problems.`,
      practiceConfig: { count: 15, difficulty: 'Mixed', pyqPreference: 'Yes' },
      notes: 'Created during Phase 5 verification.',
    })
    expect(res.ok).toBe(true)
    created = res.intervention
    expect(created.id).toMatch(/^s360-/)
    /* §12 payload integrity */
    expect(created.studentIds).toContain(studentId)
    expect(created.domain).toBe('Competitive')
    expect(created.examFamily).toBe('JEE')
    expect(created.subject).toBe(w.subject)
    expect(created.chapter).toBe(w.chapter)
    expect(created.issueType).toBeTruthy()
    expect(['Critical', 'High', 'Medium', 'Low']).toContain(created.priority)
    expect(created.objectives.length).toBeGreaterThan(0)
    expect(created.evidence.questions).toBeGreaterThan(0) /* server re-derived, not client-fabricated */
    expect(typeof created.evidence.avgAccuracy).toBe('number')
    expect(created.evidence.incorrect + created.evidence.skipped).toBeGreaterThan(0)
    expect(created.practiceConfig.count).toBe(15)
    expect(created.practiceConfig.difficulty).toBe('Mixed')
    expect(created.practiceConfig.includePyq).toBe(true)
    expect(created.source).toBe('Student 360')
    expect(created.createdBy).toBeTruthy()
    expect(created.status).toBe('Recommended')
    expect(created.whyDetected).toBeTruthy()
  })

  it('duplicate creation for the same student+chapter is rejected with a readable message', async () => {
    const bundle = await get(`/faculty/students/${studentId}/360`)
    const w = bundle.strengthsWeaknesses.competitive.JEE.weaknesses[0]
    const err = await failing(() => post(`/faculty/students/${studentId}/interventions`, {
      domain: 'Competitive', examFamily: 'JEE', subject: w.subject, chapter: w.chapter,
    }))
    expect(err.response.status).toBe(400)
    expect(err.message).toContain('already exists')
  })

  it('unknown student → readable 404; missing chapter → readable 400', async () => {
    const notFound = await failing(() => post('/faculty/students/does_not_exist/interventions', {
      subject: 'Physics', chapter: 'Kinematics', domain: 'Competitive', examFamily: 'JEE',
    }))
    expect(notFound.response.status).toBe(404)
    expect(notFound.message).toBe('Student not found.')
    const badRequest = await failing(() => post(`/faculty/students/${studentId}/interventions`, { subject: 'Physics' }))
    expect(badRequest.response.status).toBe(400)
    expect(badRequest.message).toContain('Subject and chapter are required')
  })

  it('University and NEET creations stay isolated — and cross-family creation is refused without evidence', async () => {
    /* NEET student */
    const neetBundle = await get('/faculty/students/fs_neet_a_04/360')
    const neetWeaknesses = neetBundle.strengthsWeaknesses?.competitive?.NEET?.weaknesses ?? []
    expect(neetWeaknesses.length).toBeGreaterThan(0)
    const nw = neetWeaknesses[0]
    const neetRes = await post('/faculty/students/fs_neet_a_04/interventions', {
      domain: 'Competitive', examFamily: 'NEET', subject: nw.subject, chapter: nw.chapter,
      priority: 'Medium',
    })
    expect(neetRes.intervention.examFamily).toBe('NEET')
    expect(neetRes.intervention.source).toBe('Student 360')

    /* University student — batch A uses roster ids (fs_s2…), so scan for one
       with actual University weaknesses (deterministic dataset) */
    const uniCandidates = ['fs_s2', 'fs_s3', 'fs_s4', 'fs_s5', 'fs_s6', 'fs_s7', 'fs_s8', 'fs_s9', 'fs_uni_a_17', 'fs_uni_a_18']
    let uniStudentId = null
    let uniWeakness = null
    for (const id of uniCandidates) {
      const bundle = await get(`/faculty/students/${id}/360`)
      const weaknesses = bundle.strengthsWeaknesses?.university?.weaknesses ?? []
      if (weaknesses.length) { uniStudentId = id; uniWeakness = weaknesses[0]; break }
    }
    expect(uniStudentId).toBeTruthy()
    const uniRes = await post(`/faculty/students/${uniStudentId}/interventions`, {
      domain: 'University', examFamily: null, subject: uniWeakness.subject, chapter: uniWeakness.chapter,
    })
    expect(uniRes.intervention.domain).toBe('University')
    expect(uniRes.intervention.examFamily).toBeNull()
    expect(uniRes.intervention.source).toBe('Student 360')

    /* a University-only student cannot get a JEE-labelled intervention: the
       evidence lookup is domain-scoped → no rows → readable refusal */
    const crossErr = await failing(() => post(`/faculty/students/${uniStudentId}/interventions`, {
      domain: 'Competitive', examFamily: 'JEE', subject: 'Physics', chapter: 'Rotational Motion',
    }))
    expect(crossErr.response.status).toBe(400)
    expect(crossErr.message).toContain('No question-level evidence available')
  })
})

describe('14. existing intervention lifecycle preservation', () => {
  const studentId = 'fs_jee_a_03'

  it('the created intervention flows through the EXISTING center list and detail routes', async () => {
    const list = await get('/faculty/interventions')
    const mine = list.items.filter((i) => i.source === 'Student 360' && i.studentIds.includes(studentId))
    expect(mine.length).toBeGreaterThan(0)
    const detail = await get(`/faculty/interventions/${mine[0].id}`)
    expect(detail.intervention.id).toBe(mine[0].id)
    expect(detail.intervention.status).toBe('Recommended')
  })

  it('appears in the student’s 360 intervention list with practice / re-test / effectiveness statuses', async () => {
    const res = await get(`/faculty/students/${studentId}/interventions`)
    const mine = res.items.filter((i) => i.source === 'Student 360')
    expect(mine.length).toBeGreaterThan(0)
    mine.forEach((iv) => {
      expect(['Not started', 'In progress', 'Completed']).toContain(iv.practiceStatus)
      expect(['Not created', 'Pending', 'Completed']).toContain(iv.retestStatus)
      expect(iv.effectivenessStatus).toBe('Pending')
    })
  })

  it('valid lifecycle transitions apply; invalid ones are refused by the SAME status machine', async () => {
    const list = await get('/faculty/interventions')
    const mine = list.items.find((i) => i.source === 'Student 360' && i.studentIds.includes(studentId))
    /* transition table still governs */
    expect(canTransition('Recommended', 'Approved')).toBe(true)
    expect(canTransition('Recommended', 'Resolved')).toBe(false)
    expect(canTransition('Recommended', 'Assigned')).toBe(false)
    /* invalid transition via API → readable 400 */
    const invalid = await failing(() => post(`/faculty/interventions/${mine.id}/status`, { status: 'Resolved' }))
    expect(invalid.response.status).toBe(400)
    expect(invalid.message).toContain('Invalid transition')
    /* valid transition succeeds and persists */
    const ok = await post(`/faculty/interventions/${mine.id}/status`, { status: 'Approved' })
    expect(ok.status).toBe('Approved')
    const detail = await get(`/faculty/interventions/${mine.id}`)
    expect(detail.intervention.status).toBe('Approved')
    expect(detail.intervention.approvedBy).toBeTruthy()
  })

  it('existing group interventions are untouched (no second system, no duplicated engine)', async () => {
    const list = await get('/faculty/interventions')
    const groupItems = list.items.filter((i) => i.source !== 'Student 360')
    expect(groupItems.length).toBeGreaterThan(0)
    groupItems.forEach((i) => {
      expect(i.status).toBeTruthy()
      expect(i.baseline).toBeDefined()
      expect(i.effectiveness).toBeDefined()
    })
    expect(server.hasMockHandler('post', '/faculty/interventions/a/status')).toBe(true)
    expect(server.hasMockHandler('post', '/faculty/interventions/a/retest')).toBe(true)
    expect(server.hasMockHandler('post', '/student/interventions/a/practice-attempts')).toBe(true)
  })
})

describe('15. URL state', () => {
  it('context/tab/subject/chapter round-trip through the canonical param names', () => {
    expect(DOMAIN_PARAM.university).toBe('University')
    expect(DOMAIN_PARAM.jee).toBe('JEE')
    expect(DOMAIN_PARAM.neet).toBe('NEET')
    expect(DOMAIN_TO_PARAM.JEE).toBe('jee')
    const params = build360SearchParams('', {
      tab: 'weaknesses', domain: 'JEE', subject: 'Physics', chapter: 'Rotational Motion',
    })
    expect(params.get('tab')).toBe('weaknesses')
    expect(params.get('context')).toBe('jee')
    expect(params.get('subject')).toBe('Physics')
    expect(params.get('chapter')).toBe('Rotational Motion')
    expect(params.toString()).toContain('chapter=Rotational+Motion')
  })

  it('readers reject unknown values and the default tab is omitted from the URL', () => {
    const sp = new URLSearchParams('context=jee&subject=Physics&chapter=Rotational%20Motion')
    expect(readContextParam(sp)).toBe('JEE')
    expect(readTabParam(sp)).toBe('overview')
    expect(readContextParam(new URLSearchParams('context=competitive'))).toBeNull()
    const cleared = build360SearchParams(sp, { tab: 'overview', domain: 'JEE', subject: null, chapter: null })
    expect(cleared.has('tab')).toBe(false)
    expect(cleared.has('subject')).toBe(false)
    expect(cleared.has('chapter')).toBe(false)
    expect(cleared.get('context')).toBe('jee')
  })

  it('deep-link builder produces the documented URL shape', () => {
    expect(student360Url('fs_jee_a_03', { context: 'JEE', tab: 'weaknesses', subject: 'Physics', chapter: 'Rotational Motion' }))
      .toBe('/faculty/my-students/fs_jee_a_03?tab=weaknesses&context=jee&subject=Physics&chapter=Rotational+Motion')
  })
})

describe('16. no unsupported AI claims', () => {
  const BANNED = ['anxious', 'anxiety', 'unmotivated', 'lazy', 'bored', 'fear', 'panic', 'confidence issues', 'does not care', 'depressed']

  it('individual why-detected strings are deterministic and grounded in the fingerprint numbers', () => {
    const fp = {
      status: 'persistent', trend: 'stable', accuracy: 46, avgTime: 81, highTime: false,
      skipRate: 0, skipped: 0, incorrect: 4, questions: 8, persistence: 3,
      evidence: { attempts: 3, questions: 8, incorrect: 4, skipped: 0, accuracy: 46, avgTime: 81 },
    }
    const a = buildIndividualWhyDetected(fp)
    const b = buildIndividualWhyDetected(fp)
    expect(a).toBe(b) /* deterministic template */
    expect(a).toContain('3 attempt')
    expect(a).toContain('4 incorrect')
    expect(a).not.toMatch(/46%.*below/) /* persistent branch states persistence, not a wrong threshold claim */
  })

  it('declining and low-accuracy branches quote the actual numbers', () => {
    const declining = buildIndividualWhyDetected({
      status: 'weak', trend: 'declining', accuracy: 38, avgTime: 70,
      skipRate: 0, incorrect: 5, questions: 6, persistence: 2,
      series: [{ date: '2026-08-01', accuracy: 71 }, { date: '2026-08-20', accuracy: 38 }],
    })
    expect(declining).toContain('71%')
    expect(declining).toContain('38%')
    const low = buildIndividualWhyDetected({
      status: 'weak', trend: 'stable', accuracy: 40, avgTime: 50,
      skipRate: 40, skipped: 2, incorrect: 3, questions: 5, persistence: 1,
    })
    expect(low).toContain('40%')
    expect(low).toContain('2 of 5')
  })

  it('no psychological or fabricated claims appear in any engine-generated string', () => {
    const issues = fingerprintsFor(allAttempts).map((f) => buildIndividualIssue(f))
    issues.forEach((i) => {
      const text = `${i.whyDetected}`.toLowerCase()
      BANNED.forEach((word) => expect(text).not.toContain(word))
    })
  })
})
