import { api } from "./api";

export type PayerType = "COMMERCIAL" | "GOVERNMENT" | "MEDICAID" | "MEDICARE";

export const PAYER_TYPES: PayerType[] = [
  "COMMERCIAL",
  "GOVERNMENT",
  "MEDICAID",
  "MEDICARE",
];

export interface Payer {
  id: string;
  organizationId: string;
  name: string;
  shortCode: string;
  payerType: PayerType;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface PayerInput {
  name: string;
  shortCode: string;
  payerType?: PayerType;
  notes?: string;
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
