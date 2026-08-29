# Phase 11 — Complete Physical Mock Data Removal Report

**Project:** EduX (`medixo-edux-platform` v1.0.0)
**Phase:** 11 (revised) — Complete Physical Mock-Shim Removal
**Branch:** `arena/01a04ce2-edux` · **Date:** 2026-08-29
**Status:** `npm test` ✅ (17 files / 227 tests) · `npm run build` ✅ (13.2s)

---

## 1. Executive Summary

EduX is now a strict **backend-consuming frontend**. The in-browser prototype
API adapter (mock router), its route handlers, the prototype stores and the
fake persistence have been **physically deleted** — they are no longer
retained in `tests/fixtures/mock-api` (that directory no longer exists), and
no test requires a complete fake backend. Backend-owned seeded **entity**
data (students, faculty, batches, exams, questions, attempts, users,
departments, dashboard/academic analytics records, insights, interventions)
has been removed from the production bundle. Legitimate UI, intelligence
engines/contracts, business logic, route/navigation structure and landing-page
static content are all preserved.

The revision that prompted this phase — *do not merely disable/move/hide the
mock backend, and do not retain it in tests just because tests depend on it* —
is satisfied.

---

## 2. Scope & Objectives

- Physically delete the mock router, mock route handlers, prototype stores,
  mock entity stores and fake persistence.
- Rewrite every test that previously depended on the complete fake backend so
  it uses isolated fixtures, factories, service mocks, request mocks, contract
  fixtures and unit-level data.
- Audit every `src/datasets/**` and `src/intelligence/**/datasets/**` file and
  remove backend-owned seeded entity data while keeping landing static
  content, UI configuration, intelligence engine logic and in-contract
  metadata.
- Remove fake fallbacks (`|| sampleData`, `?? mockData`), fake success
  (localStorage "Saved" toast), fake KPI values and seeded records.
- Preserve the architecture: `Component → Hook → Service → Central API Client
  → Backend` (`src/api/axios.js` + `client.js` + `index.js` +
  `ai/tutor-reply.js`).
- Implement **no backend**. No new features. No UI redesign. No intelligence
  algorithm change. `npm test` + `npm run build` must pass.

---

## 3. Governing Principles

> REMOVE THE MOCK DATA. KEEP THE UI. KEEP THE INTELLIGENCE. KEEP THE
> CONTRACTS. KEEP THE LANDING PAGE. KEEP THE TEST FIXTURES. REMOVE EVERYTHING
> ELSE THAT EXISTS ONLY TO PRETEND THE BACKEND ALREADY EXISTS.

The frontend must **not** contain an authoritative question database, an
authoritative student/faculty roster, or hardcoded KPI/dashboard numbers. A
component may keep its markup, cards, tables, forms, dropdowns, filters,
modals, charts and KPI *shells* — but those shells consume loading / empty /
neutral state, never fabricated numbers.

---

## 4. Initial Architecture Before Phase 11

```
Component → Hook → Service → Central API Client → request()
                                              → axios → (real HTTP backend)
```

… plus a **hidden in-browser prototype adapter** that intercepted requests and
served seeded data from `src/datasets/**` and
`src/intelligence/**/datasets/**`, with localStorage persistence and demo
authentication. This adapter was the "emulated production backend" that the
revised phase deletes.

---

## 5. Target Architecture (Backend Consumer)

```
Component → Hook (service) → request() (@/api/client) → axios → HTTP backend
```

There is **no** `USE_MOCK_API` flag, no runtime branching, no `withMock`, no
dispatch and no route registry in production. `src/config/index.js` states
this explicitly, and a test asserts it.

---

## 6. Prototype API Layer Removed

The following production `src/api/**` modules (the mock router, its route
handlers and prototype stores) were **deleted**:

- `src/api/core/router.js` — in-browser prototype API router.
- `src/api/core/exam-attempts-store.js` — prototype ExamAttempt store.
- `src/api/admin/{administration,intelligence,people}.js`
- `src/api/ai/{assistant,assistant-reply}.js`
- `src/api/auth/session.js`
- `src/api/exam/exam-agent.js`
- `src/api/faculty/{ai-studio,intelligence,micro-assessments,papers,pyq-analysis,question-studio,reports,students,workspace}.js`
- `src/api/interventions/{faculty,lifecycle,store,student}.js`
- `src/api/parent/routes.js`
- `src/api/platform/content.js`
- `src/api/student/{academics,exam-analysis,intelligence,mentor}.js`
- `src/api/index.js` — replaced by a clean re-export of only the central client + `request()`.

