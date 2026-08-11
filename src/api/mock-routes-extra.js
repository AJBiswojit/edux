/**
 * Additional mock API routes for the completed modules.
 * Kept separate from mock-routes.js to preserve the existing registry.
 */
import { mockRoute } from './mock-server'
import { studentPrograms, forumTopics, forumCategories, supportTickets, admitCard } from '@/mock-data/student-extra'
import { studentAcademicProfile, academicResources, academicProgress } from '@/mock-data/student-academics'
import { examAnalysis, examAnalysisOptions, examAnalysisVariants, universityExamOptions } from '@/mock-data/exam-analysis'
import { EXAM_AGENT_EXAMS } from '@/mock-data/exam-agent'
import { normalizeExamAttempt, filterExamAttempts, buildAttemptAnalysisVariant } from '@/intelligence'
import { readAllAttempts } from './exam-attempts-store'
import {
  mentorResources, mentorLearningHistory, mentorQuickTopics, mentorConcepts, mentorNotes,
  mentorPracticeSets, mentorQuizBank, mentorRevisionPlans,
} from '@/mock-data/mentor'
import {
  aiConversations, suggestedQuestions, quickPrompts, resourceRecommendations,
  generatedNotes, downloads, completedRecommendations,
} from '@/intelligence/datasets/workspace.js'
import { performanceAccuracy } from '@/mock-data/performance-accuracy'
import { paperGenerator } from '@/mock-data/paper-generator'
import { pyqAnalysis, pyqFilters, pyqPatterns, applyPyqVariant } from '@/mock-data/pyq-analysis'
import { pyqVariants } from '@/mock-data/pyq-analysis'
import { facultyCourses, facultyTimetable, facultyAnnouncements, facultyQuizBuilder, facultyAiStudio } from '@/mock-data/faculty-extra'
import { facultyReports } from '@/mock-data/faculty'
import { aiStudioHistory, savedLessonPlans } from '@/intelligence/faculty/datasets/ai-studio'
import { adminPeople } from '@/intelligence/admin/datasets/people'
import { masterInstitutionProfile } from '@/intelligence/admin/master-profile'
import { parentAssignments, parentFees, parentBehavior, parentCalendarEvents, parentDownloads, parentNotifications, parentSettings } from '@/mock-data/parent-extra'
import {
  adminRevenue, adminPrograms, adminSubjects, adminBatches, adminAcademicCalendar,
  adminAttendanceAnalytics, adminAssignmentAnalytics, adminExamAnalytics,
  adminQuestionBank, adminScholarships, adminCms, adminApiConfig, adminDataTools,
} from '@/mock-data/admin-extra'

/* ---------------- Student (extra) ---------------- */
mockRoute('get', '/student/programs', () => studentPrograms)
mockRoute('get', '/student/forum', () => ({ topics: forumTopics, categories: forumCategories }))
mockRoute('get', '/student/support', () => ({ tickets: supportTickets }))
mockRoute('post', '/student/support', ({ body }) => ({
  ok: true,
  ticket: {
    id: `st_${Date.now()}`,
    title: body?.title,
    category: body?.category ?? 'Technical',
    status: 'Open',
    priority: body?.priority ?? 'Medium',
    created: new Date().toISOString(),
    messages: 1,
  },
}))
mockRoute('get', '/student/admit-card', () => admitCard)

/* ---------------- Faculty (extra) ---------------- */
mockRoute('get', '/faculty/courses', () => ({ items: facultyCourses }))
mockRoute('get', '/faculty/timetable', () => ({ items: facultyTimetable }))
mockRoute('get', '/faculty/announcements', () => ({ items: facultyAnnouncements }))
mockRoute('get', '/faculty/quiz-builder', () => facultyQuizBuilder)
mockRoute('get', '/faculty/ai-studio', () => facultyAiStudio)

/* ---------------- Parent (extra) ---------------- */
mockRoute('get', '/parent/assignments', () => ({ items: parentAssignments }))
mockRoute('get', '/parent/fees', () => parentFees)
mockRoute('get', '/parent/behavior', () => parentBehavior)
mockRoute('get', '/parent/events', () => ({ items: parentCalendarEvents }))
mockRoute('get', '/parent/downloads', () => ({ items: parentDownloads }))
mockRoute('get', '/parent/notifications', () => ({ items: parentNotifications }))
mockRoute('get', '/parent/settings', () => parentSettings)
mockRoute('patch', '/parent/settings', ({ body }) => ({ ok: true, settings: { ...parentSettings, ...body } }))

