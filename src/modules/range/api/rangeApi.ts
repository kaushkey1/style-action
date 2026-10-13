import { appApiFetch, ApiService, IMPETUS_APP_BASE, IMPETUS_HEADERS } from '@/lib/api';

const RANGE = '/range';

// ─── Phase 1: Network Overview Types ────────────────────────────────────────

export interface RangeHit {
  hit: string;
  season: string;
  run_count: number;
  latest_run_version: number;
}

export interface HitsData {
  hits: RangeHit[];
  default_hit: string;
}

export interface HealthSummaryData {
  run_id: string | null;
  run_version: number | null;
  hit: string;
  core_fashion_split?: {
    core_options: number;
    fashion_options: number;
    total_options: number;
    core_pct: number;
    fashion_pct: number;
    status: string | null;
  };
  range_lock_progress?: {
    completed_segments: number;
    total_segments: number;
    pct: number;
    status: string | null;
  };
  ftf_adoption?: {
    ftf_bricks: number;
    total_bricks: number;
    ftf_pct: number;
    status: string | null;
  };
  fixture_utilization?: {
    inventory_count: number | null;
    operating_area: number | null;
    pct: number | null;
    status: string | null;
  };
}

export interface SegmentRow {
  segment_code: string;
  segment_name: string;
  total_options: number;
  target_options: number | null;
  buy_qty: number;
  fashion_pct: number;
  ftf_adoption_pct: number;
  store_count: number;
  total_stores: number | null;
  run_status: string;
  bm_count: number | null;
  alert: string | null;
}

export interface SegmentsData {
  segments: SegmentRow[];
  run_id: string | null;
  total_segments: number;
}

export interface FilterOptionsData {
  hits: string[];
  seasons: string[];
  segments: { code: string; name: string }[];
  families: { code: string; name: string; segment: string }[];
  stores: { site: string; site_name: string }[];
}

// ─── Phase 2: Segment Overview Types ────────────────────────────────────────

export interface SegmentSummaryData {
  segment_code: string;
  segment_name: string;
  range_progress: {
    options_planned: number;
    options_target: number | null;
    pct: number | null;
    status: string | null;
  };
  aop_target: {
    current_value: number;
    target_value: number | null;
    pct: number | null;
    status: string | null;
  };
  ftf_adoption: {
    ftf_bricks: number;
    total_bricks: number;
    ftf_pct: number;
    status: string | null;
  };
  fixture_utilization: {
    inventory_count: number | null;
    operating_area: number | null;
    pct: number | null;
    status: string | null;
  };
}

export interface FamilyRow {
  family_code: string;
  family_name: string;
  total_options: number;
  buy_qty: number;
  fashion_pct: number;
  ftf_adoption_pct: number;
  store_count: number;
  brick_count: number;
}

export interface FamiliesData {
  families: FamilyRow[];
  run_id: string | null;
  total_families: number;
}

export interface BuyingModel {
  bm_code: string;
  bm_name: string;
  short_name: string;
  share_pct: number;
  option_target: number;
  options_built: number | null;
  status: string;
}

export interface BuyingModelsData {
  segment_code: string;
  segment_name: string;
  buying_models: BuyingModel[];
  summary: {
    total_options_target: number;
  };
}

// ─── Phase 3: Store Range Types ─────────────────────────────────────────────

export interface StoreRow {
  site: string;
  site_name: string;
  total_options: number;
  buy_qty: number;
  core_pct: number;
  fashion_pct: number;
  ly_str_pct: number;
  past_sales_amount: number;
  store_grade: string | null;
  region: string | null;
  manager: string | null;
  fixture_utilization_pct: number | null;
}

export interface StoresSummary {
  total_stores: number;
  total_options: number;
  avg_aop_achievement_pct: number | null;
  avg_otb_utilization_pct: number | null;
}

export interface Pagination {
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
}

export interface StoresData {
  stores: StoreRow[];
  summary: StoresSummary;
  pagination: Pagination;
}

export interface StoreSegmentBreakdown {
  segment_code: string;
  segment_name: string;
  options: number;
  buy_qty: number;
  fashion_pct: number;
}

