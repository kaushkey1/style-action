import { appApiFetch, apiFetchBlob, appApiPut, IMPETUS_APP_BASE } from '@/lib/api';

const BUYPLAN = '/buyplan';

async function bpFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  return appApiFetch<T>(`${BUYPLAN}${path}`, params);
}

async function bpPut<T>(path: string, data: unknown): Promise<T> {
  return appApiPut<T>(`${BUYPLAN}${path}`, data);
}

// ── Types ────────────────────────────────────────────────────────────

export interface BuyPlanFilters {
  category_groups: string[];
  formats: string[];
  hit_months: string[];
  hits: string[];
  brands: string[];
  pods: { name: string; code: string }[];
  families: { name: string; code: string }[];
  fashion_grades: string[];
  statuses: string[];
  category_statuses: string[];
}

export interface CategoryItem {
  id: string;
  buy_plan_id: string;
  name: string;
  code: string;
  hit: string;
  hit_month: string;
  total_otb: number;
  used_otb: number;
  otb_usage_percentage: number;
  total_options: number;
  total_quantity: number;
  average_asp: number;
  expected_revenue: number;
  margin_percentage: number;
  status: string;
}

export interface CategoriesResponse {
  categories: CategoryItem[];
  summary_totals: {
    total_otb: number;
    used_otb: number;
    total_options: number;
    total_revenue: number;
  };
  pagination: {
    page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
  };
}

export interface FashionGradeItem {
  id: string;
  name: string;
  options: number;
  quantity: number;
  otb_allocated: number;
  otb_used: number;
  otb_usage_percentage: number;
  average_asp: number;
  revenue: number;
  margin: number;
  store_count: number;
  pending_approvals: number;
  completed_plans: number;
  total_plans: number;
  status: string;
  pipeline_status: string;
}

export interface FashionGradesKpiTotals {
  otb_allocated: number;
  otb_used: number;
  otb_utilization_percentage: number;
  completed_plans: number;
  total_plans: number;
  plan_completion_percentage: number;
  total_options: number;
  pending_approvals: number;
  total_revenue: number;
  total_quantity: number;
}

export interface FashionGradesResponse {
  category: {
    code: string;
    name: string;
    hit: string;
  };
  fashion_grades: FashionGradeItem[];
  kpi_totals: FashionGradesKpiTotals;
}

export interface OptionStyle {
  id: string;
  name: string;
  style_code: string;
  brand: string;
  category: string;
  attributes: Record<string, string>;
}

export interface OptionItem {
  id: string;
  style_id: string;
  style: OptionStyle;
  style_code: string;
  style_name: string;
  brand: string;
  category: string;
  fashion_grade: string;
  hit: string;
  color: string;
  color_code: string;
  hex_code: string;
  image_url: string;
  suggested_qty: number;
  planned_qty: number;
  asp: number;
  mrp: number | null;
  cost: number | null;
  target_margin: number;
  actual_margin: number | null;
  intake_margin: number | null;
  is_active: boolean;
  sent_to_dp: boolean | null;
  dp_date: string | null;
  sizes: string[] | null;
  store_allocation: number | null;
  plan_status: string;
}

export interface OptionsKpiSummary {
  active_options: number;
  total_options: number;
  total_quantity: number;
  expected_revenue: number;
  otb_usage_percentage: number;
}

export interface OptionsResponse {
  id: string;
  category: string;
  category_code: string;
  fashion_grade: string;
  hit: string;
  status: string;
  total_otb: number;
  otb_used: number;
  options: OptionItem[];
  kpi_summary: OptionsKpiSummary;
}

// ── Brand View Types ────────────────────────────────────────────────

export interface BrandViewFilters {
  brands: string[];
  segments: string[];
  families: { family: string; segment: string }[];
  bricks?: string[];
  hits: string[];
  statuses: string[];
}

export interface BrandViewItem {
  run_id: string;
  buy_plan_id: string;
  buy_plan_display_id: string;
  brand: string;
  segment: string;
  family: string;
  fashion_grade: string;
  fashion_grade_desc?: string;
  hit: string;
  expected_revenue: number;
  total_otb: number;
  otb_consumed: number;
  otb_consumed_percentage: number;
  options: number;
  buy_status: string;
  status: string;
}

