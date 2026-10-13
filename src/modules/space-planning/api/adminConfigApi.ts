import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { ApiService, IMPETUS_APP_BASE, IMPETUS_HEADERS } from '@/lib/api';

// Admin-config endpoints share the standard /v1.0 application base
// (ADMIN_CONFIG_SPEC.md §4: /v1.0/space-planning/new/...).
const ADMIN_BASE = IMPETUS_APP_BASE;

const STALE_TIME_CONFIG_MS = 5 * 60 * 1000;
const STALE_TIME_HISTORY_MS = 60 * 1000;

// ─── Response types (mirror the backend admin_service payload) ──────────────

export interface AdminVersionInfo {
  config_id: string;
  version: number;
  created_by: string | null;
  created_at: string | null;
  description: string | null;
}

export interface AdminPlanningParameters {
  wspsf_same_season: number;
  wspsf_recency: number;
  wspsf_three_yr: number;
  blend_past: number;
  blend_aop: number;
  bor_rate: number;
  bor_min_carpet_sqft: number;
  lft_sqft_factor: number;
  sell_through_default: number;
  waterfill_tolerance: number;
  waterfill_max_iter: number;
}

export interface AdminDeductionMode {
  source: string;
  scope?: string | null;
}

export interface AdminDeductionRules {
  modes: Record<string, AdminDeductionMode>;
  formula_rates: Record<string, number>;
  sequence: string[];
}

export interface AdminLftOption {
  lft_factor: number;
  options_per_lft: number;
  min_options: number;
  max_options: number;
}

export interface AdminBand {
  min: number;
  max: number;
}

export interface AdminFixtureRow {
  fixture_type: string;
  category: string;
  min: number;
  max: number;
}

export interface AdminFloorRow {
  store_type: string;
  floor_config: string;
  category: string;
  floor: string;
}

export interface AdminPodMasterRow {
  category: string;
  pod_id: string;
  min_sqft: number;
  max_sqft: number;
}

export interface AdminSeasonWindow {
  window: string;
  sales_start: string | null;
  sales_end: string | null;
  space_season: string | null;
  space_file: string | null;
}

export interface AdminSeasonWindows {
  spsf: AdminSeasonWindow[];
  sheet1: AdminSeasonWindow[];
  /** purpose='season' planning-cycle date windows — must round-trip on save */
  season: AdminSeasonWindow[];
  asp_from: string | null;
  probe_order: string[];
}

export interface AdminBrickPodRow {
  category: string;
  brand: string;
  brick: string;
  pod_label: string;
}

export interface AdminPodXwalkRow {
  subcategory: string;
  category: string;
  pod_id: string;
  seq: number;
}

export interface AdminBrandScopeRow {
  brand: string;
  is_active: boolean;
}

export interface AdminMappings {
  brick_pod: AdminBrickPodRow[];
  pod_xwalk: AdminPodXwalkRow[];
  brand_scope: AdminBrandScopeRow[];
}

/** The nine editable sections — the draft the tabs edit and the PUT payload core. */
export interface AdminConfigSections {
  planning_parameters: AdminPlanningParameters;
  deduction_rules: AdminDeductionRules;
  efficiency_bands: Record<string, AdminBand>;
  fixture_capacity: AdminFixtureRow[];
  floor_placement: AdminFloorRow[];
  pod_master: AdminPodMasterRow[];
  format_category: Record<string, string[]>;
  season_windows: AdminSeasonWindows;
  mappings: AdminMappings;
  rounding_rule: string;
  lft_options: Record<string, AdminLftOption>;
  /** Category-wise minimum space in sqft (PENDING-ENGINE; {} = not configured). */
  category_min_space: Record<string, number>;
}

export interface AdminConfigResponse extends AdminConfigSections {
  version: AdminVersionInfo;
  run_effectiveness: Record<string, string>;
}

export interface AdminConfigSaveBody extends AdminConfigSections {
  expected_version: number;
  description: string;
}

export interface AdminSaveRunInfo {
  triggered: boolean;
  run_ref?: string | null;
  lock_minutes?: number;
  error?: string | null;
  /** true = run trigger intentionally disabled server-side (not a failure). */
  disabled?: boolean;
}

export interface AdminSaveResult {
  config_id: string;
  version: number;
  created_by?: string | null;
  created_at?: string | null;
  run?: AdminSaveRunInfo;
}

export interface AdminVersionRow {
  config_id: string;
  version: number;
  is_latest: boolean;
  status: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string | null;
}

// ─── Format-level override rules (v2) ────────────────────────────────────────

