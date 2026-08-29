# Phase F — Backend Gap Register

Originally a frontend-only integration against live FastAPI `/v1` contracts. **Backend Phase 1** closed the examination-core gaps (GAP-02–09, partial GAP-10). See `docs/BACKEND-PHASE-1-EXAMINATION-CORE-REPORT.md`.

Status key: **STOP** = UI kept, empty/error on miss, no fake success. **CLOSED** = Phase 1 backend.

---

## GAP-01 — Registration body vs UI fields

| | |
|--|--|
| **Missing / mismatch** | `RegisterRequest` is `extra="forbid"` and accepts only `fullName`, `email`, `phone`, `password`, `university`, `competitive`. The Register UI still collects date of birth and gender. |
| **Frontend impact** | Sending `dob` / `gender` / `createdAt` would 422. The SPA now submits only contract fields. Gender remains in the form (RHF-validated) but is not persisted. |
| **Why frontend cannot invent it** | Inventing a storage field would violate the live schema. |
| **Required backend change** | Extend `RegisterRequest` (and `registration_drafts.payload`) with `dob` and `gender` if those profile fields are required. |
| **Status** | STOP |

---

## GAP-02 — Question-bank filters and pagination

| | |
|--|--|
| **Missing / mismatch** | `GET /v1/faculty/question-bank` accepts **no** query params. Serializer omits `domain` / `examFamily` (`exam_mode` / `exam_family` exist on SQL `questions` but are not returned). `chapter` is mapped from `concept`, not `chapters.name`. |
| **Frontend impact** | UI filters (domain, examFamily, subject, chapter, topic, difficulty, questionType, search, page, limit) are preserved. The adapter applies **client-side** filters over the full payload. Prev/Next is a client window, **not** server pagination. Identity for Uni/JEE/NEET uses payload fields when present, else backend IDs `EA-JEE-*` / `EA-NEET-*` / `EA-UNI-*` — **never subject name**. |
| **Why frontend cannot invent it** | Client slicing is not multi-tenant pagination and cannot join chapter rows the API does not send. |
| **Required backend change** | Honor `domain`, `examFamily`, `subject`, `chapter`, `topic`, `difficulty`, `questionType`, `search`, `page`, `limit`. Return `domain` + `examFamily`. Join real chapter names. |
| **Status** | CLOSED (Phase 1 — SQL filters + pagination; faculty client no longer slices the full dump) |

---

## GAP-03 — Faculty papers are not SQL `papers`

| | |
|--|--|
| **Missing / mismatch** | `POST /v1/faculty/paper-generator/papers` writes `app_kv` JSON (`generatedPapers`, status `Draft`). It does not insert `papers` / `paper_questions`. |
| **Frontend impact** | Create/list/duplicate/archive/share still call the live KV routes. Saved papers never appear on the student exam-agent list. |
| **Why frontend cannot invent it** | React cannot write Postgres. Faking a SQL paper id would lie about persistence. |
| **Required backend change** | Create must insert `Paper` + `PaperQuestion` snapshots from `selectedQuestionIds`. |
| **Status** | CLOSED (Phase 1 — SQL `papers` / `paper_questions`) |

---

## GAP-04 — `selectedQuestionIds` ignored

| | |
|--|--|
| **Missing / mismatch** | Create body may include `selectedQuestionIds`; the handler never stores it (`questionList` defaults to `[]`, `questions` is a count). |
| **Frontend impact** | Builder still sends IDs only (no full objects). Returned papers do **not** echo IDs — the UI does not invent them on read. |
| **Why frontend cannot invent it** | Re-attaching local IDs after save would fake persistence. |
| **Required backend change** | Persist `selectedQuestionIds` onto `paper_questions` with frozen snapshots. |
| **Status** | CLOSED (Phase 1 — IDs stored on `paper_questions`) |

---

## GAP-05 — No publish endpoint

