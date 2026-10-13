import { appApiFetch, apiFetchBlob, appApiPost, IMPETUS_APP_BASE } from "@/lib/api";
import type { InventoryFilters } from "../stores/useInventoryFilterStore";

// --- Shared types ---

interface RAGStatus {
  status: string;
  value: number | null;
  target: number | null;
  subtitle: string | null;
}

interface AgeBucketBreakdown {
  bucket: string;
  range: string;
  units: number;
  value_cr: number;
  pct: number;
}

export interface HealthSummaryData {
  total_value_cr: number;
  total_units: number;
  inventory_turns: number;
  turns_rag: RAGStatus;
  full_price_st_pct: number;
  st_rag: RAGStatus;
  noos_stockout_count: number;
  noos_rag: RAGStatus;
  aged_stock_pct: number;
  aged_rag: RAGStatus;
  aa1_exit_count: number;
  aa1_exit_rag: RAGStatus;
  a2_exit_count: number;
  a2_exit_rag: RAGStatus;
  pullback_count: number;
  pullback_rag: RAGStatus;
  age_buckets: AgeBucketBreakdown[];
  // Tab totals
  total_lifecycle_items: number;
  total_noos_items: number;
  total_noos_healthy: number;
  total_noos_warning: number;
  total_markdown_items: number;
  total_clearance_items: number;
  total_stores: number;
  total_rotation_alerts: number;
  // Lifecycle tracker full-dataset aggregates
  lc_a_a1_count: number;
  lc_triage_count: number;
  lc_forced_exit_count: number;
  lc_checkpoint_total: number;
  lc_checkpoint_40_45: number;
  lc_checkpoint_85_90: number;
  lc_checkpoint_115_120: number;
  // Store freshness full-dataset aggregates
  sf_compliant: number;
  sf_total: number;
  sf_avg_fashion_age_days: number;
  sf_total_exit_queue: number;
  // Store freshness grade breakdown
  sf_grade_a_count: number;
  sf_grade_a1_count: number;
  sf_grade_a2_count: number;
  sf_grade_a3_count: number;
  // Store freshness compliance breakdown
  sf_compliant_count: number;
  sf_at_risk_count: number;
  sf_non_compliant_count: number;
  // Markdown & clearance full-dataset aggregates
  md_active_count: number;
  md_total_units: number;
  md_margin_erosion_lakh: number;
  md_stage1_count: number;
  md_stage1_units: number;
  md_stage2_count: number;
  md_stage2_units: number;
  cl_liquidation_count: number;
  cl_liquidation_units: number;
  cl_exit_count: number;
  cl_exit_units: number;
}

export interface LifecycleItem {
  id: string;
  option_code: string;
  style_name: string | null;
  category: string | null;
  launch_date: string | null;
  network_age_days: number;
  current_phase: string | null;
  current_store_tier: string | null;
  total_units: number;
  units_sold: number;
  sell_through_pct: number;
  store_count: number;
  ros_current: number;
  markdown_pct: number;
  markdown_stage: number;
  value_at_cost_lakh: number;
  value_at_mrp_lakh: number;
  margin_erosion_lakh: number;
  grade: string | null;
  days_until_forced_exit: number | null;
  forced_exit_triggered: boolean;
  checkpoint: string | null;
  checkpoint_status: string | null;
  target_sell_through_pct: number | null;
  value_at_risk_lakh: number;
  day7_signal: string | null;
  day14_signal: string | null;
  sell_through_vs_plan: number | null;
  ros_trend: string | null;
  projected_day60_st_pct: number | null;
  root_cause: string | null;
  intervention: string | null;
}

export interface NOOSItem {
  id: string;
  option_code: string;
  style_name: string | null;
  category: string | null;
  stores_in_stock: number;
  stores_stockout: number;
  total_planned_stores: number;
  avg_cover_days: number | null;
  min_cover_days: number | null;
  max_cover_days: number | null;
  size_completeness_pct: number | null;
  bsi: number | null;
  missing_sizes: string[];
  stores_below_80_size_pct: number;
  total_units: number;
  avg_str_pct: number | null;
  status: string;
  replen_orders_pending: number | null;
  replen_orders_in_transit: number | null;
  fill_rate_pct: number | null;
  auto_resolution_rate: number | null;
  vendor_fg_adequacy_pct: number | null;
  action_status: string | null;
}

