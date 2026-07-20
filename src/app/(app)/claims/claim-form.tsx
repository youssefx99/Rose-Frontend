"use client";

import { useEffect, useState } from "react";
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
import { listClients, type Client } from "@/lib/clients";
import { listPayers, type Payer } from "@/lib/payers";
import { useT, useLocale } from "@/lib/i18n/provider";

// Messages are translation keys — the schema is module-level and cannot call
// hooks, so they are resolved with `t` where the error is rendered.
const numeric = z
  .string()
  .optional()
  .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), "claims.form.minZero");

const percent = z
  .string()
  .optional()
  .refine(
    (v) => !v || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
    "claims.form.percentRange",
  );

const schema = z.object({
  clientId: z.string().min(1, "claims.form.clientRequired"),
  payerId: z.string().min(1, "claims.form.payerRequired"),
  externalClaimNumber: z.string().optional(),
  dateBilled: z.string().min(1, "claims.form.required"),
  dateOfService: z.string().min(1, "claims.form.required"),
  chargeAmount: z
    .string()
    .min(1, "claims.form.required")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "claims.form.minZero"),
  payerPaidAmount: numeric,
  payPct: percent,
  beforeNegotiationAmount: numeric,
  afterNegotiationAmount: numeric,
  negotiationDate: z.string().optional(),
  negotiationNote: z.string().optional(),
  inBankAmount: numeric,
  bankDate: z.string().optional(),
  notes: z.string().optional(),
  internalNote: z.string().optional(),
});

type Values = z.infer<typeof schema>;

