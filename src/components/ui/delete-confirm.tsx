"use client";

import { useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";

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
  deactivateLabel = "Deactivate",
  onDelete,
  onDone,
}: DeleteConfirmProps) {
  const [busy, setBusy] = useState<"soft" | "hard" | null>(null);

  const run = async (kind: "soft" | "hard", action: () => Promise<void>) => {
    setBusy(kind);
    try {
      await action();
      onOpenChange(false);
      onDone();
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Action failed.";
      toast.error(message);
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
            disabled={busy !== null || !canHardDelete}
            onClick={() => run("hard", onDelete)}
          >
            {busy === "hard" ? "Deleting…" : "Delete permanently"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-zinc-700">
        {children}
        {!canHardDelete && blockedReason && (
          <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <span>{blockedReason}</span>
          </div>
        )}
      </div>
    </SlideOver>
  );
}
