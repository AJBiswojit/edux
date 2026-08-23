# PHASE 6 — MULTI-STUDENT INTERVENTION + EXAM OUTCOME INTELLIGENCE

## BEFORE

The mandatory read-only audit found the following reusable chain already in place:

```text
Similar Issue Group
  → canonical group members in domain/examFamily/subject/chapter partitions
  → group and per-student evidence summaries
  → one shared intervention lifecycle
  → existing Question Bank/PYQ selector
  → intervention practice attempts
  → linked re-tests
  → prototype effectiveness from baseline vs re-test
```

Existing architecture reused:

- `similar-issues.js` already produced deterministic University/JEE/NEET-isolated groups and group evidence.
- `intervention-lifecycle.js` already owned statuses, transition validation, practice selection, re-tests, and prototype effectiveness.
- `mock-routes-faculty-interventions.js` already owned the single `aurora_faculty_interventions` localStorage map and the existing practice/re-test stores.
- Student 360 already reused `StudentInterventionsPanel` and the shared `EvidenceQuestionsDialog`.
- `exam-agent.js`, `exam-attempt-intelligence.js`, and `exam-attempts-store.js` already defined and stored canonical ExamAttempts.
- Student/faculty Exam Analysis routes already existed.
- `ReviewCreateInterventionDialog` already handled the Phase 5 single-student review/create flow.
- Faculty, Student, and Admin pages were already route-lazy-loaded.

Gaps found before Phase 6:

- A Similar Issue Group had no faculty-confirmed multi-student creation flow.
- Group recommendations were represented as one group-level intervention; there was no one-record-per-selected-student creation operation.
- No group creation pre-flight exposed actual question availability/shortfall.
- Existing intervention exclusion, partial creation, and duplicate summaries were absent.
- Effectiveness consumed practice/re-test evidence only; it did not match canonical Exam Agent attempts.
- Student payloads could inherit group-shaped fields from older shared records.
- The Intervention Center had no source filter or Similar Issue source badge/group identifier.

## AFTER

The implemented flow is:

```text
Similar Issue Group
  → faculty opens Apply Intervention
  → eligible group members only
  → shared group evidence / per-student evidence
  → actual question-pool pre-flight
  → existing ReviewCreateInterventionDialog
  → ONE Recommended intervention record per selected student
  → existing approval/assignment lifecycle
  → existing practice and re-test stores
  → strict subsequent canonical ExamAttempt matching
  → individual prototype effectiveness
  → separate prototype group outcome
```

The implementation remains frontend + mock routes + deterministic datasets + existing localStorage stores. No backend, database, authentication change, external API, notification system, automatic assignment, new intelligence engine, or second intervention lifecycle was added.

## Multi-Student Selection

- Added **Apply Intervention** to grouped Similar Issues cards and group detail.
- Added the **Create Intervention for Students** workflow.
- The workflow displays issue, domain, exam family, subject, chapter, issue type, group size, group average accuracy/time, trend, evidence count, and assessment count.
- Student rows show name, roll/ID, batch, accuracy, average time, trend, priority, evidence count, existing intervention state, and student evidence action.
- Added Select All, Clear All, and individual checkboxes.
- The mock route validates every requested student ID against the selected group. An ID from another group is skipped with a readable reason.
- Existing active/non-dismissed interventions are marked and disabled by default. Their status and exclusion reason remain visible.

## Group Evidence

- Added `GET /faculty/similar-issues/:groupId/evidence`.
- Evidence is rebuilt from canonical question-attempt rows for each group member.
- Rows are filtered by all four canonical context fields: domain, exam family, subject, and chapter.
- **View Group Evidence** and **View Student Evidence** both reuse the existing `EvidenceQuestionsDialog`.
- No second evidence model or fabricated question content was introduced.

## Practice Availability

- Added actual question-pool pre-flight using the existing `selectPracticeQuestions()` lifecycle selector.
- The selector now accepts and validates domain, exam family, subject, chapter, difficulty, question type, PYQ preference, requested count, exclusion IDs, and explicit breadth level.
- UI/API results expose:
  - `availableQuestions`
  - `requiredQuestions`
  - `shortfall`
  - `insufficient`
  - actual/requested selection level
