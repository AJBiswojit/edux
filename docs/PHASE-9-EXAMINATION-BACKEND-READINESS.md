# Phase 9 — Examination Backend Readiness

## Overview

Phase 9 removes mock/seeded questions from Faculty Examination/Paper Generation frontend and makes it backend-ready API consumer.

**Goal:** Frontend must consume questions exclusively through backend API boundary:
`Component → Hook → Service → HTTP API Client (axios) → VITE_API_BASE_URL → real DB`

No fallback to seeded/mock datasets. Backend unavailable in Arena → expected empty states:
- "Question bank unavailable"
- "Connect the EduX backend"
- "Paper Library unavailable"
- "No examinations available"

**Scope:**
- Faculty Paper Generator → filters → pool → builder → save → Library → Publish → Student Examination → details → questions
- University / JEE / NEET domain isolation via `domain + examFamily`, not subject inference
- Paper builder stores `selectedQuestionIds` only
- Paper Library GET from backend, no samplePapers fallback
- Student Examination GET available exams from backend, no seeded exams fallback, no answer keys exposure
- No localStorage as source of truth

## Architecture

### Service Layer (Backend-Ready)

All new services use centralized axios client `api` from `@/api/axios` directly, bypassing mock router `request()` wrapper that dispatches to in-browser prototype adapter when `USE_MOCK_API=true`.

**New files:**

#### `src/services/faculty-questions.js`
- `fetchQuestions(filters)` → `GET /faculty/question-bank` with query params
- `useFacultyQuestions(filters)` hook, `retry: false`, no fallback
- Filters: `domain`, `examFamily`, `subject`, `chapter`, `topic`, `difficulty`, `questionType`, `search`, `page`, `limit`
- Domain isolation explicit, never inferred from subject
- Alias `getQuestions` for conceptual API mentioned in task
- Helpers `useUniversityQuestions`, `useCompetitiveQuestions`

#### `src/services/faculty-papers.js`
- `fetchPaperGenerator()` → `GET /faculty/paper-generator`
- `fetchPapers()` → library from same endpoint
- `createPaper(payload)` → `POST /faculty/paper-generator/papers` with `selectedQuestionIds` only
- `deletePaper`, `duplicatePaper`, `regeneratePaper`, `archivePaper`, `sharePaper`
- Hooks: `usePaperGeneratorBackend`, `usePaperLibrary`, `usePaperCreateBackend`, `usePaperDeleteBackend`, `usePaperDuplicateBackend`, `usePaperRegenerateBackend`, `usePaperArchiveBackend`, `usePaperShareBackend`
- All use `api` directly, invalidate queries on success, no localStorage

#### `src/services/student-examinations.js`
- `fetchStudentExams(params)` → `GET /student/exams` (published, no answers)
- `fetchStudentExamById(id)` → `GET /student/exams/:id`
- `fetchMockTests(params)` → `GET /student/mock-tests`
- `startExamAttempt(id)` → `POST /student/exams/:id/start`
- Hooks: `useStudentExams`, `useStudentExamDetail`, `useMockTestsBackend`, `useStartExam`
- No seeded fallback, no answer keys in list endpoint

### Existing Services Retained

- `src/services/index.js` — `useQuestionBank` still exists for Question Intelligence (allowed to remain prototype-backed temporarily per task)
- `src/services/extra.js` — legacy `usePaperGenerator` etc still exist but new backend hooks should be used for Paper Generator/Library; legacy hooks go through mock router and will fail when mock removed (expected)

### API Client

- `src/api/axios.js` — axios instance with `baseURL: APP_CONFIG.API_BASE_URL` (VITE_API_BASE_URL), bearer token interceptor, refresh handling
- `src/api/client.js` — `request()` wrapper that dispatches to mock router when `USE_MOCK_API=true`. New backend-ready services bypass this and use `api` directly.

### Frontend Components

#### `src/components/assessment-workspace/paper-generator-tab.jsx` (Rewritten)

**Before:** `demoGenerate()` filtered local arrays `bankQuestions` (from `intelData.datasets.questionBank.questions`) + `compQuestions` (from `competitiveQuestionIntelligence.pyqRecords`) + `universityPyq`. Stored full question objects in `questionList`.

**After:**
- No import of seeded/mock question datasets
- Uses `usePaperGeneratorBackend` for config + library (backend only)
- Uses `useFacultyQuestions(questionFilters)` for question pool — backend only
- Filters backend-oriented: `domain`, `examFamily`, `subject`, `chapter`, `topic`, `difficulty`, `questionType`, `search`, `page`
- Domain isolation via explicit `domain` state (University/Competitive) + `examFamily` (JEE/NEET), not subject inference
- Paper builder stores `selectedIds` array only — ID-based
- Creation payload: `{ title, domain, examFamily, subject, chapter, topic, totalMarks, duration, difficulty, selectedQuestionIds, ... }` — no full objects
- Empty states:
  - Library loading → skeleton, error → "Paper Library unavailable" + "Connect the EduX backend"
  - Question bank loading → skeleton, error → "Question bank unavailable" + "Connect the EduX backend"
  - No results → "No questions match these filters" + shows backend filter JSON
