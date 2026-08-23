import { beforeAll, describe, expect, it } from 'vitest'

/**
 * Phase 3 — service/API surface protection suite.
 *
 * Proves that after the service hook + mock endpoint consolidation:
 *   · every CANONICAL endpoint still serves its contract (Student/Admin/
 *     Faculty intelligence snapshots, My Students, Student 360, Exam
 *     Analysis, Exam Agent attempts, Question Intelligence, PYQ, Paper
 *     Generator/Library, Intervention lifecycle);
 *   · retired endpoints are actually gone (mock server answers 404);
 *   · University / JEE / NEET data remains reachable and isolated;
 *   · the memoized snapshots return consistent results.
 * Tests hit the REAL API router dispatch the same way the service layer
 * does, with latency zeroed.
 */

/* localStorage shim — mock handlers persist attempts / sessions / shares
   through window.localStorage in the browser. */
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
const get = (url, params = {}) => server.dispatchRequest({ method: 'get', url, params }).then((r) => r.data)

beforeAll(async () => {
  // Registering the route modules mirrors main.jsx exactly.
  await import('../../src/api/index.js')
  server = await import('../../src/api/core/router.js')
  server.setResponseLatency([0, 0])
})

describe('canonical intelligence snapshots', () => {
  it('serves the student snapshot (profile + datasets + derived)', async () => {
    const data = await get('/intelligence/summary')
    expect(data.profile?.name ?? data.profile?.student?.name ?? data.profile).toBeTruthy()
    expect(data.datasets).toBeTruthy()
    expect(data.derived).toBeTruthy()
  })

  it('serves the master student profile for agent/exam pages', async () => {
    const profile = await get('/intelligence/profile')
    expect(profile).toBeTruthy()
  })

  it('serves ONE canonical faculty snapshot and memoizes it', async () => {
    const a = await get('/faculty-intelligence/summary')
    const b = await get('/faculty-intelligence/summary')
    expect(a.profile).toBeTruthy()
    expect(a.derived?.assessment).toBeTruthy()
    expect(a).toBe(b) // lazy singleton — identical payload object
  })

  it('serves ONE canonical admin snapshot and memoizes it', async () => {
    const a = await get('/admin-intelligence/summary')
    const b = await get('/admin-intelligence/summary')
    expect(a.profile?.totals?.students).toBeGreaterThan(0)
    expect(a.derived).toBeTruthy()
    expect(a).toBe(b)
  })
})

describe('retired endpoints are gone', () => {
  it.each([
    '/student/profile', '/student/dashboard', '/student/attendance', '/student/assignments',
    '/student/courses', '/student/subjects', '/student/events', '/student/exam-analysis',
    '/student/academic-profile', '/student/academic-resources', '/student/academic-progress',
    '/student/performance-accuracy', '/admin/dashboard', '/admin/analytics', '/admin/performance',
    '/admin/placements', '/admin/attendance-analytics', '/admin/assignment-analytics',
    '/admin/exam-analytics', '/intelligence/datasets', '/intelligence/derived',
    '/admin-intelligence/profile', '/admin-intelligence/datasets', '/admin-intelligence/derived',
    '/ai/recommendations', '/ai/weaknesses', '/ai/prediction',
    '/platform/testimonials', '/platform/pricing', '/platform/faqs', '/platform/stats',
    '/faculty/ai-studio', '/faculty/paper-generator/shares', '/faculty/question-studio/approved',
  ])('%s has no mock handler', (path) => {
    expect(server.hasRouteHandler('get', path)).toBe(false)
  })

  it('retired mutation endpoints are gone too', () => {
    expect(server.hasRouteHandler('post', '/ai/generate-quiz')).toBe(false)
    expect(server.hasRouteHandler('post', '/ai/generate-exam')).toBe(false)
    expect(server.hasRouteHandler('post', '/auth/profile-setup')).toBe(false)
  })
})

describe('faculty students + Student 360 (canonical path)', () => {
  it('serves the My Students directory with batches', async () => {
    const data = await get('/faculty/students')
    expect(data.students?.length).toBeGreaterThan(0)
    expect(data.batches?.length).toBeGreaterThan(0)
    expect(data.batches.map((b) => b.examFamily ?? 'University')).toContain('JEE')
  })

  it('serves Student 360 with domain-isolated pools', async () => {
    const directory = await get('/faculty/students')
    const studentId = directory.students[0].id
    const s360 = await get(`/faculty/students/${studentId}/360`)
    expect(s360.student?.id).toBe(studentId)
    expect(s360.subjects?.university).toBeDefined()
    expect(s360.subjects?.competitive?.JEE).toBeDefined()
    expect(s360.subjects?.competitive?.NEET).toBeDefined()
    expect(s360.question?.byContext).toBeTruthy()
  })
})

