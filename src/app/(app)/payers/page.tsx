"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CascadeDeleteDialog } from "@/components/ui/cascade-delete-dialog";
import { useAuth } from "@/lib/auth-context";
import { deactivatePayer, listPayers, type Payer } from "@/lib/payers";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Payers</h1>
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
              <TableHead>State</TableHead>
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
                  <TableCell>{payer.state ?? "—"}</TableCell>
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

      <CascadeDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        type="payer"
        id={deleting?.id ?? null}
        title="Delete payer"
        onDeactivate={deleting ? () => deactivatePayer(deleting.id) : undefined}
        onDone={() => load(search)}
      />
    </div>
  );
}
