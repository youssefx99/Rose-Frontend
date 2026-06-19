"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createClaim,
  updateClaim,
  type Claim,
  type ClaimInput,
  type ClaimUpdateInput,
} from "@/lib/claims";
import { listClients, getClient, type Client } from "@/lib/clients";
import { listPayers, type Payer } from "@/lib/payers";
import type { InsurancePolicy } from "@/lib/clients";

const numeric = z
  .string()
  .optional()
  .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), "Must be ≥ 0");

const schema = z.object({
  clientId: z.string().min(1, "Select a client."),
  payerId: z.string().min(1, "Select a payer."),
  insurancePolicyId: z.string().optional(),
  externalClaimNumber: z.string().optional(),
  dateBilled: z.string().min(1, "Required."),
  serviceDateStart: z.string().min(1, "Required."),
  serviceDateEnd: z.string().min(1, "Required."),
  chargeAmount: z
    .string()
    .min(1, "Required.")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Must be ≥ 0"),
  payerPaidAmount: numeric,
  payPct: numeric,
  negoPct: numeric,
  negotiationDate: z.string().optional(),
  payToPatient: z.boolean().optional(),
  notes: z.string().optional(),
  internalNote: z.string().optional(),
});

type Values = z.infer<typeof schema>;

const NO_POLICY = "__none__";

