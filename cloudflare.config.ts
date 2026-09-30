import { defineConfig, triggers } from 'cf/config';

// accountId は書かない。CLOUDFLARE_ACCOUNT_ID か `cf auth login` の profile で渡す。
export default defineConfig({
  worker: {
    name: 'llm-series-03',
    compatibilityDate: '2026-09-25',
    assets: {
      notFoundHandling: '404-page',
    },
    // パスで分けるので Custom Domain ではなく zone の route。zone は deploy するアカウントに必要。
    triggers: [triggers.fetch({ pattern: 'talks.napochaan.dev/llm-series-03*', zone: 'napochaan.dev' })],
    workersDev: false,
    previewUrls: false,
  },
});
