"use client";

import * as React from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";
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
  searchPlaceholder = "Search…",
  activeCount,
  chips,
  onClearAll,
  children,
  className,
}: FilterBarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="max-w-sm flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={cn("gap-2", open && "bg-zinc-50")}
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-medium tabular-nums text-white">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {open && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-zinc-200 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              disabled={activeCount === 0}
            >
              Clear all
            </Button>
            <Button type="button" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white py-1 pl-2.5 pr-1 text-xs text-zinc-700 shadow-sm"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove ${chip.label}`}
                className="inline-flex size-4 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-rose-600 transition-colors hover:text-rose-700 hover:underline"
          >
            Clear all
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
      <span className="block text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </div>
  );
}
