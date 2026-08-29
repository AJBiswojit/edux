# Backend Seeded-Question Data Removal — Report (Phase G)

**Branch:** `arena/01a04e1a-edux` · **Date:** 2026-08-29 · **Scope:** physical removal of seeded question RECORDS and fabricated question-derived values from the backend data source, with deterministic healing of existing databases.

**Companion report:** `docs/FRONTEND-SEEDED-QUESTION-REMOVAL-REPORT.md` (Phase F, commit `ca5136b`).

---

## 1. Executive summary

Every seeded question record that masqueraded as the question bank has been physically removed from the backend seed documents (`backend/app/data/spa/*.json`), and any database that already holds the old documents is healed automatically on boot. The question surfaces now derive **exclusively** from the real `questions` table via `GET /v1/faculty/question-bank`; when that table is empty every question-derived value is honestly neutral (0 / null / `[]` / "—"), and when a real question is inserted it flows through the bank, the faculty-intelligence summary and the UI immediately.

- **4,301 seeded question records removed** across 9 affected documents (732 distinct edit points).
- Fabricated question-derived values (1254 · 72.5% · 486 · "46 papers" · 8420-bank · "1254 questions · 12 flagged" …) replaced with the neutral contract — never with another invented number.
- Existing `app_kv` rows are healed by the same deterministic, idempotent transform (`written / skipped / healed` counters logged at boot).
- Re-seeding can never reintroduce the records (proven by tests **and** live restarts).
- Zero rows of the real `questions` table (or any other SQL table) were deleted, truncated or dropped.
- All features, endpoints, UI, analytics structures, RBAC and the student/papers/exam planes are preserved.

## 2. What "seeded question data" was (architecture)

The SPA payload documents are stored as whole-JSON blobs in the `app_kv` SQL table under keys `spa:<name>` (`app/services/spa_store.py`, `app/models/ops.py.AppKv`). `spa_documents.document(db, name)` returns the **stored row if present**, otherwise loads `app/data/spa/<name>.json` and inserts it. `seed_spa_documents` used to **skip existing rows** ("mutations persist").

Consequence: cleaning the JSON files alone can never clean a database that already ran the old seed. Therefore the cleanup lives in one module that is applied in **both** places:

- `clean_spa_document(doc)` — pure, deterministic, idempotent transform;
- the source JSON files (cleaned in place, committed);
- `seed_spa_documents` — now heals any stored affected document on boot and reports `{"written", "skipped", "healed"}`.

## 3. Single source of truth

`backend/app/services/spa_question_cleanup.py`:

- `AFFECTED_DOCUMENTS` — the 9 documents that carried seeded question records.
- `QUESTION_RECORD_LIST_KEYS` — record-collection keys emptied everywhere they appear.
- `clean_spa_document(doc) -> (doc, changes)` — 22 numbered, documented rules; returns a per-change log.
- `clean_document_if_affected(name, doc)` — unaffected documents pass through byte-for-byte.
- `clean_source_files()` + CLI (`python -m app.services.spa_question_cleanup`) — cleans the source JSONs and prints the change report. Running it twice reports **0 changes** (verified).

## 4. Inventory: every question-record shape found and removed

| Shape | Where | Disposition |
|---|---|---|
| `questionBank.questions` (14 records: q_* stems incl. Dijkstra/Kruskal/Prim/AVL) | faculty-intelligence-summary | → `[]`, summary → 0/neutral |
| `adminQuestionBank.questions` (q1–q8) | admin-catalog | → `[]`, summary → 0/neutral |
| `competitiveQuestions` (156 `CQ-JEE *` / `CQ-NEET UG *`) | faculty-intelligence-summary, pyq | → `[]` |
| `universityPyqQuestions` (12 `UPYQ-*`) | pyq | → `[]` |
| `pyqRecords`, `universityPyq` (derived mirrors) | faculty-intelligence-summary | → `[]` |
| `mostRepeated`, `aiPredictedQuestions`, `aiImportantQuestions` | pyq, faculty-intelligence-summary | → `[]` |
| pattern `example` stems | pyq patterns | field removed (frequency/impact/years kept) |
| `paperPreview` (10 full question records) | paper-generator + 3 mirrors | → `[]` |
| paper `questionList`s (CQ-* mock papers: 150 items; GP1-Q-* demo papers: 69 items) | paper-generator, faculty-intelligence-summary, admin mirrors | → `[]` (paper records kept, see §8) |
| `quizGeneratorSample.questions` (5 MCQs) | ai | → `[]` (endpoint kept; no frontend consumer) |
| AI-assistant transcript quiz (**Q1… full MCQ with answer key, "add it to the bank"**) | ai, faculty-intelligence-summary, admin mirrors | → neutral draft-shell message |
| admin summary-only `questionBank {total 8420, aiGenerated 3210, approved 7680, flagged 46, byType}` | admin-intelligence-* | → all zeros, `byType {}` |

