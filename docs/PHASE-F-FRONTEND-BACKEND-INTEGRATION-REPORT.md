# Phase F — Frontend ↔ Backend Integration Report

**Date:** 2026-08-29  
**Branch:** `arena/01a04d8a-edux`  
**Scope:** Frontend examination flow only. `backend/` was not modified.

Source of truth for contracts: `docs/BACKEND-AUDIT-REPORT.md`.

---

## 1. What was connected

| Surface | Frontend | Live API | Adapter |
|---------|----------|----------|---------|
| Login | `AuthContext.login` → `POST /auth/login` | JWT `accessToken` + `refreshToken` + `user` required | Reject if token missing — **no** `sess_*` minting |
| Register | `POST /auth/register` contract fields only | `{ ok, verificationId, demoOtp, draftId }` | Extra UI fields not sent (GAP-01) |
| Register verify | `POST /auth/register/verify` | Tokens + `user` | Session from API tokens only |
| Resend OTP | `POST /auth/resend-otp` `{ email, purpose }` | 422 without email | Body required |
| Logout | `POST /auth/logout` then clear storage | `{ ok: true }` no revoke | Local clear always |
| Refresh | axios interceptor `POST /auth/refresh` | Token pair | No fake token on failure |
| Question bank | `GET /faculty/question-bank` | `{ summary, questions[] }` | `src/api/adapters/questions.js` |
| Paper generator GET | `GET /faculty/paper-generator` | KV `generatedPapers` + config | `src/api/adapters/papers.js` |
| Paper create | `POST /faculty/paper-generator/papers` | `{ ok, paper }` or `{ ok:false }` HTTP 200 | `{ ok:false }` → error |
| Paper mutate | delete / duplicate / regenerate / archive / share | KV | `{ ok:false }` → error |
| Paper GET-by-id | still called | **404** | No fake paper (GAP-08) |
| Student exams hub | `GET /student/exams` | SPA fixture items | Domain mapping only; not published SQL papers |
| Exam start/detail | `GET/POST /student/exams/:id` | **404** | Error, no fake start (GAP-09) |
| Exam Agent papers | `GET /student/exam-agent/exams` | Published SQL papers | Maps `type` → domain/examFamily; **keeps** `correctAnswer` |
| Exam Agent attempts | `GET/POST /student/exam-agent/attempts` | SQL `exam_attempts` | `behaviour` kept; client scoring posted as-is (GAP-07) |

---

## 2. Auth — remaining mock removed

**Before**

- `registerDraft` minted `sess_${Date.now()}` tokens.
- OTP verify read `localStorage EduX_registered_students`.
- Login fallback `session.accessToken ?? sess_*`.
- `useResendOtp` posted an empty body (422).

**After**

- Login / register-verify persist **only** backend JWTs.
- OTP verify uses `verifyRegister` tokens via `login({ session })`.
- Resend sends `{ email, purpose }`.
- Logout hits `POST /auth/logout` then clears keys.
- Register gender is in React Hook Form; **not** sent (schema forbid).

There is still no demo-password backdoor in the SPA.

---

## 3. Question bank

Live serializer (`live_catalog.faculty_question_bank`):

`id`, `subject` (subject **code** or `exam_mode`), `topic` ← `concept`, `chapter` ← `concept`, `type` (`MCQ`), `difficulty` (title case), `text` ← `stem`, `options`, `status`, `source`, `usage`, `lastUsed`, `bloom`, `tags`.

**Not returned:** `domain`, `examFamily`, `correctAnswer`, `explanation`, `year`.

Adapter:

- `stem` / `text` / `question` unified.
- `q_type` → `MCQ`.
- `difficulty` title-cased.
- Isolation: payload `domain`/`examFamily`/`exam_mode`/`exam_family` if present; else ID prefix `EA-JEE` / `EA-NEET` / `EA-UNI`. **Never** JEE vs NEET from “Physics”.
- Query params are still forwarded (forward-compat) and **also** applied client-side because the API ignores them (GAP-02).
- Pagination is a client slice when `limit` is set. Paper generator Prev/Next does not claim a server page.

Question Intelligence Competitive tab now uses **bank rows** (`toCompetitiveBrowserQuestion`), not `intelData.derived.competitiveQuestionIntelligence.pyqRecords`.