export interface StoreDetailData {
  site: string;
  site_name: string;
  metrics: {
    total_options: number;
    total_buy_qty: number;
    ly_str_pct: number;
    past_sales_amount: number;
    fixture_utilization_pct: number | null;
  };
  segments: StoreSegmentBreakdown[];
}

// ─── Phase 4: Runs & Versions Types ─────────────────────────────────────────

export interface RunRow {
  run_id: string;
  run_version: number;
  run_type: string | null;
  status: string;
  ra_name: string;
  brand_id: string;
  brand_id_desc: string;
  level2: string;
  level2_desc: string;
  level3: string;
  level3_desc: string;
  fashion_grade: string | null;
  season: string;
  hit: string;
  total_quantity: number;
  start_timestamp: string;
  end_timestamp: string;
  duration_seconds: number;
  input_records: number;
  output_records: number;
  filtered_records: number;
  triggered_by: string | null;
  trigger_source: string | null;
}

export interface RunsData {
  runs: RunRow[];
  pagination: Pagination;
}

export interface VersionComparison {
  brick_name: string;
  brand: string;
  segment: string;
  family: string;
  version_1: number;
  buy_qty_v1: number;
  buy_options_v1: number;
  version_2: number;
  buy_qty_v2: number;
  buy_options_v2: number;
  qty_difference: number;
  options_difference: number;
  qty_pct_change: number;
  version_1_date: string;
  version_2_date: string;
}

export interface VersionCompareData {
  comparisons: VersionComparison[];
}

// ─── Phase 5: Family/Brick Detail Types ─────────────────────────────────────

export interface FamilyDetailData {
  family_code: string;
  family_name: string;
  performance: {
    options_planned: number;
    budget: number;
    progress_pct: number | null;
    store_count: number;
    contribution_pct: number | null;
  };
  composition: {
    core_pct: number;
    fashion_pct: number;
    blended_asp: number;
    price_range_min: number;
    price_range_max: number;
  };
  attributes: {
    silhouettes: { value: string; count: number }[];
    fabric_types: { value: string; count: number }[];
    patterns: { value: string; count: number }[];
    colors: { value: string; count: number }[];
    price_points: { min: number | null; max: number | null; mode: number | null };
  };
  bricks: { brick_code: string; brick_name: string; options: number; buy_qty: number }[];
}

export interface BrickRow {
  result_id: string;
  brick_code: string;
  brick_name: string;
  silhouette: string;
  fabric: string;
  print: string;
  fashion_grade: string;
  fashion_grade_desc: string;
  dominant_source: string;
  data_source: string;
  historical: { price_min: number; price_max: number; options: number; qty: number };
  system: { price_min: number; price_max: number; options: number; qty: number };
  buyer: {
    price_min: number | null;
    price_max: number | null;
    options: number | null;
    qty: number | null;
  };
  ros: number;
  asp: number;
  confidence_score: number;
  include: boolean;
}

export interface BricksData {
  bricks: BrickRow[];
  totals: {
    total_combinations: number;
    system_options: number;
    buyer_options: number | null;
    system_qty: number;
    buyer_qty: number | null;
  };
  pagination?: Pagination;
  run_id: string;
  run_version: number;
}

export interface BuyerEditPayload {
  buyer_options: number;
  buyer_qty: number;
  buyer_price_point_min?: number;
  buyer_price_point_max?: number;
}

export interface BuyerEditResult {
  result_id: string;
  run_id: string;
  status: string;
  workflow_status: string;
}

export interface BulkBuyerEditPayload {
  edits: (BuyerEditPayload & { result_id: string })[];
}

export interface BulkBuyerEditResult {
  results: { result_id: string; status: string }[];
  total: number;
  run_id: string;
  workflow_status: string;
}

export interface BmAllocationPayload {
  allocations: {
    bm_code: string;
    label: string;
    share_pct: number;
    option_target: number;
  }[];
}

// ─── Trends Types ───────────────────────────────────────────────────────────

export interface TrendMetric {
  label: string;
  value: string;
  trend: string;
  change_pct: number;
}

