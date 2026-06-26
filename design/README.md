# RoseSystem Design System — Carbon Reference

> **What this folder is.** A deep, source-accurate reference for the **IBM Carbon Design System**,
> written specifically so that an AI agent (or a human) building or editing pages in this
> repo (`frontend/src/app/**`) can produce UI that is **visually and behaviorally consistent**
> with Carbon — without re-reading Carbon's source every time.
>
> Every numeric value in these docs (hex codes, rem sizes, line-heights, easings, breakpoints)
> was extracted directly from the Carbon monorepo source
> (`@carbon/colors`, `@carbon/type`, `@carbon/layout`, `@carbon/themes`, `@carbon/motion`,
> `@carbon/grid`) — not from memory. They are authoritative for Carbon **v11**.

---

## How to use these docs

**Before building or editing any page or component, read the relevant file(s) below.**

When you (the AI) are asked to "create a new page", "add a component", or "restyle X":

1. **Start with [`11-implementation-rosesystem.md`](./11-implementation-rosesystem.md)** — it is the
   bridge between Carbon's tokens and *this* project's actual stack (Next.js 16 + React 19 +
   Tailwind v4 + Radix). It tells you which Tailwind utilities / CSS variables to use.
2. **Pull foundations** from the relevant foundation file (color, type, spacing, grid, motion).
3. **Match the component spec** in [`08-components.md`](./08-components.md) for anatomy, sizes, states.
4. **Apply the pattern** in [`09-patterns.md`](./09-patterns.md) (forms, tables, notifications, empty states…).
5. **Verify accessibility** against [`10-accessibility.md`](./10-accessibility.md).

> ⚠️ **Do not invent values.** If a size, color, or spacing is not in these docs, derive it from
> the 8px grid / Carbon scale documented here — never from a "nice round number."

---

## The stack these docs target

| Concern            | This repo uses                                  | Carbon ships natively as |
|--------------------|-------------------------------------------------|--------------------------|
| Framework          | Next.js 16 (App Router) + React 19              | `@carbon/react`          |
| Styling            | Tailwind CSS v4 (`@theme`, CSS vars)            | SCSS (`@carbon/styles`)  |
| Primitives         | Radix UI (Dialog, Select, Label, Slot)          | own React components     |
| Variants           | `class-variance-authority` (`cva`)              | n/a                      |
| Icons              | `lucide-react`                                  | `@carbon/icons-react`    |
| Charts             | `recharts`                                      | `@carbon/charts`         |

**We do NOT install `@carbon/react`.** We replicate Carbon's *design language* (its tokens, scale,
rhythm, and component anatomy) inside our existing Tailwind/shadcn-style components. These docs are
the spec for that replication. See [`11-implementation-rosesystem.md`](./11-implementation-rosesystem.md).

---

## Index

| File | Covers |
|------|--------|
| [`00-overview.md`](./00-overview.md) | Carbon philosophy, the 2x Grid, IBM Design Language, how Carbon is structured |
| [`01-foundations-color.md`](./01-foundations-color.md) | The full color palette (every hue × 10 steps, exact hex) + semantic color roles |
| [`02-foundations-typography.md`](./02-foundations-typography.md) | IBM Plex, the 23-step type scale, every type token (size/line-height/weight/tracking), pairing |
| [`03-foundations-layout-spacing.md`](./03-foundations-layout-spacing.md) | The 8px mini-unit, spacing-01…13, fluid spacing, sizes, containers, icon sizes |
| [`04-grid.md`](./04-grid.md) | The 2x Grid: 16 columns, gutters, 5 breakpoints, wide/narrow/condensed modes |
| [`05-motion.md`](./05-motion.md) | Durations, easing curves, productive vs expressive motion, choreography |
| [`06-themes-and-tokens.md`](./06-themes-and-tokens.md) | The token system: White / Gray 10 / Gray 90 / Gray 100, the Layer model, full token tables |
| [`07-iconography.md`](./07-iconography.md) | Carbon icon grid, sizes (16/20/24/32), usage, lucide mapping |
| [`08-components.md`](./08-components.md) | The 126-component inventory + deep specs for the components we actually use |
| [`09-patterns.md`](./09-patterns.md) | Forms, data tables, notifications, empty/loading/error states, page layout patterns |
| [`10-accessibility.md`](./10-accessibility.md) | Focus, contrast (AA), hit targets, keyboard, motion-reduction |
| [`11-implementation-rosesystem.md`](./11-implementation-rosesystem.md) | **The bridge.** Carbon → Tailwind v4 token map, the RoseSystem brand layer, do/don't, migration |

---

## The five rules that matter most

If you read nothing else, internalize these:

1. **Everything is on an 8px grid** (with a 2px/4px sub-unit for fine work). Sizes, padding, and gaps
   come from the spacing scale — never arbitrary px. → [`03`](./03-foundations-layout-spacing.md)
2. **Color is semantic, not literal.** You apply *roles* (`text-primary`, `layer-01`, `support-error`,
   `border-subtle`), and the role resolves to a palette value per theme. Never hardcode a hex in a
   component when a role exists. → [`06`](./06-themes-and-tokens.md)
3. **Type uses tokens, not ad-hoc sizes.** `body-01`, `heading-03`, `label-01` carry size + line-height
   + weight + letter-spacing together. → [`02`](./02-foundations-typography.md)
4. **Carbon is square and quiet.** Default corner radius is small/none, borders are subtle, shadows are
   reserved for overlays, and the one productive accent is **Blue 60** (`#0f62fe`). Restraint is the
   aesthetic. → [`00`](./00-overview.md)
5. **Interactive states are mandatory.** Every actionable element needs `hover`, `active`, `focus`
   (a 2px focus border), `disabled`, and where relevant `selected`. → [`08`](./08-components.md), [`10`](./10-accessibility.md)

---

## Provenance

Extracted from `github.com/carbon-design-system/carbon` (cloned at documentation time), files:
`packages/colors/src/colors.ts`, `packages/type/src/{scale,styles,fontFamily,fontWeight}.ts`,
`packages/layout/src/index.ts` + `scss/__tests__` snapshots, `packages/themes/src/{white,g100,g10,g90}.ts`,
`packages/themes/src/component-tokens/*`, `packages/motion/src/index.ts`, `packages/grid/scss/_config.scss`,
`packages/react/src/components/*`. Carbon is Apache-2.0 licensed by IBM.
