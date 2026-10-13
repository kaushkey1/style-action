import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/hooks/useAuthStore';
import environment from '@/environment';
import { getImpetusHeaders, IMPETUS_APP_BASE } from '@/lib/api';

export type ControlStatus = 'pass' | 'fail' | 'not_evaluated';
export interface PlanMetrics {
  option_count: number;
  store_count: number;
  total_quantity: number;
  eligible_quantity: number;
  held_count: number;
  held_store_options: number;
  missing_cost_count: number;
  otb_value: number | null;
  ctl01: ControlStatus;
  ctl02: ControlStatus;
  ctl03: ControlStatus;
}
export interface CategoryRun {
  run_id: string;
  sale_month: string;
  current_month: string;
  version: number;
  stage: string;
  created_at: string;
  parameters: { days_of_cover: number; month_days: number; reference_date: string };
}
export interface PlanMonth extends PlanMetrics {
  run_id: string;
  sale_month: string;
  version: number;
  stage: string;
  category_count: number;
}
export interface PlanGroup extends PlanMetrics { code: string; name: string; brick_count?: number; children?: PlanGroup[] }
export interface OptionAttributes {
  category_name: string | null;
  subcategory_name: string | null;
  brick_name: string | null;
  style_id: string | null;
  brand: string | null;
  family: string | null;
  class_name: string | null;
  fabric: string | null;
  fit: string | null;
  pattern: string | null;
  neck_type: string | null;
  sleeve: string | null;
  color: string | null;
  mrp: number | null;
  cost: number | null;
  intake_margin: number | null;
  image_url: string | null;
  is_new_option: boolean;
  store_name?: string | null;
  city?: string | null;
  season?: string | null;
  season_year?: string | null;
}
export interface PlanOption extends PlanMetrics {
  code: string;
  category: string;
  subcategory: string;
  brick: string;
  fashion_grade: string;
  attributes: OptionAttributes;
  true_ros: number;
  forward_ros: number;
  ideal_closing_stock?: number;
  expected_sales?: number;
  opening_stock?: number;
  inwards?: number;
  controls?: PlanControl[];
}
export interface PlanControl {
  id: string;
  status: ControlStatus;
  actual: number | null;
  target: number | null;
  reason: string | null;
  season_code?: string | null;
  basis?: string;
}
export interface StoreCalculation {
  site: string;
  option_code: string;
  attributes: OptionAttributes;
  true_ros: number;
  aop_factor: number;
  forward_ros: number;
  days_of_cover: number;
  m_days: number;
  ideal_closing_stock: number;
  expected_sales: number;
  opening_stock: number;
  inwards: number;
  buy_qty: number;
  buy_qty_reason: string | null;
  controls: PlanControl[];
  sizes: Array<{ size: string; size_qty: number; pivotal_ratio: number; allocation_ratio: number }>;
  pivotal_sizes: Array<{ size: string; is_pivotal: boolean; pivotal_ratio: number; is_allocation: boolean; allocation_ratio: number }>;
}
export interface PlanResponse<T> {
  run: CategoryRun;
  items: T[];
  summary: PlanMetrics;
  pagination: { page: number; page_size: number; total_records: number };
  context?: { category_name: string | null; subcategory_name: string | null };
}
export interface PlanScope {
  sale_month?: string;
  run_id?: string;
  category?: string;
  subcategory?: string;
  brick?: string;
}
export interface PlanOptionFilters {
  brand?: string;
  fashion_grade?: string;
  fit?: string;
  search?: string;
  status?: 'pass' | 'warn' | 'held';
}
type QueryParams = Record<string, string | number | boolean | undefined>;

async function fetchPlan<T>(resource: string, params: QueryParams, signal: AbortSignal): Promise<T> {
  const base = environment.API_BASE_URL.replace(/\/$/, '');
  const response = await axios.get<{ data: T }>(`${base}${IMPETUS_APP_BASE}/buyplan/v2/${resource}`, {
    params, headers: getImpetusHeaders(), signal, timeout: 15_000,
  });
  return response.data.data;
}

