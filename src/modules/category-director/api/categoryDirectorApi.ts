import { ApiService, IMPETUS_APP_BASE, IMPETUS_HEADERS } from '@/lib/api';
import {
  unwrapCommandCenterData,
  type CommandCenterKpiCard,
  type CommandCenterChartPoint,
} from '@/modules/dashboard/api/dashboardApi';
import type { CategoryDirectorFilters } from '../stores/useCategoryDirectorFilterStore';

// Re-exported aliases so callers only depend on the category-director API surface.
// `data_gap_reason` is optional — BE may add it on placeholder KPIs to explain
// why the tile is N/A, matching the Sourcing API extension.
export type KpiCard = CommandCenterKpiCard & {
  data_gap_reason?: string | null;
};
export type ChartDataPoint = CommandCenterChartPoint;

// ─── Tab response shapes (mirror docs/api ref doc/category_director_api_integration.md) ───

/**
 * Unified row shape for both `category_perf_table` (subcategory === null) and
 * `subcategory_drilldown` (subcategory !== null) — backend emits them via a
 * UNION ALL on the same projection. v3 spec (2026-05-30).
 */
export interface CategoryPerfRow {
  category: string;                      // always set
  subcategory: string | null;            // null on category-grain rollup rows
  gross_sales: number | null;            // raw INR
  net_sales: number | null;              // raw INR. Was `revenue` on the v2 SubcategoryRow.
  plan_gross_sales: number | null;       // v4 (2026-05-30): AOP plan gross sales (₹). 0 on subcategory rows with no matching plan, null on rollups when no subcategories map.
  plan_net_sales: number | null;         // v4: AOP plan net sales (₹). Same null/0 semantics as plan_gross_sales.
  md_value: number | null;
  discount_rs: number | null;            // v4: SUM(total_discount), raw INR.
  cogs: number | null;
  gm_rs: number | null;
  gm_pct: number | null;                 // 1 dp
  intake_margin_pct: number | null;      // v4: (total_mrp - cogs) / total_mrp * 100, 2 dp.
  ros: number | null;                    // integer. qty_sold / sales_days
  fp_sell_through_pct: number | null;    // integer. denom = fp_qty + stk_qty
  sell_through_pct: number | null;       // integer. denom = qty_sold + stk_qty
  aged_pct: number | null;               // integer
  fresh_pct: number | null;              // integer
  fill_rate_pct: number | null;          // v5 (2026-06-02): saleable_stk_qty / total_stk_qty * 100. Integer %. Same column on category-grain rollup and subcategory drill rows.
  md_pct: number | null;                 // 2 dp
  days_on_hand: number | null;           // integer. stk_qty / daily ROS
}

export interface CategoryPerformanceResponse {
  kpi_cards: KpiCard[];
  weekly_revenue_chart: ChartDataPoint[];
  /** v3: grain switched from week → subcategory. label = subcategory_desc, value = FP ₹, value2 = MD ₹. */
  fp_vs_md_chart: ChartDataPoint[];
  /** v3: renamed from `revenue_by_class_chart`. label = subcategory, value = net rev ₹, value2 = gross rev ₹. */
  revenue_by_subcategory_chart: ChartDataPoint[];
  lfl_trend_chart: ChartDataPoint[];
  /** v3 NEW. label = subcategory, value = GM% (1 dp). Sorted GM% desc by BE. */
  gm_by_subcategory_chart: ChartDataPoint[];
  /** v4 NEW (2026-05-30). label = subcategory, value = actual gross sales (₹),
   *  value2 = AOP plan gross sales (₹), pct = achievement % (null when plan is 0).
   *  Pre-sorted by actual_gross_sales DESC, clipped to top-10 server-side. */
  aop_vs_actual_chart: ChartDataPoint[];
  /** v3: renamed from `class_pl_table`. Every row has `subcategory: null`. */
  category_perf_table: CategoryPerfRow[];
  /** v3: shape widened to match `category_perf_table`; `revenue` → `net_sales`. */
  subcategory_drilldown: CategoryPerfRow[];
}

export interface SellThroughRow {
  category: string;
  qty_sold: number | null;
  stk_qty: number | null;
  sell_through_pct: number | null;
}

/** Live option-health row from `/sell-through-options`. Pre-sorted by
 *  `days_on_hand` DESC by BE; FE applies the same default for safety. */
export interface OptionHealthRow {
  category?: string;                     // Optional — parent category context for tooltips/grouping; not shown in the FE table today.
  subcategory: string;
  days_on_hand: number | null;
  st_pct: number | null;
  fp_st_pct: number | null;
}

export interface SellThroughOptionsResponse {
  kpi_cards: KpiCard[];
  sell_through_by_class: SellThroughRow[];
  weekly_velocity_chart: ChartDataPoint[];
  markdown_pipeline: unknown[];
  option_health_table: OptionHealthRow[];
  top_up_po_candidates: unknown[];
}

