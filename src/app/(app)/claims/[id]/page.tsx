"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { CascadeDeleteDialog } from "@/components/ui/cascade-delete-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Section, DataList, DataRow, Stat } from "@/components/ui/detail";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClaim, formatMoney, formatDate, type Claim } from "@/lib/claims";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { ClaimFormPanel } from "../claim-form-panel";
import { StatusActions } from "./status-actions";
import { ArNotesPanel } from "./ar-notes-panel";

/** Decimal fraction (0.6) → "60%". */
function pct(value: string | null): string {
  if (value == null || value === "") return "—";
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function serviceRange(claim: Claim): string {
  return claim.dateOfServiceEnd &&
    claim.dateOfServiceEnd !== claim.dateOfService
    ? `${formatDate(claim.dateOfService)} – ${formatDate(claim.dateOfServiceEnd)}`
    : formatDate(claim.dateOfService);
}

function userName(u?: { firstName: string; lastName: string } | null): string {
  return u ? `${u.firstName} ${u.lastName}` : "—";
}

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useAuth();
  const id = params.id;
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setClaim(await getClaim(id));
    } catch {
      toast.error("Failed to load claim.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return <p className="type-body-01 text-text-secondary">Loading…</p>;
  if (!claim)
    return (
      <p className="type-body-01 text-text-secondary">Claim not found.</p>
    );

  const lines = claim.remittanceLines ?? [];
  const lineTotals = lines.reduce(
    (acc, l) => ({
      billed: acc.billed + Number(l.billedAmount),
      allowed: acc.allowed + Number(l.allowedAmount),
      paid: acc.paid + Number(l.paidAmount),
    }),
    { billed: 0, allowed: 0, paid: 0 },
  );

  return (
    <div className="space-y-6">
      <Link
        href="/claims"
        className="inline-flex items-center gap-1 type-body-compact-01 text-text-secondary transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:text-text-primary"
      >
        <ArrowLeft className="size-4" /> Back to claims
      </Link>

      {/* Header */}
      <PageHeader
        title={claim.claimReference}
        description={[
          claim.client?.displayName,
          claim.payer?.name,
          claim.payer?.state,
        ]
          .filter(Boolean)
          .join(" · ")}
      >
        <StatusBadge status={claim.status} />
        {can("claims.edit") && (
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" /> Edit
          </Button>
        )}
        {can("claims.delete") && (
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
        <Stat label="Charge" value={formatMoney(claim.chargeAmount)} />
        <Stat
          label="Payer paid"
          value={formatMoney(claim.payerPaidAmount)}
          accent="green"
        />
        <Stat label="Pay rate" value={pct(claim.payPct)} hint="paid ÷ charge" />
        <Stat
          label="In bank"
          value={formatMoney(claim.inBankAmount)}
          hint={claim.bankDate ? formatDate(claim.bankDate) : "Not banked"}
        />
      </div>

      {/* Status transitions */}
      {can("claims.edit") && (
        <Section title="Move status">
          <StatusActions claim={claim} onChanged={setClaim} />
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Claim details">
            <DataList>
              <DataRow
                label="External claim #"
                value={claim.externalClaimNumber ?? "—"}
                mono
              />
              <DataRow
                label="Patient account #"
                value={claim.patientAccountNumber ?? "—"}
                mono
              />
              <DataRow label="Service dates" value={serviceRange(claim)} />
              <DataRow label="Date billed" value={formatDate(claim.dateBilled)} />
              <DataRow
                label="Pay to patient"
                value={claim.payToPatient ? "Yes" : "No"}
              />
            </DataList>
          </Section>

          <Section
            title="Negotiation & banking"
            subtitle="Set only when the claim is negotiated"
          >
            <DataList>
              <DataRow label="Nego %" value={pct(claim.negoPct)} mono />
              <DataRow
                label="Allowed amount"
                value={formatMoney(claim.allowedAmount)}
                mono
              />
              <DataRow
                label="Balance needed"
                value={formatMoney(claim.balanceNeeded)}
                mono
              />
              <DataRow
                label="Negotiation date"
                value={formatDate(claim.negotiationDate)}
              />
            </DataList>
          </Section>

          <Section
            title="Payment lines"
            subtitle="The EOB daily lines that build this claim"
            bodyClassName="px-0 py-0"
          >
            {lines.length === 0 ? (
              <p className="px-5 py-6 text-center type-body-01 text-text-secondary">
                No payment lines — this claim was entered manually.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service date</TableHead>
                    <TableHead className="text-right">Billed</TableHead>
                    <TableHead className="text-right">Allowed</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Check</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-text-secondary">
                        {formatDate(l.dateOfService)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatMoney(l.billedAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-text-secondary">
                        {formatMoney(l.allowedAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatMoney(l.paidAmount)}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        <span className="type-code-01">
                          {l.remittance.checkNumber ?? "—"}
                        </span>
                        <span className="ml-1 type-label-01 text-text-helper">
                          {formatDate(l.remittance.checkDate)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 border-border-subtle bg-layer font-medium">
                    <TableCell className="text-text-primary">
                      {lines.length} line{lines.length === 1 ? "" : "s"}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatMoney(lineTotals.billed)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-text-secondary">
                      {formatMoney(lineTotals.allowed)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatMoney(lineTotals.paid)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </Section>

          {claim.notes && (
            <Section title="Notes">
              <p className="whitespace-pre-wrap type-body-01 text-text-primary">
                {claim.notes}
              </p>
            </Section>
          )}
          {claim.internalNote && (
            <Section title="Internal note" subtitle="Not shown to clients">
              <p className="whitespace-pre-wrap type-body-01 text-text-primary">
                {claim.internalNote}
              </p>
            </Section>
          )}
        </div>

        <div className="space-y-6">
          <ArNotesPanel claimId={claim.id} />

          <Section title="Record">
            <DataList>
              <DataRow label="Created by" value={userName(claim.createdBy)} />
              <DataRow
                label="Created"
                value={formatDateTime(claim.createdAt)}
                muted
              />
              <DataRow label="Updated by" value={userName(claim.updatedBy)} />
              <DataRow
                label="Updated"
                value={formatDateTime(claim.updatedAt)}
                muted
              />
              <DataRow
                label="Payment lines"
                value={claim._count?.remittanceLines ?? lines.length}
                mono
              />
              <DataRow
                label="AR notes"
                value={claim._count?.arNotes ?? 0}
                mono
              />
            </DataList>
          </Section>
        </div>
      </div>

      <ClaimFormPanel
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        claim={claim}
        onSaved={setClaim}
      />

      <CascadeDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        type="claim"
        id={claim.id}
        title="Delete claim"
        onDone={() => router.push("/claims")}
      />
    </div>
  );
}
