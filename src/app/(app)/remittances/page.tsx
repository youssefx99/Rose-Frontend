"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listRemittances, type Remittance } from "@/lib/remittances";
import { useT } from "@/lib/i18n/provider";
import { useFormat } from "@/lib/i18n/format";

interface PayerGroup {
  key: string;
  payerName: string;
  checks: Remittance[];
  lines: number;
  billed: number;
  paid: number;
  checkTotal: number;
}

/**
 * One row per payer, its checks nested underneath. A remittance IS a check, so
 * the individual rows stay — the check number is what reconciles a deposit
 * against the bank — but the payer's name is printed once, with its totals.
 */
function groupByPayer(rows: Remittance[]): PayerGroup[] {
  const groups = new Map<string, PayerGroup>();
  for (const r of rows) {
    const key = r.payer?.id ?? r.payer?.name ?? "—";
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        payerName: r.payer?.name ?? "—",
        checks: [],
        lines: 0,
        billed: 0,
        paid: 0,
        checkTotal: 0,
      };
      groups.set(key, group);
    }
    group.checks.push(r);
    group.lines += r._count?.claimLines ?? 0;
    group.billed += Number(r.billedAmount ?? 0);
    group.paid += Number(r.paidAmount ?? 0);
    group.checkTotal += Number(r.checkAmount);
  }
  return [...groups.values()].sort((a, b) => b.checkTotal - a.checkTotal);
}

export default function RemittancesPage() {
  const router = useRouter();
  const t = useT("remittances");
  const { formatDate, formatMoney, formatNumber, formatPercent } = useFormat();
  const [remittances, setRemittances] = useState<Remittance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await listRemittances();
        setRemittances(data);
      } catch {
        toast.error(t("toastLoadListFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tablePayer")}</TableHead>
              <TableHead>{t("tableCheckNumber")}</TableHead>
              <TableHead>{t("tableCheckDate")}</TableHead>
              <TableHead className="text-end">{t("tableLines")}</TableHead>
              <TableHead className="text-end">{t("tableCharged")}</TableHead>
              <TableHead className="text-end">{t("tableReceived")}</TableHead>
              <TableHead className="text-end">{t("tableReceivedPct")}</TableHead>
              <TableHead className="text-end">{t("tableCheckAmount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full animate-pulse rounded-sm bg-skeleton-background" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : remittances.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Receipt className="size-8 text-text-secondary" />
                    <p className="type-heading-02 text-text-primary">
                      {t("emptyTitle")}
                    </p>
                    <p className="type-body-01 text-text-secondary">
                      {t("emptyDescription")}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              groupByPayer(remittances).flatMap((g) => [
                <TableRow key={g.key} className="bg-layer hover:bg-layer">
                  <TableCell
                    colSpan={3}
                    className="type-heading-compact-01 text-text-primary"
                  >
                    {g.payerName}
                  </TableCell>
                  <TableCell className="text-end font-mono tabular-nums text-text-secondary">
                    {formatNumber(g.lines)}
                  </TableCell>
                  <TableCell className="text-end font-mono tabular-nums text-text-secondary">
                    {formatMoney(g.billed)}
                  </TableCell>
                  <TableCell className="text-end font-mono font-semibold tabular-nums text-support-success">
                    {formatMoney(g.paid)}
                  </TableCell>
                  <TableCell className="text-end font-mono tabular-nums text-text-primary">
                    {g.billed > 0 ? formatPercent(g.paid / g.billed) : "—"}
                  </TableCell>
                  <TableCell className="text-end font-mono font-semibold tabular-nums text-text-primary">
                    {formatMoney(g.checkTotal)}
                  </TableCell>
                </TableRow>,
                ...g.checks.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/remittances/${r.id}`)}
                >
                  <TableCell />
                  <TableCell className="font-mono text-xs text-text-secondary">
                    {r.checkNumber ?? "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {formatDate(r.checkDate)}
                  </TableCell>
                  <TableCell className="text-end font-mono tabular-nums text-text-secondary">
                    {formatNumber(r._count?.claimLines ?? 0)}
                  </TableCell>
                  <TableCell className="text-end font-mono tabular-nums text-text-secondary">
                    {formatMoney(r.billedAmount ?? 0)}
                  </TableCell>
                  <TableCell className="text-end font-mono tabular-nums text-support-success">
                    {formatMoney(r.paidAmount ?? 0)}
                  </TableCell>
                  <TableCell className="text-end font-mono tabular-nums text-text-primary">
                    {Number(r.billedAmount ?? 0) > 0
                      ? formatPercent(
                          Number(r.paidAmount ?? 0) / Number(r.billedAmount),
                        )
                      : "—"}
                  </TableCell>
                  <TableCell className="text-end font-mono tabular-nums text-text-primary">
                    {formatMoney(r.checkAmount)}
                  </TableCell>
                </TableRow>
                )),
              ])
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
