# EduX Dropdown Filter System

## Overview

This document describes the canonical selection state contract and cascading filter dependencies for the EduX frontend. Every dropdown/select component in EduX must follow these patterns to ensure consistent, reliable user experience.

## Selection State Contract

### Core Principles

1. **VALUE ≠ LABEL**: The component state must store canonical values (IDs, slugs, codes) while the trigger displays human-readable labels.

2. **Canonical Value Display**: When a user selects an option, the dropdown trigger must immediately show the selected label, never "Select..." or a stale placeholder.

3. **Stable Identifiers**: Use stable identifiers (`id`, `slug`, `code`, `canonical key`) instead of array indexes as values.

4. **Option Resolution**: A single reliable method must resolve `canonical value → option object → display label`.

### Component Contract

Every dropdown must implement this conceptual contract:

```typescript
{
  value: canonicalValue,      // The stable identifier (e.g., "jee", "physics")
  label: displayLabel,        // The human-readable text (e.g., "JEE", "Physics")
  options: availableOptions,   // Array of available option objects
  disabled: boolean,          // Whether the dropdown is disabled
  onChange: updateCanonicalValue // Callback to update the canonical value
}
```

### Selected Value Display Logic

The trigger should display:

```javascript
const selectedOption = resolveSelectedOption(value, options)
const displayText = selectedOption?.label ?? placeholder
```

Where `resolveSelectedOption` finds the option object matching the canonical value and returns its label.

**Critical**: If no matching option exists, the state must be revalidated. Do NOT show "Select..." while an invalid stale value remains internally.

## Dependency Graph

### Parent-First Rule

For interconnected/cascading filters, explicitly define the parent → child dependency:

```
Context
    ↓
Exam Family
    ↓
Subject
    ↓
Chapter
    ↓
Topic
```

**THE CHILD MUST BE DISABLED UNTIL THE REQUIRED PARENT IS SELECTED.**

### Dependency Enforcement

1. **Disabled State**: Child dropdowns must be visually obvious and interaction-disabled:
   - `disabled=true` prop passed to Select component
   - Click does nothing
   - Keyboard cannot open it
   - Appropriate EduX disabled styling

2. **Option Derivation**: Child options must be derived from valid parent state:
   - If Context = JEE and Subject = Physics, Chapter options should contain only JEE Physics chapters
   - Never show options from incompatible parent contexts

3. **Downstream Reset**: When a parent changes, ALL invalid descendants must be cleared:
   - If Subject changes from Physics to Chemistry, Chapter and Topic must be cleared
   - Reset must be transactional (no intermediate invalid states)

4. **Invalid State Prevention**: Even if a UI component somehow receives an invalid combination, the feature state must reject it.

## Domain Isolation

### University / JEE / NEET Separation

The selection system MUST respect University, JEE, and NEET as separate contexts:

- **Never determine context only from subject name** (e.g., "Physics" could be JEE Physics or University Physics)
- **Use canonical metadata**: `domain`, `examFamily` already established in EduX
- **Context isolation**: Options must be filtered before they reach selectors to prevent mixed lists

### Example: Domain Isolation in Option Derivation

```javascript
function visibleExamOptions(options = [], context, family) {
  if (context === 'University') {
    return options.filter((o) => o.category === 'University')
  }
  return options.filter((o) => 
    o.category !== 'University' && 
    (family === 'All' || examFamilyOf(o) === family)
  )
}
```

## URL Parameter Validation

When using URL-driven state:

1. **Validate URL state in dependency order**: If URL contains `chapter=mechanics` but `subject` is missing, DO NOT initialize Chapter as selected
2. **Clear invalid parameters**: If URL contains incompatible combinations, normalize to the nearest valid state
3. **Never allow URL parameters to bypass dependency rules**

## Implementation Patterns

### Using the Filter Cascade System

EduX provides a shared cascade engine (`src/utils/filter-cascade.js`) and React hook (`src/hooks/use-filter-cascade.js`).

#### Basic Usage

