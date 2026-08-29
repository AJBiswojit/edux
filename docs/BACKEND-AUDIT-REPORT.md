# EduX Backend Audit

**Date:** 2026-08-29  
**Branch:** `arena/01a04d8a-edux`  
**Mode:** READ-ONLY AUDIT — no source, schema, seed, or frontend changes  
**Backend source of truth:** `backend/` as present in this repository  
**Frontend source of truth:** `src/` as present in this repository  

---

## 1. Audit Scope

This audit inspects the **real Python backend** now in the EduX repository and compares it to the **existing frontend** (`src/api`, `src/services`, `src/hooks`, `src/routes`, `src/pages`) and to `docs/backend-integration/`.

**In scope**

- Repository layout, Python stack, env/config, ORM models, SQL schema, routers, request/response shapes
- Auth, RBAC, student/faculty/admin/parent/AI domains
- Question bank, paper generator, publish, student examination, ExamAttempt, results
- University / JEE / NEET isolation
- Student 360, interventions, pagination, filters, errors, CORS, Docker
- Frontend/backend contract gaps and transformation needs

**Out of scope (explicitly not done)**

- Code changes, refactors, UI changes, new APIs, mock APIs, seed data, migrations, documentation updates other than this file

**Database access**

- PostgreSQL on `localhost:5432` was **not reachable** in this environment (connection refused).
- Read-only inspection of committed SQLite file `backend/medixo.db` was performed (no writes).

---

## 2. Repository Structure

| Area | Actual location |
|------|-----------------|
| Frontend root | repository root (`package.json`, `vite.config.js`, `src/`) |
| Backend root | `backend/` |
| Backend entry point | `backend/app/main.py` → `app = create_app()` |
| ASGI target | `uvicorn app.main:app --host 0.0.0.0 --port 8000` |
| Python framework | FastAPI |
| API structure | `backend/app/api/v1/` routers mounted at `API_V1_PREFIX` (default `/v1`) |
| Database layer | `backend/app/db/base.py`, `backend/app/db/session.py` |
| Authentication | `backend/app/core/security.py`, `backend/app/api/v1/auth.py`, `backend/app/services/seed.py` (`authenticate`, `issue_tokens`) |
| Authorization | `backend/app/core/deps.py` (`current_user`, `require_roles`) |
| Migrations | **None implemented.** `alembic` is in `requirements.txt`; no `alembic.ini` / versions. Schema is `Base.metadata.create_all` + additive `ensure_schema()` |
| Configuration | `backend/app/core/config.py` (`pydantic-settings`), `backend/.env.example`, `backend/.env` |
| Routers | `auth.py`, `platform.py`, `student.py`, `faculty.py`, `admin.py`, `parent.py`, `ai.py` |
| Schemas | `backend/app/schemas/auth.py` only (most bodies are untyped `dict`) |
| Models | `backend/app/models/*.py` |
| Services | `backend/app/services/*` (seed, live_catalog, spa_*, people_directory) |
| Repositories | **None** — routers query SQLAlchemy / `app_kv` directly |
| Utilities | `backend/app/core/logging.py`, `backend/app/middleware.py` |
| AI | `backend/app/ai/gateway.py`, `backend/app/ai/prompts.py` |
| Workers | `backend/app/workers/intelligence.py` (`rebuild_student_dna`) |
| SQL | `backend/sql/schema.sql` (enterprise PG design), `backend/sql/init-edux.sql` (`CREATE SCHEMA IF NOT EXISTS edux`) |
| SPA fixtures | `backend/app/data/spa/*.json` loaded into `app_kv` |
| Frontend API client | `src/api/axios.js`, `src/api/client.js` |
| Frontend services | `src/services/*` |
| Frontend docs (prior) | `docs/backend-integration/` |

**Architectural fact (critical):** the running API is a **hybrid**.

1. **Live SQLAlchemy tables** for identity, catalog, people, some teaching rows, `questions`, `papers`, `paper_questions`, `exam_attempts`, `exam_question_attempts`.
2. **JSON document store** (`app_kv`) for SPA contract payloads and mutations (paper generator library, interventions, studio sessions, many GET screens).
3. **Bundled JSON fixtures** (`backend/app/data/spa/`) used when live rows are empty or when the endpoint never reads SQL.

These three layers are **not wired into one examination pipeline**.

---

## 3. Python Stack

| Layer | Actual |
|-------|--------|
| Language | Python **3.12** (`backend/Dockerfile`: `FROM python:3.12-slim`) |
| Web | **FastAPI 0.115.6** + Uvicorn 0.32.1 |
| ORM | **SQLAlchemy 2.0.36** (mapped classes, sync `Session`) |
| Validation | **Pydantic 2.10.3** + `pydantic-settings 2.6.1` (auth schemas only) |
| Migrations | Alembic listed, **unused**. Boot uses `create_all` |
| Auth tokens | **python-jose** JWT HS256 |
| Password hashing | PBKDF2-SHA256 (390,000 rounds); bcrypt verify supported for `$2*` hashes |
| DB driver | **psycopg2-binary** (`postgresql+psycopg2://…`) |
| Async/sync | **Sync** SQLAlchemy engine/session. FastAPI `async` lifespan; route handlers are **sync `def`** |
| Redis | `redis==5.2.1` in requirements; **not used in application code** |
| HTTP client | `httpx` (OpenAI chat completions) |
| Logging | structlog JSON rotating files under `backend/logs/` |
| Tests | pytest listed; `backend/test/` is empty of cases |

**Not Django. Not Flask.** FastAPI is confirmed.

---

## 4. Backend Entry Point

- Module: `backend/app/main.py`
- Factory: `create_app()`
- Lifespan:
  1. `setup_logging(force=True)`
  2. `_boot_schema()` → `ensure_schema()` (PostgreSQL schema + additive column alignment + rename colliding legacy `questions`/`papers`/`exam_attempts` if they lack EduX columns)
  3. `Base.metadata.create_all(bind=engine)`
  4. `seed_if_empty(db)` (demo institution, 126 students, faculty, admin, parent)
  5. `seed_spa_documents(db)` (JSON fixtures → `app_kv`)
- Middleware: `RequestLogMiddleware`, `CORSMiddleware`
- Router: `app.include_router(api_router, prefix=settings.api_v1_prefix)` → default `/v1`
- Unversioned: `GET /health` → `{ status, version, env }`
- OpenAPI: `/docs`, `/redoc`

App name/version: `MediXO EduX API` / `1.0.0` (`backend/app/__init__.py`).

---

## 5. Environment Configuration

Inspected: `backend/app/core/config.py`, `backend/.env.example`, `backend/.env` (names only — **secrets not copied**).

