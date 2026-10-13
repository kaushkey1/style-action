/**
 * Admin API client for ANR configuration endpoints.
 *
 * Talks to the FastAPI backend at /anr/admin/{workflow_type}/...
 */

import type {
  ANRConfigData,
  ANRConstants,
  ANRFilterRule,
  ANRDataSource,
  ANRCustomDataSource,
  ANRDataPoint,
  WorkflowType,
} from '../data/anrConfigTypes';

import { apiHeaders, apiUrl } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WORKFLOW_TYPE_MAP: Record<WorkflowType, string> = {
  core_reordering: 'core_reordering',
  cover_days: 'cover_days',
  lifecycle_rotation: 'lifecycle_rotation',
  liquidation_channels: 'liquidation_channels',
  otb_budget: 'otb_budget',
  otb_kpi_formulae: 'otb_kpi_formulae',
  otb_planning: 'otb_planning',
  planogram_fill_rate: 'planogram_fill_rate',
  replenishment: 'replenishment',
  redistribution: 'redistribution',
  bottom_seller: 'pullback_bottom_seller',
  broken_set: 'pullback_broken_set',
  lifecycle_crossed: 'pullback_lifecycle_crossed',
  planogram_overfill: 'pullback_planogram_overfill',
};

// ---------------------------------------------------------------------------
// Raw API response types (from backend)
// ---------------------------------------------------------------------------

