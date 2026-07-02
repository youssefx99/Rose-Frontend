"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Coins, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  approveAllJob,
  getReviewJob,
  rejectAllJob,
  reopenJob,
  type ReviewJobDetail,
  type ValidationFlag,
} from "@/lib/documents";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { ReviewItemCard } from "./review-item-card";
import { ClaimGroupCard } from "./claim-group-card";
import { DocumentViewer, useDocumentFile } from "@/components/document-viewer";

function ValidationBadge({ score, flags }: { score: number; flags: ValidationFlag[] }) {
  const errors = flags.filter((f) => f.severity === "error");
  const warnings = flags.filter((f) => f.severity === "warning");
  const color =
    score >= 90 ? "text-support-success border-support-success bg-support-success-bg"
    : score >= 70 ? "text-support-warning border-support-warning bg-support-warning-bg"
    : "text-support-error border-support-error bg-support-error-bg";
  const tooltip = flags.length === 0
    ? "No issues found"
    : flags.map((f) => `[${f.severity.toUpperCase()}] ${f.field}: ${f.message}`).join("\n");
  return (
    <span
      title={tooltip}
      className={cn(
        "inline-flex cursor-help items-center gap-1.5 rounded-md border px-2 py-1 type-label-01",
        color,
      )}
    >
      <ShieldCheck className="size-3.5" />
      Validation: <span className="font-semibold tabular-nums">{score}/100</span>
      {errors.length > 0 && (
        <span className="font-medium">&nbsp;· {errors.length} error{errors.length > 1 ? "s" : ""}</span>
      )}
      {warnings.length > 0 && (
        <span className="font-medium">&nbsp;· {warnings.length} warning{warnings.length > 1 ? "s" : ""}</span>
      )}
    </span>
  );
}

// Persisted document/items split (left panel width %), with sane bounds.
const SPLIT_KEY = "rose-review-split";
const DEFAULT_PCT = 45;
const MIN_PCT = 28;
const MAX_PCT = 72;
const clampPct = (pct: number) => Math.min(MAX_PCT, Math.max(MIN_PCT, pct));

