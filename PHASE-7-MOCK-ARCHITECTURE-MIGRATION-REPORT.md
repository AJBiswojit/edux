# PHASE 7 — MOCK ARCHITECTURE → PRODUCTION FRONTEND ARCHITECTURE

**Branch:** `arena/01a02ed2-edux` · **Base commit:** `f59d384`
**Scope:** architecture normalization of the prototype/mock layer into a clean
frontend API + dataset architecture.
**Non-scope (explicitly NOT done):** no backend, no database/ORM, no models, no
auth changes, no intelligence-logic changes, no product-behaviour changes, no
feature removal, no global find-and-replace of the word "mock".

| Gate | Before | After |
|---|---|---|
| `npm test` | 7 files · **155 passed** | 7 files · **155 passed** |
| `npm run build` | ✅ built | ✅ built |
| Largest shared chunk | 2,130.34 kB (gzip 541.98 kB) | 2,130.34 kB (gzip 542.68 kB) |
| `dist/` total | 5,169,942 B | 5,169,996 B (+54 B) |
| Registered endpoints | 145 | **145 (byte-identical set)** |
| localStorage keys | 16 | **16 (identical)** |
| Broken/missing imports | 0 | **0** |

---

## Before Architecture

```
src/
├── api/
│   ├── axios.js, client.js, exam-attempts-store.js
│   ├── mock-server.js                       ← route registry + dispatcher
│   ├── mock-routes.js                       ← auth+platform+student+faculty+admin+parent+AI (+ generateTutorReply exported to UI)
│   ├── mock-routes-extra.js                 ← 8 unrelated domains in one file
│   ├── mock-routes-intelligence.js
│   ├── mock-routes-faculty-intelligence.js
│   ├── mock-routes-admin-intelligence.js
│   ├── mock-routes-exam-agent.js
│   ├── mock-routes-faculty-students.js
│   ├── mock-routes-faculty-interventions.js (1,105 lines: store + helpers + faculty + student routes)
│   └── mock-routes-question-studio.js
├── mock-data/            ← 20 flat files (product datasets, demo data, seeds, dead file)
├── intelligence/ services/ components/ pages/ routes/ config/
```

Problems:
* `mock-*` naming across the whole API/data surface, although these files ARE
  the current frontend API implementation and the product datasets.
* UI imported `generateTutorReply` **from `@/api/mock-routes`** (UI → mock-route).
* `main.jsx` hand-registered 9 mock-route modules.
* One 1,105-line intervention module mixing persistence, lifecycle derivation
  and two different API surfaces (faculty + student).
* `mock-routes-extra.js` was a grab-bag ("kept separate to preserve the registry").

## After Architecture

```
src/
├── api/                          ← frontend API layer (stable endpoint contracts)
│   ├── index.js                  ← barrel: registers every endpoint (single import in main.jsx)
│   ├── client.js                 ← request(): prototype adapter | axios → real backend
│   ├── axios.js
│   ├── core/
│   │   ├── router.js             ← defineRoute / dispatchRequest / hasRouteHandler / setResponseLatency
│   │   └── exam-attempts-store.js← canonical ExamAttempt reader (localStorage + seeds)
│   ├── auth/session.js
│   ├── platform/content.js
│   ├── student/{academics,exam-analysis,mentor,intelligence}.js
│   ├── exam/exam-agent.js
│   ├── faculty/{workspace,reports,ai-studio,papers,pyq-analysis,students,
│   │            question-studio,intelligence}.js
│   ├── admin/{administration,people,intelligence}.js
│   ├── parent/routes.js          ← portal disabled by FEATURE_FLAGS, endpoints preserved
│   ├── interventions/{store,lifecycle,faculty,student}.js
│   └── ai/{assistant,assistant-reply,tutor-reply}.js
├── datasets/                     ← deterministic product datasets
│   ├── platform/{content,users,registration}.js
│   ├── student/{academics,portal,growth,mentor,performance-accuracy}.js
│   ├── exams/{exam-agent,exam-analysis,attempt-seeds}.js
│   ├── faculty/{workspace,teaching,paper-generator,pyq-analysis}.js
│   ├── admin/{core,operations}.js
│   ├── parent/{core,portal}.js
│   └── ai/assistants.js
├── intelligence/ (unchanged)  services/ (canonical UI data access)  components/ pages/ routes/ config/
```

