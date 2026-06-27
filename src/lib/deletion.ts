import { api } from "./api";

/** delete = removed; revert = reset to OPEN; unlink = reference cleared. */
export type ImpactAction = "delete" | "revert" | "unlink";

export interface ImpactGroup {
  type: string;
  label: string;
  count: number;
  action: ImpactAction;
  examples?: string[];
}

export interface DeletionImpact {
  entityType: string;
  entityLabel: string;
  groups: ImpactGroup[];
  /** Records permanently deleted, including the entity itself. */
  totalDeleted: number;
}

export type DeletableType = "client" | "payer" | "claim" | "remittance" | "document";

const PATH: Record<DeletableType, string> = {
  client: "clients",
  payer: "payers",
  claim: "claims",
  remittance: "remittances",
  document: "documents",
};

/** Previews exactly what deleting this record will remove or affect. */
export async function getDeletionImpact(
  type: DeletableType,
  id: string,
): Promise<DeletionImpact> {
  const { data } = await api.get<DeletionImpact>(
    `/${PATH[type]}/${id}/deletion-impact`,
  );
  return data;
}

/** Permanently deletes the record and cascades to everything tied to it. */
export async function cascadeDelete(
  type: DeletableType,
  id: string,
): Promise<void> {
  // `hard=true` selects permanent delete for client/payer; claims/remittances ignore it.
  await api.delete(`/${PATH[type]}/${id}`, { params: { hard: true } });
}
