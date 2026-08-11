import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getQuery as get } from './query'
import request from '@/api/client'

/* ================= STUDENT (extra) ================= */
export const useStudentPrograms = () => useQuery(get('/student/programs', ['student', 'programs']))
export const useForum = () => useQuery(get('/student/forum', ['student', 'forum']))
export const useSupportTickets = () => useQuery(get('/student/support', ['student', 'support']))
export const useAdmitCard = () => useQuery(get('/student/admit-card', ['student', 'admit-card']))

export function useCreateSupportTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => request({ method: 'post', url: '/student/support', data: payload }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student', 'support'] }),
  })
}

/* ================= FACULTY (extra) ================= */
export const useFacultyCourses = () => useQuery(get('/faculty/courses', ['faculty', 'courses']))
export const useFacultyTimetable = () => useQuery(get('/faculty/timetable', ['faculty', 'timetable']))
export const useFacultyAnnouncements = () => useQuery(get('/faculty/announcements', ['faculty', 'announcements']))
export const useFacultyQuizBuilder = () => useQuery(get('/faculty/quiz-builder', ['faculty', 'quiz-builder']))
export const useFacultyAiStudio = () => useQuery(get('/faculty/ai-studio', ['faculty', 'ai-studio']))
export const useWeakStudents = () => useQuery(get('/faculty/weak-students', ['faculty', 'weak-students']))

/* ================= PARENT (extra) ================= */
export const useParentAssignments = () => useQuery(get('/parent/assignments', ['parent', 'assignments']))
export const useParentFees = () => useQuery(get('/parent/fees', ['parent', 'fees']))
export const useParentBehavior = () => useQuery(get('/parent/behavior', ['parent', 'behavior']))
export const useParentEvents = () => useQuery(get('/parent/events', ['parent', 'events']))
export const useParentDownloads = () => useQuery(get('/parent/downloads', ['parent', 'downloads']))
export const useParentNotifications = () => useQuery(get('/parent/notifications', ['parent', 'notifications']))
export const useParentSettings = () => useQuery(get('/parent/settings', ['parent', 'settings']))

export function useUpdateParentSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => request({ method: 'patch', url: '/parent/settings', data: payload }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parent', 'settings'] }),
  })
}

/* ================= ADMIN (extra) ================= */
export const useAdminRevenue = () => useQuery(get('/admin/revenue', ['admin', 'revenue']))
export const useAdminPrograms = () => useQuery(get('/admin/programs', ['admin', 'programs']))
export const useAdminSubjects = () => useQuery(get('/admin/subjects', ['admin', 'subjects']))
export const useAdminBatches = () => useQuery(get('/admin/batches', ['admin', 'batches']))
export const useAdminCalendar = () => useQuery(get('/admin/calendar', ['admin', 'calendar']))
export const useAdminAttendanceAnalytics = () => useQuery(get('/admin/attendance-analytics', ['admin', 'attendance-analytics']))
export const useAdminAssignmentAnalytics = () => useQuery(get('/admin/assignment-analytics', ['admin', 'assignment-analytics']))
export const useAdminExamAnalytics = () => useQuery(get('/admin/exam-analytics', ['admin', 'exam-analytics']))
export const useAdminQuestionBank = () => useQuery(get('/admin/question-bank', ['admin', 'question-bank']))
export const useAdminScholarships = () => useQuery(get('/admin/scholarships', ['admin', 'scholarships']))
export const useAdminCms = () => useQuery(get('/admin/cms', ['admin', 'cms']))
export const useAdminApiConfig = () => useQuery(get('/admin/api-config', ['admin', 'api-config']))
export const useAdminDataTools = () => useQuery(get('/admin/data-tools', ['admin', 'data-tools']))

/* ================= AI Exam Analysis (student) ================= */
export const useExamAnalysis = () => useQuery(get('/student/exam-analysis', ['student', 'exam-analysis']))
export const useExamAnalysisOptions = () => useQuery(get('/student/exam-analysis/options', ['student', 'exam-analysis', 'options']))
export const useExamAnalysisById = (id) =>
  useQuery({ ...get(`/student/exam-analysis/${id}`, ['student', 'exam-analysis', id]), enabled: !!id })

