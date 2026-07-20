"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { useLocale } from "@/lib/i18n/provider";
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
  const { isRtl } = useLocale();
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
        className="mb-3 flex w-full items-center gap-2 type-label-01 font-medium uppercase tracking-wider text-text-secondary transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      >
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            open ? "" : isRtl ? "rotate-90" : "-rotate-90",
          )}
        />
        <span>{title}</span>
        {summary && (
          <span className="ms-auto font-mono text-text-helper normal-case tracking-normal">
            {summary}
          </span>
        )}
      </button>
      {open && children}
    </section>
  );
}
