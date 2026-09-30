---
description: Motion (gsap, vgpu / WebGPU, CSS animation) must be stoppable (SC 2.2.2), honour prefers-reduced-motion, fall back to a static view without WebGPU, and never require a drag or a pointer
paths:
  - 'src/**/*.{astro,ts,tsx}'
  - 'src/shaders/**'
---

# Motion

動きは飾り。情報は、動かなくても・WebGPU が無くても・キーボードだけでも、全部たどり着ける形で先に置く。動きはその上に足す。

```
┌──────────────────────────────────────────────────────────────┐
│ 1. 静的な一覧（.astro）  <Picture alt> の <ul>。いつでも出す     │  ← 情報はここ
├──────────────────────────────────────────────────────────────┤
│ 2. gsap の動き           reduce のときは最終状態で止まって描く   │
├──────────────────────────────────────────────────────────────┤
│ 3. vgpu の canvas        navigator.gpu と init() が通ったときだけ │  ← aria-hidden
└──────────────────────────────────────────────────────────────┘
        どの層が動いていても「止める」ボタンで 2 と 3 が止まる
```

## SC 2.2.2 Pause, Stop, Hide — 止める手段を出す

自動で動き始めて 5 秒を超えるもの（自動で送るスライドショー、ループする shader、流れ続ける帯、ゆっくり寄る写真）には、**止めるボタン**を出す。

- 本物の `<button>`（island なら react-aria-components の `ToggleButton` / `Button`）。名前は状態に合わせて変える（「動きを止める」⇄「動きを再開する」）か、`aria-pressed` を持たせる（SC 4.1.2）
- 動くものより DOM で前に置く。キーボードで最初に届く位置にする
- 止めたら本当に止める: gsap は timeline の `pause()`、vgpu は frame loop を止める（canvas を隠すだけ、速度を落とすだけは止めたことにならない）。再開は止めた所から
- 大きさは target の最小トークン（24×24 CSS px 以上、SC 2.5.8）、フォーカスリングは `focus-ring.md`
- 1 秒に 3 回を超える点滅は作らない（SC 2.3.1）。写真の切り替えはフェードかスライドにする
- 5 秒以内に止まる動き（表示時の一度きりの登場）は止める手段が要らない。ただし reduce には従う

## `prefers-reduced-motion: reduce` — 止めるか、弱める

gsap は `gsap.matchMedia()` の conditions で分ける（skill `gsap-core` の「Accessibility and responsive」）。island では `useGSAP` の中で作り、cleanup で `mm.revert()` する。matchMedia の中に `gsap.context()` を入れ子にしない。

```tsx
// src/features/<name>/use-gallery-motion.ts — presenter（presenter.md）
export const useGalleryMotion = (scope: RefObject<HTMLElement | null>, paused: boolean): void => {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (context) => {
        if (context.conditions?.reduce === true) return; // 最終状態のまま描く。自動で送らない
        const timeline = gsap.timeline({ repeat: -1, paused });
        // timeline を組む
      }, scope);
      return () => mm.revert();
    },
    { scope, dependencies: [paused], revertOnUpdate: true },
  );
};
```

- reduce のとき: 自動で送らない・ループしない・視差をやめる。登場の動きは `duration: 0` にして最終状態を出す
- CSS の `animation` / `transition` も `@media (prefers-reduced-motion: reduce)` で止める
- vgpu: reduce のときは frame loop を回さない。静的な一覧（下）だけを見せるか、1 フレームだけ描いて止める
- 止めるボタンの状態と reduce は同じ「止まっている」状態に合流させる。reduce の人は最初から止まっている（ボタンは「再開する」を出す）

## WebGPU が無いとき — 同じ写真を静的に見せる

vgpu の canvas は、静的な一覧の**上に足す**だけ。一覧を消して canvas だけにしない。

- 判定は 2 段: `'gpu' in navigator` が無ければ canvas を作らない。あっても `init()` は adapter が取れないと `VGPU-RING1-UNSUPPORTED` で throw するので、try/catch で `Result` にして（skill `wrapping-throwing-apis-in-results`）失敗も「WebGPU なし」に倒す
- どちらを出すかは純粋関数で決め、テストする。presenter は外の値を集めて渡すだけ（presenter.md「Keep decisions out」）

```ts
// src/features/<name>/to-gallery-mode.ts
export type GalleryMode = 'webgpu' | 'static';
export const toGalleryMode = ({ hasGpu, reducedMotion }: { readonly hasGpu: boolean; readonly reducedMotion: boolean }): GalleryMode =>
  hasGpu && !reducedMotion ? 'webgpu' : 'static';
```

```ts
// src/features/<name>/gpu-gallery.presenter.ts — Astro の <script> からは mountGpuGallery(el) を呼ぶだけ
export const mountGpuGallery = (el: HTMLElement): (() => void) => {
  let stop = (): void => {};
  // navigator.gpu を見て、init() の Result を見て、toGalleryMode で決めてから canvas を足す
  return () => stop();
};
```

- canvas は `aria-hidden="true"`。写真の意味（alt）は静的な一覧が持つ（SC 1.1.1、`images.md`）
- 静的な一覧は canvas の有無で DOM から消さない。見た目で重ねるときも、スクリーンリーダーとキーボードには一覧が残る
- `let` は presenter の関数の中だけ（モジュールのトップレベルに置かない）。解放するものが複数なら `idempotent-cleanup.md`

## SC 2.1.1 / 2.5.7 — キーボードだけで、ドラッグなしで

- 写真を送る・拡大する・閉じるは、すべてボタン（またはリンク）で届く。スワイプやドラッグは、同じことができるボタンがあるときの**追加**だけ
- 矢印キーで送るなら、それはボタンに加えて。フォーカスが canvas に閉じ込められない
- 拡大表示を出すなら react-aria-components の `Modal` / `Dialog`（Esc で閉じる、フォーカスが戻る）
- 自動で送っていても、キーボードで操作した写真から勝手に動かない（操作したら自動送りを止める）

## Tests

- `toGalleryMode` など、決める関数は vitest（node）で全部の組み合わせを
- 止めるボタン: jsdom で描き、`getByRole('button', { name })` が見つかること、押すと名前か `aria-pressed` が変わること、timeline の `paused()` が true になること
- キーボード: `@testing-library/user-event` で Tab と Enter / Space だけを使い、写真を送れること
- `matchMedia` と `navigator.gpu` は jsdom に無いので、テストでは差し込む（`vi.stubGlobal`）。vgpu 本体はテストで `vgpu/mock` を使う

## Related

- `accessibility.md` — SC 2.2.2・2.1.1・2.5.7・2.5.8 の表（この rule はその動きの部分の詳しい版）
- `presenter.md` — `mountXxx(el)` / `useXxx()`、reduce のときは最終状態を描く
- `images.md` — 写真の置き場と `<Picture>`・alt
- skills `gsap-core`（matchMedia）、`gsap-react`（useGSAP）、`vgpu`