function usePlanQuery<T>(resource: string, params: QueryParams = {}, enabled = true) {
  const tenantId = useAuthStore(s => s.tenantId);
  const orgId = useAuthStore(s => s.resolvedOrgId);
  return useQuery({
    queryKey: ['buyplan-category-v2', tenantId, orgId, resource, params],
    queryFn: ({ signal }) => fetchPlan<T>(resource, params, signal),
    enabled,
    retry: false,
    staleTime: 30_000,
  });
}

// Apply the same backend filters to every page of a pinned run.
export function useCategoryOptionList(scope: PlanScope, exceptions = false, filters: PlanOptionFilters = {}, enabled = true) {
  const tenantId = useAuthStore(s => s.tenantId);
  const orgId = useAuthStore(s => s.resolvedOrgId);
  const resource = exceptions ? 'exceptions' : 'options';
  return useQuery({
    queryKey: ['buyplan-category-v2', tenantId, orgId, resource, 'all-pages', scope, filters],
    enabled: enabled && !!(scope.run_id || scope.sale_month) && (exceptions || !!scope.brick),
    retry: false,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      const first = await fetchPlan<PlanResponse<PlanOption>>(resource, { ...scope, ...filters, page: 1, page_size: 100 }, signal);
      const items = [...first.items];
      for (let page = 2; items.length < first.pagination.total_records; page++) {
        const next = await fetchPlan<PlanResponse<PlanOption>>(resource,
          { ...scope, ...filters, run_id: first.run.run_id, page, page_size: 100 }, signal);
        if (!next.items.length) break;
        items.push(...next.items);
      }
      return { ...first, items };
    },
  });
}
export function useCategoryMonths() {
  return usePlanQuery<{ items: PlanMonth[]; years: number[] }>('months');
}
export function useCategoryGroups(level: 'categories' | 'subcategories' | 'bricks', scope: PlanScope) {
  return usePlanQuery<PlanResponse<PlanGroup>>(level, { ...scope }, !!(scope.run_id || scope.sale_month));
}
export function useCategoryOptions(scope: PlanScope, page: number, search: string, status: string) {
  return usePlanQuery<PlanResponse<PlanOption>>('options', { ...scope, page, page_size: 50, search,
    status: status === 'all' ? undefined : status }, !!(scope.brick && (scope.run_id || scope.sale_month)));
}
export function useCategoryExceptions(runId: string, page: number, enabled = true) {
  return usePlanQuery<PlanResponse<PlanOption>>('exceptions', { run_id: runId, page, page_size: 50 }, enabled && !!runId);
}
export function useCategoryStores(runId: string, option: PlanOption, page: number) {
  return usePlanQuery<PlanResponse<StoreCalculation>>(`options/${encodeURIComponent(option.code)}/calculation`,
    { run_id: runId, category: option.category, subcategory: option.subcategory, brick: option.brick,
      page, page_size: 20 }, !!runId && !!option.code);
}

export function useCategoryStoreList(scope: PlanScope, optionCode?: string) {
  const tenantId = useAuthStore(s => s.tenantId);
  const orgId = useAuthStore(s => s.resolvedOrgId);
  const resource = optionCode ? `options/${encodeURIComponent(optionCode)}/calculation` : 'stores';
  return useQuery({
    queryKey: ['buyplan-category-v2', tenantId, orgId, resource, scope],
    enabled: !!scope.run_id && !!scope.brick,
    retry: false,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      const first = await fetchPlan<PlanResponse<StoreCalculation>>(resource, { ...scope, page: 1, page_size: 100 }, signal);
      const items = [...first.items];
      for (let page = 2; items.length < first.pagination.total_records; page++) {
        const next = await fetchPlan<PlanResponse<StoreCalculation>>(resource, { ...scope, page, page_size: 100 }, signal);
        if (!next.items.length) break;
        items.push(...next.items);
      }
      return { ...first, items };
    },
  });
}
