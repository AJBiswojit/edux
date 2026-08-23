# PHASE 2 — SAFE DEAD-CODE CLEANUP REPORT

**Date:** 2026-08-23 · **Base:** Phase 1 (`d46e1c0` — Student 360 domain isolation + intelligence tests) merged at `8854fa1`
**Scope:** deletion-only + necessary reference cleanup. No refactoring, no architecture migration, no behavior change.

---

## Audit Method (read-only, performed before any deletion)

A current dependency map was rebuilt from `src/main.jsx` outward: static imports, dynamic `import()` (incl. all `lazy()` routes), React Router table, barrel re-exports, side-effect mock-route registrations, feature flags (`FEATURE_FLAGS.parentPortal`), URL/deep-link strings, localStorage keys, package scripts, and config references (Vite/Tailwind/PostCSS).

Two automated passes were used as evidence (read-only):

1. **Reachability scan** — full import graph from `main.jsx` + both test suites. **Before:** 3 unreachable of 438 modules (`constants/index.js`, `intelligence/engine/index.js`, `pages/admin/Parents.jsx` — page files kept artificially "reachable" only by dead lazy bindings were audited separately). **After:** 0 unreachable of 429.
2. **Endpoint ↔ service cross-reference** — 189 mock-route registrations vs. every service-layer request path (normalized `:param` ≡ `${param}`).

---

## Files Deleted (10)

| File | Reason | Dependencies checked | Confidence |
|---|---|---|---|
| `src/pages/admin/AttendanceAnalytics.jsx` | Route `/admin/attendance-analytics` served by `LegacyRedirect`; lazy binding unused | static/dynamic import (only the unused lazy const), route, Institution Intelligence (reads datasets directly), Reports, deep links, nav, docs (historical only), component reuse | 🟢 SAFE |
| `src/pages/admin/AssignmentAnalytics.jsx` | Same — `/admin/assignment-analytics` redirects | same 11-point check | 🟢 SAFE |
| `src/pages/admin/ExamAnalytics.jsx` | Same — `/admin/exam-analytics` redirects | same 11-point check | 🟢 SAFE |
| `src/pages/admin/AcademicAnalytics.jsx` | Same — `/admin/academic-analytics` redirects | same 11-point check | 🟢 SAFE |
| `src/pages/admin/Performance.jsx` | Same — `/admin/performance` redirects | same + confirmed its `useAdminIntelligenceDerived` consumer is a service export (kept) | 🟢 SAFE |
| `src/pages/admin/Placements.jsx` | Same — `/admin/placements` redirects | same 11-point check | 🟢 SAFE |
| `src/pages/admin/Parents.jsx` | No route, no import, no nav item, no feature-flag dependency; self-contained (inline `PARENT_ROSTER`, no external dataset). This is the *admin* page only — the Parent portal (`src/pages/parent/*`, parent datasets/services/routes/auth) is untouched | import graph, route table, `ParentGate`, `FEATURE_FLAGS.parentPortal`, sidebar `NAV_GROUPS`, deep links, docs | 🟢 SAFE |
| `src/constants/index.js` | Dead duplicate: `ROLES/ROLE_HOME/ROLE_LABELS/…` superseded by `src/config/index.js` (single source used by routes) | zero importers of `@/constants` or relative root path (only `@/constants/ui` is imported and that submodule is self-contained), symbol-level grep for `ROLE_GRADIENTS/SEMESTERS/ATTENDANCE_STATUS/…` → zero external use, tests/scripts/docs (historical only) | 🟢 SAFE |
| `src/intelligence/engine/index.js` | Unreachable barrel; public façade is `src/intelligence/index.js` (imported directly from engine source modules). Zero static/dynamic/barrel/test consumers. Its 18 helper-only re-exports (e.g. `clamp`, `round1`, `SPEED_THRESHOLDS`, `buildAttemptSignals`) remain exported from their source modules which all consumers import directly | import graph, `from '@/intelligence/engine'` in every form (0 hits), both test suites (import source modules directly), intelligence logic untouched | 🟢 SAFE |
| `scripts/clean-unused-imports.cjs` | One-off development script ("One-time audit cleanup" per its own header); not registered in `package.json`; zero importers; re-run read-only → 0 findings (its work is complete) | package scripts, npm config, importers, docs (one historical mention in PHASE-0 audit retained as history) | 🟢 SAFE |

## Files Modified (3)

| File | Change |
|---|---|
| `src/routes/index.jsx` | Removed the 6 unused lazy constants (`AdminAttendanceAnalytics`, `AdminAssignmentAnalytics`, `AdminExamAnalytics`, `AdminAcademicAnalytics`, `AdminPerformance`, `AdminPlacements`). **No route element changed** — `LegacyRedirect` mappings stay, so bookmarks/old links still land on Institution Intelligence tabs. `ParentGate` and all flags untouched. |
| `src/api/mock-routes.js` | Removed 3 endpoint registrations with **zero** service/hook/page consumers (`GET /directory/faculty|students|users`) + trimmed now-unused `FACULTY_LIST` import. Datasets remain authoritative via direct imports (`intelligence/admin/datasets/people.js`, `students-directory.js`). No other endpoint touched. |
| `src/intelligence/faculty/engine/ground-level-intelligence.js` | Removed one dead empty import statement (`import {  } from '…/exam-attempt-intelligence.js'`). No logic change. |

