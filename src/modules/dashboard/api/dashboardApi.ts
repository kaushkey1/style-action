import { ApiService, IMPETUS_APP_BASE, IMPETUS_HEADERS, redirectToUnauthorizedPage } from "@/lib/api";
import type { DashboardFilters } from "../stores/useDashboardFilterStore";

// --- Business Pulse (command-center-dashboard) ---

/** KPI card from command-center envelope (all tabs); may include `neutral` and null values. */
export interface CommandCenterKpiCard {
  code: string;
  label: string;
  value: number | null;
  value_formatted: string;
  target: string;
  status: "on_track" | "warning" | "critical" | "neutral";
  trend_pct: number | null;
  total_discount?: number | null;
  total_discount_formatted?: string | null;
}

/** @deprecated Use CommandCenterKpiCard — same shape from API envelope. */
export type BusinessPulseKpiCard = CommandCenterKpiCard;

export interface BusinessPulseChartPoint {
  label: string;
  value: number;
  value2: number | null;
  pct: number | null;
}

export interface BusinessPulseRevenueMarginRow {
  /** category_desc value (e.g. "MENS WEAR" or "2. WOMEN APPAREL"). Parent grouping in the drilldown. */
  name?: string | null;
  /** subcategory_desc value (e.g. "SHIRT", "JEAN"). Leaf rows within each parent. */
  subcategory_desc?: string | null;
  /** Net revenue (BE key for this table). */
  revenue?: number | null;
  /** Gross revenue — NOT yet returned by the BE. FE renders "—" until shipped;
   *  accepts whichever key the BE adds (gross_revenue preferred). */
  gross_revenue?: number | null;
  gross_sales?: number | null;
  total_gross_sales?: number | null;
  gm_pct?: number | null;
  sell_through_pct?: number | null;
  /** Command-center may send uppercase `ROS` (JSON); `ros` accepted for compatibility. */
  ROS?: number | null;
  aged_inv_pct?: number | null;
  fresh_pct?: number | null;
  ros?: number | null;
}

/** Supports legacy and current command-center shapes (see API doc `fashion_grade_table`). */
export interface BusinessPulseFashionGradeRow {
  FASHION_GRADE_STD?: string | null;
  fashion_grade_bucket?: string | null;
  total_net_sales?: number | null;
  revenue?: number | null;
  mix_pct?: number | null;
  /** Gross revenue — NOT yet returned by the BE for the current (bucket) shape.
   *  FE renders "—" until shipped; accepts gross_revenue / gross_sales / total_gross_sales. */
  gross_revenue?: number | null;
  gross_sales?: number | null;
  total_gross_sales?: number;
  total_gross_margin?: number;
  margin_pct?: number | null;
  gm_pct?: number | null;
  sell_through_pct?: number | null;
  aged_pct?: number | null;
  markdown_pct?: number | null;
  total_units_sold?: number | null;
  store_count?: number | null;
}

export interface BusinessPulseFormatRow {
  FORMAT_DESC_STD: string;
  total_net_sales: number;
  total_gross_sales?: number;
  total_gross_margin?: number;
  margin_pct: number;
  total_units_sold: number;
  store_count: number;
}

export interface BusinessPulseCriticalAlert {
  id: string;
  message: string;
  time?: string;
}

export interface BusinessPulseExceptionSeverityItem {
  label: string;
  count: number;
  /** Optional hex from API; UI falls back to semantic colors by label. */
  color?: string;
}

export interface BusinessPulseResponse {
  kpi_cards: CommandCenterKpiCard[];
  monthly_revenue_chart: BusinessPulseChartPoint[];
  category_revenue_chart: BusinessPulseChartPoint[];
  revenue_margin_table: BusinessPulseRevenueMarginRow[];
  fashion_grade_table: BusinessPulseFashionGradeRow[];
  format_table: BusinessPulseFormatRow[];
  /** Normalized in UI via `normalizeRevenueSnapshotItems`. */
  revenue_snapshot: unknown[];
  critical_alerts?: BusinessPulseCriticalAlert[];
  exception_severity?: BusinessPulseExceptionSeverityItem[];
  /** Optional notice banner (e.g. actuals / GST / period substitution). */
  data_notice?: string;
}

// --- API Response Types ---

export interface DashboardKpiCard {
  code: string;
  label: string;
  description: string;
  value: number | null;
  value_formatted: string;
  unit: string;
  target_label: string;
  status: "on_track" | "warning" | "critical" | "neutral";
  color: string;
  bg_color: string;
  is_placeholder?: boolean;
  discount_formatted?: string | null;
}

