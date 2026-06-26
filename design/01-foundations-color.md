# 01 · Foundations — Color

Carbon's color system has two layers:

1. **The palette** — raw, named swatches (`Blue 60`, `Gray 10`…). Documented here in full.
2. **Semantic tokens** — roles (`text-primary`, `support-error`…) that *point at* palette swatches
   and change per theme. Documented in [`06-themes-and-tokens.md`](./06-themes-and-tokens.md).

> **Rule:** In components, prefer the **role** (token). Use a raw palette swatch only for data-viz,
> illustrations, or one-off brand moments where no semantic role applies.

All hex values below are copied verbatim from `@carbon/colors/src/colors.ts` (Carbon v11).

---

## 1. The palette structure

Every chromatic hue has **10 steps**: `10` (lightest) → `100` (darkest). Step `50`/`60` is the
"core" of the hue. Grays also run `10 → 100`. There are **4 gray families** (neutral, cool, warm)
plus pure black/white.

A parallel set of `*Hover` values exists for each swatch (e.g. `blue60Hover = #0050e6`) — these are
the exact hover shades Carbon uses for interactive fills. The most-used ones are listed in §8.

---

## 2. Gray (neutral) — the backbone of the UI

> The vast majority of any Carbon screen is gray. Text, borders, surfaces, disabled states.

| Step | Hex | Typical role (White theme) |
|------|------|----------------------------|
| Gray 10 | `#f4f4f4` | `layer-01`, `field-01`, subtle backgrounds |
| Gray 20 | `#e0e0e0` | `border-subtle`, selected layer, skeleton |
| Gray 30 | `#c6c6c6` | `border-subtle-01`, `border-disabled`, skeleton element |
| Gray 40 | `#a8a8a8` | tile borders, dividers on color |
| Gray 50 | `#8d8d8d` | `border-strong`, `toggle-off`, placeholder base |
| Gray 60 | `#6f6f6f` | `text-helper`, secondary icons |
| Gray 70 | `#525252` | `text-secondary`, `icon-secondary` |
| Gray 80 | `#393939` | `background-inverse`, **secondary button** |
| Gray 90 | `#262626` | dark surfaces (g100 `layer-01`) |
| Gray 100 | `#161616` | **`text-primary`**, darkest UI / dark theme bg |

## 3. Cool Gray & Warm Gray (alternate neutrals)

Use these only to set a deliberate temperature for a whole product. Don't mix gray families.

| Step | Cool Gray | Warm Gray |
|------|-----------|-----------|
| 10 | `#f2f4f8` | `#f7f3f2` |
| 20 | `#dde1e6` | `#e5e0df` |
| 30 | `#c1c7cd` | `#cac5c4` |
| 40 | `#a2a9b0` | `#ada8a8` |
| 50 | `#878d96` | `#8f8b8b` |
| 60 | `#697077` | `#726e6e` |
| 70 | `#4d5358` | `#565151` |
| 80 | `#343a3f` | `#3c3838` |
| 90 | `#21272a` | `#272525` |
| 100 | `#121619` | `#171414` |

---

## 4. Blue — the productive accent (interactivity)

> **Blue 60 `#0f62fe` is *the* Carbon color.** It is the default for links, primary buttons, focus,
> selection, and "interactive" affordances. When in doubt about an accent, it's Blue 60.

| Step | Hex | Role |
|------|------|------|
| Blue 10 | `#edf5ff` | `highlight`, faint selected bg |
| Blue 20 | `#d0e2ff` | `highlight`, selected row |
| Blue 30 | `#a6c8ff` | hover on light, AI borders |
| Blue 40 | `#78a9ff` | `link-inverse`, dark-theme link |
| Blue 50 | `#4589ff` | `support-info-inverse`, focus (dark) accents |
| **Blue 60** | **`#0f62fe`** | **`interactive`, `link-primary`, `focus`, `button-primary`, `border-interactive`** |
| Blue 70 | `#0043ce` | `link-primary-hover`, `support-info` |
| Blue 80 | `#002d9c` | `button-primary-active` |
| Blue 90 | `#001d6c` | dark accents |
| Blue 100 | `#001141` | darkest |

---

## 5. Status / support colors (fixed semantics)

These four hues carry **meaning**. Don't repurpose them for decoration.

### Red — error / danger
| Step | Hex | | Step | Hex |
|------|------|--|------|------|
| Red 10 | `#fff1f1` | | Red 60 | **`#da1e28`** ← `support-error`, `button-danger` |
| Red 20 | `#ffd7d9` | | Red 70 | `#a2191f` |
| Red 30 | `#ffb3b8` | | Red 80 | `#750e13` ← danger active |
| Red 40 | `#ff8389` | | Red 90 | `#520408` |
| Red 50 | `#fa4d56` ← error (dark) | | Red 100 | `#2d0709` |

