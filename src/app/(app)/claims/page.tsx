"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
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
} from "@/lib/claims";
import { useAuth } from "@/lib/auth-context";

const ALL = "__all__";

export default function ClaimsPage() {
  const router = useRouter();
  const { can } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ClaimStatus | typeof ALL>(ALL);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(
    async (term: string, statusFilter: ClaimStatus | typeof ALL) => {
      setLoading(true);
      try {
        const { data } = await listClaims({
          search: term || undefined,
          status: statusFilter === ALL ? undefined : statusFilter,
        });
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
    const timer = setTimeout(() => load(search, status), 300);
    return () => clearTimeout(timer);
  }, [search, status, load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-950">Claims</h1>
        {can("claims.create") && (
          <Button onClick={() => setCreateOpen(true)}>New Claim</Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search reference, external #, client…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
        <Select
          value={status}
          onValueChange={(value) =>
            setStatus(value as ClaimStatus | typeof ALL)
          }
        >
          <SelectTrigger className="w-44">
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
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
              <TableHead>Reference</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Payer</TableHead>
              <TableHead>Service Dates</TableHead>
              <TableHead className="text-right">Charge</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : claims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                    {formatDate(claim.serviceDateStart)} –{" "}
                    {formatDate(claim.serviceDateEnd)}
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
