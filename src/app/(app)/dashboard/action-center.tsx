"use client";

import Link from "next/link";
import { AlarmClock, Clock, Inbox, TrendingDown } from "lucide-react";

import { useFormat, type Formatter } from "@/lib/i18n/format";
import { useLocale, useT } from "@/lib/i18n/provider";
import type { TFunction } from "@/lib/i18n/translate";
import { cn } from "@/lib/utils";
import type { Dashboard } from "@/lib/dashboard";

type Color = "warning" | "error" | "info" | "muted";

interface ActionItem {
  icon: typeof Inbox;
  label: string;
  detail: string;
  amount: number;
  href: string;
  color: Color;
}

const ICON_CLASS: Record<Color, string> = {
  warning: "text-support-warning",
  error:   "text-support-error",
  info:    "text-support-info",
  muted:   "text-text-secondary",
};
const RING_CLASS: Record<Color, string> = {
  warning: "border-support-warning   bg-support-warning-bg",
  error:   "border-support-error     bg-support-error-bg",
  info:    "border-support-info      bg-support-info-bg",
  muted:   "border-border-subtle     bg-layer",
};

/**
 * The day's work, most urgent first. The rows are a PARTITION of what is still
 * owed — overdue claims are open claims whose clock ran out, so they are taken
 * out of the waiting row rather than counted in both. Amounts are what is left
 * to collect, never the charge: a short-paid claim's charge overstates it.
 */
function buildItems(
  data: Dashboard,
  t: TFunction,
  formatNumber: Formatter["formatNumber"],
): ActionItem[] {
  const items: ActionItem[] = [];
  const byStatus = Object.fromEntries(
    data.claimsByStatus.map((s) => [s.status, s]),
  );
  const claims = (count: number) =>
    t("dashboard.action.claims", { count, formatted: formatNumber(count) });

  if (data.pendingReviewCount > 0) {
    items.push({
      icon: Inbox,
      label: t("dashboard.action.reviewQueue"),
      detail: t("dashboard.action.reviewDetail", {
        count: data.pendingReviewCount,
        formatted: formatNumber(data.pendingReviewCount),
      }),
      amount: 0,
      href: "/review",
      color: "warning",
    });
  }

  // 1. The payer ran out the clock and sent nothing — someone has to call.
  if (data.totals.overdueClaims > 0) {
    items.push({
      icon: AlarmClock,
      label: t("dashboard.action.overdue"),
      detail: `${claims(data.totals.overdueClaims)} · ${t("dashboard.action.overdueWhy")}`,
      amount: data.totals.overdueAmount,
      href: "/claims?outstandingOnly=true",
      color: "error",
    });
  }

  // 2. Money arrived, but less than the full charge — chase the balance.
  const short = byStatus["PARTIALLY_PAID"];
  if (short?.count > 0) {
    items.push({
      icon: TrendingDown,
      label: t("dashboard.action.shortPaid"),
      detail: `${claims(short.count)} · ${t("dashboard.action.shortPaidWhy")}`,
      amount: short.owed,
      href: "/claims?status=PARTIALLY_PAID",
      color: "warning",
    });
  }

  // 3. Still inside the follow-up window — context, not work.
  const open = byStatus["OPEN"];
  const waitingCount = (open?.count ?? 0) - data.totals.overdueClaims;
  const waitingOwed = (open?.owed ?? 0) - data.totals.overdueAmount;
  if (waitingCount > 0) {
    items.push({
      icon: Clock,
      label: t("dashboard.action.waiting"),
      detail: `${claims(waitingCount)} · ${t("dashboard.action.waitingWhy")}`,
      amount: waitingOwed,
      href: "/claims?status=OPEN",
      color: "muted",
    });
  }

  return items;
}

export function ActionCenter({ data }: { data: Dashboard }) {
  const t = useT();
  const { isRtl } = useLocale();
  const { formatMoney, formatNumber } = useFormat();
  const items = buildItems(data, t, formatNumber);
  if (items.length === 0) return null;

  // Summed from the rows, never billed − collected: that would count the
  // charge written off in a negotiation as money still owed.
  const owed = items.reduce((total, item) => total + item.amount, 0);
  const { billed, collected } = data.totals;

  return (
    <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
      <header className="border-b border-border-subtle px-5 py-4">
        <p className="type-label-01 text-text-secondary">
          {t("dashboard.action.owedLabel")}
        </p>
        <p className="type-heading-04 tabular-nums text-text-primary">
          {formatMoney(owed)}
        </p>
        <p className="mt-0.5 type-label-01 text-text-helper">
          {t("dashboard.action.owedOf", {
            billed: `⁨${formatMoney(billed)}⁩`,
            collected: `⁨${formatMoney(collected)}⁩`,
          })}
        </p>
      </header>
      <ul className="divide-y divide-border-subtle">
        {items.map(({ icon: Icon, label, detail, amount, href, color }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-[var(--dur-fast-02)] hover:bg-layer-hover"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border",
                  RING_CLASS[color],
                )}
                aria-hidden
              >
                <Icon className={cn("size-4", ICON_CLASS[color])} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="type-body-compact-01 font-medium text-text-primary">
                  {label}
                </p>
                <p className="type-label-01 text-text-secondary">{detail}</p>
              </div>
              {amount > 0 && (
                <span className="shrink-0 type-body-compact-01 font-medium tabular-nums text-text-primary">
                  {formatMoney(amount)}
                </span>
              )}
              <span className="shrink-0 type-label-01 text-text-helper" aria-hidden>
                {isRtl ? "←" : "→"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
