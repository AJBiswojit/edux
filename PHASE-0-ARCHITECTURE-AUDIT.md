# PHASE 0 — CURRENT PROJECT ARCHITECTURE & CLEANUP AUDIT

**Project:** MediXO EduX (`medixo-edux-platform` v1.0.0)  
**Branch:** `arena/01a02d20-edux`  
**Audit date:** 2026-08-23  
**Method:** Read-only static analysis (filesystem inventory, route tree reconstruction, import/export tracing, barrel-export awareness, service↔mock endpoint cross-check, domain isolation scan)  
**Constraint:** **Zero files modified. Zero deletions. Audit + roadmap only.**

> **Note on prior artifact:** Root `AUDIT-REPORT.md` (2026-08-03) describes an earlier “Aurora” snapshot and is **stale** relative to the current MediXO EduX tree (toast wiring, Legal routes, ErrorBoundary, workspaces, Student 360, interventions, etc. have evolved). This Phase 0 report is the **current truth**.

---

## Executive summary

MediXO EduX is a Vite + React 18 SPA with four role portals (Student, Faculty, Admin, Parent), an in-browser mock API (187 endpoints), and three intelligence foundations (Student / Faculty / Admin). The product has undergone multi-phase consolidation into workspaces (Assessment Intelligence, Institution Intelligence, Teaching, AI Studio, Student 360, Intervention lifecycle) while **legacy page files, redirect routes, dual panel implementations, and role-duplicated “Intervention Center” UIs remain in tree**.

| Area | State |
|---|---|
| Runtime architecture | Clean layering: pages → services (React Query) → mock API → intelligence engines → datasets |
| Primary product surfaces | Student academics + exam agent; Faculty assessment + students 360 + interventions; Admin institution intelligence |
| Parent portal | Code complete, **gated off** (`FEATURE_FLAGS.parentPortal = false`) |
| Biggest cleanup themes | Unreachable legacy admin pages; Student 360 dual UI; 4× Intervention Center; dead service hooks; ROLES/constants duplication; empty/stale imports |
| Test infrastructure | **None** (no unit/e2e harness). Only a one-off import-cleanup script |

---

# 1. PROJECT INVENTORY

## 1.1 Stack & configuration

| Item | Path / value |
|---|---|
| Bundler | Vite 5 (`vite.config.js`) |
| UI | React 18, Tailwind 3, Framer Motion, Lucide, Recharts |
| Data | TanStack React Query 5, Axios (live mode), in-browser mock server |
| Routing | React Router 6 (`src/routes/index.jsx`) |
| Entry | `src/main.jsx` → providers → `App.jsx` → `AppRoutes` |
| Config | `src/config/index.js` (`USE_MOCK_API`, `FEATURE_FLAGS`, `NAV_GROUPS`, `ROLES`) |
| Theme | `src/theme/index.js` + `src/contexts/theme-context.jsx` |
| Scripts | `dev` / `build` / `preview` only |
| One-off tool | `scripts/clean-unused-imports.cjs` |
| Docs | `README.md`, `CHANGE-LOG.md` (3332 lines), stale `AUDIT-REPORT.md` |
| Public assets | `favicon.png/svg`, `hero-showcase.webp` |
| Src asset | `src/assets/logo.png` |

## 1.2 Directory map

```
src/
├── api/                 # axios, client, mock-server, 9 mock-route modules, exam-attempts-store
├── assets/              # logo.png
├── components/          # 187 files — role workspaces, dashboards, UI primitives, shared
├── config/              # APP_CONFIG, FEATURE_FLAGS, NAV_GROUPS, ROLES
├── constants/           # ROLES (dup), UI badge maps
├── contexts/            # auth, theme
├── hooks/               # 6 UI hooks
├── intelligence/        # student + faculty + admin engines/datasets/master-profiles
├── mock-data/           # 20 legacy/portal mock modules
├── pages/               # 113 page modules (landing/auth/student/faculty/admin/parent)
├── routes/              # AppRoutes + ProtectedRoute
├── services/            # 11 React Query service modules
├── theme/               # chart colors, gradients
├── utils/               # cn, format
└── validators/          # RHF RULES
```

## 1.3 Counts (baseline metrics — see also §13)

| Category | Count |
|---|---|
| Total repo files (excl. node_modules/.git) | ~455 |
| Source JS/JSX under `src/` | **438** |
| Total LOC (src JS/JSX) | **~67,809** |
| Pages | **113** |
| Components | **187** |
| Services | **11** |
| API modules | **14** |
| Intelligence modules | **74** |
| Student engines | 11 |
| Faculty engines | 21 |
| Admin engines | 5 |
| Student datasets | 11 |
| Faculty datasets | 11 |
| Admin datasets | 6 |
| Mock-data modules | **20** |
| Hooks | **6** |
| Mock API endpoints | **187** (GET 146 / POST 35 / PATCH 4 / DELETE 2) |
| Service hooks (`use*`) | ~79 definitions |
| Runtime deps | 15 |
| Dev deps | 6 |
| Test files | **0** |

## 1.4 Pages (by portal)

| Portal | Count | Notes |
|---|---|---|
| Landing | 10 | Home, About, Pricing, CaseStudies, Blog, BlogPost, Contact, Careers, Media, Legal |
| Auth | 7 | Login, Register, Forgot/OTP/Reset, VerifyEmail, ProfileSetup |
| Student | 25 | Dashboard → Settings + ExamAgent, Interventions, etc. |
| Faculty | 21 | Includes **content components** AIQuestionStudio, PYQAnalysis (not primary routes) |
| Admin | 32 | Includes **6 redirect-orphaned analytics pages** + unrouted Parents |
| Parent | 15 | Fully routed but portal gated |
| Shared | 2 | Forbidden, NotFound |

## 1.5 Component domains

