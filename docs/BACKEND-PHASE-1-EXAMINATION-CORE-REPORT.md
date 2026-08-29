# Backend Phase 1 — Examination Core Report

**Status:** Implemented and verified against **sqlite** (`backend/test/_exam_core.sqlite` during pytest). **Live PostgreSQL was not reachable** in this environment (`localhost:5432` previously refused). This report does **not** claim production PG verification.

**STOP:** No further phase. Unrelated domains (micro-assessment, AI, 360, parent) were not changed as product work.

---

## What now works

| Flow | Behaviour |
|------|-----------|
| Faculty question bank | `GET /v1/faculty/question-bank` filters in SQL on `exam_mode` / `exam_family` (University / JEE / NEET), plus subject, chapter, topic, difficulty, type, search, `page`, `limit`. Isolation is **not** inferred from subject name. |
| Paper create | `POST /v1/faculty/paper-generator/papers` inserts `papers` + `paper_questions` from `selectedQuestionIds`. Owner is JWT `user.id`. Duplicate title → 409. Mixed JEE/NEET IDs → 422. |
| Paper get/list | `GET .../papers` and `GET .../papers/{id}` read SQL. Faculty sees own institution papers; non-admin faculty only their `created_by`. |
| Publish | `POST .../papers/{id}/publish` sets `status=published` after validating questions exist and match mode/family. |
| Student exams | `GET /student/exams` lists published papers **without** question keys. `GET /student/exams/{id}` metadata only. `POST .../start` creates `ExamSitting` + in-progress `ExamAttempt` (`submitted_at` null) and returns questions **without** `correctAnswer`. |
| Exam agent | `GET /student/exam-agent/exams` is the same published SQL set with question stems/options, **no answer key**. |
| Submit / score | `POST /student/exam-agent/attempts` and `POST /student/exams/{id}/submit` score from `questions.correct_answer` + marks / `negative_marks` / `paper.negative_marking`. Client `scoring`, `studentId`, and forged faculty ids are ignored. Duplicate submit → 409. |

`app_kv` remains for unrelated features (shares, studio, reports). It is **not** the source of truth for exam papers.

---

## Schema / auth notes

- `ExamAttempt.submitted_at` is optional on the ORM so sittings can start without a submit timestamp.
- `ensure_schema()` (PostgreSQL only) runs `ALTER TABLE … exam_attempts ALTER COLUMN submitted_at DROP NOT NULL`. Additive; no DROP/TRUNCATE of exam rows.
- Faculty ownership and student identity come from JWT (`current_user`), not request body.
- Student delivery serializers raise if `correctAnswer` is about to be included.

---

## Verification

```text
cd backend && python -m pytest test/test_examination_core.py -q
```

Covers: bank isolation (Uni ≠ JEE ≠ NEET, including JEE Physics ≠ NEET Physics), SQL persistence of IDs, publish, student leak check, server score vs client 999, resubmit 409, cross-institution 404.

**Not verified:** connecting to `DATABASE_URL` in `backend/.env.example` / `backend/.env`. Do not treat sqlite tests as PG proof.

---

## Remaining gaps (out of this phase or residual)

| ID | Residual |
|----|----------|
| GAP-01 | Registration dob/gender — unchanged. |
| GAP-10 | Faculty bank now returns `correctAnswer` / `explanation` / pyq fields; year/session still absent if not on the row. |
| GAP-11 | Logout still does not revoke JWTs. |
| GAP-12 | CORS / Arena origins unchanged. |
| GAP-13 | Micro-assessments API still missing. |
| GAP-14 | Studio approve still does not insert `questions`. |
| Practice helpers | `practice_questions()` used by interventions still reads `exam_catalogue()`. Student HTTP delivery no longer includes keys. Intervention practice is out of phase. |
| Live PG nullable column | Until `ensure_schema` runs against the real cluster, an existing NOT NULL `submitted_at` would block `start_exam`. |

Frontend: question-bank fetch no longer client-paginates the full dump. Paper preview “Publish via backend” calls the real publish route (no fake success toast).
