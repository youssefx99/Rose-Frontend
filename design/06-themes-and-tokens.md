# 06 · Themes & Semantic Tokens

This is the **brain** of Carbon. Foundations (`01`–`05`) are raw scales; **themes** turn them into
**semantic tokens** — named roles like `text-primary` or `layer-01` that resolve to different palette
values per theme. Components reference **only** these roles, which is what makes Carbon themeable and
consistent.

Values from `@carbon/themes/src/{white,g10,g90,g100}.ts` and `component-tokens/*` (v11).

---

## 1. The four themes

| Theme | Mode | Page background | Use |
|-------|------|-----------------|-----|
| **White** | Light | `#ffffff` (white) | Default light. **RoseSystem uses this.** |
| **Gray 10** (`g10`) | Light | `#f4f4f4` (gray-10) | Light, but a hair dimmer — good when lots of white cards sit on the page |
| **Gray 90** (`g90`) | Dark | `#262626` (gray-90) | Dark, softer than pure dark |
| **Gray 100** (`g100`) | Dark | `#161616` (gray-100) | Darkest. Default dark. |

> White ↔ Gray 10 are a **pair** (light); Gray 90 ↔ Gray 100 are a **pair** (dark). They differ mainly
> in which gray is "background" vs "layer", so layering inverts cleanly. RoseSystem ships light only;
> the dark values are here so a future dark mode is a token swap, not a rewrite.

---

## 2. The Layer model (how Carbon shows depth without shadows)

Carbon stacks surfaces using **layer tokens**, not drop shadows. Each nested container steps to the
next layer, and the background alternates so levels stay visually distinct.

```
                         White theme        Gray-100 theme
Background  (the page)   #ffffff            #161616  (gray-100)
└ Layer-01  (1st card)   #f4f4f4 (gray-10)  #262626  (gray-90)
  └ Layer-02 (nested)    #ffffff            #393939  (gray-80)
    └ Layer-03 (deeper)  #f4f4f4 (gray-10)  #525252  (gray-70)
```

Each layer level has a matching set of tokens that step with it:
- `layer-0X` (the surface), `layer-hover-0X`, `layer-active-0X`, `layer-selected-0X`,
  `layer-selected-hover-0X`
- `field-0X` (input fill on that layer), `border-subtle-0X`, `border-strong-0X`, `layer-accent-0X`

**In practice:** wrap a nested region in a "layer up" so its fields/borders pick the right step.
Carbon React uses `<Layer>`; we replicate by choosing the right background token for the nesting depth.
For most RoseSystem pages you'll only use **Background + Layer-01** (page → card). Go to Layer-02 when
you nest a contained surface (e.g. an input group or sub-card) inside a card.

---

## 3. Full semantic token tables — **White theme** (this is what we build against)

> These are the values to use for light UI. Each row: **token → palette swatch → hex**.

### Background
| Token | Resolves to | Hex |
|-------|-------------|-----|
| `background` | white | `#ffffff` |
| `background-inverse` | gray-80 | `#393939` |
| `background-brand` | blue-60 | `#0f62fe` |
| `background-hover` | gray-50 @ 12% | `rgba(141,141,141,0.12)` |
| `background-active` | gray-50 @ 50% | `rgba(141,141,141,0.5)` |
| `background-selected` | gray-50 @ 20% | `rgba(141,141,141,0.2)` |
| `background-selected-hover` | gray-50 @ 32% | `rgba(141,141,141,0.32)` |

### Layer (01 shown; 02/03 alternate white↔gray-10)
| Token | layer-01 | layer-02 | layer-03 |
|-------|----------|----------|----------|
| `layer` | gray-10 `#f4f4f4` | white `#ffffff` | gray-10 `#f4f4f4` |
| `layer-hover` | `#e8e8e8` | `#e8e8e8` | `#e8e8e8` |
| `layer-active` | gray-30 `#c6c6c6` | gray-30 | gray-30 |
| `layer-selected` | gray-20 `#e0e0e0` | gray-20 | gray-20 |
| `layer-selected-inverse` | gray-100 `#161616` | — | — |
| `layer-accent-01` | gray-20 `#e0e0e0` | (hover `#d1d1d1`, active gray-40 `#a8a8a8`) | |