export interface ScoreboardRow {
  period: string;
  actual: number;
  actual_formatted: string;
  plan: number | null;
  plan_formatted: string;
  ach_pct: number | null;
  ach_pct_formatted: string;
  status: string | null;
  status_color: string | null;
  is_plan_placeholder: boolean;
}

export interface WorstPerformerCardData {
  dimension: "CATEGORY" | "GEOGRAPHY";
  metric_label: string;
  entity_name: string;
  value: number;
  value_formatted: string;
  value_color: string;
  target_label: string;
  detail_lines: string[];
}

export interface GradeOption {
  code: string;
  label: string;
}

export interface DashboardTabResponse {
  snapshot_date: string;
  kpi_cards: DashboardKpiCard[];
  revenue_scoreboard: ScoreboardRow[];
  worst_performers: WorstPerformerCardData[];
}

export interface FilterOptionsResponse {
  formats: string[];
  brands: string[];
  categories: string[];
  subcategories: string[];
  /** Current API shape */
  fashion_grades?: string[];
  /** Legacy shape (kept for compatibility) */
  grades?: GradeOption[];
  site_types?: string[];
}

// --- Helpers ---

function buildFilterParams(filters: DashboardFilters): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (filters.format && filters.format !== "all") params.formats = filters.format;
  if (filters.brand && filters.brand !== "all") params.brands = filters.brand;
  if (filters.category && filters.category !== "all") params.categories = filters.category;
  if (filters.subcategory && filters.subcategory !== "all") params.subcategories = filters.subcategory;
  if (filters.fashionGrade && filters.fashionGrade !== "all") params.grades = filters.fashionGrade;
  if (filters.siteType && filters.siteType !== "all") params.store_type = filters.siteType;
  if (filters.dateFrom) params.from_date = filters.dateFrom;
  if (filters.dateTo) params.to_date = filters.dateTo;
  return params;
}

/** Query params for `/command-center-dashboard/...` (uses `fashion_grades` per API contract). */
export function buildCommandCenterFilterParams(filters: DashboardFilters): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  if (filters.format && filters.format !== "all") params.formats = filters.format;
  if (filters.brand && filters.brand !== "all") params.brands = filters.brand;
  if (filters.category && filters.category !== "all") params.categories = filters.category;
  if (filters.subcategory && filters.subcategory !== "all") params.subcategories = filters.subcategory;
  if (filters.fashionGrade && filters.fashionGrade !== "all") params.fashion_grades = filters.fashionGrade;
  if (filters.siteType && filters.siteType !== "all") params.store_type = filters.siteType;
  if (filters.dateFrom) params.from_date = filters.dateFrom;
  if (filters.dateTo) params.to_date = filters.dateTo;
  return params;
}

// --- Command Center tab payloads (CEO dashboard API) ---

export interface CommandCenterChartPoint {
  label: string;
  value: number;
  value2: number | null;
  pct: number | null;
}

export interface CommandCenterKeyMetric {
  label: string;
  value: number | null;
  value_formatted: string;
  target: string;
  status: string;
}

export interface FinancialResponse {
  kpi_cards: CommandCenterKpiCard[];
  margin_flow_chart: CommandCenterChartPoint[];
  key_metrics: CommandCenterKeyMetric[];
}

/** Legacy bucket row; newer API uses qty-based fields (see `api_doc` inventory-health). */
export type InventoryStockDistributionRow =
  | {
      age_bucket: string;
      stock_qty: number;
      stock_value: number;
      pct_of_total: number;
    }
  | {
      age_bucket: string;
      aged_qty: number;
      m_total_stk_qty: number;
      aged_qty_pct: number;
    };

export interface InventoryHealthResponse {
  kpi_cards: CommandCenterKpiCard[];
  age_distribution_chart: CommandCenterChartPoint[];
  category_chart: CommandCenterChartPoint[];
  key_metrics: CommandCenterKeyMetric[];
  stock_distribution: InventoryStockDistributionRow[];
  broken_set_table: {
    category: string;
    total_options: number;
    broken_sets: number;
    broken_pct: number;
    value_at_risk_cr?: number | null;
    avg_missing_sizes?: number | null;
  }[];
  category_health_table: {
    category: string;
    stock_value: number;
    aged_pct: number;
    fresh_pct: number;
    doi_days?: number | null;
    turnover?: number | null;
  }[];
}

