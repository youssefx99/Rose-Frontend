"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

interface PdfPageSelectorProps {
  file: File;
  selectedPages: number[];
  onChange: (pages: number[]) => void;
  /** Fired once the PDF is parsed, with its total page count. */
  onLoaded?: (pageCount: number) => void;
  /** Fired when the PDF can't be previewed in the browser. */
  onError?: () => void;
}

interface PageThumbnail {
  pageNumber: number;
  dataUrl: string;
}

// Thumbnails render small; 0.3 keeps them crisp at ~160px without heavy work.
const THUMBNAIL_SCALE = 0.3;

export function PdfPageSelector({
  file,
  selectedPages,
  onChange,
  onLoaded,
  onError,
}: PdfPageSelectorProps) {
  const t = useT();
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Hold callbacks in refs so the render effect only re-runs when the file
  // changes (not when the parent re-creates inline callbacks).
  const onLoadedRef = useRef(onLoaded);
  const onErrorRef = useRef(onError);
  onLoadedRef.current = onLoaded;
  onErrorRef.current = onError;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setThumbnails([]);
    setPageCount(0);

    (async () => {
      try {
        // Imported lazily (and only in the browser) — pdfjs touches DOM APIs.
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const data = new Uint8Array(await file.arrayBuffer());
        const pdf = await pdfjs.getDocument({ data }).promise;
        if (!active) return;

        setPageCount(pdf.numPages);
        onLoadedRef.current?.(pdf.numPages);

        const rendered: PageThumbnail[] = [];
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const viewport = page.getViewport({ scale: THUMBNAIL_SCALE });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvas, viewport }).promise;
          if (!active) return;
          rendered.push({ pageNumber: n, dataUrl: canvas.toDataURL() });
          setThumbnails([...rendered]); // progressive reveal as pages finish
        }
      } catch {
        if (!active) return;
        setError(true);
        onErrorRef.current?.();
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [file]);

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-support-warning bg-support-warning-bg px-3 py-2.5 type-label-01 text-text-primary">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-support-warning" />
        <span>{t("ui.pdfPages.previewFailed")}</span>
      </div>
    );
  }

  // Single-page PDFs have nothing to choose — the parent auto-selects page 1.
  if (!loading && pageCount <= 1) return null;

  const toggle = (pageNumber: number) => {
    onChange(
      selectedPages.includes(pageNumber)
        ? selectedPages.filter((p) => p !== pageNumber)
        : [...selectedPages, pageNumber].sort((a, b) => a - b),
    );
  };

  const allPages = thumbnails.map((t) => t.pageNumber);

  return (
    <div className="space-y-3">
      <div>
        <p className="type-heading-compact-01 text-text-primary">
          {t("ui.pdfPages.title")}
        </p>
        <p className="type-label-01 text-text-secondary">
          {t("ui.pdfPages.hint")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-text-primary"
          disabled={loading}
          onClick={() => onChange(allPages)}
        >
          {t("common.selectAll")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-text-secondary"
          disabled={loading}
          onClick={() => onChange([])}
        >
          {t("common.deselectAll")}
        </Button>

      </div>

      {loading && thumbnails.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-md border border-border-subtle bg-layer py-10 type-body-compact-01 text-text-secondary">
          <Loader2 className="size-4 animate-spin" />
          {t("ui.pdfPages.rendering")}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {thumbnails.map(({ pageNumber, dataUrl }) => {
            const selected = selectedPages.includes(pageNumber);
            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => toggle(pageNumber)}
                className={cn(
                  "overflow-hidden rounded-md text-start transition-all duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                  selected
                    ? "bg-highlight ring-2 ring-border-interactive"
                    : "border border-border-subtle bg-card hover:border-border-strong",
                )}
              >
                <div className="flex items-center justify-center bg-layer p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dataUrl}
                    alt={t("ui.pdfPages.page", { page: pageNumber })}
                    className="max-h-40 w-auto object-contain shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2 border-t border-border-subtle px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected}
                    readOnly
                    tabIndex={-1}
                    className="size-3.5 accent-interactive"
                  />
                  <span className="type-label-01 font-medium text-text-primary">
                    {t("ui.pdfPages.page", { page: pageNumber })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
