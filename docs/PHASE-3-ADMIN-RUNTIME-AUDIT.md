# Phase 3 — Admin Runtime Data Normalization Audit

**Date:** 2026-08-30  
**Branch:** `arena/01a04f10-edux`  
**Status:** READ-ONLY AUDIT. No application code changed. No migration run. No seed deleted. No database mutation. Implementation is **not** started.

**Scope:** Admin portal runtime only. Student and Faculty runtimes, examination spine, question/paper generation, READY/SEND, student exam delivery, and server scoring were not modified.

PostgreSQL source of truth remains `backend/.env.example` (`DATABASE_URL`, `DB_SCHEMA=edux`). Frontend has no DB credentials.

---

## 0. Executive finding

The Admin chrome (login, JWT, role gate, topbar name) is real. Almost every operational Admin **number, chart, list extra, mutation, report, and intelligence score** is still a frozen MIT-P SPA snapshot, a SPA overlay on live SQL rows, a toast-only fake, or localStorage.

A newly registered / empty-institution admin (`admin@edux.dev` on `EduX Local Development`, or any institution with 0 catalog rows) still sees **12,480 students, 640 faculty, ₹48.2 Cr fees, 87.9 institution health**, and sample departments/courses — because `/admin-intelligence/summary` ignores the authenticated institution, and empty catalog GETs fall back to `admin-catalog.json`.

```
TODAY (broken):     SPA snapshot / overlay → Admin UI
REQUIRED:           ADMIN ACTION → existing UI → API → FastAPI → PostgreSQL → real/derived → UI
```

---

## 1. Admin pages and routes

All pages sit under `ProtectedRoute roles={[ROLES.ADMIN]}` → `AppLayout` (`src/routes/index.jsx`). Nav: `src/config/index.js` `NAV_GROUPS.admin`.

| Route | Page file | Primary data hook | Backend |
|-------|-----------|-------------------|---------|
| `/admin` | `src/pages/admin/Dashboard.jsx` | `useAdminIntelligence` | `GET /v1/admin-intelligence/summary` |
| `/admin/institution-intelligence` | `InstitutionIntelligence.jsx` | `useAdminIntelligence` | same snapshot |
| `/admin/reports` | `Reports.jsx` | `useAdminIntelligence` + localStorage library | snapshot + **no report API** |
| `/admin/ai-workspace` | `AIWorkspace.jsx` | `useAdminIntelligence` + localStorage chat | snapshot; **does not call** `POST /ai/executive/ask` |
| `/admin/support` | `Support.jsx` | none (static FAQs) | **no API** |
| `/admin/users` | `Users.jsx` | `useAdminUsers` | `GET /v1/admin/users` |
| `/admin/faculty` | `Faculty.jsx` | `useAdminFaculty` + `useAdminDepartments` | `GET /admin/faculty`, `/admin/departments` |
| `/admin/students` | `Students.jsx` | `useAdminStudents` | `GET /v1/admin/students` |
| `/admin/departments` | `Departments.jsx` | `useAdminDepartments` | `GET /v1/admin/departments` |
| `/admin/programs` | `Programs.jsx` | `useAdminPrograms` | `GET /v1/admin/programs` |
| `/admin/subjects` | `Subjects.jsx` | `useAdminSubjects` | `GET /v1/admin/subjects` |
| `/admin/courses` | `Courses.jsx` | `useAdminCourses` | `GET /v1/admin/courses` |
| `/admin/batches` | `Batches.jsx` | `useAdminBatches` | `GET /v1/admin/batches` |
| `/admin/calendar` | `AcademicCalendar.jsx` | `useAdminCalendar` | `GET /v1/admin/calendar` |
| `/admin/question-bank` | `QuestionBank.jsx` | `useAdminQuestionBank` | `GET /v1/admin/question-bank` (SPA, not `questions`) |
| `/admin/research` | `Research.jsx` | `useAdminResearch` | `GET /v1/admin/research` (SPA, not `research_publications`) |
| `/admin/revenue` | `Revenue.jsx` | `useAdminRevenue` | `GET /v1/admin/revenue` |
| `/admin/scholarships` | `Scholarships.jsx` | `useAdminScholarships` | `GET /v1/admin/scholarships` |
| `/admin/roles` | `Roles.jsx` | `useAdminRoles` | `GET /v1/admin/roles` (SPA, not SQL `roles`) |
| `/admin/permissions` | `Permissions.jsx` | `useAdminPermissions` | `GET /v1/admin/permissions` |
| `/admin/audit-logs` | `AuditLogs.jsx` | `useAdminAuditLogs` | `GET /v1/admin/audit-logs` (SPA, not SQL `audit_logs`) |
| `/admin/ai-config` | `AiConfig.jsx` | `useAdminAiConfig` | `GET /v1/admin/ai-config` |
| `/admin/cms` | `Cms.jsx` | `useAdminCms` | `GET /v1/admin/cms` |
| `/admin/api-config` | `ApiConfig.jsx` | `useAdminApiConfig` | `GET /v1/admin/api-config` |
| `/admin/data-tools` | `DataTools.jsx` | `useAdminDataTools` | `GET /v1/admin/data-tools` |
| `/admin/settings` | `Settings.jsx` | `useAdminSettings` | `GET /v1/admin/settings` |

