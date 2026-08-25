# AI Micro-Assessment UI Fix Report

## Initial Problems

Generated question cards leaked internal wording such as `Source check 5:` into the visible stem. Answers and explanations rendered immediately on every card. The assessment-size control needed to follow the canonical EduX dropdown contract (selected label, portal positioning, no silent default generation from an empty choice).

## Root Causes

- `stableVariants()` in `src/intelligence/faculty/engine/micro-assessments.js` prefixed extension stems with `Source check ${variantNumber}:` so the 15/20-question pool could be distinguished. That string was student-facing `question` text, not metadata.
- `QuestionCard` always printed `Answer` and `Why` in the same block and highlighted the keyed MCQ option.
- Size selection already used `<Select>`, but it defaulted to `10` so an unselected “Select size” state was never represented, and generate could run without an explicit faculty choice.

## Question Presentation Changes

- Extension stems now keep the original question plus a transfer sentence. No `Source check N`, generation/validation/AI/internal/prototype/debug prefixes.
- Cards show `Q{n}` from review index, type, and difficulty, then the stem and unhighlighted options.
- Hierarchy: question → type/difficulty → answer reveal → academic metadata → secondary validation → edit actions.

## Source Metadata Separation

- `sourceId`, `sourceTitle`, `sourceReference`, `chapter`, `topic`, and `concept` remain on generated questions.
- Variant identity lives on `generationMetadata` (`kind: source-pool-extension`, `variantNumber`).
- Faculty still see Source / Chapter / Topic / Concept. Internal check numbers are not shown.

## Answer Reveal UX

- Each card starts collapsed with **Show answer** (`aria-expanded="false"`, `aria-controls`).
- Reveal expands Answer and, when present, Why. The control becomes **Hide answer**.
- State is local to the card. Revealing Q2 does not affect Q1.
- Explanations are never fabricated.

## Question-Type Handling

`formatFacultyAnswer()`:

- MCQ / optioned items → `B. Mitochondria`
- Fill in the Blank → authored token
- Statement Based / Match the Following / short answers → authored string

## Assessment Size Dropdown

- Canonical `Select` + `SelectItem` (search, portal, collision, group-aware close).
- Options: 5, 10, 15, 20 questions.
- Placeholder: **Select size**. After choice: **20 questions**.
- Generate is disabled until a size is selected. The selected value is `Number(generationCount)` in the generate payload.

## Dropdown Positioning

Unchanged project primitive: `useAnchoredDropdown` + `computeDropdownPosition`, portaled to `document.body` or `data-portal-scope`. No one-off z-index.

## Responsive Behavior

Cards use wrapping flex/grid, `break-words` on stems/answers/metadata, and stacked fields at mobile widths. No new horizontal-scroll layout.

## Tests

Added/extended:

- no `Source check` in generated stems; source metadata retained
- answer formatters for MCQ, fill-in, statement, match
- size trigger shows selected label
- 5/10/15/20 counts (existing)
- card: hidden answer, show/hide, independent reveal, no invented Why

## Build

`npm test` — 16 files, 268 tests passed.

`npm run build` — Vite production build succeeded.

## Browser Verification

Browser automation was not available in this environment. Manual checks remain: Faculty → AI Micro-Assessment → select size (including near viewport bottom) → generate → confirm stems, per-card reveal, and mobile wrap.

## Files Changed

- `src/intelligence/faculty/engine/micro-assessments.js`
- `src/components/micro-assessment-studio/question-presentation.js` (new)
- `src/components/micro-assessment-studio/question-review.jsx`
- `src/pages/faculty/MicroAssessmentStudio.jsx`
- `tests/intelligence/micro-assessment-studio.test.js`
- `tests/intelligence/micro-assessment-question-card.test.jsx` (new)
- `docs/AI-MICRO-ASSESSMENT-STUDIO.md`
- `docs/AI-MICRO-ASSESSMENT-UI-FIX-REPORT.md`

## Remaining Manual Checks

- Open the size menu near the bottom of a real viewport and confirm upward flip.
- Walk 375 / 768 / 1024 / 1440 / 1920 widths with a generated set.
- Spot-check each question type after generate on a curated source.