export interface AdminOverrideRule {
  rule_id: string;
  rule_type: string;
  applies_to: string;
  category: string;
  pod_id: string;
  line: string;
  method: string | null;
  payload: Record<string, unknown>;
  effective_from: string;
  effective_to: string | null;
  status: string;
  created_by: string | null;
  created_at: string | null;
  approved_by: string | null;
  remarks: string | null;
}

export interface AdminOverrideCreate {
  rule_type: string;
  applies_to: string;
  category?: string;
  pod_id?: string;
  line?: string;
  method?: string | null;
  payload: Record<string, unknown>;
  effective_from: string;
  effective_to?: string | null;
  remarks?: string | null;
}

export interface AdminResolvedBand {
  category: string;
  min: number | null;
  max: number | null;
  source: string;
  rule_id?: string;
}

export interface AdminWaterfallLine {
  line: string;
  method: string;
  value: number;
  source: string;
  deducted_sqft: number;
  remaining_sqft: number;
}

export interface AdminOverridePreview {
  store_code: string;
  format: string;
  carpet_area_sqft: number;
  resolved_on: string;
  pending_engine: boolean;
  bands: AdminResolvedBand[];
  deductions: {
    sequence: string[];
    waterfall: AdminWaterfallLine[];
    final_remaining_sqft: number;
  };
  pod_bounds: {
    category: string;
    pod_id: string;
    min_sqft: number | null;
    max_sqft: number | null;
    cap_type: string;
    source: string;
  }[];
  lft_options: Record<string, unknown>[];
}

export interface AdminLastRun {
  run_ref: string | null;
  status: string | null;
  triggered_by: string | null;
  triggered_at: string;
  config_version: number | null;
  note: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface AdminRunStatus {
  locked: boolean;
  locked_until: string | null;
  test_mode: boolean;
  test_stores: string | null;
  last_run: AdminLastRun | null;
}

export interface AdminAuditRow {
  version: number | null;
  section: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string | null;
}

export interface AdminRunRow {
  batch_id: string | null;
  started_at: string | null;
  finished_at: string | null;
  stores_total: number;
  stores_ok: number;
  stores_other: number;
  config_id: string | null;
  config_version: number | null;
}

// ─── Error parsing (409 conflict / 422 field errors from the ok/err envelope) ─

export interface AdminFieldError {
  tab: string;
  field: string;
  error: string;
}

export interface ParsedAdminApiError {
  status: number | null;
  message: string;
  fieldErrors: AdminFieldError[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readEnvelope(body: unknown, out: ParsedAdminApiError): void {
  if (!isRecord(body)) return;
  if (typeof body.message === 'string') out.message = body.message;
  if (typeof body.status_code === 'number') out.status = body.status_code;
  if (Array.isArray(body.errors)) {
    out.fieldErrors = body.errors.filter(isRecord).map((r) => ({
      tab: typeof r.tab === 'string' ? r.tab : '',
      field: typeof r.field === 'string' ? r.field : '',
      error: typeof r.error === 'string' ? r.error : '',
    }));
  }
}

export function parseAdminApiError(e: unknown): ParsedAdminApiError {
  const out: ParsedAdminApiError = { status: null, message: 'Request failed', fieldErrors: [] };
  if (!isRecord(e)) return out;
  if (typeof e.message === 'string') out.message = e.message;
  // The axios response interceptor rejects with the ok()/err() envelope body
  // itself ({message, status_code, errors}) — read it flat first.
  readEnvelope(e, out);
  // Fallback: a raw AxiosError (network failure before the interceptor, or a
  // non-envelope body) still carries response.status / response.data.
  const response = e.response;
  if (isRecord(response)) {
    if (out.status === null && typeof response.status === 'number') out.status = response.status;
    readEnvelope(response.data, out);
  }
  return out;
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function adminGet<T>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const res = await ApiService.get(`${ADMIN_BASE}${path}`, {
    params,
    headers: IMPETUS_HEADERS,
  });
  return res.data?.data ?? res.data;
}

async function adminPut<T>(path: string, data: unknown): Promise<T> {
  const res = await ApiService.put(`${ADMIN_BASE}${path}`, {
    data,
    headers: IMPETUS_HEADERS,
  });
  return res.data?.data ?? res.data;
}

async function adminPost<T>(path: string, data: unknown): Promise<T> {
  const res = await ApiService.post(`${ADMIN_BASE}${path}`, {
    data,
    headers: IMPETUS_HEADERS,
  });
  return res.data?.data ?? res.data;
}

// ─── Query keys + hooks ──────────────────────────────────────────────────────

export const adminConfigKeys = {
  all: ['space-planning-admin-config'] as const,
  config: () => [...adminConfigKeys.all, 'config'] as const,
  versions: () => [...adminConfigKeys.all, 'versions'] as const,
  runs: () => [...adminConfigKeys.all, 'runs'] as const,
  audit: () => [...adminConfigKeys.all, 'audit'] as const,
  overrides: () => [...adminConfigKeys.all, 'overrides'] as const,
  preview: (storeCode: string) => [...adminConfigKeys.all, 'preview', storeCode] as const,
  runStatus: () => [...adminConfigKeys.all, 'run-status'] as const,
};

const RUN_STATUS_POLL_MS = 30 * 1000;

export function useAdminRunStatus(): UseQueryResult<AdminRunStatus, Error> {
  return useQuery({
    queryKey: adminConfigKeys.runStatus(),
    queryFn: () => adminGet<AdminRunStatus>('/space-planning/new/config/run-status'),
    refetchInterval: RUN_STATUS_POLL_MS,
    staleTime: 0,
  });
}

export function useAdminConfig(): UseQueryResult<AdminConfigResponse, Error> {
  return useQuery({
    queryKey: adminConfigKeys.config(),
    queryFn: () => adminGet<AdminConfigResponse>('/space-planning/new/config'),
    staleTime: STALE_TIME_CONFIG_MS,
  });
}

export function useAdminConfigVersions(): UseQueryResult<AdminVersionRow[], Error> {
  return useQuery({
    queryKey: adminConfigKeys.versions(),
    queryFn: async () => {
      const data = await adminGet<{ versions: AdminVersionRow[] }>(
        '/space-planning/new/config/versions',
        { limit: 50 },
      );
      return data.versions;
    },
    staleTime: STALE_TIME_HISTORY_MS,
  });
}

export function useAdminAuditLog(): UseQueryResult<AdminAuditRow[], Error> {
  return useQuery({
    queryKey: adminConfigKeys.audit(),
    queryFn: async () => {
      const data = await adminGet<{ audit: AdminAuditRow[] }>(
        '/space-planning/new/config/audit',
        { limit: 200 },
      );
      return data.audit;
    },
    staleTime: STALE_TIME_HISTORY_MS,
  });
}

export function useAdminRuns(): UseQueryResult<AdminRunRow[], Error> {
  return useQuery({
    queryKey: adminConfigKeys.runs(),
    queryFn: async () => {
      const data = await adminGet<{ runs: AdminRunRow[] }>('/space-planning/new/runs', {
        limit: 50,
      });
      return data.runs;
    },
    staleTime: STALE_TIME_HISTORY_MS,
  });
}

export function useAdminOverrides(): UseQueryResult<AdminOverrideRule[], Error> {
  return useQuery({
    queryKey: adminConfigKeys.overrides(),
    queryFn: async () => {
      const data = await adminGet<{ rules: AdminOverrideRule[] }>(
        '/space-planning/new/config/overrides',
      );
      return data.rules;
    },
    staleTime: STALE_TIME_HISTORY_MS,
  });
}

export function useCreateOverride(): UseMutationResult<
  AdminOverrideRule,
  Error,
  AdminOverrideCreate
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminOverrideCreate) =>
      adminPost<AdminOverrideRule>('/space-planning/new/config/overrides', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminConfigKeys.overrides() });
      void queryClient.invalidateQueries({ queryKey: adminConfigKeys.audit() });
    },
  });
}

