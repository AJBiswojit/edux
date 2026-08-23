# PHASE 5 — STUDENT 360 EVIDENCE → ACTION HARDENING

Phase 1–4 recap: domain isolation (P1), dead-code cleanup (P2), service/API
dedup (P3), Student Profile + Student 360 consolidation (P4). Phase 5 closes
the loop from *insight* to *faculty action* — frontend/mock architecture
only. No backend, no database, no auth change, no new intelligence engine, no
second intervention engine, no automatic assignment, no notifications.

```
Student 360 → weakness → REAL evidence questions → why → suggested
intervention → faculty review → faculty creates intervention → existing
Phase 6 lifecycle continues (Recommended → Approved → … → effectiveness)
```

## BEFORE

- **Tests**: two near-duplicate Student 360 domain-isolation suites
  (`tests/intelligence/…domain-isolation.test.js`, 10 tests — canonical;
  `test/…domain-isolation.test.js`, 9 tests — duplicate) plus a private
  fixture module used only by the duplicate.
- **Similar Issues (Student 360 tab)**: showed only Phase 5 *groups* that
  contain the student. `groupSimilarIssues()` already returned singleton
  `individuals`, but they were bare fingerprints — no priority, no
  why-detected — and never surfaced inside Student 360.
- **Evidence**: `QuestionEvidenceDialog` was a *private* component inside
  `student-360-panels.jsx` (strengths/weaknesses only), fetched University
  bank questions for every domain, had no status filter and no detail view.
  Chapter Intelligence showed evidence only at *topic* level; Similar Issues
  had no evidence access at all.
- **Interventions**: `SuggestedInterventionDialog` was display-only with a
  link to the Intervention Center — there was **no way to create an
  intervention from Student 360**, and the `InterventionRecommendationCard`'s
  "Create Intervention" button was a no-op.
- **Per-student interventions**: the 360 panel listed only `Assigned`+
  interventions with no created date, practice/re-test/effectiveness status.
- **Strengths**: evidence buttons only; no negative-signal detection (by
  design), but also no path for a declining strength.
- **Chapters**: chapter cards were plain aggregation without derived
  trend/priority and without actions.
- **Subjects**: cards repeated every weak chapter.
- **URL state**: helpers inlined (untestable), no validation of unknown
  `context`/`tab` values.

## AFTER

The complete evidence → action chain works in all three domains
(University / JEE / NEET), verified by 129 passing tests and a production
build:

```
Weakness / Individual issue / Grouped issue / Actionable chapter
  → "Evidence questions"  (ONE shared dialog, canonical rows + filters)
  → "Suggested intervention" (existing ground-level engine, labelled
     "Faculty review required")
  → "Review & Create Intervention" (context + evidence read-only;
     title/priority/objective/count/difficulty/PYQ/notes editable)
  → Create → existing lifecycle storage at status 'Recommended'
  → Student 360 Interventions tab: "Created from Student 360" with
     status · priority · target · created date · practice status ·
     re-test status · effectiveness status
  → Open Intervention Center → existing Phase 6 flow unchanged
```

## Individual Issues

- New pure helpers in the **existing** `similar-issues.js` engine:
  - `buildIndividualWhyDetected(fingerprint)` — deterministic template that
    quotes only observable numbers (attempts, incorrect count, accuracy
    before→after, avg time vs the 100s threshold, skips).
  - `buildIndividualIssue(fingerprint)` — canonical view of a fingerprint
    that joined no ≥2-student group; reuses the same fingerprint fields,
    issue types, severities and `derivePriority` rules (count = 1). **No
    second classifier.**
- `GET /faculty/similar-issues` now returns individuals enriched with
  `priority`, `whyDetected`, `persistence`, `evidenceQuestionCount`, etc.
- Student 360 → Similar Issues shows section **B. INDIVIDUAL ISSUES** with
  subject, chapter, issue type, severity, priority, accuracy, avg time,
  trend, evidence question count and why-detected — every card offering
  *Evidence questions* + *Suggested intervention*.
- Domain isolation: every issue carries `domain`, `examFamily`, `subject`,
  `chapter`; UI filtering uses the canonical partition
  (`issueMatchesDomain`), never subject-name inference.

## Grouped Issues