Data flow (unchanged behaviour, clean seam):

```
UI (page/component)
  → hook/service            (src/services/*)
  → request()               (src/api/client.js)
  → core/router             CURRENT: deterministic prototype adapter
  → axios instance          FUTURE : real backend (VITE_USE_MOCK=false)
```

---

## Mock Files Audited

| File | Lines | Verdict |
|---|---|---|
| `src/api/mock-server.js` | 54 | A — API router core → `api/core/router.js` |
| `src/api/mock-routes.js` | 261 | A — split by domain (auth · platform · student · faculty · admin · parent · ai) |
| `src/api/mock-routes-extra.js` | 371 | A — split by domain (student portal/exam-analysis/mentor · faculty workspace/papers/reports/ai-studio/pyq · admin) |
| `src/api/mock-routes-intelligence.js` | 78 | A → `api/student/intelligence.js` |
| `src/api/mock-routes-faculty-intelligence.js` | 13 | A → `api/faculty/intelligence.js` |
| `src/api/mock-routes-admin-intelligence.js` | 19 | A → `api/admin/intelligence.js` |
| `src/api/mock-routes-exam-agent.js` | 111 | A → `api/exam/exam-agent.js` |
| `src/api/mock-routes-faculty-students.js` | 140 | A → `api/faculty/students.js` |
| `src/api/mock-routes-faculty-interventions.js` | 1,105 | A → `api/interventions/{store,lifecycle,faculty,student}.js` |
| `src/api/mock-routes-question-studio.js` | 243 | A → `api/faculty/question-studio.js` |
| `src/api/mock-assistant-reply.js` | 277 | A (prototype reply engine) → `api/ai/assistant-reply.js` |
| `src/api/exam-attempts-store.js` | 27 | A (shared store) → `api/core/exam-attempts-store.js` |
| `src/mock-data/*` (20 files) | — | B/D/E — see classification |
| `src/components/exam-workspace/mock-tests-content.jsx` | — | **NOT prototype scaffolding.** "Mock Test" is product domain terminology (practice/full-length test). Kept, name unchanged. |

### Dependency map (as audited, still true after migration)

```
UI page (e.g. faculty/StudentProfile)
 → component (students-workspace/*)
 → hook/service (services/faculty-students.js → useFacultyStudent360)
 → request() (api/client.js)
 → API adapter (api/faculty/students.js → GET /faculty/students/:id/360)
 → intelligence engine (intelligence/faculty/engine/student-360.js)
 → dataset (intelligence/faculty/datasets/students-directory.js, datasets/exams/*)
 → persistence (api/core/exam-attempts-store.js → localStorage aurora_student_exam_attempts)
```

---

## Classification

### CATEGORY A — Frontend API adapters (current API implementation — moved, never deleted)
`core/router.js`, `core/exam-attempts-store.js`, `auth/session.js`,
`platform/content.js`, `student/{academics,exam-analysis,mentor,intelligence}.js`,
`exam/exam-agent.js`,
`faculty/{workspace,reports,ai-studio,papers,pyq-analysis,students,question-studio,intelligence}.js`,
`admin/{administration,people,intelligence}.js`, `parent/routes.js`,
`interventions/{store,lifecycle,faculty,student}.js`,
`ai/{assistant,assistant-reply,tutor-reply}.js`.

### CATEGORY B — Deterministic product datasets (renamed out of "mock-data")
| Domain | Files |
|---|---|
| Platform | `datasets/platform/content.js` (marketing/landing copy), `platform/users.js` (institution directory + demo credentials), `platform/registration.js` |
| Student | `datasets/student/{academics,portal,growth,mentor}.js` |
| Exams | `datasets/exams/{exam-agent,exam-analysis,attempt-seeds}.js` |
| Faculty | `datasets/faculty/{workspace,teaching,paper-generator,pyq-analysis}.js` |
| Admin | `datasets/admin/{core,operations}.js` |
| Parent | `datasets/parent/{core,portal}.js` |
| AI | `datasets/ai/assistants.js` |

