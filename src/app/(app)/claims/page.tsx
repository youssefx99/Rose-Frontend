"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Download, Inbox, Trash2 } from "lucide-react";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { BulkDeleteDialog } from "@/components/ui/bulk-delete-dialog";
import { FilterBar, FilterField, type ActiveFilterChip } from "@/components/ui/filter-bar";
import { ClaimFormPanel } from "./claim-form-panel";
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
import {
  listClaims,
  changeClaimStatus,
  formatMoney,
  formatDate,
  CLAIM_STATUSES,
  CLAIM_STATUS_TRANSITIONS,
  type Claim,
  type ClaimStatus,
  type ClaimQuery,
} from "@/lib/claims";
import { listPayers, type Payer } from "@/lib/payers";
import { listClients, type Client } from "@/lib/clients";
import { timeAgo } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { useRowSelection } from "@/lib/use-row-selection";
import { cn } from "@/lib/utils";

const ALL = "__all__";

interface AdvancedFilters {
  status: ClaimStatus | typeof ALL;
  payerId: string | typeof ALL;
  clientId: string | typeof ALL;
  dateFrom: string;
  dateTo: string;
  minCharge: string;
  maxCharge: string;
  outstandingOnly: boolean;
}

const EMPTY_FILTERS: AdvancedFilters = {
  status: ALL,
  payerId: ALL,
  clientId: ALL,
  dateFrom: "",
  dateTo: "",
  minCharge: "",
  maxCharge: "",
  outstandingOnly: false,
};

interface QuickFilter {
  label: string;
  match: (f: AdvancedFilters) => boolean;
  apply: () => AdvancedFilters;
}

const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

const QUICK_FILTERS: QuickFilter[] = [
  {
    label: "Denied",
    match: (f) => f.status === "DENIED",
    apply: () => ({ ...EMPTY_FILTERS, status: "DENIED" }),
  },
  {
    label: "Appealed",
    match: (f) => f.status === "APPEALED",
    apply: () => ({ ...EMPTY_FILTERS, status: "APPEALED" }),
  },
  {
    label: "Pending",
    match: (f) => f.status === "PENDING",
    apply: () => ({ ...EMPTY_FILTERS, status: "PENDING" }),
  },
  {
    label: "Paid this month",
    match: (f) => f.status === "PAID" && f.dateFrom === firstOfMonth(),
    apply: () => ({ ...EMPTY_FILTERS, status: "PAID", dateFrom: firstOfMonth(), dateTo: today() }),
  },
  {
    label: "Outstanding",
    match: (f) => f.outstandingOnly,
    apply: () => ({ ...EMPTY_FILTERS, outstandingOnly: true }),
  },
];

