"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  approveAllJob,
  getReviewJob,
  type ReviewJobDetail,
} from "@/lib/documents";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { ReviewItemCard } from "./review-item-card";
import { DocumentViewer, useDocumentFile } from "./document-viewer";

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
  const [bulk, setBulk] = useState(false);

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

  if (loading) return <p className="text-zinc-500">Loading…</p>;
  if (!job) return <p className="text-zinc-500">Document not found.</p>;

  const pendingCount = job.reviewItems.filter(
    (i) => i.status === "PENDING",
  ).length;

  const approveAll = async () => {
    setBulk(true);
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
      setBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/review"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="size-4" /> Back to review queue
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-lg font-semibold text-zinc-950">
              {job.fileName}
            </h1>
            <StatusBadge status={job.status} />
          </div>
          <p className="text-sm text-zinc-500">
            {job.documentType.replace(/_/g, " ")} · uploaded{" "}
            {formatDateTime(job.createdAt)} · {pendingCount} pending of{" "}
            {job.reviewItems.length}
          </p>
        </div>
        {pendingCount > 0 && can("review.approve") && (
          <Button variant="rose" disabled={bulk} onClick={approveAll}>
            {bulk ? "Approving…" : `Approve All (${pendingCount})`}
          </Button>
        )}
      </div>

      {/* Mobile: the document panel is hidden, so offer a quick open link. */}
      {file.url && (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 transition-colors hover:text-rose-700 lg:hidden"
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
              "w-1 rounded-full transition-colors",
              dragging ? "bg-rose-400" : "bg-zinc-200 hover:bg-rose-400",
            )}
          />
        </div>

        {/* Right: existing review items. */}
        <div className="min-w-0 flex-1 space-y-4">
          {job.reviewItems.map((item) => (
            <ReviewItemCard key={item.id} item={item} onChanged={load} />
          ))}
        </div>
      </div>

      {/* While dragging, this overlay sits above the iframe so it can't swallow
          the pointer stream (and shows the resize cursor everywhere). */}
      {dragging && <div className="fixed inset-0 z-50 cursor-col-resize" />}
    </div>
  );
}
