# Dropdown & Filter Interaction System — Implementation Report

Phase report for the project-wide dropdown & cascading-filter system in
`AJBiswojit/edux` (branch `arena/01a03a21-edux`).

Companion document: `docs/DROPDOWN-FILTER-SYSTEM.md` (the system spec).

**Result:** one canonical selection primitive, one canonical action-menu
primitive, one shared viewport-aware portal/positioning architecture behind
both, one feature-declared cascade engine, all six real cascading-filter
surfaces migrated, 75 new tests (262 total, all passing), production build
green, zero backend/API changes, zero visual redesign.

---

## 1. Initial audit

Findings that defined the scope:

1. **The canonical primitive already existed** — `src/components/ui/select.jsx`
   (shadcn-style, search-in-menu, ~50 call sites) — but it shipped **two
   positioning modes**: a default `absolute mt-2 w-full` (clipping-prone, no
   flip) and an opt-in `collision` fixed-position mode used by exactly ONE
   call site (`micro-assessment-studio/source-library.jsx`). ~99% of menus
   had no viewport awareness.
2. **No shared positioning layer.** The only viewport-aware math lived inside
   that private select mode; `dropdown-menu.jsx` (topbar profile menu) was
   `absolute` with no flip and no portal.
3. **Cascading logic was hand-rolled in six features** with three different
   invalidation styles: a pure engine in `source-library-filters.js`, inline
   reset handlers in PYQ/Exam Analysis/CQB, a URL-prefill + hand-reset mix in
   Paper Generator, and a stale-value bug in Question Studio (switching
   source never reset topic/concept).
4. **No stacking strategy for menus inside overlays.** Select was z-70;
   dialog/sheet z-100 — a select opened inside a dialog would render behind
   its own modal. The existing hierarchy (topbar 30 / ai-copilot 80-85 /
   tooltip 90 / dialog 100 / command 110 / toast 200) was otherwise
   consistent; there were no rogue `z-999999` values.
5. **17 native `<select>` files** (admin CRUD dialogs, contact form, forum)
   are single-value form fields — intentional, kept. The landing navbar
   MegaMenu is landing-only custom nav — kept.

## 2. Dropdown inventory

Classification: **A** migrated (primitive upgrade), **B** migrated
(feature cascade), **K** kept (different category), **D** deprecated
(kept for compatibility).

| # | Component | Location | Type | Custom/Native | Used by | Positioning (before → after) | Dependency | Risk |
|---|---|---|---|---|---|---|---|---|
| A | `Select`/`SelectItem` | `src/components/ui/select.jsx` | Selection dropdown | Custom | ~50 files | `absolute mt-2` (no flip) or opt-in `collision` → portal + fixed viewport math | None (state is feature-side) | High: clipping, stacking, no flip → **resolved** |
| A | `DropdownMenu*` | `src/components/ui/dropdown-menu.jsx` | Action menu | Custom | Topbar profile menu | `absolute`, no flip → same portal + fixed architecture | None | Medium: clipping inside navbar → **resolved** |
| B | Source Library filters | `src/components/micro-assessment-studio/source-library.jsx` + `source-library-filters.js` | Cascading filter | Custom (Select) | Micro-Assessment Studio | Select | domain → examFamily → subject → chapter → topic (strict) | Medium: engine duplicated, UI-internal → **migrated to shared engine** |
| B | PYQ Analysis filters | `src/pages/faculty/PYQAnalysis.jsx` + `pyq-filter-cascade.js` | Cascading filter | Custom (Select) | Faculty · Question Intelligence | Select | subject → chapter → topic (strict); program/year **independent** (no data edge) | Medium: inline resets → **migrated** |
| B | Exam Analysis filters | `src/pages/student/ExamAnalysis.jsx` + `exam-analysis-filters.js` | Cascading filter + context chips | Custom (Select + chips) | Student · AI Exam Analysis | Select | context → family → examId → subject (strict) | High: hand-rolled resets, subject-name regex → **migrated**, family now from exam metadata |
| B | Paper Generator scope | `src/components/assessment-workspace/paper-generator-tab.jsx` + `paper-generator-cascade.js` | Cascading filter + URL prefill | Custom (Select) | Assessment Workspace | Select | course → subject → chapter → topic (non-strict, "All …" sentinels) | High: URL prefill + async datasets → **migrated** (prefill moved to state initializers) |
| B | Competitive Question Browser | `src/components/assessment-workspace/competitive-question-browser.jsx` + `competitive-browser-cascade.js` | Cascading filter | Custom (Select) | Assessment Workspace | Select | exam → subject → chapter → topic (strict, "All" sentinel) | Medium → **migrated** |
| B | Question Studio scope | `src/components/question-studio/studio-workflow.jsx` + `studio-cascade.js` | Cascading filter | Custom (Select) | AI Question Studio | Select | topic → concept (strict) | Medium: **stale-value bug fixed** (source switch now resets downstream) |
| K | Native `<select>` (17 files) | `admin/*` (7), `faculty/Announcements`, `faculty/QuizBuilder`, `landing/Contact`, `student/Forum`, `student/Support`, `students-workspace/*` (3), `admin-ai/history-panel` | Native form select | Native | CRUD dialogs / forms | Native | None (independent fields) | Low — **kept** |
| K | Landing MegaMenu | `src/components/landing/navbar.jsx` | Nav mega menu | Custom | Landing only | Own (absolute, self-managed) | None | Low — **kept** (landing-only; own mousedown-outside-cleanup is scoped and removed on close) |
| K | Command palette | `src/components/ui/command.jsx` | Global palette | Custom | Global (⌘K / search) | Portal + fixed (pre-existing, z-110) | None | Low — **kept**; gained `data-portal-scope` |
| K | Dialog / Sheet | `src/components/ui/dialog.jsx`, `sheet.jsx` | Overlay | Custom | App-wide | Portal + fixed (pre-existing, z-100) | None | Low — **kept**; gained `data-portal-scope` |
| K | Calendar | `src/components/ui/calendar.jsx` | Date picker | Custom | Date inputs | Own | None | Out of scope — **kept** |
| D | `Select collision` prop | `src/components/ui/select.jsx` | Prop | — | 0 call sites after migration | — | — | Deprecated **no-op** kept for API compatibility |

