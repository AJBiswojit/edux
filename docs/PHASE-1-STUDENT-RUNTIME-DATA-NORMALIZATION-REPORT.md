# EduX — Phase 1 Student Runtime Data Normalization Report

**Phase:** 1 (STUDENT ONLY)  
**Branch:** `arena/01a04f10-edux`  
**Date:** 2026-08-30  
**Status:** Complete — Student operational state is assembled from PostgreSQL for the logged-in student. Faculty and Admin runtimes were not normalized.

Companion: [`RUNTIME-DATA-NORMALIZATION-MASTER-AUDIT.md`](./RUNTIME-DATA-NORMALIZATION-MASTER-AUDIT.md)

---

## Target (met)

```
USER ACTION → FRONTEND → REAL API → FastAPI → PostgreSQL → EXISTING UI
```

Empty tables yield calculated zeros, `null` CGPA (`—` in the UI), empty arrays, and existing empty/onboarding states. They do **not** fall back to SPA snapshots, Aarav Sharma, Meera, MIT-P, or `apiData || mockData`.

Student UI (KPI cards, charts, progress bars, tabs, nav, skeletons, empty/error states) is preserved. Intelligence engines are preserved and now receive SQL-assembled inputs.

---

## What changed

### Backend assembler

`backend/app/services/student_runtime.py` is the per-student snapshot builder used by leftover student GETs and by `live_catalog.student_{assignments,courses,events}`.

| Surface | Source |
|---------|--------|
| Identity | `users` + `student_profiles` (no overlay of Aarav extras as operational KPIs) |
| CGPA | Graded `assignment_submissions` + submitted **university** `exam_attempts`. Competitive attempts never contribute. No grades → `null` |
| Attendance | `attendance_records` / `attendance_sessions`. 0 records → `0%` from zero records |
| Assignments | `assignments` for **enrolled courses only**. Status from `assignment_submissions` |
| Courses / subjects / progress | `enrollments` + `courses`. Progress `0` until a lesson model exists |
| Calendar | `calendar_events` for the institution |
| Exams / mocks | Published `papers` only. Mock list = published papers whose `paper_type` is mock/practice-competitive |
| Exam analysis | Live `exam_attempts` only. Missing id → **404**, never SPA variants |
| DNA / health | `student_dna_snapshots` (worker on exam submit) + calculated health from attendance/CGPA/assignments |
| Portfolio / career | Empty structures (`github`/`linkedin` `""`, career goal `null`) until real portfolio rows exist |
| Settings | Per-user `app_kv` prefs; identity from SQL. Defaults are flags, not Aarav history |
| Programs | SQL `programs` or `{ current: null }` |
| Mentor workspace | `ai_conversations` / `ai_messages` or empty |
| Forum | `{ topics: [], categories: [] }` + **BACKEND GAP** |
| Admit card | `{ available: false }` with live name/roll |
| Practice | `questions` table (institution-scoped). Never SPA exam-agent catalogue |
| Dashboard leftover GET | Same assembler KPIs |

Wired (student):

- `GET /v1/intelligence/{profile,summary,datasets,derived}`
- `GET /v1/student/{dashboard,attendance,assignments,courses,courses/{id},subjects,events,mock-tests,settings,programs,forum,admit-card,exam-analysis,exam-analysis/options,exam-analysis/{id},mentor/workspace,academic-*,interventions}`
- `POST /v1/student/assignments/{id}/submit` → `assignment_submissions`
- `GET /v1/ai/{tutor/threads,threads/{id},copilot/suggestions,learning-path,recommendations,weaknesses,prediction,graph-search,stats}` — SQL conversations or honest empty
- Exam publish / start / submit / server score **unchanged**. `rebuild_student_dna` still runs on submit.

Removed student SPA fallbacks:

- `payload("student-intelligence-summary")` overlay
- `payload("student-portal")` leftover GETs
- exam-analysis SPA option concatenation / variant hero
- `live_catalog` student empty → `payload("student-portal")`
- AI tutor threads falling back to `ai.json` `tutorThreads`

Left **faculty/admin** SPA fallbacks in `live_catalog` / faculty / admin routers untouched.

### Frontend (student only)

Pages still consume `useStudentIntelligence` (and leftover GETs where already wired). They no longer fabricate operational numbers:

