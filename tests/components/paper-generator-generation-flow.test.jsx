// @vitest-environment jsdom
/**
 * Question Paper Studio — generation lifecycle + Competitive mode regression.
 *
 * Covers the two production defects the studio shipped with:
 *  1. A stale AI paper (ai-active resume) being re-surfaced as a *fresh*
 *     generation on mount — "AI paper ready … generated while you were away".
 *  2. Competitive bank questions carrying structured option records
 *     ({ key, text, imageUrl }) being rendered directly as JSX text.
 *
 * Everything runs against the REAL services/adapters — only the axios client
 * is mocked, so the exact payload contract of /faculty/question-bank and
 * /faculty/question-bank/generate is exercised.
 */
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { PaperGeneratorTab } from '../../src/components/assessment-workspace/paper-generator-tab.jsx'
import { ToastProvider } from '../../src/components/ui/toast.jsx'
import { act, openSelect, optionsOf, menuOf, renderDom, triggerOf } from '../setup/dom.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const state = vi.hoisted(() => ({
  gets: [],
  posts: [],
  aiActive: { active: null },
  aiPaper: null,
  generation: null,
  generationQuestions: null,
  bank: null,
}))

vi.mock('@/api/axios', () => ({
  default: {
    get: vi.fn(async (url, config = {}) => {
      state.gets.push({ url, params: config.params ?? null })
      if (url === '/faculty/paper-generator') {
        return { data: { generatedPapers: [], config: CATALOG, versionHistory: {} } }
      }
      if (url === '/faculty/paper-generator/ai-active') return { data: state.aiActive }
      if (url.startsWith('/faculty/paper-generator/ai-paper/')) return { data: state.aiPaper }
      if (url === '/faculty/question-bank') {
        const params = config.params ?? {}
        const bank = state.bank
        return { data: typeof bank === 'function' ? bank(params) : bank }
      }
      if (url.endsWith('/questions') && url.includes('/generations/')) {
        return { data: state.generationQuestions }
      }
      return { data: {} }
    }),
    post: vi.fn(async (url, body) => {
      state.posts.push({ url, body })
      if (url === '/faculty/question-bank/generate') return { data: state.generation }
      return { data: { ok: true } }
    }),
    patch: vi.fn(async () => ({ data: { ok: true } })),
    delete: vi.fn(async () => ({ data: { ok: true } })),
  },
}))

/* Real catalog contract: GET /faculty/paper-generator → config */
const CATALOG = {
  programs: ['B.Tech — CSE'],
  universityTypes: ['Mid Semester', 'End Semester'],
  competitiveTypes: ['Full Mock Test', 'Practice Test'],
  durations: [60, 90, 120],
  courseCatalog: [
    { id: 'c1', code: 'CS501', name: 'Data Structures & Algorithms', subjectCode: 'CS501', subjectName: 'Data Structures & Algorithms' },
  ],
  subjectCatalog: [
    { id: 's1', code: 'CS501', name: 'Data Structures & Algorithms', examMode: 'university', examFamily: null, chapters: [{ id: 'ch1', name: 'Trees', topics: ['AVL', 'Heaps'] }] },
    { id: 's2', code: 'PHY', name: 'Physics', examMode: 'competitive', examFamily: 'JEE', chapters: [{ id: 'ch2', name: 'Mechanics', topics: ['Kinematics'] }] },
  ],
  competitiveSubjects: { JEE: ['Physics', 'Mathematics', 'Chemistry'], NEET: ['Physics', 'Chemistry', 'Biology'] },
}

const UNI_QUESTIONS = [
  {
    id: 'q-uni-1', subject: 'CS501', chapter: 'Trees', topic: 'AVL', type: 'MCQ', difficulty: 'Medium',
    domain: 'University', examFamily: null, text: 'University bank question on AVL rotations',
    options: ['Left rotation', 'Right rotation', 'Recoloring', 'No rebalance'],
  },
]

