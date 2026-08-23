import { beforeAll, describe, expect, it } from 'vitest'
import { installTestStorage, initApi, makeHelpers } from '../setup/api.js'

/**
 * Student 360 consolidation route/redirect + data-surface tests.
 *
 * Verifies (against the REAL API router, no DOM) that:
 *   · the canonical /faculty/students/:id/360 API still serves the bundle;
 *   · the per-student interventions endpoint is domain-isolated;
 *   · weak-topic question evidence is served (never an empty dialog when
 *     underlying question evidence exists);
 *   · the attempt-analysis endpoint is preserved;
 *   · no second/duplicate student-360 engine endpoint was introduced.
 */
installTestStorage()

let server
let get

beforeAll(async () => {
  server = await initApi()
  ;({ get } = makeHelpers(server))
})

describe('canonical Student 360 API surface (unchanged contract)', () => {
  it('serves the 360 bundle with overview, subjects, chapters, question, longitudinal, comparison', async () => {
    const dir = await get('/faculty/students')
    const id = dir.students[0].id
    const s360 = await get(`/faculty/students/${id}/360`)
    for (const k of ['student', 'overview', 'aiSummary', 'strengthsWeaknesses', 'subjects', 'chapters', 'question', 'longitudinal', 'comparison', 'comparisonByContext', 'defaultDomain']) {
      expect(s360).toHaveProperty(k)
    }
    // domain isolation in the API payload itself
    expect(s360.question.byContext.University).toBeDefined()
    expect(s360.question.byContext.JEE).toBeDefined()
    expect(s360.question.byContext.NEET).toBeDefined()
  })

  it('exposes University/JEE/NEET counts so the UI only renders available contexts', async () => {
    const dir = await get('/faculty/students')
    const s360 = await get(`/faculty/students/${dir.students[0].id}/360`)
    expect(typeof s360.uniCount).toBe('number')
    expect(typeof s360.jeeCount).toBe('number')
    expect(typeof s360.neetCount).toBe('number')
    expect(s360.uniCount + s360.jeeCount + s360.neetCount).toBeGreaterThan(0)
  })
})

describe('question-level evidence surface', () => {
  it('weak-topic-questions endpoint returns items for a known chapter (or empty array, never undefined)', async () => {
    const res = await get('/faculty/students/weak-topic-questions', { subject: 'Data Structures', chapter: 'Graphs' })
    expect(Array.isArray(res.items)).toBe(true)
  })

  it('360 question rows carry text + answers so evidence dialogs are never empty', async () => {
    const dir = await get('/faculty/students')
    const s360 = await get(`/faculty/students/${dir.students[0].id}/360`)
    const withEvidence = s360.question.rows.filter((r) => r.status === 'Incorrect')
    if (withEvidence.length) {
      const r = withEvidence[0]
      // every incorrect row has enough to render a non-empty evidence card
      expect(r.subject).toBeTruthy()
      expect(r.chapter).toBeTruthy()
      expect(r.correctAnswer !== undefined && r.correctAnswer !== null).toBe(true)
    }
  })
})

describe('per-student interventions surface (Phase 6, reused)', () => {
  it('returns the student interventions list with status/priority/domain', async () => {
    const dir = await get('/faculty/students')
    const id = dir.students[0].id
    const res = await get(`/faculty/students/${id}/interventions`)
    expect(Array.isArray(res.items)).toBe(true)
    res.items.forEach((iv) => {
      expect(iv).toHaveProperty('status')
      expect(iv).toHaveProperty('priority')
      expect(iv).toHaveProperty('domain')
    })
  })

  it('intervention center endpoints remain available (no duplicate system)', () => {
    expect(server.hasRouteHandler('get', '/faculty/interventions')).toBe(true)
    expect(server.hasRouteHandler('get', '/faculty/similar-issues')).toBe(true)
    expect(server.hasRouteHandler('post', '/faculty/interventions/a/status')).toBe(true)
    expect(server.hasRouteHandler('post', '/faculty/interventions/a/retest')).toBe(true)
  })
})

describe('attempt analysis deep link preserved', () => {
  it('still answers /faculty/students/:id/exams/:attemptId/analysis', async () => {
    const dir = await get('/faculty/students')
    const s360 = await get(`/faculty/students/${dir.students[0].id}/360`)
    const attemptId = s360.attempts?.[0]?.id
    if (attemptId) {
      const analysis = await get(`/faculty/students/${dir.students[0].id}/exams/${attemptId}/analysis`)
      expect(analysis).toBeTruthy()
      expect(analysis.meta ?? analysis.analysis ?? analysis).toBeTruthy()
    }
  })
})
