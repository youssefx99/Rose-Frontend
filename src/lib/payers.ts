import { api } from "./api";

export interface Payer {
  id: string;
  organizationId: string;
  name: string;
  shortCode: string;
  state: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    claims: number;
    remittances: number;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface PayerInput {
  name: string;
  shortCode: string;
  state?: string;
}

export async function listPayers(params?: {
  search?: string;
  includeInactive?: boolean;
}): Promise<PaginatedResult<Payer>> {
  const { data } = await api.get<PaginatedResult<Payer>>("/payers", { params });
  return data;
}

export async function createPayer(input: PayerInput): Promise<Payer> {
  const { data } = await api.post<Payer>("/payers", input);
  return data;
}

export async function updatePayer(
  id: string,
  input: Partial<PayerInput> & { isActive?: boolean },
): Promise<Payer> {
  const { data } = await api.patch<Payer>(`/payers/${id}`, input);
  return data;
}

export async function deactivatePayer(id: string): Promise<void> {
  await api.delete(`/payers/${id}`);
}

/** Permanently deletes the payer. Blocked if referenced by any records. */
export async function deletePayer(id: string): Promise<void> {
  await api.delete(`/payers/${id}`, { params: { hard: true } });
}