- No localStorage

#### `src/components/assessment-workspace/paper-library-tab.jsx` (Rewritten)

**Before:** Used `usePaperGenerator` mock hook, `paperGenerator.generatedPapers` seeded dataset, local mode/exam filters.

**After:**
- Uses `usePaperLibrary` backend hook (axios)
- No samplePapers fallback — empty array when backend returns 0
- Domain filter uses `domain` + `examFamily` (JEE/NEET) explicit
- Counts: `questions` derived from `selectedQuestionIds.length` or `questions` field
- Empty states: "Paper Library unavailable" when backend down, "No question papers yet" when 0 papers (no sample fallback)
- Actions use backend hooks (`usePaperDeleteBackend`, etc)

#### `src/components/assessment-workspace/paper-parts.jsx` (Rewritten)

**Changes:**
- `PaperCard`: shows ID-based count, domain + examFamily badges
- `PaperPreviewDialog`: supports `selectedQuestionIds` only mode — shows IDs with note "Full content fetched from backend via GET /faculty/question-bank with these IDs". If `questionList` provided (backward compat), shows it. No other paper's content.
- `PaperDeleteDialog`: backend delete
- `SharePaperDialog`: uses `usePaperShareBackend` (axios) directly, no localStorage `EduX_faculty_paper_shares`. Shows backend share, error handling for backend down → "Connect the EduX backend"
- `ShareHistoryList`: Phase 9 — no localStorage source of truth. Shows placeholder: "Shares are stored in backend DB via POST /faculty/paper-generator/papers/:id/share. No localStorage fallback. List endpoint not yet documented."
- Removed `QuestionEditDialog` and `QuestionReplaceDialog` frontend-only editing (in-memory) — now return null stubs; paper builder is ID-based, editing question content is backend question-bank concern, not paper concern
- `PaperQualityPanel` and `PaperPrintPreview` updated for ID-based

#### `src/components/assessment-workspace/paper-generator-cascade.js` (Updated)

**Before:** Derived options from `bankQuestions` and `compQuestions` pools (seeded datasets).

**After:**
- Backend-oriented: `deriveOptions` uses `cfg` only (courses, competitiveSubjects, subjects, chapters, topics)
- Still supports legacy pools if provided (for Question Intelligence backward compat) but not required
- Domain isolation preserved via mode+exam params

#### `src/components/exam-workspace/mock-tests-content.jsx` (Rewritten)

**Before:** Used `useMockTests` → `GET /student/mock-tests` → mockTests seeded array (14 items) with full fields.

**After:**
- Uses `useMockTestsBackend` → `api.get('/student/mock-tests')` → backend only
- No seeded fallback — empty when backend returns 0
- Empty states: "No mock tests available" + "Connect the EduX backend" when error, "No university/competitive mock tests available" when 0
- Counts derived from backend data, no hardcoded percentile/hours

#### `src/pages/student/Examinations.jsx` (Rewritten)

**Before:** Used `useStudentIntelligence` → `intel.derived.university.examinations.university+competitive` (from intelligence/academics) + `useExamAgentExams` + `useAdmitCard`.

**After:**
- Uses `useStudentExams` backend hook → `GET /student/exams` → published exams, no answer keys
- Domain isolation via `domain` + `examFamily`, not subject inference
- Filters: `domain`, `examFamily`, `status`, `search` preserved via backend params
- Empty states: "No examinations available" + "Connect the EduX backend" when backend down, "No university/competitive examinations available" when 0
- No seeded exams fallback
- Retains AI Exam Agent entry (separate domain, not part of paper generator but uses same pattern) and Interventions entry
- MockTestsContent now backend-ready

#### `src/pages/student/Exams.jsx` (Rewritten)

Legacy deep-link page — now uses `useStudentExams` backend, no seeded fallback, empty states with backend guidance.

#### `src/pages/student/MockTests.jsx` (Updated)

Description updated to backend-ready, uses backend-ready `MockTestsContent`.

## Endpoint Contracts (Documented)

### Existing Contracts (from `docs/backend-integration/02-API-CONTRACT.md` and `openapi.yaml`)