export interface StrategicAction {
  priority: string;
  title: string;
  rationale: string;
  revenue_impact: string;
  timeline: string;
  affected_families: string[];
}

export interface TrendsData {
  segment_code: string;
  segment_name: string;
  executive_intelligence: { metrics: TrendMetric[] };
  strategic_actions: StrategicAction[];
  market_trends: {
    rising: { name: string; growth_pct: number; impact: string }[];
    declining: { name: string; decline_pct: number; reason: string }[];
    emerging: { name: string; revenue_potential: string; confidence: string }[];
  };
  seasonal_intel: unknown;
  competitive: unknown;
  performance: unknown;
  data_source: string;
}

// ─── Hierarchy Types ────────────────────────────────────────────────────────

export interface HierarchyChild {
  code: string;
  name: string;
  level: string;
  options: number;
  buy_qty: number;
}

export interface HierarchyData {
  code: string;
  name: string;
  level: string;
  breadcrumb: string[];
  summary: {
    total_options: number;
    total_buy_qty: number;
    past_sales_amount: number | null;
    ly_str_pct: number | null;
  };
  attributes: {
    silhouettes: { value: string; count: number }[];
    fabric_types: { value: string; count: number }[];
    patterns: { value: string; count: number }[];
    colors: { value: string; count: number }[];
    price_points: { min: number | null; max: number | null; mode: number | null };
  };
  children: HierarchyChild[];
  bm_split: unknown;
}

// ─── Phase 1: Network Overview Fetch Functions ──────────────────────────────

export function fetchHits(): Promise<HitsData> {
  return appApiFetch<HitsData>(`${RANGE}/hits`);
}

export function fetchHealthSummary(hit: string): Promise<HealthSummaryData> {
  return appApiFetch<HealthSummaryData>(`${RANGE}/health-summary`, { hit });
}

// Liveness probe for the Cortex Range Architecture service. That service is
// cluster-internal (unreachable from the browser), so we call our own backend
// proxy which relays the upstream /v1.0/healthz result.
export function fetchRangeArchitectureHealthz(): Promise<unknown> {
  return appApiFetch<unknown>(`${RANGE}/architecture-healthz`);
}

export function fetchSegments(
  hit: string,
  filters?: {
    segment?: string;
    fashion_grade?: string;
    brand?: string;
    format?: string;
    state?: string;
    city?: string;
    store?: string;
  },
): Promise<SegmentsData> {
  return appApiFetch<SegmentsData>(`${RANGE}/segments`, { hit, ...filters });
}

export function fetchFilterOptions(hit?: string): Promise<FilterOptionsData> {
  return appApiFetch<FilterOptionsData>(`${RANGE}/filter-options`, hit ? { hit } : undefined);
}

// ─── Phase 2: Segment Overview Fetch Functions ──────────────────────────────

export function fetchSegmentSummary(
  segmentCode: string,
  hit: string,
): Promise<SegmentSummaryData> {
  return appApiFetch<SegmentSummaryData>(`${RANGE}/segments/${segmentCode}/summary`, { hit });
}

export function fetchFamilies(
  segmentCode: string,
  hit: string,
): Promise<FamiliesData> {
  return appApiFetch<FamiliesData>(`${RANGE}/segments/${segmentCode}/families`, { hit });
}

export function fetchBuyingModels(
  segmentCode: string,
  hit: string,
): Promise<BuyingModelsData> {
  return appApiFetch<BuyingModelsData>(`${RANGE}/segments/${segmentCode}/buying-models`, { hit });
}

// ─── Phase 3: Store Range Fetch Functions ───────────────────────────────────

export function fetchStores(params: {
  hit: string;
  segment_code?: string;
  sort?: string;
  order?: string;
  page?: number;
  page_size?: number;
  state?: string;
  city?: string;
  store?: string;
  format?: string;
}): Promise<StoresData> {
  return appApiFetch<StoresData>(`${RANGE}/stores`, params);
}

export function fetchStoreDetail(
  storeId: string,
  hit: string,
  segmentCode?: string,
): Promise<StoreDetailData> {
  return appApiFetch<StoreDetailData>(`${RANGE}/stores/${storeId}`, {
    hit,
    segment_code: segmentCode,
  });
}