```javascript
import { useFilterCascade } from '@/hooks/use-filter-cascade'
import { buildFeatureCascade } from './feature-filters'

function MyComponent() {
  const cascadeConfig = useMemo(() => buildFeatureCascade(dataset), [dataset])
  const { values, options, set, apply, reset } = useFilterCascade(cascadeConfig)
  
  return (
    <>
      <Select 
        value={values.domain ?? ''} 
        onValueChange={(v) => set('domain', v)} 
        placeholder="Select domain..."
      >
        {options.domains.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
      </Select>
      
      <Select 
        value={values.subject ?? ''} 
        onValueChange={(v) => set('subject', v)} 
        disabled={!values.domain}  // 👈 Critical: disabled until parent selected
        placeholder={values.domain ? "Select subject..." : "Select domain first"}
      >
        {options.subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
      </Select>
    </>
  )
}
```

### Feature-Specific Cascade Configuration

Each feature must declare its own dependency graph and option derivation:

```javascript
// src/pages/feature/feature-filters.js
export const FEATURE_DEPENDENCIES = {
  domain: [],
  examFamily: ['domain'],
  subject: ['domain', 'examFamily'],
  chapter: ['domain', 'examFamily', 'subject'],
  topic: ['domain', 'examFamily', 'subject', 'chapter'],
}

export function buildFeatureCascade(dataset) {
  return {
    dependencies: FEATURE_DEPENDENCIES,
    treatEmptyOptionsAsInvalid: true,
    deriveOptions: (key, values) => {
      if (key === 'domain') return dataset.domains
      if (key === 'examFamily') return getExamFamilies(values.domain, dataset)
      if (key === 'subject') return getSubjects(values.domain, values.examFamily, dataset)
      if (key === 'chapter') return getChapters(values.domain, values.examFamily, values.subject, dataset)
      return getTopics(values.domain, values.examFamily, values.subject, values.chapter, dataset)
    },
  }
}
```

### Disabled State Logic

The disabled state for each dropdown should be computed based on its dependencies:

```javascript
const dependencies = {
  subject: ['domain'],
  chapter: ['domain', 'subject'],
  topic: ['domain', 'subject', 'chapter'],
}

function isDisabled(key, values, dependencies) {
  const deps = dependencies[key] ?? []
  return deps.some((dep) => !values[dep] || values[dep] === '')
}
```

### Helper Message Pattern

When a dropdown is disabled, provide a helpful message:

```javascript
<Select 
  value={values.chapter ?? ''} 
  onValueChange={(v) => set('chapter', v)} 
  disabled={!values.subject}
  placeholder={values.subject ? "Select chapter..." : "Select subject first"}
  helper={!values.subject ? "Select a subject first" : undefined}
>
  {options.chapters.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
</Select>
```

## Shared Filter Controller

For features that need more control, create a reusable controller:

```javascript
// src/hooks/use-dependent-filters.js
import { useMemo } from 'react'
import { useFilterCascade } from './use-filter-cascade'

export function useDependentFilters(config) {
  const cascade = useFilterCascade(config)
  
  // Compute disabled state for each key
  const disabledStates = useMemo(() => {
    const disabled = {}
    for (const [key, deps] of Object.entries(config.dependencies ?? {})) {
      disabled[key] = deps.some((dep) => !cascade.values[dep] || cascade.values[dep] === '')
    }
    return disabled
  }, [config.dependencies, cascade.values])
  
  // Compute helper messages for disabled dropdowns
  const helperMessages = useMemo(() => {
    const helpers = {}
    for (const [key, deps] of Object.entries(config.dependencies ?? {})) {
      if (disabledStates[key]) {
        const missingDeps = deps.filter((dep) => !cascade.values[dep] || cascade.values[dep] === '')
        if (missingDeps.length === 1) {
          helpers[key] = `Select ${missingDeps[0]} first`
        } else if (missingDeps.length > 1) {
          helpers[key] = `Select ${missingDeps.join(' and ')} first`
        }
      }
    }
    return helpers
  }, [config.dependencies, cascade.values, disabledStates])
  
  return {
    ...cascade,
    disabled: disabledStates,
    helpers: helperMessages,
  }
}
```