| Folder | Role |
|---|---|
| `ui/` | Design system (button, dialog, tabs, toast, …) |
| `shared/` | PageHeader, loading, charts wrappers consumers, DataTable, … |
| `layout/` | AppLayout, AuthLayout, LandingLayout, sidebar, topbar, command-palette, ai-copilot |
| `landing/` | Marketing sections |
| `dashboard/` | Student command center widgets |
| `faculty-dashboard/` | Faculty command center widgets |
| `admin-dashboard/` | Admin command center widgets |
| `academic-workspace/` | Student Performance & AI / DNA / health / competitive tabs |
| `assessment-workspace/` | Faculty Assessment Intelligence tabs + paper studio |
| `exam-workspace/` | Examinations, mock tests, Exam Agent flow |
| `students-workspace/` | Student 360 panels, issues, intervention center |
| `intervention-workspace/` | Student practice runner |
| `teaching-workspace/` | Faculty Teaching workspace tabs |
| `institution-workspace/` | Admin Institution Intelligence tabs |
| `ai-workspace/` | Student MediXO Mentor |
| `ai-studio/` | Faculty AI Teaching Assistant tabs |
| `admin-ai/` | Admin AI workspace panels |
| `admin-reports/` / `reports-workspace/` | Report UIs |
| `question-studio/` | AI Question Studio source/workflow |
| `charts/` | Recharts wrappers |
| `settings/`, `support/` | Shared settings/support pieces |

## 1.6 Services

| Module | Purpose |
|---|---|
| `query.js` | Shared `getQuery` helper |
| `index.js` | Core student/faculty/admin/parent/AI hooks |
| `extra.js` | Extended portal endpoints (programs, PYQ, paper generator, admin extras, …) |
| `auth.js` | Auth + landing content hooks |
| `intelligence.js` | Student intelligence foundation |
| `faculty-intelligence.js` | Faculty intelligence foundation |
| `admin-intelligence.js` | Admin intelligence foundation |
| `faculty-students.js` | Directory + Student 360 + attempt analysis |
| `faculty-interventions.js` | Similar issues, interventions lifecycle, student practice |
| `exam-agent.js` | Exam agent exams/attempts |
| `question-studio.js` | AI Question Studio CRUD |

## 1.7 API / mock routes

| Module | Domain |
|---|---|
| `mock-server.js` | Router core |
| `mock-routes.js` | Core student/faculty/admin/parent/auth/AI |
| `mock-routes-extra.js` | Extended portal data |
| `mock-routes-intelligence.js` | Student intelligence |
| `mock-routes-faculty-intelligence.js` | Faculty intelligence |
| `mock-routes-admin-intelligence.js` | Admin intelligence |
| `mock-routes-exam-agent.js` | Exam agent |
| `mock-routes-faculty-students.js` | Students directory / 360 / analysis |
| `mock-routes-faculty-interventions.js` | Similar issues + intervention lifecycle |
| `mock-routes-question-studio.js` | Question studio |
| `exam-attempts-store.js` | In-memory canonical attempts |
| `mock-assistant-reply.js` | Deterministic assistant text |
| `axios.js` / `client.js` | Live + mock request bridge |

## 1.8 Intelligence engines (canonical map)

### Student (`src/intelligence/`)
- **Master:** `master-profile.js`
- **Orchestrator:** `index.js` (derive bundle)
- **Engines:** scores, derive, dna, readiness, competitive, university, exams, exam-agent, exam-attempt-intelligence, progress-report
- **Datasets:** academics, career, competitive, dna, events, examinations, learning, outcomes, resources, signals, workspace

### Faculty (`src/intelligence/faculty/`)
- **Master:** `master-profile.js`
- **Orchestrator:** `index.js`
- **Engines:** scores, dashboard, attendance, assignments, engagement, attention, alerts, analytics, assessment, insights, timeline, students, students-directory, **student-360**, **similar-issues**, **intervention-lifecycle**, ground-level-intelligence, reports, ai-studio, question-studio
- **Datasets:** classes, engagement, assessment, intelligence, reports, ai-studio, students-directory, competitive-questions, question-studio-* 

### Admin (`src/intelligence/admin/`)
- **Master:** `master-profile.js`
- **Orchestrator:** `index.js`
- **Engines:** scores, health, students, assessments, reports
- **AI:** prompts, response-engine
- **Datasets:** institutions, people, academics, analytics, ai

---

# 2. ROUTE → PAGE → SERVICE → API → ENGINE MAP

## 2.1 Routing architecture

```
BrowserRouter
 └─ AppRoutes
     ├─ LandingLayout  → public marketing
     ├─ AuthLayout     → auth flows
     ├─ /student       → ProtectedRoute(student) + AppLayout
     ├─ /faculty       → ProtectedRoute(faculty) + AppLayout
     ├─ /admin         → ProtectedRoute(admin) + AppLayout
     ├─ /parent        → ParentGate(FEATURE_FLAGS) + ProtectedRoute(parent) + AppLayout
     ├─ /403           → Forbidden
     └─ *              → NotFound
```

Lazy loading: nearly all pages via `React.lazy` + per-route `ErrorBoundary` + `Suspense`.

## 2.2 Student (active product)

| Route | Page | Primary services | Mock API | Engine / data |
|---|---|---|---|---|
| `/student` | Dashboard | `useStudentIntelligence` | `/intelligence/*`, legacy dashboard | student `derive`, interventions |
| `/student/programs` | Programs | `useStudentPrograms` / intelligence | `/student/programs` | datasets |
| `/student/academics` | Academics | intelligence | foundation | university academics |
| `/student/assignments` | Assignments | `useStudentAssignments` | `/student/assignments` | mock-data |
| `/student/attendance` | Attendance | `useStudentAttendance` | `/student/attendance` | mock-data |
| `/student/examinations` | Examinations | intelligence + exam agent hooks | exams + attempts | readiness, exam-agent |
| `/student/exam-agent` | ExamAgent | `useExamAgent*` | `/student/exam-agent/*` | `engine/exam-agent` |
| `/student/exam-analysis` | ExamAnalysis | intelligence / analysis | `/student/exam-analysis*` | attempt intelligence |
| `/student/performance-accuracy` | PerformanceAccuracy | intelligence | foundation | dna, competitive, university |
| `/student/interventions` | Interventions | `useStudentInterventions*` | `/student/interventions*` | intervention-lifecycle |
| `/student/mentor` | Mentor | mentor + chat | `/student/mentor/workspace` | mock assistant |
| `/student/forum` | Forum | `useForum` | `/student/forum` | mock-data |
| `/student/support` | Support | support hooks | `/student/support` | mock-data |
| `/student/calendar` | CalendarPage | `useCalendarEvents` | `/student/events` | mock-data |
| `/student/settings` | Settings | `useStudentSettings` | `/student/settings` | mock-data |
| `/student/courses`, `courses/:id`, `subjects`, `exams`, `mock-tests`, `learning-path`, `portfolio`, `progress-report`, `ai-tutor`, `ai-copilot` | respective pages | mixed | mixed | **routed but mostly off primary nav** (deep-link / legacy) |

