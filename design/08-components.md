# 08 · Components

Carbon React ships **126 components**. We don't install them — we replicate their **anatomy, sizing,
and states** in our Tailwind/Radix primitives. This doc is (a) the full inventory so you know what
exists, and (b) deep specs for the components RoseSystem actually uses.

Every interactive component must implement the **five states**: `default`, `hover`, `active`/`pressed`,
`focus` (a **2px focus border** in `--focus` / blue-60), and `disabled` (+ `selected`/`read-only`/
`error` where relevant). This is non-negotiable — see [`10-accessibility.md`](./10-accessibility.md).

---

## 1. Full inventory (the 126)

**Actions:** Button, PrimaryButton, SecondaryButton, DangerButton, ButtonSet, IconButton, ComboButton,
MenuButton, ChatButton, Copy, CopyButton.

**Forms & inputs:** TextInput, PasswordInput, TextArea, NumberInput, Search, ExpandableSearch, Select,
SelectItem, SelectItemGroup, Dropdown, MultiSelect, FilterableMultiSelect, ComboBox, Checkbox,
CheckboxGroup, InlineCheckbox, RadioButton, RadioButtonGroup, RadioTile, Toggle, ToggleSmall, Switch,
Slider, DatePicker, DatePickerInput, TimePicker, TimePickerSelect, FileUploader, Form, FormGroup,
FormItem, FormLabel, FluidForm + the entire `Fluid*` input family (FluidTextInput, FluidTextArea,
FluidSelect, FluidDropdown, FluidComboBox, FluidMultiSelect, FluidNumberInput, FluidSearch,
FluidDatePicker, FluidTimePicker…).

**Navigation & shell:** UIShell (Header, SideNav, HeaderMenu…), PageHeader, Breadcrumb, BreadcrumbItem,
Tabs, Tab, TabContent, ContentSwitcher, Switch, Pagination, PaginationNav, Link, OverflowMenu,
OverflowMenuItem, Menu, ContextMenu, TreeView.

**Data display:** DataTable (+ DataTableSkeleton), StructuredList, Tile, TileGroup, ExpandableTile,
ContainedList, ListItem, OrderedList, UnorderedList, Accordion, AccordionItem, Tag, Toggletip, Tooltip,
Popover, ProgressBar, ProgressIndicator, Slider, AspectRatio, CodeSnippet, Heading, Text, Section.

**Feedback & status:** Notification (Toast/Inline/Actionable), Loading, InlineLoading, Skeleton
(SkeletonText, SkeletonIcon, SkeletonPlaceholder), Modal, ComposedModal, Dialog, BadgeIndicator,
IconIndicator, ShapeIndicator.

**Layout & utilities:** Grid, FlexGrid, Column, Stack, Layer, Theme, Tile, ClassPrefix, IdPrefix,
Portal, ErrorBoundary, FeatureFlags, HideAtBreakpoint, LayoutDirection, Icon, Icons.

**AI (experimental):** AILabel, AISkeleton, ChatButton (+ AI tokens).

---

## 2. Sizing ladder (applies to most controls)

| Size | Height | Use |
|------|--------|-----|
| `sm` | **32px** | dense tables/toolbars |
| `md` | **40px** | default in many apps |
| `lg` | **48px** | Carbon's default field/button height; comfortable forms |
| `xl` | 64px | large CTAs (rare) |

> RoseSystem's current `Button` uses 32/36/40. **Recommendation:** move to the **32/40/48** ladder to
> match Carbon. At minimum, keep heights on the spacing grid (avoid 36/44). See [`11`](./11-implementation-rosesystem.md).

---

## 3. Button

**Variants** (Carbon): `primary`, `secondary`, `tertiary`, `ghost`, `danger` (danger-primary,
danger-tertiary, danger-ghost).

| Variant | Fill | Text | Border | Hover | Active | Use |
|---------|------|------|--------|-------|--------|-----|
| **primary** | blue-60 `#0f62fe` | white | none | `#0050e6` | blue-80 `#002d9c` | The one main action per view |
| **secondary** | gray-80 `#393939` | white | none | `#474747` | gray-60 `#6f6f6f` | Secondary action beside primary |
| **tertiary** | transparent | blue-60 | 1px blue-60 | fill blue-60 / text white | blue-80 | Lower-emphasis action |
| **ghost** | transparent | blue-60 | none | bg gray-10/`background-hover` | — | Lowest emphasis, inline |
| **danger** | red-60 `#da1e28` | white | none | `#b81921` | red-80 `#750e13` | Destructive primary |

