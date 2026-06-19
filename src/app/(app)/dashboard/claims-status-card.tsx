"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/format";
import type { ClaimStatusMetric } from "@/lib/dashboard";
import { DashCard } from "./dash-card";
import { STATUS_HEX, TOOLTIP_STYLE } from "./chart-style";

export function ClaimsStatusCard({ data }: { data: ClaimStatusMetric[] }) {
  const pieData = data.filter((d) => d.count > 0);

  return (
    <DashCard title="Claims by Status">
      <div className="h-[170px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="count"
              nameKey="status"
              innerRadius={44}
              outerRadius={70}
              paddingAngle={2}
              stroke="white"
            >
              {pieData.map((d) => (
                <Cell key={d.status} fill={STATUS_HEX[d.status]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {data.map((row) => (
          <div
            key={row.status}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs"
            style={{ fontSize: '10px' }}
          >
            <StatusBadge status={row.status} />
            <span className="font-mono tabular-nums text-zinc-700">{row.count}</span>
            <span className="font-mono tabular-nums font-semibold text-zinc-900">
              {formatMoney(row.totalCharge)}
            </span>
          </div>
        ))}
      </div>
    </DashCard>
  );
}
