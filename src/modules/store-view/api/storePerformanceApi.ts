import { appApiFetch } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StoreListItem {
  store_code: string;
  store_name: string;
  city: string | null;
  grade: string | null;
  region: string | null;
  format_std: string | null;
  sqft: number | null;
  monthly_revenue: number | null;
  options: number | null;
  total_usable_sqft: number | null;
  total_gross_sales: number | null;
  total_net_sales: number | null;
  aop_net_revenue: number | null;
  aop_gross_revenue: number | null;
  gross_sales_achievement: number | null;
  net_sales_achievement: number | null;
  spsf: number | null;
  gmrof: number | null;
  store_age_months: number | null;
  store_launch_date: string | null;
  nrm_pct: number | null;
  aop_gross_margin: number | null;
  total_gross_margin: number | null;
  gross_margin_achievement: number | null;
  fresh_pct: number | null;
  options_instock_age_below_45: number | null;
  options_instock_age_between_45_90: number | null;
  options_instock_age_over_90: number | null;
  fillrate: number | null;
  month_closing_stock_qty: number | null;
  DOH?: number | null;
  dead_capital?: number | null;
  zero_sales_option_pct?: number | null;
  zero_sales_option_count?: number | null;
  gross_margin_pct?: number | null;
  total_units_sold?: number | null;
  billing_days?: number | null;
}

export interface StoreListResponse {
  data: StoreListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
}

export interface KpiSummary {
  gross_sales_aop: number | null;
  gross_sales_actual: number | null;
  achievement_pct: number | null;
  avg_nrm_pct: number | null;
  store_count: number;
  total_sqft: number;
}

export interface AopVsActualRow {
  store_grade: string | null;
  gross_sales_aop: number | null;
  gross_sales_actual: number | null;
}

export interface NrmByClusterRow {
  store_grade: string | null;
  avg_nrm_pct: number | null;
}

export interface ClusterData {
  aop_vs_actual: AopVsActualRow[];
  nrm_by_cluster: NrmByClusterRow[];
}

export interface FilterGradesResponse {
  grades: string[];
}

export interface FilterFormatsResponse {
  formats: string[];
}

export interface FilterRegionsResponse {
  regions: string[];
}

export interface FilterCitiesResponse {
  cities: string[];
}

// ---------------------------------------------------------------------------
// Fixture View types
// ---------------------------------------------------------------------------

export interface FixtureOverlayItem {
  site: string | null;
  category_desc: string | null;
  fixture_type: string | null;
  fixture_count: number | null;
  slots: number | null;
  filledslots: number | null;
}

export interface FixtureViewResponse {
  total_fixtures: number | null;
  current_stock: number | null;
  max_capacity: number | null;
  avg_utilization: number | null;
  overlay: FixtureOverlayItem[];
}

// ---------------------------------------------------------------------------
// Filter params builder
// ---------------------------------------------------------------------------

export interface StorePerformanceFilterParams {
  year_month?: string;
  startDate?: string;
  endDate?: string;
  format_std?: string;
  store_grade?: string;
  region?: string;
  city?: string;
  search?: string;
  category?: string;
  store_codes?: string;
}

function buildParams(filters: StorePerformanceFilterParams): Record<string, string | undefined> {
  return {
    year_month: filters.year_month || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    format_std: filters.format_std || undefined,
    store_grade: filters.store_grade || undefined,
    region: filters.region || undefined,
    city: filters.city || undefined,
    search: filters.search || undefined,
    category: filters.category || undefined,
    store_codes: filters.store_codes || undefined,
  };
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

const BASE = "/store-view";

export const storePerformanceApi = {
  list: (filters: StorePerformanceFilterParams, page: number, pageSize: number): Promise<StoreListResponse> =>
    appApiFetch<StoreListResponse>(`${BASE}/list`, {
      ...buildParams(filters),
      page,
      page_size: pageSize,
    }),

  kpiSummary: (filters: StorePerformanceFilterParams): Promise<KpiSummary> =>
    appApiFetch<KpiSummary>(`${BASE}/kpi-summary`, buildParams(filters)),

  clusterData: (filters: StorePerformanceFilterParams): Promise<ClusterData> =>
    appApiFetch<ClusterData>(`${BASE}/cluster-data`, buildParams(filters)),

  filterGrades: (filters?: StorePerformanceFilterParams): Promise<FilterGradesResponse> =>
    appApiFetch<FilterGradesResponse>(`${BASE}/filters/grades`, filters ? buildParams(filters) : undefined),

  filterFormats: (filters?: StorePerformanceFilterParams): Promise<FilterFormatsResponse> =>
    appApiFetch<FilterFormatsResponse>(`${BASE}/filters/formats`, filters ? buildParams(filters) : undefined),

  filterRegions: (filters?: StorePerformanceFilterParams): Promise<FilterRegionsResponse> =>
    appApiFetch<FilterRegionsResponse>(`${BASE}/filters/regions`, filters ? buildParams(filters) : undefined),

  filterCities: (filters?: StorePerformanceFilterParams): Promise<FilterCitiesResponse> =>
    appApiFetch<FilterCitiesResponse>(`${BASE}/filters/cities`, filters ? buildParams(filters) : undefined),

  fixtureView: (storeId: string, yearMonth?: string): Promise<FixtureViewResponse> =>
    appApiFetch<FixtureViewResponse>(`${BASE}/fixture`, {
      store_id: storeId,
      ...(yearMonth ? { year_month: yearMonth } : {}),
    }),
};