| | |
|--|--|
| **Missing / mismatch** | No `POST .../papers/{id}/publish`. SQL visibility is `papers.status == "published"` (seeded exam-agent papers only). Faculty KV `status` stays `"Draft"`. Share writes `Sent (prototype)` and does not publish. |
| **Frontend impact** | Share/create UI unchanged. No fake “Published” success. Students cannot sit faculty-generated papers. |
| **Why frontend cannot invent it** | Publishing is a backend state transition. |
| **Required backend change** | Publish API: validate, set SQL `status=published`, make the paper visible without answer keys. |
| **Status** | CLOSED (Phase 1 — `POST .../papers/{id}/publish`) |

---

## GAP-06 — Exam-agent payloads leak `correctAnswer`

| | |
|--|--|
| **Missing / mismatch** | `GET /v1/student/exam-agent/exams` includes `correctAnswer` on every question. Faculty bank serializer omits the key. |
| **Frontend impact** | Exam Agent still uses the field for **client-side** scoring (existing engine). The adapter **does not strip it** and does not treat stripping as a security boundary. |
| **Why frontend cannot invent it** | Hiding a key in the SPA is not authorization. A student can still read the JSON. |
| **Required backend change** | Omit `correctAnswer` / explanation from delivery payloads; score on the server. |
| **Status** | CLOSED (Phase 1 — student delivery omits keys; server scores) |

---

## GAP-07 — No server-side scoring

| | |
|--|--|
| **Missing / mismatch** | `POST /v1/student/exam-agent/attempts` stores client `scoring`, `summary`, and `evaluation`. No scorer. |
| **Frontend impact** | Submit still posts the canonical client attempt. Results/analysis only exist if the client sent scores. |
| **Why frontend cannot invent it** | Recomputing in the browser is not an authoritative result. |
| **Required backend change** | Score from stored answer keys; persist server `scoring`; reject client-trusted totals. |
| **Status** | CLOSED (Phase 1 — server scorer; client `scoring` ignored) |

---

## GAP-08 — `GET /faculty/paper-generator/papers/{id}` missing

| | |
|--|--|
| **Missing / mismatch** | Frontend `fetchPaperById` calls a route that is not registered (404 `{ detail }`). |
| **Frontend impact** | Function remains; callers must handle error. Preview uses the list object already in memory. No fake paper is synthesised. |
| **Why frontend cannot invent it** | A 200 with a made-up paper would fake persistence. |
| **Required backend change** | Implement GET-by-id against the same store as create (ideally SQL). |
| **Status** | CLOSED (Phase 1 — SQL GET-by-id) |

---

## GAP-09 — Student Examinations hub is not published papers

| | |
|--|--|
| **Missing / mismatch** | `GET /v1/student/exams` returns SPA `student-portal.exams` fixture, not `papers`. `GET /student/exams/:id` and `POST /student/exams/:id/start` **do not exist** (404). `ExamSitting` is unused. |
| **Frontend impact** | Examinations page still calls `GET /student/exams`. Empty/error if the call fails. Detail/start are not faked. Practice sitting stays on Exam Agent (`/student/exam-agent/exams`). The two lists are **not** merged (that would leak answer keys into the hub). |
| **Why frontend cannot invent it** | Binding the hub to exam-agent would mix pipelines and expose keys. |
| **Required backend change** | Bind `/student/exams` to published papers **without** keys; add detail + start (or retire the hub in favour of exam-agent with keys stripped). |
| **Status** | CLOSED (Phase 1 — published SQL papers, no keys; detail + start) |

---

## GAP-10 — Faculty bank omits answers, explanations, year/session

| | |
|--|--|
| **Missing / mismatch** | Live bank items: `id`, `subject` (code), `topic`/`chapter` (concept), `type`, `difficulty`, `text`, `options`, `status`, `source`, `usage`, `lastUsed`, `bloom`, `tags`. No `correctAnswer`, `explanation`, `year`, `session`, `is_pyq`. |
| **Frontend impact** | Competitive Question Intelligence now reads the **bank API**, not faculty-intel PYQ fixtures. Answer reveal / explanation / PYQ year are empty when the API omits them. |
| **Why frontend cannot invent it** | Filling keys from intel datasets would reintroduce mock exam data. |
| **Required backend change** | Return the fields the browser needs **only on faculty-authenticated bank GET**, never on student delivery. |
| **Status** | STOP |

