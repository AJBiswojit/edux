# EduX — Mock / Prototype Data Removal Inventory

**Phase:** 10 · **Branch:** `arena/01a04ce2-edux`
**Status:** Complete — runtime is a strict backend-consuming frontend.

This inventory records every mock / seeded / prototype data item that was
**removed**, **neutralised**, or **retained**, with the exact reason. The guiding
rule for Phase 10 is:

> REMOVE THE FAKE DATA, NOT THE UI.
> The frontend must wait for the real backend instead of pretending that mock
> data is real.

---

## 1. The single decisive change

The application is now a **strict backend consumer** at runtime.

```
React UI  →  Hooks  →  Services  →  Central API Client (axios)  →  HTTP Backend
                                          ▲
                                          │ default (no seed fallback)
                          VITE_USE_MOCK === 'true'  (opt-in, dev only)
                                          ▼
                        in-browser prototype router (TEST-ONLY seam)
```

`src/config/index.js`:

```js
USE_MOCK_API: import.meta.env.VITE_USE_MOCK === 'true',   // default: false
```

The in-browser prototype adapter (`src/api/core/router.js`) and the deterministic
datasets are **disabled by default**. They remain in the tree only as a
**test/dev seam** — they are reachable at runtime **only** when a developer
explicitly sets `VITE_USE_MOCK=true`, and in the test suite, which drives the
router directly through `dispatchRequest` (the contract test bed). The
**production/runtime application never serves mock, seeded or prototype data.**

---

## 2. Classification legend

| Category | Definition | Phase 10 action |
|---|---|---|
| **A — Backend-owned production data** | questions, papers, exams, attempts, students, faculty, batches, interventions, practice attempts, re-tests, published exams, results | Must NOT have runtime mock fallback |
| **B — Client-owned UI state** | selected tab, dropdown, modal, sidebar, form, search, sort, UI prefs | Keep |
| **C — Intelligence contracts / engines** | canonical attempt contract, Student 360 engine, Academic DNA, Similar Issues, intervention lifecycle, question taxonomy | Keep (architecture) |
| **D — Test fixtures** | `tests/fixtures/`, in-memory router fixtures | Keep, isolated from production |
| **E — Demo / presentation-only content** | landing page marketing examples, static showcase | Keep (not runtime backend data) |
| **F — Dead data** | unreachable prototype files | Delete only after zero-reachability proof |

---

## 3. Removed runtime mock data

### 3.1 Demo authentication removed

| Item | Previous location | Action | Reason |
|---|---|---|---|
| `DEMO_USERS` (demo sign-in credentials, password `Edux12345`) | `src/datasets/platform/users.js` | **Deleted** | Credential-based demo auth — replaced by backend-bound login |
| Client-side credential validation against `DEMO_USERS` | `src/contexts/auth-context.jsx` | **Removed** | No fake login |
| Mock tokens (`mock_access_*` / `mock_refresh_*`) | `src/contexts/auth-context.jsx` | **Removed** | No hardcoded demo tokens |
| Registered-students registry sign-in fallback | `src/contexts/auth-context.jsx` | **Removed** | No fake sign-in path |
| "Try the demo" box, demo email + demo password hint | `src/pages/auth/Login.jsx` | **Removed** | No fake credentials in the login UI |
| Duplicate-email check against `DEMO_USERS` in registration | `src/api/auth/session.js` | **Removed** | Backend owns duplicate validation |

The login page still exists and is unchanged structurally. `AuthContext.login`
now calls `POST /auth/login` (`src/services/auth.js` → `src/api/axios.js`). When
the backend is unavailable the login rejects and the page shows a network/error
state — the frontend **never fabricates a successful login**.

### 3.2 Examination data (completed in Phase 9, verified in Phase 10)

The mock question/paper/exam sources in the examination flow were removed in
Phase 9 and verified unchanged in Phase 10:

| Endpoint | Runtime consumer | Action |
|---|---|---|
| `GET /faculty/question-bank` (paper generator pool) | Paper Generator | Backend-only via `src/services/faculty-questions.js` → axios |
| `GET /faculty/paper-generator` + POST/DELETE/duplicate/regenerate/share | Paper Generator / Library | Backend-only via `src/services/faculty-papers.js` → axios |
| `GET /student/exams` | Student Examinations | Backend-only via `src/services/student-examinations.js` → axios |
| `GET /student/mock-tests` | Mock Tests | Backend-only via `src/services/student-examinations.js` → axios |

Data-model verification:

- `src/datasets/faculty/paper-generator.js` → `generatedPapers: []`
- `src/datasets/student/academics.js` → `mockTests: []`, `exams: []`

### 3.3 Runtime mock router disabled

The entire in-browser mock router (`src/api/**` handlers + `src/datasets/**` +
`src/intelligence/**/datasets/**`) is **disabled at runtime** by default. The
backend-owned domains it previously served (students, faculty, batches,
attempts, interventions, questions, papers, exams, reports, dashboards) are now
consumed through the central axios API client.

