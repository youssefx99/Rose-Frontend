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
  PARTIALLY_PAID: "#f59e0b",
  PAID: "#22c55e",
};

export const SLATE = "#393939"; // gray-80
export const RED = "#da1e28"; // red-50 (support-error)
export const ZINC_400 = "#a1a1aa"; // neutral fallback gray
// Brand accent for key highlights = rose #f43f5e (scarce — used via tokens elsewhere).

// Billed vs collected money series (Carbon-aligned).
export const BILLED = "#393939"; // gray-80
export const COLLECTED = "#24a148"; // green-50 (success)
export const OUTSTANDING = "#c6c6c6"; // gray-30 (billed not yet collected)

// "Where the charge went" — a partition of the billed charge, ordered from
// money we kept to money we never will.
export const FLOW_HEX = {
  collected: COLLECTED, // green-50 — landed in the bank
  stillOpen: "#3b82f6", // blue-50 — matches OPEN status
  patientOwed: "#f59e0b", // amber-50 — the patient's share, not the payer's
  writtenOff: OUTSTANDING, // gray-30 — conceded in the negotiation
} as const;

// AR aging: green while healthy, red once the follow-up clock has run out.
export const AGING_HEX: Record<string, string> = {
  "0-30": "#24a148",
  "31-60": "#f59e0b",
  "61-90": "#f97316",
  "90+": "#da1e28",
};
