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
import { useFormat } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/provider";

export default function ReviewQueuePage() {
  const router = useRouter();
  const t = useT("review");
  const { formatDateTime } = useFormat();
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setJobs(await listReviewQueue());
      } catch {
        toast.error(t("review.toast.queueLoadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("review.table.document")}</TableHead>
              <TableHead>{t("review.table.payer")}</TableHead>
              <TableHead>{t("review.table.uploaded")}</TableHead>
              <TableHead className="text-end">{t("review.table.pending")}</TableHead>
              <TableHead className="text-end">{t("review.table.totalItems")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-text-secondary">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-text-secondary">
                  {t("review.empty.title")}
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
                  <TableCell className="text-end">
                    {job.counts.pending > 0 ? (
                      <span className="inline-flex w-fit items-center rounded-full bg-highlight px-2 py-0.5 type-label-01 font-medium text-interactive tabular-nums">
                        {job.counts.pending}
                      </span>
                    ) : (
                      <span className="text-text-helper tabular-nums">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-end font-mono tabular-nums text-text-primary">
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
