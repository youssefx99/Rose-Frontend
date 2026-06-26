"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import {
  cascadeDelete,
  getDeletionImpact,
  type DeletableType,
  type DeletionImpact,
  type ImpactAction,
} from "@/lib/deletion";

interface CascadeDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: DeletableType;
  /** Id of the record to delete; null closes/loads nothing. */
  id: string | null;
  /** Panel title, e.g. "Delete client". */
  title: string;
  /** Optional soft-delete action (e.g. Deactivate) for entities that support it. */
  onDeactivate?: () => Promise<void>;
  deactivateLabel?: string;
  /** Called after a successful action (refresh the list/page). */
  onDone: () => void;
}

const ACTION_VERB: Record<ImpactAction, string> = {
  delete: "deleted",
  revert: "reset to OPEN",
  unlink: "unlinked",
};
const ACTION_COLOR: Record<ImpactAction, string> = {
  delete: "text-support-error",
  revert: "text-support-caution",
  unlink: "text-text-secondary",
};

function errorMessage(error: unknown, fallback: string): string {
  return isAxiosError(error) && typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : fallback;
}

/**
 * Right-side confirmation that previews the FULL blast radius before deleting:
 * what is also permanently removed, and what is merely reverted/unlinked. The
 * user sees the exact totals, then deletes everything in one click.
 */
export function CascadeDeleteDialog({
  open,
  onOpenChange,
  type,
  id,
  title,
  onDeactivate,
  deactivateLabel = "Deactivate",
  onDone,
}: CascadeDeleteDialogProps) {
  const [impact, setImpact] = useState<DeletionImpact | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<"soft" | "hard" | null>(null);

  useEffect(() => {
    if (!open || !id) {
      setImpact(null);
      return;
    }
    let active = true;
    setLoading(true);
    getDeletionImpact(type, id)
      .then((data) => active && setImpact(data))
      .catch((error) => {
        toast.error(errorMessage(error, "Could not load deletion details."));
        onOpenChange(false);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, id, type, onOpenChange]);

  const run = async (kind: "soft" | "hard", action: () => Promise<void>) => {
    setBusy(kind);
    try {
      await action();
      toast.success(kind === "hard" ? "Deleted." : "Done.");
      onOpenChange(false);
      onDone();
    } catch (error) {
      toast.error(errorMessage(error, "Action failed."));
    } finally {
      setBusy(null);
    }
  };

  const deleteGroups = impact?.groups.filter((g) => g.action === "delete") ?? [];
  const otherGroups = impact?.groups.filter((g) => g.action !== "delete") ?? [];
  const total = impact?.totalDeleted ?? 0;

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={impact?.entityLabel}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {onDeactivate && (
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null}
              onClick={() => run("soft", onDeactivate)}
            >
              {busy === "soft" ? "Working…" : deactivateLabel}
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            disabled={busy !== null || loading || !id}
            onClick={() => id && run("hard", () => cascadeDelete(type, id))}
          >
            {busy === "hard"
              ? "Deleting…"
              : total > 1
                ? `Delete all (${total})`
                : "Delete"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 type-body-01 text-text-secondary">
        {loading || !impact ? (
          <p className="text-text-helper">Checking what’s linked…</p>
        ) : (
          <>
            <p>
              Permanently delete{" "}
              <span className="font-medium text-text-primary">
                {impact.entityLabel}
              </span>
              ?
            </p>

            {deleteGroups.length === 0 && otherGroups.length === 0 ? (
              <p className="text-text-helper">
                Nothing else is linked — it will be removed cleanly.
              </p>
            ) : (
              <div className="space-y-3">
                {deleteGroups.length > 0 && (
                  <div className="rounded-md border border-support-error/40 bg-support-error-bg p-3">
                    <p className="mb-2 flex items-center gap-1.5 font-medium text-support-error">
                      <Trash2 className="size-4" /> Also permanently deleted
                    </p>
                    <ul className="space-y-1.5">
                      {deleteGroups.map((g) => (
                        <li
                          key={g.type}
                          className="flex items-baseline justify-between gap-3"
                        >
                          <span className="text-text-secondary">
                            {g.label}
                            {g.examples?.length ? (
                              <span className="text-text-helper">
                                {" — "}
                                {g.examples.join(", ")}
                                {g.count > g.examples.length ? "…" : ""}
                              </span>
                            ) : null}
                          </span>
                          <span className="font-mono font-medium tabular-nums text-support-error">
                            {g.count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {otherGroups.length > 0 && (
                  <div className="rounded-md border border-border-subtle p-3">
                    <p className="mb-2 font-medium text-text-secondary">
                      Also affected
                    </p>
                    <ul className="space-y-1.5">
                      {otherGroups.map((g) => (
                        <li
                          key={g.type}
                          className="flex items-baseline justify-between gap-3"
                        >
                          <span className="text-text-secondary">
                            {g.label}{" "}
                            <span className="text-text-helper">
                              ({ACTION_VERB[g.action]})
                            </span>
                          </span>
                          <span
                            className={`font-mono font-medium tabular-nums ${ACTION_COLOR[g.action]}`}
                          >
                            {g.count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {onDeactivate && (
              <p className="text-text-helper">
                Want to keep the history? <strong>{deactivateLabel}</strong>{" "}
                hides it instead and can be undone later.
              </p>
            )}

            <div className="flex gap-2 rounded-md border border-support-warning/50 bg-support-warning-bg p-3 text-text-primary">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-support-caution" />
              <span>
                This permanently removes {total} record{total === 1 ? "" : "s"}{" "}
                and cannot be undone.
              </span>
            </div>
          </>
        )}
      </div>
    </SlideOver>
  );
}
