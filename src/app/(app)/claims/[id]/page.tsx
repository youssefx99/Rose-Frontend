"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getClaim,
  formatMoney,
  statusVariant,
  type Claim,
} from "@/lib/claims";
import { ClaimForm } from "../claim-form";
import { StatusActions } from "./status-actions";
import { ArNotesPanel } from "./ar-notes-panel";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);

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
    return <p className="text-muted-foreground">Loading…</p>;
  }
  if (!claim) {
    return <p className="text-muted-foreground">Claim not found.</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/claims"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to claims
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {claim.claimReference}
          </h1>
          <p className="text-sm text-muted-foreground">
            {claim.client?.displayName} · {claim.payer?.name}
          </p>
        </div>
        <Badge variant={statusVariant(claim.status)} className="text-sm">
          {claim.status}
        </Badge>
      </div>

      <StatusActions claim={claim} onChanged={setClaim} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Claim Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ClaimForm mode="edit" claim={claim} onSaved={setClaim} />
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
    </div>
  );
}
