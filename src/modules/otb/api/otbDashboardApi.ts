import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { appApiFetch, appApiPost } from '@/lib/api';
import { STALE_TIMES } from '@/lib/utils';

// ── Types ───────────────────────────────────────────────────────────

export interface ApiBudgetHome {
  total_budget: number;
  total_consumed: number;
  remaining: number;
  utilization_pct: number;
  plan_count: number;
  tiers: { tier: string; total_budget: number; total_consumed: number; plan_count: number; remaining: number; pct_of_total: number }[];
}

export interface ApiSegFamRow {
  segment: string | null;
  family: string | null;
  segment_name: string | null;
  family_name: string | null;
  budget: number;
  consumed: number;
  util_pct: number;
  status: string;
  // Last-season (prior same-season) columns (channel-led / Superdry)
  sales_mix_pct?: number;
  sell_through_achieved_pct?: number;
}

export interface ApiStoreRow {
  site: string;
  store_name: string | null;
  grade: string | null;
  city: string | null;
  budget: number;
  consumed: number;
  util_pct: number;
  status: string;
}

export interface ApiFilterItem {
  code: string;
  display_name: string;
}

export interface ApiFiltersResponse {
  formats: ApiFilterItem[];
  segments: ApiFilterItem[];
  families: ApiFilterItem[];
  brands: ApiFilterItem[];
  grades: ApiFilterItem[];
  hits: ApiFilterItem[];
  seasons: { code: string; label: string }[];
  fiscal_year: string | null;
}

export interface ApiChannelRow {
  channel: string;
  budget: number;
  consumed: number;
  util_pct: number;
  pct_of_total: number;
  plan_count: number;
  status: string;
}

export interface ChannelBreakdownResponse {
  items: ApiChannelRow[];
  total: number;
  summary: { budget: number; consumed: number; util_pct: number };
}

export interface ApiDerivationSummaryRow {
  channel: string;
  is_total: boolean;
  gsv: number;         // TTL GSV       (raw rupees)
  nsm_gsv: number;     // TTL NSM GSV   (raw rupees)
  mrp: number;         // MRP           (raw rupees; = GSV / (1 - discount), per channel)
  buy_mrp: number;     // TTL BUY MRP   (raw rupees)
  buy_lc: number;      // TTL BUY LC    (raw rupees; sum == total OTB)
  buy_units: number;   // TTL BUY UNITS (raw unit count)
  nsm_mix_pct: number; // NSM MIX %     (0-100)
  fp_st_pct: number;   // FP ST %       (0-100)
}

export interface DerivationSummaryResponse {
  items: ApiDerivationSummaryRow[];
  total_row: ApiDerivationSummaryRow | null;
  lc_mrp_multiple: number;
  aging_inventory_value: number; // brand-level aging inventory (raw rupees), no channel dim
}

export interface ApiCategorySummaryChannel {
  channel: string;
  budget: number;
  pct: number;
}

export interface ApiCategorySubcategory {
  subcategory: string;
  budget: number;
  plan_count: number;
}

export interface ApiCategorySummaryItem {
  category: string;
  otb_budget: number;
  plan_count: number;
  pct_of_total: number;
  channels: ApiCategorySummaryChannel[];
  top_subcategories: ApiCategorySubcategory[];
}

export interface CategorySummaryResponse {
  items: ApiCategorySummaryItem[];
  total_budget: number;
}

export interface SegFamResponse {
  items: ApiSegFamRow[];
  summary?: { budget: number; consumed: number; util_pct: number; sales_mix_pct?: number; sell_through_achieved_pct?: number };
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
}

export interface StoreBreakdownResponse {
  items: ApiStoreRow[];
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
}

// ── API Functions ───────────────────────────────────────────────────

export function fetchBudgetHome(storeId?: string | null, season?: string | null): Promise<ApiBudgetHome> {
  const params: Record<string, string | undefined> = {};
  if (storeId) params.store_id = storeId;
  if (season) params.season = season;
  return appApiFetch<ApiBudgetHome>('/otb/budget/home', params);
}

