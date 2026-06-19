"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, FileText } from "lucide-react";

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
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="size-4 shrink-0 text-zinc-400" />
          <span className="max-w-[220px] truncate text-sm font-medium text-zinc-900">
            {fileName}
          </span>
        </div>
        {file.url && (
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <ExternalLink className="size-3" />
            Open in new tab
          </a>
        )}
      </div>

      {file.loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-500">Loading document…</p>
        </div>
      ) : file.error || !file.url ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <FileText className="mb-3 size-10 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-900">
            Couldn&apos;t load the document
          </p>
          <p className="mt-1 text-xs text-zinc-500">
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
          <FileText className="mb-3 size-10 text-zinc-300" />
          <p className="mb-1 text-sm font-medium text-zinc-900">{fileName}</p>
          <p className="mb-4 text-xs text-zinc-500">
            This file type cannot be previewed in the browser.
          </p>
          <a
            href={file.url}
            download={fileName}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            <Download className="size-4" />
            Download file
          </a>
        </div>
      )}
    </div>
  );
}
