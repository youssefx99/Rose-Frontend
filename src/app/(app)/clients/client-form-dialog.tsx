"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createClient,
  updateClient,
  type Client,
  type ClientInput,
} from "@/lib/clients";

const schema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  dateOfBirth: z.string().optional(),
  subscriberName: z.string().optional(),
  subscriberId: z.string().optional(),
  clientAccountNumber: z.string().optional(),
  notes: z.string().optional(),
});

type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  subscriberName: "",
  subscriberId: "",
  clientAccountNumber: "",
  notes: "",
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
            dateOfBirth: client.dateOfBirth
              ? client.dateOfBirth.slice(0, 10)
              : "",
            subscriberName: client.subscriberName ?? "",
            subscriberId: client.subscriberId ?? "",
            clientAccountNumber: client.clientAccountNumber ?? "",
            notes: client.notes ?? "",
          }
        : EMPTY,
    );
  }, [open, client, reset]);

  const onSubmit = handleSubmit(async (values) => {
    // Strip empty strings so optional fields are omitted, not sent as "".
    const payload: ClientInput = {
      firstName: values.firstName,
      lastName: values.lastName,
      dateOfBirth: values.dateOfBirth || undefined,
      subscriberName: values.subscriberName || undefined,
      subscriberId: values.subscriberId || undefined,
      clientAccountNumber: values.clientAccountNumber || undefined,
      notes: values.notes || undefined,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "New Client"}</DialogTitle>
          <DialogDescription>
            Person or entity served by the organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subscriberName">Subscriber Name</Label>
              <Input id="subscriberName" {...register("subscriberName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscriberId">Subscriber ID</Label>
              <Input id="subscriberId" {...register("subscriberId")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientAccountNumber">Account Number</Label>
            <Input
              id="clientAccountNumber"
              {...register("clientAccountNumber")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
