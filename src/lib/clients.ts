import { api } from "./api";
import type { PaginatedResult } from "./payers";

export interface Client {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  clientAccountNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { claims?: number };
  /** Total claims for this person (index list). */
  claimCount?: number;
  /** Distinct payer account numbers across this person's claims (index list). */
  accountCount?: number;
}

export interface ClientClaimRow {
  id: string;
  claimReference: string;
  externalClaimNumber: string | null;
  patientAccountNumber: string | null;
  dateBilled: string;
  dateOfService: string;
  dateOfServiceEnd: string | null;
  status: string;
  chargeAmount: string;
  payerPaidAmount: string;
  balanceNeeded: string;
  payPct: string | null;
  payer: { id: string; name: string; shortCode: string };
}

export interface ClientAccount {
  accountNumber: string;
  payers: string[];
  claimCount: number;
}

export interface ClientDetail {
  client: Client;
  totals: {
    charge: number;
    paid: number;
    outstanding: number;
    collectionRate: number;
    claimCount: number;
    openClaims: number;
  };
  accounts: ClientAccount[];
  payers: { id: string; name: string; claimCount: number }[];
  claims: ClientClaimRow[];
}

export interface ClientInput {
  firstName: string;
  lastName: string;
  clientAccountNumber?: string;
}

export type ClientStatusFilter = "active" | "inactive" | "all";

export interface ClientQuery {
  search?: string;
  includeInactive?: boolean;
  status?: ClientStatusFilter;
  /** Only clients with at least one claim under this payer. */
  payerId?: string;
  /** Only clients with at least one not-yet-paid claim. */
  hasOutstanding?: boolean;
}

export async function listClients(
  params?: ClientQuery,
): Promise<PaginatedResult<Client>> {
  const { data } = await api.get<PaginatedResult<Client>>("/clients", {
    params,
  });
  return data;
}

export async function getClient(id: string): Promise<Client> {
  const { data } = await api.get<Client>(`/clients/${id}`);
  return data;
}

/** Full client profile: claims, account numbers, payers, and totals. */
export async function getClientDetail(id: string): Promise<ClientDetail> {
  const { data } = await api.get<ClientDetail>(`/clients/${id}/detail`);
  return data;
}

export async function createClient(input: ClientInput): Promise<Client> {
  const { data } = await api.post<Client>("/clients", input);
  return data;
}

export async function updateClient(
  id: string,
  input: Partial<ClientInput> & { isActive?: boolean },
): Promise<Client> {
  const { data } = await api.patch<Client>(`/clients/${id}`, input);
  return data;
}

export async function deactivateClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}

/** Permanently deletes the client. Blocked if it has claims. */
export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`, { params: { hard: true } });
}
