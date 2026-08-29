# EduX — Local Development Accounts

Real, reusable local development accounts for testing the EduX frontend against a
local database through the **existing** FastAPI authentication flow.

---

## 1. Purpose

This project ships one backend utility that creates exactly **one Student, one
Faculty, and one Admin** account as **real rows in your local database**
(PostgreSQL by default, per `backend/.env`). The accounts exist so you can log
into the normal frontend login screen and reach each role's dashboard while
developing.

They are **not** mock users, not localStorage users, and not a second
authentication mechanism. They are plain rows in `users` / `user_roles` /
`student_profiles` / `faculty_profiles`, hashed with the backend's existing
PBKDF2 implementation, authenticated by the existing
`POST /v1/auth/login`, and authorised by the existing RBAC
(`require_roles`) and JWT (`roles` claim) — identical to any other account.

---

## 2. ⚠️ Development-only warning

- The credentials below are **LOCAL DEVELOPMENT CREDENTIALS ONLY**.
- Never create these accounts anywhere shared, staged, or production.
- Never reuse these passwords for real accounts.
- The utility is safe to re-run but is intended for local use; do not wire it
  into CI/CD, containers, or deployment pipelines.

---

## 3. Account emails

| Role    | Email               |
|---------|---------------------|
| Student | `student@edux.dev`  |
| Faculty | `faculty@edux.dev`  |
| Admin   | `admin@edux.dev`    |

> **Why `edux.dev` and not `edux.local`?**
> The existing login endpoint validates emails with pydantic's `EmailStr`
> (the `email-validator` package), which **rejects special-use domains such as
> `.local`, `.localhost`, and `.test` with HTTP 422** before any database
> lookup. `student@edux.local` could therefore never pass through the real
> `POST /v1/auth/login`. The utility uses `edux.dev`, which the unmodified
> login schema accepts. Do not loosen auth validation to make `.local` work.

All three accounts live in the dedicated **`EduX Local Development`**
institution (slug `edux-local-dev`), kept separate from any demo/seed data that
may also exist in your database.

## 4. Development passwords

| Role    | Password          |
|---------|-------------------|
| Student | `EduxStudent@123` |
| Faculty | `EduxFaculty@123` |
| Admin   | `EduxAdmin@123`   |

These satisfy the backend's existing password policy (min 8 chars, at least one
uppercase letter, one lowercase letter, one digit — enforced by
`app/schemas/auth.py`). Passwords are stored only as PBKDF2-SHA256
(390,000 rounds) hashes in `users.password_hash`, exactly like every other
account.

---

## 5. How to create the accounts

From the backend directory (e.g. `D:\EduX\backend`):

```bat
cd D:\EduX\backend

:: with the project virtualenv (recommended)
.venv\Scripts\python.exe -m scripts.create_dev_accounts

:: or with whatever Python has the backend requirements installed
python -m scripts.create_dev_accounts
```

macOS/Linux equivalent:

```bash
cd backend
.venv/bin/python -m scripts.create_dev_accounts
```

Expected output (first run):

```
========================================================
EDUX LOCAL DEVELOPMENT ACCOUNTS
========================================================
Institution: EduX Local Development (edux-local-dev) — CREATED
Roles created: student, faculty, admin

Student
  Email: student@edux.dev
  Status: CREATED

Faculty
  Email: faculty@edux.dev
  Status: CREATED

Admin
  Email: admin@edux.dev
  Status: CREATED

Login verification (existing authenticate() + JWT implementation):
  [OK] student@edux.dev -> JWT roles ['student']
  [OK] faculty@edux.dev -> JWT roles ['faculty']
  [OK] admin@edux.dev -> JWT roles ['admin']

Development accounts are ready.
```

The command never prints the passwords.

## 6. How to safely re-run

Just run the same command again. A re-run reports each account as
`ALREADY EXISTS`, changes nothing, and exits `0`:

```
Student
  Email: student@edux.dev
  Status: ALREADY EXISTS
...
All development accounts already exist — nothing was changed.
```

Exit codes: `0` = success (created or already exists), `1` = a conflict/failure
was reported (see below).

## 7. How idempotency works

- Each account is located by **global email lookup — the exact same lookup the
  login flow uses** (`User.email == lower(email)`).
- If the account already exists, the utility **inspects but never modifies** it:
  - reports `ALREADY EXISTS` when the account is in the dev institution, has the
    expected role link, the expected profile row, `active` status, and the
    documented dev password;
  - reports **`CONFLICT`** (exit `1`) listing exactly what differs (different
    institution, missing role link, missing profile, suspended status, or a
    different password). Conflicting records are left **completely untouched** —
    the utility never deletes, updates, or re-hashes an existing user.
- Supporting records are reused via natural keys: the institution by `slug`,
  each role by `(institution_id, code)`.