export default function ReviewDetailPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const { can } = useAuth();
  const file = useDocumentFile(jobId);
  const [job, setJob] = useState<ReviewJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulk, setBulk] = useState<"approve" | "reject" | "reopen" | null>(null);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);

  // Resizable split between the document (left) and review items (right).
  const splitRef = useRef<HTMLDivElement>(null);
  const [leftPct, setLeftPct] = useState(DEFAULT_PCT);
  const [dragging, setDragging] = useState(false);

  // Restore the saved split after mount (avoids an SSR hydration mismatch).
  useEffect(() => {
    const saved = Number(localStorage.getItem(SPLIT_KEY));
    if (saved >= MIN_PCT && saved <= MAX_PCT) setLeftPct(saved);
  }, []);

  // Track the pointer globally while dragging so the gesture survives the
  // cursor moving over the PDF iframe (which lives in a separate document).
  useEffect(() => {
    if (!dragging) return;
    const onMove = (event: PointerEvent) => {
      const rect = splitRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      setLeftPct(clampPct(((event.clientX - rect.left) / rect.width) * 100));
    };
    const stop = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [dragging]);

  // Persist once the split settles (not on every drag frame).
  useEffect(() => {
    if (!dragging) localStorage.setItem(SPLIT_KEY, String(Math.round(leftPct)));
  }, [dragging, leftPct]);

  const nudge = (delta: number) => setLeftPct((p) => clampPct(p + delta));

  const load = useCallback(async () => {
    try {
      setJob(await getReviewJob(jobId));
    } catch {
      toast.error("Failed to load review.");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-text-secondary">Loading…</p>;
  if (!job) return <p className="text-text-secondary">Document not found.</p>;

  const pendingCount =
    (job.header?.status === "PENDING" ? 1 : 0) +
    job.claimGroups.reduce((sum, g) => sum + g.counts.pending, 0);
  const totalItems =
    (job.header ? 1 : 0) +
    job.claimGroups.reduce((sum, g) => sum + g.lineCount, 0);

  const approveAll = async () => {
    setBulk("approve");
    try {
      const result = await approveAllJob(job.id);
      toast.success(
        `Approved ${result.approved} item(s); matched ${result.matched} claim(s).`,
      );
      await load();
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Approve all failed.";
      toast.error(message);
    } finally {
      setBulk(null);
    }
  };

  const rejectAll = async () => {
    setBulk("reject");
    try {
      const result = await rejectAllJob(job.id);
      toast.success(`Rejected ${result.rejected} item(s).`);
      await load();
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Reject all failed.";
      toast.error(message);
    } finally {
      setBulk(null);
    }
  };

  const reopen = async () => {
    setBulk("reopen");
    try {
      const result = await reopenJob(job.id);
      toast.success(`Reopened — ${result.reopened} item(s) back to pending.`);
      await load();
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Reopen failed.";
      toast.error(message);
    } finally {
      setBulk(null);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/review"
        className="inline-flex items-center gap-1 type-body-compact-01 text-text-secondary transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:text-text-primary"
      >
        <ArrowLeft className="size-4" /> Back to review queue
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-mono type-heading-03 font-semibold text-text-primary">
              {job.fileName}
            </h1>
            <StatusBadge status={job.status} />
          </div>
          <p className="type-body-01 text-text-secondary">
            Uploaded {formatDateTime(job.createdAt)} · {pendingCount} pending of{" "}
            {totalItems}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {job.extractionCost && (
              <span className="inline-flex flex-wrap items-center gap-1.5 rounded-md border border-border-subtle bg-layer px-2 py-1 type-label-01 text-text-secondary">
                <Coins className="size-3.5 text-support-caution" />
                AI extraction cost:
                <span className="font-semibold tabular-nums text-text-primary">
                  {job.extractionCost.egp.toFixed(2)} EGP
                </span>
                <span className="tabular-nums text-text-helper">
                  (${job.extractionCost.usd.toFixed(4)})
                </span>
                <span className="tabular-nums text-text-helper">
                  · {job.extractionCost.inputTokens.toLocaleString()} in /{" "}
                  {job.extractionCost.outputTokens.toLocaleString()} out tokens
                </span>
              </span>
            )}
            {job.validationScore != null && (
              <ValidationBadge
                score={job.validationScore}
                flags={job.validationFlags ?? []}
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {job.status === "REJECTED" && can("review.approve") && (
            <Button
              variant="outline"
              disabled={bulk !== null}
              onClick={reopen}
            >
              {bulk === "reopen" ? "Reopening…" : "↩ Undo Reject All"}
            </Button>
          )}
          {pendingCount > 0 && (can("review.reject") || can("review.approve")) && (
            <div className="flex items-center gap-3">
              {/* Low-emphasis destructive action: a quiet ghost button that only
                  reddens on hover, kept apart from the primary CTA and behind a
                  confirmation step so it can't be fired by an errant click. */}
              {can("review.reject") && (
                <Button
                  variant="ghost"
                  disabled={bulk !== null}
                  onClick={() => setRejectConfirmOpen(true)}
                  className="text-text-secondary hover:bg-support-error-bg hover:text-support-error"
                >
                  {bulk === "reject" ? "Rejecting…" : "Reject all"}
                </Button>
              )}
              {can("review.reject") && can("review.approve") && (
                <span
                  aria-hidden
                  className="h-6 w-px bg-border-subtle"
                />
              )}
              {/* Primary CTA — the safe, expected action gets all the emphasis. */}
              {can("review.approve") && (
                <Button
                  variant="rose"
                  disabled={bulk !== null}
                  onClick={approveAll}
                >
                  {bulk === "approve"
                    ? "Approving…"
                    : `Approve All (${pendingCount})`}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: the document panel is hidden, so offer a quick open link. */}
      {file.url && (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 type-body-compact-01 font-medium text-link transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:text-link-hover lg:hidden"
        >
          <ExternalLink className="size-4" />
          View original file
        </a>
      )}

      <div
        ref={splitRef}
        className={cn("flex items-start", dragging && "select-none")}
      >
        {/* Left: original document — sticky so it stays visible while scrolling. */}
        <div
          className="sticky top-6 hidden shrink-0 lg:block"
          style={{ width: `${leftPct}%`, height: "calc(100vh - 3rem)" }}
        >
          <DocumentViewer
            fileName={job.fileName}
            fileMimeType={job.fileMimeType}
            file={file}
          />
        </div>

        {/* Drag handle — resizes the split; keyboard-operable with arrow keys. */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(leftPct)}
          aria-valuemin={MIN_PCT}
          aria-valuemax={MAX_PCT}
          aria-label="Resize document panel"
          tabIndex={0}
          title="Drag to resize"
          onPointerDown={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              nudge(-2);
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              nudge(2);
            }
          }}
          className="sticky top-6 hidden shrink-0 cursor-col-resize touch-none items-stretch px-2 outline-none lg:flex"
          style={{ height: "calc(100vh - 3rem)" }}
        >
          <div
            className={cn(
              "w-1 rounded-full transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)]",
              dragging
                ? "bg-border-interactive"
                : "bg-border-subtle hover:bg-border-interactive",
            )}
          />
        </div>

        {/* Right: the remittance header, then one card per weekly claim. */}
        <div className="min-w-0 flex-1 space-y-4">
          {job.header && <ReviewItemCard item={job.header} onChanged={load} />}
          {job.claimGroups.map((group) => (
            <ClaimGroupCard key={group.key} group={group} onChanged={load} />
          ))}
        </div>
      </div>

      {/* While dragging, this overlay sits above the iframe so it can't swallow
          the pointer stream (and shows the resize cursor everywhere). */}
      {dragging && <div className="fixed inset-0 z-50 cursor-col-resize" />}

      {/* Confirmation gate for the destructive bulk reject. */}
      <Dialog open={rejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reject all {pendingCount} pending item
              {pendingCount === 1 ? "" : "s"}?
            </DialogTitle>
            <DialogDescription>
              Every pending item in{" "}
              <span className="font-medium text-text-primary">
                {job.fileName}
              </span>{" "}
              will be rejected. Nothing is written to the ledger, and you can
              undo this afterwards with “Undo Reject All”.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setRejectConfirmOpen(false);
                rejectAll();
              }}
            >
              Reject all ({pendingCount})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
