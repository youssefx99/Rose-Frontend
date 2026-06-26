# 11 · Implementation — Carbon in the RoseSystem Stack

This is the **bridge** doc. The foundation files describe Carbon faithfully; this file tells you how to
**apply** it inside *this* repo: **Next.js 16 + React 19 + Tailwind v4 + Radix + cva + lucide**. Read
this first when building or editing UI.

> **We do not install `@carbon/react` or `@carbon/styles`.** We reproduce Carbon's design language using
> the tools already in `package.json`. The tokens below are the contract.

---

## 1. Where Carbon lives in this codebase

| Carbon concept | This repo |
|----------------|-----------|
| Design tokens (SCSS vars) | **CSS custom properties in `src/app/globals.css`** (`:root`), surfaced to Tailwind via `@theme inline` |
| Themes | `:root` (light/White) + `.dark` (Gray 100) — light only is shipped today |
| Components | `src/components/ui/*` (shadcn-style, Radix-backed, `cva` variants) |
| Type tokens | utility classes / `@theme` font config in `globals.css` |
| Icons | `lucide-react` (Carbon-compatible 24px/2px geometric set) |
| Charts | `recharts`, colors centralized in `src/app/(app)/dashboard/chart-style.ts` |

**To change the look of the whole app, you edit `globals.css` tokens — not individual components.**
Components must consume tokens, exactly as Carbon components consume semantic tokens.

---

## 2. The RoseSystem brand layer (important decision)

Carbon's productive accent is **Blue 60 `#0f62fe`**. This product is **RoseSystem**, and its existing
identity uses **slate-900** as the primary and **rose-500 `#f43f5e`** as a *scarce* accent
(`globals.css` header comment; sidebar active border; review badge).

**Recommended approach — "Carbon structure, Rose brand accent":**

Adopt Carbon **wholesale** for everything that carries meaning or rhythm:
- ✅ **Gray neutrals** (Carbon gray 10–100) for all surfaces, text, borders.
- ✅ **Type scale + tokens**, **spacing scale**, **layer model**, **motion**, **component anatomy/states**.
- ✅ **Status vocabulary** stays Carbon: error = Red 60, success = Green 50, warning = Yellow 30, info =
  Blue 70. **Do not** make rose mean a status — meaning must stay unambiguous.

Then define the **brand/interactive role** as **Rose**, not Blue — a single-token swap the token system
is built for:
- `--interactive`, `--link-primary`, `--button-primary` → **rose** (brand actions/links).
- `--focus` → **rose** *or* keep Blue 60 (blue is the safest high-contrast focus; rose is more on-brand —
  either is fine if ≥ 3:1 and 2px).

Keep **rose scarce**: a screen should be mostly grayscale, with rose marking the *one* primary
action/active state. This preserves Carbon's restraint (color earns attention by rarity) **and** the
RoseSystem identity.

> Alternative if you prefer maximum Carbon fidelity over brand: set the interactive role to **Blue 60**
> and use rose only in the wordmark. Both are valid; pick one and put every interactive element on it.
> The current code mixes **slate-900 primary + rose accent** — that's a third valid option but is the
> least "Carbon". Whichever you choose, **route it through the token**, never hardcode per-component.

---

## 3. Copy-paste token block (light / White theme + Rose brand)

Drop-in replacement/extension for `:root` in `globals.css`. Names follow Carbon roles so the foundation
docs apply directly.

```css
:root {
  /* ── Carbon spacing already maps to Tailwind steps; no vars needed ── */

  /* ── Surfaces (Layer model) ── */
  --background: #ffffff;          /* page */
  --layer-01: #f4f4f4;            /* gray-10 — first card on background */
  --layer-02: #ffffff;           /* nested surface inside a card */
  --layer-hover: #e8e8e8;
  --layer-selected: #e0e0e0;     /* gray-20 */
  --field-01: #f4f4f4;           /* input fill on background */
  --field-02: #ffffff;           /* input fill on a gray layer */

  /* ── Text ── */
  --text-primary: #161616;       /* gray-100 */
  --text-secondary: #525252;     /* gray-70 */
  --text-helper: #6f6f6f;        /* gray-60 */
  --text-placeholder: rgba(22,22,22,0.4);
  --text-on-color: #ffffff;
  --text-error: #da1e28;         /* red-60 */
  --text-disabled: rgba(22,22,22,0.25);

  /* ── Borders ── */
  --border-subtle: #c6c6c6;      /* gray-30 (border-subtle-01) */
  --border-subtle-00: #e0e0e0;   /* gray-20 (on white) */
  --border-strong: #8d8d8d;      /* gray-50 */
  --border-disabled: #c6c6c6;

  /* ── Brand / interactive (RoseSystem = rose) ── */
  --interactive: #f43f5e;        /* rose-500  ← brand accent (Carbon default would be #0f62fe) */
  --interactive-hover: #e11d48;  /* rose-600 */
  --interactive-active: #be123c; /* rose-700 */
  --link-primary: #f43f5e;
  --link-primary-hover: #e11d48;
  --link-visited: #8a3ffc;       /* purple-60 (keep Carbon) */
  --border-interactive: #f43f5e;
  --focus: #f43f5e;              /* or #0f62fe for max-contrast focus */
  --focus-inset: #ffffff;

  /* ── Status (FIXED — Carbon, never rose) ── */
  --support-error:   #da1e28;    /* red-60   */
  --support-success: #24a148;    /* green-50 */
  --support-warning: #f1c21b;    /* yellow-30 (text/icon on it must be #161616) */
  --support-info:    #0043ce;    /* blue-70  */
  --support-caution-major: #ff832b; /* orange-40 */

  /* ── Misc ── */
  --overlay: rgba(0,0,0,0.6);
  --skeleton-background: #e8e8e8;
  --skeleton-element: #c6c6c6;
  --toggle-off: #8d8d8d;
  --highlight: #ffe4e6;          /* rose-100 (was Carbon blue-20) for selected highlights */

  /* radius — Carbon is square (0–2px). RoseSystem brand softens to a small radius: */
  --radius: 0.25rem;             /* 4px. Use 0 for true Carbon; 0.5rem is the current value. */
}
```

