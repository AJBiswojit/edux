# Frontend Seeded Question Data Removal — Report

**Project:** MediXO EduX (`medixo-edux-platform` v1.0.0)
**Branch:** `arena/01a04e1a-edux` · **Date:** 2026-08-29
**Scope:** Frontend runtime question records only. Backend, PostgreSQL, UI structure, intelligence engines, contracts, routes and tests are preserved.
**Verification:** `npm test` ✅ (23 files / 279 tests) · `npm run build` ✅ (13.7s) · live API + data-path verification ✅ (both empty-bank and real-bank scenarios)

---

## 1. Problem

With a valid Faculty JWT, the real backend returns an **empty** question bank:

```json
GET /v1/faculty/question-bank
{ "summary": { "total": 0, "bySubject": {}, "page": 1, "limit": 50 },
  "questions": [], "total": 0, "page": 1, "limit": 50 }
```

Yet Faculty → Assessment Intelligence still displayed seeded question records:
Dijkstra, Kruskal, Prim, AVL, 0/1 Knapsack, CPU Scheduling, Ridge Regression,
CS501/CS503/CS505, PYQ 2024, PYQ 2025, and 156 JEE/NEET "PYQ" records.

## 2. Manual backend verification (reproduced in this workspace)

The repo's FastAPI backend was booted locally (SQLite per `backend/.env`
support) and queried with a real Faculty JWT (`meera.krishnan@medixoedux.edu`):

| Endpoint | Result |
|---|---|
| `GET /v1/faculty/question-bank` | `total: 0`, `questions: []` — **the real question DB is empty** |
| `GET /v1/faculty-intelligence/summary` | returns `datasets.questionBank.questions` (14 seeded stems), `datasets.competitiveQuestions` (156), `datasets.universityPyqQuestions` (12), `derived.competitiveQuestionIntelligence.pyqRecords/universityPyq`, and `derived.assessment.questionStats.total = 1254`, `avgAccuracy = 72.5` |
| `GET /v1/faculty/pyq-analysis` | returns seeded corpus analytics incl. `questionIntelligence.mostRepeated[0] = "Trace Dijkstra's algorithm on a 5-vertex graph"` |

**Root cause:** these seeded records are *embedded in the
faculty-intelligence summary and PYQ analytics payloads* (backend SPA
documents seeded from `backend/app/data/spa/*.json`). They are not in the
`questions` table. The frontend rendered them as question records. Per the
task constraints the backend was **not** modified — the frontend now refuses
to render question-record content from any source other than the
question-bank API, so the seeded payload content never reaches the UI.

## 3. Before data flow

```
GET /faculty/question-bank ──► Question Intelligence tab (only clean surface)
GET /faculty-intelligence/summary ──┬─► PyqIntelligenceTab  → University PYQ browser  (12 seeded UPYQ-*)
                                    │                       → Competitive PYQ browser (156 seeded CQ-*)
                                    ├─► Question Intelligence KPI strip → avg accuracy/quality (from seeded bank)
                                    ├─► Assessment Overview/Analytics tabs → questionStats (from seeded bank)
                                    └─► Faculty Dashboard → "1254 questions · 12 flagged" (seeded string)
GET /faculty/pyq-analysis ──────────┬─► Overview "AI suggested questions" → seeded prediction stems ("Design a variant of Dijkstra…")
                                    └─► PYQ dashboard → "Most repeated questions" seeded stems + hardcoded "46 papers · 486 questions" copy
```

## 4. Actual seeded question examples (observed at runtime)

- `q2/q9`  "Prove that Dijkstra fails with negative edges…", "Trace Dijkstra's algorithm on a 5-vertex graph…" (CS501)
- `q10`    "Construct the MST using Kruskal's and Prim's algorithms…" (CS501)
- `q11`    "Solve the 0/1 knapsack problem… DP table" (CS501)
- `q12`    "Insert nodes into an AVL tree… rotations" (CS501)
- `q3`     CPU-scheduling policy question (CS503)
- `q5`     "Ridge regression adds which penalty to the loss function?" (CS505)
- `UPYQ-CS501-001…CS504-001` — 12 University PYQ records (years 2024/2025)
- `CQ-JEE Main-PHY-001…`, `CQ-NEET UG-BIO-…` — 156 JEE/NEET PYQ records (2023–2025)

## 5. Exact source files

Frontend files that consumed seeded question records (all fixed):

