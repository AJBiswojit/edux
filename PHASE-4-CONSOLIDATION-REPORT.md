# PHASE 4 — STUDENT PROFILE + STUDENT 360 CONSOLIDATION

## 1. BEFORE

The faculty student-detail experience had **duplicate presentation architecture**
over one intelligence engine:

- `StudentProfile.jsx` rendered 8 tabs but its **Overview** tab mounted a single
  monolithic `Student360Panels` component that rendered *all* sections at once
  (Overview + Strengths/Weaknesses + Subjects + Chapters + Questions + Time +
  Behaviour + Errors + Trends + Comparison + DNA), while the other tabs mounted
  **separate, duplicate** implementations of the same concepts:
  - `student-360-panels.jsx` — one set of Time/Behaviour/Errors/Trends/Comparison/DNA/Subjects/Chapters/Questions panels (all rendered together inside Overview).
  - `student-intelligence-tabs.jsx` — a *second* set of Subject/Chapter/Question panels with drill-down.
  - `student-profile-panels.jsx` — a *third* set of Time&Behaviour/Trends/DNA panels.
- Strengths had no evidence dialog; Weaknesses had one. The duplicated
  Time/Trends/DNA panels differed only in styling.
- No Similar Issues or Interventions tabs on the student page (only on the
  My Students directory).
- Tab/context/subject/chapter state was local-only — refreshing lost the view.
- The canonical route was already `/faculty/my-students/:studentId`; the old
  `/faculty/students/:studentId/360` UI alias had no redirect.

## 2. AFTER

**One canonical faculty student-detail experience:**

`Faculty → My Students → Select Student → Student 360` at
`/faculty/my-students/:studentId`, with **13 canonical tabs**, each backed by a
single panel that consumes the pre-derived `useFacultyStudent360()` bundle. The
monolithic "render everything in Overview" host is gone; the duplicate
Time/Trends/DNA panels are gone; the engine, data contracts and all other
features are untouched.

URL state (`?context=jee&tab=weaknesses&subject=Physics&chapter=…`) makes every
view deep-linkable and refresh-safe.

## 3. Architecture before

```
StudentProfile.jsx
 ├─ Overview ── Student360Panels (monolith: renders ALL 11 sections at once)
 │              ├─ OverviewPanel / StrengthsWeaknessesPanel
 │              ├─ SubjectsPanel / ChaptersPanel / QuestionsPanel
 │              ├─ TimePanel / BehaviourPanel / ErrorsPanel
 │              ├─ TrendsPanel / ComparisonPanel / DnaPanel
 │              └─ QuestionEvidenceDialog
 ├─ Exams ───── ExamHistoryTable
 ├─ Subjects ── SubjectIntelligencePanel / SubjectDrilldownPanel   (duplicate 2nd impl)
 ├─ Chapters ── ChapterIntelligencePanel                           (duplicate 2nd impl)
 ├─ Questions ─ QuestionAnalysisPanel                              (duplicate 2nd impl)
 ├─ Time ────── TimeBehaviourPanel        (from student-profile-panels — duplicate 3rd impl)
 ├─ Trends ──── TrendsPanel               (from student-profile-panels — duplicate 3rd impl)
 └─ DNA ─────── DnaPanel                  (from student-profile-panels — duplicate 3rd impl)
```

## 4. Architecture after

```
StudentProfile.jsx  (orchestration only — header + domain selector + 13 tabs + URL state)
 ├─ 1  Overview        ── OverviewPanel            (KPI + AI summary + domain-scoped exam history)
 ├─ 2  Strengths       ── StrengthsPanel           (+ canonical evidence dialog, strength mode)
 ├─ 3  Weaknesses      ── WeaknessesPanel          (+ evidence dialog + suggested-intervention dialog)
 ├─ 4  Subjects        ── SubjectIntelligencePanel → SubjectDrilldownPanel (drill into chapters)
 ├─ 5  Chapters        ── ChapterIntelligencePanel (topics → evidence questions → intervention)
 ├─ 6  Questions       ── QuestionAnalysisPanel    (deepest evidence layer + filters)
 ├─ 7  Time & Behaviour── TimeBehaviourPanel        (single coherent section)
 ├─ 8  Errors          ── ErrorsPanel              (Careless/Time-related/Unattempted/Unclassified)
 ├─ 9  Trends          ── TrendsPanel
 ├─ 10 Comparison      ── ComparisonPanel          (first vs latest, context-isolated)
 ├─ 11 Academic DNA    ── DnaPanel
 ├─ 12 Similar Issues  ── SimilarIssuesPanel       (Phase 5 groups containing THIS student)
 └─ 13 Interventions   ── StudentInterventionsPanel (Phase 6 lifecycle, read-only here)
```

All panels are **pure consumers** of the `computeStudent360()` bundle via
`useFacultyStudent360()`. No new engine, no re-computation, no backend changes.

