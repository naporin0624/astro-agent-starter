---
paths:
  - 'src/**/*.tsx'
---

# React Conventions

## Islands First

This project is Astro with React islands. Everything static is an `.astro` template; React exists only for interaction. **Keep the client bundle to the minimum.**

- Static markup, copy, and layout live in `.astro` files (`src/features/<name>/index.astro`)
- A React island wraps only the interactive part and is mounted with `client:load` (needs SSR markup) or `client:only="react"` (browser-only APIs with no meaningful SSR output)
- Dependencies that touch the DOM or browser-only APIs at import time are imported dynamically from the client boot path, never at module top level of a server-rendered island
- Imperative browser systems (canvas, listeners, third-party widgets) are attached from a ref callback or an external store read with `useSyncExternalStore`; `useEffect` is not the integration point
- Pass data into islands as props from the `.astro` file; islands never fetch on mount

| Principle         | Rule                                                              |
| ----------------- | ----------------------------------------------------------------- |
| Default           | `.astro` template, zero client JS                                 |
| When JS is needed | Extract only the interactive part into a `src/components/` island |
| Island placement  | Smallest possible subtree; sibling static content stays in Astro  |
| Data              | Props from Astro; no fetching inside islands                      |

## useEffect Restrictions (ULTRA STRICT)

### NEVER Use useEffect For:

- Data fetching
- State synchronization
- Derived state calculations
- Subscribing to external stores (use `useSyncExternalStore`)

### Absolutely Forbidden Pattern

```typescript
// FORBIDDEN: useEffect + useState for data fetching
const Component = ({ userId }: { userId: string }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser); // NEVER DO THIS
  }, [userId]);
};
```

### When useEffect IS Acceptable

Only for imperative DOM operations, with mandatory justification comment:

```typescript
useEffect(() => {
  // USEEFFECT_JUSTIFICATION: Required for imperative DOM focus
  // Cannot use Suspense as this is direct DOM manipulation
  inputRef.current?.focus();
}, []);
```

## Event Handler Rules (jsx-no-bind)

### Forbidden Pattern

```typescript
// Creates new function on every render
<button onClick={() => handleClick()}>Click</button>
<button onClick={() => onItemClick(item.id)}>Click</button>
```

### Correct Patterns

```typescript
// Use useCallback
const handleClick = useCallback(() => {
  // Handle click
}, []);

<button onClick={handleClick}>Click</button>
```

```typescript
// Extract component when parameters are needed
type ListItemProps = {
  item: Item;
  onItemClick: (id: string) => void;
};

const ListItem = ({ item, onItemClick }: ListItemProps) => {
  const handleClick = useCallback(() => {
    onItemClick(item.id);
  }, [item.id, onItemClick]);

  return <button onClick={handleClick}>{item.name}</button>;
};
```

## Component State Philosophy

Components should be pure functions. Use `useState` only when:

1. State is internal to the component
2. State does not affect external systems
3. State cannot be derived from props

```typescript
// Valid: Internal UI state
const Accordion = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  // ...
};

// Invalid: State that should come from props or server
const UserCard = ({ userId }: { userId: string }) => {
  const [user, setUser] = useState(null); // Should be fetched at build time in the Astro page and passed as a prop
};
```

## React Aria Components

Use **react-aria-components** for building accessible UI components. When unsure which component to use, reference https://react-aria.adobe.com/llms.txt for guidance.

## React Suspense & ErrorBoundary

When implementing Suspense boundaries or error handling:

- **Boundary Placement**: Always pair `<Suspense>` with `<ErrorBoundary>`
- **CLS Prevention**: Use skeleton components that match the loaded content dimensions
- **Separated Skeleton Pattern**: For components using hooks, **always separate the skeleton into a pure component**

```tsx
// WRONG: Hooks are called even in loading state, causing infinite suspend
<Suspense fallback={<MyComponent loading />}>
  <MyComponent />
</Suspense>

// CORRECT: Skeleton is a separate pure component with no hooks
<Suspense fallback={<MyComponentSkeleton />}>
  <MyComponent />
</Suspense>
```

## State-Based Styling with Data Attributes

When styling changes based on component state, always map state to `data-*` attributes first, then use CSS selectors:

```typescript
// Correct - map state to data attribute, style with selector
type ButtonProps = {
  isActive?: boolean;
  isLoading?: boolean;
};

export const Button = ({ isActive, isLoading, ...props }: ButtonProps) => (
  <button
    {...props}
    data-active={isActive || undefined}
    data-loading={isLoading || undefined}
  />
);

// In styles.css.ts
export const button = css({
  bg: "bg.surface",
  "&[data-active]": {
    bg: "accent.base",
    color: "text.inverse",
  },
  "&[data-loading]": {
    opacity: 0.7,
    cursor: "wait",
  },
});
```

```typescript
// Forbidden - conditional className based on state
<button className={cx(styles.button, isActive && styles.active)} />

// Forbidden - inline conditional styles
<button className={css({ bg: isActive ? "accent.base" : "bg.surface" })} />
```

### React Aria Data Attributes

React Aria automatically provides data attributes for component states:

```typescript
// React Aria provides data-hovered, data-pressed, data-focused, etc.
export const button = css({
  bg: 'bg.surface',
  '&[data-hovered]': {
    bg: 'bg.hover',
  },
  '&[data-pressed]': {
    bg: 'bg.active',
  },
  '&[data-disabled]': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});
```