/* Competitive records use the AI service option contract: { key, text, imageUrl }. */
const COMP_QUESTIONS = [
  {
    id: 'q-comp-1', subject: 'PHY', subjectName: 'Physics', chapter: 'Mechanics', topic: 'Kinematics', type: 'MCQ', difficulty: 'Hard',
    domain: 'Competitive', examFamily: 'JEE', text: 'A particle is projected at 20 m/s. Find the range.',
    options: [
      { key: 'A', text: '20.4 m', imageUrl: 'https://assets.edux/q-comp-1-a.png' },
      { key: 'B', text: '40.8 m', imageUrl: null },
      { key: 'C', text: '61.2 m', imageUrl: null },
      { key: 'D', text: '81.6 m', imageUrl: null },
    ],
  },
]

const bankFor = (params = {}) => {
  const questions = params.domain === 'Competitive' ? COMP_QUESTIONS : UNI_QUESTIONS
  return { questions, total: questions.length, summary: { total: questions.length } }
}

const GENERATED = {
  ok: true, generationId: 'gen-100', id: 'gen-100', status: 'READY',
  requestedCount: 10, generatedCount: 10,
  questionIds: Array.from({ length: 10 }, (_, i) => `gen-q-${i + 1}`),
  questions: Array.from({ length: 10 }, (_, i) => `gen-q-${i + 1}`),
}

