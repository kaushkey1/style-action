import { useQuery, keepPreviousData, type UseQueryResult } from '@tanstack/react-query';
import { appApiFetch } from '@/lib/api';
import { STALE_TIMES } from '@/lib/utils';
import { transformVarianceTracker, type VarianceView } from '../data/varianceView';

// ─── Summary ────────────────────────────────────────────────────────────────

export interface AOPSummaryCard {
  label: string;
  value: number;
  display_value: string;
  unit: string;
}

export interface AOPSummaryResponse {
  cards: AOPSummaryCard[];
}

export function fetchAOPSummary(): Promise<AOPSummaryResponse> {
  return appApiFetch<AOPSummaryResponse>('/aop/summary');
}

// ─── Channel Mix ────────────────────────────────────────────────────────────

export interface AOPChannelMixChannel {
  channel: string;
  revenue: number;
  display_revenue: string;
  share_pct: number;
  gm_pct: number;
  growth_pct: number;
}

export interface AOPChannelMixResponse {
  title: string;
  channels: AOPChannelMixChannel[];
  total_revenue: number;
}

export function fetchAOPChannelMix(): Promise<AOPChannelMixResponse> {
  return appApiFetch<AOPChannelMixResponse>('/aop/channel-mix');
}

// ─── Category Breakdown ─────────────────────────────────────────────────────

export interface AOPCategoryChild {
  category: string;
  description: string;
  volume: number;
  asp: number;
  display_asp: string;
  revenue: number;
  display_revenue: string;
  intake_gm_pct: number;
  delivered_gm_pct: number;
  inv_turns: number;
  growth_pct: number;
}

export interface AOPCategoryGroup {
  group: string;
  volume: number;
  asp: number;
  display_asp: string;
  revenue: number;
  display_revenue: string;
  intake_gm_pct: number;
  delivered_gm_pct: number;
  inv_turns: number;
  growth_pct: number;
  children: AOPCategoryChild[];
}

export interface AOPCategoryBreakdownResponse {
  title: string;
  groups: AOPCategoryGroup[];
}

export function fetchAOPCategoryBreakdown(): Promise<AOPCategoryBreakdownResponse> {
  return appApiFetch<AOPCategoryBreakdownResponse>('/aop/category-breakdown');
}

// ─── Filters ────────────────────────────────────────────────────────────────

export interface AOPFilterOption {
  code: string;
  display_name: string;
}

export interface AOPFiltersResponse {
  formats: AOPFilterOption[];
  channels: AOPFilterOption[];
  categories: AOPFilterOption[];
  brick_descs: AOPFilterOption[];
}

export function fetchAOPFilters(params?: Record<string, string>): Promise<AOPFiltersResponse> {
  const queryParams = params ? '?' + new URLSearchParams(params).toString() : '';
  return appApiFetch<AOPFiltersResponse>(`/aop/filters${queryParams}`);
}

// ─── Store Performance ──────────────────────────────────────────────────────

export interface AOPStorePerformanceRow {
  id: string | null;
  label: string;
  format?: string | null;
  opening_date?: string | null;
  volume?: number | null;
  asp?: number | null;
  display_asp?: string;
  value?: number | null;
  display_value?: string;
  net_revenue?: number | null;
  display_net_revenue?: string;
  intake_gm_pct?: number | null;
  delivered_gm_pct?: number | null;
  inv_turns?: number | null;
  display_inv_turns?: string;
  growth?: number | null;
  display_growth?: string;
  monthly_values?: Record<string, number>;
  daily_values?: Record<string, number>;
}

