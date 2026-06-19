"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  /** Stable id used to persist the open/closed state. */
  id: string;
  title: string;
  /** Optional right-aligned summary shown when collapsed (e.g. a key number). */
  summary?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * A titled dashboard section that collapses on click and remembers its state.
 * One component drives all collapsibility — keeps the page flat and manageable.
 */
export function CollapsibleSection({
  id,
  title,
  summary,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const storageKey = `rose-dash-${id}`;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) setOpen(stored === "1");
  }, [storageKey]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, next ? "1" : "0");
      return next;
    });
  };

  return (
    <section className="mt-6 first:mt-0">
      <button
        type="button"
        onClick={toggle}
        className="mb-3 flex w-full items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-800"
      >
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            open ? "" : "-rotate-90",
          )}
        />
        <span>{title}</span>
        {summary && (
          <span className="ml-auto font-mono text-zinc-400 normal-case tracking-normal">
            {summary}
          </span>
        )}
      </button>
      {open && children}
    </section>
  );
}