### Field (input/control fills)
| Token | Resolves to | Hex |
|-------|-------------|-----|
| `field-01` | gray-10 | `#f4f4f4` |
| `field-02` | white | `#ffffff` |
| `field-hover-01` | gray-10-hover | `#e8e8e8` |

### Border
| Token | Resolves to | Hex | Use |
|-------|-------------|-----|-----|
| `border-subtle-00` | gray-20 | `#e0e0e0` | subtle border on white bg |
| `border-subtle-01` | gray-30 | `#c6c6c6` | **default subtle border** (on layer-01) |
| `border-strong-01` | gray-50 | `#8d8d8d` | input outlines, stronger dividers |
| `border-interactive` | blue-60 | `#0f62fe` | focused/active interactive border |
| `border-inverse` | gray-100 | `#161616` | border on inverse surfaces |
| `border-disabled` | gray-30 | `#c6c6c6` | disabled control border |
| `border-tile-01` | gray-30 | `#c6c6c6` | tile/card border |

### Text
| Token | Resolves to | Hex | Use |
|-------|-------------|-----|-----|
| `text-primary` | gray-100 | `#161616` | **default body & headings** |
| `text-secondary` | gray-70 | `#525252` | secondary/supporting text |
| `text-helper` | gray-60 | `#6f6f6f` | helper text under fields |
| `text-placeholder` | text-primary @ 40% | `rgba(22,22,22,0.4)` | input placeholder |
| `text-error` | red-60 | `#da1e28` | error messages |
| `text-on-color` | white | `#ffffff` | text on a colored fill (e.g. primary button) |
| `text-inverse` | white | `#ffffff` | text on inverse bg |
| `text-disabled` | text-primary @ 25% | `rgba(22,22,22,0.25)` | disabled text |

### Link
| Token | Hex | | Token | Hex |
|-------|-----|--|-------|-----|
| `link-primary` | `#0f62fe` (blue-60) | | `link-primary-hover` | `#0043ce` (blue-70) |
| `link-secondary` | `#0043ce` (blue-70) | | `link-visited` | `#8a3ffc` (purple-60) |

### Icon
| Token | Hex | Use |
|-------|-----|-----|
| `icon-primary` | `#161616` (gray-100) | default icons |
| `icon-secondary` | `#525252` (gray-70) | secondary icons |
| `icon-on-color` | `#ffffff` | icon on colored fill |
| `icon-interactive` | `#0f62fe` (blue-60) | interactive icon |
| `icon-disabled` | `rgba(22,22,22,0.25)` | disabled |

### Support (status)
| Token | Resolves to | Hex |
|-------|-------------|-----|
| `support-error` | red-60 | `#da1e28` |
| `support-success` | green-50 | `#24a148` |
| `support-warning` | yellow-30 | `#f1c21b` |
| `support-info` | blue-70 | `#0043ce` |
| `support-caution-major` | orange-40 | `#ff832b` |
| `support-caution-minor` | yellow-30 | `#f1c21b` |

### Focus / misc
| Token | Resolves to | Hex |
|-------|-------------|-----|
| `focus` | blue-60 | `#0f62fe` |
| `focus-inset` | white | `#ffffff` |
| `interactive` | blue-60 | `#0f62fe` |
| `highlight` | blue-20 | `#d0e2ff` |
| `overlay` | black @ 60% | `rgba(0,0,0,0.6)` |
| `toggle-off` | gray-50 | `#8d8d8d` |
| `skeleton-background` | white-hover | `#e8e8e8` |
| `skeleton-element` | gray-30 | `#c6c6c6` |
| `shadow` | — | `rgba(0,0,0,0.3)` |

---

## 4. Full semantic token tables — **Gray 100 (dark)**

For a future dark mode. Same token names, different resolution:

