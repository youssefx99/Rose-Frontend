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
import { deactivatePayer, listPayers, type Payer } from "@/lib/payers";
import { PayerFormDialog } from "./payer-form-dialog";

export default function PayersPage() {
  const [payers, setPayers] = useState<Payer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Payer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleDeactivate = async (payer: Payer) => {
    try {
      await deactivatePayer(payer.id);
      toast.success(`${payer.name} deactivated.`);
      load(search);
    } catch {
      toast.error("Failed to deactivate payer.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Payers</h1>
        <Button onClick={handleNew}>New Payer</Button>
      </div>

      <Input
        placeholder="Search payers…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(payer)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeactivate(payer)}
                    >
                      Deactivate
                    </Button>
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
    </div>
  );
}
