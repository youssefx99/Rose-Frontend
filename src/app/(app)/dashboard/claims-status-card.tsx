"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { ClaimStatusMetric } from "@/lib/dashboard";
import { Empty, Panel } from "./dash-card";
import { STATUS_HEX, TOOLTIP_STYLE } from "./chart-style";

export function ClaimsStatusCard({ data }: { data: ClaimStatusMetric[] }) {
  const rows = data.filter((d) => d.count > 0);
  const total = rows.reduce((sum, d) => sum + d.count, 0);

  return (
    <Panel title="Claims by status" subtitle={`${total} claim${total === 1 ? "" : "s"}`}>
      {total === 0 ? (
        <Empty label="No claims yet" />
      ) : (
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <ResponsiveContainer width={148} height={148}>
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={rows.length > 1 ? 2 : 0}
                  stroke="none"
                >
                  {rows.map((d) => (
                    <Cell key={d.status} fill={STATUS_HEX[d.status] ?? "#a1a1aa"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="type-heading-03 font-mono font-semibold tabular-nums text-text-primary">
                {total}
              </span>
              <span className="type-label-01 uppercase tracking-wider text-text-helper">
                claims
              </span>
            </div>
          </div>
          <ul className="flex-1 space-y-2">
            {rows.map((d) => (
              <li
                key={d.status}
                className="flex items-center justify-between gap-2 type-body-compact-01"
              >
                <span className="flex items-center gap-2 text-text-secondary">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_HEX[d.status] ?? "#a1a1aa" }}
                  />
                  {d.status.replace(/_/g, " ").toLowerCase()}
                </span>
                <span className="font-mono tabular-nums text-text-primary">
                  {d.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
