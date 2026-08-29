# Phase 10 — Complete Mock Data Removal / Backend-Ready Frontend Foundation

**Project:** EduX (`medixo-edux-platform` v1.0.0)
**Branch:** `arena/01a04ce2-edux`
**Date:** 2026-08-29
**Scope:** Remove the frontend's dependency on mock / seeded / prototype data so
that EduX becomes a strict backend-consuming frontend. No backend code is
created. No UI is redesigned.

> **Principle applied:** REMOVE THE FAKE DATA, NOT THE UI.
> The frontend must wait for the real backend instead of pretending that mock
> data is real.

---

## Executive Summary

EduX is now a **strict backend-consuming frontend**. At runtime the application
defaults to real backend mode (`USE_MOCK_API === false`), so no mock, seeded or
prototype data is ever served by the running application. When the backend is
unavailable, every backend-backed surface shows the existing **loading / empty /
error** state instead of fabricating records.

The in-browser prototype adapter (`src/api/core/router.js`) and its deterministic
datasets remain in the tree **only as a test/dev seam**: they are reachable at
runtime exclusively when a developer sets `VITE_USE_MOCK=true`, and in the test
suite, which drives the router directly (`dispatchRequest`) as the contract test
bed. The **production runtime never serves mock data.**

Key architectural change (data flow):

```
React UI  →  Hooks  →  Services  →  Central API Client (axios)  →  HTTP Backend
                                          ▲
                                          │ default
                          VITE_USE_MOCK === 'true'  (opt-in, dev only)
                                          ▼
                        in-browser prototype router (TEST-ONLY seam)
```

Not: `React UI → (fake) Dataset`, `React UI → localStorage database`,
`React UI → mock route`.

---

## Initial Mock Data Inventory

The audit (before changes) found the mock/prototype data split across:

- `src/datasets/**` — 19 deterministic dataset files (users, admin, exams, faculty, parent, platform, student).
- `src/intelligence/**/datasets/**` — 27 intelligence dataset files (admin / student / faculty).
- `src/api/**` — ~26 route modules registering ~140 `defineRoute` handlers (the in-browser prototype adapter).
- `src/api/core/router.js` — the in-browser mock router dispatcher.
- `src/api/core/exam-attempts-store.js` + `src/api/interventions/store.js` — localStorage-backed prototype stores.
- Auth: `DEMO_USERS` (demo credentials, password `Edux12345`), registered-students registry, demo OTPs.
- Components reading `localStorage` for client state (chat history, AI workspace, admin report library, question studio, micro-assessment).

Search terms matched: `mock, seeded, sample, demo, fixture, fake, fallback,
localStorage, sessionStorage, prototype`. No occurrences of
`mock-data`, `mock-routes`, `mock-server`, `MOCK_USERS`, `sampleQuestions`,
`sampleExams`, `mockQuestions`, `mockPapers`, `mockExams`, `fakeQuestions`,
`fallbackQuestions` exist in the tree.

---

## Classification

| Category | What it is | Phase 10 treatment |
|---|---|---|
| A — Backend-owned production data | questions, papers, exams, attempts, students, faculty, batches, interventions, practice attempts, re-tests, published exams, results | No runtime mock fallback. Runtime routes to backend. |
| B — Client-owned UI state | selected tab, dropdown/modal/sidebar state, form state, search, sort, UI prefs, chat history | Keep. |
| C — Intelligence contracts / engines | ExamAttempt & QuestionAttempt contracts, Student 360, Academic DNA, Similar Issues, intervention lifecycle, question taxonomy | Keep (architecture). |
| D — Test fixtures | `tests/fixtures/`, in-memory router contract bed | Keep, isolated from production. |
| E — Demo / presentation-only content | landing marketing content, static showcase | Keep. |
| F — Dead data | unreachable prototype files | None proven dead → none deleted on that basis. |

---

## Removed Runtime Mock Data

1. **Runtime mock router disabled by default.** `src/config/index.js`:
   `USE_MOCK_API: import.meta.env.VITE_USE_MOCK === 'true'` (was
   `!== 'false'`). The runtime no longer serves mock API responses.
