# Phase 4 — Missing Backend Capabilities Report

**Date:** 2026-08-30  
**Branch:** `arena/01a04f10-edux`  
**Status:** Prioritized P0 → P1 → P2 plus Phase 4 close-out of remaining Faculty KV/mixed operational state. **Verified on isolated sqlite. Not tested against live PostgreSQL.**

Admin was not started. Faculty UI was not redesigned — existing screens were wired to real APIs. Empty databases stay empty. No new Aarav / Meera / MIT-P operational seed.

---

## 1. What this phase did

Missing Faculty/Student capabilities that previously 404’d, wrote `app_kv`, or returned SPA snapshots now persist through:

```
USER ACTION → FRONTEND → REAL API → FastAPI → SQLAlchemy → SQL tables → frontend state
```

PostgreSQL remains the documented production store (`backend/.env.example`: `DATABASE_URL`, `DB_SCHEMA=edux`). Isolated tests use sqlite `create_all`. Additive SQL is in `backend/sql/migrations/0001_phase4_missing_capabilities.sql` and has **not** been applied to a live database in this session.

---

## 2. Priority delivery

### P0 — Micro-assessments, studio lifecycle, assignment lifecycle, interventions

| Capability | Backend | Persistence | Student visibility |
|------------|---------|-------------|--------------------|
| Faculty create / generate / assign / send / analytics | `POST/GET /v1/faculty/micro-assessments*` | `micro_assessments`, `micro_assessment_questions`, `micro_assessment_targets`, `micro_assessment_attempts` | Hidden until `status=published` and a target row exists |
| Student list / get / submit | `GET/POST /v1/student/micro-assessments*` | Same tables; server scores answers | Cross-institution and unassigned students 403/404 |
| Question Studio edit / reject / version | `POST .../question-studio/sessions/{id}/questions/{qid}/edit\|reject` | `questions` updated; prior stem stored in `question_versions` | Faculty-only |
| Assignment draft → publish → student | `POST /faculty/assignments` (`status=draft`), `POST .../publish` | `assignments.status`, `published_at`, `archived_at` | Student list/submit skip draft and archived |
| Faculty-created interventions | `POST /faculty/students/{id}/interventions` | `issue_groups`, `interventions`, `intervention_students`, `intervention_status_history` | Student GET merges SQL rows that are assigned onward |

Student micro-assessment GET omits `correctAnswer`. Scoring is server-side.

### P1 — Lecture planner, timetable, content analysis

| Capability | Endpoint | Tables | Empty / fail behaviour |
|------------|----------|--------|------------------------|
| Lecture planner | `GET/POST /v1/faculty/lecture-planner` | `lesson_plans` | Empty faculty → `items: []` |
| Timetable | `GET/POST /v1/faculty/timetable` | `timetable_slots` | GET returns weekday groups; slot arrays empty until created |
| Source upload + analyze | `POST /faculty/question-studio/sources/upload`, `.../analyze` | `content_sources.extracted_text`, `analysis_status`, `source_chunks` | No text → `ok: false`, `status: FAILED`. Never invents sample topics |

### P2 — Research + reports / PDF

| Capability | Endpoint | Persistence | Notes |
|------------|----------|-------------|-------|
| Research publications | `GET/POST /v1/faculty/research` | `research_publications` | Empty → publications `[]`, counts 0. Grants/collaborations not modelled (honest empty) |
| Report generate | `POST /v1/faculty/reports` | `generated_reports` + `files` metadata + bytes on disk (`backend/var/storage`) | PDF bytes, not a fake flag |
| Report download | `GET /v1/faculty/reports/{id}/download` | Reads storage by `object_key` | **409 unless `status == READY`**. Frontend download button matches |

---

## 3. Schema / migrations

Additive only. No `DROP` / `TRUNCATE`. Tests do **not** run this file — they use sqlite `Base.metadata.create_all`.

File: `backend/sql/migrations/0001_phase4_missing_capabilities.sql`

Adds columns on existing tables (`assignments.status`, `content_sources.extracted_text`, `files.bytes`, `generated_reports.file_id/status/archived`, …) and creates:

- `question_versions`
- `micro_assessments` (+ questions, targets, attempts)
- `research_publications`
- `intervention_students` / `intervention_status_history` / `intervention_effectiveness` (ORM-aligned)

`CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`. Safe to re-run on PostgreSQL 16 after review. **Not applied to live PostgreSQL in this session.**

---

## 4. Frontend wiring (UI kept)

Existing Faculty screens call the new mutations. No KPI/layout redesign.

- Assignments: Publish on `lifecycleStatus === 'draft'`
- Research: Add publication dialog → `POST /faculty/research`
- Reports library/generate: download only when READY
- Micro-Assessment Studio: sources total falls back to `0`, not a fake 10
- Lecture / timetable / publication hooks in `src/services/extra.js`

Student micro-assessment pages already called `/student/micro-assessments*`; those routes now exist.

---

## 5. Isolation / honesty

| Rule | Result |
|------|--------|
| Empty DB stays empty | Lecture/research/reports/micro-assessments list `[]` for a new faculty |
| No overlay of Aarav/Meera | Unchanged from Phase 2; Phase 4 tests assert cross-institution 403/404 |
| No fake success | Analyze without text → FAILED. Download of non-READY report → 409. Unassigned student → 403 |
| Exam spine untouched | SEND/publish still fail-closed on incomplete papers |
| Correct answers | Not returned on student micro-assessment GET |
| University / JEE / NEET | Generation still uses backend `exam_mode` / `exam_family`, never subject-name inference |
| Admin | Not modified except shared infrastructure (sqlite connect timeout / WAL for sqlite URLs) |