**Nav (primary):** Dashboard, Calendar, Programs, Academics, Assignments, Attendance, Examinations, AI Exam Analysis, Performance & Accuracy, MediXO Mentor, Forum, Support.

## 2.3 Faculty (active product)

| Route | Page | Primary services | Engine |
|---|---|---|---|
| `/faculty` | Dashboard | `useFacultyIntelligence` | faculty dashboard/attention/interventions |
| `/faculty/teaching` | TeachingWorkspace | faculty intelligence | teaching engines |
| `/faculty/question-intelligence` | QuestionIntelligence | PYQ + QB + faculty intel + paper + studio | assessment, competitive-questions, question-studio |
| `/faculty/my-students` | MyStudents | `useFacultyStudents`, similar-issues, interventions | students-directory, similar-issues, intervention-lifecycle |
| `/faculty/my-students/:id` | StudentProfile | `useFacultyStudent360`, interventions | **student-360.js** |
| `/faculty/my-students/:id/exams/:attemptId` | FacultyAttemptAnalysis | `useFacultyAttemptAnalysis` | exam-attempt-intelligence |
| `/faculty/ai-assistant` | AITeachingAssistant | ai-studio services | ai-studio engine |
| `/faculty/reports` | Reports | faculty reports | reports engine |
| `/faculty/timetable` | Timetable | timetable hooks | mock-data |
| `/faculty/support` | Support | support | mock-data |
| Deep-linked (still routed, light nav): courses, quiz-builder, announcements, attendance, assignments, research, lecture-planner, exam-builder, settings | respective pages | core faculty services | mixed |

### Faculty Assessment Intelligence internal composition

```
/faculty/question-intelligence  (QuestionIntelligence.jsx)
 ├─ overview              → AssessmentOverviewTab
 ├─ question-intelligence → QuestionIntelligenceContent (+ CompetitiveQuestionBrowser)
 ├─ pyq                   → PyqIntelligenceTab
 │                           └─ imports PYQAnalysisContent from pages/faculty/PYQAnalysis.jsx  ⚠️ shared content
 ├─ question-studio       → pages/faculty/AIQuestionStudio.jsx  ⚠️ shared content (not a route)
 ├─ paper-generator       → PaperGeneratorTab (+ paper-parts)
 ├─ library               → PaperLibraryTab (share/archive/duplicate)
 └─ analytics             → AssessmentAnalyticsTab
```

### Faculty redirect routes (bookmarks preserved)

| Legacy path | Redirect target |
|---|---|
| `/faculty/ai-studio` | `/faculty/ai-assistant?tab=content` |
| `/faculty/question-bank` | `/faculty/question-intelligence?tab=question-intelligence` |
| `/faculty/paper-generator` | `/faculty/question-intelligence?tab=paper-generator` |
| `/faculty/pyq-analysis` | `/faculty/question-intelligence?tab=pyq` |

## 2.4 Admin (active product)

| Route | Page | Service | Engine |
|---|---|---|---|
| `/admin` | Dashboard | `useAdminIntelligence` | admin health/students |
| `/admin/institution-intelligence` | InstitutionIntelligence | `useAdminIntelligence` | full admin foundation |
| `/admin/reports` | Reports | admin intelligence | reports engine |
| `/admin/ai-workspace` | AIWorkspace | admin intelligence + AI | admin/ai |
| People / academics / governance pages | Users, Faculty, Students, Departments, Programs, … | `services/index` + `extra` | mostly mock-data + some derived |
| `/admin/question-bank` | QuestionBank | `useAdminQuestionBank` | admin assessments dataset |

### Admin redirect routes

| Legacy path | Redirect |
|---|---|
| `attendance-analytics` | institution-intelligence?tab=attendance |
| `assignment-analytics` | institution-intelligence?tab=attendance |
| `exam-analytics` | institution-intelligence?tab=assessment |
| `academic-analytics` | institution-intelligence?tab=academic |
| `performance` | institution-intelligence?tab=students |
| `placements` | institution-intelligence?tab=outcomes |

**Important:** Routes still `lazy()`-import the legacy page modules, but **JSX never renders them** — only `<LegacyRedirect />`. Page files are unreachable.

## 2.5 Parent (disabled product surface)

All `/parent/*` routes exist and pages/services/mock data remain, but `ParentGate` redirects to `/auth/login?role=parent` while `FEATURE_FLAGS.parentPortal === false`.

## 2.6 Dependency flow (canonical pattern)

```
Route (lazy page)
  → Page orchestrates tabs/layout
    → Components (workspace panels)
      → Service hooks (React Query)
        → api/client → mock-server handler
          → intelligence orchestrator OR mock-data module
            → engine pure functions + datasets
```

---

# 3. DEAD CODE CANDIDATES

> Classification: 🟢 DEFINITELY DEAD · 🟡 PROBABLY DEAD · 🟠 NEEDS MANUAL REVIEW · 🔵 ACTIVE  
> **Do not delete without confirming dynamic/deep-link/content-import usage.**

## 3.1 Pages

