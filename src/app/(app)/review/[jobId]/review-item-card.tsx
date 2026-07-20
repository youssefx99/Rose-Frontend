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
import { useFormat } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth-context";

interface ReviewItemCardProps {
  item: ReviewItem;
  onChanged: () => void;
}

/** Absolute translation keys — resolve with t(TITLES[itemType]) at render. */
const TITLES: Record<string, string> = {
  REMITTANCE_HEADER: "review.item.REMITTANCE_HEADER",
  CLAIM_PAYMENT: "review.item.CLAIM_PAYMENT",
  SERVICE_LINE_BATCH: "review.item.SERVICE_LINE_BATCH",
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
  const t = useT("review");
  const { formatMoney } = useFormat();
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
      toast.success(t("review.toast.approved"));
      onChanged();
    } catch (error) {
      handleError(error, t("review.toast.approvalFailed"));
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    try {
      await rejectItem(item.id);
      toast.success(t("review.toast.rejected"));
      onChanged();
    } catch (error) {
      handleError(error, t("review.toast.rejectionFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
      <div className="flex items-center justify-between border-b border-border-subtle bg-layer px-5 py-3">
        <span className="type-heading-02 text-text-primary">
          {t(TITLES[item.itemType])}
        </span>
        <StatusBadge status={item.status} />
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-2">
        {/* Left — extracted / editable */}
        <div>
          <p className="mb-3 type-label-01 font-medium uppercase tracking-wider text-text-secondary">
            {t("review.item.extractedByAi")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={`${item.id}-${f.key}`} className="type-label-01 text-text-secondary">
                  {t(f.labelKey)}
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
          <p className="mb-3 type-label-01 font-medium uppercase tracking-wider text-text-secondary">
            {item.itemType === "CLAIM_PAYMENT"
              ? t("review.item.matchedClaim")
              : t("review.item.willCreate")}
          </p>
          {item.itemType === "CLAIM_PAYMENT" ? (
            match ? (
              <Link
                href={`/claims/${match.id}`}
                className="block rounded-md border border-border-subtle p-4 transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:border-border-strong hover:bg-layer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono type-body-compact-01 text-text-primary">
                    {match.claimReference}
                  </span>
                  <StatusBadge status={match.status} />
                </div>
                <p className="mt-1 type-body-compact-01 text-text-secondary">
                  {match.client?.displayName ?? "—"}
                </p>
                <p className="mt-1 type-label-01 text-text-secondary">
                  {t("review.item.charge", {
                    amount: formatMoney(match.chargeAmount),
                  })}
                </p>
              </Link>
            ) : (
              <div className="rounded-md border border-dashed border-border-strong p-4 type-body-compact-01 text-text-secondary">
                {t("review.item.noMatchBefore")}
                <span className="font-mono text-text-primary">
                  {String(effective.claimNumber ?? "—")}
                </span>
                {t("review.item.noMatchAfter")}
              </div>
            )
          ) : (
            <div className="rounded-md border border-border-subtle p-4 type-body-compact-01 text-text-secondary">
              {t("review.item.createBefore")}
              <span className="font-medium text-text-primary">
                {t("review.item.bankDeposit")}
              </span>
              {t("review.item.createAnd")}
              <span className="font-medium text-text-primary">
                {t("review.item.remittance")}
              </span>
              {t("review.item.createFor")}
              <span className="font-medium text-text-primary">
                {String(effective.payerName ?? t("review.item.thisPayer"))}
              </span>
              {t("review.item.createOf")}
              <span className="font-mono">
                {formatMoney(Number(effective.checkAmount ?? 0))}
              </span>
              .
            </div>
          )}

          {item.status === "REJECTED" && item.rejectionReason && (
            <p className="mt-3 type-label-01 text-support-error">
              {t("review.item.rejectedReason", { reason: item.rejectionReason })}
            </p>
          )}
        </div>
      </div>

      {pending && (canApprove || canReject) && (
        <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">
          {canReject && (
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={reject}
            >
              {t("common.reject")}
            </Button>
          )}
          {canApprove && (
            <Button variant="rose" size="sm" disabled={busy} onClick={approve}>
              {busy ? t("working") : t("common.approve")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
