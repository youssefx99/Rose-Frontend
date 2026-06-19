"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney } from "@/lib/format";
import type { MonthlyTrendPoint } from "@/lib/dashboard";
import { DashCard } from "./dash-card";
import { AXIS_TICK, formatK, SLATE, TOOLTIP_STYLE, ZINC_400 } from "./chart-style";

export function MonthlyTrendCard({ data }: { data: MonthlyTrendPoint[] }) {
  return (
    <DashCard title="Monthly Revenue Trend — last 6 months">
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis
              dataKey="month"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatK}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => formatMoney(Number(value ?? 0))}
            />
            <Line
              type="monotone"
              dataKey="billed"
              stroke={ZINC_400}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="collected"
              stroke={SLATE}
              strokeWidth={2}
              dot={{ r: 3, fill: SLATE }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-center gap-6 text-xs text-zinc-500">
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4" style={{ borderTop: `2px dashed ${ZINC_400}` }} />
          Billed
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4 rounded" style={{ backgroundColor: SLATE }} />
          Collected
        </span>
      </div>
    </DashCard>
  );
}
