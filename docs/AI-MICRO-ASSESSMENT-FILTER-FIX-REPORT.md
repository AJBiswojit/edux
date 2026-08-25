# AI Micro-Assessment Studio Source Library Filter Fix Report

## Problem

The Source Library filters used the API's final item list but exposed mostly global filter options. Subject, chapter and topic were not a true dependency chain, Topic was missing from the filter row, downstream selections could remain stale after a parent change, and the source count waited for the mock request before reflecting the new selection.

The existing Select component did render selected labels in simple cases, but it relied on a fragile child lookup and its dropdown flip calculation modified an absolute menu using viewport coordinates. That could leave a menu clipped or positioned inconveniently near the bottom or right edge.

## Root Cause

- Filter state was updated as independent key/value changes rather than passing through a cascading validity step.
- The API response supplied global options instead of current context options.
- The Source Library did not filter by Topic or search source content.
- Filter controls had no common active-state treatment, active summary or individual search clear affordance.
- The shared Select menu was absolutely positioned inside its trigger container and had no opt-in fixed collision mode.
- The selected label lookup assumed `children` was an array with a `.find` method.

## Filter Architecture

The filter flow is now:

```text
SourceLibrary UI
  → source-library-filters.js (pure cascade, sanitisation and local matching)
  → useMicroAssessmentSources (service hook)
  → /faculty/micro-assessments/sources (API)
  → microAssessmentSources (existing dataset, read-only)
```

The API continues to return the final filtered `items` and now returns a read-only `filterCatalog` through the existing service boundary. The Source Library uses that catalog for immediate count/list updates and derives its filter options without importing the dataset directly. The API also returns context-aware `filters` for consumers that use the response options.

No source record, question record, question-generation function or official intelligence dataset was changed.

## Cascading Logic

The hierarchy is:

```text
Domain
  ↓
Exam Family
  ↓
Subject
  ↓
Chapter
  ↓
Topic
```

- Domain options are derived from the catalog with Search and Source Type as independent constraints.
- Exam Family appears only for Competitive and exposes only families in that context.
- Subject options use the selected Domain and Exam Family.
- Chapter options use Domain, Exam Family and Subject.
- Topic remains disabled until Chapter is selected and then uses the full context.
- Source Type is independent and is derived without constraining itself.
- Search is case-insensitive and checks title, subject, chapter, topic, source type, exam family and content.
- Final matching uses every selected filter and drives the matching-source count.

## Selected Value Behavior

- Filter triggers use meaningful defaults: All domains, All competitive exams, All subjects, All chapters, All topics and All source types.
- The shared Select now resolves its selected label with `React.Children.toArray`, so the current value remains visible in the trigger.
- Active filter triggers receive a compact EduX indigo active treatment.
- Each dropdown includes its All option as the clear action.
- Search has an explicit clear button.
- The Source Library shows a lightweight active-filter summary and Clear all filters action.
- If Search or Source Type creates a deliberate no-match state, a valid hierarchy selection is not silently cleared.

## Dropdown Positioning

The existing EduX Select component was retained and extended with an opt-in `collision` mode used by Source Library filters.

Collision mode:

- Measures the trigger and menu in viewport coordinates.
- Uses a fixed menu so parent cards/containers do not clip it.
- Chooses downward or upward placement based on available space.
- Constrains width to the viewport and keeps a minimum usable width.
- Constrains height to the available side of the viewport and gives the option list its own scroll area.
- Repositions on resize and scrolling.
- Keeps the existing outside-click and Escape handling.

Non-collision Select consumers retain the existing absolute-menu behavior to minimize regression risk outside this filter fix.

## Responsive Behavior

The filter row now uses a responsive two-row layout:

- Row 1: Search, Domain, and Competitive-only Exam Family.
- Row 2: Subject, Chapter, Topic, and Source Type.
- Search spans the wider row space on large screens and becomes full-width when controls wrap.
- Filter controls use grid columns that collapse at smaller widths rather than becoming fixed narrow controls.
- Fixed collision menus cap their width at viewport padding, truncate long trigger labels safely and keep long option names inside a scrollable menu.
- Source cards continue to use the existing responsive card grid.

