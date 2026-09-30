---
description: Require TDD (Red-Green-Refactor) for utilities and components
paths:
  - 'src/**/*.{ts,tsx}'
  - 'tools/**/*.ts'
---

Code under `src/` (pure functions, components, presenters, cleanup factories) and `tools/` must be developed with TDD.

Invoke the `superpowers:test-driven-development` skill and follow the Red → Green → Refactor cycle.

- Place test files next to the implementation: `*.test.ts` / `*.test.tsx`
- Use vitest as the test runner: `pnpm test:run` for everything, `pnpm vitest run <path>` for a single file
- Show the failing run (Red) before writing the implementation
- Follow the progression: fake it → triangulate → obvious implementation
