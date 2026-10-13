import { appApiFetch } from '@/lib/api';

// --- Types ---

export type ActionSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionStatus = 'Approval Required' | 'Auto-Approved' | string;

export interface StoreInsightData {
  insight_run_id: string;
  persona_id: string;
  store_code: string;
  pending_approvals: number | null;
  s1_exceptions: number | null;
  s2_exceptions: number | null;
  morning_question: string | null;
  summary: string | null;
  insights: unknown[];
  actions: StoreAction[];
  agent_actions: unknown[];
}

export interface StoreAction {
  id: string;
  severity: ActionSeverity;
  domain: string;
  title: string;
  description: string;
  owner: string;
  likelihood: string | null;
  clockspeed: string | null;
  status: ActionStatus;
  kpi_chain: string[];
  kpi_chain_explanation: string | null;
  store_code: string;
  created_at: string;
}

export interface TopActionsData {
  showing: number;
  total: number;
  severity_counts: {
    CRITICAL?: number;
    HIGH?: number;
    MEDIUM?: number;
    LOW?: number;
  };
  actions: StoreAction[];
}

export interface StoreReportData {
  store_code: string;
  report_url: string;
  bucket: string;
  blob_path: string;
}

// --- Query key factory ---

export const storeInsightKeys = {
  all: (storeCode: string) => ['store-insights', storeCode] as const,
  summary: (storeCode: string) => [...storeInsightKeys.all(storeCode), 'summary'] as const,
  topActions: (storeCode: string, limit?: number) =>
    [...storeInsightKeys.all(storeCode), 'top-actions', limit] as const,
  report: (storeCode: string) => [...storeInsightKeys.all(storeCode), 'report'] as const,
};

// --- API functions ---

export async function fetchStoreInsights(storeCode: string): Promise<StoreInsightData> {
  return appApiFetch<StoreInsightData>(`/store-insights/stores/${storeCode}/insights`, undefined, {
    skipForbiddenRedirect: true,
  });
}

export async function fetchStoreTopActions(storeCode: string, limit = 5): Promise<TopActionsData> {
  return appApiFetch<TopActionsData>(
    `/store-insights/stores/${storeCode}/top-actions`,
    { limit },
    { skipForbiddenRedirect: true },
  );
}

export async function fetchStoreReport(storeCode: string): Promise<StoreReportData> {
  return appApiFetch<StoreReportData>(`/store-insights/stores/${storeCode}/report`, undefined, {
    skipForbiddenRedirect: true,
  });
}
