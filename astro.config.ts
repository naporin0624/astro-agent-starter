import react from '@astrojs/react';
import { wgslVitePlugin } from '@vgpu/wgsl/loader-vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  base: '/llm-series-03',
  // route がパスごと Worker に渡すので、assets 側にも同じ prefix のディレクトリを作る。
  outDir: './dist/llm-series-03',
  integrations: [react()],
  vite: {
    plugins: [wgslVitePlugin()],
  },
});
