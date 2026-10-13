import { ApiService, IMPETUS_APP_BASE, IMPETUS_HEADERS } from '@/lib/api';
import {
  unwrapCommandCenterData,
  type CommandCenterKpiCard,
  type CommandCenterChartPoint,
} from '@/modules/dashboard/api/dashboardApi';
import type { SourcingFilters } from '../stores/useSourcingFilterStore';

// Sourcing-director KPI cards add `data_gap_reason` for placeholder tiles —
// extend the shared command-center shape rather than redeclare it.
export type KpiCard = CommandCenterKpiCard & {
  data_gap_reason?: string | null;
};
export type ChartDataPoint = CommandCenterChartPoint;

// ─── Tab 1: Vendor & Cluster Teams ────────────────────────────────────────

export interface ClusterTeamRow {
  cluster: string;
  vendors: number;
  otif_pct: number | null;
  fill_rate_pct: number | null;
  vendors_at_risk: number;
  delayed_pos: number;
  status: 'On Track' | 'Watch' | 'Critical';
}

export interface ZeroFillVendorRow {
  vendor_name: string;
  vendor_code: string;
  total_po_qty: number;
  delivered_qty: number;
  fill_rate_pct: number | null;
}

export interface VendorLoadRow {
  vendor_name: string;
  vendor_code: string;
  total_po_qty: number;
  open_pos_count: number;
  fill_rate_pct: number | null;
  avg_lead_time_days: number | null;
  ot_pct: number | null;
  otif_pct: number | null;
  units_ready_to_ship_per_day: number | null;
}

export interface VendorConcentrationRow {
  vendor_name: string;
  vendor_code: string;
  cluster: string | null;           // NEW 2026-05-26 — vendor cluster (e.g. "MUMBAI"); null when untagged
  categories: string | null;        // NEW 2026-05-26 — comma-joined distinct category_desc values
  vendor_qty: number;
  share_pct: number;
}

export type IntakeMarginRow = Record<string, unknown>;

export interface VendorClusterTeamsResponse {
  kpi_cards: KpiCard[];
  vendor_otif_trend_chart: ChartDataPoint[];
  cluster_team_scorecard: ClusterTeamRow[];
  cluster_team_scorecard_data_gap_reason: string | null;
  zero_fill_vendors: ZeroFillVendorRow[];
  vendor_load_capacity: VendorLoadRow[];
  vendor_concentration: VendorConcentrationRow[];
  intake_margin_by_category: IntakeMarginRow[];
  intake_margin_by_category_data_gap_reason: string | null;
  active_vendors_count: number | null;
}

// ─── Tab 2: PO Pipeline ────────────────────────────────────────────────────

export interface PoPipelineCategoryRow {
  category: string;
  total_pos: number;
  in_production: number;
  in_transit: number;
  delivered: number;
  grn_done: number;
  fill_rate: number;
  avg_lead: number | null;
}

export interface DelayedPoRow {
  po_number: string;                // NEW 2026-05-26 — PO identifier
  vendor_name: string;
  vendor_code: string;
  cluster: string | null;           // NEW 2026-05-26 — vendor cluster
  category_desc: string;            // RENAMED 2026-05-26 from `class`
  po_date: string;                  // "YYYY-MM-DD" — pre-formatted string, NOT a Date
  awb_created_date: string;         // "YYYY-MM-DD"
  days_since_awb: number;
  awb_quantity: number;
  stage_stuck: 'In Transit';        // NEW 2026-05-26 — constant for now, future-proofed
  // REMOVED 2026-05-26: `brand`, `class`
}

export interface PoPipelineResponse {
  kpi_cards: KpiCard[];
  po_funnel_chart: ChartDataPoint[];
  lead_time_distribution_chart: ChartDataPoint[];
  po_pipeline_by_category: PoPipelineCategoryRow[];
  delayed_pos_table: DelayedPoRow[];
}

// ─── Tab 3: Logistics & SLA ────────────────────────────────────────────────

export interface DeliveryPartnerRow {
  partner: string;
  shipments: number;
  on_time: number;
  sla_met: number | null;
  avg_days: number | null;
  failed_pickups: number;
  exceptions: number;
}

export type ShipmentExceptionRow = Record<string, unknown>;

export interface LogisticsSlaResponse {
  kpi_cards: KpiCard[];
  delivery_sla_trend_chart: ChartDataPoint[];
  noos_stockout_value: number | null;
  delivery_partner_scorecard: DeliveryPartnerRow[];
  shipment_exceptions_table: ShipmentExceptionRow[];
  shipment_exceptions_data_gap_reason: string | null;
}

// ─── Tab 4: Quality & Materials (entire tab is data-gap until QC + fabric tables land) ───

export interface QualityMaterialsResponse {
  kpi_cards: KpiCard[];
  defect_rate_by_category_chart: ChartDataPoint[];
  fabric_utilization_chart: ChartDataPoint[];
  quality_issues_by_vendor: Array<Record<string, unknown>>;
  defect_breakdown: Array<Record<string, unknown>>;
  fabric_position: Array<Record<string, unknown>>;
  tab_data_gap_reason: string | null;
}

// ─── Filters ───────────────────────────────────────────────────────────────

export interface FilterOptionsResponse {
  formats: string[];
  brands: string[];
  categories: string[];
  subcategories: string[];
  fashion_grades: string[];
}

// ─── Internals ────────────────────────────────────────────────────────────

const ROLE = 'sourcing-director';

function buildParams(filters: SourcingFilters): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if (filters.dateFrom) p.from_date = filters.dateFrom;
  if (filters.dateTo) p.to_date = filters.dateTo;
  if (filters.format && filters.format !== 'all') p.formats = filters.format;
  if (filters.brand && filters.brand !== 'all') p.brands = filters.brand;
  if (filters.category && filters.category !== 'all') p.categories = filters.category;
  if (filters.subcategory && filters.subcategory !== 'all') p.subcategories = filters.subcategory;
  if (filters.fashionGrade && filters.fashionGrade !== 'all') p.fashion_grades = filters.fashionGrade;
  if (filters.clusters && filters.clusters !== 'all') p.clusters = filters.clusters;
  if (filters.siteType && filters.siteType !== 'all') p.store_type = filters.siteType;
  return p;
}

async function get<T extends object>(path: string, filters: SourcingFilters): Promise<T> {
  const res = await ApiService.get(
    `${IMPETUS_APP_BASE}/command-center-dashboard/${ROLE}${path}`,
    { params: buildParams(filters), headers: IMPETUS_HEADERS },
  );
  return unwrapCommandCenterData<T>(res.data);
}

// ─── Public API ───────────────────────────────────────────────────────────

export const sourcingDirectorApi = {
  vendorClusterTeams: (f: SourcingFilters) =>
    get<VendorClusterTeamsResponse>('/vendor-cluster-teams', f),
  poPipeline: (f: SourcingFilters) =>
    get<PoPipelineResponse>('/po-pipeline', f),
  logisticsSla: (f: SourcingFilters) =>
    get<LogisticsSlaResponse>('/logistics-sla', f),
  qualityMaterials: (f: SourcingFilters) =>
    get<QualityMaterialsResponse>('/quality-materials', f),
  filters: (f: SourcingFilters) => get<FilterOptionsResponse>('/filters', f),
};
