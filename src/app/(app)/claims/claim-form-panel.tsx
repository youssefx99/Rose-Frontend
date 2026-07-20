"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { ClaimForm } from "./claim-form";
import { useT } from "@/lib/i18n/provider";
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
  const t = useT();
  const [submitting, setSubmitting] = useState(false);

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      size="wide"
      title={t(
        mode === "create" ? "claims.action.newClaim" : "claims.action.editClaim",
      )}
      description={
        mode === "edit"
          ? claim?.claimReference
          : t("claims.form.panelDescription")
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting}>
            {submitting
              ? t("common.saving")
              : mode === "create"
                ? t("claims.action.createClaim")
                : t("common.saveChanges")}
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
