# 07 · Iconography

Carbon ships a large, consistent icon library (`@carbon/icons` / `@carbon/icons-react`) built on a
strict grid. This repo uses **`lucide-react`** instead — visually compatible (same 24px, 2px-stroke,
geometric language). This doc covers Carbon's icon rules and how to apply them with lucide.

---

## 1. Icon sizes

Carbon icons are drawn on **four artboards**: **16, 20, 24, 32 px**. In UI:

| Size | Token | When |
|------|-------|------|
| **16px** | `icon-size-01` | **Default in UI** — next to 14px text, inside buttons, table row actions, inputs |
| **20px** | `icon-size-02` | Slightly emphasized inline icons |
| **24px** | — | Standalone/nav icons, comfortable touch targets |
| **32px** | — | Feature/empty-state icons, large affordances |

> Use the artboard that matches the rendered size — don't scale a 24px icon down to 16; pick the 16px
> source. With lucide (vector), set the rendered size directly: `size-4` (16), `size-5` (20), `size-6`
> (24), `size-8` (32).

In this repo the convention is **`size-4` (16px)** for inline/button/nav icons — correct and Carbon-aligned.

---

## 2. Style rules

- **2px stroke**, geometric, square or rounded-square terminals — both Carbon and lucide match this.
- Icons are **monochrome**; they take their color from the **icon token** (`icon-primary`,
  `icon-secondary`, `icon-on-color`, `icon-interactive`, `icon-disabled`), i.e. `currentColor`.
- Keep **optical alignment** with adjacent text (vertically center; 16px icon pairs with 14px text).
- Maintain the icon's internal padding — don't crop to the glyph edge.

---

## 3. Color usage

| Context | Token | Hex (White theme) |
|---------|-------|-------------------|
| Default icon | `icon-primary` | `#161616` |
| Secondary / muted icon | `icon-secondary` | `#525252` |
| Icon on a colored fill (primary button) | `icon-on-color` | `#ffffff` |
| Interactive icon (icon-only button, link) | `icon-interactive` | `#0f62fe` |
| Disabled | `icon-disabled` | `rgba(22,22,22,0.25)` |
| Status icons | `support-*` | error `#da1e28`, success `#24a148`, warning `#f1c21b`, info `#0043ce` |

With Tailwind/lucide, set the icon color via text color on the icon or parent: `className="size-4
text-[var(--icon-secondary)]"` or simply inherit `currentColor`.

---

## 4. Common icon → meaning conventions (keep consistent)

Use one icon per concept across the whole app. The repo's `(app)/layout.tsx` already establishes a
nav vocabulary — keep extending it consistently:

| Concept | lucide (this repo) | Carbon equivalent |
|---------|--------------------|-------------------|
| Dashboard | `LayoutDashboard` | `Dashboard` |
| Claims / documents | `FileText` | `Document` |
| Clients / users | `Users` | `Group` / `User` |
| Payers / orgs | `Building2` | `Enterprise` |
| Upload | `Upload` | `Upload` |
| Review queue / inbox | `Inbox` | `Inbox` |
| Remittances / receipts | `Receipt` | `Receipt` / `Money` |
| Admin / roles | `ShieldCheck`, `KeyRound` | `Security`, `Password` |
| Sign out | `LogOut` | `Logout` |
| Success | `CheckmarkFilled` → lucide `CheckCircle2` | `CheckmarkFilled` |
| Error | lucide `XCircle` / `AlertCircle` | `ErrorFilled` |
| Warning | lucide `AlertTriangle` | `WarningFilled` / `WarningAltFilled` |
| Info | lucide `Info` | `InformationFilled` |
| Close | lucide `X` | `Close` |
| Overflow menu | lucide `MoreVertical` | `OverflowMenuVertical` |
| Expand/collapse | lucide `ChevronDown`/`ChevronRight` | `ChevronDown` |

> **Status icons should match status colors** from [`06`](./06-themes-and-tokens.md): a success icon is
> green-50, an error icon red-60, etc. Notifications/inline validation pair the icon + the support color.

---

## 5. Usage rules

✅ **Do** — default to 16px inline; color via tokens/`currentColor`; one icon per concept; pair status
icons with status colors; keep 2px-stroke geometric style (lucide default).

❌ **Don't** — mix icon families (don't combine lucide with another set mid-UI); use multicolor or
filled-emoji icons in productive UI; scale icons to off-grid sizes (15px, 18px); use an icon as the only
signifier of a destructive/critical action without a text label or `aria-label`.
