# EduX Dropdown & Filter Interaction System

The single canonical system for every dropdown and every cascading filter in
EduX. One UI primitive for selection, one UI primitive for action menus, one
shared positioning/portal architecture behind both, and one shared engine for
feature-declared cascading filter state.

> Implementation history, inventory and audit:
> `docs/DROPDOWN-FILTER-SYSTEM-IMPLEMENTATION-REPORT.md`.

---

## 1. Canonical components

| Component | File | Purpose |
| --- | --- | --- |
| `<Select>` / `<SelectItem>` | `src/components/ui/select.jsx` | Every **selection** dropdown (filters, form pickers, anything with a value) |
| `<DropdownMenu*>` | `src/components/ui/dropdown-menu.jsx` | Every **action menu** (profile menu, row actions — click-to-act, no selection state) |
| `useAnchoredDropdown` | `src/hooks/use-anchored-dropdown.js` | Shared lifecycle: portal resolution, positioning, scroll/resize, outside click, Escape, group mutual exclusion |
| `computeDropdownPosition` | `src/utils/dropdown-position.js` | Pure viewport math (placement, clamping, max height) |
| `resolveDropdownContainer` | `src/utils/dropdown-portal.js` | Portal target resolution (`document.body` or nearest `data-portal-scope`) |
| `createFilterCascade` / `useFilterCascade` | `src/utils/filter-cascade.js`, `src/hooks/use-filter-cascade.js` | Feature-declared cascading filter state (validation + option derivation) |
| `Z_INDEX` | `src/constants/ui/z-index.js` | The only allowed z-index values for overlays |

Rules:

- **Do not create new dropdown primitives.** Selection → `<Select>`, action
  menu → `<DropdownMenu>`. Anything else (date picker, nav mega menu, command
  palette) is a different component category and is explicitly out of scope.
- **The UI primitive does not own filter state.** `<Select>` knows nothing
  about cascading — it displays a value and option list. Dependency logic
  lives in the feature, declared against the shared engine (see §7–§9).
- **Do not over-consolidate.** Profile menus, date pickers and action menus
  share only the *positioning/portal* architecture, never filter state.

### `<Select>` contract

```jsx
<Select
  value={value}                 // controlled (or defaultValue for uncontrolled)
  onValueChange={(next) => …}
  placeholder="Select subject…" // meaningful, not "Select…"
  ariaLabel="Subject"           // announced as "Subject: <current>"
  clearable clearValue=""       // optional clear (×) control
  disabled loading              // loading disables + aria-busy
  searchable                    // default true — search field inside the menu
  group="pyq-filters"           // optional: one open dropdown per group
  helper="…"
>
  <SelectItem value="phy">Physics</SelectItem>   // option
  <SelectItem value="chem" disabled>Chemistry</SelectItem>
  <SelectItem value="bio" searchText="Biology / Botany">Bio</SelectItem>
</Select>
```

Selected-value contract:

- a value matching an option renders **that option's label**;
- a value **not** in the current option set renders **itself** (never a stale
  "Select…" placeholder after a parent filter change);
- empty value renders the placeholder.

### `<DropdownMenu>` contract

