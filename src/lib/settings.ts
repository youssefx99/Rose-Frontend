import { api } from "./api";

/** Org-level tunable system settings (mirrors backend ResolvedSettings). */
export interface OrgSettings {
  /** AI validation QA pass after extraction, before human review. */
  validationEnabled: boolean;
  /** Also block re-uploads by name + size + type, not just content hash. */
  strictDuplicateDetection: boolean;
  /** Commit extracted claims straight to the ledger, skipping manual review. */
  autoAcceptReview: boolean;
  /** FX rate used to display AI extraction cost in EGP (1 USD = N EGP). */
  usdToEgpRate: number;
}

export type UpdateOrgSettings = Partial<OrgSettings>;

export async function getSettings(): Promise<OrgSettings> {
  const { data } = await api.get<OrgSettings>("/settings");
  return data;
}

export async function updateSettings(
  patch: UpdateOrgSettings,
): Promise<OrgSettings> {
  const { data } = await api.patch<OrgSettings>("/settings", patch);
  return data;
}
