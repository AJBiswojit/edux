// @vitest-environment jsdom
/**
 * Comprehensive frontend tests for Question Paper Studio & Paper Library lifecycle:
 *
 * Requirements tested:
 * 1. Remove duplicate Question Generation UI (Section 5 Question Generation is the only one; Section 6 Question Bank is absent).
 * 2. Proper Generate button state lifecycle (Enabled -> Generating... disabled -> Generated -> Clean state after Save).
 * 3. Paper Library status: generated & saved papers show READY.
 * 4. Edit Paper -> DRAFT workflow: clicking Edit enters edit mode with DRAFT indicator and "Confirm Changes".
 * 5. Confirm Edit: triggers update backend, transitions to READY, and clears edit state.
 * 6. Paper Library card redesign: actions [View], [Edit], [Share], [Download], [Delete]; removed Duplicate, V1, DOCX, Print, Archive.
 * 7. Real PDF Download: invoking Download calls downloadPaperPdf / backend download.
 * 8. Real Question Data: only current generation questions displayed.
 * 9. Save Paper data integrity: passes generationId, selected question IDs, and status 'ready'.
 * 10. Rehydration & Edit/refresh persistence.
 */

import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PaperGeneratorTab } from '../../src/components/assessment-workspace/paper-generator-tab.jsx'
import { PaperLibraryTab } from '../../src/components/assessment-workspace/paper-library-tab.jsx'
import { PaperCard } from '../../src/components/assessment-workspace/paper-parts.jsx'
import { ToastProvider } from '../../src/components/ui/toast.jsx'
import { act, renderDom, settle } from '../setup/dom'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => ({
  paperData: null,
  libraryPapers: [],
  createdPayloads: [],
  updatedPayloads: [],
  downloadCalls: [],
  editPaperCalls: [],
  generationStatus: 'READY',
  currentGen: null,
  questions: [
    {
      id: 'gen-q-101',
      questionId: 'gen-q-101',
      text: 'What is the time complexity of searching in a balanced BST?',
      question: 'What is the time complexity of searching in a balanced BST?',
      subject: 'Physics',
      chapter: 'Kinematics',
      topic: 'Motion in 1D',
      difficulty: 'Medium',
      type: 'MCQ',
      questionType: 'MCQ',
      marks: 4,
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
      source: 'AI',
    },
    {
      id: 'gen-q-102',
      questionId: 'gen-q-102',
      text: 'Which tree traversal visits the root node first?',
      question: 'Which tree traversal visits the root node first?',
      subject: 'Physics',
      chapter: 'Kinematics',
      topic: 'Motion in 1D',
      difficulty: 'Easy',
      type: 'MCQ',
      questionType: 'MCQ',
      marks: 2,
      options: ['Inorder', 'Preorder', 'Postorder', 'Level order'],
      source: 'AI',
    },
  ],
}))

