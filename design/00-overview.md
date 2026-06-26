# 00 · Overview — What Carbon Is and How It Thinks

Carbon is IBM's open-source design system. It is the implementation of the **IBM Design Language**.
Understanding its philosophy is what lets you make correct decisions when a doc doesn't spell out
an exact answer.

---

## 1. The core idea: a system of tokens, not a stylesheet

Carbon is built in layers, each consumed by the next:

```
Palette (raw values)        →  @carbon/colors   (#0f62fe, #161616, …)
Foundations (scales)        →  @carbon/type, @carbon/layout, @carbon/motion
Themes (semantic tokens)    →  @carbon/themes    ($text-primary → resolves per theme)
Components                  →  @carbon/react / styles (consume only semantic tokens)
```

The golden rule that falls out of this: **components never reference palette values directly.**
A button's background is `$button-primary`, which in the White theme happens to be Blue 60
(`#0f62fe`). Swap the theme and the same token resolves to a different value, and every component
updates for free. When you build UI in this repo, you imitate that discipline: reach for a
**semantic role**, and only fall back to a raw palette value when no role fits.

---

## 2. The 2x Grid

Carbon's structure rests on a **2x Grid** built from an **8px base unit** (the "mini-unit").

- Every dimension — spacing, sizing, type leading, component height — is a multiple (or clean
  fraction) of 8px. Fine adjustments use 2px and 4px.
- Layout uses a **16-column** responsive grid with **32px gutters** (see [`04-grid.md`](./04-grid.md)).
- The result is vertical and horizontal rhythm: things line up, and "looks off" usually means
  "off the grid."

> **Practical test:** any padding/margin/size you write should be expressible in the spacing scale
> (`2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160`px). If it isn't, it's probably wrong.

---

## 3. Two expressions: Productive vs Expressive

Carbon ships **two moods**, selected per context:

| | **Productive** | **Expressive** |
|--|----------------|----------------|
| Use for | Tools, dashboards, data-dense apps, admin | Marketing, landing, editorial, hero moments |
| Type | Smaller, tighter line-height, semibold headings | Larger, fluid headings that scale with viewport |
| Motion | Quick, efficient (`productive` easings) | Slower, more characterful (`expressive` easings) |
| Feel | Get out of the user's way | Make an impression |

**RoseSystem is a Productive application** (a billing/claims operations tool). Default to:
- Productive type tokens (`heading-compact-*`, `body-compact-*`, `body-01/02`).
- Productive motion (`moderate-01` / `fast-02` durations, `productive` easings).
- Dense, efficient layouts. Reserve Expressive only for an occasional marketing/login splash.

---

## 4. The aesthetic: restrained, square, confident

Carbon's visual character — internalize this, because it's how you'll know if a screen "feels Carbon":

- **Square-cornered.** Most components have **0 or very small** border-radius. Carbon does not look
  "rounded/friendly" like Material; it looks engineered. (RoseSystem currently uses an 8px radius —
  see the mapping doc for the compromise.)
- **Subtle borders over shadows.** Structure is conveyed with **1px subtle borders** and **layered
  background grays**, not drop shadows. Shadows are reserved for things that float (modals, popovers,
  menus, toasts).
- **One productive accent.** Interactivity is **Blue 60** (`#0f62fe`): links, primary buttons, focus,
  selected states. Color is used sparingly and meaningfully — most of the UI is grayscale, and color
  earns attention precisely because it's rare.
- **Status has a fixed vocabulary.** Error = Red, Success = Green, Warning = Yellow, Info = Blue.
  Don't improvise status colors.
- **Left-aligned, generous whitespace, strong type hierarchy.** Content leads; chrome recedes.

---

## 5. The Layer model (critical for depth)

Carbon doesn't stack things with shadows — it stacks them with **layers**. Every surface sits at a
layer level, and the background color steps with the level so nested containers stay distinguishable:

```
Background  → the page itself
Layer-01    → first container on the background (a card, a tile)
Layer-02    → a container *inside* Layer-01 (e.g. an input inside a card)
Layer-03    → a container inside Layer-02
```

In the **White** theme the steps alternate white ↔ gray-10 so each nested level reads as a distinct
plane without borders or shadows. This is why Carbon UIs look clean and flat yet legible. Full
mechanics and values are in [`06-themes-and-tokens.md`](./06-themes-and-tokens.md#the-layer-model).

---

## 6. Accessibility is a foundation, not a feature

Carbon targets **WCAG 2.1 AA** out of the box:
- Text contrast ≥ **4.5:1** (≥ 3:1 for large text and UI/graphical elements).
- A visible **2px focus indicator** on every interactive element.
- Hit targets sized from the scale (min 40–48px interactive height for primary controls).
- Full keyboard operability and sensible `prefers-reduced-motion` behavior.

Details and the exact contrast pairings are in [`10-accessibility.md`](./10-accessibility.md).

---

## 7. How the rest of these docs are organized

- **Foundations** (`01`–`05`) — the raw scales: color, type, spacing, grid, motion.
- **System** (`06`–`07`) — how foundations become themeable tokens, plus icons.
- **Application** (`08`–`10`) — components, patterns, accessibility.
- **Bridge** (`11`) — translating all of the above into this repo's Tailwind v4 + React stack,
  including the **RoseSystem brand layer** (the scarce rose accent that gives this product its name).

Read them top-to-bottom once to build the mental model; thereafter, jump to the file you need.