| Variable | Purpose | Owner |
|----------|---------|--------|
| `APP_NAME` | API title | backend |
| `APP_ENV` | `development` / etc. | backend |
| `DEBUG` | debug flag | backend |
| `API_V1_PREFIX` | default `/v1` | backend |
| `SECRET_KEY` | JWT signing | backend **only** |
| `ALGORITHM` | default `HS256` | backend |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | default `30` | backend |
| `REFRESH_TOKEN_EXPIRE_DAYS` | default `14` | backend |
| `DATABASE_URL` | SQLAlchemy URL | backend **only** |
| `DB_SCHEMA` | default `edux` | backend **only** |
| `REDIS_URL` | configured, unused | backend |
| `CORS_ORIGINS` | comma-separated origins | backend |
| `OPENAI_API_KEY` | live LLM; empty → deterministic fallback | backend **only** |
| `OPENAI_MODEL` | default `gpt-4.1-mini` | backend |
| `ANTHROPIC_API_KEY` | declared, unused in gateway | backend |
| `EMBEDDING_MODEL` | declared, unused in runtime | backend |
| `AI_MAX_TOKENS` | default `2048` | backend |
| `PARENT_PORTAL_ENABLED` | default `false` | backend |
| `SEED_DEMO_USERS` | default `true` | backend |
| `DEMO_PASSWORD` | demo seed password | backend **only** |
| `LOG_LEVEL`, `LOG_DIR`, `LOG_MAX_BYTES`, `LOG_BACKUP_COUNT` | logging | backend |

**API host/port:** not env-driven. Uvicorn binds `0.0.0.0:8000` in Docker/README.

**API prefix:** `/v1`  
**API version:** path prefix only (no `/v1.0`). App version `1.0.0`.

**Frontend env:** **no `.env` / `.env.example` at repo root.**  
`src/config/index.js`:

```
API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.medixoedux.edu/v1'
```

If `VITE_API_BASE_URL` is unset, the SPA does **not** talk to `http://localhost:8000/v1`. Backend README still mentions `VITE_USE_MOCK` — that flag **no longer exists** in frontend config.

**Do not create frontend database credentials.** Frontend needs only `VITE_API_BASE_URL`.

---

## 6. PostgreSQL Configuration

| Item | Actual |
|------|--------|
| Intended engine | PostgreSQL 16 (`backend/docker-compose.yml`) |
| Database name (compose) | `medixo_edux` |
| Database name (local `.env` example comments) | `medixo_edux` or `edux_local` |
| Schema | `edux` (`DB_SCHEMA`) |
| Connection | SQLAlchemy `create_engine` + `search_path` set to schema |
| Compose user | `medixo` / local docker volume `medixo_pg` |
| Init | `sql/init-edux.sql` creates schema only |
| SQLite fallback | README documents `sqlite:///./medixo.db`; `backend/medixo.db` is committed |

`ensure_schema()` is PostgreSQL-specific (`information_schema`, `SET search_path`, `CREATE SCHEMA`). SQLite is a local convenience, not the production path.

**This environment:** PostgreSQL port 5432 **closed**. No live RDS inspection.

---

## 7. Database Models

SQLAlchemy mapped classes (49):

| Domain | Models |
|--------|--------|
| Identity | `Institution`, `Role`, `User`, `UserRole`, `AuthSession`, `OtpChallenge`, `RegistrationDraft` |
| Catalog | `Department`, `Program`, `Subject`, `Course`, `Chapter`, `Topic`, `AcademicTerm`, `Batch`, `Campus`, `CalendarEvent` |
| People | `StudentProfile`, `FacultyProfile`, `Enrollment`, `Guardian`, `GuardianStudent` |
| Teaching | `AttendanceSession`, `AttendanceRecord`, `Assignment`, `AssignmentSubmission`, `Announcement` |
| Assessment | `Question`, `Paper`, `PaperQuestion`, `ContentSource`, `QuestionStudioSession` |
| Exams | `ExamSitting`, `ExamAttempt`, `ExamQuestionAttempt` |
| Interventions | `IssueGroup`, `Intervention` |
| Intelligence | `StudentDnaSnapshot`, `InstitutionHealthSnapshot` |
| AI | `AiPromptTemplate`, `AiConversation`, `AiMessage`, `AiTrace` |
| Ops | `AuditLog`, `SupportTicket`, `AppKv`, `NewsletterSubscriber`, `ContactInquiry`, `FileObject` |

**Conceptual mapping (selected)**

| Backend model | PostgreSQL table | API resource |
|---------------|------------------|--------------|
| `User` | `users` | `/v1/auth/*`, `/v1/admin/users` |
| `StudentProfile` | `student_profiles` | `/v1/student/profile`, faculty directory |
| `FacultyProfile` | `faculty_profiles` | `/v1/admin/faculty` |
| `Subject` | `subjects` | `/v1/admin/subjects` |
| `Question` | `questions` | `GET /v1/faculty/question-bank` (live) |
| `Paper` | `papers` | `GET /v1/student/exam-agent/exams` (status=`published`) |
| `PaperQuestion` | `paper_questions` | nested in exam-agent exams |
| `ExamAttempt` | `exam_attempts` | `POST/GET /v1/student/exam-agent/attempts` |
| `ExamQuestionAttempt` | `exam_question_attempts` | nested in attempt detail |
| `Intervention` | `interventions` | **ORM unused by routers** |
| `IssueGroup` | `issue_groups` | **ORM unused by routers** |
| `AppKv` | `app_kv` | paper generator, interventions, studio, SPA documents |
| `StudentDnaSnapshot` | `student_dna_snapshots` | `/v1/intelligence/exam-dna-signals` |
| `AuthSession` | `auth_sessions` | **unused** (refresh is stateless JWT) |

`sql/schema.sql` defines many additional tables **not** mapped in ORM (`permissions`, `role_permissions`, `question_embeddings`, `paper_shares`, `quizzes`, `source_chunks`, `studio_generated_questions`, `issue_group_members`, `intervention_students`, `ai_models`, `ai_quotas`, `notifications`, RLS helpers, pgvector, enums). **Runtime uses VARCHAR strings, not PG enums.**

---

## 8. Database Tables

### 8.1 ORM / `create_all` tables (49)

`institutions`, `roles`, `users`, `user_roles`, `auth_sessions`, `otp_challenges`, `registration_drafts`, `departments`, `programs`, `subjects`, `courses`, `chapters`, `topics`, `academic_terms`, `batches`, `campuses`, `calendar_events`, `student_profiles`, `faculty_profiles`, `enrollments`, `guardians`, `guardian_students`, `attendance_sessions`, `attendance_records`, `assignments`, `assignment_submissions`, `announcements`, `questions`, `papers`, `paper_questions`, `content_sources`, `question_studio_sessions`, `exam_sittings`, `exam_attempts`, `exam_question_attempts`, `issue_groups`, `interventions`, `student_dna_snapshots`, `institution_health_snapshots`, `ai_prompt_templates`, `ai_conversations`, `ai_messages`, `ai_traces`, `audit_logs`, `support_tickets`, `app_kv`, `newsletter_subscribers`, `contact_inquiries`, `files`.

### 8.2 SQLite snapshot (`backend/medixo.db`) — read-only

44 tables present (no `attendance_*`, `app_kv`, `contact_inquiries`, `newsletter_subscribers` in this file). Notable row counts:

| Table | Rows |
|-------|------|
| `users` | 138 |
| `user_roles` | 138 (admin 1, faculty 10, parent 1, student 126) |
| `student_profiles` | 126 |
| `faculty_profiles` | 10 |
| `questions` | **126** |
| `papers` | **9** (all `status=published`) |
| `paper_questions` | 126 |
| `exam_attempts` | 7 (Aarav seeds) |
| `exam_question_attempts` | 99 |
| `subjects` | 12 (all `exam_mode=university`) |
| `batches` | 7 (3 university CSE, 2 JEE, 2 NEET) |
| `interventions` | 0 |
| `issue_groups` | 0 |
| `question_studio_sessions` | 0 |
| `exam_sittings` | 0 |
| `auth_sessions` | 0 |

Questions by isolation:

