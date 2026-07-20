"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Download, Inbox, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, getStatusColorClasses } from "@/components/ui/status-badge";
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
  claimOutstanding,
  CLAIM_STATUSES,
  CLAIM_STATUS_TRANSITIONS,
  CLOSED_STATUSES,
  type Claim,
  type ClaimStatus,
  type ClaimQuery,
} from "@/lib/claims";
import {
  COUNTDOWN_CLASS,
  countdownTone,
  followUpDaysLeft,
} from "@/lib/claim-countdown";
import { listPayers, type Payer } from "@/lib/payers";
import { listClients, type Client } from "@/lib/clients";
import { useFormat } from "@/lib/i18n/format";
import { useT, useLocale } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth-context";
import { useRowSelection } from "@/lib/use-row-selection";
import { useTableColumns } from "@/lib/use-table-columns";
import { EditableColumnHead } from "@/components/ui/editable-column-head";
import { cn } from "@/lib/utils";

const ALL = "__all__";

// Default left-to-right order. The user rearranges and renames these from the
// header row itself; their arrangement is remembered per browser.
const COLUMN_KEYS = [
  "reference",
  "client",
  "payer",
  "serviceDate",
  "charge",
  "paid",
  "bankDate",
  "status",
  "countdown",
  "lastActivity",
];

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
  const t = useT();
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
        placeholder={selected ? selected.displayName : t("claims.filter.allClients")}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <ul className="absolute start-0 top-full z-50 mt-1 max-h-52 w-full min-w-[200px] overflow-y-auto rounded-md border border-border-subtle bg-card shadow-lg">
          <li
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onChange(ALL); setOpen(false); setQuery(""); }}
            className={cn(
              "cursor-pointer px-3 py-2 type-body-compact-01 hover:bg-layer-hover",
              value === ALL ? "font-medium text-text-primary" : "text-text-secondary",
            )}
          >
            {t("claims.filter.allClients")}
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
              {t("claims.filter.noClientsFound")}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/**
 * Days the payer has left to pay before billing chases them, counted from the
 * date the claim was billed. Closed claims have no clock left to run.
 */
function FollowUpCountdown({ claim }: { claim: Claim }) {
  const t = useT();
  const { formatDate, formatNumber } = useFormat();

  if (CLOSED_STATUSES.includes(claim.status)) {
    return <span className="text-text-secondary">{t("common.emDash")}</span>;
  }

  const daysLeft = followUpDaysLeft(claim.dateBilled);
  return (
    <span
      title={t("claims.countdown.tooltip", {
        date: formatDate(claim.dateBilled),
      })}
      className={cn(
        "rounded-full px-2 py-0.5 type-label-01 font-medium tabular-nums ring-1 ring-inset",
        COUNTDOWN_CLASS[countdownTone(daysLeft)],
      )}
    >
      {daysLeft > 0
        ? t("claims.countdown.daysLeft", { formatted: formatNumber(daysLeft) })
        : t("claims.countdown.daysOver", {
            formatted: formatNumber(-daysLeft),
          })}
    </span>
  );
}

