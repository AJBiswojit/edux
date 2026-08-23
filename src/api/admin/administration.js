/**
 * Admin API — institution administration reads (users, departments, courses,
 * research, governance, revenue, programs, subjects, batches, calendar,
 * question bank, scholarships, CMS, API config, data tools).
 * Endpoint contracts unchanged.
 */
import { defineRoute } from '../core/router'
import { ADMIN_USERS, DEPARTMENTS } from '@/datasets/platform/users.js'
import {
  adminCourses,
  adminResearch, adminRoles, adminPermissions, adminAuditLogs, adminAiConfig, adminSettings,
} from '@/datasets/admin/core.js'
import {
  adminRevenue, adminPrograms, adminSubjects, adminBatches, adminAcademicCalendar,
  adminQuestionBank, adminScholarships, adminCms, adminApiConfig, adminDataTools,
} from '@/datasets/admin/operations.js'

/* ---------------- Admin ---------------- */
/* Phase 3 — retired GET /admin/dashboard: the admin dashboard consumes
   /admin-intelligence/summary. */
defineRoute('get', '/admin/users', () => ({ users: ADMIN_USERS }))
defineRoute('get', '/admin/departments', () => ({ departments: DEPARTMENTS }))
defineRoute('get', '/admin/courses', () => ({ courses: adminCourses }))
/* Phase 3 — retired GET /admin/analytics|performance|placements (their pages
   were removed in Phase 2; the datasets remain inside the Institution
   Intelligence engines). */
defineRoute('get', '/admin/research', () => adminResearch)
defineRoute('get', '/admin/roles', () => ({ roles: adminRoles }))
defineRoute('get', '/admin/permissions', () => ({ modules: adminPermissions }))
defineRoute('get', '/admin/audit-logs', () => ({ logs: adminAuditLogs }))
defineRoute('get', '/admin/ai-config', () => adminAiConfig)
defineRoute('get', '/admin/settings', () => adminSettings)

/* ---------------- Admin (extra) ---------------- */
defineRoute('get', '/admin/revenue', () => adminRevenue)
defineRoute('get', '/admin/programs', () => ({ programs: adminPrograms }))
defineRoute('get', '/admin/subjects', () => ({ subjects: adminSubjects }))
defineRoute('get', '/admin/batches', () => ({ batches: adminBatches }))
defineRoute('get', '/admin/calendar', () => ({ events: adminAcademicCalendar }))
/* Phase 3 — retired the three legacy admin analytics reads (pages removed in
   Phase 2; datasets still power the Institution Intelligence engines). */
defineRoute('get', '/admin/question-bank', () => adminQuestionBank)
defineRoute('get', '/admin/scholarships', () => ({ items: adminScholarships }))
defineRoute('get', '/admin/cms', () => adminCms)
defineRoute('get', '/admin/api-config', () => adminApiConfig)
defineRoute('get', '/admin/data-tools', () => adminDataTools)