| exam_mode | exam_family | count |
|-----------|-------------|-------|
| university | NULL | 36 |
| competitive | jee | 45 |
| competitive | neet | 45 |

All 126 questions: `q_type=mcq`, `status=approved`, `source=exam-agent`.

---

## 9. Complete API Inventory

Prefix: **`/v1`** unless noted.  
Count: **201** router endpoints + **`GET /health`** = **202**.  
Methods: GET 151, POST 44, PATCH 4, DELETE 2, PUT **0**.

Auth column: `public` = no bearer; `user` = `UserDep`; `faculty+admin` = `require_roles("faculty","admin")`; `admin` = `require_roles("admin")`; `parent` = `require_roles("parent","admin")` + `PARENT_PORTAL_ENABLED`.

### Auth (`/v1/auth`, prefix on router)

| Method | Endpoint | Auth | Role | Request | Response | DB |
|--------|----------|------|------|---------|----------|-----|
| POST | `/v1/auth/login` | public | optional `role` match | `LoginRequest` | `LoginResponse` | `users` |
| GET | `/v1/auth/me` | user | any | — | `UserPublic` | `users` |
| POST | `/v1/auth/refresh` | public | — | `{ refreshToken }` | `TokenPair` | `users` |
| POST | `/v1/auth/forgot-password` | public | — | `{ email }` untyped | `{ ok, message, verificationId, demoOtp }` | `otp_challenges` |
| POST | `/v1/auth/verify-otp` | public | — | `OtpRequest` | `{ ok, token }` | `otp_challenges` |
| POST | `/v1/auth/resend-otp` | public | — | `ResendOtpRequest` | `{ ok, message, demoOtp }` | `otp_challenges` |
| POST | `/v1/auth/reset-password` | public | — | `ResetPasswordRequest` | `{ ok, message }` | `otp_challenges`, `users` |
| POST | `/v1/auth/verify-email` | public | — | `OtpRequest` | `{ ok, verified }` | `otp_challenges` |
| GET | `/v1/auth/registration/options` | public | — | — | catalog JSON | institutions/programs + fixture |
| GET | `/v1/auth/registration/status` | public | — | query `email` | `{ registered, verified? }` | `users`, `registration_drafts` |
| POST | `/v1/auth/register` | public | — | `RegisterRequest` | `{ ok, verificationId, demoOtp, draftId }` | `registration_drafts` |
| POST | `/v1/auth/register/verify` | public | — | `OtpRequest` | tokens + user | `users`, `student_profiles` |
| POST | `/v1/auth/profile-setup` | public | — | untyped dict | `{ ok, user }` | `users`, `student_profiles` |
| POST | `/v1/auth/logout` | public | — | — | `{ ok: true }` | none |

### Platform (public)

`GET /v1/platform/{site,testimonials,pricing,faqs,blog,blog/{post_id},careers,case-studies,stats,contact}`  
`POST /v1/platform/newsletter`, `POST /v1/platform/contact`  
Source: SPA `platform` document + `newsletter_subscribers` / `contact_inquiries`.

### Student / intelligence (`UserDep`; student profile required only on some)

See §13. 39 endpoints.

### Faculty (`faculty` or `admin`)

See §14. 65 endpoints.

### Admin (`admin`)

See §25. 36 endpoints.

### Parent (`parent` or `admin`, feature-flagged)

See §26. 17 endpoints.

### AI (`UserDep`; executive is admin-only)

See §27. 18 endpoints.

### Health

`GET /health` — public.

---

## 10. Authentication

| Item | Actual behavior |
|------|-----------------|
| Login | `POST /v1/auth/login` `{ email, password, role? }` |
| Registration | `POST /v1/auth/register` → OTP → `POST /v1/auth/register/verify` |
| Verification | OTP hash SHA-256; **demo code always `482193`**, returned as `demoOtp` |
| Refresh | `POST /v1/auth/refresh` `{ refreshToken }` — JWT `typ=refresh`; **not stored/revoked** |
| Logout | `{ ok: true }` — **does not revoke tokens** |
| Current user | `GET /v1/auth/me` |
| Token type | Bearer JWT HS256 |
| Access claims | `sub` (user id), `institution_id`, `roles` (list), `typ=access`, `iat`, `exp` |
| Access expiry | 30 minutes |
| Refresh expiry | 14 days; claims `sub`, `typ=refresh` |
| Password | PBKDF2-SHA256; seed overwrites demo users with `DEMO_PASSWORD` |
| Middleware | `HTTPBearer`; 401 `"Not authenticated"` / `"Invalid or expired token"` / `"User not found"` if `status != active` |
| Role on login | If `role` provided, must equal `user.primary_role` or login fails |

**Frontend mismatches**

- `useResendOtp` POSTs **no body**; backend requires `{ email, purpose? }` → **422**.
- `AuthContext.login({ registerDraft })` still issues **client-fake tokens** (`sess_${Date.now()}`) and comments that registration has no backend — **backend registration exists**. Remaining mock auth path.
- OTP pages still read `localStorage` `EduX_registered_students`.

Demo accounts (seed): password from `DEMO_PASSWORD` (example `aurora123`). Emails include `aarav.sharma@medixoedux.edu` (student), `meera.krishnan@medixoedux.edu` (faculty), `ananya.iyer@medixoedux.edu` (admin), `rajesh.sharma@medixoedux.edu` (parent).

---

## 11. Authorization

- `require_roles(*codes)` intersects JWT-loaded `User.roles`, `legacy_role`, `primary_role`.
- Primary role preference: `admin` > `faculty` > `student` > `parent`.
- Faculty routers allow **admin**.
- Parent routers allow **admin**, then 403 if `PARENT_PORTAL_ENABLED=false`.
- Student routers mostly use `UserDep` only. `_require_student` is **not** applied to dashboard, exams, exam-agent list, interventions list, etc. Any authenticated user with a `StudentProfile` (or without, for payload GETs) can hit many `/student/*` screens.
- `GET /v1/intelligence/exam-attempts`: students forced to own id; **faculty/admin can pass `studentId`** and read another student's attempts.
- `GET /v1/admin/feature-flags` is **unauthenticated**.
- No permission table / `role_permissions` in runtime.
- No PostgreSQL RLS enabled in app (schema comments only).
- Institution isolation: most live queries filter `institution_id`; exam-agent papers filter after load. SPA JSON documents are **global fixtures**, not tenant-scoped.

---

## 12. RBAC

Roles that exist in seed and `User.primary_role`: **`student`**, **`faculty`**, **`admin`**, **`parent`**.

| Role | Typical endpoint class | Permission model | Ownership |
|------|------------------------|------------------|-----------|
| student | `/v1/student/*`, `/v1/intelligence/*`, `/v1/ai/*` | authenticated; profile required for submit/profile | attempts filtered by `user.id` when role is student |
| faculty | `/v1/faculty/*` | `require_roles("faculty","admin")` | papers/interventions keyed by `institution_id` in `app_kv`, **not faculty user id** |
| admin | `/v1/admin/*`, `/v1/directory/*`, faculty routes | `require_roles("admin")` | institution_id on live catalog |
| parent | `/v1/parent/*` | role + **feature flag off** | **no ward-scoped SQL**; returns SPA `parent` JSON |

`sql/schema.sql` mentions `hod` role and fine-grained permissions — **not implemented**.

Frontend `ROLES` / `NAV_GROUPS` match these four names. Parent portal also gated by `FEATURE_FLAGS.parentPortal = false`.

