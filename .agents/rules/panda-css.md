---
paths:
  - 'src/**/*.css.ts'
---

# Panda CSS Design Token Usage

Every visual value comes from the design system in `src/design-system/`:

1. **Primitives** (`tokens/`) — raw palette, scales, durations. Never referenced by components.
2. **Semantic tokens** (`semantic/`) — role names (`bg.canvas`, `fg.muted`, `border.subtle`, `spacing.gutter`, `radii.control`, `shadows.float`, `durations.hover`, …). This is what components use.
3. **Text styles** (`text-styles.ts`) — `textStyle: 'label' | 'body' | 'display'` instead of ad-hoc font settings.

Only `@pandacss/preset-base` and the project preset (`src/design-system/preset.ts`, added to `panda.config.ts`'s `presets` when the design system is created) are loaded: Panda's stock theme tokens do not exist here.

## Correct Usage

```ts
export const root = css({
  px: 'gutter', // semantic spacing
  color: 'fg.default', // semantic color
  bg: 'bg.surface', // semantic color
  border: 'subtle', // semantic composite border
  rounded: 'surface', // semantic radius
  textStyle: 'label', // text style
});
```

## Forbidden Patterns

```ts
export const root = css({
  padding: '16px', // arbitrary value
  color: '#0a0a0a', // hardcoded color
  bg: 'gray.100', // primitive leaking into a component
  border: '1px solid rgba(0,0,0,.2)', // raw composite
});
```

Layout-only values that are not design decisions (`100%`, `100dvh`, `50%`, `calc()` of tokens, grid templates) may stay raw. Translucency goes through the opacity modifier in the _semantic_ layer (`{colors.gray.950/55}`), not in components.

## Adding New Tokens

If a required token does not exist, do NOT hardcode values. Instead:

1. Use `AskUserQuestion` to ask about adding it
2. Add the primitive (if new) under `tokens/`, then a semantic name under `semantic/` that describes the role, not the value
3. Run `pnpm panda codegen` (also runs on `pnpm install` via `prepare`)

## Style File Structure

```ts
// styles.css.ts
import { css, cva } from 'styled-system/css';

export const root = css({ display: 'flex', flexDirection: 'column', gap: '4' });

// Variants with cva()
export const button = cva({
  base: { display: 'inline-flex', alignItems: 'center', rounded: 'control' },
  variants: {
    size: {
      sm: { px: 'control.x', textStyle: 'label' },
      md: { px: 'surface.x', textStyle: 'body' },
    },
  },
});
```

Shared fragments inside one file use `css.raw()` and are composed with `css(base, override)`.

## Runtime access

Non-CSS consumers (the WebGPU backdrop painter) read **primitives** through `token()` from `styled-system/tokens`, never semantic tokens, because semantic values resolve to `var()`/`color-mix()`.