## References Updated
- 6 unused lazy imports removed from `src/routes/index.jsx` (declaration-only bindings, count = 1 occurrence each).
- 1 import specifier trimmed (`FACULTY_LIST` in `src/api/mock-routes.js`).
- 1 empty import removed (`ground-level-intelligence.js`).
- Deep links intentionally **not** repointed: `admin-dashboard` quick links to `/admin/exam-analytics`, `/admin/performance`, `/admin/academic-analytics` remain functional through the preserved `LegacyRedirect` routes (behavior unchanged).

## Dead Hooks Removed
**None.** All 8 Phase-2 candidates were verified **already absent** from the codebase (removed in earlier phases): `useFacultyStudent` (singular — only the live `useFacultyStudents`/`useFacultyStudent360` exist), `useFacultyStudentExams`, `useFacultyStudentAnalytics`, `useFacultyProfile`, `useFacultyDashboard`, `useFacultyIntelligenceDerived`, `useFacultyIntelligenceDatasets`, `useMasterFacultyProfile` — zero matches in `src/`.
> Per the phase rule "do NOT remove datasets, engines, or services merely because the page was removed," page-orphaned service hooks (`useAdminAnalytics`, `useAdminPerformance`, `useAdminPlacements`, `useAdminIntelligenceDerived`, …) were **kept** — see Manual Review.

## Dead Pages Removed
7 admin pages (listed above). Net admin page count 33 → 26; every remaining admin page is routed and lazy-chunked.

## Dead Components Removed
**None found.** Component reachability was verified per file; all 187 component files have at least one live import chain (incl. barrel-level). Page-as-component checks confirmed consumers, so both were **kept**:
- `src/pages/faculty/PYQAnalysis.jsx` → `PYQAnalysisContent` consumed by `components/assessment-workspace/pyq-intelligence-tab.jsx`
- `src/pages/faculty/AIQuestionStudio.jsx` → `AIQuestionStudio` consumed by `pages/faculty/QuestionIntelligence.jsx`

## Dead Mock Endpoints Removed
`GET /directory/faculty`, `GET /directory/students`, `GET /directory/users` (chain Endpoint → no service → no hook → no page/component → n/a route). All other 186 registrations audited and retained, including the full Question Intelligence / PYQ / Paper Generator / Paper Library / Student 360 / Interventions / Re-test / Admin Intelligence surface (verified consumed by services/hooks/pages or by the `${action}`-templated question-studio routes).

## Dead Datasets Removed
**None.** All 28 dataset modules (mock-data + intelligence/datasets) have live importers; the deleted pages' underlying datasets (`adminAttendanceAnalytics`, `adminAssignmentAnalytics`, `adminExamAnalytics`, `adminPerformance`, `adminPlacements`, …) remain consumed by Institution Intelligence engines (`assessments.js`, `health.js`, `reports.js`, `students.js`) and tabs.

## Temporary Artifacts Removed
1 dev script (`scripts/clean-unused-imports.cjs`). Phase-1 test infrastructure preserved: `tests/intelligence/student-360-domain-isolation.test.js` (canonical), `package.json` test script, Vitest defaults — untouched.

## Dependencies Removed
**None.** All 22 packages verified in use (`axios`→`api/axios.js`, `react-dropzone`→uploads, `react-hook-form`→auth, `react-markdown`+`remark-gfm`→chat, `date-fns`→calendars, `clsx`+`tailwind-merge`→`cn`, `recharts`/`framer-motion`/`lucide-react`/`@tanstack/react-query`→core UI; all dev deps config-referenced). No upgrades, no additions.

## Manual Review Candidates (KEPT — not deleted)

| Item | Why kept |
|---|---|
| `test/student-360-domain-isolation.test.js` + `test/fixtures/intelligence-attempts.js` | Superseded older iteration of the Phase-1 suite (pins the pre-Phase-1 adapter mapping `examFamily:'University'` via `exam-attempt-intelligence.js::classifyAttemptContext)`, still passing). Hard rule "do not delete legitimate automated tests" → kept; recommend Phase-3 consolidation into `tests/intelligence/`. |
| ~31 zero-consumer service hooks (`useStudentDashboard`, `useStudentProfile`, `useAdminDashboard`, `useMasterInstitutionProfile`, `useIntelligenceExamAttempts`, `useStudentIntelligenceDerived`, …) | Pages migrated to the `use*Intelligence` foundations in earlier phases; hooks mirror live, working mock endpoints. Phase rule: don't remove services because pages were removed → kept as API surface; prune decision belongs to a dedicated service-layer phase. |
| `exam-attempt-intelligence.js::classifyAttemptContext` adapter export | Still consumed internally by `asDomain()` and the legacy `test/` suite; changing it would alter intelligence logic — out of scope. |
| Legacy deep links in `admin-dashboard/*` pointing at redirect URLs | Functional via `LegacyRedirect`; repointing = behavior change — deferred. |
| `src/intelligence/index.js` façade parity | 18 helper exports exist only at source modules; if a public façade surface is desired for them, decide in Phase 3. |