---

## 13. Student APIs

| Concern | Actual endpoint | Live SQL? | Notes |
|---------|-----------------|-----------|-------|
| Profile | `GET /v1/student/profile`, `GET /v1/intelligence/profile` | yes | `student_master_profile` |
| Dashboard | `GET /v1/student/dashboard` | **fixture** | `student-portal.dashboard` |
| Examinations list (UI hub) | `GET /v1/student/exams` | **fixture** | `student-portal.exams` — **not published papers** |
| Exam detail / start | **missing** | — | frontend calls `/student/exams/:id` and `POST /student/exams/:id/start` |
| Exam Agent papers | `GET /v1/student/exam-agent/exams` | **yes if papers exist** | published `Paper` + questions **including `correctAnswer`** |
| Attempts | `GET/POST /v1/student/exam-agent/attempts` | yes | canonical write path |
| Results / analysis | `GET /v1/student/exam-analysis`, `/options`, `/{id}` | mixed | live attempt if id matches, else fixture |
| Performance | `GET /v1/student/performance-accuracy` | fixture | |
| Subjects | `GET /v1/student/subjects` | fixture | |
| Chapters / questions | no dedicated student APIs | via exam papers | |
| Interventions | `GET /v1/student/interventions` (+ practice/retest/attempts) | `app_kv` + heuristic groups | |
| Academic intelligence snapshot | `GET /v1/intelligence/summary` | profile live, rest fixture | |
| DNA | `GET /v1/intelligence/exam-dna-signals` | snapshots if rebuilt | empty until attempts submitted |
| Student 360 | faculty only `GET /v1/faculty/students/{id}/360` | overlay template | |

---

## 14. Faculty APIs

Live SQL (when rows exist): students directory, attendance, assignments, announcements, **question bank**.

SPA / `app_kv`: research, lecture planner, exam builder, settings, courses, timetable, quiz builder, AI studio, reports, **paper generator**, PYQ, **question studio**, similar issues, interventions.

**Primary business flow support (as implemented):**

| Step | Endpoint | Persists to |
|------|----------|-------------|
| Question Bank | `GET /v1/faculty/question-bank` | `questions` if any; else SPA `questionBank` |
| Paper Generator UI config | `GET /v1/faculty/paper-generator` | `app_kv` `papers:{institution}` or SPA `paper-generator.json` |
| Create Paper | `POST /v1/faculty/paper-generator/papers` | **`app_kv` only** |
| Save Paper | same POST (inserts Draft) | **not `papers` table** |
| Publish Paper | **NO endpoint** | — |
| Student Examination | `GET /v1/student/exam-agent/exams` | **`papers` where status=published** |

`POST .../share` writes `app_kv` `paper_shares:{institution}` with `status: "Sent (prototype)"`. Does not change paper status and does not create student visibility.

Missing vs frontend `faculty-papers.js`: **`GET /faculty/paper-generator/papers/{id}`**.

---

## 15. Question APIs

| Field | Model / table | API exposure |
|-------|---------------|--------------|
| ID | `questions.id` string UUID-like (`EA-UNI-CS501-M1-Q01`) | `id` |
| Text | `stem` | faculty bank: `text`; exam-agent: `question` |
| Options | `options` TEXT JSON array of strings | `options` |
| Correct answer | `correct_answer` TEXT (index as string, e.g. `"1"`) | exam-agent: `correctAnswer`; **omitted from faculty bank serializer** |
| Explanation | `explanation` | not serialized in bank |
| Subject | `subject_id` FK | bank: subject **code** (e.g. `CS501`) or `exam_mode` |
| Chapter | `chapter_id` FK | bank wrongly maps **`chapter` ← `concept`** (topic), not chapter name |
| Topic | `concept` / `topic_id` | bank `topic` ← `concept` |
| Difficulty | `easy\|medium\|hard` | title-cased `Easy`… |
| Type | `q_type` default `mcq` | `MCQ` |
| Domain | `exam_mode` `university\|competitive` | **not returned as `domain`** |
| Exam family | `exam_family` `jee\|neet` or null | **not returned** |
| Metadata | marks, negative_marks, bloom, is_pyq, pyq_year, source, quality_score, status, created_by | partial |

**Filters:** frontend sends `domain, examFamily, subject, chapter, topic, difficulty, questionType, search, page, limit`.  
**Backend `question_bank()` accepts none of these.** Full list returned.

**Usable by paper generator?** Data exists in SQL and is listable. Generator **does not query `Question` by id**, does not persist `selectedQuestionIds` onto `paper_questions`, and does not freeze snapshots into `Paper`.

**Studio approve** claims “added to the Question Bank” but only flips flags in `app_kv` studio sessions — **no `Question` insert**.

---

## 16. Paper APIs

### SQL `Paper` (exam-agent / seed)

Fields: `id`, `institution_id`, `paper_code`, `title`, `exam_mode`, `exam_family`, `subject_id`, `course_id`, `paper_type`, `duration_minutes`, `total_marks`, `negative_marking`, `blueprint` JSON text, `status` (default `draft`; seed uses `published`), `version`, `parent_paper_id`, `intervention_id`, `created_by`, timestamps.

Associated via `PaperQuestion` (`sort_order`, `marks_override`, `snapshot` JSON).

### Faculty paper-generator JSON (create_paper)

Request: untyped `dict`. Required in handler: **`title`** non-empty. Duplicate title → `{ ok: false }` **HTTP 200**.

Stored fields include: `id` (`gp_new_…`), `paperCode`, `title`, `course`, `mode`, `examType`, `paperType`, `exam`, `subject`, `chapter`, `topic`, `program`, `faculty`, `totalMarks`, `duration`, `difficulty`, `questions` (count), `status: "Draft"`, dates, `coverage`, `sets`, `questionList`, `config`, `negativeMarking`, `interventionId`, `archived`, blooms, etc.

Frontend additionally sends `domain`, `examFamily`, `selectedQuestionIds`. Backend stores `mode`/`exam` aliases; **`selectedQuestionIds` is ignored**.

No `PUT`/`PATCH` for paper content except archive.

---

## 17. Paper Publishing

| Question | Finding |
|----------|---------|
| Publish endpoint | **Does not exist** |
| Publication model | SQL `papers.status`; faculty JSON `status` string (`Draft`) — **two different stores** |
| Status transitions | SQL: unconstrained VARCHAR. Schema file enumerates `draft, generated, published, archived`. Faculty: Draft / archive boolean |
| Student visibility | `exam_agent_bundle`: `Paper.status == "published"` and same `institution_id` |
| Authorization | faculty+admin for generator; any authenticated user for exam-agent exams |
| Publish validation | none |

**Gap:** faculty “Create Paper” never sets SQL `papers.status='published'`. Seeded exam-agent papers are the only student-visible papers.

---

## 18. Student Examination APIs

| Frontend expectation | Actual backend |
|----------------------|----------------|
| `GET /student/exams` published list, no answers | Returns **SPA `student-portal.exams`**, not `papers` |
| `GET /student/exams/:id` metadata only | **404** (route missing; `{course_id}` style not defined) |
| `POST /student/exams/:id/start` questions without answers | **404** |
| `GET /student/exam-agent/exams` | Live published papers **with `correctAnswer` on every question** |
| Enrollment | none — all published papers for the institution |
| Attempt creation | `POST /student/exam-agent/attempts` after client-side exam |

