# EduX — Phase 0 Runtime Data Normalization Report

**Phase:** 0 (AUDIT ONLY)  
**Date:** 2026-08-29  
**Companion:** [`RUNTIME-DATA-NORMALIZATION-MASTER-AUDIT.md`](./RUNTIME-DATA-NORMALIZATION-MASTER-AUDIT.md)

No application code, UI, backend, seed scripts, migrations, or database data were modified. This report answers the sixteen required questions and records the recommended (not executed) Phase 1–3 plan.

---

## Executive finding

EduX is **not** a frontend mock app anymore.

The React tree is a **strict backend consumer**:

```
UI → src/services → axios request() → VITE_API_BASE_URL → FastAPI /v1 → PostgreSQL
```

There is no in-browser prototype router, no `VITE_USE_MOCK`, and no production path that reads `src/datasets/platform/users.js` for login.

**The remaining fabricated operational state has moved to the backend** (SPA JSON documents in `app_kv`, demo seed scalars, empty-SQL fallbacks) **and to leftover frontend intelligence datasets** that still encode Aarav Sharma / Dr. Meera Krishnan / MIT-P history.

The product therefore *looks* like a fully populated university even when the logged-in user has no attendance, no assignments, and no attempts — because `GET /v1/intelligence/summary` returns a 440 KB frozen snapshot, and `live_catalog` returns SPA fixtures whenever SQL is empty.

That is the opposite of the target lifecycle:

```
REAL USER ACTION → REAL BACKEND → POSTGRESQL → REAL STATE → EXISTING UI
```

---

## 1. Where does runtime data currently come from?

Four layers, in order of what the UI actually shows:

### A. Live PostgreSQL (real)

Used today for:

- Authentication (users, password hashes, JWT)
- Registration drafts + new student profiles
- Faculty/admin people directories (students, faculty, users, batches)
- Question bank GET + AI generation persistence
- Paper create / duplicate / archive / publish
- Student exam list / start / submit / server-side scoring
- Exam attempts and per-question attempts
- Support tickets, newsletter, contact
- Faculty assignment **list** and attendance **list** (seeded rows, but queried live)
- DNA snapshot table (written by worker; dashboard does not consume it)

### B. Backend-seeded SPA documents (`app_kv` keys `spa:*`)

Copied from `backend/app/data/spa/*.json` on boot. This is the **canonical feed** for:

- Student Command Center and almost all student academic pages (`/v1/intelligence/summary`)
- Faculty Command Center / teaching / reports (`/v1/faculty-intelligence/summary`)
- Admin Command Center / institution intelligence (`/v1/admin-intelligence/summary`)
- PYQ, Question Studio sources, AI copilot/learning-path, parent portal, leftover student GETs

Example frozen values: student CGPA **8.72**, attendance **92.4%**, streak **12**, academic health **89.4**; admin students **12,480**, health **87.9**.

### C. Demo seed scalars (`SEED_DEMO_USERS=true`)

~126 students, faculty, 8 assignments, 4 attendance sessions, courses CS501–CS506. CGPA and attendance are **stored numbers**, not calculated from records.

### D. Frontend leftovers

- `src/intelligence/datasets/**` and master profiles still contain the full Aarav/Meera/MIT-P operational story.
- Chat: `generateTutorReply` if the AI API fails.
- Assignment submit/create/grade: toast-only.
- Admin report library / AI history: localStorage.

Landing marketing (`src/datasets/platform/content.js`) is separate and legitimate.

---

## 2. Which data is genuinely fake?

**Frontend-runtime fake (user thinks it persisted):**

- Student assignment submit (`toast.success`, no POST)
- Faculty “Create assignment” / “Grade” toasts
- Faculty paper share status `"Sent (prototype)"`
- Question Studio approve message “added to the Question Bank” with no `Question` insert
- AI Tutor / Copilot / Teaching Assistant silent `generateTutorReply` fallback
- Admin report library and AI chat history in localStorage
- Hardcoded register OTP `482193` returned as `demoOtp`
- Hardcoded JSX nits (`?? 71` ML progress, `Sem 5 · 6 courses`, leave count `+ 4`)

