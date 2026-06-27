"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email({ message: "Enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
    } catch (error) {
      const message =
        isAxiosError(error) && error.response?.status === 401
          ? "Invalid email or password."
          : "Something went wrong. Please try again.";
      toast.error(message);
    }
  });

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel (brand) ── */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col justify-between bg-[#161616] p-12 overflow-hidden">
        {/* subtle grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(244,63,94,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(244,63,94,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* rose radial glow bottom-left */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 size-[480px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(244,63,94,0.18) 0%, transparent 65%)",
          }}
        />

        {/* top: logo */}
        <div className="relative flex items-center gap-3">
          <span className="type-heading-03 font-semibold text-[#f4f4f4] tracking-tight">
            RoseSystem
          </span>
        </div>

        {/* middle: headline */}
        <div className="relative space-y-5">


          <h1 className="type-heading-05 text-[#f4f4f4] leading-tight">
            Your billing.<br />
            <span className="text-interactive">Fully in control.</span>
          </h1>

          <p className="type-body-01 text-[#a8a8a8] max-w-xs leading-relaxed">
            Track EOBs, manage claims, and get paid faster — all from one clean workspace.
          </p>

          {/* stat row */}
          <div className="flex items-center gap-6 pt-2">
            {[
              { value: "EOB", label: "Extraction" },
              { value: "AR", label: "Tracking" },
              { value: "Multi", label: "Payer" },
            ].map(({ value, label }) => (
              <div key={label} className="space-y-0.5">
                <p className="type-heading-compact-02 text-[#f4f4f4]">{value}</p>
                <p className="type-label-01 text-[#6f6f6f]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* bottom: footer note */}
        <p className="relative type-label-01 text-[#525252]">
          Secure · Private · Built for billing teams
        </p>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 sm:px-10">
        {/* mobile logo */}
        <div className="mb-10 flex items-center gap-2 lg:hidden">
          <div className="flex size-8 items-center justify-center rounded-md bg-interactive">
            <span className="text-sm font-semibold text-white leading-none">R</span>
          </div>
          <span className="type-heading-03 font-semibold text-text-primary tracking-tight">
            RoseSystem
          </span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          {/* heading */}
          <div className="space-y-1">
            <h2 className="type-heading-04 text-text-primary">Welcome back</h2>
            <p className="type-body-01 text-text-secondary">
              Sign in to your account to continue.
            </p>
          </div>

          {/* form */}
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="type-label-02 text-text-primary">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register("email")}
                className="h-11"
              />
              {errors.email && (
                <p className="type-label-01 text-support-error">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="type-label-02 text-text-primary">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className="h-11"
              />
              {errors.password && (
                <p className="type-label-01 text-support-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 type-body-compact-01 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {/* divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="type-label-01 text-text-helper">RoseSystem</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <p className="text-center type-label-01 text-text-helper">
            Contact your administrator to get access.
          </p>
        </div>
      </div>
    </div>
  );
}