```jsx
<DropdownMenu group="row-actions">
  <DropdownMenuTrigger>⋯</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuItem icon={Pencil} onClick={…}>Edit</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem checked>Starred</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Action-menu semantics: opening shows the menu; **any click inside the menu
closes it** (menu items are one-shot actions). No selection state.

## 2. Positioning architecture

All anchored menus are rendered `position: fixed` inside a portal, and their
coordinates are computed by ONE pure function, `computeDropdownPosition`,
using the trigger's real bounding rect, the menu's real content height
(`scrollHeight`) and the viewport:

- **down** when the menu fits below the trigger (8px gap);
- **else up** when it fits above;
- **else the roomier side**, with the menu height constrained to that side's
  available space (so a 40-item list never grows the page);
- **maxHeight** is always `available space on the chosen side − 8px safe
  margin` — long lists scroll *inside the menu*; the page never scrolls;
- **no hardcoded `top: 100%`** anywhere — the anchor is recomputed from the
  trigger rect at open, after a 60ms content-settle re-measure, and on every
  scroll/resize.

Repositioning (not closing) happens on:

- `scroll` — capture phase, so inner scroll containers are caught;
- `resize` — the menu re-anchors and its maxHeight re-derives (verified at
  375 / 768 / 1024 / 1440 / 1920 in tests).

The menu **closes** (reason `scroll-out`) only when the trigger has scrolled
*fully* out of the viewport — a partially visible trigger keeps the menu,
re-anchored.

## 3. Portal behavior

- Menus portal to **`document.body`** by default — no parent
  `overflow-hidden`, `transform`, `filter`, `backdrop-filter` or stacking
  context can clip them, and no card/sidebar can trap them.
- Menus opened **inside a dialog/sheet** portal into that overlay's
  `data-portal-scope` container (set on `DialogContent`, `SheetContent` and
  the command palette). This keeps the menu inside the overlay's stacking
  context so the consistent `menu` z-index (70) renders **above the dialog
  content** without any global z-index bump — and a dialog's Escape closes
  the dialog, never a dropdown behind it.
- Positioning stays **trigger-relative** after portal rendering — the portal
  never changes the coordinates, only the containing block.
- The portal element stays mounted through the ~140ms exit animation
  (`AnimatePresence` lives *inside* the portal; a `createPortal` as a direct
  child of `AnimatePresence` silently breaks presence tracking).

## 4. Collision detection

Vertical:

- fits-below → fits-above → roomier-side (see §2), with the safe margin of
  8px on every side.

Horizontal:

- menu width = `clamp(max(triggerWidth, 192px), 8px, viewportWidth − 16px)` —
  never narrower than 192px, never wider than the viewport;
- `left` is clamped to `[8px, viewportWidth − width − 8px]`, so a menu
  opened 900px into a 1024px viewport slides left instead of hanging off the
  screen; on a 375px viewport the menu is 359px wide and pinned to the 8px
  margins.

## 5. Keyboard behavior

| Key | On trigger (closed) | In menu |
| --- | --- | --- |
| `Enter`, `Space` | opens | — |
| `ArrowDown` / `ArrowUp` | opens (focus first option / search) | next / previous **enabled** option (disabled options are skipped) |
| `Home` / `End` | — | first / last enabled option |
| `Enter` | — | selects the focused option (native button activation) |
| `Escape` | — | closes and **returns focus to the trigger** |

- On open, focus moves to the search field (searchable selects) or the first
  option (non-searchable) ~50ms after the menu appears.
- `Escape` is handled in the **capture phase** on `document` with
  `stopPropagation` — in a dialog, Escape closes the dropdown first; the next
  Escape closes the dialog.
- Focus is always on a real, visible element — no roving-focus hacks over
  hidden nodes.

## 6. Accessibility

- Trigger: `aria-expanded`, `aria-haspopup="listbox"` (Select) /
  `"menu"` (DropdownMenu), `aria-controls` → menu id, `aria-label` includes
  the current value, `aria-busy` while loading, native `disabled`.
- Menu: `role="listbox"` / `role="menu"`; options/items:
  `role="option"` / `role="menuitem"` with `aria-selected`.
- Disabled options render `disabled` and are skipped by keyboard navigation.
- The search field is a labelled, real `<input>` (`aria-label="Search
  options"`) — screen-reader searchable.
- Visible focus styling on trigger, options and items; focus returns to the
  trigger after selection and after Escape.
- Outside click closes (pointerdown, capture; trigger and menu contents are
  safe targets — no click/mousedown race, no double-close).

## 7. Filter dependency architecture

Cascading filter state is **declared per feature** against ONE shared engine
(`src/utils/filter-cascade.js`):

