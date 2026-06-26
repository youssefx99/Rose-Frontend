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
    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-44 -translate-x-1/2 rounded-md border border-border-subtle bg-card p-3 type-label-01 shadow-md group-hover:block">
      <p className="mb-2 truncate font-medium text-text-primary">
        {client.clientName}
      </p>
      <dl className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3">
            <dt className="text-text-secondary">{r.label}</dt>
            <dd className="font-mono tabular-nums text-text-primary">{r.value}</dd>
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
                  <span className="mb-2 font-mono type-label-01 font-semibold tabular-nums text-text-secondary">
                    {compactMoney(c.billed)}
                  </span>
                  <div
                    className="flex w-full max-w-[52px] flex-col-reverse overflow-hidden rounded-t-md ring-1 ring-inset ring-border-subtle transition-[height] duration-500 ease-out"
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
                  className="line-clamp-1 max-w-full type-label-01 font-medium text-text-primary transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:text-link hover:underline"
                >
                  {c.clientName}
                </Link>
                {c.openClaims > 0 ? (
                  <span className="rounded-full bg-support-warning-bg px-2 py-0.5 type-label-01 font-medium tabular-nums text-text-primary ring-1 ring-inset ring-support-warning">
                    {c.openClaims} pending
                  </span>
                ) : (
                  <span className="rounded-full bg-support-success-bg px-2 py-0.5 type-label-01 font-medium text-support-success ring-1 ring-inset ring-support-success">
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