2. **Demo authentication removed.** `DEMO_USERS` deleted from
   `src/datasets/platform/users.js`; `AuthContext.login` now calls the real
   backend `POST /auth/login`; mock tokens, the registered-students sign-in
   fallback, and the login "Try the demo" box/credentials were removed.
   `src/services/auth.js` gained a backend-bound `login()`.
3. **Examination mock sources removed** (Phase 9, verified): papers, exam
   library, student exams, mock tests, and the question pool for Paper
   Generator are backend-only across `src/services/faculty-papers.js`,
   `src/services/faculty-questions.js`, `src/services/student-examinations.js`.
4. **No backend-owned localStorage trust:** runtime routes attempts,
   interventions, practice attempts, re-tests, papers/shares through the
   backend; the prototype-localStorage stores are only reached via the test/dev
   router.

---

## Retained Data

| Retained | Why |
|---|---|
| Intelligence engines + canonical contracts (ExamAttempt, QuestionAttempt, Student 360, Academic DNA, Similar Issues, intervention lifecycle, question taxonomy, University/JEE/NEET isolation) | **Architecture / product behaviour**, not mock data. Section 28. |
| Deterministic seed datasets (`STUDENT_ROSTER`, `students-directory`, question banks, `attempt-seeds`) | Consumed only by the now-disabled prototype router / engines; retained as the **contract test bed** (Category D). Not imported by production UI. |
| Landing / marketing content | **Static presentation content** (Category E). |
| `EXAM_AGENT_GROUP_LABELS` | Label/contract constant. |
| Client-owned UI state & prototype AI (tutor/copilot reply, chat history, AI workspace, question studio, micro-assessment) | Client-owned UI state (B) / out-of-scope feature (section 38). |

---

## Reason For Retention

Every retained mock/sample/prototype item has an explicit reason in
`docs/MOCK-DATA-REMOVAL-INVENTORY.md`. There is **no unexplained runtime mock
data** — the retained datasets are either (a) static presentation content,
(b) intelligence contracts/engines, or (c) test-only seams that the runtime does
not invoke.

---

## Mock API Handlers Removed

| Handler | Phase |
|---|---|
| `GET /faculty/paper-generator` | 9 |
| `POST /faculty/paper-generator/papers` (+ duplicate / regenerate / archive / share / delete) | 9 |
| `GET /student/exams` | 9 |
| `GET /student/mock-tests` | 9 |
| `GET /faculty/paper-generator/shares` | 9 |
| `POST /auth/profile-setup` | 3 |

Remaining `defineRoute` handlers are the in-browser prototype router contract
test bed, served only when `VITE_USE_MOCK=true` (opt-in dev) or directly by the
test suite. **Not served by the runtime.**

---

## LocalStorage Persistence Removed

See the full table in `docs/MOCK-DATA-REMOVAL-INVENTORY.md` §5. Summary:

- **Removed as authoritative for backend-owned entities:** papers / shares
  (`EduX_faculty_paper_shares`, Phase 9), exam attempts
  (`EduX_student_exam_attempts`), interventions
  (`EduX_faculty_interventions`), practice attempts
  (`EduX_intervention_practice_attempts`), re-tests
  (`EduX_intervention_retests`), registered students (`EduX_registered_students`).
- **Kept (client-owned / session):** `EduX_access_token`,
  `EduX_refresh_token`, `EduX_user`, `EduX_theme`, `EduX_reduced_motion`,
  chat/AI-workspace history, question-studio sessions, micro-assessment
  attempts, admin report export artifacts.

Critically, **no production component imports the backend-owned localStorage
stores directly** (verified via import graph); the runtime routes these through
the central API client.

---

## Backend API Boundaries

The canonical route is maintained and is the single source of frontend ↔ backend
contract truth (`docs/backend-integration/` + `openapi.yaml`):

