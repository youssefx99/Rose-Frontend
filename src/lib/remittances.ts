import { api } from "./api";
import type { PaginatedResult } from "./payers";
import type { DocumentType } from "./documents";

interface PayerRef {
  id: string;
  name: string;
  shortCode: string;
  payerType: string;
}

export interface Remittance {
  id: string;
  organizationId: string;
  payerId: string;
  ingestionJobId: string;
  bankDepositId: string | null;
  checkNumber: string | null;
  checkDate: string;
  paymentReferenceNumber: string | null;
  grossClaimAmount: string;
  lateInterest: string;
  arsApplied: string;
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
  subscriberName: string | null;
  memberId: string | null;
  externalClaimNumber: string;
  patientAccountNumber: string | null;
  dateOfService: string;
  procedureCode: string;
  modifier: string | null;
  units: number;
  billedAmount: string;
  allowedAmount: string;
  deductibleAmount: string;
  coinsuranceAmount: string;
  copayAmount: string;
  customerLiability: string;
  paidAmount: string;
  remarkCodes: string[];
  reasonCode: string | null;
  claim?: {
    id: string;
    claimReference: string;
    status: string;
    client?: { id: string; displayName: string } | null;
  } | null;
}

export interface RemittanceDetail extends Remittance {
  bankDeposit?: {
    id: string;
    depositDate: string;
    amount: string;
    status: string;
  } | null;
  ingestionJob?: { id: string; fileName: string; documentType: DocumentType };
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
 * payment on any matched claims (reverted to PENDING), and its bank deposit.
 */
export async function deleteRemittance(id: string): Promise<void> {
  await api.delete(`/remittances/${id}`);
}
