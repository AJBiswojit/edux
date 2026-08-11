/**
 * Faculty — My Students / Batch foundation service hooks (Phase 3/4).
 * Components never read localStorage — they consume the mock API:
 *   Component → Service → Mock API → Student/Batch/Exam intelligence.
 */
import { useQuery } from '@tanstack/react-query'
import request from '@/api/client'
import { getQuery } from './query'

export const useFacultyStudents = () => useQuery(getQuery('/faculty/students', ['faculty', 'students']))

export const useFacultyBatches = () => useQuery(getQuery('/faculty/batches', ['faculty', 'batches']))

export const useFacultyBatch = (id) =>
  useQuery({
    queryKey: ['faculty', 'batches', id],
    queryFn: () => request({ url: `/faculty/batches/${id}` }).then((r) => r.data),
    enabled: !!id,
  })

/** Phase 4 — 360° individual student intelligence bundle. */
export const useFacultyStudent360 = (id) =>
  useQuery({
    queryKey: ['faculty', 'students', id, '360'],
    queryFn: () => request({ url: `/faculty/students/${id}/360` }).then((r) => r.data),
    enabled: !!id,
  })

/** Phase 4 — weak-topic → existing Question Bank connection. */
export const useWeakTopicQuestions = (subject, chapter) =>
  useQuery({
    queryKey: ['faculty', 'weak-topic-questions', subject, chapter],
    queryFn: () => request({ url: '/faculty/students/weak-topic-questions', params: { subject, chapter } }).then((r) => r.data),
    enabled: !!subject && !!chapter,
  })

export const useFacultyAttemptAnalysis = (studentId, attemptId) =>
  useQuery({
    queryKey: ['faculty', 'students', studentId, 'exams', attemptId, 'analysis'],
    queryFn: () => request({ url: `/faculty/students/${studentId}/exams/${attemptId}/analysis` }).then((r) => r.data),
    enabled: !!studentId && !!attemptId,
  })

export default {
  useFacultyStudents, useFacultyBatches, useFacultyBatch,
  useFacultyStudent360, useWeakTopicQuestions,
  useFacultyAttemptAnalysis,
}