Legacy redirects (pages removed from nav; files not deleted):

| Old route | Redirect |
|-----------|----------|
| `/admin/attendance-analytics` | `/admin/institution-intelligence?tab=attendance` |
| `/admin/assignment-analytics` | `?tab=attendance` |
| `/admin/exam-analytics` | `?tab=assessment` |
| `/admin/academic-analytics` | `?tab=academic` |
| `/admin/performance` | `?tab=students` |
| `/admin/placements` | `?tab=outcomes` |

Unused by UI: `GET /v1/admin/dashboard` (`live_catalog.admin_dashboard`), `GET /v1/admin-intelligence/{profile,datasets,derived}`, `GET /v1/admin/{analytics,performance,placements,attendance-analytics,assignment-analytics,exam-analytics}`, `GET /v1/directory/{faculty,students,users}`.

---

## 2. Admin components / hooks / services

### 2.1 Intelligence consumers (snapshot)

| Component | Path | Reads |
|-----------|------|-------|
| Command Center cards | `src/components/admin-dashboard/*` | `data.derived.*` |
| Workspace tabs | `src/components/institution-workspace/*` | `data` snapshot |
| Report center / preview / compare | `src/components/admin-reports/*` | derived + `REPORT_TYPES` |
| Executive chat / history | `src/components/admin-ai/*` | derived + localStorage |

### 2.2 Hooks

| Hook | File | Endpoint |
|------|------|----------|
| `useAdminIntelligence` | `src/services/admin-intelligence.js` | `GET /admin-intelligence/summary` |
| `useAdminUsers` … `useAdminSettings` | `src/services/index.js` | matching `/admin/*` |
| `useAdminRevenue` … `useAdminDataTools`, `useAdminStudents`, `useAdminFaculty` | `src/services/extra.js` | matching `/admin/*` |

No Admin `useMutation` exists. Create/invite/save/export are `toast.success` only.

### 2.3 Frontend intelligence (KEEP engines; do not feed SPA)

| Path | Class | Runtime use |
|------|-------|-------------|
| `src/intelligence/admin/engine/*.js` | INTELLIGENCE_ENGINE | Used by reports preview + `generateExecResponse`. **Also contains numeric fallbacks** (retention 90/92, pass 89, exam avg 71.4, placement 92.4, faculty 640, pubs 1240, at-risk 5.9). Empty evidence must not use those defaults. |
| `src/intelligence/admin/index.js` `computeAdminIntelligence` | INTELLIGENCE_ENGINE | Not called by pages (backend ships pre-derived SPA). Still hard-imports `masterInstitutionProfile`. |
| `src/intelligence/admin/master-profile.js` | HARDCODED OPERATIONAL | MIT-P, 12480 / 640 / 214, Meera as CSE HOD, campuses 10480+2000 |
| `src/intelligence/admin/datasets/*.js` | leftover / shells | `academics.js` / `analytics.js` re-export emptied `src/datasets/admin/*`. `people.js` still maps `STUDENT_ROSTER` (now `[]`) but carries Meera publication/student defaults. |
| `src/intelligence/admin/ai/response-engine.js` | INTELLIGENCE_ENGINE | Chat answers from **derived snapshot**, not SQL. |
| `src/datasets/admin/core.js`, `operations.js` | STATIC shells | Empty arrays — KEEP names. Not the live source. |
| `src/datasets/platform/users.js` | STATIC shells | `STUDENT_ROSTER` / `FACULTY_LIST` / `ADMIN_USERS` / `DEPARTMENTS` = `[]` |

