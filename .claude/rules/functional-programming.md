# Functional Programming Patterns

## Immutable Rules

This project follows functional programming principles with immutable data patterns.

### Absolutely Forbidden

- **Module-level `let`** - A `let` at the top of a module (including an Astro `<script>` and an island file) is shared by every importer. No exceptions. Lint: `let-scope/no-top-level-let`
- **`{ value: T }` box to keep `const`** - Wrapping one mutable value in an object so it can stay `const` hides the mutation. Use `let` in the allowed places below instead. Lint: `let-scope/no-value-box`
- **IIFE (Immediately Invoked Function Expression)** - Extract a named helper function instead
- **Non-null assertion operator (`!`)** - Use proper null checks instead
- **`forEach()` method** - Use `for...of` loops or array methods that return values
- **`any` type** - Use `unknown` for truly unknown data, or define proper types

### Where `let` is allowed

`let` is a statement about lifetime: the shorter the lifetime, the easier the mutation is to follow. `let` is allowed only where its lifetime is bounded by a function.

| Where | Allowed? | Typical value |
| --- | --- | --- |
| Inside one function body, gone when it returns | Yes | accumulator, loop state, a timer ID read once |
| A factory closure holding **one** value | Yes | timer ID, a flag, the latest snapshot reference |
| Inside a presenter function (see `presenter.md`) | Yes | current frame, latest pointer position, the active timeline |
| Module top level | **No** | — move it into a factory or a presenter function |

```typescript
// ✅ Function-local — the let dies with the call
const sum = (xs: readonly number[]): number => {
  let total = 0;
  for (const x of xs) total = total + x;
  return total;
};

// ✅ Factory closure — one value, owned by the returned object
export const createDebounce = (fn: () => void, ms: number) => {
  let timerId: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timerId);
    timerId = setTimeout(fn, ms);
  };
};

// ✅ Presenter — the let lives inside the mount function, not in the module
export const mountProgress = (el: HTMLElement): (() => void) => {
  let latest = 0;
  const onScroll = (): void => {
    latest = window.scrollY / document.body.scrollHeight;
    el.style.setProperty('--progress', `${latest}`);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
};

// ❌ Module top level
let latest = 0;

// ❌ { value } box to dodge `let`
const latestRef = { value: 0 };
latestRef.value = 1;
```

### Resources that must be released

A resource you acquire and release later (unsubscribe functions, `AbortController`, gsap contexts, `ResizeObserver`) is not a single value. Collect it with the array pattern in `idempotent-cleanup.md`, not with `let` and not with a `{ value }` box.

### No IIFE - Extract Named Helper

When converting `let` + `if/else` to `const`, extract a named helper function instead of using an IIFE.

```typescript
// Correct - named helper function
const resolveLabel = (status: Status): string => {
  if (status === "active") return "Active";
  return "Inactive";
};

const label = resolveLabel(status);

// Forbidden - IIFE
const label = (() => {
  if (status === "active") return "Active";
  return "Inactive";
})();
```

### Variable Declaration

```typescript
// Always use const
const value = condition ? calculateValue() : undefined;

// Never reassign - create new values instead
const updatedArray = [...originalArray, newItem];
const updatedObject = { ...original, property: newValue };
```

### Array/Object Updates with Spread Operator

```typescript
// Adding to array
const newArray = [...existingArray, newItem];

// Updating object
const newObject = { ...existingObject, updatedField: newValue };

// Removing from array (filter creates new array)
const filtered = array.filter((item) => item.id !== targetId);
```

### Safe Array Access

```typescript
// Destructure first item
const [firstItem] = array;
if (firstItem !== undefined) {
  process(firstItem);
}

// Use optional chaining for nested access
const value = array[0]?.nested?.property;
```

### Loop Implementation

```typescript
// Standard iteration
for (const item of array) {
  process(item);
}

// When index is needed
for (const [index, item] of array.entries()) {
  process(index, item);
}

// Transformation (prefer map/filter/reduce)
const doubled = array.map((x) => x * 2);
const evens = array.filter((x) => x % 2 === 0);
const sum = array.reduce((acc, x) => acc + x, 0);
```

### Pure Functions

- Functions should have no side effects
- Same input always produces same output
- Side effects should be isolated to the edges of the system

## Side Effects Placement

All global side effects MUST be placed in the root layout (`src/layouts/*.astro`) or the root `index.ts` of each module.

### What Are Global Side Effects?

- Extending libraries with plugins
- Setting global defaults
- Polyfills
- Global CSS imports
- Global state initialization

### Correct Pattern

```astro
---
// src/layouts/base-layout.astro - global CSS import lives in the root layout
import '../styles/global.css';
---
<html lang="ja">
  <body><slot /></body>
</html>
```

### Forbidden Pattern

```typescript
// src/components/header/index.tsx
import '../../styles/global.css'; // NEVER do this in non-root files!
```

## Utility Function Patterns

### Pure Functions Only

All utility functions MUST be pure:

- No side effects
- Same input always produces same output
- No external state dependencies

```typescript
// Good: Pure function
export const formatDate = (date: Date, format: string): string => {
  // Transform input to output deterministically
};

// Bad: Side effect
export const formatDate = (date: Date): string => {
  console.log("Formatting date"); // Side effect!
  // ...
};
```

### Function Signature Guidelines

```typescript
// Good: Clear types
export const parseQuery = (query: string): ParsedQuery => {
  // ...
};

// Bad: Implicit any
export const parseQuery = (query) => {
  // ...
};
```