- Exact filters can be explicitly broadened to chapter/all-difficulty and then subject scope.
- The requested count is never silently reduced.
- Group creation returns HTTP-style 400 mock errors when availability is insufficient.
- The student practice page refuses to launch a partial set and shows a faculty-action-required warning for any older invalid configuration.
- Re-test creation now also refuses an insufficient unused pool instead of creating a partial re-test.

## Intervention Creation

- Extended the existing `ReviewCreateInterventionDialog`; no second review dialog was created.
- It now supports one student or multiple selected students.
- Multi-student review displays selected count, common target, issue, priority, objective, practice count, difficulty, duration, PYQ preference, evidence summary, and live availability.
- Editable fields remain title, priority, objective, count, difficulty, duration, PYQ preference, notes, plus explicit question type/filter breadth for pre-flight.
- Evidence remains read-only.
- Creation starts at `Recommended`; faculty approval and assignment remain manual.
- Partial success returns created/skipped arrays, counts, names, reasons, common target, and priority.
- Result UI provides **Open Intervention Center** and **View Student 360**.

## One-Student-One-Intervention Model

Each selected eligible student receives a separate deterministic record in the existing `aurora_faculty_interventions` map.

Each new record preserves:

- `interventionId`
- `studentId`
- singleton `studentIds`
- `source: "Similar Issues"`
- original `groupId`
- `domain`
- `examFamily`
- `subject`
- `chapter`
- `issueType`
- `priority`
- `objective` / objectives
- per-student evidence
- practice configuration and verified availability
- `createdBy`
- `createdAt`
- `status: "Recommended"`

Duplicate prevention uses student + domain + exam family + subject + chapter against persisted non-dismissed lifecycle records. Dismissed records can be deliberately replaced; unpersisted Detected recommendations do not incorrectly block every group member.

## Exam Agent Integration

The existing lifecycle engine was extended; no new outcome engine was added.

New pure helpers in `intervention-lifecycle.js`:

- `sameInterventionTarget()`
- `metricsFromCanonicalAttempt()`
- `matchInterventionExamAttempts()`
- `computeGroupEffectiveness()`

Matching rules:

1. Same student is mandatory.
2. Canonical University/Competitive domain must match.
3. JEE/NEET exam family must match exactly for Competitive attempts.
4. Subject and chapter must both match question-level canonical academic context.
5. Attempt must be chronologically after intervention/re-test evidence.
6. Intervention practice and re-test records are excluded from official Exam Agent matching.
7. Explicit `interventionId` matches are preferred.
8. If explicit linkage is absent, only strict contextual fallback is allowed.

Canonical ExamAttempt construction, normalization, storage, and mock routes now preserve `interventionId` when it is explicitly supplied. Faculty attempt readers now merge canonical stored attempts for every student, so **View Exam Analysis** resolves through the existing faculty Exam Analysis route.

## Before/After Intelligence

The existing `computeEffectiveness()` now consumes optional canonical Exam Agent metrics while preserving its previous re-test behavior.

Available metrics are shown separately for:

- Before intervention
- Practice
- Re-test
- Post-intervention Exam Agent attempt

Supported metrics:

- accuracy
- score when chapter-safe/available
- average time
- incorrect
- skipped
- attempted/questions
- accuracy delta
- time delta
- incorrect delta
- skipped delta in the data contract

Missing metrics remain `null` and render as `N/A`; they are not converted to invented zeros.

## Individual Effectiveness

The existing labels remain:

- Resolved
- Improving
- Partially Effective
- No Significant Change
- Persistent

Pending remains the honest state when no comparable evidence exists.

Every per-student outcome returned by the API preserves `interventionId` and `studentId`. UI copy uses **Prototype Intervention Effectiveness** and **Observed outcome after intervention** and explicitly rejects causal/scientifically validated claims.

The Intervention detail now contains a distinct **Post-Intervention Exam Performance** section with exam name, date, attempt ID, score when available, accuracy, average time, comparison context, match type, and **View Exam Analysis**.

## Group Effectiveness

Each Similar Issue Group can now show a separate **Intervention Outcome** roll-up:

- received
- completed
- re-tested
- improved
- resolved
- improving
- persistent
- no significant change
- partially effective (data contract)
- average accuracy change
- average time change

