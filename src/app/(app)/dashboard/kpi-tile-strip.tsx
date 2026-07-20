"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  Building2,
  FileStack,
  Inbox,
  Users,
  Wallet,
} from "lucide-react";

import { useFormat } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/provider";
import type { Dashboard } from "@/lib/dashboard";

interface Tile {
  key: string;
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  /**
   * Colour rides on the icon block only, never the card. That is what lets six
   * differently-coloured tiles sit in a row without shouting.
   */
  tone: string;
}

function TileCard({ tile }: { tile: Tile }) {
  const Icon = tile.icon;
  return (
    <div className="flex min-w-[13rem] flex-1 items-stretch overflow-hidden rounded-md border border-border-subtle bg-card">
      <div
        className="flex w-14 shrink-0 items-center justify-center"
        style={{ backgroundColor: tile.tone }}
      >
        <Icon className="size-6 text-white" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 px-4 py-3">
        <p className="truncate type-label-01 text-text-secondary">
          {tile.label}
        </p>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="type-heading-03 font-mono font-semibold tabular-nums text-text-primary">
            {tile.value}
          </span>
          {tile.sub && (
            <span className="type-label-01 tabular-nums text-text-helper">
              {tile.sub}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/** The scan row: six counts, one glance, before any chart asks for thought. */
export function KpiTileStrip({ data }: { data: Dashboard }) {
  const t = useT();
  const { formatMoney, formatNumber } = useFormat();

  const openClaims = data.claimsByStatus
    .filter((s) => s.status !== "PAID")
    .reduce((sum, s) => sum + s.count, 0);

  const tiles: Tile[] = [
    {
      key: "clients",
      label: t("dashboard.kpi.clients"),
      value: formatNumber(data.totals.clientCount),
      icon: Users,
      tone: "#42be65",
    },
    {
      key: "payers",
      label: t("dashboard.kpi.payers"),
      value: formatNumber(data.totals.payerCount),
      icon: Building2,
      tone: "#ee5396",
    },
    {
      key: "openClaims",
      label: t("dashboard.kpi.openClaims"),
      value: formatNumber(openClaims),
      sub: `/ ${formatNumber(data.totals.claimCount)}`,
      icon: FileStack,
      tone: "#4589ff",
    },
    {
      key: "overdue",
      label: t("dashboard.kpi.overdue"),
      value: formatNumber(data.totals.overdueClaims),
      sub: formatMoney(data.totals.overdueAmount),
      icon: AlarmClock,
      tone: "#da1e28",
    },
    {
      key: "review",
      label: t("dashboard.kpi.pendingReview"),
      value: formatNumber(data.pendingReviewCount),
      icon: Inbox,
      tone: "#a56eff",
    },
    {
      key: "openAr",
      label: t("dashboard.kpi.openAr"),
      value: formatMoney(data.totals.openAr),
      icon: Wallet,
      tone: "#009d9a",
    },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-1">
      {tiles.map((tile) => (
        <TileCard key={tile.key} tile={tile} />
      ))}
    </div>
  );
}