---

## 4. Paper generator / library

- Builder still stores `selectedQuestionIds` only.
- Create sends `domain` + canonical `examFamily` (`JEE` \| `NEET` \| `null`) plus legacy `mode`/`exam` aliases the handler already stores.
- `{ ok: false }` (duplicate title, missing title, paper not found) is **not** success — axios interceptor rejects it.
- Returned papers are mapped `mode`→`domain`, `exam`→`examFamily`.
- `selectedQuestionIds` is **not** filled in on read when the backend omitted it (GAP-04).
- No publish call was added (GAP-05).

---

## 5. Student examination

Two different APIs remain two different UIs:

| UI | Endpoint | Data |
|----|----------|------|
| `/student/examinations` | `GET /student/exams` | Portal fixture (not SQL published papers) |
| `/student/exam-agent` | `GET /student/exam-agent/exams` | Seeded published SQL papers **with answer keys** |

They are **not** merged. Hub start/detail endpoints are missing (GAP-09) — empty/error, no fake sitting.

Exam Agent home still groups by `type` (University / JEE / NEET) using UI labels in `src/datasets/exams/exam-agent.js` (`EXAM_AGENT_EXAMS` stays `[]`).

Attempts POST/GET are the canonical write path. Scoring remains client-trusted (GAP-07).

---

## 6. `{ ok: false }` and FastAPI `detail`

`src/api/axios.js`:

- Success interceptor: `data.ok === false` → `Promise.reject` with `error.message` from `error` / `message` / `detail`.
- Error interceptor: copies FastAPI `detail` (string or validation array) onto `error.message`.

Toasts and empty states therefore show backend text instead of generic Axios messages.

---

## 7. Environment

| Variable | Owner |
|----------|--------|
| `VITE_API_BASE_URL` | Frontend only (see `.env.example`) |
| `DATABASE_URL`, `SECRET_KEY`, `DEMO_PASSWORD`, … | Backend only — **not** added to Vite |

Default in `src/config/index.js` remains `https://api.medixoedux.edu/v1` when unset. Local integration requires `VITE_API_BASE_URL=http://localhost:8000/v1`. CORS on the API still allowlists only localhost:5173 (GAP-12).

---

## 8. What was **not** done (explicit)

- No backend/schema/seed/env-secret edits.
- No mock/seed exam data and no fake publish/scoring/start.
- No React → Postgres.
- No deletion of UI, KPIs, routes, or intelligence engines.
- `correctAnswer` on exam-agent exams was **not** stripped as if that were security.
- Landing content remains static datasets (allowed).

---

## 9. Files touched (frontend)

- `.env.example`, `.gitignore`
- `src/api/axios.js`, `src/api/client.js`, `src/api/errors.js`
- `src/api/adapters/{questions,papers,attempts}.js`
- `src/services/{auth,faculty-questions,faculty-papers,exam-agent,index,student-examinations}.js`
- `src/contexts/auth-context.jsx`
- `src/pages/auth/{Register,OTPVerify}.jsx`
- `src/pages/faculty/QuestionIntelligence.jsx`
- `src/components/assessment-workspace/{question-intelligence-content,paper-generator-tab}.jsx`
- `tests/services/phase-f-adapters.test.js`
- `docs/PHASE-F-BACKEND-GAP-REGISTER.md` (this pair)

---

## 10. Remaining blockers for end-to-end “faculty paper → student exam → scored result”

1. Create paper writes KV, not SQL (GAP-03).  
2. `selectedQuestionIds` discarded (GAP-04).  
3. No publish (GAP-05).  
4. Student hub ≠ published papers; start missing (GAP-09).  
5. Answer keys on exam-agent GET (GAP-06).  
6. Client-trusted scoring (GAP-07).  
7. Bank filters/identity incomplete at the API (GAP-02).

Until those land in the backend, the SPA can authenticate, list the live question bank (with client isolation), save KV drafts, and sit **seeded** exam-agent papers — it cannot complete a faculty-authored examination pipeline.

---

## 11. Verification

- `npm test` — adapter/error contract tests plus existing suites.  
- `npm run build` — production bundle.
