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
import { formatDate, formatMoney } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { ClientFormDialog } from "../client-form-dialog";
import { CLAIM_STATUSES, type ClaimStatus } from "@/lib/claims";

function serviceDates(c: ClientClaimRow): string {
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
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setDetail(await getClientDetail(id));
    } catch {
      toast.error("Failed to load client.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const analytics = useClaimAnalytics(detail?.claims ?? []);

  if (loading) return <p className="type-body-01 text-text-secondary">Loading…</p>;
  if (!detail)
    return <p className="type-body-01 text-text-secondary">Client not found.</p>;

  const { client, totals, accounts, payers, claims } = detail;

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 type-body-01 text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="size-4" /> Back to clients
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
                Inactive
              </span>
            )}
          </div>
          <p className="type-body-01 text-text-secondary">
            {totals.claimCount} claim{totals.claimCount === 1 ? "" : "s"} ·{" "}
            {accounts.length} account #{accounts.length === 1 ? "" : "s"} ·{" "}
            {payers.length} payer{payers.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can("clients.edit") && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          )}
          {can("clients.delete") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-support-error hover:bg-support-error-bg hover:text-support-error"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total billed" value={formatMoney(totals.charge)} />
        <Stat label="Collected" value={formatMoney(totals.paid)} accent="green" />
        <Stat
          label="Collection rate"
          value={`${totals.collectionRate.toFixed(1)}%`}
          hint="collected ÷ billed"
        />
        <Stat
          label="Open AR"
          value={formatMoney(totals.outstanding)}
          accent={totals.outstanding > 0 ? "rose" : "default"}
          hint={`${totals.openClaims} unpaid claim${totals.openClaims === 1 ? "" : "s"}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Aside */}
        <div className="space-y-6">
          {/* Claims status breakdown */}
          {analytics.statusBreakdown.length > 0 && (
            <Section title="Claims by status">
              <ul className="space-y-2">
                {analytics.statusBreakdown.map(({ status, count }) => (
                  <li
                    key={status}
                    className="flex items-center justify-between gap-2 type-body-compact-01"
                  >
                    <StatusBadge status={status as ClaimStatus} />
                    <span className="font-mono type-label-01 tabular-nums text-text-secondary">
                      {count} claim{count !== 1 ? "s" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Payment metrics */}
          <Section title="Payment metrics">
            <ul className="divide-y divide-border-subtle">
              <li className="flex items-center justify-between gap-2 py-2.5 type-body-compact-01">
                <span className="text-text-secondary">Last billed</span>
                <span className="font-mono type-label-01 text-text-primary">
                  {analytics.lastPayment ? formatDate(analytics.lastPayment) : "—"}
                </span>
              </li>
              <li className="flex items-center justify-between gap-2 py-2.5 type-body-compact-01">
                <span className="text-text-secondary">Paid claims</span>
                <span className="font-mono type-label-01 tabular-nums text-text-primary">
                  {claims.filter((c) => c.status === "PAID").length} /{" "}
                  {totals.claimCount}
                </span>
              </li>
            </ul>
          </Section>

          <Section title="Payers" subtitle={`${payers.length} on file`}>
            {payers.length === 0 ? (
              <p className="py-2 type-body-01 text-text-helper">No payers yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {payers.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 type-body-compact-01"
                  >
                    <span className="truncate text-text-primary">{p.name}</span>
                    <span className="shrink-0 font-mono type-label-01 tabular-nums text-text-secondary">
                      {p.claimCount} claim{p.claimCount === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="Account numbers"
            subtitle="One person, several payer authorizations"
          >
            {accounts.length === 0 ? (
              <p className="py-2 type-body-01 text-text-helper">
                No account numbers on file.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {accounts.map((a) => (
                  <li key={a.accountNumber} className="space-y-0.5">
                    <p className="font-mono type-body-compact-01 text-text-primary">
                      {a.accountNumber}
                    </p>
                    <p className="type-label-01 text-text-secondary">
                      {a.payers.join(", ")} · {a.claimCount} claim
                      {a.claimCount === 1 ? "" : "s"}
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
            title="Claims"
            subtitle={`${claims.length} total`}
            bodyClassName="px-0 py-0"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Service dates</TableHead>
                  <TableHead className="text-right">Billed</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Pay%</TableHead>
                  <TableHead>Status</TableHead>
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
                        {serviceDates(c)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatMoney(c.chargeAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatMoney(c.payerPaidAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-text-secondary">
                        {c.payPct != null
                          ? `${(Number(c.payPct) * 100).toFixed(0)}%`
                          : "—"}
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
                  Billed:{" "}
                  <span className="font-mono font-medium tabular-nums text-text-primary">
                    {formatMoney(totals.charge)}
                  </span>
                </span>
                <span className="type-label-01 text-text-secondary">
                  Collected:{" "}
                  <span className="font-mono font-medium tabular-nums text-support-success">
                    {formatMoney(totals.paid)}
                  </span>
                </span>
                <span className="type-label-01 text-text-secondary">
                  Outstanding:{" "}
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
        title="Delete client"
        onDeactivate={() => deactivateClient(client.id)}
        onDone={() => router.push("/clients")}
      />
    </div>
  );
}
