/**
 * Faculty Paper Generator & Library — live FastAPI routes.
 *
 * Persistence is SQL `papers` / `paper_questions`. Create sends
 * selectedQuestionIds; publish is POST .../papers/{id}/publish.
 *
 * Endpoints (real backend):
 *  GET    /faculty/paper-generator/catalog            -> generator config
 *  POST   /faculty/paper-generator/papers             -> create paper (selectedQuestionIds only)
 *  DELETE /faculty/paper-generator/papers/:id
 *  POST   /faculty/paper-generator/papers/:id/duplicate
 *  PATCH  /faculty/paper-generator/papers/:id/archive
 *  POST   /faculty/paper-generator/papers/:id/share
 *  POST   /faculty/paper-generator/generate-demo      -> deterministic bank generation
 *  POST   /faculty/paper-generator/generate-ai        -> trigger AI generation
 *  GET    /faculty/paper-generator/ai-status/:jobId   -> poll AI job progress
 *  GET    /faculty/paper-generator/ai-paper/:paperId  -> read back AI questions
 *  GET    /faculty/paper-generator/ai-active          -> resume latest in-progress job
 *  GET    /faculty/paper-generator/ai-library         -> AI paper library
 *
 * Domain isolation preserved via domain+examFamily, not subject inference.
 * `{ ok: false }` HTTP 200 is rejected by the axios interceptor.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'
import { canonicalExamFamily } from '@/api/adapters/questions'
import { normalizePaper, normalizePaperGeneratorPayload } from '@/api/adapters/papers'

export async function fetchPaperGenerator() {
  const { data } = await api.get('/faculty/paper-generator')
  return normalizePaperGeneratorPayload(data)
}

// --- AI generation (external microservice, Option A) ---
// EduX triggers the AI service, polls job status, then reads the questions back.

/** Trigger AI generation. Returns { paper_id, job_id, status, estimated_minutes, ... }. */
export async function generateAiPaper(config) {
  const { data } = await api.post('/faculty/paper-generator/generate-ai', config)
  return data
}

/** Poll an AI generation job's progress. */
export async function fetchAiPaperStatus(jobId) {
  const { data } = await api.get(`/faculty/paper-generator/ai-status/${jobId}`)
  return data
}

/** Read back the finished AI paper + questions (Section 6 review contract). */
export async function fetchAiPaper(paperId) {
  const { data } = await api.get(`/faculty/paper-generator/ai-paper/${paperId}`)
  return data
}

/** Resume support — latest in-progress/recent AI job for the current faculty. */
export async function fetchAiActive() {
  const { data } = await api.get('/faculty/paper-generator/ai-active')
  return data
}

/** Paper Library backed by ai_generated_papers. */
export async function fetchAiLibrary() {
  const { data } = await api.get('/faculty/paper-generator/ai-library')
  return {
    generatedPapers: data?.generatedPapers ?? [],
    versionHistory: data?.versionHistory ?? {},
  }
}

export async function fetchPapers() {
  const data = await fetchPaperGenerator()
  return {
    generatedPapers: data?.generatedPapers ?? [],
    config: data?.config ?? null,
    versionHistory: data?.versionHistory ?? {},
  }
}

/** Live route is not implemented (404). Callers must handle the error — no fake paper. */
export async function fetchPaperById(id) {
  const { data } = await api.get(`/faculty/paper-generator/papers/${id}`)
  return normalizePaper(data?.paper ?? data)
}

/**
 * Create paper — backend contract (Phase 9 updated):
 * selectedQuestionIds only (ID-based, no full objects). Builder stores IDs.
 */