Question generation still uses the **existing deterministic template generator** (`question_generation.py`). It is not an LLM. If that generator throws, the generation row is `FAILED` / 500 — it does not mint SPA stems. Content analysis does **not** invent topics when text is missing.

---

## 6. Remaining gaps (not claimed done)

- **Live PostgreSQL** was not connected. Do not treat sqlite green as production.
- Quiz builder / exam builder remain honest empty (`BACKEND GAP`).
- Research grants and collaborations have no tables — empty arrays, not sample orgs.
- Forum, Admin Command Center, parent portal — out of Phase 4.
- Object storage is local filesystem (`backend/var/storage`), not S3.
- `faculty_settings` / `student_settings` / `parent_settings` remain KV **UI preferences** (not operational state).

---

## 7. Verification (this session)

| Check | Result | Claim |
|-------|--------|-------|
| `pytest test` (backend, sqlite) | **79 passed** | Isolated sqlite only |
| `test/test_phase4_capabilities.py` | 6 passed | Micro-assessment lifecycle, draft assignment, studio version, lecture/timetable/research/report PDF, FAILED analysis, SQL intervention |
| `test/test_phase4_closeout.py` | 5 passed | Similar-issues derived empty/SQL, practice → `exam_attempts`, AI Studio `ai_traces`, paper_shares SQL |
| `npm test` | **294 passed** (24 files) | Frontend unit/UI tests |
| `npm run build` | **passed** (Vite 5.4.21) | Production bundle |
| Live PostgreSQL | **not run** | Do not claim |

Host interpreter: `/tmp/edux-venv`. Test DB: `backend/test/_exam_core.sqlite` (gitignored, created/dropped per session).

---

## 8. Files of record

| Path | Role |
|------|------|
| `backend/app/models/capabilities.py` | Micro-assessments, lessons, slots, research, reports |
| `backend/app/models/assessment.py` | `QuestionVersion`, source analysis columns |
| `backend/app/models/interventions.py` | Students / history / effectiveness |
| `backend/app/services/micro_assessments.py` | Faculty + student lifecycle + studio send |
| `backend/app/services/studio_lifecycle.py` | Edit / reject / version snapshots |
| `backend/app/services/teaching_ops.py` | Lectures, timetable, research, assignment publish |
| `backend/app/services/reports_runtime.py` | SQL reports + READY-only download |
| `backend/app/services/content_analysis.py` | FAILED without text |
| `backend/app/services/interventions_sql.py` | Faculty-created SQL interventions |
| `backend/sql/migrations/0001_phase4_missing_capabilities.sql` | Additive PG migration |
| `backend/test/test_phase4_capabilities.py` | Isolated sqlite proofs |
| `docs/RUNTIME-DATA-NORMALIZATION-MASTER-AUDIT.md` | Updated inventory |

---

## 9. PHASE 4 CLOSE-OUT

Audit of remaining Faculty mixed/KV operational data. **Not a new feature phase.** No Admin work. Faculty UI was not redesigned.

Classification used:

| Kind | Rule |
|------|------|
| REAL OPERATIONAL STATE | PostgreSQL |
| DERIVED ANALYTICS | Calculate from PostgreSQL; empty evidence → `[]` |
| STATIC CONFIG | Code/config |
| UI PREFERENCE | KV / localStorage OK |
| TEST DATA | Fixtures only |

### Four areas

| Area | Decision | Implementation |
|------|----------|----------------|
| Similar-issue groups | **Derived.** Never seed Graph Algorithms / CHAPTERS. Empty evidence → `[]`. Persist only faculty intervention *decisions*. | `similar_issues_runtime.similar_issues_for_faculty` reads `exam_attempts` / `exam_question_attempts` and DNA. Faculty `GET /interventions` is SQL-only. `POST .../similar-issues/{id}/interventions` still writes `issue_groups` + `interventions`. Status/modify/retest 404 unless SQL. |
| Intervention practice / retest | **Operational.** Student action → `exam_attempts` (`attempt_kind` `intervention_practice` / `intervention_retest`, `intervention_id` when SQL). No dedicated attempt table. | `intervention_practice.submit_practice` server-scores bank answers; ignores client totals. Retest payload is bank questions when SQL status is `retest_pending`. Effectiveness from those attempts. |
| AI Studio history | **Operational generation history.** Prefer existing `ai_traces`. UI must not list a save without a row. Empty item → persist `FAILED`, omit from history. | `GET/POST /faculty/ai-studio*` → `AiTrace` (`feature` `ai_studio:{kind}`). List is per faculty user, COMPLETED only. |
| Paper-share list | **Operational delivery.** Reuse `paper_shares` (already in `schema.sql`). Paper is not “sent” from a frontend click alone. | `PaperShare` ORM. Share still fail-closes through `publish_sql_paper`. List joins faculty-owned papers. Incomplete paper → 400. |

### Faculty KV sweep (close-out)

| Key | Class | Action |
|-----|-------|--------|
| `custom_groups` | leftover operational | Removed from similar-issues path |
| `interventions` overrides | leftover operational | Removed; SQL status history only |
| `practice_attempts` | operational | → `exam_attempts` |
| `retests` | operational | → intervention status + bank questions |
| `ai_studio_history` | operational | → `ai_traces` |
| `paper_shares` | operational | → `paper_shares` table |
| `faculty_settings` / `student_settings` | UI prefs | **Kept KV** |

Additive migration `backend/sql/migrations/0002_phase4_closeout.sql` is `CREATE TABLE IF NOT EXISTS paper_shares`. **Not applied to live PostgreSQL.**

Empty institution stays empty. Cross-institution isolation is server-side. Exam spine / READY / SEND fail-closed unchanged.

### Stop line

Phase 4 close-out stops here. Do not start Admin. Do not treat sqlite 79 as live-PostgreSQL certification.
