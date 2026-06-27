import { api } from "./api";
import type { PaginatedResult } from "./payers";

export type ClaimStatus =
  | "OPEN"
  | "PENDING"
  | "PAID"
  | "DEDUCTIBLE"
  | "DENIED"
  | "APPEALED"
  | "WRITTEN_OFF";

export const CLAIM_STATUSES: ClaimStatus[] = [
  "OPEN",
  "PENDING",
  "PAID",
  "DEDUCTIBLE",
  "DENIED",
  "APPEALED",
  "WRITTEN_OFF",
];

// Mirror of the backend state machine — used to render only valid actions.
export const CLAIM_STATUS_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  OPEN: ["PENDING"],
  PENDING: ["PAID", "DENIED", "DEDUCTIBLE", "WRITTEN_OFF"],
  DENIED: ["APPEALED", "WRITTEN_OFF"],
  APPEALED: ["PAID", "DENIED", "WRITTEN_OFF"],
  DEDUCTIBLE: ["PAID", "WRITTEN_OFF"],
  PAID: [],
  WRITTEN_OFF: [],
};

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
  negoPct: string;
  allowedAmount: string;
  balanceNeeded: string;
  negotiationDate: string | null;
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
  negoPct?: number;
  negotiationDate?: string;
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

// --- formatting helpers ---

export function formatMoney(value: string | number | null | undefined): string {
  const n = Number(value ?? 0);
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

export function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

const DESTRUCTIVE: ClaimStatus[] = ["DENIED", "WRITTEN_OFF"];

export function statusVariant(
  status: ClaimStatus,
): "default" | "secondary" | "destructive" {
  if (status === "PAID") return "default";
  if (DESTRUCTIVE.includes(status)) return "destructive";
  return "secondary";
}