| FILE | TYPE | WHY UNUSED | REFERENCES | CONFIDENCE |
|---|---|---|---|---|
| `src/pages/admin/Parents.jsx` | Page | No route, no import, not in nav | Self only | 🟢 DEFINITELY DEAD |
| `src/pages/admin/AttendanceAnalytics.jsx` | Page | Route redirects; lazy const unused | Lazy import in routes (unused binding); datasets still live in mock-data/intelligence | 🟢 DEFINITELY DEAD as page (data layer 🔵) |
| `src/pages/admin/AssignmentAnalytics.jsx` | Page | Same | Same | 🟢 page / 🔵 data |
| `src/pages/admin/ExamAnalytics.jsx` | Page | Same | Same | 🟢 page / 🔵 data |
| `src/pages/admin/AcademicAnalytics.jsx` | Page | Same | Same | 🟢 page / 🔵 data |
| `src/pages/admin/Performance.jsx` | Page | Redirected; still has some `useAdminIntelligenceDerived` code | Lazy unused | 🟢 page unreachable |
| `src/pages/admin/Placements.jsx` | Page | Redirected | Lazy unused | 🟢 page unreachable |
| `src/pages/faculty/AIQuestionStudio.jsx` | Page-as-component | Not a route; **imported by QuestionIntelligence** | QuestionIntelligence tab | 🔵 ACTIVE (content) |
| `src/pages/faculty/PYQAnalysis.jsx` | Page-as-component | Route redirects; **`PYQAnalysisContent` imported by pyq-intelligence-tab** | assessment-workspace | 🔵 ACTIVE (content) — default page shell 🟡 |
| `src/pages/parent/*` (15) | Portal | Feature-flagged off | Fully routed under ParentGate | 🟠 NEEDS MANUAL REVIEW (keep for future vs archive) |
| Student deep-link pages (`AITutor`, `AICopilot`, `Courses`, `Subjects`, `Exams`, `MockTests`, …) | Pages | Off primary nav; some 0 in-app links (`ai-tutor`, `ai-copilot`) | Routes exist | 🟠 NEEDS MANUAL REVIEW |
| Faculty deep-link pages (`QuizBuilder`, `ExamBuilder`, `LecturePlanner`, …) | Pages | Off primary nav; few internal links | Routes exist | 🟠 NEEDS MANUAL REVIEW |

## 3.2 Components / exports

| FILE | TYPE | WHY | REFS | CONFIDENCE |
|---|---|---|---|---|
| `InterventionsTab` in `student-issues-tabs.jsx` | Export | Superseded by `InterventionCenterTab`; exported but never imported | Definition only | 🟢 DEFINITELY DEAD export |
| Internal panels in `student-360-panels.jsx` that mirror profile tabs (`TrendsPanel`, `DnaPanel`, `TimePanel`, …) | UI | Overview still mounts full stack; dedicated tabs use `student-profile-panels` / `student-intelligence-tabs` | Used inside `Student360Panels` | 🟠 DUPLICATE ACTIVE — not dead |
| Empty import stubs e.g. `ProgressReport.jsx` `{ } from 'framer-motion'`, `chart-card`, `progress-ring`, `charts`; `ground-level-intelligence.js` empty import | Stale | Leftover cleanup | File-local | 🟢 DEAD import lines |

## 3.3 Services / hooks (unused outside services)

| HOOK | WHY | CONFIDENCE |
|---|---|---|
| `useAITutorThread` | No page consumer (threads list used instead?) | 🟡 |
| `useCourseDetail` | CourseDetail uses intelligence foundation, not this hook | 🟡 |
| `useGenerateExam` / `useGenerateQuiz` | No UI mutation wiring found | 🟡 |
| `useIntelligenceExamAttempts` / `useIntelligenceExamDnaSignals` | No external consumers | 🟡 |
| `useInterventionEffectiveness` | Effectiveness embedded in other hooks | 🟡 |
| `useIssueGroup` | Group detail may inline-fetch | 🟡 |
| `usePaperShares` | Share UI may use other hooks | 🟡 |
| `useStudioApproved` / `useStudioSession` | Studio may use summary-only path | 🟡 |
| `useFaqs` / `useTestimonials` / `usePricingPlans` / `usePlatformStats` | Landing may hardcode or use platform mock differently | 🟡 |
| `useProfileSetup` / `useRegistrationStatus` | Auth pages may call API differently | 🟠 |

## 3.4 Other

| FILE | TYPE | NOTES | CONFIDENCE |
|---|---|---|---|
| `scripts/clean-unused-imports.cjs` | Dev script | One-off; not npm-script wired | 🟠 keep as tool |
| `AUDIT-REPORT.md` | Doc | Stale Aurora audit | 🟡 obsolete doc |
| `CHANGE-LOG.md` | Doc | Huge phase log; not runtime | 🔵 historical |

---

# 4. DUPLICATE CODE AUDIT

## 4.1 Intelligence / scoring

| CURRENT IMPLEMENTATIONS | CANONICAL CANDIDATE | WHY DUPLICATES | RECOMMENDED ACTION |
|---|---|---|---|
| `intelligence/engine/scores.js` + `faculty/engine/scores.js` + `admin/engine/scores.js` | Shared `intelligence/shared/scores.js` (`clamp`, `round1`, `avg`, `weighted`) | Identical helpers copied per role | Extract shared math; keep role-specific compute* local |
| Three `master-profile.js` (student/faculty/admin) | Keep separate | Same *pattern*, different domain data | No merge — document pattern only |
| Student `evaluateInterventions` (derive.js) vs Faculty `similar-issues` + `intervention-lifecycle` | Faculty lifecycle for exam-based IV; student derive for dashboard cards | Different semantics (academic signals vs exam fingerprints) | Keep both; rename student to `dashboardInterventions` for clarity |

## 4.2 Student 360 UI duplication

| CURRENT | CANONICAL | WHY | ACTION |
|---|---|---|---|
| `student-360-panels.jsx` Overview embeds Subjects/Chapters/Questions/Time/Behaviour/Trends/Dna | Dedicated tabs: `student-intelligence-tabs.jsx` + `student-profile-panels.jsx` | Overview is a “summary of everything”; tabs are deeper drilldowns — **overlapping presentation** of same `s360` fields | Keep one summary Overview; remove or slim duplicated full panels from overview OR delete parallel Trends/Dna implementations |
| `TrendsPanel` / `DnaPanel` defined in **both** `student-360-panels.jsx` and `student-profile-panels.jsx` | `student-profile-panels.jsx` (used by tab route) | Copy-paste panels | Dedupe to single module |

## 4.3 Intervention UI (4 implementations)

| FILE | ROLE | DATA SOURCE |
|---|---|---|
| `components/dashboard/intervention-center.jsx` | Student dashboard cards | `derived.interventions` (student engine) |
| `components/faculty-dashboard/intervention-center.jsx` | Faculty dashboard cards | `derived.dashboard.interventions` |
| `components/admin-dashboard/intervention-center.jsx` | Admin dashboard risk cards | `derived.interventions` / students risk |
| `components/students-workspace/intervention-center.jsx` | **Canonical lifecycle UI** | faculty-interventions API |