## 5. Fabricated question-derived values → neutral contract

| Fabricated value | Location | Now |
|---|---|---|
| `1254` bank total / `418` AI / `12` flagged | questionBank.summary, questionStats, assessmentSummary, actionPlan | `0` / `null` averages / `[]` distributions |
| `"1254 questions · 418 AI-generated · 12 flagged"` | assessment summary highlights | `"No question data yet"` |
| `"Quality 67.5/100 · accuracy 72.5% · coverage gap…"` | assessment summary highlights | `"No question data yet"` |
| `"Your bank holds 1254 questions … 72.5% cohort accuracy …"` (body), `"Assessment health 73/100"` (headline) | derived.assessment.summary | `"Question bank data will appear here once real questions are added."` / `"Assessment health unavailable"` |
| `"1254 questions · quality 67.5/100 · accuracy 72.5%"` (reports[3].summary; templates[3].latest/stat) | faculty-workspace, faculty-intelligence-summary | `"No question data yet"` / `0` |
| `"46 papers · 486 questions analysed"`, `"46 papers"` (templates[8], exportOptions[2]) | reports | `"No question data yet"` / `"0 papers"` / rows `0` |
| `assessmentSummaryInputs.questionBankTotal 1254`, `pyqPapers 46` | datasets | `0`, `0` |
| export rows `1254` ("Question Bank — …"), `486` ("PYQ corpus …") | exportHistory, exportOptions | `0` (Paper-Library/student exports untouched) |
| `"8 at-risk students · 1254 bank questions covered by reports"` | reports.summary.highlights | `"8 at-risk students"` |
| `"148 questions generated, 6 lessons drafted…"` | insightsPool[3].body | `"6 lessons drafted, 312 submissions auto-graded this term."` |
| paper `questions: 25` counts with emptied lists | papers | `0` |
| `questionBankStatus` "1254 questions · 12 flagged" | dashboard, successCenter.assessmentHealth | seed: `"Question bank status unavailable"`; live: `"N questions · M flagged"` from SQL |
| admin `byType` MCQ share | admin-intelligence | `0` → UI shows "—" (Phase F guard) |

**Live merge:** `GET /v1/faculty-intelligence/summary` calls `_live_bank_stats(db, institution_id)` (SQL over the real `Question` model: total, aiGenerated = `lower(source)=='ai'`, flagged = `lower(status)=='flagged'`, bySubject grouped via `Subject.code`/`Subject.name` fallback "General") and patches the derived blocks — the payload can never claim a bank larger than the database.

## 6. Per-document change tally (vs pristine pre-clean backups in `/tmp/spa_original`)

| Document | Edit points | Records removed |
|---|---:|---:|
| faculty-intelligence-summary.json | 260 | 1,321 |
| admin-intelligence-summary.json | 206 | 1,348 |
| admin-intelligence-datasets.json | 190 | 1,348 |
| paper-generator.json | 21 | 229 |
| admin-intelligence-derived.json | 16 | 0 (counts-only) |
| pyq.json | 17 | 28 |
| faculty-workspace.json | 10 | 14 |
| admin-catalog.json | 9 | 8 |
| ai.json | 3 | 5 |
| **Total (9 docs)** | **732** | **4,301** |

The other 14 spa documents are **byte-identical** to their backups (verified by the comparison script and asserted by tests): exam-agent-exams, student-portal, student-intelligence-*, faculty-students-directory, faculty/parent/platform, question-studio-sources, admin-intelligence-profile, registration-options, similar-issues, student-360.

## 7. The 22 cleanup rules (summary)