---

## 3. Backend routers, models, SQL

**Router:** `backend/app/api/v1/admin.py` — **GET only**. Zero POST/PATCH/PUT/DELETE.

**Auth:** `require_roles("admin")` (`backend/app/core/deps.py`). JWT from `POST /v1/auth/login`. `GET /v1/auth/me` → `user_public` (id, role, email, fullName, institution name, department).

| Endpoint | Handler source | Model / table | Class |
|----------|----------------|---------------|-------|
| `/admin-intelligence/summary` | `payload("admin-intelligence-summary")` | `app_kv` `spa:admin-intelligence-summary` | SEEDED / MOCK operational |
| `/admin-intelligence/profile\|datasets\|derived` | matching SPA JSON | `app_kv` | SEEDED (unused by UI) |
| `/admin/students` | `admin_students_payload` | `student_profiles`, `users`, `departments` | REAL list + **seeded scalars** (cgpa, extra.attendance) |
| `/admin/faculty` | SQL, **if total==0 → SPA `facultyList`** | `faculty_profiles` / SPA | MIXED — empty looks full |
| `/admin/users` | `admin_users`; empty → SPA users | `users` | MIXED |
| `/admin/departments\|courses\|programs\|subjects\|batches\|calendar` | `live_catalog.admin_*`; empty → SPA; live rows **merge SPA extras** | catalog tables + `admin-catalog` | MIXED |
| `/admin/dashboard` | SPA kpis with `count or spa_value` | counts + SPA | MIXED, **unused by UI** |
| `/admin/analytics\|performance\|placements\|research\|roles\|permissions\|audit-logs\|ai-config\|settings\|revenue\|*analytics\|question-bank\|scholarships\|cms\|api-config\|data-tools` | `payload("admin-catalog")[key]` | `app_kv` | SEEDED |
| `/admin/feature-flags` | settings | config | STATIC / ops flag |
| `POST /ai/executive/ask` | `AiGateway` + `AiTrace` | `ai_traces` | REAL trace, prototype reply; **UI does not call it** |
| `GET /directory/*` | people_directory / live_catalog | SQL + SPA faculty fallback | MIXED, unused |

### Existing SQL that Admin should use (not currently the intelligence source)

| Concern | Model | Table | Today |
|---------|-------|-------|-------|
| Institution identity | `Institution` | `institutions` | name/short_name/year/threshold exist; snapshot ignores them |
| Students | `StudentProfile`, `User` | `student_profiles`, `users` | list LIVE; KPIs use 12480 |
| Faculty | `FacultyProfile` | `faculty_profiles` | list LIVE unless empty |
| Catalog | `Department`, `Program`, `Subject`, `Course`, `Batch`, `CalendarEvent` | matching | lists MIXED |
| Enrollment | `Enrollment` | `enrollments` | used for course `enrolled` when SQL courses exist |
| Attendance | `AttendanceSession/Record` | `attendance_*` | unused by Admin analytics |
| Assignments | `Assignment`, `AssignmentSubmission` | `assignments*` | unused by Admin analytics |
| Exams / papers / questions | `ExamAttempt`, `Paper`, `Question` | `exam_attempts`, `papers`, `questions` | unused by Admin KPIs/QB page |
| Interventions | `Intervention` | `interventions` | unused |
| Faculty research pubs | `ResearchPublication` | `research_publications` | Faculty LIVE; Admin research is SPA |
| Reports | `GeneratedReport`, `FileObject` | `generated_reports`, `files` | Faculty READY-only; Admin library is localStorage |
| Health persist | `InstitutionHealthSnapshot` | `institution_health_snapshots` | **ORM unused** |
| Roles | `Role`, `UserRole` | `roles`, `user_roles` | seed 4 codes; Admin Roles page is SPA (Super Admin, 4 members…) |
| Audit | `AuditLog` | `audit_logs` | **ORM unused**; page is SPA |
| Tickets | `SupportTicket` | `support_tickets` | Student support LIVE; Admin Support is static |
| Schema-only (no ORM / unused) | — | `permissions`, `role_permissions`, `invoices`, `scholarships`, `cms_pages` | BACKEND GAP / future |