/** Searchable client combobox for the filter bar. */
function ClientCombobox({
  clients,
  value,
  onChange,
}: {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = clients.find((c) => c.id === value);
  const filtered =
    query === ""
      ? clients
      : clients.filter((c) =>
          c.displayName.toLowerCase().includes(query.toLowerCase()),
        );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder={selected ? selected.displayName : "All clients"}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <ul className="absolute left-0 top-full z-50 mt-1 max-h-52 w-full min-w-[200px] overflow-y-auto rounded-md border border-border-subtle bg-card shadow-lg">
          <li
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onChange(ALL); setOpen(false); setQuery(""); }}
            className={cn(
              "cursor-pointer px-3 py-2 type-body-compact-01 hover:bg-layer-hover",
              value === ALL ? "font-medium text-text-primary" : "text-text-secondary",
            )}
          >
            All clients
          </li>
          {filtered.map((c) => (
            <li
              key={c.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(c.id); setOpen(false); setQuery(""); }}
              className={cn(
                "cursor-pointer px-3 py-2 type-body-compact-01 hover:bg-layer-hover",
                value === c.id ? "font-medium text-interactive" : "text-text-primary",
              )}
            >
              {c.displayName}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 type-body-compact-01 text-text-secondary">
              No clients found.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/** Inline status quick-change — stops row click propagation. */
function InlineStatusChange({
  claim,
  onChanged,
}: {
  claim: Claim;
  onChanged: (c: Claim) => void;
}) {
  const [busy, setBusy] = useState(false);
  const targets = CLAIM_STATUS_TRANSITIONS[claim.status];

  if (targets.length === 0) return <StatusBadge status={claim.status} />;

  const go = async (target: ClaimStatus) => {
    setBusy(true);
    try {
      const updated = await changeClaimStatus(claim.id, target);
      onChanged(updated);
      toast.success(`Marked ${target}.`);
    } catch (err) {
      const msg =
        isAxiosError(err) && typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : "Status update failed.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <StatusBadge status={claim.status} />
      <select
        disabled={busy}
        defaultValue=""
        aria-label="Change status"
        className="rounded border border-border-subtle bg-background px-1 py-0.5 type-label-01 text-text-secondary focus:outline-none focus:ring-1 focus:ring-interactive disabled:opacity-50"
        onChange={async (e) => {
          const target = e.target.value as ClaimStatus;
          e.target.value = "";
          if (target) await go(target);
        }}
      >
        <option value="">→</option>
        {targets.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ClaimsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdvancedFilters>(() => {
    const status = searchParams.get("status") as ClaimStatus | null;
    const outstandingOnly = searchParams.get("outstandingOnly") === "true";
    return {
      ...EMPTY_FILTERS,
      ...(status && CLAIM_STATUSES.includes(status) ? { status } : {}),
      ...(outstandingOnly ? { outstandingOnly: true } : {}),
    };
  });
  const [payers, setPayers] = useState<Payer[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    listPayers().then(({ data }) => setPayers(data)).catch(() => undefined);
    listClients().then(({ data }) => setClients(data)).catch(() => undefined);
  }, []);

  const set = useCallback(
    <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) =>
      setFilters((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const load = useCallback(async (term: string, f: AdvancedFilters) => {
    setLoading(true);
    try {
      const query: ClaimQuery = {
        search: term || undefined,
        status: f.status === ALL ? undefined : f.status,
        payerId: f.payerId === ALL ? undefined : f.payerId,
        dateFrom: f.dateFrom || undefined,
        dateTo: f.dateTo || undefined,
        minCharge: f.minCharge === "" ? undefined : Number(f.minCharge),
        maxCharge: f.maxCharge === "" ? undefined : Number(f.maxCharge),
        clientId: f.clientId === ALL ? undefined : f.clientId,
        outstandingOnly: f.outstandingOnly || undefined,
      };
      const { data } = await listClaims(query);
      setClaims(data);
    } catch {
      toast.error("Failed to load claims.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search, filters), 300);
    return () => clearTimeout(timer);
  }, [search, filters, load]);

  const payerName = (id: string) => payers.find((p) => p.id === id)?.name ?? "Payer";
  const clientName = (id: string) => clients.find((c) => c.id === id)?.displayName ?? "Client";

  const chips = useMemo<ActiveFilterChip[]>(() => {
    const list: ActiveFilterChip[] = [];
    if (filters.status !== ALL)
      list.push({ key: "status", label: filters.status, onRemove: () => set("status", ALL) });
    if (filters.payerId !== ALL)
      list.push({ key: "payer", label: payerName(filters.payerId), onRemove: () => set("payerId", ALL) });
    if (filters.clientId !== ALL)
      list.push({ key: "client", label: clientName(filters.clientId), onRemove: () => set("clientId", ALL) });
    if (filters.dateFrom)
      list.push({ key: "dateFrom", label: `From ${filters.dateFrom}`, onRemove: () => set("dateFrom", "") });
    if (filters.dateTo)
      list.push({ key: "dateTo", label: `To ${filters.dateTo}`, onRemove: () => set("dateTo", "") });
    if (filters.minCharge)
      list.push({ key: "minCharge", label: `Charge ≥ ${filters.minCharge}`, onRemove: () => set("minCharge", "") });
    if (filters.maxCharge)
      list.push({ key: "maxCharge", label: `Charge ≤ ${filters.maxCharge}`, onRemove: () => set("maxCharge", "") });
    if (filters.outstandingOnly)
      list.push({ key: "outstanding", label: "Outstanding only", onRemove: () => set("outstandingOnly", false) });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, payers, clients]);

  // Financial totals for the current result set.
  const totals = useMemo(() => {
    const billed = claims.reduce((s, c) => s + Number(c.chargeAmount), 0);
    const collected = claims.reduce((s, c) => s + Number(c.payerPaidAmount), 0);
    const outstanding = claims.reduce((s, c) => s + Number(c.balanceNeeded), 0);
    const rate = billed > 0 ? (collected / billed) * 100 : 0;
    return { billed, collected, outstanding, rate };
  }, [claims]);

  const updateClaim = (updated: Claim) =>
    setClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  // ── Bulk selection ────────────────────────────────────────────────────────
  const {
    selectedIds,
    ids: selectedIdList,
    allSelected,
    toggleOne,
    toggleAll,
    clear: clearSelection,
  } = useRowSelection(claims);
  const [bulkTarget, setBulkTarget] = useState<ClaimStatus | "">("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const canDelete = can("claims.delete");

  const applyBulk = async () => {
    if (!bulkTarget) return;
    const targets = claims.filter(
      (c) =>
        selectedIds.has(c.id) &&
        CLAIM_STATUS_TRANSITIONS[c.status].includes(bulkTarget),
    );
    if (targets.length === 0) {
      toast.warning("None of the selected claims can move to that status.");
      return;
    }
    setBulkBusy(true);
    let updated = 0;
    for (const claim of targets) {
      try {
        const result = await changeClaimStatus(claim.id, bulkTarget);
        updateClaim(result);
        updated++;
      } catch {
        // skip invalid transitions silently
      }
    }
    setBulkBusy(false);
    clearSelection();
    setBulkTarget("");
    toast.success(`Updated ${updated} of ${targets.length} selected claims.`);
  };

  // ── CSV export ────────────────────────────────────────────────────────────
  const exportCsv = () => {
    const headers = [
      "Reference","Client","Payer","Service Date","Date Billed",
      "Charge","Paid","Balance","Status","Last Activity",
    ];
    const rows = claims.map((c) => [
      c.claimReference,
      c.client?.displayName ?? "",
      c.payer?.name ?? "",
      formatDate(c.dateOfService),
      formatDate(c.dateBilled),
      c.chargeAmount,
      c.payerPaidAmount,
      c.balanceNeeded,
      c.status,
      c.updatedAt,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claims-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Claims"
        description="Track billed claims, payer payments, and outstanding balances."
      >
        {claims.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="size-3.5" /> Export CSV
          </Button>
        )}
        {can("claims.create") && (
          <Button onClick={() => setCreateOpen(true)}>New Claim</Button>
        )}
      </PageHeader>

      {/* Quick filter chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((qf) => {
          const active = qf.match(filters);
          return (
            <button
              key={qf.label}
              type="button"
              onClick={() =>
                setFilters(active ? EMPTY_FILTERS : qf.apply())
              }
              className={cn(
                "rounded-full border px-3 py-1 type-label-01 font-medium transition-colors duration-[var(--dur-fast-02)]",
                active
                  ? "border-interactive bg-interactive text-text-on-color"
                  : "border-border-subtle bg-background text-text-secondary hover:border-interactive hover:text-interactive",
              )}
            >
              {qf.label}
            </button>
          );
        })}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-interactive bg-highlight px-4 py-2.5">
          <span className="type-body-compact-01 font-medium text-text-primary">
            {selectedIds.size} selected
          </span>
          <select
            value={bulkTarget}
            onChange={(e) => setBulkTarget(e.target.value as ClaimStatus | "")}
            className="rounded border border-border-subtle bg-background px-2 py-1 type-body-compact-01 text-text-primary focus:outline-none focus:ring-1 focus:ring-interactive"
          >
            <option value="">Mark as…</option>
            {CLAIM_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!bulkTarget || bulkBusy}
            onClick={applyBulk}
          >
            {bulkBusy ? "Applying…" : "Apply"}
          </Button>
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              disabled={bulkBusy}
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" /> Delete
            </Button>
          )}
          <button
            type="button"
            onClick={clearSelection}
            className="ml-auto type-label-01 text-text-secondary hover:text-text-primary"
          >
            Clear selection
          </button>
        </div>
      )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search reference, external #, client…"
        activeCount={chips.length}
        chips={chips}
        onClearAll={() => setFilters(EMPTY_FILTERS)}
      >
        <FilterField label="Status">
          <Select
            value={filters.status}
            onValueChange={(v) => set("status", v as ClaimStatus | typeof ALL)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {CLAIM_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Payer">
          <Select value={filters.payerId} onValueChange={(v) => set("payerId", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All payers</SelectItem>
              {payers.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Client">
          <ClientCombobox
            clients={clients}
            value={filters.clientId}
            onChange={(id) => set("clientId", id)}
          />
        </FilterField>

        <FilterField label="Service date from">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set("dateFrom", e.target.value)}
          />
        </FilterField>

        <FilterField label="Service date to">
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set("dateTo", e.target.value)}
          />
        </FilterField>

        <FilterField label="Outstanding">
          <Select
            value={filters.outstandingOnly ? "outstanding" : "any"}
            onValueChange={(v) => set("outstandingOnly", v === "outstanding")}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="outstanding">Not yet paid</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Charge ≥ ($)">
          <Input
            type="number"
            min={0}
            inputMode="decimal"
            placeholder="0"
            value={filters.minCharge}
            onChange={(e) => set("minCharge", e.target.value)}
          />
        </FilterField>

        <FilterField label="Charge ≤ ($)">
          <Input
            type="number"
            min={0}
            inputMode="decimal"
            placeholder="No max"
            value={filters.maxCharge}
            onChange={(e) => set("maxCharge", e.target.value)}
          />
        </FilterField>
      </FilterBar>

      <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 pr-0">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="size-4 rounded-sm border-border-strong accent-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                />
              </TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Payer</TableHead>
              <TableHead>Service date</TableHead>
              <TableHead className="text-right">Charge</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Last activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={9} className="py-12 text-center text-text-secondary">
                  Loading…
                </TableCell>
              </TableRow>
            ) : claims.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={9} className="py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <Inbox className="size-8 text-text-secondary" aria-hidden />
                    <div className="space-y-1">
                      <p className="type-heading-02 text-text-primary">
                        {chips.length > 0 ? "No matching claims" : "No claims yet"}
                      </p>
                      <p className="type-body-01 text-text-secondary">
                        {chips.length > 0
                          ? "No claims match the current filters. Try clearing them."
                          : "Create your first claim to get started."}
                      </p>
                    </div>
                    {chips.length > 0 ? (
                      <Button variant="outline" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                        Clear filters
                      </Button>
                    ) : can("claims.create") ? (
                      <Button size="sm" onClick={() => setCreateOpen(true)}>
                        New Claim
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              claims.map((claim) => (
                <TableRow
                  key={claim.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/claims/${claim.id}`)}
                >
                  <TableCell className="w-10 pr-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${claim.claimReference}`}
                      checked={selectedIds.has(claim.id)}
                      onChange={() => toggleOne(claim.id)}
                      className="size-4 rounded-sm border-border-strong accent-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-text-primary">
                    {claim.claimReference}
                  </TableCell>
                  <TableCell>{claim.client?.displayName ?? "—"}</TableCell>
                  <TableCell>{claim.payer?.shortCode ?? "—"}</TableCell>
                  <TableCell className="text-text-secondary">
                    {formatDate(claim.dateOfService)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-text-primary">
                    {formatMoney(claim.chargeAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-text-primary">
                    {formatMoney(claim.payerPaidAmount)}
                  </TableCell>
                  <TableCell>
                    {can("claims.edit") ? (
                      <InlineStatusChange claim={claim} onChanged={updateClaim} />
                    ) : (
                      <StatusBadge status={claim.status} />
                    )}
                  </TableCell>
                  <TableCell className="text-right type-label-01 text-text-secondary">
                    {timeAgo(claim.updatedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Financial summary footer */}
        {!loading && claims.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-1 border-t border-border-subtle bg-layer px-4 py-2.5">
            <span className="type-label-01 text-text-secondary">
              {claims.length} claim{claims.length === 1 ? "" : "s"}
            </span>
            <span className="type-label-01 text-text-secondary">
              Billed:{" "}
              <span className="font-mono font-medium text-text-primary tabular-nums">
                {formatMoney(totals.billed)}
              </span>
            </span>
            <span className="type-label-01 text-text-secondary">
              Collected:{" "}
              <span className="font-mono font-medium text-support-success tabular-nums">
                {formatMoney(totals.collected)}
              </span>
            </span>
            <span className="type-label-01 text-text-secondary">
              Outstanding:{" "}
              <span className="font-mono font-medium text-interactive tabular-nums">
                {formatMoney(totals.outstanding)}
              </span>
            </span>
            <span className="ml-auto type-label-01 text-text-secondary">
              Rate:{" "}
              <span className="font-medium text-text-primary">
                {totals.rate.toFixed(1)}%
              </span>
            </span>
          </div>
        )}
      </div>

      <ClaimFormPanel
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSaved={(claim) => router.push(`/claims/${claim.id}`)}
      />

      <BulkDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        type="claim"
        ids={selectedIdList}
        noun="claim"
        onDone={() => {
          clearSelection();
          load(search, filters);
        }}
      />
    </div>
  );
}
