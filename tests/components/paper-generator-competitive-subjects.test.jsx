// @vitest-environment jsdom
/**
 * Question Paper Studio — Competitive subject mapping regression.
 *
 *  - Competitive + JEE  → Mathematics, Physics, Chemistry
 *  - Competitive + NEET → Physics, Chemistry, Biology
 *  - Switching exam family clears a subject that belongs to the previous
 *    family only (Mathematics for JEE; Biology for NEET) together with its
 *    chapter/topic descendants, so stale IDs are never sent to the API.
 */
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const state = vi.hoisted(() => ({ bankCalls: [], posts: [] }))

vi.mock('@/api/axios', () => ({
  default: {
    get: vi.fn(async (url, config = {}) => {
      if (url === '/faculty/paper-generator') {
        return { data: { generatedPapers: [], config: CATALOG, versionHistory: {} } }
      }
      if (url === '/faculty/question-bank') {
        const params = config.params ?? {}
        state.bankCalls.push(params)
        const questions = BANK[`${params.domain}-${params.examFamily}`] ?? []
        return { data: { questions, total: questions.length, summary: { total: questions.length } } }
      }
      return { data: {} }
    }),
    post: vi.fn(async (url, body) => {
      state.posts.push({ url, body })
      return { data: { ok: true } }
    }),
    patch: vi.fn(async () => ({ data: { ok: true } })),
    delete: vi.fn(async () => ({ data: { ok: true } })),
  },
}))

import { PaperGeneratorTab } from '../../src/components/assessment-workspace/paper-generator-tab.jsx'
import { ToastProvider } from '../../src/components/ui/toast.jsx'
import { act, openSelect, optionsOf, menuOf, renderDom, settle, triggerOf } from '../setup/dom.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

/* Real catalog contract: the backend sends the full competitive subject
 * lists for an institution that manages its own competitive subjects. */
const CATALOG = {
  courseCatalog: [],
  subjectCatalog: [
    { id: 's-math', code: 'MATH', name: 'Mathematics', examMode: 'competitive', examFamily: 'JEE', chapters: [{ id: 'ch-calc', name: 'Calculus', topics: ['Limits'] }] },
    { id: 's-phy', code: 'PHY', name: 'Physics', examMode: 'competitive', examFamily: 'JEE', chapters: [{ id: 'ch-mech', name: 'Mechanics', topics: ['Kinematics'] }] },
    { id: 's-chem', code: 'CHEM', name: 'Chemistry', examMode: 'competitive', examFamily: 'JEE', chapters: [] },
  ],
  competitiveSubjects: {
    JEE: ['Mathematics', 'Physics', 'Chemistry'],
    NEET: ['Physics', 'Chemistry', 'Biology'],
  },
}

const BANK = {
  'Competitive-JEE': [
    { id: 'jee-1', subject: 'Mathematics', domain: 'Competitive', examFamily: 'JEE', type: 'MCQ', difficulty: 'Medium', text: 'JEE maths question', options: ['a', 'b', 'c', 'd'] },
  ],
  'Competitive-NEET': [
    { id: 'neet-1', subject: 'Biology', domain: 'Competitive', examFamily: 'NEET', type: 'MCQ', difficulty: 'Medium', text: 'NEET biology question', options: ['a', 'b', 'c', 'd'] },
  ],
}

const cleanups = []
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const view = renderDom(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter>
          <PaperGeneratorTab />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
  cleanups.push(view.unmount)
  return view
}

beforeEach(() => {
  state.bankCalls = []
  state.posts = []
})
afterEach(() => {
  while (cleanups.length) cleanups.shift()()
  document.body.innerHTML = ''
})

const button = (container, label) => [...container.querySelectorAll('button')].find((b) => b.textContent.trim().endsWith(label))

async function goCompetitive(container) {
  const comp = button(container, '🎯 Competitive') || button(container, 'Competitive')
  expect(comp, 'Competitive domain toggle should exist').toBeTruthy()
  await act(async () => { comp.click() })
  await settle(150)
}