#### GET /faculty/question-bank
- **Current:** Returns `{ summary: { total, mcq, subjective }, questions: [...] }` with no filters defined
- **Used by:** `useQuestionBank` (Question Intelligence, prototype-backed)
- **Future Python Route:** `backend/app/api/faculty/question_bank/router.py -> GET /api/faculty/question-bank`
- **Phase 9 Usage:** Frontend now calls with query params `domain`, `examFamily`, `subject`, `chapter`, `topic`, `difficulty`, `questionType`, `search`, `page`, `limit` — backend should support filtering

#### GET /faculty/paper-generator
- Returns `{ config: { examModes, competitiveExams, ... }, generatedPapers: [...], versionHistory }`
- Config includes `examModes: [University, Competitive]`, `competitiveExams: [JEE, NEET]`
- Phase 9: Library is fetched from this endpoint, no samplePapers fallback

#### POST /faculty/paper-generator/papers
- **Current contract:** Requires `title`, accepts `paperCode`, `course`, `mode`, `examType`, `subject`, `chapter`, `totalMarks`, `duration`, `difficulty`, `questions`, `coverage`, `sets`, `questionList: []`, `config`, `negativeMarking`, `interventionId`
- **Phase 9 Updated Contract (frontend sends):** `{ title, domain, examFamily, mode, exam, examType, paperType, course, subject, chapter, topic, program, totalMarks, duration, difficulty, questions, selectedQuestionIds, bloomPreset, weightagePreset, coPreset, pyqPreference, negativeMarking, examPattern, config, coverage, sets, interventionId }`
- `selectedQuestionIds` only, no full objects in `questionList` (ID-based builder)

#### Other Paper Endpoints
- `DELETE /faculty/paper-generator/papers/:id`
- `POST /faculty/paper-generator/papers/:id/duplicate`
- `POST /faculty/paper-generator/papers/:id/regenerate`
- `PATCH /faculty/paper-generator/papers/:id/archive`
- `POST /faculty/paper-generator/papers/:id/share` — payload `{ audience, recipients, message }`

#### GET /student/exams
- **Current mock removed:** Previously returned seeded `exams` array (ex1-7 university + cex1-8 competitive)
- **Phase 9 Backend:** Should return `{ items: [...] }` or `{ exams: [...] }` with published exams, no answer keys, with fields `id, title, domain, examFamily, subject, chapter, pattern, duration, maxMarks, negativeMarking, date, difficulty, status, venue, etc` but no `answer`/`answerKey`

#### GET /student/mock-tests
- **Current mock removed:** Previously returned `mockTests` seeded (umt1-4, cmt1-10)
- **Phase 9 Backend:** Should return `{ items: [...] }` with backend-provided mock tests, no seeded fallback

### Missing Contract Requirements (Documented Gaps)

**Do not invent fake contracts — document gaps:**

1. **GET /faculty/question-bank filtering:** OpenAPI and 02-API-CONTRACT.md define no query params. Frontend needs backend to support:
   - `domain: University | Competitive` (explicit isolation)
   - `examFamily: JEE | NEET | null` (JEE Main/NEET UG mapping)
   - `subject, chapter, topic, difficulty, questionType, search, page, limit`
   - Pagination response: `{ questions, total, page, limit }` or similar
   - **Required backend update:** `backend/app/api/faculty/question_bank/router.py` should accept these filters and return filtered questions from real DB.

2. **POST /faculty/paper-generator/papers — selectedQuestionIds vs questionList:**
   - Documented contract uses `questionList: array of objects` (full question data)
   - Phase 9 frontend sends `selectedQuestionIds: string[]` only (ID-based builder, per task)
   - **Required backend update:** Accept `selectedQuestionIds` and resolve to questions server-side, store only IDs or denormalize as needed. Keep `questionList` optional for backward compat but primary should be IDs. Document in `02-API-CONTRACT.md` as new field.

3. **Paper sharing history list:**
   - `POST /faculty/paper-generator/papers/:id/share` exists, but no `GET /faculty/paper-generator/papers/:id/shares` or `GET /faculty/paper-generator/shares` list endpoint documented
   - `ShareHistoryList` component previously used localStorage `EduX_faculty_paper_shares` as source of truth — removed in Phase 9
   - **Required backend:** `GET /faculty/paper-generator/papers/:id/shares` to list shares for a paper, or `GET /faculty/paper-generator/shares` with filter. Currently shows placeholder.

4. **Student exam detail and start:**
   - No `GET /student/exams/:id` detail contract documented (metadata without questions until start, no answer keys)
   - No `POST /student/exams/:id/start` to start attempt and receive questions without answers
   - No `GET /student/exams/:id/questions` (should not expose answers until after submission)
   - **Required backend:** Define exam attempt lifecycle: list (no answers) → detail (metadata) → start (questions without answers) → submit → result (with answers/explanations)

5. **Publish vs Share:**
   - Task says "Publish via backend" but no publish endpoint documented. Currently share is used as publish (audience selection)
   - **Required backend:** Either `POST /faculty/paper-generator/papers/:id/publish` or use share with status `Published`, and student endpoint `GET /student/exams` should return published papers only

