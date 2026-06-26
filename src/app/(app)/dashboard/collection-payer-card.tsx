"use client";

import { formatMoney } from "@/lib/format";
import type { PayerCollection } from "@/lib/dashboard";
import { Empty, Panel } from "./dash-card";

export function CollectionPayerCard({ data }: { data: PayerCollection[] }) {
  return (
    <Panel title="Collection by payer" subtitle="paid ÷ billed">
      {data.length === 0 ? (
        <Empty label="No payer activity yet" />
      ) : (
        <ul className="space-y-4">
          {data.map((p) => (
            <li key={p.payerName} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate font-medium text-zinc-800">
                  {p.payerName}
                </span>
                <span className="shrink-0 font-mono font-semibold tabular-nums text-zinc-900">
                  {p.rate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.max(2, p.rate))}%` }}
                />
              </div>
              <p className="font-mono text-xs tabular-nums text-zinc-400">
                {formatMoney(p.collected)} of {formatMoney(p.billed)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
