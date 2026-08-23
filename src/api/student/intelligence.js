/**
 * Student Intelligence Foundation — API routes (/intelligence/*).
 * Serves the centralized profile, datasets and derived intelligence so
 * future modules can consume them exactly like a real backend.
 */
import { defineRoute } from '../core/router'
import {
  masterStudentProfile, getStudentIntelligence,
  normalizeExamAttempt, filterExamAttempts, buildExamEvidence,
} from '@/intelligence'
import { EXAM_AGENT_EXAMS } from '@/datasets/exams/exam-agent.js'
import { readAllAttempts } from '../core/exam-attempts-store'

defineRoute('get', '/intelligence/profile', () => masterStudentProfile)

/* Phase 3 — consolidated to ONE canonical snapshot route (/summary), matching
   the faculty foundation contract; the unused /datasets and /derived
   projection routes were retired (the summary already embeds profile +
   datasets + derived). The summary is intentionally NOT memoized: the
   derived graph (and the summary snapshot) receives the exam-attempt
   evidence pools so the EXISTING Academic DNA engine can consume canonical
   attempts, and attempts change as the Exam Agent runs. When no attempts
   exist the graph computes exactly as before (attemptSignals = null). */
defineRoute('get', '/intelligence/summary', () => {
  const evidence = buildEvidenceForIntelligence()
  return getStudentIntelligence(evidence ? { attemptSignals: evidence } : {})
})

/** Manual (non-demo) canonical attempts → DNA evidence pools. */
function buildEvidenceForIntelligence() {
  const normalized = readAllAttempts(true)
    .map((a) => normalizeExamAttempt(a, EXAM_AGENT_EXAMS))
    .filter(Boolean)
  const manual = filterExamAttempts(normalized, { includeDemo: false })
  return manual.length ? buildExamEvidence(manual) : null
}

/* Phase 1 — canonical exam-attempt read path for intelligence consumers
   (future Faculty Intelligence · AI Academic DNA · AI Exam Analysis).
   Returns canonical attempts; DEMO attempts are EXCLUDED by default
   (includeDemo=true opts in). Seed sample history is merged by default
   (includeSeeds=false restricts to real localStorage attempts).
   Filter params: studentId · roll · examMode · examFamily · examId ·
   batchId · sectionId. Legacy records are normalized on read. */
defineRoute('get', '/intelligence/exam-attempts', ({ params }) => {
  const { includeDemo, includeSeeds, ...rest } = params ?? {}
  const raw = readAllAttempts(includeSeeds !== 'false')
  const normalized = raw.map((a) => normalizeExamAttempt(a, EXAM_AGENT_EXAMS)).filter(Boolean)
  const items = filterExamAttempts(normalized, { includeDemo: includeDemo === 'true', ...rest })
  return {
    items,
    count: items.length,
    total: normalized.length,
    demoExcluded: includeDemo !== 'true',
    seedsIncluded: includeSeeds !== 'false',
    filters: { ...rest, includeDemo: includeDemo === 'true', includeSeeds: includeSeeds !== 'false' },
  }
})

/* Phase 2 — AI Academic DNA evidence pools derived from canonical attempts
   (manual only; demo excluded). University vs Competitive (JEE/NEET) pools
   are fully separate. Each strength/weakness carries traceable evidence
   (attempts · questions · accuracy · avg time · incorrect · skipped) and a
   longitudinal trend (improving / declining / stable / persistent /
   resolved). */
defineRoute('get', '/intelligence/exam-dna-signals', () => {
  const normalized = readAllAttempts(true)
    .map((a) => normalizeExamAttempt(a, EXAM_AGENT_EXAMS))
    .filter(Boolean)
  const manual = filterExamAttempts(normalized, { includeDemo: false })
  const evidence = buildExamEvidence(manual)
  return {
    ...evidence,
    source: 'exam-agent',
    demoExcluded: true,
    generatedAt: new Date().toISOString(),
  }
})