Canonical question / exam / student datasets that already lived in the
intelligence layer (`intelligence/faculty/datasets/competitive-questions.js`,
`question-studio-*.js`, `students-directory.js`, `intelligence/datasets/*`,
`intelligence/admin/datasets/*`) were **left exactly where they are** — they are
already correctly named and are the canonical identity for questions, students
and batches. No dataset was duplicated.

### CATEGORY C — Test fixtures
**None exist.** All 7 test files construct their inputs inline or drive the real
API router; there is no fixture module shipped in the production bundle.
Convention recorded for future work: test-only data belongs in `tests/fixtures/`
(directory intentionally NOT created empty).

### CATEGORY D — Demo / sample data (kept, honestly labelled)
* `datasets/platform/users.js` → `MOCK_USERS` renamed **`DEMO_USERS`** (demo
  sign-in accounts, password `aurora123`); header documents the demo status.
* `datasets/exams/attempt-seeds.js` — sample attempt history, records carry
  `mock: true` (**field name preserved** — it is part of the ExamAttempt
  contract and drives the user-visible "Sample" label in Exam Analysis and
  "· sample" in the faculty exam history).
* `/auth/*` demo OTPs (`482193`, `731205`) — unchanged, still surfaced as
  `demoOtp`.
* Paper share result string `Sent (prototype)`, Question Studio
  "Prototype source imported — no real file processing was performed."
  — unchanged honest labels.

### CATEGORY E — Temporary prototype infrastructure
* `src/mock-data/performance-accuracy.js` → moved to
  `datasets/student/performance-accuracy.js`. **Unreferenced** (0 static, 0
  dynamic, 0 barrel, 0 route, 0 service, 0 test, 0 string references; symbol
  `performanceAccuracy` appears nowhere else). Its endpoint was retired in
  Phase 3 and the page derives from the intelligence snapshot.
  **NOT deleted** (Phase 7 rule: if uncertain, keep) — flagged for Phase 8.
* No other file qualified: every other `mock-*` file is the live API
  implementation or a consumed dataset.

---

## Files Renamed / Moved

### API layer
| Before | After |
|---|---|
| `src/api/mock-server.js` | `src/api/core/router.js` |
| `src/api/exam-attempts-store.js` | `src/api/core/exam-attempts-store.js` |
| `src/api/mock-assistant-reply.js` | `src/api/ai/assistant-reply.js` |
| `src/api/mock-routes-admin-intelligence.js` | `src/api/admin/intelligence.js` |
| `src/api/mock-routes-faculty-intelligence.js` | `src/api/faculty/intelligence.js` |
| `src/api/mock-routes-intelligence.js` | `src/api/student/intelligence.js` |
| `src/api/mock-routes-exam-agent.js` | `src/api/exam/exam-agent.js` |
| `src/api/mock-routes-faculty-students.js` | `src/api/faculty/students.js` |
| `src/api/mock-routes-question-studio.js` | `src/api/faculty/question-studio.js` |
| `src/api/mock-routes-faculty-interventions.js` | `src/api/interventions/faculty.js` (+ `store.js`, `lifecycle.js`, `student.js`) |
| `src/api/mock-routes.js` (split) | `api/auth/session.js`, `api/platform/content.js`, `api/student/academics.js`, `api/faculty/workspace.js`, `api/admin/administration.js`, `api/parent/routes.js`, `api/ai/assistant.js`, `api/ai/tutor-reply.js` |
| `src/api/mock-routes-extra.js` (split) | `api/student/{academics,exam-analysis,mentor}.js`, `api/faculty/{workspace,papers,reports,ai-studio,pyq-analysis}.js`, `api/admin/{administration,people}.js`, `api/parent/routes.js` |

