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
import {
  createClient,
  updateClient,
  type Client,
  type ClientInput,
} from "@/lib/clients";

const FORM_ID = "client-form";

const schema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
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
        toast.success("Client updated.");
      } else {
        await createClient(payload);
        toast.success("Client created.");
      }
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Failed to save client.");
    }
  });

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      title={client ? "Edit Client" : "New Client"}
      description="Person served by the organization."
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" {...register("firstName")} />
            {errors.firstName && (
              <p className="text-sm text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName && (
              <p className="text-sm text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientAccountNumber">Account Number</Label>
          <Input id="clientAccountNumber" {...register("clientAccountNumber")} />
        </div>
      </form>
    </SlideOver>
  );
}
