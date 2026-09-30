---
name: modeling-errors-as-classes
description: Use when defining an error type, an error channel for a Result/ResultAsync, or a failure that crosses a throw / Promise rejection / serialization boundary — anything you would otherwise model as an object union like `{ name: 'XError'; message: string }`.
---

# Modeling Errors as Classes

## Overview

**An error is a class that `extends Error`, carries a `name` field, and is collected into an `ApplicationError` union. You discriminate it at the consumption edge with `instanceof` early-returns — never an object literal, never `switch (error.name)`.**

This is the project standard for the **error channel** of every `Result` / `ResultAsync` / `Observable<Result>`. It supersedes the object-union error representation (`{ name: 'ParseError'; message }`).

**Why a class, not an object literal:** a class instance survives a `throw`, a Promise rejection, and `Error.cause` chaining with a real stack trace. A plain `{ name }` object survives none of these — you cannot `instanceof` it after a `catch`, and it has no stack. Errors are exactly the values that cross throw boundaries, so they must be the values that survive them.

## When to use / not use

| Value | Representation | Discriminate with |
|---|---|---|
| **Error channel** (a failure: `Result<_, E>`, thrown, rejected) | **class `extends Error`** + `ApplicationError` union | **`instanceof` early-return** at the edge |
| Domain/UI **state** (asset kind, message control type, request status) | object discriminated union `{ kind: '...' }` | `switch` + inline `never` default (see [[branching-modeled-state-with-switch]]) |

The switch-with-never rule is for **non-error domain unions**. The error channel is the exception: it uses classes + `instanceof`. Don't apply `switch (error.name)` to errors.

## Define: class + name + ApplicationError union

Collect every error in one file (e.g. `src/lib/errors.ts`):

`name` は `Error.name` を上書きするので、このリポジトリ（`noImplicitOverride`）では **`override name`** が必須（無いと TS4114）。

```ts
// name は instanceof の「判別子」ではない — 判別は instanceof で行う。
// name は log / 表示 / JSON シリアライズ後の wire 判別子（後述）のための安定 ID。
export class NotFoundError extends Error {
  override name = 'NotFoundError';
}
export class ParseError extends Error {
  override name = 'ParseError';
}

// 追加フィールドが要るときだけ constructor を書く。無ければ Error の (message, { cause }) を継承し
// `new XError('msg', { cause })` がそのまま使える（Error.cause は ES2022）。
export class FetchError extends Error {
  override name = 'FetchError';
  constructor(
    readonly status: number,
    options?: { cause?: unknown },
  ) {
    super(`fetch failed: ${status}`, options);
  }
}

export class UnknownFeedError extends Error {
  override name = 'UnknownFeedError';
}

// 各機能ごとに、その edge が扱う失敗だけを集めた union を作る。
export type FeedError = NotFoundError | ParseError | FetchError | UnknownFeedError;
```

## Discriminate: instanceof early-return at the consumption edge

`.match` once at the edge (per [[chaining-neverthrow-results]]); the error branch is a chain of `if (error instanceof X) return ...` guard clauses, default last:

```ts
// src/features/feed/load-feed.ts
return loadFeed(url).match(
  (entries) => ({ kind: 'ready', entries }) as const,
  (error) => {
    console.error(error, error.cause); // cause / stack はここで使える
    if (error instanceof NotFoundError) return { kind: 'empty' } as const;
    if (error instanceof FetchError) return { kind: 'retryable', status: error.status } as const;
    return { kind: 'broken' } as const; // default fall-through (= ParseError / UnknownFeedError 含む想定外)
  },
);
```

## Throw boundaries (why classes earn their keep)

- **A throwing API (`fetch`, `JSON.parse` など):** wrap at the boundary and fold the throw into the channel as a class — `err(new FetchError(response.status, { cause }))`. The raw error rides in `cause`, never in what you render or serialize. See [[wrapping-throwing-apis-in-results]].
- **Promise rejection / `throw`:** because the error is a class, it keeps its stack and `instanceof` still works after it has been rethrown and caught again.
- **Across a serialization boundary (JSON, `postMessage`, storage):** instanceof works **only within one realm**. After serialization the class becomes a plain object, so the receiver discriminates on the serialized `name` string. That is exactly why every error keeps a stable `name` field even though in-process code uses `instanceof`.

## Common mistakes

| Mistake | Fix |
|---|---|
| `type E = { name: 'XError'; message: string }` for a failure | `class XError extends Error { override name = 'XError' }` |
| `name = 'XError'` without `override` (TS4114 under `noImplicitOverride`) | `override name = 'XError'` |
| `switch (error.name) { case 'XError': ... default: never }` | `if (error instanceof XError) return ...` early-return chain |
| Treating `name` as the discriminant in-process | Discriminant is the class (`instanceof`); `name` is for log / display / serialized wire |
| Storing the raw cause as a `cause: unknown` field on an object | `super(message, { cause })` — native `Error.cause` |
| `instanceof` checks scattered in the service layer | Discriminate once at the consumption edge (the island's hook, the page's `<script>`, a build-time loader); services return `Result<_, ApplicationError>` |
| Forgetting a final `return` for the unmatched case | Default fall-through after the `instanceof` chain (maps to the generic fallback / UnknownError) |

## Red flags — STOP

- Writing `{ name: '...Error'; message: string }` — that's an error; make it a class.
- Writing `switch (error.name)` over an error union — use `instanceof`.
- Reaching for the object-union pattern "to match an existing error" — new errors are classes.