- Dashboard: CGPA `—` when null; study stats `?.`; course blurb from `coursesTop[0]` or enroll-empty copy (no CS505/`?? 71`)
- Assignments: `useSubmitAssignment` POST; 409/error toasts; EmptyState
- Settings: `useMasterStudentProfile` (no Aarav/MIT copy)
- Learning path / Programs / Forum: EmptyState; forum post/reply = BACKEND GAP toasts
- AI Tutor / student Copilot FAB: no `generateTutorReply` on failure (error toast). Faculty FAB fallback left in place
- Portfolio: no default SDE/GitHub links
- Attendance / Academics / Health / Success Center: optional chaining; live counts/trends; no hardcoded leave `+ 4` or “Sem 5 · 6 courses”
- Overview tab: no `cgpa ?? 8.72`; no “rank 42 → 14”

`src/intelligence/engine/**` kept. Student fake numeric **defaults** were stripped earlier; engines still compute from whatever datasets they receive.

---

## Honest empty (new / unenrolled student)

| KPI / list | Empty DB |
|------------|----------|
| CGPA | `null` → `—` |
| Attendance | `0%` from 0 records |
| Pending assignments | `0` / empty list |
| Study streak / hours / focus | `0` (no study-log table) |
| Courses / progress | `[]` / `0%` |
| Academic health | score `0`, grade `Building` |
| DNA / readiness / recommendations | empty arrays |
| Portfolio / career / achievements | empty / `0` |
| Forum | empty + BACKEND GAP |
| Admit card | `available: false` |
| Exam analysis options | `[]` |
| Tutor threads | `[]` |
| Mock tests | `[]` unless a mock paper is published |
| Today’s schedule | `[]` (no timetable usage) |

---

## Preserved (must not be treated as leftover mock)

- All student cards, charts, tabs, nav, modals, skeletons, empty/error UI
- Student intelligence engines and ExamAttempt contracts
- Faculty paper generate → persist → publish → student sit → server score → DNA rebuild
- Faculty/Admin dashboards and SPA snapshots (Phase 2 / 3)
- Landing marketing, nav, taxonomy, report templates
- Seeded Aarav demo rows (not dropped/truncated)
- `backend/.env.example` as PostgreSQL config source of truth

---

## Remaining student gaps (honest, not faked)

| Gap | Behaviour now |
|-----|----------------|
| Forum tables unused | Empty list + BACKEND GAP on post / reply / like |
| Micro-assessments API | Still missing; UI fail-closed (auth id only, no `u_stu_001`) |
| Timetable / study sessions | Empty schedule / zero streak until those tables are used |
| Portfolio / resume / GitHub | Empty until a portfolio model is written; PDF export = BACKEND GAP |
| Intervention practice attempts | Still KV (`practice_attempts`); list/practice questions are SQL; POST binds `user.id` |
| Planner / calendar writes | Buttons kept; BACKEND GAP toasts (no fake “added”) |
| Exam analysis PDF / share | Print uses `window.print()`; PDF/share = BACKEND GAP |
| Learning path | Honest empty until the path engine is wired to SQL activity |
| Faculty assignment **create/grade** | Still Phase 2; student submit is live |

---

## Verification (sqlite isolation — does not touch live PostgreSQL)

`backend/test/test_student_runtime.py` plus existing examination spine:

- Empty student snapshot contains no Aarav / 8.72 / 92.4
- Unpublished paper is hidden from `GET /student/exams`
- Assignments are enrolled-course only; other institution / other course hidden
- Submit writes `assignment_submissions`; graded marks move CGPA
- Attendance % from records
- Practice questions from `questions` (never other-institution ids)
- Exam submit still scores server-side, writes DNA snapshots, and exam-analysis 404s on missing ids
- Cross-student exam-analysis isolation (B cannot list or fetch A’s attempt)
- Practice-attempt POST uses authenticated `user.id` (body `studentId` ignored)

Full backend suite: **57 passed**.

---

## Final verification (Phase 1 close)

This pass proved the Student runtime is `USER → API → FastAPI → PostgreSQL → existing UI`, then fixed remaining student-only violations instead of only listing them. Faculty/Admin runtimes were not started.

