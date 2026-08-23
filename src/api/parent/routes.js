/**
 * Parent API — Parent/Guardian portal reads.
 *
 * The Parent portal is disabled by FEATURE_FLAGS.parentPortal (future
 * version); its endpoints and datasets are preserved untouched.
 */
import { defineRoute } from '../core/router'
import {
  parentProfile, parentDashboard, parentProgress, parentAttendance, parentPerformance,
  parentExamResults, parentCommunication, parentAIInsights, parentReports,
} from '@/datasets/parent/core.js'
import {
  parentAssignments, parentFees, parentBehavior, parentCalendarEvents,
  parentDownloads, parentNotifications, parentSettings,
} from '@/datasets/parent/portal.js'

/* ---------------- Parent ---------------- */
defineRoute('get', '/parent/profile', () => parentProfile)
defineRoute('get', '/parent/dashboard', () => parentDashboard)
defineRoute('get', '/parent/progress', () => parentProgress)
defineRoute('get', '/parent/attendance', () => parentAttendance)
defineRoute('get', '/parent/performance', () => parentPerformance)
defineRoute('get', '/parent/exam-results', () => ({ items: parentExamResults }))
defineRoute('get', '/parent/communication', () => parentCommunication)
defineRoute('get', '/parent/ai-insights', () => ({ items: parentAIInsights }))
defineRoute('get', '/parent/reports', () => ({ items: parentReports }))

/* ---------------- Parent (extra) ---------------- */
defineRoute('get', '/parent/assignments', () => ({ items: parentAssignments }))
defineRoute('get', '/parent/fees', () => parentFees)
defineRoute('get', '/parent/behavior', () => parentBehavior)
defineRoute('get', '/parent/events', () => ({ items: parentCalendarEvents }))
defineRoute('get', '/parent/downloads', () => ({ items: parentDownloads }))
defineRoute('get', '/parent/notifications', () => ({ items: parentNotifications }))
defineRoute('get', '/parent/settings', () => parentSettings)
defineRoute('patch', '/parent/settings', ({ body }) => ({ ok: true, settings: { ...parentSettings, ...body } }))
