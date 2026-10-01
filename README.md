# astro-agent-starter

「事業開発に活きる 生成AI講座 第3回 — ソフトウェアエンジニアの、AI の扱い方」の配布物です。

発表のライブデモでは、Claude Code がこのリポジトリの上で、この発表のイベントのページを作って Cloudflare に deploy しました。会場で映した指示書（`CLAUDE.md`）、rules、skills は、ここにあるものと同じです。

- `src/pages/` は空にしてあります。ページはデモの中で作りました
- ページに載せる中身は `docs/talk.md` にあります。同じことを試すときの材料にしてください

## 最初の一歩

必要なもの: [mise](https://mise.jdx.dev/)（Node 24 と pnpm 12 を `mise.toml` で固定しています）と、Claude Code か Codex。

1. clone して依存を入れる
   ```sh
   git clone https://github.com/naporin0624/astro-agent-starter.git
   cd astro-agent-starter
   mise install
   mise exec -- pnpm install   # mise を使わないなら pnpm install
   ```
2. Claude Code を起動し、superpowers を入れる
   ```
   /plugin install superpowers@claude-plugins-official
   ```
3. 作りたいものを、自分の言葉で伝える。Claude Code が質問してくるので、答える

Codex で使うときも、同じ指示書と skills が読まれます（`AGENTS.md` と `.agents/` が本体で、`CLAUDE.md` と `.claude` はそこを指す symlink です）。

## そのままコピーせず、1 行から

ここにある `AGENTS.md` と rules・skills は、自分が何度もレビューで言ったことを積み上げたものです。自分の手元では効いていますが、あなたのプロジェクトで同じように効くとは限りません。

- まず `AGENTS.md` の中から、あなたが困っていることに当たる 1 行だけを持っていってください
- `AGENTS.md` は、rules と skills と組になって効きます。`AGENTS.md` だけを写しても、指している rule が無ければ効きません
- レビューで同じことを 2 回言ったら、それが次の 1 行です。skill にするときは superpowers の `writing-skills` で、テストを先に書いてから作ります

## 中身の地図

```
.
├── AGENTS.md                  毎回言っていること（指示書の本体）
├── CLAUDE.md -> AGENTS.md     Claude Code 用の入口
├── .agents/
│   ├── rules/                 書き方の約束。対象のファイルを触ったときに読まれる
│   ├── skills/                手順と判断のしかた。必要になったときに読まれる
│   ├── settings.json          Claude Code の permissions と plugin
│   └── settings.local.json.example
├── .claude -> .agents         Claude Code 用の入口
├── .claude-plugin/
│   └── marketplace.json       自作の skills を plugin として配る
├── plugins/<plugin>/skills/   .agents/skills/ への symlink（marketplace 用）
├── docs/talk.md               イベントのページに載せる中身
├── photos/                    写真の置き場（pnpm photos を通してから使う）
├── src/pages/                 空。ここにページを作る
├── tools/
│   ├── oxlint-plugins/        lint の自作ルール（トップレベルの let、Number(x) など）
│   └── photos/                写真のメタデータを消して縮める CLI
├── astro.config.ts            Astro（static）+ React islands
├── panda.config.ts            Panda CSS。token は src/design-system/ に置く
└── cloudflare.config.ts       deploy 先の Worker 名（workers.dev に出す）
```

## ツールの 2 段

### 最初の一歩（誰でも。今日から）

| 道具                  | ここでの役目                                                                     |
| --------------------- | -------------------------------------------------------------------------------- |
| Claude Code / Codex   | 作業する本体                                                                     |
| superpowers（plugin） | 伝える → 質問させて spec にする → 小さいタスクに分ける → TDD、の流れを持ってくる |
| `AGENTS.md`           | 毎回言っていることを、最初から読ませる                                           |
| AskUserQuestion       | 作る前に、Claude に質問させる。要件のブレはここで消す                            |

### 仕組みで守らせる（言っても守られないものを、機械で止める）

| 道具                                                 | ここでの役目                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `.agents/rules/`                                     | 書き方の約束。対象のファイルを触ったときに読まれる                                         |
| `.agents/skills/`                                    | 手順と判断のしかた。必要になったときに読まれる                                             |
| oxlint（`.oxlintrc.json` + `tools/oxlint-plugins/`） | 約束のうち、機械で判定できるものを止める（`push`、トップレベルの `let`、`Number(x)` など） |
| oxfmt                                                | 整形                                                                                       |
| tsgo（`@typescript/native-preview`）                 | 型チェック                                                                                 |
| vitest                                               | テスト。TDD の「落ちて、通る」を見る                                                       |
| husky + lint-staged                                  | commit の前に型チェックと lint を必ず通す                                                  |
| `.agents/settings.json` の permissions               | deploy は毎回確認、危ないコマンドは実行させない                                            |

そのほかの plugin（`.agents/settings.json` の `enabledPlugins`、すべて `claude-plugins-official`）: learning-output-style、explanatory-output-style、context7、code-simplifier、frontend-design、typescript-lsp、security-guidance。

壇上のように output style を切りたいときは、`.agents/settings.local.json.example` を `.agents/settings.local.json` にコピーします。

## skills だけ欲しいとき

自分で書いた skills は、このリポジトリを marketplace（`napochaan-skills`）にして plugin として配っています。starter を clone しなくても、必要なテーマだけ入れられます。

```sh
claude plugin marketplace add naporin0624/astro-agent-starter
claude plugin install typescript-modeling@napochaan-skills
```

| plugin                | 入っている skills                                                                                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typescript-modeling` | precise-type-modeling、branching-modeled-state-with-switch、switch-pattern、explicit-primitive-conversion、prefix-match-processor、chaining-neverthrow-results、modeling-errors-as-classes、wrapping-throwing-apis-in-results |
| `web-perf`            | debugging-cumulative-layout-shift、diagnosing-missing-edge-compression                                                                                                                                                        |
| `workflow`            | smart-commit、file-colocation                                                                                                                                                                                                 |

- `workflow` の file-colocation は、このリポジトリの構成（Astro + React islands + Panda CSS）が前提です
- `plugins/<plugin>/skills/` は `.agents/skills/` への symlink です。install のときに実体がコピーされます
- 第三者の skills（下の表）は含めていないので、それぞれの配布元から入れてください

## 開発のコマンド

| コマンド            | やること                                           |
| ------------------- | -------------------------------------------------- |
| `pnpm dev`          | 開発サーバー（:4321）                              |
| `pnpm build`        | build（`dist/llm-series-03/` に出る）              |
| `pnpm preview`      | build したものを見る                               |
| `pnpm test:run`     | vitest。テストは実装と同じディレクトリに置く       |
| `pnpm typecheck`    | tsgo で型チェック                                  |
| `pnpm lint`         | oxlint（`--type-aware`）                           |
| `pnpm fmt`          | oxfmt で整形し、oxlint で直せるものを直す          |
| `pnpm fmt:check`    | 整形の確認だけ                                     |
| `pnpm photos`       | `photos/` の写真のメタデータを消して縮める         |
| `pnpm photos:check` | メタデータが残った写真がないかを確かめる           |
| `pnpm check:wgsl`   | `src/shaders/` の WGSL を `vgpu check` にかける    |
| `pnpm run deploy`   | Cloudflare に deploy（下の「deploy」を読んでから） |

commit のときは husky が `pnpm typecheck` と lint-staged（oxlint、oxfmt の確認、写真のメタデータの確認）を走らせます。通らないと commit できません。

## 写真を入れるとき

写真は `photos/` に置きます（`public/` ではありません）。入れたら、commit の前に次を走らせます。

```sh
mise exec -- pnpm photos
```

- EXIF・XMP・IPTC（GPS・端末名・撮影日時）を消し、向きを画素に焼き、長辺を 2400px 以下に縮めて、同じ場所に書き戻します
- HEIC は読めないので止まります。JPEG に書き出してから入れ直してください（iPhone なら 設定 > カメラ > フォーマット > 互換性優先）
- メタデータが残った写真があると、`pnpm test:run` が落ち、commit もできません（lint-staged が `pnpm photos:check` を走らせます）。公開リポジトリの履歴に GPS を残さないためです
- 顔が写った写真は入れません。これは機械では止められないので、入れる人が見て決めます

ページでは astro:assets の `<Image>` / `<Picture>` で表示し、build のときに縮小・変換されます。書き方は `.agents/rules/images.md` にあります。

## deploy

```sh
pnpm run deploy   # astro build && cf-wrangler build && cf deploy --prebuilt
```

- `run` を省かないでください。`pnpm deploy` は pnpm 自身の別コマンドです
- 素の `cf deploy`（`--prebuilt` なし）は、Astro の static を deploy できません
- `cf` はベータなので `1.0.0-beta.5` に固定しています
- アカウントは `cf auth login` のプロファイルか、`CLOUDFLARE_ACCOUNT_ID` で渡します。`cloudflare.config.ts` には書きません
- deploy 先は `https://llm-series-03.<あなたのサブドメイン>.workers.dev/llm-series-03/` です（`astro.config.ts` の `base` の下に出ます）
- 自分のドメインに出すときは、`cloudflare.config.ts` に route を足し、`astro.config.ts` の `base` / `outDir` を合わせてください

## 第三者の skills

次の skills は、それぞれの公式リポジトリから `npx skills add` で取り込んだものです。版は `skills-lock.json`（中身のハッシュ）で固定しています。ライセンスはそれぞれのリポジトリのものに従います。

| skills                                                                                                                       | 出どころ                                                                                                                                                                            | commit                                     | ライセンス                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| gsap-core / gsap-frameworks / gsap-performance / gsap-plugins / gsap-react / gsap-scrolltrigger / gsap-timeline / gsap-utils | [greensock/gsap-skills](https://github.com/greensock/gsap-skills)（`npx skills add greensock/gsap-skills`）                                                                         | `aed9cfd3277740755f6bfc1155c7aa645403b760` | MIT, Copyright (c) 2026 GreenSock（各 skill の `LICENSE`）                               |
| vgpu                                                                                                                         | [vercel-labs/vgpu](https://github.com/vercel-labs/vgpu)（`npx skills add vercel-labs/vgpu`）                                                                                        | `341101abcf3c781721766bee6d03fc82c9d91f54` | MIT, Copyright (c) 2025 Vercel, Inc.（`.agents/skills/vgpu/LICENSE`）                    |
| security-audit                                                                                                               | [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill)（`npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit`） | `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` | MIT, Copyright (c) 2025-2026 Cloudflare, Inc.（`.agents/skills/security-audit/LICENSE`） |

それ以外の rules と skills は、自分（naporitan）が自分のプロジェクトのために書いたものを、公開用に書き直したものです。