| Layer | Files |
|---|---|
| Central API client | `src/api/axios.js` (axios, `VITE_API_BASE_URL`, bearer + refresh) |
| Request seam | `src/api/client.js` (`request()` — mock router when opted in, else axios) |
| Router (test seam) | `src/api/core/router.js` |
| Service layer | `src/services/*` |

New backend-ready services bypass the mock router and use `src/api/axios.js`
directly:

- `src/services/faculty-questions.js`
- `src/services/faculty-papers.js`
- `src/services/student-examinations.js`
- `src/services/auth.js` (`login`)

**Architecture:** `Component → Hook → Service → API Client → Backend`. No
component accesses `src/datasets/**`, localStorage databases, or mock routes for
backend-owned data.

---

## Examination Data Flow

```
Paper Generator UI  →  useFacultyQuestions() / usePaperGeneratorBackend()
                  →  src/services/faculty-questions.js / faculty-papers.js
                  →  src/api/axios.js  →  VITE_API_BASE_URL  →  backend
```

**NOT** `UI → mock dataset`. If the backend is unavailable, the Paper Generator
`UI is preserved` and shows "Question bank unavailable" / "Paper Library
unavailable" + "Connect the EduX backend". It does not populate fake questions.

---

## Student Data Flow

```
Student Examinations UI  →  useStudentExams() / useMockTestsBackend() / useStartExam()
                       →  src/services/student-examinations.js
                       →  src/api/axios.js  →  backend  (published exams, no answers)
```

No frontend-seeded exam list. Backend unavailable → "No examinations available".

---

## Faculty Data Flow

```
Faculty UI  →  useFacultyStudents() / useFacultyStudent360() / etc.
           →  src/services/faculty-students.js / faculty-intelligence.js
           →  src/api/client.js  →  axios  →  backend
```

My Students, Student Profile, Student 360, Batch UI, filters, search, sorting,
navigation are all **preserved**. Backend unavailable → skeleton/error state.

---

## Intelligence Data Flow

The intelligence **engines and contracts are preserved** (Category C). Their
runtime input data (canonical attempts, students, batches, interventions) will
come from the backend. Until then, the intelligence surfaces show the existing
empty / unavailable treatment rather than inventing records. No algorithm was
rewritten; no domain isolation was weakened.

---

## UI Preservation Audit

- All existing pages, routes, tabs, sidebar items, headers, cards, dialogs,
  tables, forms, dropdowns, buttons, filters, panels and components remain.
- **No UI component was deleted because its data source changed.** The mock
  students removal does not delete `StudentCard`; it renders an appropriate
  loading/empty/error state.
- **No page was replaced with "Backend unavailable".** Pages remain recognizable
  and show states only in the regions where data would appear.
- **No component was removed for being "unused after mock removal"** — no
  component became unreachable for that reason.

## Route Preservation

Every existing route remains accessible:

- `/faculty/question-intelligence` (Paper Generator / Library tabs) — preserved;
  shows "No question bank connection." when backend is down.
- `/faculty/my-students`, `/faculty/my-students/:studentId` — preserved.
- `/student/examinations`, `/student/exams`, `/student/mock-tests` — preserved.
- `/student/interventions`, `/student/exam-analysis`, `/student/exam-agent`,
  `/student` — preserved.
- `/admin` dashboards — preserved.

Navigation links, sidebar items, tabs and menus are unchanged.

## Dropdown Preservation

No dropdown was modified in Phase 10. Previous fixes are preserved:

- selected-value display,
- parent-first dependencies,
- downstream reset,
- viewport positioning,
- keyboard support.

When backend options are unavailable, dropdowns show the existing
`Loading...` / `No options available.` treatment — no old mock options are
silently populated.

---

## Test Fixture Policy

- `tests/fixtures/` (attempts, students) and the in-memory router contract bed
  remain **test-only**.
- **No production code imports test fixtures.** Verified via import graph.
- Fixtures are minimal and only exercise contracts.
- The test suite drives the router through `dispatchRequest` and (for the SSR
  smoke test) a thin axios stub that delegates to the router — both are test
  fixtures, not runtime data.

---

## Import Graph

Verified:

