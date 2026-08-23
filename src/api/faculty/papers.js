/**
 * Faculty API — AI Question Paper Generator + Paper Library.
 *
 * Create / regenerate / duplicate / archive / delete / share. Papers mutate
 * the deterministic paper dataset in memory; shares persist to the prototype
 * localStorage registry (`aurora_faculty_paper_shares`).
 * Endpoint contracts unchanged.
 */
import { defineRoute } from '../core/router'
import { paperGenerator } from '@/datasets/faculty/paper-generator.js'

/* ---------------- AI Question Paper Generator (faculty) ---------------- */
/* Return a snapshot so in-memory mutations (delete/duplicate) never corrupt
   the react-query cached reference. */
defineRoute('get', '/faculty/paper-generator', () => ({ ...paperGenerator, generatedPapers: [...paperGenerator.generatedPapers] }))
/* Paper management — delete & duplicate mutate the in-memory dataset so a
   page refresh keeps the same state (mirrors the real backend contract). */
defineRoute('delete', '/faculty/paper-generator/papers/:id', ({ params }) => {
  const idx = paperGenerator.generatedPapers.findIndex((p) => p.id === params.id)
  if (idx >= 0) paperGenerator.generatedPapers.splice(idx, 1)
  return { ok: true, deleted: params.id }
})
defineRoute('post', '/faculty/paper-generator/papers/:id/duplicate', ({ params }) => {
  const src = paperGenerator.generatedPapers.find((p) => p.id === params.id)
  if (!src) return { ok: false }
  const copy = {
    ...src,
    id: `gp_${Date.now()}`,
    paperCode: src.paperCode ? `${src.paperCode}-COPY` : `PAPER-${Date.now()}`,
    title: `${src.title} (Copy)`,
    status: 'Draft',
    generated: new Date().toISOString().slice(0, 10),
    created: new Date().toISOString().slice(0, 10),
    modified: new Date().toISOString().slice(0, 10),
    downloads: 0,
    downloadStatus: 'Not exported',
    deleteStatus: 'Active',
  }
  paperGenerator.generatedPapers.unshift(copy)
  return { ok: true, paper: copy }
})

/* Create a paper — duplicate paper names are rejected (validation lives here
   so every client enforces the same rule). */
defineRoute('post', '/faculty/paper-generator/papers', ({ body }) => {
  const title = String(body?.title ?? '').trim()
  if (!title) return { ok: false, error: 'Paper name is required.' }
  const exists = paperGenerator.generatedPapers.some((p) => p.title.toLowerCase() === title.toLowerCase())
  if (exists) {
    return { ok: false, error: 'Duplicate paper name', message: `A paper named "${title}" already exists — choose a different name.` }
  }
  const today = new Date().toISOString().slice(0, 10)
  const paper = {
    id: `gp_new_${Date.now()}`,
    paperCode: body?.paperCode ?? `PAPER-${Date.now()}`,
    title,
    course: body?.course ?? 'CS501',
    mode: body?.mode ?? 'University',
    examType: body?.examType ?? 'Mid Semester',
    paperType: body?.paperType ?? body?.examType ?? null,
    exam: body?.exam ?? null,
    subject: body?.subject ?? null,
    chapter: body?.chapter ?? null,
    topic: body?.topic ?? null,
    program: body?.program ?? null,
    faculty: 'Dr. Meera Krishnan',
    totalMarks: Number(body?.totalMarks ?? 50),
    duration: Number(body?.duration ?? 120),
    difficulty: body?.difficulty ?? 'Mixed',
    questions: Number(body?.questions ?? 22),
    status: 'Draft',
    generated: today,
    created: today,
    modified: today,
    coverage: Number(body?.coverage ?? 90),
    sets: Number(body?.sets ?? 1),
    downloads: 0,
    downloadStatus: 'Not exported',
    deleteStatus: 'Active',
    archived: false,
    versions: 1,
    blooms: { Remember: 15, Understand: 20, Apply: 35, Analyze: 20, Evaluate: 5, Create: 5 },
    /* Phase 30 — full studio payload (questions + blueprint) */
    questionList: Array.isArray(body?.questionList) ? body.questionList : [],
    config: body?.config ?? null,
    actualDifficulty: body?.actualDifficulty ?? null,
    negativeMarking: body?.negativeMarking ?? null,
    /* Phase 6 — intervention re-tests stay linked to the intervention */
    interventionId: body?.interventionId ?? null,
    retest: !!body?.interventionId,
  }
  paperGenerator.generatedPapers.unshift(paper)
  paperGenerator.versionHistory[paper.id] = [{ version: 'v1.0', date: today, note: 'Initial draft' }]
  return { ok: true, paper }
})

/* Regenerate — new version appended to the paper's version history (prototype). */
defineRoute('post', '/faculty/paper-generator/papers/:id/regenerate', ({ params }) => {
  const p = paperGenerator.generatedPapers.find((x) => x.id === params.id)
  if (!p) return { ok: false, error: 'Paper not found' }
  const history = paperGenerator.versionHistory[p.id] ?? [{ version: 'v1.0', date: p.created, note: 'Initial draft' }]
  const today = new Date().toISOString().slice(0, 10)
  const version = `v1.${history.length}`
  p.modified = today
  p.versions = history.length + 1
  p.coverage = Math.min(100, (p.coverage ?? 90) + 2)
  history.push({ version, date: today, note: `Regenerated — coverage ${p.coverage}%` })
  paperGenerator.versionHistory[p.id] = history
  return { ok: true, paper: p }
})

/* Archive / restore a paper. */
defineRoute('patch', '/faculty/paper-generator/papers/:id/archive', ({ params, body }) => {
  const p = paperGenerator.generatedPapers.find((x) => x.id === params.id)
  if (!p) return { ok: false, error: 'Paper not found' }
  p.archived = body?.archived ?? !p.archived
  return { ok: true, paper: p }
})

/* Share a generated paper to students (Phase 29 — prototype persistence). */
defineRoute('post', '/faculty/paper-generator/papers/:id/share', ({ params, body }) => {
  const paper = paperGenerator.generatedPapers.find((p) => p.id === params.id)
  if (!paper) {
    const err = new Error('Paper not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  let shares = []
  try { shares = JSON.parse(window.localStorage.getItem('aurora_faculty_paper_shares') || '[]') } catch { shares = [] }
  const share = {
    id: `share_${Date.now()}`,
    paperId: paper.id,
    paperTitle: paper.title,
    audience: body?.audience ?? 'Entire class',
    recipients: body?.recipients ?? [],
    message: body?.message ?? '',
    sharedAt: new Date().toISOString(),
    status: 'Sent (prototype)',
  }
  shares.unshift(share)
  try { window.localStorage.setItem('aurora_faculty_paper_shares', JSON.stringify(shares)) } catch { /* storage unavailable */ }
  return { ok: true, share }
})
/* Phase 3 — retired the unread GET /faculty/paper-generator/shares list (the
   share action above stays; nothing lists shares). */
