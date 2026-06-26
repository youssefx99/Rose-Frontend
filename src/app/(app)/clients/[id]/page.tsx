"use client";

import { useCallback, useEffect, useState } from "react";
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

function serviceDates(c: ClientClaimRow): string {
  return c.dateOfServiceEnd && c.dateOfServiceEnd !== c.dateOfService
    ? `${formatDate(c.dateOfService)} – ${formatDate(c.dateOfServiceEnd)}`
    : formatDate(c.dateOfService);
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

  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (!detail) return <p className="text-sm text-zinc-500">Client not found.</p>;

  const { client, totals, accounts, payers, claims } = detail;

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ArrowLeft className="size-4" /> Back to clients
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-zinc-950">
              {client.displayName}
            </h1>
            {!client.isActive && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500">
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
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
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
        <Stat
          label="Collected"
          value={formatMoney(totals.paid)}
          accent="green"
        />
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
        {/* Aside: payers + account numbers */}
        <div className="space-y-6">
          <Section title="Payers" subtitle={`${payers.length} on file`}>
            {payers.length === 0 ? (
              <p className="py-2 text-sm text-zinc-400">No payers yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {payers.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="truncate text-zinc-700">{p.name}</span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-500">
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
              <p className="py-2 text-sm text-zinc-400">
                No account numbers on file.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {accounts.map((a) => (
                  <li key={a.accountNumber} className="space-y-0.5">
                    <p className="font-mono text-sm text-zinc-800">
                      {a.accountNumber}
                    </p>
                    <p className="text-xs text-zinc-500">
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
                <TableRow className="bg-zinc-50">
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
                      className="py-8 text-center text-sm text-zinc-500"
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
                          className="font-mono text-xs text-rose-600 hover:underline"
                        >
                          {c.claimReference}
                        </Link>
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {c.payer.shortCode}
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {serviceDates(c)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatMoney(c.chargeAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatMoney(c.payerPaidAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-zinc-500">
                        {c.payPct != null
                          ? `${(Number(c.payPct) * 100).toFixed(0)}%`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
