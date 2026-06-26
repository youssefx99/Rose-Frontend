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
import { formatDate, formatMoney } from "@/lib/format";
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
    "h-8 w-24 text-right font-mono tabular-nums disabled:opacity-100";

  return (
    <tr className="border-t border-zinc-100">
      <td className={cell}>
        <Input
          value={dos}
          disabled={!editable}
          aria-label="Date of service"
          onChange={(e) => setDos(e.target.value)}
          className="h-8 w-32 disabled:opacity-100"
        />
      </td>
      <td className={cell}>
        <Input
          value={billed}
          disabled={!editable}
          inputMode="decimal"
          aria-label="Billed"
          onChange={(e) => setBilled(e.target.value)}
          className={moneyInput}
        />
      </td>
      <td className={cell}>
        <Input
          value={allowed}
          disabled={!editable}
          inputMode="decimal"
          aria-label="Allowed"
          onChange={(e) => setAllowed(e.target.value)}
          className={moneyInput}
        />
      </td>
      <td className={cell}>
        <Input
          value={paid}
          disabled={!editable}
          inputMode="decimal"
          aria-label="Paid"
          onChange={(e) => setPaid(e.target.value)}
          className={moneyInput}
        />
      </td>
      <td className={cell}>
        <StatusBadge status={item.status} />
      </td>
      <td className={cn(cell, "whitespace-nowrap text-right")}>
        {pending ? (
          <div className="inline-flex gap-1">
            {canApprove && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                title="Approve line"
                onClick={() => run(() => approveItem(item.id, buildChanges()), "Approve failed.")}
                className="h-7 px-2 text-green-700 hover:bg-green-50"
              >
                <Check className="size-4" />
              </Button>
            )}
            {canReject && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                title="Reject line"
                onClick={() => run(() => rejectItem(item.id), "Reject failed.")}
                className="h-7 px-2 text-red-600 hover:bg-red-50"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        ) : (
          <span className="text-xs text-zinc-400">
            {item.status === "REJECTED" ? "rejected" : "committed"}
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
    verb: string,
  ) => {
    setBusy(true);
    try {
      for (const item of pendingItems) {
        await action(item.id);
      }
      toast.success(`${verb} claim — ${pendingItems.length} line(s).`);
      onChanged();
    } catch (e) {
      handleApiError(e, `${verb} claim failed.`);
    } finally {
      setBusy(false);
    }
  };

  const metric = (label: string, value: string, accent = false) => (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-mono text-sm tabular-nums",
          accent ? "font-semibold text-zinc-950" : "text-zinc-900",
        )}
      >
        {value}
      </p>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      {/* Summary header */}
      <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900">
                {group.clientDisplayName}
              </span>
              <StatusBadge status={group.status} />
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              Claim{" "}
              <span className="font-mono text-zinc-700">
                {group.claimNumber ?? "—"}
              </span>
              {group.patientAccountNumber ? (
                <>
                  {" · Acct "}
                  <span className="font-mono">{group.patientAccountNumber}</span>
                </>
              ) : null}
            </p>
          </div>
          <div className="text-right text-xs text-zinc-500">
            {group.lineCount} service line{group.lineCount === 1 ? "" : "s"}
            <br />
            {group.counts.pending} pending · {group.counts.approved} done
            {group.counts.rejected ? ` · ${group.counts.rejected} rejected` : ""}
          </div>
        </div>
      </div>

      {/* Summary metrics + the claim record this rolls into */}
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {metric("Service dates", range)}
          {metric("Billed", formatMoney(group.billedAmount))}
          {metric("Allowed", formatMoney(group.allowedAmount))}
          {metric("Paid", formatMoney(group.paidAmount), true)}
          {metric("Pay %", `${(group.payPct * 100).toFixed(1)}%`)}
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Claim record
          </p>
          {match ? (
            <Link
              href={`/claims/${match.id}`}
              className="block rounded-md border border-zinc-200 p-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
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
              <p className="mt-0.5 text-xs text-zinc-500">
                On approval this existing claim is updated with the payment above.
              </p>
            </Link>
          ) : (
            <div className="rounded-md border border-dashed border-zinc-300 p-3 text-sm text-zinc-500">
              No existing claim yet — approving creates one claim for{" "}
              <span className="font-mono text-zinc-700">
                {group.claimNumber ?? "—"}
              </span>{" "}
              with the summed totals above.
            </div>
          )}
        </div>
      </div>

      {/* Footer: drill-down toggle + whole-claim actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 px-5 py-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          <ChevronDown
            className={cn("size-4 transition-transform", expanded && "rotate-180")}
          />
          {expanded ? "Hide" : "Show"} {group.lineCount} service line
          {group.lineCount === 1 ? "" : "s"}
        </button>
        {hasPending && (canApprove || canReject) && (
          <div className="flex gap-2">
            {canReject && (
              <Button
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={() => runBulk(rejectItem, "Rejected")}
              >
                Reject claim
              </Button>
            )}
            {canApprove && (
              <Button
                variant="rose"
                size="sm"
                disabled={busy}
                onClick={() => runBulk((id) => approveItem(id), "Approved")}
              >
                {busy ? "Working…" : "Approve claim"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Drill-down: every daily service line, editable and individually actionable */}
      {expanded && (
        <div className="overflow-x-auto border-t border-zinc-200 bg-zinc-50/40 px-5 py-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-2 py-1 font-medium">Date of service</th>
                <th className="px-2 py-1 text-right font-medium">Billed</th>
                <th className="px-2 py-1 text-right font-medium">Allowed</th>
                <th className="px-2 py-1 text-right font-medium">Paid</th>
                <th className="px-2 py-1 font-medium">Status</th>
                <th className="px-2 py-1 text-right font-medium">Actions</th>
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