## 5. Components consolidated

- **Time + Behaviour** → one `TimeBehaviourPanel` (the two were previously split
  across `TimePanel`/`BehaviourPanel` in the monolith *and* a combined panel in
  `student-profile-panels`).
- **Errors** promoted from a sub-card of Behaviour to its own canonical tab with
  the conservative taxonomy enforced in the UI (`Careless / Time-related /
  Unattempted / Unclassified` — any other category is filtered out).
- **Strengths & Weaknesses** now share one `QuestionEvidenceDialog` (parameterised
  by `mode: 'strength' | 'weakness' | 'all'`) instead of a weakness-only dialog.
- **Trends / Comparison / DNA** deduplicated to the single
  `student-360-panels.jsx` implementation.
- **Subjects / Chapters / Questions** kept as the richer drill-down
  `student-intelligence-tabs.jsx` versions (they carry the
  subject→chapter→topic→question state machine and intervention suggestions);
  the simpler duplicates inside the old monolith were removed.
- **Similar Issues** reuses the Phase 5 `useSimilarIssues()` payload, filtered to
  groups containing the current student and selected domain.
- **Interventions** reuses the Phase 6 lifecycle via a new student-scoped
  `StudentInterventionsPanel` (same endpoint, same status/priority/effectiveness
  model, same `InterventionDetailDialog`); "Manage" deep-links to the full
  Intervention Center.

## 6. Components created

- `SimilarIssuesPanel` (in `student-360-panels.jsx`) — Phase 5 groups for the
  current student, domain-isolated.
- `StudentInterventionsPanel` (in `intervention-center.jsx`) — read-only
  per-student view of assigned/active interventions.
- `SuggestedInterventionDialog` (in `student-360-panels.jsx`) — derives a
  recommendation from the existing `generateInterventionRecommendation()` over
  the weakness's actual question rows; links to the Intervention Center. No
  automatic assignment.
- `Student360Redirect` / `FacultyAttemptRedirect` (in `routes/index.jsx`) —
  backward-compatible alias handlers.
- Tests: `tests/intelligence/student-360-consolidation.test.js` (19 tests) and
  `tests/intelligence/student-360-routes.test.js` (7 tests).

## 7. Components modified

- `src/pages/faculty/StudentProfile.jsx` — rewritten as a thin orchestrator: 13
  tabs, URL-synced state (`tab`, `context`, `subject`, `chapter`), University/JEE/NEET
  selector (only contexts with attempts are shown), identity header with last
  activity. Removed all duplicated panel markup.
- `src/components/students-workspace/student-360-panels.jsx` — converted from a
  monolithic host into a library of 9 named, independently-mounted canonical
  panels plus the shared evidence dialog and `domainPool`/`domainSwPool` helpers.
- `src/components/students-workspace/intervention-center.jsx` — added
  `StudentInterventionsPanel`; re-exports it.
- `src/pages/faculty/MyStudents.jsx` — honours `?view=interventions|issues` deep
  link (target of the 360 "Open Intervention Center" action).
- `src/routes/index.jsx` — added backward-compatible redirects for
  `/faculty/students/:studentId/360` and
  `/faculty/students/:studentId/exams/:attemptId/analysis`.

## 8. Components deleted

- `src/components/students-workspace/student-profile-panels.jsx` — **proven
  unreachable** before deletion: its only importer was `StudentProfile.jsx`,
  which now sources `TimeBehaviourPanel`/`TrendsPanel`/`DnaPanel` from
  `student-360-panels.jsx`. Dependency search covered imports, barrel exports,
  dynamic imports, routes and JSX usage. (170 lines removed.)

The old monolithic `Student360Panels` host export was also removed from
`student-360-panels.jsx` (zero remaining references).

## 9. Routes changed

- Added `/faculty/students/:studentId/360` → safe redirect to
  `/faculty/my-students/:studentId` (preserves query string).
- Added `/faculty/students/:studentId/exams/:attemptId/analysis` → redirect to
  canonical `/faculty/my-students/:studentId/exams/:attemptId`.

(These were previously not registered as UI routes; the redirects guarantee any
external/bookmarked deep links land on the canonical experience.)

## 10. Routes preserved

- `/faculty/my-students` — directory (unchanged).
- `/faculty/my-students/:studentId` — canonical Student 360 (unchanged path).
- `/faculty/my-students/:studentId/exams/:attemptId` — dedicated Attempt Analysis
  deep-detail page (`FacultyAttemptAnalysis`), unchanged and still reuses the
  existing `AnalysisDashboard`.
- All Student, Admin, Question Intelligence, Paper Generator/Library,
  Intervention and Report routes are untouched.

## 11. Intelligence engines reused

- `computeStudent360()` (`src/intelligence/faculty/engine/student-360.js`) — the
  single 360 bundle; **not modified**.