`ExamSitting` model exists (start/expiry/seed) — **no router uses it**. No in-progress attempt, no heartbeat, no server shuffle.

---

## 19. ExamAttempt

Table `exam_attempts`. Comment: “Canonical exam attempt — matches frontend Phase 0 contract.”

| Field | Storage | API (`attempt_to_dict`) |
|-------|---------|-------------------------|
| id | PK | `id` |
| student_id | FK | `studentId` |
| roll_no | | `roll` |
| exam_id | string (paper id) | `examId` |
| exam_name | | `examName`, `examTitle` |
| exam_mode | lowercase `university\|competitive` | title-cased `University\|Competitive` |
| exam_family | lowercase `jee\|neet` or null | `JEE\|NEET` |
| source | default `exam_agent` | `exam-agent` |
| attempt_kind | default `practice` | `attemptKind`; `mode` derived |
| is_demo | bool | `isDemo`; `mode=demo` if true |
| intervention_id | | `interventionId` |
| started_at / submitted_at | required timestamptz | ISO |
| exam_snapshot / timing / scoring / interactions / summary | JSON text | objects |
| sitting_id | unused | omitted |

**Create:** client sends `ExamAttemptCreate` (extra fields allowed). **Backend does not score.** It stores client `scoring`, `questionAttempts[].evaluation`, etc.

**Vs frontend contract (`docs/.../05-EXAM-ATTEMPT-CONTRACT.md`):** camelCase mapping is largely aligned. Differences: server assigns UUID; `examMode` stored lowercase; scoring not recomputed; `mock` always `false` on live rows; seed attempts `source=imported`; no in-progress state (`submitted_at` always set).

---

## 20. QuestionAttempt

Table `exam_question_attempts` (not `question_attempts`).

| Column | JSON in API |
|--------|-------------|
| question_id | `questionId` |
| question_number | `questionNumber` |
| question_snapshot | `question` |
| academic_context | `academicContext` |
| response | `response` |
| timing | `timing` |
| behaviour | `behaviour` (UK spelling) |
| evaluation | `evaluation` |

Frontend contract uses `behavior` (US) in the documented example; backend column/API is **`behaviour`**. Frontend Exam Agent likely already uses `behaviour` in canonical builder — adapters must not assume US spelling.

No standalone CRUD. Only nested on attempt write/read.

---

## 21. Results

There is **no dedicated results table** and **no server-side scorer**.

Flow: client submits attempt → stored JSON `scoring`/`summary` → optional `rebuild_student_dna` →  
`GET /v1/student/exam-agent/attempts/{id}` returns full attempt;  
`GET /v1/student/exam-analysis/{id}` if id is an attempt id returns `analysis_from_attempt` with `scoring`, `summary`, `chapters[]` (`chapter`, `accuracy`, `questions`), `accuracy`.

Fields that exist **only if the client sent them**: `score`, `maxScore`, `percentage`, `accuracy`, `correct`, `incorrect`, `unanswered`/`skipped`, time. Backend does not invent them.

Subject/chapter performance: derived from `academicContext.chapter` + `evaluation.isCorrect` when question rows exist.

Seed attempts have `scoring.accuracy/correct/total` only.

---

## 22. University / JEE / NEET

| Layer | Fields |
|-------|--------|
| `Subject` | `exam_mode`, `exam_family` — **seeded subjects are university-only** (CS501…). No JEE Physics vs NEET Physics subject rows |
| `Batch` | `exam_mode` + `exam_family` (`jee`/`neet`) — **7 batches isolate tracks** |
| `Question` / `Paper` | `exam_mode` + `exam_family` — questions **are** isolated (36 uni / 45 jee / 45 neet) |
| Faculty bank API | **does not return exam_mode/exam_family**; cannot filter JEE vs NEET Physics |
| Paper JSON | `mode` University/Competitive, `exam` family — not written to SQL |
| Attempts | stored lowercase; serialized title-case / uppercase family |
| DNA worker | buckets `(exam_mode, exam_family)` — isolation preserved if metadata is correct |
| Similar issues | hardcoded four chapter templates partitioned by domain/family — **not computed from attempts** |

**JEE Physics ≠ NEET Physics in SQL questions** (different `exam_family`, different paper ids `EA-JEE-PHY-01` vs NEET papers).  
**Not isolated in faculty question-bank response or filters.**  
University Physics as a competitive-style subject is not in the 12 university course subjects.

---

## 23. Student 360 Compatibility

`GET /v1/faculty/students/{id}/360` loads SPA template `student-360-aarav`, overwrites `student`, `batch`, `attempts` (live non-demo), some `derived`/`overview`/`attention`/`defaultDomain`.

| Frontend 360 need | Backend provides |
|-------------------|------------------|
| Identity / batch | yes (directory + profile) |
| Attempts list | yes if SQL attempts exist |
| Subjects / chapters / questions / trends / time-behaviour | **template leftover + client engines**, not computed server-side |
| Academic DNA | DNA endpoint is student-scoped snapshots; 360 does not embed live DNA |
| Similar Issues | not in 360 payload; separate prototype grouping |
| Interventions | separate endpoints |

**Backend available vs frontend required:** identity and attempts are available; rich 360 intelligence still depends on **frontend engines** and/or Aarav fixture fields. Not a complete server-side 360.

---

## 24. Intervention APIs

ORM `Intervention` / `IssueGroup` **are unused**.

Runtime:

- Groups: `build_similar_issues(students)` — 4 hardcoded fingerprints, first 8 students per pool
- Overrides / practice attempts / retests / custom groups: `app_kv`
- Status machine: `spa_issues.TRANSITIONS` (Detected → … → Resolved/Improving/Persistent/Dismissed)
- Practice questions: `practice_questions()` scans **published exam-agent papers** (includes answers)
- Effectiveness: prototype deltas from `app_kv` practice attempts

Implemented endpoints match frontend `faculty-interventions.js` and student intervention hooks **at path level**. Persistence is not the SQL intervention model.

---

## 25. Admin APIs

Live when catalog exists: dashboard KPIs (counts), users, departments, courses, programs, subjects, batches, calendar, students, faculty, directory.

Fixture-only: analytics, performance, placements, research, roles, permissions, audit-logs, ai-config, settings, revenue, attendance/assignment/exam analytics, **admin question-bank**, scholarships, cms, api-config, data-tools, intelligence summary/profile/datasets/derived.

No admin write APIs for institution/users/departments/batches (GET only).

`GET /v1/admin/feature-flags` → `{ parentPortal: bool }` — unauthenticated.

---

## 26. Parent APIs

All 17 routes exist. **`PARENT_PORTAL_ENABLED` default false → 403.**  
Payloads from SPA `parent.json`, not `Guardian` / `GuardianStudent` (those tables are seeded: 1 guardian linked to Aarav).  
No ward picker, no progress from attempts.

Frontend parent portal also disabled via `FEATURE_FLAGS.parentPortal`.

---

## 27. AI APIs

