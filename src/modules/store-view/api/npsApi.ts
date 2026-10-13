import { appApiFetch } from '@/lib/api';
import type {
  NPSStoreDetailsResponse,
  NPSDPIResponse,
  NPSFeedbackResponse,
  NPSAISummaryData,
} from '../types/nps.types';

export const npsKeys = {
  all: ['nps'] as const,
  storeDetails: (storeCode: string, startDate?: string, endDate?: string) =>
    [...npsKeys.all, 'store', storeCode, startDate ?? '', endDate ?? ''] as const,
  dpi: (storeCode: string) => [...npsKeys.all, 'dpi', storeCode] as const,
  feedbacks: (storeCode: string, page: number, sort: string, order: string, npsMin?: number, npsMax?: number) =>
    [...npsKeys.all, 'feedbacks', storeCode, String(page), sort, order, String(npsMin ?? ''), String(npsMax ?? '')] as const,
  aiSummary: (storeCode: string, filterType: string = 'last_month') => [...npsKeys.all, 'ai-summary', storeCode, filterType] as const,
  scoresBulk: (filterType: string = 'mtd') => [...npsKeys.all, 'scores', filterType] as const,
};

function defaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  const fmt = (d: Date): string => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

export async function fetchNPSStoreDetails(
  storeCode: string,
  startDate?: string,
  endDate?: string,
): Promise<NPSStoreDetailsResponse> {
  const defaults = defaultDateRange();
  return appApiFetch<NPSStoreDetailsResponse>(`/nps/stores/${storeCode}`, {
    startDate: startDate ?? defaults.startDate,
    endDate: endDate ?? defaults.endDate,
    accountId: '1',
  });
}

export async function fetchNPSDPI(
  storeCode: string,
): Promise<NPSDPIResponse> {
  const { startDate, endDate } = defaultDateRange();
  return appApiFetch<NPSDPIResponse>(`/nps/stores/${storeCode}/dpi`, {
    startDate,
    endDate,
    accountId: '1',
  });
}

export async function fetchNPSFeedbacks(
  storeCode: string,
  page: number = 1,
  limit: number = 10,
  sort: string = 'response_date',
  order: string = 'desc',
  npsMin?: number,
  npsMax?: number,
): Promise<NPSFeedbackResponse> {
  const { startDate, endDate } = defaultDateRange();
  const params: Record<string, string | number> = {
    startDate,
    endDate,
    accountId: '1',
    page,
    limit,
    sort,
    order,
  };
  if (npsMin != null) params.npsMin = npsMin;
  if (npsMax != null) params.npsMax = npsMax;
  return appApiFetch<NPSFeedbackResponse>(`/nps/stores/${storeCode}/feedbacks`, params);
}

export async function fetchNPSScoresBulk(
  filterType: string = 'mtd',
): Promise<Record<string, number>> {
  return appApiFetch<Record<string, number>>(`/nps/stores/scores`, {
    filterType,
  });
}

export async function fetchNPSAISummary(
  storeCode: string,
  filterType: string = 'mtd',
): Promise<NPSAISummaryData> {
  return appApiFetch<NPSAISummaryData>(`/nps/stores/${storeCode}/ai-summary/cached`, {
    filterType,
  });
}