/* ---------------- Admin (extra) ---------------- */
mockRoute('get', '/admin/revenue', () => adminRevenue)
mockRoute('get', '/admin/programs', () => ({ programs: adminPrograms }))
mockRoute('get', '/admin/subjects', () => ({ subjects: adminSubjects }))
mockRoute('get', '/admin/batches', () => ({ batches: adminBatches }))
mockRoute('get', '/admin/calendar', () => ({ events: adminAcademicCalendar }))
mockRoute('get', '/admin/attendance-analytics', () => adminAttendanceAnalytics)
mockRoute('get', '/admin/assignment-analytics', () => adminAssignmentAnalytics)
mockRoute('get', '/admin/exam-analytics', () => adminExamAnalytics)
mockRoute('get', '/admin/question-bank', () => adminQuestionBank)
mockRoute('get', '/admin/scholarships', () => ({ items: adminScholarships }))
mockRoute('get', '/admin/cms', () => adminCms)
mockRoute('get', '/admin/api-config', () => adminApiConfig)
mockRoute('get', '/admin/data-tools', () => adminDataTools)

/* ---------------- AI Exam Analysis (student) ---------------- */
mockRoute('get', '/student/exam-analysis', () => examAnalysis)

/* Phase 2 — canonical exam attempts join the AI Exam Analysis option set
   (marked "Sample" when from the deterministic seed history). Demo
   attempts are excluded. The page itself is untouched: selecting an
   attempt and generating routes to /student/exam-analysis/:attemptId. */
mockRoute('get', '/student/exam-analysis/options', () => {
  const normalized = readAllAttempts(true)
    .map((a) => normalizeExamAttempt(a, EXAM_AGENT_EXAMS))
    .filter(Boolean)
  const manual = filterExamAttempts(normalized, { includeDemo: false })
  const attemptOptions = manual.map((a) => {
    const subjects = [...new Set((a.questionAttempts ?? []).map((q) => q.academicContext?.subject).filter(Boolean))]
    const family = a.examFamily
    const pattern = a.examMode === 'University' ? 'University' : family === 'NEET' ? 'NEET UG' : 'JEE Main'
    return {
      id: a.id,
      category: a.examMode,
      name: `${a.examName ?? 'Practice attempt'} (practice attempt)`,
      shortName: `${a.mock ? 'Sample' : 'Practice'} · ${a.shortTitle ?? a.examName ?? 'attempt'}`,
      date: (a.submittedAt ?? a.completedAt ?? '').slice(0, 10),
      pattern,
      subjects: ['All Subjects', ...subjects],
      attempt: true,
      attemptId: a.id,
      mock: !!a.mock,
    }
  })
  return { items: [...examAnalysisOptions, ...universityExamOptions, ...attemptOptions] }
})

/* Phase 2 — attempt-aware analysis: if the id matches a canonical attempt,
   the analysis is DERIVED from the attempt's own embedded question
   metadata (never re-fetched from the exam dataset). Previous attempts of
   the same domain feed the comparison/trajectory sections. Falls back to
   the existing static variants otherwise. */
mockRoute('get', '/student/exam-analysis/:id', ({ params }) => {
  const id = params.id
  const normalized = readAllAttempts(true)
    .map((a) => normalizeExamAttempt(a, EXAM_AGENT_EXAMS))
    .filter(Boolean)
  const manual = filterExamAttempts(normalized, { includeDemo: false })
  const attempt = manual.find((a) => a.id === id)
  if (attempt) {
    const family = attempt.examFamily
    const previous = manual
      .filter((a) => a.id !== id && (family ? a.examFamily === family : a.examMode === 'University'))
      .sort((a, b) => String(a.submittedAt ?? '').localeCompare(String(b.submittedAt ?? '')))
    return buildAttemptAnalysisVariant(attempt, previous)
  }
  return examAnalysisVariants[id] ?? examAnalysis
})

/* ---------------- Student Academics hub ---------------- */
mockRoute('get', '/student/academic-profile', () => studentAcademicProfile)
mockRoute('get', '/student/academic-resources', () => ({ items: academicResources }))
mockRoute('get', '/student/academic-progress', () => academicProgress)

