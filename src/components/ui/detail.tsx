import * as React from "react";

import { cn } from "@/lib/utils";

/** A clean titled section card for detail pages (Carbon tile). See design/09 §4. */
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
        "overflow-hidden rounded-md border border-border-subtle bg-card",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="type-heading-02 text-text-primary">{title}</h2>
          {subtitle && (
            <p className="truncate type-label-01 text-text-secondary">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </header>
      <div className={cn("px-5 py-3", bodyClassName)}>{children}</div>
    </section>
  );
}

export function DataList({ children }: { children: React.ReactNode }) {
  return <dl className="divide-y divide-border-subtle">{children}</dl>;
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
    <div className="flex items-baseline justify-between gap-4 py-2.5 type-body-compact-01">
      <dt className="shrink-0 text-text-secondary">{label}</dt>
      <dd
        className={cn(
          "min-w-0 text-end text-text-primary",
          mono && "font-mono tabular-nums",
          muted && "text-text-helper",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** A KPI tile — large number with an uppercase label (Carbon metric tile). */
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
      ? "text-support-success"
      : accent === "rose"
        ? "text-interactive"
        : "text-text-primary";
  return (
    <div className="rounded-md border border-border-subtle bg-card p-4">
      <p className="type-label-01 uppercase tracking-wider text-text-secondary">
        {label}
      </p>
      <p className={cn("mt-1.5 type-heading-04 tabular-nums", color)}>{value}</p>
      {hint && <p className="mt-0.5 type-label-01 text-text-helper">{hint}</p>}
    </div>
  );
}
