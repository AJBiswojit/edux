# EduX — Final Mock Data / Prototype Infrastructure Removal Inventory

**Phase:** 11 (revised) · **Branch:** `arena/01a04ce2-edux` · **Date:** 2026-08-29

This is the complete inventory of every mock / seeded / prototype data item and
prototype backend infrastructure item. The earlier "move to
`tests/fixtures/mock-api/`" approach was **rejected**; the prototype backend is
**physically deleted**, not relocated, and no test requires a complete fake
backend. Every entry is classified (A–K) with its action and reason.

> REMOVE THE MOCK DATA. KEEP THE UI. KEEP THE INTELLIGENCE. KEEP THE CONTRACTS.
> KEEP THE LANDING PAGE. KEEP THE TEST FIXTURES. REMOVE EVERYTHING ELSE THAT
> EXISTS ONLY TO PRETEND THE BACKEND ALREADY EXISTS.

---

## Classification legend

| Code | Category | Phase action |
|---|---|---|
| A | Runtime mock / seeded data | Remove |
| B | Prototype backend infrastructure | Remove (physically delete) |
| C | Demo authentication / OTP | Remove |
| D | Backend-owned localStorage persistence | Remove / no production read |
| E | Obsolete mock fallback | Remove |
| F | Landing-page static content | Keep |
| G | Intelligence engine / contract | Keep |
| H | Test fixture | Keep (isolated, no fake backend) |
| I | Legitimate UI configuration | Keep |
| J | Legitimate academic terminology | Keep |
| K | Unrelated static app configuration | Keep |

---

## 1. Overall decision

The **entire in-browser prototype router and every deterministic route handler
were deleted from the repository** — they are not relocated to `tests/fixtures`.
`tests/fixtures/mock-api/` **does not exist**. Production `src/api` exposes only
the **central real API client** (axios + `request()`).

```
EduX React UI
   ↓  Hooks
   ↓  Services
   ↓  Central API Client (src/api/axios.js + request() on VITE_API_BASE_URL)
   ↓  HTTP
   ↓  Backend (implemented in a later phase)
```

There is NO `UI → dataset`, `UI → prototype router`, `UI → localStorage
database`, `UI → seeded entity`, or `UI → fake fallback` pathway at runtime.
The `VITE_USE_MOCK` flag and every runtime mock-mode branch were removed.
Tests call the real intelligence engines directly with isolated fixtures; they
do not require a complete fake backend.

---

## 2. Prototype backend infrastructure removed (B — physically deleted)

The following production `src/api/**` modules were **deleted** (not moved):

| Module | Status |
|---|---|
| `core/router.js` | deleted |
| `core/exam-attempts-store.js` | deleted |
| `auth/session.js` | deleted |
| `platform/content.js` | deleted |
| `student/{academics,exam-analysis,mentor,intelligence}.js` | deleted |
| `exam/exam-agent.js` | deleted |
| `faculty/{workspace,reports,ai-studio,papers,pyq-analysis,students,question-studio,micro-assessments,intelligence}.js` | deleted |
| `admin/{administration,people,intelligence}.js` | deleted |
| `parent/routes.js` | deleted |
| `interventions/{faculty,student,store,lifecycle}.js` | deleted |
| `ai/{assistant,assistant-reply}.js` | deleted |
| `index.js` | deleted → replaced by clean central client export |

`src/api` now contains **only**:

| File | Purpose | Classification |
|---|---|---|
| `src/api/axios.js` | Central axios client (bearer token + refresh interceptor) | **Keep** (K) |
| `src/api/client.js` | `request()` over the central client | **Keep** (K) |
| `src/api/index.js` | Re-exports `api` + `request`; registers no routes | **Keep** (K) |
| `src/api/ai/tutor-reply.js` | Deterministic AI-tutor reply engine (pure) | **Keep** (G) |

`src/api/index.js` is a **new** file that exposes only `request` (default+named)
and `api`. Verified by `service-surface.test.js` (no `router`, no
`dispatchRequest`, no handler/route/mock modules in `src/api`).

---

## 3. Demo authentication removed (C)

| Item | Location | Action |
|---|---|---|
| `DEMO_USERS` (demo credentials) | `src/datasets/platform/users.js` | Removed |
| Client-side credential validation vs `DEMO_USERS` | `src/contexts/auth-context.jsx` | Removed |
| Mock tokens (`mock_access_*` / `mock_refresh_*`) | `src/contexts/auth-context.jsx` | Removed |
| "Try the demo" box + demo email/password | `src/pages/auth/Login.jsx` | Removed |
| `USE_MOCK_API` / `VITE_USE_MOCK` flag | `src/config/index.js`, `src/api/client.js` | Removed |

`AuthContext.login` now calls the real backend (`POST /auth/login` via
`src/services/auth.js` → axios). No fake success, no hardcoded tokens.