| File | Change |
|---|---|
| `src/pages/faculty/QuestionIntelligence.jsx` | merges live-bank stats into the intelligence payload; overview "AI suggested questions" now renders PYQ-matched records from the live bank; badge shows bank-first honest counts |
| `src/components/assessment-workspace/pyq-intelligence-tab.jsx` | University + Competitive PYQ browsers now fed by `bankPyqBrowserRecords(liveBank)` — `derived.competitiveQuestionIntelligence.*` no longer read |
| `src/components/assessment-workspace/question-intelligence-content.jsx` | KPI strip reads live-derived stats (`?? 0` defaults, `—` for absent averages) |
| `src/pages/faculty/PYQAnalysis.jsx` | "Most repeated questions" + "AI suggested questions" render live-bank PYQ records; hardcoded `46 papers · 486 questions · 2011–2025` replaced by API-driven copy; guarded neutral "AI take" line |
| `src/pages/faculty/Dashboard.jsx` | `questionBankStatus` (incl. `successCenter.assessmentHealth`) re-computed from the live bank |
| `src/components/assessment-workspace/assessment-overview-tab.jsx` | hardcoded "15 years · 46 papers" quick-action copy is dynamic |
| `src/components/assessment-workspace/assessment-analytics-tab.jsx` | "Avg question accuracy" neutral `—` when unmeasured |
| `src/components/assessment-workspace/competitive-question-browser.jsx` | exam badge no longer labels University records "NEET" |
| `src/api/adapters/questions.js` | added `isPyqQuestion`, `isUniversityDomainQuestion`, `bankPyqBrowserRecords`; `toCompetitiveBrowserQuestion` maps University domain to `exam: 'University'` |
| `src/intelligence/faculty/engine/assessment.js` (+ `engine/index.js`, `faculty/index.js`) | new pure `withLiveQuestionStats(intel, questionBank)` — re-derives the questionStats block from the live bank using the existing `computeQuestionStats` engine |

## 6. Import graph (after removal)

```
PostgreSQL questions table
      ↓
FastAPI  GET /v1/faculty/question-bank
      ↓
src/services/faculty-questions.js (useFacultyQuestions / useQuestionBank)
      ↓
src/api/adapters/questions.js (normalizeQuestion → bankPyqBrowserRecords)
      ↓
src/intelligence/faculty/engine/assessment.js (computeQuestionStats, withLiveQuestionStats)
      ↓
QuestionIntelligence page → Question Intelligence · PYQ browsers · Overview · Analytics · Dashboard
      ↓
UI
```

No UI surface imports a question dataset. The remaining intelligence payload
(`/faculty-intelligence/summary`, `/faculty/pyq-analysis`) supplies only
non-record analytics (trends, topic frequency, blueprint metadata) — its
embedded question records are never rendered.

## 7. Runtime fallback analysis

Audited patterns: `questions.length ? … : seeded…`, `data || sample`,
`apiQuestions ?? defaultQuestions`, `fallback/sample/mock/default/demo +
Questions`, `if (!response.questions?.length) return seeded`.

- **Zero** such patterns exist in `src/` (verified by search and by a new
  architecture test).
- API failure paths: `useFacultyQuestions` has `retry: false` and surfaces
  `isError` → the page renders its existing `<ErrorState>` — never seeded data.
- Empty responses flow through untouched (`fetchQuestions` maps `[] → []`).

## 8. Dataset classification

| Class | Items | Disposition |
|---|---|---|
| A. Real backend data | `GET /faculty/question-bank` rows | **only** runtime question source |
| B. Production intelligence contract | `pyqTrends`, `questionCoverage`, `assessmentHealthInputs`, engine signatures | preserved (backend-mirrored Engine(data) inputs) |
| C. Production algorithm | all `src/intelligence/**/engine/*` | preserved untouched |
| D. Test fixture | `tests/fixtures/*` (attempts, directory, micro-assessments, students) | preserved; verified 0 production imports from `tests/` |
| E. UI metadata | filter cascades (`pyqFilters.chapters` incl. "Dijkstra & shortest paths" dropdown entries), exam blueprints (NEET = 720 marks), `paperGenerator.config.topics`, AI-tutor suggested prompts | preserved (dropdown/filter options, not records) |
| F. Static documentation / assistant copy | `src/api/ai/tutor-reply.js` canned tutoring explanations, landing copy | preserved (not question records) |
| G. Seeded/mock question records | the 14 + 156 + 12 records and question-derived stats embedded in the intelligence/PYQ payloads | **removed from runtime rendering** |

