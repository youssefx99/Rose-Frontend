import { api } from "./api";

export interface DashboardTotals {
  billed: number;
  collected: number;
  collectionRate: number;
  openAr: number;
  claimCount: number;
  clientCount: number;
  payerCount: number;
}

export interface ClaimStatusMetric {
  status: string;
  count: number;
  charge: number;
}

export interface PayerCollection {
  payerName: string;
  billed: number;
  collected: number;
  rate: number;
}

export interface MonthlyTrendPoint {
  month: string;
  billed: number;
  collected: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  billed: number;
  collected: number;
  claimCount: number;
  openClaims: number;
}

export interface Dashboard {
  totals: DashboardTotals;
  pendingReviewCount: number;
  claimsByStatus: ClaimStatusMetric[];
  collectionByPayer: PayerCollection[];
  monthlyTrend: MonthlyTrendPoint[];
  topClients: TopClient[];
}

export async function getDashboard(): Promise<Dashboard> {
  const { data } = await api.get<Dashboard>("/dashboard");
  return data;
}
