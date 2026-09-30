---
description: Presenter = the layer that connects outside subscriptions to the DOM. It is always a function you call; state lives inside it.
paths:
  - 'src/**/*.{ts,tsx,astro}'
---

# Presenter

A **presenter** is the layer that connects something outside (scroll, pointer, `matchMedia`, `requestAnimationFrame`, a gsap timeline, a WebGPU frame loop, a fetch) to the DOM. Everything else — formatting, choosing what to show, computing positions — is a pure function the presenter calls.

```
┌───────────────────────────────────────────────────────────┐
│  Caller: Astro <script> / island component                │
│  finds the element, calls mountXxx(el) / useXxx(ref)      │
├───────────────────────────────────────────────────────────┤
│  Presenter: mountXxx(el) or useXxx()                      │
│  subscribes, holds `let` state, writes to the DOM,        │
│  returns (or registers) one release function              │
├───────────────────────────────────────────────────────────┤
│  Pure functions (src/features/<name>/*.ts)                │
│  input → output, tested without a DOM                     │
└───────────────────────────────────────────────────────────┘
```

## The presenter is a function you call

| Where it runs | Shape | Where the `let` goes |
| --- | --- | --- |
| Astro `<script>` | `mountXxx(el): () => void` in `xxx.presenter.ts` next to the `.astro` | inside `mountXxx` |
| React island | `useXxx(...)` hook in `use-xxx.ts` next to the component; `useGSAP` / `useEffect` calls into it | inside the hook's effect callback |

The caller only finds the element and calls the function. It never declares state.

```astro
<!-- src/features/talk/progress.astro -->
<div data-progress></div>
<script>
  import { mountProgress } from './progress.presenter';

  const el = document.querySelector<HTMLElement>('[data-progress]');
  if (el !== null) mountProgress(el);
</script>
```

```typescript
// src/features/talk/progress.presenter.ts
import { toRatio } from './to-ratio';

export const mountProgress = (el: HTMLElement): (() => void) => {
  let frame = 0;
  const render = (): void => {
    el.style.setProperty('--progress', `${toRatio(window.scrollY, document.body.scrollHeight)}`);
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);
  return () => cancelAnimationFrame(frame);
};
```

```tsx
// src/features/talk/use-reveal.ts
export const useReveal = (scope: RefObject<HTMLElement | null>): void => {
  useGSAP(
    () => {
      const timeline = gsap.timeline({ paused: true });
      // build the timeline; gsap's context reverts it on unmount
    },
    { scope },
  );
};
```

## Rules

- **No module-level `let`, anywhere.** Not in `xxx.presenter.ts`, not in the Astro `<script>`, not in the island file. Lint: `let-scope/no-top-level-let` (oxlint also reads the `<script>` of `.astro` files).
- **`let` inside the presenter function is fine** — the frame ID, the latest pointer position, the active timeline. Its lifetime is the mount.
- **One value → `let`. Several resources to release → the array in `idempotent-cleanup.md`.** Never a `{ value }` box.
- **Return (or register) exactly one release.** `mountXxx` returns `() => void`; a hook releases through `useGSAP`'s context or the effect's cleanup. Calling the release twice must be safe.
- **Keep decisions out.** If a presenter grows an `if` about *what* to show, move that to a pure function next to it and test it.
- **`prefers-reduced-motion`**: a presenter that animates checks it (gsap `matchMedia`) and renders the final state without motion. The pause control (SC 2.2.2) and the static view without WebGPU are in `motion.md`.

## Testing

Test the pure functions with vitest (node). Test a presenter only when its wiring is the risk: mount it on a jsdom element, drive the event, assert the DOM, call the release, and assert the listener is gone.

## Related

- `functional-programming.md` — where `let` is allowed
- `idempotent-cleanup.md` — releasing several resources
- `react.md`, skill `gsap-react` — `useGSAP` and context cleanup
- `motion.md` — pause control, reduced motion, the static view without WebGPU
