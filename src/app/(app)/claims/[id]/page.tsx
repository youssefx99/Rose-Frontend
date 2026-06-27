"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import {
  getClaim,
  listClaims,
  listClaimNotes,
  addClaimNote,
  formatMoney,
  formatDate,
  type Claim,
  type ArNote,
} from "@/lib/claims";
import { formatDateTime, formatDate as fmtDate, timeAgo } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { ClaimFormPanel } from "../claim-form-panel";
import { StatusActions } from "./status-actions";

function pct(value: string | null): string {
  if (value == null || value === "") return "—";
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function serviceRange(claim: Claim): string {
  return claim.dateOfServiceEnd && claim.dateOfServiceEnd !== claim.dateOfService
    ? `${formatDate(claim.dateOfService)} – ${formatDate(claim.dateOfServiceEnd)}`
    : formatDate(claim.dateOfService);
}

function userName(u?: { firstName: string; lastName: string } | null): string {
  return u ? `${u.firstName} ${u.lastName}` : "—";
}

/** Compact inline AR notes section replacing the slide-over. */
function ArNotesSection({
  claimId,
  notes,
  onAdded,
  canEdit,
}: {
  claimId: string;
  notes: ArNote[];
  onAdded: () => void;
  canEdit: boolean;
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    const value = text.trim();
    if (!value) return;
    setSaving(true);
    try {
      await addClaimNote(claimId, value);
      setText("");
      onAdded();
      toast.success("Note added.");
    } catch {
      toast.error("Failed to add note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a note…"
            rows={2}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={saving || !text.trim()}
              onClick={add}
            >
              {saving ? "Adding…" : "Add Note"}
            </Button>
          </div>
        </div>
      )}
      {notes.length === 0 ? (
        <p className="py-2 type-body-01 text-text-secondary">No notes yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-md border border-border-subtle bg-layer p-3"
            >
              <p className="whitespace-pre-wrap type-body-compact-01 text-text-primary">
                {note.noteText}
              </p>
              <p className="mt-1 type-label-01 text-text-secondary">
                {note.user.firstName} {note.user.lastName} ·{" "}
                {fmtDate(note.noteDate)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Other open claims for the same client. */
function RelatedClaimsSection({
  clientId,
  currentClaimId,
  clientName,
}: {
  clientId: string;
  currentClaimId: string;
  clientName: string;
}) {
  const [related, setRelated] = useState<Claim[]>([]);

  useEffect(() => {
    listClaims({ clientId })
      .then(({ data }) =>
        setRelated(data.filter((c) => c.id !== currentClaimId).slice(0, 5)),
      )
      .catch(() => undefined);
  }, [clientId, currentClaimId]);

  if (related.length === 0) return null;

  return (
    <Section
      title="Related claims"
      subtitle={`Other claims for ${clientName}`}
    >
      <ul className="space-y-2.5">
        {related.map((c) => (
          <li key={c.id}>
            <Link
              href={`/claims/${c.id}`}
              className="flex items-center justify-between gap-2 rounded-md px-1 py-1 transition-colors hover:bg-layer-hover"
            >
              <span className="font-mono type-label-01 text-link">
                {c.claimReference}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono type-label-01 tabular-nums text-text-secondary">
                  {formatMoney(c.chargeAmount)}
                </span>
                <StatusBadge status={c.status} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t border-border-subtle pt-3">
        <Link
          href={`/clients/${clientId}`}
          className="type-label-01 text-link hover:underline"
        >
          View full client profile →
        </Link>
      </div>
    </Section>
  );
}

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useAuth();
  const id = params.id;

  const [claim, setClaim] = useState<Claim | null>(null);
  const [notes, setNotes] = useState<ArNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadClaim = useCallback(async () => {
    try {
      setClaim(await getClaim(id));
    } catch {
      toast.error("Failed to load claim.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadNotes = useCallback(async () => {
    try {
      setNotes(await listClaimNotes(id));
    } catch {
      // non-fatal
    }
  }, [id]);

  useEffect(() => {
    loadClaim();
    loadNotes();
  }, [loadClaim, loadNotes]);

  if (loading)
    return <p className="type-body-01 text-text-secondary">Loading…</p>;
  if (!claim)
    return <p className="type-body-01 text-text-secondary">Claim not found.</p>;

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

      <PageHeader
        title={claim.claimReference}
        description={[claim.client?.displayName, claim.payer?.name, claim.payer?.state]
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
        <Stat label="Payer paid" value={formatMoney(claim.payerPaidAmount)} accent="green" />
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
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <Section title="Claim details">
            <DataList>
              <DataRow label="External claim #" value={claim.externalClaimNumber ?? "—"} mono />
              <DataRow label="Patient account #" value={claim.patientAccountNumber ?? "—"} mono />
              <DataRow label="Service dates" value={serviceRange(claim)} />
              <DataRow label="Date billed" value={formatDate(claim.dateBilled)} />
            </DataList>
          </Section>

          <Section title="Negotiation & banking" subtitle="Set only when the claim is negotiated">
            <DataList>
              <DataRow label="Nego %" value={pct(claim.negoPct)} mono />
              <DataRow label="Allowed amount" value={formatMoney(claim.allowedAmount)} mono />
              <DataRow label="Balance needed" value={formatMoney(claim.balanceNeeded)} mono />
              <DataRow label="Negotiation date" value={formatDate(claim.negotiationDate)} />
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Inline AR Notes */}
          <Section
            title="AR Notes"
            subtitle={`${notes.length} note${notes.length === 1 ? "" : "s"}`}
          >
            <ArNotesSection
              claimId={claim.id}
              notes={notes}
              onAdded={loadNotes}
              canEdit={can("claims.edit")}
            />
          </Section>

          {/* Related claims for same client */}
          {claim.client && (
            <RelatedClaimsSection
              clientId={claim.clientId}
              currentClaimId={claim.id}
              clientName={claim.client.displayName}
            />
          )}

          {/* Record metadata */}
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
                label="Last activity"
                value={timeAgo(claim.updatedAt)}
                muted
              />
              <DataRow
                label="Payment lines"
                value={claim._count?.remittanceLines ?? lines.length}
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
