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
  type Claim,
  type ArNote,
} from "@/lib/claims";
import { useFormat, type Formatter } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth-context";
import { ClaimFormPanel } from "../claim-form-panel";
import { StatusActions } from "./status-actions";

/**
 * How the payer got from the charge to what it actually paid. Each row is a
 * step: the write-off the provider eats, then the patient-share columns the
 * payer withheld, down to the realized pay rate.
 */
function AdjudicationBreakdown({ claim }: { claim: Claim }) {
  const t = useT();
  const { formatMoney, formatPercent } = useFormat();
  const charge = Number(claim.chargeAmount);
  const paid = Number(claim.payerPaidAmount);

  const steps: { label: string; value: string; strong?: boolean }[] = [
    { label: t("claims.field.charge"), value: formatMoney(charge), strong: true },
    {
      label: t("claims.breakdown.discount"),
      value: `− ${formatMoney(claim.discountAmount)}`,
    },
    {
      label: t("claims.field.allowedAmount"),
      value: formatMoney(claim.allowedAmount),
      strong: true,
    },
    {
      label: t("claims.breakdown.deductible"),
      value: `− ${formatMoney(claim.deductibleAmount)}`,
    },
    {
      label: t("claims.breakdown.copay"),
      value: `− ${formatMoney(claim.copayAmount)}`,
    },
    {
      label: t("claims.breakdown.coinsurance"),
      value: `− ${formatMoney(claim.coinsuranceAmount)}`,
    },
    {
      label: t("claims.breakdown.patientResponsibility"),
      value: formatMoney(claim.patientResponsibility),
      strong: true,
    },
    {
      label: t("claims.field.payerPaid"),
      value: formatMoney(paid),
      strong: true,
    },
  ];

  return (
    <Section
      title={t("claims.breakdown.title")}
      subtitle={t("claims.breakdown.subtitle")}
    >
      <DataList>
        {steps.map((step) => (
          <DataRow
            key={step.label}
            label={step.label}
            value={
              step.strong ? (
                <span className="font-medium">{step.value}</span>
              ) : (
                step.value
              )
            }
            mono
            muted={!step.strong}
          />
        ))}
      </DataList>
      <div className="mt-1 flex items-baseline justify-between gap-4 border-t-2 border-border-subtle pt-3">
        <span className="type-body-compact-01 font-medium text-text-primary">
          {t("claims.detail.payRate")}
        </span>
        <span className="font-mono type-heading-03 tabular-nums text-support-success">
          {charge > 0 ? formatPercent(paid / charge) : "—"}
        </span>
      </div>
    </Section>
  );
}