interface ApiConstant {
  constant_id: string;
  constant_key: string;
  constant_value: { value: unknown };
  value_type: string;
  ui_label: string | null;
  ui_category: string | null;
  ui_order: number;
  is_ui_editable: boolean;
  min_value: number | null;
  max_value: number | null;
  allowed_values: unknown[] | null;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

interface ApiFilterRule {
  rule_id: string;
  rule_name: string;
  field_name: string;
  operator: string;
  value: { value: unknown } | null;
  is_active: boolean;
  rule_order: number;
  description: string | null;
  ui_category: string | null;
  updated_at: string;
  updated_by: string | null;
}

interface ApiDataSource {
  data_source_id: string;
  source_name: string;
  backend: string;
  level: string;
  table_name: string | null;
  query_template: string | null;
  merge_columns: string[];
  interval_days: number;
  is_active: boolean;
  is_custom: boolean;
  updated_at: string;
}

interface ApiTemplate {
  template_id: string;
  template_name: string;
  template_type: string;
  config: Record<string, unknown>;
  is_active: boolean;
  updated_at: string;
}

interface ApiFullConfig {
  workflow_id: string;
  org_id: string;
  workflow_type: string;
  workflow_name: string;
  description: string | null;
  is_active: boolean;
  schedule_enabled: boolean;
  data_points: ApiDataPoint[];
  merge_columns: string[];
  non_null_cols: string[];
  input_custom_columns: unknown[];
  extra_params: Record<string, unknown>;
  constants: ApiConstant[];
  filter_rules: ApiFilterRule[];
  data_sources: ApiDataSource[];
  templates: ApiTemplate[];
}

interface ApiDataPoint {
  name: string;
  type: string;
  formula: string | number;
  is_active: boolean;
  description: string;
}

interface ApiEnvelope<T> {
  data: T;
  message: string;
  status_code: number;
}

// ---------------------------------------------------------------------------
// Transformers: API shape → component shape
// ---------------------------------------------------------------------------

// Constant keys that map to number fields in ANRConstants
const NUMBER_CONSTANT_KEYS = new Set([
  'trailing_days', 'default_cover_days', 'min_sales_threshold', 'days_per_week',
  'default_fill_rate', 'lead_time_standard', 'lead_time_express',
  'safety_stock_multiplier', 'fill_rate_target', 'stockout_alert_threshold',
  'dispatch_sla_metro_hours', 'dispatch_sla_tier23_hours',
  'min_ros_eligibility', 'min_display_stock', 'max_fill_rate_brick',
  'max_fill_rate_options', 'min_replenishment_qty', 'min_store_replenishment_qty',
  // Pullback
  'trailing_window', 'pullback_cooldown',
  'bs_min_stock_age', 'bs_fill_rate_floor', 'bs_target_option_gap', 'bs_target_brick_gap',
  'br_min_bsi', 'br_fill_rate_floor',
  'po_overfill_threshold',
  // Redistribution
  'min_woc_donor', 'max_woc_recipient', 'min_ros_recipient', 'post_move_tracking',
  // Cover Days
  'cd_core_noos', 'cd_ultimates_fashion_basics', 'cd_fashion', 'cd_fast_fashion', 'cd_seasonal',
  'noos_pre_warning_days', 'noos_breach_days', 'fashion_pre_warning_days', 'fashion_breach_days',
  'noos_stockout_projected_days', 'ros_decline_wow_threshold_pct',
  'min_size_completeness_pct', 'broken_set_markdown_days', 'zero_tolerance_days',
  // Lifecycle & Rotation
  'lr_a0_a1_days', 'lr_a1_a2_days', 'lr_a2_a3_days',
  'lr_str_gate_a1_a2', 'lr_str_gate_a2_a3',
  'lr_network_age_threshold', 'lr_store_age_threshold', 'lr_max_transfers_before_block',
  // Liquidation Channels
  'lc_max_clearance_weeks', 'lc_clearance_str_threshold', 'lc_ajio_listing_weeks', 'lc_residual_disposal_target',
  'lc_ch1_priority', 'lc_ch1_min_recovery', 'lc_ch2_priority', 'lc_ch2_min_recovery',
  'lc_ch3_priority', 'lc_ch3_min_recovery', 'lc_ch4_priority', 'lc_ch4_min_recovery',
  'lc_ch5_priority', 'lc_ch5_min_recovery', 'lc_ch6_priority', 'lc_ch6_min_recovery',
  // OTB Budget
  'otb_core_noos_pct', 'otb_fashion_pct',
  // OTB Planning
  'otb_fiscal_year_start', 'otb_base_margin_pct', 'otb_target_weeks_of_cover',
  'otb_net_sales_min_threshold', 'otb_inventory_age_max_days',
  // Planogram & Fill Rate
  'pf_default_fill_rate', 'pf_understock_threshold', 'pf_overstock_threshold',
  // CORE Reordering
  'cr_ads_window', 'cr_demand_spike_threshold', 'cr_demand_drop_threshold',
  'cr_store_ss_days_a_plus', 'cr_store_ss_days_a1_a3', 'cr_store_review_period', 'cr_service_level_target',
  'cr_dc_min_cover_days', 'cr_dc_max_cover_days', 'cr_dc_festive_buffer_days', 'cr_dc_festive_buffer_lead',
  'cr_fg_ss_target', 'cr_fg_ss_trigger', 'cr_ff_ss_target', 'cr_ff_ss_trigger',
  'cr_otif_threshold', 'cr_ftr_threshold', 'cr_max_vendor_shift', 'cr_min_vendor_stability_period', 'cr_costing_validity_window',
  'cr_default_surge_factor', 'cr_festive_surge_factor',
]);

// Constant keys that map to boolean fields
const BOOLEAN_CONSTANT_KEYS = new Set([
  'vmi_enabled', 'noos_auto_approval', 'noos_transfer_eligible', 'exclude_active_pos',
  // Pullback
  'bs_enabled', 'bs_exclude_core',
  'br_enabled', 'br_exclude_core', 'br_require_no_pos',
  'lc_enabled',
  'po_enabled', 'po_dry_run',
  // Redistribution
  'donor_ros_below_avg',
  // Lifecycle & Rotation
  'lr_seasonal_exemptions',
  // OTB Planning
  'otb_age_filter_enabled',
  // CORE Reordering
  'cr_oos_correction', 'cr_dsd_enabled_festive',
]);

// Constant keys that map to string fields
const STRING_CONSTANT_KEYS = new Set([
  'batch_size', 'run_date', 'comments_for_ui', 'min_grade_express', 'vmi_vendors',
  'cr_dc_safety_stock_days',
  'otb_current_fiscal_year', 'otb_planning_frequency',
]);

// Constant keys that map to string[] fields
const ARRAY_CONSTANT_KEYS = new Set([
  'segments_in_scope', 'sub_formats_in_scope', 'brands_in_scope',
  'otb_calc_frequencies', 'otb_aggregation_levels', 'otb_exclude_kpis', 'otb_non_negative_kpis',
]);

// Constant keys that map to number[] fields
const NUMBER_ARRAY_CONSTANT_KEYS = new Set([
  'otb_store_formats_in_scope', 'otb_segments_in_scope',
]);

// Constant keys that map to object/Record fields
const OBJECT_CONSTANT_KEYS = new Set([
  'otb_hit_names',
  'otb_kpi_formulae',
]);

function toConstants(apiConstants: ApiConstant[]): ANRConstants {
  const result: ANRConstants = {};
  for (const c of apiConstants) {
    const val = c.constant_value?.value;
    const key = c.constant_key as keyof ANRConstants;

    if (NUMBER_CONSTANT_KEYS.has(c.constant_key)) {
      (result as Record<string, unknown>)[key] = Number(val);
    } else if (BOOLEAN_CONSTANT_KEYS.has(c.constant_key)) {
      (result as Record<string, unknown>)[key] = Boolean(val);
    } else if (STRING_CONSTANT_KEYS.has(c.constant_key)) {
      (result as Record<string, unknown>)[key] = String(val);
    } else if (ARRAY_CONSTANT_KEYS.has(c.constant_key)) {
      (result as Record<string, unknown>)[key] = Array.isArray(val) ? val.map(String) : undefined;
    } else if (NUMBER_ARRAY_CONSTANT_KEYS.has(c.constant_key)) {
      (result as Record<string, unknown>)[key] = Array.isArray(val) ? val.map(Number) : undefined;
    } else if (OBJECT_CONSTANT_KEYS.has(c.constant_key)) {
      (result as Record<string, unknown>)[key] = typeof val === 'object' && val !== null ? val : undefined;
    }
  }
  return result;
}

function toFilterRules(apiRules: ApiFilterRule[]): ANRFilterRule[] {
  return apiRules.map((r) => ({
    name: r.rule_name,
    field: r.field_name,
    operator: r.operator,
    value: r.value?.value as string | number | undefined,
    is_active: r.is_active,
    description: r.description ?? '',
  }));
}

function toDataSources(apiSources: ApiDataSource[]): {
  dataSources: ANRDataSource[];
  customDataSources: ANRCustomDataSource[];
} {
  const dataSources: ANRDataSource[] = [];
  const customDataSources: ANRCustomDataSource[] = [];

  for (const s of apiSources) {
    const base = {
      name: s.source_name,
      backend: s.backend as 'bq' | 'pg',
      level: s.level as 'article' | 'option',
      merge_columns: s.merge_columns,
      interval: s.interval_days,
      is_active: s.is_active,
    };
    if (s.is_custom && s.query_template) {
      customDataSources.push({ ...base, query_template: s.query_template });
    } else {
      dataSources.push(base);
    }
  }
  return { dataSources, customDataSources };
}

function toDataPoints(apiDataPoints: ApiDataPoint[]): ANRDataPoint[] {
  return apiDataPoints.map((dp) => ({
    name: dp.name,
    type: dp.type as ANRDataPoint['type'],
    formula: String(dp.formula),
    is_active: dp.is_active,
    description: dp.description,
  }));
}

export function apiToConfigData(api: ApiFullConfig): ANRConfigData {
  const { dataSources, customDataSources } = toDataSources(api.data_sources);
  return {
    org_name: api.workflow_name,
    schedule_cron: '',
    bq_project_id: '',
    data_sources: dataSources,
    custom_data_sources: customDataSources.length > 0 ? customDataSources : undefined,
    merge_columns: api.merge_columns,
    non_null_cols: api.non_null_cols,
    data_points: toDataPoints(api.data_points),
    filter_rules: toFilterRules(api.filter_rules),
    constants: toConstants(api.constants),
  };
}

// ---------------------------------------------------------------------------
// Reverse transformers: component shape → API update payloads
// ---------------------------------------------------------------------------

/** Build batch-update payload — only includes constants whose values actually changed. */
function constantsToUpdates(
  constants: ANRConstants,
  originalConstants: ANRConstants,
  apiConstants: ApiConstant[],
): Array<{ constant_key: string; constant_value: { value: unknown } }> {
  const updates: Array<{ constant_key: string; constant_value: { value: unknown } }> = [];
  for (const c of apiConstants) {
    const key = c.constant_key as keyof ANRConstants;
    if (!(key in constants) || constants[key] === undefined) continue;
    const current = constants[key];
    const original = originalConstants[key];
    // Compare by JSON to handle arrays/objects
    if (JSON.stringify(current) !== JSON.stringify(original)) {
      updates.push({
        constant_key: c.constant_key,
        constant_value: { value: current },
      });
    }
  }
  return updates;
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { ...apiHeaders(), ...init?.headers } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? body.message ?? `API error ${res.status}`);
  }
  const envelope: ApiEnvelope<T> = await res.json();
  return envelope.data;
}

