# EduX — Runtime Data Normalization Master Audit

**Phase:** 1 Student, 2/4 Faculty, and 3 Admin runtimes are SQL-assembled.  
**Branch:** `arena/01a04f10-edux`  
**Date:** 2026-08-30  
**Status:** Phase 1 Student and Phase 2 Faculty runtimes are SQL-assembled. Phase 4 close-out completed Faculty remaining KV. **Phase 3 Admin runtime** is implemented — see [`PHASE-3-ADMIN-RUNTIME-DATA-NORMALIZATION-REPORT.md`](./PHASE-3-ADMIN-RUNTIME-DATA-NORMALIZATION-REPORT.md). The earlier read-only map remains in [`PHASE-3-ADMIN-RUNTIME-AUDIT.md`](./PHASE-3-ADMIN-RUNTIME-AUDIT.md). Verification is sqlite + `npm test` + `npm run build` — **not live PostgreSQL**. See also [`PHASE-4-MISSING-BACKEND-CAPABILITIES-REPORT.md`](./PHASE-4-MISSING-BACKEND-CAPABILITIES-REPORT.md), [`PHASE-1-STUDENT-RUNTIME-DATA-NORMALIZATION-REPORT.md`](./PHASE-1-STUDENT-RUNTIME-DATA-NORMALIZATION-REPORT.md) and [`PHASE-2-FACULTY-RUNTIME-DATA-NORMALIZATION-REPORT.md`](./PHASE-2-FACULTY-RUNTIME-DATA-NORMALIZATION-REPORT.md).

Phase 0 inventory below is historical. Student and Faculty rows marked **NORMALIZE** in §2 are now **LIVE** unless noted as BACKEND GAP. Admin rows below are the post-Phase-3 state.

This document is the inventory used to execute:

- Phase 1 → Student runtime data normalization  
- Phase 2 → Faculty runtime data normalization  
- Phase 3 → Admin runtime data normalization  

**Do not treat this as a “delete mock files” list.** The target is:

```
USER ACTION → FRONTEND → REAL API → BACKEND → POSTGRESQL → REAL DATA → FRONTEND STATE → UI / KPI / CHART / PROGRESS
```

If a table is empty, the UI must show the existing empty state (or a true zero calculated from empty records). It must not fall back to a prototype snapshot.

---

## 0. How to read this audit

### Classification (exactly one per row)

| Type | Meaning |
|------|---------|
| **REAL_BACKEND** | Runtime value is produced by a live FastAPI handler from PostgreSQL rows that change when users act. |
| **FRONTEND_RUNTIME_FAKE** | The React app still fabricates operational state (toast-only mutations, client fallback replies, leftover intelligence datasets). |
| **BACKEND_SEEDED** | Postgres / `app_kv` holds a frozen prototype snapshot (SPA JSON, demo roster, seeded CGPA/attendance) and the API serves it as if it were live operational data. |
| **HARD_CODED_OPERATIONAL** | Business numbers or OTP/demo codes compiled into backend or frontend code. |
| **STATIC_UI_CONFIGURATION** | Labels, navigation, icons, taxonomy, option lists, marketing copy. Must remain. |
| **INTELLIGENCE_ENGINE** | Deterministic scoring / DNA / readiness / report / attempt-contract logic. Must remain. Must be fed real records later. |
| **TEST_FIXTURE** | Isolated under `tests/` or `backend/test/`. Must remain. |
| **BACKEND_GAP** | Frontend calls an endpoint or mutation that does not exist, or the SQL model exists but is unused. |
| **UNKNOWN** | Could not prove the live source without executing the stack. |

### Runtime status

| Status | Meaning |
|--------|---------|
| **LIVE** | User action persists to SQL and later reads reflect it. |
| **SEEDED_SNAPSHOT** | API returns a frozen document; user actions do not recompute it. |
| **MIXED** | Some fields live, some snapshot, often with snapshot fallback when SQL is empty. |
| **FAKE_UI** | UI pretends the action succeeded (toast) without a backend write. |
| **EMPTY_ON_MISS** | Frontend correctly shows loading/empty/error if the backend fails. |
| **KEEP** | Static / engine / fixture — not a normalization target. |
| **GAP** | Missing backend surface. |

### Required action (Phase 1–3, not Phase 0)

| Action | Meaning |
|--------|---------|
| **KEEP** | Do not delete. |
| **NORMALIZE** | Keep the UI. Replace the value source with real DB-driven calculation. Empty DB → real zero / empty state. |
| **WIRE** | Backend model exists; connect create/update/read to it. |
| **BUILD** | Backend surface is missing. |
| **REMOVE_FALLBACK** | Stop serving SPA JSON / `or mock` when SQL is empty. |
| **DO_NOT_ZERO_HARDCODE** | Never replace a KPI card with `const x = 0`. Calculate from records. |

---

## 1. Repository architecture (current)

```
React UI (src/pages, src/components)
    ↓ TanStack Query hooks (src/services/*)
    ↓ request() / axios (src/api/client.js, src/api/axios.js)
    ↓ VITE_API_BASE_URL  (default https://api.medixoedux.edu/v1)
    ↓ FastAPI  /v1  (backend/app/api/v1/{auth,student,faculty,admin,ai,platform,parent}.py)
         ├─ REAL SQL  (SQLAlchemy models → PostgreSQL schema `edux`)
         ├─ SPA DOCUMENTS  (backend/app/data/spa/*.json → app_kv keys spa:*)
         ├─ DEMO SEED     (seed.py + demo_catalog.py + seed_academic.py)
         └─ KV MUTATIONS  (app_kv collections: interventions, papers shares, reports, studio sessions)
```

**Frontend is a strict HTTP consumer.** There is no in-browser prototype router. `USE_MOCK_API` / `VITE_USE_MOCK` are gone. Production `src/api` exposes only axios + `request()`.

**The remaining fake operational state lives mainly on the backend** (SPA snapshots + demo seed + empty-SQL fallbacks) **plus leftover frontend intelligence datasets** that are still full of Aarav / Meera / MIT-P numbers, even though dashboards currently fetch the backend snapshot.

### PostgreSQL configuration (source of truth)

Documented only in `backend/.env.example`. Do **not** put credentials in frontend config.

```
DATABASE_URL=postgresql+psycopg2://medixo:medixo@localhost:5432/medixo_edux
DB_SCHEMA=edux
SEED_DEMO_USERS=true
DEMO_PASSWORD=aurora123
```

`backend/app/core/config.py` defaults `database_url` to `postgresql+psycopg2://postgres:postgres@localhost:5432/medixo_edux` if env is missing. SQLite `sqlite:///./medixo.db` is documented as a local fallback. Schema bootstrap is additive (`ensure_schema()` + `Base.metadata.create_all`). Seed runs on API boot when `SEED_DEMO_USERS=true`.

Frontend `APP_CONFIG.API_BASE_URL` is `import.meta.env.VITE_API_BASE_URL || 'https://api.medixoedux.edu/v1'`. No database URL exists in the frontend.

---

## 2. Master runtime data map

