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
      <div>
        <h1 className="text-xl font-semibold text-zinc-950">Remittances</h1>
        <p className="text-sm text-zinc-500">
          Committed payments from approved EOBs.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              <TableHead>Payer</TableHead>
              <TableHead>Check #</TableHead>
              <TableHead>Check Date</TableHead>
              <TableHead className="text-right">Lines</TableHead>
              <TableHead className="text-right">Check Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-zinc-500">
                  Loading…
                </TableCell>
              </TableRow>
            ) : remittances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-zinc-500">
                  No remittances yet. Approve a document in the review queue.
                </TableCell>
              </TableRow>
            ) : (
              remittances.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/remittances/${r.id}`)}
                >
                  <TableCell className="font-medium text-zinc-900">
                    {r.payer?.name ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-700">
                    {r.checkNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-zinc-600">
                    {formatDate(r.checkDate)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-zinc-700">
                    {r._count?.claimLines ?? 0}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-zinc-900">
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