async function subjectOptions(container) {
  const trigger = triggerOf(container, 'Subject')
  await openSelect(trigger)
  return optionsOf(menuOf(container, 'Subject')).map((o) => o.textContent.trim())
}

async function choose(container, label, optionText) {
  const trigger = triggerOf(container, label)
  await openSelect(trigger)
  const option = optionsOf(menuOf(container, label)).find((o) => o.textContent.trim() === optionText)
  expect(option, `${optionText} should be an option for ${label}`).toBeTruthy()
  await act(async () => { option.click() })
  await settle(60)
}

describe('Competitive exam subject mapping', () => {
  it('offers Mathematics, Physics, Chemistry for JEE', async () => {
    const view = mount()
    await settle(120)
    await goCompetitive(view.container)
    expect(await subjectOptions(view.container)).toEqual(['All subjects', 'Mathematics', 'Physics', 'Chemistry'])
  })

  it('offers Physics, Chemistry, Biology for NEET', async () => {
    const view = mount()
    await settle(120)
    await goCompetitive(view.container)
    await act(async () => { button(view.container, 'NEET').click() })
    await settle(120)
    expect(await subjectOptions(view.container)).toEqual(['All subjects', 'Physics', 'Chemistry', 'Biology'])
  })

  it('clears a JEE-only subject (Mathematics) when switching JEE → NEET', async () => {
    const view = mount()
    await settle(120)
    await goCompetitive(view.container)
    await choose(view.container, 'Subject', 'Mathematics')
    // Mathematics is scoped to JEE; the bank request carries the subject
    // code (MATH) resolved from the real catalog row.
    expect(state.bankCalls.some((c) => c.domain === 'Competitive' && c.examFamily === 'JEE' && c.subject === 'MATH')).toBe(true)

    await act(async () => { button(view.container, 'NEET').click() })
    await settle(250)

    // The stale subject is cleared — no Mathematics subject param survives
    // into any post-switch NEET request.
    const neetCalls = state.bankCalls.filter((c) => c.examFamily === 'NEET')
    expect(neetCalls.length).toBeGreaterThan(0)
    expect(neetCalls.at(-1)).toMatchObject({ domain: 'Competitive', examFamily: 'NEET' })
    expect(neetCalls.at(-1).subject).toBeUndefined()
    expect(triggerOf(view.container, 'Subject').textContent).toContain('All subjects')
    expect(triggerOf(view.container, 'Chapter').textContent).toContain('Select a subject first')
    // The generation payload must not carry a stale JEE subject either.
    const subjectTrigger = triggerOf(view.container, 'Subject')
    await openSelect(subjectTrigger)
    expect(optionsOf(menuOf(view.container, 'Subject')).map((o) => o.textContent.trim())).toEqual(['All subjects', 'Physics', 'Chemistry', 'Biology'])
  })

  it('clears a NEET-only subject (Biology) when switching NEET → JEE', async () => {
    const view = mount()
    await settle(120)
    await goCompetitive(view.container)
    await act(async () => { button(view.container, 'NEET').click() })
    await settle(120)
    await choose(view.container, 'Subject', 'Biology')
    expect(state.bankCalls.at(-1)).toMatchObject({ domain: 'Competitive', examFamily: 'NEET', subject: 'Biology' })

    await act(async () => { button(view.container, 'JEE').click() })
    await settle(250)

    const jeeCalls = state.bankCalls.filter((c) => c.examFamily === 'JEE')
    // The post-switch JEE request exists and carries no stale NEET subject.
    expect(jeeCalls.length).toBeGreaterThan(0)
    expect(jeeCalls.at(-1)).toMatchObject({ domain: 'Competitive', examFamily: 'JEE' })
    expect(jeeCalls.at(-1).subject).toBeUndefined()
    expect(triggerOf(view.container, 'Subject').textContent).toContain('All subjects')
  })
})