## 3. Root causes

Pre-existing root causes:

1. **Two positioning modes in one primitive** — the default mode was
   `absolute mt-2 w-full` (clipped by any `overflow-hidden`/`transform`/
   `filter` ancestor, never flipped) while the only viewport-aware mode was
   opt-in and used once.
2. **No shared positioning/portal layer** — viewport math, portal targeting,
   scroll/resize repositioning and outside-click logic had no home; every
   surface reinvented (or skipped) them.
3. **Per-feature cascading logic with no single invalidation rule** — three
   styles of hand-rolled parent→child reset, one subject-name regex
   (`examFamilyOf` in Exam Analysis) instead of exam-metadata derivation,
   and a stale-value bug in Question Studio.
4. **No overlay stacking strategy for menus** — a menu inside a dialog had
   no scope in which its z-index could win, pushing toward ad-hoc z bumps.
5. **No keyboard/a11y contract** — trigger open keys, option navigation,
   Escape focus return, listbox/menu semantics were inconsistent.

Bugs found and fixed **during** this implementation:

1. **`createPortal` as a direct child of `AnimatePresence` silently drops the
   menu** — the portal object is not a React element, so presence tracking
   never kept it: the menu never appeared (`aria-expanded: true`, container
   resolved, no listbox in DOM). Fixed with a `menuMounted` state: the portal
   stays mounted through the exit animation and `AnimatePresence` lives
   *inside* the portal with `onExitComplete` unmounting it. Applied to
   `select.jsx`; the identical latent pattern in `dropdown-menu.jsx` was
   fixed in this phase.
2. **`cascadeOrder` validated undeclared parents** — context chips (e.g.
   `context`) named in a child's parent list were pushed into the validation
   order and got cleared like state. Fixed: undeclared parents are walked for
   cycle detection only; only declared keys are cascade state.
3. **Explicit descendant clearing over-cleared** — clearing `examFamily`
   under a University context also cleared a still-valid University subject.
   Fixed: no explicit descendant clearing; the same topological pass
   re-validates each descendant against the *updated* parents (kept if still
   valid, cleared if not — transitively, precisely).
4. **Keep-on-empty (non-strict) gap** — a cleared parent produced an empty
   child option list, and a stale child value was silently kept. Resolved by
   explicit per-feature mode: **strict** for source-library, PYQ,
   exam-analysis, competitive browser and question studio; **non-strict** for
   paper-generator only (protects URL-prefilled values while its async
   `cfg`/question datasets are still empty on first render).

