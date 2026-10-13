import { useQuery } from '@tanstack/react-query';
import { appApiFetch } from '@/lib/api';

// ─── Query key factory ─────────────────────────────────────────────

export const storeProductKeys = {
  all: ['store-product'] as const,
  list: (site: string, from: string, to: string) =>
    [...storeProductKeys.all, 'list', site, from, to] as const,
  metrics: (site: string, optionCode: string, from: string, to: string) =>
    [...storeProductKeys.all, 'metrics', site, optionCode, from, to] as const,
  detail: (site: string, optionCode: string, from: string, to: string) =>
    [...storeProductKeys.all, 'detail', site, optionCode, from, to] as const,
};

// ─── Types ─────────────────────────────────────────────────────────

export interface ProductListItem {
  option_code: string;
  segment: string | null;
  family: string | null;
  class_level: string | null;
  category: string | null;
  subcategory: string | null;
  color: string | null;
  fashion_grade: string;
  fashion_grade_desc: string;
  brand: string | null;
  sellable_stock: number;
  age_days: number;
  first_grn_date: string | null;
  units_sold: number;
  gross_sales: number;
  net_sales: number;
  gross_margin_rs: number;
  total_markdown: number;
  sell_through_pct: number;
  markdown_pct: number;
  fill_rate_pct: number;
  health_score: number;
  is_aged: boolean;
  is_new: boolean;
  image_url: string | null;
  foh_qty?: number | null;
  boh_qty?: number | null;
}

export interface ProductListKpis {
  total_options: number;
  avg_sell_through: number;
  aged_count: number;
  avg_markdown: number;
  broken_options?: number;
}

export interface ProductListResponse {
  products: ProductListItem[];
  total: number;
  offset: number;
  limit: number;
  kpis: ProductListKpis;
}

export interface FullPriceST {
  fp_st_7d_pct: number | null;
  fp_st_14d_pct: number | null;
  fp_st_30d_pct: number | null;
}

export interface ProductMetricsResponse {
  units_sold: number;
  units_received: number;
  sellable_stock: number;
  total_stock_qty: number;
  sell_through_pct: number;
  ros_14d: number;
  days_on_hand: number | null;
  forward_cover_weeks: number | null;
  markdown_pct: number;
  asp: number;
  gross_sales: number;
  net_sales: number;
  sale_days: number;
  full_price_sold_qty: number;
  fp_sell_through_pct: number;
  age_days: number;
  first_grn_date: string | null;
  full_price_st: FullPriceST;
}

export interface SizeEntry {
  size: string;
  qty: number;
}

export interface SizeBreakdown {
  sizes: SizeEntry[];
  fill_rate_pct: number;
  broken_sizes: string[];
  total_sizes: number;
  available_sizes: number;
}

export interface HealthScoreComponents {
  st_attainment: number;
  markdown_discipline: number;
  size_health: number;
  age_risk: number;
  total_size_health: number;
}

export interface ProductAttributes {
  style: string | null;
  category: string | null;
  subcategory: string | null;
  segment: string | null;
  family: string | null;
  class_level: string | null;
  brick: string | null;
  color: string | null;
  fabric: string | null;
  fashion_grade: string | null;
  fashion_grade_desc: string | null;
  brand: string | null;
  season: string | null;
  season_year: string | null;
  fit?: string | null;
  sleeve?: string | null;
  pattern?: string | null;
  mood?: string | null;
  neckline?: string | null;
  length1?: string | null;
  store_grn_date?: string | null;
}

export interface ProductDetailResponse {
  size_breakdown: SizeBreakdown;
  attributes: ProductAttributes | null;
  summary: {
    fp_sell_through_pct: number | null;
    age_days: number | null;
    store_age_days: number | null;
    store_launch_date: string | null;
  } | null;
  percolation: {
    state: string;
    origin_site: string | null;
    store_age_days: number | null;
    store_grn_date: string | null;
    store_launch_date: string | null;
  };
  network: {
    network_st_pct: number;
    network_ros: number;
    network_age_days: number;
    sellable_qty: number;
  };
  health_score: {
    score: number;
    components: HealthScoreComponents;
  };
  image_urls: string[];
}

// ─── Types: Filters ────────────────────────────────────────────────