---

## 4. SPA snapshot dependencies (do not delete in this audit)

| Document | Path | Size | Consumers |
|----------|------|------|-----------|
| `admin-intelligence-summary.json` | `backend/app/data/spa/` → `app_kv` `spa:admin-intelligence-summary` | ~777 KB | **Command Center, Institution Intelligence, Reports, AI Workspace** |
| `admin-intelligence-datasets.json` | same | ~685 KB | unused GET |
| `admin-intelligence-derived.json` | same | ~35 KB | unused GET |
| `admin-intelligence-profile.json` | same | ~3 KB | unused GET |
| `admin-catalog.json` | same | ~62 KB | all catalog/ops GETs + empty SQL fallback + extras overlay |

`payload(name)` (`spa_payloads.py`) is **not institution-scoped**. Every admin in every institution receives MIT-P.

Loader: `spa_documents.document` copies JSON into `app_kv` once; later reads KV.

---

## 5. Identity

| Surface | Current | Target |
|---------|---------|--------|
| Login | Real `users.password_hash` + JWT | KEEP |
| Role gate | `require_roles("admin")` + `ProtectedRoute` | KEEP |
| Topbar name | `user.fullName` from login/`/auth/me` | KEEP |
| Command Center description | Hardcoded “Meridian Institute of Technology” | `institutions.name` of authenticated admin |
| AI Workspace greeting | “Director.” | `user.firstName` / designation |
| Intelligence profile | Frozen MIT-P (`inst_mit_p`, Pune, Dr. Anil Menon, Meera as CSE HOD) | `Institution` + leadership from SQL or empty |
| Demo admin (when `SEED_DEMO_USERS=true`) | `u_adm_001` / `ananya.iyer@medixoedux.edu` / MIT-P | Optional demo flag; must not be the KPI source |
| Local-dev admin | `admin@edux.dev` on institution `edux-local-dev` | Still sees MIT-P snapshot after login |

Admin has **no** `admin_profiles` table. Identity fields live on `users` (+ optional faculty profile). Do not invent a duplicate identity table.

---

## 6. KPI source map

Command Center does **not** use `GET /admin/dashboard`. All KPIs below come from `derived` / `profile` inside the SPA summary unless noted.

| KPI | UI | Current source | Real SQL source | Calculation | Empty |
|-----|----|----------------|-----------------|-------------|-------|
| Institution health 87.9 | Dashboard badge + SuccessCenter | SPA `derived.institutionHealth` | `institution_health_snapshots` **or** engine on live aggregates | KEEP engine; persist optional | `null` / existing empty + grade “Building” |
| Total students 12480 | snapshot `totals.students` | SPA master profile | `COUNT(student_profiles)` where `institution_id` | count | **0** |
| Total faculty 640 | snapshot + Faculty.jsx `?? 640` | SPA + **hardcoded fallback** | `COUNT(faculty_profiles)` | count | **0** |
| Courses 214 | snapshot | SPA | `COUNT(courses)` | count | **0** |
| Departments 8 | snapshot + Faculty copy “8 departments” | SPA + hardcoded | `COUNT(departments)` | count | **0** |
| Programs / batches | snapshot totals | SPA | `COUNT(programs)` / `COUNT(batches)` | count | **0** |
| Fee collection ₹48.2 Cr | SPA dashboard kpi (unused endpoint also) | SPA | `invoices` unused | sum paid / empty | **— / 0** until finance exists |
| Revenue ₹86.4 Cr, outstanding ₹4.7 Cr | Revenue page | SPA `admin-catalog.revenue` | invoices unused | — | empty |
| Placement 92.4%, CTC ₹11.8 LPA | Intelligence outcomes + SPA placements | SPA | no placement pipeline | — | empty |
| Research grants 86, pubs 1240 | Admin Research page | SPA | `research_publications` (Faculty already SQL) | count/sum | **0 / []** |
| AI sessions 71,000 | profile.aiContext | SPA | `COUNT(ai_conversations)` or traces | count | **0** |
| Attendance overall ~90% | Intelligence attendance tab | SPA `attendanceAnalytics` | `attendance_records` | present/total × 100 | **0** if no sessions |
| Assignment / exam analytics | Intelligence tabs | SPA | `assignments`, `exam_attempts` | rates from rows | 0 / [] |
| Question bank totals | Admin QB page | SPA `questionBank` (summary zeros in catalog JSON; intelligence may still cite coverage) | `questions` | count | **0** |
| At-risk students | InterventionCenter | SPA `students.riskSummary` / 5.9% engine default | attempts + attendance rules | count | **0** |
| Alerts | SPA dashboard.alerts (unused by Command Center; intelligence interventions include ₹4.7 Cr text) | SPA | derived from live exceptions | [] | **[]** |