- ✓ No production component imports `tests/fixtures/*`.
- ✓ No production component imports obsolete mock-data modules.
- ✓ No service imports deleted datasets.
- ✓ No broken barrel exports.
- ✓ No dead mock API imports in runtime services.
- ✓ No circular dependency introduced.
- ✓ No production component imports `src/datasets/**` for backend-owned data
  (remaining dataset imports are static landing content + `EXAM_AGENT_GROUP_LABELS`).
- ✓ No production component imports `src/api/interventions/store.js` or
  `src/api/core/exam-attempts-store.js` directly.

---

## Remaining Mock/Prototype References

All remaining occurrences are classified in
`docs/MOCK-DATA-REMOVAL-INVENTORY.md`. Classification outcome:

- `mock-data`, `mock-routes`, `mock-server`, `MOCK_USERS`, `sampleQuestions`,
  `sampleExams`, `mockQuestions`, `mockPapers`, `mockExams`, `fakeQuestions`,
  `fallbackQuestions` → **0 matches**.
- `DEMO_USERS` → appears only in comments explaining its removal.
- `seeded` / `samplePapers` / `mock` → appear in comments describing the
  **removal** of mock fallback, in test assertions, and in the in-browser
  prototype router (test seam).

**Result:** zero unresolved runtime mock data.

---

## Tests

```
npm test
→ Test Files  17 passed (17)
   Tests      280 passed (280)
```

- `tests/services/service-surface.test.js` gained a Phase 10 block asserting
  `APP_CONFIG.USE_MOCK_API === false` (runtime = strict backend consumer) and
  that the backend-owned examination endpoints have no runtime mock handler.
- `tests/intelligence/student-360-ui-render.test.jsx` was updated so the SSR
  smoke render drives the axios client through a thin router-delegating stub
  (test fixture), keeping it deterministic without depending on `USE_MOCK_API`.
- No test was deleted; no test was weakened; tests that asserted mock data
  appearance were already updated in Phase 9.

## Build

```
npm run build
→ ✓ built
```

---

## Runtime Verification

The frontend was started with the backend unavailable
(`npm run dev`, `USE_MOCK_API === false`). The app boots and serves.

Verified (page-level guards reviewed):

| Surface | Backend unavailable |
|---|---|
| Faculty My Students | `DashboardSkeleton` → `ErrorState` |
| Faculty Student Profile / Student 360 | `DashboardSkeleton` → `ErrorState` |
| Faculty Paper Generator / Library | "Question bank unavailable" / "Paper Library unavailable" + "Connect the EduX backend" |
| Student Examinations / Mock Tests / Exam Agent | "No examinations available" / "No mock tests available" + "Connect the EduX backend" |
| Dashboards (student / faculty / admin) | `DashboardSkeleton` → `ErrorState` |
| Auth login | network/auth error (no fake login) |

The active routes were preserved. No mock data appears; no fake numbers are
displayed; pages do not crash — their guards return loading/error states.

## Browser Verification

**Browser automation is not available in this environment.** No browser
resolution checks (375px / 768px / 1024px / 1440px / 1920px) were performed, and
no fabricated browser results are reported. The limitation is disclosed here.

Instead, runtime behaviour was verified through:
- the page-level loading/error guard audit above,
- the SSR smoke render suite (`student-360-ui-render.test.jsx`),
- the contract service-surface suite, and
- a `npm run dev` boot check (HTTP 200 on `/`).

---

## Known Limitations

1. **No live backend.** Arena has no Python backend / PostgreSQL, so the
   end-to-end success path cannot be exercised here. The end state is: backend
   unavailable → empty/error/loading state appears for backend-owned data.
2. **No browser automation.** Visual/responsive regression across the requested
   breakpoints could not be auto-verified (documented, not fabricated).
3. **In-browser prototype router retained as a test/dev seam.** The ~140
   `defineRoute` handlers and deterministic datasets remain in the tree for the
   contract test bed and opt-in local development. They are **disabled at
   runtime** (default) and are not served by the production application.
   Fully deleting them would require rewriting the test suite and would
   eliminate the contract test bed; it is out of scope for this phase and is
   documented rather than half-removed.
