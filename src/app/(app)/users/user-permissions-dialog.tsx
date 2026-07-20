"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { cn } from "@/lib/utils";
import {
  catalogText,
  getCatalog,
  getRoleMatrix,
  getUserPermissions,
  setUserPermissions,
  type PermissionModuleGroup,
} from "@/lib/permissions";
import { roleLabelKey, type User, type UserRole } from "@/lib/users";
import { useT } from "@/lib/i18n/provider";

interface UserPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSaved?: () => void;
}

type OverrideState = "allow" | "inherit" | "deny";

const OPTIONS: { value: OverrideState; labelKey: string }[] = [
  { value: "allow", labelKey: "users.override.allow" },
  { value: "inherit", labelKey: "users.override.inherit" },
  { value: "deny", labelKey: "users.override.deny" },
];

export function UserPermissionsDialog({
  open,
  onOpenChange,
  user,
  onSaved,
}: UserPermissionsDialogProps) {
  const t = useT();
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
      toast.error(t("users.toast.permissionsLoadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      toast.success(t("users.toast.permissionsUpdated"));
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : t("users.toast.permissionsUpdateFailed");
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
      title={t("users.permissions.title")}
      description={
        user
          ? `${user.firstName} ${user.lastName} · ${t(roleLabelKey(user.role))}`
          : ""
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
          <Button
            type="button"
            onClick={save}
            disabled={saving || loading || isSuperAdmin}
          >
            {saving ? t("common.saving") : t("users.permissions.saveOverrides")}
          </Button>
        </>
      }
    >
      {loading ? (
        <p className="type-body-01 text-text-secondary">{t("common.loading")}</p>
      ) : isSuperAdmin ? (
        <p className="rounded-md bg-layer p-4 type-body-01 text-text-secondary">
          {t("users.permissions.superAdminNotice", {
            role: t("users.role.SUPER_ADMIN"),
          })}
        </p>
      ) : (
        <div className="space-y-6">
          <p className="type-label-01 leading-relaxed text-text-secondary">
            {t("users.permissions.hintDefault", { role: t(roleLabelKey(role)) })}{" "}
            {t("users.permissions.hintOverride", {
              allow: t("users.override.allow"),
              deny: t("users.override.deny"),
            })}
          </p>

          {groups.map((group) => (
            <div key={group.module} className="space-y-2">
              <h3 className="type-heading-compact-01 text-text-secondary">
                {catalogText(
                  t,
                  `permissions.module.${group.module}.label`,
                  group.label,
                )}
              </h3>
              <div className="divide-y divide-border-subtle overflow-hidden rounded-md border border-border-subtle">
                {group.permissions.map((p) => {
                  const current = state[p.key] ?? "inherit";
                  const inheritGrants = baseline.has(p.key);
                  const effective = granted(p.key);
                  return (
                    <div
                      key={p.key}
                      className="flex items-center justify-between gap-4 bg-card px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="type-body-compact-01 font-medium text-text-primary">
                          {catalogText(t, `permissions.${p.key}.label`, p.label)}
                          <span
                            className={cn(
                              "ms-2 type-label-01",
                              effective
                                ? "text-support-success"
                                : "text-text-helper",
                            )}
                          >
                            {effective
                              ? t("users.permissions.granted")
                              : t("users.permissions.notGranted")}
                          </span>
                        </p>
                        <p className="truncate type-label-01 text-text-secondary">
                          {catalogText(
                            t,
                            `permissions.${p.key}.description`,
                            p.description,
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 rounded-md border border-border-subtle p-0.5">
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
                                "rounded-sm px-2.5 py-1 type-label-01 transition-colors duration-[var(--dur-fast-02)] ease-[var(--ease-standard)] focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none",
                                selected
                                  ? opt.value === "allow"
                                    ? "bg-support-success text-text-on-color"
                                    : opt.value === "deny"
                                      ? "bg-support-error text-white"
                                      : "bg-layer-selected text-text-primary"
                                  : "text-text-secondary hover:bg-layer",
                              )}
                            >
                              {t(opt.labelKey)}
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