**Do not hardcode zeros in JSX.** Calculate from records. Empty evidence → 0 / — / existing empty card.

---

## 7. Chart source map

Preserve chart shells (`ChartCard`, `AreaTrend`, `BarCompare`, `DonutChart`, dashboard visuals).

| Chart | Page | Current | Real source | Empty |
|-------|------|---------|-------------|-------|
| Enrollment trend | SPA dashboard (unused) / intelligence academic | SPA terms 8420→… | `COUNT(student_profiles)` by `admission_year` | `[]` |
| Department distribution | SPA | CSE 2480 etc. | profiles grouped by `department_id` | `[]` |
| Health pillars radar/bars | Command Center `HealthVisual` | SPA 87.9 pillars | engine on SQL | empty/0 |
| Department performance | `DepartmentPerformance` | SPA dept scores | SQL counts + pass/attendance when evidence exists | `[]` |
| Performance / at-risk trend | Intelligence | SPA | attempts over time | `[]` |
| Attendance trend / by dept | Intelligence | SPA | `attendance_records` | `[]` |
| Revenue monthly / fee collection | Revenue | SPA | invoices unused | `[]` |
| Placement salary / company | Outcomes tab / SPA | SPA | none | `[]` |
| Research grant trend | Research | SPA | `research_publications` dates | `[]` |
| Gender / retention / AI usage | SPA analytics | SPA | none or users | `[]` |

Inventing chart points is forbidden.

---

## 8. Intelligence source map

**Correct target architecture (not implemented):**

```
PostgreSQL (institution-scoped counts + records)
        ↓
Admin assembler (new; analogous to faculty_runtime / student_runtime)
        ↓
pure engines in src/intelligence/admin/engine (KEEP)
        ↓
derived snapshot
        ↓
existing Admin UI
```

**Today:**

```
admin-intelligence-summary.json (MIT-P)
        ↓
GET /admin-intelligence/summary  (no institution_id)
        ↓
useAdminIntelligence
        ↓
Dashboard / Workspace / Reports / AI Workspace
```

Frontend `computeAdminIntelligence` is **not** the HTTP path. Engines still:

- default-import `masterInstitutionProfile` (12480…)
- substitute missing inputs with 90, 89, 71.4, 92.4, 640, 1240, 5.9
- `buildInterventions` injects finance text when outstanding looks like `₹4.7 Cr`

`InstitutionHealthSnapshot` is unused.

Executive AI Workspace is labelled “Prototype Intelligence” and answers via `generateExecResponse(derived)` in the browser. `POST /v1/ai/executive/ask` exists (admin-only, writes `ai_traces`) but is unused. Copilot FAB on API failure uses `generateTutorReply` (FRONTEND_RUNTIME_FAKE) for non-students.

---

## 9. Mutation source map

**There are no Admin write APIs.** Every create/save/export is a fake success toast or localStorage.

| UI action | Page | What happens | Required |
|-----------|------|--------------|----------|
| Invite users | Users | toast “3 users will receive…” | POST users + `user_roles` or honest disable |
| Add student | Students | toast “Account created” | POST `users` + `student_profiles` |
| Invite faculty | Faculty | toast invitations sent | POST `users` + `faculty_profiles` |
| Create program / subject / batch / calendar event | Programs, Subjects, Batches, Calendar | toast created | POST catalog tables or disable |
| Create course export | Courses | toast xlsx | export from SQL or disable |
| Add question | QuestionBank | toast queued | Faculty bank APIs or disable |
| Create scholarship | Scholarships | toast committee | `scholarships` table unused — GAP or disable |
| CMS publish / announce | Cms | toast live | `cms_pages` unused — GAP or disable |
| Generate API key | ApiConfig | toast key | GAP or disable |
| Import / download template | DataTools | toast processing | GAP or disable |
| Save permissions | Permissions | toast audit trail | `role_permissions` unused |
| MFA / feature flags / Save all | Settings | toast live; flags held in React state only | PATCH `institutions.settings` / real flags |
| Guardrail toggle | AiConfig | toast | GAP or disable |
| Export audit CSV | AuditLogs | toast | SQL `audit_logs` + real file |
| Export revenue | Revenue | toast xlsx | GAP |
| Report save | Reports | `localStorage EduX_admin_report_library` | `generated_reports` + READY download |
| Report export/print | Reports | toast “simulated” | real bytes |
| Save AI insight / history | AI Workspace | `EduX_admin_ai_insights` / `EduX_admin_ai_history` | `ai_conversations` or labeled prototype |
| Support issue/feature | Support | toast local | `support_tickets` or disable |
| Message user | Users/Faculty/Students | toast compose | GAP |