function toIsoDate(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

interface ClaimFormProps {
  mode: "create" | "edit";
  claim?: Claim;
  onSaved: (claim: Claim) => void;
  /** When hosted in a slide-over, the footer submit button targets this id. */
  formId?: string;
  /** Hide the form's own submit button (the host renders one instead). */
  hideSubmit?: boolean;
  /** Reports submitting state so a host footer button can disable itself. */
  onSubmittingChange?: (submitting: boolean) => void;
}

export function ClaimForm({
  mode,
  claim,
  onSaved,
  formId,
  hideSubmit,
  onSubmittingChange,
}: ClaimFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [payers, setPayers] = useState<Payer[]>([]);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: claim?.clientId ?? "",
      payerId: claim?.payerId ?? "",
      insurancePolicyId: claim?.insurancePolicyId ?? NO_POLICY,
      externalClaimNumber: claim?.externalClaimNumber ?? "",
      dateBilled: toIsoDate(claim?.dateBilled),
      serviceDateStart: toIsoDate(claim?.serviceDateStart),
      serviceDateEnd: toIsoDate(claim?.serviceDateEnd),
      chargeAmount: claim?.chargeAmount ?? "",
      payerPaidAmount: claim?.payerPaidAmount ?? "",
      payPct: claim?.payPct ?? "",
      negoPct: claim?.negoPct ?? "",
      negotiationDate: toIsoDate(claim?.negotiationDate),
      payToPatient: claim?.payToPatient ?? false,
      notes: claim?.notes ?? "",
      internalNote: claim?.internalNote ?? "",
    },
  });

  const clientId = watch("clientId");

  // Surface submitting state to a host (slide-over) footer button.
  useEffect(() => {
    onSubmittingChange?.(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  // Load reference data for the selects (create mode only needs the lists).
  useEffect(() => {
    if (mode !== "create") return;
    Promise.all([listClients(), listPayers()])
      .then(([clientResult, payerResult]) => {
        setClients(clientResult.data);
        setPayers(payerResult.data);
      })
      .catch(() => toast.error("Failed to load clients/payers."));
  }, [mode]);

  // Load the selected client's policies for the policy dropdown.
  const loadPolicies = useCallback(async (id: string) => {
    if (!id) {
      setPolicies([]);
      return;
    }
    try {
      const client = await getClient(id);
      setPolicies(client.insurancePolicies ?? []);
    } catch {
      setPolicies([]);
    }
  }, []);

  useEffect(() => {
    loadPolicies(clientId);
  }, [clientId, loadPolicies]);

  const onSubmit = handleSubmit(async (values) => {
    const num = (v?: string) =>
      v === undefined || v === "" ? undefined : Number(v);
    const policyId =
      values.insurancePolicyId && values.insurancePolicyId !== NO_POLICY
        ? values.insurancePolicyId
        : undefined;

    try {
      if (mode === "create") {
        const payload: ClaimInput = {
          clientId: values.clientId,
          payerId: values.payerId,
          insurancePolicyId: policyId,
          externalClaimNumber: values.externalClaimNumber || undefined,
          dateBilled: values.dateBilled,
          serviceDateStart: values.serviceDateStart,
          serviceDateEnd: values.serviceDateEnd,
          chargeAmount: Number(values.chargeAmount),
          payerPaidAmount: num(values.payerPaidAmount),
          payPct: num(values.payPct),
          negoPct: num(values.negoPct),
          negotiationDate: values.negotiationDate || undefined,
          payToPatient: values.payToPatient,
          notes: values.notes || undefined,
          internalNote: values.internalNote || undefined,
        };
        onSaved(await createClaim(payload));
      } else {
        const payload: ClaimUpdateInput = {
          insurancePolicyId: policyId,
          externalClaimNumber: values.externalClaimNumber || undefined,
          dateBilled: values.dateBilled,
          serviceDateStart: values.serviceDateStart,
          serviceDateEnd: values.serviceDateEnd,
          chargeAmount: Number(values.chargeAmount),
          payerPaidAmount: num(values.payerPaidAmount),
          payPct: num(values.payPct),
          negoPct: num(values.negoPct),
          negotiationDate: values.negotiationDate || undefined,
          payToPatient: values.payToPatient,
          notes: values.notes || undefined,
          internalNote: values.internalNote || undefined,
        };
        onSaved(await updateClaim(claim!.id, payload));
      }
      toast.success(mode === "create" ? "Claim created." : "Claim saved.");
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Failed to save claim.";
      toast.error(message);
    }
  });

  const isEdit = mode === "edit";

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Client</Label>
          {isEdit ? (
            <Input value={claim?.client?.displayName ?? ""} disabled />
          ) : (
            <Select
              value={watch("clientId")}
              onValueChange={(v) => setValue("clientId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.clientId && (
            <p className="text-sm text-destructive">{errors.clientId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Payer</Label>
          {isEdit ? (
            <Input value={claim?.payer?.name ?? ""} disabled />
          ) : (
            <Select
              value={watch("payerId")}
              onValueChange={(v) => setValue("payerId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a payer" />
              </SelectTrigger>
              <SelectContent>
                {payers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.payerId && (
            <p className="text-sm text-destructive">{errors.payerId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Insurance Policy</Label>
          <Select
            value={watch("insurancePolicyId") || NO_POLICY}
            onValueChange={(v) => setValue("insurancePolicyId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_POLICY}>None</SelectItem>
              {policies.map((policy) => (
                <SelectItem key={policy.id} value={policy.id}>
                  {policy.payer.name} · {policy.policyType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="externalClaimNumber">External Claim #</Label>
          <Input id="externalClaimNumber" {...register("externalClaimNumber")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="dateBilled">Date Billed</Label>
          <Input id="dateBilled" type="date" {...register("dateBilled")} />
          {errors.dateBilled && (
            <p className="text-sm text-destructive">
              {errors.dateBilled.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="serviceDateStart">Service Start</Label>
          <Input
            id="serviceDateStart"
            type="date"
            {...register("serviceDateStart")}
          />
          {errors.serviceDateStart && (
            <p className="text-sm text-destructive">
              {errors.serviceDateStart.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="serviceDateEnd">Service End</Label>
          <Input
            id="serviceDateEnd"
            type="date"
            {...register("serviceDateEnd")}
          />
          {errors.serviceDateEnd && (
            <p className="text-sm text-destructive">
              {errors.serviceDateEnd.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="chargeAmount">Charge Amount</Label>
          <Input
            id="chargeAmount"
            type="number"
            step="0.01"
            {...register("chargeAmount")}
          />
          {errors.chargeAmount && (
            <p className="text-sm text-destructive">
              {errors.chargeAmount.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="payerPaidAmount">Payer Paid</Label>
          <Input
            id="payerPaidAmount"
            type="number"
            step="0.01"
            {...register("payerPaidAmount")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payPct">Pay % (0–1)</Label>
          <Input id="payPct" type="number" step="0.0001" {...register("payPct")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="negoPct">Nego % (0–1)</Label>
          <Input
            id="negoPct"
            type="number"
            step="0.0001"
            {...register("negoPct")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="negotiationDate">Negotiation Date</Label>
          <Input
            id="negotiationDate"
            type="date"
            {...register("negotiationDate")}
          />
        </div>
        <label className="flex items-center gap-2 pt-8 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 rounded border-input"
            {...register("payToPatient")}
          />
          Pay to client
        </label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="internalNote">Internal Note</Label>
        <Textarea id="internalNote" {...register("internalNote")} />
      </div>

      {!hideSubmit && (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Create Claim"}
        </Button>
      )}
    </form>
  );
}