/* ---------------- MediXO Mentor workspace ---------------- */
mockRoute('get', '/student/mentor/workspace', () => ({
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
mockRoute('get', '/student/performance-accuracy', () => performanceAccuracy)

/* ---------------- AI Question Paper Generator (faculty) ---------------- */
/* Return a snapshot so in-memory mutations (delete/duplicate) never corrupt
   the react-query cached reference. */
mockRoute('get', '/faculty/paper-generator', () => ({ ...paperGenerator, generatedPapers: [...paperGenerator.generatedPapers] }))
/* Paper management — delete & duplicate mutate the in-memory dataset so a
   page refresh keeps the same state (mirrors the real backend contract). */
mockRoute('delete', '/faculty/paper-generator/papers/:id', ({ params }) => {
  const idx = paperGenerator.generatedPapers.findIndex((p) => p.id === params.id)
  if (idx >= 0) paperGenerator.generatedPapers.splice(idx, 1)
  return { ok: true, deleted: params.id }
})
mockRoute('post', '/faculty/paper-generator/papers/:id/duplicate', ({ params }) => {
  const src = paperGenerator.generatedPapers.find((p) => p.id === params.id)
  if (!src) return { ok: false }
  const copy = {
    ...src,
    id: `gp_${Date.now()}`,
    paperCode: src.paperCode ? `${src.paperCode}-COPY` : `PAPER-${Date.now()}`,
    title: `${src.title} (Copy)`,
    status: 'Draft',
    generated: new Date().toISOString().slice(0, 10),
    created: new Date().toISOString().slice(0, 10),
    modified: new Date().toISOString().slice(0, 10),
    downloads: 0,
    downloadStatus: 'Not exported',
    deleteStatus: 'Active',
  }
  paperGenerator.generatedPapers.unshift(copy)
  return { ok: true, paper: copy }
})

/* Create a paper — duplicate paper names are rejected (validation lives here
   so every client enforces the same rule). */
mockRoute('post', '/faculty/paper-generator/papers', ({ body }) => {
  const title = String(body?.title ?? '').trim()
  if (!title) return { ok: false, error: 'Paper name is required.' }
  const exists = paperGenerator.generatedPapers.some((p) => p.title.toLowerCase() === title.toLowerCase())
  if (exists) {
    return { ok: false, error: 'Duplicate paper name', message: `A paper named "${title}" already exists — choose a different name.` }
  }
  const today = new Date().toISOString().slice(0, 10)
  const paper = {
    id: `gp_new_${Date.now()}`,
    paperCode: body?.paperCode ?? `PAPER-${Date.now()}`,
    title,
    course: body?.course ?? 'CS501',
    mode: body?.mode ?? 'University',
    examType: body?.examType ?? 'Mid Semester',
    paperType: body?.paperType ?? body?.examType ?? null,
    exam: body?.exam ?? null,
    subject: body?.subject ?? null,
    chapter: body?.chapter ?? null,
    topic: body?.topic ?? null,
    program: body?.program ?? null,
    faculty: 'Dr. Meera Krishnan',
    totalMarks: Number(body?.totalMarks ?? 50),
    duration: Number(body?.duration ?? 120),
    difficulty: body?.difficulty ?? 'Mixed',
    questions: Number(body?.questions ?? 22),
    status: 'Draft',
    generated: today,
    created: today,
    modified: today,
    coverage: Number(body?.coverage ?? 90),
    sets: Number(body?.sets ?? 1),
    downloads: 0,
    downloadStatus: 'Not exported',
    deleteStatus: 'Active',
    archived: false,
    versions: 1,
    blooms: { Remember: 15, Understand: 20, Apply: 35, Analyze: 20, Evaluate: 5, Create: 5 },
    /* Phase 30 — full studio payload (questions + blueprint) */
    questionList: Array.isArray(body?.questionList) ? body.questionList : [],
    config: body?.config ?? null,
    actualDifficulty: body?.actualDifficulty ?? null,
    negativeMarking: body?.negativeMarking ?? null,
    /* Phase 6 — intervention re-tests stay linked to the intervention */
    interventionId: body?.interventionId ?? null,
    retest: !!body?.interventionId,
  }
  paperGenerator.generatedPapers.unshift(paper)
  paperGenerator.versionHistory[paper.id] = [{ version: 'v1.0', date: today, note: 'Initial draft' }]
  return { ok: true, paper }
})

/* Regenerate — new version appended to the paper's version history (mock). */
mockRoute('post', '/faculty/paper-generator/papers/:id/regenerate', ({ params }) => {
  const p = paperGenerator.generatedPapers.find((x) => x.id === params.id)
  if (!p) return { ok: false, error: 'Paper not found' }
  const history = paperGenerator.versionHistory[p.id] ?? [{ version: 'v1.0', date: p.created, note: 'Initial draft' }]
  const today = new Date().toISOString().slice(0, 10)
  const version = `v1.${history.length}`
  p.modified = today
  p.versions = history.length + 1
  p.coverage = Math.min(100, (p.coverage ?? 90) + 2)
  history.push({ version, date: today, note: `Regenerated — coverage ${p.coverage}%` })
  paperGenerator.versionHistory[p.id] = history
  return { ok: true, paper: p }
})

/* Archive / restore a paper. */
mockRoute('patch', '/faculty/paper-generator/papers/:id/archive', ({ params, body }) => {
  const p = paperGenerator.generatedPapers.find((x) => x.id === params.id)
  if (!p) return { ok: false, error: 'Paper not found' }
  p.archived = body?.archived ?? !p.archived
  return { ok: true, paper: p }
})

/* Share a generated paper to students (Phase 29 — prototype persistence). */
mockRoute('post', '/faculty/paper-generator/papers/:id/share', ({ params, body }) => {
  const paper = paperGenerator.generatedPapers.find((p) => p.id === params.id)
  if (!paper) {
    const err = new Error('Paper not found.')
    err.response = { status: 404, data: { message: err.message } }
    throw err
  }
  let shares = []
  try { shares = JSON.parse(window.localStorage.getItem('aurora_faculty_paper_shares') || '[]') } catch { shares = [] }
  const share = {
    id: `share_${Date.now()}`,
    paperId: paper.id,
    paperTitle: paper.title,
    audience: body?.audience ?? 'Entire class',
    recipients: body?.recipients ?? [],
    message: body?.message ?? '',
    sharedAt: new Date().toISOString(),
    status: 'Sent (prototype)',
  }
  shares.unshift(share)
  try { window.localStorage.setItem('aurora_faculty_paper_shares', JSON.stringify(shares)) } catch { /* storage unavailable */ }
  return { ok: true, share }
})
mockRoute('get', '/faculty/paper-generator/shares', () => {
  let shares = []
  try { shares = JSON.parse(window.localStorage.getItem('aurora_faculty_paper_shares') || '[]') } catch { shares = [] }
  return { items: shares }
})

/* ---------------- Admin unified people (intelligence-backed) ---------------- */
mockRoute('get', '/admin/students', () => ({
  students: adminPeople.students,
  total: masterInstitutionProfile.totals.students,
}))
mockRoute('get', '/admin/faculty', () => ({
  faculty: adminPeople.faculty,
  total: masterInstitutionProfile.totals.faculty,
}))

/* ---------------- Faculty Reports (management) ---------------- */
mockRoute('post', '/faculty/reports', ({ body }) => {
  const title = String(body?.title ?? '').trim()
  if (!title) return { ok: false, error: 'Report title is required.' }
  const today = new Date().toISOString().slice(0, 10)
  const report = {
    id: `fr_new_${Date.now()}`,
    title,
    type: body?.format ?? 'PDF',
    category: body?.category ?? 'Academic',
    status: 'Ready',
    scope: body?.scope ?? 'All courses',
    period: body?.period ?? 'Current',
    generated: today,
    size: '1.2 MB',
    pages: 8,
    downloads: 0,
    archived: false,
    summary: body?.summary ?? 'Generated from the Faculty Intelligence Foundation.',
    template: body?.template ?? 'Custom',
  }
  facultyReports.unshift(report)
  return { ok: true, report }
})
mockRoute('delete', '/faculty/reports/:id', ({ params }) => {
  const idx = facultyReports.findIndex((r) => r.id === params.id)
  if (idx >= 0) facultyReports.splice(idx, 1)
  return { ok: true, deleted: params.id }
})
mockRoute('patch', '/faculty/reports/:id/archive', ({ params, body }) => {
  const r = facultyReports.find((x) => x.id === params.id)
  if (!r) return { ok: false, error: 'Report not found' }
  r.archived = body?.archived ?? !r.archived
  return { ok: true, report: r }
})

/* ---------------- AI Teaching Studio (saves) ----------------
   Saves append to the shared history / lesson-plan datasets so the
   foundation-derived studio views reflect them on the next refetch. */
mockRoute('post', '/faculty/ai-studio/save', ({ body }) => {
  const kind = body?.kind ?? 'item'
  const item = body?.item ?? {}
  const today = new Date().toISOString().slice(0, 10)
  const historyEntry = {
    id: `h_${Date.now()}`,
    type: kind === 'lesson-plan' ? 'lesson-plan' : kind === 'evaluation' ? 'evaluation' : kind === 'content' ? item?.type ?? 'notes' : kind,
    title: item?.title ?? `${kind} saved`,
    detail: item?.meta ?? `Saved from the AI Teaching Studio · ${today}`,
    date: today,
  }
  aiStudioHistory.unshift(historyEntry)
  if (kind === 'lesson-plan' && item?.plan) {
    savedLessonPlans.unshift({ ...item.plan, id: `lp_${Date.now()}`, created: today })
  }
  return { ok: true, historyEntry }
})

/* ---------------- PYQ Analysis (faculty) ---------------- */
mockRoute('get', '/faculty/pyq-analysis', () => pyqAnalysis)
mockRoute('get', '/faculty/pyq-analysis/filters', () => pyqFilters)
mockRoute('get', '/faculty/pyq-analysis/patterns', () => ({ items: pyqPatterns }))
mockRoute('get', '/faculty/pyq-analysis/analytics', ({ params }) => applyPyqVariant(pyqAnalysis, pyqVariants[params?.subject]))