export interface MarkdownItem {
  id: string;
  option_code: string;
  style_name: string | null;
  category: string | null;
  network_age_days: number;
  markdown_pct: number;
  remaining_units: number;
  original_mrp: number;
  current_price: number;
  margin_at_current_price: number;
  sell_through_pct: number;
  markdown_stage: number | null;
  pre_markdown_ros: number | null;
  post_markdown_ros: number | null;
  ros_lift_pct: number | null;
  next_trigger_date: string | null;
  channel: string | null;
  status: string | null;
}

export interface ClearanceItem {
  id: string;
  option_code: string;
  style_name: string | null;
  category: string | null;
  network_age_days: number;
  remaining_units: number;
  value_at_cost_lakh: number;
  sell_through_pct: number;
  grade: string | null;
  recommended_channel: string | null;
  expected_recovery_pct: number | null;
  status: string | null;
  approval_required: string | null;
}

export interface MarkdownClearanceData {
  markdown_items: MarkdownItem[];
  clearance_items: ClearanceItem[];
  exit_items: ClearanceItem[];
  total_markdown: number;
  total_clearance: number;
  total_exit: number;
}

export interface StoreFreshnessItem {
  store_id: string;
  store_name: string | null;
  store_grade: string | null;
  region: string | null;
  total_options: number;
  options_under_45d: number;
  options_45_to_90d: number;
  options_over_90d: number;
  freshness_pct: number;
  exit_queue: number;
  avg_fashion_age_days: number;
  compliance: string;
}

export interface RotationAlertItem {
  id: string;
  option_code: string;
  style_name: string | null;
  category: string | null;
  store_id: string | null;
  store_name: string | null;
  store_grade: string | null;
  network_age_days: number;
  current_phase: string | null;
  transfer_count: number;
  total_units: number;
  sell_through_pct: number;
  store_age_days: number | null;
  rotation_flagged: boolean | null;
  transfer_blocked: boolean | null;
  reversal_required: boolean | null;
  audit_required: boolean | null;
  flagged_by_agent: string | null;
}

export interface PullbackItem {
  id: string;
  run_id: string | null;
  store_id: string | null;
  sku: string | null;
  style_name: string | null;
  option_code: string | null;
  units: number;
  status: string | null;
  category: string | null;
  family: string | null;
  fashion_grade: string | null;
  delivery_type: string | null;
  delivery_date: string | null;
  replacement_sku: string | null;
  replacement_style: string | null;
  replacement_option_code: string | null;
  reason: string | null;
  run_started_at: string | null;
  run_completed_at: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
}

// --- Filter mapping helper ---

function filterParams(filters: InventoryFilters, storeFilter?: string | null) {
  const p: Record<string, string | undefined> = {};
  if (filters.segment !== "all") p.segment = filters.segment;
  if (filters.family !== "all") p.family = filters.family;
  if (filters.brick !== "all") p.brick = filters.brick;
  if (filters.class !== "all") p.class = filters.class;
  if (filters.fashionGrade !== "all") p.fashion_grade = filters.fashionGrade;
  if (filters.format !== "all") p.format = filters.format;
  if (storeFilter) p.store = storeFilter;
  return p;
}

// --- API fetch functions ---

export function fetchHealthSummary(filters: InventoryFilters, storeFilter?: string | null): Promise<HealthSummaryData> {
  return appApiFetch<HealthSummaryData>("/inventory/health-summary", filterParams(filters, storeFilter));
}