export interface GeographyResponse {
  kpi_cards: CommandCenterKpiCard[];
  key_metrics: CommandCenterKeyMetric[];
  region_chart: CommandCenterChartPoint[];
  city_tier_chart: CommandCenterChartPoint[];
  zone_table: {
    /** Legacy / alternate keys; command-center often sends `ZONE_DESC` (Store_Master shape). */
    ZONE?: string | null;
    zone?: string | null;
    ZONE_DESC?: string | null;
    zone_desc?: string | null;
    ZONE_NAME?: string | null;
    zone_name?: string | null;
    store_count?: number | null;
    total_revenue?: number | null;
    rev_per_store?: number | null;
    avg_spsf?: number | null;
    /** Command-center gross margin %; preferred over `avg_gm_pct` / `avg_gmrof`. */
    avg_gross_margin_pct?: number | null;
    /** Legacy column; prefer `avg_gm_pct` when present (current API). */
    avg_gmrof?: number | null;
    avg_gm_pct?: number | null;
    avg_sell_through_pct?: number | null;
    aged_pct?: number | null;
  }[];
  top_states_table: {
    /** Legacy `STATE`; APIs may send `STATENAME` / `STATE_NAME` (Store_Master–aligned). */
    STATE?: string | null;
    state?: string | null;
    STATENAME?: string | null;
    STATENAME_STD?: string | null;
    STATE_NAME?: string | null;
    state_name?: string | null;
    STATE_DESC?: string | null;
    state_desc?: string | null;
    total_revenue?: number | null;
    store_count?: number | null;
    rev_per_store?: number | null;
    avg_spsf?: number | null;
    avg_gross_margin_pct?: number | null;
    avg_gmrof?: number | null;
    avg_gm_pct?: number | null;
    avg_sell_through_pct?: number | null;
    aged_pct?: number | null;
  }[];
  city_tier_table: {
    tier?: string | null;
    store_count?: number | null;
    total_revenue?: number | null;
    rev_per_store?: number | null;
    avg_spsf?: number | null;
    avg_gmrof?: number | null;
  }[];
  pod_table: {
    POD_NAME?: string | null;
    states?: string | null;
    store_count?: number | null;
    total_revenue?: number | null;
    rev_per_store?: number | null;
    avg_spsf?: number | null;
    avg_gmrof?: number | null;
  }[];
}

export interface CategoryPodRow {
  segment: string;
  sub_category: string;
  brands?: string | null;
  revenue: number;
  gm_pct: number;
  sell_through_pct: number;
  aged_inv_pct: number;
  fresh_pct: number;
}

export interface CategoriesResponse {
  kpi_cards: CommandCenterKpiCard[];
  key_metrics: CommandCenterKeyMetric[];
  category_pods: Record<string, CategoryPodRow[]>;
}

/** One row in `vendor_table` or `bottom_vendor_table` (Operations & Supply Chain). */
export interface OperationsVendorTableRow {
  vendor_name?: string | null;
  vendor_code?: string | null;
  total_po_qty?: number | null;
  open_pos_count?: number | null;
  fill_rate_pct?: number | null;
  avg_lead_time_days?: number | null;
  otif_pct?: number | null;
  ot_pct?: number | null;
  /** Legacy alias; UI prefers `units_ready_to_ship_per_day` for throughput. */
  throughput_units_per_day?: number | null;
  units_ready_to_ship_per_day?: number | null;
}

export interface OperationsResponse {
  kpi_cards: CommandCenterKpiCard[];
  vendor_chart: {
    vendor_name?: string | null;
    vendor_code?: string | null;
    total_po_qty?: number | null;
    delivered_on_time_qty?: number | null;
    delivered_on_time_in_full_qty?: number | null;
    ot_pct?: number | null;
    otif_pct?: number | null;
    fill_rate_pct?: number | null;
  }[];
  key_metrics: CommandCenterKeyMetric[];
  vendor_table: OperationsVendorTableRow[];
  /** Lowest-performing vendors; same columns as `vendor_table`. */
  bottom_vendor_table?: OperationsVendorTableRow[];
  lead_time_distribution: {
    lead_time_bucket?: string | null;
    po_count?: number | null;
    avg_lead_time_days?: number | null;
  }[];
}

// --- Data Score (top-brands breakdown for Data Scope modal) ---

export interface DataScoreRow {
  BRAND_DESC_STD?: string | null;
  net_sales?: number | null;
  pct_share?: number | null;
}

export interface DataScoreResponse {
  total_brands?: number | null;
  top_brands?: DataScoreRow[];
}

// --- API Service ---

const DASH_BASE = "/service/public/impetus-agentic/v1.0/dashboard";

export function mapCommandCenterKpiToDashboard(card: CommandCenterKpiCard): DashboardKpiCard {
  const statusRaw = card.status;
  const status: DashboardKpiCard["status"] =
    statusRaw === "on_track" || statusRaw === "warning" || statusRaw === "critical" || statusRaw === "neutral"
      ? statusRaw
      : "neutral";
  const isPlaceholder =
    card.value_formatted.trim().toUpperCase() === "N/A" ||
    (card.value === null && (statusRaw === "neutral" || card.value_formatted.trim().toUpperCase() === "N/A"));

  return {
    code: card.code,
    label: card.label,
    description: "",
    value: card.value,
    value_formatted: card.value_formatted,
    unit: "",
    target_label: card.target,
    status,
    color: "",
    bg_color: "",
    is_placeholder: isPlaceholder,
    discount_formatted: card.total_discount_formatted ?? null,
  };
}

