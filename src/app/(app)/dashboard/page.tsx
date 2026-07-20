"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { getDashboard, type Dashboard } from "@/lib/dashboard";
import { useFormat } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/provider";
import { PageHeader } from "@/components/ui/page-header";
import { ActionCenter } from "./action-center";
import { KpiTileStrip } from "./kpi-tile-strip";
import { StatCard } from "./stat-card";
import { ChargeFlowCard } from "./charge-flow-card";
import { ArAgingCard } from "./ar-aging-card";
import { ClaimsStatusCard } from "./claims-status-card";
import { CollectionPayerCard } from "./collection-payer-card";
import { TopClientsCard } from "./top-clients-card";

function Block({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-skeleton-background ${className}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Block className="h-36" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Block className="h-28" />
        <Block className="h-28" />
        <Block className="h-28" />
        <Block className="h-28" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Block className="h-80" />
        <Block className="h-80" />
      </div>
      <Block className="h-96" />
    </div>
  );
}

export default function DashboardPage() {
  const t = useT();
  const { formatMoney, formatNumber } = useFormat();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const tRef = useRef(t);
  // Kept current so the mount-only fetch below toasts in the language the user is
  // reading now, not the one they loaded the page in. Written in an effect, not
  // during render.
  useEffect(() => {
    tRef.current = t;
  });

  useEffect(() => {
    (async () => {
      try {
        setData(await getDashboard());
      } catch {
        toast.error(tRef.current("dashboard.toast.loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.title")}
        description={
          data
            ? `${t("dashboard.claimCount", { count: data.totals.claimCount, formatted: formatNumber(data.totals.claimCount) })} · ${t("dashboard.clientCount", { count: data.totals.clientCount, formatted: formatNumber(data.totals.clientCount) })} · ${t("dashboard.payerCount", { count: data.totals.payerCount, formatted: formatNumber(data.totals.payerCount) })}`
            : undefined
        }
      />

      {loading || !data ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-4">
          <ActionCenter data={data} />

          <KpiTileStrip data={data} />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label={t("dashboard.metric.totalBilled")}
              value={formatMoney(data.totals.billed)}
              sub={t("dashboard.claimCount", {
                count: data.totals.claimCount,
                formatted: formatNumber(data.totals.claimCount),
              })}
            />
            <StatCard
              label={t("dashboard.metric.collected")}
              value={formatMoney(data.totals.collected)}
              accent="green"
              sub={t("dashboard.stat.collectedSub")}
            />
            <StatCard
              label={t("dashboard.metric.collectionRate")}
              value={`${data.totals.collectionRate.toFixed(1)}%`}
              sub={t("dashboard.stat.collectionRateSub")}
            />
            <StatCard
              label={t("dashboard.metric.openAr")}
              value={formatMoney(data.totals.openAr)}
              accent={data.totals.openAr > 0 ? "rose" : "default"}
              sub={t("dashboard.stat.openArSub")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChargeFlowCard data={data.billedByMonth} />
            </div>
            <ArAgingCard data={data.arAging} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ClaimsStatusCard data={data.claimsByStatus} />
            <CollectionPayerCard data={data.collectionByPayer} />
          </div>

          <TopClientsCard data={data.topClients} />

        </div>
      )}
    </div>
  );
}