| Endpoint | Behavior |
|----------|----------|
| `POST /v1/ai/mentor/chat` | `MentorChatRequest`; persists `AiConversation`/`AiMessage`; OpenAI or fallback |
| `POST /v1/ai/tutor/respond` | `{ text, threadId }` |
| `POST /v1/ai/assistant/respond` | teaching studio system |
| `POST /v1/ai/executive/ask` | admin only; JSON mode if live |
| `POST /v1/ai/question-studio/generate` | excerpt → JSON questions (empty if no key) |
| `POST /v1/ai/teaching-studio/lesson` | lesson text |
| GET tutor threads | live conversations or fixture |
| GET `/ai/tutor/threads/{id}` | **fixture only** (ignores DB id) |
| copilot / learning-path / recommendations / weaknesses / prediction / graph-search / assistant threads / stats | SPA `ai.json` |
| `POST /ai/generate-quiz`, `/generate-exam` | fixture samples |

Provider: OpenAI Chat Completions when `OPENAI_API_KEY` set. Model from `OPENAI_MODEL`. Anthropic unused.  
Prompts: `MENTOR_SYSTEM`, `EXECUTIVE_SYSTEM`, `QUESTION_STUDIO_SYSTEM`, `TEACHING_STUDIO_SYSTEM`.  
Auth: any logged-in user except executive.  
Rate limiting: **none** (`ai_quotas` table not in ORM).  
Traces: `ai_traces`.  
Frontend still uses **`generateTutorReply`** client fallback on tutor/copilot failure.

---

## 28. Frontend API Comparison

| Frontend feature | Frontend service | Expected API | Actual backend API | Status |
|------------------|------------------|--------------|--------------------|--------|
| Login | `auth.js` / AuthContext | `POST /auth/login` | `POST /v1/auth/login` | **MATCH** (needs base URL) |
| Register / OTP | `auth.js` | `/auth/register`, `/register/verify` | same under `/v1` | **PARTIAL** (resend body; fake registerDraft session) |
| Refresh | axios interceptor | `POST /auth/refresh` | `POST /v1/auth/refresh` | **MATCH** |
| Student profile / intel | `intelligence.js` | `/intelligence/summary`, `/profile` | implemented | **PARTIAL** (profile live, snapshot fixture) |
| Question bank | `faculty-questions.js` | `GET /faculty/question-bank?domain&examFamily&…` | GET exists, **filters ignored** | **PARTIAL** |
| Paper generator | `faculty-papers.js` / `extra.js` | CRUD + share | KV JSON; no GET-by-id; no publish | **PARTIAL** |
| Paper detail | `fetchPaperById` | `GET /faculty/paper-generator/papers/:id` | **missing** | **NOT IMPLEMENTED** |
| Student exams hub | `student-examinations.js` | `/student/exams`, `/:id`, `POST /:id/start` | list is fixture; detail/start missing | **DIFFERENT / GAP** |
| Exam Agent | `exam-agent.js` | `/student/exam-agent/exams|attempts` | implemented live papers + attempts | **PARTIAL** (answer keys leaked; scoring client-side) |
| Interventions | `faculty-interventions.js` | faculty + student intervention paths | paths exist, KV not SQL | **PARTIAL** |
| Student 360 | `faculty-students.js` | `/faculty/students/:id/360` | template overlay | **PARTIAL** |
| Question studio | `question-studio.js` | studio CRUD | KV + fixture sources | **PARTIAL** |
| Micro-assessments | `micro-assessments.js` | `/faculty/micro-assessments/*`, `/student/micro-assessments/*` | **none** | **NOT IMPLEMENTED** |
| Admin intelligence | `admin-intelligence.js` | `/admin-intelligence/summary` | fixture JSON (~0.9MB) | **PARTIAL** |
| Parent | `index.js` | `/parent/*` | 403 unless flag | **MATCH path / disabled** |
| AI tutor | `index.js` | `/ai/tutor/respond` | implemented | **PARTIAL** + client fallback |
| Platform blog/contact | `auth.js` | `/platform/*` | implemented | **MATCH** |
| Landing content | `@/datasets/platform/content.js` | — | **client datasets, not API** | remaining static |

---

## 29. Documentation Comparison

Prior docs (`docs/backend-integration/`) described a **frontend-only prototype** (145 in-browser endpoints, `/api/...` future paths, no login API in Phase A master). The real backend **does exist** and uses **`/v1`**.

| Documented item | Class |
|-----------------|-------|
| Auth login/refresh/me | **A MATCHES** (added in real backend; older master said login was client-only) |
| Path prefix `/api/...` vs `/v1/...` | **C DIFFERENT** |
| 145 endpoints vs 202 | **E BACKEND HAS ADDITIONAL** + some frontend-only routes never built |
| ExamAttempt camelCase contract | **A / B** — storage matches intent; scoring not server-side |
| Question bank filters/pagination | **D NOT IMPLEMENTED** (docs/frontend expect them) |
| Paper publish → student exam | **D NOT IMPLEMENTED** |
| `GET /student/exams/:id/start` | **D NOT IMPLEMENTED** |
| Micro-assessments | **D NOT IMPLEMENTED** |
| Python layout `backend/app/api/auth/router.py` | **C DIFFERENT** (`app/api/v1/auth.py`) |
| Alembic + PG enums + RLS + pgvector | **B / D** — designed in `sql/schema.sql`, not runtime |
| localStorage as SoT | **F DOCUMENTATION NEEDS UPDATE** — frontend Phase 11 removed mock router; backend is hybrid SQL+KV |
| `VITE_USE_MOCK` | **F** — removed from frontend |

---

## 30. Data Transformation Requirements

Do **not** implement yet. Adapters will be required:

| Backend | Frontend expects |
|---------|------------------|
| `stem` | `text` / `question` |
| `q_type: "mcq"` | `type: "MCQ"` |
| `difficulty: "easy"` | `"Easy"` |
| `exam_mode: "university"` | `domain: "University"` / `examMode: "University"` |
| `exam_family: "jee"` | `examFamily: "JEE"` |
| `correct_answer: "1"` (string index) | `correctAnswer` number or letter |
| `options` JSON string | array |
| `concept` used as chapter in bank | real `chapters.name` |
| Paper JSON `mode`/`exam` | `domain`/`examFamily` |
| `questions: 22` (count) | `selectedQuestionIds[]` |
| `behaviour` | some docs say `behavior` |
| Faculty create `{ ok:false, error }` HTTP 200 | axios success; UI must inspect `ok` |
| FastAPI `{ "detail": "..." }` | frontend often `error.message` / empty states |
| JWT user `fullName` | already camelCase in `UserPublic` |

---

## 31. Pagination

**No pagination implementation** on question bank, exam lists, admin users, or attempts.

- Not `page`/`page_size`
- Not `limit`/`offset`

`GET /intelligence/exam-attempts` returns `{ items, count, total }` where `total == len(items)` (full scan).  
Frontend `useFacultyQuestions` sends `page`/`limit` — **ignored**.

---

## 32. Filtering

| Surface | Supported query params (actual) |
|---------|----------------------------------|
| Question bank | **none** |
| Exam-agent exams | **none** (institution filter in code) |
| `/student/exams` | **none** (frontend sends domain/examFamily/status/search — ignored) |
| Intelligence attempts | `studentId, roll, examMode, examFamily, examId, batchId, sectionId, includeDemo, includeSeeds` — **in-memory after fetch** |
| Question studio sources | `search, domain, exam, subject, sourceType, status, featured` — **fixture list** |
| PYQ analytics | `subject` |
| Similar issues | `scope` (stored, unused for logic) |
| Graph search | `q` |
| Copilot | `path` |
| Weak-topic questions | `subject, chapter` — **SPA faculty-workspace bank**, not SQL |

