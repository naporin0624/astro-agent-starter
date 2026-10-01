---
name: explicit-primitive-conversion
description: Use when converting a value to a number, string, or boolean in TypeScript, or annotating a primitive type — about to write Number(x), Number.parseInt, Number.parseFloat, String(x), Boolean(x), unary +x, !!x, .filter(Boolean), .map(Number), or a : Number / : String / : Boolean type annotation.
---

# Explicit Primitive Conversion

## Overview

The `Number` / `String` / `Boolean` globals — **called as functions** or **used as type annotations** — hide intent and bury edge cases. `Number(x)` silently maps `null`→0 and `""`→0; `String(x)` quietly stringifies anything; `Boolean(x)` collapses `0`, `""`, `null`, `undefined`, `false`, `NaN` into one bucket. Convert **explicitly** instead, and annotate with the lowercase primitive.

**Calling `Number`/`String`/`Boolean`, or annotating with the uppercase wrapper type, is banned. No exceptions.**

## The rule

| Goal | ❌ banned (implicit coercion) | ✅ required (explicit) |
|---|---|---|
| string → integer | `Number(x)`, `+x`, `Number.parseInt(x, 10)`, `parseInt(x)` (no radix) | the **global** `parseInt(x, 10)` — radix is mandatory |
| string → float | `Number(x)`, `+x`, `Number.parseFloat(x)` | the **global** `parseFloat(x)` |
| anything → string | `String(x)` | `` `${x}` `` (template literal) |
| truthiness / → boolean | `Boolean(x)`, `!!x`, `.filter(Boolean)` | an explicit `x === …` / `x !== …` condition |
| type annotation | `: Number` `: String` `: Boolean`, `Array<String>`, `as Number` | `: number` `: string` `: boolean` |

**Numbers are parsed in exactly one way: the global `parseInt(x, 10)` or the global `parseFloat(x)`.** `Number(x)`, `+x`, `Number.parseInt` and `Number.parseFloat` are all banned — one spelling per intent, so a reader never has to ask whether two spellings differ.

**Still allowed:** the `Number` namespace's *predicates and constants* are not conversions — `Number.isNaN(x)`, `Number.isInteger(x)`, `Number.isFinite(x)`, `Number.MAX_SAFE_INTEGER`.

## Before → after

```ts
// ❌ before — every conversion is implicit
const page: Number = Number(query.page);          // wrapper type + coercion
const note = String(form.note);                   // hides what note actually is
const msg = parts.map((p) => String(p)).join(" "); // ditto
const apply = !!user && Boolean(rate);            // two truthiness coercions
const tags = raw.filter(Boolean);                 // drops which falsy values?
```

```ts
// ✅ after — intent is named at every step
const page: number = parseInt(query.page ?? "", 10) || 1;
const note = `${form.note}`;
const msg = parts.map((p) => `${p}`).join(" ");
const apply = user !== undefined && rate > 0;     // exactly the conditions you mean
const tags = raw.filter((t): t is string => t !== null && t !== undefined && t !== "");
```

## Why `Boolean(x)` is the one that bites

`Boolean(x)` / `!!x` / `.filter(Boolean)` test "is it truthy" — but you almost never mean *all six* falsy values. Writing the `!==`/`===` condition forces you to name the one you actually mean:

- "is it present?" → `x !== null && x !== undefined`
- "is the string non-empty?" → `x !== ""`
- "is the count positive?" → `x > 0` (`Boolean(0)` would have hidden the `0` case)

If you genuinely want a real boolean from a comparison, you already have one: `const ok = x !== null` — there is nothing left to coerce.

## A value typed `unknown`?

Do not reach for `String(x)` / `Number(x)` to dodge the type. Narrow or model it first (see `precise-type-modeling`), then convert the narrowed value. `` `${x}` `` on a bare `unknown`/`symbol` is itself a smell that the type was never modeled.

## Common mistakes

| Mistake | Fix |
|---|---|
| `parseInt(x)` without radix | `parseInt(x, 10)` — always pass the radix. |
| `Number(x)` "because parseInt is verbose" | Verbosity is the point: `Number("")` is `0`, `parseInt("", 10)` is `NaN`. Pick the parser that matches intent. |
| `Number.parseInt(x, 10)` / `Number.parseFloat(x)` "because it is namespaced" | Use the global `parseInt(x, 10)` / `parseFloat(x)`. Only the predicates and constants (`Number.isNaN`, `Number.isInteger`, `Number.MAX_SAFE_INTEGER`) stay. |
| `.filter(Boolean)` to "remove empties" | Spell out the condition: `.filter((x): x is T => x !== null && x !== undefined)`. |
| `: Number` / `: String` / `: Boolean` annotation | Use the lowercase primitive. The uppercase wrapper type accepts boxed objects and breaks assignability. |

## Red Flags — STOP

- About to type `Number(`, `String(`, or `Boolean(` → it is a coercion call. Use `parseInt(x, 10)` / `parseFloat(x)` / `` `${x}` `` / an explicit `===`/`!==`.
- About to type `Number.parseInt` / `Number.parseFloat` → use the global `parseInt(x, 10)` / `parseFloat(x)`.
- About to write `+x` or `!!x` → implicit coercion. Same replacements.
- About to write `.filter(Boolean)` → name the condition in a predicate.
- About to annotate `: Number` / `: String` / `: Boolean` (or `Array<String>`, `as String`) → use `number` / `string` / `boolean`.

## What lint already stops

| Pattern | oxlint rule |
|---|---|
| `Number(x)`, `String(x)`, `Boolean(x)`, `new Number(x)`, `.filter(Boolean)`, `.map(Number)` | `coercion/no-wrapper-coercion` (`tools/oxlint-plugins/coercion.ts`) |
| `+x`, `!!x`, `'' + x` | `no-implicit-coercion` |
| `Number.parseInt`, `Number.parseFloat` | `no-restricted-properties` |
| `parseInt(x)` without a radix | `radix` |
| `: Number` / `: String` / `: Boolean` | `typescript/no-wrapper-object-types` |
| `if (x)` on a non-boolean | `typescript/strict-boolean-expressions` |

`pnpm fmt` runs `oxlint --fix`, and the fix for `no-implicit-coercion` rewrites `+x` into `Number(x)` — which `coercion/no-wrapper-coercion` then reports. Replace it by hand with `parseInt(x, 10)` / `parseFloat(x)`.

This skill exists for the part lint cannot do — *choosing the right explicit replacement*.