## 9. Removed runtime question sources

- `intelData.derived.competitiveQuestionIntelligence.pyqRecords` (156 CQ-*)
- `intelData.derived.competitiveQuestionIntelligence.universityPyq(/Count)` (12 UPYQ-*)
- `intelData.derived.assessment.questionStats` (seeded 1254/72.5 stats) → replaced by live-bank stats
- `intelData.datasets.questionBank` / `datasets.competitiveQuestions` / `datasets.universityPyqQuestions` — no UI consumer remains
- `pyqData.questionIntelligence.aiPredictedQuestions` stems (overview + PYQ dashboard panels and the "AI take" line)
- `pyqData.questionIntelligence.mostRepeated` stems (PYQ dashboard)
- Faculty Dashboard `derived.dashboard(.successCenter).questionBankStatus` seeded string ("1254 questions · 12 flagged")
- Hardcoded corpus counts: "46 papers · 486 questions · 2011–2025", "15 years · 46 papers", "486 PYQs" badge

## 10. Preserved intelligence engines

`computeQuestionStats`, `computeAssessmentIntelligence`,
`computePyqIntelligence`, `computeCompetitiveQuestionIntelligence`,
`computeAssessmentHealth`, coverage/gap analytics, difficulty/Bloom/quality
logic, `withLiveQuestionStats` (new, same pure style), Academic DNA,
Student 360, performance/error analysis, Question Studio and Micro-Assessment
engines — all unchanged; only their data inputs were rewired (Engine(data)
with live bank data). The Competitive PYQ pattern panel (difficulty trends,
topic frequency, weightage, gap analysis, recommendations) remains fully
functional — it renders exam analytics, not question records.

## 11. Preserved test fixtures

`tests/fixtures/{attempts,directory,micro-assessments,students}.js` are
untouched. New architecture test asserts **0 production imports from
`tests/`**.

## 12. Question Bank integration

`QuestionIntelligenceContent` (Question Intelligence tab), the Paper
Generator and the PYQ dashboard's "Related question bank questions" already
consumed `useFacultyQuestions` / `useQuestionBank` → `GET
/faculty/question-bank`. KPIs in the Question Intelligence tab now also read
live-derived stats. Empty API response ⇒ 0 rows ⇒ existing "No questions
match these filters" empty state.

## 13. Assessment Intelligence integration

The page fetches `useFacultyQuestions` + `useFacultyIntelligence` +
`usePYQAnalysis`. `withLiveQuestionStats` merges the live bank into the
payload before any tab renders. Every question-record surface (browsers,
suggested/repeated panels) is fed from the bank; every KPI that describes
the bank is derived from the bank.

## 14. University / JEE / NEET isolation

Identity comes from payload `domain` / `examFamily` (or `EA-*` id prefixes)
— never the subject name (`normalizeQuestion`, `canonicalDomain`,
`canonicalExamFamily` unchanged). `bankPyqBrowserRecords` filters by domain;
JEE Physics ≠ NEET Physics is enforced by `examFamily` and proven in tests.
The university PYQ browser passes `exams={['University']}` so bank-fed
University records render with a University badge (previously mislabelled
"NEET" — fixed).

## 15. LocalStorage audit

All `localStorage`/`sessionStorage` usage in `src/` was enumerated: auth
tokens/refresh/user/theme (`src/api/axios.js`, `auth-context.jsx`,
`theme-context.jsx`) and UI/session preferences (AI-assistant threads,
report library, chat history). **No question persistence exists** — asserted
by an architecture test that fails if any storage call references questions.

## 16. Bundle audit (`npm run build` → `dist/`)

| String | Bundle hits |
|---|---|
| Kruskal, Knapsack, AVL, "Ridge regression", PYQ 2024, PYQ 2025, UPYQ-, CQ-JEE, CQ-NEET | **0 files** |
| "Dijkstra" | 2 files — **student AI Tutor canned tutoring explanations and prompt chips only** (`AITutor-*.js`, `src/api/ai/tutor-reply.js`, `src/pages/student/AITutor.jsx`). Classified E/F: conversational tutoring copy and suggested-prompt metadata, not question records, not consumed by Assessment Intelligence. |

All seeded stems now enter the app exclusively as runtime API data; with an
empty bank none are fetched into any record surface.

## 17. Empty-state behavior