---

## GAP-11 — Resend OTP / logout semantics

| | |
|--|--|
| **Missing / mismatch** | `POST /auth/resend-otp` requires `{ email, purpose? }` (422 without email). `POST /auth/logout` returns `{ ok: true }` and **does not revoke JWTs**. Refresh is stateless. |
| **Frontend impact** | Resend now sends `{ email, purpose }`. Logout calls the endpoint then always clears local tokens. |
| **Why frontend cannot invent it** | The SPA cannot revoke a server-side session that is not stored. |
| **Required backend change** | Persist refresh tokens (`auth_sessions`) and revoke on logout. |
| **Status** | STOP (workaround: correct request body; local clear) |

---

## GAP-12 — CORS / `VITE_API_BASE_URL`

| | |
|--|--|
| **Missing / mismatch** | Backend CORS allowlist is `localhost:5173` / `127.0.0.1:5173`. Unset `VITE_API_BASE_URL` still defaults to `https://api.medixoedux.edu/v1`. Arena `*.e2b.app` origins are not allowed. |
| **Frontend impact** | `.env.example` documents `VITE_API_BASE_URL=http://localhost:8000/v1` only. Frontend must not receive `DATABASE_URL` or `SECRET_KEY`. |
| **Why frontend cannot invent it** | CORS is a backend header. Changing backend `.env` is out of scope. |
| **Required backend change** | Add the real SPA origin(s) to `CORS_ORIGINS`. |
| **Status** | STOP |

---

## GAP-13 — Micro-assessments API missing

| | |
|--|--|
| **Missing / mismatch** | No `/faculty/micro-assessments/*` or `/student/micro-assessments/*`. |
| **Frontend impact** | Studio UI kept. Calls fail → empty/error. No mock assessments. |
| **Required backend change** | Full micro-assessment resource. |
| **Status** | STOP |

---

## GAP-14 — Studio approve does not insert `questions`

| | |
|--|--|
| **Missing / mismatch** | Approve flips flags in `app_kv` studio sessions; note claims “added to the Question Bank” but no `Question` row is inserted. |
| **Frontend impact** | Studio UI unchanged. Bank GET will not show studio-approved items until SQL insert exists. |
| **Required backend change** | Insert `Question` on approve with `exam_mode` / `exam_family`. |
| **Status** | STOP |

---

## UI — Paper Library Send (frontend fail-closed)

Faculty Paper Library Share/Send is disabled unless the backend paper is **provably ready** (`generationStatus` / `status` in READY|COMPLETE, and requested questions ≤ generated valid questions). GENERATING / PROCESSING / FAILED / incomplete counts / missing status → Send disabled. **Backend gap (not changed in this UI fix):** SQL papers still use `Draft`/`Published` only — there is no `generationStatus` field — so Draft papers fail closed. `POST .../publish` still accepts any paper that has at least one question; the UI does not call send/share unless ready.

---

## Out of Phase F (unchanged, still gaps)

Intelligence snapshots, Student 360 template overlay, interventions KV (not SQL), parent portal flag, admin write APIs, AI tutor client fallback `generateTutorReply`, landing static datasets.

---

## Filters: client-side vs backend

| Filter | Where applied | Honest? |
|--------|---------------|---------|
| `domain` / `examFamily` | SQL `exam_mode` / `exam_family` | Yes — not from subject name |
| `subject`, `chapter`, `topic` | SQL joins / `concept` fallback | Yes when chapter rows exist |
| `difficulty`, `questionType`, `search` | SQL | Yes |
| `page` / `limit` | SQL `OFFSET`/`LIMIT` | Yes — faculty fetch no longer client-slices |