### Datasets
| Before | After |
|---|---|
| `src/mock-data/users.js` | `src/datasets/platform/users.js` |
| `src/mock-data/registration.js` | `src/datasets/platform/registration.js` |
| `src/mock-data/platform.js` | `src/datasets/platform/content.js` |
| `src/mock-data/student-academics.js` | `src/datasets/student/academics.js` |
| `src/mock-data/student-extra.js` | `src/datasets/student/portal.js` |
| `src/mock-data/student-growth.js` | `src/datasets/student/growth.js` |
| `src/mock-data/mentor.js` | `src/datasets/student/mentor.js` |
| `src/mock-data/performance-accuracy.js` | `src/datasets/student/performance-accuracy.js` |
| `src/mock-data/exam-agent.js` | `src/datasets/exams/exam-agent.js` |
| `src/mock-data/exam-analysis.js` | `src/datasets/exams/exam-analysis.js` |
| `src/mock-data/exam-attempt-seeds.js` | `src/datasets/exams/attempt-seeds.js` |
| `src/mock-data/faculty.js` | `src/datasets/faculty/workspace.js` |
| `src/mock-data/faculty-extra.js` | `src/datasets/faculty/teaching.js` |
| `src/mock-data/paper-generator.js` | `src/datasets/faculty/paper-generator.js` |
| `src/mock-data/pyq-analysis.js` | `src/datasets/faculty/pyq-analysis.js` |
| `src/mock-data/admin.js` | `src/datasets/admin/core.js` |
| `src/mock-data/admin-extra.js` | `src/datasets/admin/operations.js` |
| `src/mock-data/parent.js` | `src/datasets/parent/core.js` |
| `src/mock-data/parent-extra.js` | `src/datasets/parent/portal.js` |
| `src/mock-data/ai.js` | `src/datasets/ai/assistants.js` |

`src/mock-data/` no longer exists. Identifier rename: `MOCK_USERS` → `DEMO_USERS`
(2 consumers updated: `api/auth/session.js`, `contexts/auth-context.jsx`).

Router API rename (internal only, no endpoint impact):
`mockRoute` → `defineRoute`, `handleMockRequest` → `dispatchRequest`,
`hasMockHandler` → `hasRouteHandler`, `setMockLatency` → `setResponseLatency`.

## Files Created
`src/api/index.js` (route-registration barrel + API surface re-exports),
`src/api/core/router.js`*, `src/api/auth/session.js`, `src/api/platform/content.js`,
`src/api/student/{academics,exam-analysis,mentor}.js`,
`src/api/faculty/{workspace,reports,ai-studio,papers,pyq-analysis}.js`,
`src/api/admin/{administration,people}.js`, `src/api/parent/routes.js`,
`src/api/ai/{assistant,tutor-reply}.js`,
`src/api/interventions/{store,lifecycle,student}.js`,
this report. (*tracked as a rename of `mock-server.js`.)

## Files Modified
* `src/main.jsx` — 9 `import '@/api/mock-routes-*'` lines → single `import '@/api'`.
* `src/api/client.js`, `src/api/axios.js` — new router import + honest comments.
* `src/services/index.js` — re-exports `generateTutorReply` from
  `@/api/ai/tutor-reply` so chat UIs consume the **service** layer.
* `src/components/layout/ai-copilot.jsx`, `src/pages/student/AICopilot.jsx`,
  `src/pages/student/AITutor.jsx` — import from `@/services` instead of
  `@/api/mock-routes` (**last UI → mock-route dependency removed**).
* `src/contexts/auth-context.jsx` — `DEMO_USERS` import (auth logic untouched).
* 13 landing components/pages + `exam-agent-home.jsx` — dataset import paths.
* `src/intelligence/**` (11 files) — dataset import paths + comment wording only.
* `src/services/*` (10 files) — comment wording ("mock API" → "API layer").
* 5 test files — import the API barrel + renamed router functions.
* 9 component files — user-facing "(mock)" strings → "(prototype)"/"(sample data)".

## Files Deleted
| File | Reason | Evidence | Replacement |
|---|---|---|---|
| `src/api/mock-routes.js` | Content relocated | every route + `generateTutorReply` re-homed; 0 remaining references (`grep -rn "mock-routes"` → 0) | `api/auth/session.js`, `api/platform/content.js`, `api/student/academics.js`, `api/faculty/workspace.js`, `api/admin/administration.js`, `api/parent/routes.js`, `api/ai/{assistant,tutor-reply}.js` |
| `src/api/mock-routes-extra.js` | Content relocated | all 46 routes re-registered; endpoint diff empty | `api/student/*`, `api/faculty/*`, `api/admin/*`, `api/parent/routes.js` |
| `src/api/mock-routes-faculty-interventions.js` | Content relocated | 19 routes + helpers re-homed; intervention tests pass | `api/interventions/{store,lifecycle,faculty,student}.js` |

No dataset, component, page, service, engine or test file was deleted in Phase 7.

---

## Endpoint Contracts Preserved