## 4. Canonical dropdown architecture

- **`useAnchoredDropdown`** (`src/hooks/use-anchored-dropdown.js`) — the ONE
  lifecycle for every anchored menu (Select + DropdownMenu):
  - resolves the portal container on open (body / nearest `data-portal-scope`);
  - measures trigger rect + menu `scrollHeight`, applies
    `computeDropdownPosition` as `position: fixed` styles; re-measures after
    a 60ms content-settle;
  - `resize` + capture-`scroll` repositioning, rAF-throttled; closes
    (`reason: 'scroll-out'`) when the trigger is fully out of the viewport;
  - capture-`pointerdown` outside-click (trigger + menu contents are safe
    targets) — `reason: 'outside'`;
  - capture-`keydown` Escape with `stopPropagation` (dropdown-in-dialog closes
    the dropdown, not the dialog), focus returns to the trigger —
    `reason: 'escape'`;
  - filter-group mutual exclusion via a module registry — opening a sibling in
    the same `group` closes the previous one (`reason: 'group'`);
  - **all document/window listeners exist only while open** and are removed on
    close and on unmount — no permanent global listeners per instance.
- **`Select`** — rewritten around the hook: controlled/uncontrolled,
  centralized search filtering (options no longer self-filter), clear control
  (`span[role="button"]` with `stopPropagation`), loading state
  (disabled + `aria-busy` + in-menu "Loading options…"), distinct empty
  states ("No options" / "No matching options"), the selected-value contract
  (§1 of the spec), `group` prop, full keyboard contract. The deprecated
  `collision` prop remains as a no-op; `SelectTrigger/SelectContent/
  SelectValue` passthroughs are kept for call-site compatibility.
- **`DropdownMenu`** — rewritten on the same hook: `role="menu"` /
  `role="menuitem"`, ArrowUp/Down/Home/End item navigation, content click
  closes (action-menu parity), `group` prop.

## 5. Positioning architecture

`computeDropdownPosition({ trigger, menuHeight, viewport, align, safeMargin = 8, gap = 8, minWidth = 192 })`
returns `{ placement: 'down'|'up', left, width, maxHeight, top|null, bottom|null }`:

- `width = clamp(max(triggerWidth, 192), 8, viewportWidth − 16)`
- `spaceBelow = max(0, vh − trigger.bottom − 8)`, `spaceAbove = max(0, trigger.top − 8)`
- placement: down if `menuHeight ≤ spaceBelow`; else up if `menuHeight ≤ spaceAbove`; else the roomier side (tie → up)
- `maxHeight = max(1, available space on the chosen side)`
- down: `top = trigger.bottom + 8`, bottom auto · up: `bottom = vh − trigger.top + 8`, top auto
- `left` clamped to `[8, vw − width − 8]` (`align: 'end'` anchors the right edge first)

No `top: 100%` anywhere in the codebase (grep-verified). Applied as fixed
styles on the portaled menu; `visibility: hidden` until the first measurement.

## 6. Collision detection and containment

- **Vertical**: down → up → roomier-side flip (above), with the 8px safe
  margin on every side.
- **Horizontal**: width clamp (≥192px, ≤ viewport − 16px) + left clamp
  (8px margins). Verified in tests at the right edge (1024px viewport) and
  the 375px mobile viewport.
- **Height**: `maxHeight` bounded by available space → long option lists
  scroll internally (`overflow-y-auto` on the list container); the page never
  scrolls. Degenerate viewports floor `maxHeight` at 1 (containment wins over
  the comfort floor).

## 7. Portal strategy

- Default target: `document.body` (overflow/transform/filter/stacking
  contexts can never clip the menu).
- `data-portal-scope` target: set on the fixed overlay wrappers of
  `DialogContent` (z-100), `SheetContent` (z-100) and the command palette
  (z-110). `resolveDropdownContainer(anchorEl)` walks up from the trigger and
  returns the nearest scope ancestor, else `document.body`.
- Trigger-relative coordinates are computed before portal insertion — the
  portal changes the containing block, not the anchor.
- Portal element stays mounted through the exit animation (see Root Cause 1);
  unmount happens on `AnimatePresence`'s `onExitComplete`.

## 8. Z-index strategy

