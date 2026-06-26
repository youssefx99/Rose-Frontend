import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "default" | "green" | "rose";
}

/** A single headline KPI: muted label, large tabular value, optional sub-line. */
export function StatCard({ label, value, sub, accent = "default" }: StatCardProps) {
  return (
    <div className="rounded-md border border-border-subtle bg-card p-6">
      <p className="type-label-01 uppercase tracking-wider text-text-secondary">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 type-heading-04 font-mono tabular-nums",
          accent === "green"
            ? "text-support-success"
            : accent === "rose"
              ? "text-interactive"
              : "text-text-primary",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 type-label-01 text-text-helper">{sub}</p>}
    </div>
  );
}
