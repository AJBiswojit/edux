/**
 * EduX Phase 9 — Faculty Question Bank · Backend-ready service.
 *
 * Exposes backend-oriented question fetching with domain isolation.
 * Uses centralized axios client (api) directly, bypassing mock router.
 * No fallback to seeded/mock datasets. Backend unavailable → caller
 * receives error and must render "Question bank unavailable" empty state.
 *
 * Filters: domain (University/Competitive), examFamily (JEE/NEET),
 * subject, chapter, topic, difficulty, questionType, search, page, limit
 */

import { useQuery } from '@tanstack/react-query'
import api from '@/api/axios'

/**
 * Canonical filter shape for backend question query.
 * @param {Object} filters
 * @param {string} filters.domain - University | Competitive
 * @param {string} [filters.examFamily] - JEE | NEET | null for University
 * @param {string} [filters.subject]
 * @param {string} [filters.chapter]
 * @param {string} [filters.topic]
 * @param {string} [filters.difficulty] - Easy | Medium | Hard | Mixed
 * @param {string} [filters.questionType] - MCQ | Short Answer | etc
 * @param {string} [filters.search]
 * @param {number} [filters.page]
 * @param {number} [filters.limit]
 */
export async function fetchQuestions(filters = {}) {
  const params = {}

  // Domain isolation — explicit, never inferred from subject
  if (filters.domain) params.domain = filters.domain
  if (filters.examFamily) params.examFamily = filters.examFamily
  if (filters.subject && filters.subject !== 'All subjects' && filters.subject !== 'All') params.subject = filters.subject
  if (filters.chapter && filters.chapter !== 'All chapters' && filters.chapter !== 'All') params.chapter = filters.chapter
  if (filters.topic && filters.topic !== 'All topics' && filters.topic !== 'All') params.topic = filters.topic
  if (filters.difficulty && filters.difficulty !== 'Mixed' && filters.difficulty !== 'All') params.difficulty = filters.difficulty
  if (filters.questionType && filters.questionType !== 'All') params.questionType = filters.questionType
  if (filters.search) params.search = filters.search
  if (filters.page) params.page = filters.page
  if (filters.limit) params.limit = filters.limit

  // Backend-ready: GET /faculty/question-bank with query params
  // Real backend expected at VITE_API_BASE_URL/faculty/question-bank
  const { data } = await api.get('/faculty/question-bank', { params })
  return data
}

/**
 * Backend-ready hook for question bank.
 * No mock fallback — on error, UI must show unavailable empty state.
 */
export function useFacultyQuestions(filters = {}, options = {}) {
  const enabled = options.enabled !== false
  // Serialize filters into query key for caching; stable order
  const keyFilters = {
    domain: filters.domain ?? 'University',
    examFamily: filters.examFamily ?? null,
    subject: filters.subject ?? null,
    chapter: filters.chapter ?? null,
    topic: filters.topic ?? null,
    difficulty: filters.difficulty ?? null,
    questionType: filters.questionType ?? null,
    search: filters.search ?? null,
    page: filters.page ?? 1,
    limit: filters.limit ?? 50,
  }

  return useQuery({
    queryKey: ['faculty', 'questions', keyFilters],
    queryFn: () => fetchQuestions(filters),
    enabled,
    retry: false, // No retry — backend unavailable is expected in Arena
    staleTime: 1000 * 60 * 5,
  })
}

// Legacy alias for conceptual getQuestions(filters) mentioned in task
export const getQuestions = fetchQuestions

// For components that need only university or competitive pools
export function useUniversityQuestions(filters = {}, options = {}) {
  return useFacultyQuestions({ ...filters, domain: 'University', examFamily: undefined }, options)
}

export function useCompetitiveQuestions(filters = {}, options = {}) {
  return useFacultyQuestions({ ...filters, domain: 'Competitive' }, options)
}
