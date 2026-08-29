# Phase 9 — Examination Migration Report

## Summary

Migrated Faculty Examination / Paper Generation frontend from mock/seeded question datasets to backend-ready API consumer.

**Result:** All examination surfaces now consume questions exclusively through backend API boundary `Component → Hook → Service → HTTP API Client (axios) → VITE_API_BASE_URL → real DB`. No fallback to seeded/mock. Backend unavailable in Arena → expected empty states.

**Tests:** 280 passed (updated service-surface test), Build: passes.

## Audit of Examination Flow

### Flow Mapped

`Faculty Paper Generator → filters → pool → builder → save → Library → Publish → Student Examination → details → questions`

**Previous (mock):**
- Paper Generator Tab `demoGenerate()` filtered local arrays: `bankQuestions` (from `intelData.datasets.questionBank.questions` = `src/datasets/faculty/workspace.js` questionBank 1254 questions q1-q14 with pyqFrequency) + `compQuestions` (from `competitiveQuestionIntelligence.pyqRecords` = `src/intelligence/faculty/datasets/competitive-questions.js` deterministic demo pool 150+ questions JEE_PHY/MAT/CHE NEET_PHY/CHE/BIO id CQ-{exam}-{code}-###) + `universityPyqQuestions` (UPYQ- 12 records)
- Selected IDs stored in state but full objects stored in `questionList`
- POST via `usePaperCreate` → mock router → unshift into `paperGenerator.generatedPapers` (seeded papers gp1-gp10 with questionList DSA_MCQ/SHORT/LONG + competitiveList)
- Library GET mock returns that array
- Share POST → localStorage `EduX_faculty_paper_shares` array
- ShareHistoryList reads same key
- Student Examinations: `Examinations.jsx` used `intel.derived.university.examinations.university+competitive` (from intelligence/academics) + `useExamAgentExams` (EXAM_AGENT_EXAMS dataset) + `useAdmitCard`
- MockTestsContent → `useMockTests` GET `/student/mock-tests` → `mockTests` seeded array (14 items umt1-4 university + cmt1-10 competitive) with full fields
- Exams.jsx legacy → `useExams` GET `/student/exams` → `exams` seeded 15 items ex1-7 university + cex1-8 competitive

### Files Audited

- `src/config/index.js`: APP_CONFIG USE_MOCK_API via VITE_USE_MOCK, API_BASE_URL, NAV_GROUPS
- `src/hooks/use-filter-cascade.js` & `use-dependent-filters.js`: generic cascade engine
- `src/services/index.js`: `useMockTests` GET `/student/mock-tests`, `useExams` GET `/student/exams`
- `src/services/extra.js`: `usePaperGenerator` GET `/faculty/paper-generator`, `usePaperCreate/Delete/Duplicate/Regenerate/Archive/Share` POST, `usePYQAnalysis`, `useAdmitCard`
- `src/api/core/router.js`: `defineRoute`, `dispatchRequest` with latency 380-780ms mock router
- `src/api/student/academics.js`: mock routes GET `/student/mock-tests`→mockTests, GET `/student/exams`→exams
- `src/api/faculty/question-studio.js`: mock routes with localStorage `EduX_question_studio_sessions` — kept per task (Source Library untouched)
- `src/api/faculty/papers.js`: 7 mock routes for paper-generator
- `src/datasets/student/academics.js`: seeded mockTests (umt1-4,cmt1-10) and exams (ex1-7,cex1-8)
- `src/datasets/faculty/workspace.js`: questionBank 1254 questions q1-q14
- `src/datasets/faculty/paper-generator.js`: seeded papers gp1-gp10 with questionList + competitiveList + versionHistory
- `src/intelligence/faculty/datasets/competitive-questions.js`: deterministic demo pool 150+ + universityPyq 12
- `src/intelligence/faculty/datasets/index.js`: central aggregation
- `src/components/assessment-workspace/paper-generator-tab.jsx`: demoGenerate filtering local
- `src/components/assessment-workspace/paper-library-tab.jsx`: mock library
- `src/components/assessment-workspace/paper-generator-cascade.js`: cascade from bankQuestions/compQuestions/universityPyq
- `src/components/assessment-workspace/paper-parts.jsx`: PaperCard, PaperPreviewDialog (questionList only), SharePaperDialog (localStorage), ShareHistoryList reading `EduX_faculty_paper_shares`
- `src/pages/student/Examinations.jsx`, `Exams.jsx`, `MockTests.jsx`
- `src/api/core/exam-attempts-store.js` & `src/api/exam/exam-agent.js`: localStorage attempts EXAM_AGENT_EXAMS — separate domain (AI Exam Conducting Agent) not in scope
- `src/datasets/exams/`: exam-agent.js, attempt-seeds.js, exam-analysis.js — exam agent blueprints, out of scope

## Mock Datasets Identified (Classification A-D per task)

### A — Remove (Examination-specific, safe to remove)

- `src/datasets/faculty/paper-generator.js` — seeded papers gp1-gp10 with questionList DSA_MCQ/SHORT/LONG + competitiveList from competitiveQuestions, versionHistory — **REMOVED** (emptied to `generatedPapers: []`)
- `src/datasets/student/academics.js` mockTests (umt1-4,cmt1-10) and exams (ex1-7,cex1-8) — **REMOVED** (emptied to `[]`)
- `src/api/faculty/papers.js` 7 routes (GET paper-generator, DELETE paper/:id, POST duplicate, POST papers create, POST regenerate, PATCH archive, POST share) — **REMOVED** (file now empty with documentation)
- `src/api/student/academics.js` 2 routes GET mock-tests, GET exams — **REMOVED**
- localStorage `EduX_faculty_paper_shares` as source of truth — **REMOVED** from `paper-parts.jsx`

### B — Keep but not used as Paper Generator source (Question Intelligence can remain prototype-backed temporarily)

- `src/datasets/faculty/workspace.js` questionBank 1254 questions — retained for Question Intelligence (`QuestionIntelligenceContent`), not used by Paper Generator after migration
- `src/intelligence/faculty/datasets/competitive-questions.js` build() pool — retained for Question Intelligence and competitive browser, not used by Paper Generator after migration
- `src/api/faculty/workspace.js` GET `/faculty/question-bank` mock — retained for Question Intelligence, but Paper Generator uses backend-ready service bypassing mock

### C — Keep (Shared infrastructure, not examination-specific)

- `src/api/core/router.js`, `src/api/client.js`, `src/api/axios.js` — shared infrastructure preserved
- `src/api/faculty/question-studio.js` — Source Library, per task DO NOT touch unless directly required — kept
- `src/hooks/use-filter-cascade.js` — generic cascade engine, preserved and updated to be backend-oriented

### D — Test fixtures (isolated under tests/fixtures, not touched)

- `tests/fixtures/*` — kept isolated, not used as fallback in frontend

## Services Migrated

### New Backend-Ready Services

- `src/services/faculty-questions.js`
  - `fetchQuestions(filters)` → `api.get('/faculty/question-bank', { params })`
  - `useFacultyQuestions(filters)` — `retry: false`, no fallback
  - Filters: `domain`, `examFamily`, `subject`, `chapter`, `topic`, `difficulty`, `questionType`, `search`, `page`, `limit`
  - Domain isolation explicit

- `src/services/faculty-papers.js`
  - `fetchPaperGenerator()` → `GET /faculty/paper-generator`
  - `fetchPapers()` → library
  - `createPaper(payload)` → `POST /faculty/paper-generator/papers` with `selectedQuestionIds` only
  - `deletePaper`, `duplicatePaper`, `regeneratePaper`, `archivePaper`, `sharePaper`
  - Hooks: `usePaperGeneratorBackend`, `usePaperLibrary`, `usePaperCreateBackend`, `usePaperDeleteBackend`, `usePaperDuplicateBackend`, `usePaperRegenerateBackend`, `usePaperArchiveBackend`, `usePaperShareBackend`

- `src/services/student-examinations.js`
  - `fetchStudentExams()` → `GET /student/exams` (no answers)
  - `fetchStudentExamById()` → `GET /student/exams/:id`
  - `fetchMockTests()` → `GET /student/mock-tests`
  - `startExamAttempt()` → `POST /student/exams/:id/start`
  - Hooks: `useStudentExams`, `useStudentExamDetail`, `useMockTestsBackend`, `useStartExam`

### Old Services

- `src/services/index.js` `useMockTests`, `useExams` still exist but mock routes removed — will error (expected backend-only)
- `src/services/extra.js` `usePaperGenerator` etc still exist but mock routes removed — new backend hooks should be used

## Components Refactored

- `paper-generator-tab.jsx`: 992 lines → backend-ready, no seeded imports, ID-based builder, backend filters, empty states
- `paper-library-tab.jsx`: backend-only, no sample fallback, domain+examFamily filters
- `paper-parts.jsx`: no localStorage, backend share, ID-based preview, ShareHistoryList backend placeholder
- `paper-generator-cascade.js`: backend-oriented, cfg only, not pools
- `mock-tests-content.jsx`: backend-only, no seeded fallback
- `Examinations.jsx`: backend-only `useStudentExams`, no intelligence snapshot fallback
- `Exams.jsx`: backend-only
- `MockTests.jsx`: description updated to backend-ready

## Datasets Cleaned

- `src/datasets/faculty/paper-generator.js`: `generatedPapers: []`, `questionIntelligence` empty, `versionHistory: {}`
- `src/datasets/student/academics.js`: `mockTests: []`, `exams: []`

## localStorage Removal

- `EduX_faculty_paper_shares` — removed as source of truth, shares via backend `POST /faculty/paper-generator/papers/:id/share`
- `EduX_question_studio_sessions` — kept (Source Library not in scope per task)
- `exam-attempts-store`, `exam-agent` — kept (AI Exam Conducting Agent separate domain, not in scope)
- `EduX_registered_students`, `EduX_reduced_motion` — unrelated, kept

## Domain Isolation Preserved

- Before: Inferred from subject (e.g., CS501 → University, Physics → Competitive) in `demoGenerate()` and cascade
- After: Explicit `domain` state + `examFamily` state, passed as query params `domain` + `examFamily` to backend
- Filters: `domain: University|Competitive`, `examFamily: JEE|NEET|JEE Main|NEET UG`
- UI: Badges show `Domain: University/Competitive` + `ExamFamily: JEE/NEET`
- Backend must enforce isolation, not leak across filters

## Filters

- **Before:** Local filtering of seeded arrays
- **After:** Backend-oriented query params:
  - `domain`, `examFamily`, `subject`, `chapter`, `topic`, `difficulty`, `questionType`, `search`, `page`, `limit`
- Preserved in `questionFilters` memo, serialized into queryKey for caching
- Cascade still provides subject/chapter/topic options from `cfg`, but actual filtering done backend

## Paper Builder ID-Based

- **Before:** Stored full question objects in `questionList`, `questions` array with text/options/answer/marks
- **After:** Stores `selectedIds: string[]` only
- Creation payload: `selectedQuestionIds` only, no `questionList` full objects
- Preview: Shows IDs with note "Full question content is fetched from backend via GET /faculty/question-bank with these IDs when needed"
- If backend provides `questionList` (backward compat), shows it, but primary is IDs

## Library and Student Exams API-Prepared

- **Library:** `usePaperLibrary` → `GET /faculty/paper-generator` via axios, no samplePapers fallback, empty when 0, unavailable when backend down
- **Student Exams:** `useStudentExams` → `GET /student/exams` via axios, no seeded fallback, no answer keys exposure in list endpoint, empty when 0, unavailable when backend down
- **Mock Tests:** `useMockTestsBackend` → `GET /student/mock-tests` via axios, no seeded fallback

## Empty States

All examination surfaces show explicit empty states when backend unavailable (Arena expected):

- Question bank: `AlertTriangle`, "Question bank unavailable", "Connect the EduX backend", `GET /faculty/question-bank?domain=... → Network error`, Retry
- Paper Library: `Database`, "Paper Library unavailable", "Connect the EduX backend", `GET /faculty/paper-generator → Network error`, Retry
- Library empty: "No question papers yet", "Backend returned 0 papers — no sample fallback"
- Student exams error: "No examinations available", "Connect the EduX backend to view published examinations. GET /student/exams → backend DB. No seeded exams fallback."
- Mock tests error: "No mock tests available", "Connect the EduX backend — GET /student/mock-tests → backend DB. No seeded fallback."

## Acceptance Checklist (from task)

- [x] No imports of seeded/mock question datasets in Paper Generator — verified `paper-generator-tab.jsx` does not import `competitive-questions`, `question-bank`, `mockTests`, `exams`, `paper-generator` dataset; uses `useFacultyQuestions` backend hook
- [x] No mock fallback — backend unavailable shows empty state, not fake questions
- [x] Service uses centralized API client — `api` from `@/api/axios` with `VITE_API_BASE_URL`
- [x] Filters backend-oriented — `domain`, `examFamily`, `subject`, `chapter`, `topic`, `difficulty`, `questionType`, `search`, `page`
- [x] Domain isolation intact — via `domain+examFamily`, not subject inference
- [x] Paper builder ID-based — `selectedQuestionIds` only
- [x] Library and student exams API-prepared — backend hooks, no sample fallback
- [x] No localStorage as source of truth — `EduX_faculty_paper_shares` removed, shares via backend
- [x] No fake questions when backend unavailable — empty states
- [x] Tests and build pass — 280 tests passed, build passes
- [x] Docs created — `PHASE-9-EXAMINATION-BACKEND-READINESS.md` and `PHASE-9-EXAMINATION-MIGRATION-REPORT.md`

## Remaining Gaps (Backend Required)

Documented in `PHASE-9-EXAMINATION-BACKEND-READINESS.md` under "Missing Contract Requirements":

1. GET /faculty/question-bank filtering not defined in contract — backend should support domain, examFamily, subject, chapter, topic, difficulty, questionType, search, page, limit
2. POST /faculty/paper-generator/papers uses questionList full objects in contract, but frontend sends selectedQuestionIds only — backend should accept IDs
3. No share history list endpoint — ShareHistoryList shows placeholder
4. No student exam detail/start endpoints — need GET /student/exams/:id and POST /student/exams/:id/start without answers
5. No publish endpoint — share used as publish, need publish or status Published
6. CORS/auth for Arena preview host
7. Domain isolation enforcement backend

## Files Changed

- `src/services/faculty-questions.js` — new
- `src/services/faculty-papers.js` — new
- `src/services/student-examinations.js` — new
- `src/components/assessment-workspace/paper-generator-tab.jsx` — rewritten backend-ready
- `src/components/assessment-workspace/paper-library-tab.jsx` — rewritten backend-ready
- `src/components/assessment-workspace/paper-parts.jsx` — rewritten backend-ready, no localStorage
- `src/components/assessment-workspace/paper-generator-cascade.js` — updated backend-oriented
- `src/components/exam-workspace/mock-tests-content.jsx` — rewritten backend-ready
- `src/pages/student/Examinations.jsx` — rewritten backend-ready
- `src/pages/student/Exams.jsx` — rewritten backend-ready
- `src/pages/student/MockTests.jsx` — updated description
- `src/api/student/academics.js` — removed mockTests/exams routes
- `src/api/faculty/papers.js` — removed all mock routes, now empty with doc
- `src/datasets/faculty/paper-generator.js` — emptied
- `src/datasets/student/academics.js` — emptied mockTests/exams
- `tests/services/service-surface.test.js` — updated for Phase 9 backend-only expectations

## Verification

- `npx vitest run` — 280 passed
- `npm run build` — passes, chunks: QuestionIntelligence 197kB, Examinations 28kB, mock-tests-content 7.5kB
- No imports of seeded question datasets in Paper Generator — verified via grep
- No localStorage `EduX_faculty_paper_shares` as source of truth — removed
- Paper builder ID-based — `selectedQuestionIds` only
- Domain isolation via `domain+examFamily` — explicit state, not subject inference
