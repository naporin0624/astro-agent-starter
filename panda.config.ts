import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  preflight: true,
  // Stock theme is not loaded: tokens live in `src/design-system/` (primitive → semantic → textStyles).
  presets: ['@pandacss/preset-base'],
  include: ['./src/**/*.{ts,tsx,astro}'],
  exclude: ['./src/design-system/**'],
  outdir: 'styled-system',
  jsxFramework: 'react',
});