1. Record-collection lists → `[]` (with count logging). 2. `{summary, questions}` banks → empty + neutral summary. 3. Summary-only bank blocks → zeros. 4. `questionStats` → neutral (averages `null`, buckets keyed at 0). 5. `competitiveQuestionIntelligence` → neutral. 6. `pyqCorpus` counts → 0. 7. PYQ `overview` counts → 0. 8. `assessmentSummary` bank counts → 0. 9. `questionBankStatus` → neutral. 10. Report summaries with bank claims → neutral. 11. `quizGeneratorSample` → empty. 12. Pattern `example` stems removed. 13. Paper `questionList`s → seeded question records removed. 14. Orphaned paper question counts → 0. 15. Assessment-health narrative → neutral. 16. Report-template `latest` bank claims → neutral. 17. Insight-pool generated-questions claims stripped. 18/19. AI-transcript quizzes → neutral draft shell. 19. `assessmentSummaryInputs` bank/PYQ totals → 0. 20. Bank/PYQ export rows → 0 ("0 papers"). 21. Report-template stats → 0 / "0 papers". 22. Narrative bank-coverage claims stripped. (Numbering in code; every rule logs a path-scoped change.)

## 8. Judgment call: demo-paper question content (documented deviation)

The GP1–GP4 demo papers (`paper-generator.json` + mirrors) contained fully-authored question records — including the stems the removal list names explicitly ("Trace Dijkstra's algorithm on a 5-vertex weighted graph", MST/Kruskal/Prim, 0/1 Knapsack). Six further papers were assembled **directly from the seeded CQ-\* bank** (150 records served through the Paper Library endpoint).

**Decision:** question content of all seed papers is a fabricated question list and was removed (list → `[]`, count → 0). The **Paper Library/Generator feature is preserved**: paper records (title, marks, duration, blueprint metadata, status), the generation flow from the real bank, and the page itself remain fully functional — the neutral-content contract applies exactly as elsewhere. Authored-content preservation would have kept named stems from the user's removal list in runtime payloads, so the stricter reading was chosen.

## 9. Occurrences classified and deliberately PRESERVED

| Occurrence | Why it stays |
|---|---|
| `pyqFilters.chapters`, `paperGenerator.config.topics` ("Dijkstra & shortest paths", "MST (Kruskal/Prim)", "0/1 Knapsack") | syllabus **taxonomy**, not records |
| `trendAnalytics`, `topicWeightage`, `questionFrequency` topic names | analytics structures over an (empty) corpus — honest when empty |
| `pyqTrends.competitive` blueprints ("NEET UG · 720 marks · ~20 questions per paper") | per-paper exam **structure** metadata |
| `teachingTimeline` / `assessment.timeline` / `upcomingAssessments[].meta` / `aiStudio.history[].detail` ("CS501 · 24 questions · 50 marks") | scheduled-assessment **blueprint** metadata |
| `pyqAnalysis.aiSuggestions` "Create 10 questions similar to the most repeated patterns" | recommendation **copy**, not a data claim |
| `assignments[].commonMistakes` ("Wrong complexity analysis of Dijkstra variants") | teaching notes |
| `ai.json tutorThreads` (incl. the worked Dijkstra concept explanation) | AI-tutor **teaching conversation** — no bank framing, no options/answer-key records; tutor feature is protected |
| `quizBuilder.quizzes[].questions` (int counts) | quiz-record counts, not question records |
| `questionTags`, `questionCoverage`, `weakChapters`, `uploads` | feature metadata/analytics shells |
| exam-agent exams `items[].questions`, instructions ("Answer all 12 questions") | **protected examination content** (student plane) |
| student-portal practiceSets/quizBank/questionReview, examAnalysis(+variants) | **student plane** — untouched by design |
| `seed_academic.py` assignment bodies ("Implement Dijkstra, Bellman-Ford and Floyd-Warshall") | assignment **content** (academic plane) |
| admin institution reports (`12480 students · 640 faculty`, department health) | institutional analytics, not question-derived |
| `enrollmentTrend.students 8420`, `exports[4].rows 8420` | **student enrolment** counts (same number as the old bank total by coincidence) |
| `revisionProgress 72.5` | teaching progress metric, not bank accuracy |
| reports[5].summary "Health 70.7/100 · weakest unit …" | unit-coverage report without bank claims |
| Paper Library export rows (4/10), Student Cohorts (280), Gradebook (68/280) | record counts of preserved planes |

## 10. Database heal (existing rows)

`seed_spa_documents(db)` now applies `clean_document_if_affected` to every stored `spa:<name>` row and rewrites those that changed, returning `{"written", "skipped", "healed"}`.

**Live proof (sqlite verification DB `/tmp/edux_verify.db`, which still held the pre-clean documents):**