export interface BrandViewResponse {
  buy_plans: BrandViewItem[];
  summary_totals: {
    total_buy_plans: number;
    total_options: number;
    total_otb: number;
    total_otb_consumed: number;
  };
  pagination: {
    page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
  };
}

// ── Run Options Detail Types ────────────────────────────────────────

export interface RunOptionItem {
  id: number;
  option_code: string;
  color: string;
  is_enabled: boolean;
  status?: string;
  drop_number?: number;
  mrp: number | null;
  cost_price: number | null;
  quantity: number;
  expected_margin: number | null;
  actual_margin: number | null;
  intake_margin: number | null;
  net_intake_margin: number | null;
  revenue: number;
  fabric: string | null;
  fit: string | null;
  pattern: string | null;
  pattern_type: string | null;
  length: string | null;
  neck_type: string | null;
  weave: string | null;
  sleeve: string | null;
  waist: string | null;
  wash: string | null;
  stores: number;
  sizes: string;
  delivery_date: string | null;
  comments: string | null;
  image_urls?: string | null;
}

export interface RunStyleGroup {
  style_code: string;
  style_description: string;
  brand?: string;
  total_options: number;
  active_options: number;
  options: RunOptionItem[];
  status?: string;
  gim: number | null;
  nim: number | null;
}

export interface RunOptionsKpi {
  active_options: number;
  total_options: number;
  total_quantity: number;
  expected_revenue: number;
  otb_used: number;
  otb_total: number;
  otb_used_percentage: number;
  avg_nim: number | null;
}

export interface RunOptionsResponse {
  run_id: string;
  buy_plan_id: string;
  buy_plan_display_id?: string;
  status: string;
  kpi: RunOptionsKpi;
  styles: RunStyleGroup[];
}

export interface ToggleResponse {
  id: number;
  run_id: string;
  option_code: string;
  color: string;
  is_enabled: boolean;
}

export interface QuantityUpdateResponse {
  id: number;
  run_id: string;
  option_code: string;
  color: string;
  quantity: number;
}

// ── Buy Plan History Types ────────────────────────────────────────────

export interface BuyPlanHistoryEntry {
  id: string;
  action: string;
  field_name: string;
  old_value: string | null;
  new_value: string;
  changed_by: string;
  changed_at: string;
  result_id: number;
  style: string | null;
}

export interface BuyPlanHistoryResponse {
  run_id: string;
  toggle_history: BuyPlanHistoryEntry[];
  quantity_history: BuyPlanHistoryEntry[];
}

// ── API calls ────────────────────────────────────────────────────────

export function fetchBuyPlanFilters(): Promise<BuyPlanFilters> {
  return bpFetch<BuyPlanFilters>('/filters');
}