export interface AOPStorePerformanceResponse {
  title: string;
  summary_cards?: AOPSummaryCard[];
  breakdown_type: 'stores' | 'categories' | 'bricks';
  dimension_label: string;
  rows: AOPStorePerformanceRow[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface FetchStorePerformanceParams {
  view_type?: string;
  is_monthly?: boolean;
  is_daily?: boolean;
  daily?: string;
  month?: string;
  store?: string | null;
  category?: string | null;
  page?: number;
  page_size?: number;
  kpi?: string;
  store_type?: 'existing' | 'nso';
  from_date?: string | null;
  to_date?: string | null;
}

export function fetchStorePerformance(params: FetchStorePerformanceParams = {}): Promise<AOPStorePerformanceResponse> {
  const queryParams = new URLSearchParams({
    view_type: params.view_type || 'store',
    is_monthly: String(params.is_monthly ?? false),
    page: String(params.page || 1),
    page_size: String(params.page_size || 20),
  });

  if (params.is_daily !== undefined) {
    queryParams.append('is_daily', String(params.is_daily));
  }
  if (params.store) {
    queryParams.append('store', params.store);
  }
  if (params.category) {
    queryParams.append('category', params.category);
  }
  if (params.kpi) {
    queryParams.append('kpi', params.kpi);
  }
  if (params.store_type) {
    queryParams.append('store_type', params.store_type);
  }
  if (params.daily) {
    queryParams.append('daily', params.daily);
  }
  if (params.month) {
    queryParams.append('month', params.month);
  }
  if (params.from_date) {
    queryParams.append('from_date', params.from_date);
  }
  if (params.to_date) {
    queryParams.append('to_date', params.to_date);
  }

  return appApiFetch<AOPStorePerformanceResponse>(`/aop/store-performance?${queryParams.toString()}`);
}

// ─── Category Breakdown (Channel/Format View) ──────────────────────────────

export interface CategoryRow {
  label?: string;              // For category detail flat rows
  category?: string;           // For grouped response children
  format?: string;
  brick_desc?: string;
  description?: string;
  volume: number | null;
  asp: number | null;
  display_asp: string;
  value: number;
  display_value: string;
  net_revenue: number;
  display_net_revenue: string;
  intake_gm_pct: number | null;
  delivered_gm_pct: number | null;
  aop_gm: number;
}

export interface GroupRow {
  group: string;
  format: string | null;
  brick_desc: string | null;
  volume: number;
  asp: number;
  display_asp: string;
  value: number;
  display_value: string;
  net_revenue: number;
  display_net_revenue: string;
  intake_gm_pct: number;
  delivered_gm_pct: number;
  aop_gm: number;
  children: CategoryRow[];
}

export interface CategoryBreakdownResponse {
  title: string;
  groups: GroupRow[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface FetchCategoryBreakdownParams {
  view_type?: 'channel' | 'format' | 'category';
  is_monthly?: boolean;
  is_daily?: boolean;
  page?: number;
  page_size?: number;
  channel?: string | null;
  format?: string | null;
  category?: string | null;
  brick_desc?: string | null;
  month?: string | null;
  kpi?: string | null;
  from_date?: string | null;
  to_date?: string | null;
}

export function fetchCategoryBreakdown(params: FetchCategoryBreakdownParams = {}): Promise<CategoryBreakdownResponse> {
  const queryParams = new URLSearchParams({
    view_type: params.view_type || 'category',
    is_monthly: String(params.is_monthly ?? false),
    page: String(params.page || 1),
    page_size: String(params.page_size || 10),
  });

  if (params.is_daily !== undefined) {
    queryParams.append('is_daily', String(params.is_daily));
  }
  if (params.month) {
    queryParams.append('month', params.month);
  }
  if (params.kpi) {
    queryParams.append('kpi', params.kpi);
  }
  if (params.channel) {
    queryParams.append('channel', params.channel);
  }
  if (params.format) {
    queryParams.append('format', params.format);
  }
  if (params.category) {
    queryParams.append('category', params.category);
  }
  if (params.brick_desc) {
    queryParams.append('brick_desc', params.brick_desc);
  }
  if (params.from_date) {
    queryParams.append('from_date', params.from_date);
  }
  if (params.to_date) {
    queryParams.append('to_date', params.to_date);
  }

  return appApiFetch<CategoryBreakdownResponse>(`/aop/category-breakdown?${queryParams.toString()}`);
}

// ─── Category Detail (Channel/Format Detail) ───────────────────────────────

export interface CategoryDetailResponse {
  title: string;
  subtitle: string | null;
  summary_cards: AOPSummaryCard[];
  dimension_label: string;
  rows: CategoryRow[];
  groups: GroupRow[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface FetchCategoryDetailParams {
  view_type?: 'channel' | 'format' | 'category' | 'store';
  is_monthly?: boolean;
  is_daily?: boolean;
  channel?: string | null;
  format?: string | null;
  category?: string | null;
  store?: string | null;
  store_type?: 'existing' | 'nso';
  brick_desc?: string | null;
  page?: number;
  page_size?: number;
  month?: string | null;
  kpi?: string | null;
}

export function fetchCategoryDetail(params: FetchCategoryDetailParams = {}): Promise<CategoryDetailResponse> {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  return appApiFetch<CategoryDetailResponse>(`/aop/category-detail?${queryParams.toString()}`);
}

// ─── Variance Tracker (Command Center Dashboard) ────────────────────────────

export type VarianceTrackerGroupBy = 'category' | 'channel' | 'format' | 'store';

export interface VarianceTrackerMetricValue {
  plan: number | null;
  actual: number | null;
  variance_pct: number | null;
}

export interface VarianceTrackerSummaryMetric {
  code: 'volume' | 'asp' | 'intake_gm' | 'gm_pct' | 'gross_revenue' | 'net_revenue';
  label: string;
  plan: number | null;
  actual: number | null;
  variance_pct: number | null;
  unit: 'units' | 'INR' | '%' | 'Cr' | string;
}

export interface VarianceTrackerHeatmapRow {
  dimension_value: string;
  category: string | null;
  sub_category: string | null;
  volume: VarianceTrackerMetricValue;
  asp: VarianceTrackerMetricValue;
  intake_gm: VarianceTrackerMetricValue;
  gm_pct: VarianceTrackerMetricValue;
  gross_revenue: VarianceTrackerMetricValue;
  net_revenue: VarianceTrackerMetricValue;
}

export interface VarianceTrackerResponse {
  group_by: VarianceTrackerGroupBy;
  variance_summary: {
    metrics: VarianceTrackerSummaryMetric[];
  };
  heatmap: {
    dimension: VarianceTrackerGroupBy | string;
    rows: VarianceTrackerHeatmapRow[];
  };
}

export function fetchVarianceTracker(params: {
  role?: string;
  groupBy: VarianceTrackerGroupBy;
  monthYear?: string;
  periodType?: 'wtd' | 'mtd' | 'ytd' | 'custom';
  fromDate?: string;
  toDate?: string;
}): Promise<VarianceTrackerResponse> {
  const role = params.role?.trim() || 'ceo';
  const queryParams = new URLSearchParams({ group_by: params.groupBy });
  if (params.monthYear) queryParams.set('month_year', params.monthYear);
  if (params.periodType) {
    queryParams.set('period_type', params.periodType);
    queryParams.set('is_monthly', params.periodType === 'mtd' ? 'true' : 'false');
    if (params.periodType === 'wtd') {
      queryParams.set('is_daily', 'true');
    }
  }
  if (params.fromDate) queryParams.set('from_date', params.fromDate);
  if (params.toDate) queryParams.set('to_date', params.toDate);
  return appApiFetch<VarianceTrackerResponse>(
    `/command-center-dashboard/${encodeURIComponent(role)}/variance-tracker?${queryParams.toString()}`,
  );
}

// ─── Variance Tracker — React Query (powers the converged AOP page) ─────────

export interface AopVtParams {
  groupBy: VarianceTrackerGroupBy;
  periodType?: 'wtd' | 'mtd' | 'ytd' | 'custom';
  monthYear?: string;
  fromDate?: string;
  toDate?: string;
}

export const aopKeys = {
  all: ['aop'] as const,
  varianceTracker: (params: AopVtParams) => [...aopKeys.all, 'variance-tracker', params] as const,
};

/**
 * Fetches + transforms the Variance Tracker into the converged AOP view shape
 * (KPIs + dimension breakdown with drill). The transform runs in `select`, off
 * the render path, and reads `group_by` from the response so its reference stays
 * stable across renders.
 */
export function useAopVarianceTracker(params: AopVtParams): UseQueryResult<VarianceView> {
  return useQuery({
    queryKey: aopKeys.varianceTracker(params),
    queryFn: () => fetchVarianceTracker({ role: 'ceo', ...params }),
    select: transformVarianceTracker,
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
  });
}

