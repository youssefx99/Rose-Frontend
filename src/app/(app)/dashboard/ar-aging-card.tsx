"use client";

import { useFormat } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/provider";
import type { AgingBucket } from "@/lib/dashboard";
import { Empty, Panel } from "./dash-card";
import { AGING_HEX } from "./chart-style";

/**
 * Open AR by how long the bill has been sitting. Drawn as plain bars rather
 * than a chart: there are only four buckets, and the money reads faster as a
 * label than as a hovered tooltip.
 */
export function ArAgingCard({ data }: { data: AgingBucket[] }) {
  const t = useT();
  const { formatMoney, formatNumber } = useFormat();
  const total = data.reduce((sum, b) => sum + b.amount, 0);
  const widest = Math.max(...data.map((b) => b.amount), 0);

  return (
    <Panel
      title={t("dashboard.aging.title")}
      subtitle={t("dashboard.aging.subtitle")}
      action={
        total > 0 ? (
          <span className="shrink-0 font-mono type-body-compact-01 font-semibold tabular-nums text-text-primary">
            {formatMoney(total)}
          </span>
        ) : undefined
      }
    >
      {total === 0 ? (
        <Empty label={t("dashboard.aging.empty")} />
      ) : (
        <ul className="space-y-4">
          {data.map((b) => (
            <li key={b.bucket} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2 type-body-compact-01">
                <span className="flex items-center gap-2 text-text-secondary">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: AGING_HEX[b.bucket] }}
                  />
                  {t(`dashboard.aging.bucket.${b.bucket}`)}
                </span>
                <span className="shrink-0 font-mono font-semibold tabular-nums text-text-primary">
                  {formatMoney(b.amount)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-layer">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${widest > 0 ? Math.max(2, (b.amount / widest) * 100) : 0}%`,
                    backgroundColor: AGING_HEX[b.bucket],
                  }}
                />
              </div>
              <p className="font-mono type-label-01 tabular-nums text-text-helper">
                {t("dashboard.claimCount", {
                  count: b.count,
                  formatted: formatNumber(b.count),
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