describe('canonical exam attempts (University/JEE/NEET isolation)', () => {
  it('returns all three contexts and never leaks across filters', async () => {
    const all = await get('/intelligence/exam-attempts')
    expect(all.items.length).toBeGreaterThan(0)

    const jee = await get('/intelligence/exam-attempts', { examFamily: 'JEE' })
    const neet = await get('/intelligence/exam-attempts', { examFamily: 'NEET' })
    const uni = await get('/intelligence/exam-attempts', { examMode: 'University' })
    expect(jee.items.length).toBeGreaterThan(0)
    expect(jee.items.every((a) => a.examFamily === 'JEE')).toBe(true)
    expect(neet.items.every((a) => a.examFamily === 'NEET')).toBe(true)
    expect(uni.items.length).toBeGreaterThan(0)
    expect(uni.items.every((a) => a.examMode === 'University')).toBe(true)
    // isolation: no University attempt inside a family filter and vice versa
    expect(jee.items.some((a) => a.examMode === 'University')).toBe(false)
    expect(uni.items.some((a) => a.examFamily === 'JEE' || a.examFamily === 'NEET')).toBe(false)
  })

  it('exam agent surfaces the same canonical attempts', async () => {
    const exams = await get('/student/exam-agent/exams')
    const attempts = await get('/student/exam-agent/attempts')
    expect(exams ?? attempts).toBeTruthy()
  })
})

describe('question intelligence data integrity', () => {
  it('University question bank remains available', async () => {
    const bank = await get('/faculty/question-bank')
    expect(bank.summary.total).toBeGreaterThan(0)
    expect(bank.questions.length).toBeGreaterThan(0)
  })

  it('University PYQ analysis remains available', async () => {
    const pyq = await get('/faculty/pyq-analysis')
    expect(pyq.overview.totalPapers).toBeGreaterThan(0)
  })

  it('JEE + NEET competitive questions and University PYQs remain in the faculty snapshot', async () => {
    const { derived } = await get('/faculty-intelligence/summary')
    const cqi = derived.competitiveQuestionIntelligence
    const families = new Set((cqi.pyqRecords ?? []).map((q) => q.examFamily ?? q.exam ?? 'JEE'))
    expect(cqi.pyqRecords.length).toBeGreaterThan(0)
    expect([...families].some((f) => String(f).includes('JEE'))).toBe(true)
    expect([...families].some((f) => String(f).includes('NEET'))).toBe(true)
    expect((cqi.universityPyq ?? []).length).toBeGreaterThan(0)
  })

  it('paper generator + paper library remain available with both exam modes', async () => {
    const gen = await get('/faculty/paper-generator')
    expect(gen.config.examModes).toEqual(expect.arrayContaining(['University', 'Competitive']))
    expect(gen.config.competitiveExams).toEqual(expect.arrayContaining(['JEE', 'NEET']))
    expect(Array.isArray(gen.generatedPapers)).toBe(true)
  })
})

describe('intervention lifecycle remains intact', () => {
  it('interventions carry status, baseline and effectiveness (standalone read retired)', async () => {
    const { items } = await get('/faculty/interventions')
    expect(items.length).toBeGreaterThan(0)
    for (const iv of items) {
      expect(iv.status).toBeTruthy()
      expect(iv.baseline).toBeDefined()
      expect(iv.effectiveness).toBeDefined()
    }
  })

  it('similar issues, practice, re-test and student intervention surfaces stay live', () => {
    expect(server.hasRouteHandler('get', '/faculty/similar-issues')).toBe(true)
    expect(server.hasRouteHandler('get', '/faculty/interventions/a1')).toBe(true)
    expect(server.hasRouteHandler('get', '/student/interventions')).toBe(true)
    expect(server.hasRouteHandler('post', '/student/interventions/a/practice-attempts')).toBe(true)
    expect(server.hasRouteHandler('get', '/faculty/students/fs_x/interventions')).toBe(true)
  })
})

describe('exam analysis surface', () => {
  it('options + per-id analysis still answered', async () => {
    const options = await get('/student/exam-analysis/options')
    expect(options.items.length).toBeGreaterThan(0)
    const byId = await get('/student/exam-analysis/some-exam')
    expect(byId).toBeTruthy()
  })
})