Exact names for bank filters **expected by frontend but not implemented:** `domain`, `examFamily`, `subject`, `chapter`, `topic`, `difficulty`, `questionType`, `search`, `page`, `limit`.

---

## 33. Error Contracts

No custom exception handlers. FastAPI defaults:

| Status | When | Body |
|--------|------|------|
| 400 | OTP/reset/transition | `{ "detail": "<string>" }` |
| 401 | missing/invalid token, bad login | `{ "detail": "Not authenticated" \| "Invalid or expired token" \| "Invalid email, password, or role" }` |
| 403 | role / student profile / parent flag | `{ "detail": "Insufficient role" \| "Student profile required" \| "Parent portal is disabled" }` |
| 404 | missing paper/attempt/source/session | `{ "detail": "..." }` |
| 409 | register existing email | `{ "detail": "An account already exists..." }` |
| 422 | Pydantic validation | `{ "detail": [ { loc, msg, type } ] }` |
| 429 | **not used** | — |
| 500 | unhandled | FastAPI default |

Several faculty mutations return **HTTP 200** `{ ok: false, error }` (missing title, duplicate paper, paper not found on delete/archive). Frontend treating HTTP success as success will mis-handle these.

`x-request-id` header added by middleware.

---

## 34. CORS

```
allow_origins = settings.cors_origin_list
allow_credentials = True
allow_methods = ["*"]
allow_headers = ["*"]
```

Default origins: `http://localhost:5173`, `http://127.0.0.1:5173`.

**Not included:** Vite preview hosts, production SPA origin, Arena `*.e2b.app` preview hosts.  
Credentials + origin list: browser SPA on any other host will fail preflight.

---

## 35. Docker / Deployment

| Item | Actual |
|------|--------|
| Backend Dockerfile | `backend/Dockerfile` — Python 3.12, `EXPOSE 8000`, uvicorn `0.0.0.0:8000` |
| Backend compose | `backend/docker-compose.yml` — `db` Postgres 16, `redis` 7, `api` port 8000, `DATABASE_URL` override to `db:5432/medixo_edux`, `DB_SCHEMA=edux` |
| Frontend Dockerfile | root `Dockerfile` — Node 22 build + nginx 1.27, **port 80**, **no API proxy** |
| nginx | SPA fallback only; **does not proxy `/v1`** |
| Networking | frontend container cannot reach backend unless `VITE_API_BASE_URL` is baked at **build** time |

---

## 36. Primary Examination Flow

```
EXISTING QUESTIONS (SQL questions, 126 in sqlite snapshot)
        ↓
QUESTION API  GET /v1/faculty/question-bank
        ↓  [GAP: no filters; chapter field wrong; selected IDs unused]
FACULTY PAPER GENERATOR  GET /v1/faculty/paper-generator
        ↓
CREATE PAPER API  POST /v1/faculty/paper-generator/papers
        ↓  [GAP: writes app_kv JSON Draft, NOT papers table]
PAPER DATABASE  (SQL papers = seeded exam-agent only)
        ↓  [GAP: NO PUBLISH API]
PUBLISH API  — missing —
        ↓
STUDENT EXAMINATION API
   GET /v1/student/exams          → SPA fixture (wrong pipeline)
   GET /v1/student/exam-agent/exams → SQL published papers (includes answers)
        ↓  [GAP: no /exams/:id, no /start, ExamSitting unused]
EXAM DELIVERY  client Exam Agent UI
        ↓
EXAM ATTEMPT  POST /v1/student/exam-agent/attempts
        ↓  [GAP: client scoring trusted]
SUBMISSION  same POST (always submitted_at)
        ↓
RESULT  GET attempts/:id + exam-analysis/:id + DNA worker
```

| Arrow | Endpoint | Request | Response | Model | Missing piece |
|-------|----------|---------|----------|-------|---------------|
| Questions → API | GET question-bank | (filters ignored) | `{ summary, questions[] }` | `Question` | filters, domain/family, pagination, chapter join |
| API → Generator | GET paper-generator | — | config + `generatedPapers` | `app_kv` | bind to SQL questions |
| Generator → Create | POST papers | `{ title, … }` | `{ ok, paper }` | `app_kv` | `Paper`+`PaperQuestion` insert from IDs |
| Create → DB | — | — | — | — | not connected |
| DB → Publish | — | — | — | — | publish endpoint + validation |
| Publish → Student | GET exam-agent/exams | — | `{ items, groupLabels }` | `Paper` | strip answers; align `/student/exams` |
| Delivery | — | — | — | `ExamSitting` unused | start/in-progress |
| Attempt | POST attempts | `ExamAttemptCreate` | `{ ok, id, attempt }` | `ExamAttempt` | server-side scoring |
| Result | GET analysis | — | analysis object | JSON scoring | authoritative score fields |

---

## 37. Security Findings

1. **Client-trusted scoring** on exam submit — students can POST arbitrary `scoring`/`evaluation`.
2. **Answer keys in `GET /student/exam-agent/exams`** (`correctAnswer` on every question).
3. **Hardcoded OTP `482193`** returned in API bodies (`demoOtp`).
4. **Logout does not revoke JWT**; `auth_sessions` unused.
5. **Default `SECRET_KEY`** in example (`dev-only-change-in-production` / `change-me-…`).
6. **Faculty papers/interventions/studio are institution-wide KV**, not owner-scoped — any faculty in the tenant mutates the same library.
7. **Student routes under-authorized** (many GETs any bearer).
8. **Faculty/admin can read other students’ attempts** via `/intelligence/exam-attempts?studentId=`.
9. **Profile-setup is unauthenticated** and updates user by email.
10. **Forgot-password always inserts OTP** even for unknown emails; returns demo OTP.
11. **Register stores plaintext password in `registration_drafts.payload`** until verify.
12. **CORS allowlist too narrow for deployed SPA; credentials true.**
13. **No RLS** despite schema comments.
14. **University/JEE/NEET isolation incomplete at question-bank API** (leak risk if UI merges by subject name).
15. **Parent ward access not enforced** (flag off; if enabled, fixture not relationship-checked).
16. **Admin feature-flags public.**
17. **Seed resets demo password hashes on every boot** when `SEED_DEMO_USERS=true`.

---

## 38. Backend Gaps

| Gap | Severity |
|-----|----------|
| Faculty papers not written to `papers` / `paper_questions` | **BLOCKER** for examination flow |
| No publish endpoint / status transition to student-visible | **BLOCKER** |
| `/student/exams` not bound to published papers | **BLOCKER** for Examinations UI |
| `/student/exams/:id` and `POST /:id/start` missing | **BLOCKER** for that UI path |
| Answer keys on exam-agent exam payload | **BLOCKER** (security) |
| Question-bank filters/pagination missing | **IMPORTANT** |
| `selectedQuestionIds` ignored | **BLOCKER** for ID-based generator |
| `GET .../papers/{id}` missing | **IMPORTANT** |
| Server-side scoring missing | **IMPORTANT** |
| `ExamSitting` unused (no start/lock/timer server-side) | **IMPORTANT** |
| Studio approve does not insert `Question` | **IMPORTANT** |
| Interventions/similar-issues not SQL / not evidence-based | **IMPORTANT** |
| Intelligence snapshots mostly fixtures | **IMPORTANT** |
| Micro-assessment APIs missing | **IMPORTANT** |
| Alembic unused; schema.sql ≠ ORM | **IMPORTANT** |
| Academic seed reads deleted `frontend/src/mock-data/exam-agent.js` | **BLOCKER** for **fresh** PG (sqlite snapshot already has questions) |
| Redis unused | MINOR |
| Parent real ward APIs | MINOR (flag off) |
| Rate limit / 429 | MINOR |
| PUT methods none | MINOR |