### Green — success
| Step | Hex | | Step | Hex |
|------|------|--|------|------|
| Green 10 | `#defbe6` | | Green 50 | **`#24a148`** ← `support-success` |
| Green 20 | `#a7f0ba` | | Green 60 | `#198038` |
| Green 30 | `#6fdc8c` | | Green 70 | `#0e6027` |
| Green 40 | `#42be65` ← success (dark) | | Green 80 | `#044317` |

### Yellow — warning
| Step | Hex | | Step | Hex |
|------|------|--|------|------|
| Yellow 10 | `#fcf4d6` | | Yellow 30 | **`#f1c21b`** ← `support-warning` |
| Yellow 20 | `#fddc69` | | Yellow 40 | `#d2a106` |

> ⚠️ Yellow is light — **never put white text on it**. Warning text/icons use Gray 100 on Yellow 30.

### Orange / Magenta / Purple / Cyan / Teal — extended + data-viz
| Hue | Core | Full range (10→100) |
|-----|------|---------------------|
| Orange | `#ff832b` (40) ← `caution-major` | `#fff2e8 #ffd9be #ffb784 #ff832b #eb6200 #ba4e00 #8a3800 #5e2900 #3e1a00 #231000` |
| Magenta | `#d02670` (60) | `#fff0f7 #ffd6e8 #ffafd2 #ff7eb6 #ee5396 #d02670 #9f1853 #740937 #510224 #2a0a18` |
| Purple | `#8a3ffc` (60) ← `link-visited` (60) | `#f6f2ff #e8daff #d4bbff #be95ff #a56eff #8a3ffc #6929c4 #491d8b #31135e #1c0f30` |
| Cyan | `#1192e8` (50) | `#e5f6ff #bae6ff #82cfff #33b1ff #1192e8 #0072c3 #00539a #003a6d #012749 #061727` |
| Teal | `#009d9a` (50) | `#d9fbfb #9ef0f0 #3ddbd9 #08bdba #009d9a #007d79 #005d5d #004144 #022b30 #081a1c` |

---

## 6. Black & White
- `black` / `black-100` = `#000000` (hover `#212121`)
- `white` / `white-0` = `#ffffff` (hover `#e8e8e8`)

---

## 7. Data visualization palette (chart series order)

When you need **categorical series colors** (recharts, etc.), Carbon's recommended ordered
sequence is built from the cores of distinct hues for maximum separability. A solid 5-series set:

1. `#8a3ffc` Purple 60  2. `#1192e8` Cyan 50  3. `#007d79` Teal 60  4. `#9f1853` Magenta 70
5. `#fa4d56` Red 50  (then `#570408`, `#198038`, `#002d9c`, `#ee5396`, `#b28600`, `#009d9a`, `#012749`…)

For sequential/quantitative data, use a single hue ramp (e.g. Blue 20 → Blue 90).
For **status** in charts, reuse the support colors above so a chart and a badge agree.

> RoseSystem already centralizes chart colors in `src/app/(app)/dashboard/chart-style.ts`. Keep that
> the single source of truth; align it to the support colors here when restyling.

---

## 8. Hover swatches (for interactive fills)

The exact hover shade for each core (so you don't eyeball a darken):

| Base | Hover | | Base | Hover |
|------|-------|--|------|-------|
| Blue 60 `#0f62fe` | `#0050e6` | | Gray 10 `#f4f4f4` | `#e8e8e8` |
| Blue 70 `#0043ce` | `#0053ff` | | Gray 20 `#e0e0e0` | `#d1d1d1` |
| Red 60 `#da1e28` | `#b81922` | | Gray 80 `#393939` | `#474747` |
| Green 50 `#24a148` | `#208e3f` | | White `#ffffff` | `#e8e8e8` |

---

## 9. Usage rules (do / don't)

✅ **Do**
- Build screens that are **mostly gray**; let Blue 60 and status colors stand out by scarcity.
- Use the **role/token**, not the swatch, inside components.
- Keep a chart's colors and a status badge's colors in agreement (shared source).
- Pick **one** gray family per product and stick to it (Carbon default: neutral Gray).

❌ **Don't**
- Use status hues decoratively (no "green button" just because it looks nice — green means success).
- Put text on a fill without checking contrast (esp. on Yellow, on `40`-level fills).
- Introduce a hue that isn't in this palette. If you need a brand accent, see the **RoseSystem brand
  layer** in [`11-implementation-rosesystem.md`](./11-implementation-rosesystem.md).
- Hardcode `#0f62fe` in ten places — point them all at the interactive token.

→ Next: how these swatches map to **semantic roles per theme** in
[`06-themes-and-tokens.md`](./06-themes-and-tokens.md).