1. Boot over the dirty DB → `spa={'written': 9, 'skipped': 23, 'healed': 9}` — all 9 affected stored documents healed; 14 unrelated docs untouched.
2. After the final rule additions → boot → `healed: 3` (exactly the 3 re-cleaned docs) — incremental, targeted.
3. Fresh DB → `spa={'written': 23, 'skipped': 0, 'healed': 0}` — clean seeds, nothing to heal.
4. Re-boot over a healed DB → `written: 0, skipped: 23, healed: 0` — idempotent at the DB level.

Scoped strictly to the 9 affected documents: no truncation, no unrelated deletes, no schema changes; Postgres credentials still come only from `backend/.env` (`edux_local`, `DB_SCHEMA=edux`); the sqlite DB here is the test/verification isolation only.

## 11. Live endpoint verification (running uvicorn, sqlite verification DB)

Login `meera.krishnan@medixoedux.edu / aurora123` (faculty) and `ananya.iyer@medixoedux.edu` (admin); marker scan (`CQ-JEE`, `CQ-NEET`, `UPYQ-`, `GP1-Q`, `1254 questions`, `72.5%`, `67.5/100`, `Trace Dijkstra`, transcript-quiz text) over full payloads:

| Endpoint | Result |
|---|---|
| `GET /v1/faculty/question-bank` | CLEAN ✓ — `summary.total 0`, `questions []` |
| `GET /v1/faculty-intelligence/summary` | CLEAN ✓ — `questionBankStatus "0 questions · 0 flagged"`, `questionStats.total 0`, `avgAccuracy null` |
| `GET /v1/faculty/pyq-analysis` | CLEAN ✓ — `mostRepeated 0`, `aiPredictedQuestions 0` |
| `GET /v1/faculty/pyq-analysis/patterns` | CLEAN ✓ — no `example` stems |
| `GET /v1/faculty/paper-generator` | CLEAN ✓ — paper records kept, question lists empty |
| `GET /v1/admin-intelligence/summary` / `datasets` / `derived` | CLEAN ✓ |
| `GET /v1/admin/dashboard` | CLEAN ✓ |
| `GET /v1/intelligence/summary` (student) | student plane intact (examIntelligence/mistakeIntelligence present) — untouched, as designed |

## 12. Real-question flow (live)

Inserted one legitimate `Question` row (university mode, subject CS501, `is_pyq`, `source='Bank'`, `status='approved'`) into the verification DB, then:

- `GET /faculty/question-bank` → `total 1`, real stem `LIVE phase-G verification stem about B-trees?` returned;
- `GET /faculty-intelligence/summary` → `questionStats.total 1`, `bySubject {'CS501': 1}`, `questionBankStatus "1 questions · 0 flagged"` in **both** `derived.dashboard` and `successCenter.assessmentHealth`;
- deleted the row → bank `0`, stats `0`, status `"0 questions · 0 flagged"`; `questions` table back to its prior contents.

No fabricated value ever appears — the UI simply shows the real bank, whatever its size.

## 13. Re-seed / no-reintroduction proof

- Test `test_seed_does_not_reintroduce_removed_records`: seeds twice (no-op), then plants a **legacy dirty document** (bank record + `total 1254`) into `app_kv` → next seed reports `healed: 1`, the stored document comes back clean, and a further seed is a no-op (`healed: 0`).
- CLI idempotence: two back-to-back `python -m app.services.spa_question_cleanup` runs — second reports **0 changes** across all 9 documents.
- Live: repeated boots over a healed DB heal nothing (§10.4).

## 14. Tests (backend — 44 passing)

New suite `backend/test/test_spa_question_cleanup.py` (16 tests, sqlite-isolated conftest):

1. seed sources contain no record collections / markers (`CQ-JEE`, `CQ-NEET`, `UPYQ-`, `CQ-JEE Main-PHY-001`, stems, `1254 questions`, `72.5%`, `67.5/100`, transcript-quiz text);
2. banks are empty shells with 0 summaries;
3. questionStats/competitive-intelligence neutral shape;
4. PYQ overview/patterns honest, analytics preserved;
5. cleanup preserves analytics payloads (explicit per-key assertions);
6. cleanup never touches unaffected documents;
7. seed heals existing dirty documents (and preserves analytics);
8. seed never reintroduces records (incl. legacy-row healing);
9. live summary is clean **and** reflects the real 4-question test world (`total 4`, bySubject populated, `"4 questions · 0 flagged"`);
10. live summary neutral for an institution with no questions (0 / `{}` / `null` / `"0 questions · 0 flagged"`);
11. real-question insert → bank + summary reflect it → delete → back to 0;
12. PYQ endpoints contain no seeded questions, keep analytics;
13. real `questions` table untouched by cleanup;
14. RBAC unchanged (student → 403 on faculty bank/summary/PYQ).

