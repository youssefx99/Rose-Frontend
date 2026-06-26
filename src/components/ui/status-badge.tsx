import { cn } from "@/lib/utils";

// Single source of truth for status colors across claims, ingestion jobs, and
// review items. Status badges are the ONLY color in a table row (design system,
// design/08 §9 + §4). Low-saturation light surface + same-hue dark text = the
// Carbon tag look. Hues map to Carbon's status families.
const STATUS_COLORS: Record<string, string> = {
  // Claims
  OPEN: "bg-blue-100 text-blue-700",
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-green-100 text-green-800",
  DENIED: "bg-red-100 text-red-700",
  APPEALED: "bg-purple-100 text-purple-700",
  DEDUCTIBLE: "bg-orange-100 text-orange-700",
  WRITTEN_OFF: "bg-zinc-200 text-zinc-600",
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

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "type-label-01 inline-flex w-fit items-center rounded-full px-2 py-0.5 whitespace-nowrap",
        STATUS_COLORS[status] ?? "bg-zinc-200 text-zinc-600",
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
