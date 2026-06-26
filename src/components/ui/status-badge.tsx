import { cn } from "@/lib/utils";

// Single source of truth for status colors across claims, ingestion jobs, and
// review items. Status badges are the only color in tables (design system).
const STATUS_COLORS: Record<string, string> = {
  // Claims
  OPEN: "bg-blue-100 text-blue-700",
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  DENIED: "bg-red-100 text-red-700",
  APPEALED: "bg-purple-100 text-purple-700",
  DEDUCTIBLE: "bg-orange-100 text-orange-700",
  WRITTEN_OFF: "bg-zinc-100 text-zinc-500",
  // Ingestion jobs
  QUEUED: "bg-zinc-100 text-zinc-600",
  PROCESSING: "bg-blue-100 text-blue-700",
  EXTRACTED: "bg-indigo-100 text-indigo-700",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  FAILED: "bg-red-100 text-red-700",
  // Review items
  MODIFIED: "bg-purple-100 text-purple-700",
  PARTIAL: "bg-amber-100 text-amber-700",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_COLORS[status] ?? "bg-zinc-100 text-zinc-600",
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
