"use client";

import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

// Single source of truth for status colors across claims, ingestion jobs, and
// review items. Status badges are the ONLY color in a table row (design system,
// design/08 §9 + §4). Low-saturation light surface + same-hue dark text = the
// Carbon tag look. Hues map to Carbon's status families.
const STATUS_COLORS: Record<string, string> = {
  // Claims — payment progress: nothing in → some in → all in.
  OPEN: "bg-blue-100 text-blue-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800",
  PAID: "bg-green-100 text-green-800",
  // Ingestion jobs
  QUEUED: "bg-zinc-200 text-zinc-600",
  PROCESSING: "bg-blue-100 text-blue-700",
  EXTRACTED: "bg-indigo-100 text-indigo-700",
  IN_REVIEW: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-700",
  FAILED: "bg-red-100 text-red-700",
  // Review items
  MODIFIED: "bg-purple-100 text-purple-700",
  PARTIAL: "bg-amber-100 text-amber-800",
};

export function getStatusColorClasses(status: string): string {
  return STATUS_COLORS[status] ?? "bg-zinc-200 text-zinc-600";
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useT();
  // An unknown status has no `status.*` message, so t() returns the key — fall
  // back to the humanised enum, matching the unknown-status color fallback.
  const key = `status.${status}`;
  const label = t(key);

  return (
    <span
      className={cn(
        "type-label-01 inline-flex w-fit items-center rounded-full px-2 py-0.5 whitespace-nowrap",
        getStatusColorClasses(status),
        className,
      )}
    >
      {label === key ? status.replace(/_/g, " ") : label}
    </span>
  );
}
