// @vitest-environment jsdom
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { FacultyTab } from '../../src/components/institution-workspace/faculty-tab.jsx'
import { renderDom } from '../setup/dom.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver = IntersectionObserverStub

vi.mock('@/services/faculty-intelligence', () => ({
  useFacultyIntelligence: () => ({ data: null, isLoading: false, isError: false }),
}))

vi.mock('@/components/charts', () => ({
  BarCompare: () => null,
}))

vi.mock('@/components/shared/progress-ring', () => ({
  ProgressRing: ({ label }) => <span>{label}</span>,
  default: ({ label }) => <span>{label}</span>,
}))

const cleanups = []
afterEach(() => {
  while (cleanups.length) cleanups.shift()()
  document.body.innerHTML = ''
})

function mount(data) {
  const view = renderDom(
    <MemoryRouter>
      <FacultyTab data={data} />
    </MemoryRouter>,
  )
  cleanups.push(view.unmount)
  return view.container.textContent || ''
}

describe('Admin Faculty tab — empty institution (assembler only)', () => {
  it('shows 0 faculty and does not render demo roster copy', () => {
    const text = mount({
      derived: {
        totals: { faculty: 0, departments: 0 },
        faculty: { byDept: [], health: {}, rosterCount: 0 },
      },
    })
    expect(text).toContain('No faculty records')
    expect(text).toContain('0 departments')
    expect(text).not.toMatch(/\b640\b/)
    expect(text).not.toContain('8 departments')
    expect(text).not.toContain('Sample roster')
    expect(text).not.toContain('10 of 640')
  })

  it('renders when faculty intelligence is missing (does not block the tab)', () => {
    const text = mount({ derived: { totals: { faculty: 0, departments: 0 }, faculty: { byDept: [] } } })
    expect(text).toContain('Faculty')
    expect(text).toContain('Teaching health')
    expect(text).toContain('—')
  })

  it('uses assembler totals and byDept instead of hardcoded roster numbers', () => {
    const text = mount({
      derived: {
        totals: { faculty: 12, departments: 2 },
        faculty: {
          byDept: [{ code: 'CSE', count: 7 }, { code: 'ECE', count: 5 }],
          health: { score: 70, grade: 'Good', teachingSatisfaction: 80, publicationsPerFaculty: 1.2 },
        },
      },
    })
    expect(text).toContain('12 of 12 faculty')
    expect(text).toContain('2 departments')
    expect(text).toContain('CSE')
    expect(text).toContain('ECE')
    expect(text).not.toMatch(/\b640\b/)
    expect(text).not.toContain('8 departments')
    expect(text).not.toContain('Sample roster')
  })
})
