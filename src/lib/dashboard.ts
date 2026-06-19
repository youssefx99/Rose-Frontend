import { api } from "./api";

export interface ClaimStatusMetric {
  status: string;
  count: number;
  totalCharge: number;
}

export interface ArAgingBucket {
  bucket: string;
  amount: number;
}

export interface PayerCollection {
  payerName: string;
  collectionRate: number;
}

export interface MonthlyTrendPoint {
  month: string;
  billed: number;
  collected: number;
}

export interface ClientBalance {
  clientName: string;
  outstanding: number;
}

export interface Dashboard {
  arSummary: {
    totalOutstanding: number;
    collectedThisMonth: number;
    billedThisMonth: number;
    collectionRate: number;
  };
  claimsByStatus: ClaimStatusMetric[];
  arAging: ArAgingBucket[];
  pendingReviewCount: number;
  collectionByPayer: PayerCollection[];
  denialRate: number;
  unmatchedDeposits: { count: number; totalAmount: number };
  monthlyTrend: MonthlyTrendPoint[];
  topClientsByBalance: ClientBalance[];
}

export async function getDashboard(): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>("/dashboard");
  return data;
}
