/**
 * Faculty API — report management (create / delete / archive).
 * The GET /faculty/reports read lives in ./workspace.js; both operate on the
 * same deterministic dataset. Endpoint contracts unchanged.
 */
import { defineRoute } from '../core/router'
import { facultyReports } from '@/datasets/faculty/workspace.js'

/* ---------------- Faculty Reports (management) ---------------- */
defineRoute('post', '/faculty/reports', ({ body }) => {
  const title = String(body?.title ?? '').trim()
  if (!title) return { ok: false, error: 'Report title is required.' }
  const today = new Date().toISOString().slice(0, 10)
  const report = {
    id: `fr_new_${Date.now()}`,
    title,
    type: body?.format ?? 'PDF',
    category: body?.category ?? 'Academic',
    status: 'Ready',
    scope: body?.scope ?? 'All courses',
    period: body?.period ?? 'Current',
    generated: today,
    size: '1.2 MB',
    pages: 8,
    downloads: 0,
    archived: false,
    summary: body?.summary ?? 'Generated from the Faculty Intelligence Foundation.',
    template: body?.template ?? 'Custom',
  }
  facultyReports.unshift(report)
  return { ok: true, report }
})
defineRoute('delete', '/faculty/reports/:id', ({ params }) => {
  const idx = facultyReports.findIndex((r) => r.id === params.id)
  if (idx >= 0) facultyReports.splice(idx, 1)
  return { ok: true, deleted: params.id }
})
defineRoute('patch', '/faculty/reports/:id/archive', ({ params, body }) => {
  const r = facultyReports.find((x) => x.id === params.id)
  if (!r) return { ok: false, error: 'Report not found' }
  r.archived = body?.archived ?? !r.archived
  return { ok: true, report: r }
})
