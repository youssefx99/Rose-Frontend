"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney } from "@/lib/format";
import type { MonthlyTrendPoint } from "@/lib/dashboard";
import { Legend, Panel } from "./dash-card";
import { AXIS_TICK, BILLED, COLLECTED, formatK, TOOLTIP_STYLE } from "./chart-style";

export function MonthlyTrendCard({ data }: { data: MonthlyTrendPoint[] }) {
  return (
    <Panel title="Billed vs collected" subtitle="by service month · last 6 months">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-billed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BILLED} stopOpacity={0.16} />
              <stop offset="100%" stopColor={BILLED} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-collected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLLECTED} stopOpacity={0.22} />
              <stop offset="100%" stopColor={COLLECTED} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e0e0e0" />
          <XAxis
            dataKey="month"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatK}
            width={48}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => formatMoney(Number(value ?? 0))}
          />
          <Area
            type="monotone"
            dataKey="billed"
            name="Billed"
            stroke={BILLED}
            strokeWidth={2}
            fill="url(#grad-billed)"
          />
          <Area
            type="monotone"
            dataKey="collected"
            name="Collected"
            stroke={COLLECTED}
            strokeWidth={2}
            fill="url(#grad-collected)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <Legend
        items={[
          { label: "Billed", color: BILLED },
          { label: "Collected", color: COLLECTED },
        ]}
      />
    </Panel>
  );
}