function serviceRange(claim: Claim, formatDate: Formatter["formatDate"]): string {
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
  const t = useT();
  const { formatDate } = useFormat();
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
      toast.success(t("claims.toast.noteAdded"));
    } catch {
      toast.error(t("claims.toast.noteAddFailed"));
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
            placeholder={t("claims.arNotes.placeholder")}
            rows={2}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={saving || !text.trim()}
              onClick={add}
            >
              {saving ? t("claims.arNotes.adding") : t("claims.arNotes.add")}
            </Button>
          </div>
        </div>
      )}
      {notes.length === 0 ? (
        <p className="py-2 type-body-01 text-text-secondary">
          {t("claims.arNotes.empty")}
        </p>
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
                {formatDate(note.noteDate)}
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
  const t = useT();
  const { formatMoney } = useFormat();
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
      title={t("claims.related.title")}
      subtitle={t("claims.related.subtitle", { name: clientName })}
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
          {t("claims.related.viewProfile")}
        </Link>
      </div>
    </Section>
  );
}

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { formatMoney, formatPercent, formatDate, formatDateTime, timeAgo } =
    useFormat();
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
      toast.error(t("claims.toast.loadOneFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

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
    return <p className="type-body-01 text-text-secondary">{t("common.loading")}</p>;
  if (!claim)
    return (
      <p className="type-body-01 text-text-secondary">
        {t("claims.detail.notFound")}
      </p>
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
        <ArrowLeft className="size-4 rtl:rotate-180" />{" "}
        {t("claims.action.backToClaims")}
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
            <Pencil className="size-3.5" /> {t("common.edit")}
          </Button>
        )}
        {can("claims.delete") && (
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
        <Stat label={t("claims.field.charge")} value={formatMoney(claim.chargeAmount)} />
        <Stat label={t("claims.field.payerPaid")} value={formatMoney(claim.payerPaidAmount)} accent="green" />
        <Stat
          label={t("claims.detail.payRate")}
          value={formatPercent(claim.payPct)}
          hint={t("claims.detail.payRateHint")}
        />
        <Stat
          label={t("claims.field.inBank")}
          value={formatMoney(claim.inBankAmount)}
          hint={claim.bankDate ? formatDate(claim.bankDate) : t("claims.detail.notBanked")}
        />
      </div>

      {/* Status transitions */}
      {can("claims.edit") && (
        <Section title={t("claims.detail.moveStatus")}>
          <StatusActions claim={claim} onChanged={setClaim} />
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          <Section title={t("claims.detail.claimDetails")}>
            <DataList>
              <DataRow label={t("claims.field.externalClaimNumber")} value={claim.externalClaimNumber ?? t("common.emDash")} mono />
              <DataRow label={t("claims.field.patientAccountNumber")} value={claim.patientAccountNumber ?? t("common.emDash")} mono />
              <DataRow label={t("claims.field.serviceDates")} value={serviceRange(claim, formatDate)} />
              <DataRow label={t("claims.field.dateBilled")} value={formatDate(claim.dateBilled)} />
            </DataList>
          </Section>

          <AdjudicationBreakdown claim={claim} />

          <Section title={t("claims.detail.negotiationBanking")} subtitle={t("claims.detail.negotiationBankingHint")}>
            <DataList>
              <DataRow label={t("claims.field.beforeNegotiation")} value={formatMoney(claim.beforeNegotiationAmount)} mono />
              <DataRow label={t("claims.field.afterNegotiation")} value={formatMoney(claim.afterNegotiationAmount)} mono />
              <DataRow label={t("claims.field.negoPctShort")} value={formatPercent(claim.negoPct)} mono />
              <DataRow label={t("claims.field.allowedAmount")} value={formatMoney(claim.allowedAmount)} mono />
              <DataRow label={t("claims.field.balanceNeeded")} value={formatMoney(claim.balanceNeeded)} mono />
              <DataRow label={t("claims.field.negotiationDate")} value={formatDate(claim.negotiationDate)} />
              <DataRow label={t("claims.field.negotiationNote")} value={claim.negotiationNote ?? "—"} />
            </DataList>
          </Section>

          <Section
            title={t("claims.detail.paymentLines")}
            subtitle={t("claims.detail.paymentLinesHint")}
            bodyClassName="px-0 py-0"
          >
            {lines.length === 0 ? (
              <p className="px-5 py-6 text-center type-body-01 text-text-secondary">
                {t("claims.detail.noPaymentLines")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("claims.field.serviceDate")}</TableHead>
                    <TableHead className="text-end">{t("claims.field.billed")}</TableHead>
                    <TableHead className="text-end">{t("claims.field.allowed")}</TableHead>
                    <TableHead className="text-end">{t("claims.field.paid")}</TableHead>
                    <TableHead>{t("claims.field.check")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-text-secondary">
                        {formatDate(l.dateOfService)}
                      </TableCell>
                      <TableCell className="text-end font-mono tabular-nums">
                        {formatMoney(l.billedAmount)}
                      </TableCell>
                      <TableCell className="text-end font-mono tabular-nums text-text-secondary">
                        {formatMoney(l.allowedAmount)}
                      </TableCell>
                      <TableCell className="text-end font-mono tabular-nums">
                        {formatMoney(l.paidAmount)}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        <span className="type-code-01">
                          {l.remittance.checkNumber ?? t("common.emDash")}
                        </span>
                        <span className="ms-1 type-label-01 text-text-helper">
                          {formatDate(l.remittance.checkDate)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 border-border-subtle bg-layer font-medium">
                    <TableCell className="text-text-primary">
                      {t("claims.detail.lineCount", { count: lines.length })}
                    </TableCell>
                    <TableCell className="text-end font-mono tabular-nums">
                      {formatMoney(lineTotals.billed)}
                    </TableCell>
                    <TableCell className="text-end font-mono tabular-nums text-text-secondary">
                      {formatMoney(lineTotals.allowed)}
                    </TableCell>
                    <TableCell className="text-end font-mono tabular-nums">
                      {formatMoney(lineTotals.paid)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </Section>

          {claim.notes && (
            <Section title={t("common.notes")}>
              <p className="whitespace-pre-wrap type-body-01 text-text-primary">
                {claim.notes}
              </p>
            </Section>
          )}
          {claim.internalNote && (
            <Section title={t("claims.detail.internalNoteTitle")} subtitle={t("claims.detail.internalNoteHint")}>
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
            title={t("claims.arNotes.title")}
            subtitle={t("claims.arNotes.count", { count: notes.length })}
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
          <Section title={t("claims.detail.record")}>
            <DataList>
              <DataRow label={t("common.createdBy")} value={userName(claim.createdBy)} />
              <DataRow
                label={t("common.createdAt")}
                value={formatDateTime(claim.createdAt)}
                muted
              />
              <DataRow label={t("common.updatedBy")} value={userName(claim.updatedBy)} />
              <DataRow
                label={t("claims.field.lastActivity")}
                value={timeAgo(claim.updatedAt)}
                muted
              />
              <DataRow
                label={t("claims.detail.paymentLines")}
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
        title={t("claims.detail.deleteTitle")}
        onDone={() => router.push("/claims")}
      />
    </div>
  );
}