/* ================= Student Academics hub ================= */
export const useAcademicProfile = () => useQuery(get('/student/academic-profile', ['student', 'academic-profile']))
export const useAcademicResources = () => useQuery(get('/student/academic-resources', ['student', 'academic-resources']))
export const useAcademicProgress = () => useQuery(get('/student/academic-progress', ['student', 'academic-progress']))

/* ================= MediXO Mentor workspace ================= */
export const useMentorWorkspace = () => useQuery(get('/student/mentor/workspace', ['student', 'mentor', 'workspace']))

/* ================= Student Performance & Accuracy ================= */
export const usePerformanceAccuracy = () => useQuery(get('/student/performance-accuracy', ['student', 'performance-accuracy']))

/* ================= AI Question Paper Generator (faculty) ================= */
export const usePaperGenerator = () => useQuery(get('/faculty/paper-generator', ['faculty', 'paper-generator']))

export function usePaperDelete() {
  return useMutation({
    mutationFn: (id) => request({ method: 'delete', url: `/faculty/paper-generator/papers/${id}` }).then((r) => r.data),
  })
}

export function usePaperDuplicate() {
  return useMutation({
    mutationFn: (id) => request({ method: 'post', url: `/faculty/paper-generator/papers/${id}/duplicate` }).then((r) => r.data),
  })
}

export function usePaperCreate() {
  return useMutation({
    mutationFn: (payload) => request({ method: 'post', url: '/faculty/paper-generator/papers', data: payload }).then((r) => r.data),
  })
}

export function usePaperRegenerate() {
  return useMutation({
    mutationFn: (id) => request({ method: 'post', url: `/faculty/paper-generator/papers/${id}/regenerate` }).then((r) => r.data),
  })
}

export function usePaperArchive() {
  return useMutation({
    mutationFn: (id) => request({ method: 'patch', url: `/faculty/paper-generator/papers/${id}/archive` }).then((r) => r.data),
  })
}

export function useCreateReport() {
  return useMutation({
    mutationFn: (payload) => request({ method: 'post', url: '/faculty/reports', data: payload }).then((r) => r.data),
  })
}

export function useDeleteReport() {
  return useMutation({
    mutationFn: (id) => request({ method: 'delete', url: `/faculty/reports/${id}` }).then((r) => r.data),
  })
}

export function useArchiveReport() {
  return useMutation({
    mutationFn: (id) => request({ method: 'patch', url: `/faculty/reports/${id}/archive` }).then((r) => r.data),
  })
}

export function usePaperShare() {
  return useMutation({
    mutationFn: ({ id, payload }) => request({ method: 'post', url: `/faculty/paper-generator/papers/${id}/share`, data: payload }).then((r) => r.data),
  })
}

export function usePaperShares() {
  return useQuery(get('/faculty/paper-generator/shares', ['faculty', 'paper-generator', 'shares']))
}

export const useAdminStudents = () => useQuery(get('/admin/students', ['admin', 'students']))
export const useAdminFaculty = () => useQuery(get('/admin/faculty', ['admin', 'faculty']))

export function useSaveStudioItem() {
  return useMutation({
    mutationFn: (payload) => request({ method: 'post', url: '/faculty/ai-studio/save', data: payload }).then((r) => r.data),
  })
}

/* ================= PYQ Analysis (faculty) ================= */
export const usePYQAnalysis = () => useQuery(get('/faculty/pyq-analysis', ['faculty', 'pyq-analysis']))
export const usePYQFilters = () => useQuery(get('/faculty/pyq-analysis/filters', ['faculty', 'pyq-analysis', 'filters']))
export const usePYQPatterns = () => useQuery(get('/faculty/pyq-analysis/patterns', ['faculty', 'pyq-analysis', 'patterns']))
export const usePYQAnalytics = (subject) =>
  useQuery({
    queryKey: ['faculty', 'pyq-analysis', 'analytics', subject ?? 'ALL'],
    queryFn: () => request({ url: '/faculty/pyq-analysis/analytics', params: { subject } }).then((r) => r.data),
    enabled: !!subject,
  })
