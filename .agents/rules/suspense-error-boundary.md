---
paths:
  - "src/**/*.tsx"
---

# Suspense & ErrorBoundary Pattern

When using hooks that suspend, set fine-grained Suspense/ErrorBoundary boundaries. Add `react-error-boundary` as a dependency when the first suspending island appears.

## Basic Pattern

```tsx
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Wrap each data-fetching component in its own boundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <Suspense fallback={<Loading />}>
    <DataFetchingComponent />
  </Suspense>
</ErrorBoundary>;
```

## Island Components Pattern

Pages under `src/pages/` stay thin (see [[file-colocation]]). A suspending component lives inside a React island, and the island owns its own boundary:

```
src/features/<name>/
├── index.astro            # Page body (static, no boundary needed)
└── feed-list/
    ├── index.tsx          # Island root: ErrorBoundary + Suspense
    └── feed-item.tsx      # Suspending child
```

## ErrorBoundary Props

| Pattern                  | Use Case                     |
| ------------------------ | ---------------------------- |
| `fallback` prop          | Simple static fallback       |
| `FallbackComponent` prop | Component showing error info |
| `onError` prop           | Error logging                |
| `onReset` prop           | Retry handling               |

### FallbackComponent (dynamic)

```tsx
const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div>
    <p>Error: {error.message}</p>
    <button onClick={resetErrorBoundary}>Retry</button>
  </div>
);

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <Component />
</ErrorBoundary>;
```

## Reset Patterns

### Basic: resetErrorBoundary

```tsx
const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div>
    <p>Error: {error.message}</p>
    <button onClick={resetErrorBoundary}>Retry</button>
  </div>
);
```

### resetKeys: Auto Reset

ErrorBoundary automatically resets when `resetKeys` values change:

```tsx
const [retryCount, setRetryCount] = useState(0);

<ErrorBoundary
  FallbackComponent={ErrorFallback}
  resetKeys={[retryCount]}
  onReset={() => {
    // Reset handling
  }}
>
  <Component />
</ErrorBoundary>

// Trigger reset externally
<button onClick={() => setRetryCount(c => c + 1)}>Retry</button>
```

### useErrorBoundary Hook

For programmatically throwing errors:

```tsx
import { useCallback } from 'react';
import { useErrorBoundary } from 'react-error-boundary';

const Component = () => {
  const { showBoundary } = useErrorBoundary();

  const handleClick = useCallback(async () => {
    try {
      await riskyOperation();
    } catch (error) {
      showBoundary(error); // Propagate to ErrorBoundary
    }
  }, [showBoundary]);

  return <button onClick={handleClick}>Execute</button>;
};
```

## Guidelines

- **Isolate suspending components**: Wrap each data-fetching component in its own Suspense boundary
- **Granular fallbacks**: Each boundary should have an appropriate loading state
- **Error isolation**: Use ErrorBoundary to prevent one failing component from breaking the entire page
- **Avoid page-level only**: Don't rely solely on route-level Suspense; break down into smaller boundaries

## Anti-patterns

```tsx
// Bad - Entire page wrapped in single boundary
const Page = () => (
  <Suspense fallback={<Loading />}>
    <Header /> {/* Does not suspend */}
    <HeroSection /> {/* Suspends */}
    <FeatureList /> {/* Suspends */}
  </Suspense>
);

// Good - Each suspending component has its own boundary
const Page = () => (
  <>
    <Header />
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>
    </ErrorBoundary>
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<FeatureListSkeleton />}>
        <FeatureList />
      </Suspense>
    </ErrorBoundary>
  </>
);
```

## References

- [react-error-boundary](https://github.com/bvaughn/react-error-boundary)