Registered `(method, path)` pairs were extracted from the **base commit** and
from the migrated tree and compared:

```
before: 145 endpoints   after: 145 endpoints   diff: (empty)
```

Paths, HTTP methods, request payloads, response shapes, IDs, filtering,
error messages and status codes (400/404/409 throw-shapes) are byte-identical —
only the module that registers them changed. External URLs/routes
(`react-router` paths) were not touched.

## Service Layer

Services remain the single canonical consumer interface. Audit of direct
UI → API/dataset imports:

* **UI → `src/api/**` : 0** (was 3 files importing `@/api/mock-routes`).
* **UI → `src/datasets/**` : 13 files**, all intentional and frontend-owned:
  * `components/landing/*` + `pages/landing/{About,Contact}.jsx` →
    `datasets/platform/content.js` — static marketing copy (Category H,
    permanently frontend-owned; the `/platform/*` endpoints remain available and
    unchanged for the pages that fetch).
  * `components/exam-workspace/exam-agent/exam-agent-home.jsx` →
    `EXAM_AGENT_GROUP_LABELS` from `datasets/exams/exam-agent.js` — a label
    constant map, not exam data (exam data itself comes from
    `GET /student/exam-agent/exams` via the service).
  * `contexts/auth-context.jsx` → `DEMO_USERS` — pre-existing prototype auth
    behaviour, deliberately unchanged in this phase.
* No service was duplicated; no new service was created except the
  `generateTutorReply` re-export (moves a UI dependency off the API layer).

## LocalStorage

All 16 keys unchanged (verified by identical grep inventory before/after).

| Key | Class | Owner today | Future |
|---|---|---|---|
| `aurora_faculty_interventions` | A | `api/interventions/store.js` | backend persistence |
| `aurora_intervention_practice_attempts` | A | `api/interventions/store.js` | backend persistence |
| `aurora_intervention_retests` | A | `api/interventions/store.js` | backend persistence |
| `aurora_student_exam_attempts` | A | `api/core/exam-attempts-store.js`, `api/exam/exam-agent.js` | backend persistence |
| `aurora_question_studio_sessions` | A | `api/faculty/question-studio.js` | backend persistence |
| `aurora_faculty_paper_shares` | A | `api/faculty/papers.js` | backend persistence |
| `aurora_registered_students` | A | `api/auth/session.js` | backend identity service |
| `aurora_admin_ai_history`, `aurora_admin_ai_insights`, `aurora_admin_report_library`, `aurora_faculty_assistant_history` | A/B | admin/faculty AI + report surfaces | backend (history/library) |
| `aurora_access_token`, `aurora_refresh_token`, `aurora_user` | D | auth context / axios | backend-issued sessions |
| `aurora_theme`, `aurora_reduced_motion` | B | theme context | stays frontend-owned |

No key was renamed, added or removed → **no migration shim needed**.

## Question Data

One canonical identity per question is preserved. Question banks were **not**
moved and **not** duplicated:
`intelligence/faculty/datasets/competitive-questions.js` (JEE/NEET PYQs +
`universityPyqQuestions`), `question-studio-questions.js`,
`question-studio-sources.js`, `datasets/faculty/workspace.js` (`questionBank`),
`datasets/admin/operations.js` (`adminQuestionBank`),
`datasets/faculty/pyq-analysis.js`.
Fields untouched: `questionId`/`id`, `bankId`, `pyq`/`isPyq`, `exam`, `year`,
`session`, `subject`, `chapter`, `topic`, `difficulty`, `questionType`,
`answer`, `explanation`, `source`. Question Intelligence, PYQ Intelligence,
Paper Generator, Paper Library, Question Studio and the Exam Agent still read
the same modules (only the intervention question-pool dynamic `import()` string
stayed identical — it already pointed at the intelligence datasets).

## ExamAttempt Data

The canonical ExamAttempt architecture is unchanged. No `mockExamAttempt`,
`fakeAttempt` or new attempt model was introduced. `normalizeExamAttempt`,
`filterExamAttempts`, `classifyAttemptContext`, `buildExamEvidence` and
`matchInterventionExamAttempts` are the same functions from
`@/intelligence`. Preserved fields: `attemptId`/`id`, `studentId`, `examMode`,
`examFamily`, `subject`, `chapter`, question evidence (`questionAttempts` with
`academicContext`), timings, answers, `interventionId`, `mode`
(`manual` | `demo` | `intervention-practice` | `intervention-retest`) and
`mock` (sample-seed flag). The seed merge policy is unchanged: intelligence /
Exam Analysis merge seeds, the Exam Agent's own endpoints read localStorage
only.

