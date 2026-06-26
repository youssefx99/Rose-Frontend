"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Section, DataList, DataRow } from "@/components/ui/detail";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { CascadeDeleteDialog } from "@/components/ui/cascade-delete-dialog";
import {
  getRemittance,
  type RemittanceDetail,
} from "@/lib/remittances";
import { formatDate, formatMoney } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

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

  if (loading) return <p className="type-body-01 text-text-secondary">Loading…</p>;
  if (!remittance)
    return (
      <p className="type-body-01 text-text-secondary">Remittance not found.</p>
    );

  return (
    <div className="space-y-6">
      <Link
        href="/remittances"
        className="inline-flex items-center gap-1 type-body-compact-01 text-text-secondary transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:text-text-primary"
      >
        <ArrowLeft className="size-4" /> Back to remittances
      </Link>

      <PageHeader
        title={remittance.payer?.name ?? "Remittance"}
        description={`Check ${remittance.checkNumber ?? "—"} · ${formatDate(
          remittance.checkDate,
        )} · from ${remittance.sourceFileName}`}
      >
        {can("remittances.delete") && (
          <Button
            variant="ghost"
            size="sm"
            className="text-support-error hover:bg-support-error-bg hover:text-support-error"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" /> Delete
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Payment Summary"
          className="lg:col-span-1"
          bodyClassName="px-5 py-1"
        >
          <DataList>
            <DataRow label="Payer" value={remittance.payer?.name ?? "—"} />
            <DataRow label="Check #" value={remittance.checkNumber ?? "—"} mono />
            <DataRow
              label="Check Date"
              value={formatDate(remittance.checkDate)}
            />
            <DataRow
              label="Check Amount"
              value={formatMoney(remittance.checkAmount)}
              mono
            />
          </DataList>
        </Section>

        <Section
          title="Claim Lines"
          className="lg:col-span-2"
          bodyClassName="p-0"
        >
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center type-body-01 text-text-secondary"
                  >
                    No claim lines.
                  </TableCell>
                </TableRow>
              ) : (
                remittance.claimLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-text-primary">
                      {line.patientNameOnEob}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-text-secondary">
                      {line.externalClaimNumber}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {formatDate(line.dateOfService)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-text-secondary">
                      {formatMoney(line.billedAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-text-primary">
                      {formatMoney(line.paidAmount)}
                    </TableCell>
                    <TableCell>
                      {line.claim ? (
                        <Link
                          href={`/claims/${line.claim.id}`}
                          className="inline-flex items-center gap-2 type-body-compact-01 text-link transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:text-link-hover"
                        >
                          <span className="font-mono text-xs">
                            {line.claim.claimReference}
                          </span>
                          <StatusBadge status={line.claim.status} />
                        </Link>
                      ) : (
                        <span className="type-label-01 text-text-helper">
                          Unmatched
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Section>
      </div>

      <CascadeDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        type="remittance"
        id={remittance.id}
        title="Delete remittance"
        onDone={() => router.push("/remittances")}
      />
    </div>
  );
}