---

## 4. Retained mock / sample / prototype data

Every retained item must have an explicit, documented reason.

### 4.1 Intelligence engines & contracts (Category C)

| Retained | Location | Reason |
|---|---|---|
| Canonical `ExamAttempt` / `QuestionAttempt` contract | `src/intelligence/engine/exam-agent.js` | **Architecture, not mock data.** The backend preserves this contract. |
| Student 360 computation | `src/intelligence/faculty/engine/student-360.js` | **Intelligence engine** — kept. |
| Academic DNA engine | `src/intelligence/engine/dna.js`, `exam-attempt-intelligence.js` | **Intelligence engine** — kept. |
| Similar Issues engine | `src/intelligence/faculty/engine/similar-issues.js` | **Intelligence engine** — kept. |
| Intervention lifecycle rules | `src/intelligence/faculty/engine/intervention-lifecycle.js` | **Lifecycle rules** — kept. |
| Question taxonomy (domain, examFamily, subject, chapter, topic, concept, difficulty, questionType) | `src/intelligence/**` | **Contracts** — kept. |
| University / JEE / NEET domain isolation | `src/intelligence/engine/exam-agent.js` | **Contract** — kept; never inferred from subject name. |

These engines derive results from canonical entity data. Until the backend
supplies that data, the pages that depend on them render an empty / unavailable
state (the UI is preserved) rather than inventing records.

### 4.2 Deterministic seed datasets consumed only by the prototype router / engines (Category D / dev seam)

| Retained | Location | Reason |
|---|---|---|
| `STUDENT_ROSTER`, `FACULTY_LIST`, `ADMIN_USERS`, `DEPARTMENTS` | `src/datasets/platform/users.js` | Backend-owned entities. Reachable at runtime **only** through the now-disabled prototype router / intelligence engines. Retained as data for the contract test bed. |
| `students-directory.js` (7 batches, 126 students) | `src/intelligence/faculty/datasets/` | Same reason. |
| `competitive-questions.js`, `workspace.js` question bank | `src/intelligence/faculty/datasets/`, `src/datasets/faculty/` | Same reason. |
| `attempt-seeds.js` (`mock: true` sample attempts) | `src/datasets/exams/` | Demo/sample attempts, clearly flagged `mock: true` and labelled "Sample". Retained purely as test fixtures. |
| `exam-analysis.js`, `exam-agent.js` datasets | `src/datasets/exams/` | Same reason — prototype router test bed. |

These datasets are **not imported by production UI**. They are loaded by the
in-browser router handlers, which the runtime no longer invokes.

### 4.3 Static presentation content (Category E)

| Retained | Location | Reason |
|---|---|---|
| Landing / marketing content (`FAQ`, `BLOG_POSTS`, `FEATURES`, `CONTACT_INFO`, `HERO_METRICS`, `JOURNEYS`, `TRUSTED_BY`, `AI_CAPABILITIES`, `MEGA_MENU_*`, `NAV_LINKS`, `PRICING_PLANS`, `TESTIMONIALS`, `CASE_STUDIES`, `PLATFORM_STATS`) | `src/datasets/platform/content.js` | **Static product showcase** — not runtime backend entities. Kept per Category E / section 47. |
| `EXAM_AGENT_GROUP_LABELS` | `src/datasets/exams/exam-agent.js` | **Label/contract constant** for the Exam Agent UI. Kept. |

### 4.4 Client-owned UI state & prototype features (Category B)

| Retained | Location | Reason |
|---|---|---|
| AI Tutor / Copilot / Teaching Assistant deterministic reply fallback | `src/api/ai/tutor-reply.js`, `src/services/index.js` | Chat UX, not backend data. Kept (documented as "Prototype Intelligence"). |
| AI Micro-Assessment (source library, processing, question generation, mock datasets) | `src/components/micro-assessment-studio/`, `src/api/faculty/micro-assessments.js`, `src/datasets/faculty/micro-assessments.js`, `src/api/ai/assistant.js` | **Explicitly out of scope** — Phase 10 must NOT migrate Micro-Assessment (section 38). |
| AI Question Studio (source library, generation) | `src/api/faculty/question-studio.js`, `src/components/question-studio/` | Explicitly out of scope in Phase 9 + section 38 (shared infrastructure preserved). |
| Chat history / AI workspace conversation state (`editor` keys) | admin-ai, ai-studio, ai-workspace components | Client-owned UI/workspace state (Category B). |

---

## 5. LocalStorage audit (Category B keep / Category A removed-as-authoritative)

