# 04 · The 2x Grid

Carbon's layout grid is a **16-column, responsive, mini-unit-based** grid. It's how you place content
horizontally and keep alignment across breakpoints.

Values from `@carbon/grid/scss/_config.scss` and `@carbon/layout/src/index.ts` (v11).

---

## 1. Columns & gutters

| Property | Value |
|----------|-------|
| Columns (lg and up) | **16** |
| Gutter (standard / "wide") | **32px** (`2rem`, = `spacing-07`) — 16px padding on each side of a column |
| Gutter (condensed) | **1px** |
| Gutter (narrow) | 32px gutter, but content **hangs 16px** into the gutter |

Carbon offers a 12-column variant, but **16 is the default** — use 16.

---

## 2. Breakpoints

| Name | Min width | rem | Columns | Page margin |
|------|-----------|-----|---------|-------------|
| `sm`  | **320px** | 20rem | 4  | 0 |
| `md`  | **672px** | 42rem | 8  | 16px |
| `lg`  | **1056px** | 66rem | 16 | 16px |
| `xlg` | **1312px** | 82rem | 16 | 16px |
| `max` | **1584px** | 99rem | 16 | 24px |

> **Mental model:** phones get **4** columns, tablets **8**, laptops/desktops **16**. The page margin
> (space outside the outermost columns) grows from 0 → 16 → 24px.

### Mapping to Tailwind v4 breakpoints
Tailwind's defaults differ from Carbon's. To match Carbon exactly, set these in your theme (see
[`11`](./11-implementation-rosesystem.md)):

```css
@theme {
  --breakpoint-sm: 20rem;    /* 320  — Carbon sm  */
  --breakpoint-md: 42rem;    /* 672  — Carbon md  */
  --breakpoint-lg: 66rem;    /* 1056 — Carbon lg  */
  --breakpoint-xlg: 82rem;   /* 1312 — Carbon xlg */
  --breakpoint-max: 99rem;   /* 1584 — Carbon max */
}
```

If you don't override Tailwind's breakpoints, at minimum **treat `lg` (1024–1056px) as the point where
layouts go to full multi-column desktop**, and design content columns at 8 (tablet) and 16 (desktop).

---

## 3. Grid modes

| Mode | Gutter | When |
|------|--------|------|
| **Wide** (default) | 32px | Standard pages. Clear separation between columns. |
| **Narrow** | content hangs 16px into gutter | When you want media/cards flush to a column edge. |
| **Condensed** | 1px | Dense data layouts where columns should read as one continuous surface (e.g. tiles touching). |

In Carbon React these are `<Grid>` / `<Grid condensed>` / `<Grid narrow>` with `<Column>` children.
We don't have those components — replicate with CSS grid / flex (below).

---

## 4. Replicating the grid in this stack

We use Tailwind, not `@carbon/grid`. Two faithful approaches:

### A. CSS Grid (closest to Carbon's column model)
```tsx
{/* 16-col grid on desktop, 32px gutter, collapses on small screens */}
<div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-16 gap-8">
  <div className="col-span-4 lg:col-span-12">{/* main */}</div>
  <div className="col-span-4 lg:col-span-4">{/* sidebar */}</div>
</div>
```
> Tailwind v4 supports arbitrary column counts; if `grid-cols-16` isn't generated, use
> `grid-cols-[repeat(16,minmax(0,1fr))]`. Gutter `gap-8` = 32px = Carbon wide gutter.

### B. Max-width container + flex (typical app pages)
Most RoseSystem pages are a single content column inside the app shell, not a true 16-col grid. That's
fine and common in Carbon "productive" apps. Use a constrained content width and the spacing scale:

```tsx
<div className="mx-auto w-full max-w-[99rem] px-4 lg:px-6">  {/* page margins: 16→24px */}
  <Stack gap="spacing-07">…</Stack>
</div>
```

---

## 5. Responsive rules

✅ **Do**
- Design **content** to a column count: 4 (mobile) / 8 (tablet) / 16 (desktop).
- Use a **32px gutter** between grid columns (`gap-8`).
- Keep the page's outer margin on the Carbon ladder (0 / 16 / 24px).
- Collapse multi-column layouts to a single stacked column below `md` (672px).

❌ **Don't**
- Use random max-widths (`max-w-[1180px]`). Anchor to `66rem`/`82rem`/`99rem` (1056/1312/1584).
- Mix gutter sizes within one grid.
- Let text line-length exceed ~`body` comfortable measure on `max` — constrain prose columns even when
  the grid is wide (long lines hurt readability).

---

## 6. The app shell vs. content grid

This repo's `(app)/layout.tsx` is a **shell**: a fixed-width sidebar (`w-60` / `w-16` collapsed) + a
fluid `main` with `p-6` (24px). That's the Carbon **UI Shell** pattern (left nav + content). The 2x
Grid applies to the **content inside `main`**, not the shell chrome. So:

- Shell (sidebar, header) → fixed/own spacing (documented in [`08`](./08-components.md#ui-shell)).
- Content area → apply the 2x Grid + spacing scale as above.
