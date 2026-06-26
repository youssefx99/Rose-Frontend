# 03 · Foundations — Layout, Spacing & Sizing

This is the most-referenced foundation when building screens. Everything spatial in Carbon derives
from one number: the **8px mini-unit**.

Values from `@carbon/layout/src/index.ts` and the `@carbon/styles` spacing snapshot (v11).

---

## 1. The mini-unit

```
mini-unit = 8px
```

The spacing scale is `mini-unit × {0.25, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 20}`. Sub-unit work
(borders, tight insets) uses **2px and 4px**. If a value can't be expressed on this grid, it's wrong.

---

## 2. Spacing scale (`spacing-01` … `spacing-13`)

> **The single most important table in this folder.** Use these for all padding, margin, and gap.

| Token | rem | **px** | Tailwind | Typical use |
|-------|-----|--------|----------|-------------|
| `spacing-01` | 0.125rem | **2** | `0.5` | Icon ↔ label hairline, fine insets |
| `spacing-02` | 0.25rem | **4** | `1` | Tight padding, chip insets |
| `spacing-03` | 0.5rem | **8** | `2` | Compact gaps, small control padding |
| `spacing-04` | 0.75rem | **12** | `3` | Input/button horizontal padding (compact) |
| `spacing-05` | 1rem | **16** | `4` | **Default gap / padding** (most common) |
| `spacing-06` | 1.5rem | **24** | `6` | Card padding, gap between groups |
| `spacing-07` | 2rem | **32** | `8` | Section spacing, grid gutter |
| `spacing-08` | 2.5rem | **40** | `10` | Large section spacing |
| `spacing-09` | 3rem | **48** | `12` | Major vertical rhythm |
| `spacing-10` | 4rem | **64** | `16` | Page-level separation |
| `spacing-11` | 5rem | **80** | `20` | Big layout blocks |
| `spacing-12` | 6rem | **96** | `24` | Hero/section padding |
| `spacing-13` | 10rem | **160** | `40` | Expressive whitespace |

**Defaults to memorize:** component inner padding → `spacing-05` (16px). Card padding → `spacing-06`
(24px). Gap between cards/sections → `spacing-06`/`spacing-07` (24/32px). Tight icon gaps → `spacing-03`
(8px).

---

## 3. Fluid spacing (viewport-relative)

For expressive layouts that breathe with the viewport:

| Token | Value |
|-------|-------|
| `fluid-spacing-01` | `0` |
| `fluid-spacing-02` | `2vw` |
| `fluid-spacing-03` | `5vw` |
| `fluid-spacing-04` | `10vw` |

Productive app shells generally **don't** use these — keep fixed spacing for predictability.

---

## 4. Sizing — control/element heights

Carbon's interactive elements snap to a small set of heights. These come from the **`size` tokens**:

| Token | rem | **px** | Used by |
|-------|-----|--------|---------|
| `size-xsmall` | 1.5rem | **24** | tiny controls, small tags |
| `size-small` | 2rem | **32** | **small** buttons/inputs (`sm`) |
| `size-medium` | 2.5rem | **40** | **medium** buttons/inputs (`md`) — common default |
| `size-large` | 3rem | **48** | **large** field height (`lg`) — Carbon's default button |
| `size-xlarge` | 4rem | **64** | extra-large CTA buttons |
| `size-2xlarge` | 5rem | **80** | hero buttons |

> **Field & button heights** in Carbon: `sm = 32`, `md = 40`, `lg = 48` (default), `xl = 64`.
> RoseSystem's current `Button` uses `h-8 / h-9 / h-10` (32/36/40). To align with Carbon, prefer the
> **32 / 40 / 48** ladder (see [`08-components.md`](./08-components.md) and [`11`](./11-implementation-rosesystem.md)).

---

## 5. Container tokens (min-heights / small fixed boxes)

| Token | rem | px |
|-------|-----|-----|
| `container-01` | 1.5rem | 24 |
| `container-02` | 2rem | 32 |
| `container-03` | 2.5rem | 40 |
| `container-04` | 3rem | 48 |
| `container-05` | 4rem | 64 |

---

## 6. Icon sizes

| Token | px | Use |
|-------|-----|-----|
| `icon-size-01` | **16** | Inline icons next to 14px text, buttons, table actions (default) |
| `icon-size-02` | **20** | Slightly emphasized icons |

Carbon **icon assets** ship in **16, 20, 24, 32** px artboards (see [`07-iconography.md`](./07-iconography.md)).
In UI, **16px is the default**. RoseSystem uses `lucide-react` at `size-4` (16px) — correct.

---

## 7. Deprecated `layout-01…07` (know them, don't use them)

Older Carbon used a separate "layout" scale. **Deprecated in v11** — use `spacing-*` instead. For
reference only: `layout-01 16px`, `02 24px`, `03 32px`, `04 48px`, `05 64px`, `06 96px`, `07 160px`.

---

## 8. Putting it together — vertical rhythm of a page

A typical Productive page (matches this repo's `(app)` layout, `main` has `p-6` = 24px):

```
┌─ page padding: spacing-06 (24px) ───────────────────────────┐
│  Page title (heading-04)                                     │
│   ↕ spacing-02 (4–8px)                                        │
│  Page description (body-01, text-secondary)                  │
│   ↕ spacing-07 (32px)  ← title block → content               │
│  ┌─ Card (layer, border-subtle) ──────────────────────────┐ │
│  │  padding: spacing-06 (24px)                             │ │
│  │  Card title (heading-02)                                │ │
│  │   ↕ spacing-05 (16px)                                   │ │
│  │  Card body…                                             │ │
│  └────────────────────────────────────────────────────────┘ │
│   ↕ spacing-06 (24px)  ← gap between cards                    │
│  ┌─ Card ─────────────────────────────────────────────────┐ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Gap cheat-sheet**
- Inside a control (button/input padding): **8–16px** (`spacing-03`–`05`)
- Label → field: **spacing-02/03** (4–8px)
- Field → field in a form: **spacing-05/06** (16–24px)
- Card inner padding: **spacing-06** (24px)
- Card → card / section → section: **spacing-06/07** (24–32px)
- Page padding: **spacing-06** (24px) on small, more on large
- Grid gutter: **spacing-07** (32px) — see [`04-grid.md`](./04-grid.md)

---

## 9. Usage rules

✅ **Do**
- Pull every margin/padding/gap from the spacing scale; in Tailwind that means the
  `0.5,1,2,3,4,6,8,10,12,16,20,24,40` step values (which map 1:1 to the table in §2).
- Keep one consistent "module gap" (24px) between sibling blocks on a page.
- Snap control heights to 32/40/48.

❌ **Don't**
- Use `p-5` (20px), `gap-5` (20px), `m-7` (28px) etc. — those fall **between** Carbon steps. Prefer
  `4 → 6` (16 → 24), not 20. (20px exists in the *type* scale, not the *spacing* scale.)
- Add ad-hoc `px`/`rem` values for spacing.
- Center-justify dense content; Carbon layouts are left-aligned and grid-anchored.
