"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Section, Stat, DataList, DataRow } from "@/components/ui/detail";
import { CascadeDeleteDialog } from "@/components/ui/cascade-delete-dialog";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPayer, deactivatePayer, type Payer } from "@/lib/payers";
import { listClaims, type Claim, type ClaimStatus } from "@/lib/claims";
import { useFormat } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth-context";
import { PayerFormDialog } from "../payer-form-dialog";
import { CLAIM_STATUSES } from "@/lib/claims";

function usePayerMetrics(claims: Claim[]) {
  return useMemo(() => {
    const billed = claims.reduce((s, c) => s + Number(c.chargeAmount), 0);
    const collected = claims.reduce((s, c) => s + Number(c.payerPaidAmount), 0);
    const outstanding = claims.reduce((s, c) => s + Number(c.balanceNeeded), 0);
    const rate = billed > 0 ? (collected / billed) * 100 : 0;

    const byStatus = Object.fromEntries(
      CLAIM_STATUSES.map((s) => [s, 0]),
    ) as Record<ClaimStatus, number>;
    for (const c of claims) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
    const statusBreakdown = CLAIM_STATUSES
      .map((s) => ({ status: s, count: byStatus[s] }))
      .filter((s) => s.count > 0);

    return { billed, collected, outstanding, rate, statusBreakdown };
  }, [claims]);
}

export default function PayerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useAuth();
  const t = useT("payers");
  const { timeAgo, formatMoney, formatDate } = useFormat();
  const id = params.id;

  const [payer, setPayer] = useState<Payer | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [payerData, claimsData] = await Promise.all([
        getPayer(id),
        listClaims({ payerId: id }),
      ]);
      setPayer(payerData);
      setClaims(claimsData.data);
    } catch {
      toast.error(t("payers.toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = usePayerMetrics(claims);

  if (loading)
    return (
      <p className="type-body-01 text-text-secondary">{t("common.loading")}</p>
    );
  if (!payer)
    return <p className="type-body-01 text-text-secondary">{t("notFound")}</p>;

  return (
    <div className="space-y-6">
      <Link
        href="/payers"
        className="inline-flex items-center gap-1 type-body-compact-01 text-text-secondary transition-colors duration-[var(--dur-fast-02)] hover:text-text-primary"
      >
        <ArrowLeft className="size-4 rtl:-scale-x-100" /> {t("backToList")}
      </Link>

      <PageHeader
        title={payer.name}
        description={[payer.shortCode, payer.state].filter(Boolean).join(" · ")}
      >
        {!payer.isActive && (
          <span className="rounded-full bg-support-warning-bg px-2 py-0.5 type-label-01 font-medium text-text-primary">
            {t("common.inactive")}
          </span>
        )}
        {can("payers.edit") && (
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" /> {t("common.edit")}
          </Button>
        )}
        {can("payers.delete") && (
          <Button
            variant="ghost"
            size="sm"
            className="text-support-error hover:bg-support-error-bg hover:text-support-error"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" /> {t("common.delete")}
          </Button>
        )}
      </PageHeader>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={t("payers.stat.totalBilled")} value={formatMoney(metrics.billed)} />
        <Stat
          label={t("payers.stat.collected")}
          value={formatMoney(metrics.collected)}
          accent="green"
        />
        <Stat
          label={t("payers.stat.collectionRate")}
          value={`${metrics.rate.toFixed(1)}%`}
          hint={t("payers.stat.collectionRateHint")}
        />
        <Stat
          label={t("payers.stat.openAr")}
          value={formatMoney(metrics.outstanding)}
          accent={metrics.outstanding > 0 ? "rose" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Aside */}
        <div className="space-y-6">
          <Section title={t("payers.section.performance")}>
            <DataList>
              <DataRow label={t("claims")} value={claims.length} mono />
              <DataRow
                label={t("payers.data.remittances")}
                value={payer._count?.remittances ?? t("common.emDash")}
                mono
              />
              <DataRow
                label={t("payers.data.avgCollection")}
                value={`${metrics.rate.toFixed(1)}%`}
                mono
              />
            </DataList>
          </Section>

          {metrics.statusBreakdown.length > 0 && (
            <Section title={t("payers.section.claimsByStatus")}>
              <ul className="space-y-2">
                {metrics.statusBreakdown.map(({ status, count }) => (
                  <li
                    key={status}
                    className="flex items-center justify-between gap-2 type-body-compact-01"
                  >
                    <StatusBadge status={status} />
                    <span className="font-mono type-label-01 tabular-nums text-text-secondary">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title={t("payers.section.quickLinks")}>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/claims?payerId=${payer.id}&status=PARTIALLY_PAID`}
                  className="type-body-compact-01 text-link hover:underline"
                >
                  {t("payers.link.partiallyPaidClaims")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/claims?payerId=${payer.id}&outstandingOnly=true`}
                  className="type-body-compact-01 text-link hover:underline"
                >
                  {t("payers.link.outstandingClaims")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/remittances?payerId=${payer.id}`}
                  className="type-body-compact-01 text-link hover:underline"
                >
                  {t("payers.link.remittances")}
                </Link>
              </li>
            </ul>
          </Section>
        </div>

        {/* Claims table */}
        <div className="lg:col-span-2">
          <Section
            title={t("claims")}
            subtitle={t("claimsSubtitle", { count: claims.length })}
            bodyClassName="px-0 py-0"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("payers.field.reference")}</TableHead>
                  <TableHead>{t("payers.field.client")}</TableHead>
                  <TableHead>{t("payers.field.serviceDate")}</TableHead>
                  <TableHead className="text-end">{t("payers.field.charge")}</TableHead>
                  <TableHead className="text-end">{t("payers.field.paid")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-end">{t("payers.field.activity")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center type-body-01 text-text-secondary"
                    >
                      {t("payers.empty.claims")}
                    </TableCell>
                  </TableRow>
                ) : (
                  claims.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/claims/${c.id}`)}
                    >
                      <TableCell className="font-mono type-label-01 text-text-primary">
                        {c.claimReference}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {c.client?.displayName ?? t("common.emDash")}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {formatDate(c.dateOfService)}
                      </TableCell>
                      <TableCell className="text-end font-mono tabular-nums text-text-primary">
                        {formatMoney(c.chargeAmount)}
                      </TableCell>
                      <TableCell className="text-end font-mono tabular-nums text-text-primary">
                        {formatMoney(c.payerPaidAmount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-end type-label-01 text-text-secondary">
                        {timeAgo(c.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {claims.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border-subtle bg-layer px-4 py-2.5">
                <span className="type-label-01 text-text-secondary">
                  {t("payers.footer.billed")}{" "}
                  <span className="font-mono font-medium tabular-nums text-text-primary">
                    {formatMoney(metrics.billed)}
                  </span>
                </span>
                <span className="type-label-01 text-text-secondary">
                  {t("payers.footer.collected")}{" "}
                  <span className="font-mono font-medium tabular-nums text-support-success">
                    {formatMoney(metrics.collected)}
                  </span>
                </span>
                <span className="type-label-01 text-text-secondary">
                  {t("payers.footer.outstanding")}{" "}
                  <span className="font-mono font-medium tabular-nums text-interactive">
                    {formatMoney(metrics.outstanding)}
                  </span>
                </span>
              </div>
            )}
          </Section>
        </div>
      </div>

      <PayerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        payer={payer}
        onSaved={load}
      />
      <CascadeDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        type="payer"
        id={payer.id}
        title={t("deleteDialogTitle")}
        onDeactivate={() => deactivatePayer(payer.id)}
        onDone={() => router.push("/payers")}
      />
    </div>
  );
}
