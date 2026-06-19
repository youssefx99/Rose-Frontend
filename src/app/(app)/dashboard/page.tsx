"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getDashboard, type Dashboard } from "@/lib/dashboard";
import { formatMoney } from "@/lib/format";
import { CollapsibleSection } from "./collapsible-section";
import { StatCard } from "./stat-card";
import { ClaimsStatusCard } from "./claims-status-card";
import { ArAgingCard } from "./ar-aging-card";
import { CollectionPayerCard } from "./collection-payer-card";
import { AlertsCard } from "./alerts-card";
import { TopClientsCard } from "./top-clients-card";
import { MonthlyTrendCard } from "./monthly-trend-card";
import { DenialRateCard } from "./denial-rate-card";

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-zinc-100 ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Block className="h-56" />
        <Block className="h-56" />
        <Block className="h-56" />
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
    <div>
      <h1 className="mb-6 text-xl font-semibold text-zinc-950">Dashboard</h1>

      {loading || !data ? (
        <DashboardSkeleton />
      ) : (
        <div>
          <CollapsibleSection
            id="overview"
            title="Overview"
            summary={`${formatMoney(data.arSummary.totalOutstanding)} outstanding`}
          >
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Total Outstanding"
                value={formatMoney(data.arSummary.totalOutstanding)}
                hint="Unpaid claims"
              />
              <StatCard
                label="Collected This Month"
                value={formatMoney(data.arSummary.collectedThisMonth)}
                hint="Payments posted"
                valueClassName="text-green-600"
              />
              <StatCard
                label="Billed This Month"
                value={formatMoney(data.arSummary.billedThisMonth)}
                hint="Charges entered"
              />
              <StatCard
                label="Collection Rate"
                value={`${data.arSummary.collectionRate.toFixed(1)}%`}
                hint="Collected ÷ billed"
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection id="claims" title="Claims & Aging">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ClaimsStatusCard data={data.claimsByStatus} />
              <ArAgingCard data={data.arAging} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="payers"
            title="Payers & Clients"
            summary={
              data.pendingReviewCount > 0
                ? `${data.pendingReviewCount} pending review`
                : undefined
            }
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <CollectionPayerCard data={data.collectionByPayer} />
              <AlertsCard
                pendingReviewCount={data.pendingReviewCount}
                unmatchedDeposits={data.unmatchedDeposits}
              />
              <TopClientsCard data={data.topClientsByBalance} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="trends"
            title="Revenue & Denials"
            summary={`${data.denialRate.toFixed(1)}% denial rate`}
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <MonthlyTrendCard data={data.monthlyTrend} />
              </div>
              <DenialRateCard rate={data.denialRate} />
            </div>
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}