The roll-up is labelled **Prototype group outcome** and **Observed outcome after intervention**. Individual outcomes remain present in the group result contract; group averages do not replace individual evidence.

## Student Privacy

The student interventions endpoint now uses an explicit allow-list.

Student responses include only that student's:

- intervention ID/student ID
- target and objective
- practice configuration/progress
- linked re-test state
- status
- individual prototype effectiveness
- matching post-exam metrics when available

It excludes:

- group ID/name
- peer IDs or records
- group averages
- group evidence
- source/group membership
- faculty notes
- faculty-only reasoning

Student re-test responses also remove `studentIds` before returning the entity.

## Mock Data

- No new production mock result dataset was needed.
- Existing deterministic University, JEE, NEET students, canonical attempts, competitive question sets, and University PYQs were reused.
- Actual question availability is calculated from those datasets on every pre-flight.
- No Exam Agent result was added to shipping mock data merely to make effectiveness look successful.
- Deterministic test-only canonical attempts cover explicit/fallback matching and all five outcome labels without affecting runtime data.
- Existing datasets produced 157 same-context issue groups during verification: 28 University, 83 JEE, and 46 NEET.

## Files Created

- `tests/intelligence/phase-6-multi-student-outcomes.test.js`
- `PHASE-6-MULTI-STUDENT-OUTCOME-REPORT.md`

## Files Modified

- `src/api/mock-routes-exam-agent.js`
- `src/api/mock-routes-faculty-interventions.js`
- `src/api/mock-routes-faculty-students.js`
- `src/components/students-workspace/intervention-center.jsx`
- `src/components/students-workspace/student-issues-tabs.jsx`
- `src/intelligence/engine/exam-agent.js`
- `src/intelligence/faculty/engine/index.js`
- `src/intelligence/faculty/engine/intervention-lifecycle.js`
- `src/intelligence/faculty/index.js`
- `src/pages/student/Interventions.jsx`
- `src/services/faculty-interventions.js`

## Files Deleted

None.

## Services

Extended `src/services/faculty-interventions.js` with:

- `useSimilarIssueGroupEvidence(groupId)`
- `useGroupInterventionPreflight(groupId, practiceConfig)`
- `useCreateGroupInterventions()`

All hooks use the existing request client and React Query invalidation conventions. No duplicate service was added.

## Routes

Added mock routes:

- `GET /faculty/similar-issues/:groupId/evidence`
- `GET /faculty/similar-issues/:groupId/intervention-preflight`
- `POST /faculty/similar-issues/:groupId/interventions`

Extended existing routes/payloads:

- `GET /faculty/similar-issues`
- `GET /faculty/interventions`
- `GET /faculty/interventions/:id`
- `GET /faculty/students/:id/interventions`
- `GET /student/interventions`
- `GET /student/interventions/:id/practice`
- `POST /student/interventions/:id/practice-attempts`
- `POST /faculty/interventions/:groupId/retest`
- `GET /student/interventions/:id/retest`
- `POST /student/exam-agent/attempts`

All existing lifecycle routes remain registered.

## Tests

Final command:

```text
npm test
```

Result:

```text
Test Files  7 passed (7)
Tests       155 passed (155)
Duration    9.94s
```

New Phase 6 suite: 26 tests covering the requested 25 logic areas plus an end-to-end canonical stored-attempt/API outcome connection.

Coverage includes:

1. Multi-student selection
2. Domain/group isolation
3. Existing intervention exclusion
4. Group evidence
5. Student evidence
6. Practice availability
7. Insufficient pool handling
8. One intervention per student
9. Partial creation
10. Duplicate prevention
11. Student 360 integration
12. Practice linkage
13. Re-test linkage
14. Canonical ExamAttempt matching
15. Explicit intervention ID preference
16. Contextual fallback
17. JEE/NEET isolation
18. University isolation
19. Before/after calculation
20. Missing data
21. Individual effectiveness labels
22. Group effectiveness
23. Student privacy
24. Lifecycle regression
25. Phase 5 evidence-action regression
26. Stored canonical attempt → intervention outcome → existing Exam Analysis route

The SSR suite still emits pre-existing React `useLayoutEffect`/test-stub warnings, but all tests pass.

## Build

Final command:

```text
npm run build
```

Result: passed.