export function fetchCategories(params?: {
  category_group?: string;
  hit?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<CategoriesResponse> {
  return bpFetch<CategoriesResponse>('/categories', params);
}

export function fetchFashionGrades(
  categoryCode: string,
  params?: { hit?: string },
): Promise<FashionGradesResponse> {
  return bpFetch<FashionGradesResponse>(
    `/categories/${categoryCode}/fashion-grades`,
    params,
  );
}

export function fetchOptions(params: {
  category: string;
  grade: string;
  hit: string;
}): Promise<OptionsResponse> {
  return bpFetch<OptionsResponse>('/options', params);
}

// ── Brand View API calls ────────────────────────────────────────────

export function fetchBrandViewFilters(params?: {
  brand?: string;
  segment?: string;
}): Promise<BrandViewFilters> {
  return bpFetch<BrandViewFilters>('/brand-view/filters', params);
}

export function fetchBrandViewListing(params?: {
  brand?: string;
  segment?: string;
  family?: string;
  hit?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<BrandViewResponse> {
  return bpFetch<BrandViewResponse>('/brand-view', params);
}

export interface RunOptionsFilters {
  brands?: string[];
  fabrics: string[];
  fits: string[];
  patterns: string[];
  pattern_types: string[];
  lengths: string[];
  neck_types: string[];
  weaves: string[];
  sleeves: string[];
  waists: string[];
  washes: string[];
  bricks: string[];
  statuses: string[];
}

export function fetchRunOptionsFilters(runId: string): Promise<RunOptionsFilters> {
  return bpFetch<RunOptionsFilters>(`/runs/${runId}/options/filters`);
}

export function fetchRunOptions(
  runId: string,
  params?: Record<string, string>,
): Promise<RunOptionsResponse> {
  return bpFetch<RunOptionsResponse>(`/runs/${runId}/options`, params);
}

export function downloadRunOptions(
  runId: string,
  params?: Record<string, string>,
): Promise<void> {
  const downloadParams: Record<string, string | number | boolean | undefined> = {
    ...params,
    download: true,
  };
  const filename = `buy-plan-${runId}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return apiFetchBlob(`${BUYPLAN}/runs/${runId}/options`, downloadParams, filename, IMPETUS_APP_BASE);
}

export function toggleOptionActive(
  optionId: number,
  isActive: boolean,
): Promise<ToggleResponse> {
  return bpPut<ToggleResponse>(`/options/${optionId}/toggle`, { is_enabled: isActive });
}

export function updateOptionQuantity(
  optionId: number,
  quantity: number,
  deliveryDate?: string | null,
  mrp?: number | null,
  costPrice?: number | null,
  costingDisabled?: boolean,
): Promise<QuantityUpdateResponse> {
  const payload: Record<string, unknown> = { quantity };
  if (deliveryDate !== undefined) {
    payload.delivery_date = deliveryDate;
  }
  if (mrp !== undefined) {
    payload.mrp = mrp;
  }
  if (costPrice !== undefined) {
    payload.cost_price = costPrice;
  }
  const params = costingDisabled ? '?costing_disabled=true' : '';
  return bpPut<QuantityUpdateResponse>(`/options/${optionId}/quantity${params}`, payload);
}

export function fetchBuyPlanHistory(
  runId: string,
): Promise<BuyPlanHistoryResponse> {
  return bpFetch<BuyPlanHistoryResponse>(`/runs/${runId}/history`);
}

export function downloadBrandView(params?: {
  brand?: string;
  segment?: string;
  family?: string;
  hit?: string;
  search?: string;
}): Promise<void> {
  const downloadParams: Record<string, string | number | boolean | undefined> = {
    ...params,
    download: true,
  };
  const filename = `buy-plans-brand-view-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return apiFetchBlob(`${BUYPLAN}/brand-view`, downloadParams, filename, IMPETUS_APP_BASE);
}

// ── Update Run Status ───────────────────────────────────────────────

export interface UpdateRunStatusResponse {
  run_id: string;
  buy_plan_id: string;
  status: string;
}

export function updateRunStatus(runId: string, status: string): Promise<UpdateRunStatusResponse> {
  return bpPut<UpdateRunStatusResponse>(`/runs/${runId}/options/status`, { status });
}

export function sendToDp(runId: string): Promise<UpdateRunStatusResponse> {
  return bpPut<UpdateRunStatusResponse>(`/runs/${runId}/send-to-dp`, {});
}

// ── Query Key Factory ───────────────────────────────────────────────

export const buyPlanKeys = {
  all: ['buyplan'] as const,
  filters: () => [...buyPlanKeys.all, 'filters'] as const,
  categories: (params?: Record<string, unknown>) => [...buyPlanKeys.all, 'categories', params] as const,
  fashionGrades: (categoryCode: string, params?: Record<string, unknown>) =>
    [...buyPlanKeys.all, 'fashion-grades', categoryCode, params] as const,
  options: (params: Record<string, unknown>) => [...buyPlanKeys.all, 'options', params] as const,
  brandViewFilters: (params?: Record<string, unknown>) => [...buyPlanKeys.all, 'brand-view-filters', params] as const,
  brandViewListing: (params?: Record<string, unknown>) => [...buyPlanKeys.all, 'brand-view', params] as const,
  runOptionsFilters: (runId: string) => [...buyPlanKeys.all, 'run-options-filters', runId] as const,
  runOptions: (runId: string, params?: Record<string, unknown>) =>
    [...buyPlanKeys.all, 'run-options', runId, params] as const,
  history: (runId: string) => [...buyPlanKeys.all, 'history', runId] as const,
};

