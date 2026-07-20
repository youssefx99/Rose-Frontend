"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Eye, Trash2, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SlideOver } from "@/components/ui/slide-over";
import { CascadeDeleteDialog } from "@/components/ui/cascade-delete-dialog";
import { DocumentViewer, useDocumentFile } from "@/components/document-viewer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listJobs,
  uploadDocument,
  type IngestionJob,
} from "@/lib/documents";
import { useFormat } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { PdfPageSelector } from "@/components/pdf-page-selector";

const ACTIVE: IngestionJob["status"][] = ["QUEUED", "PROCESSING", "VALIDATING"];

const PIPELINE_STAGES: { labelKey: string; statuses: IngestionJob["status"][] }[] = [
  { labelKey: "documents.pipeline.upload",   statuses: ["QUEUED"] },
  { labelKey: "documents.pipeline.extract",  statuses: ["PROCESSING", "EXTRACTED"] },
  { labelKey: "documents.pipeline.validate", statuses: ["VALIDATING"] },
  { labelKey: "documents.pipeline.review",   statuses: ["IN_REVIEW"] },
  { labelKey: "documents.pipeline.done",     statuses: ["APPROVED", "REJECTED", "FAILED"] },
];

function pipelineStage(status: IngestionJob["status"]): number {
  return PIPELINE_STAGES.findIndex((s) => s.statuses.includes(status));
}

function PipelineDots({ status }: { status: IngestionJob["status"] }) {
  const t = useT("documents");
  const current = pipelineStage(status);
  const isActive = ACTIVE.includes(status);
  return (
    <span className="flex items-center gap-1" aria-label={t("documents.pipeline.aria", { status: t(`status.${status}`) })}>
      {PIPELINE_STAGES.map((stage, i) => {
        const done = i < current;
        const active = i === current && isActive;
        const here = i === current;
        return (
          <span
            key={stage.labelKey}
            title={t(stage.labelKey)}
            className={cn(
              "size-2 rounded-full transition-colors",
              done ? "bg-support-success"
                : here && status === "FAILED" ? "bg-support-error"
                : here && (status === "APPROVED" || status === "REJECTED") ? "bg-support-success"
                : active ? "animate-pulse bg-interactive"
                : here ? "bg-interactive"
                : "bg-layer-selected",
            )}
          />
        );
      })}
    </span>
  );
}

type UploadOutcome = "uploaded" | "duplicate" | "failed";
interface FileResult {
  key: string;
  status: UploadOutcome;
  message?: string;
}

const RESULT_STYLE: Record<UploadOutcome, string> = {
  uploaded: "bg-support-success-bg text-support-success",
  duplicate: "bg-support-warning-bg text-text-primary",
  failed: "bg-support-error-bg text-support-error",
};
const RESULT_LABEL_KEY: Record<UploadOutcome, string> = {
  uploaded: "status.QUEUED",
  duplicate: "documents.upload.duplicate",
  failed: "status.FAILED",
};

function fileSizeMb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2);
}

function fileKey(file: File): string {
  return `${file.name}__${file.size}__${file.lastModified}`;
}