**Backend-presented as live, actually a prototype snapshot:**

- Entire student intelligence datasets/derived (attendance calendar, assignments, DNA, readiness, recommendations, portfolio, daily brief, study hours)
- Faculty dashboard teaching health, AI brief, timeline, pending tasks, course progress (question-bank *count* is the exception)
- Admin institutional totals 12,480 / 640 / 214 and ₹48.2 Cr fee KPI
- SPA PYQ corpus, Question Studio source catalog, AI learning-path, forum topics, mock-test list, admit card, exam-analysis sample papers
- Student 360 non-attempt panels (Aarav template)

**Empty-SQL fallbacks that re-fake a blank database:**

- `live_catalog.py`: `if not rows: return payload(...)`
- `admin_dashboard`: `int(student_n) or kpis[0]["value"]` keeps 12,480 when count is 0
- Exam analysis: live attempts **concatenated with** SPA sample options
- AI tutor threads: SPA threads if the user has no conversations

---

## 3. Which data is backend-seeded?

| Seed | What it creates | Used as |
|------|-----------------|---------|
| `seed.py` + `demo_catalog.py` | Institution MIT-P, roles, 8 depts, batches, faculty, admins, **126 students**, parents | Login roster; CGPA/attendance scalars |
| `seed_academic.py` | Courses, 8 assignments + Aarav submissions, 4 attendance sessions, tickets, calendar, announcements | Live list endpoints |
| `seed_spa_documents` | All `backend/app/data/spa/*.json` → `app_kv` | Intelligence snapshots and leftover GETs |
| `scripts/create_dev_accounts.py` | `student@edux.dev` / `faculty@edux.dev` / `admin@edux.dev` in a separate institution | Local login only |

`seed_academic.parse_exam_agent()` points at `frontend/src/mock-data/exam-agent.js`, which is **not in this repository**, so exam-agent paper import is a no-op on a fresh boot. Published papers then come only from faculty create/publish (or leftover DB state).

Student profile extra JSON still hard-sets Aarav attendance 92.4 and 277/300 classes.

---

## 4. Which data is hardcoded operational data?

- Register OTP `"482193"` in `backend/app/api/v1/auth.py`
- `DEMO_PASSWORD` / `SEED_DEMO_USERS` in `backend/.env.example`
- AiGateway deterministic strings when `OPENAI_API_KEY` is empty
- `generateTutorReply` topic scripts
- Faculty share `"Sent (prototype)"`
- Faculty report `"size": "1.2 MB", "pages": 8`
- Attendance threshold 75% (also an institution column — legitimate policy default)
- Student dashboard fallback `71%` for CS505, Academics badge “6 courses”
- Landing HERO_METRICS (2.4M learners) — **marketing, not operational** (keep)

---

## 5. Which data is already real?

Working **user action → SQL → later read** paths:

1. Login / JWT / me
2. Register (user + student_profile row; snapshot still fake)
3. Faculty question generation → `questions`
4. Faculty paper CRUD + **publish** → `papers` / `paper_questions`
5. Student published exam list (no answer keys)
6. Exam start (`exam_sittings`) / submit / **server score** (`exam_attempts`, `exam_question_attempts`)
7. Faculty My Students directory (identity + attempt accuracy)
8. Faculty attempt analysis from a real attempt
9. Question bank GET (empty bank → empty list, not a fake bank)
10. Support tickets GET/POST
11. Newsletter + contact inserts
12. Faculty assignments GET and attendance GET (against seeded-or-live rows)
13. Calendar events GET when rows exist
14. Admin students/users/departments/courses/programs/batches GET when rows exist (extras still SPA)

These must be **preserved**, not replaced with zeros.

---

## 6. Which data is static and should remain?

