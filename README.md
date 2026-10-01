# llm-series-03-starter

LLM 活用シリーズ 第三回の配布物です。

発表のライブデモで、Claude Code がこのリポジトリの上でこの発表のイベントのページを作り、Cloudflare に deploy しました。会場で映した `CLAUDE.md`、`.claude/rules/`、`.claude/skills/` は、ここにあるものと同じです。

`src/pages/` は空の状態で置いています。ページはデモで作りました。

## 最初の一歩

1. [Claude Code](https://code.claude.com/docs) を入れる
2. このリポジトリを clone する
   ```sh
   git clone https://github.com/naporin0624/llm-series-03-starter.git
   cd llm-series-03-starter
   mise exec -- pnpm install   # mise を使わないなら pnpm install
   ```
3. Claude Code を起動し、superpowers を入れる
   ```
   /plugin install superpowers@claude-plugins-official
   ```
4. 作りたいものを、自分の言葉で伝える。Claude Code が質問してくるので、答える

## そのままコピーせず、1 行から

ここにある `CLAUDE.md` と rules・skills は、自分が何度もレビューで言ったことを積み上げたものです。自分の手元では効いていますが、あなたのプロジェクトで同じように効くとは限りません。

- まず `CLAUDE.md` の中から、あなたが困っていることに当たる 1 行だけを持っていってください
- `CLAUDE.md` は、rules と skills と組になって効きます。`CLAUDE.md` だけを写しても、指している rule が無ければ効きません
- レビューで同じことを 2 回言ったら、それが次の 1 行です。skill にするときは superpowers の `writing-skills` で、テストを先に書いてから作ります

## ツールの 2 段

### 最初の一歩（誰でも。今日から）

| 道具                  | ここでの役目                                                                     |
| --------------------- | -------------------------------------------------------------------------------- |
| Claude Code           | 作業する本体                                                                     |
| superpowers（plugin） | 伝える → 質問させて spec にする → 小さいタスクに分ける → TDD、の流れを持ってくる |
| `AGENTS.md`           | 毎回言っていることを、最初から読ませる                                           |
| AskUserQuestion       | 作る前に、Claude に質問させる。要件のブレはここで消す                            |

`AGENTS.md` と `.agents/` が本体で、`CLAUDE.md` と `.claude` はそれを指す symlink です。Claude Code と Codex のどちらからも同じ約束が読まれます。

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
- 自分で使うときは、`cloudflare.config.ts` の worker 名と route、`astro.config.ts` の `base` / `outDir` を自分のものに変えてください

壇上のように output style を切りたいときは、`.agents/settings.local.json.example` を `.agents/settings.local.json` にコピーします。

## 第三者の skills

次の skills は、それぞれの公式リポジトリから `npx skills add` で取り込んだものです。版は `skills-lock.json`（中身のハッシュ）で固定しています。ライセンスはそれぞれのリポジトリのものに従います。

| skills                                                                                                                       | 出どころ                                                                                                                                                                            | commit                                     | ライセンス                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| gsap-core / gsap-frameworks / gsap-performance / gsap-plugins / gsap-react / gsap-scrolltrigger / gsap-timeline / gsap-utils | [greensock/gsap-skills](https://github.com/greensock/gsap-skills)（`npx skills add greensock/gsap-skills`）                                                                         | `aed9cfd3277740755f6bfc1155c7aa645403b760` | MIT, Copyright (c) 2026 GreenSock（各 skill の `LICENSE`）                               |
| vgpu                                                                                                                         | [vercel-labs/vgpu](https://github.com/vercel-labs/vgpu)（`npx skills add vercel-labs/vgpu`）                                                                                        | `341101abcf3c781721766bee6d03fc82c9d91f54` | MIT, Copyright (c) 2025 Vercel, Inc.（`.agents/skills/vgpu/LICENSE`）                    |
| security-audit                                                                                                               | [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill)（`npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit`） | `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` | MIT, Copyright (c) 2025-2026 Cloudflare, Inc.（`.agents/skills/security-audit/LICENSE`） |

それ以外の rules と skills は、自分（naporitan）が自分のプロジェクトのために書いたものを、公開用に書き直したものです。