vi.mock('@/services/faculty-papers', () => ({
  usePaperGeneratorBackend: () => ({
    data: mocks.paperData,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  usePaperLibrary: () => ({
    data: { generatedPapers: mocks.libraryPapers },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  usePaperCreateBackend: () => ({
    mutateAsync: vi.fn(async (payload) => {
      mocks.createdPayloads.push(payload)
      return { ok: true, paper: { id: 'new-paper-1', ...payload, status: 'ready' } }
    }),
  }),
  usePaperUpdateBackend: () => ({
    mutateAsync: vi.fn(async ({ id, payload }) => {
      mocks.updatedPayloads.push({ id, payload })
      return { ok: true, paper: { id, ...payload, status: 'ready' } }
    }),
  }),
  usePaperDeleteBackend: () => ({ mutateAsync: vi.fn(async () => ({ ok: true })) }),
  usePaperPublishBackend: () => ({ mutateAsync: vi.fn(async () => ({ ok: true })) }),
  usePaperShareBackend: () => ({ mutateAsync: vi.fn(async () => ({ ok: true })) }),
  usePaperDuplicateBackend: () => ({ mutateAsync: vi.fn(async () => ({ ok: true })) }),
  usePaperRegenerateBackend: () => ({ mutateAsync: vi.fn(async () => ({ ok: true })) }),
  usePaperArchiveBackend: () => ({ mutateAsync: vi.fn(async () => ({ ok: true })) }),
  useAiPaperDetail: () => ({ data: null, isLoading: false, isError: false }),
  useAiPaperLibrary: () => ({ data: { generatedPapers: [] }, isLoading: false, isError: false }),
  startEditPaper: vi.fn(async (id) => {
    mocks.editPaperCalls.push(id)
    return { ok: true, paper: { id, status: 'draft' } }
  }),
  downloadPaperPdf: vi.fn(async (id, title) => {
    mocks.downloadCalls.push({ id, title })
    return true
  }),
}))

vi.mock('@/services/faculty-question-generation', () => ({
  useQuestionGeneration: () => ({
    mutateAsync: vi.fn(async (payload) => {
      return {
        ok: true,
        generationId: 'gen-session-999',
        id: 'gen-session-999',
        status: mocks.generationStatus,
        requestedCount: payload.questionCount || 2,
        generatedCount: mocks.questions.length,
      }
    }),
  }),
  useGenerationStatus: (genId) => ({
    data: genId ? { status: mocks.generationStatus, requestedCount: 2 } : null,
  }),
  useGenerationQuestions: (genId) => ({
    data: genId ? { questions: mocks.questions } : null,
    refetch: vi.fn(),
  }),
  useCurrentGeneration: () => ({
    data: mocks.currentGen,
  }),
  GENERATION_STATUS: {
    GENERATING: 'GENERATING',
    PROCESSING: 'PROCESSING',
    READY: 'READY',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  },
  isTerminalStatus: (s) => ['READY', 'COMPLETED', 'FAILED'].includes(s),
}))

const CATALOG = {
  courseCatalog: [
    { id: 'c1', code: 'CS501', name: 'Data Structures & Algorithms', subjectCode: 'CS501', subjectName: 'Data Structures & Algorithms' },
  ],
  subjectCatalog: [
    {
      id: 'CS501',
      code: 'CS501',
      name: 'Data Structures & Algorithms',
      examMode: 'university',
      examFamily: null,
      chapters: [{ id: 'ch1', name: 'Trees', topics: ['Binary Search Trees'] }],
    },
    {
      id: 'JEE-PHY',
      code: 'JEE-PHY',
      name: 'Physics',
      examMode: 'competitive',
      examFamily: 'JEE_MAIN',
      chapters: [{ id: 'ch2', name: 'Kinematics', topics: ['Motion in 1D'] }],
    },
  ],
  competitiveSubjects: {
    JEE: ['Physics', 'Chemistry', 'Mathematics'],
    NEET: ['Physics', 'Chemistry', 'Biology'],
  },
}

let queryClient
const cleanups = []

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  mocks.paperData = { config: CATALOG }
  mocks.libraryPapers = [
    {
      id: 'paper-lib-1',
      title: 'Midterm — Data Structures',
      status: 'Ready',
      domain: 'University',
      course: 'CS501 — Data Structures & Algorithms',
      subject: 'Data Structures & Algorithms',
      totalMarks: 50,
      duration: 120,
      questions: 2,
      selectedQuestionIds: ['gen-q-101', 'gen-q-102'],
      questionList: mocks.questions,
      created: '2026-08-31',
      createdAt: '2026-08-31T10:00:00Z',
      generationId: 'gen-lib-1',
    },
  ]
  mocks.createdPayloads = []
  mocks.updatedPayloads = []
  mocks.downloadCalls = []
  mocks.editPaperCalls = []
  mocks.generationStatus = 'READY'
  mocks.currentGen = null
})

afterEach(() => {
  while (cleanups.length) cleanups.shift()()
  document.body.innerHTML = ''
})

function mountGenerator(props = {}, initialEntries = ['/?mode=Competitive&exam=JEE&subject=Physics']) {
  const view = renderDom(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <PaperGeneratorTab {...props} />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
  cleanups.push(view.unmount)
  return view
}

function mountLibrary(props = {}) {
  const view = renderDom(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter>
          <PaperLibraryTab {...props} />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  )
  cleanups.push(view.unmount)
  return view
}

function changeInputValue(input, val) {
  act(() => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    nativeInputValueSetter.call(input, val)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

describe('Question Paper Studio & Paper Library Workflow — Comprehensive Suite', () => {
  it('Requirement 1: Removes duplicate Question Bank section; renders only Section 5 Question Generation', async () => {
    const view = mountGenerator()
    await settle(40)
    const text = view.container.textContent

    // Section 5 should be present
    expect(text).toContain('Question Generation')

    // Duplicate Section 6 Question Bank must NOT exist in the generator
    expect(text).not.toContain('Section 6')
    expect(text).not.toContain('Question Bank (select questions for paper)')
    expect(text).not.toMatch(/6\s*Question Bank/i)

    // Sections should only go up to 5
    const sectionHeaders = view.container.querySelectorAll('section')
    expect(sectionHeaders.length).toBe(5)
  })

  it('Requirement 2 & 9: Proper Generate button state lifecycle and clean reset on Save Paper', async () => {
    const view = mountGenerator({}, ['/?mode=Competitive&exam=JEE&subject=Physics'])
    await settle(40)

    const genBtn = view.container.querySelector('[data-testid="generate-questions-button"]')
    expect(genBtn).toBeTruthy()
    expect(genBtn.textContent).toContain('Generate Questions')
    expect(genBtn.disabled).toBe(false)

    // Fill title
    const titleInput = view.container.querySelector('input')
    expect(titleInput).toBeTruthy()
    changeInputValue(titleInput, 'JEE Physics Mechanics Paper 2026')
    await settle(20)

    // Click Generate
    await act(async () => {
      genBtn.click()
    })
    await settle(50)

    // Now questions should be displayed and checkboxes selected
    const checkbox1 = view.container.querySelector('[data-testid="question-checkbox-gen-q-101"]')
    expect(checkbox1).toBeTruthy()
    expect(checkbox1.checked).toBe(true)

    // Save Paper button should be enabled
    const saveBtn = view.container.querySelector('[data-testid="save-paper-button"]')
    expect(saveBtn).toBeTruthy()
    expect(saveBtn.textContent).toContain('Save Paper')

    // Click Save Paper
    await act(async () => {
      saveBtn.click()
    })
    await settle(50)

    // Verify backend received status 'ready', generationId, and selectedQuestionIds
    expect(mocks.createdPayloads.length).toBe(1)
    const saved = mocks.createdPayloads[0]
    expect(saved.title).toBe('JEE Physics Mechanics Paper 2026')
    expect(saved.status).toBe('ready')
    expect(saved.generationId).toBe('gen-session-999')
    expect(saved.selectedQuestionIds).toEqual(['gen-q-101', 'gen-q-102'])

    // Generator resets to clean state
    expect(view.container.textContent).toContain('No questions generated yet.')
  })

  it('Requirement 4 & 5: Edit Paper -> DRAFT workflow, banner, and Confirm Changes', async () => {
    const editPaper = mocks.libraryPapers[0]
    const onClearEdit = vi.fn()
    const view = mountGenerator({ editPaper, onClearEdit })
    await settle(40)

    const text = view.container.textContent
    // Verify DRAFT badge and Edit Banner
    expect(text).toContain('Editing · DRAFT')
    expect(text).toContain('You are currently editing')
    expect(text).toContain('Midterm — Data Structures')

    // Confirm Changes button
    const confirmBtn = view.container.querySelector('[data-testid="save-paper-button"]')
    expect(confirmBtn).toBeTruthy()
    expect(confirmBtn.textContent).toContain('Confirm Changes')

    // Edit title
    const titleInput = view.container.querySelector('input')
    expect(titleInput).toBeTruthy()
    changeInputValue(titleInput, 'Midterm — Data Structures (Updated)')
    await settle(20)

    // Click Confirm Changes
    await act(async () => {
      confirmBtn.click()
    })
    await settle(50)

    // Verify update was sent with status 'ready'
    expect(mocks.updatedPayloads.length).toBe(1)
    const updated = mocks.updatedPayloads[0]
    expect(updated.id).toBe('paper-lib-1')
    expect(updated.payload.title).toBe('Midterm — Data Structures (Updated)')
    expect(updated.payload.status).toBe('ready')
    expect(onClearEdit).toHaveBeenCalled()
  })

  it('Requirement 6: Paper Library card renders primary actions [View], [Edit], [Share], [Download], [Delete] and removes deprecated actions', async () => {
    const onEdit = vi.fn()
    const onView = vi.fn()
    const onShare = vi.fn()
    const onDelete = vi.fn()
    const onDownload = vi.fn()

    const view = renderDom(
      <ToastProvider>
        <MemoryRouter>
          <PaperCard
            paper={mocks.libraryPapers[0]}
            onEdit={onEdit}
            onView={onView}
            onShare={onShare}
            onDelete={onDelete}
            onDownload={onDownload}
          />
        </MemoryRouter>
      </ToastProvider>,
    )
    cleanups.push(view.unmount)
    await settle(30)

    const text = view.container.textContent

    // Primary action buttons present
    expect(text).toContain('View')
    expect(text).toContain('Edit')
    expect(text).toContain('Share')
    expect(text).toContain('Download')
    const deleteBtn = view.container.querySelector('button[aria-label="Delete paper"]')
    expect(deleteBtn).toBeTruthy()

    // Removed toolbar buttons absent
    expect(text).not.toContain('Duplicate')
    expect(text).not.toContain('Archive')
    expect(text).not.toContain('DOCX')
    expect(text).not.toContain('Print')
    expect(text).not.toMatch(/\bV1\b/)

    // Metadata displayed
    expect(text).toContain('Midterm — Data Structures')
    expect(text).toContain('Ready')
    expect(text).toContain('50 marks')
    expect(text).toContain('120 min')
    expect(text).toContain('2 questions')

    // Click Download button
    const downloadBtn = view.container.querySelector('button[aria-label="Download paper"]')
    expect(downloadBtn).toBeTruthy()
    await act(async () => {
      downloadBtn.click()
    })
    expect(onDownload).toHaveBeenCalledWith(mocks.libraryPapers[0])

    // Click Delete button
    await act(async () => {
      deleteBtn.click()
    })
    expect(onDelete).toHaveBeenCalledWith(mocks.libraryPapers[0])
  })

  it('Requirement 7: Real PDF Download button triggers download handler in Paper Library Tab', async () => {
    const onEditPaper = vi.fn()
    const view = mountLibrary({ onEditPaper })
    await settle(40)

    const downloadBtn = view.container.querySelector('button[aria-label="Download paper"]')
    expect(downloadBtn).toBeTruthy()

    await act(async () => {
      downloadBtn.click()
    })
    await settle(30)

    expect(mocks.downloadCalls.length).toBe(1)
    expect(mocks.downloadCalls[0].id).toBe('paper-lib-1')
    expect(mocks.downloadCalls[0].title).toBe('Midterm — Data Structures')
  })

  it('Requirement 8: Shows ONLY current generation questions and no fallback/seeded questions', async () => {
    mocks.currentGen = {
      id: 'gen-persisted-123',
      status: 'READY',
      requestedCount: 2,
    }
    const view = mountGenerator()
    await settle(40)

    const text = view.container.textContent
    expect(text).toContain('What is the time complexity of searching in a balanced BST?')
    expect(text).toContain('Which tree traversal visits the root node first?')
    // Must NOT contain arbitrary database questions
    expect(text).not.toContain('Sample Question')
    expect(text).not.toContain('Which traversal uses a queue?')
  })
})
