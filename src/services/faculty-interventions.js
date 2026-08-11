/**
 * Faculty — Similar-Issue + Intervention lifecycle service hooks (Phase 5/6).
 * Components consume the mock API; never read localStorage directly.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import request from '@/api/client'

export const useSimilarIssues = (scope = 'all') =>
  useQuery({
    queryKey: ['faculty', 'similar-issues', scope],
    queryFn: () => request({ url: '/faculty/similar-issues', params: { scope } }).then((r) => r.data),
  })

export const useIssueGroup = (id) =>
  useQuery({
    queryKey: ['faculty', 'similar-issues', id],
    queryFn: () => request({ url: `/faculty/similar-issues/${id}` }).then((r) => r.data),
    enabled: !!id,
  })

export const useInterventions = () =>
  useQuery({
    queryKey: ['faculty', 'interventions'],
    queryFn: () => request({ url: '/faculty/interventions' }).then((r) => r.data),
  })

export const useIntervention = (id) =>
  useQuery({
    queryKey: ['faculty', 'interventions', id],
    queryFn: () => request({ url: `/faculty/interventions/${id}` }).then((r) => r.data),
    enabled: !!id,
  })

export const useInterventionPractice = (id) =>
  useQuery({
    queryKey: ['faculty', 'interventions', id, 'practice'],
    queryFn: () => request({ url: `/faculty/interventions/${id}/practice` }).then((r) => r.data),
    enabled: !!id,
  })

export const useInterventionEffectiveness = (id) =>
  useQuery({
    queryKey: ['faculty', 'interventions', id, 'effectiveness'],
    queryFn: () => request({ url: `/faculty/interventions/${id}/effectiveness` }).then((r) => r.data),
    enabled: !!id,
  })

export function useInterventionStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, status, action }) =>
      request({ method: 'post', url: `/faculty/interventions/${groupId}/status`, data: { status, action } }).then((r) => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['faculty', 'interventions'] }); queryClient.invalidateQueries({ queryKey: ['faculty', 'similar-issues'] }) },
  })
}

export function useInterventionModify() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, payload }) =>
      request({ method: 'post', url: `/faculty/interventions/${groupId}/modify`, data: payload }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faculty', 'interventions'] }),
  })
}

export function useInterventionAssign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId }) => request({ method: 'post', url: `/faculty/interventions/${groupId}/assign` }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faculty', 'interventions'] }),
  })
}

export function useCreateRetest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, payload }) =>
      request({ method: 'post', url: `/faculty/interventions/${groupId}/retest`, data: payload }).then((r) => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['faculty', 'interventions'] }); queryClient.invalidateQueries({ queryKey: ['faculty', 'similar-issues'] }) },
  })
}

export const useRelatedResources = (params) =>
  useQuery({
    queryKey: ['faculty', 'interventions', 'related-resources', params],
    queryFn: () => request({ url: '/faculty/interventions/related-resources', params }).then((r) => r.data),
    enabled: !!(params?.subject && params?.chapter),
  })

/* ---------------- student side ---------------- */
export const useStudentInterventions = (studentId) =>
  useQuery({
    queryKey: ['student', 'interventions', studentId],
    queryFn: () => request({ url: '/student/interventions', params: { studentId } }).then((r) => r.data),
  })

export const useStudentInterventionPractice = (id) =>
  useQuery({
    queryKey: ['student', 'interventions', id, 'practice'],
    queryFn: () => request({ url: `/student/interventions/${id}/practice` }).then((r) => r.data),
    enabled: !!id,
  })

export const useStudentInterventionRetest = (id) =>
  useQuery({
    queryKey: ['student', 'interventions', id, 'retest'],
    queryFn: () => request({ url: `/student/interventions/${id}/retest` }).then((r) => r.data),
    enabled: !!id,
  })

export function useSubmitInterventionAttempt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ interventionId, payload }) =>
      request({ method: 'post', url: `/student/interventions/${interventionId}/practice-attempts`, data: payload }).then((r) => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['student', 'interventions'] }); queryClient.invalidateQueries({ queryKey: ['faculty', 'interventions'] }) },
  })
}

export const useFacultyStudentInterventions = (studentId) =>
  useQuery({
    queryKey: ['faculty', 'students', studentId, 'interventions'],
    queryFn: () => request({ url: `/faculty/students/${studentId}/interventions` }).then((r) => r.data),
    enabled: !!studentId,
  })

export default {
  useSimilarIssues, useIssueGroup, useInterventions, useIntervention, useInterventionPractice,
  useInterventionEffectiveness, useInterventionStatus, useInterventionModify, useInterventionAssign,
  useCreateRetest, useRelatedResources, useStudentInterventions, useStudentInterventionPractice,
  useStudentInterventionRetest, useSubmitInterventionAttempt, useFacultyStudentInterventions,
}