- 3,823 modules transformed.
- No broken imports, duplicate exports, route errors, or new build failures.
- Route chunks remain split, including:
  - `MyStudents`: 43.08 kB
  - `StudentProfile`: 63.58 kB
  - student `Interventions`: 15.41 kB
  - `ExamAnalysis`: 35.50 kB
- Existing large shared main chunk remains: 2,130.34 kB (541.98 kB gzip).
- Existing Vite warnings remain for statically + dynamically imported datasets and the >1,200 kB chunk threshold.

No additional code-splitting refactor was attempted because faculty/student routes are already lazy-loaded and changing the shared mock/intelligence import graph would be unrelated and regression-prone in this phase.

## Browser Verification

Browser automation was not available in this environment. No browser verification is claimed.

Completed substitutes:

- production build of every lazy route/module
- 6 Student 360 SSR render smoke tests
- mock API smoke/integration tests
- direct University/JEE/NEET group, evidence, creation, practice, re-test, outcome, privacy, and Exam Analysis route tests

Responsive interaction at 375px, 768px, and 1440px therefore remains a manual verification item.

## University/JEE/NEET Verification

Automated logic/API verification confirms:

- University evidence rows remain `domain === university` and do not match Competitive attempts.
- JEE rows/interventions require `domain === Competitive` and `examFamily === JEE`.
- NEET rows/interventions require `domain === Competitive` and `examFamily === NEET`.
- Same-named JEE and NEET Physics chapters do not match.
- Group selection accepts only IDs actually present in the selected group.
- Multi-student records were created from JEE, NEET, and University groups in tests.
- Practice availability came from the matching existing family/course pool.
- Strict contextual ExamAttempt fallback requires student + domain + family + subject + chapter + chronology.

## Regression

Verified by existing tests and production build:

### Faculty

- Dashboard: route/module build
- My Students: route/module build + service tests
- Student 360: SSR + API + domain-isolation tests
- Similar Issues: API + new group workflow logic tests
- Interventions: lifecycle/service/API tests
- Question Intelligence: route/module build; existing dataset unchanged
- PYQ Intelligence: existing route/module build; dataset unchanged
- Paper Generator: existing route/module build; no changes
- Paper Library: existing route/module build; no changes
- Targeted Practice: existing selector/lifecycle tests
- Re-test: linkage and lifecycle tests

### Student

- Dashboard: route/module build
- Exam Analysis: existing route/module build + canonical attempt analysis route test
- Exam Agent: canonical storage tests/build
- Academic DNA: existing intelligence tests/build
- Interventions: privacy/practice/re-test API tests + route/module build

### Admin

- Dashboard: route/module build
- Institution Intelligence: route/module build
- Reports: route/module build
- AI Workspace: route/module build

Phase 1 canonical domain isolation, Phase 3 service/API boundaries, Phase 4 canonical Student 360, and Phase 5 evidence-to-action tests all remain green. No removed code or duplicate lifecycle/service was reintroduced.

## Remaining Limitations

- This remains a browser-local frontend prototype; localStorage is not multi-device or multi-user durable.
- No browser automation was available, so responsive visual and full click-path verification is not claimed.
- The pre-existing >2 MB shared chunk remains. Routes are already split; deeper shared-data splitting needs a dedicated performance phase.
- Actual University option-bearing practice pools are intentionally small. Faculty may need to lower the requested count or explicitly broaden filters; the app reports the real shortfall.
- Outcome matching is deterministic association, not causal attribution.
- The first strict subsequent canonical ExamAttempt is used as the comparison endpoint; later attempts remain available in Exam Analysis but are not averaged into that intervention.
- No notifications, automatic assignment, real backend, database, or external result source exists.
- No scientifically validated effectiveness claim is made.

## Recommended Phase 7

A safe next phase would focus on **prototype governance and longitudinal validation**, not a new engine:

1. Manual responsive/browser QA for the complete University/JEE/NEET flow.
2. Accessibility testing for selection tables, dialogs, focus order, and status announcements.
3. A documented versioned contract for intervention/evidence/attempt entities before any backend discussion.
4. Dedicated shared-chunk analysis with import-graph tooling and regression budgets.
5. Faculty-facing audit/export of observed intervention timelines, retaining individual privacy and non-causal language.
6. Product/research validation of thresholds and labels before any claim of intervention effectiveness.
