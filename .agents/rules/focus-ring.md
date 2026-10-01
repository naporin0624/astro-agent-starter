---
paths:
  - 'src/**/*.css.ts'
---

# Focus Rings

A focus ring comes only from the two layer styles in `src/design-system/layer-styles.ts` (create them with the design system, test first). A component never writes `outline*`, `ring*` or its own `:focus-visible` / `[data-focus-visible]` ring; `src/design-system/layer-styles.test.ts` fails on any that does.

| The focused thing | Layer style | Why |
| --- | --- | --- |
| A box control — button, pill, chip, list-row link, card link, logo link, skip link | `layerStyle: 'focusRing'` | The ring is an absolutely positioned `::after` *inside* the box (`inset: 3px`), so an ancestor with `overflow: hidden \| clip \| auto` can never crop it |
| A text link that runs inside a sentence (prose) | `layerStyle: 'focusRingInline'` | An absolute pseudo cannot follow line boxes; prose is never inside an overflow clip, so a plain outline offset 2px outside the text is right |

```ts
// Good
export const chip = css({ display: 'inline-flex', rounded: 'control', layerStyle: 'focusRing' });
export const link = css({ textDecorationLine: 'underline', layerStyle: 'focusRingInline' });

// Bad — a ring of the component's own
export const chip = css({ '&:focus-visible': { outline: 'default', outlineOffset: '2px' } });
export const tag = css({ '&[data-focus-visible]': { ring: '1px', ringOffset: '2px' } });
```

- `_focusVisible` is `&:is(:focus-visible, [data-focus-visible])` (preset-base), so one layer style covers a native control and a react-aria-components one; do not add a `[data-focus-visible]` twin.
- A control that positions itself on focus (`srOnly` → `position: fixed`, e.g. the skip link) keeps its own `position` / `zIndex` in its reveal block; those outrank the layer style's, and the ring is still drawn inside the revealed box. That reveal block is the one `:focus-visible` block a component may keep, and it draws no ring.
- The stroke is `thin` (2px) in `focus.ring` (WCAG 2.4.13: at least a 2px perimeter). Change the geometry in `layer-styles.ts`, never per component.
