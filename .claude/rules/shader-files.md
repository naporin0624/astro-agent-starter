---
description: WGSL shaders must be separate .wgsl files under src/shaders, imported through the vgpu loader
paths:
  - 'src/**/*.{ts,tsx}'
---

## Shader Code Organization

Always keep WGSL in separate `.wgsl` files. Never embed shaders as string literals or generate them in TypeScript.

### Location

```
src/shaders/
  background.wgsl     ← effect entry (declares @group/@binding)
  particles.wgsl      ← compute entry (declares @group/@binding)
  color.wgsl          ← shared functions only (no bindings)
  fit.wgsl            ← shared functions only (no bindings)
```

### Import

Import through the vgpu Vite loader (typed via `src/env.d.ts`); the default export is a `ShaderSource` object, pass it straight to `draw()` / `effect()`:

```ts
// Good
import backgroundWgsl from './shaders/background.wgsl';
const background = effect(gpu, { shader: backgroundWgsl });
```

### Shared Functions

Extract reusable WGSL (colour space, sampling, hashes) into modules and import them with WGSL module syntax; modules export functions/structs only — bindings stay in the entry shader. Shared modules (`color.wgsl`, `fit.wgsl` above) hold functions only; entry shaders (`background.wgsl`, `particles.wgsl`) declare the bindings:

```wgsl
import { toLinear } from "./color.wgsl";
```

### Validation

Run `pnpm check:wgsl` (= `vgpu check` on every file in `src/shaders/`) after editing; validation must report `ok: true` with no diagnostics. Verify the rendered result in the browser preview before guessing.

### Anti-patterns

```ts
// Bad — inline string literal
const shader = `@fragment fn fs_main() -> @location(0) vec4f { ... }`;

// Bad — template-based generation (breaks static analysis and vgpu reflection)
const makeShader = (name: string) => `@group(0) @binding(0) var<uniform> ${name}: ...`;

// Bad — dynamic runtime loading
const shader = await fetch('/shaders/custom.wgsl').then((r) => r.text());
```

Uniform structs are reflected by name: keep member order stable and set every binding before drawing.
