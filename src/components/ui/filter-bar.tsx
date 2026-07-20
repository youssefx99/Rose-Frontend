"use client";

import * as React from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import { useFormat } from "@/lib/i18n/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Number of active advanced filters (drives the count badge). */
  activeCount: number;
  /** Active filters rendered as removable chips below the bar. */
  chips: ActiveFilterChip[];
  onClearAll: () => void;
  /** Advanced filter controls, shown when the panel is expanded. */
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  activeCount,
  chips,
  onClearAll,
  children,
  className,
}: FilterBarProps) {
  const t = useT();
  const { formatNumber } = useFormat();
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder={searchPlaceholder ?? t("common.searchPlaceholder")}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="max-w-sm flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={cn("gap-2", open && "bg-layer")}
        >
          <SlidersHorizontal className="size-4" />
          {t("common.filters")}
          {activeCount > 0 && (
            <span className="ms-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-interactive px-1 type-label-01 tabular-nums text-text-on-color">
              {formatNumber(activeCount)}
            </span>
          )}
        </Button>
      </div>

      {open && (
        <div className="rounded-md border border-border-subtle bg-layer p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-border-subtle pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              disabled={activeCount === 0}
            >
              {t("common.clearAll")}
            </Button>
            <Button type="button" size="sm" onClick={() => setOpen(false)}>
              {t("common.done")}
            </Button>
          </div>
        </div>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-card py-1 pe-1 ps-2.5 type-label-01 text-text-secondary"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={t("ui.filterBar.removeFilter", { label: chip.label })}
                className="inline-flex size-4 items-center justify-center rounded-full text-icon-secondary transition-colors hover:bg-layer-hover hover:text-icon-primary"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="type-label-01 font-medium text-link transition-colors hover:text-link-hover hover:underline"
          >
            {t("common.clearAll")}
          </button>
        </div>
      )}
    </div>
  );
}

/** Labeled wrapper for a single advanced-filter control. */
export function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <span className="block type-label-01 text-text-secondary">{label}</span>
      {children}
    </div>
  );
}
