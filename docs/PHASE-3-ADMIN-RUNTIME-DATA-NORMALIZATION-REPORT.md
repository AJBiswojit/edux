# Phase 3 — Admin Runtime Data Normalization

**Date:** 2026-08-30  
**Branch:** `arena/01a04f10-edux`  
**Status:** Admin runtime GETs and people/catalog/settings/support/report mutations assemble from institution-scoped SQL. Student and Faculty runtimes and the examination spine were not modified. Live PostgreSQL was **not** claimed — verification is sqlite + frontend unit tests + production build.

## Goal

```
Admin action → existing Admin UI → FastAPI → PostgreSQL (institution-scoped) → existing Admin UI
```

Empty institutions stay empty (`0` / `[]` / `null` / existing empty shells). Authenticated `users` + `institutions` is the only operational identity. No MIT-P / Anil / Meera / Aarav overlay. No `payload("admin-intelligence-*")` / `admin-catalog` as operational truth. No fake success toasts. No `EduX_admin_report_library` as the report library.

Cards, charts, tabs, nav, skeletons, empty/error, and layout were not redesigned.

## What changed

### Backend assembler

`backend/app/services/admin_runtime.py` is the Admin equivalent of `student_runtime` / `faculty_runtime`.

`GET /v1/admin-intelligence/{summary,profile,datasets,derived}` now call the assembler from `user.id` / `user.institution_id`. SPA JSON files remain on disk and are **not** served as Admin operational truth.

| Surface | Source |
|---------|--------|
| Identity | `User` + `Institution` (name, email, firstName). No MIT-P / Anil unless that tenant exists |
| Totals | `COUNT` of `student_profiles`, `faculty_profiles`, `courses`, `departments`, `programs`, `batches` |
| Institution health | Calculated pillars from attendance / assignments / exams / people / catalog. No evidence → score `0`, grade `Building` |
| Students / faculty / users | SQL lists. No CSE / Good / B.Tech CSE defaults. Faculty `courses`/`students` are `0` until a teaching assignment model is wired |
| Catalog | `departments`, `programs`, `subjects`, `courses`, `batches`, `calendar_events`. Extra `placement` / `passRate` / `fee` are `null`, not SPA overlays |
| Attendance / assignments / exams | `attendance_*`, `assignments*`, `exam_attempts`, `papers` |
| Question bank | `questions` |
| Research | `research_publications` |
| Roles | `roles` + `user_roles` member counts |
| Audit | `audit_logs` (written on mutations) |
| Settings | `institutions` columns + `settings_json` |
| Reports | `generated_reports` + `files`; download only when `READY` |
| Support | `support_tickets` |
| Executive AI | `POST /v1/ai/executive/ask` with SQL `executive_context`; `GET /v1/ai/executive/threads` |
| P3 (revenue, scholarships, CMS, placements, API keys, data import, permissions, AI config) | Honest empty + `unavailable` / BACKEND GAP |

### Mutations (persist + `audit_logs`)

| Action | Endpoint |
|--------|----------|
| Create student | `POST /v1/admin/students` → `users` + `student_profiles` |
| Create faculty | `POST /v1/admin/faculty` → `users` + `faculty_profiles` |
| Invite | `POST /v1/admin/users/invite` |
| Activate / deactivate | `PATCH /v1/admin/users/{id}/status` |
| Catalog | `POST /v1/admin/{departments,programs,subjects,courses,batches}` |
| Calendar | `POST /v1/admin/calendar` |
| Settings | `PATCH /v1/admin/settings` |
| Support | `POST /v1/admin/support` |
| Reports | `POST/GET/DELETE /v1/admin/reports`, `GET .../download` (READY PDF only) |

Missing models stay disabled in the UI with **BACKEND GAP** toasts — never simulated success.

### Frontend (UI preserved)

Admin pages keep their cards/charts/tabs. Hooks in `src/services/extra.js` now include create/invite/status/catalog/calendar/settings/support/report/executive mutations. Command Center / Institution Intelligence still use `useAdminIntelligence` — the payload is now SQL-assembled.

P3 pages (Revenue, Scholarships, Cms, ApiConfig, DataTools, Permissions, AiConfig) render empty arrays and refuse fake exports/imports/keys.

HTTP path engines no longer substitute missing evidence with `90` / MIT-P. Fixture-only engine tests may still pass explicit numbers.

## KPI source map (Admin)

| KPI / field | Source | Empty meaning |
|-------------|--------|----------------|
| Greeting / institution name | Authenticated `User.first_name` + `institutions.name` | First name or “Admin”; institution name or `Institution` |
| Students / faculty / courses / departments / programs / batches | `COUNT(*)` | `0` |
| Institution health | Weighted pillars from live evidence | `0` / `Building` |
| Attendance overall | present / total on `attendance_records` | `0` if no sessions |
| Assignment submission rate | submissions / enrolled | `0` if no assignments |
| Exam pass rate / average | `exam_attempts.scoring` | `null` if no attempts |
| Question bank totals | `questions` | `0` / `[]` |
| Research pubs / citations | `research_publications` | `0` / `[]` |
| AI sessions | `COUNT(ai_traces)` | `0` |
| Placement / fee / invoices | no pipeline | `null` / `[]` + BACKEND GAP |
| Report library | `generated_reports` READY | `[]` |

## Remaining BACKEND GAPs (honest, not faked)

- Invoices / scholarships / CMS / placements / API keys / data import / permission matrix persistence / AI guardrail persistence
- Faculty course-load and advisee counts (no assignment join yet → `0`)
- `InstitutionHealthSnapshot` persist (score is calculated, not written)
- Custom role create from the Roles screen
- Admin question create (use faculty question bank)
- Directory CSV export

## Isolation

- Admin A at Institution A cannot see Institution B questions, students, or users.
- Empty institution (no catalog, no people) returns `0` / `[]`, health `Building`, no MIT-P / Anil / Meera / Aarav tokens.
- Tests create dedicated admins; `conftest.world` still has no default admin and no `FacultyProfile` on Fac A.

## Verification

Ran against sqlite (`backend/test/_exam_core.sqlite` via `conftest.py`). **Not live PostgreSQL.**

```
/tmp/edux-venv/bin/python -m pytest backend/test -q   # 87 passed
npm test                                             # 24 files / 294 tests passed
npm run build                                        # vite production build succeeded
```

Covered in `backend/test/test_admin_runtime.py`:

1. Authenticated admin identity (not MIT-P / Anil).
2. Empty institution stays empty (`0` / `[]` / health `Building`).
3. Cross-institution isolation (`q_uni_1` ↛ inst_b; `q_other_inst` ↛ inst_a).
4. Create student / faculty persist and reappear on GET.
5. Catalog, calendar, settings, support, invite, status persist; `audit_logs` written.
6. READY report PDF is downloadable.
7. P3 surfaces return `unavailable` + empty arrays.

## Do not

- DROP / TRUNCATE production PostgreSQL
- Treat sqlite green as “live PostgreSQL verified”
- Re-enable `payload("admin-intelligence-summary")` or empty-SQL → `admin-catalog`
- Start another phase from this report
- Overlay MIT-P / Anil / Meera / Aarav onto a newly registered institution