`src/api/index.js` is now a **new** file that exposes only `request` (default),
`request` (named) and `api` (axios instance). No `router`, no
`dispatchRequest`, no mock. Verified by `service-surface.test.js`.

---

## 7. Runtime Mock Data Overview

Every `src/datasets/**` backend-owned seeded **entity** dataset was removed as
a data source. What remains is a neutral contract shell (export names kept so
engines/imports resolve; contents empty) OR the file was deleted where nothing
in production imported it. Landing static content and UI configuration are
kept verbatim.

---

## 8. LocalStorage / Prototype Persistence Removed

- `src/api/core/exam-attempts-store.js` (read/write on `localStorage`) deleted.
- The `installTestStorage()` shim in `tests/setup/api.js` remains **only** for
  tests that assert a deterministic storage object; it is not a persistence
  store and is not the mock backend.
- No production authorization path writes backend-owned entities to
  `localStorage`. The report-library "Saved" action still writes a UI-saved
  report id list to localStorage (this is user session UI state, not backend
  entity persistence) but the acceptance criterion is that **backend-owned
  entities are not persisted as authoritative**.

---

## 9. Demo Authentication Removed

- `src/api/auth/session.js` (demo login/session handler) deleted.
- `src/contexts/auth-context.jsx`, `src/services/auth.js` and the auth pages
  (`Login`, `Register`, `OTPVerify`, `ForgotPassword`, `VerifyEmail`) were
  rewritten to use the real API client. Demo credentials and mock session
  injection are gone.

---

## 10. Examination Mock Data Removed

- `src/datasets/exams/attempt-seeds.js` — seed **attempts** (JEE/NEET/
  University) removed from production (moved to fixtures, then deleted as it
  depended on the removed question DB and had no importers).
- `src/datasets/exams/exam-agent.js` — the authoritative practice-exam
  **question database** (`EXAM_AGENT_EXAMS`) is physically removed. Only the
  UI config (`EXAM_AGENT_TYPES`, `EXAM_AGENT_GROUP_LABELS`) is kept.
- `src/datasets/exams/exam-analysis.js` — the per-exam **analysis records**
  (`examAnalysis`, `examAnalysisVariants`) are removed. The question
  metadata / filter options (`examAnalysisOptions`, `universityExamOptions`)
  are kept as contracts.

---

## 11. Student Mock Data Removed

- `src/datasets/student/{growth,mentor,portal}.js` — deleted (no importers).
- `src/datasets/student/academics.js` — seeded student dashboard / attendance /
  assignments / courses / calendar / resources / progress emptied to neutral
  shells; `mockTests`/`exams` remain empty arrays (verified by a test).

---

## 12. Faculty Mock Data Removed

- `src/datasets/faculty/{teaching,workspace}.js` — seeded course / timetable /
  announcement / quiz builder / AI studio / weak-student-detection / dashboard /
  attendance / assignments / question bank / student analytics / research /
  lecture planner / exam builder / reports emptied to neutral shells. The
  `questionBank` keeps an empty `questions: []` so the deterministic Question
  Studio engine still resolves while holding **zero** authoritative questions.
- `src/datasets/faculty/paper-generator.js` — the paper-generation **algorithm**
  is preserved; `generatedPapers` is empty (verified by a test).
- `src/datasets/faculty/pyq-analysis.js` — the seeded PYQ corpus/trends/
  variants removed; `pyqFilters` (filter metadata) and `applyPyqVariant`
  (merge logic) preserved.

---

## 13. Admin Mock Data Removed

- `src/datasets/admin/core.js` — seeded dashboard/kpis/courses/analytics/
  performance/placements/research/roles/permissions/audit-logs/ai-config/
  settings emptied to neutral shells.
- `src/datasets/admin/operations.js` — seeded revenue/programs/subjects/
  batches/calendar/analytics/question-bank/scholarships/cms/api-config/data
  tools emptied to neutral shells.
- `src/intelligence/admin/datasets/ai.js` — seeded executive insight pools /
  intervention templates / report templates / prompt seeds emptied.

---

## 14. Parent / Growth / Mentor / Portal Mock Data Removed

