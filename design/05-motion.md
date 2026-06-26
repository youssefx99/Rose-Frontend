# 05 · Motion

Carbon motion is **functional**: it explains state changes, not decorates them. It has two
dimensions — **duration** (how long) and **easing** (the acceleration curve) — each with
**Productive** and **Expressive** modes.

Values from `@carbon/motion/src/index.ts` (v11).

---

## 1. Durations

| Token | Value | Use |
|-------|-------|-----|
| `duration-fast-01` | **70ms** | Micro feedback: small hover/active, checkbox, toggle knob |
| `duration-fast-02` | **110ms** | Buttons, small simple state changes |
| `duration-moderate-01` | **150ms** | **Default UI transition** — most hovers, focus, color changes |
| `duration-moderate-02` | **240ms** | Expanding/collapsing, larger local moves (accordion, dropdown) |
| `duration-slow-01` | **400ms** | Larger surfaces entering: modals, side panels, notifications |
| `duration-slow-02` | **700ms** | Full-screen / background transitions, complex orchestration |

**Rule of thumb:** the **bigger the element / the farther it travels, the longer the duration.** A
tooltip is fast; a slide-over panel is slow.

---

## 2. Easing curves

Carbon defines three easing roles, each in Productive & Expressive flavors:

| Role | Productive | Expressive | Use |
|------|-----------|------------|-----|
| **standard** | `cubic-bezier(0.2, 0, 0.38, 0.9)` | `cubic-bezier(0.4, 0.14, 0.3, 1)` | State change that **stays on screen** (color, resize, reorder) |
| **entrance** | `cubic-bezier(0, 0, 0.38, 0.9)` | `cubic-bezier(0, 0, 0.3, 1)` | Element **appearing** (fade/slide in, expand) — fast start, gentle stop |
| **exit** | `cubic-bezier(0.2, 0, 1, 0.9)` | `cubic-bezier(0.4, 0.14, 1, 1)` | Element **leaving** (fade/slide out, collapse) — gentle start, fast end |

> **Why entrance ≠ exit:** things should *arrive* gracefully (decelerate into place) and *leave*
> decisively (accelerate away). Using the same curve both ways feels wrong.

### Productive vs Expressive choice
- **Productive** (default for RoseSystem): efficient, gets out of the way. Use for all app-shell UI.
- **Expressive**: more pronounced, for moments you want noticed (a celebratory success, a hero, an
  important first-run modal). Use sparingly.

---

## 3. Mapping to this stack

This repo has `tw-animate-css` and uses CSS transitions directly (e.g. `Button` uses
`transition-[...] duration-150 ease-out`). Align to Carbon:

| Intent | duration | easing | Tailwind-ish |
|--------|----------|--------|--------------|
| Button / link hover | 110–150ms | standard productive | `transition-colors duration-150 ease-[cubic-bezier(0.2,0,0.38,0.9)]` |
| Focus ring | 70–110ms | standard productive | `duration-100` |
| Dropdown / popover open | 110–150ms | entrance productive | `duration-150 ease-[cubic-bezier(0,0,0.38,0.9)]` |
| Dropdown / popover close | 110ms | exit productive | `duration-110 ease-[cubic-bezier(0.2,0,1,0.9)]` |
| Modal / dialog enter | 240–400ms | entrance productive | `duration-300` |
| Slide-over panel | 400ms | entrance/exit productive | `duration-[400ms]` |
| Toast / notification in | 400ms | entrance productive | `duration-[400ms]` |
| Accordion expand/collapse | 240ms | standard productive | `duration-[240ms]` |

> Define these as CSS custom properties once (`--ease-standard-productive`, `--duration-moderate-01`,
> …) in `globals.css` and reference them, so motion stays consistent. See [`11`](./11-implementation-rosesystem.md).

### Recommended CSS variables
```css
@theme {
  --duration-fast-01: 70ms;
  --duration-fast-02: 110ms;
  --duration-moderate-01: 150ms;
  --duration-moderate-02: 240ms;
  --duration-slow-01: 400ms;
  --duration-slow-02: 700ms;
  --ease-standard: cubic-bezier(0.2, 0, 0.38, 0.9);
  --ease-entrance: cubic-bezier(0, 0, 0.38, 0.9);
  --ease-exit: cubic-bezier(0.2, 0, 1, 0.9);
  --ease-standard-expressive: cubic-bezier(0.4, 0.14, 0.3, 1);
  --ease-entrance-expressive: cubic-bezier(0, 0, 0.3, 1);
  --ease-exit-expressive: cubic-bezier(0.4, 0.14, 1, 1);
}
```

---

## 4. Choreography (multi-element motion)

When several things move together:
- **Stagger** entrances slightly (e.g. list items 20–40ms apart) rather than all-at-once.
- Things **enter in the direction they'll live** (a side panel slides from its edge).
- **Exit faster than enter** (use the shorter end of the range + exit easing).
- Don't animate **everything** — motion draws the eye; if all moves, nothing is signaled.

---

## 5. Accessibility — reduced motion (required)

Always honor the user's preference. Wrap non-essential motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Keep **opacity/color** changes (they convey state) but drop **large translate/scale** motion for these
users. See [`10-accessibility.md`](./10-accessibility.md).

---

## 6. Usage rules

✅ **Do** — match duration to element size; use entrance/exit curves correctly; keep app-shell motion
Productive and quick (≤150ms for most); centralize tokens; honor `prefers-reduced-motion`.

❌ **Don't** — use the same easing for in and out; animate slower than 700ms in a productive tool; add
bouncy/overshoot easings (not Carbon); animate purely for decoration on a data screen.
