"use client";

import Link from "next/link";

import { formatMoney } from "@/lib/format";
import type { TopClient } from "@/lib/dashboard";
import { Empty, Legend, Panel } from "./dash-card";
import { COLLECTED, OUTSTANDING } from "./chart-style";

const PLOT_HEIGHT = 184; // px — height of the column plot area
const MIN_BAR = 6; // px — keep tiny bars visible

/** Compact dollar label for the top of a column, e.g. $34k / $950. */
function compactMoney(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(n)}`;
}

function ColumnTooltip({ client }: { client: TopClient }) {
  const rate =
    client.billed > 0 ? (client.collected / client.billed) * 100 : 0;
  const rows: { label: string; value: string }[] = [
    { label: "Billed", value: formatMoney(client.billed) },
    { label: "Collected", value: formatMoney(client.collected) },
    { label: "Collection rate", value: `${rate.toFixed(0)}%` },
    {
      label: "Pending claims",
      value: `${client.openClaims} of ${client.claimCount}`,
    },
  ];
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-44 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-2.5 text-xs shadow-md group-hover:block">
      <p className="mb-1.5 truncate font-medium text-zinc-900">
        {client.clientName}
      </p>
      <dl className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3">
            <dt className="text-zinc-500">{r.label}</dt>
            <dd className="font-mono tabular-nums text-zinc-900">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function TopClientsCard({ data }: { data: TopClient[] }) {
  const max = Math.max(1, ...data.map((c) => c.billed));

  return (
    <Panel title="Top clients" subtitle="billed vs collected, by client">
      {data.length === 0 ? (
        <Empty label="No clients yet" />
      ) : (
        <>
          {/* Columns */}
          <div
            className="flex items-end justify-around gap-2 sm:gap-4"
            style={{ height: PLOT_HEIGHT }}
          >
            {data.map((c) => {
              const barH = Math.max(MIN_BAR, (c.billed / max) * PLOT_HEIGHT);
              const collectedH =
                c.billed > 0 ? (c.collected / c.billed) * barH : 0;
              return (
                <div
                  key={c.clientId}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end"
                >
                  <ColumnTooltip client={c} />
                  <span className="mb-1.5 font-mono text-xs font-semibold tabular-nums text-zinc-700">
                    {compactMoney(c.billed)}
                  </span>
                  <div
                    className="flex w-full max-w-[52px] flex-col-reverse overflow-hidden rounded-t-md ring-1 ring-inset ring-black/5 transition-[height] duration-500 ease-out"
                    style={{ height: barH, backgroundColor: OUTSTANDING }}
                  >
                    <div
                      className="w-full transition-[height] duration-500 ease-out"
                      style={{ height: collectedH, backgroundColor: COLLECTED }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis: client name + pending badge */}
          <div className="mt-2.5 flex items-start justify-around gap-2 sm:gap-4">
            {data.map((c) => (
              <div
                key={c.clientId}
                className="flex flex-1 flex-col items-center gap-1 text-center"
              >
                <Link
                  href={`/clients/${c.clientId}`}
                  title={c.clientName}
                  className="line-clamp-1 max-w-full text-xs font-medium text-zinc-700 transition-colors hover:text-rose-600 hover:underline"
                >
                  {c.clientName}
                </Link>
                {c.openClaims > 0 ? (
                  <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-amber-700 ring-1 ring-inset ring-amber-200">
                    {c.openClaims} pending
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    paid
                  </span>
                )}
              </div>
            ))}
          </div>

          <Legend
            items={[
              { label: "Collected", color: COLLECTED },
              { label: "Outstanding", color: OUTSTANDING },
            ]}
          />
        </>
      )}
    </Panel>
  );
}
