"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConfirm } from "@/components/ui/delete-confirm";
import { useAuth } from "@/lib/auth-context";
import {
  deactivatePayer,
  deletePayer,
  listPayers,
  type Payer,
} from "@/lib/payers";
import { PayerFormDialog } from "./payer-form-dialog";

export default function PayersPage() {
  const { can } = useAuth();
  const [payers, setPayers] = useState<Payer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Payer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Payer | null>(null);

  const load = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const { data } = await listPayers(term ? { search: term } : undefined);
      setPayers(data);
    } catch {
      toast.error("Failed to load payers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (payer: Payer) => {
    setEditing(payer);
    setDialogOpen(true);
  };

  const blockers: string[] = [];
  const counts = deleting?._count;
  if (counts?.claims) blockers.push(`${counts.claims} claim(s)`);
  if (counts?.insurancePolicies)
    blockers.push(`${counts.insurancePolicies} policy(ies)`);
  if (counts?.remittances) blockers.push(`${counts.remittances} remittance(s)`);
  if (counts?.bankDeposits) blockers.push(`${counts.bankDeposits} deposit(s)`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-950">Payers</h1>
        {can("payers.create") && (
          <Button onClick={handleNew}>New Payer</Button>
        )}
      </div>

      <Input
        placeholder="Search payers…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              <TableHead>Name</TableHead>
              <TableHead>Short Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : payers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No payers found.
                </TableCell>
              </TableRow>
            ) : (
              payers.map((payer) => (
                <TableRow key={payer.id}>
                  <TableCell className="font-medium">{payer.name}</TableCell>
                  <TableCell>{payer.shortCode}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{payer.payerType}</Badge>
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    {can("payers.edit") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(payer)}
                      >
                        Edit
                      </Button>
                    )}
                    {can("payers.delete") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleting(payer)}
                      >
                        Delete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PayerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payer={editing}
        onSaved={() => load(search)}
      />

      <DeleteConfirm
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete payer"
        entityName={deleting?.name ?? ""}
        canHardDelete={blockers.length === 0}
        blockedReason={
          blockers.length > 0
            ? `This payer is referenced by ${blockers.join(
                ", ",
              )}, so it can't be permanently deleted. Deactivate it instead.`
            : undefined
        }
        onDeactivate={deleting ? () => deactivatePayer(deleting.id) : undefined}
        onDelete={() => deletePayer(deleting!.id)}
        onDone={() => load(search)}
      >
        <p>
          <span className="font-medium text-zinc-900">Deactivate</span> hides the
          payer from active lists but keeps all history, and can be reactivated
          later.
        </p>
        <p>
          <span className="font-medium text-zinc-900">Delete permanently</span>{" "}
          removes the payer entirely. This is only possible when no records
          reference it, and cannot be undone.
        </p>
      </DeleteConfirm>
    </div>
  );
}
