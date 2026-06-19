import { api } from "./api";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "ACCOUNTANT" | "VIEWER";

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "VIEWER", label: "Viewer" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ACCOUNTANT: "Accountant",
  VIEWER: "Viewer",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role as UserRole] ?? role;
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
const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SUPER_ADMIN:
    "Full access across the organization, including user management.",
  ADMIN: "Full data access and user management. Can delete remittances.",
  ACCOUNTANT:
    "Create and edit clients, payers, and claims, and approve reviews. No user management; cannot delete remittances.",
  VIEWER: "Read-only access to all data. Cannot make any changes.",
};

export function roleDescription(role: string): string {
  return ROLE_DESCRIPTIONS[role as UserRole] ?? "";
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
