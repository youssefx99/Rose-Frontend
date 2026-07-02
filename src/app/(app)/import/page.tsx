"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { FileSpreadsheet, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SlideOver } from "@/components/ui/slide-over";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { importClaims, type ImportRowStatus, type ImportSummary } from "@/lib/import";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const READ_COLUMNS = [
  "Payer",
  "State",
  "Date Billed",
  "Date of Service",
  "Client",
  "Charge",
];

const ROW_STYLE: Record<ImportRowStatus, string> = {
  created: "bg-support-success-bg text-support-success",
  skipped: "bg-support-warning-bg text-text-primary",
  error: "bg-support-error-bg text-support-error",
};
const ROW_LABEL: Record<ImportRowStatus, string> = {
  created: "Created",
  skipped: "Skipped",
  error: "Error",
};

function isXlsx(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".xlsm");
}

function fileSizeKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function errorMessage(error: unknown, fallback: string): string {
  return isAxiosError(error) && typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : fallback;
}

export default function ImportPage() {
  const { can } = useAuth();
  const canImport = can("claims.create");

  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const pick = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const candidate = Array.from(incoming)[0];
    if (!candidate) return;
    if (!isXlsx(candidate)) {
      toast.warning("Please choose an Excel .xlsx file.");
      return;
    }
    setFile(candidate);
  };

  const resetForm = () => {
    setFile(null);
    setDragging(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const result = await importClaims(file);
      setSummary(result);
      if (result.claimsCreated > 0) {
        toast.success(
          `Imported ${result.claimsCreated} claim${result.claimsCreated === 1 ? "" : "s"}` +
            `${result.skipped ? `, ${result.skipped} skipped` : ""}` +
            `${result.errors ? `, ${result.errors} failed` : ""}.`,
        );
      } else if (result.skipped > 0 && result.errors === 0) {
        toast.warning(`Nothing new — ${result.skipped} row(s) already existed.`);
      } else if (result.errors > 0) {
        toast.error(`No claims created — ${result.errors} row(s) had errors.`);
      } else {
        toast.warning("No data rows found in the sheet.");
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error(errorMessage(error, "Import failed."));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import"
        description="Bulk-seed payers, clients and claims from your Billing.xlsx — an alternative to entering claims one by one."
      >
        {canImport && (
          <Button onClick={() => setOpen(true)}>
            <UploadCloud className="size-4" />
            Import Sheet
          </Button>
        )}
      </PageHeader>

      {/* Main area: last result, or an empty state */}
      {summary ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="type-heading-03 text-text-primary">
              Last import
              <span className="ml-2 type-body-01 font-normal text-text-secondary">
                {summary.fileName}
              </span>
            </h2>
            {summary.claimsCreated > 0 && (
              <Link
                href="/claims"
                className="type-body-compact-01 font-medium text-link hover:text-link-hover"
              >
                View claims →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Rows" value={summary.rowsTotal} />
            <Stat label="Created" value={summary.claimsCreated} tone="success" />
            <Stat label="Skipped" value={summary.skipped} tone="warning" />
            <Stat label="Errors" value={summary.errors} tone="error" />
            <Stat label="New clients" value={summary.clientsCreated} />
            <Stat label="New payers" value={summary.payersCreated} />
          </div>

          <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Row</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Reference / note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.results.map((r) => (
                  <TableRow key={r.row}>
                    <TableCell className="font-mono tabular-nums text-text-secondary">
                      {r.row}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-block rounded-sm px-2 py-0.5 type-label-01 font-medium",
                          ROW_STYLE[r.status],
                        )}
                      >
                        {ROW_LABEL[r.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-text-primary">{r.client ?? "—"}</TableCell>
                    <TableCell className="text-text-secondary">{r.payer ?? "—"}</TableCell>
                    <TableCell className="type-code-01 text-text-secondary">
                      {r.status === "created" ? (
                        <span className="text-text-primary">{r.claimReference}</span>
                      ) : (
                        r.message ?? r.claimReference ?? "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-border-subtle bg-card">
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <FileSpreadsheet className="size-10 text-text-secondary" />
            <div className="space-y-1">
              <p className="type-heading-02 text-text-primary">No imports yet</p>
              <p className="type-body-01 text-text-secondary">
                Upload a Billing.xlsx to seed payers, clients and claims in one go.
              </p>
            </div>
            {canImport && (
              <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <UploadCloud className="size-4" />
                Import Sheet
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Import slide-over (same pattern as the PDF upload) */}
      <SlideOver
        open={open}
        onOpenChange={(next) => {
          if (importing) return;
          setOpen(next);
          if (!next) resetForm();
        }}
        title="Import from spreadsheet"
        description="Excel .xlsx · the first worksheet is read"
        size="wide"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button onClick={submit} disabled={!file || importing}>
              <UploadCloud className="size-4" />
              {importing ? "Importing…" : "Import claims"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Drop zone */}
          <label
            htmlFor="xlsx"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-6 py-12 text-center transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)]",
              dragging
                ? "border-border-interactive bg-highlight"
                : "border-border-strong bg-layer hover:bg-layer-hover",
            )}
          >
            <input
              id="xlsx"
              ref={fileRef}
              type="file"
              accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => pick(e.target.files)}
            />
            <FileSpreadsheet className="size-8 text-text-secondary" />
            <div>
              <p className="type-body-compact-01 font-medium text-text-primary">
                Click or drop an Excel .xlsx here
              </p>
              <p className="type-label-01 text-text-secondary">
                Billing sheet export — one file
              </p>
            </div>
          </label>

          {/* Selected file */}
          {file && (
            <div className="flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 type-body-compact-01">
              <FileSpreadsheet className="size-4 shrink-0 text-icon-secondary" />
              <span className="min-w-0 flex-1 truncate text-text-primary">{file.name}</span>
              <span className="shrink-0 font-mono type-label-01 tabular-nums text-text-helper">
                {fileSizeKb(file.size)}
              </span>
              {!importing && (
                <button
                  type="button"
                  aria-label="Remove file"
                  onClick={resetForm}
                  className="shrink-0 rounded-sm p-1 text-text-helper transition-colors hover:bg-layer-selected hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          )}

          {/* What gets read */}
          <div className="rounded-md border border-border-subtle bg-layer px-4 py-3">
            <p className="type-label-01 font-medium text-text-secondary">
              Columns read from the sheet
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {READ_COLUMNS.map((col) => (
                <span
                  key={col}
                  className="rounded-sm bg-layer-selected px-2 py-0.5 type-label-01 text-text-primary"
                >
                  {col}
                </span>
              ))}
            </div>
            <p className="mt-2 type-label-01 text-text-helper">
              Other columns are ignored. Re-running is safe — existing claims are skipped.
            </p>
          </div>

          {/* Progress */}
          {importing && (
            <div className="space-y-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-layer">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-interactive" />
              </div>
              <p className="type-label-01 text-text-secondary">
                Reading the sheet and creating records…
              </p>
            </div>
          )}
        </div>
      </SlideOver>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning" | "error";
}) {
  const toneClass =
    tone === "success"
      ? "text-support-success"
      : tone === "error"
        ? "text-support-error"
        : "text-text-primary";
  return (
    <div className="rounded-md border border-border-subtle bg-card px-4 py-3">
      <p className="type-label-01 text-text-secondary">{label}</p>
      <p className={cn("type-heading-03 font-semibold tabular-nums", toneClass)}>{value}</p>
    </div>
  );
}
