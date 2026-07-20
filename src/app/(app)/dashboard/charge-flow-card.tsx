"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useFormat } from "@/lib/i18n/format";
import { useLocale, useT } from "@/lib/i18n/provider";
import type { BilledMonth } from "@/lib/dashboard";
import { Empty, Legend, Panel } from "./dash-card";
import { AXIS_TICK, FLOW_HEX, TOOLTIP_STYLE } from "./chart-style";

/** Stacked bottom-up: money kept first, money conceded last. */
const SERIES = [
  { key: "collected", color: FLOW_HEX.collected },
  { key: "stillOpen", color: FLOW_HEX.stillOpen },
  { key: "patientOwed", color: FLOW_HEX.patientOwed },
  { key: "writtenOff", color: FLOW_HEX.writtenOff },
] as const;

/**
 * Where every billed dollar ended up, month by month. The four parts are an
 * exact partition of the charge, so the bar height IS the amount billed — which
 * makes the written-off slice legible as the real cost of a negotiation.
 */
export function ChargeFlowCard({ data }: { data: BilledMonth[] }) {
  const t = useT();
  const { dir } = useLocale();
  const { formatMoney, formatMonth } = useFormat();
  const hasMoney = data.some((m) => m.billed > 0);

  const short = (value: number): string =>
    value >= 1000 ? `${Math.round(value / 1000)}k` : String(Math.round(value));

  return (
    <Panel
      title={t("dashboard.chargeFlow.title")}
      subtitle={t("dashboard.chargeFlow.subtitle")}
    >
      {!hasMoney ? (
        <Empty label={t("dashboard.empty.claims")} />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
            >
              <CartesianGrid stroke="#e0e0e0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                reversed={dir === "rtl"}
                tickFormatter={formatMonth}
              />
              <YAxis
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={44}
                orientation={dir === "rtl" ? "right" : "left"}
                tickFormatter={short}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "#f4f4f4" }}
                labelFormatter={(label) => formatMonth(String(label ?? ""))}
                formatter={(value, name) => [
                  formatMoney(Number(value ?? 0)),
                  t(`dashboard.chargeFlow.${String(name)}`),
                ]}
              />
              {SERIES.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="charge"
                  fill={s.color}
                  maxBarSize={44}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <Legend
            items={SERIES.map((s) => ({
              label: t(`dashboard.chargeFlow.${s.key}`),
              color: s.color,
            }))}
          />
        </>
      )}
    </Panel>
  );
}