```js
createFilterCascade({
  // 1. ONLY real data dependencies. Independent keys stay OUT of the map.
  dependencies: {
    examFamily: ['domain'],
    subject:    ['domain', 'examFamily'],
    chapter:    ['domain', 'examFamily', 'subject'],
    topic:      ['domain', 'examFamily', 'subject', 'chapter'],
  },
  // 2. Options ALWAYS derived from the canonical dataset — never hardcoded.
  deriveOptions: (key, values, purpose) => …,
  // 3. How "cleared" looks per key ('' by default; sentinels allowed).
  emptyValues: { subject: 'All subjects' },
  // 4. Strict: an EMPTY option list invalidates the current value.
  treatEmptyOptionsAsInvalid: true,
})
```

Engine guarantees:

- **Never `Parent = A, Child = value belonging to B`.** `sanitize(values)`
  walks the graph parent-first; a child whose value is not in its
  parent-derived options is reset to its empty value; descendants are
  re-validated against the *updated* parents in the same pass (kept if still
  valid, cleared if not — transitively, precisely, no over-clearing).
- **Independent keys pass through untouched** (search boxes, year ranges,
  difficulty, source type) — no global cross-dependency is introduced.
- **Cycles fail fast** (`CascadeOrder` throws on a circular declaration).
- `deriveOptions(key, values, purpose)` receives a purpose: `'display'`
  (what the dropdown shows) vs `'sanitize'` (what validates state). When an
  independent key influences derivation, neutralize it in the `'sanitize'`
  branch so a legitimate no-match state can never clear hierarchy values.

Two integration styles:

- `useFilterCascade(config)` — features with React state; returns
  `{ values, options, set, apply, reset }`. `apply(patch)` returns the
  sanitized values synchronously; the hook re-sanitizes when the config's
  derivation changes (dataset load, context switch) and keeps values while an
  option list is still empty in non-strict mode.
- `createFilterCascade(config)` — features that already keep cascade state in
  a plain object (returns `{ sanitize, options }`).

## 8. How to declare cascading filters (new feature checklist)

