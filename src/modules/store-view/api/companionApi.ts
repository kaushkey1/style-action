/**
 * Companion App → Business Health API client.
 *
 * Backs the live Business Health dashboard from the `companion` module in
 * impetus-agentic-central (`/v1.0/companion/*`). Served on the PUBLIC service
 * (`/service/public/impetus-agentic`), same as the CX section — so it uses
 * `apiFetch` (public), not `appApiFetch` (application).
 *
 * Response shapes intentionally mirror the Business Health mock contract
 * (`mockBusinessHealth.ts`) so the existing presentational components consume
 * them unchanged: chart series are `{label,value}` / `{date,value}` raw numbers;
 * KPI cards and table cells carry pre-formatted display strings (e.g. "₹42.7 Cr").
 */
import { apiFetch, apiPost } from '@/lib/api';

import type { ProductOverviewResponse, JourneyFunnelResponse, DiscoveryCatalogueResponse, ProductCxResponse } from './productHealthTypes';

const BASE = '/companion';

/** Selected date window; omit for All-time. */
export interface CompanionRange {
  from?: string; // 'YYYY-MM-DD'
  to?: string;
}

function rangeParams(range: CompanionRange): Record<string, string> {
  const params: Record<string, string> = {};
  if (range.from) params.from = range.from;
  if (range.to) params.to = range.to;
  return params;
}

/* ── Shared atoms ─────────────────────────────────────────────────────── */

// Chart atoms carry an index signature so they satisfy the kit's Recharts
// `Record<string, string | number>[]` data props directly.
export interface LabelValue {
  label: string;
  value: number;
  [key: string]: string | number;
}
export interface DatePoint {
  date: string;
  value: number;
  [key: string]: string | number;
}
export interface MonthPoint {
  month: string;
  value: number;
  [key: string]: string | number;
}
export interface CompanionKpi {
  key: string;
  label: string;
  value: string;
  trend: string;
  status: 'success' | 'warning';
}
export interface RibbonSegment {
  label: string;
  value: number;
  tone: 'success' | 'info' | 'warning' | 'critical';
}
export interface CompanionAttentionCard {
  key: string;
  title: string;
  value: string;
  note: string;
  status: 'warning' | 'critical';
}

/* ── Business Overview (+ CX folded in) ───────────────────────────────── */

export interface OverviewTrends {
  egmv: DatePoint[];
  orders: DatePoint[];
  customers: DatePoint[];
  aov: DatePoint[];
  orderingStores: DatePoint[];
  fulfilment: DatePoint[];
  paymentFailure: DatePoint[];
}

export interface CxDataQuality {
  trustworthy: boolean;
  responseIdsUnique: boolean;
  storeMatchCoveragePct: number;
  note: string | null;
}

export interface BusinessOverviewResponse {
  overviewKpis: CompanionKpi[];
  growthUnavailableNote: string;
  overviewTrends: OverviewTrends;
  orderLifecycle: RibbonSegment[];
  topStoresByEgmv: LabelValue[];
  revenueByState: LabelValue[];
  ratingDistribution: LabelValue[];
  purchaseDifficultySplit: LabelValue[];
  attentionCards: CompanionAttentionCard[];
  cxDataQuality: CxDataQuality;
}

/* ── Sales Detail ─────────────────────────────────────────────────────── */

export interface BrandUnits {
  brand: string;
  units: number;
  egmv: string;
}
export interface StateOrders {
  state: string;
  orders: number;
  egmv: string;
}
export interface SalesRow {
  date: string;
  orderId: string;
  store: string;
  state: string;
  customer: string;
  units: number;
  egmv: string;
  payment: string;
  status: string;
}
export interface SalesTrends {
  monthlyOrders: MonthPoint[];
  monthlyEgmv: MonthPoint[];
}
export interface SalesDetailResponse {
  revenueByState: LabelValue[];
  salesKpis: CompanionKpi[];
  orderValueHistogram: LabelValue[];
  paymentModeShare: LabelValue[];
  salesTrends: SalesTrends;
  storesByEgmv: LabelValue[];
  storesByOrderCount: LabelValue[];
  topBrandsByEgmv: LabelValue[];
  brandUnitsSold: BrandUnits[];
  ordersByState: StateOrders[];
  salesTable: SalesRow[];
}

/* ── Store Performance ────────────────────────────────────────────────── */

export interface StoreDirRow {
  uid: number | null;
  name: string;
  id: string;
  code: string;
  city: string;
  state: string;
  activity: string;
  orders: number;
  egmv: string;
  scans: number;
  scanSuccess: string;
  lastOrder: string;
  daysSince: number;
  lat: number | null;
  lng: number | null;
}