---

## 10. KV usage

Admin has **no** `admin_settings` KV key.

| Key | Class | Allowed? |
|-----|-------|----------|
| `spa:admin-intelligence-summary` (and profile/datasets/derived) | operational snapshot served as truth | **No** — stop as runtime source |
| `spa:admin-catalog` | operational snapshot + empty fallback | **No** as operational source |
| UI theme / tokens (`EduX_theme`, access token) | preference / session | Yes |
| `EduX_admin_report_library` | operational report library in the browser | **No** |
| `EduX_admin_ai_history` / `EduX_admin_ai_insights` | operational AI state | **No** as system of record (prototype cache only if labeled) |

---

## 11. Hardcoded / mock / demo values (operational)

| Location | Value | Class |
|----------|-------|-------|
| SPA summary / master-profile | 12480, 640, 214, 8 depts, 71000 AI sessions, MIT-P, Pune | HARDCODED / SEEDED |
| SPA catalog dashboard | 12480, 640, 214, ₹48.2 Cr, enrollment 8420… | SEEDED |
| SPA revenue / placements / research | ₹86.4 Cr, 92.4%, 1240 pubs | SEEDED |
| `live_catalog.admin_dashboard` | `int(count) or spa_value` — **0 SQL keeps 12480** | FAKE FALLBACK |
| `Faculty.jsx` | `?? 640`, “8 departments”, chips CSE/ECE/… | HARDCODED |
| `Dashboard.jsx` description | Meridian Institute of Technology | HARDCODED |
| `AIWorkspace.jsx` | “Director.” | HARDCODED |
| `admin/engine/health.js` | fallbacks 90, 89, 71.4, 92.4, 640, 1240, 5.9 | HARDCODED OPERATIONAL inside KEEP engine |
| `index.js` `atRiskRate ?? 5.9`, outstanding `₹4.7 Cr` | fake interventions | HARDCODED |
| `Support.jsx` STATUS all Operational | HARDCODED | STATIC-looking ops |
| Copilot intro faculty “Dr. Krishnan” | faculty leftover in shared layout | HARDCODED (shared component) |
| Seed `ADMINS` Ananya Iyer | demo identity | SEEDED (optional flag) |
| Student list `dept` default `"CSE"`, program `"B.Tech CSE"`, status `"Good"` | `people_directory.admin_students_payload` | HARDCODED overlay |
| CGPA / attendance / internalMarks | `student_profiles.cgpa` + `extra` JSON from seed | SEEDED SCALARS not calculated |

Frontend dataset **shells are empty** (Phase 11). The live fake is **backend SPA**, not `src/datasets/admin`.

---

## 12. Institution isolation

Admin is **institution-scoped** by product (`user.institution_id`). Enforcement today:

| Path | Isolated? |
|------|-----------|
| JWT + `require_roles("admin")` | Yes (auth) |
| `admin_students_payload` / `admin_faculty_payload` | Yes (`institution_id`) |
| `live_catalog.admin_*` SQL branch | Yes |
| Empty SQL → `payload("admin-catalog")` | **No** — global MIT-P catalog |
| `/admin-intelligence/*` | **No** — global MIT-P intelligence |
| `admin_courses` enrollment `COUNT` | not filtered by institution (IDs are global UUIDs; low risk) |
| Frontend filters (dept chips) | display only; not a security boundary |

**Admin A / Institution A must not receive Institution B or MIT-P sample analytics.** Frontend filtering is not sufficient.