- Landing page content, mega menus, FAQs, pricing, blog, careers, case studies, testimonials, `HERO_METRICS`, `PLATFORM_STATS`, `CONTACT_INFO`
- `NAV_GROUPS`, `ROLE_LABELS`, `ROLE_HOME`, feature flags
- Exam Agent **labels/types** (`EXAM_AGENT_GROUP_LABELS`)
- Paper generator **option lists** (exam modes, types, negative marking choices)
- PYQ **filter taxonomy** (not the fake corpus)
- Question type / difficulty / domain / examFamily contracts
- Report **templates** (include-lists)
- Theme, z-index, empty-state UI, chart wrappers
- Validators and filter-cascade utilities
- Documentation

Do not delete these because they contain numbers or arrays.

---

## 7. Which intelligence engines should remain?

Keep all of them. They are application logic, not mock data.

**Student:** academic health, DNA, readiness (university vs JEE/NEET isolation), university/competitive engines, progress report, canonical `ExamAttempt` / `QuestionAttempt` contracts, exam-agent live stats and report, attempt-intelligence evidence.

**Faculty:** student-360, similar-issues, intervention lifecycle, attendance/assignment/assessment engines, dashboard assembler, question-studio/micro-assessment engines.

**Admin:** institution health, department rollup, assessment/student engines, executive report builders.

**Backend:** `rebuild_student_dna` (rule-based). LLMs must not write canonical scores (already documented in `AiGateway`).

Phase 1–3 should **feed engines with SQL records**. If inputs are empty, engines should produce empty/zero derived objects — not be deleted.

---

## 8. Which UI/KPI components depend on fake data?

**Keep the components. Change the source.**

| UI | Fake dependency |
|----|-----------------|
| Student Dashboard StatCards | CGPA, attendance, pending assignments, streak |
| Success Center / Daily Brief / Interventions / Journey | derived snapshot |
| Study activity bar chart, subject mastery ring, course progress | snapshot |
| Attendance rings, calendar, trend, by-subject, history | snapshot 92.4% / 300 classes |
| Assignments cards + progress + AI draft | snapshot; submit fake |
| Academics overview stats, resources, syllabus progress | snapshot |
| Performance & AI (overview, analytics, DNA, health, recommendations, reports) | snapshot |
| Portfolio, Progress Report, Mentor resources/notes/history | snapshot |
| Exam Analysis sample papers / hero 182/300 | SPA variants |
| Faculty Success Center, AI Brief, schedule, timeline, tasks, course progress, attention | snapshot (QB count live) |
| Assessment Intelligence coverage / PYQ trends | SPA + faculty datasets |
| Admin Command Center health 87.9, 12,480 students, fee ₹48.2 Cr, dept placement | snapshot |
| Institution Intelligence all tabs | snapshot |
| Admin analytics/revenue/research/scholarships pages | SPA catalog |

Exam Agent live/report and Faculty assignment/attendance **list** charts are the main honest visualizations today.

---

## 9. Which backend APIs already exist?

Routers under `/v1`: `auth`, `platform`, `student`, `faculty`, `admin`, `parent` (flagged off), `ai`.

Notable **existing** surfaces:

- Auth: login, me, refresh, register, OTP, profile-setup, logout, registration options
- Student intelligence: `/intelligence/{profile,summary,datasets,derived,exam-dna-signals,exam-attempts}`
- Student academics leftover GETs: dashboard, attendance, assignments, courses, subjects, events, programs, forum, support, settings, mentor, exam-analysis, mock-tests, exams, exam-agent
- Faculty intelligence + students + question-bank + generate + paper-generator CRUD/publish/share + PYQ + question-studio + interventions + reports + attendance/assignments GET
- Admin intelligence + people/catalog GETs + SPA analytics GETs
- AI mentor/tutor/assistant/executive/question-studio/teaching-studio + SPA GETs

See the master audit table for the model behind each.

---

## 10. Which PostgreSQL tables provide the data?

**In use now:**  
`institutions`, `roles`, `users`, `user_roles`, `otp_challenges`, `registration_drafts`, `student_profiles`, `faculty_profiles`, `enrollments`, `guardians`, `guardian_students`, `departments`, `programs`, `subjects`, `courses`, `chapters`, `topics`, `academic_terms`, `batches`, `campuses`, `calendar_events`, `attendance_sessions`, `attendance_records`, `assignments`, `assignment_submissions`, `announcements`, `questions`, `papers`, `paper_questions`, `question_generations`, `question_generation_items`, `exam_sittings`, `exam_attempts`, `exam_question_attempts`, `student_dna_snapshots`, `support_tickets`, `app_kv`, `newsletter_subscribers`, `contact_inquiries`, `ai_conversations`, `ai_messages`, `ai_traces`.