| CANONICAL | `students-workspace/intervention-center.jsx` + engines `similar-issues.js` + `intervention-lifecycle.js` |
| RECOMMENDED | Keep role dashboard cards as thin presentational variants OR share a `InterventionCard` primitive; do **not** merge lifecycle into dashboards |

## 4.4 Success centers / smart actions

| Files | Notes |
|---|---|
| `dashboard/success-center.jsx` (356 LOC), `faculty-dashboard/success-center.jsx` (338), `admin-dashboard/success-center.jsx` (86) | Parallel UX patterns, role-specific metrics — acceptable duplication; optional shared shell |

## 4.5 Constants

| Dup | Locations | Action |
|---|---|---|
| `ROLES`, `ROLE_HOME`, `ROLE_LABELS` | `config/index.js` **and** `constants/index.js` | Single source (`config` is what routes use) |
| Priority badge maps | `constants/ui` + local maps in intervention centers | Prefer `constants/ui` |

## 4.6 Question / PYQ / paper

| Area | Implementations | Notes |
|---|---|---|
| PYQ UI | `PYQAnalysis.jsx` content + `pyq-intelligence-tab.jsx` wrapper | Wrapper adds competitive browser — OK |
| Paper generator | `paper-generator-tab` + `paper-parts` + mock-data `paper-generator.js` | Active, not duplicate engines |
| Competitive questions | Single dataset `competitive-questions.js` | 🔵 good isolation |
| Question bank | Faculty QB mock + Admin QB page | Separate products |

## 4.7 Service `get` helper

Historically duplicated; **current** `services/index.js` and `extra.js` both import `getQuery` from `query.js` — **already canonical**.

---

# 5. STUDENT 360 AUDIT

## 5.1 Files

| File | LOC | Role |
|---|---|---|
| `pages/faculty/StudentProfile.jsx` | ~295 | Orchestrator: loads 360, tabs, domain filters, intervention strip |
| `components/students-workspace/student-360-panels.jsx` | ~575 | Overview mega-panel (many subpanels) |
| `intelligence/faculty/engine/student-360.js` | ~461 | **Canonical engine** `computeStudent360` |
| Supporting UI | intelligence-tabs, profile-panels, exam-history, evidence, issues-tabs | Tab bodies |

## 5.2 Data flow (canonical)

```
Exam attempts (exam-attempts-store / seeds)
  → buildExamEvidence / buildAttemptSignals (exam-attempt-intelligence)
  → computeStudent360 (student-360.js)
  → GET /faculty/students/:id/360
  → useFacultyStudent360
  → StudentProfile
       ├─ overview → Student360Panels (summary of many dimensions)
       ├─ exams → ExamHistoryTable
       ├─ subjects/chapters/questions → student-intelligence-tabs (drilldown)
       ├─ time/trends/dna → student-profile-panels
       └─ interventions strip → useFacultyStudentInterventions
```

## 5.3 Findings

| Finding | Detail |
|---|---|
| Duplicated UI | Overview panels overlap tab panels (subjects, chapters, questions, time, trends, dna) |
| Duplicated calculations | **No second engine in the page** — good. All analytics from `s360` |
| Logic in presentation | StudentProfile filters history client-side (domain/family) — acceptable presentation |
| Logic that belongs in engine | NEET chapter filter expression has **operator-precedence smell** (see §8) — engine bug risk |
| Reusable components | Evidence dialogs, question cards already partly extracted (`student-evidence.jsx`) |
| Separation | Engine ✅ / orchestration page ✅ / panels ⚠️ need consolidation |

## 5.4 Verdict

Student 360 **architecture is sound** (single engine, canonical attempts). Cleanup should target **panel duplication**, not engine deletion.

---

# 6. FACULTY ASSESSMENT INTELLIGENCE AUDIT

| Feature | Implementation | Status |
|---|---|---|
| Question Intelligence | `question-intelligence-content.jsx` + QB service | 🔵 Active tab |
| PYQ Intelligence | `pyq-intelligence-tab.jsx` + **`PYQAnalysisContent` from page file** | 🔵 Active — **legacy file is shared content** |
| Competitive Question Intelligence | `competitive-question-browser.jsx` + dataset + `computeCompetitiveQuestionIntelligence` | 🔵 Active |
| AI Question Paper Generator | `paper-generator-tab.jsx` | 🔵 Active |
| Paper Library + sharing | `paper-library-tab.jsx` + share endpoints | 🔵 Active |
| Question Bank | Merged into QI tab; admin still has standalone QB | 🔵 Active |
| AI Question Studio | `AIQuestionStudio.jsx` page imported as tab + `question-studio/*` | 🔵 Active — **not dead** |
| Assessment Analytics | `assessment-analytics-tab.jsx` | 🔵 Active |
| Exam Analysis (faculty) | `FacultyAttemptAnalysis.jsx` + students-directory analysis | 🔵 Active |
| Exam Agent integration | Student-side agent writes canonical attempts consumed by faculty 360 | 🔵 Active |

### Legacy file consumption (DO NOT DELETE)

| File | Consumed by |
|---|---|
| `pages/faculty/PYQAnalysis.jsx` (`PYQAnalysisContent`) | `pyq-intelligence-tab.jsx` |
| `pages/faculty/AIQuestionStudio.jsx` | `QuestionIntelligence.jsx` tab `question-studio` |

### Safe redirect-only paths

`/faculty/question-bank`, `/paper-generator`, `/pyq-analysis`, `/ai-studio` — redirects only; no standalone page mount.

---

# 7. INTERVENTION ARCHITECTURE

## 7.1 Canonical pipeline

```
Canonical exam attempts
  → buildAttemptSignals
  → computeStudentIssueFingerprints (similar-issues.js)
  → groupSimilarIssues (partition: domain → examFamily → subject → chapter)
  → buildRecommendation / computeInterventions
  → buildInterventionFromGroup (intervention-lifecycle.js)
  → Faculty Intervention Center (approve → plan → assign → practice → re-test)
  → selectPracticeQuestions / buildRetestEntity
  → Student /student/interventions + InterventionPracticeRunner
  → computeEffectiveness
```

