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
        "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
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
          className="flex items-center gap-1.5 text-xs text-zinc-500"
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

export function Empty({ label = "No data yet" }: { label?: string }) {
  return <p className="py-8 text-center text-sm text-zinc-400">{label}</p>;
}
