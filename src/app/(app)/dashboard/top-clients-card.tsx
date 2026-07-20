"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { useFormat } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/provider";
import type { TopClient } from "@/lib/dashboard";
import { COUNTDOWN_CLASS, countdownTone } from "@/lib/claim-countdown";
import { cn } from "@/lib/utils";
import { Empty, Legend, Panel } from "./dash-card";
import { COLLECTED, OUTSTANDING, RED } from "./chart-style";

const BAR_HEIGHT = 24; // px — bar thickness, fixed however many clients there are
const VISIBLE_ROWS = 10; // rows shown before the widget scrolls internally
const ROW_PITCH = 52; // px — one row incl. its label line and gap

export function TopClientsCard({ data }: { data: TopClient[] }) {
  const t = useT();
  const { formatMoney, formatNumber } = useFormat();
  // Bars are paid + still unpaid: the negotiated write-off is not money in
  // play, so it never shows up as length.
  const total = (c: TopClient) => c.collected + c.outstanding;
  const max = Math.max(1, ...data.map(total));

  return (
    <Panel
      title={t("dashboard.topClients.title")}
      subtitle={t("dashboard.topClients.subtitle", {
        formatted: formatNumber(data.length),
      })}
    >
      {data.length === 0 ? (
        <Empty label={t("dashboard.empty.clients")} />
      ) : (
        <>
          <ul
            className="space-y-3 overflow-y-auto pe-2"
            style={{ maxHeight: VISIBLE_ROWS * ROW_PITCH }}
          >
            {data.map((c) => {
              const sum = total(c);
              const rate = sum > 0 ? (c.collected / sum) * 100 : 0;
              return (
                <li key={c.clientId}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-1">
                      {c.overdueClaims > 0 && (
                        <AlertTriangle
                          className="size-3 shrink-0 text-support-error"
                          aria-label={t("dashboard.countdown.problem")}
                        />
                      )}
                      <Link
                        href={`/clients/${c.clientId}`}
                        title={c.clientName}
                        className="truncate type-label-01 font-medium text-text-primary transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:text-link hover:underline"
                      >
                        {c.clientName}
                      </Link>
                      <span className="shrink-0 type-label-01 text-text-helper">
                        {t("dashboard.topClients.openOfTotal", {
                          open: formatNumber(c.openClaims),
                          total: formatNumber(c.claimCount),
                        })}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-mono type-label-01 tabular-nums text-text-secondary">
                        {formatMoney(c.collected)} / {formatMoney(sum)} ·{" "}
                        {rate.toFixed(0)}%
                      </span>
                      {c.daysLeft === null ? (
                        <span className="rounded-full bg-support-success-bg px-2 py-0.5 type-label-01 font-medium text-support-success ring-1 ring-inset ring-support-success">
                          {t("dashboard.badge.paid")}
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 type-label-01 font-medium tabular-nums ring-1 ring-inset",
                            COUNTDOWN_CLASS[countdownTone(c.daysLeft)],
                          )}
                        >
                          {c.daysLeft > 0
                            ? t("dashboard.countdown.daysLeft", {
                                formatted: formatNumber(c.daysLeft),
                              })
                            : t("dashboard.countdown.daysOver", {
                                formatted: formatNumber(-c.daysLeft),
                              })}
                        </span>
                      )}
                    </span>
                  </div>
                  <div
                    className="flex w-full overflow-hidden rounded-sm ring-1 ring-inset ring-border-subtle"
                    style={{ height: BAR_HEIGHT }}
                  >
                    <div
                      className="transition-[width] duration-500 ease-out"
                      style={{
                        width: `${(c.collected / max) * 100}%`,
                        backgroundColor: COLLECTED,
                      }}
                    />
                    <div
                      className="transition-[width] duration-500 ease-out"
                      style={{
                        width: `${(c.outstanding / max) * 100}%`,
                        // Money the payer owes but never sent reads as a problem.
                        backgroundColor: c.overdueClaims > 0 ? RED : OUTSTANDING,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <Legend
            items={[
              { label: t("dashboard.metric.collected"), color: COLLECTED },
              { label: t("dashboard.metric.outstanding"), color: OUTSTANDING },
              { label: t("dashboard.countdown.problem"), color: RED },
            ]}
          />
        </>
      )}
    </Panel>
  );
}
