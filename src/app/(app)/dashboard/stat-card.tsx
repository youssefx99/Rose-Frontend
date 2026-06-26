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
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl",
          accent === "green"
            ? "text-emerald-600"
            : accent === "rose"
              ? "text-rose-600"
              : "text-zinc-950",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}