| Area | Feature | Current Source | Type | Backend Endpoint | Backend Model | DB Table | Runtime Status | Required Action |
|------|---------|----------------|------|------------------|---------------|----------|----------------|-----------------|
| Auth | Login | FastAPI authenticate against `users.password_hash` | REAL_BACKEND | `POST /v1/auth/login` | User | users | LIVE | KEEP |
| Auth | Session tokens | JWT + localStorage `EduX_access_token` / refresh / user | REAL_BACKEND | `POST /v1/auth/refresh`, `POST /v1/auth/logout` | AuthSession (unused on logout) | auth_sessions | MIXED — logout does not revoke JWT | NORMALIZE (revoke sessions) |
| Auth | Current user | `GET /v1/auth/me` + localStorage `EduX_user` | REAL_BACKEND | `GET /v1/auth/me` | User, StudentProfile, FacultyProfile | users, student_profiles, faculty_profiles | LIVE | KEEP |
| Auth | Registration | Creates `registration_drafts` + user + student_profile | REAL_BACKEND | `POST /v1/auth/register`, `POST /v1/auth/register/verify` | RegistrationDraft, User, StudentProfile | registration_drafts, users, student_profiles | MIXED — OTP hardcoded `482193`; new student still sees Aarav intelligence snapshot | NORMALIZE |
| Auth | Registration options | live_catalog + SPA `registration-options.json` | MIXED | `GET /v1/auth/registration/options` | Institution, Program, Department | institutions, programs, departments | MIXED | NORMALIZE |
| Auth | Forgot / reset / verify OTP | OTP rows in DB | REAL_BACKEND | `/v1/auth/forgot-password`, `/verify-otp`, `/resend-otp`, `/reset-password`, `/verify-email` | OtpChallenge | otp_challenges | LIVE (demo OTP still returned on register) | NORMALIZE |
| Auth | Demo users seed | `seed.py` + `demo_catalog.py` — 126 students, faculty, admins, parents | BACKEND_SEEDED | boot `seed_if_empty` | User, StudentProfile, FacultyProfile, Guardian | users, student_profiles, faculty_profiles, guardian_students | SEEDED_SNAPSHOT | NORMALIZE (keep as optional demo flag; do not serve as production KPIs) |
| Auth | Local dev accounts | `scripts/create_dev_accounts.py` (`student@edux.dev` etc.) | BACKEND_SEEDED | n/a (script) | User | users | KEEP for local only | KEEP |
| Platform | Landing marketing | `src/datasets/platform/content.js` imported by landing pages | STATIC_UI_CONFIGURATION | optional `/v1/platform/*` exists but landing does not use it for hero/nav | — | — | KEEP | KEEP |
| Platform | Newsletter / contact | SQL insert | REAL_BACKEND | `POST /v1/platform/newsletter`, `POST /v1/platform/contact` | NewsletterSubscriber, ContactInquiry | newsletter_subscribers, contact_inquiries | LIVE | KEEP |
| Platform | Platform site JSON | SPA `platform.json` in `app_kv` | BACKEND_SEEDED | `GET /v1/platform/{site,testimonials,pricing,faqs,blog,careers,case-studies,stats,contact}` | AppKv | app_kv | SEEDED_SNAPSHOT | KEEP as CMS later; not operational KPIs |
| Student | Intelligence snapshot (canonical UI feed) | `student_runtime.assemble_student_intelligence` from SQL | REAL_BACKEND | `GET /v1/intelligence/summary` | StudentProfile, Enrollment, Assignment, AttendanceRecord, ExamAttempt, StudentDnaSnapshot | student_profiles, enrollments, assignments, attendance_records, exam_attempts, student_dna_snapshots | LIVE — empty DB → empty/zero/`null` CGPA; no Aarav overlay | KEEP (Phase 1 done) |
| Student | Master profile | `student_runtime.build_profile` — identity SQL; CGPA/attendance calculated | REAL_BACKEND | `GET /v1/intelligence/profile`, `GET /v1/student/profile` | StudentProfile, User | student_profiles, users | LIVE — CGPA null if no graded university work | KEEP (Phase 1 done) |
| Student | Intelligence datasets / derived endpoints | Same assembler | REAL_BACKEND | `GET /v1/intelligence/datasets`, `/derived` | — | — | LIVE | KEEP (Phase 1 done) |
| Student | Dashboard KPIs (CGPA, attendance %, pending assignments, streak) | `useStudentIntelligence` → assembler | REAL_BACKEND | `/v1/intelligence/summary` | — | — | LIVE (CGPA —, attendance 0 from 0 records, streak 0 until study log) | KEEP (Phase 1 done) |
| Student | Academic health / DNA / readiness / recommendations / journey | summary.derived (frozen scores e.g. health 89.4) | BACKEND_SEEDED | `/v1/intelligence/summary` | StudentDnaSnapshot exists but is not the dashboard source | student_dna_snapshots | SEEDED_SNAPSHOT | NORMALIZE — run engines on real attempts/attendance |
| Student | Today’s schedule | snapshot `datasets.todaySchedule` | BACKEND_SEEDED | `/v1/intelligence/summary` | no timetable model used | timetable_slots (schema only) | SEEDED_SNAPSHOT | NORMALIZE / BUILD |
| Student | Study activity chart / subject mastery rings | snapshot weeklyActivity + derived.subjectMasteryRanking | BACKEND_SEEDED | `/v1/intelligence/summary` | — | — | SEEDED_SNAPSHOT | NORMALIZE |
| Student | Course progress bars | derived.university.courses[].progress | BACKEND_SEEDED | `/v1/intelligence/summary` | Enrollment, Course | enrollments, courses | SEEDED_SNAPSHOT (not from enrollments) | NORMALIZE |
| Student | Assignments page | intelligence `derived.university.assignments.items` from assembler | REAL_BACKEND | `/v1/intelligence/summary` | Assignment, AssignmentSubmission | assignments, assignment_submissions | LIVE — enrolled courses only | KEEP (Phase 1 done) |
| Student | Assignment list API | `student_runtime.list_student_assignments` (no SPA fallback) | REAL_BACKEND | `GET /v1/student/assignments` | Assignment, AssignmentSubmission | assignments, assignment_submissions | LIVE — empty SQL → [] | KEEP (Phase 1 done) |
| Student | Assignment submit | `POST /student/assignments/{id}/submit` | REAL_BACKEND | `POST /v1/student/assignments/{id}/submit` | AssignmentSubmission | assignment_submissions | LIVE | KEEP (Phase 1 done) |
| Student | Attendance page (ring, calendar, trend, by-subject, history) | intelligence `derived.university.attendance` | BACKEND_SEEDED | `/v1/intelligence/summary` | AttendanceSession/Record exist | attendance_sessions, attendance_records | SEEDED_SNAPSHOT (92.4%, 300 classes) | NORMALIZE from records |
| Student | Attendance API (unused by page) | SPA `student-portal.attendance` | BACKEND_SEEDED | `GET /v1/student/attendance` | — | — | SEEDED_SNAPSHOT | REMOVE_FALLBACK; compute from attendance_records |
| Student | Academics / Courses / Subjects / Resources / Progress | intelligence university slice | BACKEND_SEEDED | `/v1/intelligence/summary` | Course, Enrollment, Subject | courses, enrollments, subjects | SEEDED_SNAPSHOT | NORMALIZE |
| Student | Course detail | intelligence courses + hardcoded lesson modules in frontend dataset (if engine used); page uses snapshot | BACKEND_SEEDED | `/v1/intelligence/summary` (page); `GET /v1/student/courses/{id}` still SPA | Course | courses | SEEDED_SNAPSHOT | NORMALIZE |
| Student | Live courses API | live_catalog.student_courses, **merges SPA course extras**; empty enrollments → SPA courses | MIXED | `GET /v1/student/courses` | Enrollment, Course | enrollments, courses | MIXED | REMOVE_FALLBACK |
| Student | Programs | SPA `student-portal.programs` | BACKEND_SEEDED | `GET /v1/student/programs` | Program | programs | SEEDED_SNAPSHOT | NORMALIZE from programs + enrollments |
| Student | Calendar | intelligence events | BACKEND_SEEDED | `/v1/intelligence/summary` | CalendarEvent | calendar_events | SEEDED_SNAPSHOT | NORMALIZE |
| Student | Events API | live_catalog.student_events, empty → SPA events | MIXED | `GET /v1/student/events` | CalendarEvent | calendar_events | MIXED | REMOVE_FALLBACK |
| Student | Examinations hub | `useStudentExams` → published SQL papers | REAL_BACKEND | `GET /v1/student/exams`, `GET /v1/student/exams/{id}`, `POST .../start`, `POST .../submit` | Paper, ExamSitting, ExamAttempt | papers, exam_sittings, exam_attempts | LIVE when papers published | KEEP |
| Student | Mock tests | SPA `student-portal.mockTests` | BACKEND_SEEDED | `GET /v1/student/mock-tests` | — | — | SEEDED_SNAPSHOT | NORMALIZE (published papers of type mock, or empty) |
| Student | Exam Agent exams | `list_published_exams` SQL | REAL_BACKEND | `GET /v1/student/exam-agent/exams` | Paper, PaperQuestion, Question | papers, paper_questions, questions | LIVE | KEEP |
| Student | Exam Agent attempt / submit / score | SQL sitting + server scorer | REAL_BACKEND | `POST /v1/student/exam-agent/attempts`, `GET .../attempts`, `GET .../attempts/{id}` | ExamAttempt, ExamQuestionAttempt | exam_attempts, exam_question_attempts | LIVE | KEEP |
| Student | Exam DNA signals | `StudentDnaSnapshot` rows | REAL_BACKEND | `GET /v1/intelligence/exam-dna-signals` | StudentDnaSnapshot | student_dna_snapshots | LIVE (empty until rebuild_student_dna runs) | WIRE worker on submit |
| Student | Canonical exam attempts | SQL attempts (demo excluded) | REAL_BACKEND | `GET /v1/intelligence/exam-attempts` | ExamAttempt | exam_attempts | LIVE | KEEP |
| Student | Exam analysis page | live attempts only; missing id 404 | REAL_BACKEND | `GET /v1/student/exam-analysis/options`, `GET /v1/student/exam-analysis/{id}` | ExamAttempt | exam_attempts | LIVE — no SPA samples | KEEP (Phase 1 done) |
| Student | Performance & AI workspace | intelligence snapshot | BACKEND_SEEDED | `/v1/intelligence/summary` | — | — | SEEDED_SNAPSHOT | NORMALIZE |
| Student | Progress report | `buildProgressReport` engine on snapshot | INTELLIGENCE_ENGINE + BACKEND_SEEDED | `/v1/intelligence/summary` | — | — | SEEDED_SNAPSHOT | KEEP engine; NORMALIZE inputs |
| Student | Portfolio / career | snapshot digitalPortfolio / careerProfile | BACKEND_SEEDED | `/v1/intelligence/summary` | — | — | SEEDED_SNAPSHOT | NORMALIZE |
| Student | Mentor workspace | SPA portal.mentor + intelligence datasets conversations/notes | BACKEND_SEEDED | `GET /v1/student/mentor/workspace` | AiConversation exists | ai_conversations | SEEDED_SNAPSHOT | NORMALIZE |
| Student | Mentor / tutor chat POST | AiGateway → OpenAI or deterministic fallback; messages stored | MIXED | `POST /v1/ai/mentor/chat`, `POST /v1/ai/tutor/respond` | AiConversation, AiMessage, AiTrace | ai_conversations, ai_messages, ai_traces | MIXED — prototype fallback if no key | KEEP storage; NORMALIZE replies when key set |
| Student | Tutor threads GET | SQL conversations **or** SPA `ai.tutorThreads` if none | MIXED | `GET /v1/ai/tutor/threads` | AiConversation | ai_conversations | MIXED | REMOVE_FALLBACK |
| Student | Copilot / learning path / graph / stats | SPA `ai.json` | BACKEND_SEEDED | `/v1/ai/copilot/suggestions`, `/learning-path`, `/graph-search`, `/stats`, `/recommendations`, `/weaknesses`, `/prediction` | — | — | SEEDED_SNAPSHOT | NORMALIZE |
| Student | Frontend tutor fallback | `generateTutorReply` in `src/api/ai/tutor-reply.js` used when API fails | FRONTEND_RUNTIME_FAKE | n/a | — | — | FAKE_UI (never shows offline) | REMOVE_FALLBACK (show error; keep engine as optional prototype label) |
| Student | Forum | SPA forumTopics / forumCategories | BACKEND_SEEDED | `GET /v1/student/forum` | forum_topics in schema.sql unused | — | SEEDED_SNAPSHOT | BUILD or empty |
| Student | Support tickets | SQL SupportTicket | REAL_BACKEND | `GET/POST /v1/student/support` | SupportTicket | support_tickets | LIVE | KEEP |
| Student | Settings | `app_kv` per user, default SPA settings | MIXED | `GET/PATCH /v1/student/settings` | AppKv | app_kv | MIXED | KEEP prefs; don’t seed operational flags |
| Student | Admit card | SPA admitCard | BACKEND_SEEDED | `GET /v1/student/admit-card` | — | — | SEEDED_SNAPSHOT | NORMALIZE |
| Student | Interventions list | SQL assigned+ plus derived attendance/overdue from records | REAL_BACKEND | `GET /v1/student/interventions` | Intervention, InterventionStudent | interventions, intervention_students | LIVE — derived overdue/attendance from SQL assignments/attendance; no KV overlay | KEEP (Phase 4 close-out) |
| Student | Intervention practice questions | bank questions, no answer keys | REAL_BACKEND | `GET /v1/student/interventions/{id}/practice` | Question | questions | LIVE | KEEP (Phase 4 close-out) |
| Student | Practice attempt persist | `exam_attempts` + `attempt_kind` | REAL_BACKEND | `POST /v1/student/interventions/{id}/practice-attempts` | ExamAttempt, ExamQuestionAttempt | exam_attempts, exam_question_attempts | LIVE — server score; auth student id (sqlite, not live PG) | KEEP (Phase 4 close-out) |
| Student | Micro-assessments | `micro_assessments.list_student` / submit | REAL_BACKEND | `GET/POST /v1/student/micro-assessments*` | MicroAssessment* | micro_assessments, micro_assessment_attempts | LIVE — published + assigned only; no answer keys (sqlite, not live PG) | KEEP (Phase 4) |
| Student | Dashboard dedicated API | SPA `student-portal.dashboard` (unused by Dashboard.jsx) | BACKEND_SEEDED | `GET /v1/student/dashboard` | — | — | SEEDED_SNAPSHOT | REMOVE or recompute |
| Faculty | Intelligence snapshot | `faculty_runtime.assemble_faculty_intelligence` from SQL | REAL_BACKEND | `GET /v1/faculty-intelligence/summary` | User, FacultyProfile, StudentProfile, Question, Paper, Assignment, AttendanceRecord | users, faculty_profiles, student_profiles, questions, papers, assignments, attendance_records | LIVE — empty DB → zeros/`[]`; no Meera overlay | KEEP (Phase 2 done) |
| Faculty | Dashboard (success center, brief, schedule, interventions, timeline, tasks, course progress, attention) | assembled `derived.dashboard` | REAL_BACKEND | `/v1/faculty-intelligence/summary` | — | — | LIVE (schedule/timeline empty until timetable model) | KEEP (Phase 2 done) |
| Faculty | My Students directory | `faculty_students_directory` from SQL + attempt accuracies | REAL_BACKEND | `GET /v1/faculty/students` | StudentProfile, Batch, ExamAttempt | student_profiles, batches, exam_attempts | LIVE (CGPA still seeded on profile) | NORMALIZE CGPA/attendance fields |
| Faculty | Student 360 | selected student SQL + attempts only | REAL_BACKEND | `GET /v1/faculty/students/{id}/360` | ExamAttempt, StudentProfile | exam_attempts, student_profiles | LIVE — no Aarav overlay | KEEP (Phase 2 done) |
| Faculty | Attempt analysis | `analysis_from_attempt` on SQL attempt | REAL_BACKEND | `GET /v1/faculty/students/{id}/exams/{attemptId}/analysis` | ExamAttempt, ExamQuestionAttempt | exam_attempts, exam_question_attempts | LIVE | KEEP |
| Faculty | Question bank | SQL `list_question_bank` | REAL_BACKEND | `GET /v1/faculty/question-bank` | Question | questions | LIVE (empty → honest empty) | KEEP |
| Faculty | AI question generation | `question_generations` + Question rows | REAL_BACKEND | `POST /v1/faculty/question-bank/generate` + generations CRUD | QuestionGeneration, Question | question_generations, questions | LIVE | KEEP |
| Faculty | Paper generator config | SPA `paper-generator.json` config + SQL papers list | MIXED | `GET /v1/faculty/paper-generator` | Paper | papers, app_kv | MIXED — config/templates snapshot | KEEP config as STATIC; papers LIVE |
| Faculty | Paper CRUD / publish | SQL papers | REAL_BACKEND | POST/GET/DELETE/duplicate/regenerate/archive/`publish` `/v1/faculty/paper-generator/papers*` | Paper, PaperQuestion | papers, paper_questions | LIVE | KEEP |
| Faculty | Paper share | `publish_sql_paper` fail-closed + `paper_shares` row | REAL_BACKEND | `POST .../papers/{id}/share`, `GET .../shares` | Paper, PaperShare | papers, paper_shares | LIVE — incomplete 400; list SQL (sqlite, not live PG) | KEEP (Phase 4 close-out) |
| Faculty | Assignments list | live_catalog.faculty_assignments | REAL_BACKEND | `GET /v1/faculty/assignments` | Assignment, AssignmentSubmission | assignments, assignment_submissions | LIVE (seeded rows exist) | KEEP list; WIRE create/grade |
| Faculty | Create assignment | `POST /faculty/assignments` | REAL_BACKEND | `POST /v1/faculty/assignments` | Assignment | assignments | LIVE | KEEP (Phase 2 done) |
| Faculty | Grade assignment | `POST /faculty/assignments/{id}/grade` | REAL_BACKEND | `POST /v1/faculty/assignments/{id}/grade` | AssignmentSubmission | assignment_submissions | LIVE | KEEP (Phase 2 done) |
| Faculty | Attendance | live_catalog.faculty_attendance from SQL sessions/records | REAL_BACKEND | `GET /v1/faculty/attendance`, `POST /v1/faculty/attendance`, `POST .../mark` | AttendanceSession, AttendanceRecord | attendance_sessions, attendance_records | LIVE | KEEP (Phase 2 done) |
| Faculty | Roster | live directory | REAL_BACKEND | `GET /v1/faculty/roster` | StudentProfile | student_profiles | LIVE | KEEP |
| Faculty | Courses / timetable / quiz builder / exam builder / research / settings | courses SQL; timetable/research SQL; quiz/exam-builder empty | MIXED | `/v1/faculty/courses`, `/timetable`, `/quiz-builder`, `/exam-builder`, `/research`, `/settings` | Course, TimetableSlot, ResearchPublication, User, FacultyProfile | courses, timetable_slots, research_publications, users, faculty_profiles | LIVE courses/settings/timetable/research (sqlite); quiz/exam-builder GAP empty | KEEP / BUILD quiz-exam |
| Faculty | Announcements | live_catalog, empty → `[]` | REAL_BACKEND | `GET /v1/faculty/announcements` | Announcement | announcements | LIVE empty | KEEP; BUILD create |
| Faculty | Reports library | `reports_runtime` SQL + local object storage | REAL_BACKEND | GET/POST/DELETE/PATCH `/v1/faculty/reports`, GET `.../download` | GeneratedReport, FileObject | generated_reports, files | LIVE — download only READY; empty faculty → [] (sqlite, not live PG) | KEEP (Phase 4) |
| Faculty | PYQ analysis | `questions.is_pyq`; empty yearsCovered `[]` | REAL_BACKEND | `/v1/faculty/pyq-analysis*` | Question | questions | LIVE | KEEP (Phase 2 done) |
| Faculty | Question Studio sources | SPA `question-studio-sources.json` | BACKEND_SEEDED | `/v1/faculty/question-studio*` | ContentSource unused for list | content_sources | SEEDED_SNAPSHOT | NORMALIZE |
| Faculty | Question Studio generate/approve/edit | SQL sessions + `question_versions`; approve sets Question.status | REAL_BACKEND | POST generate/approve/edit/reject | QuestionStudioSession, QuestionVersion, Question | question_studio_sessions, question_versions, questions | LIVE edit versions; analyze FAILED without text (sqlite) | KEEP (Phase 4) |
| Faculty | AI studio | `ai_traces` generation history; empty until saved COMPLETED | REAL_BACKEND | GET `/faculty/ai-studio`, POST save | AiTrace | ai_traces | LIVE — no item → FAILED, omitted from history (sqlite, not live PG) | KEEP (Phase 4 close-out) |
| Faculty | Similar issues / interventions | similar-issues derived from attempts/DNA; interventions SQL-only | REAL_BACKEND | `/v1/faculty/similar-issues*`, `/interventions*` | IssueGroup, Intervention, InterventionStudent, ExamAttempt | issue_groups, interventions, exam_attempts | LIVE — empty evidence → `[]`; no CHAPTERS seed; decisions SQL | KEEP (Phase 4 close-out) |
| Faculty | Weak-topic questions | SPA faculty-workspace.questionBank | BACKEND_SEEDED | `GET /v1/faculty/students/weak-topic-questions` | — | — | SEEDED_SNAPSHOT | NORMALIZE from questions |
| Faculty | Micro-Assessment Studio | `micro_assessments` SQL service | REAL_BACKEND | `/v1/faculty/micro-assessments*` | MicroAssessment* | micro_assessments | LIVE create/generate/assign/send (sqlite, not live PG) | KEEP (Phase 4) |
| Faculty | Teaching workspace page | faculty intelligence snapshot | BACKEND_SEEDED | `/v1/faculty-intelligence/summary` | — | — | SEEDED_SNAPSHOT | NORMALIZE |
| Admin | Intelligence snapshot | `admin_runtime.assemble_admin_intelligence` from SQL | REAL_BACKEND | `GET /v1/admin-intelligence/summary` | User, Institution, StudentProfile, FacultyProfile, Course, Question, ExamAttempt | users, institutions, student_profiles, faculty_profiles, courses, questions, exam_attempts | LIVE — empty DB → 0/`[]`/health Building; no MIT-P overlay (sqlite, not live PG) | KEEP (Phase 3 done) |
| Admin | Command Center / Institution Intelligence / Reports / AI Workspace | `useAdminIntelligence` → assembler | REAL_BACKEND | `/v1/admin-intelligence/summary` | same assembler; InstitutionHealthSnapshot unused | institution_health_snapshots | LIVE — score calculated, not persisted | KEEP (Phase 3 done) |
| Admin | Dashboard counts | `admin_runtime.dashboard_payload` SQL counts | REAL_BACKEND | `GET /v1/admin/dashboard` | StudentProfile, FacultyProfile, Course | student_profiles, faculty_profiles, courses | LIVE — 0 is valid (unused by Command Center) | KEEP (Phase 3 done) |
| Admin | Students list | `admin_runtime.students_payload` SQL | REAL_BACKEND | `GET/POST /v1/admin/students` | StudentProfile, User | student_profiles, users | LIVE — no CSE/Good defaults; CGPA still profile scalar | KEEP (Phase 3 done) |
| Admin | Faculty list | `admin_runtime.faculty_payload` SQL | REAL_BACKEND | `GET/POST /v1/admin/faculty` | FacultyProfile | faculty_profiles | LIVE — empty → []; courses/students fields `0` until teaching join | KEEP (Phase 3 done) |
| Admin | Users / departments / courses / programs / subjects / batches / calendar | assembler lists; empty → `[]`; extras `null` | REAL_BACKEND | `/v1/admin/users`, `/departments`, `/courses`, `/programs`, `/subjects`, `/batches`, `/calendar` + POSTs | matching catalog models | users, departments, courses, programs, subjects, batches, calendar_events | LIVE — no SPA placement/fee/passRate overlay | KEEP (Phase 3 done) |
| Admin | Analytics / performance / research | assembler from attendance/exams/research_publications | REAL_BACKEND | `/v1/admin/analytics`, `/performance`, `/research` | AttendanceRecord, ExamAttempt, ResearchPublication | attendance_records, exam_attempts, research_publications | LIVE | KEEP (Phase 3 done) |
| Admin | Placements / revenue / scholarships / CMS | `empty_p3` | BACKEND_GAP | `/v1/admin/placements`, `/revenue`, `/scholarships`, `/cms` | unused schema stubs | invoices, scholarships, cms_pages | GAP — empty + unavailable | KEEP empty until product |
| Admin | Attendance / assignment / exam analytics | assembler | REAL_BACKEND | `/v1/admin/attendance-analytics`, `/assignment-analytics`, `/exam-analytics` | AttendanceRecord, Assignment, ExamAttempt, Paper | attendance_records, assignments, exam_attempts, papers | LIVE — empty evidence → 0/`[]` | KEEP (Phase 3 done) |
| Admin | Question bank (admin page) | `questions` | REAL_BACKEND | `GET /v1/admin/question-bank` | Question | questions | LIVE | KEEP (Phase 3 done) |
| Admin | Roles / audit / settings | SQL `roles`/`user_roles`, `audit_logs`, `institutions.settings` | REAL_BACKEND | `/v1/admin/roles`, `/audit-logs`, `GET/PATCH /settings` | Role, UserRole, AuditLog, Institution | roles, user_roles, audit_logs, institutions | LIVE | KEEP (Phase 3 done) |
| Admin | Permissions / AI config / API config / data tools | `empty_p3` | BACKEND_GAP | matching `/v1/admin/*` | unused | permissions, role_permissions | GAP — empty + BACKEND GAP toasts | KEEP empty until product |
| Admin | Report library persistence | `reports_runtime` SQL + local object storage | REAL_BACKEND | GET/POST/DELETE `/v1/admin/reports`, GET `.../download` | GeneratedReport, FileObject | generated_reports, files | LIVE — download only READY (sqlite, not live PG) | KEEP (Phase 3 done) |
| Admin | Admin AI history | `POST /v1/ai/executive/ask` + `GET /v1/ai/executive/threads` | REAL_BACKEND | `/v1/ai/executive/ask`, `/threads` | AiConversation, AiMessage, AiTrace | ai_conversations, ai_messages, ai_traces | LIVE — SQL context, no localStorage library | KEEP (Phase 3 done) |
| Admin | Write APIs (invite/create/save) | POST/PATCH persist + `audit_logs` | REAL_BACKEND | `/v1/admin/students`, `/faculty`, `/users/invite`, `/users/{id}/status`, catalog POSTs, `/settings`, `/support` | User, StudentProfile, FacultyProfile, Department, Program, Course, CalendarEvent, SupportTicket | matching tables | LIVE (sqlite, not live PG) | KEEP (Phase 3 done) |
| Parent | Entire portal | SPA `parent.json`; feature flag off | BACKEND_SEEDED | `/v1/parent/*` gated | Guardian | guardians | Disabled (`PARENT_PORTAL_ENABLED=false`) | Out of Phase 1–3 product scope |
| AI | Gateway fallback | deterministic text when `OPENAI_API_KEY` empty | HARD_CODED_OPERATIONAL | used by AI routes | — | — | MIXED | KEEP as labeled prototype; don’t treat as operational insight |
| Cross | SPA document store | JSON files copied once into `app_kv` (`spa:*`) | BACKEND_SEEDED | `payload(name)` | AppKv | app_kv | SEEDED_SNAPSHOT | Stop using as operational source |
| Cross | live_catalog empty fallback | `if not rows: return payload(...)` | BACKEND_SEEDED | many GET handlers | — | — | Dangerous — empty DB still looks full | REMOVE_FALLBACK |
| Cross | Frontend intelligence datasets | `src/intelligence/datasets/**`, `master-profile.js` still contain Aarav CGPA 8.72, attendance 92.4, 8 assignments, course progress, etc. | FRONTEND_RUNTIME_FAKE | not the HTTP path | — | — | Not served to UI if snapshot fetch succeeds; still in bundle / default engine inputs | NORMALIZE (empty operational records; keep engine) |
| Cross | Frontend faculty/admin master profiles | Meera 280 students, MIT-P 12,480 students | FRONTEND_RUNTIME_FAKE | not HTTP path | — | — | leftover | NORMALIZE |
| Cross | Frontend `src/datasets/**` shells | emptied arrays/objects | STATIC_UI_CONFIGURATION | — | — | — | KEEP shells / config | KEEP |
| Cross | Landing `HERO_METRICS` 2.4M learners | marketing | STATIC_UI_CONFIGURATION | — | — | — | KEEP | KEEP |
| Cross | Test fixtures | `tests/fixtures/*` | TEST_FIXTURE | — | — | — | KEEP | KEEP |
| Cross | Intelligence engines | `src/intelligence/engine/**`, faculty/admin engines | INTELLIGENCE_ENGINE | — | — | — | KEEP | KEEP — feed real records |

