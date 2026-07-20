"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlideOver } from "@/components/ui/slide-over";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUser, USER_ROLES, type UserRole } from "@/lib/users";
import { useT } from "@/lib/i18n/provider";

const FORM_ID = "user-form";

// Messages are translation keys — the schema is module-level and cannot call hooks.
const schema = z.object({
  firstName: z.string().min(1, "users.form.firstNameRequired"),
  lastName: z.string().min(1, "users.form.lastNameRequired"),
  email: z.string().email("users.form.emailInvalid"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "VIEWER"]),
  password: z
    .string()
    .min(8, "users.form.passwordTooShort")
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "users.form.passwordWeak"),
});

type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  firstName: "",
  lastName: "",
  email: "",
  role: "ACCOUNTANT",
  password: "",
};

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  onSaved,
}: UserFormDialogProps) {
  const t = useT();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: EMPTY });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createUser({ ...values, role: values.role as UserRole });
      toast.success(t("users.toast.created"));
      onOpenChange(false);
      onSaved();
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : t("users.toast.createFailed");
      toast.error(message);
    }
  });

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      title={t("users.form.title")}
      description={t("users.form.description")}
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
            {isSubmitting ? t("users.form.creating") : t("users.form.submit")}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">{t("users.form.firstName")}</Label>
            <Input id="firstName" {...register("firstName")} />
            {errors.firstName && (
              <p className="type-label-01 text-support-error">{t(errors.firstName.message ?? "")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{t("users.form.lastName")}</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName && (
              <p className="type-label-01 text-support-error">{t(errors.lastName.message ?? "")}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("users.form.email")}</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="type-label-01 text-support-error">{t(errors.email.message ?? "")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t("users.form.role")}</Label>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {t(r.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("users.form.password")}</Label>
          <Input id="password" type="text" autoComplete="off" {...register("password")} />
          {errors.password ? (
            <p className="type-label-01 text-support-error">{t(errors.password.message ?? "")}</p>
          ) : (
            <p className="type-label-01 text-text-helper">
              {t("users.form.passwordHint")}
            </p>
          )}
        </div>
      </form>
    </SlideOver>
  );
}
