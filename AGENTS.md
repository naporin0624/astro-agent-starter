## project setup rules

- pnpm で setup すること（`mise exec -- pnpm …`）
- Astro（static output）+ React islands を利用すること。ページは `src/pages` を薄いルートにし、本体は `src/features/<name>/index.astro` + `styles.css.ts` に置くこと
- react-aria-components, panda css を利用すること
  - design token は `src/design-system/`（primitive → semantic → textStyles）で管理し、コンポーネントは semantic 名だけを参照すること
- `vite` を package.json の直接の依存に入れないこと。Astro が内部に持つ vite を使う（`cf` は package.json を見て framework を判定する）
- deploy は `pnpm run deploy`（= `astro build && cf-wrangler build && cf deploy --prebuilt`）だけを使うこと
  - `run` を省かないこと。`pnpm deploy` は pnpm 自身の別コマンドになる
  - 素の `cf deploy`・`wrangler deploy`・`cf auth`・`whoami` 系は実行しないこと
  - `cloudflare.config.ts` に `accountId` を書かないこと
- `pnpm fmt` は `oxfmt --write` + `oxlint --fix`、`pnpm fmt:check` は `oxfmt --check`、`pnpm lint` は `oxlint --type-aware`、`pnpm typecheck` は `@typescript/native-preview`（tsgo）
- `.oxlintrc.json` は immutable / functional スタイルを強制する（`push` / `++` / `+=` / `.then` / `Promise.all` / 関数宣言 / モジュールのトップレベルの `let` / `Number(x)` は禁止）。緩めたい時は理由を確認し、グローバルではなく `overrides` で対象ファイルを絞ること
- 実装をする前にライブラリについて知らないことがある時は context7, web で調査してから進めること
- vitest を利用した TDD で実装すること（`pnpm test:run`。テストは実装と同じディレクトリに colocate する）
- husky の pre-commit で `pnpm typecheck && pnpm lint-staged` が走る。フックを skip して commit しないこと
- 勝手に commit しないこと
- アニメーションは gsap（`@gsap/react` の `useGSAP`）を利用すること。詳細は `.agents/skills/gsap-*` に従うこと
  - 止める手段（WCAG 2.2.2）・`prefers-reduced-motion`・WebGPU が無いときの表示は `.agents/rules/motion.md` に従うこと
- 写真は `photos/` に置き、`pnpm photos`（メタデータ削除・縮小）を通してから使うこと。表示は astro:assets の `<Image>` / `<Picture>`。詳細は `.agents/rules/images.md`
- 外の購読と DOM をつなぐ処理は presenter（`mountXxx(el)` / `useXxx()`）に置くこと。詳細は `.agents/rules/presenter.md`
- 実装は小さいタスクに分けて実装すること。実装が終わったら私に review 依頼すること
- review で繰り返し受けた内容は rules, skills にすることで永続化して
  - review の内容はまず memory に記憶して繰り返し指摘されるものは skills にすること

## comment rules

- `git blame` で 過去の commit の意図を理解すること
  - 変更の意図は blame で確認すること、コード中には書かない
- 関数の命名でわからないこと、context が複雑である場合のみコメントを書くこと
- 関数や、method は距離が近いことで意味論を共有できる。コメントを書きすぎることで距離が遠くなり、意味論を共有できなくなることに注意すること
- コメントは3行以内に収めること。
  - コメントを3行以上書きたい場合は以下を考える
    - 関数を分割すること
    - 関数の命名を変えること
    - 関数のライフタイムを小さくすること
- `<--- ここから --->` `<--- ここまで --->` と書かれている場合はその範囲は commit しないこと

## coding rules

- あなたは実装計画、ステークホルダーである私に対して要件のブレがなくなるまで AskUserQuestion で質問することに努め、実装は subagent に任せること
- 関数は単一責任で実装すること
- 同時に命令が複数来た時は Task で優先順位をつけて subagent に実装を任せること
- 詳細は `.agents/rules/*.md` に従うこと

## ui rules

- UI 全体で **WCAG 2.2 Level AA** を例外なしで満たすこと（色トークンに限らない）。詳細は `.agents/rules/accessibility.md` に従うこと
- UI は文脈に沿った内容にすること
  - 機械的なUIの利用は徹底的に避けること
  - 伝えたい情報はどんなものでその情報に適切な UI を常に考察、模索すること
  - ASCII ダイアグラムで提案すること
  - AskUserQuestion であなたが考えたパターンを私に提示してどれがいいか提案すること
- UI を作る時は以下の順番で実現を目指すこと。1が難しいなら2を2が難しいなら3をやる, 3 が難しいなら 4 をやる
  1. HTML + CSS で実装
  2. `react-aria-components` で実装
  3. 独自実装を行う前に UI の変更の提案をする
  4. 独自実装で UI を実装する
- リンクは `.astro` では `<a>`、React island の中では `react-aria-components` の Link を利用すること
- 静的な UI は `.astro` で書き、インタラクションが必要な最小範囲だけを React island（`client:load` / `client:only`）にすること
