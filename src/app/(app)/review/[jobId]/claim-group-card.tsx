"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Check, ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  approveItem,
  rejectItem,
  type ClaimGroup,
  type ExtractedData,
  type ReviewItem,
} from "@/lib/documents";
import { useFormat } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

function effective(item: ReviewItem): ExtractedData {
  return { ...item.extractedData, ...(item.proposedChanges ?? {}) };
}

function handleApiError(error: unknown, fallback: string) {
  const message =
    isAxiosError(error) && typeof error.response?.data?.message === "string"
      ? error.response.data.message
      : fallback;
  toast.error(message);
}

const coerceMoney = (raw: string): number | null => {
  const v = raw.trim();
  return v === "" ? null : Number(v);
};

// ── one daily service line — the audit-level detail row ──────────────────────
function DetailLineRow({
  item,
  canApprove,
  canReject,
  onChanged,
}: {
  item: ReviewItem;
  canApprove: boolean;
  canReject: boolean;
  onChanged: () => void;
}) {
  const t = useT("review");
  const data = effective(item);
  const [dos, setDos] = useState(String(data.dateOfService ?? ""));
  const [billed, setBilled] = useState(String(data.billedAmount ?? ""));
  const [allowed, setAllowed] = useState(String(data.allowedAmount ?? ""));
  const [paid, setPaid] = useState(String(data.paidAmount ?? ""));
  const [busy, setBusy] = useState(false);
  const pending = item.status === "PENDING";
  const editable = pending && canApprove;

  // Only send the fields the reviewer actually changed (a MODIFIED approval).
  const buildChanges = (): ExtractedData | undefined => {
    const changes: ExtractedData = {};
    if (dos !== String(data.dateOfService ?? ""))
      changes.dateOfService = dos.trim() || null;
    if (billed !== String(data.billedAmount ?? ""))
      changes.billedAmount = coerceMoney(billed);
    if (allowed !== String(data.allowedAmount ?? ""))
      changes.allowedAmount = coerceMoney(allowed);
    if (paid !== String(data.paidAmount ?? ""))
      changes.paidAmount = coerceMoney(paid);
    return Object.keys(changes).length ? changes : undefined;
  };

  const run = async (fn: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    try {
      await fn();
      onChanged();
    } catch (e) {
      handleApiError(e, fallback);
    } finally {
      setBusy(false);
    }
  };

  const cell = "px-2 py-1.5 align-middle";
  const moneyInput =
    "h-8 w-24 text-end font-mono tabular-nums disabled:opacity-100";

  return (
    <tr className="border-t border-border-subtle">
      <td className={cell}>
        <Input
          value={dos}
          disabled={!editable}
          aria-label={t("documents.field.dateOfService")}
          onChange={(e) => setDos(e.target.value)}
          className="h-8 w-32 disabled:opacity-100"
        />
      </td>
      <td className={cell}>
        <Input
          value={billed}
          disabled={!editable}
          inputMode="decimal"
          aria-label={t("documents.field.billedAmount")}
          onChange={(e) => setBilled(e.target.value)}
          className={moneyInput}
        />
      </td>
      <td className={cell}>
        <Input
          value={allowed}
          disabled={!editable}
          inputMode="decimal"
          aria-label={t("documents.field.allowedAmount")}
          onChange={(e) => setAllowed(e.target.value)}
          className={moneyInput}
        />
      </td>
      <td className={cell}>
        <Input
          value={paid}
          disabled={!editable}
          inputMode="decimal"
          aria-label={t("documents.field.paidAmount")}
          onChange={(e) => setPaid(e.target.value)}
          className={moneyInput}
        />
      </td>
      <td className={cell}>
        <StatusBadge status={item.status} />
      </td>
      <td className={cn(cell, "whitespace-nowrap text-end")}>
        {pending ? (
          <div className="inline-flex gap-1">
            {canApprove && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                title={t("review.line.approveTitle")}
                onClick={() =>
                  run(
                    () => approveItem(item.id, buildChanges()),
                    t("review.toast.approveFailed"),
                  )
                }
                className="h-7 px-2 text-support-success hover:bg-support-success-bg"
              >
                <Check className="size-4" />
              </Button>
            )}
            {canReject && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                title={t("review.line.rejectTitle")}
                onClick={() =>
                  run(() => rejectItem(item.id), t("review.toast.rejectFailed"))
                }
                className="h-7 px-2 text-support-error hover:bg-support-error-bg"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        ) : (
          <span className="type-label-01 text-text-helper">
            {item.status === "REJECTED"
              ? t("review.line.rejected")
              : t("review.line.committed")}
          </span>
        )}
      </td>
    </tr>
  );
}