export async function createPaper(payload) {
  const examFamily = payload.domain === 'Competitive' || payload.mode === 'Competitive'
    ? canonicalExamFamily(payload.examFamily ?? payload.exam)
    : null
  const body = {
    title: payload.title,
    domain: payload.domain ?? payload.mode ?? 'University',
    examFamily,
    mode: payload.domain ?? payload.mode ?? 'University',
    exam: examFamily,
    examType: payload.examType ?? payload.paperType ?? 'Mid Semester',
    paperType: payload.paperType ?? payload.examType ?? 'Mid Semester',
    course: payload.course ?? null,
    subject: payload.subject ?? null,
    chapter: payload.chapter ?? null,
    topic: payload.topic ?? null,
    program: payload.program ?? null,
    totalMarks: payload.totalMarks,
    duration: payload.duration,
    difficulty: payload.difficulty ?? 'Mixed',
    questions: payload.selectedQuestionIds?.length ?? payload.questions ?? 0,
    selectedQuestionIds: payload.selectedQuestionIds ?? [],
    bloomPreset: payload.bloomPreset ?? null,
    weightagePreset: payload.weightagePreset ?? null,
    coPreset: payload.coPreset ?? null,
    pyqPreference: payload.pyqPreference ?? null,
    negativeMarking: payload.negativeMarking ?? null,
    examPattern: payload.examPattern ?? null,
    config: payload.config ?? null,
    coverage: payload.coverage ?? 90,
    sets: payload.sets ?? 1,
    interventionId: payload.interventionId ?? null,
    // AI-generation provenance: the QuestionGeneration job ID whose questions
    // were selected for this paper.  Backend uses this to mark the paper as
    // AI-generated so it appears in the Paper Library.  null = non-AI paper.
    generationId: payload.generationId ?? null,
  }

  const { data } = await api.post('/faculty/paper-generator/papers', body)
  return { ...data, paper: data?.paper ? normalizePaper(data.paper) : data?.paper }
}

export async function deletePaper(id) {
  const { data } = await api.delete(`/faculty/paper-generator/papers/${id}`)
  return data
}

export async function duplicatePaper(id) {
  const { data } = await api.post(`/faculty/paper-generator/papers/${id}/duplicate`)
  return { ...data, paper: data?.paper ? normalizePaper(data.paper) : data?.paper }
}

export async function regeneratePaper(id) {
  const { data } = await api.post(`/faculty/paper-generator/papers/${id}/regenerate`)
  return { ...data, paper: data?.paper ? normalizePaper(data.paper) : data?.paper }
}

export async function archivePaper(id, archived) {
  const { data } = await api.patch(`/faculty/paper-generator/papers/${id}/archive`, { archived })
  return { ...data, paper: data?.paper ? normalizePaper(data.paper) : data?.paper }
}

export async function sharePaper(id, payload) {
  const { data } = await api.post(`/faculty/paper-generator/papers/${id}/share`, payload)
  return data
}

export async function publishPaper(id) {
  const { data } = await api.post(`/faculty/paper-generator/papers/${id}/publish`)
  return { ...data, paper: data?.paper ? normalizePaper(data.paper) : data?.paper }
}

export function usePaperGeneratorBackend() {
  return useQuery({
    queryKey: ['faculty', 'paper-generator', 'backend'],
    queryFn: fetchPaperGenerator,
    retry: false,
    staleTime: 1000 * 60 * 2,
  })
}

export function usePaperLibrary() {
  return useQuery({
    queryKey: ['faculty', 'paper-library', 'backend'],
    queryFn: fetchPapers,
    retry: false,
    staleTime: 1000 * 60 * 2,
  })
}

export function useAiPaperLibrary() {
  return useQuery({
    queryKey: ['faculty', 'paper-library', 'ai'],
    queryFn: fetchAiLibrary,
    retry: false,
    staleTime: 1000 * 60 * 2,
  })
}

export function usePaperCreateBackend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPaper,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-generator'] })
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-library'] })
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-generator', 'backend'] })
    },
  })
}

export function usePaperDeleteBackend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePaper,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-generator'] })
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-library'] })
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-generator', 'backend'] })
    },
  })
}

export function usePaperDuplicateBackend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: duplicatePaper,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-generator'] })
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-library'] })
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-generator', 'backend'] })
    },
  })
}

export function usePaperArchiveBackend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archived }) => archivePaper(id, archived),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-generator'] })
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-library'] })
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-generator', 'backend'] })
    },
  })
}

export async function fetchPaperShares() {
  const { data } = await api.get('/faculty/paper-generator/shares')
  return data
}

export function usePaperShares() {
  return useQuery({
    queryKey: ['faculty', 'paper-shares'],
    queryFn: fetchPaperShares,
    retry: false,
    staleTime: 1000 * 60,
  })
}

export function usePaperShareBackend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => sharePaper(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-shares'] })
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-generator'] })
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-library'] })
    },
  })
}

export function usePaperPublishBackend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: publishPaper,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-generator'] })
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-library'] })
      qc.invalidateQueries({ queryKey: ['faculty', 'paper-generator', 'backend'] })
    },
  })
}
