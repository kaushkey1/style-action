export type ParameterKey = 'nsm_ratio' | 'sell_through_ratio' | 'discount_ratio' | 'aop_achievement_ratio';
export type ScopeType = 'organisation' | 'channel' | 'site' | 'planned_site';

export interface AdminChannel { code: string; excluded: boolean }
export interface ConfigResponse { configuration: Configuration; can_write: boolean; channels: AdminChannel[]; channel_defaults_template: ChannelPlanningDefaults }

export interface ChannelPlanningDefaults {
  discount_pct: number | null;
  lc_mrp_multiple: number | null;
  growth_pct: number | null;
  gsv_target: number | null;
  gm_pct_target: number | null;
}

export interface Season {
  season_code: string;
  season_name: string;
  months: number[];
}

export interface ParameterRule {
  rule_id: string | null;
  scope_type: ScopeType;
  season_code: string;
  channel_code: string | null;
  site_id: string | null;
  added_store_id: string | null;
  month_number: number | null;
  parameter_key: ParameterKey;
  parameter_value: number;
}

export interface Configuration {
  config_id: string | null;
  org_id: string;
  version_no: number;
  is_current: boolean;
  created_by: string | null;
  created_at: string | null;
  change_reason: string | null;
  source_reference: Record<string, unknown>;
  season_definitions: Season[];
  planning_settings: {
    initial_growth_pct: number | null;
    max_cell_increase_ratio: number | null;
    new_store_gm_fallback_pct: number | null;
    channel_planning_defaults: Record<string, ChannelPlanningDefaults>;
    aop_achievement_ratio?: number | null;
  };
  kpi_settings: {
    growth: { warning_min_pct: number | null; warning_max_pct: number | null };
    high_growth: { threshold_pct: number | null };
    steep_decline: { threshold_pct: number | null };
    quarterly_phasing: { deviation_pp: number | null };
  };
  parameter_rules: ParameterRule[];
}

export interface ParameterOperation {
  op: 'set_parameter' | 'remove_parameter';
  scope: { type: ScopeType; channelCode?: string; siteId?: string; addedStoreId?: string };
  season: { code: string };
  monthNumber?: number;
  parameter: ParameterKey;
  value?: number;
}

export type Operation = ParameterOperation
  | { op: 'add_channel'; channel: string; settings: ChannelPlanningDefaults }
  | { op: 'set_channel_setting'; channel: string; field: keyof ChannelPlanningDefaults; value: number | null }
  | { op: 'set_setting'; section: 'planning_settings' | 'kpi_settings'; path: string | string[]; value: number | null }
  | { op: 'set_season'; season: Season }
  | { op: 'remove_season'; season: { code: string } };

export interface SaveRequest {
  baseConfigId: string | null;
  baseVersion: number;
  requestId: string;
  reason: string;
  operations: Operation[];
}

export interface Change {
  entity_type: string;
  entity_key: Record<string, string | number | null>;
  action: string;
  old_value: unknown;
  new_value: unknown;
  changed_by?: string;
  changed_at?: string;
  reason?: string;
}

export interface Preview {
  changes: Change[];
  affected_cells: number;
  affected_sites: number;
  missing_cells: number;
}

export interface SaveResult {
  configuration: Configuration;
  changes: Change[];
  unchanged?: boolean;
}

export interface EffectiveValue { value: number; source: ParameterRule & { setting_path?: string[] } }
export interface SiteMonth {
  month_number: number;
  applicable: boolean;
  season?: Season | null;
  nsm_ratio?: EffectiveValue | null;
  sell_through_ratio?: EffectiveValue | null;
  discount_ratio?: EffectiveValue | null;
  aop_achievement_ratio?: EffectiveValue | null;
}
export interface Site {
  site_reference: string;
  site_id?: string;
  added_store_id?: string;
  code: string;
  name: string;
  scope_type: 'site' | 'planned_site';
  channel_code: string | null;
  launch_date: string | null;
  closure_date: string | null;
  mapping_error: string | null;
}
export interface SiteParameters extends Site { months: SiteMonth[] }
export interface Page<T> { items: T[]; total: number }
export interface GridResponse extends Page<SiteParameters> {
  months: number[];
  config_id: string | null;
  channels: { channel_code: string | null; total: number }[];
}
export interface Metric { key: string; group: string; name: string; formula: string; unit: string; inputs: string[] }

export interface GridFilters {
  season_code?: string;
  channel?: string;
  search: string;
  cycle_id?: string;
  overrides_only: boolean;
  all_sites?: boolean;
  summary_only?: boolean;
  include_resolved?: boolean;
  limit: number;
  offset: number;
}

export interface DraftChange { operation: Operation; input?: string; error?: string }
