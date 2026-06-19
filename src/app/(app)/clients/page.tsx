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
  deactivateClient,
  deleteClient,
  listClients,
  type Client,
} from "@/lib/clients";
import { ClientFormDialog } from "./client-form-dialog";
import { PoliciesDialog } from "./policies-dialog";

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export default function ClientsPage() {
  const { can } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [policiesClient, setPoliciesClient] = useState<Client | null>(null);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const load = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const { data } = await listClients(term ? { search: term } : undefined);
      setClients(data);
    } catch {
      toast.error("Failed to load clients.");
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
    setFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditing(client);
    setFormOpen(true);
  };

  const handlePolicies = (client: Client) => {
    setPoliciesClient(client);
    setPoliciesOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-950">Clients</h1>
        {can("clients.create") && (
          <Button onClick={handleNew}>New Client</Button>
        )}
      </div>

      <Input
        placeholder="Search clients…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              <TableHead>Name</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Account #</TableHead>
              <TableHead>Policies</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    {client.displayName}
                  </TableCell>
                  <TableCell>{formatDate(client.dateOfBirth)}</TableCell>
                  <TableCell>{client.clientAccountNumber ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {client._count?.insurancePolicies ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePolicies(client)}
                    >
                      Policies
                    </Button>
                    {can("clients.edit") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(client)}
                      >
                        Edit
                      </Button>
                    )}
                    {can("clients.delete") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleting(client)}
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

      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editing}
        onSaved={() => load(search)}
      />
      <PoliciesDialog
        open={policiesOpen}
        onOpenChange={setPoliciesOpen}
        client={policiesClient}
      />

      <DeleteConfirm
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete client"
        entityName={deleting?.displayName ?? ""}
        canHardDelete={(deleting?._count?.claims ?? 0) === 0}
        blockedReason={
          (deleting?._count?.claims ?? 0) > 0
            ? `This client has ${deleting?._count?.claims} claim(s), so it can't be permanently deleted. Deactivate it to hide it while keeping all history.`
            : undefined
        }
        onDeactivate={
          deleting ? () => deactivateClient(deleting.id) : undefined
        }
        onDelete={() => deleteClient(deleting!.id)}
        onDone={() => load(search)}
      >
        <p>
          <span className="font-medium text-zinc-900">Deactivate</span> hides the
          client from active lists but keeps all history, and can be reactivated
          later.
        </p>
        <p>
          <span className="font-medium text-zinc-900">Delete permanently</span>{" "}
          removes the client
          {(deleting?._count?.insurancePolicies ?? 0) > 0
            ? ` and its ${deleting?._count?.insurancePolicies} insurance policy(ies)`
            : ""}
          . This cannot be undone.
        </p>
      </DeleteConfirm>
    </div>
  );
}
