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
import { BulkDeleteDialog } from "@/components/ui/bulk-delete-dialog";
import { FilterBar, FilterField, type ActiveFilterChip } from "@/components/ui/filter-bar";
import { useAuth } from "@/lib/auth-context";
import { useT, useLocale } from "@/lib/i18n/provider";
import { useFormat } from "@/lib/i18n/format";
import { useRowSelection } from "@/lib/use-row-selection";
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
  const t = useT("clients");
  const { dir } = useLocale();
  const { formatNumber } = useFormat();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ClientFilters>(EMPTY_FILTERS);
  const [payers, setPayers] = useState<Payer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Client | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const canDelete = can("clients.delete");
  const selection = useRowSelection(clients);

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
      toast.error(t("clients.toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
    payers.find((p) => p.id === id)?.name ?? t("clients.filter.payerFallback");

  // "active" is the default view, so it doesn't count as an applied filter.
  const chips = useMemo<ActiveFilterChip[]>(() => {
    const list: ActiveFilterChip[] = [];
    if (filters.status !== "active")
      list.push({
        key: "status",
        label: t("clients.filter.statusChip", {
          value: t(
            filters.status === "inactive" ? "common.inactive" : "common.all",
          ),
        }),
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
        label: t("clients.filter.hasOutstandingChip"),
        onRemove: () => set("hasOutstanding", false),
      });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, payers, t]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      >
        {can("clients.create") && (
          <Button onClick={handleNew}>{t("newClient")}</Button>
        )}
      </PageHeader>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchPlaceholder")}
        activeCount={chips.length}
        chips={chips}
        onClearAll={() => setFilters(EMPTY_FILTERS)}
      >
        <FilterField label={t("common.status")}>
          <Select
            dir={dir}
            value={filters.status}
            onValueChange={(v) => set("status", v as ClientStatusFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t("common.active")}</SelectItem>
              <SelectItem value="inactive">{t("common.inactive")}</SelectItem>
              <SelectItem value="all">{t("common.all")}</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label={t("clients.filter.payer")}>
          <Select dir={dir} value={filters.payerId} onValueChange={(v) => set("payerId", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("clients.filter.anyPayer")}</SelectItem>
              {payers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label={t("clients.filter.balance")}>
          <Select
            dir={dir}
            value={filters.hasOutstanding ? "outstanding" : "any"}
            onValueChange={(v) => set("hasOutstanding", v === "outstanding")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("clients.filter.any")}</SelectItem>
              <SelectItem value="outstanding">{t("clients.filter.hasUnpaidClaims")}</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
      </FilterBar>

      {canDelete && selection.selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-interactive bg-highlight px-4 py-2.5">
          <span className="type-body-compact-01 font-medium text-text-primary">
            {t("common.selectedCount", { count: selection.selectedIds.size })}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setBulkOpen(true)}
          >
            <Trash2 className="size-3.5" /> {t("common.delete")}
          </Button>
          <button
            type="button"
            onClick={selection.clear}
            className="ms-auto type-label-01 text-text-secondary hover:text-text-primary"
          >
            {t("clients.bulk.clearSelection")}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {canDelete && (
                <TableHead className="w-10 pe-0">
                  <input
                    type="checkbox"
                    aria-label={t("clients.table.selectAllAria")}
                    checked={selection.allSelected}
                    onChange={selection.toggleAll}
                    className="size-4 rounded-sm border-border-strong accent-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  />
                </TableHead>
              )}
              <TableHead>{t("common.name")}</TableHead>
              <TableHead className="text-end">{t("clients.table.accountNumbers")}</TableHead>
              <TableHead className="text-end">{t("clients.table.claims")}</TableHead>
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canDelete ? 5 : 4} className="py-8 text-center text-text-secondary">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canDelete ? 5 : 4} className="py-8 text-center text-text-secondary">
                  {t("clients.empty.noClients")}
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="cursor-pointer"
                  data-state={selection.selectedIds.has(client.id) ? "selected" : undefined}
                >
                  {canDelete && (
                    <TableCell className="w-10 pe-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={t("clients.table.selectRowAria", { name: client.displayName })}
                        checked={selection.selectedIds.has(client.id)}
                        onChange={() => selection.toggleOne(client.id)}
                        className="size-4 rounded-sm border-border-strong accent-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <Link
                      href={`/clients/${client.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-text-primary transition-colors hover:text-link hover:underline"
                    >
                      {client.displayName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-end font-mono tabular-nums text-text-secondary">
                    {formatNumber(client.accountCount ?? 0)}
                  </TableCell>
                  <TableCell className="text-end font-mono tabular-nums text-text-secondary">
                    {formatNumber(client.claimCount ?? 0)}
                  </TableCell>
                  <TableCell className="space-x-1 text-end">
                    {can("clients.edit") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("clients.table.editAria", { name: client.displayName })}
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
                        aria-label={t("clients.table.deleteAria", { name: client.displayName })}
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
        title={t("clients.delete.title")}
        onDeactivate={
          deleting ? () => deactivateClient(deleting.id) : undefined
        }
        onDone={() => load(search, filters)}
      />

      <BulkDeleteDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        type="client"
        ids={selection.ids}
        noun="client"
        onDone={() => {
          selection.clear();
          load(search, filters);
        }}
      />
    </div>
  );
}
