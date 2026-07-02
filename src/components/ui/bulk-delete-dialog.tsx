"use client";

import { useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { cascadeDelete, type DeletableType } from "@/lib/deletion";

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: DeletableType;
  /** Ids of the selected records to delete. */
  ids: string[];
  /** Singular noun, e.g. "client" — pluralized with a trailing "s". */
  noun: string;
  /** Called after the run finishes (refresh the list + clear selection). */
  onDone: () => void;
}

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

/**
 * Confirms and permanently deletes many selected records at once. There is no
 * bulk endpoint, so this walks the selection and reuses the SAME per-record
 * cascade delete as a single delete — each record takes everything linked to it
 * with it. A record already removed by an earlier cascade (e.g. a claim whose
 * payer was also selected) 404s and is counted as a skip, not a failure.
 */
export function BulkDeleteDialog({
  open,
  onOpenChange,
  type,
  ids,
  noun,
  onDone,
}: BulkDeleteDialogProps) {
  // `busy`/`done` are self-resetting: run() sets done=0 before it starts and
  // busy=false when it ends, and the footer only shows `done` while busy — so a
  // re-open always starts from a clean "Delete N" state without an effect.
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);

  const count = ids.length;

  const run = async () => {
    setBusy(true);
    setDone(0);
    let deleted = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        await cascadeDelete(type, id);
        deleted += 1;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          deleted += 1; // already gone via an earlier cascade — treat as done
        } else {
          failed += 1;
        }
      } finally {
        setDone((n) => n + 1);
      }
    }
    setBusy(false);
    if (failed === 0) {
      toast.success(`Deleted ${plural(deleted, noun)}.`);
    } else {
      toast.warning(`Deleted ${deleted}, ${failed} failed.`);
    }
    onOpenChange(false);
    onDone();
  };

  return (
    <SlideOver
      // Block dismissal mid-run so a half-finished delete can't be hidden.
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title={`Delete ${plural(count, noun)}`}
      description="Bulk delete"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy || count === 0}
            onClick={run}
          >
            {busy ? `Deleting… (${done}/${count})` : `Delete ${count}`}
          </Button>
        </>
      }
    >
      <div className="space-y-4 type-body-01 text-text-secondary">
        <p>
          Permanently delete{" "}
          <span className="font-medium text-text-primary">
            {plural(count, noun)}
          </span>
          ?
        </p>
        <div className="flex gap-2 rounded-md border border-support-warning/50 bg-support-warning-bg p-3 text-text-primary">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-support-caution" />
          <span>
            Each {noun} is removed along with everything linked to it — the same
            cascade as a single delete. This cannot be undone.
          </span>
        </div>
      </div>
    </SlideOver>
  );
}