**Exist in ORM but not the operational UI path:**  
`institution_health_snapshots`, `issue_groups`, `interventions`, `content_sources`, `question_studio_sessions`, `auth_sessions` (logout does not revoke), `audit_logs`.

**In `schema.sql` only (no runtime model usage):**  
timetable_slots, quizzes, paper_shares, forum_*, invoices, scholarships, notifications, generated_reports, cms_pages, blog_posts, permissions, …

**PostgreSQL config source of truth:** `backend/.env.example` (`DATABASE_URL`, `DB_SCHEMA=edux`). Do not put credentials in the frontend.

---

## 11. Which features have backend gaps?

From this audit + `docs/PHASE-F-BACKEND-GAP-REGISTER.md`:

| Gap | Detail |
|-----|--------|
| GAP-13 | **No** `/faculty/micro-assessments/*` or `/student/micro-assessments/*` |
| GAP-14 | Question Studio approve does not insert `questions` |
| GAP-01 | Register UI gender/DOB not persisted |
| GAP-11 | Logout does not revoke JWT / `auth_sessions` |
| — | **No POST** faculty assignment create / grade / publish |
| — | **No POST** student assignment submit |
| — | **No POST** faculty mark attendance |
| — | **No admin write** APIs for people/catalog |
| — | Interventions/issue groups live in `app_kv`, not SQL models |
| — | Paper share is KV prototype, not `paper_shares` / publish |
| — | Forum, scholarships, CMS, revenue, placements: GET SPA only |
| — | Intelligence snapshots are not rebuilt from attempts |
| — | Student 360 uses Aarav JSON template |
| — | Timetable / quiz builder / exam builder: SPA only |
| — | `generationStatus` on papers (UI fail-closed for Send) |

Frontend already fail-closes several of these (empty/error, no fake paper). Assignment toasts are the opposite: they **fake success**.

---

## 12. Which user-action lifecycles are already working?

- Student/faculty/admin **login**
- **Register** → user + student_profile (intelligence still fake)
- Faculty **AI question generate** → PostgreSQL questions
- Faculty **paper create** from `selectedQuestionIds` → SQL
- Faculty **paper publish** → student exam list
- Student **start exam** → sitting
- Student **submit exam** → server score → attempt rows
- Faculty **view student attempts / analysis**
- Support ticket create
- Contact / newsletter
- Settings PATCH (KV)

---

## 13. Which user-action lifecycles are broken / partial / fake?

| Lifecycle | Mark |
|-----------|------|
| Faculty create assignment → student sees it | FAKE (toast) / student page ignores live GET |
| Student submit assignment → faculty status | FAKE |
| Faculty grade assignment | FAKE |
| Faculty share/send paper → student | FAKE (KV prototype); publish path WORKS if they use Publish |
| Question Studio approve → bank | BACKEND GAP |
| Micro-assessment assign → student attempt | BACKEND GAP |
| Exam submit → dashboard KPI / DNA cards | PARTIAL (attempt saved; snapshot unchanged) |
| Attendance mark → student attendance % | BACKEND GAP (no mark API); student page ignores records |
| New student dashboard | PARTIAL (own name, Aarav datasets) |
| Logout | PARTIAL (client clear only) |
| Admin KPI after enrolling a student | FAKE (still 12,480) |

---

## 14. What should be normalized in Student Phase? (Phase 1 — do not execute)

