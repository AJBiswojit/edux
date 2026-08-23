/**
 * Faculty API — AI Question Studio.
 * Source Library · Source Analysis · Generation · Review · Approval ·
 * Sessions · simulated upload. Approved questions sync into the EXISTING
 * Question Bank / competitive foundation. All persistence is prototype
 * localStorage (`aurora_question_studio_sessions`).
 */
import { defineRoute } from '../core/router'
import { questionStudioSources } from '@/intelligence/faculty/datasets/question-studio-sources'
import {
  analyzeSource, generateQuestions, regenerateQuestion, computeStudioMetrics,
  syncStudioQuestionsToBank,
} from '@/intelligence/faculty'

const SESSION_KEY = 'aurora_question_studio_sessions'

function readSessions() {
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY) || '[]')
  } catch {
    return []
  }
}
function writeSessions(sessions) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessions))
  } catch { /* storage unavailable */ }
}
function reSync() {
  syncStudioQuestionsToBank(readSessions())
}

/* keep the bank in sync on registration (approved questions persist) */
try { reSync() } catch { /* storage unavailable at module scope */ }

const sourceOf = (id) => questionStudioSources.find((s) => s.sourceId === id)
const sessionOf = (id) => readSessions().find((s) => s.studioSessionId === id)

/* ---------------- Summary + metrics ---------------- */
defineRoute('get', '/faculty/question-studio', () => {
  const sessions = readSessions()
  reSync()
  return { metrics: computeStudioMetrics(sessions), sources: questionStudioSources.map((s) => ({
    sourceId: s.sourceId, title: s.title, shortTitle: s.shortTitle, sourceType: s.sourceType,
    domain: s.domain, exam: s.exam, subject: s.subject, chapter: s.chapter, pageCount: s.pageCount,
    featured: !!s.featured, sourceLabel: s.sourceLabel, questionCountGenerated: s.questionCountGenerated,
    approvedQuestionCount: s.approvedQuestionCount, analysisStatus: s.analysisStatus,
    uploadedAt: s.uploadedAt, lastAnalyzedAt: s.lastAnalyzedAt, topics: s.topics,
  })) }
})

/* ---------------- Source Library ---------------- */
defineRoute('get', '/faculty/question-studio/sources', ({ params }) => {
  let items = questionStudioSources.map((s) => ({ ...s }))
  const { search, domain, exam, subject, sourceType, status, featured } = params ?? {}
  if (search) { const q = search.toLowerCase(); items = items.filter((s) => `${s.title} ${s.subject} ${s.chapter} ${s.sourceType}`.toLowerCase().includes(q)) }
  if (domain && domain !== 'All') items = items.filter((s) => s.domain === domain)
  if (exam && exam !== 'All') items = items.filter((s) => !s.exam || s.exam === exam || String(s.exam).includes(exam))
  if (subject && subject !== 'All') items = items.filter((s) => s.subject === subject)
  if (sourceType && sourceType !== 'All') items = items.filter((s) => s.sourceType === sourceType)
  if (status && status !== 'All') items = items.filter((s) => s.analysisStatus === status)
  if (featured === 'true') items = items.filter((s) => s.featured)
  return { items, count: items.length, total: questionStudioSources.length }
})

