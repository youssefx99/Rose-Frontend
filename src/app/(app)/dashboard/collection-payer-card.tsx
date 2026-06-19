"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PayerCollection } from "@/lib/dashboard";
import { DashCard } from "./dash-card";
import { AXIS_TICK, RED, SLATE, TOOLTIP_STYLE } from "./chart-style";

const LOW_THRESHOLD = 60;

export function CollectionPayerCard({ data }: { data: PayerCollection[] }) {
  return (
    <DashCard title="Collection Rate by Payer">
      {data.length === 0 ? (
        <p className="text-sm text-zinc-400">No payer activity yet.</p>
      ) : (
        <div style={{ height: Math.max(data.length * 44, 160) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ left: 8, right: 36, top: 4, bottom: 4 }}
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="payerName"
                width={110}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "#fafafa" }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => `${Number(value ?? 0).toFixed(1)}%`}
              />
              <Bar dataKey="collectionRate" radius={[0, 4, 4, 0]} barSize={18}>
                {data.map((d) => (
                  <Cell
                    key={d.payerName}
                    fill={d.collectionRate < LOW_THRESHOLD ? RED : SLATE}
                  />
                ))}
                <LabelList
                  dataKey="collectionRate"
                  position="right"
                  fontSize={11}
                  fill="#71717a"
                  formatter={(value) => `${Math.round(Number(value ?? 0))}%`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashCard>
  );
}