**Anatomy & specifics**
- **Heights:** `sm 32 / md 40 / lg 48 / xl 64`. Default `lg` (48) in Carbon.
- **Corner radius:** Carbon = **0** (square). *(RoseSystem currently rounds — see brand note in [`11`].)*
- **Label:** left-aligned; with an icon, **icon sits on the right** in Carbon (e.g. Add ＋, Arrow →).
  Icon-only buttons use `IconButton` with a tooltip.
- **Padding:** ~16px horizontal (`spacing-05`); min width so labels don't crowd.
- **Focus:** 2px `--focus` (blue-60) border, often with a 1px inset white (`focus-inset`).
- **Disabled:** fill gray-30 `#c6c6c6`, text on it muted; `pointer-events:none`.

**This repo** — `src/components/ui/button.tsx` uses `cva`. To align, map variants:
`default → primary` (but make fill blue-60, not slate-900 — *or* keep slate as the brand primary; decide
in [`11`]). The existing `rose` variant is the RoseSystem brand accent — keep it **scarce** (one per view
at most). Add a true `tertiary`/`ghost` if missing.

```tsx
// Carbon-aligned heights (swap into buttonVariants size{}):
size: {
  sm: "h-8 px-3 text-sm",        // 32
  md: "h-10 px-4 text-sm",       // 40
  lg: "h-12 px-4 text-sm",       // 48  ← Carbon default
  icon: "size-10",               // 40 square
}
```

---

## 4. Tag & Badge

**Tag** = a small labeled token (filters, categories, statuses). Carbon tag **types**: gray, blue,
green, red, magenta, purple, cyan, teal, warm-gray, cool-gray, high-contrast, outline. Variants:
read-only, **dismissible** (with ✕), **selectable**, **operational**. Sizes: `sm` (18px), `md` (24px).

**This repo's `StatusBadge`** (`src/components/ui/status-badge.tsx`) is effectively a Carbon-style tag
keyed by status — keep it the single source of truth. Its color mapping (blue=open, amber=pending,
green=paid, red=denied…) is the app's status vocabulary; align the hues to Carbon support/palette where
practical (e.g. denied/error → red-60 family, paid/success → green family).

- **Pill shape** is acceptable for status tags (Carbon tags are slightly rounded).
- Keep text `label-01` (12px), tight padding (`spacing-02`/`03`), `whitespace-nowrap`.
- Color = a **light fill + dark text of the same hue** (e.g. `bg-red-100 text-red-700`), which is exactly
  the existing pattern — that's the Carbon "low-saturation status tag" look.

---

## 5. Text inputs (TextInput / TextArea / NumberInput / PasswordInput)

**Anatomy (top→bottom):** Label (`label-01`, 12px) → Input → Helper text (`helper-text-01`) OR Error.