- Student 360 → Similar Issues section **A. GROUPED ISSUES** (≥2 students,
  same domain → examFamily → subject → chapter partition) now also shows
  group severity, this student's own metrics vs group average, evidence
  question count, persistent/declining flags, and the existing
  recommendation — plus *Evidence questions* (this student's actual rows
  for that chapter) and *Suggested intervention*.
- Empty states: "No similar issues currently identified." /
  "No individual issues currently identified."

## Evidence Question System

- **ONE shared dialog**: `EvidenceQuestionsDialog` in
  `students-workspace/student-evidence.jsx`, reused by Strengths,
  Weaknesses, Chapter Intelligence, Similar Issues (grouped) and Individual
  Issues. No per-panel dialogs (the old private one was removed).
- Renders **only canonical attempt rows** (`s360.question.rows` — real
  questions with text, options, student answer, correct answer, status,
  time, answer changes, revisits, marked-for-review, difficulty, type,
  topic, exam name/date). Zero fabricated questions.
- Status filter chips (All / Correct / Incorrect / Skipped / Slow ≥90s with
  counts), per-question "Question details" (options + correct/selected
  highlighting via the existing `QuestionDetailDialog`), and clearly
  separated *related practice sources* — University Question Bank (existing
  `weak-topic-questions`) or JEE/NEET PYQs (existing `related-resources`)
  with PYQ year/exam metadata.
- Honest empty state: "No question-level evidence available." — the dialog
  is never blank; related-source loading shows real query state (no fake
  delays).

## Subject → Chapter → Question Drilldown

- Subject cards now **summarize**: accuracy/attempt/time + "Top concern:
  <chapter> — <acc>%" (+ "+N more weak chapters") + strongest chapter +
  "View Chapter Intelligence →" (no full chapter metric dumps).
- Chapter Intelligence chapter cards show the **derived** metrics:
  accuracy, attempts, correct, incorrect, skipped, avg time, trend,
  priority, question/evidence counts — merged from `s360.chapters` (Phase 2
  engine output), not recomputed.
- Weak/actionable chapters (`chapterIsActionable` — accuracy < 70,
  declining/persistent, or High priority) get **[View Questions]** and
  **[Suggested Intervention]**; topic drilldown is preserved and its
  recommendation card now wires into the same Review & Create flow.

## Weakness → Intervention Flow

`Weakness → View Evidence Questions → dialog → Suggested Intervention →
Review & Create Intervention → Create` — exactly as specified. The
suggestion is derived by the **existing**
`generateInterventionRecommendation()` from the weakness's actual question
rows (title, target, issue type, priority, objective, practice
count/type, difficulty progression, PYQ preference, evidence summary) and
is clearly labelled **"Faculty review required — recommendation only;
nothing is created or assigned automatically."** Nothing is auto-created.

## Intervention Creation

- New mock endpoint `POST /faculty/students/:studentId/interventions`
  (faculty-reviewed creation from Student 360):
  - evidence is **re-derived server-side** from the student's canonical
    attempts (fingerprint match → fallback domain-scoped question-row
    aggregation); a client payload can never fabricate evidence;
  - no evidence → readable 400 "No question-level evidence available for
    <chapter>…"; unknown student → 404; missing subject/chapter → 400;
    duplicate (non-dismissed) → readable 400 "already exists";
  - the record is built by the **existing** `buildInterventionFromGroup()`
    from a synthetic single-student group and stored in the **existing**
    `aurora_faculty_interventions` localStorage map (id `s360-<student>-…`),
    with `source: 'Student 360'`, `createdBy`, `createdAt`, and status
    `'Recommended'` — it enters the lifecycle where faculty review left off.
- Creation payload integrity (tested): studentId, domain, examFamily,
  subject, chapter, issueType, priority, objectives, evidence,
  practiceConfig (type/count/difficulty/duration/includePyq), source,
  createdBy, status.

## Existing Lifecycle Reuse

- ONE intervention universe: `allInterventionGroups()` = similar-issue
  groups + Student-360 records; every existing route (list, detail, status,
  modify, assign, practice, retest, `/student/interventions`,
  practice-attempts, per-student list) resolves from it via
  `findGroupById()`. Same `TRANSITIONS`/`canTransition` machine, same
  practice/re-test/effectiveness pipeline, same prototype localStorage
  persistence. No second storage system, no bypassed validation, no
  automatic assignment.