// ─── Phase 4: Runs & Versions Fetch Functions ───────────────────────────────

export function fetchRuns(params: {
  hit: string;
  status?: string;
  sort?: string;
  order?: string;
  page?: number;
  page_size?: number;
}): Promise<RunsData> {
  return appApiFetch<RunsData>(`${RANGE}/runs`, params);
}

export function fetchVersionCompare(params: {
  hit?: string;
  version_1?: number;
  version_2?: number;
  segment?: string;
}): Promise<VersionCompareData> {
  return appApiFetch<VersionCompareData>(`${RANGE}/versions/compare`, params);
}

// ─── Phase 5: Family/Brick Detail Fetch Functions ───────────────────────────

export function fetchFamilyDetail(
  segmentCode: string,
  familyCode: string,
  hit: string,
): Promise<FamilyDetailData> {
  return appApiFetch<FamilyDetailData>(
    `${RANGE}/segments/${segmentCode}/families/${familyCode}/detail`,
    { hit },
  );
}

export function fetchBricks(
  segmentCode: string,
  familyCode: string,
  hit: string,
  page?: number,
  pageSize?: number,
): Promise<BricksData> {
  return appApiFetch<BricksData>(
    `${RANGE}/segments/${segmentCode}/families/${familyCode}/bricks`,
    { hit, page, page_size: pageSize },
  );
}

export async function updateBuyerEdit(
  resultId: string,
  payload: BuyerEditPayload,
): Promise<BuyerEditResult> {
  const res = await ApiService.put(
    `${IMPETUS_APP_BASE}${RANGE}/bricks/${resultId}/buyer-edit`,
    { data: payload, headers: IMPETUS_HEADERS },
  );
  return res.data?.data ?? res.data;
}

export async function bulkBuyerEdit(
  payload: BulkBuyerEditPayload,
): Promise<BulkBuyerEditResult> {
  const res = await ApiService.post(
    `${IMPETUS_APP_BASE}${RANGE}/bricks/buyer-edit/bulk`,
    { data: payload, headers: IMPETUS_HEADERS },
  );
  return res.data?.data ?? res.data;
}

export async function saveBmAllocation(
  segmentCode: string,
  familyCode: string,
  payload: BmAllocationPayload,
): Promise<unknown> {
  const res = await ApiService.put(
    `${IMPETUS_APP_BASE}${RANGE}/segments/${segmentCode}/families/${familyCode}/bm-allocation`,
    { data: payload, headers: IMPETUS_HEADERS },
  );
  return res.data?.data ?? res.data;
}

// ─── Trends & Hierarchy Fetch Functions ─────────────────────────────────────

export function fetchTrends(
  segmentCode: string,
  hit: string,
): Promise<TrendsData> {
  return appApiFetch<TrendsData>(`${RANGE}/trends/${segmentCode}`, { hit });
}

export function fetchHierarchy(
  level: 'segment' | 'family' | 'brick',
  code: string,
  hit: string,
): Promise<HierarchyData> {
  return appApiFetch<HierarchyData>(`${RANGE}/hierarchy/${level}/${code}`, { hit });
}

// ─── Query Key Factory ────────────────────────────────────────────────────