1. **Prove the dependency from the data.** For every edge `child: [parents]`,
   the dataset must actually constrain `child` by `parents` (e.g. chapters
   exist per subject in `pyqFilters`). If the dataset has no such
   relationship, do NOT declare the edge (see PYQ's `program` — independent).
2. Put the declaration in a **feature module next to the feature** (e.g.
   `pyq-filter-cascade.js`), exporting the dependency map and a
   `build…Cascade(dataset)` that returns a config whose `deriveOptions` reads
   the canonical dataset.
3. Wire the UI: each level is a `<Select group="…">` fed with
   `options[key]` from the hook/cascade; `onValueChange` →
   `set(key, value)` / `apply({ … })`. Pass the same `group` to every
   dropdown in the filter row (one open at a time).
4. Choose the empty semantics per key: `''` or a sentinel (`'All'`,
   `'All subjects'`); declare it in `emptyValues` so the UI and the engine
   agree.
5. Choose strict vs keep-on-empty:
   - **strict** (`treatEmptyOptionsAsInvalid: true`) when an empty list means
     "no valid parent selection" (the usual case);
   - **non-strict** only to protect values while an **async dataset is still
     loading** (paper-generator) — the initial state must be the sentinel so
     loading can never wipe a valid value.
6. Memoize the config (e.g. `useMemo(() => build…(data), [data])`) so
   `deriveOptions` identity is stable across unrelated renders.
7. Add tests against the **real dataset** (see `tests/filters/cascading-filters.test.js`)
   covering: dependent recalculation, invalid child reset (transitive), clear
   all, and domain isolation where applicable.

## 9. When NOT to use cascading filters

- **No real data dependency.** PYQ's Program ↔ Subject: the catalog serves
  every program, so the two selectors are independent. Inventing a cascade
  here would reset user selections for no data reason.
- **Search / query boxes** — they filter results, they do not constrain
  other selectors. (Source Library's `search` and `sourceType` are stripped
  from the `'sanitize'` purpose exactly for this.)
- **Year ranges, difficulty, question type, marks, duration** — independent
  dimensions.
- **Context chips that are themselves the top of the hierarchy** (Exam
  Analysis's University/Competitive chips) may be *undeclared* parents: they
  are walked for cycle detection but never validated/cleared by the engine —
  they drive `deriveOptions` instead.
- **Action menus, date pickers, the landing mega menu, the command palette**
  — different component categories; only the positioning architecture is
  shared, never filter state.
- **Native `<select>` in CRUD dialogs** (admin forms, contact form) — they
  are single-value form fields with no cascade; native semantics are
  intentional there.

## 10. Domain isolation rules

Option lists are derived **only from the canonical dataset scoped by the
declared context** — never from string matching on subject names:

- **University vs Competitive** (Exam Analysis, Paper Generator): exam
  options are filtered by `category` / mode; a University exam is never
  offered in Competitive context and vice versa.
- **JEE vs NEET** (Exam Analysis, Paper Generator, Competitive Browser):
  family comes from the exam's canonical metadata (`pattern` / `shortName` /
  `name` — `examFamilyOf`), **never from the subject name** (Physics exists
  in both; only the *exam* differs). NEET options are scoped to
  `NEET UG`, JEE to `JEE Main` question pools.
- **Domain → exam family → subject → chapter → topic** (Source Library):
  each level's options come from the selected parents' subtree of the
  source catalog.
- **Per-source isolation** (Question Studio): topics/concepts come from the
  analyzed source itself; switching source resets the downstream pair.
- A subject that genuinely exists under two contexts (Physics under JEE and
  NEET) is **kept** when switching between them; a subject that doesn't is
  **cleared**. Context switches never fabricate a mapping.

## 11. Migration guidance

Migrating an existing dropdown:

1. If it's a **selection control** → replace with `<Select>` +
   `<SelectItem>`. Map: options → items, value → `value`/`onValueChange`,
   "All …" placeholder → `placeholder` or a real sentinel option, `disabled`
   → `disabled`, fetching → `loading`.
2. If it has **cascading behaviour**, prove each edge against the dataset
   (§8) and move the hand-rolled reset logic into a `build…Cascade` module.
   Delete the local reset/derivation code only once the feature renders
   through the engine.
3. If it's an **action menu** → `<DropdownMenu*>`.
4. Give the filter row a **`group`** id so only one dropdown stays open.
5. **Do not migrate** native form selects in CRUD dialogs, the landing mega
   menu, the command palette or the calendar — they are a different category
   (see `docs/DROPDOWN-FILTER-SYSTEM-IMPLEMENTATION-REPORT.md` §11).
6. Verify: selected-value display, placeholder, clear, keyboard, Escape,
   outside click, open up/down, horizontal clamp, max height, dependent
   recalculation, invalid-child reset, clear-all, URL state (if the feature
   has it), domain isolation — the same 18 areas the new tests cover.

## 12. Known limitations

- **jsdom covers behaviour, not paint.** Positioning math, portal DOM,
  keyboard and scroll/resize behaviour are tested; real-browser visual QA at
  375/768/1024/1440/1920 is a manual checklist (no browser automation in the
  dev sandbox — see report §14).
- **Escape in nested overlays** closes the innermost dropdown first (capture
  + stopPropagation). A second Escape closes the overlay. This is intended,
  but the ordering is not configurable.
- **Keep-on-empty (non-strict) mode** keeps a value while its option list is
  empty — correct for async loading, wrong if "empty" can mean "no valid
  parent". Declare strict unless you have the loading case (only
  paper-generator is non-strict).
- **Non-text option labels** (icon + text, custom JSX) need the
  `searchText` prop to be searchable.
- **Exit animation**: the menu element stays mounted ~140ms while fading out;
  a fast reopen restarts the animation. Close assertions (and any
  measurement) should wait for the animation to finish.
- **Paper Generator behaviour change**: switching the JEE/NEET or
  University/Competitive chips no longer force-resets downstream selections —
  still-valid selections (e.g. Physics) are kept. This is a documented
  improvement over the old force-reset.
- **`<Select collision>`** is a deprecated no-op kept for call-site
  compatibility — portal + collision positioning is now always on.
- **Action menus do not auto-focus** their first item on open (parity with
  pre-migration topbar behaviour); ArrowDown focuses the first item.
