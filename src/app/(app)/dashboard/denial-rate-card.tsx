import { cn } from "@/lib/utils";
import { DashCard } from "./dash-card";

export function DenialRateCard({ rate }: { rate: number }) {
  const color =
    rate > 10
      ? "text-red-600"
      : rate >= 5
        ? "text-amber-600"
        : "text-green-600";

  return (
    <DashCard title="Denial Rate">
      <p
        className={cn(
          "font-mono text-3xl font-semibold tabular-nums",
          color,
        )}
      >
        {rate.toFixed(1)}%
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Percentage of claims denied by payers this period.
      </p>
    </DashCard>
  );
}