## 7.2 Surfaces

| Step | UI | API |
|---|---|---|
| Similar Issues | MyStudents tab → `SimilarIssuesTab` | `GET /faculty/similar-issues` |
| Recommendation | Inside group detail / intervention build | engine |
| Intervention Center | MyStudents → `InterventionCenterTab` | `/faculty/interventions*` |
| Targeted Practice | Student Interventions + practice runner | `/student/interventions/:id/practice` |
| Re-test | Faculty create + student start | retest endpoints |
| Effectiveness | Detail dialog panel | effectiveness compute on read |

## 7.3 Duplicates vs canonical

| Implementation | Verdict |
|---|---|
| `faculty/engine/similar-issues.js` + `intervention-lifecycle.js` | **CANONICAL** |
| `students-workspace/intervention-center.jsx` | **CANONICAL UI** |
| `student-issues-tabs.InterventionsTab` | 🟢 Dead predecessor |
| Student/Faculty/Admin dashboard `InterventionCenter` widgets | 🔵 Separate “signal cards” — not lifecycle; keep or share card chrome only |
| Student `evaluateInterventions` in derive.js | 🔵 Dashboard-only academic interventions |

---

# 8. UNIVERSITY / JEE / NEET ISOLATION

## 8.1 Designed separation (good)

| Layer | Mechanism |
|---|---|
| Master profile | `primaryExam`, competitive families JEE/NEET |
| Readiness | `buildUniversityReadiness` vs `buildCompetitiveReadiness` / `FAMILY_SUBJECTS` |
| Exam agent | `EXAM_TYPE_LABELS`: University / JEE / NEET |
| Attempts store | `examMode`, `examFamily` on attempts |
| Students directory | filters by domain + examFamily |
| Similar issues | **Hard partition** — no cross-domain grouping |
| Competitive questions dataset | JEE_* and NEET_* arrays + `universityPyqQuestions` |
| UI badges | `DOMAIN_BADGE`, `FAMILY_BADGE` |
| Student interventions copy | Explicitly exclude practice from official Uni/JEE/NEET metrics |

## 8.2 Leakage / defect flags

| Issue | Location | Severity |
|---|---|---|
| NEET chapter filter operator precedence | `student-360.js` ~line 176: `A && B || C || D` makes Physics/Chemistry always match NEET bucket | **P0 logic risk** |
| JEE filter uses `!c.subject.includes('NEET')` on subject names | Same file | 🟠 fragile |
| University chapter heuristic is subject-name substring list | Same file | 🟠 brittle |
| Student dashboard interventions not domain-partitioned like faculty lifecycle | derive.js | P2 |
| Admin institution intelligence is university-centric | expected | OK |
| Assignment analytics redirect lands on `tab=attendance` not assignments | routes | P2 product bug |

## 8.3 Verdict

Architecture **intends** correct isolation and mostly enforces it in similar-issues and exam agent. Student-360 chapter bucketing needs a correctness pass before trusting NEET vs JEE chapter lists.

---

# 9. LEGACY ROUTE AUDIT

## 9.1 ACTIVE ROUTES (primary product)

- Landing (11) + Auth (8) + Student (~15 nav-primary + deep links) + Faculty primary workspace set + Admin primary set + `/403` + `*`

## 9.2 REDIRECT ROUTES

**Faculty:** `ai-studio`, `question-bank`, `paper-generator`, `pyq-analysis`  
**Admin:** `attendance-analytics`, `assignment-analytics`, `exam-analytics`, `academic-analytics`, `performance`, `placements`  
**Parent gate:** entire `/parent/*` → login when flag false  

## 9.3 ORPHANED / UNREACHABLE PAGES