export function fetchOtbFilters(params?: {
  formats?: string;
  segments?: string;
  classes?: string;
}): Promise<ApiFiltersResponse> {
  return appApiFetch<ApiFiltersResponse>('/otb/budget/segment-family-status/filters', params);
}

export function fetchSegFamStatus(params: {
  page: number;
  page_size: number;
  formats?: string;
  segments?: string;
  families?: string;
  classes?: string;
  bricks?: string;
  store_id?: string;
  search?: string;
  season?: string;
}): Promise<SegFamResponse> {
  return appApiFetch<SegFamResponse>('/otb/budget/segment-family-status', params);
}

export function fetchCategorySummary(params: {
  season?: string;
}): Promise<CategorySummaryResponse> {
  return appApiFetch<CategorySummaryResponse>('/otb/budget/category-summary', params);
}

export function fetchChannelBreakdown(params: {
  season?: string;
}): Promise<ChannelBreakdownResponse> {
  return appApiFetch<ChannelBreakdownResponse>('/otb/budget/channel-breakdown', params);
}

export function fetchDerivationSummary(params: {
  season?: string;
}): Promise<DerivationSummaryResponse> {
  return appApiFetch<DerivationSummaryResponse>('/otb/budget/derivation-summary', params);
}

export function fetchStoreBreakdown(params: {
  page: number;
  page_size: number;
  formats?: string;
  segments?: string;
  families?: string;
  store_id?: string;
  search?: string;
}): Promise<StoreBreakdownResponse> {
  return appApiFetch<StoreBreakdownResponse>('/otb/budget/store-breakdown', params);
}

// ── Pod Detail Types ────────────────────────────────────────────────

export interface ApiDetailSummary {
  segment: string;
  family: string;
  budget: number;
  consumed: number;
  utilization_pct: number;
  status: string;
  otb_count: number;
}

export interface ApiDetailStore {
  site: string;
  store_name: string | null;
  city: string | null;
  state?: string | null;
  region?: string | null;
  grade: string | null;
  budget: number;
  consumed: number;
  util_pct: number;
  cover_days: number | null;
  capacity_pct: number | null;
  alerts: string[];
  status: string;
}

export interface ApiLineItem {
  otb_id: string;
  plan_name: string;
  brand: string;
  grade: string;
  hit: string;
  recommended: number;
  purchase: number;
  variance_pct: number | null;
  util_pct: number;
  status: string;
}

export interface PodDetailFilters {
  brands: ApiFilterItem[];
  grades: ApiFilterItem[];
  hits: ApiFilterItem[];
}

export interface PodStoresResponse {
  items: ApiDetailStore[];
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
}

export interface ChannelSiteBreakdownResponse {
  items: ApiDetailStore[];
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  procuro_status?: string;
}

export interface SiteMonthlyMetric {
  year: number | null;
  month: number | null;
  monthly_total: number;
}

export interface ChannelSiteMonthlyRow {
  site: string;
  store_name: string | null;
  city: string | null;
  state?: string | null;
  region?: string | null;
  monthly_metrics: SiteMonthlyMetric[];
  total: number;
}

export interface ChannelSiteMonthlyResponse {
  items: ChannelSiteMonthlyRow[];
  months: { year: number; month: number }[];
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  procuro_status?: string;
}

export interface PodLineItemsResponse {
  items: ApiLineItem[];
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  summary?: { total_recommended: number; total_purchase: number; total_variance_pct: number | null; total_util_pct: number };
}

// ── Pod Detail API Functions ────────────────────────────────────────

export function fetchPodSummary(segment: string, family: string): Promise<ApiDetailSummary> {
  return appApiFetch<ApiDetailSummary>('/otb/budget/segment-family-detail', { segment, family });
}

export function fetchPodFilters(): Promise<PodDetailFilters> {
  return appApiFetch<PodDetailFilters>('/otb/budget/segment-family-status/filters');
}

export function fetchPodStores(params: {
  segment: string;
  family: string;
  page: number;
  page_size: number;
  grade?: string;
  search?: string;
}): Promise<PodStoresResponse> {
  return appApiFetch<PodStoresResponse>('/otb/budget/segment-family-detail/store-breakdown', params);
}