---

## 13. Empty-admin behavior (required vs today)

Institution with 0 students, 0 faculty, 0 courses, 0 departments, 0 attendance, 0 assignments, 0 exams:

| Surface | Required | Today |
|---------|----------|-------|
| Students page | `[]`, total 0 | SQL `[]` **honest** |
| Faculty page | `[]`, total 0 | SQL total 0 → **SPA facultyList (8 people)** |
| Users / depts / courses / programs / subjects / batches / calendar | `[]` | **SPA samples** (Aarav in users, CSE 2480…) |
| Command Center KPIs | 0 / — | **12480 / 640 / 87.9** |
| Charts | `[]` | SPA series |
| Interventions / alerts | `[]` | SPA / engine defaults |
| Reports | empty library | can still generate MIT-P preview docs |
| Question bank | 0 | SPA summary |

Preserve KPI/card/chart **shells**.

---

## 14. Frontend contract mismatches

| Page expects | API actually returns | Issue |
|--------------|----------------------|-------|
| Intelligence `derived.institutionHealth`, `totals`, `departments.list`, `students`, `reports` | Frozen SPA document with those keys | Shape matches; **values are fake** |
| Faculty row `courses`, `students`, `publications` | SQL `{id,name,email,dept,designation,status}` | fields **undefined** on live roster |
| Students `attendance` %, `internalMarks`, `status` Excellent/Good | extra JSON / cgpa scalar; default CSE | not calculated; defaults lie |
| Departments `placement` | SPA overlay on live dept | fake % on real row |
| Courses `passRate`, `faculty` | SPA overlay | fake |
| Programs `fee`, `intake`, `placements`, `accreditations` | SPA overlay | fake |
| Subjects `program`, `semester`, `credits`, `passRate`, `faculty` | SPA overlay | fake |
| Batches `coordinator` | always `None` on SQL | UI may show blank (honest) |
| Settings `institution`, `academics`, `features`, `security` | SPA MIT-P settings | not `institutions` row |
| Roles `members` counts | SPA | not `user_roles` counts |
| Question bank `questions[]` | SPA catalog (empty questions array in fixture) | not `questions` table |
| Report library items | localStorage | no GET |
| Executive chat | client engine | `POST /ai/executive/ask` unused |

---

## 15. Backend gap classification (no implementation)

| Capability | Class | Notes |
|------------|-------|-------|
| Student/faculty/user **counts** | **A** calculate from SQL | P0 |
| Department/program/course/subject/batch/calendar **lists** without SPA fallback | **B** reuse `live_catalog` minus `if not rows: payload` and minus extras merge | P0 |
| Attendance / assignment / exam Admin analytics | **A** from existing teaching/exam tables | P1 |
| Question bank Admin page | **B** reuse `list_question_bank` / `questions` | P1 |
| Admin research page | **B** reuse `research_publications` | P1 |
| Institution health score | **A** + engine KEEP; optional **B** persist `institution_health_snapshots` | P0 |
| Institution identity / academic year / attendance threshold | **B** `institutions` columns already exist | P0 |
| Roles list = SQL `roles` + member counts | **B** | P1 |
| Audit log read | **B** `AuditLog` unused — need **writes** on mutations first | P2 |
| User/student/faculty create, activate/deactivate | **C/E** no write API | P2 product |
| Catalog create (program/course/…) | **B/C** models exist; no Admin POST | P2 |
| Settings / feature flags persist | **B** `institutions.settings_json` + `PARENT_PORTAL_ENABLED` | P1 ops vs **F** UI prefs |
| Reports library / PDF | **B** `generated_reports` (Faculty pattern, READY-only) | P1 |
| Executive AI persistence | **B** `ai_conversations` / `ai_traces`; UI currently local | P2 |
| Scholarships / invoices / CMS / API keys / data import | **E** schema stubs, no ORM usage | empty until product |
| Placements / fee KPIs | **E** no live pipeline | empty cards |
| Permissions matrix | **E** `permissions` / `role_permissions` unused | static config or future |
| Duplicate Admin tables for students/courses | **F do not create** | reuse existing |

---

## 16. Problematic items (CURRENT → TARGET)

Format: CURRENT → TARGET → WHY → REQUIRED CHANGE → RISK

