/**
 * EduX Phase 9 — Faculty Paper Generator & Library · Backend-ready service.
 *
 * All paper operations go through centralized axios client (api) directly,
 * bypassing mock router. No fallback to seeded datasets. No localStorage
 * as source of truth for papers or shares.
 *
 * Endpoints (real backend):
 *  GET    /faculty/paper-generator           -> config + library
 *  POST   /faculty/paper-generator/papers    -> create paper (selectedQuestionIds only)
 *  DELETE /faculty/paper-generator/papers/:id
 *  POST   /faculty/paper-generator/papers/:id/duplicate
 *  POST   /faculty/paper-generator/papers/:id/regenerate
 *  PATCH  /faculty/paper-generator/papers/:id/archive
 *  POST   /faculty/paper-generator/papers/:id/share
 *  GET    /faculty/paper-generator/papers/:id  (optional detail)
 *
 * Domain isolation preserved via domain+examFamily, not subject inference.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/axios'

// --- API functions (backend-ready, no mock) ---

export async function fetchPaperGenerator() {
  const { data } = await api.get('/faculty/paper-generator')
  return data
}

export async function fetchPapers() {
  // Library can be fetched via same endpoint; backend may also expose dedicated list
  const data = await fetchPaperGenerator()
  return {
    generatedPapers: data?.generatedPapers ?? [],
    config: data?.config ?? null,
    versionHistory: data?.versionHistory ?? {},
  }
}

export async function fetchPaperById(id) {
  const { data } = await api.get(`/faculty/paper-generator/papers/${id}`)
  return data
}

/**
 * Create paper — backend contract (Phase 9 updated):
 * {
 *   title,
 *   domain: University|Competitive,
 *   examFamily: JEE|NEET|null,
 *   subject, chapter, topic,
 *   totalMarks, duration, difficulty,
 *   selectedQuestionIds: string[],   // ID-based only, no full objects
 *   course, paperType, examType, program,
 *   negativeMarking, examPattern, bloomPreset, etc (optional blueprint)
 * }
 * No questionList with full objects — builder stores IDs only.
 */
export async function createPaper(payload) {
  // Enforce ID-based builder contract
  const body = {
    title: payload.title,
    domain: payload.domain ?? payload.mode ?? 'University',
    examFamily: payload.examFamily ?? payload.exam ?? null,
    mode: payload.domain ?? payload.mode ?? 'University', // backward compat for backend that still expects mode
    exam: payload.examFamily ?? payload.exam ?? null,
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
    // Blueprint extras (optional, backend may store)
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
  }

  const { data } = await api.post('/faculty/paper-generator/papers', body)
  return data
}

export async function deletePaper(id) {
  const { data } = await api.delete(`/faculty/paper-generator/papers/${id}`)
  return data
}

export async function duplicatePaper(id) {
  const { data } = await api.post(`/faculty/paper-generator/papers/${id}/duplicate`)
  return data
}

export async function regeneratePaper(id) {
  const { data } = await api.post(`/faculty/paper-generator/papers/${id}/regenerate`)
  return data
}

export async function archivePaper(id, archived) {
  const { data } = await api.patch(`/faculty/paper-generator/papers/${id}/archive`, { archived })
  return data
}

export async function sharePaper(id, payload) {
  const { data } = await api.post(`/faculty/paper-generator/papers/${id}/share`, payload)
  return data
}

// --- React Query hooks (backend-ready, no fallback) ---

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

export function usePaperRegenerateBackend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: regeneratePaper,
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

export function usePaperShareBackend() {
  return useMutation({
    mutationFn: ({ id, payload }) => sharePaper(id, payload),
  })
}
