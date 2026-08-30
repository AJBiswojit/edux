# EduX — Complete PostgreSQL Schema Migration Report (migration 0003)

> **This migration creates/updates the PostgreSQL STRUCTURE only. It does not seed application data.**
>
> No demo users, no MIT-P / Aarav / Meera fixtures, no questions, no analytics numbers, no
> fake CGPA/attendance values. Zero `INSERT` of business data. Nothing is dropped, truncated
> or rewritten.

| Item | Value |
|---|---|
| Migration file | `backend/sql/migrations/0003_complete_postgresql_schema.sql` |
| Verification script | `backend/scripts/verify_postgres_schema.py` (read-only) |
| Source of truth | Current SQLAlchemy models in `backend/app/models/**` (the FastAPI runtime) |
| Target | PostgreSQL, schema **`edux`** (per `DB_SCHEMA` in `backend/.env`) |
| Scope | **65 tables, 546 columns, 134 foreign keys, 40 indexes, 15 unique constraints** |

---

## 1. Current schema inventory

The audit covered `backend/app/models/**`, `backend/app/db/**` (`base.py`, `session.py`),
`backend/app/services/**`, `backend/app/api/**`, `backend/sql/**`, both prior migrations and
the app boot path (`app/main.py::_boot_schema` → `ensure_schema()` + `Base.metadata.create_all`).

Authoritative model registry (`Base.metadata`, PostgreSQL dialect compile):

| Domain | Tables |
|---|---|
| Identity / platform | `institutions`, `roles`, `users`, `user_roles`, `auth_sessions`, `otp_challenges`, `registration_drafts` |
| People | `student_profiles`, `faculty_profiles`, `guardians`, `guardian_students`, `enrollments` |
| Academic catalog | `departments`, `programs`, `subjects`, `courses`, `chapters`, `topics`, `academic_terms`, `batches`, `campuses`, `calendar_events` |
| Teaching ops | `assignments`, `assignment_submissions`, `attendance_sessions`, `attendance_records`, `announcements` |
| Assessment / Question Studio | `questions`, `question_versions`, `question_generations`, `question_generation_items`, `papers`, `paper_questions`, `paper_shares`, `content_sources`, `source_chunks`, `question_studio_sessions` |
| Exam runtime | `exam_sittings`, `exam_attempts`, `exam_question_attempts` |
| Interventions | `issue_groups`, `interventions`, `intervention_students`, `intervention_status_history`, `intervention_effectiveness` |
| Intelligence | `student_dna_snapshots`, `institution_health_snapshots` |
| AI platform | `ai_prompt_templates`, `ai_conversations`, `ai_messages`, `ai_traces` |
| Phase 4 capabilities | `micro_assessments`, `micro_assessment_questions`, `micro_assessment_targets`, `micro_assessment_attempts`, `lesson_plans`, `timetable_slots`, `research_publications`, `generated_reports` |
| Ops / CMS / support | `audit_logs`, `support_tickets`, `app_kv`, `newsletter_subscribers`, `contact_inquiries`, `files` |

All backend data access is ORM-based (no raw SQL table references in `services/`, `api/`, `workers/`),
so the SQLAlchemy metadata **is** the runtime contract. `sql/schema.sql` is a legacy design document
(see §8) and is *not* what the application runs against.

### Three-way comparison performed

For every table the audit compared:

* **A — SQLAlchemy model** (authoritative; compiled with the PostgreSQL dialect)
* **B — Existing migration files** (`sql/schema.sql`, `0001_phase4_missing_capabilities.sql`, `0002_phase4_closeout.sql`)
* **C — Live PostgreSQL schema** (via `information_schema` / `pg_catalog` in the verification script)

The migration brings B and C into alignment with A — additively and idempotently.

---

## 2. Tables created / verified

All 65 model tables are created with `CREATE TABLE IF NOT EXISTS` in dependency order
(parents before children — institutions → users → profiles → catalog → courses → teaching →
assessment → exams → intelligence → AI → ops). A pre-existing table is never dropped or
recreated; only missing columns/constraints are added to it.

## 3. Columns created / verified

All **546 columns** are guaranteed by the migration:

* New tables get the full model column set at creation.
* Pre-existing tables get every missing column via `ALTER TABLE … ADD COLUMN IF NOT EXISTS`
  (546 statements cover every model column — no-ops where the column already exists).
* `NOT NULL` columns carry the model's own default (`'pending'`, `'published'`, `'{}'`, `0`, `now()`, …)
  so they can be added safely to populated tables. **Model defaults only — no analytics values.**
