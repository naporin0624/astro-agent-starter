# Accessibility: WCAG 2.2 Level AA

The whole UI conforms to **WCAG 2.2 Level AA** — not only the colour tokens. When a change
touches anything a visitor can see, read, hear, focus or click, it is measured against the
success criteria below, by name.

## No exceptions

There is no permitted exception in this project. Nothing claims the **Essential** exception,
nothing leans on the **Spacing** exception of SC 2.5.8, and nothing ships as a "known
non-conformance".

If a design cannot conform, **stop and ask before implementing it** — propose an alternative
that conforms (see "UI proposals" in CLAUDE.md). Do not implement first and document the gap
afterwards. A bug that happens to produce a failure is a bug, not an exception.

## Criteria that bite on a content site, and how each is checked

| SC | Level | What it means in practice | Checked by |
| --- | --- | --- | --- |
| **1.1.1** Non-text Content | A | Every meaningful image, icon or QR code has a text alternative; a decorative one is `alt=""` / `aria-hidden` **only** if its meaning is in text elsewhere | Component tests + `jsx-a11y/alt-text` |
| **1.3.1** Info and Relationships | A | Headings, lists, groups and landmarks are real elements, not styling (see `semantic-html.md`) | Role / name assertions in component tests |
| **1.3.3** Sensory Characteristics | A | A visual-only hint (an arrow, a colour, "the card on the right") has a text equivalent | Review + a test asserting the text exists |
| **1.4.1** Use of Color | A | Colour is never the only way information is conveyed (links in body text are underlined) | Review |
| **1.4.3** Contrast (Minimum) | AA | 4.5:1 normal text, 3:1 large text | A contrast test over the colour tokens |
| **1.4.4** Resize Text / **1.4.10** Reflow | AA | Usable at 200% zoom and at 320 CSS px width without horizontal scrolling | Review at 320px |
| **1.4.11** Non-text Contrast | AA | 3:1 for UI component boundaries, focus indicators and meaningful graphics | Contrast test |
| **1.4.12** Text Spacing | AA | No clipping when line height / letter / word spacing are increased | Review |
| **2.1.1** Keyboard | A | Everything a pointer can do, a keyboard can do | Component tests driving the keyboard (`@testing-library/user-event`) |
| **2.2.2** Pause, Stop, Hide | A | Motion that starts automatically and lasts over 5 s can be paused; respect `prefers-reduced-motion` | Review + presenter test (details: `motion.md`) |
| **2.4.2** Page Titled / **3.1.1** Language of Page | A | Every page has a unique `<title>` and `<html lang>` | Build output check |
| **2.4.4** Link Purpose (In Context) | A | A link's text says where it goes ("スライド", not "こちら") | Review |
| **2.4.7** Focus Visible / **2.4.11** Focus Not Obscured (Min.) | AA | A focused control always shows a ring and is never *entirely* covered by sticky headers or overlays | Focus sweep over the real page (see `focus-ring.md`) |
| **2.5.7** Dragging Movements | AA (new in 2.2) | Nothing may *require* a drag | Review — see below |
| **2.5.8** Target Size (Minimum) | AA (new in 2.2) | Every pointer target is at least 24×24 CSS px | Measured in tests — see below |
| **4.1.2** Name, Role, Value | A | Every control has a correct, live accessible name | Component tests |

SC 4.1.1 Parsing was **removed** in WCAG 2.2 — do not cite it.

## SC 1.3.3 — the rule that is easiest to break by accident

1.3.3 does **not** forbid describing a thing by its position. It forbids relying on that
*solely*. The text label is what rescues it.

> Adding a visual-only cue creates a 1.3.3 obligation. Ship the text equivalent in the same change.

```tsx
// Bad — the instruction exists only as shape and position
<span aria-hidden="true">↓</span>

// Good — the same instruction also exists as text (technique G96)
<p>
  <span aria-hidden="true">↓</span> スマホで読み取ると、このページが開きます
</p>
```

Keep decorative glyphs `aria-hidden`. The fix is to *add* text, never to expose the glyph — an
announced `↓` is worse than silence. Failure techniques to recognise: **F14** (content identified
only by shape or location) and **F26** (a graphical symbol alone conveying information).

## SC 2.5.8 — sizes

Author every pointer target at **24×24 CSS px or larger**, through a named design token for that
floor (for example `target.min`), so the reason survives in the code.

Do not design toward the Spacing exception: it is fragile, a layout change silently breaks it,
and this project does not claim it. An element that is not a pointer target takes no target
token; if it only needs to hold its space, reserve a line box (`min-height: 1lh`).

## SC 2.5.7 — no interaction may require dragging

Carousels, sliders, reordering and drag-and-drop all need a single-pointer alternative that is
not a drag (buttons, select-then-click, clicking a track).

## Before claiming a surface conforms

Measure it. Render the real component at the width it actually gets and read
`getBoundingClientRect()` — do not compute sizes from tokens by hand, and do not infer them from
the CSS; line height and padding change the rendered box.

Pin what you measured in a test as an **exact set** (for example "no control is smaller than 24px",
asserted per control), not as a count — a count cannot tell you a surface got worse.
