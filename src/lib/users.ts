import { api } from "./api";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "ACCOUNTANT" | "VIEWER";

export const USER_ROLES: { value: UserRole; labelKey: string }[] = [
  { value: "ADMIN", labelKey: "users.role.ADMIN" },
  { value: "ACCOUNTANT", labelKey: "users.role.ACCOUNTANT" },
  { value: "VIEWER", labelKey: "users.role.VIEWER" },
  { value: "SUPER_ADMIN", labelKey: "users.role.SUPER_ADMIN" },
];

const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  SUPER_ADMIN: "users.role.SUPER_ADMIN",
  ADMIN: "users.role.ADMIN",
  ACCOUNTANT: "users.role.ACCOUNTANT",
  VIEWER: "users.role.VIEWER",
};

export function roleLabelKey(role: string): string {
  return ROLE_LABEL_KEYS[role as UserRole] ?? role;
}

// Role chip colors — rose marks the top role (sparing accent use).
const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-rose-100 text-rose-700",
  ADMIN: "bg-slate-100 text-slate-700",
  ACCOUNTANT: "bg-blue-100 text-blue-700",
  VIEWER: "bg-zinc-100 text-zinc-600",
};

export function roleColor(role: string): string {
  return ROLE_COLORS[role as UserRole] ?? "bg-zinc-100 text-zinc-600";
}

// Plain-language summary of what each role can do (shown in the editor).
const ROLE_DESCRIPTION_KEYS: Record<UserRole, string> = {
  SUPER_ADMIN: "users.roleDescription.SUPER_ADMIN",
  ADMIN: "users.roleDescription.ADMIN",
  ACCOUNTANT: "users.roleDescription.ACCOUNTANT",
  VIEWER: "users.roleDescription.VIEWER",
};

export function roleDescriptionKey(role: string): string {
  return ROLE_DESCRIPTION_KEYS[role as UserRole] ?? "";
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UserUpdateInput {
  role?: UserRole;
  isActive?: boolean;
}

export async function listUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/users");
  return data;
}

export async function createUser(input: UserInput): Promise<User> {
  const { data } = await api.post<User>("/users", input);
  return data;
}

export async function updateUser(
  id: string,
  input: UserUpdateInput,
): Promise<User> {
  const { data } = await api.patch<User>(`/users/${id}`, input);
  return data;
}