| Key | Purpose | Backend-owned? | Action |
|---|---|---|---|
| `EduX_access_token` / `EduX_refresh_token` | Auth session tokens (axios interceptor) | No (session) | **KEEP** — session persistence |
| `EduX_user` | Session user | No (session) | **KEEP** — session persistence |
| `EduX_theme` | Theme preference | No (UI pref) | **KEEP** |
| `EduX_reduced_motion` | Reduced-motion preference | No (UI pref) | **KEEP** |
| `EduX_student_exam_attempts` | Canonical exam attempts | **Yes** | Runtime no longer uses as authoritative. Only the prototype router writes/reads it. Backend owns attempts. |
| `EduX_faculty_interventions` | Intervention records | **Yes** | Same — backend owns interventions. |
| `EduX_intervention_practice_attempts` | Practice attempts | **Yes** | Same — backend owns practice attempts. |
| `EduX_intervention_retests` | Re-test entities | **Yes** | Same — backend owns re-tests. |
| `EduX_faculty_paper_shares` | Paper share records | **Yes** | **REMOVED (Phase 9)** — backend-owned; sharing via `POST /faculty/paper-generator/papers/:id/share`. |
| `EduX_registered_students` | Registration registry | **Yes (auth)** | Prototype registration registry retained until a backend registration endpoint exists; not a data source for production entities. Documented gap. |
| `EduX_question_studio_sessions` | AI Question Studio sessions | No (prototype feature) | **KEEP** — section 38 (Question Studio untouched). |
| `EduX_micro_assessment_attempts` / `EduX_micro_assessments` | Micro-Assessment attempts | No (prototype feature) | **KEEP** — section 38 (Micro-Assessment untouched). |
| `EduX_admin_ai_history` / `EduX_admin_ai_insights` | Admin AI workspace state | No (UI state) | **KEEP** |
| `EduX_faculty_assistant_history` | AI assistant conversation | No (UI state) | **KEEP** |
| `EduX_admin_report_library` | Generated admin reports (export artifact) | Yes (reports) | **KEEP as frontend prototype export artifact** — no backend report-generation exists; recorded as a gap, not a source of live records. |

**Rule applied:** localStorage was removed as the authoritative source of truth
for **backend-owned entities** (attempts, interventions, practice attempts,
re-tests, papers/shares, registered students). Critically, the runtime
**already routes these through the backend**: no production component imports
`src/api/interventions/store.js` or `src/api/core/exam-attempts-store.js`
directly (verified via import graph), and the services consume them via
`request()` → axios. The localStorage keys above are read/written **only by the
prototype router handlers**, which are disabled at runtime.

---

## 6. Mock API handlers removed (Phase 9 + Phase 10)

| Handler | Status |
|---|---|
| `GET /faculty/paper-generator` | Removed (Phase 9) |
| `POST /faculty/paper-generator/papers` (+ duplicate/regenerate/archive/share/delete) | Removed (Phase 9) |
| `GET /student/exams` | Removed (Phase 9) |
| `GET /student/mock-tests` | Removed (Phase 9) |
| `POST /auth/profile-setup` | Removed (Phase 3) |
| `GET /faculty/paper-generator/shares` | Removed (Phase 9) |

The remaining `defineRoute` handlers in `src/api/**` are the **in-browser
prototype router contract test bed** — they are served only when
`VITE_USE_MOCK === 'true'` (opt-in dev) or when the test suite drives
`dispatchRequest` directly. The runtime never serves them.

---

## 7. No backend-owned data appears at runtime

With `USE_MOCK_API === false`, every backend-owned query goes to
`VITE_API_BASE_URL`. If the backend is unavailable, the page shows the existing
loading / empty / error state:

| Surface | Backend unavailable behaviour |
|---|---|
| Faculty My Students | `DashboardSkeleton` → `ErrorState` |
| Faculty Student Profile / Student 360 | `DashboardSkeleton` → `ErrorState` |
| Faculty Paper Generator | "Question bank unavailable" / "Paper Library unavailable" + "Connect the EduX backend" |
| Student Examinations | "No examinations available" + "Connect the EduX backend" |
| Student Mock Tests | "No mock tests available" + "Connect the EduX backend" |
| Dashboards (student/faculty/admin) | `DashboardSkeleton` → `ErrorState` |
| Auth login | Network/auth error (no fake login) |

No invented KPI numbers, no seeded student counts, no fabricated papers/exams.

---

## 8. Explicitly NOT touched

- ✅ Python / FastAPI backend — **not created**.
- ✅ PostgreSQL / SQLAlchemy / Alembic / Redis / Celery / Docker backend — **not created**.
- ✅ Micro-Assessment migration — **not performed** (section 38).
- ✅ Existing UI, routes, navigation, tabs, cards, dropdowns, tables, modals — **preserved**.
- ✅ Existing visual design — **unchanged**.
- ✅ Existing intelligence engines / contracts / domain isolation — **preserved**.
- ✅ API contract redesign — **not done** (existing backend-integration docs are source of truth; gaps documented).