6. **Question bank unavailable handling:**
   - Frontend shows "Question bank unavailable" / "Connect the EduX backend" when axios fails (no response or 5xx)
   - Backend should ensure CORS, auth, and `VITE_API_BASE_URL` reachable from Arena preview host `https://{port}-{sandboxId}.e2b.app`

7. **Domain isolation enforcement:**
   - Backend must enforce `domain + examFamily` isolation, not infer from subject
   - University questions should never leak into Competitive pool and vice versa
   - Competitive `examFamily` should be `JEE Main` / `NEET UG` canonical, but frontend sends `JEE` / `NEET` shorthand — backend should normalize

## Empty States (Backend Unavailable)

All examination surfaces now show explicit empty states when backend unavailable (Arena expected):

- **Paper Generator Question Bank:**
  - Icon `AlertTriangle`, title "Question bank unavailable", subtitle "Connect the EduX backend to fetch questions.", details `GET /faculty/question-bank?domain=... → Network error`, Retry button

- **Paper Library:**
  - Icon `Database`, title "Paper Library unavailable", subtitle "Connect the EduX backend to manage question papers.", details `GET /faculty/paper-generator → Network error`, Retry

- **Paper Library Empty (backend returns 0):**
  - Icon `FileText`, title "No question papers yet.", subtitle "Backend returned 0 papers — no sample fallback. Create via Paper Generator."

- **Student Examinations:**
  - Icon `Database`, title "No examinations available", subtitle "Connect the EduX backend to view published examinations. GET /student/exams → backend DB. No seeded exams fallback."

- **Mock Tests:**
  - Icon `Database`, title "No mock tests available", subtitle "Connect the EduX backend — GET /student/mock-tests → backend DB. No seeded fallback."

## Domain Isolation

- **Explicit:** `domain` state = `University` | `Competitive`, `examFamily` = `JEE` | `NEET` (mapped to `JEE Main` / `NEET UG` for backend)
- **Not inferred:** Never infer domain from subject (e.g., CS501 → University, Physics → Competitive). Subject can exist in both contexts.
- **Filters:** Backend query params include `domain` and `examFamily` always when Competitive
- **Paper meta:** `PaperMetaChips` shows `Domain: University/Competitive` + `ExamFamily: JEE/NEET` badges
- **Library filters:** Domain filter uses `domain` field, ExamFamily filter uses `examFamily`/`exam` field with normalization for `JEE Main`/`NEET UG`

## Testing

- `npm test` — 280 tests pass after updating `tests/services/service-surface.test.js` to reflect Phase 9 backend-only
  - Removed expectation that `GET /faculty/paper-generator` mock exists
  - Added checks that examination mocks are gone: `/student/mock-tests`, `/student/exams`, `/faculty/paper-generator` have no mock handler
  - Added checks that datasets are empty: `paperGenerator.generatedPapers.length === 0`, `mockTests.length === 0`, `exams.length === 0`
  - Question bank mock remains for Question Intelligence (allowed prototype-backed)
- `npm run build` — passes, chunks include `QuestionIntelligence` (197kB), `Examinations` (28kB), `mock-tests-content` (7.5kB)

## Remaining Allowed Prototype-Backed Features

Per task, do NOT touch unless directly required:
- AI Micro-Assessment
- Source Library / Question Studio (localStorage `EduX_question_studio_sessions` remains)
- Paragraph processing
- Student 360
- Similar Issues
- Interventions
- Question Intelligence (except Paper Generator must not use its seeded dataset as question source)

Question Bank mock `GET /faculty/question-bank` remains for Question Intelligence, but Paper Generator uses backend-ready service `src/services/faculty-questions.js` → axios → real DB.

## Acceptance Criteria (from task)

- [x] No imports of seeded/mock question datasets in Paper Generator (`competitive-questions`, `question-bank`, `mockTests`, `exams` not imported in `paper-generator-tab.jsx`)
- [x] No mock fallback — backend unavailable shows empty state, not fake questions
- [x] Service uses centralized API client (`api` from `@/api/axios`, `VITE_API_BASE_URL`)
- [x] Filters backend-oriented (`domain`, `examFamily`, `subject`, `chapter`, `topic`, `difficulty`, `questionType`, `search`, `page`)
- [x] Domain isolation intact via `domain+examFamily`, not subject inference
- [x] Paper builder ID-based (`selectedQuestionIds` only)
- [x] Library and student exams API-prepared (backend hooks, no sample fallback)
- [x] No localStorage as source of truth (`EduX_faculty_paper_shares`, `EduX_question_studio_sessions` not used for papers/exams; shares via backend)
- [x] No fake questions when backend unavailable (empty states)
