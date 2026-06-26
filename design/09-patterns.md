# 09 · Patterns

Patterns are how components combine into recurring solutions. These are the ones RoseSystem (a billing/
claims operations app) needs most. Each pattern lists anatomy + the tokens/specs to use, so a new page
is assembled, not invented.

---

## 1. Page scaffold (every app page)

```
PageHeader  ──────────────────────────────────────────────
  Title (heading-04, 28/36, text-primary)
  Subtitle/description (body-01, text-secondary)        [optional]
  Primary action button (top-right)                      [optional]
  ↕ spacing-07 (32px)
Toolbar / Filter bar (search + filters + actions)        [list pages]
  ↕ spacing-05 (16px)
Content (cards / table / form)
```

- Page padding: `spacing-06` (24px) — matches `main` `p-6` in `(app)/layout.tsx`.
- One **primary** action per page (top-right). Secondary actions are `secondary`/`ghost`.
- This repo already has `src/components/ui/page-header.tsx` — use it for every page so titles/spacing are
  uniform.

---

## 2. Forms

**Layout**
- **Single column** by default (faster to complete, fewer errors). Two columns only for short, related
  pairs (e.g. City / State) on wide screens.
- Vertical rhythm: label→field `spacing-02/03`; field→field `spacing-05/06` (16–24px); group→group
  `spacing-07`.
- Group related fields with `FormGroup` + a group label.

