import { api } from "./api";
import type { PaginatedResult } from "./payers";

// ── Enums (mirror backend Prisma enums) ──────────────────────────────────────

export type DocumentType =
  | "EOB_HORIZON"
  | "EOB_INDEPENDENCE"
  | "EOB_AETNA"
  | "EOB_GENERIC"
  | "XLSX_IMPORT";

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "EOB_GENERIC", label: "EOB — Generic" },
  { value: "EOB_AETNA", label: "EOB — Aetna" },
  { value: "EOB_HORIZON", label: "EOB — Horizon BCBS" },
  { value: "EOB_INDEPENDENCE", label: "EOB — Independence BC" },
  { value: "XLSX_IMPORT", label: "Spreadsheet Import" },
];

export type IngestionStatus =
  | "QUEUED"
  | "PROCESSING"
  | "EXTRACTED"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "FAILED";

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "MODIFIED";

export type ReviewItemType =
  | "REMITTANCE_HEADER"
  | "CLAIM_PAYMENT"
  | "SERVICE_LINE_BATCH";

interface UserRef {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// ── Shapes ───────────────────────────────────────────────────────────────────

export interface IngestionJob {
  id: string;
  fileName: string;
  fileMimeType: string | null;
  documentType: DocumentType;
  status: IngestionStatus;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  submittedBy?: UserRef;
  _count?: { reviewItems: number };
}

export interface JobStatus {
  id: string;
  status: IngestionStatus;
  errorMessage: string | null;
  fileName: string;
  documentType: DocumentType;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  _count: { reviewItems: number };
}

export interface QueueJob {
  id: string;
  fileName: string;
  documentType: DocumentType;
  status: IngestionStatus;
  createdAt: string;
  submittedBy?: UserRef;
  payerName: string | null;
  totalItems: number;
  counts: { pending: number; approved: number; rejected: number };
}

export interface ClaimMatch {
  id: string;
  claimReference: string;
  status: string;
  chargeAmount: string;
  serviceDateStart: string;
  serviceDateEnd: string;
  client?: { id: string; displayName: string } | null;
}

/** Extracted/edited field bag for a review item (header or claim line). */
export type ExtractedData = Record<string, unknown>;

export interface ReviewItem {
  id: string;
  itemType: ReviewItemType;
  status: ReviewStatus;
  extractedData: ExtractedData;
  proposedChanges: ExtractedData | null;
  targetClaimId: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  reviewedBy?: UserRef | null;
  targetClaim?: ClaimMatch | null;
  matchPreview?: ClaimMatch | null;
}

/** A claim number's daily lines rolled up to the weekly-claim grain (Billing.xlsx
 *  row), with the raw line items kept for full drill-down. */
export interface ClaimGroup {
  key: string;
  claimNumber: string | null;
  patientNameOnEob: string;
  /** Normalized "Last, First" as it will be saved. */
  clientDisplayName: string;
  patientAccountNumber: string | null;
  dateOfServiceStart: string;
  dateOfServiceEnd: string;
  billedAmount: number;
  allowedAmount: number;
  paidAmount: number;
  payPct: number;
  lineCount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PARTIAL";
  counts: { pending: number; approved: number; rejected: number };
  matchPreview: ClaimMatch | null;
  items: ReviewItem[];
}

/** Token usage + computed cost (USD and EGP) of a job's AI extraction. */
export interface ExtractionCost {
  model: string | null;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  usd: number;
  egp: number;
}

export interface ReviewJobDetail extends IngestionJob {
  rawExtractedData: unknown;
  /** Null for jobs extracted before token tracking was added. */
  extractionCost: ExtractionCost | null;
  header: ReviewItem | null;
  claimGroups: ClaimGroup[];
}

export interface UploadResult {
  ingestionJobId: string;
  status: IngestionStatus;
}

export interface ApproveAllResult {
  approved: number;
  matched: number;
  remittanceId: string;
}

// ── API ──────────────────────────────────────────────────────────────────────

export async function uploadDocument(
  file: File,
  documentType: DocumentType,
  pages: number[] = [],
  allowDuplicate = false,
): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("documentType", documentType);
  // Omit when empty so the backend treats it as "process the whole document".
  if (pages.length > 0) form.append("pages", pages.join(","));
  // Set only after the user confirms a duplicate-file warning.
  if (allowDuplicate) form.append("allowDuplicate", "true");
  const { data } = await api.post<UploadResult>("/documents/upload", form);
  return data;
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const { data } = await api.get<JobStatus>(`/documents/${jobId}/status`);
  return data;
}

export async function listJobs(): Promise<PaginatedResult<IngestionJob>> {
  const { data } = await api.get<PaginatedResult<IngestionJob>>("/documents");
  return data;
}

export async function listReviewQueue(): Promise<QueueJob[]> {
  const { data } = await api.get<QueueJob[]>("/review-queue");
  return data;
}

export async function getReviewJob(jobId: string): Promise<ReviewJobDetail> {
  const { data } = await api.get<ReviewJobDetail>(`/review-queue/jobs/${jobId}`);
  return data;
}

export async function approveItem(
  itemId: string,
  proposedChanges?: ExtractedData,
): Promise<unknown> {
  const { data } = await api.patch(`/review-queue/items/${itemId}/approve`, {
    proposedChanges,
  });
  return data;
}

export async function rejectItem(
  itemId: string,
  rejectionReason?: string,
): Promise<unknown> {
  const { data } = await api.patch(`/review-queue/items/${itemId}/reject`, {
    rejectionReason,
  });
  return data;
}

export async function approveAllJob(jobId: string): Promise<ApproveAllResult> {
  const { data } = await api.post<ApproveAllResult>(
    `/review-queue/jobs/${jobId}/approve-all`,
  );
  return data;
}

export interface RejectAllResult {
  rejected: number;
}

export async function rejectAllJob(jobId: string): Promise<RejectAllResult> {
  const { data } = await api.post<RejectAllResult>(
    `/review-queue/jobs/${jobId}/reject-all`,
  );
  return data;
}

// ── Field metadata for the review UI ─────────────────────────────────────────

export interface FieldSpec {
  key: string;
  label: string;
  kind: "text" | "money" | "date" | "number" | "list";
}

export const HEADER_FIELDS: FieldSpec[] = [
  { key: "payerName", label: "Payer", kind: "text" },
  { key: "checkNumber", label: "Check #", kind: "text" },
  { key: "checkDate", label: "Check Date", kind: "date" },
  { key: "checkAmount", label: "Check Amount", kind: "money" },
];

export const LINE_FIELDS: FieldSpec[] = [
  { key: "patientNameOnEob", label: "Client", kind: "text" },
  { key: "claimNumber", label: "Claim #", kind: "text" },
  { key: "patientAccountNumber", label: "Account #", kind: "text" },
  { key: "dateOfService", label: "Date of Service", kind: "date" },
  { key: "billedAmount", label: "Billed", kind: "money" },
  { key: "allowedAmount", label: "Allowed", kind: "money" },
  { key: "paidAmount", label: "Paid", kind: "money" },
];

export function fieldsFor(itemType: ReviewItemType): FieldSpec[] {
  return itemType === "REMITTANCE_HEADER" ? HEADER_FIELDS : LINE_FIELDS;
}
