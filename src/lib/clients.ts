import { api } from "./api";
import type { PaginatedResult, Payer, PayerType } from "./payers";

export type PolicyType = "PRIMARY" | "SECONDARY" | "TERTIARY";

export const POLICY_TYPES: PolicyType[] = ["PRIMARY", "SECONDARY", "TERTIARY"];

export type PayerSummary = Pick<
  Payer,
  "id" | "name" | "shortCode" | "payerType"
> & { payerType: PayerType };

export interface InsurancePolicy {
  id: string;
  clientId: string;
  payerId: string;
  memberId: string | null;
  planName: string | null;
  policyType: PolicyType;
  effectiveDate: string | null;
  terminationDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  payer: PayerSummary;
}

export interface Client {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  dateOfBirth: string | null;
  subscriberName: string | null;
  subscriberId: string | null;
  clientAccountNumber: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { insurancePolicies: number; claims?: number };
  insurancePolicies?: InsurancePolicy[];
}

export interface ClientInput {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  subscriberName?: string;
  subscriberId?: string;
  clientAccountNumber?: string;
  notes?: string;
}

export interface PolicyInput {
  payerId: string;
  policyType: PolicyType;
  memberId?: string;
  planName?: string;
  effectiveDate?: string;
  terminationDate?: string;
}

export async function listClients(params?: {
  search?: string;
  includeInactive?: boolean;
}): Promise<PaginatedResult<Client>> {
  const { data } = await api.get<PaginatedResult<Client>>("/clients", {
    params,
  });
  return data;
}

export async function getClient(id: string): Promise<Client> {
  const { data } = await api.get<Client>(`/clients/${id}`);
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

/** Permanently deletes the client (and its policies). Blocked if it has claims. */
export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`, { params: { hard: true } });
}

export async function listPolicies(
  clientId: string,
): Promise<InsurancePolicy[]> {
  const { data } = await api.get<InsurancePolicy[]>(
    `/clients/${clientId}/policies`,
  );
  return data;
}

export async function addPolicy(
  clientId: string,
  input: PolicyInput,
): Promise<InsurancePolicy> {
  const { data } = await api.post<InsurancePolicy>(
    `/clients/${clientId}/policies`,
    input,
  );
  return data;
}

export async function removePolicy(
  clientId: string,
  policyId: string,
): Promise<void> {
  await api.delete(`/clients/${clientId}/policies/${policyId}`);
}