Plus the pre-existing 28 backend tests — **44/44 green**.

## 15. Frontend (zero-redesign contract)

Only two tiny guards (Phase F, already committed; unchanged in this phase): admin `QuestionBank.jsx` MCQ-share "—" when `byType` is empty, and `PYQAnalysis.jsx` conditional `p.example`. The new neutral values (`0`, `"0 papers"`, `"No question data yet"`, `"Assessment health unavailable"`) render through the existing components — verified in the reports/export tab (`opt.rows`, `opt.detail`), which now honestly shows "0 rows / 0 papers".

**Regression:** `npm test` → **279/279 passed**; `npm run build` → success; built `dist/assets/*` bundles contain **0** seeded markers; vite dev server serving `:5173` (HTTP 200).

## 16. Files NOT touched (and why)

- **Real data plane:** no SQL deletes/truncates/drops anywhere; `questions`, `papers`, `exam_attempts`, users, uploads, reports records untouched (asserted by test 13 and by the live flow §12).
- **Student plane:** `student-portal.json`, `student-intelligence-*.json`, `student-360-aarav.json`, exam-agent exams, student routes — protected examination/practice content.
- **Feature code:** all endpoints, engines, RBAC, auth unchanged. `faculty.py` gained only `_live_bank_stats`/`_merge_live_question_bank` wiring into the faculty-intelligence summary route.
- **Exam generator sample** (`examGeneratorSample`): blueprint metadata, no question records — kept.
- **Paper/assignment/taxonomy/copy** occurrences per §9.
- **Postgres config:** unchanged, only `backend/.env(.example)`.

## 17. Backend gaps & deviations

1. **§8 deviation** — seed-paper question content removed (paper records preserved). Rationale: the stems are named in the user's removal list; "no fabricated question lists" outranks keeping authored demo question content.
2. The admin `Intelligence overview` composite scores (institution/department/faculty health) remain — they are institutional analytics (students/faculty), explicitly outside the question-data scope.
3. `question-studio-sources.json` `metrics.questionsGenerated 305 / approved 262` were examined: they describe the Question-Studio source library (12 publisher/exam source records seeded into the `question_sources` table — metadata, not question records). The sources library is a legitimate seeded feature catalog and was kept; its generated-count metrics do not surface question records. Flagged here for completeness.
4. `_live_bank_stats` `bySubject` falls back to `"General"` for questions without a subject — cosmetic grouping choice inside the existing contract.

## 18. Security / auth / RBAC

No auth surface changed. RBAC verified live and in tests: student → 403 on `/faculty/question-bank`, `/faculty-intelligence/summary`, `/faculty/pyq-analysis`; admin endpoints require the admin role; faculty JWT still scoped per institution (empty-institution test proves per-institution bank isolation — University ≠ JEE ≠ NEET isolation preserved via `exam_mode`/`exam_family` in the adapters and live SQL).

## 19. Performance / operations

`_live_bank_stats` adds three small indexed aggregates (`institution_id` indexed; `subject_id`, `status`, `source` columns) to the summary route only. Boot heal adds one JSON pass per stored affected document (milliseconds). CLI is offline and idempotent. No new dependencies.

## 20. Rollback

All changes are in 9 JSON documents, 3 Python modules, 1 test file, 2 one-line frontend guards and this report. `git revert` of the Phase-G commit restores the prior behaviour; `/tmp/spa_original/` (sandbox-only) retains pristine pre-clean copies for forensic diffing. The cleanup transform itself is versioned and idempotent, so re-applying after any future seed edit is always safe.

## 21. Sign-off checklist

- [x] Seed source JSON physically cleaned (9 docs, 4,301 records, 732 edit points)
- [x] Existing DB rows healed on boot (`written/skipped/healed`), scoped to affected docs only
- [x] Re-seed cannot reintroduce records (test + live proof)
- [x] Endpoint verification: question-bank → `0/[]`; summary + pyq-analysis → no seeded records; admin surfaces clean
- [x] Real-question flow: insert → bank + summary + (UI contract) → delete (live)
- [x] Backend suite 44/44; frontend 279/279; build clean; dist clean
- [x] Real `questions` table and all protected planes untouched
- [x] University / JEE / NEET isolation preserved (domain/examFamily)
- [x] Auth/RBAC unchanged and verified
- [x] Every remaining occurrence classified (§9) — no blind deletions
- [x] Deviations documented (§8, §17)