export interface StoreFiltersResponse {
  categories: string[];
  subcategories: string[];
  fashion_grades: string[];
}

// ─── API functions ─────────────────────────────────────────────────

export function fetchStoreFilters(
  site: string,
  fromDate: string,
  toDate: string,
  category?: string,
): Promise<StoreFiltersResponse> {
  return appApiFetch<StoreFiltersResponse>(
    `/store-product/${site}/filters`,
    { from_date: fromDate, to_date: toDate, ...(category ? { categories: category } : {}) },
  );
}

export function fetchProductList(
  site: string,
  fromDate: string,
  toDate: string,
  params?: {
    category?: string;
    family?: string;
    fashion_grade?: string;
    search?: string;
    sort_by?: string;
    sort_dir?: string;
    limit?: number;
    offset?: number;
  },
): Promise<ProductListResponse> {
  return appApiFetch<ProductListResponse>(
    `/store-product/${site}/list`,
    { from_date: fromDate, to_date: toDate, ...params },
  );
}

export function fetchProductMetrics(
  site: string,
  optionCode: string,
  fromDate: string,
  toDate: string,
): Promise<ProductMetricsResponse> {
  return appApiFetch<ProductMetricsResponse>(
    `/store-product/${site}/${optionCode}/metrics`,
    { from_date: fromDate, to_date: toDate },
  );
}

export function fetchProductDetail(
  site: string,
  optionCode: string,
  fromDate: string,
  toDate: string,
): Promise<ProductDetailResponse> {
  return appApiFetch<ProductDetailResponse>(
    `/store-product/${site}/${optionCode}/detail`,
    { from_date: fromDate, to_date: toDate },
  );
}

// ─── Date helpers ──────────────────────────────────────────────────

function getDefaultDateRange(): { fromDate: string; toDate: string } {
  const to = new Date();
  to.setDate(to.getDate() - 1);
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  const fmt = (d: Date): string => d.toISOString().split('T')[0] ?? '';
  return { fromDate: fmt(from), toDate: fmt(to) };
}

// ─── TanStack Query hooks ──────────────────────────────────────────

export function useStoreFilters(site: string | undefined, fromDate?: string, toDate?: string, category?: string) {
  const defaults = getDefaultDateRange();
  const fd = fromDate ?? defaults.fromDate;
  const td = toDate ?? defaults.toDate;
  return useQuery({
    queryKey: [...storeProductKeys.all, 'filters', site ?? '', fd, td, category ?? ''],
    queryFn: () => fetchStoreFilters(site!, fd, td, category),
    enabled: !!site,
    staleTime: 30 * 60 * 1000,
  });
}

export function useProductList(
  site: string | undefined,
  params?: {
    category?: string;
    family?: string;
    fashion_grade?: string;
    search?: string;
    sort_by?: string;
    sort_dir?: string;
    limit?: number;
    offset?: number;
  },
  fromDate?: string,
  toDate?: string,
) {
  const defaults = getDefaultDateRange();
  const fd = fromDate ?? defaults.fromDate;
  const td = toDate ?? defaults.toDate;
  return useQuery({
    queryKey: [...storeProductKeys.list(site ?? '', fd, td), params],
    queryFn: () => fetchProductList(site!, fd, td, params),
    enabled: !!site,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductMetrics(site: string | undefined, optionCode: string | undefined, fromDate?: string, toDate?: string) {
  const defaults = getDefaultDateRange();
  const fd = fromDate ?? defaults.fromDate;
  const td = toDate ?? defaults.toDate;
  return useQuery({
    queryKey: storeProductKeys.metrics(site ?? '', optionCode ?? '', fd, td),
    queryFn: () => fetchProductMetrics(site!, optionCode!, fd, td),
    enabled: !!site && !!optionCode,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductDetail(site: string | undefined, optionCode: string | undefined, fromDate?: string, toDate?: string) {
  const defaults = getDefaultDateRange();
  const fd = fromDate ?? defaults.fromDate;
  const td = toDate ?? defaults.toDate;
  return useQuery({
    queryKey: storeProductKeys.detail(site ?? '', optionCode ?? '', fd, td),
    queryFn: () => fetchProductDetail(site!, optionCode!, fd, td),
    enabled: !!site && !!optionCode,
    staleTime: 5 * 60 * 1000,
  });
}
