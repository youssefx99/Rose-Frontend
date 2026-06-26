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
            <li key={p.payerName} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2 type-body-compact-01">
                <span className="truncate font-medium text-text-primary">
                  {p.payerName}
                </span>
                <span className="shrink-0 font-mono font-semibold tabular-nums text-text-primary">
                  {p.rate.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-layer">
                <div
                  className="h-full rounded-full bg-support-success transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.max(2, p.rate))}%` }}
                />
              </div>
              <p className="font-mono type-label-01 tabular-nums text-text-helper">
                {formatMoney(p.collected)} of {formatMoney(p.billed)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