---

## 39. Integration Blockers

1. **Split brain:** SQL `Paper` (student exams) vs `app_kv` papers (faculty generator).
2. **No publish pipeline.**
3. **Frontend Examinations page vs Exam Agent page hit different APIs** with different data.
4. **`VITE_API_BASE_URL` unset → production host**, not local `/v1`.
5. **CORS** limited to localhost:5173.
6. **PostgreSQL not running** in this audit environment; production config expects PG schema `edux`.
7. **Fresh seed will not recreate 126 questions** because mock-data path is gone.
8. **Remaining frontend mock:** `registerDraft` fake tokens, `generateTutorReply`, landing/intelligence datasets, admin reports localStorage.
9. **Question filters** required by generator UI are not in the API.
10. **Trusting client exam scores** makes results/DNA unsafe as SoT.

---

## 40. Recommended Integration Order

1. Point SPA at backend (`VITE_API_BASE_URL`) and CORS for the real origin — **config only, after approval**.
2. Confirm auth: login, refresh, me, register/verify (fix resend body; retire registerDraft fake session).
3. **Unify questions:** bank GET with domain/examFamily/subject/chapter filters; map stem/text; hide nothing needed for builder except answers if required.
4. **Unify papers:** create/save must write `papers` + `paper_questions` from `selectedQuestionIds` + snapshots.
5. **Publish** endpoint: draft → published with validation; then student list.
6. Align **`GET /student/exams`** with published papers **without answer keys**; add detail/start or retarget UI to exam-agent with keys stripped.
7. **Server-side scoring** on attempt submit; persist ExamAttempt as canonical.
8. Results/analysis/DNA from stored attempts only.
9. Then Student 360 from attempts; then interventions SQL; then studio→bank; then micro-assessments; then admin writes; then parent.

---

### PHASE 1 — READY TO INTEGRATE

Contracts complete enough to wire with light adapters:

- Login / refresh / me / logout (logout is no-op but shape OK)
- Registration + OTP (except resend payload)
- Platform public GETs + newsletter/contact POSTs
- `GET /student/profile`, `GET /intelligence/profile`
- `GET /faculty/students` (126 live roster)
- `GET /admin/students|faculty|users|departments|courses|programs|subjects|batches|calendar|dashboard`
- Exam Agent **attempt write/read** (`POST/GET /student/exam-agent/attempts`)
- Faculty reports KV CRUD (prototype but paths match)
- Support tickets create/list
- Feature flags (parent off)

### PHASE 2 — NEEDS FRONTEND ADAPTER

- User public vs session user shape (`fullName` vs pages expecting extra fields)
- Question `stem`/`text`/`type`/`difficulty` casing
- Paper `mode` vs `domain`, duration vs `durationMinutes`
- Attempt `examMode` title-case vs lowercase
- `{ ok: false }` HTTP 200
- Intelligence summary: swap fixture blocks for live attempts/DNA incrementally
- Exam-agent exams: strip/hide `correctAnswer` on client until backend stops sending it (backend should stop; adapter is stopgap)
- Faculty paper library reading `generatedPapers` vs future SQL list

### PHASE 3 — BACKEND GAP

- Publish paper
- Persist generator papers to SQL
- Honor `selectedQuestionIds`
- Question filters + pagination
- `/student/exams/:id` + start
- Bind `/student/exams` to published papers without keys
- Server scoring
- ExamSitting live delivery
- Studio → `questions` table
- SQL interventions
- Micro-assessments entire API
- Admin/faculty question-bank admin fixture vs live
- Fresh-DB question seed without deleted mock-data

### PRIORITY 1 — EXAMINATION FLOW

**Required for Questions → Generator → Create → Publish → Student exam → Attempt → Submit → Results:**

| Piece | Status |
|-------|--------|
| Questions in DB | **Yes** in sqlite snapshot (126 MCQ, Uni/JEE/NEET split). Fresh PG seed **may not** recreate them |
| Question API | **Partial** — list exists, unusable as specified (no filters, weak mapping) |
| Faculty generator GET | **Partial** — SPA/KV config, not SQL-backed |
| Create paper | **Partial** — KV Draft, ignores question IDs |
| Paper DB | **Seeded exam-agent papers only** |
| Publish | **Missing** |
| Student exam list (hub) | **Wrong source** (portal fixture) |
| Student exam list (agent) | **Works for seeded published papers; leaks answers** |
| Start/sitting | **Missing** |
| ExamAttempt persist | **Works** (client payload) |
| Submission | **Works** as final POST |
| Results | **Works only if client sent scoring**; analysis-from-attempt helper exists |
| End-to-end faculty-created paper taken by student | **Does not work today** |

---

## Final recommendation (executive)

The backend is a **real FastAPI + SQLAlchemy + PostgreSQL-oriented** service that already speaks many of the SPA’s `/v1/...` paths and stores a **canonical ExamAttempt**. It is **not** yet a single source of truth for the examination product: faculty paper generation and student exam delivery are **disconnected**, publishing does not exist, question filters do not exist, and a large fraction of “APIs” still return **ported SPA JSON**.

**Do not implement until this audit is approved.** After approval, integrate in the order in §40, starting with auth connectivity and the Priority 1 examination spine.

---

## Audit metrics (requested)

1. **Backend stack:** FastAPI 0.115 + Uvicorn, SQLAlchemy 2, Pydantic 2, python-jose JWT, psycopg2, Python 3.12  
2. **Database:** PostgreSQL 16 intended, schema `edux`; sqlite snapshot present; PG unreachable here  
3. **Number of models:** **49** SQLAlchemy classes  
4. **Number of tables:** **49** ORM tables; **44** in sqlite file; `sql/schema.sql` defines a larger enterprise set  
5. **Number of API endpoints:** **202** (201 under `/v1` + `/health`)  
6. **Authentication:** JWT Bearer HS256 access+refresh; PBKDF2 passwords; OTP demo  
7. **RBAC roles:** student, faculty, admin, parent (parent flag off)  
8. **Question API:** **PARTIAL** — live list if rows exist; no filters; mapping incomplete  
9. **Paper API:** **PARTIAL** — KV generator + SQL seeded papers; not one resource  
10. **Exam API:** **SPLIT** — `/student/exams` fixture; `/student/exam-agent/exams` live published  
11. **ExamAttempt:** **IMPLEMENTED** (submit/list/get); no in-progress sitting; client scoring  
12. **Result API:** **PARTIAL** — no scorer; analysis if attempt id known  
13. **Student 360:** **PARTIAL** — template + live student/attempts  
14. **University/JEE/NEET:** **SQL questions/papers/batches isolated; APIs incomplete**  
15. **Frontend/backend mismatches:** base URL, filters, paper IDs, publish, exams vs exam-agent, `{ok:false}` 200s, resend OTP, registerDraft  
16. **Missing APIs:** publish, exam start/detail, paper GET-by-id, micro-assessments, question filters  
17. **Integration blockers:** split paper stores, no publish, answer-key leak, env/CORS, seed path, client scoring  
18. **Recommended order:** auth connectivity → question API → SQL paper create → publish → student delivery without keys → server scoring → results/DNA → 360/interventions