| Page | Routed? | Redirected? | Content import? | Safe to delete? |
|---|---|---|---|---|
| admin/Parents | No | No | No | Yes (page only) 🟢 |
| admin/*Analytics, Performance, Placements | Lazy imported but element is Redirect | Yes | No (workspace replaced) | Yes **after** removing unused lazy imports 🟢 |
| faculty/PYQAnalysis default page | Redirect | Yes | **Yes** (`PYQAnalysisContent`) | **No** — move content to components first |
| faculty/AIQuestionStudio | No route | — | **Yes** | **No** — move to components first |
| parent/* | Yes but gated | Gate | N/A | No — feature flag archive 🟠 |

## 9.4 404

`path="*"` → `NotFound.jsx`. Unknown paths covered.

## 9.5 Unused lazy bindings in `routes/index.jsx`

These constants are declared but never passed to `withSuspense` (redirects used instead):

- `AdminAttendanceAnalytics`, `AdminAssignmentAnalytics`, `AdminExamAnalytics`
- `AdminAcademicAnalytics`, `AdminPerformance`, `AdminPlacements`

---

# 10. TESTING / DEVELOPMENT ARTIFACT AUDIT

| Artifact | Verdict |
|---|---|
| `scripts/clean-unused-imports.cjs` | DISPOSABLE-or-TOOL — useful, not test infra |
| `AUDIT-REPORT.md` | DISPOSABLE DOC (stale) |
| `CHANGE-LOG.md` | ACTIVE historical log (keep) |
| `src/components/exam-workspace/mock-tests-content.jsx` | ACTIVE product UI (name contains “mock”) |
| `src/mock-data/*` | ACTIVE runtime data (not disposable) |
| `src/api/exam-attempts-store.js` | ACTIVE |
| `*.test.*` / `*.spec.*` | **None** |
| CI / lint config | **None** |
| Debug logs / screenshots | **None found** |
| Temporary JSON | **None found** |

**No active automated test infrastructure.** All verification is manual / changelog narrative.

---

# 11. DEPENDENCY AUDIT

## 11.1 Runtime dependencies

| Package | Used? | Notes |
|---|---|---|
| react, react-dom | ✅ | Core |
| react-router-dom | ✅ | ~97 files |
| @tanstack/react-query | ✅ | Services |
| axios | ✅ | Live API path (`api/axios.js`) |
| framer-motion | ✅ | ~164 files |
| lucide-react | ✅ | ~244 files |
| recharts | ✅ | via `components/charts` only |
| clsx + tailwind-merge | ✅ | via `utils/cn.js` |
| date-fns | ✅ | format + calendars |
| react-hook-form | ✅ | Auth + Contact |
| react-markdown + remark-gfm | ✅ | chat-message |
| react-dropzone | ✅ | Assignments, PYQ, DataTools |

## 11.2 Unused dependencies

**None clearly unused.** All 15 runtime packages have import graph hits.

## 11.3 Dev dependencies

All used by Vite/Tailwind build pipeline. No test runner installed.

## 11.4 Duplicated libraries

No duplicate HTTP/chart/form libraries. Toast is single system (`components/ui/toast.jsx` mounted in `main.jsx`) — prior Aurora dual-toast issue appears resolved.

---

# 12. CURRENT ARCHITECTURAL RISKS (TOP 10)

| Rank | ID | Risk | Severity |
|---|---|---|---|
| 1 | R1 | **Student-360 NEET/JEE chapter classification bug** (boolean precedence) can mix competitive domains in UI | **P0** |
| 2 | R2 | **Dual Student 360 presentation layers** (overview mega-panel vs tab panels) → inconsistent UX, double maintenance | **P1** |
| 3 | R3 | **Four Intervention Center UIs** + dead `InterventionsTab` → cognitive/maintenance load; risk of editing the wrong one | **P1** |
| 4 | R4 | **Legacy admin analytics pages still in tree + unused lazy imports** → false sense of dual systems; bundle risk if redirects removed carelessly | **P1** |
| 5 | R5 | **Page-as-component anti-pattern** (`PYQAnalysis`, `AIQuestionStudio` under `pages/` imported by workspace) | **P1** |
| 6 | R6 | **Parent portal fully shipped but disabled** — large surface area (~15 pages + 17 endpoints) without product commitment | **P1** |
| 7 | R7 | **No tests / lint / CI** — regressions in engines (isolation, effectiveness) undetectable | **P1** |
| 8 | R8 | **Deep-link ghost routes** (student AITutor/AICopilot 0 links; many faculty tools off nav) — unclear product boundary | **P2** |
| 9 | R9 | **Triple scores helpers + duplicated ROLES constants** — drift risk | **P2** |
| 10 | R10 | **Stale empty imports / leftover Aurora naming** (`aurora_*` localStorage keys in config) — polish + possible theme/token confusion | **P3** |

### Additional P2 notes
- Admin assignment-analytics redirect target tab mismatch (`attendance` vs assignments).
- `useCourseDetail` and other unused hooks leave dead API assumptions.
- Large main intelligence + mock datasets → performance budget pressure (not measured this audit).

---

# 13. BEFORE CLEANUP METRICS (BASELINE)

| Metric | Value |
|---|---|
| Total source files (js/jsx in src) | **438** |
| Total LOC (src js/jsx) | **~67,809** |
| Pages | **113** |
| Components | **187** |
| Services | **11** |
| API modules | **14** |
| Mock endpoints | **187** |
| Intelligence modules | **74** |
| Engines (student/faculty/admin) | 11 / 21 / 5 |
| Datasets (student/faculty/admin) | 11 / 11 / 6 |
| Mock-data modules | **20** |
| Hooks | **6** |
| Scripts | **1** |
| Test/verification artifacts | **0 automated** (+ 1 import cleaner) |
| Package dependencies (runtime + dev) | **15 + 6** |
| Definitely dead page candidates | **7** (Parents + 6 redirected admin analytics pages) |
| Dead export candidates | **1+** (`InterventionsTab`) |
| Feature-flagged portal pages | **15** (parent) |

---

# 14. FINAL REPORT

## 14.1 CURRENT PROJECT ARCHITECTURE

MediXO EduX is a mock-API-first multi-portal SPA:

- **Presentation:** role layouts + workspace pages  
- **Application:** React Query service hooks  
- **Interface:** unified `request()` → mock-server or axios  
- **Domain:** three intelligence foundations with pure engines  
- **Data:** intelligence datasets + `mock-data/*` + in-memory exam attempt store  

Consolidation pattern in use: **flagship workspaces absorb legacy pages; redirects preserve URLs; content sometimes remains in old page files.**

## 14.2 ACTIVE FEATURES

- Landing + Auth  
- Student: Dashboard, Academics path, Examinations + Exam Agent, Exam Analysis, Performance & AI, Interventions practice, Mentor, Forum, Support  
- Faculty: Dashboard, Teaching Workspace, **Assessment Intelligence** (QI/PYQ/Studio/Paper/Library/Analytics), My Students + **Student 360** + Similar Issues + **Intervention Center**, AI Assistant, Reports  
- Admin: Dashboard, **Institution Intelligence**, Reports, AI Workspace, people/academics/governance/finance tools, Question Bank  
- Parent: implemented, **disabled by feature flag**  
- Cross-cutting: dark theme, command palette, toasts, error boundaries, reduced-motion pref  

## 14.3 DEFINITELY DEAD CODE

| FILE | REASON | DEPENDENCIES | CONFIDENCE |
|---|---|---|---|
| `src/pages/admin/Parents.jsx` | Unrouted, unimported | None runtime | 🟢 |
| `src/pages/admin/AttendanceAnalytics.jsx` | Unreachable (redirect only) | mock-data still used elsewhere | 🟢 page |
| `src/pages/admin/AssignmentAnalytics.jsx` | Same | Same | 🟢 page |
| `src/pages/admin/ExamAnalytics.jsx` | Same | Same | 🟢 page |
| `src/pages/admin/AcademicAnalytics.jsx` | Same | Same | 🟢 page |
| `src/pages/admin/Performance.jsx` | Same | Optional derived hook only on this page | 🟢 page |
| `src/pages/admin/Placements.jsx` | Same | placements mock still in admin intel | 🟢 page |
| Unused lazy consts in `routes/index.jsx` (6 admin) | Never rendered | Drop with pages | 🟢 |
| `InterventionsTab` export | Superseded | None | 🟢 |
| Empty import statements (ProgressReport, ground-level-intelligence, …) | Stale | None | 🟢 lines |

## 14.4 PROBABLE DEAD CODE

| FILE / SYMBOL | REASON | CONFIDENCE |
|---|---|---|
| Unused service hooks listed in §3.3 | No external references | 🟡 |
| Student `AITutor` / `AICopilot` pages | Routed, 0 in-app links; Mentor/FAB replaced paths | 🟡/🟠 |
| `AUDIT-REPORT.md` | Superseded by this audit | 🟡 |
| Landing hooks in `auth.js` (faqs/pricing/testimonials/stats) | May be unused if pages hardcode | 🟡 |

## 14.5 DUPLICATE CODE

- Scores helpers ×3  
- ROLES constants ×2  
- Student 360 panels ×2 families  
- Intervention Center UI ×4 (1 canonical lifecycle + 3 dashboard)  
- Success Center ×3 (role-specific — soft dup)  
- PYQ page shell vs tab wrapper (content shared — structural dup)

## 14.6 REDUNDANT API / SERVICE CALLS

- `QuestionIntelligence` fans out **3 parallel foundations** (PYQ + QB + faculty intel) on every tab mount — correct but heavy  
- Admin redirected pages’ services (`useAdminAttendanceAnalytics`, etc.) only useful if pages kept — otherwise service+mock pairs become orphan **if** intelligence stops reading underlying mock-data (currently intelligence still uses datasets)  
- `useCourseDetail` vs intelligence-based CourseDetail — redundant path  

## 14.7 LEGACY ROUTES

See §9. Redirects are intentional and should remain until bookmarks deprecated.

## 14.8 TEST / DEVELOPMENT ARTIFACTS

No automated tests. One maintenance script. Large CHANGE-LOG. Stale AUDIT-REPORT.

## 14.9 UNUSED DEPENDENCIES

**None identified.** Do not uninstall.

## 14.10 CRITICAL ARCHITECTURAL RISKS

See §12 (R1–R10). Highest priority: **domain isolation bug in student-360 chapter split** and **dual 360 UI**.

---

## 14.11 RECOMMENDED CLEANUP ORDER

> Still audit-only — execution is a later phase.

### Phase A — Correctness (P0)
1. Fix University/JEE/NEET chapter/subject partitioning in `student-360.js` (and add pure unit tests).  
2. Verify similar-issues partitions with fixtures per domain/family.

### Phase B — Safe deletions (🟢)
1. Remove `admin/Parents.jsx`.  
2. Remove 6 unreachable admin analytics page files **and** their unused lazy imports in routes (keep redirects).  
3. Remove dead `InterventionsTab` (or whole dead branch).  
4. Strip empty imports.

### Phase C — Move legacy content out of `pages/` (P1)
1. Move `PYQAnalysisContent` → `components/assessment-workspace/`.  
2. Move `AIQuestionStudio` → `components/question-studio/` (page wrapper only if needed).  
3. Confirm no remaining `pages/*` imports from components.

### Phase D — Student 360 UI consolidation (P1)
1. Choose canonical panel modules (`student-intelligence-tabs` + `student-profile-panels`).  
2. Slim `Student360Panels` to true overview (KPIs + top strengths/weaknesses + links).  
3. Delete duplicated Trends/Dna/Time implementations.

### Phase E — Intervention UI hygiene (P1)
1. Document canonical lifecycle path.  
2. Extract shared `InterventionCard` for dashboard variants.  
3. Keep engines as single source.

### Phase F — Service/hook prune (P2)
1. Delete or wire unused hooks after runtime grep + manual QA.  
2. Deduplicate ROLES into one module.  
3. Extract shared `clamp/avg/round1`.

### Phase G — Product boundary (P2/P3)
1. Decide parent portal: keep flagged vs move to `/archive`.  
2. Decide student/faculty deep-link pages: nav restore vs redirect into workspaces.  
3. Fix assignment-analytics redirect tab.  
4. Rename `aurora_*` storage keys carefully (migration).  
5. Add Vitest for engines + basic route smoke tests.  
6. Retire or rewrite stale `AUDIT-REPORT.md`.

---

## 14.12 DELETION CANDIDATES (FOR LATER PHASES ONLY)

| FILE | REASON | DEPENDENCIES TO CLEAR FIRST | CONFIDENCE |
|---|---|---|---|
| `src/pages/admin/Parents.jsx` | Orphan page | None | 🟢 |
| `src/pages/admin/AttendanceAnalytics.jsx` | Replaced by Institution Intelligence | Remove lazy import; keep mock dataset | 🟢 |
| `src/pages/admin/AssignmentAnalytics.jsx` | Same | Same | 🟢 |
| `src/pages/admin/ExamAnalytics.jsx` | Same | Same | 🟢 |
| `src/pages/admin/AcademicAnalytics.jsx` | Same | Same | 🟢 |
| `src/pages/admin/Performance.jsx` | Same | Confirm no deep links outside redirects | 🟢 |
| `src/pages/admin/Placements.jsx` | Same | Placements data remains in admin intel | 🟢 |
| `InterventionsTab` in `student-issues-tabs.jsx` | Superseded by InterventionCenterTab | None | 🟢 |
| `src/pages/faculty/PYQAnalysis.jsx` | Only after moving `PYQAnalysisContent` | pyq-intelligence-tab import | 🟠 after move |
| `src/pages/faculty/AIQuestionStudio.jsx` | Only after moving to components | QuestionIntelligence import | 🟠 after move |
| Parent portal tree | Only if product drops parent v1 | feature flag, nav, mock routes, services | 🟠 product decision |

---

## Appendix A — Mock endpoint prefix counts

| Prefix | Approx endpoints |
|---|---|
| faculty | 60 |
| student | 33 |
| admin | 28 |
| parent | 17 |
| ai | 14 |
| platform | 11 |
| auth | 10 |
| intelligence / admin-intelligence / faculty-intelligence / directory | remainder |

## Appendix B — Primary vs deep-link student routes

**In primary nav:** `/student`, programs, calendar, academics, assignments, attendance, examinations, exam-analysis, performance-accuracy, mentor, forum, support  

**Routed but not primary nav:** courses, subjects, exams, mock-tests, exam-agent, interventions, learning-path, portfolio, progress-report, ai-tutor, ai-copilot, settings (settings often via topbar)

## Appendix C — Confirmation: no modifications

This Phase 0 engagement performed **read-only** inspection. No source files, routes, dependencies, engines, mock data, or UI were modified as part of the audit. The only deliverable added is this report file for human consumption.

---

**END OF PHASE 0 AUDIT**
