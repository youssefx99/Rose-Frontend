/** Shared formatting helpers (money, dates) used across pages. */

export function timeAgo(value: string | null | undefined): string {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function daysSince(value: string | null | undefined): number {
  if (!value) return 0;
  return Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
}

export function formatMoney(value: string | number | null | undefined): string {
  const n = Number(value ?? 0);
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export function formatDateTime(value: string | null | undefined): string {
  return value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
}