export async function fetchFullConfig(
  workflowType: WorkflowType,
): Promise<{ raw: ApiFullConfig; config: ANRConfigData }> {
  const wt = WORKFLOW_TYPE_MAP[workflowType];
  const data = await request<ApiFullConfig>(
    apiUrl(`/anr/admin/${wt}/config`),
  );
  return { raw: data, config: apiToConfigData(data) };
}

export async function batchUpdateConstants(
  workflowType: WorkflowType,
  constants: ANRConstants,
  originalConstants: ANRConstants,
  rawConstants: ApiConstant[],
): Promise<void> {
  const wt = WORKFLOW_TYPE_MAP[workflowType];
  const updates = constantsToUpdates(constants, originalConstants, rawConstants);
  if (updates.length === 0) return;
  await request(
    apiUrl(`/anr/admin/${wt}/constants`),
    {
      method: 'PATCH',
      body: JSON.stringify({ updates, updated_by: 'admin' }),
    },
  );
}

export async function updateFilterRule(
  workflowType: WorkflowType,
  ruleName: string,
  updates: { value?: { value: unknown }; is_active?: boolean },
): Promise<void> {
  const wt = WORKFLOW_TYPE_MAP[workflowType];
  await request(
    apiUrl(`/anr/admin/${wt}/filter-rules/${encodeURIComponent(ruleName)}`),
    { method: 'PATCH', body: JSON.stringify(updates) },
  );
}

export async function toggleDataSource(
  workflowType: WorkflowType,
  sourceName: string,
  isActive: boolean,
): Promise<void> {
  const wt = WORKFLOW_TYPE_MAP[workflowType];
  await request(
    apiUrl(`/anr/admin/${wt}/data-sources/${encodeURIComponent(sourceName)}/toggle`),
    { method: 'PATCH', body: JSON.stringify({ is_active: isActive }) },
  );
}

export async function resetConstantsToDefaults(
  workflowType: WorkflowType,
): Promise<void> {
  const wt = WORKFLOW_TYPE_MAP[workflowType];
  await request(
    apiUrl(`/anr/admin/${wt}/constants/reset`),
    { method: 'POST' },
  );
}

// Re-export raw types for the store
export type { ApiConstant, ApiFullConfig };