* Columns that are `NOT NULL` in the model *without* a default are added as nullable and then
  tightened by a guarded `SET NOT NULL` loop; if existing rows contain NULLs the column stays
  nullable and a `WARNING` is raised instead of failing or back-filling invented data.

## 4. Foreign keys

All **134 model foreign keys** are attached by a guarded loop (section 6 of the migration).
Each FK is added only if:

1. both tables and both columns exist,
2. the column types are **identical** (`format_type` comparison — protects legacy UUID-typed tables),
3. no equivalent FK already exists (matched by column list, name-agnostic).

Incompatible or duplicate candidates are **skipped with a WARNING** and appear in the
verification report — never force-converted, never validated destructively.

Key relationships reproduced (exactly as modeled):

* `users.institution_id → institutions.id`; `student_profiles.user_id → users.id`;
  `faculty_profiles.user_id → users.id`; `guardians.user_id → users.id`
* `user_roles → users / roles / institutions` (composite PK)
* `enrollments → student_profiles.user_id / courses.id / academic_terms.id`
* `courses → institutions / programs / subjects`; `departments`, `programs`, `subjects`, `batches` → `institutions`
* `assignments → institutions / courses / faculty_profiles.user_id`
* `assignment_submissions → assignments.id / student_profiles.user_id / users.id (graded_by)`
* `attendance_sessions → courses / batches / faculty_profiles.user_id`;
  `attendance_records → attendance_sessions.id / student_profiles.user_id`
* `questions → institutions / subjects / chapters / topics / users(created_by)`
* `papers → institutions / subjects / courses / papers(parent) / users(created_by)`;
  `paper_questions → papers / questions`; `paper_shares → papers / users`
* `exam_sittings → institutions / papers / student_profiles`;
  `exam_attempts → institutions / exam_sittings / student_profiles / batches`;
  `exam_question_attempts → exam_attempts`
* `interventions → institutions / issue_groups / faculty_profiles / users(approved_by)`;
  `intervention_students / intervention_status_history / intervention_effectiveness → interventions`
* `student_dna_snapshots → student_profiles.user_id`;
  `institution_health_snapshots → institutions.id`
* `ai_conversations → institutions / users`; `ai_messages → ai_conversations / ai_prompt_templates`;
  `ai_traces → institutions / users`
* `micro_assessments → institutions / faculty_profiles / question_generations`;
  `micro_assessment_{questions,targets,attempts}` → `micro_assessments` / `questions` / `student_profiles`
* `lesson_plans → institutions / faculty_profiles / courses`;
  `timetable_slots → institutions / faculty_profiles / courses / batches`;
  `research_publications → institutions / faculty_profiles`
* `generated_reports → institutions / users / files`; `files → institutions / users`
* `audit_logs → institutions / users`; `support_tickets → institutions / users(requester)`
* `question_generations → institutions / users(faculty)`; `question_generation_items → question_generations / questions`
* `question_versions → questions / users`; `content_sources → institutions / subjects / users`;
  `source_chunks → content_sources`; `question_studio_sessions → institutions / faculty_profiles / content_sources`
* `calendar_events`, `campuses`, `announcements`, `auth_sessions`, `otp_challenges`,
  `registration_drafts`, `academic_terms`, `chapters`, `topics`, `guardian_students` → their modeled parents

Notes: `papers.intervention_id`, `exam_attempts.intervention_id`, `exam_attempts.exam_id`,
`micro_assessments.subject/chapter/topic` are plain columns **without** FKs in the models — the
migration faithfully reproduces that (it does not invent constraints).

## 5. Indexes

The exact model index set — **40 indexes** (`ix_edux_<table>_<column>`), created with
`CREATE INDEX IF NOT EXISTS`; existing indexes are never dropped:

* user / people lookup: `users(email)`, `auth_sessions(user_id)`, `student_profiles(roll_no)`,
  `otp_challenges(email)`, `registration_drafts(email)`, `contact_inquiries(email)`
* question bank filtering: `questions(institution_id)`, `questions(exam_mode)`, `questions(exam_family)`
* exam pipeline: `exam_attempts(institution_id / student_id / exam_mode / exam_family / intervention_id)`,
  `exam_question_attempts(attempt_id)`
* interventions: `intervention_students(intervention_id / student_id)`,
  `intervention_status_history(intervention_id)`, `intervention_effectiveness(intervention_id)`
* faculty surfaces: `question_generations(institution_id / faculty_id)`,
  `micro_assessments(institution_id / faculty_id)`, `lesson_plans(institution_id / faculty_id)`,
  `research_publications(institution_id / faculty_id)`, `timetable_slots(institution_id)`