---

## 4. Prototype OTP behavior removed (C)

Hardcoded demo OTP acceptance (`482193`, `731205`) and demo-code UI copy were
removed. The verification **UI** (digit inputs, verify button, resend) is
preserved and wired to the backend.

| Item | Location | Action |
|---|---|---|
| `demoOtp` fallback + "Prototype mode — enter demo code" box | `src/pages/auth/OTPVerify.jsx` | Removed |
| Demo code in resend toast | `OTPVerify.jsx`, `VerifyEmail.jsx` | Removed |
| "Demo code" boxes | `VerifyEmail.jsx`, `ForgotPassword.jsx` | Removed |
| `demoOtp` passed to verify-otp nav state | `Register.jsx` | Removed |

---

## 5. Backend-owned localStorage persistence removed (D)

With the prototype router deleted, backend-owned stores are no longer
read/written by production:

| Key | Backend-owned? | Action |
|---|---|---|
| `EduX_access_token` / `EduX_refresh_token` | No (session) | **Keep** (K) |
| `EduX_user` | No (session) | **Keep** (K) |
| `EduX_theme` / `EduX_reduced_motion` | No (UI) | **Keep** (K) |
| `EduX_student_exam_attempts` | Yes | No production read (store deleted) |
| `EduX_faculty_interventions` | Yes | No production read (store deleted) |
| `EduX_intervention_practice_attempts` / `_retests` | Yes | No production read (store deleted) |
| `EduX_faculty_paper_shares` | Yes | Removed as authoritative (Phase 9) |
| `EduX_registered_students` | Yes (auth) | Retained prototype gap — documented |
| `EduX_admin_report_library` | Yes (report export) | Frontend-only export; documented gap |

`tests/setup/api.js` provides only `installTestStorage()` (a deterministic
storage object for tests) and `makeRequestMock(routes)` (a per-test axios
boundary stub) — **not** a persistence store and **not** the mock backend.

---

## 6. Runtime mock data removed (A / E)

The runtime database seeds (questions, papers, exams, students, faculty,
batches, attempts, interventions, results, dashboard records, analytics) are
removed. The backend-owned domains now flow through the service layer:

- Faculty Paper Generator / Library → `src/services/faculty-papers.js` /
  `faculty-questions.js` → axios → backend.
- Student Examinations / Mock Tests → `src/services/student-examinations.js`.
- My Students / Student 360 / Attempt Analysis → `src/services/faculty-students.js`.
- Dashboards / intelligence snapshots → `src/services/intelligence.js` /
  `faculty-intelligence.js` / `admin-intelligence.js`.

No seeded entity record is produced at runtime. When the backend is down, the
UI shows loading / empty / error states (no fake numbers).

---

## 7. Exam attempt persistence removed (D)

`EduX_student_exam_attempts` and the prototype store (`core/exam-attempts-store.js`)
are deleted. Production exam attempts are backend-governed. The
**ExamAttempt / QuestionAttempt contracts**, `normalizeExamAttempt`,
`classifyAttemptContext`, and all intelligence consumers (Student 360, Academic
DNA, Similar Issues) are **preserved** (G).

---

## 8. Student / Faculty / Batch seeded data — REMOVED (A)

Previously this section described these seeds as "retained because engines are
protected." That is superseded by the revised phase: the **backend-owned seeded
entity data** is removed and the engines are fed by the service/HTTP layer.

| Dataset | Action |
|---|---|
| `src/datasets/platform/users.js` (`STUDENT_ROSTER`, `FACULTY_LIST`, `ADMIN_USERS`, `DEPARTMENTS`) | Emptied (neutral shell) |
| `src/intelligence/faculty/datasets/students-directory.js` | Deleted (roster + PRNG generator); tests use `tests/fixtures/directory.js` |
| `src/datasets/faculty/{teaching,workspace}.js` | Emptied (neutral shells) |
| `src/datasets/student/academics.js` | Emptied (neutral shell; `mockTests`/`exams` empty) |
| `src/datasets/admin/{core,operations}.js` | Emptied (neutral shells) |

Engines that need seeds receive them via **injectable parameters** (e.g.
`filterMicroSources(filters, sources)`, `computeMyStudentsDirectory({ batches,
students })`) or operate on empty/neutral data. Engines are **not** rewritten.

---

## 9. Examination mock data removed (A)

- No frontend question database. `GET /faculty/question-bank` and the paper
  pool are backend-only (`src/services/faculty-questions.js` → axios).
- `exams/exam-agent.js` — authoritative practice-exam question DB
  (`EXAM_AGENT_EXAMS`) removed; UI config kept.
- `exams/exam-analysis.js` — seeded per-exam analysis removed; option
  metadata kept.
- `PaperGenerator.generatedPapers === []` (verified by test).
- `student/academics.js` — `mockTests`/`exams` empty (verified by test).
- No answer keys shipped to the student delivery UI.

