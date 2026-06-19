"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { DeleteConfirm } from "@/components/ui/delete-confirm";
import {
  deleteRemittance,
  getRemittance,
  type RemittanceDetail,
} from "@/lib/remittances";
import { formatDate, formatMoney } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="font-mono tabular-nums text-zinc-900">{value}</span>
    </div>
  );
}

export default function RemittanceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useAuth();
  const [remittance, setRemittance] = useState<RemittanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setRemittance(await getRemittance(params.id));
      } catch {
        toast.error("Failed to load remittance.");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) return <p className="text-zinc-500">Loading…</p>;
  if (!remittance) return <p className="text-zinc-500">Remittance not found.</p>;

  return (
    <div className="space-y-6">
      <Link
        href="/remittances"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="size-4" /> Back to remittances
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-zinc-950">
            {remittance.payer?.name ?? "Remittance"}
          </h1>
          <p className="text-sm text-zinc-500">
            Check {remittance.checkNumber ?? "—"} ·{" "}
            {formatDate(remittance.checkDate)} · from {remittance.sourceFileName}
          </p>
        </div>
        {can("remittances.delete") && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" /> Delete
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <SummaryRow
              label="Gross Claim"
              value={formatMoney(remittance.grossClaimAmount)}
            />
            <SummaryRow
              label="Late Interest"
              value={formatMoney(remittance.lateInterest)}
            />
            <SummaryRow
              label="ARs Applied"
              value={formatMoney(remittance.arsApplied)}
            />
            <div className="border-t border-zinc-200 pt-2">
              <SummaryRow
                label="Check Amount"
                value={formatMoney(remittance.checkAmount)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Claim Lines
          </h2>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50">
                  <TableHead>Client</TableHead>
                  <TableHead>Claim #</TableHead>
                  <TableHead>DOS</TableHead>
                  <TableHead className="text-right">Billed</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead>Matched</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remittance.claimLines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-zinc-500">
                      No claim lines.
                    </TableCell>
                  </TableRow>
                ) : (
                  remittance.claimLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="text-zinc-800">
                        {line.patientNameOnEob}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-700">
                        {line.externalClaimNumber}
                      </TableCell>
                      <TableCell className="text-zinc-600">
                        {formatDate(line.dateOfService)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-zinc-700">
                        {formatMoney(line.billedAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-zinc-900">
                        {formatMoney(line.paidAmount)}
                      </TableCell>
                      <TableCell>
                        {line.claim ? (
                          <Link
                            href={`/claims/${line.claim.id}`}
                            className="inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700"
                          >
                            <span className="font-mono text-xs">
                              {line.claim.claimReference}
                            </span>
                            <StatusBadge status={line.claim.status} />
                          </Link>
                        ) : (
                          <span className="text-xs text-zinc-400">Unmatched</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <DeleteConfirm
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete remittance"
        entityName={`${remittance.payer?.name ?? "Remittance"} · Check ${
          remittance.checkNumber ?? "—"
        }`}
        canHardDelete
        onDelete={() => deleteRemittance(remittance.id)}
        onDone={() => {
          toast.success("Remittance deleted.");
          router.push("/remittances");
        }}
      >
        <p>
          <span className="font-medium text-zinc-900">Delete permanently</span>{" "}
          removes this remittance, its {remittance.claimLines.length} claim
          line(s), and its bank deposit.
        </p>
        {remittance.claimLines.some((line) => line.claim) && (
          <p>
            {remittance.claimLines.filter((line) => line.claim).length} matched
            claim(s) will be reverted to{" "}
            <span className="font-medium">PENDING</span> (their payment is
            cleared).
          </p>
        )}
        <p>This cannot be undone.</p>
      </DeleteConfirm>
    </div>
  );
}