export const rangeKeys = {
  all: ['range'] as const,
  hits: () => [...rangeKeys.all, 'hits'] as const,
  healthSummary: (hit: string) => [...rangeKeys.all, 'health-summary', hit] as const,
  segments: (hit: string, filters?: Record<string, unknown>) => [...rangeKeys.all, 'segments', hit, filters] as const,
  filterOptions: (hit?: string) => [...rangeKeys.all, 'filter-options', hit] as const,
  segmentSummary: (segmentCode: string, hit: string) => [...rangeKeys.all, 'segment-summary', segmentCode, hit] as const,
  families: (segmentCode: string, hit: string) => [...rangeKeys.all, 'families', segmentCode, hit] as const,
  buyingModels: (segmentCode: string, hit: string) => [...rangeKeys.all, 'buying-models', segmentCode, hit] as const,
  stores: (params: Record<string, unknown>) => [...rangeKeys.all, 'stores', params] as const,
  storeDetail: (storeId: string, hit: string, segmentCode?: string) =>
    [...rangeKeys.all, 'store-detail', storeId, hit, segmentCode] as const,
  runs: (params: Record<string, unknown>) => [...rangeKeys.all, 'runs', params] as const,
  versionCompare: (params: Record<string, unknown>) => [...rangeKeys.all, 'version-compare', params] as const,
  familyDetail: (segmentCode: string, familyCode: string, hit: string) =>
    [...rangeKeys.all, 'family-detail', segmentCode, familyCode, hit] as const,
  bricks: (segmentCode: string, familyCode: string, hit: string, page?: number, pageSize?: number) =>
    [...rangeKeys.all, 'bricks', segmentCode, familyCode, hit, page, pageSize] as const,
  trends: (segmentCode: string, hit: string) => [...rangeKeys.all, 'trends', segmentCode, hit] as const,
  hierarchy: (level: string, code: string, hit: string) => [...rangeKeys.all, 'hierarchy', level, code, hit] as const,
  networkOverviewFilters: (category?: string) => [...rangeKeys.all, 'no-filters', category] as const,
  networkOverview: (params: Record<string, unknown>) => [...rangeKeys.all, 'no-data', params] as const,
  networkOverviewDetail: (params: Record<string, unknown>) => [...rangeKeys.all, 'no-detail', params] as const,
  networkOverviewDetailFilters: (params: Record<string, unknown>) => [...rangeKeys.all, 'no-detail-filters', params] as const,
  networkOverviewDetailStores: (params: Record<string, unknown>) => [...rangeKeys.all, 'no-detail-stores', params] as const,
  activityLog: (runId?: string) => [...rangeKeys.all, 'activity-log', runId] as const,
  plmSubmission: (params: PlmSelection) => [...rangeKeys.all, 'plm-submission', params] as const,
  plmItems: (id: string, page: number) => [...rangeKeys.all, 'plm-items', id, page] as const,
};

// ─── Network Overview Types ────────────────────────────────────────────────

export interface NetworkOverviewFilterOption {
  code: string;
  label: string;
}

export interface NetworkOverviewFiltersData {
  categories: NetworkOverviewFilterOption[];
  subcategories: NetworkOverviewFilterOption[];
  grades: NetworkOverviewFilterOption[];
  statuses: string[];
  hits: string[];
}

export interface NetworkOverviewRow {
  category: string;
  subcategory: string;
  category_label?: string | null;
  subcategory_label?: string | null;
  fashion_grade: string;
  fashion_grade_desc: string | null;
  hit: string;
  options: number;
  buy_qty: number;
  mix_pct: number;
  ftf: number;
  stores: number;
  status: string;
  run_id: string;
  // Budget cap (VC-backed tenants): options/buy_qty above are already capped to the OTB budget.
  budget?: number | null; // OTB purchase budget for this slice (₹)
  plannedValue?: number | null; // RA planned value before cap (buy_qty × asp, ₹)
  totalValue?: number | null; // Σ(buy_qty × asp) — shown instead of Budget for non-Superdry orgs (₹)
  scalePct?: number | null; // scale applied (100 = uncapped)
  overBudget?: boolean;
  capped?: boolean;
  originalOptions?: number;
  originalBuyQty?: number;
}

export interface BudgetSummary {
  totalBudget: number;
  totalPlanned: number;
  totalCapped: number;
}

export interface NetworkOverviewData {
  items: NetworkOverviewRow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  budgetSummary?: BudgetSummary;
}

