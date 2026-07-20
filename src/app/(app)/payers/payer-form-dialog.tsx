"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlideOver } from "@/components/ui/slide-over";
import { useT } from "@/lib/i18n/provider";
import { createPayer, updatePayer, type Payer } from "@/lib/payers";

// Module scope cannot call hooks, so the messages are translation keys resolved
// against the active locale where the errors are rendered.
const schema = z.object({
  name: z.string().min(1, "payers.form.nameRequired"),
  shortCode: z.string().min(1, "payers.form.shortCodeRequired"),
  state: z
    .string()
    .optional()
    .refine((v) => !v || v.length === 2, "payers.form.stateInvalid"),
});

type Values = z.infer<typeof schema>;

const FORM_ID = "payer-form";

interface PayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payer: Payer | null;
  onSaved: () => void;
}

export function PayerFormDialog({
  open,
  onOpenChange,
  payer,
  onSaved,
}: PayerFormDialogProps) {
  const t = useT("payers");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", shortCode: "", state: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      payer
        ? {
            name: payer.name,
            shortCode: payer.shortCode,
            state: payer.state ?? "",
          }
        : { name: "", shortCode: "", state: "" },
    );
  }, [open, payer, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = {
        name: values.name,
        shortCode: values.shortCode,
        state: values.state ? values.state.toUpperCase() : undefined,
      };
      if (payer) {
        await updatePayer(payer.id, payload);
        toast.success(t("payers.toast.updated"));
      } else {
        await createPayer(payload);
        toast.success(t("payers.toast.created"));
      }
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error(t("payers.toast.saveFailed"));
    }
  });

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      title={payer ? t("editPayer") : t("newPayer")}
      description={t("payers.form.description")}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            {isSubmitting ? t("common.saving") : t("common.save")}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-6" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">{t("common.name")}</Label>
          <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
          {errors.name?.message && (
            <p className="type-label-01 text-support-error">
              {t(errors.name.message)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="shortCode">{t("payers.field.shortCode")}</Label>
          <Input
            id="shortCode"
            aria-invalid={!!errors.shortCode}
            {...register("shortCode")}
          />
          {errors.shortCode?.message && (
            <p className="type-label-01 text-support-error">
              {t(errors.shortCode.message)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">{t("payers.field.state")}</Label>
          <Input
            id="state"
            maxLength={2}
            placeholder={t("payers.form.statePlaceholder")}
            aria-invalid={!!errors.state}
            {...register("state")}
          />
          {errors.state?.message && (
            <p className="type-label-01 text-support-error">
              {t(errors.state.message)}
            </p>
          )}
        </div>
      </form>
    </SlideOver>
  );
}
