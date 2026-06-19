"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DeleteConfirm } from "@/components/ui/delete-confirm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getClaim,
  deleteClaim,
  formatMoney,
  formatDate,
  type Claim,
} from "@/lib/claims";
import { useAuth } from "@/lib/auth-context";
import { ClaimFormPanel } from "../claim-form-panel";
import { StatusActions } from "./status-actions";
import { ArNotesPanel } from "./ar-notes-panel";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-900">{value}</span>
    </div>
  );
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

  if (loading) {
    return <p className="text-zinc-500">Loading…</p>;
  }
  if (!claim) {
    return <p className="text-zinc-500">Claim not found.</p>;
  }

  const policyLabel = claim.insurancePolicy
    ? `${claim.insurancePolicy.payer.name} · ${claim.insurancePolicy.policyType}`
    : "—";

  return (
    <div className="space-y-6">
      <Link
        href="/claims"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="size-4" /> Back to claims
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-mono text-xl font-semibold text-zinc-950">
            {claim.claimReference}
          </h1>
          <p className="text-sm text-zinc-500">
            {claim.client?.displayName} · {claim.payer?.name}
          </p>
        </div>
        <StatusBadge status={claim.status} className="text-sm" />
      </div>

      {can("claims.edit") && (
        <StatusActions claim={claim} onChanged={setClaim} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Claim Details</CardTitle>
            <div className="flex gap-2">
              {can("claims.edit") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-3.5" /> Edit
                </Button>
              )}
              {can("claims.delete") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <SummaryRow
              label="External Claim #"
              value={claim.externalClaimNumber ?? "—"}
            />
            <SummaryRow label="Date Billed" value={formatDate(claim.dateBilled)} />
            <SummaryRow
              label="Service Start"
              value={formatDate(claim.serviceDateStart)}
            />
            <SummaryRow
              label="Service End"
              value={formatDate(claim.serviceDateEnd)}
            />
            <SummaryRow label="Pay %" value={claim.payPct ?? "—"} />
            <SummaryRow label="Nego %" value={claim.negoPct} />
            <SummaryRow
              label="Negotiation Date"
              value={formatDate(claim.negotiationDate)}
            />
            <SummaryRow label="Insurance Policy" value={policyLabel} />
            {claim.notes && (
              <div className="border-t border-zinc-200 pt-2">
                <p className="text-zinc-500">Notes</p>
                <p className="whitespace-pre-wrap text-zinc-800">
                  {claim.notes}
                </p>
              </div>
            )}
            {claim.internalNote && (
              <div className="border-t border-zinc-200 pt-2">
                <p className="text-zinc-500">Internal Note</p>
                <p className="whitespace-pre-wrap text-zinc-800">
                  {claim.internalNote}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financials</CardTitle>
              <CardDescription>Computed by the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <SummaryRow label="Charge" value={formatMoney(claim.chargeAmount)} />
              <SummaryRow
                label="Payer Paid"
                value={formatMoney(claim.payerPaidAmount)}
              />
              <SummaryRow
                label="Allowed"
                value={formatMoney(claim.allowedAmount)}
              />
              <SummaryRow
                label="Balance Needed"
                value={formatMoney(claim.balanceNeeded)}
              />
              <SummaryRow
                label="Client Liability"
                value={formatMoney(claim.patientLiabilityAmount)}
              />
              <SummaryRow
                label="Pay to client"
                value={claim.payToPatient ? "Yes" : "No"}
              />
            </CardContent>
          </Card>

          <ArNotesPanel claimId={claim.id} />
        </div>
      </div>

      <ClaimFormPanel
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        claim={claim}
        onSaved={setClaim}
      />

      <DeleteConfirm
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete claim"
        entityName={claim.claimReference}
        canHardDelete={(claim._count?.remittanceLines ?? 0) === 0}
        blockedReason={
          (claim._count?.remittanceLines ?? 0) > 0
            ? `This claim is linked to ${claim._count?.remittanceLines} remittance payment line(s), so it can't be deleted. Unmatch the payment first.`
            : undefined
        }
        onDelete={() => deleteClaim(claim.id)}
        onDone={() => {
          toast.success("Claim deleted.");
          router.push("/claims");
        }}
      >
        <p>
          <span className="font-medium text-zinc-900">Delete permanently</span>{" "}
          removes this claim
          {(claim._count?.arNotes ?? 0) > 0
            ? ` and its ${claim._count?.arNotes} AR note(s)`
            : ""}
          . This cannot be undone.
        </p>
      </DeleteConfirm>
    </div>
  );
}