`src/datasets/parent/core.js`, `src/datasets/parent/portal.js`,
`src/datasets/student/growth.js`, `src/datasets/student/mentor.js` and
`src/datasets/student/portal.js` were deleted — each had **no** production
importer and existed solely to emulate a backend entity store.

---

## 15. Micro-Assessment Test Data Migrated

- `src/datasets/faculty/micro-assessments.js` — curated prototype source
  passages + generated questions moved to `tests/fixtures/micro-assessments.js`
  (test-only). The file is deleted from `src` (no authoritative content source
  in production).
- The micro-assessment **engine** (`src/intelligence/faculty/engine/micro-assessments.js`)
  is preserved; its curated-source default was removed and it now accepts an
  injectable `sources` parameter (`filterMicroSources(filters, sources)`,
  `sourceFilterOptions(sources)`). The taxonomy config (`MICRO_ASSESSMENT_*`)
  is kept as engine contract constants.
- Client tests updated to import the fixture and pass `sources` explicitly.

---

## 16. Student / Faculty Directory Roster Removed

- `src/intelligence/faculty/datasets/students-directory.js` — a seeded
  student/batch roster + PRNG attempt generator. Removed from production (no
  live engine consumers; the `computeMyStudentsDirectory` engine takes
  `{ batches, students }` as parameters). Replaced in tests by the existing
  deterministic `tests/fixtures/directory.js`.
- `src/datasets/platform/users.js` — `STUDENT_ROSTER`, `FACULTY_LIST`,
  `ADMIN_USERS`, `DEPARTMENTS` emptied.

---

## 17. User / Department Roster Removed

`src/datasets/platform/users.js` is now a neutral shell (all four exports
empty). The Admin/Student/Faculty people and department pages receive rosters
from the service layer.

---

## 18. Question Databases Removed

- `src/intelligence/faculty/datasets/competitive-questions.js` — JEE/NEET
  competitive question list + University PYQ question list removed (empty).
- `src/intelligence/faculty/datasets/question-studio-sources.js` — curated
  Question Studio source catalog removed (empty).
- `src/intelligence/faculty/datasets/question-studio-questions.js` — per-subject
  question pools removed (empty); `buildStudioPools(rows)` is kept as the pure
  deterministic pool-building algorithm contract.

The frontend therefore holds **no authoritative question database**. Question
metadata/config (subject, chapter, topic, concept, difficulty, type, domain,
examFamily) is preserved as contract metadata.

---

## 19. AI Assistant Data Removed

`src/datasets/ai/assistants.js` — seeded AI tutor / copilot / teaching-assistant
threads, quick prompts, learning path, recommendations, predictions, graph
search and conversation stats emptied to neutral shells.

---

## 20. Intelligence Datasets Audit (`src/intelligence/**/datasets/**`)

Audit result per file:

- **Removed / emptied (backend-owned entity or seeded pool data):** faculty
  `competitive-questions.js`, `question-studio-sources.js`,
  `question-studio-questions.js`, `students-directory.js`; admin `ai.js`.
- **Kept as empty contract shells (engines resolve; no authoritative data):**
  the remaining `src/intelligence/**/datasets/**` aggregation modules. Their
  export names and pure merge/derivation helpers are preserved; the seeded
  records they re-exported from the (now emptied) `src/datasets/**` are gone.
- **Not rewritten:** all `src/intelligence/**/engine/**` logic (Student 360,
  Similar Issues, intervention lifecycle, ExamAttempt/QuestionAttempt
  contracts, micro-assessment, question studio, reports) — algorithms and
  contracts are untouched.

---

## 21. Backend-Owned Entity Datasets — Final Inventory

| Path | State |
|---|---|
| `src/datasets/platform/content.js` | **KEEP** (landing static content) |
| `src/datasets/platform/registration.js` | **KEEP** (UI config) |
| `src/datasets/faculty/paper-generator.js` | **KEEP algorithm**, empty `generatedPapers` |
| `src/datasets/faculty/pyq-analysis.js` | **KEEP** `pyqFilters` + `applyPyqVariant`, records removed |
| `src/datasets/exams/exam-analysis.js` | **KEEP** option metadata, analysis records removed |
| `src/datasets/exams/exam-agent.js` | **KEEP** UI config, question DB removed |
| `src/datasets/{admin/core,admin/operations,ai/assistants,faculty/teaching,faculty/workspace,platform/users,student/academics}.js` | Neutral **shell** (export names kept, contents empty) |
| `src/datasets/parent/*, student/{growth,mentor,portal}.js, exams/attempt-seeds.js, faculty/micro-assessments.js` | **DELETED** |