1. **`GET /admin-intelligence/summary` = MIT-P SPA** → institution-scoped assembler from SQL → KPIs/charts/intelligence are fake and leak MIT-P → new assembler; stop `payload("admin-intelligence-*")` as operational source; keep UI → **High** (every Admin executive screen).

2. **Empty catalog SQL → `admin-catalog` rows** → return `[]` → empty institution looks like 2480 CSE students → delete `if not rows: return payload` in `live_catalog.admin_*` and faculty empty fallback → **High**.

3. **Live rows merge SPA `placement` / `passRate` / `fee`** → omit or calculate → fake extras on real courses → stop `fixture.get(code)` overlays → **High**.

4. **`admin_dashboard`: `count or spa_value`** → always use count (0 is valid) → 0 students still 12480 → remove `or` → **High** (even though UI unused, endpoint lies).

5. **Engine numeric fallbacks** → return null/0 when inputs missing → empty DB still scores ~90 → change engines to require evidence; KEEP functions → **Medium** (must not break tests that pass fixtures).

6. **Toast-only mutations** → real POST or disabled + error → users believe students were created → no fake success → **Medium**.

7. **Report library localStorage** → `generated_reports` READY-only → refresh loses/fakes library → reuse Faculty report runtime → **Medium**.

8. **Hardcoded MIT-P / 640 / 8 departments / Director** in JSX → authenticated institution / counts → chrome lies after login → string replacements from API → **Low/Medium**.

9. **Admin QB/research/roles/audit from SPA** → existing SQL tables → wrong systems of record → wire GETs → **Medium**.

10. **Finance/placement SPA** → empty until tables filled → cannot invent ₹ Cr → keep cards, empty state → **Low**.

---

## 17. Recommended implementation order

Do **not** start until explicitly approved. Do **not** redesign UI. Do **not** touch Student/Faculty/exam spine except shared infrastructure if required.

**P0 — Stop lying**

1. Admin intelligence assembler from `user.institution_id` (counts, empty arrays, null health if no evidence).
2. Remove SPA fallbacks and extras overlays in `live_catalog` Admin serializers + faculty empty fallback.
3. Point Command Center / Institution Intelligence at assembler (same JSON shape the UI already reads, honest zeros).
4. Identity strings from `institutions` + `/auth/me`.
5. Prove: empty institution → 0 / `[]`; Institution A ↛ Institution B.

**P1 — Derive what SQL already has**

6. Attendance / assignment / exam / question / research Admin views from existing tables.
7. Settings GET from `institutions` (ops) vs harmless UI prefs.
8. Admin reports: generate/list/download via `generated_reports` READY-only (no fake PDF).
9. Roles GET from SQL `roles` + `user_roles` counts.

**P2 — Mutations and unused models**

10. Honest disable remaining toast mutations **or** implement POST with `audit_logs`.
11. Wire `POST /ai/executive/ask` or keep labeled prototype without localStorage as source of truth.
12. Support tickets optional via `support_tickets`.

**P3 — Genuine future (empty until then)**

13. Invoices, scholarships, CMS, placements, API keys, data import.

STOP after each approved slice. No Admin seed deletion in implementation until a later review.

---

## 18. What this audit did / did not do

| Done | Not done |
|------|----------|
| Mapped every Admin page, route, hook, API, SPA doc, KV/localStorage, KPI, chart, mutation | No code changes |
| Classified sources A–F | No migrations, DROP, TRUNCATE, DELETE |
| Documented isolation and empty-state failures | No seed removal |
| | No UI redesign |
| | No Phase 3 implementation |

Student and Faculty Phase 1/2/4 conclusions are unchanged.

---

## 19. Acceptance of this audit

- [x] Every Admin page mapped  
- [x] Every Admin API mapped  
- [x] Every Admin KPI sourced  
- [x] Every Admin chart sourced  
- [x] Intelligence datasets classified  
- [x] SPA snapshot dependencies listed  
- [x] Mock/hardcoded operational values listed  
- [x] KV classified  
- [x] Real SQL sources listed  
- [x] Missing capabilities classified A–F  
- [x] Institution isolation documented  
- [x] Empty-state documented  
- [x] Student/Faculty untouched  
- [x] No application code changed  
- [x] No database mutation / migration / seed deletion  

**STOP.** Wait for explicit approval before implementing Admin normalization.