Paper Generator / Paper Library / Examinations / exam runner UIs are preserved.

---

## 10. Retained landing-page static content (F)

`src/datasets/platform/content.js` (`FAQS`, `BLOG_POSTS`, `FEATURES`,
`CONTACT_INFO`, `HERO_METRICS`, `JOURNEYS`, `TRUSTED_BY`, `AI_CAPABILITIES`,
`MEGA_MENU_*`, `NAV_LINKS`, `PRICING_PLANS`, `TESTIMONIALS`, `CASE_STUDIES`,
`PLATFORM_STATS`) is static marketing content — **kept** (F).
`EXAM_AGENT_GROUP_LABELS` / `EXAM_AGENT_TYPES` are label/contract constants
(keep, I).

---

## 11. Question databases removed (A)

The frontend holds **no authoritative question database**:

- `competitive-questions.js` (JEE/NEET + University PYQ questions) — emptied.
- `question-studio-sources.js` (curated source catalog) — emptied.
- `question-studio-questions.js` (per-subject question pools) — emptied;
  `buildStudioPools(rows)` (pure deterministic logic) preserved.

Question metadata/config (subject, chapter, topic, concept, difficulty, type,
domain, examFamily) is preserved as contract metadata.

---

## 12. Retained intelligence engines / contracts (G)

All protected analytics logic remains intact:

- `ExamAttempt` / `QuestionAttempt` contracts + `buildCanonicalExamAttempt` /
  `buildCanonicalQuestionAttempts` / `normalizeExamAttempt` /
  `classifyAttemptContext` / `filterExamAttempts`.
- University / JEE / NEET domain isolation (`examMode` / `examFamily`).
- Student 360 engine, Academic DNA engine, Similar Issues engine, intervention
  lifecycle rules, readiness/progress report engines.
- Question taxonomy contracts, domain/difficulty/question-type definitions.
- Micro-assessment engine, question-studio engine, paper generator algorithm,
  exam-calc and intervention-recommendation logic.

These are application logic, not mock data. They are invoked with data from the
backend; the snapshot assemblers (`computeFacultyIntelligence`,
`computeAdminIntelligence`, `getStudentIntelligence`) now take injectable
datasets parameters and are **not** seeded at runtime.

---

## 13. Retained test fixtures (H)

- `tests/fixtures/attempts.js` — canonical attempt factory.
- `tests/fixtures/students.js` — fixture students.
- `tests/fixtures/directory.js` — student/batch directory (replaces the removed
  roster).
- `tests/fixtures/micro-assessments.js` — curated micro-assessment sources
  (moved from `src`).

Fixtures are imported only by tests, never by production. **No fake backend /
mock router is retained.**

---

## 14. Retained UI / static configuration (I / K)

Question types, difficulty levels, domains, exam families, feature labels,
navigation metadata, theme, dropdown behavior, validators — **keep**. The AI
Tutor deterministic reply engine and `platform/registration.js`
(`REGISTRATION_OPTIONS`) are UI config — **keep** (I).

---

## 15. Classification outcome — static search

| Term | Occurrences | Classification |
|---|---|---|
| `mock-api`, `mock-router`, `mock-server`, `MOCK_USERS` | 0 (anywhere) | Removed |
| `sampleQuestions`, `mockQuestions`, `mockPapers`, `mockExams`, `fakeQuestions`, `fallbackQuestions` | 0 in production | Removed |
| `DEMO_USERS`, `demoOtp`, `482193`, `731205` | 0 in production | Removed |
| `mock` (lowercase) | Comments + test assertions | Documentation / Test |
| `seeded` | Comments + fixture/test assertions | Documentation / Test |

**Result: ZERO unresolved runtime mock data. The prototype backend is
physically deleted.**

---

## Summary of actions

- **Deleted:** all prototype API route modules + router + prototype stores
  (29 files) — not relocated.
- **Deleted / emptied:** backend-owned entity datasets (rosters, question
  databases, dashboard/analytics records, exam/attempt seeds, micro-assessment
  source passages, students-directory).
- **Removed:** demo auth, demo OTP copy, `USE_MOCK_API` flag, fake fallbacks,
  fake KPI values, fake-success toasts.
- **Made injectable:** snapshot assemblers (faculty/admin/student) — backend-fed.
- **Kept:** central API client, service layer, hooks, UI, routes, navigation,
  landing content, intelligence engines/contracts, test fixtures, UI config.
- **Documented gaps:** `EduX_registered_students` (registration registry) and
  `EduX_admin_report_library` (frontend-only report export) remain as documented
  prototype gaps; a few empty neutral contract shells remain in
  `src/datasets/**` / `src/intelligence/**/datasets/**` purely so engine module
  imports resolve and are the target of the future
  `Backend → Intelligence engine` data source.