---

## 3. Frontend runtime data inventory (search terms)

### 3.1 Strict backend client (already true)

- `src/api/index.js`, `client.js`, `axios.js` — HTTP only.
- `src/config/index.js` — no mock flag.
- `src/services/*` — TanStack Query over `request()` / axios.
- Student/Faculty/Admin dashboards wait for API (`DashboardSkeleton` / `ErrorState`).

### 3.2 Leftover frontend operational datasets (still populated)

These are **not** empty shells. They encode Aarav Sharma / Dr. Meera Krishnan / MIT-P operational history:

| File | What it still contains | Type |
|------|------------------------|------|
| `src/intelligence/master-profile.js` | Aarav identity, CGPA 8.72, attendance 92.4, rank 14, JEE/NEET prep | FRONTEND_RUNTIME_FAKE |
| `src/intelligence/datasets/academics.js` | Attendance calendar, 8 assignments, 6 courses with progress, modules, projects, todaySchedule | FRONTEND_RUNTIME_FAKE |
| `src/intelligence/datasets/examinations.js` | University/competitive exam records | FRONTEND_RUNTIME_FAKE |
| `src/intelligence/datasets/learning.js` | Streak, weekly hours, practice sessions | FRONTEND_RUNTIME_FAKE |
| `src/intelligence/datasets/outcomes.js` | GPA history, achievements, recommendations | FRONTEND_RUNTIME_FAKE |
| `src/intelligence/datasets/dna.js`, `signals.js`, `career.js`, `workspace.js`, `competitive.js`, `events.js` | DNA inputs, career, mentor notes, PYQ performance | FRONTEND_RUNTIME_FAKE |
| `src/intelligence/faculty/master-profile.js` | Meera, 280 students, 74.2 class average, 91% pass | FRONTEND_RUNTIME_FAKE |
| `src/intelligence/faculty/datasets/assessment.js` | Question coverage 418/286/336, PYQ trends 2015–2025 | FRONTEND_RUNTIME_FAKE |
| `src/intelligence/faculty/datasets/ai-studio.js`, `classes.js`, `engagement.js` | Studio + class operational numbers | FRONTEND_RUNTIME_FAKE |
| `src/intelligence/admin/master-profile.js` | 12,480 students, 640 faculty, 214 courses, dept placement % | FRONTEND_RUNTIME_FAKE |
| `src/api/ai/tutor-reply.js` | Deterministic tutor answers | FRONTEND_RUNTIME_FAKE (chat fallback) |

