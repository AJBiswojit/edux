/**
 * Student API — academics surfaces (mock tests, exams, settings) and the
 * campus portal reads (programs, forum, support, admit card).
 *
 * "Mock test" here is product domain terminology (a practice/full-length
 * test), not prototype scaffolding — the /student/mock-tests contract is
 * preserved verbatim.
 */
import { defineRoute } from '../core/router'
import { mockTests, exams } from '@/datasets/student/academics.js'
import { studentSettings } from '@/datasets/student/growth.js'
import { studentPrograms, forumTopics, forumCategories, supportTickets, admitCard } from '@/datasets/student/portal.js'

/* ---------------- Student ---------------- */
/* Phase 3 — retired the legacy per-page student reads (profile, dashboard,
   attendance, assignments, courses, course detail, subjects, events). Those
   pages consume the Student Intelligence Foundation snapshot
   (/intelligence/summary). */
defineRoute('get', '/student/mock-tests', () => ({ items: mockTests }))
defineRoute('get', '/student/exams', () => ({ items: exams }))
defineRoute('get', '/student/settings', () => studentSettings)
defineRoute('patch', '/student/settings', ({ body }) => ({ ok: true, settings: { ...studentSettings, ...body } }))

/* ---------------- Student (extra) ---------------- */
defineRoute('get', '/student/programs', () => studentPrograms)
defineRoute('get', '/student/forum', () => ({ topics: forumTopics, categories: forumCategories }))
defineRoute('get', '/student/support', () => ({ tickets: supportTickets }))
defineRoute('post', '/student/support', ({ body }) => ({
  ok: true,
  ticket: {
    id: `st_${Date.now()}`,
    title: body?.title,
    category: body?.category ?? 'Technical',
    status: 'Open',
    priority: body?.priority ?? 'Medium',
    created: new Date().toISOString(),
    messages: 1,
  },
}))
defineRoute('get', '/student/admit-card', () => admitCard)
