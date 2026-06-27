import { api } from "./api";
import type { PaginatedResult } from "./payers";

interface PayerRef {
  id: string;
  name: string;
  shortCode: string;
  state: string | null;
}

export interface Remittance {
  id: string;
  organizationId: string;
  payerId: string;
  ingestionJobId: string;
  checkNumber: string | null;
  checkDate: string;
  checkAmount: string;
  sourceFileName: string;
  createdAt: string;
  payer?: PayerRef;
  _count?: { claimLines: number };
}

export interface RemittanceClaimLine {
  id: string;
  claimId: string | null;
  patientNameOnEob: string;
  externalClaimNumber: string;
  patientAccountNumber: string | null;
  dateOfService: string;
  billedAmount: string;
  allowedAmount: string;
  paidAmount: string;
  claim?: {
    id: string;
    claimReference: string;
    status: string;
    client?: { id: string; displayName: string } | null;
  } | null;
}

export interface RemittanceDetail extends Remittance {
  ingestionJob?: { id: string; fileName: string };
  claimLines: RemittanceClaimLine[];
}

export interface RemittanceQuery {
  payerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function listRemittances(
  query?: RemittanceQuery,
): Promise<PaginatedResult<Remittance>> {
  const { data } = await api.get<PaginatedResult<Remittance>>("/remittances", {
    params: query,
  });
  return data;
}

export async function getRemittance(id: string): Promise<RemittanceDetail> {
  const { data } = await api.get<RemittanceDetail>(`/remittances/${id}`);
  return data;
}

/**
 * Permanently deletes a remittance and unwinds its effects: claim lines, the
 * payment on any matched claims (reverted to PENDING), and the bank fields.
 */
export async function deleteRemittance(id: string): Promise<void> {
  await api.delete(`/remittances/${id}`);
}
