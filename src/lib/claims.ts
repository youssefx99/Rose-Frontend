import { api } from "./api";
import type { PaginatedResult } from "./payers";

export type ClaimStatus = "OPEN" | "PARTIALLY_PAID" | "PAID";

export const CLAIM_STATUSES: ClaimStatus[] = [
  "OPEN",
  "PARTIALLY_PAID",
  "PAID",
];

// Mirror of the backend state machine — any status may be set from any other.
export const CLAIM_STATUS_TRANSITIONS = Object.fromEntries(
  CLAIM_STATUSES.map((from) => [
    from,
    CLAIM_STATUSES.filter((to) => to !== from),
  ]),
) as Record<ClaimStatus, ClaimStatus[]>;

interface ClientRef {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}

interface PayerRef {
  id: string;
  name: string;
  shortCode: string;
  state?: string | null;
}

interface UserRef {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** An EOB daily service line that aggregates into a weekly claim. */
export interface ClaimPaymentLine {
  id: string;
  dateOfService: string;
  externalClaimNumber: string;
  patientAccountNumber: string | null;
  billedAmount: string;
  allowedAmount: string;
  paidAmount: string;
  discountAmount: string;
  deductibleAmount: string;
  copayAmount: string;
  coinsuranceAmount: string;
  patientResponsibility: string;
  remittance: {
    checkNumber: string | null;
    checkDate: string;
    checkAmount: string;
    sourceFileName: string;
  };
}

// Prisma Decimal fields serialize as strings over JSON.
export interface Claim {
  id: string;
  organizationId: string;
  clientId: string;
  payerId: string;
  claimReference: string;
  externalClaimNumber: string | null;
  patientAccountNumber: string | null;
  dateBilled: string;
  dateOfService: string;
  dateOfServiceEnd: string | null;
  status: ClaimStatus;
  chargeAmount: string;
  payerPaidAmount: string;
  payPct: string | null;
  discountAmount: string;
  deductibleAmount: string;
  copayAmount: string;
  coinsuranceAmount: string;
  patientResponsibility: string;
  beforeNegotiationAmount: string;
  afterNegotiationAmount: string;
  negoPct: string;
  allowedAmount: string;
  balanceNeeded: string;
  negotiationDate: string | null;
  negotiationNote: string | null;
  inBankAmount: string;
  bankDate: string | null;
  notes: string | null;
  internalNote: string | null;
  createdAt: string;
  updatedAt: string;
  client?: ClientRef;
  payer?: PayerRef;
  createdBy?: UserRef | null;
  updatedBy?: UserRef | null;
  remittanceLines?: ClaimPaymentLine[];
  _count?: { remittanceLines: number; arNotes: number };
}

export interface ArNote {
  id: string;
  claimId: string;
  userId: string;
  noteText: string;
  noteDate: string;
  createdAt: string;
  user: UserRef;
}

export interface ClaimInput {
  clientId: string;
  payerId: string;
  claimReference?: string;
  externalClaimNumber?: string;
  dateBilled: string;
  dateOfService: string;
  chargeAmount: number;
  payerPaidAmount?: number;
  payPct?: number;
  beforeNegotiationAmount?: number;
  afterNegotiationAmount?: number;
  negotiationDate?: string;
  negotiationNote?: string;
  inBankAmount?: number;
  bankDate?: string;
  notes?: string;
  internalNote?: string;
}

export type ClaimUpdateInput = Omit<
  Partial<ClaimInput>,
  "clientId" | "payerId" | "claimReference"
>;

export interface ClaimQuery {
  search?: string;
  status?: ClaimStatus;
  clientId?: string;
  payerId?: string;
  /** Service-date range (YYYY-MM-DD). */
  dateFrom?: string;
  dateTo?: string;
  minCharge?: number;
  maxCharge?: number;
  outstandingOnly?: boolean;
}

export async function listClaims(
  query?: ClaimQuery,
): Promise<PaginatedResult<Claim>> {
  const { data } = await api.get<PaginatedResult<Claim>>("/claims", {
    params: query,
  });
  return data;
}

export async function getClaim(id: string): Promise<Claim> {
  const { data } = await api.get<Claim>(`/claims/${id}`);
  return data;
}

export async function createClaim(input: ClaimInput): Promise<Claim> {
  const { data } = await api.post<Claim>("/claims", input);
  return data;
}

export async function updateClaim(
  id: string,
  input: ClaimUpdateInput,
): Promise<Claim> {
  const { data } = await api.patch<Claim>(`/claims/${id}`, input);
  return data;
}

export async function changeClaimStatus(
  id: string,
  status: ClaimStatus,
  note?: string,
): Promise<Claim> {
  const { data } = await api.patch<Claim>(`/claims/${id}/status`, {
    status,
    note,
  });
  return data;
}

/** Permanently deletes a claim. Blocked if linked to remittance payment lines. */
export async function deleteClaim(id: string): Promise<void> {
  await api.delete(`/claims/${id}`);
}

export async function listClaimNotes(id: string): Promise<ArNote[]> {
  const { data } = await api.get<ArNote[]>(`/claims/${id}/notes`);
  return data;
}

export async function addClaimNote(
  id: string,
  noteText: string,
  noteDate?: string,
): Promise<ArNote> {
  const { data } = await api.post<ArNote>(`/claims/${id}/notes`, {
    noteText,
    noteDate,
  });
  return data;
}

/** Collected or closed — no longer chased. Mirrors the backend's exclude set. */
export const CLOSED_STATUSES: ClaimStatus[] = ["PAID"];

/**
 * What a claim still owes us: the charge ABOVE the negotiated settlement is
 * written off, never chased, so a deal shrinks the balance the moment it is
 * agreed. A closed claim owes nothing at all.
 */
export function claimOutstanding(claim: Claim): number {
  if (CLOSED_STATUSES.includes(claim.status)) return 0;
  return Number(claim.chargeAmount) - Number(claim.allowedAmount);
}
