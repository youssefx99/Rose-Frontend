"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

interface ColumnPrefs {
  /** Column keys in display order. Unknown keys are ignored on read. */
  order: string[];
  /** Per-column header override; absent = use the translated default. */
  labels: Record<string, string>;
}

const EMPTY: ColumnPrefs = { order: [], labels: {} };

const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Rearranging columns in one tab should not leave another tab stale.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function parse(raw: string | null): ColumnPrefs {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as Partial<ColumnPrefs>;
    return {
      order: Array.isArray(parsed.order) ? parsed.order : [],
      labels: parsed.labels ?? {},
    };
  } catch {
    return EMPTY;
  }
}

// useSyncExternalStore compares snapshots by identity, so the same stored string
// must keep yielding the same object or every render would loop.
const cache = new Map<string, { raw: string | null; value: ColumnPrefs }>();

function snapshot(storageKey: string): ColumnPrefs {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(storageKey);
  } catch {
    return EMPTY;
  }
  const cached = cache.get(storageKey);
  if (cached && cached.raw === raw) return cached.value;
  const value = parse(raw);
  cache.set(storageKey, { raw, value });
  return value;
}

/**
 * Column order and header names the user arranges from inside the table itself
 * (drag a header to move it, rename it in place). Kept per browser — this is a
 * view preference, not ledger data.
 */
export function useTableColumns(storageKey: string, defaultOrder: string[]) {
  const prefs = useSyncExternalStore(
    subscribe,
    () => snapshot(storageKey),
    () => EMPTY,
  );

  const save = useCallback(
    (next: ColumnPrefs) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Preference-only: a full or blocked store must not break the table.
      }
      listeners.forEach((notify) => notify());
    },
    [storageKey],
  );

  // Saved order wins, but new columns still appear and removed ones drop out.
  const order = useMemo(() => {
    const saved = prefs.order.filter((key) => defaultOrder.includes(key));
    return [...saved, ...defaultOrder.filter((key) => !saved.includes(key))];
  }, [prefs.order, defaultOrder]);

  const move = useCallback(
    (fromKey: string, toKey: string) => {
      if (fromKey === toKey) return;
      const next = order.filter((key) => key !== fromKey);
      next.splice(next.indexOf(toKey), 0, fromKey);
      save({ ...prefs, order: next });
    },
    [order, prefs, save],
  );

  const rename = useCallback(
    (key: string, label: string) => {
      const labels = { ...prefs.labels };
      // An empty name means "go back to the default", not a blank header.
      if (label.trim()) labels[key] = label.trim();
      else delete labels[key];
      save({ ...prefs, order, labels });
    },
    [order, prefs, save],
  );

  return { order, labels: prefs.labels, move, rename };
}
