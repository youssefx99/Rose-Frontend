import * as React from "react";

import { cn } from "@/lib/utils";

/** A clean panel for a dashboard section: title, optional subtitle + action. */
export function Panel({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border-subtle bg-card p-6",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="type-heading-02 text-text-primary">{title}</h2>
          {subtitle && (
            <p className="type-label-01 text-text-secondary">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Legend({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-4">
      {items.map((i) => (
        <span
          key={i.label}
          className="flex items-center gap-2 type-label-01 text-text-secondary"
        >
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: i.color }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export function Empty({ label }: { label: string }) {
  return (
    <p className="py-8 text-center type-body-01 text-text-secondary">{label}</p>
  );
}
