"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export interface DocumentFile {
  /** Object URL for the fetched blob, or null while loading/on error. */
  url: string | null;
  loading: boolean;
  error: boolean;
}

/**
 * Fetches the original uploaded file through the authenticated `api` instance
 * (which injects the in-memory access token — a raw <iframe src> could not) and
 * exposes it as a blob object URL. The URL is revoked on unmount/job change.
 */
export function useDocumentFile(jobId: string): DocumentFile {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    setLoading(true);
    setError(false);
    api
      .get(`/documents/${jobId}/file`, { responseType: "blob" })
      .then((res) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(res.data as Blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [jobId]);

  return { url, loading, error };
}

interface DocumentViewerProps {
  fileName: string;
  fileMimeType: string | null;
  file: DocumentFile;
}

// PDFs render inline in an iframe; anything else gets a download card. The card
// fills its parent's height (set on the review page) so there's no bottom gap.
export function DocumentViewer({
  fileName,
  fileMimeType,
  file,
}: DocumentViewerProps) {
  const isPdf = (fileMimeType ?? "application/pdf") === "application/pdf";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-border-subtle bg-card">
      <div className="flex items-center justify-between border-b border-border-subtle bg-layer px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="size-4 shrink-0 text-text-secondary" />
          <span className="max-w-[220px] truncate type-body-compact-01 font-medium text-text-primary">
            {fileName}
          </span>
        </div>
        {file.url && (
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 type-label-01 text-text-secondary transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:text-text-primary"
          >
            <ExternalLink className="size-3" />
            Open in new tab
          </a>
        )}
      </div>

      {file.loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="type-body-compact-01 text-text-secondary">Loading document…</p>
        </div>
      ) : file.error || !file.url ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <FileText className="mb-3 size-10 text-text-helper" />
          <p className="type-body-compact-01 font-medium text-text-primary">
            Couldn&apos;t load the document
          </p>
          <p className="mt-1 type-label-01 text-text-secondary">
            The file may be unavailable or you may not have access.
          </p>
        </div>
      ) : isPdf ? (
        <iframe
          src={file.url}
          className="w-full flex-1 border-0"
          title={fileName}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <FileText className="mb-3 size-10 text-text-helper" />
          <p className="mb-1 type-body-compact-01 font-medium text-text-primary">{fileName}</p>
          <p className="mb-4 type-label-01 text-text-secondary">
            This file type cannot be previewed in the browser.
          </p>
          <Button asChild variant="secondary">
            <a href={file.url} download={fileName}>
              <Download className="size-4" />
              Download file
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
