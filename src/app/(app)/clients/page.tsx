"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CascadeDeleteDialog } from "@/components/ui/cascade-delete-dialog";
import { FilterBar, FilterField, type ActiveFilterChip } from "@/components/ui/filter-bar";
import { useAuth } from "@/lib/auth-context";
import {
  deactivateClient,
  listClients,
  type Client,
  type ClientStatusFilter,
} from "@/lib/clients";
import { listPayers, type Payer } from "@/lib/payers";
import { ClientFormDialog } from "./client-form-dialog";

const ALL = "__all__";

interface ClientFilters {
  status: ClientStatusFilter;
  payerId: string | typeof ALL;
  hasOutstanding: boolean;
}

const EMPTY_FILTERS: ClientFilters = {
  status: "active",
  payerId: ALL,
  hasOutstanding: false,
};

export default function ClientsPage() {
  const { can } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ClientFilters>(EMPTY_FILTERS);
  const [payers, setPayers] = useState<Payer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Client | null>(null);

  useEffect(() => {
    listPayers()
      .then(({ data }) => setPayers(data))
      .catch(() => undefined);
  }, []);

  const set = useCallback(
    <K extends keyof ClientFilters>(key: K, value: ClientFilters[K]) =>
      setFilters((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const load = useCallback(async (term: string, f: ClientFilters) => {
    setLoading(true);
    try {
      const { data } = await listClients({
        search: term || undefined,
        status: f.status,
        payerId: f.payerId === ALL ? undefined : f.payerId,
        hasOutstanding: f.hasOutstanding || undefined,
      });
      setClients(data);
    } catch {
      toast.error("Failed to load clients.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search, filters), 300);
    return () => clearTimeout(timer);
  }, [search, filters, load]);

  const handleNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditing(client);
    setFormOpen(true);
  };

  const payerName = (id: string) =>
    payers.find((p) => p.id === id)?.name ?? "Payer";

  // "active" is the default view, so it doesn't count as an applied filter.
  const chips = useMemo<ActiveFilterChip[]>(() => {
    const list: ActiveFilterChip[] = [];
    if (filters.status !== "active")
      list.push({
        key: "status",
        label: `Status: ${filters.status}`,
        onRemove: () => set("status", "active"),
      });
    if (filters.payerId !== ALL)
      list.push({
        key: "payer",
        label: payerName(filters.payerId),
        onRemove: () => set("payerId", ALL),
      });
    if (filters.hasOutstanding)
      list.push({
        key: "outstanding",
        label: "Has outstanding",
        onRemove: () => set("hasOutstanding", false),
      });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, payers]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="People served by your organization."
      >
        {can("clients.create") && (
          <Button onClick={handleNew}>New Client</Button>
        )}
      </PageHeader>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name or account #…"
        activeCount={chips.length}
        chips={chips}
        onClearAll={() => setFilters(EMPTY_FILTERS)}
      >
        <FilterField label="Status">
          <Select
            value={filters.status}
            onValueChange={(v) => set("status", v as ClientStatusFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Payer">
          <Select value={filters.payerId} onValueChange={(v) => set("payerId", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any payer</SelectItem>
              {payers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Balance">
          <Select
            value={filters.hasOutstanding ? "outstanding" : "any"}
            onValueChange={(v) => set("hasOutstanding", v === "outstanding")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="outstanding">Has unpaid claims</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
      </FilterBar>

      <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Account&nbsp;#s</TableHead>
              <TableHead className="text-right">Claims</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-text-secondary">
                  Loading…
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-text-secondary">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/clients/${client.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-text-primary transition-colors hover:text-link hover:underline"
                    >
                      {client.displayName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-text-secondary">
                    {client.accountCount ?? 0}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-text-secondary">
                    {client.claimCount ?? 0}
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    {can("clients.edit") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${client.displayName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(client);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}
                    {can("clients.delete") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${client.displayName}`}
                        className="text-support-error hover:bg-support-error-bg hover:text-support-error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleting(client);
                        }}
                      >
                        <Trash2 className="size-4" />
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
        onSaved={() => load(search, filters)}
      />

      <CascadeDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        type="client"
        id={deleting?.id ?? null}
        title="Delete client"
        onDeactivate={
          deleting ? () => deactivateClient(deleting.id) : undefined
        }
        onDone={() => load(search, filters)}
      />
    </div>
  );
}