- The whole run is **transactional**: each account is created inside a
  SAVEPOINT, and if anything fails the entire run rolls back — no partially
  created users are ever left behind.

What gets created on a fresh database (and nothing more):

| Record | Detail |
|---|---|
| `institutions` | 1 — `EduX Local Development` (slug `edux-local-dev`) |
| `roles` | 3 — `student`, `faculty`, `admin` for that institution |
| `users` | 3 — one per role, `legacy_role` set to the role code |
| `user_roles` | 3 — one link per user |
| `student_profiles` | 1 — roll no `DEV-STU-001` (`institution_id` + `roll_no` are the model's required fields) |
| `faculty_profiles` | 1 — designation `Local Development Faculty` |

`Department`, `Batch`, `Program`, and `Course` are **nullable** on the
`StudentProfile` model, so per the minimum-records rule none are created. No
exams, questions, papers, attempts, results, or any other academic data is
created. If your `.env` also has `SEED_DEMO_USERS=true`, the demo dataset the
API seeds on boot remains separate and untouched.

## 8. Required PostgreSQL configuration

The utility uses the **existing backend configuration only** —
`app.core.config.get_settings()` → `app.db.session.engine` — with
`backend/.env` (shape documented in `backend/.env.example`) as the source of
truth:

```env
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@localhost:5432/YOUR_DB
DB_SCHEMA=edux
```

- On PostgreSQL, all tables live in the schema named by `DB_SCHEMA`
  (`edux` by default). The utility performs the same additive bootstrap the API
  does at startup (`ensure_schema()` + `create_all`), so it also works before
  the first API boot on a fresh database.
- No new database credentials, no new config files, no frontend database
  configuration. The chain stays: **React (Vite) → FastAPI → SQLAlchemy →
  PostgreSQL**.
- SQLite also works if your `DATABASE_URL` is `sqlite:///./medixo.db`
  (zero-setup fallback documented in `backend/README.md`).

## 9. How to verify login

Start the API (`start.bat`, or `uvicorn app.main:app --reload --port 8000`),
then either use the normal frontend login screen at `/auth/login` — each
account lands on its own dashboard (Student → Student dashboard, Faculty →
Faculty dashboard, Admin → Admin dashboard, driven by the `user.role` the
backend returns) — or verify the API directly:

```bash
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@edux.dev","password":"EduxStudent@123"}'
```

Expected response (truncated):

```json
{
  "accessToken": "<existing JWT implementation>",
  "refreshToken": "...",
  "user": { "role": "student", "email": "student@edux.dev", "institution": "EduX Local Development", ... }
}
```

The JWT `roles` claim is issued by the existing `create_access_token`
(e.g. `"roles": ["student"]`). Repeat with the faculty/admin credentials and
expect `user.role` of `faculty` / `admin`.

The utility itself also verifies every account through the real
`app.services.seed.authenticate()` + JWT path at the end of each run (disable
with `--skip-verify`).

## 10. How to remove these accounts manually

The utility **never deletes anything**. If *you* want to remove the accounts,
run SQL like the following deliberately, with the exact emails (psql example):

```sql
-- Review first
SELECT id, email FROM <schema>.users WHERE email IN
  ('student@edux.dev', 'faculty@edux.dev', 'admin@edux.dev');

BEGIN;
DELETE FROM <schema>.student_profiles WHERE user_id IN (
  SELECT id FROM <schema>.users WHERE email IN ('student@edux.dev','faculty@edux.dev','admin@edux.dev'));
DELETE FROM <schema>.faculty_profiles WHERE user_id IN (
  SELECT id FROM <schema>.users WHERE email IN ('student@edux.dev','faculty@edux.dev','admin@edux.dev'));
DELETE FROM <schema>.user_roles WHERE user_id IN (
  SELECT id FROM <schema>.users WHERE email IN ('student@edux.dev','faculty@edux.dev','admin@edux.dev'));
DELETE FROM <schema>.users WHERE email IN
  ('student@edux.dev','faculty@edux.dev','admin@edux.dev');
COMMIT;
```

Replace `<schema>` with your `DB_SCHEMA` (`edux` by default). Re-running the
utility afterwards recreates the three accounts cleanly.

## 11. Never use in production

These credentials are published in a repository document — treat them as public
knowledge. Never seed them into any shared/staging/production database, never
reuse the passwords, and consider any environment where they exist to be
development-only.

---

## Backend tests

The utility is covered by `backend/test/test_dev_accounts.py`: fresh creation,
re-run idempotency, no-overwrite/conflict handling, login through the real
`POST /v1/auth/login`, JWT role claims, Student/Faculty/Admin relationship
integrity, foreign-key validity, and a no-destructive-operations check.

```bash
cd backend
python -m pytest
```
