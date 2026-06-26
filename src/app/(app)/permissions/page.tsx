"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <p className="type-body-01 text-text-secondary">
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
      <PageHeader
        title="Permissions"
        description="Control what each role can do. Per-user exceptions are set from the Users page."
      >
        {dirty && (
          <span className="type-label-01 text-support-caution">
            Unsaved changes
          </span>
        )}
        <Button onClick={save} disabled={saving || loading || !dirty}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </PageHeader>

      {loading ? (
        <p className="type-body-01 text-text-secondary">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                <TableHead className="text-center">
                  <span className="inline-flex items-center justify-center gap-1">
                    <Lock className="size-3" />
                    Super Admin
                  </span>
                </TableHead>
                {EDITABLE_ROLES.map((role) => (
                  <TableHead key={role} className="text-center">
                    {roleLabel(role)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <PermissionGroupRows
                  key={group.module}
                  group={group}
                  sets={sets}
                  onToggle={toggle}
                />
              ))}
            </TableBody>
          </Table>
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
      <TableRow className="bg-layer hover:bg-layer">
        <TableCell
          colSpan={2 + EDITABLE_ROLES.length}
          className="type-heading-compact-01 py-2 text-text-secondary"
        >
          {group.label}
        </TableCell>
      </TableRow>
      {group.permissions.map((p) => (
        <TableRow key={p.key}>
          <TableCell className="whitespace-normal">
            <p className="type-body-compact-01 font-medium text-text-primary">
              {p.label}
            </p>
            <p className="type-label-01 text-text-secondary">{p.description}</p>
          </TableCell>
          <TableCell className="text-center">
            <input
              type="checkbox"
              checked
              disabled
              className="size-4 cursor-not-allowed accent-interactive opacity-60"
              aria-label={`Super Admin ${p.label}`}
            />
          </TableCell>
          {EDITABLE_ROLES.map((role) => (
            <TableCell key={role} className="text-center">
              <input
                type="checkbox"
                checked={sets[role]?.has(p.key) ?? false}
                onChange={() => onToggle(role, p.key)}
                className={cn(
                  "size-4 cursor-pointer accent-interactive",
                )}
                aria-label={`${roleLabel(role)} ${p.label}`}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
