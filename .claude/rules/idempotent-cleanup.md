---
description: Resources acquired now and released later are collected in an array (push) and released with for-of + length = 0, in a *.cleanup.ts file
paths:
  - 'src/**/*.{ts,tsx,astro}'
---

# Idempotent Cleanup via Array Push

クロージャやファクトリの中で「取得 → あとで解放」する resource は、`let` の再代入や `{ value: T }` ラッパーではなく、**`const xs: T[] = []` への push** で管理する。

解放が構造的に冪等になり、件数 0 / 1 / N で同じコードになる。

## Where: `*.cleanup.ts` only

`push` はリポジトリ全体では lint で禁止している（`no-restricted-properties`）。このパターンだけは `.oxlintrc.json` の `overrides` で許可していて、許可されるのは **`src/**/*.cleanup.ts`** だけ。

- 置き場: 使う presenter の隣。`src/features/<name>/<name>.cleanup.ts`（複数の feature で使うものは `src/lib/<name>.cleanup.ts`）
- 中身: resource を集めて解放する factory だけ。DOM に書く処理や、何を表示するかの判断は入れない
- presenter（`presenter.md`）はこの factory を呼び、返ってきた release を自分の release にする

```
src/features/talk/
├── index.astro
├── progress.presenter.ts      ← mountProgress(el)。let はここ
├── listeners.cleanup.ts       ← createListeners()。push はここだけ
└── to-ratio.ts                ← 純粋関数
```

## When to use

- **Unsubscriber をまとめる**: `subscribe()` / `addEventListener` の解除関数を、あとでまとめて呼ぶ
- **Disposable の集合**: `ResizeObserver`、`IntersectionObserver`、gsap の context、vgpu の resource
- **AbortController 群**: 複数の fetch を、あとで一括で abort する

presenter や factory に `let unsubscribe: ... | undefined` や `{ value: T | null }` が出てきたら、この rule に従って array push に書き換え、`*.cleanup.ts` に移す。

「取得してあとで解放する」構造を持たない値（カウンタ、単発のタイマー ID、最新値の参照）は対象外。そちらは `let` でよい（`functional-programming.md`）。

## Principle

> 代入ではなく array push による冪等管理を目指す。

1. `const xs: T[] = []` で領域を作る
2. 取得したら `xs.push(resource)`
3. 解放は `for (const x of xs) x(); xs.length = 0;`

これだけで解放が冪等になり、null チェック・undefined チェック・`removed` フラグが要らなくなる。

## Pattern

```typescript
// ✅ src/features/talk/listeners.cleanup.ts
export const createListeners = () => {
  const offs: (() => void)[] = [];

  const listen = <K extends keyof WindowEventMap>(type: K, handler: (event: WindowEventMap[K]) => void): void => {
    window.addEventListener(type, handler, { passive: true });
    offs.push(() => window.removeEventListener(type, handler));
  };

  const release = (): void => {
    for (const off of offs) off();
    offs.length = 0; // 2 回目の release は何もしない
  };

  return { listen, release };
};
```

```typescript
// ✅ src/features/talk/progress.presenter.ts
import { createListeners } from './listeners.cleanup';

export const mountProgress = (el: HTMLElement): (() => void) => {
  const listeners = createListeners();
  listeners.listen('scroll', () => el.style.setProperty('--y', `${window.scrollY}`));
  listeners.listen('resize', () => el.style.setProperty('--h', `${window.innerHeight}`));
  return listeners.release;
};
```

```typescript
// ❌ let による単一スロットの再代入
let unsubscribe: (() => void) | undefined;
// ...
if (unsubscribe !== undefined) {
  unsubscribe();
  unsubscribe = undefined; // null clear が要る
}

// ❌ { value: T } ラッパー（lint: let-scope/no-value-box）
const offRef: { value: (() => void) | null } = { value: null };
const removed = { value: false }; // 二重呼び出しのガードまで生えがち
```

## Why

| 観点 | array push | let 再代入 | `{ value: T }` ラッパー |
| --- | --- | --- | --- |
| 冪等性 | `length = 0` で確保 | undefined チェックが要る | null チェックが要る |
| 0 / 1 / N で同じコード | ○ | ×（件数ごとに分岐） | ×（件数ごとに分岐） |
| 二重解放が安全 | 空の配列なので何もしない | null チェックが要る | フラグを足しがち |
| 意図の読みやすさ | 「集めて全部閉じる」 | 「1 つの slot を上書き」 | 「const を強制した hack」 |

## Variant: AbortController 群

```typescript
// ✅ src/lib/requests.cleanup.ts
export const createRequests = () => {
  const controllers: AbortController[] = [];

  const signal = (): AbortSignal => {
    const controller = new AbortController();
    controllers.push(controller);
    return controller.signal;
  };

  const abortAll = (): void => {
    for (const controller of controllers) controller.abort();
    controllers.length = 0;
  };

  return { signal, abortAll };
};
```

個別に外すときは `splice(indexOf, 1)`、全部閉じるときは `length = 0`。どちらも冪等。

## Decision

```
取得した resource を、あとで解放するか?
├── Yes → *.cleanup.ts に array push + for-of + length = 0
└── No
    └── 単一値の mutation か?（カウンタ / タイマー / 最新値）
        ├── Yes → 関数の中の let（functional-programming.md）
        └── No  → const + 関数合成 / 早期 return
```

## Related

- `functional-programming.md` — `let` を置いてよい場所
- `presenter.md` — cleanup factory を呼ぶ側
- `design-principles.md` — Factory DI / CQS（command が解放関数を返す）
