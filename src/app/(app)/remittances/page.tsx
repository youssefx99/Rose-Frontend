"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listRemittances, type Remittance } from "@/lib/remittances";
import { formatDate, formatMoney } from "@/lib/format";

export default function RemittancesPage() {
  const router = useRouter();
  const [remittances, setRemittances] = useState<Remittance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await listRemittances();
        setRemittances(data);
      } catch {
        toast.error("Failed to load remittances.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Remittances"
        description="Committed payments from approved EOBs."
      />

      <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payer</TableHead>
              <TableHead>Check #</TableHead>
              <TableHead>Check Date</TableHead>
              <TableHead className="text-right">Lines</TableHead>
              <TableHead className="text-right">Check Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full animate-pulse rounded-sm bg-skeleton-background" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : remittances.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Receipt className="size-8 text-text-secondary" />
                    <p className="type-heading-02 text-text-primary">
                      No remittances yet
                    </p>
                    <p className="type-body-01 text-text-secondary">
                      Approve a document in the review queue to record a payment.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              remittances.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/remittances/${r.id}`)}
                >
                  <TableCell className="type-heading-compact-01 text-text-primary">
                    {r.payer?.name ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">
                    {r.checkNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {formatDate(r.checkDate)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-text-secondary">
                    {r._count?.claimLines ?? 0}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-text-primary">
                    {formatMoney(r.checkAmount)}
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
