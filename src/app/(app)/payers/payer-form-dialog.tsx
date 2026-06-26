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
import { createPayer, updatePayer, type Payer } from "@/lib/payers";

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  shortCode: z.string().min(1, "Short code is required."),
  state: z
    .string()
    .optional()
    .refine((v) => !v || v.length === 2, "Use the 2-letter state code."),
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
        toast.success("Payer updated.");
      } else {
        await createPayer(payload);
        toast.success("Payer created.");
      }
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Failed to save payer.");
    }
  });

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      title={payer ? "Edit Payer" : "New Payer"}
      description="Insurance company or payer entity."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-6" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
          {errors.name && (
            <p className="type-label-01 text-support-error">
              {errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="shortCode">Short Code</Label>
          <Input
            id="shortCode"
            aria-invalid={!!errors.shortCode}
            {...register("shortCode")}
          />
          {errors.shortCode && (
            <p className="type-label-01 text-support-error">
              {errors.shortCode.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            maxLength={2}
            placeholder="NJ"
            aria-invalid={!!errors.state}
            {...register("state")}
          />
          {errors.state && (
            <p className="type-label-01 text-support-error">
              {errors.state.message}
            </p>
          )}
        </div>
      </form>
    </SlideOver>
  );
}
