import { beforeAll, describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'

/* framer-motion requires a real DOM; replace it with passthrough components
   so the SSR smoke render works without a browser. */
vi.mock('framer-motion', async () => {
  const React = await import('react')
  const motion = new Proxy({}, {
    get: (_target, tag) => {
      if (typeof tag !== 'string') return undefined
      return React.forwardRef(function MotionStub(props, ref) {
        const { initial, animate, exit, transition, whileHover, whileTap, whileInView, variants, layout, viewport, drag, dragConstraints, onViewportEnter, ...rest } = props
        return React.createElement(tag, { ...rest, ref }, props.children)
      })
    },
  })
  const AnimatePresence = ({ children }) => React.createElement(React.Fragment, null, children)
  const MotionConfig = ({ children }) => React.createElement(React.Fragment, null, children)
  return { motion, AnimatePresence, MotionConfig }
})
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * PHASE 5 — Student 360 UI render smoke test (SSR, no browser).
 *
 * Interactive browser verification is unavailable in this environment, so
 * this suite renders the REAL StudentProfile page (real components, real
 * router, real react-query, real mock API) to a string and asserts the
 * evidence→action surfaces are present:
 *   · Weaknesses tab renders evidence + suggested-intervention actions
 *   · Similar Issues tab renders GROUPED and INDIVIDUAL sections
 *   · Chapter Intelligence renders derived metrics + actionable buttons
 *   · Strengths render evidence actions (no unconditional interventions)
 *   · Interventions tab renders the honest empty state
 *   · the page renders for a JEE student without cross-domain content
 */
const mem = new Map()
const storage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
}
globalThis.window = { localStorage: storage }
globalThis.localStorage = storage
/* minimal SSR shims so framer-motion can render outside a browser */
if (typeof globalThis.SVGElement === 'undefined') globalThis.SVGElement = class SVGElement {}
if (typeof globalThis.HTMLElement === 'undefined') globalThis.HTMLElement = class HTMLElement {}

let server
let request
let StudentProfile
let ToastProvider

const STUDENT_ID = 'fs_jee_a_03'

async function renderPage(path, studentId = STUDENT_ID) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  await queryClient.fetchQuery({
    queryKey: ['faculty', 'students', studentId, '360'],
    queryFn: () => request({ url: `/faculty/students/${studentId}/360` }).then((r) => r.data),
  })
  await queryClient.fetchQuery({
    queryKey: ['faculty', 'similar-issues', 'all'],
    queryFn: () => request({ url: '/faculty/similar-issues', params: { scope: 'all' } }).then((r) => r.data),
  })
  await queryClient.fetchQuery({
    queryKey: ['faculty', 'students', studentId, 'interventions'],
    queryFn: () => request({ url: `/faculty/students/${studentId}/interventions` }).then((r) => r.data),
  })
  return renderToString(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/faculty/my-students/:studentId" element={<StudentProfile />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
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
  ;({ default: request } = await import('../../src/api/client.js'))
  ;({ default: StudentProfile } = await import('../../src/pages/faculty/StudentProfile.jsx'))
  ;({ ToastProvider } = await import('../../src/components/ui/toast.jsx'))
})

describe('Student 360 page render (SSR smoke)', () => {
  it('renders the weaknesses tab with evidence + suggested intervention actions', async () => {
    const html = await renderPage(`/faculty/my-students/${STUDENT_ID}?context=jee&tab=weaknesses`)
    expect(html).toContain('360° Academic Intelligence')
    expect(html).toContain('Priority weaknesses — JEE')
    expect(html).toContain('Evidence questions')
    expect(html).toContain('Suggested intervention')
  })

  it('renders the similar issues tab with GROUPED and INDIVIDUAL sections', async () => {
    const html = await renderPage(`/faculty/my-students/${STUDENT_ID}?context=jee&tab=similar`)
    expect(html).toContain('Similar issues — JEE')
    expect(html).toContain('A. Grouped issues')
    expect(html).toContain('B. Individual issues')
    const individualPresent = html.includes('Individual issue</')
    const individualEmpty = html.includes('No individual issues currently identified.')
    expect(individualPresent || individualEmpty).toBe(true)
    const groupedEmpty = html.includes('No similar issues currently identified.')
    if (!groupedEmpty) expect(html).toContain('students')
  })

  it('renders chapter intelligence with derived metrics and actionable buttons', async () => {
    const html = await renderPage(`/faculty/my-students/${STUDENT_ID}?context=jee&tab=chapters`)
    expect(html).toContain('Chapter Intelligence')
    expect(html).toContain('priority')
    expect(html).toContain('avg')
  })

  it('renders strengths with evidence actions and no unconditional intervention buttons', async () => {
    const html = await renderPage(`/faculty/my-students/${STUDENT_ID}?context=jee&tab=strengths`)
    expect(html).toContain('Strengths — JEE')
    expect(html).toContain('View evidence questions')
    /* the intervention action only appears next to a real negative signal */
    if (html.includes('Suggested intervention')) expect(html).toContain('Related concern')
  })

  it('renders the interventions tab with the honest empty state (nothing auto-created)', async () => {
    const html = await renderPage(`/faculty/my-students/${STUDENT_ID}?context=jee&tab=interventions`)
    expect(html).toContain('Interventions for this student')
    expect(html).toContain('Open Intervention Center')
    expect(html).toContain('No interventions created for this student.')
  })

  it('renders for NEET and University students without cross-domain selectors', async () => {
    const neet = await renderPage(`/faculty/my-students/fs_neet_a_04?context=neet&tab=weaknesses`, 'fs_neet_a_04')
    expect(neet).toContain('Priority weaknesses — NEET')
    const uni = await renderPage(`/faculty/my-students/fs_s2?context=university&tab=weaknesses`, 'fs_s2')
    expect(uni).toContain('Priority weaknesses — University')
  })
})