const GENERATED_QUESTIONS = {
  ok: true, status: 'READY', total: 10, requestedCount: 10, generatedCount: 10,
  questions: Array.from({ length: 10 }, (_, i) => ({
    id: `gen-q-${i + 1}`, subject: 'CS501', chapter: 'Trees', topic: 'AVL', type: 'MCQ', difficulty: 'Medium',
    domain: 'University', examFamily: null, text: `Generated question ${i + 1} on AVL trees`,
    options: ['Alpha', 'Beta', 'Gamma', 'Delta'],
  })),
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

const settle = (ms = 200) => act(async () => { await new Promise((r) => setTimeout(r, ms)) })

/** Selects without an explicit aria-label (e.g. "Question count") are found by trigger text. */
const triggerByText = (container, text) =>
  [...container.querySelectorAll('button[aria-haspopup="listbox"]')].find((b) => b.textContent.includes(text))

async function choose(view, label, optionText) {
  const trigger = triggerOf(view.container, label)
  await openSelect(trigger)
  const option = optionsOf(menuOf(view.container, label)).find((o) => o.textContent.trim() === optionText)
  expect(option, `${optionText} should be an option for ${label}`).toBeTruthy()
  await act(async () => { option.click() })
  await settle(60)
}

async function chooseByTriggerText(view, triggerText, optionText) {
  const trigger = triggerByText(view.container, triggerText)
  expect(trigger, `${triggerText} trigger should exist`).toBeTruthy()
  await openSelect(trigger)
  const menu = document.getElementById(trigger.getAttribute('aria-controls'))
  const option = optionsOf(menu).find((o) => o.textContent.trim() === optionText)
  expect(option, `${optionText} should be an option for ${triggerText}`).toBeTruthy()
  await act(async () => { option.click() })
  await settle(60)
}

const bodyText = () => document.body.textContent ?? ''
const generatePosts = () => state.posts.filter((c) => c.url === '/faculty/question-bank/generate')
const bankCalls = () => state.gets.filter((c) => c.url === '/faculty/question-bank')

beforeEach(() => {
  state.gets = []
  state.posts = []
  state.aiActive = { active: null }
  state.aiPaper = null
  state.generation = null
  state.generationQuestions = null
  state.bank = bankFor
})
afterEach(() => {
  while (cleanups.length) cleanups.shift()()
  document.body.innerHTML = ''
})

describe('Generate Paper — no automatic generation on open', () => {
  it('starts in a clean configuration state and never calls the generation API', async () => {
    const view = mount()
    await settle()

    expect(generatePosts()).toHaveLength(0)
    expect(state.gets.some((c) => c.url.includes('/generations/'))).toBe(false)
    expect(bodyText()).toContain('Generation: Idle')
    expect(bodyText()).not.toContain('AI paper ready')
    expect(bodyText()).not.toContain('questions generated while you were away')
    // Section 6 still lists the live bank (existing design) but nothing is
    // presented as a generation result and nothing is pre-selected.
    expect(bodyText()).toContain('University bank question on AVL rotations')
    expect(view.container.querySelectorAll('input[type="checkbox"]:checked')).toHaveLength(0)
  })

  it('does not restore a persisted AI paper as a new generation (stale-state isolation)', async () => {
    state.aiActive = {
      active: { paper_id: 'ai-paper-1', status: 'completed', examFamily: 'JEE', subject: 'Physics', generated: 10, total: 10 },
    }
    state.aiPaper = {
      ok: true, paper_id: 'ai-paper-1', status: 'completed', requested: 10, generated: 10,
      questions: Array.from({ length: 10 }, (_, i) => ({ id: `ai-q-${i}`, text: `Restored AI question ${i}`, options: ['a', 'b', 'c', 'd'] })),
    }

    const view = mount()
    await settle(400)

    expect(bodyText()).not.toContain('AI paper ready')
    expect(bodyText()).not.toContain('Restored AI question')
    expect(bodyText()).toContain('Generation: Idle')
    expect(view.container.querySelectorAll('input[type="checkbox"]:checked')).toHaveLength(0)
    // No generation result state may be derived from persisted AI papers.
    expect(state.gets.some((c) => c.url.includes('/ai-paper/'))).toBe(false)
    expect(generatePosts()).toHaveLength(0)
  })
})

describe('Generate Paper — generation only after the Generate action', () => {
  it('posts the selected configuration exactly once and renders the real response', async () => {
    state.generation = GENERATED
    state.generationQuestions = GENERATED_QUESTIONS
    const view = mount()
    await settle()

    await choose(view, 'Course', 'CS501 — Data Structures & Algorithms')
    await choose(view, 'Subject', 'Data Structures & Algorithms')
    await choose(view, 'Chapter', 'Trees')
    await choose(view, 'Topic', 'AVL')
    await chooseByTriggerText(view, 'Auto (by marks)', '10')

    expect(generatePosts()).toHaveLength(0)

    const button = view.container.querySelector('[data-testid="generate-questions-button"]')
    expect(button).toBeTruthy()
    await act(async () => { button.click() })
    await settle(400)

    expect(generatePosts()).toHaveLength(1)
    const body = generatePosts()[0].body
    expect(body).toMatchObject({
      domain: 'University',
      subject: 'Data Structures & Algorithms',
      chapter: 'Trees',
      topic: 'AVL',
      questionCount: 10,
      difficulty: 'Mixed',
    })
    expect(body.questionTypes).toContain('MCQ')

    // Generated questions render only after the successful response.
    expect(bodyText()).toContain('Generated question 1 on AVL trees')
    expect(bodyText()).toContain('10 questions generated')
    expect(bodyText()).toContain('Questions Generated')
    expect(bodyText()).toContain('Generation: Ready')
  })

  it('shows the failure state and no success notification when generation fails', async () => {
    const { default: api } = await import('@/api/axios')
    api.post.mockImplementationOnce(async () => {
      throw Object.assign(new Error('Request failed with status code 500'), { response: { status: 500, data: { detail: 'AI service down' } } })
    })
    const view = mount()
    await settle()

    await choose(view, 'Course', 'CS501 — Data Structures & Algorithms')
    await choose(view, 'Subject', 'Data Structures & Algorithms')

    const button = view.container.querySelector('[data-testid="generate-questions-button"]')
    await act(async () => { button.click() })
    await settle(200)

    expect(bodyText()).toContain('Generation: Failed')
    expect(bodyText()).not.toContain('Questions Generated')
    expect(bodyText()).not.toContain('AI paper ready')
    expect(view.container.textContent).not.toContain('Generated question')
  })

  it('does not call the generation API when a required filter is missing', async () => {
    const view = mount()
    await settle()

    const button = view.container.querySelector('[data-testid="generate-questions-button"]')
    await act(async () => { button.click() })
    await settle(100)

    expect(generatePosts()).toHaveLength(0)
    expect(bodyText()).toContain('Select a subject')
    expect(bodyText()).toContain('Generation: Idle')
  })
})

describe('Generate Paper — Competitive domain', () => {
  it('renders structured option records as their text and stays mounted', async () => {
    const view = mount()
    await settle()

    const compButton = [...view.container.querySelectorAll('button')].find((b) => b.textContent.trim() === '🎯 Competitive')
    expect(compButton).toBeTruthy()
    await act(async () => { compButton.click() })
    await settle(300)

    // No React "Objects are not valid as a React child" crash — the page
    // stays mounted and the Competitive question renders.
    expect(view.container.textContent).toContain('A particle is projected at 20 m/s')
    expect(bankCalls().at(-1).params).toMatchObject({ domain: 'Competitive', examFamily: 'JEE' })

    // Structured options render the human-readable text, never the object.
    expect(view.container.textContent).toContain('40.8 m')
    expect(view.container.textContent).not.toContain('[object Object]')
    expect(view.container.textContent).not.toContain('imageUrl')

    // Competitive subject options come from the real catalog — the full
    // JEE subject list, not just the first/only subject row.
    const subjectTrigger = triggerOf(view.container, 'Subject')
    await openSelect(subjectTrigger)
    expect(optionsOf(menuOf(view.container, 'Subject')).map((o) => o.textContent.trim())).toEqual(['All subjects', 'Physics', 'Mathematics', 'Chemistry'])
  })
})

describe('Generate Paper — University regression and domain switching', () => {
  it('keeps the University cascade and bank filters working', async () => {
    const view = mount()
    await settle()

    await choose(view, 'Course', 'CS501 — Data Structures & Algorithms')
    await choose(view, 'Subject', 'Data Structures & Algorithms')
    await choose(view, 'Chapter', 'Trees')
    await choose(view, 'Topic', 'AVL')

    expect(bankCalls().at(-1).params).toMatchObject({ domain: 'University', course: 'CS501', subject: 'CS501', chapter: 'Trees', topic: 'AVL' })
    expect(view.container.textContent).toContain('University bank question on AVL rotations')
  })

  it('survives University → Competitive → University with consistent dependent filters', async () => {
    const view = mount()
    await settle()

    await choose(view, 'Course', 'CS501 — Data Structures & Algorithms')
    await choose(view, 'Subject', 'Data Structures & Algorithms')

    const uni = () => [...view.container.querySelectorAll('button')].find((b) => b.textContent.trim() === '🏛️ University')
    const comp = () => [...view.container.querySelectorAll('button')].find((b) => b.textContent.trim() === '🎯 Competitive')

    await act(async () => { comp().click() })
    await settle(300)
    expect(view.container.textContent).toContain('40.8 m')
    expect(triggerOf(view.container, 'Subject').textContent).toContain('All subjects')

    await act(async () => { uni().click() })
    await settle(300)

    // The University bank (cached from the earlier visit of the same filters)
    // is rendered again — no stale Competitive records leak through.
    expect(view.container.textContent).toContain('University bank question on AVL rotations')
    expect(view.container.textContent).not.toContain('40.8 m')
    expect(triggerOf(view.container, 'Course').textContent).toContain('Select course…')
    expect(triggerOf(view.container, 'Subject').textContent).toContain('Select a course first')
    expect(view.container.textContent).not.toContain('[object Object]')
  })
})
