/**
 * The payer follow-up clock. Once this many CALENDAR days have passed since a
 * claim was billed with nothing paid, billing contacts the payer to say the
 * money never arrived. Mirror of FOLLOW_UP_DAYS in the backend's
 * common/claim-metrics.ts — keep the two in step.
 */
export const FOLLOW_UP_DAYS = 70;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Below this the clock is nearly out and the claim is worth watching. */
const SOON_DAYS = 14;

/** Days left on a bill's follow-up clock; zero or less means it has run out. */
export function followUpDaysLeft(dateBilled: string): number {
  return FOLLOW_UP_DAYS - Math.floor((Date.now() - Date.parse(dateBilled)) / DAY_MS);
}

export type CountdownTone = "expired" | "soon" | "ok";

export function countdownTone(daysLeft: number): CountdownTone {
  if (daysLeft <= 0) return "expired";
  if (daysLeft <= SOON_DAYS) return "soon";
  return "ok";
}

/** Badge colors per tone, shared by the dashboard and the claims table. */
export const COUNTDOWN_CLASS: Record<CountdownTone, string> = {
  expired: "bg-support-error-bg text-support-error ring-support-error",
  soon: "bg-support-warning-bg text-text-primary ring-support-warning",
  ok: "bg-layer text-text-secondary ring-border-subtle",
};
