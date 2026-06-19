"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { ClaimForm } from "./claim-form";
import type { Claim } from "@/lib/claims";

const FORM_ID = "claim-form";

interface ClaimFormPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  claim?: Claim;
  onSaved: (claim: Claim) => void;
}

export function ClaimFormPanel({
  open,
  onOpenChange,
  mode,
  claim,
  onSaved,
}: ClaimFormPanelProps) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      size="wide"
      title={mode === "create" ? "New Claim" : "Edit Claim"}
      description={
        mode === "edit"
          ? claim?.claimReference
          : "Create a claim for a client and payer."
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting}>
            {submitting
              ? "Saving…"
              : mode === "create"
                ? "Create Claim"
                : "Save Changes"}
          </Button>
        </>
      }
    >
      <ClaimForm
        mode={mode}
        claim={claim}
        formId={FORM_ID}
        hideSubmit
        onSubmittingChange={setSubmitting}
        onSaved={(saved) => {
          onSaved(saved);
          onOpenChange(false);
        }}
      />
    </SlideOver>
  );
}
