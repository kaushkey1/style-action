// TypeScript types for ANR configuration files

export interface ANRDataSource {
  name: string;
  backend: 'bq' | 'pg';
  level: 'article' | 'option';
  merge_columns: string[];
  interval: number;
  is_active: boolean;
}

export interface ANRCustomDataSource extends ANRDataSource {
  query_template: string;
}

export interface ANRFilterRule {
  name: string;
  field: string;
  operator: string;
  value?: string | number;
  is_active: boolean;
  description: string;
}

export interface ANRDataPoint {
  name: string;
  type: 'calculated' | 'static' | 'constant' | 'dictionary';
  formula: string;
  is_active: boolean;
  description: string;
}

export interface ANRConstants {
  batch_size?: string;
  trailing_days?: number;
  default_cover_days?: number;
  min_sales_threshold?: number;
  days_per_week?: number;
  segments_in_scope?: string[];
  sub_formats_in_scope?: string[];
  brands_in_scope?: string[];
  run_date?: string;
  default_fill_rate?: number;
  comments_for_ui?: string;

  // Replenishment Parameters
  lead_time_standard?: number;
  lead_time_express?: number;
  min_grade_express?: string;
  safety_stock_multiplier?: number;
  fill_rate_target?: number;
  stockout_alert_threshold?: number;
  vmi_vendors?: string;
  vmi_enabled?: boolean;

  // NOOS Rules
  noos_auto_approval?: boolean;
  dispatch_sla_metro_hours?: number;
  dispatch_sla_tier23_hours?: number;
  noos_transfer_eligible?: boolean;

  // Eligibility Thresholds
  min_ros_eligibility?: number;
  min_display_stock?: number;
  exclude_active_pos?: boolean;
  max_fill_rate_brick?: number;
  max_fill_rate_options?: number;
  min_replenishment_qty?: number;
  min_store_replenishment_qty?: number;

  // Pullback Shared Parameters
  trailing_window?: number;
  pullback_cooldown?: number;

  // Bottom Seller Parameters
  bs_enabled?: boolean;
  bs_min_stock_age?: number;
  bs_fill_rate_floor?: number;
  bs_target_option_gap?: number;
  bs_target_brick_gap?: number;
  bs_exclude_core?: boolean;

  // Broken Set Parameters
  br_enabled?: boolean;
  br_min_bsi?: number;
  br_fill_rate_floor?: number;
  br_exclude_core?: boolean;
  br_require_no_pos?: boolean;

  // Lifecycle Crossed Parameters
  lc_enabled?: boolean;

  // Planogram Overfill Parameters
  po_enabled?: boolean;
  po_dry_run?: boolean;
  po_overfill_threshold?: number;

  // Redistribution Parameters
  min_woc_donor?: number;
  max_woc_recipient?: number;
  min_ros_recipient?: number;
  donor_ros_below_avg?: boolean;
  post_move_tracking?: number;

  // Cover Days
  cd_core_noos?: number;
  cd_ultimates_fashion_basics?: number;
  cd_fashion?: number;
  cd_fast_fashion?: number;
  cd_seasonal?: number;

  // Ageing Alert Thresholds
  noos_pre_warning_days?: number;
  noos_breach_days?: number;
  fashion_pre_warning_days?: number;
  fashion_breach_days?: number;
  noos_stockout_projected_days?: number;
  ros_decline_wow_threshold_pct?: number;

  // Size Completeness
  min_size_completeness_pct?: number;
  broken_set_markdown_days?: number;

  // Zero Tolerance
  zero_tolerance_days?: number;

  // Lifecycle & Rotation
  lr_a0_a1_days?: number;
  lr_a1_a2_days?: number;
  lr_a2_a3_days?: number;
  lr_str_gate_a1_a2?: number;
  lr_str_gate_a2_a3?: number;
  lr_network_age_threshold?: number;
  lr_store_age_threshold?: number;
  lr_max_transfers_before_block?: number;
  lr_seasonal_exemptions?: boolean;

  // Planogram & Fill Rate
  pf_default_fill_rate?: number;
  pf_understock_threshold?: number;
  pf_overstock_threshold?: number;

