# Coding Rules

## Package Management

- Install modules: `mise exec -- pnpm add <package>`
- Uninstall modules: `mise exec -- pnpm remove <package>`

## TypeScript Configuration

- **DO NOT modify** `tsconfig.json` `paths` settings (`styled-system/*` is the only alias)
- If path changes are needed, use `AskUserQuestion` to discuss first

## Development Scripts

| Command           | Description                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| `pnpm dev`        | Astro dev server on :4321                                                |
| `pnpm build`      | Production build (`astro build` → `dist/llm-series-03/`)                 |
| `pnpm preview`    | Serve the production build                                               |
| `pnpm photos`     | Strip EXIF / XMP / IPTC from `photos/` and shrink the long edge to 2400px, in place (`.agents/rules/images.md`) |
| `pnpm photos:check` | Fail if a photo in `photos/` still carries metadata (also run by lint-staged) |
| `pnpm test:run`   | vitest (colocated `*.test.ts(x)`)                                        |
| `pnpm typecheck`  | Type check with `@typescript/native-preview` (tsgo)                      |
| `pnpm lint`       | Lint with oxlint (`--type-aware`, plus the JS plugins in `tools/`)       |
| `pnpm fmt`        | `oxfmt --write` + `oxlint --fix`                                         |
| `pnpm fmt:check`  | Verify formatting                                                        |
| `pnpm check:wgsl` | `vgpu check` on every file in `src/shaders/`                             |
| `pnpm run deploy` | `astro build && cf-wrangler build && cf deploy --prebuilt` — the only deploy command |

## Deploy

- Deploy only with `pnpm run deploy`. Write `run`: a bare `pnpm deploy` is pnpm's own built-in command, not this script. Never run a bare `cf deploy` (without `--prebuilt` it detects Astro, looks for a Build Output that a static build never writes, and fails), never `wrangler deploy`, never `cf auth`.
- `cloudflare.config.ts` holds the worker name and route. It never holds `accountId`; the account comes from `CLOUDFLARE_ACCOUNT_ID` or the logged-in `cf` profile.
- Do not add `vite` as a direct dependency. `cf` looks at `package.json` to detect the framework; Astro already ships its own vite.

## After Implementation

**MUST run before completing any implementation task:**

```bash
pnpm fmt && pnpm lint && pnpm typecheck && pnpm test:run && pnpm build
```

Do NOT use `npx tsc` or `pnpm tsc` directly. Always use `pnpm typecheck`.

## Promise Handling in Handlers

**FORBIDDEN**: `.then()` / `.catch()` / IIFE in event handlers

**REQUIRED**: Make the handler `async` directly

```typescript
// Correct
const handleClick = useCallback(async () => {
  try {
    await asyncOperation();
  } catch (error) {
    console.error(error);
  }
}, []);

// Forbidden: .then/.catch
const handleClick = useCallback(() => {
  asyncOperation().then(setData).catch(setError);
}, []);
```

See: @.agents/rules/react.md#async-handler-rules-no-thencatch

## Tech Stack

- **Framework**: Astro 7 (static output) with React 19 islands
- **UI**: Panda CSS (design system preset in `src/design-system/`) + react-aria-components
- **Motion**: GSAP (`ScrollTrigger`, `gsap.quickTo`, `gsap.ticker` as the single frame loop)
- **Rendering**: WebGPU via `vgpu`; WGSL in `src/shaders/` (see `shader-files.md`)
- **Errors**: neverthrow `Result` (skills `chaining-neverthrow-results`, `modeling-errors-as-classes`)
- **Build / Deploy**: `astro build` → `cf-wrangler build` → `cf deploy --prebuilt` (Cloudflare Workers Static Assets, route `talks.napochaan.dev/llm-series-03*`)
- **Test**: vitest (+ jsdom and Testing Library for components)
- **Lint**: oxlint (`.oxlintrc.json`, functional/immutable rules) — run via husky pre-commit too
- **Formatting**: oxfmt
- **Type Check**: @typescript/native-preview (tsgo) + `astro check`

## Loops

Iterate with `for (const item of items)` (or `for (const [i, item] of items.entries())` when the index is needed). Do not use `.forEach`. Transformations stay `map`/`filter`/`reduce`.