Emptied (neutral shells — KEEP names):

- `src/datasets/platform/users.js` — `STUDENT_ROSTER`, `FACULTY_LIST`, `ADMIN_USERS`, `DEPARTMENTS` = `[]`
- `src/datasets/admin/*`, `src/datasets/ai/*`, `src/datasets/student/academics.js`, `src/datasets/faculty/teaching.js`, `src/datasets/faculty/workspace.js`
- `src/datasets/exams/exam-agent.js` — `EXAM_AGENT_EXAMS = []`; labels kept
- `src/intelligence/faculty/datasets/competitive-questions.js`, `question-studio-questions.js`, `question-studio-sources.js`

Legitimate static config (KEEP):

- `src/datasets/platform/content.js` — landing
- `src/datasets/faculty/paper-generator.js` — exam mode / type option lists
- `src/datasets/faculty/pyq-analysis.js` — filter cascade metadata + `applyPyqVariant`
- `src/datEE/NEET filter taxonomy (seeded analysis records removed)
- `src/config/index.js` `NAV_GROUPS`, `ROLE_*`
- `src/intelligence/faculty/datasets/reports.js` `reportTemplates` (template includes lists)

### 3.3 localStorage

| Key | Purpose | Class |
|-----|---------|-------|
| `EduX_access_token` / `EduX_refresh_token` / `EduX_user` | Auth session | KEEP |
| `EduX_theme` / `EduX_reduced_motion` | UI prefs | KEEP |
| `EduX_admin_report_library` | leftover key; library now `GET /admin/reports` | unused operational — KEEP as dead key |
| `EduX_admin_ai_history` / `EduX_admin_ai_insights` | leftover keys; chat now `/ai/executive/*` | unused operational — KEEP as dead key |
| `EduX_faculty_assistant_history` | Faculty assistant chat | FRONTEND_RUNTIME_FAKE |

No production read of `EduX_student_exam_attempts` / interventions stores (prototype stores deleted).

---

## 4. Backend data source map

### 4.1 SQLAlchemy models → PostgreSQL tables (implemented)

| Model file | Tables |
|------------|--------|
| `identity.py` | institutions, roles, users, user_roles, auth_sessions, otp_challenges, registration_drafts |
| `people.py` | student_profiles, faculty_profiles, enrollments, guardians, guardian_students |
| `catalog.py` | departments, programs, subjects, courses, chapters, topics, academic_terms, batches, campuses, calendar_events |
| `teaching.py` | attendance_sessions, attendance_records, assignments, assignment_submissions, announcements |
| `assessment.py` | questions, papers, paper_questions, paper_shares, content_sources, question_studio_sessions, question_generations, question_generation_items, question_versions |
| `exams.py` | exam_sittings, exam_attempts, exam_question_attempts |
| `intelligence.py` | student_dna_snapshots, institution_health_snapshots |
| `interventions.py` | issue_groups, interventions |
| `ai.py` | ai_prompt_templates, ai_conversations, ai_messages, ai_traces |
| `ops.py` | audit_logs, support_tickets, app_kv, newsletter_subscribers, contact_inquiries, files |

`backend/sql/schema.sql` also documents tables **without ORM usage** (permissions, quizzes, forum_*, invoices, scholarships, notifications, cms_pages, blog_posts, …). Those remain BACKEND_GAP relative to the running app. `paper_shares`, `timetable_slots`, and `generated_reports` now have ORM usage (Phase 4).

### 4.2 SPA documents (`backend/app/data/spa/`)

Seeded into `app_kv` key `spa:{name}` once. Mutations persist. Re-seed does not overwrite existing keys (except question-cleanup heal).

| Document | Size (approx) | Served to |
|----------|---------------|-----------|
| student-intelligence-summary.json | 440 KB | Student Command Center and most student pages |
| student-intelligence-datasets.json | 95 KB | `/intelligence/datasets`, mentor |
| student-intelligence-derived.json | 343 KB | `/intelligence/derived` |
| student-portal.json | 179 KB | leftover student GETs + exam analysis samples |
| faculty-intelligence-summary.json | 491 KB | Faculty Command Center / teaching / reports |
| faculty-workspace.json | 33 KB | faculty courses/timetable/quiz/exam-builder/research |
| faculty-students-directory.json | 21 KB | unused when SQL directory works |
| admin-intelligence-summary.json | 777 KB | Admin Command Center |
| admin-intelligence-datasets.json | 685 KB | `/admin-intelligence/datasets` |
| admin-catalog.json | 62 KB | admin analytics/revenue/roles/… |
| exam-agent-exams.json | 46 KB | practice_questions fallback |
| question-studio-sources.json | 51 KB | Question Studio |
| pyq.json | 24 KB | PYQ Analysis |
| paper-generator.json | 17 KB | generator config |
| ai.json | 23 KB | tutor threads fallback, copilot, learning path |
| parent.json | 17 KB | parent portal |
| student-360-aarav.json | 2 KB | Student 360 template |
| platform.json / registration-options.json | small | platform + register |

### 4.3 Demo seed (when `SEED_DEMO_USERS=true`)

- Institution `Meridian Institute of Technology` (`DEMO_INSTITUTION_ID`)
- 8 departments, CSE program, 7 batches
- Faculty + admins + ~126 students (`faculty_students()`)
- Student CGPA / attendance / internal marks **written as scalars** (`student_profiles.cgpa`, `extra.attendance`) — not computed from attendance_records / results
- Aarav (`u_stu_001`) extra attendanceDetail 92.4 / 277 of 300
- `seed_academic.py` seeds courses CS501–CS506, 8 assignments + Aarav submissions, 4 attendance sessions, tickets, calendar, announcements
- Exam-agent paper import looks for `frontend/src/mock-data/exam-agent.js` which **does not exist** in this tree, so that import currently yields `[]` on a fresh boot

---

## 5. Student audit (entire experience)

Student UI is **one intelligence snapshot**. Almost every academic number on Dashboard, Academics, Assignments, Attendance, Performance & AI, Portfolio, Progress Report, Calendar, Mentor resources is `GET /v1/intelligence/summary`.

### Critical overlay bug

```python
# backend/app/api/v1/student.py
snap = payload("student-intelligence-summary")
snap["profile"] = student_master_profile(db, user)
```

A newly registered student keeps **their name** but inherits **Aarav’s datasets** (attendance 92.4, streak 12, 8 assignments, course progress, DNA, recommendations). Dashboard KPIs mix `profile.cgpa` (real/null) with `datasets.attendance.overall` (always 92.4 from snapshot).

| Surface | Current | Expected real source | Normalize? |
|---------|---------|----------------------|------------|
| Dashboard CGPA | profile.cgpa seeded 8.72 or 0 | approved results / academic records | YES |
| Dashboard attendance | datasets.attendance.overall 92.4 | attendance_records | YES |
| Dashboard assignments due | snapshot pending count | assignments + submissions | YES |
| Study streak / hours / focus | studyStatistics 12 / 27.1h / 84% | study sessions (none) | YES — 0 if no records |
| Academic health 89.4 | derived snapshot | engine on real inputs | YES |
| Attendance calendar / trend / by-subject | snapshot | attendance_records | YES |
| Assignment cards + progress bars | snapshot; submit is toast | assignments + submissions | YES + BUILD submit |
| Course progress % | snapshot | syllabus/enrollment progress (none) | YES — empty/0 |
| Examinations list | published papers | papers.status=published | already LIVE |
| Exam Agent sit/submit/score | SQL + server score | exam_attempts | already LIVE |
| Exam analysis hero 182/300 | SPA variant fallback | attempt scoring | YES — remove SPA options |
| Mock tests | SPA 14 items | published mock papers or [] | YES |
| Mentor notes/resources | snapshot | ai_messages / empty | YES |
| Forum | SPA topics | forum tables unused | BUILD or empty |
| Support | SQL | support_tickets | LIVE |
| Micro-assessments | 404 | missing API | BUILD |
| Notifications / achievements / streaks | snapshot | no tables used | YES — empty |

Frontend leftover datasets must not be re-imported as a fallback during Phase 1.

---

## 6. Faculty audit (entire experience)

### Working lifecycles

```
Faculty generate questions → question_generations + questions
Faculty create paper from selectedQuestionIds → papers + paper_questions
Faculty publish → papers.status=published
Student sees exam → GET /student/exams | /exam-agent/exams
Student start/submit → exam_sittings + exam_attempts + server score
Faculty My Students / 360 attempts / attempt analysis → live attempts
```

### Interrupted / fake

```
Faculty "Create assignment" → toast only → students still see snapshot assignments
Faculty "Grade" → toast only
Faculty share paper → KV "Sent (prototype)" → does not publish
Question Studio approve → KV flag, note claims bank insert → questions table unchanged
PYQ / coverage / assessment health → SPA / faculty-intelligence snapshot (418 questions etc.)
Teaching Command Center KPIs → frozen Meera snapshot (except question bank count overlay)
Student 360 non-attempt panels → Aarav template
Interventions → computed groups + KV, not interventions table
Micro-Assessment Studio → BACKEND_GAP
Courses / timetable / quiz / exam builder → SPA
```

Question generation → DB → paper → ready → send/publish → student is **PARTIAL**: generate/create/publish/student-sit work; **send/share is prototype KV**.

Assignment create → DB → send → student submit → faculty status is **FAKE** on create/submit/grade; list GET is live seeded rows.

---

## 7. Admin audit (entire experience)

Phase 3 implemented. Command Center, Institution Intelligence, Reports, and AI Workspace read `admin_runtime.assemble_admin_intelligence` for the authenticated institution:

- totals = `COUNT` of `student_profiles` / `faculty_profiles` / `courses` / `departments` / `programs` / `batches`
- institution health is calculated; no evidence → `0` / grade `Building`
- identity is `users` + `institutions` (not MIT-P / Anil unless that tenant)
- catalog extras (`placement`, `passRate`, `fee`) are `null`, not SPA overlays
- empty SQL returns `[]` / `0`, never `admin-catalog.json`

People/catalog pages use the same assembler. Mutations persist (student/faculty/invite/status/catalog/calendar/settings/support/reports) and write `audit_logs`. Reports download only when `generated_reports.status = READY`. Executive chat calls `POST /ai/executive/ask`. P3 finance/CMS/placements/API keys/data import stay empty + BACKEND GAP.

SPA files `admin-intelligence-summary.json` / `admin-catalog.json` remain on disk and are **not** Admin operational truth.

Implementation report: [`PHASE-3-ADMIN-RUNTIME-DATA-NORMALIZATION-REPORT.md`](./PHASE-3-ADMIN-RUNTIME-DATA-NORMALIZATION-REPORT.md). Historical map: [`PHASE-3-ADMIN-RUNTIME-AUDIT.md`](./PHASE-3-ADMIN-RUNTIME-AUDIT.md).

---

## 8. KPI audit

| KPI | Current value source | Expected real source | DB table | Calculation | Status |
|-----|----------------------|----------------------|----------|-------------|--------|
| Student CGPA | seeded `student_profiles.cgpa` + snapshot | graded results | assignment_submissions / exam_attempts / future results | backend-approved formula | NORMALIZE |
| Student attendance % | snapshot 92.4 + profile.extra | attendance_records | attendance_records | present/total × 100; 0 if no sessions | NORMALIZE |
| Pending assignments | snapshot | assignments − submissions | assignments, assignment_submissions | count | NORMALIZE |
| Study streak | snapshot 12 | none | — | 0 until study log exists | NORMALIZE |
| Academic health 89.4 | snapshot | engine on real pillars | mixed | KEEP engine | NORMALIZE |
| Consistency / confidence / improvement indices | snapshot | engine | mixed | KEEP engine | NORMALIZE |
| JEE/NEET readiness rings | snapshot | competitive attempts | exam_attempts | KEEP engine | NORMALIZE |
| Faculty teaching health / engagement / assessment health | snapshot (QB status overlaid live) | attendance, assignments, questions, papers | mixed | KEEP engine | NORMALIZE |
| Faculty question bank total | SQL count | questions | questions | count | LIVE |
| Faculty class size 280 | snapshot / master profile | enrollments | enrollments | count | NORMALIZE |
| Admin students | assembler `COUNT(student_profiles)` | student_profiles | student_profiles | count | LIVE (Phase 3; sqlite) |
| Admin faculty | assembler `COUNT(faculty_profiles)` | faculty_profiles | faculty_profiles | count | LIVE (Phase 3; sqlite) |
| Admin courses | assembler `COUNT(courses)` | courses | courses | count | LIVE (Phase 3; sqlite) |
| Admin fee collection / placements | `empty_p3` | no live finance/placement pipeline | — | empty/0 until tables filled | GAP |
| Admin AI sessions | `COUNT(ai_traces)` | ai_traces | ai_traces | count | LIVE (Phase 3; sqlite) |
| Institution health | assembler pillars from live evidence | calculated; InstitutionHealthSnapshot unused | institution_health_snapshots | 0 / Building if no evidence | LIVE (Phase 3; sqlite) |
| Landing 2.4M learners | content.js | marketing | — | KEEP | KEEP |

**Do not remove KPI cards. Do not hardcode zeros. Calculate from records.**

---

## 9. Progress / chart audit

| Visualization | Location | Value source | Kind |
|---------------|----------|--------------|------|
| StatCard KPIs | Student/Faculty/Admin dashboards | snapshots (QB overlay on faculty) | B snapshot / C partial |
| ProgressRing academic health | Student dashboard / attendance / academics | snapshot | B |
| ProgressRing JEE/NEET readiness | Student dashboard | snapshot | B |
| BarCompare weekly study hours | Student dashboard | snapshot | B |
| Subject mastery bars | Student dashboard | snapshot | B |
| Course progress bars | Student dashboard / academics | snapshot | B |
| AreaTrend attendance | Student attendance | snapshot | B |
| Monthly attendance calendar | Student attendance | snapshot | B |
| Subject-wise attendance bars | Student attendance | snapshot | B |
| Assignment progress bars | Student assignments | snapshot | B |
| Faculty course progress / engagement charts | faculty dashboard / teaching | snapshot | B |
| Admin health visual / dept performance / trends | admin dashboard / institution intel | assembler derived | D LIVE (Phase 3 sqlite) |
| Recharts wrappers | `src/components/charts/index.jsx` | presentation only | E static |
| Exam Agent live stats | exam-agent-live.jsx | engine on attempt in progress | D calculated (LIVE attempt) |
| Paper generator coverage | paper generator | live selected questions | D when bank live |
| Faculty assignment submission Progress | faculty Assignments.jsx | GET assignments SQL | D LIVE (seeded rows) |
| Faculty attendance % | faculty Attendance.jsx | SQL records | D LIVE |
| Landing metrics count-up | HERO_METRICS | static marketing | E |

Legend: A hardcoded in JSX · B fake/snapshot dataset · C backend value · D calculated from backend · E static configuration.

Hardcoded in JSX (minor): student Dashboard AI blurb uses `coursesTop.find(...)?.progress ?? 71`; Academics badge `Sem 5 · 6 courses`; Attendance leaves `+ (data.bySubject.length ? 4 : 0)`. These are HARD_CODED_OPERATIONAL nits.

---

## 10. User-action lifecycle audit

| Lifecycle | Status | Notes |
|-----------|--------|-------|
| Student registration | PARTIAL | SQL user+profile created; OTP hardcoded `482193`; intelligence snapshot still Aarav |
| Student login | WORKING | Real password hash + JWT |
| Faculty assignment creation | FAKE | Toast only; no POST |
| Faculty assignment publishing/sending | WORKING (Phase 4 sqlite) | `POST /faculty/assignments/{id}/publish`; students see published only |
| Student assignment visibility | PARTIAL | Page shows snapshot, not GET /student/assignments |
| Student assignment submission | FAKE | Toast only |
| Faculty question generation | WORKING | SQL question_generations + questions |
| Question persistence | WORKING | questions table |
| Paper generation | WORKING | papers + paper_questions from selected IDs |
| Paper readiness | PARTIAL | status Draft/Published; UI also wants generationStatus |
| Paper publishing | WORKING | POST publish → students can list |
| Paper share/send | FAKE | KV “Sent (prototype)” |
| Student exam visibility | WORKING | published papers, no answer keys |
| Exam attempt start | WORKING | exam_sittings |
| Exam submission + scoring | WORKING | server scorer; client scoring ignored |
| AI analysis after attempt | PARTIAL | analysis_from_attempt works; DNA worker not auto-chained to dashboard snapshot |
| Performance update | FAKE | dashboard snapshot not rebuilt from attempts |
| Dashboard KPI update | FAKE | frozen SPA document |
| Support ticket create | WORKING | support_tickets |
| Newsletter/contact | WORKING | SQL |
| Question Studio approve → bank | BACKEND_GAP | KV only |
| Micro-assessment create/assign/attempt | WORKING (Phase 4 sqlite) | SQL tables + student routes; keys omitted |
| Faculty mark attendance | BACKEND_GAP | GET only |
| Logout revoke | PARTIAL | local clear; JWT not revoked |
| Admin CRUD people/catalog | WORKING (Phase 3 sqlite) | POST/PATCH persist + audit_logs; P3 surfaces stay empty |

---

## 11. Fallback audit (do not remove in Phase 0)

These make an empty database look populated:

| Location | Pattern |
|----------|---------|
| `live_catalog.py` admin_departments/courses/programs/subjects/batches/users/calendar | `if not rows: return payload("admin-catalog")` |
| `live_catalog.admin_dashboard` | `int(student_n) or kpis[0]["value"]` — **0 SQL rows keep 12480** |
| `live_catalog.student_assignments/courses/events` | empty SQL → `student-portal` |
| `live_catalog.faculty_announcements` / `faculty_question_bank` | empty → faculty-workspace |
| `live_catalog.admin_courses` etc. | merge SPA passRate/placement/fee onto live rows |
| `student.py` settings | `kv_get(...) or payload("student-portal")["settings"]` |
| `student.py` exam-analysis options | `live + payload examAnalysisOptions` |
| `student.py` exam-analysis by id | attempt miss → SPA variants / examAnalysis hero |
| `student.py` course detail | SPA courseDetail |
| `student.py` mock-tests, programs, forum, admit-card, academic-*, performance-accuracy, dashboard, attendance | payload student-portal |
| `faculty.py` roster | `live or payload roster` |
| `faculty.py` student 360 | Aarav template |
| `faculty.py` papers default | payload paper-generator if KV empty (list still SQL) |
| `faculty.py` reports | KV or SPA rep SQL) |
| `faculty.py` reports | KV or SPA reports |
| `ai.py` tutor threads | SQL or SPA tutorThreads |
| `admin.py` faculty | live.total or SPA facultyList |
| Frontend `generateTutorReply` | API fail → fake tutor |
| Frontend assignment/create/grade buttons | toast success |
| `GET /intelligence/summary` | always SPA datasets/derived |

---

## 12. Static data that MUST remain

Do **not** delete because values are static:

- Landing / marketing (`src/datasets/platform/content.js`)
- Navigation (`NAV_GROUPS`, mega menus, role homes)
- UI labels, icons, badges, empty-state copy, theme, z-index
- Exam Agent group labels / types
- Paper generator option lists (University/Competitive types, negative marking options)
- PYQ filter cascade metadata (programs/subjects/chapters as taxonomy)
- Question taxonomy contracts (domain, examFamily, difficulty, questionType) — never infer family from subject name
- Report **templates** (what a report includes), not fake library rows
- Intelligence **engines** and ExamAttempt / QuestionAttempt contracts
- Validators, dropdown cascade utilities
- Test fixtures under `tests/` and `backend/test/`
- Documentation under `docs/`
- Local development account script (dev-only)

---

## 13. Intelligence engines that MUST remain

Keep; later feed them real records instead of SPA snapshots:

**Student** (`src/intelligence/engine/`): `scores.js`, `derive.js`, `dna.js`, `readiness.js`, `university.js`, `competitive.js`, `progress-report.js`, `exam-agent.js` (canonical attempt contract, lfaculty/engine/`): dashboard, students, student-360, attendance, assignments, assessment, alerts, analytics, attention, engagement, insights, timeline, reports, scores, similar-issues, intervention-lifecycle, micro-assessments, question-studio, ground-level-intelligence, ai-studio

**Admin** (`src/intelligence/admin/engine/`): health, scores, students, assessments, reports; `admin/ai/response-engine.js`

**Backend worker:** `backend/app/workers/intelligence.py` `rebuild_student_dna` (rule-based; must not use LLM for scores)

LLM gateway must never write canonical scores, DNA, or health pillars (`backend/app/ai/gateway.py` docstring).

---

## 14. Recommended phase plan (do not execute in Phase 0)

### PHASE 1 — STUDENT

1. Stop serving `student-intelligence-summary` datasets/derived as operational truth. Assemble snapshot from SQL for the logged-in student. Empty records → empty arrays / calculated zeros. **Keep every card.**
2. Remove SPA fallbacks on `/student/attendance`, `/assignments`, `/courses`, `/events`, `/dashboard`, `/mock-tests`, `/exam-analysis*`, `/programs`, `/forum`.
3. CGPA: calculate from real graded records or show `—` / 0 if none. Do not keep 8.72 on new users.
4. Attendance: calculate from `attendance_records`. 0 sessions → 0%.
5. Assignments page: bind to `GET /student/assignments`. Implement submit → `assignment_submissions`. Remove toast-fake submit.
6. Academics/courses/subjects/progress: from enrollments + courses; progress 0 if no lesson model yet.
7. Calendar from `calendar_events`.
8. Examinations / Exam Agent already live — keep. Mock tests = published mock papers or [].
9. Exam analysis: live attempts only; delete SPA option concatenation.
10. Performance & AI / DNA / readiness / recommendations / progress report: run **existing engines** on real attempts + attendance + assignments. `rebuild_student_dna` on submit.
11. Mentor resources/notes/history: SQL conversations or empty. Remove `generateTutorReply` silent fallback (or label prototype only).
12. Do not re-import `src/intelligence/datasets/**` as runtime fallback.
13. Micro-assessments: either BUILD or keep empty/error (already fail-closed).

### PHASE 2 — FACULTY

1. Assemble faculty intelligence from SQL (directory, attendance, assignments, questions, papers, attempts). Keep engines.
2. Implement POST assignment create, publish/send, grade. Student list must update.
3. Mark attendance POST; students’ attendance KPIs must move.
4. Question Studio approve → insert `questions`.
5. Paper share = publish or real share table; drop “Sent (prototype)”.
6. PYQ / coverage / assessment health from `questions` (is_pyq, chapters). Empty bank → zeros.
7. Courses/timetable from catalog; no SPA workspace.
8. Interventions → `interventions` / `issue_groups` tables.
9. Student 360: no Aarav template; compute from that student’s attempts.
10. Micro-assessments API (GAP-13) if in scope.
11. Remove faculty-workspace SPA fallbacks.

### PHASE 3 — ADMIN

1. Command Center KPIs = `count(*)` of student_profiles, faculty_profiles, courses, departments, programs, papers, questions, assignments, exam_attempts. Empty → 0, not 12480.
2. Institution health = engine on real aggregates; persist `institution_health_snapshots`.
3. Drop SPA admin-catalog fallbacks and `or kpis[0].value`.
4. Question/exam/assignment/attendance analytics from SQL.
5. Finance/placement/research: empty until real tables; keep cards.
6. Admin question bank from `questions`.
7. Optional write APIs for catalog/people.
8. Replace localStorage report library with `generated_reports` or keep as export-only labeled prototype.

---

## 15. Acceptance rule (for later phases)

Wrong:

```js
const attendance = 0
const assignments = []
```

Correct:

```js
const attendance = calculateAttendance(realAttendanceRecords) // [] → 0
const assignments = backendAssignments // [] → existing empty state
```

Never replace fake history with hardcoded zeros in the UI layer. Replace fake **sources** with real queries.

---

## 16. Phase 0 stop line (historical)

Phase 0 was audit-only. Phase 1 Student normalization is implemented; see the Phase 1 report.

## 17. Phase 1 outcome (Student)

Student Command Center and leftover student GETs now read `student_runtime` SQL snapshots. Assignment submit persists. Exam publish/start/submit/score and `rebuild_student_dna` are unchanged. Forum remains a BACKEND GAP (empty + honest error).

## 18. Phase 2 outcome (Faculty)

Faculty Command Center, settings, courses, PYQ, question studio list/generate, Student 360, assignments create/grade, and attendance mark now read `faculty_runtime` SQL snapshots. Paper `generationStatus` + requested/valid counts fail-close SEND/publish. Share publishes through the existing examination spine. Empty faculty stays empty. Admin SPA snapshots were not touched. Verification is sqlite + `npm test` + `npm run build` — not live PostgreSQL.

Next approved step (historical Phase 2 close): **PHASE 3 — ADMIN RUNTIME DATA NORMALIZATION** remains unstarted. Phase 4 faculty/student capability work is documented separately.

## 19. Phase 4 outcome (missing backend capabilities)

P0 micro-assessments, studio question versioning, assignment draft/publish, and faculty-created SQL interventions are implemented. P1 lecture planner, timetable slots, and content analysis (FAILED without text) are implemented. P2 research publications and READY-only report PDF download are implemented. Faculty UI was wired, not redesigned. Empty DB stays empty. Verification: sqlite `pytest` 79, `npm test` 294, `npm run build` — **not live PostgreSQL**. See [`PHASE-4-MISSING-BACKEND-CAPABILITIES-REPORT.md`](./PHASE-4-MISSING-BACKEND-CAPABILITIES-REPORT.md).

## 20. Phase 4 close-out (remaining mixed/KV Faculty operational state)

Four leftovers were classified, then persisted or derived — never “fixed” by adding duplicate tables or keeping KV:

| Area | Class | Persistence |
|------|-------|-------------|
| Similar-issue groups | DERIVED ANALYTICS | Computed from `exam_attempts` / DNA; empty evidence → `[]`. Faculty intervention **decisions** stay on `issue_groups` / `interventions`. |
| Intervention practice / retest | REAL OPERATIONAL STATE | `exam_attempts.attempt_kind` + `intervention_id`; server-scored. No KV `practice_attempts`. |
| AI Studio history | REAL OPERATIONAL STATE | `ai_traces` (`ai_studio:{kind}`); empty item → FAILED, omitted from GET. |
| Paper-share list | REAL OPERATIONAL STATE | `paper_shares` ORM; share still fail-closes via `publish_sql_paper`. |

UI prefs (`faculty_settings` / `student_settings`) remain KV. Additive `0002_phase4_closeout.sql` was **not** applied to live PostgreSQL. Admin was not started. Stop after these four.

## 21. Phase 3 Admin runtime audit (no implementation)

Read-only audit of the entire Admin portal. **No application code, migration, or seed was changed.** Full map: [`PHASE-3-ADMIN-RUNTIME-AUDIT.md`](./PHASE-3-ADMIN-RUNTIME-AUDIT.md).

Findings that must drive implementation (when approved):

1. Command Center / Institution Intelligence / Reports / AI Workspace are one unscoped SPA document (`admin-intelligence-summary.json`: 12,480 students, health 87.9). `payload()` ignores `user.institution_id`.
2. Empty catalog SQL (`departments`, `courses`, `users`, `faculty`, …) falls back to `admin-catalog.json`, so a new institution looks full. Live rows still merge SPA `placement` / `passRate` / `fee`.
3. `GET /admin/dashboard` uses `count or spa_value` (0 keeps 12,480) and is unused by the UI.
4. Admin router is GET-only. Invite/create/save/export are toast or `localStorage` (`EduX_admin_report_library`, `EduX_admin_ai_*`).
5. SQL already exists for counts, people, catalog, attendance, assignments, attempts, questions, `research_publications`, `generated_reports`, `roles`, `audit_logs`, `institution_health_snapshots` — mostly unused by Admin.
6. Invoices / scholarships / CMS / placements are genuine future gaps: keep cards, empty until tables are used.
7. Auth chrome is LIVE (`/auth/me`). JSX still hardcodes “Meridian Institute of Technology”, “Director.”, faculty `?? 640`.
8. Empty institution must show 0 / `[]` / existing empty shells — not MIT-P.

Student and Faculty conclusions in this document are unchanged. **Do not start Admin implementation until explicitly approved.**
