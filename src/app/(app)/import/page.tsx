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
import { useFormat } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const READ_COLUMN_KEYS = [
  "import.columns.payer",
  "import.columns.state",
  "import.columns.dateBilled",
  "import.columns.dateOfService",
  "import.columns.client",
  "import.columns.charge",
];

const ROW_STYLE: Record<ImportRowStatus, string> = {
  created: "bg-support-success-bg text-support-success",
  skipped: "bg-support-warning-bg text-text-primary",
  error: "bg-support-error-bg text-support-error",
};
const ROW_LABEL_KEY: Record<ImportRowStatus, string> = {
  created: "import.rowStatus.created",
  skipped: "import.rowStatus.skipped",
  error: "import.rowStatus.error",
};
// The backend reports row failures as English prose; map the known messages to
// keys and fall back to the raw message for anything it adds later.
const ROW_ERROR_KEY: Record<string, string> = {
  "Missing Payer.": "import.rowError.missingPayer",
  "Missing or invalid Client.": "import.rowError.invalidClient",
  "Invalid Date Billed.": "import.rowError.invalidDateBilled",
  "Invalid Date of Service.": "import.rowError.invalidDateOfService",
  "Invalid Charge.": "import.rowError.invalidCharge",
  "Could not save this row.": "import.rowError.saveFailed",
};

function isXlsx(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".xlsm");
}

function errorMessage(error: unknown, fallback: string): string {
  return isAxiosError(error) && typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : fallback;
}

export default function ImportPage() {
  const t = useT();
  const { formatNumber } = useFormat();
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
      toast.warning(t("import.toast.notXlsx"));
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
          t("import.toast.importedClaims", { count: result.claimsCreated }) +
            (result.skipped ? ` ${t("import.toast.skippedRows", { count: result.skipped })}` : "") +
            (result.errors ? ` ${t("import.toast.failedRows", { count: result.errors })}` : ""),
        );
      } else if (result.skipped > 0 && result.errors === 0) {
        toast.warning(t("import.toast.nothingNew", { count: result.skipped }));
      } else if (result.errors > 0) {
        toast.error(t("import.toast.noneCreated", { count: result.errors }));
      } else {
        toast.warning(t("import.toast.noRows"));
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error(errorMessage(error, t("import.toast.importFailed")));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("import.title")} description={t("import.description")}>
        {canImport && (
          <Button onClick={() => setOpen(true)}>
            <UploadCloud className="size-4" />
            {t("import.importSheet")}
          </Button>
        )}
      </PageHeader>

      {/* Main area: last result, or an empty state */}
      {summary ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="type-heading-03 text-text-primary">
              {t("import.lastImport")}
              <span className="ms-2 type-body-01 font-normal text-text-secondary">
                {summary.fileName}
              </span>
            </h2>
            {summary.claimsCreated > 0 && (
              <Link
                href="/claims"
                className="type-body-compact-01 font-medium text-link hover:text-link-hover"
              >
                {t("import.viewClaims")}
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label={t("import.stat.rows")} value={summary.rowsTotal} />
            <Stat label={t("import.stat.created")} value={summary.claimsCreated} tone="success" />
            <Stat label={t("import.stat.skipped")} value={summary.skipped} tone="warning" />
            <Stat label={t("import.stat.errors")} value={summary.errors} tone="error" />
            <Stat label={t("import.stat.newClients")} value={summary.clientsCreated} />
            <Stat label={t("import.stat.newPayers")} value={summary.payersCreated} />
          </div>

          <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{t("import.table.row")}</TableHead>
                  <TableHead className="w-28">{t("common.status")}</TableHead>
                  <TableHead>{t("import.table.client")}</TableHead>
                  <TableHead>{t("import.table.payer")}</TableHead>
                  <TableHead>{t("import.table.reference")}</TableHead>
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
                        {t(ROW_LABEL_KEY[r.status])}
                      </span>
                    </TableCell>
                    <TableCell className="text-text-primary">
                      {r.client ?? t("common.emDash")}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {r.payer ?? t("common.emDash")}
                    </TableCell>
                    <TableCell className="type-code-01 text-text-secondary">
                      {r.status === "created" ? (
                        <span className="text-text-primary">{r.claimReference}</span>
                      ) : r.status === "skipped" ? (
                        t("import.rowStatus.skippedNote")
                      ) : r.message && ROW_ERROR_KEY[r.message] ? (
                        t(ROW_ERROR_KEY[r.message])
                      ) : (
                        r.message ?? r.claimReference ?? t("common.emDash")
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
              <p className="type-heading-02 text-text-primary">{t("import.empty.title")}</p>
              <p className="type-body-01 text-text-secondary">{t("import.empty.description")}</p>
            </div>
            {canImport && (
              <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <UploadCloud className="size-4" />
                {t("import.importSheet")}
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
        title={t("import.slideOver.title")}
        description={t("import.slideOver.description")}
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
              {t("common.cancel")}
            </Button>
            <Button onClick={submit} disabled={!file || importing}>
              <UploadCloud className="size-4" />
              {importing ? t("import.importing") : t("import.importClaims")}
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
                {t("import.dropzone.title")}
              </p>
              <p className="type-label-01 text-text-secondary">{t("import.dropzone.hint")}</p>
            </div>
          </label>

          {/* Selected file */}
          {file && (
            <div className="flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 type-body-compact-01">
              <FileSpreadsheet className="size-4 shrink-0 text-icon-secondary" />
              <span className="min-w-0 flex-1 truncate text-text-primary">{file.name}</span>
              <span className="shrink-0 font-mono type-label-01 tabular-nums text-text-helper">
                {t("import.file.sizeKb", { size: formatNumber(Math.round(file.size / 1024)) })}
              </span>
              {!importing && (
                <button
                  type="button"
                  aria-label={t("import.aria.removeFile")}
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
              {t("import.columns.title")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {READ_COLUMN_KEYS.map((col) => (
                <span
                  key={col}
                  className="rounded-sm bg-layer-selected px-2 py-0.5 type-label-01 text-text-primary"
                >
                  {t(col)}
                </span>
              ))}
            </div>
            <p className="mt-2 type-label-01 text-text-helper">{t("import.columns.note")}</p>
          </div>

          {/* Progress */}
          {importing && (
            <div className="space-y-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-layer">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-interactive" />
              </div>
              <p className="type-label-01 text-text-secondary">{t("import.progress.label")}</p>
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
  const { formatNumber } = useFormat();
  const toneClass =
    tone === "success"
      ? "text-support-success"
      : tone === "error"
        ? "text-support-error"
        : "text-text-primary";
  return (
    <div className="rounded-md border border-border-subtle bg-card px-4 py-3">
      <p className="type-label-01 text-text-secondary">{label}</p>
      <p className={cn("type-heading-03 font-semibold tabular-nums", toneClass)}>
        {formatNumber(value)}
      </p>
    </div>
  );
}