// ── the weekly-claim card: summary + drill-down to every line ────────────────
export function ClaimGroupCard({
  group,
  onChanged,
}: {
  group: ClaimGroup;
  onChanged: () => void;
}) {
  const t = useT("review");
  const { formatDate, formatMoney } = useFormat();
  const { can } = useAuth();
  const canApprove = can("review.approve");
  const canReject = can("review.reject");
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  const match = group.matchPreview;
  const pendingItems = useMemo(
    () => group.items.filter((i) => i.status === "PENDING"),
    [group.items],
  );
  const hasPending = pendingItems.length > 0;

  const range =
    group.dateOfServiceStart === group.dateOfServiceEnd
      ? formatDate(group.dateOfServiceStart)
      : `${formatDate(group.dateOfServiceStart)} – ${formatDate(group.dateOfServiceEnd)}`;

  // Approve/reject the whole claim by walking its pending lines sequentially —
  // the backend's idempotent aggregate keeps the claim totals consistent.
  const runBulk = async (
    action: (id: string) => Promise<unknown>,
    successKey: string,
    failureKey: string,
  ) => {
    setBusy(true);
    try {
      for (const item of pendingItems) {
        await action(item.id);
      }
      toast.success(t(successKey, { count: pendingItems.length }));
      onChanged();
    } catch (e) {
      handleApiError(e, t(failureKey));
    } finally {
      setBusy(false);
    }
  };

  const metric = (label: string, value: string, accent = false) => (
    <div>
      <p className="type-label-01 text-text-secondary">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-mono type-body-compact-01 tabular-nums text-text-primary",
          accent && "font-semibold",
        )}
      >
        {value}
      </p>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
      {/* Summary header */}
      <div className="border-b border-border-subtle bg-layer px-5 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="type-heading-02 text-text-primary">
                {group.clientDisplayName}
              </span>
              <StatusBadge status={group.status} />
            </div>
            <p className="mt-0.5 type-label-01 text-text-secondary">
              {t("review.group.claim")}{" "}
              <span className="font-mono text-text-primary">
                {group.claimNumber ?? "—"}
              </span>
              {group.patientAccountNumber ? (
                <>
                  {` · ${t("review.group.acct")} `}
                  <span className="font-mono">{group.patientAccountNumber}</span>
                </>
              ) : null}
            </p>
          </div>
          <div className="text-end type-label-01 text-text-secondary">
            {t("review.group.serviceLineCount", { count: group.lineCount })}
            <br />
            {t("review.group.pendingDone", {
              pending: group.counts.pending,
              done: group.counts.approved,
            })}
            {group.counts.rejected
              ? t("review.group.rejectedSuffix", {
                  rejected: group.counts.rejected,
                })
              : ""}
          </div>
        </div>
      </div>

      {/* Summary metrics + the claim record this rolls into */}
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {metric(t("review.metric.serviceDates"), range)}
          {metric(t("documents.field.billedAmount"), formatMoney(group.billedAmount))}
          {metric(t("documents.field.allowedAmount"), formatMoney(group.allowedAmount))}
          {metric(t("documents.field.paidAmount"), formatMoney(group.paidAmount), true)}
          {metric(t("review.metric.payPct"), `${(group.payPct * 100).toFixed(1)}%`)}
        </div>
        <div>
          <p className="mb-2 type-label-01 font-medium uppercase tracking-wider text-text-secondary">
            {t("review.group.claimRecord")}
          </p>
          {match ? (
            <Link
              href={`/claims/${match.id}`}
              className="block rounded-md border border-border-subtle p-3 transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:border-border-strong hover:bg-layer"
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
              <p className="mt-0.5 type-label-01 text-text-secondary">
                {t("review.group.matchNote")}
              </p>
            </Link>
          ) : (
            <div className="rounded-md border border-dashed border-border-strong p-3 type-body-compact-01 text-text-secondary">
              {t("review.group.noMatchBefore")}
              <span className="font-mono text-text-primary">
                {group.claimNumber ?? "—"}
              </span>
              {t("review.group.noMatchAfter")}
            </div>
          )}
        </div>
      </div>

      {/* Footer: drill-down toggle + whole-claim actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle px-5 py-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 type-body-compact-01 font-medium text-text-secondary transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:text-text-primary"
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-[var(--dur-moderate-02)] ease-[var(--ease-standard)]",
              expanded && "rotate-180",
            )}
          />
          {t(expanded ? "review.group.hideLines" : "review.group.showLines", {
            count: group.lineCount,
          })}
        </button>
        {hasPending && (canApprove || canReject) && (
          <div className="flex gap-2">
            {canReject && (
              <Button
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={() =>
                  runBulk(
                    rejectItem,
                    "review.toast.rejectedClaim",
                    "review.toast.rejectClaimFailed",
                  )
                }
              >
                {t("review.group.rejectClaim")}
              </Button>
            )}
            {canApprove && (
              <Button
                variant="rose"
                size="sm"
                disabled={busy}
                onClick={() =>
                  runBulk(
                    (id) => approveItem(id),
                    "review.toast.approvedClaim",
                    "review.toast.approveClaimFailed",
                  )
                }
              >
                {busy ? t("working") : t("review.group.approveClaim")}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Drill-down: every daily service line, editable and individually actionable */}
      {expanded && (
        <div className="overflow-x-auto border-t border-border-subtle bg-layer px-5 py-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-start type-label-01 uppercase tracking-wider text-text-secondary">
                <th className="px-2 py-1 font-medium">
                  {t("documents.field.dateOfService")}
                </th>
                <th className="px-2 py-1 text-end font-medium">
                  {t("documents.field.billedAmount")}
                </th>
                <th className="px-2 py-1 text-end font-medium">
                  {t("documents.field.allowedAmount")}
                </th>
                <th className="px-2 py-1 text-end font-medium">
                  {t("documents.field.paidAmount")}
                </th>
                <th className="px-2 py-1 font-medium">{t("common.status")}</th>
                <th className="px-2 py-1 text-end font-medium">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((item) => (
                <DetailLineRow
                  key={item.id}
                  item={item}
                  canApprove={canApprove}
                  canReject={canReject}
                  onChanged={onChanged}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
