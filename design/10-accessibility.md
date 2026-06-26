# 10 · Accessibility

Carbon is built to **WCAG 2.1 Level AA**. Accessibility is a foundation here, not a finishing pass —
the tokens, sizes, and states above already encode most of it. This doc makes the requirements explicit
so every new page/component meets them.

---

## 1. Color contrast (AA)

| Content | Minimum ratio |
|---------|---------------|
| Body / normal text (< 18px, or < 14px bold) | **4.5 : 1** |
| Large text (≥ 18px, or ≥ 14px bold) | **3 : 1** |
| UI components & graphical objects (borders, icons, focus, chart marks) | **3 : 1** |

Carbon's tokens are pre-checked. Known-good pairings (White theme):
- `text-primary` `#161616` on `background`/`layer` (`#fff`/`#f4f4f4`) → ~16:1 ✅
- `text-secondary` `#525252` on white → ~7.4:1 ✅
- `text-helper` `#6f6f6f` on white → ~4.9:1 ✅ (don't go lighter than gray-60 for text on white)
- `text-on-color` white on `button-primary` blue-60 `#0f62fe` → ~4.6:1 ✅
- `text-error` red-60 `#da1e28` on white → ~4.5:1 ✅

⚠️ **Watch-outs**
- **Never** white text on **Yellow 30** (`#f1c21b`) — use gray-100 text/icon on yellow.
- Don't put `text-placeholder` (40% opacity) as *real* content — it's intentionally below body contrast;
  placeholders are not labels.
- Disabled text (`text-disabled`, 25%) is exempt from contrast minimums but must not be the only way to
  convey meaning.
- Status/support colors on light fills (the `bg-*-100 text-*-700` badge pattern) generally pass — verify
  if you introduce a new pairing.

---

## 2. Don't rely on color alone

Every state conveyed by color must **also** be conveyed by text, icon, or shape:
- Errors: red **+ icon + message**.
- Status badges: color **+ the status word** (already the case in `StatusBadge`).
- Required fields: asterisk/label, not just a colored border.
- Charts: distinct shapes/labels/legend, not hue alone.

---

## 3. Focus — visible and consistent

- **Every** interactive element shows a visible focus indicator: **2px solid `--focus` (blue-60
  `#0f62fe`)**, often with a 1px `focus-inset` (white) for contrast on dark fills.
- Use `:focus-visible` (keyboard focus) so mouse clicks don't show rings but keyboard nav does.
- Never `outline: none` without replacing it with an equal-or-better visible indicator.
- Focus order follows visual/DOM order; no positive `tabindex`.

This repo's `globals.css` sets `outline-ring/50` globally and `Button` uses a 3px focus ring — keep a
**clearly visible** ring; align the color to blue-60 (or the brand focus) and ≥2px.

---

## 4. Keyboard operability

| Pattern | Keys |
|---------|------|
| Buttons/links | `Enter` / `Space` activate |
| Modal/Dialog | focus **trapped** inside; `Esc` closes; focus returns to trigger on close |
| Menu/Dropdown/Select | `↑/↓` move, `Enter` select, `Esc` close, typeahead |
| Tabs | `←/→` between tabs, `Enter/Space` (or auto) activate |
| Data table | tab to controls; sortable headers operable by keyboard |
| Slide-over/panel | trap + `Esc`, like modal |

Radix primitives (Dialog, Select) used in this repo provide trap/`Esc`/arrow-keys **for free** — don't
break them with custom handlers. Custom widgets must replicate these.

---

## 5. Hit targets

- Interactive controls: aim for **≥ 40px** height (Carbon `md`); primary fields/buttons **48px** (`lg`).
- Icon-only buttons: **minimum 40×40** tappable area (pad the icon; don't ship a 16px hit target).
- Spacing between adjacent targets prevents mis-taps (≥ `spacing-02`).

---

## 6. Semantics & ARIA

- Use **native elements** first (`<button>`, `<a href>`, `<label for>`, `<table>`, `<nav>`, headings).
- Associate labels: every input has a `<label>` (or `aria-label`/`aria-labelledby`). Helper/error text
  linked via `aria-describedby`; errored field `aria-invalid="true"`.
- Landmarks: `header`, `nav`, `main` (the shell already uses `<aside>`/`<main>`), `footer`.
- Headings form a logical outline: one `h1`/page title, then `h2`/`h3` sections — don't skip levels for
  styling (style with type tokens, not heading level).
- Icon-only controls need an accessible name (`aria-label`) **and** ideally a tooltip.
- Live regions: announce async results (toasts) with `role="status"`/`aria-live="polite"`; errors with
  `aria-live="assertive"` where appropriate. `sonner` handles much of this — verify.

---

## 7. Motion & reduced motion

- Honor `prefers-reduced-motion: reduce` — drop large translate/scale/parallax; keep essential
  opacity/color feedback. (Snippet in [`05-motion.md`](./05-motion.md#5-accessibility--reduced-motion-required).)
- No content that flashes > 3×/sec.
- Auto-dismissing toasts: don't auto-dismiss **error/critical** ones; give enough time + a manual close.

---

## 8. Forms accessibility

- Programmatic label on every field; group with `<fieldset>`/`<legend>` (or `FormGroup` + group label).
- Errors: text + icon, linked via `aria-describedby`, field `aria-invalid`; move focus to the first
  error (or a summary) on failed submit.
- Don't disable submit purely to block — prefer submit + surfaced errors (screen-reader friendly).
- Required state communicated in the label, not color only.

---

## 9. Images, icons, charts

- Decorative icons: `aria-hidden="true"`. Meaningful icons: `aria-label`/title.
- Charts: provide a text alternative (summary, data table, or `aria-label`) — a colored line chart alone
  is not accessible.

---

## 10. Accessibility checklist (per page/component)

- [ ] Text contrast ≥ 4.5:1 (3:1 large/UI); no white-on-yellow.
- [ ] No meaning by color alone (icon/text/shape too).
- [ ] Visible **2px** `:focus-visible` indicator on every interactive element.
- [ ] Full keyboard operation; modals trap focus + `Esc` + restore focus.
- [ ] Hit targets ≥ 40px; icon buttons ≥ 40×40 with `aria-label`.
- [ ] Native semantics + proper labels/`aria-describedby`/`aria-invalid`.
- [ ] Logical heading outline (h1→h2→h3), one page title.
- [ ] `prefers-reduced-motion` honored; no rapid flashing.
- [ ] Async results announced (live regions / toasts).

> The ECC `a11y-architect` agent can audit a component against WCAG 2.2 — use it for anything
> auth/data-entry/critical before shipping.
