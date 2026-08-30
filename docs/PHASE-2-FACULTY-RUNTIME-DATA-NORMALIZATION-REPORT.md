# Phase 2 — Faculty Runtime Data Normalization

**Date:** 2026-08-30  
**Branch:** `arena/01a04f10-edux`  
**Status:** Faculty runtime GETs and teaching mutations assemble from SQL. Admin SPA snapshots were not touched. Live PostgreSQL was **not** claimed — verification is sqlite + frontend unit tests + production build.

## Goal

```
Faculty action → Faculty UI → real API → FastAPI → PostgreSQL → assembled payload → existing Faculty UI
```

Empty faculty databases stay empty. Authenticated identity is the only operational faculty. No `apiData || facultyMock`, no Meera / Aarav / MIT-P overlay, no SEND because a paper merely exists.

## What changed

### Backend assembler

`backend/app/services/faculty_runtime.py` is the Faculty equivalent of `student_runtime`.

| Surface | Source |
|---------|--------|
| Identity / settings | `User` + optional `FacultyProfile` + `Institution.academic_year` |
| Intelligence snapshot | SQL directory, assignments, attendance, questions, papers, DNA weak topics |
| Courses | `courses` for the faculty institution |
| Question bank | existing `list_question_bank` (institution scoped) |
| Generation | existing `create_generation` → `questions` |
| Papers | existing examination spine + `generationStatus` / counts |
| Share / SEND | `publish_sql_paper` fail-closed until requested == valid generated |
| Student 360 | selected student SQL only |
| PYQ | `questions.is_pyq`; empty `yearsCovered` is `[]` |
| Assignments | `POST /faculty/assignments`, `POST .../grade` → `assignments` / `assignment_submissions` |
| Attendance | `POST /faculty/attendance`, `POST .../mark` → sessions / records |
| Studio generate | `create_generation` (never minted KV stems) |
| Studio sources | `content_sources` |
| Research / lecture planner / timetable / quiz builder | honest empty + BACKEND GAP where unpersisted |

Contract keys required by the existing Faculty UI (`derived.dashboard.successCenter`, `aiBrief`, `teachingHealth`, `teachingProductivity`, `attendanceIntelligence`, `assignmentAnalytics`, `engagementAnalytics`, `teachingInsights`, `attentionStudents`, `teachingTimeline`, `evaluationProgress`, `reports.library`, `aiStudio`, `datasets.teachingSchedule`) are always present. Empty evidence yields `0` / `[]` / `"Building"` — not prototype history.

### Examination spine (kept)

- Generate → persist questions → paper from `selectedQuestionIds` → READY when requested count is complete → publish → student start / attempt / submit / server score / DNA.
- `serialize_paper_faculty` now emits `generationStatus`, `requestedQuestionCount`, `validQuestionCount`, `generatedQuestionCount`, `ready`.
- Publish and share reject incomplete / archived / empty papers.
- University / JEE / NEET still come from `exam_mode` / `exam_family`.

### Frontend (UI preserved)

| Page / component | Change |
|------------------|--------|
| `Settings.jsx` | Profile name/email/phone from `/faculty/settings` — no Meera |
| `Assignments.jsx` | Create and Grade POST to SQL |
| `Attendance.jsx` | Save POSTs marks; KPI subtitles from live records |
| `paper-parts.jsx` | Faculty chip uses paper owner; share errors show backend `detail` |
| `intervention-center.jsx` | Meera approval/createdBy copy removed |

KPI cards, charts, tabs, Paper Library, Question Intelligence, Exam Agent, nav, modals, skeletons, empty/error, animations, layout were not redesigned.

### Fallbacks removed

- Faculty intelligence no longer serves `faculty-intelligence-summary.json`.
- PYQ no longer serves `pyq.json` fake 2011–2025 years.
- Student 360 no longer overlays `student-360-aarav.json`.
- Roster no longer falls back to SPA.
- Announcements / question-bank empty SQL no longer return `faculty-workspace`.
- Directory no longer hardcodes `2026–27` or `B.Tech — CSE`.
- AI assistant threads / quiz / exam samples no longer come from `ai.json`.

## KPI source map (Faculty)

| KPI / field | Source | Empty meaning |
|-------------|--------|----------------|
| Greeting / date | Authenticated `User.full_name` + clock | First name or “Faculty” |
| Teaching health score | Weighted attendance, assignment completion, published papers, attention count | `0` / grade `Building` |
| Question bank total / flagged / AI | `questions` count | `0` |
| Papers published / drafts | `papers.status` | `0/0` |
| Pending grading | submissions − graded | `0` |
| Attendance average | `attendance_records` per session | `0` |
| Students below 75% | calculated from records | `[]` |
| Hours saved / lessons drafted | not calculated — no evidence | `0` (not invented) |
| Weekly teaching hours / schedule | no timetable model wired | `0` / `[]` |
| PYQ years covered | distinct `pyq_year` on `is_pyq` rows | `[]` |
| Student 360 accuracy / attempts | that student’s `exam_attempts` | `null` / `[]` |
| Settings name | `users.full_name` | authenticated name |

## Remaining BACKEND GAPs (honest, not faked)

- Lecture planner persistence
- Timetable slots
- Research publications
- Per-question studio edit / regenerate / reject / delete
- Content-source AI analysis
- Micro-assessments API
- Interventions still use similar-issues engine + KV overrides (practice questions now come from the bank)
- Report library is still KV metadata (no fake size/pages); generation of PDF bytes is not implemented
- Admin runtime unchanged

## Isolation

- Faculty A cannot read Faculty B’s institution questions, students, or 360.
- Empty faculty (new institution, no catalog) returns empty students, bank `0`, PYQ `yearsCovered []`, no Meera/Aarav.
- `faculty_b` at `inst_b` still has `student_b` in fixtures — empty-directory tests use a dedicated empty institution, not `faculty_b`.

## Verification

Ran against sqlite (`backend/test/_exam_core.sqlite` via `conftest.py`). **Not live PostgreSQL.**

```
/tmp/edux-venv/bin/python -m pytest backend/test -q   # 68 passed
npm test                                             # 24 files / 294 tests passed
npm run build                                        # vite production build succeeded
```

Covered:

1. Authenticated faculty identity (not `u_fac_001` / Meera).
2. Cross-institution isolation.
3. Question bank from SQL; generate persists.
4. Incomplete paper cannot publish/share; READY paper share publishes to students.
5. Assignment create → student list → submit → grade → DB.
6. Attendance session + mark persist.
7. Student 360 is the selected student.
8. Empty faculty stays empty; no SPA overlay tokens.

## Do not

- DROP / TRUNCATE production PostgreSQL
- Start Admin Phase 3 from this report
- Treat sqlite green as “live PostgreSQL verified”
- Re-enable `payload("faculty-workspace")` when SQL is empty