defineRoute('get', '/faculty/question-studio/sources/:id', ({ params }) => {
  const source = sourceOf(params.id)
  if (!source) {
    const err = new Error('Source not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  return { source }
})

/* ---------------- Source analysis ---------------- */
defineRoute('post', '/faculty/question-studio/sources/:id/analyze', ({ params }) => {
  const source = sourceOf(params.id)
  if (!source) {
    const err = new Error('Source not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const analysis = analyzeSource(source)
  return { analysis, ok: true, note: 'Prototype Content Intelligence — deterministic analysis, no real AI call.' }
})

/* ---------------- Simulated upload ---------------- */
defineRoute('post', '/faculty/question-studio/sources/upload', ({ body }) => {
  const name = String(body?.name ?? 'Untitled').toLowerCase()
  const sourceType = body?.type ?? 'PDF'
  /* map the uploaded file name to the closest curated demo source */
  const candidates = [
    ['biomolecul', 'SRC-BIO-BIOMOL-001'], ['digest', 'SRC-BIO-DIGEST-002'], ['law', 'SRC-PHY-LAWS-003'],
    ['work', 'SRC-PHY-WEP-004'], ['bond', 'SRC-CHE-BOND-005'], ['organic', 'SRC-CHE-ORGCHEM-006'],
    ['kinemat', 'SRC-JEE-PHY-KIN-007'], ['limit', 'SRC-JEE-MAT-LIM-008'], ['physiolog', 'SRC-NEET-BIO-PHYS-009'],
    ['tree', 'SRC-UNI-CS501-TREES-010'], ['dbms', 'SRC-UNI-CS502-DBMS-011'], ['process', 'SRC-UNI-CS503-OS-012'],
  ]
  const hit = candidates.find(([kw]) => name.includes(kw))
  const source = hit ? sourceOf(hit[1]) : sourceOf('SRC-BIO-BIOMOL-001')
  return {
    ok: true,
    imported: true,
    message: 'Prototype source imported — no real file processing was performed.',
    source: { ...source, title: body?.name ?? source.title, sourceType, uploadedAt: new Date().toISOString(), analysisStatus: 'Ready' },
    mappedTo: hit ? source.sourceId : 'SRC-BIO-BIOMOL-001',
  }
})

/* ---------------- Generation ---------------- */
defineRoute('post', '/faculty/question-studio/generate', ({ body }) => {
  const source = sourceOf(body?.sourceId)
  if (!source) {
    const err = new Error('Source not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const settings = body?.settings ?? {}
  const sessionId = `qs-${Date.now()}`
  const res = generateQuestions({ source, settings, sessionId })
  const session = {
    studioSessionId: sessionId,
    sourceId: source.sourceId,
    sourceTitle: source.title,
    settings: { ...settings, count: res.generated },
    questions: res.questions,
    status: 'Review Required',
    createdAt: new Date().toISOString(),
    note: 'Prototype Question Generation — deterministic selection from curated demo pools.',
  }
  const sessions = readSessions()
  sessions.unshift(session)
  writeSessions(sessions)
  return { ok: true, session, insufficient: res.insufficient, requested: res.requested, generated: res.generated }
})

/* ---------------- Sessions ---------------- */
defineRoute('get', '/faculty/question-studio/sessions', () => {
  const sessions = readSessions()
  return {
    items: sessions.map((s) => ({
      studioSessionId: s.studioSessionId, sourceId: s.sourceId, sourceTitle: s.sourceTitle,
      settings: s.settings, status: s.status, createdAt: s.createdAt,
      generated: (s.questions ?? []).length,
      approved: (s.questions ?? []).filter((q) => q.approved).length,
      rejected: (s.questions ?? []).filter((q) => q.reviewStatus === 'Rejected').length,
      draft: (s.questions ?? []).filter((q) => q.reviewStatus === 'Draft' || q.reviewStatus === 'Reviewed').length,
    })),
    count: sessions.length,
  }
})

/* Phase 3 — retired GET /faculty/question-studio/sessions/:id (zero consumers;
   the studio tracks the active session from the sessions list + actions). */

/* ---------------- Review actions ---------------- */
defineRoute('post', '/faculty/question-studio/sessions/:id/questions/:qid/regenerate', ({ params }) => {
  const sessions = readSessions()
  const session = sessions.find((s) => s.studioSessionId === params.id)
  if (!session) {
    const err = new Error('Session not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const idx = (session.questions ?? []).findIndex((q) => q.questionId === params.qid)
  if (idx < 0) {
    const err = new Error('Question not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const source = sourceOf(session.sourceId)
  const res = regenerateQuestion({ source, sessionQuestions: session.questions, target: session.questions[idx], sessionId: session.studioSessionId })
  if (res.unavailable) return { ok: false, unavailable: true, message: res.message }
  session.questions[idx] = res.question
  writeSessions(sessions)
  return { ok: true, question: res.question, note: 'Regenerated from the same source chapter/topic/concept/type/difficulty (deterministic pool rotation).' }
})

defineRoute('post', '/faculty/question-studio/sessions/:id/questions/:qid/edit', ({ params, body }) => {
  const sessions = readSessions()
  const session = sessions.find((s) => s.studioSessionId === params.id)
  const q = session?.questions?.find((x) => x.questionId === params.qid)
  if (!session || !q) {
    const err = new Error('Question not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  const allowed = ['question', 'options', 'answerIndex', 'answer', 'explanation', 'difficulty', 'qType', 'chapter', 'topic', 'concept', 'marks', 'negativeMarks']
  allowed.forEach((k) => { if (body?.[k] !== undefined) q[k] = body[k] })
  /* source relationship is never editable */
  writeSessions(sessions)
  return { ok: true, question: q, note: 'Edited — source reference (sourceId/sourceTitle/sourcePage) cannot be changed.' }
})

defineRoute('post', '/faculty/question-studio/sessions/:id/questions/:qid/delete', ({ params }) => {
  const sessions = readSessions()
  const session = sessions.find((s) => s.studioSessionId === params.id)
  if (!session) {
    const err = new Error('Session not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  session.questions = (session.questions ?? []).filter((q) => q.questionId !== params.qid)
  writeSessions(sessions)
  return { ok: true, deleted: params.qid }
})

defineRoute('post', '/faculty/question-studio/sessions/:id/questions/:qid/approve', ({ params }) => {
  const sessions = readSessions()
  const session = sessions.find((s) => s.studioSessionId === params.id)
  const q = session?.questions?.find((x) => x.questionId === params.qid)
  if (!session || !q) {
    const err = new Error('Question not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  q.approved = true
  q.reviewStatus = 'Approved'
  writeSessions(sessions)
  const { added } = syncStudioQuestionsToBank(sessions)
  session._lastSync = added
  return { ok: true, approved: true, question: q, note: `Approved — added to the Question Bank (${added > 0 ? 'synced' : 'already present'}). Never labelled as PYQ.` }
})

defineRoute('post', '/faculty/question-studio/sessions/:id/questions/:qid/reject', ({ params }) => {
  const sessions = readSessions()
  const session = sessions.find((s) => s.studioSessionId === params.id)
  const q = session?.questions?.find((x) => x.questionId === params.qid)
  if (!session || !q) {
    const err = new Error('Question not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  q.approved = false
  q.reviewStatus = 'Rejected'
  writeSessions(sessions)
  return { ok: true, rejected: true, question: q }
})

/* ---------------- Approved pool (integration check) ---------------- */
/* Phase 3 — retired the unread GET /faculty/question-studio/approved list;
   approvals sync into the Question Bank via the per-question action routes
   above, so no data or behavior is lost. */
