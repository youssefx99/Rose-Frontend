"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DOCUMENT_TYPES,
  listJobs,
  uploadDocument,
  type DocumentType,
  type IngestionJob,
} from "@/lib/documents";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { PdfPageSelector } from "@/components/pdf-page-selector";

const ACTIVE: IngestionJob["status"][] = ["QUEUED", "PROCESSING"];

type UploadOutcome = "uploaded" | "duplicate" | "failed";
interface FileResult {
  key: string;
  status: UploadOutcome;
  message?: string;
}

const RESULT_STYLE: Record<UploadOutcome, string> = {
  uploaded: "bg-green-100 text-green-700",
  duplicate: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};
const RESULT_LABEL: Record<UploadOutcome, string> = {
  uploaded: "Queued",
  duplicate: "Duplicate",
  failed: "Failed",
};

function fileSizeMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Stable identity for a picked file (dedupes accidental re-selection). */
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

export default function DocumentsPage() {
  const { can } = useAuth();
  const canUpload = can("documents.upload");
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [docType, setDocType] = useState<DocumentType>("EOB_GENERIC");
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [results, setResults] = useState<FileResult[]>([]);
  const [dragging, setDragging] = useState(false);
  const [jobs, setJobs] = useState<IngestionJob[]>([]);

  // PDF page selection — only used when a SINGLE file is selected. 1-based.
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfError, setPdfError] = useState(false);

  // Reset the single-file page state (the "one file" may have changed).
  const resetPageState = () => {
    setSelectedPages([]);
    setPdfPageCount(0);
    setPdfError(false);
  };

  const addFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const picked = Array.from(incoming);
    const pdfs = picked.filter(isPdf);
    if (pdfs.length < picked.length) {
      toast.warning("Only PDF files are supported — others were skipped.");
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

  // Single-file precise mode: block submit if a multi-page PDF has no pages chosen.
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

  // Poll while any job is still queued/processing.
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
        // Per-file page selection only in single mode; whole document otherwise.
        await uploadDocument(file, docType, single ? selectedPages : [], allowDuplicate);
        out.push({ key: fileKey(file), status: "uploaded" });
      } catch (error) {
        const isDuplicate =
          isAxiosError(error) &&
          error.response?.status === 409 &&
          (error.response.data as { code?: string })?.code === "DUPLICATE_FILE";
        out.push({
          key: fileKey(file),
          status: isDuplicate ? "duplicate" : "failed",
          message: errorMessage(error, "Upload failed."),
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
        counts.duplicate ? `${counts.duplicate} duplicate` : "",
        counts.failed ? `${counts.failed} failed` : "",
      ]
        .filter(Boolean)
        .join(", ");
      toast.success(
        `Queued ${counts.uploaded} file${counts.uploaded === 1 ? "" : "s"} for extraction${extra ? ` (${extra})` : ""}.`,
      );
    } else if (counts.duplicate && !counts.failed) {
      toast.warning(
        `Already uploaded — ${counts.duplicate} file${counts.duplicate === 1 ? "" : "s"} skipped.` +
          (allowDuplicate ? "" : " Tick “upload even if duplicate” to force."),
      );
    } else if (counts.failed) {
      toast.error(`${counts.failed} file${counts.failed === 1 ? "" : "s"} failed to upload.`);
    }

    // Keep only the files that didn't go through, so duplicates/failures can be retried.
    const queued = new Set(
      out.filter((r) => r.status === "uploaded").map((r) => r.key),
    );
    setFiles((prev) => prev.filter((f) => !queued.has(fileKey(f))));
    if (queued.size > 0 && fileRef.current) fileRef.current.value = "";
    await load();
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
    if (c.uploaded) parts.push(`${c.uploaded} queued`);
    if (c.duplicate) parts.push(`${c.duplicate} duplicate`);
    if (c.failed) parts.push(`${c.failed} failed`);
    return parts.join(" · ");
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Documents
        </h1>
        <p className="text-sm text-zinc-500">
          Upload EOB / remittance PDFs — one or many. They are extracted in the
          background, then sent to the review queue.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload */}
        {canUpload && (
          <Card className="h-fit lg:col-span-1">
            <CardHeader>
              <CardTitle>New Upload</CardTitle>
              <CardDescription>
                PDF only · up to 20&nbsp;MB each · multiple files OK.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
                  dragging
                    ? "border-rose-400 bg-rose-50/60"
                    : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100",
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
                <UploadCloud className="size-6 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-700">
                    Click or drop PDFs here
                  </p>
                  <p className="text-xs text-zinc-500">
                    One or many — EOBs / remittances
                  </p>
                </div>
              </label>

              {/* Selected files */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-600">
                      {files.length} file{files.length === 1 ? "" : "s"} selected
                    </p>
                    {!uploading && (
                      <button
                        type="button"
                        onClick={clearAll}
                        className="text-xs text-zinc-500 transition-colors hover:text-zinc-900"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <ul className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-zinc-200 p-1.5">
                    {files.map((f) => {
                      const r = resultFor(f);
                      return (
                        <li
                          key={fileKey(f)}
                          className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-zinc-50"
                        >
                          <span className="min-w-0 flex-1 truncate text-zinc-700">
                            {f.name}
                          </span>
                          {r ? (
                            <span
                              title={r.message}
                              className={cn(
                                "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                                RESULT_STYLE[r.status],
                              )}
                            >
                              {RESULT_LABEL[r.status]}
                            </span>
                          ) : (
                            <span className="shrink-0 font-mono text-xs text-zinc-400">
                              {fileSizeMb(f.size)}
                            </span>
                          )}
                          {!uploading && (
                            <button
                              type="button"
                              aria-label={`Remove ${f.name}`}
                              onClick={() => removeFile(fileKey(f))}
                              className="shrink-0 rounded p-0.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
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
                    setSelectedPages(
                      Array.from({ length: count }, (_, i) => i + 1),
                    );
                  }}
                  onError={() => {
                    setPdfError(true);
                    setSelectedPages([]);
                  }}
                />
              )}
              {files.length > 1 && (
                <p className="text-xs text-zinc-500">
                  All pages of each file will be processed. To pick specific
                  pages, upload that file on its own.
                </p>
              )}
              {noPagesChosen && (
                <p className="text-xs text-red-600">
                  Select at least 1 page to process.
                </p>
              )}

              <div className="space-y-2">
                <Label>
                  Document Type
                  {files.length > 1 && (
                    <span className="ml-1 text-xs font-normal text-zinc-400">
                      (applies to all)
                    </span>
                  )}
                </Label>
                <Select
                  value={docType}
                  onValueChange={(v) => setDocType(v as DocumentType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600">
                <input
                  type="checkbox"
                  checked={allowDuplicate}
                  onChange={(e) => setAllowDuplicate(e.target.checked)}
                  className="size-3.5 rounded border-zinc-300 text-rose-500 focus:ring-rose-400"
                />
                Upload even if a file was already uploaded
              </label>

              {uploading && progress && (
                <div className="space-y-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-[width] duration-200"
                      style={{
                        width: `${(progress.current / progress.total) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">
                    Uploading {progress.current} of {progress.total}…
                  </p>
                </div>
              )}

              {summary && !uploading && (
                <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                  {summary}
                </p>
              )}

              <Button
                className="w-full"
                onClick={() => submit()}
                disabled={files.length === 0 || uploading || noPagesChosen}
              >
                <UploadCloud className="size-4" />
                {uploading
                  ? "Uploading…"
                  : files.length > 1
                    ? `Upload ${files.length} files & Extract`
                    : "Upload & Extract"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent uploads */}
        <div
          className={`space-y-3 ${canUpload ? "lg:col-span-2" : "lg:col-span-3"}`}
        >
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50">
                  <TableHead>File</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-zinc-500"
                    >
                      No uploads yet. Choose a PDF to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="max-w-[220px] truncate font-mono text-xs text-zinc-700">
                        {job.fileName}
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {job.documentType.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {formatDateTime(job.createdAt)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-zinc-700">
                        {job._count?.reviewItems ?? 0}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {job.status === "IN_REVIEW" && (
                          <Link
                            href={`/review/${job.id}`}
                            className="text-sm font-medium text-rose-600 hover:text-rose-700"
                          >
                            Review →
                          </Link>
                        )}
                        {job.status === "FAILED" && job.errorMessage && (
                          <span
                            title={job.errorMessage}
                            className="text-xs text-red-600"
                          >
                            Failed
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