export function fetchLifecycleItems(
  params: {
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: string;
    category?: string;
    age_bucket?: string;
    checkpoint?: string;
    store_grade?: string;
  },
  filters: InventoryFilters,
  storeFilter?: string | null,
): Promise<PaginatedResponse<LifecycleItem>> {
  return appApiFetch<PaginatedResponse<LifecycleItem>>("/inventory/lifecycle", {
    ...filterParams(filters, storeFilter),
    page: params.page,
    page_size: params.page_size,
    sort_by: params.sort_by,
    sort_order: params.sort_order,
    category: params.category,
    age_bucket: params.age_bucket,
    checkpoint: params.checkpoint,
    store_grade: params.store_grade,
  });
}

export function fetchNOOSItems(
  params: {
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: string;
    category?: string;
    stockout_only?: boolean;
  },
  filters: InventoryFilters,
  storeFilter?: string | null,
): Promise<PaginatedResponse<NOOSItem>> {
  return appApiFetch<PaginatedResponse<NOOSItem>>("/inventory/noos", {
    ...filterParams(filters, storeFilter),
    page: params.page,
    page_size: params.page_size,
    sort_by: params.sort_by,
    sort_order: params.sort_order,
    category: params.category,
    stockout_only: params.stockout_only,
  });
}

export function fetchMarkdownClearance(
  params: {
    category?: string;
    phase?: string;
    limit?: number;
    offset?: number;
    cl_page?: number;
    cl_page_size?: number;
    exit_page?: number;
    exit_page_size?: number;
  },
  filters: InventoryFilters,
  storeFilter?: string | null,
): Promise<MarkdownClearanceData> {
  return appApiFetch<MarkdownClearanceData>("/inventory/markdown-clearance", {
    ...filterParams(filters, storeFilter),
    category: params.category,
    phase: params.phase,
    limit: params.limit,
    offset: params.offset,
    cl_page: params.cl_page,
    cl_page_size: params.cl_page_size,
    exit_page: params.exit_page,
    exit_page_size: params.exit_page_size,
  });
}

export function fetchStoreFreshness(
  params: {
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: string;
    store_grade?: string;
    compliance?: string;
    search?: string;
  },
  filters: InventoryFilters,
  storeFilter?: string | null,
): Promise<PaginatedResponse<StoreFreshnessItem>> {
  return appApiFetch<PaginatedResponse<StoreFreshnessItem>>("/inventory/store-freshness", {
    ...filterParams(filters, storeFilter),
    page: params.page,
    page_size: params.page_size,
    sort_by: params.sort_by,
    sort_order: params.sort_order,
    store_grade: params.store_grade,
    compliance: params.compliance,
    search: params.search,
  });
}

export function fetchRotationAlerts(
  params: {
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: string;
    store_grade?: string;
    category?: string;
  },
  filters: InventoryFilters,
  storeFilter?: string | null,
): Promise<PaginatedResponse<RotationAlertItem>> {
  return appApiFetch<PaginatedResponse<RotationAlertItem>>("/inventory/rotation-alerts", {
    ...filterParams(filters, storeFilter),
    page: params.page,
    page_size: params.page_size,
    sort_by: params.sort_by,
    sort_order: params.sort_order,
    store_grade: params.store_grade,
    category: params.category,
  });
}

export interface FilterOptionsData {
  segment?: string[];
  family?: string[];
  brick?: string[];
  class?: string[];
  fashion_grade?: string[];
  format?: string[];
  stores?: { value: string; label: string | null }[];
}

/**
 * Cross-filtered options for every dimension. Pass the full current selection —
 * the backend returns each dimension's options with the OTHER selected dims applied
 * (exclude-self), so filters are independent/dynamic (not a linear cascade).
 */
export function fetchFilterOptions(filters?: InventoryFilters): Promise<FilterOptionsData> {
  const params: Record<string, string | undefined> = {};
  if (filters) {
    if (filters.segment !== "all") params.segment = filters.segment;
    if (filters.family !== "all") params.family = filters.family;
    if (filters.class !== "all") params.class = filters.class;
    if (filters.brick !== "all") params.brick = filters.brick;
    if (filters.fashionGrade !== "all") params.fashion_grade = filters.fashionGrade;
    if (filters.format !== "all") params.format = filters.format;
  }
  return appApiFetch<FilterOptionsData>("/inventory/filter-options", params);
}

