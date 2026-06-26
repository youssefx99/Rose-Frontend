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
import { PageHeader } from "@/components/ui/page-header";
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
      <PageHeader
        title="Review Queue"
        description="Documents extracted by AI, awaiting your review before they commit to the ledger."
      />

      <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={5} className="py-8 text-center text-text-secondary">
                  Loading…
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-text-secondary">
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
                  <TableCell className="font-mono text-xs text-text-primary">
                    {job.fileName}
                  </TableCell>
                  <TableCell className="text-text-primary">
                    {job.payerName ?? "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {formatDateTime(job.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {job.counts.pending > 0 ? (
                      <span className="inline-flex w-fit items-center rounded-full bg-highlight px-2 py-0.5 type-label-01 font-medium text-interactive tabular-nums">
                        {job.counts.pending}
                      </span>
                    ) : (
                      <span className="text-text-helper tabular-nums">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-text-primary">
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