export interface BrokenSizesRow {
  category: string;
  total_options: number | null;
  broken_sets: number | null;
  broken_pct: number | null;
  value_at_risk_cr: number | null;
  avg_missing_sizes: number | null;
}

/** Site-level rollup driving the "Markdown Triggers Pending" table on Tab 3.
 *  Same column set as `SubcategoryRow` but grouped by `site` and joined
 *  `FROM stock LEFT JOIN sales` (every store with stock surfaces, even
 *  those with no sales in the window). Added 2026-05-29 (data-team spec v2 §3.11). */
export interface MarkdownTriggerRow {
  site: string;                          // SITE from comprehensive_stock_metrics
  store_name: string | null;             // human-readable store name (added 2026-06-01)
  revenue: number | null;                // raw INR (period-window NET_SALES sum)
  gm_pct: number | null;                 // 1 dp
  fp_sell_through_pct: number | null;    // integer. denom = fp_qty + stk_qty
  sell_through_pct: number | null;       // integer. denom = qty_sold + stk_qty
  aged_pct: number | null;               // integer
  fresh_pct: number | null;              // integer
  md_pct: number | null;                 // 2 dp
  ros: number | null;                    // integer. qty_sold / sales_days
  stk_qty: number | null;                // raw saleable units at the latest CLOSING_DT
  days_on_hand: number | null;           // integer. stk_qty / daily ROS
}

/** Replenishment Triggers table row. Added 2026-06-02 (spec §3.12).
 *  Sourced from `latest_impetus_planning_anr_runs` +
 *  `latest_impetus_planning_anr_replenishment` on the latest completed ANR run per day.
 *  IMPORTANT: filters (date / category / etc.) DO NOT apply — the ANR tables
 *  always represent the latest planning state. Expect ~16k rows on a 30-day
 *  window; any consumer must paginate or virtualise. */
export interface ReplenishmentTriggerRow {
  create_date: string;                   // "YYYY-MM-DD"
  store_id: string;
  category_desc: string | null;
  subcategory_desc: string | null;
  priority: string | null;               // "P1" | "P2" | ...
  replenishment_qty: number | null;      // SUM(recommended)
  avg_ros_rate: number | null;           // AVG(ros_rate)
  avg_str_rate: number | null;           // AVG(str_rate)
  avg_cover_days: number | null;         // AVG(cover_days)
}

/** Allocation Triggers table row. Added 2026-06-02 (spec §3.13).
 *  Sourced from `latest_impetus_planning_anr_runs` (run_type = "pullback") +
 *  `latest_anr_redistribution_id`. Latest completed ANR run per month.
 *  IMPORTANT: filters DO NOT apply. Expect ~45k rows on a 30-day window;
 *  any consumer must paginate or virtualise. */
export interface AllocationTriggerRow {
  created_date: string;                  // "YYYY-MM-DD"
  source_store_id: string;
  destination_store_id: string;
  delivery_type: string | null;          // e.g. "GRDC"
  category_desc: string | null;
  subcategory_desc: string | null;
  replacement_option_code: number | null;
  replacement_quantity: number | null;
  pullback_qty: number | null;
}

export interface InventoryLifecycleResponse {
  kpi_cards: KpiCard[];
  age_distribution_chart: ChartDataPoint[];
  aged_by_grade_chart: ChartDataPoint[];
  broken_sizes_table: BrokenSizesRow[];
  markdown_triggers_table: MarkdownTriggerRow[]; // Added 2026-05-29 — see MarkdownTriggerRow
  replenishment_triggers_table: ReplenishmentTriggerRow[]; // v5 (2026-06-02)
  allocation_triggers_table: AllocationTriggerRow[];       // v5 (2026-06-02)
  total_inventory_value: number | null;
  total_inventory_value_formatted: string;
}

export interface StoreRow {
  site: string;
  revenue: number | null;
  gm_pct: number | null;
  sell_through_pct: number | null;
  aged_pct: number | null;
  fresh_pct: number | null;
}

/** Live row from `/store-distribution.store_health_by_grade`. Grade-level
 *  rollup of store counts (total / right-stocked / over / under) and the
 *  per-day revenue contribution of that grade in crores. Stock status is
 *  classified by comparing saleable stock against total_unit_capacity:
 *  0.85–1.15 right-stocked, <0.85 understocked, >1.15 overstocked. */
export interface StoreHealthByGradeRow {
  store_grade: string;
  total_stores: number | null;
  right_stocked_stores: number | null;
  understocked_stores: number | null;
  overstocked_stores: number | null;
  revenue_per_day_cr: number | null;
  // API-returned per-grade KPIs (store_performance_by_grade)
  store_count?: number | null;
  spsf?: number | null;
  gmrof?: number | null;
  pct?: number | null;
  abv?: number | null;
  gross_margin_pct?: number | null;
  daily_sales?: number | null;
}

