/**
 * AI Exam Conducting Agent — service hooks.
 * Consume the practice papers and attempt history via the mock API
 * (swap to a real backend with VITE_USE_MOCK=false, zero code changes).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import request from '@/api/client'
import { getQuery } from './query'

export const useExamAgentExams = () => useQuery(getQuery('/student/exam-agent/exams', ['exam-agent', 'exams']))

export const useExamAgentAttempts = () => useQuery(getQuery('/student/exam-agent/attempts', ['exam-agent', 'attempts']))

export const useExamAgentAttempt = (id) =>
  useQuery({
    queryKey: ['exam-agent', 'attempt', id],
    queryFn: () => request({ url: `/student/exam-agent/attempts/${id}` }).then((r) => r.data),
    enabled: !!id,
  })

export function useSaveExamAgentAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => request({ method: 'post', url: '/student/exam-agent/attempts', data: payload }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exam-agent', 'attempts'] }),
  })
}

export default { useExamAgentExams, useExamAgentAttempts, useExamAgentAttempt, useSaveExamAgentAttempt }
