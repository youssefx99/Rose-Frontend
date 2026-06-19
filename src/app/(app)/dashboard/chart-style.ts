/** Shared chart styling so no recharts default colors/tooltips leak through. */

export const TOOLTIP_STYLE = {
  backgroundColor: "white",
  border: "1px solid #e4e4e7",
  borderRadius: "6px",
  fontSize: "12px",
} as const;

export const AXIS_TICK = { fontSize: 12, fill: "#71717a" } as const;

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

export const SLATE = "#0f172a";
export const RED = "#ef4444";
export const ZINC_400 = "#a1a1aa";

/** Compact dollar axis label, e.g. $12k. */
export function formatK(value: number): string {
  return `$${Math.round(value / 1000)}k`;
}