## Intervention Data

One store, one lifecycle. `api/interventions/store.js` is now the single seam
that a backend will replace; `lifecycle.js` holds the shared derivation helpers
consumed by both surfaces; `faculty.js` and `student.js` register the same
endpoints as before. Preserved: `interventionId`, `studentId`, `groupId`,
`source` (`Similar Issues` / Student 360), `domain`, `examFamily`, `subject`,
`chapter`, `issueType`, `evidence`, `practiceConfig`, practice attempts,
re-tests, effectiveness (incl. `postExam` outcome matching and group
effectiveness). Storage keys unchanged; the Student-360-created interventions
still flow through the same status machine.

## University / JEE / NEET Verification

* `tests/intelligence/student-360-domain-isolation.test.js` — 14 tests ✅
* `tests/intelligence/student-360-consolidation.test.js` — 19 tests ✅
* `tests/intelligence/student-360-evidence-action.test.js` — 33 tests ✅
  (includes "University and NEET creations stay isolated — cross-family
  creation is refused without evidence")
* `tests/intelligence/phase-6-multi-student-outcomes.test.js` — 26 tests ✅
* `tests/intelligence/student-360-routes.test.js` — 7 tests ✅

JEE Physics ≠ NEET Physics still holds (evidence/grouping/intervention matching
key on `examFamily` + `subject` + `chapter`; no engine code changed). Attempt
matching, evidence derivation and intervention matching were not modified —
only the modules that import them moved.

## Import Graph

Static reachability/cycle analysis over all 446 `src/**/*.{js,jsx}` modules
(static + dynamic + barrel + side-effect imports resolved through the `@` alias):

* **Missing/broken imports: 0**
* **Unreachable modules from `src/main.jsx`: 1** —
  `src/datasets/student/performance-accuracy.js` (pre-existing dead dataset,
  Category E, kept for Phase 8).
* **Circular dependencies: 0** (the only hit was a false positive from a doc
  comment string in `intelligence/faculty/engine/index.js`).
* **UI → `mock-*` modules: 0** (no such module remains).
* **UI → API modules: 0.**
* **Duplicate dataset/service imports: none introduced** — every moved dataset
  has exactly one canonical path; `grep -rn "mock-data\|mock-routes\|mock-server"`
  over `src/`, `tests/`, `index.html`, `vite.config.js`, `package.json` → **0 hits**.

## Bundle Comparison

| Chunk | Before | After |
|---|---|---|
| `index-*.js` (shared) | 2,130.34 kB / gzip 541.98 kB | 2,130.34 kB / gzip 542.68 kB |
| `charts` | 433.57 kB | 433.57 kB |
| `vendor` | 164.78 kB | 164.78 kB |
| `motion` | 116.36 kB | 116.36 kB |
| `dist/` total | 5,169,942 B | 5,169,996 B |

Delta: **+54 bytes total, +0.70 kB gzip on the shared chunk**, caused solely by
longer module paths/doc comments. No new code splitting, no chunk-strategy
change (`vite.config.js` untouched). The 2.13 MB shared chunk is dominated, as
before, by the intelligence engines + deterministic datasets that every portal
touches — deliberately **not** optimized in this phase.

## Tests

`npm test` (vitest run):

| | Before | After |
|---|---|---|
| Test files | 7 | 7 |
| Tests | 155 passed | **155 passed** |
| Failures | 0 | 0 |

No test was removed, skipped or weakened. The 5 test files that boot the API
now import the barrel (`src/api/index.js`) plus `src/api/core/router.js` and use
`dispatchRequest` / `setResponseLatency` / `hasRouteHandler`. Coverage still
includes domain isolation, Student 360, evidence → action, interventions
(lifecycle + multi-student outcomes), Exam Agent, question intelligence and the
service/API contract surface (`tests/services/service-surface.test.js`, 50
tests, asserts registered vs retired endpoints).

## Build

`npm run build` ✅ — no broken imports, no missing modules, no duplicate
exports, no route registration failures. Only the pre-existing
"chunk larger than 1200 kB" advisory remains.

## Browser Verification

**Browser automation is NOT available in this environment — no visual or
responsive (375/768/1440px) verification is claimed.**

What was actually verified instead:
* Production build (`npm run build`) ✅
* Vite dev server boots and serves the app; HTTP smoke of SPA routes
  `/`, `/student`, `/faculty/my-students`, `/admin` → **200** each.
* Module transform smoke through the dev server for the migrated modules
  (`/src/main.jsx`, `/src/api/index.js`, `/src/api/interventions/faculty.js`,
  `/src/api/student/exam-analysis.js`, `/src/datasets/platform/users.js`) → 200,
  no transform errors.
* SSR render smoke of Student 360 (`tests/intelligence/student-360-ui-render.test.jsx`,
  6 tests) ✅
* API/adapter + service contract tests (57 tests across route/service suites) ✅

## Remaining Mock / Prototype Infrastructure

Kept deliberately (this is a frontend prototype until the backend exists):

1. `src/api/core/router.js` — the deterministic prototype adapter behind
   `request()`. Replaced wholesale by `VITE_USE_MOCK=false` + axios.
2. `src/api/**` route modules — the current API implementation.
3. `src/datasets/**` + `src/intelligence/**/datasets/**` — deterministic
   product data; several will become backend-owned (see below).
4. localStorage prototype persistence (7 write keys, table above).
5. `APP_CONFIG.USE_MOCK_API` / `VITE_USE_MOCK` flag — the documented switch;
   renaming it is a config/behaviour change and was out of scope.
6. Deterministic reply engines (`api/ai/{tutor-reply,assistant-reply}.js`) —
   honest "prototype intelligence", no live model claimed.

Backend-owned in future (dev adapter only today): exam attempts, interventions
+ practice/re-tests, question studio sessions, generated papers & shares,
registered students, report/AI history, admin & faculty directories.
Permanently frontend-owned: landing/marketing content, navigation config,
theme/motion preferences, UI label maps.

## Intentionally Kept Prototype Components

* `components/exam-workspace/mock-tests-content.jsx`, `pages/student/MockTests.jsx`,
  `GET /student/mock-tests`, `mockTests` dataset — **domain terminology**
  ("mock test" = practice exam), not prototype scaffolding.
* `mock: true` field on seed attempts and the `Sample`/`· sample` labels it
  drives — part of the ExamAttempt contract and an honest label.
* Demo OTPs, `DEMO_USERS`, `Sent (prototype)`, "Prototype source imported…",
  "Prototype Intelligence"-style labels — honest prototype/demo labelling kept
  (only the word "Mock"/"(mock)" in user-visible strings became
  "(prototype)"/"(sample data)": AI Studio profile export & publications, AI
  workspace mind map, teaching-workspace/faculty-dashboard toasts).
* Parent portal endpoints + datasets (feature-flagged off) — preserved.
* `datasets/student/performance-accuracy.js` — unreferenced, kept for Phase 8.

## Phase 8 Recommendation

1. **Dead-dataset removal:** delete `datasets/student/performance-accuracy.js`
   after re-confirming 0 references (evidence already recorded here).
2. **Test consolidation:** merge the 5 route-booting suites onto a shared
   `tests/setup/api.js` helper; introduce `tests/fixtures/` for any data that
   is genuinely test-only.
3. **Backend seam hardening:** give each `api/<domain>/*.js` module a typed
   endpoint contract doc (or JSDoc `@endpoint`) and an OpenAPI-style listing
   generated from `defineRoute` registrations — the natural hand-off artifact.
4. **Persistence seam:** funnel the remaining ad-hoc localStorage writers
   (admin AI history/insights, report library, faculty assistant history) into
   small `store.js` modules like `api/interventions/store.js`, so Phase 9 can
   swap them for backend calls in one place.
5. **Bundle:** only after the backend seam lands, evaluate route-level code
   splitting for the 2.13 MB shared chunk (intelligence engines + datasets).
6. **Config naming:** consider `APP_CONFIG.USE_PROTOTYPE_API` with a
   backwards-compatible `VITE_USE_MOCK` alias (behaviour change → its own PR).
