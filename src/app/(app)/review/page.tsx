"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listReviewQueue, type QueueJob } from "@/lib/documents";
import { formatDateTime } from "@/lib/format";

export default function ReviewQueuePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setJobs(await listReviewQueue());
      } catch {
        toast.error("Failed to load review queue.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950">Review Queue</h1>
        <p className="text-sm text-zinc-500">
          Documents extracted by AI, awaiting your review before they commit to
          the ledger.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              <TableHead>Document</TableHead>
              <TableHead>Payer</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead className="text-right">Total Items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-zinc-500">
                  Loading…
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-zinc-500">
                  Nothing to review. Upload a document to get started.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/review/${job.id}`)}
                >
                  <TableCell className="font-mono text-xs text-zinc-700">
                    {job.fileName}
                  </TableCell>
                  <TableCell className="text-zinc-700">
                    {job.payerName ?? "—"}
                  </TableCell>
                  <TableCell className="text-zinc-600">
                    {formatDateTime(job.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {job.counts.pending > 0 ? (
                      <span className="inline-flex w-fit items-center rounded-md bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 tabular-nums">
                        {job.counts.pending}
                      </span>
                    ) : (
                      <span className="text-zinc-400">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-zinc-700">
                    {job.totalItems}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
