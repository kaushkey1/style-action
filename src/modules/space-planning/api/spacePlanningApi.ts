import { appApiFetch } from '@/lib/api';

export interface SpaceStore {
  site: string;
  store_name: string;
  city: string;
  grade: string;
  format: string;
  zone: string;
  spsf: number | null;
  spsf_target: number | null;
  gmrof: number | null;
  aop_gap_pct: number | null;
  carpet_area: number | null;
  saleable_area: number | null;
  fixture_utilization_pct: number | null;
  spsf_status: string | null;
  plan_status: string | null;
  total_fixtures: number | null;
  total_option_capacity: number | null;
  total_garment_capacity: number | null;
  stocking_density: number | null;
  fashion_split_compliant: boolean | null;
}

export interface SpaceStoreListResponse {
  items: SpaceStore[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface SpaceFilterOptions {
  grade: FilterOption[];
  zone: FilterOption[];
  format: FilterOption[];
  status: FilterOption[];
}

export interface AreaBreakdown {
  carpet_area: number | null;
  saleable_area: number | null;
  saleable_pct: number | null;
  deductions_pct: number | null;
  deductions_total: number | null;
  deductions: {
    back_of_house: number | null;
    aisles: number | null;
    trial_rooms: number | null;
    cash_counters: number | null;
    decompression: number | null;
  };
}

export interface StoreProfile extends SpaceStore {
  saleable_ratio: number | null;
  projected_spsf: number | null;
  fashion_split_core_pct: number | null;
  fashion_split_fashion_pct: number | null;
  daily_run_rate: number | null;
  footfall: number | null;
  avg_basket: number | null;
  aop_target: number | null;
  run_rate: number | null;
  catchment_desc: string | null;
}

export interface CategoryItem {
  category_cd: string;
  category_desc: string;
  subcategory_cd: string;
  subcategory_desc: string;
  fashion_grade: string;
  allocated_sft: number | null;
  subcategory_share: number | null;
  fixture_count: number | null;
  plan_options: number | null;
  plan_qty: number | null;
  projected_spsf: number | null;
  spsf_status: string | null;
  display_options: number | null;
  viable_options: number | null;
  ros_per_option: number | null;
  total_sales: number | null;
  brand_pool: string;
  depth_per_option: number | null;
  season: string;
}

export interface Recommendation {
  id: string;
  rule_type: string;
  trigger_description: string;
  action_description: string;
  constraint_description: string | null;
  impact_spsf_delta: number | null;
  impact_gmrof_delta: number | null;
  status: string;
  details: Record<string, unknown> | null;
}

export interface SegmentItem {
  segment_cd: string;
  segment_name: string;
  space_pct: number | null;
  space_sft: number | null;
  nsv_pct: number | null;
  net_sales_value: number | null;
  efficiency: number | null;
  gmrof: number | null;
  spsf: number | null;
  trend: number | null;
  options: number | null;
  sell_thru_pct: number | null;
  fixture_count: number | null;
  fixture_utilization_pct: number | null;
  status: string | null;
  action: string | null;
  gross_margin: number | null;
  gm_pct: number | null;
}

export interface StoreDetailResponse {
  profile: StoreProfile | null;
  area_breakdown: AreaBreakdown | null;
  segments: SegmentItem[];
  categories: CategoryItem[];
  recommendations: Recommendation[];
}

export interface SpaceSummary {
  run_id: string;
  total_stores: number;
  total_carpet_area: number | null;
  avg_spsf: number | null;
  avg_gmrof: number | null;
  avg_fixture_utilization: number | null;
  stores_on_target: number | null;
  stores_below_target: number | null;
  stores_critical: number | null;
  stores_above_stretch: number | null;
  fashion_split_compliant_count: number;
  fashion_split_non_compliant_count: number;
}

export interface FormatSummaryItem {
  format: string;
  store_count: number;
  avg_spsf: number | null;
  avg_gmrof: number | null;
  avg_carpet_area: number | null;
  avg_fixture_utilization: number | null;
  on_target_count: number | null;
  below_target_count: number | null;
}

export function fetchStores(params: Record<string, string | number | boolean | undefined>): Promise<SpaceStoreListResponse> {
  return appApiFetch<SpaceStoreListResponse>('/space-planning/stores', params);
}

export function fetchFilterOptions(): Promise<SpaceFilterOptions> {
  return appApiFetch<SpaceFilterOptions>('/space-planning/filter-options');
}

export function fetchStoreDetail(site: string): Promise<StoreDetailResponse> {
  return appApiFetch<StoreDetailResponse>(`/space-planning/stores/${site}/detail`);
}

export function fetchSummary(): Promise<SpaceSummary> {
  return appApiFetch<SpaceSummary>('/space-planning/summary');
}

export function fetchFormatSummary(): Promise<{ formats: FormatSummaryItem[] }> {
  return appApiFetch<{ formats: FormatSummaryItem[] }>('/space-planning/format-summary');
}