- After creation, Student 360 → Interventions shows the record
  ("Created from Student 360") from `Recommended` onward with status,
  priority, target, created date, practice status (Not started / In
  progress / Completed + progress), re-test status (Not created / Pending /
  Completed) and effectiveness status (Pending / outcome), plus "Open
  Intervention Center".

## Components Created

- `src/utils/student-360-url.js` — pure URL-state helpers
  (`DOMAIN_PARAM`, `readContextParam`, `readTabParam`,
  `build360SearchParams`, `student360Url`).
- `EvidenceQuestionsDialog` (shared evidence dialog) and
  `SuggestedInterventionDialog` (shared suggestion + review & create
  launcher) in `student-evidence.jsx`.
- `ReviewCreateInterventionDialog` in `intervention-center.jsx`.
- `GroupedIssueCard` / `IndividualIssueCard` /
  `strengthNegativeSignal` in `student-360-panels.jsx`.
- `chapterIsActionable` in `student-intelligence-tabs.jsx`.
- `buildIndividualIssue` / `buildIndividualWhyDetected` in the
  `similar-issues.js` engine.
- Tests: `tests/intelligence/student-360-evidence-action.test.js` (33),
  `tests/intelligence/student-360-ui-render.test.jsx` (6).

## Components Modified

- `student-360-panels.jsx` — strengths negative-signal gating, weaknesses →
  shared dialogs, Similar Issues grouped+individual sections, loading/error
  states, removed the private evidence dialog.
- `student-intelligence-tabs.jsx` — subject summary cards, actionable
  chapter cards, shared evidence/suggestion dialogs.
- `student-evidence.jsx` — shared dialogs + richer evidence card (subject/
  chapter/topic line, details button).
- `intervention-center.jsx` — `ReviewCreateInterventionDialog`, richer
  per-student panel (statuses, source badge, created date).
- `StudentProfile.jsx` — new prop wiring, URL helper extraction,
  post-create jump to the Interventions tab.

## Components Deleted

- Private `QuestionEvidenceDialog` (student-360-panels.jsx — replaced by the
  shared dialog, not duplicated).
- `test/student-360-domain-isolation.test.js` +
  `test/fixtures/intelligence-attempts.js` (duplicate coverage merged).

## Services Modified

- `faculty-interventions.js` — added `useCreateStudent360Intervention`
  (invalidates faculty/student intervention queries).

## Routes Modified

- `mock-routes-faculty-interventions.js` — individuals enrichment;
  `POST /faculty/students/:studentId/interventions`; combined
  group+s360 resolution across all lifecycle routes; per-student list now
  includes `Recommended`+ with practice/re-test/effectiveness statuses.
- No React Router changes (canonical `/faculty/my-students/:studentId`
  deep links and redirects untouched).

## Tests

```
 ✓ tests/intelligence/student-360-evidence-action.test.js  (33)
 ✓ tests/intelligence/student-360-consolidation.test.js    (19)
 ✓ tests/intelligence/student-360-domain-isolation.test.js (14, consolidated)
 ✓ tests/services/service-surface.test.js                  (50)
 ✓ tests/intelligence/student-360-ui-render.test.jsx       ( 6)
 ✓ tests/intelligence/student-360-routes.test.js           ( 7)
 Test Files  6 passed
 Tests      129 passed
```

Consolidation detail: the two Phase 4 domain-isolation suites were merged
into ONE canonical file (`tests/intelligence/student-360-domain-isolation.
test.js`, 14 tests). Every meaningful assertion survives — including the
duplicate's unique ones (adapter-context 2-key shape, rejection of
competitive records without a canonical family, NEET-pool-emptiness,
series-length isolation, Similar Issues singleton partitions). Coverage
still verifies University / JEE / NEET isolation, University+JEE,
University+NEET, no cross-family leakage, question evidence isolation, DNA
evidence isolation, trend isolation and comparison isolation.

New coverage maps 1:1 to the §24 list: duplicate consolidation, individual
issue detection, grouped/individual separation, three-domain isolation,
evidence retrieval, empty-evidence behavior (including API refusal),
subject→chapter drilldown, chapter→evidence, weakness→recommendation,
recommendation→creation, payload integrity, lifecycle preservation
(valid + invalid transitions, group interventions untouched), URL state,
and unsupported-claim checks (deterministic templates, quoted numbers, no
psychological terms).

