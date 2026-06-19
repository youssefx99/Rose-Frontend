"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
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
      <p className="text-sm text-zinc-500">
        You don&apos;t have access to user management.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950">Users</h1>
          <p className="text-sm text-zinc-500">
            Manage who can access RoseSystem and what they can do.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>New User</Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50">
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
                <TableCell colSpan={6} className="py-8 text-center text-zinc-500">
                  Loading…
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-zinc-500">
                  No users yet.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-zinc-900">
                    {u.firstName} {u.lastName}
                  </TableCell>
                  <TableCell className="text-zinc-600">{u.email}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-medium",
                        roleColor(u.role),
                      )}
                    >
                      {roleLabel(u.role)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <span className="text-sm text-green-700">Active</span>
                    ) : (
                      <span className="text-sm text-zinc-400">Disabled</span>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-500">
                    {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    {u.id === user?.id ? (
                      <span className="text-xs text-zinc-400">You</span>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPermissionsUser(u)}
                        >
                          Permissions
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(u)}
                        >
                          Edit
                        </Button>
                      </>
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
