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

const FORM_ID = "user-form";

const schema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Enter a valid email."),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "VIEWER"]),
  password: z
    .string()
    .min(8, "At least 8 characters.")
    .regex(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Needs an uppercase letter, a lowercase letter, and a number.",
    ),
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
      toast.success("User created.");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Failed to create user.";
      toast.error(message);
    }
  });

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      title="New User"
      description="Invite a teammate and assign their role."
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
            {isSubmitting ? "Creating…" : "Create User"}
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
              <p className="type-label-01 text-support-error">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName && (
              <p className="type-label-01 text-support-error">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="type-label-01 text-support-error">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
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
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Temporary Password</Label>
          <Input id="password" type="text" autoComplete="off" {...register("password")} />
          {errors.password ? (
            <p className="type-label-01 text-support-error">{errors.password.message}</p>
          ) : (
            <p className="type-label-01 text-text-helper">
              Min 8 characters with upper, lower, and a number. Share it
              securely — the user can change it later.
            </p>
          )}
        </div>
      </form>
    </SlideOver>
  );
}
