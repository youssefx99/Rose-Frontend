"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { UploadCloud } from "lucide-react";

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
import { PdfPageSelector } from "@/components/pdf-page-selector";

const ACTIVE: IngestionJob["status"][] = ["QUEUED", "PROCESSING"];

function fileSizeMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function DocumentsPage() {
  const { can } = useAuth();
  const canUpload = can("documents.upload");
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>("EOB_GENERIC");
  const [uploading, setUploading] = useState(false);
  const [jobs, setJobs] = useState<IngestionJob[]>([]);

  // PDF page selection. selectedPages is 1-based; empty = whole document.
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfError, setPdfError] = useState(false);

  const pickFile = (next: File | null) => {
    setFile(next);
    setSelectedPages([]);
    setPdfPageCount(0);
    setPdfError(false);
  };

  // Only block submit when a multi-page PDF previewed fine but nothing is chosen.
  const noPagesChosen =
    !!file && !pdfError && pdfPageCount > 1 && selectedPages.length === 0;

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
    if (!file || noPagesChosen) return;
    setUploading(true);
    try {
      await uploadDocument(file, docType, selectedPages);
      toast.success("Uploaded — extraction queued.");
      pickFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Upload failed.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950">Documents</h1>
        <p className="text-sm text-zinc-500">
          Upload an EOB / remittance PDF. It is extracted in the background, then
          sent to the review queue.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload */}
        {canUpload && (
        <Card className="h-fit lg:col-span-1">
          <CardHeader>
            <CardTitle>New Upload</CardTitle>
            <CardDescription>PDF only · 20&nbsp;MB max.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              htmlFor="file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-100"
            >
              <input
                id="file"
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              <UploadCloud className="size-6 text-zinc-400" />
              {file ? (
                <div className="min-w-0">
                  <p className="max-w-[220px] truncate text-sm font-medium text-zinc-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {fileSizeMb(file.size)} · click to replace
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-zinc-700">
                    Click to choose a PDF
                  </p>
                  <p className="text-xs text-zinc-500">EOB or remittance</p>
                </div>
              )}
            </label>

            {file && (
              <PdfPageSelector
                file={file}
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

            {noPagesChosen && (
              <p className="text-xs text-red-600">
                Select at least 1 page to process.
              </p>
            )}

            <div className="space-y-2">
              <Label>Document Type</Label>
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

            <Button
              className="w-full"
              onClick={submit}
              disabled={!file || uploading || noPagesChosen}
            >
              <UploadCloud className="size-4" />
              {uploading ? "Uploading…" : "Upload & Extract"}
            </Button>
          </CardContent>
        </Card>
        )}

        {/* Recent uploads */}
        <div
          className={`space-y-3 ${canUpload ? "lg:col-span-2" : "lg:col-span-3"}`}
        >
          <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Recent Uploads
          </h2>
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