No backend-owned seeded **entity** record remains in the production bundle.

---

## 22. UI Configuration & Contracts Kept

- Exam-Agent group labels/types (`EXAM_AGENT_GROUP_LABELS`, `EXAM_AGENT_TYPES`).
- PYQ filter cascade metadata (`pyqFilters`), exam analysis option metadata
  (`examAnalysisOptions`, `universityExamOptions`).
- Micro-assessment taxonomy constants (`MICRO_ASSESSMENT_SOURCE_TYPES`,
  `MICRO_ASSESSMENT_DOMAINS`, `MICRO_ASSESSMENT_EXAM_FAMILIES`,
  `MICRO_ASSESSMENT_COUNTS`, `MICRO_ASSESSMENT_DIFFICULTIES`).
- `src/datasets/platform/registration.js` (`REGISTRATION_OPTIONS`).

---

## 23. Landing Page Static Content Kept

`src/datasets/platform/content.js` (nav links, mega menus, hero metrics,
trusted-by, features, AI capabilities, journeys, testimonials, pricing plans,
FAQs, blog posts, contact info, platform stats) is kept verbatim — it is
marketing static content, not backend-owned entity data.

---

## 24. Intelligence Engines & Contracts Kept

- ExamAttempt / QuestionAttempt canonical contracts and domain/examFamily
  isolation (`src/intelligence/engine/exam-attempt-intelligence.js`,
  `src/intelligence/engine/exam-agent.js`).
- Student 360, Academic DNA, Similar Issues, intervention lifecycle and
  question taxonomy.
- Micro-assessment engine, question-studio engine, paper-generator algorithm,
  exam-calc and intervention-recommendation logic — **preserved** (only minimal
  injectable-parameter changes; no algorithm rewrite).

---

## 25. Snapshot Assemblers Made Injectable

The intelligence snapshot assemblers are no longer seeded at runtime. Each now
accepts an injectable `datasets`/`baseDatasets` parameter (defaulting to an
empty shape), so they become backend-fed:

- `src/intelligence/faculty/index.js` — `computeFacultyIntelligence(datasets = {})`,
  `getFacultyIntelligence(datasets = {})`.
- `src/intelligence/admin/index.js` — `computeAdminIntelligence(datasets = {})`,
  `getAdminIntelligence(datasets = {})`.
- `src/intelligence/index.js` — `getStudentIntelligence(extra, baseDatasets)`,
  `getStudentIntelligenceSnapshot(extra, baseDatasets)`.

These assemblers are not referenced by any production component; the
production-facing engine functions (`generateEvaluation`,
`buildReportPreviewDoc`, `buildProgressReport`, `buildExamAgentReport`, etc.)
already take their data from the service/HTTP layer.

---

## 26. Architecture Preserved

The mandated data flow is intact:

```
Component → Hook (service) → request() (@/api/client → @/api/axios) → Backend
```

- Central client: `src/api/client.js`, `src/api/axios.js`, `src/api/index.js`,
  `src/api/ai/tutor-reply.js`.
- Service layer, hooks, API contracts and the central client are preserved.
- No component imports a backend-owned dataset directly; no component imports a
  fixture.

---

## 27. Tests — Migration Off the Mock Backend

The 6 test files that previously drove the in-browser prototype router were
rewritten to call the **real intelligence engines** directly with isolated
fixtures, or to stub only the axios `request()` boundary:

- `student-360-routes.test.js`, `student-360-consolidation.test.js`,
  `student-360-domain-isolation.test.js`, `student-360-evidence-action.test.js`,
  `student-360-ui-render.test.jsx`, `phase-6-multi-student-outcomes.test.js`,
  `micro-assessment-studio.test.js`, `micro-assessment-question-card.test.jsx`,
  `cascading-filters.test.js`, `service-surface.test.js`,
  `sidebar-active-state.test.jsx`, UI/Select/Dropdown tests.

`tests/setup/api.js` now only provides `installTestStorage()` (deterministic
storage object) and `makeRequestMock(routes)` (a per-test axios-boundary stub).
There is **no** fake router, no `mock-api`, no seeded response.

