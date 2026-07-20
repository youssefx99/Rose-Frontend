"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SlideOver } from "@/components/ui/slide-over";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  roleDescriptionKey,
  updateUser,
  USER_ROLES,
  type User,
  type UserRole,
} from "@/lib/users";
import { useT } from "@/lib/i18n/provider";

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSaved: () => void;
}

export function UserEditDialog({
  open,
  onOpenChange,
  user,
  onSaved,
}: UserEditDialogProps) {
  const t = useT();
  const [role, setRole] = useState<UserRole>("VIEWER");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setRole(user.role);
      setActive(user.isActive);
    }
  }, [open, user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUser(user.id, { role, isActive: active });
      toast.success(t("users.toast.updated"));
      onOpenChange(false);
      onSaved();
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : t("users.toast.updateFailed");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      title={t("users.edit.title")}
      description={
        user ? `${user.firstName} ${user.lastName} · ${user.email}` : ""
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? t("common.saving") : t("common.saveChanges")}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>{t("users.form.role")}</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
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
          <p className="rounded-md bg-layer p-3 type-label-01 leading-relaxed text-text-secondary">
            {t(roleDescriptionKey(role))}
          </p>
        </div>

        <div className="space-y-2">
          <Label>{t("common.status")}</Label>
          <Select
            value={active ? "active" : "disabled"}
            onValueChange={(v) => setActive(v === "active")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t("common.active")}</SelectItem>
              <SelectItem value="disabled">{t("common.disabled")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="type-label-01 text-text-helper">
            {t("users.edit.statusHint")}
          </p>
        </div>
      </div>
    </SlideOver>
  );
}
