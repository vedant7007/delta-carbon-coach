import type { Category, Period, RankedAction } from '@/lib/engine';

/**
 * Client-safe data-transfer types mirroring API responses. Defined here (not
 * imported from server service modules) so client bundles never pull server code.
 */
export interface TrendPoint {
  date: string;
  kgCO2e: number;
}

export interface FootprintSummary {
  period: Period;
  total: number;
  byCategory: Record<Category, number>;
  trend: TrendPoint[];
  regionalAvg: number;
}

export interface StoredActivity {
  id: string;
  factorId: string;
  amount: number;
  kgCO2e: number;
  loggedAt: string;
  source: 'manual' | 'ai';
}

export interface InsightsResponse {
  actions: RankedAction[];
}

export interface SimulateResponse {
  before: number;
  after: number;
  deltaKg: number;
  deltaPct: number;
}

export interface AiParseResponse {
  degraded: boolean;
  activities: { factorId: string; amount: number }[];
  message?: string;
}

export interface AiExplainResponse {
  degraded: boolean;
  text: string;
}
