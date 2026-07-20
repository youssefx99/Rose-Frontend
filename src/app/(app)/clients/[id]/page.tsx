"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Section, Stat } from "@/components/ui/detail";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CascadeDeleteDialog } from "@/components/ui/cascade-delete-dialog";
import {
  deactivateClient,
  getClientDetail,
  type ClientClaimRow,
  type ClientDetail,
} from "@/lib/clients";
import { useFormat, type Formatter } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth-context";
import { ClientFormDialog } from "../client-form-dialog";
import { CLAIM_STATUSES, type ClaimStatus } from "@/lib/claims";

function serviceDates(c: ClientClaimRow, formatDate: Formatter["formatDate"]): string {
  return c.dateOfServiceEnd && c.dateOfServiceEnd !== c.dateOfService
    ? `${formatDate(c.dateOfService)} – ${formatDate(c.dateOfServiceEnd)}`
    : formatDate(c.dateOfService);
}

/** Compute useful payment analytics from the claims list. */
function useClaimAnalytics(claims: ClientClaimRow[]) {
  return useMemo(() => {
    // Status breakdown
    const byStatus = Object.fromEntries(
      CLAIM_STATUSES.map((s) => [s, 0]),
    ) as Record<ClaimStatus, number>;
    for (const c of claims) byStatus[c.status as ClaimStatus] = (byStatus[c.status as ClaimStatus] ?? 0) + 1;
    const statusBreakdown = CLAIM_STATUSES
      .map((s) => ({ status: s, count: byStatus[s] }))
      .filter((s) => s.count > 0);

    // Last payment received (most recent bankDate across claims that have one)
    const bankDates = claims
      .filter((c) => c.status === "PAID")
      .map((c) => c.dateBilled) // dateBilled is closest proxy on ClientClaimRow
      .filter(Boolean)
      .sort()
      .reverse();
    const lastPayment = bankDates[0] ?? null;

    return { statusBreakdown, lastPayment };
  }, [claims]);
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { can } = useAuth();
  const t = useT("clients");
  const { formatDate, formatMoney, formatNumber } = useFormat();
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setDetail(await getClientDetail(id));
    } catch {
      toast.error(t("clients.toast.loadDetailFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  const analytics = useClaimAnalytics(detail?.claims ?? []);

  if (loading)
    return <p className="type-body-01 text-text-secondary">{t("common.loading")}</p>;
  if (!detail)
    return <p className="type-body-01 text-text-secondary">{t("notFound")}</p>;

  const { client, totals, accounts, payers, claims } = detail;

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 type-body-01 text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" /> {t("backToClients")}
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="truncate type-heading-04 text-text-primary">
              {client.displayName}
            </h1>
            {!client.isActive && (
              <span className="inline-flex items-center rounded-full bg-support-warning-bg px-2 py-0.5 type-label-01 font-medium text-text-primary">
                {t("common.inactive")}
              </span>
            )}
          </div>
          <p className="type-body-01 text-text-secondary">
            {t("clients.summary.claimCount", { count: totals.claimCount })} ·{" "}
            {t("clients.summary.accountCount", { count: accounts.length })} ·{" "}
            {t("clients.summary.payerCount", { count: payers.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can("clients.edit") && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              {t("common.edit")}
            </Button>
          )}
          {can("clients.delete") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-support-error hover:bg-support-error-bg hover:text-support-error"
              onClick={() => setDeleteOpen(true)}
            >
              {t("common.delete")}
            </Button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={t("clients.stat.totalBilled")} value={formatMoney(totals.charge)} />
        <Stat
          label={t("clients.stat.collected")}
          value={formatMoney(totals.paid)}
          accent="green"
        />
        <Stat
          label={t("clients.stat.collectionRate")}
          value={`${totals.collectionRate.toFixed(1)}%`}
          hint={t("clients.stat.collectionRateHint")}
        />
        <Stat
          label={t("clients.stat.openAr")}
          value={formatMoney(totals.outstanding)}
          accent={totals.outstanding > 0 ? "rose" : "default"}
          hint={t("clients.stat.openArHint", { count: totals.openClaims })}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Aside */}
        <div className="space-y-6">
          {/* Claims status breakdown */}
          {analytics.statusBreakdown.length > 0 && (
            <Section title={t("clients.section.claimsByStatus")}>
              <ul className="space-y-2">
                {analytics.statusBreakdown.map(({ status, count }) => (
                  <li
                    key={status}
                    className="flex items-center justify-between gap-2 type-body-compact-01"
                  >
                    <StatusBadge status={status as ClaimStatus} />
                    <span className="font-mono type-label-01 tabular-nums text-text-secondary">
                      {t("claimCount", { count })}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Payment metrics */}
          <Section title={t("clients.section.paymentMetrics")}>
            <ul className="divide-y divide-border-subtle">
              <li className="flex items-center justify-between gap-2 py-2.5 type-body-compact-01">
                <span className="text-text-secondary">{t("clients.metrics.lastBilled")}</span>
                <span className="font-mono type-label-01 text-text-primary">
                  {analytics.lastPayment
                    ? formatDate(analytics.lastPayment)
                    : t("common.emDash")}
                </span>
              </li>
              <li className="flex items-center justify-between gap-2 py-2.5 type-body-compact-01">
                <span className="text-text-secondary">{t("clients.metrics.paidClaims")}</span>
                <span className="font-mono type-label-01 tabular-nums text-text-primary">
                  {formatNumber(claims.filter((c) => c.status === "PAID").length)} /{" "}
                  {formatNumber(totals.claimCount)}
                </span>
              </li>
            </ul>
          </Section>

          <Section
            title={t("clients.section.payers")}
            subtitle={t("clients.section.payersSubtitle", { total: payers.length })}
          >
            {payers.length === 0 ? (
              <p className="py-2 type-body-01 text-text-helper">
                {t("clients.empty.noPayers")}
              </p>
            ) : (
              <ul className="space-y-2.5">
                {payers.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 type-body-compact-01"
                  >
                    <span className="truncate text-text-primary">{p.name}</span>
                    <span className="shrink-0 font-mono type-label-01 tabular-nums text-text-secondary">
                      {t("claimCount", { count: p.claimCount })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title={t("clients.section.accountNumbers")}
            subtitle={t("clients.section.accountNumbersSubtitle")}
          >
            {accounts.length === 0 ? (
              <p className="py-2 type-body-01 text-text-helper">
                {t("clients.empty.noAccounts")}
              </p>
            ) : (
              <ul className="space-y-2.5">
                {accounts.map((a) => (
                  <li key={a.accountNumber} className="space-y-0.5">
                    <p className="font-mono type-body-compact-01 text-text-primary">
                      {a.accountNumber}
                    </p>
                    <p className="type-label-01 text-text-secondary">
                      {a.payers.join(", ")} ·{" "}
                      {t("claimCount", { count: a.claimCount })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* Claims table */}
        <div className="lg:col-span-2">
          <Section
            title={t("clients.section.claims")}
            subtitle={t("clients.section.claimsSubtitle", { total: claims.length })}
            bodyClassName="px-0 py-0"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("clients.table.claim")}</TableHead>
                  <TableHead>{t("clients.table.payer")}</TableHead>
                  <TableHead>{t("clients.table.serviceDates")}</TableHead>
                  <TableHead className="text-end">{t("clients.table.billed")}</TableHead>
                  <TableHead className="text-end">{t("clients.table.paid")}</TableHead>
                  <TableHead className="text-end">{t("clients.table.payPct")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center type-body-01 text-text-secondary"
                    >
                      {t("clients.empty.noClaims")}
                    </TableCell>
                  </TableRow>
                ) : (
                  claims.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/claims/${c.id}`)}
                    >
                      <TableCell>
                        <Link
                          href={`/claims/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-xs text-link hover:underline"
                        >
                          {c.claimReference}
                        </Link>
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {c.payer.shortCode}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {serviceDates(c, formatDate)}
                      </TableCell>
                      <TableCell className="text-end font-mono tabular-nums">
                        {formatMoney(c.chargeAmount)}
                      </TableCell>
                      <TableCell className="text-end font-mono tabular-nums">
                        {formatMoney(c.payerPaidAmount)}
                      </TableCell>
                      <TableCell className="text-end font-mono tabular-nums text-text-secondary">
                        {c.payPct != null
                          ? `${(Number(c.payPct) * 100).toFixed(0)}%`
                          : t("common.emDash")}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status as ClaimStatus} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Claims financial footer */}
            {claims.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border-subtle bg-layer px-4 py-2.5">
                <span className="type-label-01 text-text-secondary">
                  {t("clients.footer.billed")}{" "}
                  <span className="font-mono font-medium tabular-nums text-text-primary">
                    {formatMoney(totals.charge)}
                  </span>
                </span>
                <span className="type-label-01 text-text-secondary">
                  {t("clients.footer.collected")}{" "}
                  <span className="font-mono font-medium tabular-nums text-support-success">
                    {formatMoney(totals.paid)}
                  </span>
                </span>
                <span className="type-label-01 text-text-secondary">
                  {t("clients.footer.outstanding")}{" "}
                  <span className="font-mono font-medium tabular-nums text-interactive">
                    {formatMoney(totals.outstanding)}
                  </span>
                </span>
              </div>
            )}
          </Section>
        </div>
      </div>

      <ClientFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        client={client}
        onSaved={load}
      />
      <CascadeDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        type="client"
        id={client.id}
        title={t("clients.delete.title")}
        onDeactivate={() => deactivateClient(client.id)}
        onDone={() => router.push("/clients")}
      />
    </div>
  );
}
