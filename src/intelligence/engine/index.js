/**
 * Student Intelligence Engine — barrel export.
 * Future modules import scoring + derivation utilities from '@/intelligence'.
 */

export {
  clamp, round1, avg, weighted, pctOf,
  computeConsistencyScore,
  computeLearningBehaviourScore,
  computeConfidenceIndex,
  computeImprovementIndex,
  computeSubjectMastery,
} from './scores.js'

export {
  computeAcademicHealth,
  computeStrengthWeakAreas,
  computeAcademicDna,
  computeExamReadiness,
  evaluateInterventions,
  generateRecommendations,
  computeCareerReadiness,
  computeAchievementProgress,
  buildAcademicJourney,
} from './derive.js'

export {
  buildDnaExecutiveSummary, buildStrengthAnalysis, buildWeaknessAnalysis,
  buildHealthBreakdown, buildLearningBehaviourAnalysis, buildSubjectMasteryDetail,
  buildChapterMastery, buildTopicMastery, buildMistakeIntelligence,
  buildImprovementOpportunities, buildWeeklyActionPlan, buildImprovementPrediction,
} from './dna.js'

/* Phase 27.1 — unified readiness orchestration + context engines */
export {
  calculateReadiness, buildReadinessIntelligence,
  buildUniversityReadiness, buildCompetitiveReadiness, buildFamilyReadiness,
  detectExamFamily, READINESS_LEVEL, READINESS_RISK, RING_COLOR, FAMILY_SUBJECTS,
} from './readiness.js'

export { buildUniversityIntelligence } from './university.js'
export { buildCompetitiveIntelligence } from './competitive.js'

export { buildExamIntelligence } from './exams.js'
export { buildProgressReport, computeOverallReportScore, REPORT_PERIODS } from './progress-report.js'

/* AI Exam Conducting Agent (Phase 34) */
export {
  SPEED_THRESHOLDS, EXAM_TYPE_LABELS, ATTEMPT_CLASSIFICATIONS,
  classifyAttempt, formatClock, formatPace,
  computeLiveExamStats, buildExamAgentReport,
  buildDemoSimulationPlan, demoTimeScale,
} from './exam-agent.js'

/* Canonical ExamAttempt contract (Phase 1) */
export {
  buildCanonicalExamAttempt,
  buildCanonicalQuestionAttempts,
  normalizeExamAttempt,
  filterExamAttempts,
  classifyAttemptContext,
} from './exam-agent.js'

/* Exam-attempt intelligence adapter (Phase 2) */
export {
  buildAttemptSignals,
  classifyAttemptContext,
  buildExamEvidence,
  buildAttemptAnalysisVariant,
  classifyChapterTrend,
  chapterStatus,
} from './exam-attempt-intelligence.js'