  // CORE Reordering — Demand Computation
  cr_ads_window?: number;
  cr_oos_correction?: boolean;
  cr_demand_spike_threshold?: number;
  cr_demand_drop_threshold?: number;
  // CORE Reordering — Store Thresholds
  cr_store_ss_days_a_plus?: number;
  cr_store_ss_days_a1_a3?: number;
  cr_store_review_period?: number;
  cr_service_level_target?: number;
  // CORE Reordering — DC Thresholds
  cr_dc_min_cover_days?: number;
  cr_dc_max_cover_days?: number;
  cr_dc_safety_stock_days?: string;
  cr_dc_festive_buffer_days?: number;
  cr_dc_festive_buffer_lead?: number;
  // CORE Reordering — Vendor Safety Stock
  cr_fg_ss_target?: number;
  cr_fg_ss_trigger?: number;
  cr_ff_ss_target?: number;
  cr_ff_ss_trigger?: number;
  // CORE Reordering — Vendor Management
  cr_otif_threshold?: number;
  cr_ftr_threshold?: number;
  cr_max_vendor_shift?: number;
  cr_min_vendor_stability_period?: number;
  cr_costing_validity_window?: number;
  // CORE Reordering — Surge / Festive
  cr_default_surge_factor?: number;
  cr_festive_surge_factor?: number;
  cr_dsd_enabled_festive?: boolean;

  // OTB Budget
  otb_core_noos_pct?: number;
  otb_fashion_pct?: number;

  // OTB KPI Formulae
  otb_kpi_formulae?: Array<{
    kpiName: string;
    formula: string;
    category: string;
    evaluationOrder: number;
    isActive: boolean;
    description: string;
  }>;

  // OTB Planning
  otb_fiscal_year_start?: number;
  otb_current_fiscal_year?: string;
  otb_planning_frequency?: string;
  otb_calc_frequencies?: string[];
  otb_base_margin_pct?: number;
  otb_target_weeks_of_cover?: number;
  otb_aggregation_levels?: string[];
  otb_age_filter_enabled?: boolean;
  otb_inventory_age_max_days?: number;
  otb_store_formats_in_scope?: number[];
  otb_segments_in_scope?: number[];
  otb_net_sales_min_threshold?: number;
  otb_exclude_kpis?: string[];
  otb_non_negative_kpis?: string[];
  otb_hit_names?: Record<string, string>;

  // Liquidation Channels
  lc_max_clearance_weeks?: number;
  lc_clearance_str_threshold?: number;
  lc_ajio_listing_weeks?: number;
  lc_residual_disposal_target?: number;
  lc_ch1_priority?: number;
  lc_ch1_min_recovery?: number;
  lc_ch2_priority?: number;
  lc_ch2_min_recovery?: number;
  lc_ch3_priority?: number;
  lc_ch3_min_recovery?: number;
  lc_ch4_priority?: number;
  lc_ch4_min_recovery?: number;
  lc_ch5_priority?: number;
  lc_ch5_min_recovery?: number;
  lc_ch6_priority?: number;
  lc_ch6_min_recovery?: number;
}

export interface ANRPullbackCalculationTemplate {
  name: string;
  match_on: string;
  description: string;
  is_active: boolean;
}

export interface ANRReplacementTemplate {
  name: string;
  match_on: string;
  description: string;
  is_active: boolean;
}

export interface ANRReplenishmentTemplate {
  name: string;
  sort_cols: string[];
  sort_asc: boolean[];
  description: string;
}

export interface ANRConfigData {
  org_name: string;
  schedule_cron: string;
  bq_project_id: string;
  data_sources: ANRDataSource[];
  custom_data_sources?: ANRCustomDataSource[];
  merge_columns: string[];
  non_null_cols: string[];
  tables?: Record<string, string>;
  input_tables?: Record<string, string>;
  input_custom_columns?: Array<{
    data_source: string;
    column: string;
    formula: string;
  }>;
  data_points: ANRDataPoint[];
  filter_rules: ANRFilterRule[];
  constants: ANRConstants;
  pullback_calculation_template?: ANRPullbackCalculationTemplate;
  replacement_template?: ANRReplacementTemplate;
  replenishment_template?: ANRReplenishmentTemplate;
  redistribution_template?: {
    name: string;
    sort_cols: string[];
    sort_asc: boolean[];
    description: string;
  };
}

export interface ANRConfig {
  [orgId: string]: ANRConfigData;
}

export type PullbackTemplate =
  | 'bottom_seller'
  | 'broken_set'
  | 'lifecycle_crossed'
  | 'planogram_overfill';

export type WorkflowType = 'core_reordering' | 'cover_days' | 'lifecycle_rotation' | 'liquidation_channels' | 'otb_budget' | 'otb_kpi_formulae' | 'otb_planning' | 'planogram_fill_rate' | 'replenishment' | 'redistribution' | PullbackTemplate;