Single source of truth: `src/constants/ui/z-index.js`.

| Token | Value | Layer |
|---|---|---|
| `base` | 0 | ordinary content |
| `raised` | 10 | local card elevation |
| `sticky` | 30 | sticky topbar / sidebars |
| `menu` | 70 | select popovers, dropdown menus (both primitives read `Z_INDEX.menu`) |
| `aiCopilot` | 80 | floating AI panels (80/85 in use) |
| `tooltip` | 90 | tooltips |
| `dialog` | 100 | modals, sheets — **portal scopes for nested menus** |
| `command` | 110 | command palette |
| `toast` | 200 | toasts — always on top |

Menus opened inside a dialog/sheet keep `menu` (70) but are portaled *into*
the overlay's scope, so they stack above the dialog content inside the
overlay's own stacking context — no global z-index bump, no blanket
`z-999999` anywhere (grep-verified). The one custom overlay
(`PYQAnalysis` upload dialog, z-100) sits exactly on the `dialog` layer.

## 9. Filter dependency architecture

Engine: `src/utils/filter-cascade.js` (pure) + `src/hooks/use-filter-cascade.js`
(React). Feature declarations (verbatim from their modules):

**Source Library** (`micro-assessment-studio/source-library-filters.js`) — strict; `purpose === 'sanitize'` neutralizes the independent `search`/`sourceType` keys:

```js
SOURCE_FILTER_DEPENDENCIES = {
  domain: [],
  examFamily: ['domain'],
  subject: ['domain', 'examFamily'],
  chapter: ['domain', 'examFamily', 'subject'],
  topic: ['domain', 'examFamily', 'subject', 'chapter'],
}
```

**PYQ Analysis** (`src/pages/faculty/pyq-filter-cascade.js`) — strict; `program`/`yearRange` stay independent local state (the dataset declares no program→subject edge):

```js
PYQ_FILTER_DEPENDENCIES = {
  subject: [],
  chapter: ['subject'],
  topic: ['subject', 'chapter'],
}
```

**Exam Analysis** (`src/pages/student/exam-analysis-filters.js`) — strict; `context` is an *undeclared* parent (chip state, drives derivation, never validated); family from exam metadata, never subject names:

```js
EXAM_ANALYSIS_DEPENDENCIES = {
  family: ['context'],
  examId: ['context', 'family'],
  subject: ['context', 'family', 'examId'],
}
```

**Paper Generator** (`assessment-workspace/paper-generator-cascade.js`) — non-strict (async datasets), "All …" sentinels; mode/exam are context switches that change the derivation closure (re-sanitize, keep still-valid selections):

```js
PAPER_GENERATOR_DEPENDENCIES = {
  course: [],
  subject: ['course'],
  chapter: ['subject'],
  topic: ['chapter'],
}
```

**Competitive Question Browser** (`assessment-workspace/competitive-browser-cascade.js`) — strict, "All" sentinel; year/difficulty/type/query independent:

```js
COMPETITIVE_BROWSER_DEPENDENCIES = {
  exam: [],
  subject: ['exam'],
  chapter: ['exam', 'subject'],
  topic: ['exam', 'subject', 'chapter'],
}
```

**Question Studio** (`question-studio/studio-cascade.js`) — strict, per-source isolation; source switch resets topic+concept in the workflow:

```js
STUDIO_CASCADE_DEPENDENCIES = {
  topic: [],
  concept: ['topic'],
}
```

Semantics: `sanitize(values)` = parent-first topological validation (invalid
child → its `emptyValues` sentinel/''; descendants re-validated against the
updated parents in the same pass); `options(values)` = per-key option lists
via `deriveOptions(key, values, 'display')`; `useFilterCascade` re-sanitizes
when `deriveOptions` identity changes and keeps values while option lists are
empty in non-strict mode; `apply(patch)` returns sanitized values
synchronously; `reset()` clears declared keys to empties; cycles throw at
config time.

## 10. Domain isolation rules (as implemented)

- **University ↔ Competitive** (Exam Analysis, Paper Generator): exam options
  derived by `category`/mode — lists never mix.
- **JEE ↔ NEET**: `examFamilyOf` reads the exam's canonical
  `pattern/shortName/name` metadata (NEET/JEE/Biology heuristics on the
  *exam*, never on subject names); question pools scoped to `NEET UG` /
  `JEE Main`. A subject present under both (Physics) is kept across the
  switch; a subject present under only one is cleared.
