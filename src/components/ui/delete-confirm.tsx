"use client";

import { useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { useT } from "@/lib/i18n/provider";

interface DeleteConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** The thing being deleted (shown as the panel subtitle). */
  entityName: string;
  /** Explanation of what each action does. */
  children?: React.ReactNode;
  /** Whether permanent deletion is currently allowed. */
  canHardDelete: boolean;
  /** Why permanent deletion is blocked (shown as a warning). */
  blockedReason?: string;
  /** Optional soft-delete action (e.g. Deactivate). Omit for delete-only. */
  onDeactivate?: () => Promise<void>;
  deactivateLabel?: string;
  /** Permanent delete action. */
  onDelete: () => Promise<void>;
  /** Called after a successful action (e.g. to refresh a list). */
  onDone: () => void;
}

/**
 * Slide-over confirmation that makes the deletion contract explicit: the user
 * sees what will happen and which actions are available before committing.
 */
export function DeleteConfirm({
  open,
  onOpenChange,
  title,
  entityName,
  children,
  canHardDelete,
  blockedReason,
  onDeactivate,
  deactivateLabel,
  onDelete,
  onDone,
}: DeleteConfirmProps) {
  const t = useT();
  const [busy, setBusy] = useState<"soft" | "hard" | null>(null);

  const deactivateText = deactivateLabel ?? t("ui.deactivate");

  const run = async (kind: "soft" | "hard", action: () => Promise<void>) => {
    setBusy(kind);
    try {
      await action();
      onOpenChange(false);
      onDone();
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      const key =
        status === 401 || status === 403
          ? "errors.unauthorized"
          : status === 404
            ? "errors.notFound"
            : isAxiosError(error) && !error.response
              ? "errors.networkError"
              : "errors.unexpected";
      toast.error(t(key));
    } finally {
      setBusy(null);
    }
  };

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={entityName}
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
            disabled={busy !== null || !canHardDelete}
            onClick={() => run("hard", onDelete)}
          >
            {busy === "hard" ? t("common.deleting") : t("ui.deletePermanently")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 type-body-01 text-text-secondary">
        {children}
        {!canHardDelete && blockedReason && (
          <div className="flex gap-2 rounded-md border border-support-warning/50 bg-support-warning-bg p-3 text-text-primary">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-support-caution" />
            <span>{blockedReason}</span>
          </div>
        )}
      </div>
    </SlideOver>
  );
}