export interface NetworkOverviewDetailRow {
  brick_code: string;
  brick_name: string;
  brand: string | null;
  fabric: string | null;
  fit: string | null;
  length: string | null;
  pattern: string | null;
  color_count: number | null;
  colors: string | null;
  waist: string | null;
  neck: string | null;
  sleeve: string | null;
  wash: string | null;
  blend: string | null;
  weave: string | null;
  fashion_grade: string;
  fashion_grade_desc: string | null;
  source: string | null;
  store_spread: number | null;
  data_source: string | null;
  /** 'ra' = Range Architecture row, 'vc' = Vendor Catalogue row (Superdry merge only) */
  origin?: 'ra' | 'vc' | null;
  /** 'grey' = VC duplicate of an RA record (attribute match > threshold); 'normal' otherwise */
  display?: 'normal' | 'grey' | null;
  /** Attribute similarity score against the matched RA record (0–1), for grey rows */
  match_score?: number | null;
  price_range: {
    historical: string | null;
    system: string | null;
    buyer: string | null;
  };
  option_count: {
    historical: number;
    system: number;
    buyer: number | null;
  };
  total_quantity: {
    historical: number;
    system: number;
    buyer: number | null;
  };
}

export interface NetworkOverviewDetailData {
  items: NetworkOverviewDetailRow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  category: string;
  subcategory: string;
  fashion_grade: string;
  totals: {
    system_options: number;
    buyer_options: number;
    system_qty: number;
    buyer_qty: number;
  };
  // Budget cap (VC-backed): system/buyer options & qty above are scaled to the OTB budget.
  budget?: number | null;
  scalePct?: number | null;
  overBudget?: boolean;
}

export interface NetworkOverviewDetailFiltersData {
  bricks: string[];
  fabrics: string[];
  fits: string[];
  lengths: string[];
  patterns: string[];
}

// ─── Network Overview Fetch Functions ──────────────────────────────────────

export function fetchNetworkOverviewDetailFilters(params: {
  run_id: string;
  category: string;
  subcategory: string;
  fashion_grade: string;
}): Promise<NetworkOverviewDetailFiltersData> {
  return appApiFetch<NetworkOverviewDetailFiltersData>(`${RANGE}/network-overview/detail/filters`, params);
}

export function fetchNetworkOverviewDetail(params: {
  run_id: string;
  category: string;
  subcategory: string;
  fashion_grade: string;
  page?: number;
  page_size?: number;
  brick?: string;
  fabric?: string;
  fit?: string;
  length?: string;
  pattern?: string;
}): Promise<NetworkOverviewDetailData> {
  return appApiFetch<NetworkOverviewDetailData>(`${RANGE}/network-overview/detail`, params);
}

export interface StoreDetailItem {
  site: string;
  store_name: string | null;
  format: string | null;
  state: string | null;
  city: string | null;
  region: string | null;
}

export interface StoreDetailData {
  stores: StoreDetailItem[];
  total: number;
}

export function fetchNetworkOverviewDetailStores(params: {
  run_id: string;
  category: string;
  subcategory: string;
  fashion_grade: string;
  brick?: string;
  fabric?: string;
  fit?: string;
  length?: string;
  pattern?: string;
}): Promise<StoreDetailData> {
  return appApiFetch<StoreDetailData>(`${RANGE}/network-overview/detail/stores`, params);
}

export interface PlmSubmissionRecord {
  brick: string;
  brand: string;
  fabric: string;
  fit: string;
  pattern: string;
  color: string;
  length: string;
  fashion_type: string;
  mrp: number;
  quantity: number;
  result: 'created' | 'already_exists' | 'failed';
  style_code: string | null;
  style_id: string | null;
  error: string | null;
}

export interface RAActivityLogPayload {
  submitted?: number;
  succeeded?: number;
  failed?: number;
  records?: PlmSubmissionRecord[];
}

export interface RAActivityLogItem {
  id: string;
  run_id: string;
  action: string;
  category: string | null;
  subcategory: string | null;
  fashion_grade: string | null;
  status: string;
  created_by: string | null;
  created_at: string | null;
  payload: RAActivityLogPayload | null;
}