- **Source Library**: each level derived from the selected parents' subtree
  of the catalog.
- **Question Studio**: topics/concepts derived from the analyzed source
  object itself — per-source, per-domain isolation by construction.
- No option list is hardcoded in UI; all derive from the canonical datasets
  (`pyqFilters`, `microAssessmentSources`, `examAnalysisOptions`, question
  banks).

## 11. Components migrated

1. **`select.jsx`** — full rewrite onto the shared architecture (portal,
   positioning, keyboard, a11y, selected-value contract, group, loading,
   clear, search); deprecated `collision` prop kept as no-op.
2. **`dropdown-menu.jsx`** — full rewrite onto the same architecture (same
   portal fix as select).
3. **`dialog.jsx` / `sheet.jsx` / `command.jsx`** — `data-portal-scope`
   added to their fixed overlay wrappers (nested menus now render inside the
   overlay's stacking context).
4. **Source Library** — `source-library-filters.js` rewired onto the shared
   engine (`sanitizeSourceFilters` = normalize → `sanitizeCascadeValues`);
   all 22 pre-existing tests pass unchanged; `FilterSelect` uses
   `group="source-library"`.
5. **PYQ Analysis** — `useFilterCascade(buildPyqFilterCascade(filtersData))`
   for subject/chapter/topic; `program`/`yearRange` kept as independent local
   state; 5 workflow Selects get `group="pyq-filters"`.
6. **Exam Analysis** — all hooks before early returns; `buildExamAnalysisCascade`
   + `initialValues { context: 'University', family: 'All', examId: '', subject: '' }`;
   hand-rolled resets and the subject-name regex removed (imported from the
   feature module); Selects get `group="exam-analysis"`.
7. **Paper Generator** — URL prefill moved from a mount effect into **state
   initializers** (mode, title, exam, marks, duration, questionCount,
   difficulty; subject/chapter/topic via cascade `initialValues`);
   `buildPaperGeneratorCascade({ mode, exam, cfg, bankQuestions, compQuestions })`
   memoized; mode chips keep `resetFilters()`; exam chips no longer
   force-reset (engine keeps still-valid selections); Selects get
   `group="paper-generator"`.
8. **Competitive Question Browser** — `useFilterCascade` for
   exam/subject/chapter/topic with `initialValues` from props; independent
   year/difficulty/type/query state kept; Selects get
   `group="competitive-browser"`.
9. **Question Studio** — `createFilterCascade(buildStudioCascade(source))`
   memoized; source change now resets topic/concept (stale-value bug fix);
   Selects sanitize via `cascade.sanitize` + `group="question-studio"`.

## 12. Components intentionally kept

- **17 native `<select>` files** — single-value form fields in CRUD dialogs
  (admin Batches/Faculty/Programs/Subjects/Scholarships/QuestionBank/
  AcademicCalendar/ApiConfig, faculty Announcements/QuizBuilder, landing
  Contact, student Forum/Support, students-workspace
  intervention-center/student-intelligence-tabs/student-issues-tabs,
  admin-ai history-panel). Native semantics are intentional; no cascade, no
  migration benefit.
- **Landing MegaMenu** (`landing/navbar.jsx`) — landing-only custom nav with
  its own scoped outside-click cleanup; different component category.
- **Command palette, calendar, dialog, sheet, toast, tooltip** — different
  categories; only dialog/sheet/command received the portal-scope attribute.
- **`SelectTrigger/SelectContent/SelectValue`** passthroughs — API
  compatibility for existing call sites.
- **`collision` prop** — deprecated no-op (zero call sites after migration).

## 13. Tests

**Baseline (before changes):** 9 files / 187 tests, all passing.
**After:** **15 files / 262 tests, all passing** — no existing assertion
weakened; all 22 pre-existing micro-assessment tests pass against the
rewired engine.

New files (75 tests):

| File | Tests | Covers |
|---|---|---|
| `tests/utils/dropdown-position.test.js` | 10 | placement down/up/roomier-side, maxHeight bounds, horizontal clamp right/left, 192px min width, 375px mobile clamp, trigger visibility |
| `tests/utils/filter-cascade.test.js` | 11 | cascade order, circular-dependency throw, invalid child reset (direct + transitive), domain isolation, JEE/NEET isolation, independent keys untouched, per-key sentinels, strict vs non-strict, purpose branches |
| `tests/filters/cascading-filters.test.js` | 18 | all six feature cascades against the **real datasets** (source catalog, `pyqFilters`, exam options), dependent recalculation, invalid-child reset, clear-all, URL-prefill validation, University/JEE/NEET isolation |
| `tests/components/select.test.jsx` | 18 | selected-value display, stale-value display, placeholder, clear, disabled, loading, keyboard nav (Arrow/Home/End/Enter), disabled-option skip, search filtering, empty states, outside click (trigger/menu safe), group mutual exclusion, different groups both open, portal to body + `data-portal-scope`, listbox semantics |
| `tests/components/select-positioning.test.jsx` | 9 | open down (8px gap), open up, roomier-side + constrained maxHeight, long-list containment, right-edge horizontal clamp, 375px clamp, min width, scroll-out close, resize reposition |
| `tests/components/dropdown-menu.test.jsx` | 9 | open/close, outside click, Escape + focus return, item-click close, group exclusion, portal body/scope, menu/menuitem semantics, keyboard item navigation |

Shared DOM helper: `tests/setup/dom.js` (plain `react-dom/client` + React
`act` — no new dependency beyond jsdom). DOM tests opt in per-file via
`// @vitest-environment jsdom`; the default environment (node) is unchanged
for all pre-existing tests.

Coverage of the 18 required test areas: selected value ✓, placeholder ✓,
clear ✓, disabled ✓, keyboard navigation ✓, Escape ✓, outside click ✓, open
down ✓, open up ✓, viewport collision ✓, horizontal collision ✓, max height
✓, dependent recalculation ✓, invalid child reset ✓, clear all ✓, URL state
✓ (paper generator), University/JEE/NEET isolation ✓, multiple-dropdown
behaviour ✓ (group exclusion + different groups).

## 14. Build

- `npm test` — **15 files / 262 tests passing** (0 failures, 0 skipped).
- `npm run build` (Vite 5 production build) — **exit 0**. The
  >1200 kB chunk warning is pre-existing (charts/index chunks) and unrelated
  to this phase; no new chunking regressions.
- No new runtime dependencies. One devDependency added: `jsdom@30.0.1`
  (vitest 2's DOM environment; neither jsdom nor happy-dom existed before) —
  `package.json` + `package-lock.json` updated.

## 15. Browser verification

**Honest status: manual verification is pending.** This development sandbox
has **no browser automation available** (no Playwright/Puppeteer or similar),
so the required visual/interaction pass at **375 / 768 / 1024 / 1440 / 1920**
could not be executed here and must not be claimed as done. What IS verified
automatically instead:

- placement math at 375/768/1024/1440/1920-equivalent viewports (unit + DOM
  tests, including right-edge and top-edge collision);
- portal DOM placement (body vs `data-portal-scope`), fixed-position styles
  (`top`/`bottom`/`left`/`width`/`maxHeight`), scroll-out close, resize
  reposition, outside click, Escape focus return, group exclusion, keyboard
  navigation, search, empty/loading states;
- all six feature cascades against their real datasets;
- full production build.

Manual checklist for the first human with a browser (per breakpoint
375/768/1024/1440/1920): (1) open every Select in Source Library, PYQ, Exam
Analysis, Paper Generator, CQB and Question Studio near the bottom/right
edges of the viewport — menu flips up/left and never leaves the viewport;
(2) scroll the page with a menu open — it re-anchors and closes only when
the trigger is fully out of view; (3) resize the window with a menu open —
it repositions, page does not scroll; (4) open a select inside a dialog
(e.g. any admin CRUD with a select) — menu renders above the dialog, not
behind it; (5) Escape inside a dialog closes the dropdown first; (6) arrow
keys + Home/End + Enter navigate with visible focus; (7) switching
University/Competitive and JEE/NEET — no cross-domain options, still-valid
subjects kept, invalid ones cleared.

## 16. Performance

- Document/window listeners (`pointerdown`, `keydown`, `scroll`, `resize`)
  are attached **only while a dropdown is open** and removed on close and on
  unmount — no permanent global listeners per instance.
- Scroll/resize repositioning is **rAF-throttled** (one re-measure per
  frame); an initial 60ms content-settle re-measure handles late layout.
- Menu height measured once from `scrollHeight`; `maxHeight` applied as CSS
  (internal scroll) — no layout thrash loops.
- The cascade engine is pure and allocation-light: one topological order per
  config (`useMemo`-cached per feature), O(keys × options) sanitize.
- No positioning library, no state-management library, no new runtime
  dependencies.

## 17. Accessibility

- `aria-expanded` / `aria-haspopup="listbox"|"menu"` / `aria-controls` on
  triggers; `role="listbox"` / `role="option"` / `role="menu"` /
  `role="menuitem"` with `aria-selected` in menus.
- Trigger `aria-label` announces the current value ("Subject: Physics");
  `aria-busy` while loading; native `disabled` on triggers and options.
- Escape returns focus to the trigger; selection returns focus to the trigger;
  focus moves to the search field (or first option) on open; disabled options
  are skipped by keyboard navigation; visible focus styling throughout.
- Escape in capture phase with `stopPropagation` — dropdowns inside dialogs
  dismiss before the dialog (nested-overlay contract).
- The search field is a real labelled input (screen-reader searchable);
  non-text labels use `searchText`.

## 18. Known limitations

- **No browser automation in the dev sandbox** — visual QA at the five
  breakpoints is a manual checklist (§15).
- **Escape ordering in nested overlays** is fixed (innermost dropdown first)
  and not configurable.
- **Non-strict (keep-on-empty) mode** keeps values while option lists are
  empty — correct for async loading (paper-generator only); features with a
  genuinely-possible empty parent list must declare strict.
- **Exit animation**: menu element stays mounted ~140ms while fading out;
  fast reopens restart the animation; close assertions wait for it.
- **Non-text option labels** need `searchText` for search.
- **Paper Generator behaviour change**: exam/mode chip switches keep
  still-valid downstream selections (previously force-reset) — a documented
  improvement.
- **Action menus** do not auto-focus their first item on open (parity with
  pre-migration behaviour); ArrowDown focuses it.
- **`collision` prop** and **`SelectTrigger/SelectContent/SelectValue`** are
  compatibility no-ops/passthroughs.

## 19. Files changed

**New (20):**

```
src/constants/ui/z-index.js
src/utils/dropdown-position.js
src/utils/dropdown-portal.js
src/utils/filter-cascade.js
src/hooks/use-anchored-dropdown.js
src/hooks/use-filter-cascade.js
src/pages/faculty/pyq-filter-cascade.js
src/pages/student/exam-analysis-filters.js
src/components/assessment-workspace/paper-generator-cascade.js
src/components/assessment-workspace/competitive-browser-cascade.js
src/components/question-studio/studio-cascade.js
tests/setup/dom.js
tests/utils/dropdown-position.test.js
tests/utils/filter-cascade.test.js
tests/filters/cascading-filters.test.js
tests/components/select.test.jsx
tests/components/select-positioning.test.jsx
tests/components/dropdown-menu.test.jsx
docs/DROPDOWN-FILTER-SYSTEM.md
docs/DROPDOWN-FILTER-SYSTEM-IMPLEMENTATION-REPORT.md
```

**Modified (14):**

```
src/components/ui/select.jsx                     (rewritten — canonical primitive)
src/components/ui/dropdown-menu.jsx              (rewritten — canonical action menu)
src/components/ui/dialog.jsx                     (+ data-portal-scope)
src/components/ui/sheet.jsx                      (+ data-portal-scope)
src/components/ui/command.jsx                    (+ data-portal-scope)
src/components/micro-assessment-studio/source-library-filters.js  (engine rewire)
src/components/micro-assessment-studio/source-library.jsx         (group prop)
src/pages/faculty/PYQAnalysis.jsx                (cascade hook)
src/pages/student/ExamAnalysis.jsx               (cascade hook, metadata family)
src/components/assessment-workspace/paper-generator-tab.jsx       (cascade + URL prefill)
src/components/assessment-workspace/competitive-question-browser.jsx (cascade)
src/components/question-studio/studio-workflow.jsx                (cascade + stale-value fix)
package.json                                     (jsdom devDependency)
package-lock.json                                (jsdom devDependency)
```

**Untouched by design:** all intelligence modules (ExamAttempt, Student 360,
Academic DNA, Similar Issues, Interventions, Exam Agent, question/paper
generation, Paper Library), all backend/API contracts, all native form
selects, the landing mega menu, the command palette and the calendar.
