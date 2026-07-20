import { api } from "./api";

export interface DashboardTotals {
  billed: number;
  collected: number;
  collectionRate: number;
  /** Charge above the negotiated settlement on claims that are still open. */
  openAr: number;
  overdueClaims: number;
  overdueAmount: number;
  claimCount: number;
  clientCount: number;
  payerCount: number;
}

export interface ClaimStatusMetric {
  status: string;
  count: number;
  charge: number;
  /** Charge minus what the payer has already sent. */
  owed: number;
}

export interface PayerCollection {
  payerName: string;
  billed: number;
  collected: number;
  rate: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  billed: number;
  collected: number;
  outstanding: number;
  claimCount: number;
  openClaims: number;
  overdueClaims: number;
  /** Days left on the oldest open bill's clock; null when nothing is open. */
  daysLeft: number | null;
}

/** One billed month; the four money parts stack exactly to `billed`. */
export interface BilledMonth {
  month: string;
  billed: number;
  collected: number;
  writtenOff: number;
  patientOwed: number;
  stillOpen: number;
}

export interface AgingBucket {
  bucket: "0-30" | "31-60" | "61-90" | "90+";
  count: number;
  amount: number;
}

export interface Dashboard {
  totals: DashboardTotals;
  pendingReviewCount: number;
  billedByMonth: BilledMonth[];
  arAging: AgingBucket[];
  claimsByStatus: ClaimStatusMetric[];
  collectionByPayer: PayerCollection[];
  topClients: TopClient[];
}

export async function getDashboard(): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>("/dashboard");
  return data;
}