* assessment/content: `generated_reports(institution_id)`, `paper_shares(paper_id)`,
  `question_versions(question_id)`, `source_chunks(source_id)`
* AI: `ai_messages(conversation_id)`, `ai_traces(feature)`
* unique index: `newsletter_subscribers(email)`

(Primary keys and the unique constraints below also provide the modeled access paths —
e.g. `users(institution_id,email)`, `papers(institution_id,paper_code)`.)

## 6. Constraints

* **Primary keys** — every model PK (single-column VARCHAR(36) ids or natural composite PKs such as
  `user_roles(user_id,role_id,institution_id)`, `attendance_records(session_id,student_id)`,
  `paper_questions(paper_id,question_id)`).
* **15 unique rules** (14 constraints + 1 unique index), matched by column list, name-agnostic:
  `institutions(slug)`, `roles(institution_id,code)`, `users(institution_id,email)`,
  `departments(institution_id,code)`, `programs(institution_id,code)`, `courses(institution_id,code)`,
  `batches(institution_id,code)`, `campuses(institution_id,name)`,
  `attendance_sessions(course_id,batch_id,session_date)`, `student_profiles(institution_id,roll_no)`,
  `assignment_submissions(assignment_id,student_id)`, `papers(institution_id,paper_code)`,
  `ai_prompt_templates(institution_id,code,version)`, `micro_assessment_targets(assessment_id,student_id)`,
  and unique index `newsletter_subscribers(email)`.
* **Nullability** enforced to match the models (353 NOT NULL columns, guarded tightening).
  `exam_attempts.submitted_at` is deliberately relaxed to nullable (in-progress attempts) — the same
  fix the runtime's `ensure_schema()` applies; loosening a constraint cannot lose data.
* **Check constraints / native enums / arrays** — none exist in the models; none are invented.

## 7. PostgreSQL-specific types

Types follow the models exactly (compiled for the PostgreSQL dialect):

| Concern | Type used | Notes |
|---|---|---|
| Identifiers / UUIDs | `VARCHAR(36)` | App generates UUID **strings** in Python (`uuid_pk()`); no native `uuid` columns, no `gen_random_uuid()` |
| Timestamps | `TIMESTAMP WITH TIME ZONE` (`TIMESTAMPTZ`) | `created_at/updated_at` with `DEFAULT now()` where the model has server defaults |
| Dates | `DATE` | e.g. `attendance_sessions.session_date`, `date_of_birth` |
| JSON payloads | `TEXT` | Models store JSON **strings** (e.g. `payload`, `files`, `blueprint`, `settings`) |
| Enumerations | `VARCHAR(n)` | status/kind/mode columns validated by app logic |
| Numbers | `INTEGER`, `DOUBLE PRECISION` | `FLOAT` in models → `double precision` in PostgreSQL |
| Booleans | `BOOLEAN` | e.g. `is_pyq`, `pinned`, `is_demo`, `negative_marking` |
| Extensions | `pgcrypto` best-effort only | Not required by models; failure is a NOTICE, never fatal |

No SQLite compatibility compromises: the file uses PostgreSQL-only syntax
(`ADD COLUMN IF NOT EXISTS`, `pg_constraint`/`pg_index` catalog loops, PL/pgSQL `DO` blocks).

## 8. Known previous schema drift (what 0003 fixes)

1. **`assignment_submissions.graded_by` / `graded_at` missing** → the reported production error
   `psycopg2.errors.UndefinedColumn: column assignment_submissions.graded_by does not exist`.
   Both columns now exist with FK to `users.id` (`VARCHAR(36)`) and `TIMESTAMPTZ` respectively.
2. **`sql/schema.sql` describes an older/aspirational enterprise schema** using native `UUID`,
   `CITEXT`, `JSONB`, `ENUM`, `NUMERIC`, `VECTOR`, `INET`, `BIGSERIAL` PKs — divergent from the
   ORM (VARCHAR(36)/TEXT/FLOAT). Databases built from it are reported (not converted) — see §12.
3. **Migration 0001 drift**: `graded_by UUID REFERENCES users(id)` and Phase-4 tables with
   native `UUID` PKs (`question_versions`, `micro_*`, `research_publications`, …) and
   `intervention_effectiveness DOUBLE PRECISION` — 0003 defines these as the models expect
   (`VARCHAR(36)`); UUID-typed legacy objects are skipped with WARNINGs, never rewritten.