export function useOverrideStatus(): UseMutationResult<
  AdminOverrideRule,
  Error,
  { ruleId: string; action: 'approve' | 'reject' | 'deactivate'; remarks?: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, action, remarks }) =>
      adminPut<AdminOverrideRule>(`/space-planning/new/config/overrides/${ruleId}/status`, {
        action,
        remarks: remarks ?? null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminConfigKeys.overrides() });
      void queryClient.invalidateQueries({ queryKey: adminConfigKeys.audit() });
    },
  });
}

export function useBulkOverrides(): UseMutationResult<
  { created: number; rule_ids: string[] },
  Error,
  { rows: AdminOverrideCreate[] }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) =>
      adminPost<{ created: number; rule_ids: string[] }>(
        '/space-planning/new/config/overrides/bulk',
        body,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminConfigKeys.overrides() });
    },
  });
}

export function useOverridePreview(storeCode: string): UseQueryResult<
  AdminOverridePreview,
  Error
> {
  return useQuery({
    queryKey: adminConfigKeys.preview(storeCode),
    queryFn: () =>
      adminGet<AdminOverridePreview>('/space-planning/new/config/overrides/preview', {
        store_code: storeCode,
      }),
    enabled: storeCode.trim().length > 0,
    staleTime: STALE_TIME_HISTORY_MS,
  });
}

export function useSaveAdminConfig(): UseMutationResult<
  AdminSaveResult,
  Error,
  AdminConfigSaveBody
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminConfigSaveBody) =>
      adminPut<AdminSaveResult>('/space-planning/new/config/save', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminConfigKeys.all });
    },
  });
}
