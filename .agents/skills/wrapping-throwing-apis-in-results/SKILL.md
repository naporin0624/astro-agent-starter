---
name: wrapping-throwing-apis-in-results
description: Use when a synchronous throwing API (JSON.parse, new URL, localStorage, structuredClone, a parser library) has to become a neverthrow Result — about to reach for Result.fromThrowable or a try/catch, writing a lookup that returns `T | undefined`, or needing the failed call's own arguments in the error message.
---

# Wrapping Throwing APIs in Results

## Overview

The boundary where a throwing call becomes a `Result` is where the leaks happen: a `throw` escaping, a `T | undefined` maybe escaping, or an error built without the context to describe itself. This skill fixes the boundary.

**The project convention is a named arrow function with try/catch returning `ok`/`err` — NOT `Result.fromThrowable`.** (Legacy `fromThrowable` sites migrate opportunistically — convert the ones you touch, leave the rest.)

For what to do with Results afterwards see [[chaining-neverthrow-results]]; for the error types themselves see [[modeling-errors-as-classes]].

## The shape

```ts
const parseJson = (text: string): Result<unknown, ParseError> => {
  try {
    return ok(JSON.parse(text));
  } catch (e) {
    return err(new ParseError('invalid JSON', { cause: e }));
  }
};
```

- Named arrow function, **explicit return type** `Result<T, XError>` — the annotation is what keeps the error channel a typed union instead of widening.
- `catch (e)` — `e` is `unknown`; put it in `cause`, and build a specific error inline.
- One throwing call (or one tightly-coupled statement group) per wrapper. Single responsibility applies here too.

## Why not fromThrowable

Two of `fromThrowable`'s structural traps simply do not exist in a try/catch:

1. **The mapper sees the call's arguments.** `Result.fromThrowable(fn, map)` fixes `map` at definition time — it only ever receives the thrown value. A catch clause lives inside the function's own scope, so context-bearing errors need no curried `toXError(arg)` helper and no `.mapErr` at the call site:

```ts
const toUrl = (raw: string, base: string): Result<URL, InvalidUrlError> => {
  try {
    return ok(new URL(raw, base));
  } catch (e) {
    // catch は raw が見えるスコープにあるので、何が壊れていたかをその場でエラーに入れられる
    return err(new InvalidUrlError(raw, { cause: e }));
  }
};
```

2. **No IIFE hazard.** `Result.fromThrowable(fn, map)()` builds a function and calls it on the spot — banned by lint. try/catch needs no hoisting ceremony; it composes inline anywhere.

## The trap that remains: `T | undefined` escaping

A lookup returns `value | undefined` (or `null`). Handing that maybe onward makes every caller unwrap it. With try/catch, the fold happens **in the same function** as the read — no separate reader/require pair:

```ts
// ✅ read, absence-fold, and throw-mapping in ONE function. `null` never leaves the body.
const requireStoredTheme = (storage: Storage): Result<string, NotFoundError | StorageError> => {
  try {
    const value = storage.getItem('theme');
    return value !== null ? ok(value) : err(new NotFoundError('theme'));
  } catch (e) {
    // localStorage throws when storage is blocked (privacy mode, sandboxed iframe)
    return err(new StorageError('theme', { cause: e }));
  }
};
```

Keeping absence a `NotFoundError` (not a bare `null`) is what lets a caller tell "nothing stored" apart from "storage itself failed" — e.g. the caller recovers only `NotFoundError` via `.orElse` (fall back to the system theme) and re-propagates `StorageError`.

**Absence is not always NotFound.** In an availability check the missing value IS the success:

```ts
// ✅ the mirror image — nothing dismissed yet, so absence resolves ok
const requireNotDismissed = (storage: Storage, key: string): Result<void, AlreadyDismissedError | StorageError> => {
  try {
    return storage.getItem(key) === null ? ok(undefined) : err(new AlreadyDismissedError(key));
  } catch (e) {
    return err(new StorageError(key, { cause: e }));
  }
};
```

Name the function for what it requires (`requireX`, `requireNotX`), not for what it fetches (`findX`) — the name is what tells the next reader which polarity applies.

## Never throw a Result's error to re-catch it

```ts
// ❌ builds a Result, throws its error, and catches it one line later
const saveTheme = (storage: Storage, theme: string): Result<void, ThemeError> => {
  try {
    const validated = validateTheme(theme);
    if (validated.isErr()) throw validated.error;
    storage.setItem('theme', theme);
    return ok(undefined);
  } catch (e) { ... }
};

// ✅ stages compose; each one wraps its own throw
const saveTheme = (storage: Storage, theme: string): Result<void, ThemeError> =>
  validateTheme(theme).andThen(() => writeTheme(storage, theme));
```

The try block wraps **the throwing API call only** — never a Result-returning call, never validation logic. If a try body grows an `if`/`throw`, split it into composed stages.

Staying on sync `Result` (never `ResultAsync`) is also what keeps a check-then-write inside one synchronous tick. Introducing `ResultAsync` mid-chain opens a microtask gap another handler can slip into.

## Quick reference

| Situation | Do |
| --- | --- |
| Sync throwing call → Result | Named arrow fn, try/catch, `ok`/`err`, explicit `Result<T, E>` return type |
| Error message needs the call's arguments | Build the error in the catch clause — the args are in scope |
| Lookup returns `value \| undefined \| null` | Fold to `err(NotFoundError)` inside the same try, before the catch |
| Missing value means "available" | Fold to `ok`, and name the helper `requireNotX` |
| Validation then write | `validate(...).andThen(write)` — never `throw validated.error` inside a try |
| Check and write must not interleave | Keep the whole chain sync `Result` |
| Async throwing call (`fetch`) | `ResultAsync.fromPromise(p, (e) => new XError(..., { cause: e }))` — see [[chaining-neverthrow-results]] |
| Touching a legacy `fromThrowable` site | Convert it to this shape in the same change |

## Red flags

- `Result.fromThrowable` in new or newly-touched code
- a `try` body containing `if`/`throw` on a Result's error, or calling anything that already returns a Result
- `| undefined` / `| null` in the return type of anything other than the raw lookup expression itself
- a curried error mapper (`toXError(arg) => (e) => ...`) applied via `.mapErr` at the call site — move it into the catch clause
- missing return-type annotation on the wrapper (the error union silently widens)
- `andThen` nested inside `andThen` inside `andThen`