The implementation targets the existing EduX breakpoints for 375px, 768px, 1024px, 1440px and larger screens without adding a new layout system.

## Accessibility

- Filter labels are visible above each control.
- Search has a real label and an accessible clear button.
- Select triggers expose `aria-expanded`, `aria-haspopup`, `aria-controls` and a label containing the current value.
- Select options retain `role="option"` and `aria-selected`.
- Existing Enter/Space opening, Arrow navigation, Escape close, outside-click close and visible focus styles are preserved.
- Topic exposes the helper text “Select a chapter first” while disabled.
- Active state is communicated with border/background treatment plus the selected text, not color alone.
- No filter requires mouse-only interaction.

## Tests

Updated `tests/intelligence/micro-assessment-studio.test.js` with filter behavior coverage for:

1. Domain filtering
2. Exam Family filtering
3. Subject filtering
4. Chapter filtering
5. Topic filtering
6. Source Type filtering
7. Search over content
8. Combined filters
9. Cascading option derivation
10. Invalid downstream reset after Exam Family change
11. Invalid downstream reset after Subject change
12. Invalid downstream reset after Chapter change
13. Independent Search/Source Type behavior
14. Clear-all normalization
15. Active-filter summary derivation
16. Correct no-match count
17. University isolation
18. JEE isolation
19. NEET isolation
20. Selected trigger value rendering
21. Source participant context consistency
22. Existing micro-assessment route/API regression coverage

## Build

- `npm test` — passed.
- `npm run build` — passed.
- The build continues to report the repository's existing large-chunk and dynamic-import warnings; no new dependency was added.

## Browser Verification

Browser automation was not available in this environment. No automated viewport or browser interaction results are claimed.

The implementation was validated through the production build, pure filter tests, API tests and an SSR selected-value smoke assertion. The live Vite preview can be used for manual checks at the requested viewport sizes.

## Files Modified

- `src/api/faculty/micro-assessments.js`
  - Added read-only filter catalog response.
  - Added current cascading API filter options.
- `src/components/micro-assessment-studio/source-library.jsx`
  - Added Topic filter, connected filter controls, active summary, clear actions, immediate local matching and selected-source consistency callback.
  - Improved responsive filter layout and no-match state.
- `src/components/micro-assessment-studio/source-library-filters.js`
  - Added pure cascading option derivation, invalid-downstream sanitisation, active-filter summary and final matching helpers.
- `src/components/ui/select.jsx`
  - Hardened selected-label resolution and accessibility attributes.
  - Added opt-in fixed collision positioning for Source Library filters.
- `src/intelligence/faculty/engine/micro-assessments.js`
  - Added Topic filtering, content search and All-placeholder normalization only in the existing Source Library filter path.
- `src/pages/faculty/MicroAssessmentStudio.jsx`
  - Added Topic filter state, immediate selected-source clearing callback and source-filter integration.
- `src/services/micro-assessments.js`
  - Retained previous source data while a filter request settles to avoid filter-row skeleton flashes.
- `tests/intelligence/micro-assessment-studio.test.js`
  - Added connected filter, reset, count, isolation and selected-value coverage.
- `docs/AI-MICRO-ASSESSMENT-FILTER-FIX-REPORT.md`
  - Added this report.

## Regression Status

Existing Question Intelligence, AI Question Studio, Student 360, Academic DNA, Similar Issues, Interventions, Exam Agent, Exam Analysis, Paper Generator and Paper Library code paths were not redesigned or reclassified. The full existing test suite remained green after the filter changes.

Official ExamAttempt storage, intervention lifecycle rules, source records and question-generation logic were not changed.

## Known Limitations

- Browser automation was unavailable, so viewport interaction should receive a manual follow-up in a real browser.
- The prototype API returns a read-only full source catalog to make counts and filter options responsive while mock API requests settle; it does not mutate or duplicate dataset records in storage.
- The shared Select collision mode is opt-in for Source Library filters; other Select consumers retain their pre-existing positioning path.
- This remains frontend/prototype functionality with no backend integration.
