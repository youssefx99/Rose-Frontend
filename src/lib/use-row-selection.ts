import { useCallback, useMemo, useState } from "react";

/**
 * Multi-row table selection keyed by row id. Selection auto-clears whenever the
 * underlying rows change (e.g. after a search/filter reload) so stale ids never
 * survive into a different result set. The reset happens during render via the
 * React-recommended "store previous prop" pattern rather than an effect, so it
 * costs no extra render pass.
 */
export function useRowSelection<T extends { id: string }>(rows: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [prevRows, setPrevRows] = useState(rows);
  if (rows !== prevRows) {
    setPrevRows(rows);
    setSelectedIds(new Set());
  }

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)),
    );
  }, [rows]);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;
  const ids = useMemo(() => [...selectedIds], [selectedIds]);

  return { selectedIds, ids, allSelected, toggleOne, toggleAll, clear };
}
