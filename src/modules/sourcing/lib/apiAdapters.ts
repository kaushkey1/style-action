import type {
  ClusterTeamRow,
  DelayedPoRow,
  DeliveryPartnerRow,
  KpiCard,
  ChartDataPoint,
  PoPipelineCategoryRow,
  VendorConcentrationRow,
  VendorLoadRow,
  ZeroFillVendorRow,
} from '../api/sourcingDirectorApi';
import type { SrcHealthKpi } from '../data/mockSourcingData';

const EM_DASH = '—';
const DATA_NOT_AVAILABLE = 'Data not available';

/** Safe `.toLocaleString()` — returns em-dash for null/undefined/non-finite values. */
function safeIntLocale(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EM_DASH;
  return value.toLocaleString('en-IN');
}

/** Normalize inconsistent vendor/partner name casing from BE to title case. */
export function normalizeVendorName(name: string): string {
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format a count with "unit"/"units" suffix, handling null/missing values.
 * Returns plain em-dash when the value is missing (no dangling suffix).
 */
function fmtUnits(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return EM_DASH;
  const formatted = value.toLocaleString('en-IN');
  return `${formatted} ${value === 1 ? 'unit' : 'units'}`;
}

// ─── KPI helpers ──────────────────────────────────────────────────────────

/** Look up a KPI card by `code` in the response array. Returns undefined if missing. */
export function kpiByCode(cards: KpiCard[] | undefined, code: string): KpiCard | undefined {
  return cards?.find((c) => c.code === code);
}

/** True when the API returned a placeholder card (value === null or "N/A"). */
export function isPlaceholderKpi(card: KpiCard | undefined): boolean {
  if (!card) return true;
  const formatted = (card.value_formatted ?? '').trim().toUpperCase();
  return card.value === null || formatted === 'N/A' || formatted === '';
}

/** API status → SrcHealthKpi status. Drops 'neutral' to 'warning' for placeholders so they at least carry a muted tone. */
function apiStatusToHealthStatus(s: KpiCard['status']): SrcHealthKpi['status'] {
  if (s === 'on_track' || s === 'warning' || s === 'critical') return s;
  return 'warning';
}

/**
 * Sourcing-flavoured KPI card.
 * - Real card → map value_formatted/target/status/trend onto the fallback shape.
 * - Placeholder (value null / "N/A") → show "N/A" + carry `dataGapReason` so the
 *   tab can render an info-icon tooltip surfacing why the tile is blank.
 *   (Stricter than category-director which silently falls back to mock.)
 */
export interface SrcHealthKpiWithGap extends SrcHealthKpi {
  dataGapReason?: string;
}

export function apiKpiToSrcHealthKpi(
  card: KpiCard | undefined,
  fallback: SrcHealthKpi,
  options?: { labelOverride?: string },
): SrcHealthKpiWithGap {
  if (isPlaceholderKpi(card)) {
    return {
      ...fallback,
      label: options?.labelOverride ?? card?.label ?? fallback.label,
      value: 'N/A',
      target: card?.target ?? fallback.target,
      status: 'warning',
      trendDelta: 0,
      trendDirection: 'flat',
      dataGapReason: card?.data_gap_reason ?? 'Data source not yet available.',
    };
  }
  return {
    ...fallback,
    label: options?.labelOverride ?? card?.label ?? fallback.label,
    value: card?.value_formatted ?? fallback.value,
    target: card?.target ?? fallback.target,
    status: apiStatusToHealthStatus(card!.status),
    trendDelta: card?.trend_pct ?? fallback.trendDelta,
    trendDirection:
      card?.trend_pct == null
        ? 'flat'
        : card.trend_pct > 0
          ? 'up'
          : card.trend_pct < 0
            ? 'down'
            : 'flat',
  };
}

// ─── Tab 1 adapters ───────────────────────────────────────────────────────

/** Strip year from "2026-W17" → "W17"; pass through anything else. */
function shortenIsoWeek(label: string): string {
  const m = /^\d{4}-W(\d{1,2})$/.exec(label);
  return m ? `W${m[1]}` : label;
}

interface VendorTrendPoint {
  week: string;
  actual: number;
  target: number;
}

export function vendorOtifTrendToChart(
  points: ChartDataPoint[] | undefined,
): VendorTrendPoint[] {
  if (!points?.length) return [];
  return points.map((p) => ({
    week: shortenIsoWeek(p.label),
    actual: Number((p.value ?? 0).toFixed(1)),
    target: Number((p.value2 ?? 90).toFixed(0)),
  }));
}

const API_CLUSTER_STATUS_MAP: Record<
  ClusterTeamRow['status'],
  'on_track' | 'warning' | 'critical'
> = {
  'On Track': 'on_track',
  Watch: 'warning',
  Critical: 'critical',
};

interface ClusterScorecardUiRow {
  cluster: string;
  lead: string;
  vendors: number;
  otif: string;
  fillRate: string;
  atRisk: number;
  delayedPOs: number;
  status: 'on_track' | 'warning' | 'critical';
}

export function clusterScorecardToRows(
  rows: ClusterTeamRow[] | undefined,
): ClusterScorecardUiRow[] {
  if (!rows?.length) return [];
  return rows.map((r) => ({
    cluster: r.cluster,
    lead: EM_DASH,
    vendors: r.vendors,
    otif: r.otif_pct == null ? EM_DASH : `${Math.round(r.otif_pct)}%`,
    fillRate: r.fill_rate_pct == null ? EM_DASH : `${Math.round(r.fill_rate_pct)}%`,
    atRisk: r.vendors_at_risk,
    delayedPOs: r.delayed_pos,
    status: API_CLUSTER_STATUS_MAP[r.status],
  }));
}

/** Distinct cluster names from the scorecard — feeds the page-level Cluster filter. */
export function clustersFromScorecard(rows: ClusterTeamRow[] | undefined): string[] {
  if (!rows?.length) return [];
  return [...new Set(rows.map((r) => r.cluster).filter(Boolean))];
}

interface ZeroFillUiRow {
  vendor: string;
  cluster: string;
  poCount: number;
  unitsOrdered: string;
  daysSinceGRN: number | string;
  status: string;
}

export function zeroFillVendorsToRows(rows: ZeroFillVendorRow[] | undefined): ZeroFillUiRow[] {
  if (!rows?.length) return [];
  return rows.map((r) => ({
    vendor: normalizeVendorName(r.vendor_name),
    cluster: DATA_NOT_AVAILABLE,
    poCount: r.total_po_qty,
    // `delivered_qty` is null by definition for zero-fill vendors — render dash.
    unitsOrdered: safeIntLocale(r.delivered_qty),
    daysSinceGRN: DATA_NOT_AVAILABLE,
    status: 'No GRN — Escalated',
  }));
}

interface VendorLoadUiRow {
  vendor: string;
  cluster: string;
  activePOs: number;
  capacityMo: string;
  currentLoad: string;
  loadPct: number;
  delayed: number;
  status: string;
}

export function vendorLoadToRows(rows: VendorLoadRow[] | undefined): VendorLoadUiRow[] {
  if (!rows?.length) return [];
  return rows.map((r) => ({
    vendor: normalizeVendorName(r.vendor_name),
    cluster: DATA_NOT_AVAILABLE,
    activePOs: r.total_po_qty,
    capacityMo: DATA_NOT_AVAILABLE,
    currentLoad: DATA_NOT_AVAILABLE,
    loadPct: 0,
    delayed: 0,
    status: DATA_NOT_AVAILABLE,
  }));
}

interface VendorPerfUiRow {
  vendor: string;
  onTime: string;
  quality: string;
  fillRate: string;
  score?: string;
  cluster?: string;
}

/** Top/Bottom vendors derived from /vendor_load_capacity. */
export function vendorPerformanceToRows(
  rows: VendorLoadRow[] | undefined,
  mode: 'top' | 'bottom',
  topN = 5,
): VendorPerfUiRow[] {
  if (!rows?.length) return [];
  const ranked = [...rows]
    .filter((r) => r.fill_rate_pct != null)
    .sort((a, b) =>
      mode === 'top'
        ? (b.fill_rate_pct ?? 0) - (a.fill_rate_pct ?? 0)
        : (a.fill_rate_pct ?? 0) - (b.fill_rate_pct ?? 0),
    )
    .slice(0, topN);
  return ranked.map((r) => ({
    vendor: normalizeVendorName(r.vendor_name),
    onTime: r.otif_pct == null ? EM_DASH : `${Math.round(r.otif_pct)}%`,
    quality: EM_DASH,
    fillRate: r.fill_rate_pct == null ? EM_DASH : `${Math.round(r.fill_rate_pct)}%`,
  }));
}

interface VendorConcentrationUiRow {
  vendor: string;
  cluster: string;
  poValue: string;
  share: string;
  categories: string;
  risk: string;
}

export function vendorConcentrationToRows(
  rows: VendorConcentrationRow[] | undefined,
): VendorConcentrationUiRow[] {
  if (!rows?.length) return [];
  return rows.map((r) => ({
    vendor: normalizeVendorName(r.vendor_name),
    cluster: r.cluster ?? EM_DASH,
    // API gives shipped unit count — render as count, NOT ₹ (mock was misleading).
    poValue: fmtUnits(r.vendor_qty),
    share: r.share_pct == null ? EM_DASH : `${r.share_pct.toFixed(1)}%`,
    categories: r.categories ?? EM_DASH,
    risk: EM_DASH,
  }));
}

/** Max share % from concentration response — drives the section subtitle. */
export function maxConcentrationShare(rows: VendorConcentrationRow[] | undefined): number {
  if (!rows?.length) return 0;
  return Math.max(...rows.map((r) => r.share_pct ?? 0));
}

// ─── Tab 2 adapters ───────────────────────────────────────────────────────

interface PoFunnelUiRow {
  stage: string;
  count: number;
}

export function poFunnelToData(points: ChartDataPoint[] | undefined): PoFunnelUiRow[] {
  if (!points?.length) return [];
  return points.map((p) => ({ stage: p.label, count: Math.round(p.value ?? 0) }));
}

interface LeadTimeUiRow {
  bucket: string;
  count: number;
  avgDays: number | null;
}

export function leadTimeDistributionToChart(
  points: ChartDataPoint[] | undefined,
): LeadTimeUiRow[] {
  if (!points?.length) return [];
  return points.map((p) => ({
    bucket: p.label,
    count: Math.round(p.value ?? 0),
    avgDays: p.value2 ?? null,
  }));
}

interface PoByCategoryUiRow {
  category: string;
  totalPOs: string;
  inProduction: number;
  inTransit: number;
  delivered: number;
  grnDone: number;
  fillRate: string;
  avgLead: string;
}

export function poByCategoryToRows(
  rows: PoPipelineCategoryRow[] | undefined,
): PoByCategoryUiRow[] {
  if (!rows?.length) return [];
  return rows.map((r) => ({
    category: r.category,
    totalPOs: safeIntLocale(r.total_pos),
    inProduction: r.in_production,
    inTransit: r.in_transit,
    delivered: r.delivered,
    grnDone: r.grn_done,
    fillRate: r.fill_rate == null ? EM_DASH : `${r.fill_rate.toFixed(1)}%`,
    avgLead: r.avg_lead == null ? EM_DASH : `${Math.round(r.avg_lead)} days`,
  }));
}

interface DelayedPoUiRow {
  poId: string;
  vendor: string;
  cluster: string;
  category: string;
  daysDelayed: number;
  stageStuck: string;
  value: string;
}

export function delayedPosToRows(rows: DelayedPoRow[] | undefined): DelayedPoUiRow[] {
  if (!rows?.length) return [];
  // Aggregate AWB-level rows to PO level to avoid duplicate PO IDs
  const grouped = new Map<string, { totalQty: number; maxDays: number; row: DelayedPoRow }>();
  for (const r of rows) {
    const key = `${r.po_number}-${r.vendor_code ?? r.vendor_name}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.totalQty += r.awb_quantity ?? 0;
      existing.maxDays = Math.max(existing.maxDays, r.days_since_awb ?? 0);
    } else {
      grouped.set(key, { totalQty: r.awb_quantity ?? 0, maxDays: r.days_since_awb ?? 0, row: r });
    }
  }
  return [...grouped.values()]
    .sort((a, b) => b.maxDays - a.maxDays)
    .map(({ totalQty, maxDays, row: r }) => ({
      poId: r.po_number,
      vendor: normalizeVendorName(r.vendor_name),
      cluster: r.cluster ?? EM_DASH,
      category: r.category_desc,
      daysDelayed: maxDays,
      stageStuck: r.stage_stuck,
      value: fmtUnits(totalQty),
    }));
}

// ─── Tab 3 adapters ───────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortenMonth(label: string): string {
  // "2026-03" → "Mar '26"
  const m = /^(\d{4})-(\d{2})$/.exec(label);
  if (!m) return label;
  const idx = parseInt(m[2]!, 10) - 1;
  const yearSuffix = `'${m[1]!.slice(2)}`;
  return `${MONTH_LABELS[idx] ?? label} ${yearSuffix}`;
}

interface SlaTrendUiRow {
  month: string;
  sla: number;
  target: number;
}

export function deliverySlaTrendToChart(
  points: ChartDataPoint[] | undefined,
): SlaTrendUiRow[] {
  if (!points?.length) return [];
  return points.map((p) => ({
    month: shortenMonth(p.label),
    sla: Number((p.value ?? 0).toFixed(1)),
    target: Number((p.value2 ?? 95).toFixed(0)),
  }));
}

interface DeliveryPartnerUiRow {
  partner: string;
  shipments: string;
  onTime: string;
  slaMet: string;
  avgDays: string;
  failedPickups: number;
  exceptions: number;
}

export function deliveryPartnerToRows(
  rows: DeliveryPartnerRow[] | undefined,
): DeliveryPartnerUiRow[] {
  if (!rows?.length) return [];
  return rows.map((r) => ({
    partner: normalizeVendorName(r.partner),
    shipments: safeIntLocale(r.shipments),
    onTime: EM_DASH,
    slaMet: r.sla_met == null ? EM_DASH : `${r.sla_met.toFixed(1)}%`,
    avgDays: r.avg_days == null ? EM_DASH : `${Number(r.avg_days.toFixed(1))} days`,
    failedPickups: r.failed_pickups,
    exceptions: r.exceptions,
  }));
}