| Token | Hex | | Token | Hex |
|-------|-----|--|-------|-----|
| `background` | `#161616` (gray-100) | | `text-primary` | `#f4f4f4` (gray-10) |
| `layer-01` | `#262626` (gray-90) | | `text-secondary` | `#c6c6c6` (gray-30) |
| `layer-02` | `#393939` (gray-80) | | `text-helper` | `#a8a8a8` (gray-40) |
| `layer-03` | `#525252` (gray-70) | | `text-error` | `#ff8389` (red-40) |
| `field-01` | `#262626` (gray-90) | | `link-primary` | `#78a9ff` (blue-40) |
| `field-02` | `#393939` (gray-80) | | `support-error` | `#fa4d56` (red-50) |
| `border-subtle-01` | `#525252` (gray-70) | | `support-success` | `#42be65` (green-40) |
| `border-strong-01` | `#6f6f6f` (gray-60) | | `support-info` | `#4589ff` (blue-50) |
| `border-interactive` | `#4589ff` (blue-50) | | `support-warning` | `#f1c21b` (yellow-30) |
| `focus` | `#ffffff` (white) | | `overlay` | `rgba(0,0,0,0.6)` |

> Note how the **same role flips**: `text-primary` is gray-100 in light, gray-10 in dark; `focus` is
> blue-60 in light, white in dark; status colors lighten one step for contrast on dark. This is why you
> must reference the **role**, never the literal — the role already knows what to do per theme.

---

## 5. Component tokens (a layer above semantic tokens)

A few components have their own token sets so their specific styling is themeable independently. The
ones Carbon ships: **button**, **tag**, **notification**, **content-switcher**, **status**.

### Button tokens (light themes — White / Gray 10)
| Token | Hex |
|-------|-----|
| `button-primary` | `#0f62fe` (blue-60) |
| `button-primary-hover` | `#0050e6` |
| `button-primary-active` | `#002d9c` (blue-80) |
| `button-secondary` | `#393939` (gray-80) |
| `button-secondary-hover` | `#474747` |
| `button-secondary-active` | `#6f6f6f` (gray-60) |
| `button-tertiary` | `#0f62fe` (text/border; transparent fill) |
| `button-tertiary-hover` | `#0050e6` |
| `button-danger-primary` | `#da1e28` (red-60) |
| `button-danger-hover` | `#b81921` |
| `button-danger-active` | `#750e13` (red-80) |
| `button-disabled` | `#c6c6c6` (gray-30) |
| `button-separator` | `#e0e0e0` (gray-20) |

These anchor the Button component spec in [`08-components.md`](./08-components.md#button).

---

## 6. How to consume tokens in this repo

This repo already uses the **token pattern** via CSS variables in `globals.css` (`--primary`,
`--background`, `--border`, …) exposed to Tailwind through `@theme inline`. To "Carbon-ify", we
**rename/extend** those variables to Carbon's role names and point them at Carbon palette values.

Minimal Carbon-aligned token set for `:root` (light / White theme):
```css
:root {
  /* surfaces */
  --background: #ffffff;
  --layer-01: #f4f4f4;
  --layer-02: #ffffff;
  --field-01: #f4f4f4;
  --field-02: #ffffff;
  /* text */
  --text-primary: #161616;
  --text-secondary: #525252;
  --text-helper: #6f6f6f;
  --text-on-color: #ffffff;
  --text-error: #da1e28;
  /* borders */
  --border-subtle: #c6c6c6;   /* border-subtle-01 */
  --border-strong: #8d8d8d;   /* border-strong-01 */
  --border-interactive: #0f62fe;
  /* interactive / status */
  --interactive: #0f62fe;     /* blue-60 */
  --link-primary: #0f62fe;
  --focus: #0f62fe;
  --support-error:   #da1e28;
  --support-success: #24a148;
  --support-warning: #f1c21b;
  --support-info:    #0043ce;
  --overlay: rgba(0,0,0,0.6);
}
```
Full, copy-pasteable token blocks (light + the RoseSystem brand layer) are in
[`11-implementation-rosesystem.md`](./11-implementation-rosesystem.md).

---

## 7. Usage rules

✅ **Do** — reference roles (`text-primary`, `layer-01`, `support-error`); step layers when nesting
surfaces; keep status meanings fixed; design once in tokens so dark mode is a swap.

❌ **Don't** — hardcode palette hex in components when a role exists; use shadows to fake depth that the
layer model already provides; invent new role names without adding them to the token block.