function toIsoDate(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

/** Rates are stored as 0–1 fractions but entered as 0–100 percentages. */
function toPercentInput(value: string | null | undefined): string {
  return value ? String(Number((Number(value) * 100).toFixed(2))) : "";
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
  const t = useT();
  const { dir } = useLocale();
  const [clients, setClients] = useState<Client[]>([]);
  const [payers, setPayers] = useState<Payer[]>([]);

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
      externalClaimNumber: claim?.externalClaimNumber ?? "",
      dateBilled: toIsoDate(claim?.dateBilled),
      dateOfService: toIsoDate(claim?.dateOfService),
      chargeAmount: claim?.chargeAmount ?? "",
      payerPaidAmount: claim?.payerPaidAmount ?? "",
      payPct: toPercentInput(claim?.payPct),
      beforeNegotiationAmount: claim?.beforeNegotiationAmount ?? "",
      afterNegotiationAmount: claim?.afterNegotiationAmount ?? "",
      negotiationDate: toIsoDate(claim?.negotiationDate),
      negotiationNote: claim?.negotiationNote ?? "",
      inBankAmount: claim?.inBankAmount ?? "",
      bankDate: toIsoDate(claim?.bankDate),
      notes: claim?.notes ?? "",
      internalNote: claim?.internalNote ?? "",
    },
  });

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
      .catch(() => toast.error(t("claims.toast.loadRefsFailed")));
  }, [mode, t]);

  const onSubmit = handleSubmit(async (values) => {
    const num = (v?: string) =>
      v === undefined || v === "" ? undefined : Number(v);
    const pct = (v?: string) =>
      v === undefined || v === ""
        ? undefined
        : Number((Number(v) / 100).toFixed(4));

    try {
      if (mode === "create") {
        const payload: ClaimInput = {
          clientId: values.clientId,
          payerId: values.payerId,
          externalClaimNumber: values.externalClaimNumber || undefined,
          dateBilled: values.dateBilled,
          dateOfService: values.dateOfService,
          chargeAmount: Number(values.chargeAmount),
          payerPaidAmount: num(values.payerPaidAmount),
          payPct: pct(values.payPct),
          beforeNegotiationAmount: num(values.beforeNegotiationAmount),
          afterNegotiationAmount: num(values.afterNegotiationAmount),
          negotiationDate: values.negotiationDate || undefined,
          negotiationNote: values.negotiationNote || undefined,
          inBankAmount: num(values.inBankAmount),
          bankDate: values.bankDate || undefined,
          notes: values.notes || undefined,
          internalNote: values.internalNote || undefined,
        };
        onSaved(await createClaim(payload));
      } else {
        const payload: ClaimUpdateInput = {
          externalClaimNumber: values.externalClaimNumber || undefined,
          dateBilled: values.dateBilled,
          dateOfService: values.dateOfService,
          chargeAmount: Number(values.chargeAmount),
          payerPaidAmount: num(values.payerPaidAmount),
          payPct: pct(values.payPct),
          beforeNegotiationAmount: num(values.beforeNegotiationAmount),
          afterNegotiationAmount: num(values.afterNegotiationAmount),
          negotiationDate: values.negotiationDate || undefined,
          negotiationNote: values.negotiationNote || undefined,
          inBankAmount: num(values.inBankAmount),
          bankDate: values.bankDate || undefined,
          notes: values.notes || undefined,
          internalNote: values.internalNote || undefined,
        };
        onSaved(await updateClaim(claim!.id, payload));
      }
      toast.success(
        t(mode === "create" ? "claims.toast.created" : "claims.toast.saved"),
      );
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : t("claims.toast.saveFailed");
      toast.error(message);
    }
  });

  const isEdit = mode === "edit";

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("claims.field.client")}</Label>
          {isEdit ? (
            <Input value={claim?.client?.displayName ?? ""} disabled />
          ) : (
            <Select
              dir={dir}
              value={watch("clientId")}
              onValueChange={(v) => setValue("clientId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("claims.form.selectClient")} />
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
          {errors.clientId?.message && (
            <p className="type-label-01 text-support-error">{t(errors.clientId.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t("claims.field.payer")}</Label>
          {isEdit ? (
            <Input value={claim?.payer?.name ?? ""} disabled />
          ) : (
            <Select
              dir={dir}
              value={watch("payerId")}
              onValueChange={(v) => setValue("payerId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("claims.form.selectPayer")} />
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
          {errors.payerId?.message && (
            <p className="type-label-01 text-support-error">{t(errors.payerId.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="externalClaimNumber">{t("claims.field.externalClaimNumber")}</Label>
          <Input id="externalClaimNumber" {...register("externalClaimNumber")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateBilled">{t("claims.field.dateBilled")}</Label>
          <Input id="dateBilled" type="date" {...register("dateBilled")} />
          {errors.dateBilled?.message && (
            <p className="type-label-01 text-support-error">
              {t(errors.dateBilled.message)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfService">{t("claims.field.dateOfService")}</Label>
          <Input
            id="dateOfService"
            type="date"
            {...register("dateOfService")}
          />
          {errors.dateOfService?.message && (
            <p className="type-label-01 text-support-error">
              {t(errors.dateOfService.message)}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="chargeAmount">{t("claims.field.chargeAmount")}</Label>
          <Input
            id="chargeAmount"
            type="number"
            step="0.01"
            {...register("chargeAmount")}
          />
          {errors.chargeAmount?.message && (
            <p className="type-label-01 text-support-error">
              {t(errors.chargeAmount.message)}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="payerPaidAmount">{t("claims.field.payerPaid")}</Label>
          <Input
            id="payerPaidAmount"
            type="number"
            step="0.01"
            {...register("payerPaidAmount")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payPct">{t("claims.field.payPct")}</Label>
          <Input id="payPct" type="number" step="0.01" {...register("payPct")} />
          {errors.payPct?.message && (
            <p className="type-label-01 text-support-error">
              {t(errors.payPct.message)}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="inBankAmount">{t("claims.field.inBank")}</Label>
          <Input
            id="inBankAmount"
            type="number"
            step="0.01"
            {...register("inBankAmount")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankDate">{t("claims.field.dateOfBank")}</Label>
          <Input id="bankDate" type="date" {...register("bankDate")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="beforeNegotiationAmount">
            {t("claims.field.beforeNegotiation")}
          </Label>
          <Input
            id="beforeNegotiationAmount"
            type="number"
            step="0.01"
            {...register("beforeNegotiationAmount")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="afterNegotiationAmount">
            {t("claims.field.afterNegotiation")}
          </Label>
          <Input
            id="afterNegotiationAmount"
            type="number"
            step="0.01"
            {...register("afterNegotiationAmount")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="negotiationDate">
            {t("claims.field.negotiationDate")}
          </Label>
          <Input
            id="negotiationDate"
            type="date"
            {...register("negotiationDate")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="negotiationNote">
            {t("claims.field.negotiationNote")}
          </Label>
          <Input id="negotiationNote" {...register("negotiationNote")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t("common.notes")}</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="internalNote">{t("claims.field.internalNote")}</Label>
        <Textarea id="internalNote" {...register("internalNote")} />
      </div>

      {!hideSubmit && (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t("common.saving")
            : isEdit
              ? t("common.saveChanges")
              : t("claims.action.createClaim")}
        </Button>
      )}
    </form>
  );
}