export function mapBusinessPulseKpiToDashboard(card: CommandCenterKpiCard): DashboardKpiCard {
  return mapCommandCenterKpiToDashboard(card);
}

/**
 * Unwraps `{ status_code, message, data }` (current API) or legacy `{ status, data }` / raw payload.
 */
export function unwrapCommandCenterData<T extends object>(raw: unknown): T {
  if (raw === null || typeof raw !== "object") {
    throw new Error("Invalid command center response");
  }
  const body = raw as Record<string, unknown>;
  const sc = body.status_code;
  if (typeof sc === "number" && sc === 403) {
    redirectToUnauthorizedPage();
    const msg = typeof body.message === "string" ? body.message : "Access denied";
    throw new Error(msg);
  }
  if (typeof sc === "number" && sc >= 400) {
    const msg = typeof body.message === "string" ? body.message : "Command center request failed";
    throw new Error(msg);
  }
  if (body.status === "error") {
    const msg = typeof body.message === "string" ? body.message : "Command center request failed";
    throw new Error(msg);
  }
  if (body.data !== undefined && body.data !== null && typeof body.data === "object") {
    return body.data as T;
  }
  if ("kpi_cards" in body || "monthly_revenue_chart" in body) {
    return body as unknown as T;
  }
  throw new Error("Invalid command center response");
}

export const dashboardApi = {
  filterOptions: async (filters?: DashboardFilters): Promise<FilterOptionsResponse> => {
    const res = await ApiService.get(`${IMPETUS_APP_BASE}/command-center-dashboard/ceo/filters`, {
      params: filters ? buildCommandCenterFilterParams(filters) : undefined,
      headers: IMPETUS_HEADERS,
    });
    return unwrapCommandCenterData<FilterOptionsResponse>(res.data);
  },

  tab: async (role: string, tab: string, filters: DashboardFilters): Promise<DashboardTabResponse> => {
    const res = await ApiService.get(`${DASH_BASE}/tab`, {
      params: { role, tab, ...buildFilterParams(filters) },
      headers: {
        "x-tenant-id": "default",
        "x-org-id": "default",
      },
    });
    return res.data;
  },

  /**
   * GET /command-center-dashboard/{role}/business-pulse
   * Proxied via IMPETUS_APP_BASE (see vite.config proxy).
   */
  businessPulse: async (role: string, filters: DashboardFilters): Promise<BusinessPulseResponse> => {
    const res = await ApiService.get(
      `${IMPETUS_APP_BASE}/command-center-dashboard/${encodeURIComponent(role)}/business-pulse`,
      {
        params: buildCommandCenterFilterParams(filters),
        headers: IMPETUS_HEADERS,
      },
    );
    const payload = unwrapCommandCenterData<BusinessPulseResponse>(res.data);
    if (!Array.isArray(payload.kpi_cards)) {
      throw new Error("Invalid Business Pulse response");
    }
    return payload;
  },

  /**
   * GET `/command-center-dashboard/data-score?top_n=N` — top brands by net sales.
   * Response shape: `{ total_brands, top_brands: [{ BRAND_DESC_STD, net_sales, pct_share }] }`.
   */
  dataScore: async (topN = 10): Promise<DataScoreResponse> => {
    const res = await ApiService.get(`${IMPETUS_APP_BASE}/command-center-dashboard/data-score`, {
      params: { top_n: topN },
      headers: IMPETUS_HEADERS,
    });
    return unwrapCommandCenterData<DataScoreResponse>(res.data);
  },

  /**
   * GET `/command-center-dashboard/{role}/{segment}` — CEO tab payloads (and other roles when supported).
   * Segment examples: `business-pulse`, `financial`, `inventory-health`, `geography`, `categories`, `operations`.
   */
  commandCenterTab: async (
    role: string,
    segment: string,
    filters: DashboardFilters,
  ): Promise<Record<string, unknown>> => {
    const res = await ApiService.get(
      `${IMPETUS_APP_BASE}/command-center-dashboard/${encodeURIComponent(role)}/${encodeURIComponent(segment)}`,
      {
        params: buildCommandCenterFilterParams(filters),
        headers: IMPETUS_HEADERS,
      },
    );
    return unwrapCommandCenterData<Record<string, unknown>>(res.data);
  },
};
