import type { AdminChannel, ChannelPlanningDefaults, Configuration, ParameterRule, Season, Site } from '@/modules/admin/types/aopAdmin';

export const adminChannels: AdminChannel[] = [
  ...['Distribution', 'EBO', 'Omni', 'Others', 'Superdry.in'].map((code) => ({ code, excluded: false })),
  ...['MBO', 'SIS'].map((code) => ({ code, excluded: true })),
];

export const season: Season = { season_code: 'AW', season_name: 'Autumn/Winter', months: [8, 9, 10, 11, 12, 1] };
export const site: Site = { site_reference: 'master:S1', site_id: 'S1', code: 'S1', name: 'Store One', scope_type: 'site', channel_code: 'EBO', launch_date: null, closure_date: null, mapping_error: null };
export function rule(changes: Partial<ParameterRule> = {}): ParameterRule {
  return { rule_id: 'rule-1', scope_type: 'organisation', season_code: 'AW', channel_code: null, site_id: null, added_store_id: null, month_number: null, parameter_key: 'nsm_ratio', parameter_value: 0.8, ...changes };
}
export const channelTemplate: ChannelPlanningDefaults = { discount_pct: 20, lc_mrp_multiple: 5, growth_pct: null, gsv_target: null, gm_pct_target: null };
export function configuration(): Configuration {
  return { config_id: 'config-1', org_id: 'org-1', version_no: 1, is_current: true, created_by: 'Admin', created_at: '2030-01-01T00:00:00Z', change_reason: 'Initial defaults', source_reference: {}, season_definitions: [season], parameter_rules: [rule(), rule({ parameter_key: 'sell_through_ratio', parameter_value: 0.6 })], planning_settings: {aop_achievement_ratio: 1, "initial_growth_pct":10,"max_cell_increase_ratio":0.4,"new_store_gm_fallback_pct":12, channel_planning_defaults: Object.fromEntries(adminChannels.map(({ code }) => [code, { ...channelTemplate }]))}, kpi_settings: { growth: { warning_min_pct: -10, warning_max_pct: 20 }, high_growth: { threshold_pct: 50 }, steep_decline: { threshold_pct: -10 }, quarterly_phasing: { deviation_pp: 10 } } };
}

export function planningConfiguration(): Configuration {
  return { ...configuration(), parameter_rules: [], season_definitions: [{"season_code":"SS","season_name":"Spring/Summer","months":[2,3,4,5,6,7]},{"season_code":"AW","season_name":"Autumn/Winter","months":[8,9,10,11,12,1]}] };
}