export function fetchPodLineItems(params: {
  segment: string;
  family: string;
  page: number;
  page_size: number;
  sort_by?: string;
  sort_order?: string;
  brands?: string;
  grades?: string;
  hits?: string;
  search?: string;
}): Promise<PodLineItemsResponse> {
  return appApiFetch<PodLineItemsResponse>('/otb/budget/segment-family-detail/line-items', params);
}

// ── Query Key Factory ───────────────────────────────────────────────

export const otbKeys = {
  all: ['otb'] as const,
  budgetHome: (storeId?: string | null, season?: string | null) => [...otbKeys.all, 'budget-home', storeId, season] as const,
  filters: (params?: Record<string, unknown>) => [...otbKeys.all, 'filters', params] as const,
  segFamStatus: (params: Record<string, unknown>) => [...otbKeys.all, 'seg-fam-status', params] as const,
  storeBreakdown: (params: Record<string, unknown>) => [...otbKeys.all, 'store-breakdown', params] as const,
  categorySummary: (params: Record<string, unknown>) => [...otbKeys.all, 'category-summary', params] as const,
  channelBreakdown: (params: Record<string, unknown>) => [...otbKeys.all, 'channel-breakdown', params] as const,
  derivationSummary: (params: Record<string, unknown>) => [...otbKeys.all, 'derivation-summary', params] as const,
  podSummary: (segment: string, family: string) => [...otbKeys.all, 'pod-summary', segment, family] as const,
  podFilters: (segment: string, family: string) => [...otbKeys.all, 'pod-filters', segment, family] as const,
  podStores: (params: Record<string, unknown>) => [...otbKeys.all, 'pod-stores', params] as const,
  podLineItems: (params: Record<string, unknown>) => [...otbKeys.all, 'pod-line-items', params] as const,
  channelSiteBreakdown: (params: Record<string, unknown>) => [...otbKeys.all, 'channel-site-breakdown', params] as const,
  channelSiteMonthly: (params: Record<string, unknown>) => [...otbKeys.all, 'channel-site-monthly', params] as const,
};

// ── React Query Hooks ───────────────────────────────────────────────