4. **Migration 0002 drift**: `paper_shares.audience JSONB` vs model `TEXT`.
5. **`users` restored-legacy table** missing `role`, `phone`, `first_name`, `avatar_url`,
   `status`, `email_verified_at`, `last_login_at`, `updated_at` — added idempotently
   (mirrors the runtime's own `ensure_schema()` alignment).
6. **`exam_attempts.submitted_at` NOT NULL** in older schemas → nullable now.
7. **`attendance_sessions.topic`** missing in older schemas → added (`VARCHAR(255)`).
8. **`assignments.status/published_at/archived_at`**, **`content_sources.extracted_text/analysis_status/analysis_error`**,
   **`files.bytes`**, **`generated_reports.file_id/status/archived`**, **`timetable_slots.topic/slot_type`** —
   all guaranteed by 0003 (0001 additions kept, types aligned to models).
9. Tables present in `schema.sql` but **not in the current models** (e.g. `permissions`,
   `role_permissions`, `batch_faculty`, `student_competitive_tracks`, `question_embeddings`,
   `studio_generated_questions`, `quizzes`, `exam_attempt_events`, `issue_group_members`,
   `student_360_snapshots`, `exam_readiness`, `faculty_intelligence_snapshots`, `ai_models`,
   `ai_quotas`, `cms_pages`, `blog_posts`, `contact_submissions`, `forum_topics`, `forum_posts`,
   `invoices`, `scholarships`, `api_keys`, `notifications`) are **not created** by 0003 (they are
   not part of the current backend) and are **never dropped** if they exist. The verifier lists
   them as informational extras.

## 9. `assignment_submissions.graded_by` / `graded_at` fix

```sql
ALTER TABLE edux.assignment_submissions ADD COLUMN IF NOT EXISTS graded_by VARCHAR(36);          -- FK → users.id (guarded)
ALTER TABLE edux.assignment_submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP WITH TIME ZONE;
```

* Types taken **verbatim** from the model (`graded_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"))`,
  `graded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))`) — both nullable,
  no defaults, no backfill.
* All other `assignment_submissions` columns verified: `id`, `assignment_id`, `student_id`, `files`,
  `submitted_at`, `marks`, `feedback`, `status` + `UNIQUE (assignment_id, student_id)` + FKs.
* Verified at runtime: `POST /v1/faculty/assignments/{id}/grade` wrote `graded_by=u_dev_faculty`
  and `graded_at=2026-08-30 04:12:24+00` on the PostgreSQL-backed server (test artifact afterwards removed).

## 10. Migration execution instructions

From the repository root, against your **local** database (defaults from `backend/.env`:

```bash
psql "postgresql://postgres:Postgres%40123@localhost:5432/edux_local" \
  -v ON_ERROR_STOP=1 \
  -f backend/sql/migrations/0003_complete_postgresql_schema.sql
```

* Password contains `@` → URL-encode as `%40` (as in `.env`).
* `-v ON_ERROR_STOP=1` recommended: the file is designed to complete without errors;
  WARNINGs (deliberate skips of incompatible legacy objects) do not stop it.
* Safe to **re-run** any number of times (fully idempotent — verified by executing it twice).
* If your `DB_SCHEMA` is not `edux`, change the schema name at the top of the file
  (`CREATE SCHEMA IF NOT EXISTS edux; SET search_path TO edux, public;` and the qualified names).

## 11. Verification instructions

```bash
cd backend
python scripts/verify_postgres_schema.py                     # uses DATABASE_URL/DB_SCHEMA from .env
python scripts/verify_postgres_schema.py --database-url "postgresql+psycopg2://postgres:Postgres%40123@localhost:5432/edux_local" --verbose
```

* Strictly **read-only** (`information_schema` / `pg_catalog` only).
* Checks every expected table, column (type + length + nullability), PK, FK, unique rule and
  index against live model metadata, prints a `TABLE / STATUS` matrix and exits
  `0` on `SCHEMA VERIFICATION: PASS`, `1` on FAIL (exact mismatches listed).
* The migration file also embeds read-only verification queries (section 9 of the SQL file),
  including an explicit check for `edux.assignment_submissions.graded_by` / `graded_at`.

Start the backend on PostgreSQL:

```bash
cd backend
DATABASE_URL="postgresql+psycopg2://postgres:Postgres%40123@localhost:5432/edux_local" DB_SCHEMA=edux \
  uvicorn app.main:app --reload --port 8000
# dev accounts (separate, sanctioned script — NOT part of the migration):
python -m scripts.create_dev_accounts     # student@edux.dev / faculty@edux.dev / admin@edux.dev
```

## 12. Existing-data safety

* No `DROP TABLE`, no `TRUNCATE`, no `DELETE FROM`, no type rewrites, no database recreation.
* Tested on a simulated drifted local database containing pre-migration development rows
  (institution, user, student profile, assignment, submission, exam attempt, `app_kv` row):
  after 0003 **all rows were intact with unchanged values**, and the sentinel student could log
  in and read its pre-migration exam attempt through the real API.
* If the migration encounters objects it must not touch (e.g. legacy `uuid`-typed columns), it
  **skips with a WARNING and leaves the data alone**; the verifier then reports the exact
  mismatch. Nothing is ever silently ignored.
* Incompatible legacy data is **never** destructively converted — see §14 for the safe path.

## 13. Test results

Executed against a real PostgreSQL 16.2 server (sandbox replica of the local configuration:
`postgres:…@localhost:5432`, database `edux_local`, schema `edux` — exactly mirroring `backend/.env`):

| Check | Result |
|---|---|
| SQLite backend tests (`pytest`) | **88 passed** |
| Frontend tests (`npm test`) | **299 passed (26 files)** |
| Frontend build (`npm run build`) | **PASS** |
| PostgreSQL migration (fresh DB) | **PASS** — 0 errors, 0 warnings; idempotent on re-run |
| PostgreSQL schema verification (fresh DB) | **PASS** — 65/65 tables OK |
| PostgreSQL migration (drifted legacy DB w/ data) | **PASS** — drift fixed, sentinel rows intact |
| PostgreSQL schema verification (drifted legacy DB) | **PASS** |
| PostgreSQL migration (UUID/JSONB world from `sql/schema.sql`) | **PASS (non-destructive)** — incompatible FKs skipped w/ WARNINGs, data intact, verifier reports exact mismatches |
| Backend startup on PostgreSQL (`uvicorn`) | **PASS** — `schema_ready`, no demo seed with `SEED_DEMO_USERS=false` |
| Authentication (student/faculty/admin JWT login) | **PASS** |
| Student APIs (`/v1/intelligence/summary`, `/v1/student/interventions`, `/v1/student/admit-card`, `/v1/student/assignments`, `/v1/student/attendance`, `/v1/student/exams`, dashboard, courses, settings, exam-analysis, exam-agent, mentor, events, mock-tests, micro-assessments) | **200 — true empty states** (`[]`, `0`, `null`; no fake data, no 500s) |
| Faculty APIs (`/v1/faculty/question-bank`, `paper-generator*`, `assignments`, `students`, `lecture-planner`, `timetable`, `research`, `interventions`) | **200 — true empty states** |
| Admin APIs (`/v1/admin-intelligence/summary`, `/v1/admin-intelligence/datasets`, `/v1/admin/students`, `/v1/admin/faculty`, `/v1/admin/courses`, dashboard, departments, audit-logs, calendar, research, settings) | **200 — true empty states** |
| Grading write path (`graded_by`/`graded_at`) | **PASS** — values persisted and read back |

Route names follow the repository (`/v1/faculty/papers` and `/v1/faculty/dashboard` do not exist
in this backend; their live equivalents are `/v1/faculty/paper-generator/papers` and the faculty
surfaces listed above — all verified).

## 14. Remaining schema gaps (NOT auto-migrated — by design)

1. **Legacy `sql/schema.sql` databases (native `uuid`/`jsonb`/`citext`/enum types).**
   The ORM speaks `VARCHAR(36)` / `TEXT`; a `uuid`-typed `users.id` cannot receive ORM inserts.
   0003 refuses to convert these. Safe strategy (manual, reviewed): rename the legacy tables
   aside (the runtime's own `ensure_schema()` precedent, `<table>_legacy`) or export/import the
   rows into model-typed columns, then re-run 0003 + the verifier. Data is untouched until a
   human chooses.
2. **`numeric` vs `double precision`** on legacy mark/CGPA columns (schema.sql used `NUMERIC`).
   Reads still work; `verify_postgres_schema.py` reports each occurrence for informed decision.
3. **`files.bytes INTEGER` (model) vs `BIGINT`** in schema.sql worlds — informational mismatch.
4. Tables listed in §8.9 (legacy design, unused by the current backend) may exist; they are
   neither created nor dropped and show up as informational extras in the verifier.
5. `sql/schema.sql` itself contains a pre-existing defect unrelated to this migration
   (`dna_unique` index: `COALESCE(exam_family,'none')` fails on its own enum) — left as-is.

---

**Reiteration:** *This migration creates/updates the PostgreSQL STRUCTURE only. It does not seed
application data.* Development accounts remain the responsibility of the separate, sanctioned
`backend/scripts/create_dev_accounts.py` script; the optional demo/academic seed is app-startup
behaviour (`SEED_DEMO_USERS`), not part of this migration.