**Field anatomy** (see [`08 §5`](./08-components.md#5-text-inputs-textinput--textarea--numberinput--passwordinput))
```
Label (label-01, 12px)
[ input — field height 40/48, bottom/box border ]
Helper text (helper-text-01) ── OR ── Error (text-error + icon)
```

**Validation**
- Validate on **blur** and on **submit**; show errors inline at the field (2px red border + red helper +
  icon), and optionally a summary inline-notification at the top for many errors.
- Required fields marked consistently (asterisk or "(required)"); don't rely on color alone.
- Keep the **submit** button disabled only when you can clearly justify it; otherwise allow submit and
  show errors (better for screen-reader users).

**This repo** uses `react-hook-form` + `zod` (`@hookform/resolvers`). Pattern: zod schema → field-level
errors → render under each input with `helper-text-01` styling + `text-error`. See existing
`claim-form.tsx` / `user-form-dialog.tsx`.

---

## 3. Data table page (Claims, Clients, Payers, Remittances, Users)

```
PageHeader (title + "New X" primary button)
Filter bar:  [ Search ]  [ Status ▾ ]  [ Date ▾ ]   … (right: column/extra actions)
Table:
  Header row (heading-compact-01, sortable arrows)
  Rows (body-compact-01; status via StatusBadge — the ONLY color; numbers right-aligned, tabular)
  Row hover = layer-hover; selected = layer-selected + checkbox
Pagination (below): page-size select · "1–25 of 312" · ‹ ›
Empty state (when no rows) / Skeleton (while loading)
```

Rules:
- **Status is the only color in a row.** Everything else grayscale. (Already the system rule — see
  `status-badge.tsx` / `chart-style.ts` comments.)
- Right-align and tabular-format money/counts.
- Provide row actions via an **overflow menu** (⋮) at the row end, not a row of buttons.
- Keep filter state in the URL where practical (shareable, back-button friendly).

---

## 4. Detail page (a single claim / client / remittance)

```
PageHeader: Title (entity name/number, heading-04) · status tag · primary action
Summary band: key facts as label/value pairs (Detail component) — 2–4 columns on wide
Tabs or sections: Overview · Line items · Notes · History
Tables/lists within sections
Side panel / slide-over for edit
```

- Use `src/components/ui/detail.tsx` for label/value pairs (`label-01` label over `body-compact-01`
  value, or inline). Keep alignment grid-anchored.
- Destructive actions (delete) → **danger** button → **danger confirm dialog** with cascade preview
  (`cascade-delete-dialog.tsx`). Never delete without the impact preview (project rule).

---

## 5. Empty states

Every list/table/section that can be empty needs a deliberate empty state:
```
[ 32px muted icon ]
Headline (heading-02 / body-compact-02, text-primary)   e.g. "No claims yet"
Supporting line (body-01, text-secondary)               e.g. "Upload a document to get started."
[ Primary action ]                                       e.g. "Upload document"
```
Centered in the content area, generous whitespace (`spacing-09`+). Distinguish **empty** (no data ever)
from **no results** (filters too narrow → offer "Clear filters").

---

## 6. Loading states

- **Known layout** (table/cards) → **Skeleton** (shimmer) matching the real layout. Avoid layout shift.
- **Action in progress** (save/submit) → **InlineLoading** in/near the button ("Saving…" → "Saved").
- **Whole-page auth/route gate** → simple centered spinner/text (as in `(app)/layout.tsx`).
- Never block the entire screen for a partial update.

---

## 7. Error & feedback states

| Situation | Pattern |
|-----------|---------|
| Field invalid | Inline error at field (2px red border + `text-error` helper + icon) |
| Form-level failure | **Inline notification** (error kind) at top of form with the reason |
| Transient success ("Saved", "Deleted") | **Toast** (success), top-right, auto-dismiss (`sonner`) |
| Background/async failure | **Toast** (error) with a retry action if possible |
| Page-level fatal (load failed) | Centered error state with icon + message + "Retry" |
| Destructive confirm | **Danger modal** (`cascade-delete-dialog`) with impact preview |

Always pair color with an **icon + text** (never color alone). Messages are specific and actionable
("Payer name is required", not "Invalid input").

---

## 8. Notifications choreography

- **Inline** for context-bound messages that should persist (validation, page warnings).
- **Toast** for transient confirmations/async results; top-right; stack newest on top; auto-dismiss
  (~4–5s) except errors (let the user dismiss).
- Don't toast for things the user can see happened (e.g. a row visibly removed) unless it's async.

---

## 9. Confirmation & destructive actions

- Destructive = **danger** styling end-to-end (button → modal).
- The modal states **what** will be deleted and **what cascades** (impact preview), then danger-primary
  "Delete" + secondary "Cancel".
- Prefer **undo** (toast with Undo) over confirm for low-risk, reversible actions; reserve modals for
  truly destructive ones.

---

## 10. Money, numbers & dates (domain-specific)

This is a billing app — be rigorous:
- **Money:** right-aligned, tabular figures, consistent currency formatting, 2 decimals; negatives
  clearly marked (parentheses or `-` + `text-error` for amounts owed where meaningful). Use
  `src/lib/format.ts` as the single formatter.
- **Counts/IDs/claim numbers:** Mono or tabular; never let columns of numbers misalign.
- **Dates:** one format app-wide (e.g. `MMM D, YYYY`); show relative time only where it helps ("2h ago").
- **Status:** always via `StatusBadge` with the fixed color vocabulary.

---

## 11. Responsive behavior

- Below `md` (672px): collapse multi-column → single column; sidebar → off-canvas/hidden (already
  `hidden md:flex` in the shell); tables → horizontal scroll or stacked "cards".
- Keep primary actions reachable (sticky footer/header on small screens if needed).
- Don't hide essential data on mobile — reflow it.

---

## 12. Pattern checklist

- [ ] Page uses `PageHeader` + 24px padding + 32px title→content gap.
- [ ] One primary action per view.
- [ ] Lists have empty, loading (skeleton), and error states.
- [ ] Status only via `StatusBadge`; tables otherwise grayscale; numbers tabular/right-aligned.
- [ ] Destructive flows use danger button + impact-preview modal.
- [ ] Feedback uses inline (persistent) vs toast (transient) correctly, color + icon + text.
- [ ] Forms single-column, validated, errors inline with helper-text styling.
