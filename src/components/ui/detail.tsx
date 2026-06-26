import * as React from "react";

import { cn } from "@/lib/utils";

/** A clean titled section card for detail pages. */
export function Section({
  title,
  subtitle,
  action,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {subtitle && (
            <p className="truncate text-xs text-zinc-500">{subtitle}</p>
          )}
        </div>
        {action}
      </header>
      <div className={cn("px-5 py-3", bodyClassName)}>{children}</div>
    </section>
  );
}

export function DataList({ children }: { children: React.ReactNode }) {
  return <dl className="divide-y divide-zinc-100">{children}</dl>;
}

export function DataRow({
  label,
  value,
  mono = false,
  muted = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-zinc-500">{label}</dt>
      <dd
        className={cn(
          "min-w-0 text-right text-zinc-900",
          mono && "font-mono tabular-nums",
          muted && "text-zinc-400",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** A KPI tile — large mono number with an uppercase label. */
export function Stat({
  label,
  value,
  accent = "default",
  hint,
}: {
  label: string;
  value: string;
  accent?: "default" | "green" | "rose";
  hint?: string;
}) {
  const color =
    accent === "green"
      ? "text-emerald-600"
      : accent === "rose"
        ? "text-rose-600"
        : "text-zinc-950";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-mono text-2xl font-semibold tabular-nums",
          color,
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
