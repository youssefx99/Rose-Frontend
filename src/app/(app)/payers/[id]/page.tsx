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
import { listClaims, formatMoney, formatDate, type Claim, type ClaimStatus } from "@/lib/claims";
import { timeAgo } from "@/lib/format";
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

    const denialRate =
      claims.length > 0
        ? ((byStatus["DENIED"] + byStatus["APPEALED"]) / claims.length) * 100
        : 0;

    return { billed, collected, outstanding, rate, denialRate, statusBreakdown };
  }, [claims]);
}

export default function PayerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useAuth();
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
      toast.error("Failed to load payer.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = usePayerMetrics(claims);

  if (loading)
    return <p className="type-body-01 text-text-secondary">Loading…</p>;
  if (!payer)
    return <p className="type-body-01 text-text-secondary">Payer not found.</p>;

  return (
    <div className="space-y-6">
      <Link
        href="/payers"
        className="inline-flex items-center gap-1 type-body-compact-01 text-text-secondary transition-colors duration-[var(--dur-fast-02)] hover:text-text-primary"
      >
        <ArrowLeft className="size-4" /> Back to payers
      </Link>

      <PageHeader
        title={payer.name}
        description={[payer.shortCode, payer.state].filter(Boolean).join(" · ")}
      >
        {!payer.isActive && (
          <span className="rounded-full bg-support-warning-bg px-2 py-0.5 type-label-01 font-medium text-text-primary">
            Inactive
          </span>
        )}
        {can("payers.edit") && (
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" /> Edit
          </Button>
        )}
        {can("payers.delete") && (
          <Button
            variant="ghost"
            size="sm"
            className="text-support-error hover:bg-support-error-bg hover:text-support-error"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" /> Delete
          </Button>
        )}
      </PageHeader>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total billed" value={formatMoney(metrics.billed)} />
        <Stat label="Collected" value={formatMoney(metrics.collected)} accent="green" />
        <Stat
          label="Collection rate"
          value={`${metrics.rate.toFixed(1)}%`}
          hint="collected ÷ billed"
        />
        <Stat
          label="Open AR"
          value={formatMoney(metrics.outstanding)}
          accent={metrics.outstanding > 0 ? "rose" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Aside */}
        <div className="space-y-6">
          <Section title="Performance">
            <DataList>
              <DataRow label="Claims" value={claims.length} mono />
              <DataRow label="Remittances" value={payer._count?.remittances ?? "—"} mono />
              <DataRow
                label="Denial rate"
                value={`${metrics.denialRate.toFixed(1)}%`}
                mono
              />
              <DataRow
                label="Avg collection"
                value={`${metrics.rate.toFixed(1)}%`}
                mono
              />
            </DataList>
          </Section>

          {metrics.statusBreakdown.length > 0 && (
            <Section title="Claims by status">
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

          <Section title="Quick links">
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/claims?payerId=${payer.id}&status=DENIED`}
                  className="type-body-compact-01 text-link hover:underline"
                >
                  View denied claims →
                </Link>
              </li>
              <li>
                <Link
                  href={`/claims?payerId=${payer.id}&outstandingOnly=true`}
                  className="type-body-compact-01 text-link hover:underline"
                >
                  View outstanding claims →
                </Link>
              </li>
              <li>
                <Link
                  href={`/remittances?payerId=${payer.id}`}
                  className="type-body-compact-01 text-link hover:underline"
                >
                  View remittances →
                </Link>
              </li>
            </ul>
          </Section>
        </div>

        {/* Claims table */}
        <div className="lg:col-span-2">
          <Section
            title="Claims"
            subtitle={`${claims.length} total (most recent 100)`}
            bodyClassName="px-0 py-0"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service date</TableHead>
                  <TableHead className="text-right">Charge</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center type-body-01 text-text-secondary"
                    >
                      No claims yet.
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
                        {c.client?.displayName ?? "—"}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {formatDate(c.dateOfService)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-text-primary">
                        {formatMoney(c.chargeAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-text-primary">
                        {formatMoney(c.payerPaidAmount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-right type-label-01 text-text-secondary">
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
                  Billed:{" "}
                  <span className="font-mono font-medium tabular-nums text-text-primary">
                    {formatMoney(metrics.billed)}
                  </span>
                </span>
                <span className="type-label-01 text-text-secondary">
                  Collected:{" "}
                  <span className="font-mono font-medium tabular-nums text-support-success">
                    {formatMoney(metrics.collected)}
                  </span>
                </span>
                <span className="type-label-01 text-text-secondary">
                  Outstanding:{" "}
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
        title="Delete payer"
        onDeactivate={() => deactivatePayer(payer.id)}
        onDone={() => router.push("/payers")}
      />
    </div>
  );
}
