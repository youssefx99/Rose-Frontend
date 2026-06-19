import { api } from "./api";
import type { UserRole } from "./users";

/** A single permission `"<module>.<action>"` with display metadata. */
export interface PermissionDefinition {
  key: string;
  module: string;
  label: string;
  description: string;
}

/** Catalog permissions grouped by module (drives the matrix UI). */
export interface PermissionModuleGroup {
  module: string;
  label: string;
  permissions: PermissionDefinition[];
}

/** One row of the Role × Permission matrix. */
export interface RoleMatrixEntry {
  role: UserRole;
  permissions: string[];
  locked: boolean;
}

/** A user's effective permissions plus their explicit overrides. */
export interface UserPermissions {
  userId: string;
  role: UserRole;
  effective: string[];
  allow: string[];
  deny: string[];
}

/** Current user's effective permission keys — drives frontend gating. */
export async function getMyPermissions(): Promise<string[]> {
  const { data } = await api.get<string[]>("/permissions/me");
  return data;
}

/** Full permission catalog grouped by module (super-admin). */
export async function getCatalog(): Promise<PermissionModuleGroup[]> {
  const { data } = await api.get<PermissionModuleGroup[]>(
    "/permissions/catalog",
  );
  return data;
}

/** Role → permissions matrix (stored merged with defaults). */
export async function getRoleMatrix(): Promise<RoleMatrixEntry[]> {
  const { data } = await api.get<RoleMatrixEntry[]>("/permissions/roles");
  return data;
}

/** Replace a role's permission set. */
export async function setRolePermissions(
  role: UserRole,
  permissions: string[],
): Promise<void> {
  await api.put(`/permissions/roles/${role}`, { permissions });
}

/** A user's effective set + their explicit allow/deny overrides. */
export async function getUserPermissions(
  userId: string,
): Promise<UserPermissions> {
  const { data } = await api.get<UserPermissions>(
    `/permissions/users/${userId}`,
  );
  return data;
}

/** Replace a user's allow/deny overrides. */
export async function setUserPermissions(
  userId: string,
  allow: string[],
  deny: string[],
): Promise<void> {
  await api.put(`/permissions/users/${userId}`, { allow, deny });
}
