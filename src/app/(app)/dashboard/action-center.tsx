"use client";

import Link from "next/link";
import { AlertCircle, Clock, Inbox, TrendingDown } from "lucide-react";

import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Dashboard } from "@/lib/dashboard";

type Color = "warning" | "error" | "info" | "muted";

interface ActionItem {
  icon: typeof Inbox;
  label: string;
  detail: string;
  href: string;
  color: Color;
}

const ICON_CLASS: Record<Color, string> = {
  warning: "text-support-warning",
  error:   "text-support-error",
  info:    "text-support-info",
  muted:   "text-text-secondary",
};
const RING_CLASS: Record<Color, string> = {
  warning: "border-support-warning   bg-support-warning-bg",
  error:   "border-support-error     bg-support-error-bg",
  info:    "border-support-info      bg-support-info-bg",
  muted:   "border-border-subtle     bg-layer",
};

function buildItems(data: Dashboard): ActionItem[] {
  const items: ActionItem[] = [];

  const byStatus = Object.fromEntries(
    data.claimsByStatus.map((s) => [s.status, s]),
  );

  if (data.pendingReviewCount > 0) {
    items.push({
      icon: Inbox,
      label: "Review queue",
      detail: `${data.pendingReviewCount} item${data.pendingReviewCount === 1 ? "" : "s"} pending approval`,
      href: "/review",
      color: "warning",
    });
  }

  const denied = byStatus["DENIED"];
  if (denied?.count > 0) {
    items.push({
      icon: AlertCircle,
      label: "Denied claims",
      detail: `${denied.count} claim${denied.count === 1 ? "" : "s"} · ${formatMoney(denied.charge)}`,
      href: "/claims?status=DENIED",
      color: "error",
    });
  }

  const appealed = byStatus["APPEALED"];
  if (appealed?.count > 0) {
    items.push({
      icon: TrendingDown,
      label: "Appealed — awaiting decision",
      detail: `${appealed.count} claim${appealed.count === 1 ? "" : "s"} · ${formatMoney(appealed.charge)}`,
      href: "/claims?status=APPEALED",
      color: "warning",
    });
  }

  const pending = byStatus["PENDING"];
  if (pending?.count > 0) {
    items.push({
      icon: Clock,
      label: "Pending payment",
      detail: `${pending.count} claim${pending.count === 1 ? "" : "s"} · ${formatMoney(pending.charge)}`,
      href: "/claims?status=PENDING",
      color: "info",
    });
  }

  const open = byStatus["OPEN"];
  if (open?.count > 0) {
    items.push({
      icon: Clock,
      label: "Open — not yet billed to payer",
      detail: `${open.count} claim${open.count === 1 ? "" : "s"} · ${formatMoney(open.charge)}`,
      href: "/claims?status=OPEN",
      color: "muted",
    });
  }

  return items;
}

export function ActionCenter({ data }: { data: Dashboard }) {
  const items = buildItems(data);
  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
      <header className="border-b border-border-subtle px-5 py-3.5">
        <h2 className="type-heading-02 text-text-primary">Today's Work</h2>
        <p className="type-label-01 text-text-secondary">
          Items that need your attention
        </p>
      </header>
      <ul className="divide-y divide-border-subtle">
        {items.map(({ icon: Icon, label, detail, href, color }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-[var(--dur-fast-02)] hover:bg-layer-hover"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border",
                  RING_CLASS[color],
                )}
                aria-hidden
              >
                <Icon className={cn("size-4", ICON_CLASS[color])} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="type-body-compact-01 font-medium text-text-primary">
                  {label}
                </p>
                <p className="type-label-01 text-text-secondary">{detail}</p>
              </div>
              <span className="shrink-0 type-label-01 text-text-helper" aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