## Testing Requirements

Every dropdown implementation must pass these tests:

### A. Selection Display
- [ ] Select Physics → trigger displays "Physics"
- [ ] Never shows "Select..." after valid selection

### B. Value/Label Mismatch
- [ ] Canonical value: "physics"
- [ ] Display: "Physics"
- [ ] Contract is correct

### C. Child Disabled
- [ ] No Subject → Chapter disabled
- [ ] Click does nothing
- [ ] Keyboard cannot open it

### D. Parent-First
- [ ] Attempt to open Chapter before Subject → blocked

### E. Parent Change
- [ ] Physics → Chemistry → Chapter cleared

### F. Deep Reset
- [ ] Physics → Mechanics → Kinematics, then change Subject → Chapter and Topic cleared

### G. Invalid State
- [ ] Subject = Chemistry, Chapter = Mechanics → rejected/reset

### H. URL State
- [ ] Invalid URL hierarchy → normalized

### I-J-K. Domain Isolation
- [ ] University Physics → only University chapters
- [ ] JEE Physics → only JEE chapters
- [ ] NEET Physics → only NEET chapters

### L. Selected Label After Filtering
- [ ] Select Physics, then change parent → selected value either remains valid or clears cleanly

## Common Pitfalls and Solutions

### Problem: "Select..." Shows After Selection

**Root Causes:**
- value mismatch between state and option.value
- string vs number type mismatch
- selected option being filtered out of options
- stale derived state

**Solution:**
```javascript
// ✅ Correct: Use the canonical value directly for display resolution
const selectedItem = items.find((item) => item.props.value === current)
const displayLabel = selectedItem 
  ? (selectedItem.props.searchText ?? selectedItem.props.children) 
  : hasValue 
    ? String(current)  // Show the value itself if option missing
    : (placeholder ?? 'Select…')
```

### Problem: Child Can Be Selected Before Parent

**Root Causes:**
- Missing disabled prop on child Select
- Disabled state not computed from parent values
- Options not properly filtered

**Solution:**
```javascript
// ✅ Correct: Compute disabled state from dependencies
const isChapterDisabled = !values.subject || values.subject === ''

<Select 
  value={values.chapter ?? ''} 
  onValueChange={(v) => set('chapter', v)} 
  disabled={isChapterDisabled}
  placeholder={values.subject ? "Select chapter..." : "Select subject first"}
>
  {options.chapters.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
</Select>
```

### Problem: Options Show Invalid Choices

**Root Causes:**
- Options not derived from parent state
- Dataset not properly filtered

**Solution:**
```javascript
// ✅ Correct: Derive options from parent values
const chapterOptions = useMemo(() => {
  if (!values.subject) return []
  return getChaptersForSubject(values.domain, values.subject, dataset)
}, [values.domain, values.subject, dataset])
```

## File Structure

```
src/
├── hooks/
│   ├── use-filter-cascade.js      # React binding for cascade engine
│   └── use-dependent-filters.js    # Optional: higher-level controller
├── utils/
│   └── filter-cascade.js           # Pure cascade engine
├── components/
│   └── ui/
│       └── select.jsx              # Canonical Select primitive
└── pages/
    └── [feature]/
        ├── [feature]-filters.js     # Feature-specific cascade config
        └── [FeaturePage].jsx        # Page using cascade
```

## Migration Guide

To migrate existing dropdowns to the canonical system:

1. **Identify the dependency graph** for your feature
2. **Create a feature-specific cascade config** in `[feature]-filters.js`
3. **Replace direct Select usage** with cascade-managed Select components
4. **Add disabled props** based on parent selection state
5. **Add helper messages** for disabled dropdowns
6. **Test all cascading scenarios**

## Maintenance

- Do NOT create duplicate option arrays in UI components
- Use existing canonical datasets
- Do NOT use array indexes as values
- Do NOT introduce subject-name heuristics for context detection
- Keep filter state local to the feature/page
- Do NOT create global application state for filters