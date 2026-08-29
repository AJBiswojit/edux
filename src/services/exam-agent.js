/**
 * AI Exam Conducting Agent — live GET/POST /student/exam-agent/*.
 *
 * Practice papers come from published SQL `papers` (seeded exam-agent set).
 * Faculty-generated KV drafts are NOT in this list (GAP-03 / GAP-05).
 * Question payloads must not include `correctAnswer`; scoring is server-side.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import request from '@/api/client'
import { adaptAttemptDetail, adaptAttemptList, adaptExamAgentExams, normalizeAttempt } from '@/api/adapters/attempts'

export const useExamAgentExams = () =>
  useQuery({
    queryKey: ['exam-agent', 'exams'],
    queryFn: () => request({ url: '/student/exam-agent/exams' }).then((r) => adaptExamAgentExams(r.data)),
    retry: false,
    staleTime: 1000 * 60 * 2,
  })

export const useExamAgentAttempts = () =>
  useQuery({
    queryKey: ['exam-agent', 'attempts'],
    queryFn: () => request({ url: '/student/exam-agent/attempts' }).then((r) => adaptAttemptList(r.data)),
    retry: false,
  })

export const useExamAgentAttempt = (id) =>
  useQuery({
    queryKey: ['exam-agent', 'attempt', id],
    queryFn: () => request({ url: `/student/exam-agent/attempts/${id}` }).then((r) => adaptAttemptDetail(r.data)),
    enabled: !!id,
    retry: false,
  })

export function useSaveExamAgentAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) =>
      request({ method: 'post', url: '/student/exam-agent/attempts', data: payload }).then((r) => {
        const data = r.data
        return {
          ...data,
          attempt: data?.attempt ? normalizeAttempt(data.attempt) : data?.attempt,
        }
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exam-agent', 'attempts'] }),
  })
}

export default { useExamAgentExams, useExamAgentAttempts, useExamAgentAttempt, useSaveExamAgentAttempt }
