"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getCatalog,
  getRoleMatrix,
  setRolePermissions,
  type PermissionModuleGroup,
} from "@/lib/permissions";
import { roleLabel, type UserRole } from "@/lib/users";

// Columns the super admin can edit (SUPER_ADMIN is always full access).
const EDITABLE_ROLES: UserRole[] = ["ADMIN", "ACCOUNTANT", "VIEWER"];

export default function PermissionsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [groups, setGroups] = useState<PermissionModuleGroup[]>([]);
  const [sets, setSets] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catalog, matrix] = await Promise.all([
        getCatalog(),
        getRoleMatrix(),
      ]);
      setGroups(catalog);
      const next: Record<string, Set<string>> = {};
      for (const role of EDITABLE_ROLES) {
        next[role] = new Set(
          matrix.find((m) => m.role === role)?.permissions ?? [],
        );
      }
      setSets(next);
      setDirty(false);
    } catch {
      toast.error("Failed to load permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin, load]);

  if (user && !isSuperAdmin) {
    return (
      <p className="text-sm text-zinc-500">
        You don&apos;t have access to permission settings.
      </p>
    );
  }

  const toggle = (role: UserRole, key: string) => {
    setSets((prev) => {
      const nextSet = new Set(prev[role]);
      if (nextSet.has(key)) nextSet.delete(key);
      else nextSet.add(key);
      return { ...prev, [role]: nextSet };
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await Promise.all(
        EDITABLE_ROLES.map((role) =>
          setRolePermissions(role, [...(sets[role] ?? [])]),
        ),
      );
      toast.success("Permissions saved.");
      setDirty(false);
    } catch {
      toast.error("Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950">Permissions</h1>
          <p className="text-sm text-zinc-500">
            Control what each role can do. Per-user exceptions are set from the
            Users page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="text-xs text-amber-600">Unsaved changes</span>
          )}
          <Button onClick={save} disabled={saving || loading || !dirty}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">
                  Permission
                </th>
                <th className="px-3 py-3 text-center font-medium text-zinc-600">
                  <span className="inline-flex items-center gap-1">
                    <Lock className="size-3" />
                    Super Admin
                  </span>
                </th>
                {EDITABLE_ROLES.map((role) => (
                  <th
                    key={role}
                    className="px-3 py-3 text-center font-medium text-zinc-600"
                  >
                    {roleLabel(role)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <PermissionGroupRows
                  key={group.module}
                  group={group}
                  sets={sets}
                  onToggle={toggle}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PermissionGroupRows({
  group,
  sets,
  onToggle,
}: {
  group: PermissionModuleGroup;
  sets: Record<string, Set<string>>;
  onToggle: (role: UserRole, key: string) => void;
}) {
  return (
    <>
      <tr className="border-b border-zinc-100 bg-zinc-50/60">
        <td
          colSpan={2 + EDITABLE_ROLES.length}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500"
        >
          {group.label}
        </td>
      </tr>
      {group.permissions.map((p) => (
        <tr key={p.key} className="border-b border-zinc-100 last:border-0">
          <td className="px-4 py-2.5">
            <p className="font-medium text-zinc-900">{p.label}</p>
            <p className="text-xs text-zinc-500">{p.description}</p>
          </td>
          <td className="px-3 py-2.5 text-center">
            <input
              type="checkbox"
              checked
              disabled
              className="size-4 cursor-not-allowed accent-slate-900 opacity-60"
              aria-label={`Super Admin ${p.label}`}
            />
          </td>
          {EDITABLE_ROLES.map((role) => (
            <td key={role} className="px-3 py-2.5 text-center">
              <input
                type="checkbox"
                checked={sets[role]?.has(p.key) ?? false}
                onChange={() => onToggle(role, p.key)}
                className={cn(
                  "size-4 cursor-pointer accent-slate-900",
                )}
                aria-label={`${roleLabel(role)} ${p.label}`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
