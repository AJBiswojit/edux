/**
 * Student API — MediXO Mentor workspace snapshot.
 * Endpoint contract unchanged (GET /student/mentor/workspace).
 */
import { defineRoute } from '../core/router'
import {
  mentorResources, mentorLearningHistory, mentorQuickTopics, mentorConcepts, mentorNotes,
  mentorPracticeSets, mentorQuizBank, mentorRevisionPlans,
} from '@/datasets/student/mentor.js'
import {
  aiConversations, suggestedQuestions, quickPrompts, resourceRecommendations,
  generatedNotes, downloads, completedRecommendations,
} from '@/intelligence/datasets/workspace.js'

/* ---------------- MediXO Mentor workspace ---------------- */
defineRoute('get', '/student/mentor/workspace', () => ({
  resources: mentorResources,
  learningHistory: mentorLearningHistory,
  quickTopics: mentorQuickTopics,
  concepts: mentorConcepts,
  notes: mentorNotes,
  practiceSets: mentorPracticeSets,
  quizBank: mentorQuizBank,
  revisionPlans: mentorRevisionPlans,
  conversations: aiConversations,
  suggestedQuestions,
  quickPrompts,
  resourceRecommendations,
  generatedNotes,
  downloads,
  completedRecommendations,
}))

/* ---------------- Student Performance & Accuracy ---------------- */
/* Phase 3 — retired the unused static GET /student/performance-accuracy read;
   the page derives everything from the Student Intelligence snapshot. */
