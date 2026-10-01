---
paths:
  - 'src/**/*.{ts,tsx,astro}'
---

# Component Development Rules

## Colocation Principle

Keep all related files for a component in the same directory. This ensures maintainability and makes it easy to understand, test, and delete components as a unit.

### Directory Structure

Each React component MUST follow this structure:

```
<component-name>/
├── index.tsx                    # Component implementation & exports
├── styles.css.ts                # Panda CSS styles
└── <component-name>.test.tsx    # Unit tests 
```

Astro pages/features follow the same shape with `index.astro`:

```
src/features/<feature>/
├── index.astro                  # Page body (the route in src/pages only imports it)
└── styles.css.ts
```

`src/pages` treats sibling `.ts` files as endpoints, so `styles.css.ts` never lives there.

### Function Modules (utilities, hooks, etc.)

```
module-name/
├── index.ts               # Module implementation & exports
└── module-name.test.ts    # Module tests
```

## Rules

- Use **kebab-case** for all directory and file names
- `index.tsx` / `index.ts` / `index.astro` is the single entry point for each module
- Styles must be in `styles.css.ts` (Panda CSS), not inline, in `<style>` blocks, or separate CSS files
- Test files use the module name: `<module-name>.test.tsx` or `<module-name>.test.ts`
- Never scatter related files across different directories

## Styling with Panda CSS

### Use Design Tokens

Always use semantic tokens from `src/design-system/`. Never hardcode raw values:

```ts
// Correct - semantic tokens
export const button = css({
  color: 'fg.default',
  bg: 'bg.surface',
  px: 'control.x',
  gap: '2',
  textStyle: 'label',
  rounded: 'control',
});

// Incorrect - hardcoded values or primitives
export const button = css({
  color: '#0a0a0a',
  backgroundColor: 'gray.100',
  padding: '16px',
});
```

**If a required token does not exist**, use `AskUserQuestion` to ask whether to add it to `src/design-system/` (primitive first, then a semantic name) or use an alternative.

### Responsive Design

- Components use **container queries** for responsive behavior (never media queries)
- Pages/layouts use **media queries** and propagate state to components via CSS variables or data attributes

### Style Import Convention

Component and page files MUST import styles using namespace imports:

```tsx
// Correct
import * as styles from './styles.css';

// Incorrect
import { styles } from './styles.css';
import styles from './styles.css';
```

### Style Naming Rules

| Rule           | Correct      | Incorrect                          |
| -------------- | ------------ | ---------------------------------- |
| Root element   | `root`       | `container`, `wrapper`             |
| Sub-containers | `headerRoot` | `headerContainer`, `headerWrapper` |
| Max 3 words    | `cardTitle`  | `messageWallItemTimestamp`         |

### No Child Selectors

```ts
// Incorrect
export const card = css({
  '& h3': { fontSize: 'lg' },
});

// Correct - separate styles
export const card = css({ padding: '4' });
export const cardTitle = css({ fontSize: 'lg' });
```

**Allowed selectors**: `&:hover`, `&:focus`, `&:nth-child()`, `&::placeholder`, `&[disabled]`, `&[data-*]`, `&[aria-*]`

## Accessibility

Use **react-aria-components** as the foundation for interactive components.

Reference: https://react-aria.adobe.com/llms.txt

```tsx
import { Button } from 'react-aria-components';

export const PrimaryButton = (props: ButtonProps) => <Button className={styles.root} {...props} />;
```

### Links

Static links rendered by `.astro` files are plain `<a>` elements (no hydration for a link). `react-aria-components` `Link` is used only inside React islands that already hydrate. External links carry `rel="noopener"`.

### Style export naming for containers

The component's outermost element is `root`; every other element that wraps children (header/footer rows, lists, grids, tracks, columns, bodies, figures) is `xxxRoot` (`headerRoot`, `listRoot`, `gridRoot`, `trackRoot`…). Leaf styles (title, chip, date, arrow, link…) keep short names.