export function useBudgetHome(storeId?: string | null, season?: string | null) {
  return useQuery({
    queryKey: otbKeys.budgetHome(storeId, season),
    queryFn: () => fetchBudgetHome(storeId, season),
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useOtbFilters(params?: Parameters<typeof fetchOtbFilters>[0]) {
  return useQuery({
    queryKey: otbKeys.filters(params),
    queryFn: () => fetchOtbFilters(params),
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function useSegFamStatus(params: Parameters<typeof fetchSegFamStatus>[0]) {
  return useQuery({
    queryKey: otbKeys.segFamStatus(params),
    queryFn: () => fetchSegFamStatus(params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
  });
}

export function useStoreBreakdown(params: Parameters<typeof fetchStoreBreakdown>[0]) {
  return useQuery({
    queryKey: otbKeys.storeBreakdown(params),
    queryFn: () => fetchStoreBreakdown(params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
  });
}

export function useCategorySummary(params: Parameters<typeof fetchCategorySummary>[0]) {
  return useQuery({
    queryKey: otbKeys.categorySummary(params),
    queryFn: () => fetchCategorySummary(params),
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useChannelBreakdown(params: Parameters<typeof fetchChannelBreakdown>[0]) {
  return useQuery({
    queryKey: otbKeys.channelBreakdown(params),
    queryFn: () => fetchChannelBreakdown(params),
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useDerivationSummary(params: Parameters<typeof fetchDerivationSummary>[0], enabled = true) {
  return useQuery({
    queryKey: otbKeys.derivationSummary(params),
    queryFn: () => fetchDerivationSummary(params),
    staleTime: STALE_TIMES.LISTING,
    enabled,
  });
}

export function fetchCategoryKpiData(classCode: string, brick: string, season?: string): Promise<OtbKpiData> {
  const params: Record<string, string> = { class: classCode, brick };
  if (season) params.season = season;
  return appApiFetch<OtbKpiData>('/otb/plan/category-kpi-data', params);
}

export function useCategoryKpiData(classCode: string | null, brick: string | null, season?: string | null) {
  return useQuery({
    queryKey: [...otbKeys.all, 'category-kpi-data', classCode, brick, season] as const,
    queryFn: () => fetchCategoryKpiData(classCode!, brick!, season ?? undefined),
    staleTime: STALE_TIMES.LISTING,
    enabled: !!classCode && !!brick,
  });
}

export function fetchChannelKpiData(format: string, season?: string): Promise<OtbKpiData> {
  const params: Record<string, string> = { format };
  if (season) params.season = season;
  return appApiFetch<OtbKpiData>('/otb/plan/channel-kpi-data', params);
}

export function useChannelKpiData(format: string | null, season?: string | null) {
  return useQuery({
    queryKey: [...otbKeys.all, 'channel-kpi-data', format, season] as const,
    queryFn: () => fetchChannelKpiData(format!, season ?? undefined),
    staleTime: STALE_TIMES.LISTING,
    enabled: !!format,
  });
}

export function fetchChannelSiteBreakdown(params: {
  channel: string;
  season?: string;
  page: number;
  page_size: number;
  search?: string;
}): Promise<ChannelSiteBreakdownResponse> {
  const query: Record<string, string | number> = {
    channel: params.channel,
    page: params.page,
    page_size: params.page_size,
  };
  if (params.season) query.season = params.season;
  if (params.search) query.search = params.search;
  return appApiFetch<ChannelSiteBreakdownResponse>('/otb/budget/channel-site-breakdown', query);
}

export function useChannelSiteBreakdown(
  params: Parameters<typeof fetchChannelSiteBreakdown>[0],
  enabled = true,
) {
  return useQuery({
    queryKey: otbKeys.channelSiteBreakdown(params),
    queryFn: () => fetchChannelSiteBreakdown(params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
    enabled: enabled && !!params.channel,
  });
}

export function fetchChannelSiteMonthly(params: {
  channel: string;
  season?: string;
  page: number;
  page_size: number;
}): Promise<ChannelSiteMonthlyResponse> {
  const query: Record<string, string | number> = {
    channel: params.channel,
    page: params.page,
    page_size: params.page_size,
  };
  if (params.season) query.season = params.season;
  return appApiFetch<ChannelSiteMonthlyResponse>('/otb/budget/channel-site-monthly', query);
}

export function useChannelSiteMonthly(
  params: Parameters<typeof fetchChannelSiteMonthly>[0],
  enabled = true,
) {
  return useQuery({
    queryKey: otbKeys.channelSiteMonthly(params),
    queryFn: () => fetchChannelSiteMonthly(params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
    enabled: enabled && !!params.channel,
  });
}

// ── Pod Detail Hooks ────────────────────────────────────────────────

export function usePodSummary(segment: string, family: string) {
  return useQuery({
    queryKey: otbKeys.podSummary(segment, family),
    queryFn: () => fetchPodSummary(segment, family),
    staleTime: STALE_TIMES.LISTING,
    enabled: !!segment && !!family,
  });
}

export function usePodFilters() {
  return useQuery({
    queryKey: otbKeys.podFilters('', ''),
    queryFn: () => fetchPodFilters(),
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function usePodStores(params: Parameters<typeof fetchPodStores>[0]) {
  return useQuery({
    queryKey: otbKeys.podStores(params),
    queryFn: () => fetchPodStores(params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
    enabled: !!params.segment && !!params.family,
  });
}

export function usePodLineItems(params: Parameters<typeof fetchPodLineItems>[0]) {
  return useQuery({
    queryKey: otbKeys.podLineItems(params),
    queryFn: () => fetchPodLineItems(params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
    enabled: !!params.segment && !!params.family,
  });
}

// ── Calculation Sheet Types & API ───────────────────────────────────

export interface OtbPlanData {
  otb_id: string;
  plan_name: string;
  season: string | null;
  brand: string | null;
  grade: string | null;
  hit: string | null;
  segment: string | null;
  family: string | null;
  division: string | null;
  format: string | null;
  status: string | null;
  summary: {
    recommended_value: number;
    purchase_value: number;
    variance_pct: number;
    utilization_pct: number;
  };
}

export interface OtbWeeklyMetric {
  week_number: number;
  value: number;
  is_editable: boolean;
  proposed_value: number | null;
  approval_status: string | null;
}

export interface OtbMonthlyMetric {
  year: number;
  month: number;
  monthly_total: number;
  is_editable: boolean;
  proposed_value: number | null;
  approval_status: string | null;
  weekly_metrics?: OtbWeeklyMetric[];
}

export interface OtbKpi {
  kpi_id: string;
  kpi_name: string;
  monthly_metrics: OtbMonthlyMetric[];
}

export interface OtbKpiGroup {
  group_name: string;
  kpis: OtbKpi[];
}

export interface OtbKpiData {
  otb_id: string;
  otb_data: OtbKpiGroup[];
  remaining_data: OtbKpiGroup[];
  editable_periods: { year: number; month: number }[];
  season?: string;
  season_months?: { start: number; end: number };
  available_seasons?: string[];
}

export interface OtbEditLogItem {
  change_id: string;
  otb_id: string;
  otb_number: string | null;
  actor_name: string | null;
  actor_role: string | null;
  old_value: number;
  new_value: number;
  variance_pct: number | null;
  status: string;
  approved_by: string | null;
  timestamp: string | null;
  comments?: string | null;
}

export interface OtbEditLogResponse {
  items: OtbEditLogItem[];
}

export interface OtbSummaryView {
  otb_id: string;
  otb_code: string;
  otb_code_breakdown: {
    brand: { code: string; display_name: string | null };
    segment: { code: string; display_name: string | null };
    fashion_grade: { code: string; display_name: string | null };
    family: { code: string; display_name: string | null };
    season_name: { code: string; display_name: string | null };
    season_year: { code: string; display_name: string | null };
    hit: { code: string; display_name: string | null };
    purchase_group: { code: string; display_name: string | null };
  };
  total_value: number;
  consumption: number;
  available_amount: number;
  status: string;
  month: number;
  current_average_margin: number;
  budget_validity: {
    start_date: string;
    end_date: string;
    period_type: string;
  };
}

export interface OtbEditRequestPayload {
  request_by: string;
  otb_requests: {
    otb_id: string;
    kpi_changes: {
      kpi_id: string;
      week_values: { week: number; proposed_value: number }[];
    }[];
  }[];
}

export function fetchOtbPlan(planId: string): Promise<OtbPlanData> {
  return appApiFetch<OtbPlanData>(`/otb/budget/plan/${planId}`);
}

export function fetchOtbKpiData(planId: string, season?: string): Promise<OtbKpiData> {
  const params: Record<string, string> = {};
  if (season) params.season = season;
  return appApiFetch<OtbKpiData>(`/otb/plan/${planId}/kpi-data`, Object.keys(params).length > 0 ? params : undefined);
}

export function fetchOtbEditLog(planId: string): Promise<OtbEditLogResponse> {
  return appApiFetch<OtbEditLogResponse>(`/otb/plan/${planId}/edit-log`);
}

export function fetchOtbSummaryView(planId: string): Promise<OtbSummaryView> {
  return appApiFetch<OtbSummaryView>(`/otb/summary_view`, { otb_id: planId });
}

export function postEditRequest(payload: OtbEditRequestPayload): Promise<unknown> {
  return appApiPost<unknown>('/otb/plan/edit-request', payload);
}

export const otbCalcKeys = {
  plan: (planId: string) => [...otbKeys.all, 'plan', planId] as const,
  kpi: (planId: string) => [...otbKeys.all, 'kpi', planId] as const,
  editLog: (planId: string) => [...otbKeys.all, 'edit-log', planId] as const,
  summaryView: (planId: string) => [...otbKeys.all, 'summary-view', planId] as const,
};

export function useOtbPlan(planId: string, enabled = true) {
  return useQuery({
    queryKey: otbCalcKeys.plan(planId),
    queryFn: () => fetchOtbPlan(planId),
    staleTime: STALE_TIMES.DETAIL,
    enabled: !!planId && enabled,
  });
}

export function useOtbKpiData(planId: string, enabled = true, season?: string) {
  return useQuery({
    queryKey: [...otbCalcKeys.kpi(planId), season ?? ''],
    queryFn: () => fetchOtbKpiData(planId, season),
    staleTime: STALE_TIMES.DETAIL,
    enabled: !!planId && enabled,
  });
}

export function useOtbEditLog(planId: string, enabled = true) {
  return useQuery({
    queryKey: otbCalcKeys.editLog(planId),
    queryFn: () => fetchOtbEditLog(planId),
    staleTime: STALE_TIMES.HISTORY,
    enabled: !!planId && enabled,
  });
}

export function useOtbSummaryView(planId: string, enabled = true) {
  return useQuery({
    queryKey: otbCalcKeys.summaryView(planId),
    queryFn: () => fetchOtbSummaryView(planId),
    staleTime: STALE_TIMES.DETAIL,
    enabled: !!planId && enabled,
  });
}

export function useOtbEditRequest(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OtbEditRequestPayload) => postEditRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: otbCalcKeys.kpi(planId) });
      void queryClient.invalidateQueries({ queryKey: otbCalcKeys.editLog(planId) });
      void queryClient.invalidateQueries({ queryKey: otbCalcKeys.plan(planId) });
      void queryClient.invalidateQueries({ queryKey: otbCalcKeys.summaryView(planId) });
    },
  });
}

// ── Aggregate (channel/category) Edit Log History ───────────────────

interface OtbEditLogPage {
  items?: OtbEditLogItem[];
}

/** Body for recording a seasonal Purchase-Value edit at an aggregate. */
export interface RecordAggregateEditPayload {
  scope_type: 'channel' | 'category';
  new_value: number;
  old_value?: number | null;
  format?: string;
  class?: string;
  brick?: string;
  kpi_name?: string;
  kpi_id?: string | null;
  season?: string | null;
  year?: number | null;
  month?: number | null;
  plan_count?: number | null;
  comments?: string | null;
}

export const otbEditLogKeys = {
  channel: (format: string) => [...otbKeys.all, 'edit-log', 'channel', format] as const,
  category: (classCode: string, brick: string) =>
    [...otbKeys.all, 'edit-log', 'category', classCode, brick] as const,
};

export function fetchChannelEditLog(format: string): Promise<OtbEditLogItem[]> {
  return appApiFetch<OtbEditLogPage>(
    `/otb/channel/${encodeURIComponent(format)}/edit-log`,
  ).then((r) => r.items ?? []);
}

export function fetchCategoryEditLog(classCode: string, brick: string): Promise<OtbEditLogItem[]> {
  return appApiFetch<OtbEditLogPage>(
    `/otb/category/${encodeURIComponent(classCode)}/${encodeURIComponent(brick)}/edit-log`,
  ).then((r) => r.items ?? []);
}

export function recordAggregateEdit(payload: RecordAggregateEditPayload): Promise<unknown> {
  return appApiPost<unknown>('/otb/edit-log', payload);
}

export function useChannelEditLog(format: string | null, enabled = true) {
  return useQuery({
    queryKey: otbEditLogKeys.channel(format ?? ''),
    queryFn: () => fetchChannelEditLog(format!),
    staleTime: STALE_TIMES.HISTORY,
    enabled: !!format && enabled,
  });
}

export function useCategoryEditLog(
  classCode: string | null,
  brick: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: otbEditLogKeys.category(classCode ?? '', brick ?? ''),
    queryFn: () => fetchCategoryEditLog(classCode!, brick!),
    staleTime: STALE_TIMES.HISTORY,
    enabled: !!classCode && !!brick && enabled,
  });
}

export function useRecordAggregateEdit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordAggregateEditPayload) => recordAggregateEdit(payload),
    onSuccess: (_data, payload) => {
      if (payload.scope_type === 'channel' && payload.format) {
        void queryClient.invalidateQueries({
          queryKey: otbEditLogKeys.channel(payload.format),
        });
      } else if (payload.scope_type === 'category' && payload.class && payload.brick) {
        void queryClient.invalidateQueries({
          queryKey: otbEditLogKeys.category(payload.class, payload.brick),
        });
      }
    },
  });
}
