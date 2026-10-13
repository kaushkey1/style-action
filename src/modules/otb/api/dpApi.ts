import { appApiFetch, apiFetchBlob, appApiPost, IMPETUS_APP_BASE } from '@/lib/api';

const DP = '/dp';
const BUYPLAN = '/buyplan';

async function dpFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  return appApiFetch<T>(`${DP}${path}`, params);
}

// ── DP Filter Types ─────────────────────────────────────────────────

export interface DpFilterOption {
  code: string;
  name: string;
}

export interface DpFilters {
  brands: DpFilterOption[];
  segments: DpFilterOption[];
  families: DpFilterOption[];
  fashion_grades: DpFilterOption[];
  hits: string[];
  seasons: string[];
  statuses: string[];
}

// ── DP Plan Types ───────────────────────────────────────────────────

export interface DpPlanItem {
  dp_plan_id: string;
  brand: string;
  segment: string;
  family: string;
  fashion_grade: string;
  brand_desc: string;
  segment_desc: string;
  family_desc: string;
  fashion_grade_desc: string;
  display_dp_name: string;
  hit: string;
  season: string;
  year: number;
  qty: number;
  earliest_delivery_date: string | null;
  buy_plan_id: string;
  status: string;
  total_stores: number;
  total_skus: number;
  total_allocated_qty: number;
  total_value: number;
  allocation_rate: number;
  p1_qty: number;
  p3_qty: number;
  created_at: string;
  drop_number?: number;
  updated_at: string;
}

export interface DpPlansSummary {
  total_plans: number;
  active_plans: number;
  total_skus: number;
  total_allocated_qty: number;
  avg_allocation_rate: number;
}

export interface DpPlansResponse {
  plans: DpPlanItem[];
  summary_totals: DpPlansSummary;
  pagination: {
    page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
  };
}

// ── DP Allocation Types ─────────────────────────────────────────────

export interface DpAllocationItem {
  id: string;
  season: string;
  hit: string;
  style_id: string;
  variant_article_number: string;
  size: string;
  purchase_group: string;
  delivery_date: string;
  store_code: string;
  dc_id: string | null;
  qty: number;
  uom: string;
  otb_number: string;
  mrp: number;
  priority: string;
  season_year: number;
  brand?: string;
  brick?: string;
}

export interface DpAllocationKpi {
  total_skus: number;
  total_stores: number;
  total_units: number;
  total_value: number;
}

export interface DpAllocationsResponse {
  dp_plan_id: string;
  display_dp_name?: string;
  brand: string;
  segment: string;
  family: string;
  fashion_grade: string;
  hit: string;
  status: string;
  kpi: DpAllocationKpi;
  allocations: DpAllocationItem[];
  pagination: {
    page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
  };
}

// ── DP Allocation Filter Types ──────────────────────────────────────

export interface DpAllocationFilters {
  style_ids: string[];
  store_codes: string[];
  purchase_groups: string[];
  priorities: string[];
  seasons: string[];
  hits: string[];
}

// ── Query Key Factory ───────────────────────────────────────────────

export const dpKeys = {
  all: ['dp'] as const,
  filters: (params?: { brand?: string; segment?: string; family?: string }) =>
    [...dpKeys.all, 'filters', params] as const,
  plans: () => [...dpKeys.all, 'plans'] as const,
  planList: (params: Record<string, unknown>) =>
    [...dpKeys.plans(), params] as const,
  allocations: (dpPlanId: string) =>
    [...dpKeys.all, 'allocations', dpPlanId] as const,
  allocationList: (dpPlanId: string, params: Record<string, unknown>) =>
    [...dpKeys.allocations(dpPlanId), params] as const,
  allocationFilters: (dpPlanId: string) =>
    [...dpKeys.all, 'allocation-filters', dpPlanId] as const,
};

// ── API Functions ───────────────────────────────────────────────────

export function fetchDpFilters(params?: {
  brand?: string;
  segment?: string;
  family?: string;
}): Promise<DpFilters> {
  return dpFetch<DpFilters>('/filters', params);
}

export function fetchDpPlans(params?: {
  brand?: string;
  segment?: string;
  family?: string;
  fashion_grade?: string;
  hit?: string;
  season?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<DpPlansResponse> {
  return dpFetch<DpPlansResponse>('/plans', params);
}

export function downloadDpPlans(params?: {
  brand?: string;
  segment?: string;
  family?: string;
  fashion_grade?: string;
  hit?: string;
  season?: string;
  status?: string;
}): Promise<void> {
  const downloadParams: Record<string, string | number | boolean | undefined> = {
    ...params,
    download: true,
  };
  const filename = `distribution-plans-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return apiFetchBlob(`${DP}/plans`, downloadParams, filename, IMPETUS_APP_BASE);
}

export function fetchDpAllocations(
  dpPlanId: string,
  params?: {
    style_id?: string;
    store_code?: string;
    purchase_group?: string;
    priority?: string;
    search?: string;
    page?: number;
    page_size?: number;
  },
): Promise<DpAllocationsResponse> {
  return dpFetch<DpAllocationsResponse>(`/plans/${dpPlanId}/allocations`, params);
}

export function downloadDpAllocations(
  dpPlanId: string,
  params?: {
    style_id?: string;
    store_code?: string;
    purchase_group?: string;
    priority?: string;
    search?: string;
    drop_number?: number;
  },
): Promise<void> {
  const downloadParams: Record<string, string | number | boolean | undefined> = {
    ...params,
    download: true,
  };
  const filename = `dp-allocations-${dpPlanId}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return apiFetchBlob(`${DP}/plans/${dpPlanId}/allocations`, downloadParams, filename, IMPETUS_APP_BASE);
}

export function fetchDpAllocationFilters(
  dpPlanId: string,
): Promise<DpAllocationFilters> {
  return dpFetch<DpAllocationFilters>(`/plans/${dpPlanId}/allocations/filters`);
}

// ── Send to Procuro ────────────────────────────────────────────────

export interface SendToProcuroResponse {
  run_id: string;
  status: string;
}

export function sendToProcuro(runId: string, params?: { drop_number?: number }): Promise<SendToProcuroResponse> {
  const query = params?.drop_number != null ? `?drop_number=${params.drop_number}` : '';
  return appApiPost<SendToProcuroResponse>(`${BUYPLAN}/runs/${runId}/send-to-procuro${query}`);
}

