"use client";

import { useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  changeClaimStatus,
  CLAIM_STATUS_TRANSITIONS,
  type Claim,
  type ClaimStatus,
} from "@/lib/claims";

interface StatusActionsProps {
  claim: Claim;
  onChanged: (claim: Claim) => void;
}

export function StatusActions({ claim, onChanged }: StatusActionsProps) {
  const [pending, setPending] = useState<ClaimStatus | null>(null);
  const targets = CLAIM_STATUS_TRANSITIONS[claim.status];

  const go = async (target: ClaimStatus) => {
    setPending(target);
    try {
      const updated = await changeClaimStatus(claim.id, target);
      onChanged(updated);
      toast.success(`Marked ${target}.`);
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Transition failed.";
      toast.error(message);
    } finally {
      setPending(null);
    }
  };

  if (targets.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-md border-l-4 border-support-info bg-support-info-bg px-4 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-support-info" />
        <p className="type-body-compact-01 text-text-primary">
          No further status changes — this claim is in a terminal state.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {targets.map((target) => (
        <Button
          key={target}
          variant="outline"
          size="sm"
          disabled={pending !== null}
          onClick={() => go(target)}
        >
          {pending === target ? "Working…" : `Mark ${target}`}
        </Button>
      ))}
    </div>
  );
}