/** Inline status menu — any status, any time. Stops row click propagation. */
function InlineStatusChange({
  claim,
  onChanged,
}: {
  claim: Claim;
  onChanged: (c: Claim) => void;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  const go = async (target: ClaimStatus) => {
    setBusy(true);
    try {
      const updated = await changeClaimStatus(claim.id, target);
      onChanged(updated);
      toast.success(
        t("claims.toast.markedStatus", { status: t(`status.${target}`) }),
      );
    } catch {
      toast.error(t("claims.toast.statusUpdateFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <select
        disabled={busy}
        value={claim.status}
        aria-label={t("claims.a11y.changeStatus")}
        className={cn(
          "type-label-01 w-fit rounded-full border-0 px-2 py-0.5 whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-interactive disabled:opacity-50",
          getStatusColorClasses(claim.status),
        )}
        onChange={(e) => go(e.target.value as ClaimStatus)}
      >
        {CLAIM_STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`status.${s}`)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ClaimsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const { dir } = useLocale();
  const { formatMoney, formatDate, timeAgo } = useFormat();
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
      toast.error(t("claims.toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timer = setTimeout(() => load(search, filters), 300);
    return () => clearTimeout(timer);
  }, [search, filters, load]);

  const payerName = (id: string) => payers.find((p) => p.id === id)?.name ?? t("claims.field.payer");
  const clientName = (id: string) => clients.find((c) => c.id === id)?.displayName ?? t("claims.field.client");

  const chips = useMemo<ActiveFilterChip[]>(() => {
    const list: ActiveFilterChip[] = [];
    if (filters.status !== ALL)
      list.push({ key: "status", label: t(`status.${filters.status}`), onRemove: () => set("status", ALL) });
    if (filters.payerId !== ALL)
      list.push({ key: "payer", label: payerName(filters.payerId), onRemove: () => set("payerId", ALL) });
    if (filters.clientId !== ALL)
      list.push({ key: "client", label: clientName(filters.clientId), onRemove: () => set("clientId", ALL) });
    if (filters.dateFrom)
      list.push({ key: "dateFrom", label: t("claims.chip.dateFrom", { date: filters.dateFrom }), onRemove: () => set("dateFrom", "") });
    if (filters.dateTo)
      list.push({ key: "dateTo", label: t("claims.chip.dateTo", { date: filters.dateTo }), onRemove: () => set("dateTo", "") });
    if (filters.minCharge)
      list.push({ key: "minCharge", label: t("claims.chip.minCharge", { value: filters.minCharge }), onRemove: () => set("minCharge", "") });
    if (filters.maxCharge)
      list.push({ key: "maxCharge", label: t("claims.chip.maxCharge", { value: filters.maxCharge }), onRemove: () => set("maxCharge", "") });
    if (filters.outstandingOnly)
      list.push({ key: "outstanding", label: t("claims.chip.outstandingOnly"), onRemove: () => set("outstandingOnly", false) });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, payers, clients, t]);

  // Financial totals for the current result set.
  const totals = useMemo(() => {
    const billed = claims.reduce((s, c) => s + Number(c.chargeAmount), 0);
    const collected = claims.reduce((s, c) => s + Number(c.payerPaidAmount), 0);
    const outstanding = claims.reduce((s, c) => s + claimOutstanding(c), 0);
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
      toast.warning(t("claims.toast.bulkNoValidTargets"));
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
    toast.success(
      t("claims.toast.bulkUpdated", { updated, total: targets.length }),
    );
  };

  // ── Columns ───────────────────────────────────────────────────────────────
  const { order, labels, move, rename } = useTableColumns(
    "claims.columns",
    COLUMN_KEYS,
  );

  const columns: Record<
    string,
    {
      label: string;
      className?: string;
      cellClassName?: string;
      cell: (c: Claim) => ReactNode;
      csv: (c: Claim) => string;
    }
  > = {
    reference: {
      label: t("claims.field.reference"),
      cellClassName: "font-mono text-text-primary",
      cell: (c) => c.claimReference,
      csv: (c) => c.claimReference,
    },
    client: {
      label: t("claims.field.client"),
      cell: (c) => c.client?.displayName ?? t("common.emDash"),
      csv: (c) => c.client?.displayName ?? "",
    },
    payer: {
      label: t("claims.field.payer"),
      cell: (c) => c.payer?.shortCode ?? t("common.emDash"),
      csv: (c) => c.payer?.name ?? "",
    },
    serviceDate: {
      label: t("claims.field.serviceDate"),
      cellClassName: "text-text-secondary",
      cell: (c) => formatDate(c.dateOfService),
      csv: (c) => c.dateOfService.slice(0, 10),
    },
    charge: {
      label: t("claims.field.charge"),
      className: "text-end",
      cellClassName: "font-mono tabular-nums text-text-primary",
      cell: (c) => formatMoney(c.chargeAmount),
      csv: (c) => c.chargeAmount,
    },
    paid: {
      label: t("claims.field.paid"),
      className: "text-end",
      cellClassName: "font-mono tabular-nums text-text-primary",
      cell: (c) => formatMoney(c.payerPaidAmount),
      csv: (c) => c.payerPaidAmount,
    },
    bankDate: {
      label: t("claims.field.dateOfBank"),
      cellClassName: "text-text-secondary",
      cell: (c) => (c.bankDate ? formatDate(c.bankDate) : t("common.emDash")),
      csv: (c) => c.bankDate ?? "",
    },
    status: {
      label: t("common.status"),
      cell: (c) =>
        can("claims.edit") ? (
          <InlineStatusChange claim={c} onChanged={updateClaim} />
        ) : (
          <StatusBadge status={c.status} />
        ),
      csv: (c) => c.status,
    },
    countdown: {
      label: t("claims.field.countdown"),
      cell: (c) => <FollowUpCountdown claim={c} />,
      csv: (c) => c.dateBilled.slice(0, 10),
    },
    lastActivity: {
      label: t("claims.field.lastActivity"),
      className: "text-end",
      cellClassName: "type-label-01 text-text-secondary",
      cell: (c) => timeAgo(c.updatedAt),
      csv: (c) => c.updatedAt,
    },
  };

  // ── CSV export ────────────────────────────────────────────────────────────
  const exportCsv = () => {
    const headers = order.map((key) => labels[key] ?? columns[key].label);
    const rows = claims.map((c) => order.map((key) => columns[key].csv(c)));
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
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
        title={t("claims.title")}
        description={t("claims.description")}
      >
        {claims.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="size-3.5" /> {t("claims.action.exportCsv")}
          </Button>
        )}
        {can("claims.create") && (
          <Button onClick={() => setCreateOpen(true)}>
            {t("claims.action.newClaim")}
          </Button>
        )}
      </PageHeader>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-interactive bg-highlight px-4 py-2.5">
          <span className="type-body-compact-01 font-medium text-text-primary">
            {t("common.selectedCount", { count: selectedIds.size })}
          </span>
          <select
            value={bulkTarget}
            onChange={(e) => setBulkTarget(e.target.value as ClaimStatus | "")}
            className="rounded border border-border-subtle bg-background px-2 py-1 type-body-compact-01 text-text-primary focus:outline-none focus:ring-1 focus:ring-interactive"
          >
            <option value="">{t("claims.bulk.markAs")}</option>
            {CLAIM_STATUSES.map((s) => (
              <option key={s} value={s}>{t(`status.${s}`)}</option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!bulkTarget || bulkBusy}
            onClick={applyBulk}
          >
            {bulkBusy ? t("claims.bulk.applying") : t("common.apply")}
          </Button>
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              disabled={bulkBusy}
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" /> {t("common.delete")}
            </Button>
          )}
          <button
            type="button"
            onClick={clearSelection}
            className="ms-auto type-label-01 text-text-secondary hover:text-text-primary"
          >
            {t("claims.bulk.clearSelection")}
          </button>
        </div>
      )}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("claims.filter.searchPlaceholder")}
        activeCount={chips.length}
        chips={chips}
        onClearAll={() => setFilters(EMPTY_FILTERS)}
      >
        <FilterField label={t("common.status")}>
          <Select
            dir={dir}
            value={filters.status}
            onValueChange={(v) => set("status", v as ClaimStatus | typeof ALL)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("claims.filter.allStatuses")}</SelectItem>
              {CLAIM_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label={t("claims.field.payer")}>
          <Select dir={dir} value={filters.payerId} onValueChange={(v) => set("payerId", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("claims.filter.allPayers")}</SelectItem>
              {payers.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label={t("claims.field.client")}>
          <ClientCombobox
            clients={clients}
            value={filters.clientId}
            onChange={(id) => set("clientId", id)}
          />
        </FilterField>

        <FilterField label={t("claims.filter.serviceDateFrom")}>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set("dateFrom", e.target.value)}
          />
        </FilterField>

        <FilterField label={t("claims.filter.serviceDateTo")}>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set("dateTo", e.target.value)}
          />
        </FilterField>

        <FilterField label={t("claims.filter.outstanding")}>
          <Select
            dir={dir}
            value={filters.outstandingOnly ? "outstanding" : "any"}
            onValueChange={(v) => set("outstandingOnly", v === "outstanding")}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{t("claims.filter.any")}</SelectItem>
              <SelectItem value="outstanding">{t("claims.filter.notYetPaid")}</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label={t("claims.filter.chargeMin")}>
          <Input
            type="number"
            min={0}
            inputMode="decimal"
            placeholder="0"
            value={filters.minCharge}
            onChange={(e) => set("minCharge", e.target.value)}
          />
        </FilterField>

        <FilterField label={t("claims.filter.chargeMax")}>
          <Input
            type="number"
            min={0}
            inputMode="decimal"
            placeholder={t("claims.filter.noMax")}
            value={filters.maxCharge}
            onChange={(e) => set("maxCharge", e.target.value)}
          />
        </FilterField>
      </FilterBar>

      <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 pe-0">
                <input
                  type="checkbox"
                  aria-label={t("common.selectAll")}
                  checked={allSelected}
                  onChange={toggleAll}
                  className="size-4 rounded-sm border-border-strong accent-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                />
              </TableHead>
              {order.map((key) => (
                <EditableColumnHead
                  key={key}
                  columnKey={key}
                  label={labels[key] ?? columns[key].label}
                  title={t("claims.columns.hint")}
                  className={columns[key].className}
                  onMove={move}
                  onRename={rename}
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={order.length + 1} className="py-12 text-center text-text-secondary">
                  {t("common.loading")}
                </TableCell>
              </TableRow>
            ) : claims.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={order.length + 1} className="py-16">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <Inbox className="size-8 text-text-secondary" aria-hidden />
                    <div className="space-y-1">
                      <p className="type-heading-02 text-text-primary">
                        {chips.length > 0
                          ? t("claims.empty.noMatchTitle")
                          : t("claims.empty.title")}
                      </p>
                      <p className="type-body-01 text-text-secondary">
                        {chips.length > 0
                          ? t("claims.empty.noMatchDescription")
                          : t("claims.empty.description")}
                      </p>
                    </div>
                    {chips.length > 0 ? (
                      <Button variant="outline" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                        {t("common.clearFilters")}
                      </Button>
                    ) : can("claims.create") ? (
                      <Button size="sm" onClick={() => setCreateOpen(true)}>
                        {t("claims.action.newClaim")}
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
                  <TableCell className="w-10 pe-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={t("claims.a11y.selectRow", { reference: claim.claimReference })}
                      checked={selectedIds.has(claim.id)}
                      onChange={() => toggleOne(claim.id)}
                      className="size-4 rounded-sm border-border-strong accent-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    />
                  </TableCell>
                  {order.map((key) => (
                    <TableCell
                      key={key}
                      className={cn(
                        columns[key].className,
                        columns[key].cellClassName,
                      )}
                    >
                      {columns[key].cell(claim)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Financial summary footer */}
        {!loading && claims.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-1 border-t border-border-subtle bg-layer px-4 py-2.5">
            <span className="type-label-01 text-text-secondary">
              {t("claims.claimCount", { count: claims.length })}
            </span>
            <span className="type-label-01 text-text-secondary">
              {t("claims.footer.billed")}{" "}
              <span className="font-mono font-medium text-text-primary tabular-nums">
                {formatMoney(totals.billed)}
              </span>
            </span>
            <span className="type-label-01 text-text-secondary">
              {t("claims.footer.collected")}{" "}
              <span className="font-mono font-medium text-support-success tabular-nums">
                {formatMoney(totals.collected)}
              </span>
            </span>
            <span className="type-label-01 text-text-secondary">
              {t("claims.footer.outstanding")}{" "}
              <span className="font-mono font-medium text-interactive tabular-nums">
                {formatMoney(totals.outstanding)}
              </span>
            </span>
            <span className="ms-auto type-label-01 text-text-secondary">
              {t("claims.footer.rate")}{" "}
              <span className="font-medium text-text-primary tabular-nums">
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
