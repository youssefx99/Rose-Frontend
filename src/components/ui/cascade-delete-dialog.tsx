"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { useT } from "@/lib/i18n/provider";
import { useFormat } from "@/lib/i18n/format";
import {
  cascadeDelete,
  getDeletionImpact,
  type DeletableType,
  type DeletionImpact,
  type ImpactAction,
} from "@/lib/deletion";
import { catalogText } from "@/lib/permissions";

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

const ACTION_VERB_KEY: Record<ImpactAction, string> = {
  delete: "ui.cascadeDelete.actionVerb.delete",
  revert: "ui.cascadeDelete.actionVerb.revert",
  unlink: "ui.cascadeDelete.actionVerb.unlink",
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
  deactivateLabel,
  onDone,
}: CascadeDeleteDialogProps) {
  const t = useT();
  const { formatNumber } = useFormat();
  const [impact, setImpact] = useState<DeletionImpact | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<"soft" | "hard" | null>(null);

  const deactivateText = deactivateLabel ?? t("ui.deactivate");

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
        toast.error(errorMessage(error, t("ui.cascadeDelete.loadImpactFailed")));
        onOpenChange(false);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, id, type, onOpenChange, t]);

  const run = async (kind: "soft" | "hard", action: () => Promise<void>) => {
    setBusy(kind);
    try {
      await action();
      toast.success(
        t(
          kind === "hard"
            ? "ui.cascadeDelete.toastDeleted"
            : "ui.cascadeDelete.toastDone",
        ),
      );
      onOpenChange(false);
      onDone();
    } catch (error) {
      toast.error(errorMessage(error, t("ui.actionFailed")));
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
            {t("common.cancel")}
          </Button>
          {onDeactivate && (
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null}
              onClick={() => run("soft", onDeactivate)}
            >
              {busy === "soft" ? t("ui.working") : deactivateText}
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            disabled={busy !== null || loading || !id}
            onClick={() => id && run("hard", () => cascadeDelete(type, id))}
          >
            {busy === "hard"
              ? t("common.deleting")
              : total > 1
                ? t("ui.cascadeDelete.deleteAll", { total })
                : t("common.delete")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 type-body-01 text-text-secondary">
        {loading || !impact ? (
          <p className="text-text-helper">{t("ui.cascadeDelete.checking")}</p>
        ) : (
          <>
            <p>
              {t("ui.permanentDelete.prefix")}{" "}
              <span className="font-medium text-text-primary">
                {impact.entityLabel}
              </span>
              {t("ui.permanentDelete.suffix")}
            </p>

            {deleteGroups.length === 0 && otherGroups.length === 0 ? (
              <p className="text-text-helper">
                {t("ui.cascadeDelete.nothingLinked")}
              </p>
            ) : (
              <div className="space-y-3">
                {deleteGroups.length > 0 && (
                  <div className="rounded-md border border-support-error/40 bg-support-error-bg p-3">
                    <p className="mb-2 flex items-center gap-1.5 font-medium text-support-error">
                      <Trash2 className="size-4" />{" "}
                      {t("ui.cascadeDelete.alsoDeleted")}
                    </p>
                    <ul className="space-y-1.5">
                      {deleteGroups.map((g) => (
                        <li
                          key={g.type}
                          className="flex items-baseline justify-between gap-3"
                        >
                          <span className="text-text-secondary">
                            {catalogText(
                              t,
                              `lib.impactGroup.${g.type}`,
                              g.label,
                            )}
                            {g.examples?.length ? (
                              <span className="text-text-helper">
                                {" — "}
                                {g.examples.join(t("ui.listSeparator"))}
                                {g.count > g.examples.length ? "…" : ""}
                              </span>
                            ) : null}
                          </span>
                          <span className="font-mono font-medium tabular-nums text-support-error">
                            {formatNumber(g.count)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {otherGroups.length > 0 && (
                  <div className="rounded-md border border-border-subtle p-3">
                    <p className="mb-2 font-medium text-text-secondary">
                      {t("ui.cascadeDelete.alsoAffected")}
                    </p>
                    <ul className="space-y-1.5">
                      {otherGroups.map((g) => (
                        <li
                          key={g.type}
                          className="flex items-baseline justify-between gap-3"
                        >
                          <span className="text-text-secondary">
                            {catalogText(
                              t,
                              `lib.impactGroup.${g.type}`,
                              g.label,
                            )}{" "}
                            <span className="text-text-helper">
                              ({t(ACTION_VERB_KEY[g.action])})
                            </span>
                          </span>
                          <span
                            className={`font-mono font-medium tabular-nums ${ACTION_COLOR[g.action]}`}
                          >
                            {formatNumber(g.count)}
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
                {t("ui.cascadeDelete.keepHistoryPrefix")}{" "}
                <strong>{deactivateText}</strong>{" "}
                {t("ui.cascadeDelete.keepHistorySuffix")}
              </p>
            )}

            <div className="flex gap-2 rounded-md border border-support-warning/50 bg-support-warning-bg p-3 text-text-primary">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-support-caution" />
              <span>
                {t("ui.cascadeDelete.removesRecords", { count: total })}
              </span>
            </div>
          </>
        )}
      </div>
    </SlideOver>
  );
}