export interface ReplenishmentRun {
  anr_run_id: string;
  created_at: string | null;
  actions_generated: number;
  actions_approved: number;
  total_units: number;
}

export interface FailedRun {
  anr_run_id: string;
  created_at: string | null;
}

export interface NOOSActivityLogData {
  last_run: ReplenishmentRun | null;
  failed_runs: FailedRun[];
}

export function fetchNOOSActivityLog(): Promise<NOOSActivityLogData> {
  return appApiFetch<NOOSActivityLogData>("/inventory/noos-activity-log");
}

export interface BrokenSetItem {
  option_code: string;
  style_name: string | null;
  category: string | null;
  stores_affected: number;
  bsi: number;
  missing_sizes: string[];
}

export function fetchBrokenSets(
  params: {
    page?: number;
    page_size?: number;
  },
  filters: InventoryFilters,
  storeFilter?: string | null,
): Promise<PaginatedResponse<BrokenSetItem>> {
  return appApiFetch<PaginatedResponse<BrokenSetItem>>("/inventory/noos-broken-sets", {
    ...filterParams(filters, storeFilter),
    page: params.page,
    page_size: params.page_size,
  });
}

export function fetchPullbacks(params: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<PaginatedResponse<PullbackItem>> {
  return appApiFetch<PaginatedResponse<PullbackItem>>("/inventory/pullbacks", {
    page: params.page,
    page_size: params.page_size,
    status: params.status,
  });
}

// --- Allocation Actions ---

export interface AllocationSummaryData {
  total_units_allocated: number;
  total_orders: number;
  stores_covered: number;
  active_transfers: number;
  pending_approvals: number;
  avg_units_per_order: number;
  run_id: string | null;
  run_type: string | null;
  run_completed_at: string | null;
  status_counts: Record<string, number>;
}

export interface AllocationOrder {
  id: string;
  out_option_id: string | null;
  source: string | null;
  out_quantity: number;
  in_option_id: string | null;
  destination: string | null;
  in_quantity: number;
  delivery_type: string | null;
  delivery_date: string | null;
  status: string | null;
  comments: string | null;
  brand: string | null;
  segment: string | null;
  family: string | null;
  fashion_grade: string | null;
}

export interface AllocationFilterOptions {
  segment?: Array<string | { label: string; value: string }>;
  family?: Array<string | { label: string; value: string }>;
  brand?: Array<string | { label: string; value: string }>;
  fashion_grade?: Array<string | { label: string; value: string }>;
  grade?: Array<string | { label: string; value: string }>;
  source?: Array<string | { label: string; value: string }>;
  store?: Array<string | { label: string; value: string }>;
  destination?: string[];
}

export function fetchAllocationSummary(filters?: Record<string, string | undefined>): Promise<AllocationSummaryData> {
  return appApiFetch<AllocationSummaryData>("/inventory/allocation-summary", filters);
}

export function fetchAllocationOrders(params: {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
  status?: string;
  search?: string;
  segment?: string;
  family?: string;
  brand?: string;
  fashion_grade?: string;
  source?: string;
  destination?: string;
}): Promise<PaginatedResponse<AllocationOrder>> {
  return appApiFetch<PaginatedResponse<AllocationOrder>>("/inventory/allocation-orders", params);
}

export function fetchAllocationFilterOptions(): Promise<AllocationFilterOptions> {
  return appApiFetch<AllocationFilterOptions>("/inventory/allocation-filter-options");
}

export interface AopFilterOption {
  code: string;
  display_name: string;
}

export interface AopFilters {
  formats: AopFilterOption[];
  channels: AopFilterOption[];
  categories: AopFilterOption[];
  brick_descs: AopFilterOption[];
}

export function fetchAopFilters(category?: string): Promise<AopFilters> {
  return appApiFetch<AopFilters>("/aop/filters", category ? { category } : undefined);
}

export async function downloadAllocationOrders(params: {
  status?: string;
  search?: string;
  segment?: string;
  family?: string;
  brand?: string;
  fashion_grade?: string;
}): Promise<void> {
  await apiFetchBlob("/inventory/allocation-orders", { ...params, download: true }, "allocation_orders.xlsx", IMPETUS_APP_BASE);
}

export async function downloadReplenishmentOrders(params: {
  statuses?: string;
  stores?: string;
  brands?: string;
  priorities?: string;
  sbus?: string;
  search?: string;
}): Promise<void> {
  await apiFetchBlob("/anr/replenishment", { ...params, download: true }, "replenishment_orders.xlsx", IMPETUS_APP_BASE);
}

export interface STOReportResponse {
  success: boolean;
  message: string;
  gcs_file_path: string;
  procuro_response: Record<string, unknown> | null;
}

export async function generateReplenishmentStoReport(orderIds: string[]): Promise<STOReportResponse> {
  return appApiPost<STOReportResponse>("/anr/replenishment/generate-sto-report", orderIds);
}


// ─── Reorder Orders (PO / STO) ──────────────────────────────────────────────

export interface ReorderRun {
  run_id: string;
  org_id: string;
  run_type: string;
  run_date: string | null;
  generated_at: string | null;
  po_count: number;
  sto_count: number;
  status: string;
  created_at: string | null;
}

export interface ReorderOrderRow {
  order_type: 'PO' | 'STO';
  business_unit: string | null;
  class_desc: string | null;
  segment: string | null;
  family: string | null;
  brand: string | null;
  brick: string | null;
  season: string | null;
  hit: string | null;
  fashion_grade_code: string | null;
  fashion_grade_desc: string | null;
  generic_article: string | null;
  style_id: string | null;
  option_code: string | null;
  variant_article_number: string | null;
  sap_color: string | null;
  size: string | null;
  ean_number: string | null;
  purchase_group: string | null;
  delivery_date: string | null;
  source_desc: string | null;
  source_code: string | null;
  dest_desc: string | null;
  dest_code: string | null;
  qty: number | null;
  uom: string | null;
  priority: string | null;
  material_description: string | null;
  ros: number | null;
  str_days: number | null;
  inventory_position: number | null;
  target_day_cover: number | null;
  target_inventory_qty: number | null;
  in_transit_qty: number | null;
  vendor_name: string | null;
  supplier_code: string | null;
  is_msme: string | null;
  otb_number: string | null;
  mrp: number | null;
  costing: number | null;
  sto_shipped_out: number | null;
  order_qty_formula: string | null;
}

export interface ReorderFilters {
  order_type: 'PO' | 'STO';
  run_id?: string;
  segment?: string;
  family?: string;
  brand?: string;
  brick?: string;
  priority?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export const reorderKeys = {
  all: ['inventory', 'reorder'] as const,
  runs: () => [...reorderKeys.all, 'runs'] as const,
  list: (params: ReorderFilters) => [...reorderKeys.all, 'list', params] as const,
};

export async function fetchReorderRuns(): Promise<{ items: ReorderRun[] }> {
  return appApiFetch<{ items: ReorderRun[] }>("/inventory/reorder-runs", {});
}

export async function fetchReorders(
  params: ReorderFilters,
): Promise<PaginatedResponse<ReorderOrderRow>> {
  return appApiFetch<PaginatedResponse<ReorderOrderRow>>("/inventory/reorders", {
    order_type: params.order_type,
    ...(params.run_id ? { run_id: params.run_id } : {}),
    ...(params.segment ? { segment: params.segment } : {}),
    ...(params.family ? { family: params.family } : {}),
    ...(params.brand ? { brand: params.brand } : {}),
    ...(params.brick ? { brick: params.brick } : {}),
    ...(params.priority ? { priority: params.priority } : {}),
    ...(params.search ? { search: params.search } : {}),
    page: params.page ?? 1,
    page_size: params.page_size ?? 50,
  });
}
