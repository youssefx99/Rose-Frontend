"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney } from "@/lib/format";
import type { ArAgingBucket } from "@/lib/dashboard";
import { DashCard } from "./dash-card";
import { AXIS_TICK, formatK, RED, SLATE, TOOLTIP_STYLE } from "./chart-style";

interface BarLabelProps {
  x?: string | number;
  y?: string | number;
  width?: string | number;
  index?: number;
}

export function ArAgingCard({ data }: { data: ArAgingBucket[] }) {
  // "Action needed" sits above the 90+ bar only.
  const renderActionLabel = ({ x, y, width, index }: BarLabelProps) => {
    if (data[index ?? -1]?.bucket !== "90+") return <g />;
    return (
      <text
        x={Number(x ?? 0) + Number(width ?? 0) / 2}
        y={Number(y ?? 0) - 6}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill={RED}
      >
        Action needed
      </text>
    );
  };

  return (
    <DashCard title="AR Aging">
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
            <XAxis
              dataKey="bucket"
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
              cursor={{ fill: "#fafafa" }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => formatMoney(Number(value ?? 0))}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} label={renderActionLabel}>
              {data.map((b) => (
                <Cell key={b.bucket} fill={b.bucket === "90+" ? RED : SLATE} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashCard>
  );
}