With `questions: []`:
- Question Intelligence tab → existing "No questions match these filters" card.
- University/Competitive PYQ browsers → existing "Not enough questions match this configuration" empty state, badges read "0 PYQs".
- Overview "AI suggested questions" → dashed empty-state note; "Generate important questions" action preserved.
- PYQ dashboard → "No repeated questions in the bank for this slice yet…".
- KPIs → honest `0` / neutral `—` (never seeded values, never `undefined`).
- Page structure, headers, filters, tabs, spacing and visual language unchanged.

## 18. Tests

New: `tests/assessment/live-question-source.test.js` (11),
`tests/assessment/no-seeded-question-runtime.test.jsx` (4),
`tests/assessment/architecture.test.js` (9). Prove: empty API ⇒ empty UI; no
fallback to seeded records in PYQ browsers/overview/QI KPIs; API failure ⇒
error state (service `retry:false` + `isError` path); real bank rows ⇒
rendered; University/JEE/NEET isolation incl. JEE Physics ≠ NEET Physics;
filters/search/pagination components intact (existing 255 tests still pass);
intelligence engines intact (existing engine tests still pass); 0 production
imports from `tests/`; no localStorage question DB; dataset shells stay
empty. **Total: 23 files / 279 tests pass.**

Additionally, a live runtime verification ran the page's exact transforms
(`withLiveQuestionStats` + `bankPyqBrowserRecords`) against responses from
the running FastAPI backend: empty bank ⇒ 0 records / neutral stats; 3
inserted real rows ⇒ 1 University + 2 Competitive records rendered, KPI = 3 —
**no code change needed between the two states**.

## 19. Build

`npm run build` ✅ (vite 5, 13.7s, no warnings beyond the pre-existing
chunk-size advisory). `npm test` ✅ 279/279.

## 20. Remaining legitimate question-related data

- **Backend-served analytics** (PYQ corpus trends, topic frequency,
  difficulty-by-year, weightage, gap analysis, blueprint facts, AI
  recommendation copy) from `/faculty-intelligence/summary` and
  `/faculty/pyq-analysis` — preserved intelligence features; they contain no
  rendered question records. *Note:* these payloads are currently seeded SPA
  documents on the backend; de-seeding them is a backend task outside this
  change's frontend-only scope, and when real analytics arrive the same UI
  consumes them unchanged.
- **UI metadata**: filter cascades (subject/chapter/topic options incl.
  "Dijkstra & shortest paths" as a dropdown entry), exam blueprints, tag
  taxonomy, assessment library — dropdown options, not records.
- **AI Tutor copy**: canned tutoring explanations/prompt chips (student Mentor).
- **Test fixtures** under `tests/` (never imported by production).
- Empty **dataset shells** (`questionBank`, `competitiveQuestions`,
  `universityPyqQuestions`, `questionStudioPools`, `pyqAnalysis`,
  `microAssessments`) kept as engine contracts — guarded empty by tests.

## 21. Final runtime architecture

```
PostgreSQL (questions table)
      ↓
FastAPI   GET /v1/faculty/question-bank
      ↓
Axios (src/api/axios.js — bearer token, 401 refresh)
      ↓
Service/Hook (src/services/faculty-questions.js → useFacultyQuestions / useQuestionBank)
      ↓
Adapters (src/api/adapters/questions.js → normalizeQuestion / bankPyqBrowserRecords)
      ↓
Engine(data) (src/intelligence/faculty/engine/assessment.js → computeQuestionStats / withLiveQuestionStats)
      ↓
Assessment Intelligence (Question Intelligence · PYQ Intelligence · Overview · Analytics · Dashboard)
      ↓
UI (records, KPIs, filters, search, pagination, empty/error states)
```

There is no frontend question store, no mock/fallback/PYQ fixture path, no
localStorage question DB, and no fabricated counts. When the backend says
**0 questions**, the UI shows **0 questions**; when real questions exist,
the same UI shows them.

### Backend note (no backend changes were made)

The seeded records the user observed are embedded in the *faculty-intelligence
summary* and *PYQ analysis* SPA documents served by the backend (`backend/app/data/spa/faculty-intelligence-summary.json`,
`pyq.json` → seeded into Postgres by `seed_spa_documents`). This change makes
the frontend ignore those embedded records; if those payloads should also stop
carrying seeded question records, that is a follow-up **backend** task that was
explicitly out of scope here (frontend-only instruction; no PostgreSQL data was
touched).