export interface RAActivityLogData {
  items: RAActivityLogItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export function fetchRAActivityLog(params: {
  run_id?: string;
  page?: number;
  page_size?: number;
}): Promise<RAActivityLogData> {
  return appApiFetch<RAActivityLogData>(`${RANGE}/activity-log`, params);
}

export interface LegacySubmitToPlmResult {
  submitted: number;
  succeeded: number;
  failed: number;
  run_id: string;
  status: string;
  errors?: { brick: string; brand: string; error: string }[];
  message?: string;
}

export interface PlmSelection {
  run_id: string;
  category: string;
  subcategory: string;
  fashion_grade: string;
}

export interface PlmSubmissionData extends PlmSelection {
  submission_id: string;
  transport: 'http' | 'kafka';
  status: 'ACCEPTED' | 'PUBLISHING' | 'PUBLISHED' | 'PARTIAL_FAILURE' | 'FAILED' | 'NEEDS_REVIEW' | 'PAUSED' | 'HTTP_COMPLETED';
  display_status: string;
  total: number;
  greyed: number;
  counts: { pending: number; publishing: number; published: number; failed: number; unknown: number };
  created_at: string;
  plm_creation_status: 'not_tracked';
  processing?: PlmProcessingSummary;
  legacy_result: LegacySubmitToPlmResult | null;
}

export interface PlmProcessingSummary {
  status: 'NOT_TRACKED' | 'AWAITING_RESPONSE' | 'SUCCESS' | 'PARTIAL_FAILURE' | 'VALIDATION_FAILED' | 'FAILED' | 'NEEDS_REVIEW';
  counts: { awaiting: number; success: number; validation_failed: number; failed?: number; skipped: number; not_tracked: number };
}

export interface PlmProcessingResult {
  correlation_id: string;
  status: 'SUCCESS' | 'VALIDATION_FAILED' | 'SKIPPED' | 'FAILED';
  timestamp?: string | null;
  job_id?: string | null;
  option_code?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  error?: string | null;
  errors?: string[] | null;
  style_id?: string | null;
  style_code?: string | null;
}

export interface PlmSubmissionLookup {
  transport: 'http' | 'kafka';
  submission: PlmSubmissionData | null;
}

export interface PlmPublicationItem {
  id: string;
  state: 'PENDING' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'UNKNOWN';
  error_code: string | null;
  retry_eligible: boolean;
  attempts: number;
  ack_requested?: boolean;
  plm_result?: PlmProcessingResult | null;
  plm_received_at?: string | null;
  style: {
    brick_name?: string; brand_desc?: string; fit?: string; pattern_type?: string;
    color?: string; length?: string; fabric?: { type?: string };
  };
}

export type SubmitToPlmResult = LegacySubmitToPlmResult | PlmSubmissionData;

export function fetchPlmSubmission(params: PlmSelection): Promise<PlmSubmissionLookup> {
  return appApiFetch<PlmSubmissionLookup>(`${RANGE}/plm-submissions`, { ...params });
}

export function fetchPlmSubmissionItems(id: string, page: number): Promise<{
  items: PlmPublicationItem[]; total: number; page: number; page_size: number;
}> {
  return appApiFetch(`${RANGE}/plm-submissions/${encodeURIComponent(id)}/items`, { page, page_size: 50 });
}

export async function retryPlmSubmission(id: string): Promise<PlmSubmissionData> {
  const res = await ApiService.post(
    `${IMPETUS_APP_BASE}${RANGE}/plm-submissions/${encodeURIComponent(id)}/retry`,
    { headers: IMPETUS_HEADERS },
  );
  return res.data?.data ?? res.data;
}

export async function submitToPlm(params: PlmSelection): Promise<SubmitToPlmResult> {
  const qs = new URLSearchParams({ ...params }).toString();
  const res = await ApiService.post(
    `${IMPETUS_APP_BASE}${RANGE}/network-overview/submit-to-plm?${qs}`,
    { headers: IMPETUS_HEADERS },
  );
  return res.data?.data ?? res.data;
}

export function fetchNetworkOverviewFilters(category?: string): Promise<NetworkOverviewFiltersData> {
  return appApiFetch<NetworkOverviewFiltersData>(
    `${RANGE}/network-overview/filters`,
    category ? { category } : undefined,
  );
}

export function fetchNetworkOverview(params: {
  hit: string;
  category?: string;
  subcategory?: string;
  fashion_grade?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<NetworkOverviewData> {
  return appApiFetch<NetworkOverviewData>(`${RANGE}/network-overview`, params);
}