1. **Fresh student.** `student_b` (unenrolled, other institution) receives identity from `users` + `student_profiles` only. No Aarav Sharma / Meera / MIT-P overlay. CGPA `null`, assignments `[]`, courses `[]`, forum empty, admit card `available: false`, exam-analysis options `[]`, tutor threads `[]`.
2. **Empty DB is calculated, not hardcoded.** Attendance `0%` from zero records; CGPA `—` from no graded university work; health grade `Building`; study streak `0` because no study-log table is used. No `const x = 0` stand-in for a live KPI.
3. **Network / API cleanliness.** Leftover student GETs assemble from SQL. Student routers do not call `payload("student-*")`. Missing analysis id → **404**. Forum / planner / PDF / share / resource download do not mint fake success bodies.
4. **SPA / fallback search (student only).** Student `live_catalog` empty-path no longer overlays `student-portal`. Faculty/admin SPA (`payload("faculty-workspace")`, `payload("admin-catalog")`, `payload("student-360-aarav")`, `payload("ai")` quiz/exam/assistant) **KEEP** for Phase 2/3.
5. **Assignment lifecycle.** Listing is enrolled-course only. `POST /student/assignments/{id}/submit` writes `assignment_submissions`. Graded marks move CGPA. Other-course / other-institution rows hidden. Faculty create/grade remains Phase 2.
6. **Attendance lifecycle.** `%` = present / total records (leaves included in assembler). Zero records → `0%`. `student_b` stays at 0 while A’s lecture is 100%.
7. **Course lifecycle.** Courses come from `enrollments` + `courses`. Progress `0` until a lesson model exists. Course detail uses optional `stats` / `modules` / `resources` (empty arrays, not crash / SPA modules).
8. **Exam lifecycle (spine unchanged).** Faculty generate → persist → READY → publish → student start/attempt → submit → **server score** → `rebuild_student_dna`. Unpublished papers hidden. Analysis is live `exam_attempts` only.
9. **KPI / chart provenance.** Dashboard / Academics / Progress Report / DNA consume `GET /intelligence/summary`. Exam analysis dashboard consumes `GET /student/exam-analysis/{attemptId}`. Missing cohort comparison cells stay `null`/`—`. Fabricated “6% behind … DSA lessons” copy removed.
10. **Student AI empty / error.** `GET /ai/tutor/threads` is SQL conversations (empty for a new student). Copilot suggestions `[]`. Graph search `{ results: [] }`. Student FAB does **not** fall back to `generateTutorReply`; error toast only. Faculty FAB fallback **KEEP**.
11. **PostgreSQL source of truth.** `backend/.env.example` (`DATABASE_URL`, `DB_SCHEMA=edux`). No frontend DB credentials. Tests use isolated sqlite via `conftest` and never DROP/TRUNCATE live PostgreSQL.
12. **Seeded rows kept, not universal runtime.** Demo Aarav rows were not deleted. They are not injected into a newly registered / unenrolled student. Isolation is authenticated identity, not frontend-selected IDs.
13. **Import graph.** Student production pages no longer import the `@/intelligence` barrel (which default-imports Aarav `master-profile` + datasets). `ProgressReport`, `ExamAgent`, exam-agent live/report import engine files only. Datasets remain on disk for engines/tests/docs — not student runtime.
14. **Cross-student + cross-institution isolation.** `student_b` cannot list or GET `student_a` exam analysis (404). Practice POST ignores body `studentId`. Assignments / questions never leak `q_other_inst` or unenrolled courses. Intelligence `profile.id` is always the bearer.
15. **Real activity empty → live.** After enroll + assignment submit + grade, CGPA is calculated (`>= 9.0` in fixture). After one present record, attendance is 100%. After a published paper + submit, analysis options include that attempt id and DNA snapshots exist.
16. **Hardcoded search classify.**
    - **KEEP:** landing/nav/taxonomy/report templates; intelligence engines; faculty/admin SPA snapshots; local theme toasts; `window.print()`; assignment/support success after a real mutation; generic exam-instruction copy.
    - **REMOVE (this pass):** `u_stu_001` student fallbacks; `@/intelligence` barrel on student pages; fake PDF/print/share/planner/calendar/export/download success toasts; fabricated Academics mentor DSA copy; broken `_student_groups` practice POST; Aarav default in micro-assessment hooks.
    - **GAP (honest):** forum persist, micro-assessments API, planner/calendar mutations, portfolio/resume PDF, learning-path SQL engine, faculty assignment create/grade, intervention practice KV.
17. **UI regression + tests.** Student KPI cards, charts, tabs, filters, search, nav, modals, skeletons, empty/error states, animations, and layout were not removed. Runs: backend **57 passed**; `npm test` **294 passed** (24 files); `npm run build` **succeeded** (Vite, 15s).

**Close criterion:** a brand-new student gets no fabricated history; APIs, charts, KPIs, and DNA use real evidence or honest empty/GAP. Met.

---

## Phase 1 stop line

Student runtime data normalization is **closed**. No Faculty or Admin operational snapshot was rewritten. No DROP/TRUNCATE against live PostgreSQL. No student UI removed.

**Next separately approved step:** PHASE 2 — FACULTY RUNTIME DATA NORMALIZATION.
