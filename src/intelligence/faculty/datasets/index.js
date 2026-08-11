/**
 * Faculty Intelligence — centralized dataset aggregation.
 *
 * The single source of truth for every faculty dataset. Existing mock data
 * (courses, attendance, assignments, question bank, papers, PYQ, quiz,
 * exam blueprint, cohorts, weak students, analytics) is RE-EXPORTED here so
 * future modules import ONE place and never maintain isolated copies.
 * New datasets (classes/sections, teaching schedule, engagement, resources,
 * notifications, recommendation/insight pools) live alongside.
 */

/* ---- existing faculty mock data (re-exported, not duplicated) ---- */
import { facultyProfile, facultyDashboard, facultyAttendance, facultyAssignments, questionBank } from '../../../mock-data/faculty.js'
import { facultyStudentAnalytics, facultyResearch, facultyLecturePlanner, facultyExamBuilder, facultyReports, facultySettings } from '../../../mock-data/faculty.js'
import {
  facultyCourses, facultyTimetable, facultyAnnouncements, facultyQuizBuilder,
  facultyAiStudio, weakStudentDetection,
} from '../../../mock-data/faculty-extra.js'
import { paperGenerator } from '../../../mock-data/paper-generator.js'
import { pyqAnalysis, pyqFilters, pyqPatterns, pyqVariants } from '../../../mock-data/pyq-analysis.js'
import { aiTeachingAssistantThreads, copilotSuggestions, graphSearch, aiConversationStats } from '../../../mock-data/ai.js'

/* ---- new datasets ---- */
import { facultySections, teachingSchedule, teachingCalendar, weeklyTeachingHours, courseTitleFor, colorFor } from './classes.js'
import { studentEngagementInputs, studentEngagementScores, teachingResources, facultyNotifications } from './engagement.js'
import {
  teachingRecommendationsPool, teachingInsightsPool, aiAssistantContext,
  facultyDashboardSummaryInputs, assessmentSummaryInputs, revisionSessions,
} from './intelligence.js'
import { assessmentLibrary, questionCoverage, questionTags, pyqTrends, assessmentHealthInputs } from './assessment.js'
import { competitiveQuestions, universityPyqQuestions } from './competitive-questions.js'
import { reportTemplates, exportHistory, reportSchedule } from './reports.js'
import {
  assistantPrompts, contentStudioTypes, evaluationWorkflows, studioResources,
  studioRecentUploads, facultyPortfolio, aiStudioHistory, savedLessonPlans,
} from './ai-studio.js'
import {
  facultyBatches, facultyStudents,
} from './students-directory.js'

export const facultyDatasets = {
  /* core */
  profile: facultyProfile,
  facultyDashboard,
  courses: facultyCourses,
  sections: facultySections,
  timetable: facultyTimetable,
  teachingSchedule,
  teachingCalendar,
  weeklyTeachingHours,
  announcements: facultyAnnouncements,

  /* academic */
  attendance: facultyAttendance,
  assignments: facultyAssignments,
  questionBank,
  questionPapers: paperGenerator.generatedPapers,
  paperGenerator,
  pyqAnalysis,
  pyqFilters,
  pyqPatterns,
  pyqVariants,
  quizBuilder: facultyQuizBuilder,
  examBuilder: facultyExamBuilder,
  lecturePlanner: facultyLecturePlanner,

  /* students */
  studentAnalytics: facultyStudentAnalytics,
  weakStudentDetection,
  engagement: studentEngagementInputs,
  engagementScores: studentEngagementScores,

  /* teaching intelligence */
  aiStudio: facultyAiStudio,
  research: facultyResearch,
  reports: facultyReports,
  settings: facultySettings,
  aiAssistantThreads: aiTeachingAssistantThreads,
  copilotSuggestions,
  graphSearch,
  aiConversationStats,

  /* new pools */
  dashboardSummaryInputs: facultyDashboardSummaryInputs,
  assessmentSummaryInputs,
  recommendationsPool: teachingRecommendationsPool,
  insightsPool: teachingInsightsPool,
  aiAssistantContext,
  resources: teachingResources,
  notifications: facultyNotifications,
  revisionSessions,

  /* assessment intelligence */
  assessmentLibrary,
  questionCoverage,
  questionTags,
  pyqTrends,
  competitiveQuestions,
  universityPyqQuestions,
  assessmentHealthInputs,

  /* reports intelligence */
  reportTemplates,
  exportHistory,
  reportSchedule,

  /* ai teaching studio */
  assistantPrompts,
  contentStudioTypes,
  evaluationWorkflows,
  studioResources,
  studioRecentUploads,
  facultyPortfolio,
  aiStudioHistory,
  savedLessonPlans,

  /* student directory (Phase 3) */
  facultyBatches,
  facultyStudents,
}

export {
  facultyProfile, facultyDashboard, facultyAttendance, facultyAssignments, questionBank,
  facultyStudentAnalytics, facultyResearch, facultyLecturePlanner, facultyExamBuilder,
  facultyReports, facultySettings, facultyCourses, facultyTimetable, facultyAnnouncements,
  facultyQuizBuilder, facultyAiStudio, weakStudentDetection, paperGenerator,
  pyqAnalysis, pyqFilters, pyqPatterns, pyqVariants,
  aiTeachingAssistantThreads, copilotSuggestions, graphSearch, aiConversationStats,
  facultySections, teachingSchedule, teachingCalendar, weeklyTeachingHours,
  courseTitleFor, colorFor, studentEngagementInputs, studentEngagementScores, teachingResources, facultyNotifications,
  teachingRecommendationsPool, teachingInsightsPool, aiAssistantContext,
  facultyDashboardSummaryInputs, assessmentSummaryInputs, revisionSessions,
  assessmentLibrary, questionCoverage, questionTags, pyqTrends, assessmentHealthInputs,
  competitiveQuestions, universityPyqQuestions,
  reportTemplates, exportHistory, reportSchedule,
  assistantPrompts, contentStudioTypes, evaluationWorkflows, studioResources,
  studioRecentUploads, facultyPortfolio, aiStudioHistory, savedLessonPlans,
  facultyBatches, facultyStudents,
}

export default facultyDatasets