## Before vs After Metrics

| Metric | Before | After | Δ |
|---|---|---|---|
| Files (src, all) | 440 | 431 | −9 |
| JS/JSX modules (src) | 438 | 429 | −9 |
| Pages (`src/pages`) | 113 | 106 | −7 |
| — Admin pages | 33 | 26 | −7 |
| Components (`src/components`) | 187 | 187 | 0 |
| Services | 11 | 11 | 0 |
| Mock route registrations | 189 | 186 | −3 |
| Intelligence modules | 74 | 73 | −1 |
| Datasets (mock-data + intel datasets) | 28 | 28 | 0 |
| Test files | 2 | 2 | 0 |
| Scripts (`scripts/`) | 1 | 0 | −1 |
| package.json dependencies | 22 | 22 | 0 |
| Unreachable modules (graph scan) | 3 | 0 | −3 |

Diff size: **13 files changed, +5 / −1111 lines.**

## Automated Tests
`npm test` → **2/2 files, 19/19 tests pass** (canonical `tests/intelligence/` 10 + legacy `test/` 9), identical before and after cleanup.

## Build
`npm run build` → **success** (Vite 5, 15.3 s; zero compilation errors; only the pre-existing >1200 kB chunk-size warning). No CSS/PostCSS/Tailwind errors.

## Route Smoke
Method: production build chunk presence for every lazy route + HTTP 200 on the served app shell (`vite preview`) for 21 representative routes incl. all required surfaces. Rendering is client-side; interactive click-through could not be executed (see below).

- **STUDENT** ✓ Dashboard · ✓ Exam Analysis · ✓ Academic DNA (`/student/academics` → dna-tab) · ✓ Exam Agent · ✓ Interventions
- **FACULTY** ✓ Dashboard · ✓ Assessment Intelligence (`/faculty/question-intelligence`: Question Intelligence, PYQ Intelligence, Paper Generator, Paper Library tabs — `pyq-intelligence-tab`/`paper-*` components compiled & wired) · ✓ My Students · ✓ Student Profile / Student 360 (`/faculty/my-students/:studentId` incl. Similar Issues, Interventions, Targeted Practice, Re-test panels + `intervention-practice-runner`) · ✓ attempt-analysis deep route
- **ADMIN** ✓ Dashboard · ✓ Institution Intelligence · ✓ Reports · ✓ AI Workspace · ✓ Support
- **Backward-compat** ✓ `/admin/attendance-analytics|assignment-analytics|exam-analytics|academic-analytics|performance|placements` all still resolve via `LegacyRedirect` (HTTP 200 → workspace tabs). `/admin/parents` → NotFound, same as before (was never routed).

## Responsive Regression
No CSS/Tailwind/PostCSS changes were made and the production build compiles clean. **Interactive viewport verification unavailable** (no browser automation in this environment); 375 / 768 / 1440 px sweeps not performed — no claim made.

## University/JEE/NEET Regression
Phase-1 behavior preserved and verified: `classifyAttemptContext()` unchanged (`exam-agent.js`, `exam-attempt-intelligence.js`, `student-360.js`, `similar-issues.js` all untouched): University → `domain=university, examFamily=null`; JEE/NEET → `domain=competitive, examFamily=JEE|NEET`. The canonical isolation suite (10 tests: classification, normalization, per-domain/family subject·chapter·question·trend·DNA isolation, similar-issues partitioning) passes.

## Remaining Technical Debt
1. Duplicate legacy test suite at `test/` (consolidate in Phase 3).
2. Service-hook surface larger than page consumption (deliberately preserved API surface).
3. `LegacyRedirect` deep links could point directly at workspace tabs (behavior change — deferred).
4. StudentProfile/Student360 dual-panel coexistence and 4× InterventionCenter variants (explicitly deferred to a later architecture phase).
5. Page-as-component homes (`PYQAnalysis.jsx`, `AIQuestionStudio.jsx`) to be extracted to components later.

## Recommended Phase 3
Stop here per phase rules. When resumed: (a) consolidate `test/` → `tests/intelligence/` and retire the adapter-only expectations; (b) decide service-hook pruning policy with endpoint parity mapping; (c) StudentProfile/Student360 component consolidation; (d) extract PYQ/AI-Studio content components from page files; (e) repoint legacy deep links, then optionally retire redirect routes.