| Property | Value |
|----------|-------|
| Height | `sm 32 / md 40 / lg 48` (lg default) |
| Fill | `field-01` gray-10 `#f4f4f4` (or `field-02` white on a gray layer) |
| Border | **bottom border only**, 1px `border-strong-01` gray-50 `#8d8d8d` (Carbon's signature single underline) |
| Text | `body-compact-01` (14px), `text-primary` |
| Placeholder | `text-placeholder` (text-primary @ 40%) |
| Padding | 16px horizontal (`spacing-05`) |
| **Focus** | 2px `--focus` (blue-60) border (full box outline on focus) |
| **Error** | 2px `support-error` (red-60) border + red helper text + error icon |
| **Warning** | yellow border + warning icon |
| Disabled | reduced opacity, no border emphasis |

> Carbon's classic input is **filled with a single bottom border**, not a full box. RoseSystem's current
> inputs (shadcn) use a full 1px box with rounded corners — acceptable as a brand choice, but if you want
> Carbon fidelity, switch to the filled + bottom-border style. Keep **error = 2px red border + helper
> text + icon** regardless.

**FluidForm** variant: label sits **inside** the field (floating), used in data-entry-dense forms.

---

## 6. Select / Dropdown / ComboBox / MultiSelect

- **Select** (native-style) and **Dropdown** (custom listbox) share field anatomy with TextInput
  (height, fill, bottom border, focus/error). Chevron icon on the right (`icon-secondary`).
- **Menu surface:** white `layer`, 1px `border-subtle`, **shadow** (this floats), item height 40px,
  hover `layer-hover`, selected shows a checkmark + `layer-selected`.
- **ComboBox** = Dropdown + typeahead filter. **MultiSelect** = checkboxes in the menu + a count tag in
  the field.
- This repo uses **Radix Select** (`src/components/ui/select.tsx`) — good. Style the trigger to the field
  spec above and the content to the menu spec (border-subtle + shadow + 40px items + blue-60 focus).

---

## 7. Checkbox / Radio / Toggle

| Control | Spec |
|---------|------|
| **Checkbox** | 16px box, 1px `border-strong` (gray-50); checked = blue-60 fill + white check; focus 2px blue-60; label `body-compact-01` to the right with `spacing-03` gap. Indeterminate = blue-60 with dash. |
| **Radio** | 16px circle, 1px border; selected = blue-60 ring + filled center; same focus. |
| **Toggle** | track 32–48×16–24; off = `toggle-off` gray-50, on = `support-success` green or blue-60 (Carbon uses green-50 for on); knob white; 70–110ms motion. Always pair with a label and state text (On/Off). |

---

## 8. Modal / Dialog / ComposedModal

**Anatomy:** Overlay (`overlay` = black @ 60%) → Modal surface (white `layer`, **no/!subtle radius**,
shadow) → Header (title `heading-03`, close ✕ top-right) → Body (`body-01`) → Footer (buttons, **full-
bleed**, side-by-side: secondary left, primary right — Carbon footer buttons span the modal width and
are 48–64px tall).

| Property | Value |
|----------|-------|
| Width | sm 320 / md 480 / lg 640 / (Carbon: `xs/sm/md/lg`) |
| Padding | `spacing-05`–`06` (16–24px) |
| Enter | 240–400ms, entrance easing |
| Focus trap | required; focus moves to modal; `Esc` closes; return focus on close |
| Danger modal | title/icon use `support-error`; primary button = danger |

This repo uses **Radix Dialog** (`src/components/ui/dialog.tsx`, `slide-over.tsx`, `cascade-delete-
dialog.tsx`). Keep Radix's focus-trap/`Esc`/overlay; style to the spec above. The **slide-over** is the
Carbon side-panel pattern: slides from the right edge, 400ms, entrance/exit easing.

---

## 9. Data Table (the workhorse)

Carbon's `DataTable` is highly specified. Key specs:

| Property | Value |
|----------|-------|
| Row heights | `xs 24 / sm 32 / md 40 / lg 48 / xl 64` (compact tables use 32; default 48) |
| Header | `heading-compact-01` (14px **600**), `text-secondary`/`text-primary`, bg `layer-accent` or `layer`; sortable headers show a sort arrow on hover/active |
| Cell text | `body-compact-01` (14px), `text-primary`; **tabular-nums** for numbers |
| Borders | 1px `border-subtle` between rows (horizontal rules; vertical lines avoided) |
| Zebra | optional alternating `layer` / `layer-01` (Carbon "zebra" variant) |
| Row hover | `layer-hover` |
| Selected row | `layer-selected` + checkbox in first column |
| Cell padding | 16px horizontal (`spacing-05`), vertical per row height |
| Toolbar | search, filter, overflow actions above the table |
| Empty / loading | use `DataTableSkeleton` (shimmer rows) and a proper empty state |
| Sticky | header sticky on scroll for long tables |

This repo's `src/components/ui/table.tsx` + `filter-bar.tsx` cover this. Rules: **status is the only
color in a table row** (via `StatusBadge`); keep everything else grayscale; right-align numeric columns;
keep money/counts tabular. Pagination (Carbon `Pagination`) goes below: page size select + range +
prev/next.

---

## 10. Notifications (Toast / Inline / Actionable)

Carbon notification **kinds**: `error`, `success`, `warning`, `info`, plus low-contrast variants.

| Type | Where | Spec |
|------|-------|------|
| **Inline** | within a page/form | full-width bar, left **3–4px colored accent border** in `support-*`, status icon, title (`heading-compact-01`) + message (`body-compact-01`), optional close |
| **Toast** | transient, top-right corner | same anatomy, floats with shadow, auto-dismiss (timer), stack newest-on-top |
| **Actionable** | inline/toast with a button | adds a ghost action button |

Color = `support-{error|success|warning|info}` for the accent + icon; surface stays light. **Don't**
flood the whole notification with the status color — it's an accent + icon, on a light surface.

This repo uses **`sonner`** (`src/components/ui/sonner.tsx`) for toasts — fine. Configure its colors/icons
to the support tokens and position top-right.

---

## 11. Tabs / ContentSwitcher / Accordion

- **Tabs:** labels `body-compact-01`; selected tab has a **2px bottom border** in `border-interactive`
  (blue-60) + `text-primary`; unselected `text-secondary`; hover underline; focus ring. Content below.
- **ContentSwitcher:** segmented control; selected segment = filled (`layer-selected`/dark), others
  bordered. Use for switching *views of the same data* (not navigation).
- **Accordion:** full-width rows, chevron on the **left or right**, 1px `border-subtle` dividers,
  expand/collapse 240ms; title `heading-compact-01`/`body-01`.

This repo has `collapsible-section.tsx` (accordion-like) — align dividers/motion to the above.

---

## 12. Tile / Card

Carbon's `Tile` ≈ this repo's `Card`. Specs:
- Surface `layer` (white), **1px `border-subtle`** (gray-20/30) — borders, not shadows, for structure.
- Padding `spacing-05`/`06` (16–24px).
- **Clickable tile:** add hover (`layer-hover`), focus ring, and a clear affordance. **Selectable tile**
  (`RadioTile`): selected = blue-60 border + check.
- **Expandable tile:** chevron reveals more content.

This repo's `Card` uses `rounded-xl border shadow-sm`. Carbon would use a subtle border and **no/less
shadow**. Keep it consistent app-wide (don't mix shadowed and borderless cards).

---

## 13. Tooltip / Toggletip / Popover

- **Tooltip:** hover/focus, **dark** surface (`background-inverse` gray-80) + `text-inverse`, small
  (`body-compact-01`/12px), arrow, 70–150ms; for supplementary labels (esp. icon-only buttons).
- **Toggletip:** click-triggered tooltip that can hold interactive content.
- **Popover:** light `layer` surface + border + shadow; container for richer transient content.

Radix can back all three. Icon-only buttons in this app (sidebar collapse, logout) already use `title`
attrs — upgrade critical ones to real tooltips for consistency + a11y.

---

## 14. Loading & Skeleton

- **Loading:** Carbon's rotating spinner (`Loading`), sizes sm/normal; `InlineLoading` shows
  spinner + status text ("Saving…", "Success") inline with a button/form.
- **Skeleton:** `SkeletonText`, `SkeletonPlaceholder`, `DataTableSkeleton` — shimmer using
  `skeleton-background` (`#e8e8e8`) / `skeleton-element` (gray-30). Prefer skeletons over spinners for
  content that has a known layout (tables, cards).

This repo's `(app)/layout.tsx` shows a simple "Loading…" — fine for the auth gate; use skeletons for
data-area loading.

---

## 15. UI Shell {#ui-shell}

The Carbon **UI Shell** = top `Header` + left `SideNav` + content. RoseSystem's `(app)/layout.tsx`
implements the **left side-nav** flavor:
- Sidebar `bg-slate-900` (Carbon shell is gray-100/gray-90), `w-60` expanded / `w-16` collapsed.
- Nav items: 2px left border that becomes the **active accent** (rose-500 here; Carbon uses blue-60),
  active item gets a darker fill + white text; inactive `text-secondary`.
- Sections divided by 1px borders; a pending **badge** on Review Queue.
- User block + sign-out at the bottom.

This is a solid, Carbon-consistent shell. The only deviation is **color** (slate + rose vs Carbon
gray + blue) — that's the RoseSystem brand layer ([`11`](./11-implementation-rosesystem.md)). Carbon
nav anatomy (left-border active indicator, 48px item height, icon+label) is preserved.

---

## 16. Component build checklist

When you add or restyle a component, verify:
- [ ] Height on the **32/40/48** ladder.
- [ ] Padding/gaps from the **spacing scale**.
- [ ] Type via a **token** (size+leading+weight+tracking).
- [ ] Colors via **semantic tokens** (`text-primary`, `layer-01`, `support-*`, `--focus`).
- [ ] All **five states** present (default/hover/active/**focus 2px**/disabled), + error/selected if relevant.
- [ ] Motion matches [`05`](./05-motion.md) (duration by size, entrance/exit easings).
- [ ] Accessible: label/`aria-*`, keyboard, contrast — see [`10`](./10-accessibility.md).
- [ ] Status uses the **fixed** error/success/warning/info vocabulary.