4. **Registration / OTP / Forgot-password flows** still contain prototype demo
   OTP handling (`src/api/auth/session.js`, OTP pages). These are reachable only
   via the test/dev router; the runtime routes them to the backend. A real
   identity backend will serve OTP/email, and the demo-OTP UI copy is best
   removed alongside that backend work (documented gap, section 36/49).
5. **Admin report export artifacts** are stored in localStorage
   (`EduX_admin_report_library`) as a frontend prototype export; the report
   generation backend is not yet built (documented gap).
6. **Intelligence seed datasets** are still consumed by the intelligence engines
   when driven through the prototype router; at runtime the pages wait for
   backend data and show empty/unavailable states.

---

## Files Deleted

- No files were deleted. `DEMO_USERS` entries were removed **from**
  `src/datasets/platform/users.js` (the file remains, exporting the retained
  directory constants). No mock dataset file was deleted because removing them
  would break the test-contract bed and is documented as the test-only seam.

## Files Modified

| File | Change |
|---|---|
| `src/config/index.js` | `USE_MOCK_API` default → `false` (strict backend consumer). |
| `src/contexts/auth-context.jsx` | Backend-bound login; removed DEMO_USERS, mock tokens, registry sign-in. |
| `src/services/auth.js` | Added backend `login()` (`POST /auth/login`). |
| `src/pages/auth/Login.jsx` | Removed demo box + demo credentials; login shows backend error. |
| `src/api/auth/session.js` | Removed `DEMO_USERS` dependency from registration duplicate check. |
| `src/datasets/platform/users.js` | Deleted `DEMO_USERS` (demo credentials). |
| `tests/services/service-surface.test.js` | Added Phase 10 backend-mode assertions. |
| `tests/intelligence/student-360-ui-render.test.jsx` | Axios stub → router for deterministic SSR render. |
| `docs/MOCK-DATA-REMOVAL-INVENTORY.md` | New — full removal/retention inventory. |
| `docs/PHASE-10-COMPLETE-MOCK-DATA-REMOVAL-REPORT.md` | New — this report. |

---

## Final Acceptance Criteria

Phase 10 is complete on the following verified criteria:

- [x] Runtime mock data removed from backend-owned domains (runtime is backend-bound).
- [x] Seeded production entities no longer used as runtime fallback.
- [x] Mock questions removed from the examination flow (Phase 9, verified).
- [x] Mock papers removed from the examination flow (Phase 9, verified).
- [x] Mock exams removed from the student examination flow (Phase 9, verified).
- [x] Mock students/batches no longer served at runtime by the frontend.
- [x] Prototype localStorage databases removed as authoritative for backend-owned entities.
- [x] Mock API handlers removed where no longer required (examination domain).
- [x] No mock fallback for backend-owned data.
- [x] No fake successful API response exists at runtime.
- [x] No fake question generation in the normal examination flow.
- [x] API service boundaries remain intact.
- [x] Existing backend documentation remains the source of truth (gaps documented).
- [x] Existing UI components / pages / routes / navigation / tabs / cards / dropdowns / tables / modals remain.
- [x] Existing visual design unchanged.
- [x] Existing intelligence engines remain intact.
- [x] Existing domain isolation intact (University/JEE/NEET via domain+examFamily).
- [x] AI Micro-Assessment NOT migrated.
- [x] No backend code / DB connection / Docker backend created.
- [x] No new mock backend created.
- [x] Test fixtures remain isolated from production.
- [x] No production code imports test fixtures.
- [x] Backend-unavailable state does not crash the application (page guards verified).
- [x] Loading / empty / error states handled.
- [x] No fake numbers displayed after mock removal.
- [x] No unexplained runtime mock data remains.
- [x] `npm test` passes (280).
- [x] `npm run build` passes.
- [x] Import graph clean.
- [x] No unrelated functionality changed.
- [x] No UI redesign.

> **STOP condition honored.** No Python backend, no database, no Micro-Assessment
> migration, no other feature, and no UI redesign was undertaken.
