"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Pencil, Users as UsersIcon } from "lucide-react";

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
  listUsers,
  roleColor,
  roleLabel,
  type User,
} from "@/lib/users";
import { formatDate } from "@/lib/format";
import { UserFormDialog } from "./user-form-dialog";
import { UserEditDialog } from "./user-edit-dialog";
import { UserPermissionsDialog } from "./user-permissions-dialog";

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await listUsers());
    } catch {
      toast.error("Failed to load users.");
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
        You don&apos;t have access to user management.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage who can access RoseSystem and what they can do."
      >
        <Button onClick={() => setFormOpen(true)}>New user</Button>
      </PageHeader>

      <div className="overflow-hidden rounded-md border border-border-subtle bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-text-secondary"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <UsersIcon className="size-8 text-text-secondary" />
                    <div className="space-y-1">
                      <p className="type-heading-02 text-text-primary">
                        No users yet
                      </p>
                      <p className="type-body-01 text-text-secondary">
                        Add a teammate to give them access to RoseSystem.
                      </p>
                    </div>
                    <Button onClick={() => setFormOpen(true)}>New user</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-text-primary">
                    {u.firstName} {u.lastName}
                  </TableCell>
                  <TableCell className="text-text-secondary">{u.email}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "type-label-01 inline-flex w-fit items-center rounded-full px-2 py-0.5 whitespace-nowrap",
                        roleColor(u.role),
                      )}
                    >
                      {roleLabel(u.role)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <span className="type-body-compact-01 text-support-success">
                        Active
                      </span>
                    ) : (
                      <span className="type-body-compact-01 text-text-helper">
                        Disabled
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    {u.id === user?.id ? (
                      <span className="type-label-01 text-text-helper">You</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Edit permissions for ${u.firstName} ${u.lastName}`}
                          onClick={() => setPermissionsUser(u)}
                        >
                          <KeyRound className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Edit ${u.firstName} ${u.lastName}`}
                          onClick={() => setEditing(u)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={load}
      />

      <UserEditDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        user={editing}
        onSaved={load}
      />

      <UserPermissionsDialog
        open={permissionsUser !== null}
        onOpenChange={(open) => !open && setPermissionsUser(null)}
        user={permissionsUser}
      />
    </div>
  );
}