1. Rebuild `/intelligence/summary` **per logged-in student** from SQL. Empty DB → empty datasets and calculated zeros. Keep every KPI card and chart.
2. Delete SPA concatenation on exam-analysis options; live attempts only.
3. Point Assignments / Attendance / Academics / Calendar at live catalog endpoints **after** those endpoints stop falling back to `student-portal`.
4. Implement assignment submit → `assignment_submissions`.
5. CGPA from graded records or `—`/0; attendance from `attendance_records`.
6. Run existing DNA/readiness/progress-report engines on real attempts; call `rebuild_student_dna` on submit.
7. Mock tests = published mock papers or [].
8. Mentor history from `ai_conversations` or empty; stop silent tutor fallback (or label it prototype).
9. Do **not** import `src/intelligence/datasets/**` as a UI fallback.
10. Do **not** hardcode `const attendance = 0`.

---

## 15. What should be normalized in Faculty Phase? (Phase 2 — do not execute)

1. Faculty intelligence snapshot from SQL (directory, attendance, assignments, questions, papers, attempts).
2. Assignment create / send / grade APIs; student list must move.
3. Mark-attendance API; student attendance must move.
4. Studio approve → `questions` insert.
5. Real paper share or use publish; drop prototype KV.
6. PYQ/coverage from `questions`; empty → 0.
7. Student 360 without Aarav template.
8. Interventions on SQL models.
9. Micro-assessments API if in product scope.
10. Remove `faculty-workspace` SPA fallbacks.

---

## 16. What should be normalized in Admin Phase? (Phase 3 — do not execute)

1. Command Center counts from `count(*)` on real tables (126 seeded students today, **not** 12,480). Zero rows → 0.
2. Remove `or kpis[0].value` SPA fallback.
3. Institution health engine → `institution_health_snapshots`.
4. Question/exam/assignment/attendance analytics from SQL.
5. Keep finance/placement cards; values empty until those domains exist.
6. Admin question bank from `questions`.
7. Optional catalog write APIs.
8. Report library: SQL or clearly labeled local export.

---

## Answers in one page

| # | Question | Short answer |
|---|----------|--------------|
| 1 | Where does runtime data come from? | Axios → FastAPI. Dashboards read SPA snapshots in `app_kv`. Some lists/exams/questions hit SQL. |
| 2 | Genuinely fake? | Toasts, tutor fallback, share prototype, SPA snapshots, empty-SQL fallbacks, leftover intelligence datasets. |
| 3 | Backend-seeded? | 126 demo students, assignments, attendance sessions, all `spa:*.json` documents. |
| 4 | Hardcoded operational? | OTP 482193, demo password flag, AI fallback strings, a few JSX defaults. |
| 5 | Already real? | Auth, question gen, papers+publish, exam sit/score, directories, support, contact. |
| 6 | Static remain? | Landing, nav, labels, taxonomy, report templates, theme. |
| 7 | Engines remain? | All student/faculty/admin engines + attempt contracts + `rebuild_student_dna`. |
| 8 | KPI UI on fake data? | Almost all student/faculty/admin command-center cards and charts. **Keep UI.** |
| 9 | APIs exist? | Broad `/v1` coverage; several mutations missing (see §11). |
| 10 | Tables? | Full academic/exam/identity set in `edux` schema; `app_kv` holds snapshots. |
| 11 | Backend gaps? | Micro-assessments, assignment write, attendance mark, studio→bank, admin writes, snapshot rebuild. |
| 12 | Lifecycles working? | Login, register row, generate questions, paper publish, exam attempt/score, support. |
| 13 | Broken/partial? | Assignments end-to-end, dashboard KPIs, 360 template, share, studio approve, micro-assessments. |
| 14 | Student phase? | Per-user SQL snapshot; attendance/assignments/exams from tables; engines on real attempts. |
| 15 | Faculty phase? | Live teaching KPIs; assignment/attendance writes; studio→questions; 360 without Aarav. |
| 16 | Admin phase? | Real counts (not 12,480); health from aggregates; drop SPA catalog fallbacks. |

---

## Final rule (unchanged)

The goal is **not** “replace fake data with zeros.”

The goal is **replace fake runtime state with database-driven state**, including the honest empty state when the database has no rows.

Phase 0 stops here. No normalization was implemented.

**Next separately approved step:** PHASE 1 — COMPLETE STUDENT RUNTIME DATA NORMALIZATION.