- `computeStudentStrengthsWeaknesses / Subject / Chapter / Question /
  Longitudinal / Comparison` — all reused as-is.
- `buildAttemptSignals` / `buildExamEvidence` (Phase 2 canonical-context
  adapter) — reused.
- `classifyAttemptContext` / `ATTEMPT_CLASSIFICATIONS` — reused (no subject-name
  heuristics; University/JEE/NEET come from canonical attempt metadata).
- `generateInterventionRecommendation` (ground-level intelligence) — reused for
  the weakness "Suggested intervention" dialog.
- `groupSimilarIssues` / `computeStudentIssueFingerprints` (Phase 5) — reused via
  the existing `/faculty/similar-issues` endpoint.
- Intervention lifecycle (Phase 6) — reused via the existing endpoints and
  `InterventionDetailDialog`.
- **No** `computeStudent360Again`, `computeSubjectIntelligenceAgain`, etc. were
  created.

## 12. Data contracts unchanged

- `GET /faculty/students/:id/360` — same bundle shape
  (`overview`, `aiSummary`, `strengthsWeaknesses`, `subjects`, `chapters`,
  `question{rows,byContext,time,behaviour,errors}`, `longitudinal`,
  `comparison`, `comparisonByContext`, `defaultDomain`, `uniCount/jeeCount/neetCount`).
- `GET /faculty/students/:id/interventions` — unchanged.
- `GET /faculty/students/:id/exams/:attemptId/analysis` — unchanged.
- `GET /faculty/students/weak-topic-questions` — unchanged (related Question Bank).
- `GET /faculty/similar-issues`, `GET /faculty/interventions`, intervention
  status/modify/assign/retest/practice endpoints — unchanged.
- University/JEE/NEET datasets and question-bank/PYQ data — untouched.

## 13. University / JEE / NEET verification

Verified by `tests/intelligence/student-360-consolidation.test.js` and the
existing `student-360-domain-isolation` suite:

- University subjects/chapters/questions are University-only
  (`CS501`/`Data Structures & Algorithms` never appear in JEE/NEET pools).
- JEE = Physics + Mathematics + Chemistry only; NEET = Physics + Chemistry +
  Biology only; neither leaks into the other or into University.
- Same-named JEE and NEET chapters are never merged into one series.
- `question.byContext.University.rows` all have `examMode === 'University'`;
  `…JEE.rows` all have `examFamily === 'JEE'`; `…NEET.rows` all `examFamily === 'NEET'`.
- The selector offers only University / JEE / NEET (never a generic
  "Competitive" context); a context is shown only when that student has attempts
  for it.
- Trend series, comparison, similar issues and interventions are all filtered by
  the selected context.

Runtime data check on the primary demo student (u_stu_001): 2 University + 3 JEE
+ 2 NEET attempts; subjects `[Data Structures & Algorithms]`,
`[Chemistry, Mathematics, Physics]`, `[Biology, Chemistry, Physics]`; 24/45/30
question rows respectively.

## 14. Evidence-question verification

- `QuestionEvidenceDialog` derives canonical attempt evidence **first** from
  `s360.question.rows` (subject+chapter+context match), then appends related
  Question Bank items from `useWeakTopicQuestions`.
- Strength mode shows only `Correct` rows; weakness mode shows `Incorrect` /
  `Skipped` / slow / changed rows.
- Every row renders question text, subject, chapter, topic, difficulty, student
  answer, correct answer, result, time spent, answer changes, revisits, marked-
  for-review and the AI observation.
- If both sources are empty it explicitly shows **"No question-level evidence
  available."** — never an empty dialog and never fabricated evidence.
- If canonical evidence exists but the Question Bank has no match, it says so and
  still shows the canonical attempt questions.
- Tests assert weaknesses/strengths carry evidence blocks and that Rotational
  Motion resolves to actual incorrect question rows with text + answers.

## 15. Intervention integration verification

- Weakness → **Evidence questions** → **Suggested intervention** dialog (derived
  by the existing `generateInterventionRecommendation`) → **Open Intervention
  Center** (links to `/faculty/my-students?view=interventions`).
- Nothing is assigned automatically; the dialog is informational and links out.
- The Interventions tab shows existing interventions with status, priority,
  target issue, practice accuracy, outcome and domain, reusing the Phase 6
  `InterventionDetailDialog`.
- Similar Issues tab shows Phase 5 groups containing the student, with why-
  detected, recommendation and priority, domain-isolated.
- Tests confirm the per-student interventions endpoint returns status/priority/
  domain and that all intervention-center endpoints remain live.

## 16. Tests

