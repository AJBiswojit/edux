/**
 * Student API — academics surfaces (Phase 9 Backend-Ready).
 *
 * Phase 9: Removed examination-specific mock routes:
 *  - GET /student/mock-tests (seeded mockTests)
 *  - GET /student/exams (seeded exams)
 * These are now backend-only via centralized axios client (VITE_API_BASE_URL).
 * No seeded fallback. Backend unavailable → empty state.
 *
 * Retained non-examination surfaces: settings, programs, forum, support, admit-card.
 */
import { defineRoute } from '../core/router'
import { studentSettings } from '@/datasets/student/growth.js'
import { studentPrograms, forumTopics, forumCategories, supportTickets, admitCard } from '@/datasets/student/portal.js'

/* ---------------- Student ---------------- */
/* Phase 9 — examination mocks removed. Student examinations now backend-only. */
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