export interface StorePerformanceByGradeRow {
  store_grade: string;
  store_count?: number | null;
  spsf?: number | null;
  gmrof?: number | null;
  pct?: number | null;
  abv?: number | null;
  gross_margin_pct?: number | null;
  daily_sales?: number | null;
}

export interface StoreDistributionResponse {
  kpi_cards: KpiCard[];
  store_performance_table: StoreRow[];
  store_health_by_grade: StoreHealthByGradeRow[];
  store_performance_by_grade?: StorePerformanceByGradeRow[];
  floor_vs_backroom_chart: unknown[];
  reallocation_suggestions: unknown[];
}

export interface VendorShareRow {
  vendor: string;
  vendor_qty: number | null;
  share_pct: number | null;
}

export interface VendorDeliveryRow {
  vendor: string;
  po_count: number | null;
  po_qty: number | null;
  grn_qty: number | null;
  fill_rate_pct: number | null;
  otif_pct: number | null;
  overdue_count: number | null;
}

export interface OtbClassRow {
  category: string;
  po_count: number | null;
  committed_qty: number | null;
  received_qty: number | null;
  pending_qty: number | null;
  in_transit_qty: number | null;
}

export interface SupplyOtbResponse {
  kpi_cards: KpiCard[];
  vendor_concentration_table: VendorShareRow[];
  vendor_delivery_table: VendorDeliveryRow[];
  otb_tracker_by_class: OtbClassRow[];
}

export interface FilterOptionsResponse {
  formats: string[];
  brands: string[];
  categories: string[];
  subcategories: string[];
  fashion_grades: string[];
}

// ─── Category Summary (listing page) ─────────────────────────────────────

export interface CategorySummaryKpiCard {
  code: string;
  label: string;
  value: number | null;
  value_formatted: string;
  target: string | null;
  status: 'on_track' | 'warning' | 'critical' | 'neutral';
  trend_pct?: number | null;
  total_discount?: number | null;
  total_discount_formatted?: string | null;
  data_gap_reason?: string | null;
}

export interface CategorySummaryRow {
  category: string;
  subcategory: string | null;
  revenue: number | null;
  revenue_formatted: string;
  aop_net_revenue: number | null;
  var_to_plan_pct: number | null;
  gm_pct: number | null;
  intake_margin_pct: number | null;
  zero_sale_pct: number | null;
  action_count: number | null;
}

export interface CategorySummaryResponse {
  kpi_cards: CategorySummaryKpiCard[];
  category_table: CategorySummaryRow[];
  subcategory_drilldown: CategorySummaryRow[];
}

// ─── Internals ────────────────────────────────────────────────────────────

const ROLE = 'category-director';

function buildParams(filters: CategoryDirectorFilters): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if (filters.dateFrom) p.from_date = filters.dateFrom;
  if (filters.dateTo) p.to_date = filters.dateTo;
  if (filters.format && filters.format !== 'all') p.formats = filters.format;
  if (filters.brand && filters.brand !== 'all') p.brands = filters.brand;
  if (filters.category && filters.category !== 'all') p.categories = filters.category;
  if (filters.subcategory && filters.subcategory !== 'all') p.subcategories = filters.subcategory;
  if (filters.fashionGrade && filters.fashionGrade !== 'all') p.fashion_grades = filters.fashionGrade;
  return p;
}

async function get<T extends object>(path: string, filters: CategoryDirectorFilters): Promise<T> {
  const res = await ApiService.get(
    `${IMPETUS_APP_BASE}/command-center-dashboard/${ROLE}${path}`,
    { params: buildParams(filters), headers: IMPETUS_HEADERS },
  );
  return unwrapCommandCenterData<T>(res.data);
}

// ─── Public API ───────────────────────────────────────────────────────────

export const categoryDirectorApi = {
  categoryPerformance: (f: CategoryDirectorFilters) =>
    get<CategoryPerformanceResponse>('/category-performance', f),
  categorySummary: (f: CategoryDirectorFilters) =>
    get<CategorySummaryResponse>('/category-summary', f),
  sellThroughOptions: (f: CategoryDirectorFilters) =>
    get<SellThroughOptionsResponse>('/sell-through-options', f),
  inventoryLifecycle: (f: CategoryDirectorFilters) =>
    get<InventoryLifecycleResponse>('/inventory-lifecycle', f),
  storeDistribution: (f: CategoryDirectorFilters) =>
    get<StoreDistributionResponse>('/store-distribution', f),
  supplyOtb: (f: CategoryDirectorFilters) => get<SupplyOtbResponse>('/supply-otb', f),
  filters: (f: CategoryDirectorFilters) => get<FilterOptionsResponse>('/filters', f),
};