```
✓ tests/intelligence/student-360-consolidation.test.js (19 tests)
✓ tests/intelligence/student-360-routes.test.js        (7 tests)
✓ tests/services/service-surface.test.js               (50 tests, unchanged)
✓ tests/intelligence/student-360-domain-isolation.test.js (10 tests, unchanged)
✓ test/student-360-domain-isolation.test.js            (9 tests, unchanged)

Test Files  5 passed
Tests       95 passed
```

New tests cover: University/JEE/NEET isolation, no cross-domain leakage, no
generic "Competitive" pool, domain-pool helper, evidence-question shape/non-empty
guarantee, subject→chapter drill-down data, chapter→evidence+intervention shape,
strength evidence, question-analysis partitions (correct/incorrect/skipped/slow/
changed), time/behaviour counters, conservative error taxonomy, trends per
context, first-vs-latest comparison (and null when <2 attempts), intervention
recommendation reuse, the 360 API surface/contract, weak-topic evidence surface,
per-student interventions surface, attempt-analysis deep link, and endpoint
liveness.

## 17. Build

```
npm run build  →  ✓ built (no errors)
StudentProfile chunk: 90.07 kB → 79.79 kB (gzip 18.35 → 17.29)
```
The only warning is the pre-existing vendor chunk-size notice (unrelated).

## 18. Browser verification

**Browser automation was NOT available in this environment** (no jsdom /
@testing-library / Playwright/Puppeteer installed), so I cannot claim automated
browser/visual verification. I verified instead by:

- `npm run build` — production build compiles all changed modules.
- `npm run dev` — Vite dev server booted cleanly; every modified module
  (`StudentProfile.jsx`, `student-360-panels.jsx`, `intervention-center.jsx`,
  `MyStudents.jsx`, `routes/index.jsx`) transformed with HTTP 200 and **no
  transform errors or warnings** in the Vite log.
- Full logic/contract test suite (95 tests) against the real mock server.
- Runtime data inspection of the live 360/interventions/similar-issues payloads
  for the primary demo student.

Manual in-browser checks at 375/768/1440 px should still be run by a reviewer
(log in as faculty → My Students → open a student).

## 19. Responsive verification

Layout uses the existing responsive primitives throughout: `grid-cols-2
xl:grid-cols-4` KPIs, `flex-wrap` tab list (`TabsList`), `grid md:grid-cols-2
xl:grid-cols-3` card grids, and `overflow-x-auto` tables with `min-w` (the same
patterns already used across the app). Tabs wrap rather than scroll off-screen;
wide tables scroll horizontally within their card. No fixed widths or new
horizontal-overflow risks were introduced. Not visually confirmed in a browser
(see §18).

## 20. Console / error result

- Vite dev server: no errors/warnings for changed modules.
- No React key warnings introduced (lists use stable
  `${subject}-${chapter}` / `${attemptId}-${id}-${i}` keys).
- No prop-type or hook-order issues: all hooks (`useQuery`, `useState`,
  `useMemo`, `useSearchParams`) are called unconditionally before any early
  return in both `StudentProfile` and the panels.
- No console errors can be claimed from an actual browser session (no browser
  automation available).

## 21. Remaining technical debt

- **No automated DOM/visual tests** for the 360 panels — adding jsdom +
  @testing-library/react would let us assert tab rendering, evidence-dialog
  opening and URL-state sync directly.
- The two legacy domain-isolation test files
  (`test/student-360-domain-isolation.test.js` and
  `tests/intelligence/student-360-domain-isolation.test.js`) are near-duplicates
  (9 vs 10 tests); consolidating them is out of scope for Phase 4 but would
  reduce maintenance.
- `SimilarIssuesPanel` shows Phase 5 groups containing the student but does not
  yet surface singleton "individual issues" for that student (the directory
  Similar Issues tab does); a follow-up could add an individual-issues strip.
- The large vendor/charts chunks are pre-existing and unrelated.
- `StudentProfile` could be memoised further (e.g. per-domain row filtering) if
  profiling shows a need, but all filtering is over already-derived arrays and
  wrapped in `useMemo` where non-trivial.

## 22. Exact next-phase recommendation

**Phase 5/6 hardening on the canonical 360 surface:**

1. Add jsdom + React Testing Library and convert the new logic tests into
   component tests that click through Strengths→Evidence, Weakness→Evidence→
   Suggested Intervention, Subject→Chapter→Topic drill-down, and verify URL-state
   preservation on refresh.
2. Extend `SimilarIssuesPanel` to show the student's singleton individual issues
   (reusing the `individuals` payload already returned by `/faculty/similar-issues`).
3. Wire the weakness "Suggested intervention" dialog's **Create Intervention**
   action to the existing Phase 6 `useInterventionStatus`/`useInterventionModify`
   mutations (with explicit faculty confirm) so faculty can approve/plan without
   leaving Student 360 — still no automatic delivery.
4. Add a 375/768/1440 visual pass and empty/loading/skeleton states for each new
   tab (errors/similar/interventions) to match the rest of the app.
