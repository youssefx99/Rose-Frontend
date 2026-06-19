"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  approveItem,
  fieldsFor,
  rejectItem,
  type ExtractedData,
  type FieldSpec,
  type ReviewItem,
} from "@/lib/documents";
import { formatMoney } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

interface ReviewItemCardProps {
  item: ReviewItem;
  onChanged: () => void;
}

const TITLES: Record<string, string> = {
  REMITTANCE_HEADER: "Remittance Header",
  CLAIM_PAYMENT: "Claim Payment Line",
  SERVICE_LINE_BATCH: "Service Lines",
};

function effectiveData(item: ReviewItem): ExtractedData {
  return { ...item.extractedData, ...(item.proposedChanges ?? {}) };
}

function displayValue(kind: FieldSpec["kind"], value: unknown): string {
  if (value == null) return "";
  if (kind === "list" && Array.isArray(value)) return value.join(", ");
  return String(value);
}

function coerce(kind: FieldSpec["kind"], raw: string): unknown {
  const v = raw.trim();
  if (kind === "money" || kind === "number") return v === "" ? null : Number(v);
  if (kind === "list")
    return v === "" ? [] : v.split(",").map((s) => s.trim()).filter(Boolean);
  return v === "" ? null : v;
}

export function ReviewItemCard({ item, onChanged }: ReviewItemCardProps) {
  const { can } = useAuth();
  const canApprove = can("review.approve");
  const canReject = can("review.reject");
  const fields = fieldsFor(item.itemType);
  const effective = useMemo(() => effectiveData(item), [item]);
  const [edits, setEdits] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [f.key, displayValue(f.kind, effective[f.key])]),
    ),
  );
  const [busy, setBusy] = useState(false);

  const pending = item.status === "PENDING";
  const match = item.matchPreview ?? item.targetClaim ?? null;

  const buildChanges = (): ExtractedData | undefined => {
    const changes: ExtractedData = {};
    for (const f of fields) {
      const next = coerce(f.kind, edits[f.key] ?? "");
      const original = effective[f.key] ?? (f.kind === "list" ? [] : null);
      if (JSON.stringify(next) !== JSON.stringify(original)) {
        changes[f.key] = next;
      }
    }
    return Object.keys(changes).length > 0 ? changes : undefined;
  };

  const handleError = (error: unknown, fallback: string) => {
    const message =
      isAxiosError(error) && typeof error.response?.data?.message === "string"
        ? error.response.data.message
        : fallback;
    toast.error(message);
  };

  const approve = async () => {
    setBusy(true);
    try {
      await approveItem(item.id, buildChanges());
      toast.success("Approved.");
      onChanged();
    } catch (error) {
      handleError(error, "Approval failed.");
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    try {
      await rejectItem(item.id);
      toast.success("Rejected.");
      onChanged();
    } catch (error) {
      handleError(error, "Rejection failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-3">
        <span className="text-sm font-semibold text-zinc-900">
          {TITLES[item.itemType]}
        </span>
        <StatusBadge status={item.status} />
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-2">
        {/* Left — extracted / editable */}
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Extracted by AI
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={`${item.id}-${f.key}`} className="text-xs text-zinc-500">
                  {f.label}
                </Label>
                <Input
                  id={`${item.id}-${f.key}`}
                  value={edits[f.key] ?? ""}
                  disabled={!pending || !canApprove}
                  inputMode={
                    f.kind === "money" || f.kind === "number"
                      ? "decimal"
                      : undefined
                  }
                  onChange={(e) =>
                    setEdits((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  className={
                    f.kind === "money" || f.kind === "number"
                      ? "font-mono tabular-nums"
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right — matched DB record */}
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            {item.itemType === "CLAIM_PAYMENT" ? "Matched Claim" : "Will Create"}
          </p>
          {item.itemType === "CLAIM_PAYMENT" ? (
            match ? (
              <Link
                href={`/claims/${match.id}`}
                className="block rounded-md border border-zinc-200 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm text-zinc-900">
                    {match.claimReference}
                  </span>
                  <StatusBadge status={match.status} />
                </div>
                <p className="mt-1 text-sm text-zinc-600">
                  {match.client?.displayName ?? "—"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Charge {formatMoney(match.chargeAmount)}
                </p>
              </Link>
            ) : (
              <div className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
                No matching claim found. On approval this line is saved
                unmatched, flagged for manual resolution.
              </div>
            )
          ) : (
            <div className="rounded-md border border-zinc-200 p-4 text-sm text-zinc-600">
              Approving creates a{" "}
              <span className="font-medium text-zinc-900">bank deposit</span> and{" "}
              <span className="font-medium text-zinc-900">remittance</span> for{" "}
              <span className="font-medium text-zinc-900">
                {String(effective.payerName ?? "this payer")}
              </span>{" "}
              of{" "}
              <span className="font-mono">
                {formatMoney(Number(effective.checkAmount ?? 0))}
              </span>
              .
            </div>
          )}

          {item.status === "REJECTED" && item.rejectionReason && (
            <p className="mt-3 text-xs text-red-600">
              Rejected: {item.rejectionReason}
            </p>
          )}
        </div>
      </div>

      {pending && (canApprove || canReject) && (
        <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-3">
          {canReject && (
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={reject}
            >
              Reject
            </Button>
          )}
          {canApprove && (
            <Button variant="rose" size="sm" disabled={busy} onClick={approve}>
              {busy ? "Working…" : "Approve"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