---

## 28. Test Fixture Strategy

`tests/fixtures/` contains only deterministic, purpose-built fixtures:

- `attempts.js` — canonical attempt factory (`makeAttempt`).
- `students.js` — fixture students (`fixtureStudent`, `fixtureStudentB`,
  `jeeStudent`).
- `directory.js` — student/batch directory (replaces the removed roster).
- `micro-assessments.js` — curated micro-assessment sources (moved from `src`).

Fixtures are imported **only** by tests, never by production.

---

## 29. Test Count & Coverage

- Test files: **17** · Tests: **227** — all passing.
- Test count legitimately changed where a suite previously only verified
  deleted mock infrastructure (e.g., router route-presence assertions removed
  from `service-surface.test.js`).
- Legitimate business/intelligence/API-contract tests are **preserved**
  (Student 360, domain isolation, interventions, micro-assessment engine/UI,
  filter cascades, dropdown/select, service surface).

---

## 30. Build Verification

`npm run build` (Vite) succeeds in ~13.2s with no warnings/errors. Chunk output
(unmodified) includes the expected feature chunks and a single main
`index-*.js` bundle. The authoritative question/entity data is no longer in the
bundle.

---

## 31. Batch of Run Results

| Check | Result |
|---|---|
| `npm test` | 17 files / 227 tests pass |
| `npm run build` | ✅ built in ~13.2s |
| Route smoke | routes preserved (see §33) |

---

## 32. Fake Fallbacks / KPI / Success Removed

- Hardcoded KPI values (0 / 126 / 78 / 91 style) that "preserve appearance"
  are removed from the backend-owned datasets; KPI components remain but now
  consume loading / empty / neutral state supplied by the service layer.
- Fake success toasts that reported a backend save from a localStorage write
  were removed from the auth path (a UI-only "saved to library" toast remains
  for genuinely UI-local state, clearly labelled as frontend-only).
- Engine dataset defaults that pointed at backend-owned seeds were made
  injectable (empty by default), removing the `|| sampleData` / `?? mockData`
  fake-fallback path.

---

## 33. Route / Navigation / UI Preservation Audit

Routes, navigation, tabs, cards, tables, forms, dropdowns, filters, modals,
charts and KPI components are preserved. The `src/routes/index.jsx` student /
faculty / admin / parent route tree (including
`/faculty/question-intelligence/micro-assessment`, `/student/micro-assessments`,
admin reporting, etc.) is intact. No route or page was removed because data was
removed — pages render the loading/empty/neutral state.

---

## 34. Browser Verification Limitation

**Browser automation is NOT available in this environment.** Therefore no
pixel-level, responsive (375/768/1024/1440/1920px) or click-through UI
verification was performed, and none is fabricated here. Verification is
limited to the automated test suite (`npm test`) and production build
(`npm run build`). Runtime UI behavior is expected to show empty/neutral states
until the real backend supplies data.

---

## 35. Acceptance Criteria (verified)

- [x] Prototype API router, routes, stores and persistence physically deleted.
- [x] No mock backend retained in `tests/fixtures/mock-api`; no test requires
      a complete fake backend.
- [x] Backend-owned seeded entity data removed from `src/datasets/**` and the
      frontend question databases.
- [x] Test-only data moved to `tests/fixtures/`; dead data deleted.
- [x] Intelligence engines/contracts, business logic, UI, routes, and landing
      content preserved.
- [x] Architecture `Component → Hook → Service → API Client → Backend` preserved.
- [x] `npm test` passes (227 tests).
- [x] `npm run build` passes.

---

## 36. Remaining References & Backend Readiness

A small number of neutral, empty **contract shells** remain in
`src/datasets/**` and `src/intelligence/**/datasets/**`. Each exists solely to
preserve an export name so the intelligence aggregation / engine module imports
still resolve at build time; they contain **no seeded entity data**. They are
declared as the documented target for the future
`Backend data → Intelligence engine → Student 360 / Academic DNA / Similar Issues`
curriculum and are safe to remove once the real backend is wired and the
engines are fed entirely by injectable data.

The frontend is now backend-ready: swap in a real HTTP backend and the existing
service layer (already calling `/…` endpoints through `request()`) delivers
real data with zero frontend changes.
