"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CascadeDeleteDialog } from "@/components/ui/cascade-delete-dialog";
import { BulkDeleteDialog } from "@/components/ui/bulk-delete-dialog";
import { useAuth } from "@/lib/auth-context";
import { useRowSelection } from "@/lib/use-row-selection";
import { deactivatePayer, listPayers, type Payer } from "@/lib/payers";
import { PayerFormDialog } from "./payer-form-dialog";
import { useRouter } from "next/navigation";

export default function PayersPage() {
  const { can } = useAuth();
  const router = useRouter();
  const [payers, setPayers] = useState<Payer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Payer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Payer | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const canDelete = can("payers.delete");
  const selection = useRowSelection(payers);

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
      <PageHeader
        title="Payers"
        description="Insurance companies and payer entities."
      >
        {can("payers.create") && (
          <Button onClick={handleNew}>New Payer</Button>
        )}
      </PageHeader>

      <Input
        placeholder="Search payers…"
        aria-label="Search payers"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      {canDelete && selection.selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-interactive bg-highlight px-4 py-2.5">
          <span className="type-body-compact-01 font-medium text-text-primary">
            {selection.selectedIds.size} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkOpen(true)}
          >
            <Trash2 className="size-3.5" /> Delete
          </Button>
          <button
            type="button"
            onClick={selection.clear}
            className="ml-auto type-label-01 text-text-secondary hover:text-text-primary"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {canDelete && (
                <TableHead className="w-10 pr-0">
                  <input
                    type="checkbox"
                    aria-label="Select all payers"
                    checked={selection.allSelected}
                    onChange={selection.toggleAll}
                    className="size-4 rounded-sm border-border-strong accent-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  />
                </TableHead>
              )}
              <TableHead>Name</TableHead>
              <TableHead>Short Code</TableHead>
              <TableHead>State</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {canDelete && <TableCell className="w-10 pr-0" />}
                  <TableCell>
                    <div className="h-4 w-40 animate-pulse rounded bg-skeleton-background" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 animate-pulse rounded bg-skeleton-background" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-10 animate-pulse rounded bg-skeleton-background" />
                  </TableCell>
                  <TableCell>
                    <div className="ml-auto h-4 w-16 animate-pulse rounded bg-skeleton-background" />
                  </TableCell>
                </TableRow>
              ))
            ) : payers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canDelete ? 5 : 4} className="py-16 whitespace-normal">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <Building2
                      className="size-8 text-text-secondary"
                      aria-hidden
                    />
                    <div className="space-y-1">
                      <p className="type-heading-02 text-text-primary">
                        No payers found
                      </p>
                      <p className="type-body-01 text-text-secondary">
                        {search
                          ? "Try a different search term."
                          : "Add your first payer to get started."}
                      </p>
                    </div>
                    {can("payers.create") && !search && (
                      <Button onClick={handleNew} className="mt-2">
                        New Payer
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              payers.map((payer) => (
                <TableRow
                  key={payer.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/payers/${payer.id}`)}
                  data-state={selection.selectedIds.has(payer.id) ? "selected" : undefined}
                >
                  {canDelete && (
                    <TableCell className="w-10 pr-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${payer.name}`}
                        checked={selection.selectedIds.has(payer.id)}
                        onChange={() => selection.toggleOne(payer.id)}
                        className="size-4 rounded-sm border-border-strong accent-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium text-text-primary">
                    {payer.name}
                  </TableCell>
                  <TableCell className="font-mono text-text-secondary">
                    {payer.shortCode}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {payer.state ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {can("payers.edit") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${payer.name}`}
                          onClick={() => handleEdit(payer)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {can("payers.delete") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${payer.name}`}
                          className="text-support-error hover:bg-support-error-bg hover:text-support-error"
                          onClick={() => setDeleting(payer)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
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

      <BulkDeleteDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        type="payer"
        ids={selection.ids}
        noun="payer"
        onDone={() => {
          selection.clear();
          load(search);
        }}
      />
    </div>
  );
}
