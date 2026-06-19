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
  roleDescription,
  updateUser,
  USER_ROLES,
  type User,
  type UserRole,
} from "@/lib/users";

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
      toast.success("User updated.");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Failed to update user.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      title="Edit User"
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
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
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
          <p className="rounded-md bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600">
            {roleDescription(role)}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={active ? "active" : "disabled"}
            onValueChange={(v) => setActive(v === "active")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-zinc-500">
            Disabled users are signed out within 15 minutes and cannot sign in.
          </p>
        </div>
      </div>
    </SlideOver>
  );
}
