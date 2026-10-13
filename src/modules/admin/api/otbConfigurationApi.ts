/**
 * Client for the calculator-owned OTB config, now backed by the flattened,
 * versioned `otb_config_master` table.
 *
 * Reads un-flatten the master table into the nested shape below. Editable
 * scalar fields can be updated via `updateOtbConfiguration`; each save is
 * versioned and audited by the database (attributed as source='admin').
 */

import { apiUrl, apiHeaders } from '@/lib/utils';

export interface ChannelParams {
  nsm_pct?: number;
  sell_through_pct?: number;
  nsm_discount_pct?: number;
  /**
   * Per-channel AOP achievement %. UI-only for now — rendered/editable in the
   * Channel Parameters grid but not yet seeded as an editable config field, so
   * it is excluded from the save payload until the persistence phase lands.
   */
  aop_achievement_pct?: number;
}

export interface OtbChannelConfig {
  grain_column?: string;
  channel_params?: Record<string, ChannelParams>;
  exclude_formats?: string[];
  aggregation_levels?: string[];
  merge_columns?: string[];
  shared_inventory?: boolean;
  inventory_channels?: string[];
  demand_only_channels?: string[];
  reference_format?: Record<string, unknown>;
  flag_to_format?: Record<string, string>;
}

export interface SeasonDefinition {
  name?: string;
  label?: string;
  months?: number[];
}

export interface TargetSeason {
  code?: string;
  name?: string;
  year?: number;
}

export interface InventoryAgeFilter {
  mode?: string;
  enabled?: boolean;
  max_age_seasons?: number;
  max_age_days?: number;
}

export interface FilterRule {
  name?: string;
  field?: string;
  value?: number;
  operator?: string;
  is_active?: boolean;
  description?: string;
}

export interface DevaluationBucket {
  treatment?: string;
  min_seasons?: number;
  max_seasons?: number;
  devaluation_pct?: number;
}

export interface OtbConfiguration {
  org_name: string | null;
  planning_model: string | null;
  planning_frequency: string | null;
  otb_granularity: string | null;
  calculation_frequency: string[];

  lc_mrp_multiple: number | null;
  nsm_share_pct: number | null;
  nsm_discount_pct: number | null;
  sell_through_pct: number | null;
  min_sell_through_pct: number | null;
  max_holding_days: number | null;
  include_partial_devaluation: boolean | null;

  constants: Record<string, number | string>;
  channel_config: OtbChannelConfig;
  aggregation_levels: string[];
  plan_aggregation_levels: string[];
  inventory_age_filter: InventoryAgeFilter;
  devaluation_buckets: DevaluationBucket[];

  formats_in_scope: unknown[];
  segments_in_scope: unknown[];
  fashion_grades_in_scope: unknown[];

  season_definitions: Record<string, SeasonDefinition>;
  target_seasons: TargetSeason[];
  hit_names_by_frequency: Record<string, unknown>;

  exclude_kpis: string[];
  non_negative_kpis: string[];
  filter_rules: FilterRule[];
  kpi_formulae: Record<string, string>;

  version: number | null;
  updated_at: string | null;
  updated_by: string | null;
}

/**
 * Fetch the active calculator config for the current org.
 * Resolves to `null` when the org has no row (store-led orgs are not
 * provisioned in this table) — callers should render an empty state.
 */
export async function fetchOtbConfiguration(): Promise<OtbConfiguration | null> {
  const res = await fetch(apiUrl('/otb/admin/otb-configuration'), {
    headers: apiHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? body.message ?? `API error ${res.status}`);
  }
  const json = await res.json();
  return (json.data as OtbConfiguration | null) ?? null;
}

/** A single editable scalar change, keyed by its flattened json_path. */
export interface OtbConfigChange {
  json_path: string;
  value: number | string | boolean;
}

/** Result of an update: the new config version and the paths that changed. */
export interface OtbConfigUpdateResult {
  version: number | null;
  updated_fields: string[];
}

/**
 * Update editable scalar fields in `otb_config_master`.
 * Only fields flagged `is_editable` on the server may be changed; each save is
 * versioned and audited (source='admin'). List/object fields are not supported.
 *
 * The signed-in user's email is sent in the `x-user-data` header (same pattern
 * as the tasks/review modules); the backend reads it via `get_user_identity`
 * and records it as `changed_by`. Falls back to `system` server-side if absent.
 */
export async function updateOtbConfiguration(
  changes: OtbConfigChange[],
  userEmail: string,
): Promise<OtbConfigUpdateResult> {
  const res = await fetch(apiUrl('/otb/admin/otb-configuration'), {
    method: 'PATCH',
    headers: {
      ...apiHeaders(),
      'x-user-data': JSON.stringify({ email: userEmail }),
    },
    body: JSON.stringify({ changes }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? body.message ?? `API error ${res.status}`);
  }
  const json = await res.json();
  return json.data as OtbConfigUpdateResult;
}