## Build

`npm run build` — ✓ built in ~14s, no broken imports, no unused critical
exports, no route errors. (Pre-existing vendor/charts chunk-size warning is
unchanged from Phase 4.)

## Browser Verification

**Interactive browser verification unavailable.** No browser binary exists
in this environment and the Playwright CDN is unreachable, so the
375px / 768px / 1440px interactive pass could NOT be performed and is not
claimed. Compensating verification actually performed:

- SSR render smoke suite (`student-360-ui-render.test.jsx`): renders the
  REAL `StudentProfile` page (real router + react-query + mock API,
  framer-motion stubbed) for a JEE student at
  `?context=jee&tab=weaknesses|similar|chapters|strengths|interventions`
  and for a NEET (`fs_neet_a_04`) and University (`fs_s2`) student —
  weaknesses/similar/chapters/strengths surfaces, grouped+individual
  sections, empty interventions state and per-domain titles all render,
  with no cross-domain content.
- Dev-server boot check: vite serves and transforms all touched modules
  (200s), root HTML served.
- Full workflow (weakness → evidence rows → recommendation → create →
  lifecycle transitions → per-student status) exercised against the real
  mock-server dispatch in the evidence-action suite.

## University/JEE/NEET Verification

Logic + API level (per above suites): individual issues and grouped issues
carry canonical `domain`/`examFamily`; UI pools filter strictly
(University↔JEE↔NEET never mix); same-named JEE/NEET chapters stay separate
series; creation is domain-scoped — a JEE-labelled intervention for a
University-only student is **refused** ("No question-level evidence
available"); creations for JEE (`fs_jee_a_03`), NEET (`fs_neet_a_04`) and
University (`fs_s2…fs_s9`/`fs_uni_a_17`) students each land in their own
domain with correct family metadata. Interactive visual verification was
not possible (see Browser Verification).

## Regression

All surfaces re-verified through the real mock server:

- Faculty: Dashboard (`/faculty-intelligence/summary`) ✓ My Students ✓
  Student 360 ✓ Question Intelligence (question-bank) ✓ PYQ Intelligence ✓
  Paper Generator + Library ✓ Similar Issues ✓ Interventions ✓ Targeted
  Practice + Re-test endpoints ✓ (Reports/Quiz/Exam builder ✓)
- Student: Exam Analysis ✓ Exam Agent ✓ Academic DNA (derived intelligence
  summary + 360 DNA panel) ✓ Interventions ✓
- Admin: Dashboard/Institution Intelligence ✓ Reports (via
  `useAdminIntelligence`; `/admin/reports` was retired in Phase 3 —
  pre-existing) ✓ AI Workspace (`/ai/stats`, `/admin/ai-config`) ✓

`tests/services/service-surface.test.js` (50 assertions) unchanged and
green — canonical snapshots, retired endpoints still gone, exam-attempt
isolation, paper generator/library, lifecycle intact.

## Remaining Limitations

- Interactive browser verification (responsive widths, click-through)
  unavailable in this environment.
- Practice/re-test completion for Student-360-created interventions is
  exercised at the API level (the same practice-attempt route drives both),
  but no student-side UI walk-through was possible without a browser.
- `AI Similarity Score` remains a labelled prototype measure; effectiveness
  remains "Prototype Intervention Effectiveness" (not validated).
- University evidence dialogs show related bank questions only when the
  chapter matches the bank's subject-code mapping (pre-existing dataset
  constraint, honestly surfaced).
- s360 creation is intentionally capped at one non-dismissed intervention
  per student+chapter (re-creation is refused with a readable message).

## Recommended Phase 6

1. Batch creation: apply one reviewed intervention to selected students
   from a Similar Issues group without leaving Student 360.
2. Practice-insufficiency surfaced inside the review dialog (pre-flight
   `selectPracticeQuestions` availability check per pool).
3. Outcome roll-up: link re-test ExamAgent attempts (not just prototype
   practice attempts) into `computeEffectiveness`.
4. Split the pre-existing >2 MB vendor chunk (route-level code splitting).
5. If a browser environment becomes available: run the §26 375/768/1440px
   interactive pass for all three domains.
