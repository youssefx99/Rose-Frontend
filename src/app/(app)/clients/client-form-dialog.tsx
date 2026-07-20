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
import {
  createClient,
  updateClient,
  type Client,
  type ClientInput,
} from "@/lib/clients";

const FORM_ID = "client-form";

// Messages are translation keys — the schema is module-level and cannot call hooks.
const schema = z.object({
  firstName: z.string().min(1, "clients.form.firstNameRequired"),
  lastName: z.string().min(1, "clients.form.lastNameRequired"),
  clientAccountNumber: z.string().optional(),
});

type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  firstName: "",
  lastName: "",
  clientAccountNumber: "",
};

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSaved: () => void;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onSaved,
}: ClientFormDialogProps) {
  const t = useT("clients");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      client
        ? {
            firstName: client.firstName,
            lastName: client.lastName,
            clientAccountNumber: client.clientAccountNumber ?? "",
          }
        : EMPTY,
    );
  }, [open, client, reset]);

  const onSubmit = handleSubmit(async (values) => {
    // Strip empty strings so optional fields are omitted, not sent as "".
    const payload: ClientInput = {
      firstName: values.firstName,
      lastName: values.lastName,
      clientAccountNumber: values.clientAccountNumber || undefined,
    };
    try {
      if (client) {
        await updateClient(client.id, payload);
        toast.success(t("clients.toast.updated"));
      } else {
        await createClient(payload);
        toast.success(t("clients.toast.created"));
      }
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error(t("clients.toast.saveFailed"));
    }
  });

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      title={client ? t("clients.form.editTitle") : t("newClient")}
      description={t("clients.form.description")}
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
          <Label htmlFor="firstName">{t("clients.form.firstName")}</Label>
          <Input id="firstName" {...register("firstName")} />
          {errors.firstName?.message && (
            <p className="type-label-01 text-support-error">
              {t(errors.firstName.message)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t("clients.form.lastName")}</Label>
          <Input id="lastName" {...register("lastName")} />
          {errors.lastName?.message && (
            <p className="type-label-01 text-support-error">
              {t(errors.lastName.message)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientAccountNumber">{t("clients.form.accountNumber")}</Label>
          <Input id="clientAccountNumber" {...register("clientAccountNumber")} />
        </div>
      </form>
    </SlideOver>
  );
}
