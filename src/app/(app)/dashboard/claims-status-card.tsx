"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useFormat } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/provider";
import type { ClaimStatusMetric } from "@/lib/dashboard";
import { Empty, Panel } from "./dash-card";
import { STATUS_HEX, TOOLTIP_STYLE } from "./chart-style";

export function ClaimsStatusCard({ data }: { data: ClaimStatusMetric[] }) {
  const t = useT();
  const { formatNumber } = useFormat();
  const rows = data.filter((d) => d.count > 0);
  const total = rows.reduce((sum, d) => sum + d.count, 0);

  return (
    <Panel
      title={t("dashboard.claimsStatus.title")}
      subtitle={t("dashboard.claimCount", {
        count: total,
        formatted: formatNumber(total),
      })}
    >
      {total === 0 ? (
        <Empty label={t("dashboard.empty.claims")} />
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
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, name) => [
                    formatNumber(Number(value ?? 0)),
                    t(`status.${name}`),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="type-heading-03 font-mono font-semibold tabular-nums text-text-primary">
                {formatNumber(total)}
              </span>
              <span className="type-label-01 uppercase tracking-wider text-text-helper">
                {t("dashboard.claimsStatus.centerLabel")}
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
                  {t(`status.${d.status}`)}
                </span>
                <span className="font-mono tabular-nums text-text-primary">
                  {formatNumber(d.count)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