/** Compact store pin for the network map (all stores, unpaginated). */
export interface StoreLocation {
  name: string;
  city: string;
  activity: string;
  lat: number;
  lng: number;
}
export interface StoreLocationsResponse {
  stores: StoreLocation[];
}
export interface StoreActivityTrends {
  activeStores: DatePoint[];
  orderingStores: DatePoint[];
  scans: DatePoint[];
  scanActiveStores: DatePoint[];
}
export interface ScansVsOrdersPoint {
  store: string;
  scans: number;
  orders: number;
}
export interface StorePerformanceResponse {
  storeKpis: CompanionKpi[];
  storeActivityMix: LabelValue[];
  storeActivityTrends: StoreActivityTrends;
  orderRecency: LabelValue[];
  topStoresByEgmv: LabelValue[];
  topStoresByOrders: LabelValue[];
  topStoresByScans: LabelValue[];
  scansVsOrders: ScansVsOrdersPoint[];
}

/** Paginated + searchable store directory (served separately). */
export interface StoreDirectoryParams {
  page: number;
  pageSize: number;
  search?: string;
}
export interface StoreDirectoryResponse {
  rows: StoreDirRow[];
  total: number;
}

/* ── Store Detail ─────────────────────────────────────────────────────── */

export interface StoreDetailResponse {
  name: string;
  code: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  orders: number;
  egmv: string;
  scanAttempts: number;
  scanSuccess: number;
  scanSuccessRate: string;
  lastOrder: string;
  dailyOrders: DatePoint[];
  dailyEgmv: DatePoint[];
  dailyScans: DatePoint[];
  topBrands: LabelValue[];
  paymentSplit: LabelValue[];
}

/* ── AI briefing (Business & Product) ─────────────────────────────────── */

export type CompanionSummaryView = 'business' | 'product';

export interface CompanionAiSummary {
  label: string;
  question: string;
  summary: string; // plain prose with **bold** markup
  updated_at: string | null;
  source: string; // 'persist' | 'redis_today' | 'redis_range'
}

function summaryQuery(view: CompanionSummaryView, range: CompanionRange): string {
  const p = new URLSearchParams({ view });
  if (range.from) p.set('from', range.from);
  if (range.to) p.set('to', range.to);
  return p.toString();
}

/* ── Client ───────────────────────────────────────────────────────────── */

export const companionApi = {
  productOverview: (range: CompanionRange) => apiFetch<ProductOverviewResponse>(`${BASE}/product-overview`, rangeParams(range)),
  journeyFunnel: (range: CompanionRange) => apiFetch<JourneyFunnelResponse>(`${BASE}/journey-funnel`, rangeParams(range)),
  discoveryCatalogue: (range: CompanionRange) => apiFetch<DiscoveryCatalogueResponse>(`${BASE}/discovery-catalogue`, rangeParams(range)),
  productCx: (range: CompanionRange) => apiFetch<ProductCxResponse>(`${BASE}/product-cx`, rangeParams(range)),
  businessOverview: (range: CompanionRange) =>
    apiFetch<BusinessOverviewResponse>(`${BASE}/business-overview`, rangeParams(range)),
  salesDetail: (range: CompanionRange) =>
    apiFetch<SalesDetailResponse>(`${BASE}/sales-detail`, rangeParams(range)),
  storePerformance: (range: CompanionRange) =>
    apiFetch<StorePerformanceResponse>(`${BASE}/store-performance`, rangeParams(range)),
  storeDirectory: (range: CompanionRange, params: StoreDirectoryParams) =>
    apiFetch<StoreDirectoryResponse>(`${BASE}/store-directory`, {
      ...rangeParams(range),
      page: params.page,
      page_size: params.pageSize,
      search: params.search || undefined,
    }),
  storeLocations: (range: CompanionRange) =>
    apiFetch<StoreLocationsResponse>(`${BASE}/store-locations`, rangeParams(range)),
  storeDetail: (uid: string, range: CompanionRange) =>
    apiFetch<StoreDetailResponse>(`${BASE}/store-detail`, { uid, ...rangeParams(range) }),
  aiSummary: (view: CompanionSummaryView, range: CompanionRange) =>
    apiFetch<CompanionAiSummary>(`${BASE}/ai-summary`, { view, ...rangeParams(range) }),
  refreshAiSummary: (view: CompanionSummaryView, range: CompanionRange) =>
    apiPost<CompanionAiSummary>(`${BASE}/ai-summary/refresh?${summaryQuery(view, range)}`),
};
