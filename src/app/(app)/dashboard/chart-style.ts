/** Shared chart styling so no recharts default colors/tooltips leak through. */

export const TOOLTIP_STYLE = {
  backgroundColor: "#ffffff", // bg-card
  border: "1px solid #e0e0e0", // border-subtle
  borderRadius: "4px", // rounded-md
  color: "#161616", // text-primary
  fontSize: "12px",
} as const;

export const AXIS_TICK = { fontSize: 12, fill: "#6f6f6f" } as const; // text-secondary (gray-60)

// Status colors must match the design system exactly.
export const STATUS_HEX: Record<string, string> = {
  OPEN: "#3b82f6",
  PENDING: "#f59e0b",
  PAID: "#22c55e",
  DENIED: "#ef4444",
  APPEALED: "#a855f7",
  DEDUCTIBLE: "#f97316",
  WRITTEN_OFF: "#a1a1aa",
};

export const SLATE = "#393939"; // gray-80
export const RED = "#da1e28"; // red-50 (support-error)
export const ZINC_400 = "#a1a1aa"; // neutral fallback gray
// Brand accent for key highlights = rose #f43f5e (scarce — used via tokens elsewhere).

// Billed vs collected money series (Carbon-aligned).
export const BILLED = "#393939"; // gray-80
export const COLLECTED = "#24a148"; // green-50 (success)
export const OUTSTANDING = "#c6c6c6"; // gray-30 (billed not yet collected)

/** Compact dollar axis label, e.g. $12k. */
export function formatK(value: number): string {
  return `$${Math.round(value / 1000)}k`;
}
