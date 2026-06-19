"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { cn } from "@/lib/utils";
import {
  getCatalog,
  getRoleMatrix,
  getUserPermissions,
  setUserPermissions,
  type PermissionModuleGroup,
} from "@/lib/permissions";
import { roleLabel, type User, type UserRole } from "@/lib/users";

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSaved?: () => void;
}

type OverrideState = "allow" | "inherit" | "deny";

const OPTIONS: { value: OverrideState; label: string }[] = [
  { value: "allow", label: "Allow" },
  { value: "inherit", label: "Inherit" },
  { value: "deny", label: "Deny" },
];

export function UserPermissionsDialog({
  open,
  onOpenChange,
  user,
  onSaved,
}: UserPermissionsDialogProps) {
  const [groups, setGroups] = useState<PermissionModuleGroup[]>([]);
  const [baseline, setBaseline] = useState<Set<string>>(new Set());
  const [state, setState] = useState<Record<string, OverrideState>>({});
  const [role, setRole] = useState<UserRole>("VIEWER");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = role === "SUPER_ADMIN";

  const load = useCallback(async (target: User) => {
    setLoading(true);
    try {
      const [catalog, matrix, perms] = await Promise.all([
        getCatalog(),
        getRoleMatrix(),
        getUserPermissions(target.id),
      ]);
      setGroups(catalog);
      setRole(perms.role);
      const roleSet = new Set(
        matrix.find((m) => m.role === perms.role)?.permissions ?? [],
      );
      setBaseline(roleSet);
      const next: Record<string, OverrideState> = {};
      for (const group of catalog) {
        for (const p of group.permissions) {
          next[p.key] = perms.allow.includes(p.key)
            ? "allow"
            : perms.deny.includes(p.key)
              ? "deny"
              : "inherit";
        }
      }
      setState(next);
    } catch {
      toast.error("Failed to load permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && user) load(user);
  }, [open, user, load]);

  const granted = (key: string): boolean => {
    const s = state[key];
    if (s === "allow") return true;
    if (s === "deny") return false;
    return baseline.has(key);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const allow = Object.keys(state).filter((k) => state[k] === "allow");
      const deny = Object.keys(state).filter((k) => state[k] === "deny");
      await setUserPermissions(user.id, allow, deny);
      toast.success("Permissions updated.");
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : "Failed to update permissions.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideOver
      open={open}
      onOpenChange={onOpenChange}
      size="wide"
      title="Permissions"
      description={
        user
          ? `${user.firstName} ${user.lastName} · ${roleLabel(user.role)}`
          : ""
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
          <Button
            type="button"
            onClick={save}
            disabled={saving || loading || isSuperAdmin}
          >
            {saving ? "Saving…" : "Save Overrides"}
          </Button>
        </>
      }
    >
      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : isSuperAdmin ? (
        <p className="rounded-md bg-zinc-50 p-4 text-sm text-zinc-600">
          This user is a Super Admin with full, unrestricted access. Per-user
          overrides do not apply.
        </p>
      ) : (
        <div className="space-y-6">
          <p className="text-xs leading-relaxed text-zinc-500">
            Each permission defaults to the{" "}
            <span className="font-medium text-zinc-700">
              {roleLabel(role)}
            </span>{" "}
            role. Set <span className="font-medium">Allow</span> or{" "}
            <span className="font-medium">Deny</span> to override it for this
            user only.
          </p>

          {groups.map((group) => (
            <div key={group.module} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {group.label}
              </h3>
              <div className="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200">
                {group.permissions.map((p) => {
                  const current = state[p.key] ?? "inherit";
                  const inheritGrants = baseline.has(p.key);
                  const effective = granted(p.key);
                  return (
                    <div
                      key={p.key}
                      className="flex items-center justify-between gap-4 bg-white px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900">
                          {p.label}
                          <span
                            className={cn(
                              "ml-2 text-xs font-normal",
                              effective ? "text-green-600" : "text-zinc-400",
                            )}
                          >
                            {effective ? "Granted" : "Not granted"}
                          </span>
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {p.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 rounded-md border border-zinc-200 p-0.5">
                        {OPTIONS.map((opt) => {
                          const selected = current === opt.value;
                          const inheritHint =
                            opt.value === "inherit"
                              ? inheritGrants
                                ? " ✓"
                                : " ✕"
                              : "";
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                setState((prev) => ({
                                  ...prev,
                                  [p.key]: opt.value,
                                }))
                              }
                              className={cn(
                                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                                selected
                                  ? opt.value === "allow"
                                    ? "bg-green-600 text-white"
                                    : opt.value === "deny"
                                      ? "bg-red-600 text-white"
                                      : "bg-zinc-200 text-zinc-800"
                                  : "text-zinc-500 hover:bg-zinc-100",
                              )}
                            >
                              {opt.label}
                              {inheritHint}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </SlideOver>
  );
}
