import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  valueClassName?: string;
}

export function StatCard({ label, value, hint, valueClassName }: StatCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-2xl font-semibold tabular-nums text-zinc-900",
          valueClassName,
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-400">{hint}</p>
    </div>
  );
}
