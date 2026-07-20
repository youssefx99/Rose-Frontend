"use client";

import { useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { useT } from "@/lib/i18n/provider";
import { cascadeDelete, type DeletableType } from "@/lib/deletion";

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: DeletableType;
  /** Ids of the selected records to delete. */
  ids: string[];
  /** Entity key, e.g. "client" — resolves the counted `ui.entityCount.*` label. */
  noun: string;
  /** Called after the run finishes (refresh the list + clear selection). */
  onDone: () => void;
}

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
  const t = useT();
  // `busy`/`done` are self-resetting: run() sets done=0 before it starts and
  // busy=false when it ends, and the footer only shows `done` while busy — so a
  // re-open always starts from a clean "Delete N" state without an effect.
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);

  const count = ids.length;
  const countLabel = t(`ui.entityCount.${noun}`, { count });

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
      toast.success(
        t("ui.bulkDelete.toastDeleted", {
          subject: t(`ui.entityCount.${noun}`, { count: deleted }),
        }),
      );
    } else {
      toast.warning(t("ui.bulkDelete.toastPartial", { deleted, failed }));
    }
    onOpenChange(false);
    onDone();
  };

  return (
    <SlideOver
      // Block dismissal mid-run so a half-finished delete can't be hidden.
      open={open}
      onOpenChange={(next) => !busy && onOpenChange(next)}
      title={t("ui.bulkDelete.title", { subject: countLabel })}
      description={t("ui.bulkDelete.description")}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy || count === 0}
            onClick={run}
          >
            {busy
              ? t("ui.bulkDelete.deletingProgress", { done, total: count })
              : t("ui.bulkDelete.deleteCount", { total: count })}
          </Button>
        </>
      }
    >
      <div className="space-y-4 type-body-01 text-text-secondary">
        <p>
          {t("ui.permanentDelete.prefix")}{" "}
          <span className="font-medium text-text-primary">{countLabel}</span>
          {t("ui.permanentDelete.suffix")}
        </p>
        <div className="flex gap-2 rounded-md border border-support-warning/50 bg-support-warning-bg p-3 text-text-primary">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-support-caution" />
          <span>{t("ui.bulkDelete.cascadeWarning")}</span>
        </div>
      </div>
    </SlideOver>
  );
}