Then expose to Tailwind (extend the existing `@theme inline` block):
```css
@theme inline {
  /* …existing… */
  --color-background: var(--background);
  --color-layer-01: var(--layer-01);
  --color-layer-02: var(--layer-02);
  --color-field-01: var(--field-01);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-helper: var(--text-helper);
  --color-border-subtle: var(--border-subtle);
  --color-border-strong: var(--border-strong);
  --color-interactive: var(--interactive);
  --color-focus: var(--focus);
  --color-support-error: var(--support-error);
  --color-support-success: var(--support-success);
  --color-support-warning: var(--support-warning);
  --color-support-info: var(--support-info);
}
```
Now `bg-layer-01`, `text-text-secondary`, `border-border-subtle`, `text-support-error`,
`ring-focus`, etc. are available as Tailwind utilities.

> **Dark mode later** = fill `.dark { … }` with the Gray-100 values from
> [`06-themes-and-tokens.md §4`](./06-themes-and-tokens.md) and flip the interactive role to a lighter
> rose (e.g. rose-400). No component changes needed.

---

## 4. Breakpoints, spacing, motion (Tailwind `@theme`)

```css
@theme {
  /* Carbon breakpoints (override Tailwind defaults — see 04-grid.md) */
  --breakpoint-sm: 20rem;   /* 320  */
  --breakpoint-md: 42rem;   /* 672  */
  --breakpoint-lg: 66rem;   /* 1056 */
  --breakpoint-xlg: 82rem;  /* 1312 */
  --breakpoint-max: 99rem;  /* 1584 */

  /* Motion tokens (see 05-motion.md) */
  --duration-fast-02: 110ms;
  --duration-moderate-01: 150ms;
  --duration-moderate-02: 240ms;
  --duration-slow-01: 400ms;
  --ease-standard: cubic-bezier(0.2, 0, 0.38, 0.9);
  --ease-entrance: cubic-bezier(0, 0, 0.38, 0.9);
  --ease-exit: cubic-bezier(0.2, 0, 1, 0.9);
}
```
**Spacing** needs no custom tokens — Tailwind's numeric steps already equal Carbon's scale
(`1`=4, `2`=8, `3`=12, `4`=16, `6`=24, `8`=32, `10`=40, `12`=48, `16`=64…). Just **don't use the
off-grid steps** (`5`=20, `7`=28, `9`=36, `11`=44, `14`=56). See [`03`](./03-foundations-layout-spacing.md#9-usage-rules).

---

## 5. Type tokens as classes

Define Carbon type tokens once so pages reference the **token name**, not raw utilities. Add to
`globals.css`:

```css
@layer components {
  .type-label-01        { font-size: .75rem; line-height: 1rem;    letter-spacing: .32px; font-weight: 400; }
  .type-helper-01       { font-size: .75rem; line-height: 1rem;    letter-spacing: .32px; }
  .type-body-compact-01 { font-size: .875rem; line-height: 1.125rem; letter-spacing: .16px; font-weight: 400; }
  .type-body-01         { font-size: .875rem; line-height: 1.25rem;  letter-spacing: .16px; font-weight: 400; }
  .type-body-02         { font-size: 1rem;   line-height: 1.5rem;   font-weight: 400; }
  .type-heading-compact-01 { font-size: .875rem; line-height: 1.125rem; letter-spacing: .16px; font-weight: 600; }
  .type-heading-02      { font-size: 1rem;   line-height: 1.5rem;   font-weight: 600; }
  .type-heading-03      { font-size: 1.25rem; line-height: 1.75rem; font-weight: 400; }
  .type-heading-04      { font-size: 1.75rem; line-height: 2.25rem; font-weight: 400; } /* page title 28/36 */
}
```
Usage: `<h1 className="type-heading-04 text-text-primary">Claims</h1>`. Full token list in [`02`](./02-foundations-typography.md).

**Fonts:** to switch from Geist to true IBM Plex, load via `next/font` in `app/layout.tsx` and set
`--font-sans`/`--font-mono` to the Plex variables. The scale/tokens are unchanged.

---

## 6. Carbon → existing component mapping

| Carbon component | This repo file | Action to align |
|------------------|----------------|-----------------|
| Button | `ui/button.tsx` | Heights → 32/40/48; route `primary` through `--interactive`; keep `rose` scarce; add `tertiary`/`ghost`; icon-right convention |
| Tag/Status | `ui/status-badge.tsx` | Keep as the status SOT; align hues to Carbon support family; `type-label-01` |
| Tile/Tile | `ui/card.tsx` | Prefer `border-border-subtle`, reduce shadow; padding 16/24; consistent radius |
| TextInput/TextArea | `ui/input.tsx`, `ui/textarea.tsx` | Field height 40/48; `--field-01` fill; **2px `--focus` border**; error = 2px red + helper + icon |
| Select/Dropdown | `ui/select.tsx` (Radix) | Trigger = field spec; content = `border-subtle` + shadow + 40px items + selected check |
| Modal/Dialog | `ui/dialog.tsx`, `ui/slide-over.tsx`, `ui/cascade-delete-dialog.tsx` | Overlay `--overlay`; footer buttons; keep Radix trap/`Esc`; slide-over 400ms |
| DataTable | `ui/table.tsx`, `ui/filter-bar.tsx` | Header `heading-compact-01`; rows `body-compact-01`; status-only color; tabular numbers; skeleton + empty states |
| Notification/Toast | `ui/sonner.tsx` | Map kinds to `--support-*` + icons; top-right; don't auto-dismiss errors |
| Label/Helper | `ui/label.tsx`, `ui/detail.tsx` | `type-label-01` / `type-helper-01`; link errors via `aria-describedby` |
| PageHeader | `ui/page-header.tsx` | `heading-04` title + `body-01` subtitle; 32px to content; one primary action |
| UI Shell | `(app)/layout.tsx` | Already Carbon side-nav pattern; color = brand layer (slate+rose) |

---

## 7. Decision defaults (so you don't re-litigate each time)

- **Primary action color:** `--interactive` (rose). One primary per view.
- **Links/focus:** `--link-primary` / `--focus`. Visible 2px focus.
- **Surfaces:** page `--background` (white); cards `--layer-01` (or white card + `--border-subtle`).
- **Borders over shadows** for structure; shadows only for floating layers (modal/popover/menu/toast).
- **Status colors:** Carbon red/green/yellow/blue, fixed. Never rose-as-status.
- **Radius:** small (4px) brand-softened default; 0 for true Carbon. Pick one and stay consistent.
- **Heights:** 32 (sm) / 40 (md) / 48 (lg). **Spacing:** on-grid steps only.
- **Type:** token classes; page title = `heading-04`; body = `body-01`; tables = `body-compact-01`.
- **Icons:** lucide, 16px (`size-4`) inline, colored via tokens/`currentColor`.

---

## 8. Migration notes (current → Carbon-aligned)

The app already follows many Carbon ideas (token-driven `globals.css`, status-only table color,
tabular nums, restrained palette, side-nav shell). To converge **incrementally, low-risk**:

1. **Tokens first** — extend `globals.css` with §3/§4/§5 blocks (additive; nothing breaks).
2. **Type classes** — introduce `.type-*` and use them on new/edited pages.
3. **Per-component** — when you touch a component (the natural time), align heights/states/borders to
   [`08`](./08-components.md) and route colors through tokens.
4. **Don't do a big-bang restyle.** Migrate as you build, using these docs as the target. New pages
   should be Carbon-aligned from the start.

> Existing decisions to preserve: slate/rose brand identity (as the brand layer), status color mapping
> in `status-badge.tsx`/`chart-style.ts`, the cascade-delete impact-preview pattern, the collapsible
> side-nav. These are compatible with Carbon — keep them.

---

## 9. The one-paragraph summary for future-you

> Build mostly-grayscale, square-ish, border-structured screens on an 8px grid. Use Carbon's gray
> neutrals, type tokens, spacing scale, layer model, motion, and component anatomy. Drive every color
> through a semantic CSS variable in `globals.css` — surfaces (`--layer-*`), text (`--text-*`), borders
> (`--border-*`), and one scarce brand accent `--interactive` (rose). Keep the status vocabulary fixed
> to Carbon's red/green/yellow/blue. Give every control hover/active/**2px focus**/disabled states.
> Reach for `src/components/ui/*`; don't hardcode hex; don't go off the spacing grid. When unsure, open
> the matching foundation doc in this folder.