function isPdf(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function errorMessage(error: unknown, fallback: string): string {
  return isAxiosError(error) && typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : fallback;
}

/** Authenticated PDF preview — fetches the file as a blob so the in-memory
 *  access token is sent (a raw <iframe src> can't, and 401s). */
function DocumentPreview({ jobId, fileName }: { jobId: string; fileName: string }) {
  const file = useDocumentFile(jobId);
  return (
    <div className="h-[78vh]">
      <DocumentViewer fileName={fileName} fileMimeType="application/pdf" file={file} />
    </div>
  );
}

export default function DocumentsPage() {
  const t = useT("documents");
  const { formatDateTime, formatNumber } = useFormat();
  const { can } = useAuth();
  const canUpload = can("documents.upload");

  // Upload slide-over
  const [uploadOpen, setUploadOpen] = useState(false);

  // Preview + delete
  const [previewJob, setPreviewJob] = useState<{ id: string; fileName: string } | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [results, setResults] = useState<FileResult[]>([]);
  const [dragging, setDragging] = useState(false);
  const [jobs, setJobs] = useState<IngestionJob[]>([]);

  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfError, setPdfError] = useState(false);

  const resetPageState = () => {
    setSelectedPages([]);
    setPdfPageCount(0);
    setPdfError(false);
  };

  const resetUploadForm = () => {
    setFiles([]);
    setResults([]);
    resetPageState();
    setAllowDuplicate(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const addFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const picked = Array.from(incoming);
    const pdfs = picked.filter(isPdf);
    if (pdfs.length < picked.length) {
      toast.warning(t("documents.toast.pdfOnly"));
    }
    setResults([]);
    resetPageState();
    setFiles((prev) => {
      const seen = new Set(prev.map(fileKey));
      const merged = [...prev];
      for (const f of pdfs) {
        if (!seen.has(fileKey(f))) {
          seen.add(fileKey(f));
          merged.push(f);
        }
      }
      return merged;
    });
  };

  const removeFile = (key: string) => {
    setResults([]);
    resetPageState();
    setFiles((prev) => prev.filter((f) => fileKey(f) !== key));
  };

  const clearAll = () => {
    setFiles([]);
    setResults([]);
    resetPageState();
    if (fileRef.current) fileRef.current.value = "";
  };

  const noPagesChosen =
    files.length === 1 &&
    !pdfError &&
    pdfPageCount > 1 &&
    selectedPages.length === 0;

  const load = useCallback(async () => {
    try {
      const { data } = await listJobs();
      setJobs(data);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!jobs.some((j) => ACTIVE.includes(j.status))) return;
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, [jobs, load]);

  const submit = async () => {
    if (files.length === 0 || noPagesChosen) return;
    setUploading(true);
    const single = files.length === 1;
    const out: FileResult[] = [];

    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length });
      const file = files[i];
      try {
        await uploadDocument(file, single ? selectedPages : [], allowDuplicate);
        out.push({ key: fileKey(file), status: "uploaded" });
      } catch (error) {
        const isDuplicate =
          isAxiosError(error) &&
          error.response?.status === 409 &&
          (error.response.data as { code?: string })?.code === "DUPLICATE_FILE";
        out.push({
          key: fileKey(file),
          status: isDuplicate ? "duplicate" : "failed",
          message: errorMessage(error, t("documents.toast.uploadError")),
        });
      }
    }

    setProgress(null);
    setUploading(false);
    setResults(out);

    const counts = {
      uploaded: out.filter((r) => r.status === "uploaded").length,
      duplicate: out.filter((r) => r.status === "duplicate").length,
      failed: out.filter((r) => r.status === "failed").length,
    };

    if (counts.uploaded) {
      const extra = [
        counts.duplicate ? t("documents.count.duplicate", { count: counts.duplicate }) : "",
        counts.failed ? t("documents.count.failed", { count: counts.failed }) : "",
      ]
        .filter(Boolean)
        .join(t("documents.listSeparator"));
      toast.success(
        t("documents.toast.queued", {
          count: counts.uploaded,
          extra: extra ? ` (${extra})` : "",
        }),
      );
    } else if (counts.duplicate && !counts.failed) {
      toast.warning(
        t("documents.toast.duplicateSkipped", { count: counts.duplicate }) +
          (allowDuplicate ? "" : t("documents.toast.duplicateHint")),
      );
    } else if (counts.failed) {
      toast.error(t("documents.toast.uploadFailed", { count: counts.failed }));
    }

    const queued = new Set(
      out.filter((r) => r.status === "uploaded").map((r) => r.key),
    );
    setFiles((prev) => prev.filter((f) => !queued.has(fileKey(f))));
    if (queued.size > 0 && fileRef.current) fileRef.current.value = "";

    await load();

    // Close the panel when all files uploaded successfully
    if (queued.size > 0 && counts.duplicate === 0 && counts.failed === 0) {
      setUploadOpen(false);
      resetUploadForm();
    }
  };

  const resultFor = (file: File): FileResult | undefined =>
    results.find((r) => r.key === fileKey(file));

  const summary = (() => {
    if (results.length === 0) return null;
    const parts: string[] = [];
    const c = {
      uploaded: results.filter((r) => r.status === "uploaded").length,
      duplicate: results.filter((r) => r.status === "duplicate").length,
      failed: results.filter((r) => r.status === "failed").length,
    };
    if (c.uploaded) parts.push(t("documents.count.queued", { count: c.uploaded }));
    if (c.duplicate) parts.push(t("documents.count.duplicate", { count: c.duplicate }));
    if (c.failed) parts.push(t("documents.count.failed", { count: c.failed }));
    return parts.join(" · ");
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      >
        {canUpload && (
          <Button onClick={() => setUploadOpen(true)}>
            <UploadCloud className="size-4" />
            {t("newUpload")}
          </Button>
        )}
      </PageHeader>

      {/* Full-width table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="type-heading-03 text-text-primary">{t("recentUploads")}</h2>
          {jobs.some((j) => ACTIVE.includes(j.status)) && (
            <span className="flex items-center gap-1.5 rounded-full border border-support-info bg-support-info-bg px-2.5 py-0.5 type-label-01 font-medium text-support-info">
              <span className="size-1.5 animate-pulse rounded-full bg-support-info" />
              {t("live")}
            </span>
          )}
        </div>
        <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("documents.table.file")}</TableHead>
                <TableHead>{t("documents.table.uploaded")}</TableHead>
                <TableHead className="text-end">{t("documents.table.items")}</TableHead>
                <TableHead>{t("documents.table.pipeline")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <UploadCloud className="size-10 text-text-secondary" />
                      <div className="space-y-1">
                        <p className="type-heading-02 text-text-primary">{t("documents.empty.title")}</p>
                        <p className="type-body-01 text-text-secondary">
                          {t("documents.empty.hintBefore")}<span className="font-medium">{t("newUpload")}</span>{t("documents.empty.hintAfter")}
                        </p>
                      </div>
                      {canUpload && (
                        <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
                          <UploadCloud className="size-4" />
                          {t("newUpload")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="max-w-[280px] truncate type-code-01 text-text-primary">
                      {job.fileName}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {formatDateTime(job.createdAt)}
                    </TableCell>
                    <TableCell className="text-end font-mono tabular-nums text-text-primary">
                      {formatNumber(job._count?.reviewItems ?? 0)}
                    </TableCell>
                    <TableCell>
                      <PipelineDots status={job.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-2">
                        {(job.status === "IN_REVIEW" || job.status === "APPROVED" || job.status === "REJECTED") && (
                          <Link
                            href={`/review/${job.id}`}
                            className="type-body-compact-01 font-medium text-link hover:text-link-hover"
                          >
                            {job.status === "IN_REVIEW" ? t("documents.row.review") : t("documents.row.view")}
                          </Link>
                        )}
                        {job.status === "FAILED" && job.errorMessage && (
                          <span title={job.errorMessage} className="type-label-01 text-support-error">
                            {t("status.FAILED")}
                          </span>
                        )}
                        <button
                          type="button"
                          title={t("preview")}
                          onClick={() => setPreviewJob({ id: job.id, fileName: job.fileName })}
                          className="rounded-sm p-1 text-icon-secondary transition-colors hover:bg-layer-hover hover:text-icon-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        >
                          <Eye className="size-4" />
                        </button>
                        {can("documents.delete") && (
                          <button
                            type="button"
                            title={t("common.delete")}
                            onClick={() => setDeleteJobId(job.id)}
                            className="rounded-sm p-1 text-icon-secondary transition-colors hover:bg-support-error-bg hover:text-support-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Preview slide-over */}
      <SlideOver
        open={!!previewJob}
        onOpenChange={(open) => { if (!open) setPreviewJob(null); }}
        title={previewJob?.fileName ?? t("preview")}
        size="wide"
      >
        {previewJob && (
          <DocumentPreview jobId={previewJob.id} fileName={previewJob.fileName} />
        )}
      </SlideOver>

      {/* Delete confirmation */}
      <CascadeDeleteDialog
        open={!!deleteJobId}
        onOpenChange={(open) => { if (!open) setDeleteJobId(null); }}
        type="document"
        id={deleteJobId}
        title={t("deleteTitle")}
        onDone={() => { setDeleteJobId(null); load(); }}
      />

      {/* Upload slide-over */}
      <SlideOver
        open={uploadOpen}
        onOpenChange={(open) => {
          if (!uploading) {
            setUploadOpen(open);
            if (!open) resetUploadForm();
          }
        }}
        title={t("newUpload")}
        description={t("documents.upload.description")}
        size="wide"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setUploadOpen(false);
                resetUploadForm();
              }}
              disabled={uploading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={submit}
              disabled={files.length === 0 || uploading || noPagesChosen}
            >
              <UploadCloud className="size-4" />
              {uploading
                ? t("common.uploading")
                : files.length > 1
                  ? t("documents.upload.submitMany", { count: files.length })
                  : t("documents.upload.submit")}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Drop zone */}
          <label
            htmlFor="file"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-6 py-12 text-center transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)]",
              dragging
                ? "border-border-interactive bg-highlight"
                : "border-border-strong bg-layer hover:bg-layer-hover",
            )}
          >
            <input
              id="file"
              ref={fileRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <UploadCloud className="size-8 text-text-secondary" />
            <div>
              <p className="type-body-compact-01 font-medium text-text-primary">
                {t("documents.upload.dropTitle")}
              </p>
              <p className="type-label-01 text-text-secondary">
                {t("documents.upload.dropHint")}
              </p>
            </div>
          </label>

          {/* Selected files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="type-label-01 font-medium text-text-secondary">
                  {t("documents.upload.selectedCount", { count: files.length })}
                </p>
                {!uploading && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="type-label-01 text-text-secondary transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                  >
                    {t("common.clearAll")}
                  </button>
                )}
              </div>
              <ul className="max-h-52 space-y-1 overflow-y-auto rounded-md border border-border-subtle p-1">
                {files.map((f) => {
                  const r = resultFor(f);
                  return (
                    <li
                      key={fileKey(f)}
                      className="flex items-center gap-2 rounded-sm px-2 py-1.5 type-body-compact-01 hover:bg-layer-hover"
                    >
                      <span className="min-w-0 flex-1 truncate text-text-primary">
                        {f.name}
                      </span>
                      {r ? (
                        <span
                          title={r.message}
                          className={cn(
                            "shrink-0 rounded-sm px-2 py-0.5 type-label-01 font-medium",
                            RESULT_STYLE[r.status],
                          )}
                        >
                          {t(RESULT_LABEL_KEY[r.status])}
                        </span>
                      ) : (
                        <span className="shrink-0 font-mono type-label-01 tabular-nums text-text-helper">
                          {t("documents.upload.fileSizeMb", { size: fileSizeMb(f.size) })}
                        </span>
                      )}
                      {!uploading && (
                        <button
                          type="button"
                          aria-label={t("documents.upload.removeFile", { name: f.name })}
                          onClick={() => removeFile(fileKey(f))}
                          className="shrink-0 rounded-sm p-1 text-text-helper transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:bg-layer-selected hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Page picker — single file only */}
          {files.length === 1 && (
            <PdfPageSelector
              file={files[0]}
              selectedPages={selectedPages}
              onChange={setSelectedPages}
              onLoaded={(count) => {
                setPdfPageCount(count);
                setSelectedPages(Array.from({ length: count }, (_, i) => i + 1));
              }}
              onError={() => {
                setPdfError(true);
                setSelectedPages([]);
              }}
            />
          )}
          {files.length > 1 && (
            <p className="type-label-01 text-text-secondary">
              {t("documents.upload.allPagesNote")}
            </p>
          )}
          {noPagesChosen && (
            <p className="type-label-01 text-support-error">
              {t("documents.upload.noPagesChosen")}
            </p>
          )}

          {/* Allow duplicate */}
          <label className="flex cursor-pointer items-center gap-2 type-label-01 text-text-secondary">
            <input
              type="checkbox"
              checked={allowDuplicate}
              onChange={(e) => setAllowDuplicate(e.target.checked)}
              className="size-4 rounded-sm border-border-strong accent-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            />
            {t("documents.upload.allowDuplicate")}
          </label>

          {/* Progress */}
          {uploading && progress && (
            <div className="space-y-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-layer">
                <div
                  className="h-full rounded-full bg-interactive transition-[width] duration-[var(--dur-moderate-02)] ease-[var(--ease-standard)]"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="type-label-01 text-text-secondary">
                {t("documents.upload.progress", { current: progress.current, total: progress.total })}
              </p>
            </div>
          )}

          {/* Summary */}
          {summary && !uploading && (
            <p className="rounded-md border border-border-subtle bg-layer px-3 py-2 type-label-01 text-text-secondary">
              {summary}
            </p>
          )}
        </div>
      </SlideOver>
    </div>
  );
}
