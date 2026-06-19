"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SlideOver } from "@/components/ui/slide-over";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPayer,
  updatePayer,
  PAYER_TYPES,
  type Payer,
} from "@/lib/payers";

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  shortCode: z.string().min(1, "Short code is required."),
  payerType: z.enum(["COMMERCIAL", "GOVERNMENT", "MEDICAID", "MEDICARE"]),
  notes: z.string().optional(),
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
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      shortCode: "",
      payerType: "COMMERCIAL",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      payer
        ? {
            name: payer.name,
            shortCode: payer.shortCode,
            payerType: payer.payerType,
            notes: payer.notes ?? "",
          }
        : { name: "", shortCode: "", payerType: "COMMERCIAL", notes: "" },
    );
  }, [open, payer, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = { ...values, notes: values.notes || undefined };
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
      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortCode">Short Code</Label>
            <Input id="shortCode" {...register("shortCode")} />
            {errors.shortCode && (
              <p className="text-sm text-destructive">
                {errors.shortCode.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Controller
              control={control}
              name="payerType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYER_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" {...register("notes")} />
        </div>
      </form>
    </SlideOver>
  );
}
