import { defineConfig } from 'cf/config';

// accountId は書かない。CLOUDFLARE_ACCOUNT_ID か `cf auth login` の profile で渡す。
export default defineConfig({
  worker: {
    name: 'llm-series-03',
    compatibilityDate: '2026-09-25',
    assets: {
      notFoundHandling: '404-page',
    },
    // ページは astro.config.ts の base に合わせて /llm-series-03/ の下に出る。
    workersDev: true,
    previewUrls: false,
  },
});
