"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Inbox } from "lucide-react";

import { getDashboard, type Dashboard } from "@/lib/dashboard";
import { formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "./stat-card";
import { MonthlyTrendCard } from "./monthly-trend-card";
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Block className="h-28" />
        <Block className="h-28" />
        <Block className="h-28" />
        <Block className="h-28" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Block className="h-80 lg:col-span-2" />
        <Block className="h-80" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Block className="h-60" />
        <Block className="h-60" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setData(await getDashboard());
      } catch {
        toast.error("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          data
            ? `${data.totals.claimCount} claims · ${data.totals.clientCount} clients · ${data.totals.payerCount} payers`
            : undefined
        }
      >
        {data && data.pendingReviewCount > 0 && (
          <Link
            href="/review"
            className="inline-flex items-center gap-2 rounded-md border border-support-warning bg-support-warning-bg px-3 py-1.5 type-body-compact-01 font-medium text-text-primary transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          >
            <Inbox className="size-4 text-support-warning" />
            {data.pendingReviewCount} pending review
          </Link>
        )}
      </PageHeader>

      {loading || !data ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Total billed"
              value={formatMoney(data.totals.billed)}
              sub={`${data.totals.claimCount} claims`}
            />
            <StatCard
              label="Collected"
              value={formatMoney(data.totals.collected)}
              accent="green"
              sub="Paid by payers"
            />
            <StatCard
              label="Collection rate"
              value={`${data.totals.collectionRate.toFixed(1)}%`}
              sub="Collected ÷ billed"
            />
            <StatCard
              label="Open AR"
              value={formatMoney(data.totals.openAr)}
              accent={data.totals.openAr > 0 ? "rose" : "default"}
              sub="Billed, not yet paid"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <MonthlyTrendCard data={data.monthlyTrend} />
            </div>
            <ClaimsStatusCard data={data.claimsByStatus} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <CollectionPayerCard data={data.collectionByPayer} />
            <div className="lg:col-span-2">
              <TopClientsCard data={data.topClients} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
