"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  statusVariant,
  CLAIM_STATUSES,
  type Claim,
  type ClaimStatus,
} from "@/lib/claims";

const ALL = "__all__";

export default function ClaimsPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ClaimStatus | typeof ALL>(ALL);
  const [loading, setLoading] = useState(true);

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
        <h1 className="text-2xl font-semibold tracking-tight">Claims</h1>
        <Button asChild>
          <Link href="/claims/new">New Claim</Link>
        </Button>
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

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
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
                  <TableCell className="font-medium">
                    {claim.claimReference}
                  </TableCell>
                  <TableCell>{claim.client?.displayName ?? "—"}</TableCell>
                  <TableCell>{claim.payer?.shortCode ?? "—"}</TableCell>
                  <TableCell>
                    {formatDate(claim.serviceDateStart)} –{" "}
                    {formatDate(claim.serviceDateEnd)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(claim.chargeAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(claim.payerPaidAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(claim.status)}>
                      {claim.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
