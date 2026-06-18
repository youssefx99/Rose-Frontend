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
import { deactivateClient, listClients, type Client } from "@/lib/clients";
import { ClientFormDialog } from "./client-form-dialog";
import { PoliciesDialog } from "./policies-dialog";

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [policiesClient, setPoliciesClient] = useState<Client | null>(null);
  const [policiesOpen, setPoliciesOpen] = useState(false);

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

  const handleDeactivate = async (client: Client) => {
    try {
      await deactivateClient(client.id);
      toast.success(`${client.displayName} deactivated.`);
      load(search);
    } catch {
      toast.error("Failed to deactivate client.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        <Button onClick={handleNew}>New Client</Button>
      </div>

      <Input
        placeholder="Search clients…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(client)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeactivate(client)}
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
    </div>
  );
}
