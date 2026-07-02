import { api } from "./api";

// Mirrors the backend ImportSummary / ImportRowResult shapes.

export type ImportRowStatus = "created" | "skipped" | "error";

export interface ImportRowResult {
  row: number;
  status: ImportRowStatus;
  client: string | null;
  payer: string | null;
  claimReference: string | null;
  message: string | null;
}

export interface ImportSummary {
  fileName: string;
  rowsTotal: number;
  claimsCreated: number;
  skipped: number;
  errors: number;
  clientsCreated: number;
  payersCreated: number;
  results: ImportRowResult[];
}

/** Uploads a Billing.xlsx and seeds Payers, Clients and Claims from it. */
export async function importClaims(file: File): Promise<ImportSummary> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ImportSummary>("/import/claims", form);
  return data;
}
