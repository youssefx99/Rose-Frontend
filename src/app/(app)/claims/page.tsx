"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
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
  formatMoney,
  formatDate,
  CLAIM_STATUSES,
  type Claim,
  type ClaimStatus,
  type ClaimQuery,
} from "@/lib/claims";
import { listPayers, type Payer } from "@/lib/payers";
import { useAuth } from "@/lib/auth-context";

const ALL = "__all__";

type PayToPatient = "all" | "yes" | "no";

interface AdvancedFilters {
  status: ClaimStatus | typeof ALL;
  payerId: string | typeof ALL;
  dateFrom: string;
  dateTo: string;
  minCharge: string;
  maxCharge: string;
  payToPatient: PayToPatient;
  outstandingOnly: boolean;
}

const EMPTY_FILTERS: AdvancedFilters = {
  status: ALL,
  payerId: ALL,
  dateFrom: "",
  dateTo: "",
  minCharge: "",
  maxCharge: "",
  payToPatient: "all",
  outstandingOnly: false,
};

export default function ClaimsPage() {
  const router = useRouter();
  const { can } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdvancedFilters>(EMPTY_FILTERS);
  const [payers, setPayers] = useState<Payer[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  // Payer options for the filter dropdown.
  useEffect(() => {
    listPayers()
      .then(({ data }) => setPayers(data))
      .catch(() => undefined);
  }, []);

  const set = useCallback(
    <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) =>
      setFilters((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const load = useCallback(
    async (term: string, f: AdvancedFilters) => {
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
          payToPatient:
            f.payToPatient === "all" ? undefined : f.payToPatient === "yes",
          outstandingOnly: f.outstandingOnly || undefined,
        };
        const { data } = await listClaims(query);
        setClaims(data);
      } catch {
        toast.error("Failed to load claims.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => load(search, filters), 300);
    return () => clearTimeout(timer);
  }, [search, filters, load]);

  const payerName = (id: string) =>
    payers.find((p) => p.id === id)?.name ?? "Payer";

  // Active-filter chips + count (status counts when it's a real constraint).
  const chips = useMemo<ActiveFilterChip[]>(() => {
    const list: ActiveFilterChip[] = [];
    if (filters.status !== ALL)
      list.push({
        key: "status",
        label: filters.status,
        onRemove: () => set("status", ALL),
      });
    if (filters.payerId !== ALL)
      list.push({
        key: "payer",
        label: payerName(filters.payerId),
        onRemove: () => set("payerId", ALL),
      });
    if (filters.dateFrom)
      list.push({
        key: "dateFrom",
        label: `From ${filters.dateFrom}`,
        onRemove: () => set("dateFrom", ""),
      });
    if (filters.dateTo)
      list.push({
        key: "dateTo",
        label: `To ${filters.dateTo}`,
        onRemove: () => set("dateTo", ""),
      });
    if (filters.minCharge)
      list.push({
        key: "minCharge",
        label: `Charge ≥ ${filters.minCharge}`,
        onRemove: () => set("minCharge", ""),
      });
    if (filters.maxCharge)
      list.push({
        key: "maxCharge",
        label: `Charge ≤ ${filters.maxCharge}`,
        onRemove: () => set("maxCharge", ""),
      });
    if (filters.payToPatient !== "all")
      list.push({
        key: "payToPatient",
        label: `Pay to patient: ${filters.payToPatient}`,
        onRemove: () => set("payToPatient", "all"),
      });
    if (filters.outstandingOnly)
      list.push({
        key: "outstanding",
        label: "Outstanding only",
        onRemove: () => set("outstandingOnly", false),
      });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, payers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Claims</h1>
        {can("claims.create") && (
          <Button onClick={() => setCreateOpen(true)}>New Claim</Button>
        )}
      </div>

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
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Payer">
          <Select
            value={filters.payerId}
            onValueChange={(v) => set("payerId", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All payers</SelectItem>
              {payers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Pay to patient">
          <Select
            value={filters.payToPatient}
            onValueChange={(v) => set("payToPatient", v as PayToPatient)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
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
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              <TableHead>Reference</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Payer</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Date of Service</TableHead>
              <TableHead className="text-right">Charge</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No claims found.
                </TableCell>
              </TableRow>
            ) : (
              claims.map((claim) => (
                <TableRow
                  key={claim.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/claims/${claim.id}`)}
                >
                  <TableCell className="font-mono text-xs text-zinc-900">
                    {claim.claimReference}
                  </TableCell>
                  <TableCell className="text-zinc-700">
                    {claim.client?.displayName ?? "—"}
                  </TableCell>
                  <TableCell className="text-zinc-700">
                    {claim.payer?.shortCode ?? "—"}
                  </TableCell>
                  <TableCell className="text-zinc-600">
                    {claim.payer?.state ?? "—"}
                  </TableCell>
                  <TableCell className="text-zinc-600">
                    {formatDate(claim.dateOfService)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-zinc-900">
                    {formatMoney(claim.chargeAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-zinc-900">
                    {formatMoney(claim.payerPaidAmount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={claim.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClaimFormPanel
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSaved={(claim) => router.push(`/claims/${claim.id}`)}
      />
    </div>
  );
}
