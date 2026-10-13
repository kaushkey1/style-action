// ─── Allocation & Redistribution (A&R) mock data ─────────────────

// ─── Pipeline Run Types ─────────────────────────────────────────

export type ARSubType = 'pullback' | 'replenishment' | 'redistribution';
export type PullbackSubType = 'BottomSeller' | 'BrokenSet' | 'LifecycleCrossed' | 'PlanogramOverfill';
export type RunStatus = 'completed' | 'running' | 'failed' | 'scheduled' | 'dry_run';
export type ActionStatus = 'pending' | 'approved' | 'in_transit' | 'completed' | 'rejected' | 'escalated';
export type LifecyclePhase = 'A0' | 'A1' | 'A2' | 'A3' | 'liquidation';
export type ItemType = 'NOOS' | 'fashion' | 'fast_fashion';

// ─── CORE Reordering Integration Types ────────────────────────
export type CoreTriggerType =
  | 'STORE_MIN_BREACH'
  | 'DC_MIN_BREACH'
  | 'DC_PROJECTED_STOCKOUT'
  | 'FG_SS_LOW'
  | 'DEMAND_SPIKE'
  | 'VENDOR_SWITCH'
  | 'FESTIVE_PREBUILD'
  | 'MANUAL';

export type FeasibilityStatus = 'FEASIBLE' | 'PARTIALLY_FEASIBLE' | 'INFEASIBLE';
export type UpstreamPipelineStatus = 'healthy' | 'constrained' | 'critical';

export interface SizeBreakdown {
  size: string;
  ip: number;
  ads: number;
  doc: number;
  min: number;
  max: number;
  status: 'ok' | 'low' | 'oos';
}

export interface ARVendorHealth {
  id: string;
  vendor_name: string;
  vendor_tier: 'Primary' | 'Secondary' | 'Tertiary';
  allocation_pct: number;
  otif_pct: number;
  otif_threshold: number;
  ftr_pct: number;
  ftr_threshold: number;
  fg_ss_held: number;
  fg_ss_required: number;
  fg_ss_adequacy_pct: number;
  ff_ss_held_meters: number;
  ff_ss_required_meters: number;
  ff_ss_adequacy_pct: number;
  greige_ss_held_meters: number;
  production_capacity_monthly: number;
  production_committed: number;
  production_available: number;
  avg_lead_time_days: number;
  status: 'healthy' | 'warning' | 'critical';
  last_order_date: string;
  costing_valid: boolean;
  cost_baseline_inr: number;
}

export interface ARVendorSwitchEvent {
  id: string;
  style_name: string;
  category: string;
  from_vendor: string;
  from_tier: string;
  to_vendor: string;
  to_tier: string;
  allocation_before: string;
  allocation_after: string;
  switch_reason: 'OTIF_BELOW_THRESHOLD' | 'FTR_BELOW_THRESHOLD' | 'CAPACITY_UNAVAILABLE' | 'DEMAND_SPIKE';
  triggering_metric: string;
  timestamp: string;
  approved_by: 'System (auto)' | string;
  reversal_eligible_date: string;
}

export interface ARPipelineRun {
  id: string;
  sub_type: ARSubType;
  pullback_sub_type?: PullbackSubType;
  status: RunStatus;
  started_at: string;
  completed_at?: string;
  duration_sec?: number;
  dry_run: boolean;
  stores_processed: number;
  skus_evaluated: number;
  actions_generated: number;
  actions_approved: number;
  total_units: number;
  total_value_lakh: number;
  triggered_by: 'cron' | 'manual' | 'exception';
}

export interface ARPullback {
  id: string;
  run_id: string;
  sub_type: PullbackSubType;
  item_type: ItemType;
  store_id: string;
  store_name: string;
  store_grade: string;
  sku: string;
  style_name: string;
  category: string;
  brick: string;
  units: number;
  ros: number;
  avg_ros: number;
  str: number;
  avg_str: number;
  store_age_days: number;
  network_age_days: number;
  woc: number;
  bsi?: number;
  size_completeness_pct: number;
  size_breakdown?: SizeBreakdown[];                 // Gap 3: Per-size detail for BrokenSet
  status: ActionStatus;
  replacement_sku?: string;
  replacement_style?: string;
  replacement_match_level?: 'exact' | 'brick' | 'category';
  reason: string;
}

export interface ARReplenishment {
  id: string;
  run_id: string;
  item_type: ItemType;
  store_id: string;
  store_name: string;
  store_grade: string;
  sku: string;
  style_name: string;
  category: string;
  ros: number;
  lead_time_days: number;
  closing_stock: number;
  replenishment_qty: number;
  dc_available_qty: number;
  fva_allocated_qty: number;
  fill_rate_pct: number;
  size_completeness_pct: number;
  projected_stockout_days: number;
  status: ActionStatus;
  delivery_mode: 'standard' | 'express' | 'cross_dock';
  auto_approved: boolean;
  dispatch_sla_hours: number;
  order_id?: string;
  // ─── CORE Integration Fields ──────────────────────────────
  trigger_type: CoreTriggerType;                    // Gap 1: Why was this triggered
  dc_doc_days: number;                              // Gap 2: DC days-of-cover
  vendor_fg_adequacy_pct: number;                   // Gap 2: Vendor FG SS adequacy
  next_inbound_eta?: string;                        // Gap 2: Next expected DC inbound
  upstream_status: UpstreamPipelineStatus;           // Gap 2: Upstream pipeline health
  size_breakdown?: SizeBreakdown[];                 // Gap 3: Per-size IP/ADS/DOC
  feasibility_status: FeasibilityStatus;            // Gap 5: Can this be fulfilled?
  constraint_annotations?: string[];                // Gap 5: Binding constraints
  store_need_by?: string;                           // Gap 6: When store needs goods
  dc_need_by?: string;                              // Gap 6: When DC must dispatch
  vendor_ship_by?: string;                          // Gap 6: When vendor must ship
  surge_factor: number;                             // Gap 7: Festive multiplier (1.0 = none)
  festive_window?: string;                          // Gap 7: Active festive period name
  raw_ros: number;                                  // Gap 8: Raw (uncorrected) ROS
  oos_corrected: boolean;                           // Gap 8: Was OOS correction applied?
}

export interface ARRedistribution {
  id: string;
  run_id: string;
  item_type: ItemType;
  donor_store_id: string;
  donor_store_name: string;
  donor_grade: string;
  donor_woc: number;
  recipient_store_id: string;
  recipient_store_name: string;
  recipient_grade: string;
  recipient_woc: number;
  sku: string;
  style_name: string;
  category: string;
  units: number;
  value_lakh: number;
  donor_ros: number;
  recipient_ros: number;
  status: ActionStatus;
  delivery_type: 'IST' | 'DC_route';
}

export interface ARDailyAction {
  id: string;
  date: string;
  item_type: ItemType;
  sku: string;
  style_name: string;
  category: string;
  store_id: string;
  store_name: string;
  action_type: ARSubType | 'lifecycle_transition' | 'markdown_trigger' | 'rotation_alert' | 'size_completion' | 'ros_decline';
  sub_type?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  is_red_list: boolean;
  red_list_reason?: string;
  units: number;
  value_lakh: number;
  status: ActionStatus;
  recommended_action: string;
  network_age_days: number;
  store_age_days: number;
  size_completeness_pct?: number;
  ros_wow_decline_pct?: number;
  projected_stockout_days?: number;
}

export interface ARLifecycleTransition {
  id: string;
  item_type: ItemType;
  sku: string;
  style_name: string;
  category: string;
  store_id: string;
  store_name: string;
  from_phase: LifecyclePhase;
  to_phase: LifecyclePhase;
  trigger: 'age_based' | 'str_gated' | 'manual' | 'clearance_sell_through';
  network_age_days: number;
  store_age_days: number;
  sell_through_pct: number;
  str_gate_threshold?: number;
  clearance_weeks?: number;
  clearance_sell_through_pct?: number;
  markdown_pct?: number;
  units: number;
  value_lakh: number;
  status: 'pending_approval' | 'approved' | 'auto_approved' | 'rejected' | 'overridden';
  recommended_action: string;
}

export interface ARRotationAlert {
  id: string;
  sku: string;
  style_name: string;
  category: string;
  store_id: string;
  store_name: string;
  network_age_days: number;
  store_age_days: number;
  transfer_count: number;
  last_transfer_date: string;
  alert_type: 'rotation_detected' | 'transfer_blocked' | 'reversal_required';
  severity: 'critical' | 'high' | 'medium';
  status: 'open' | 'acknowledged' | 'resolved' | 'escalated';
  details: string;
}

export interface ARTriageBridge {
  id: string;
  triage_id: string;
  sku: string;
  style_name: string;
  category: string;
  store_id: string;
  store_name: string;
  triage_day: 7 | 14;
  triage_signal: 'underperforming' | 'dead_stock' | 'broken_set';
  ar_action_type: ARSubType;
  triage_str: number;
  network_avg_str: number;
  units: number;
  status: 'pending' | 'ar_action_created' | 'completed' | 'dismissed';
  created_at: string;
}

// ─── Mock Pipeline Runs ─────────────────────────────────────────

export const arPipelineRuns: ARPipelineRun[] = [
  {
    id: 'RUN-2026-0305-001',
    sub_type: 'pullback',
    pullback_sub_type: 'BottomSeller',
    status: 'completed',
    started_at: '2026-03-05T06:00:00',
    completed_at: '2026-03-05T06:12:34',
    duration_sec: 754,
    dry_run: false,
    stores_processed: 209,
    skus_evaluated: 14_280,
    actions_generated: 342,
    actions_approved: 318,
    total_units: 8_450,
    total_value_lakh: 127,
    triggered_by: 'cron',
  },
  {
    id: 'RUN-2026-0305-002',
    sub_type: 'replenishment',
    status: 'completed',
    started_at: '2026-03-05T06:15:00',
    completed_at: '2026-03-05T06:28:45',
    duration_sec: 825,
    dry_run: false,
    stores_processed: 209,
    skus_evaluated: 22_150,
    actions_generated: 1_247,
    actions_approved: 1_198,
    total_units: 34_500,
    total_value_lakh: 485,
    triggered_by: 'cron',
  },
  {
    id: 'RUN-2026-0305-003',
    sub_type: 'redistribution',
    status: 'completed',
    started_at: '2026-03-05T06:30:00',
    completed_at: '2026-03-05T06:41:12',
    duration_sec: 672,
    dry_run: false,
    stores_processed: 182,
    skus_evaluated: 8_340,
    actions_generated: 156,
    actions_approved: 142,
    total_units: 4_280,
    total_value_lakh: 68,
    triggered_by: 'cron',
  },
  {
    id: 'RUN-2026-0305-004',
    sub_type: 'pullback',
    pullback_sub_type: 'BrokenSet',
    status: 'completed',
    started_at: '2026-03-05T06:45:00',
    completed_at: '2026-03-05T06:53:22',
    duration_sec: 502,
    dry_run: false,
    stores_processed: 209,
    skus_evaluated: 9_620,
    actions_generated: 187,
    actions_approved: 174,
    total_units: 3_120,
    total_value_lakh: 52,
    triggered_by: 'cron',
  },
  {
    id: 'RUN-2026-0304-001',
    sub_type: 'pullback',
    pullback_sub_type: 'LifecycleCrossed',
    status: 'completed',
    started_at: '2026-03-04T06:00:00',
    completed_at: '2026-03-04T06:09:18',
    duration_sec: 558,
    dry_run: false,
    stores_processed: 209,
    skus_evaluated: 11_450,
    actions_generated: 94,
    actions_approved: 88,
    total_units: 2_680,
    total_value_lakh: 41,
    triggered_by: 'cron',
  },
  {
    id: 'RUN-2026-0305-005',
    sub_type: 'pullback',
    pullback_sub_type: 'PlanogramOverfill',
    status: 'running',
    started_at: '2026-03-05T10:00:00',
    dry_run: true,
    stores_processed: 84,
    skus_evaluated: 3_200,
    actions_generated: 42,
    actions_approved: 0,
    total_units: 1_050,
    total_value_lakh: 18,
    triggered_by: 'manual',
  },
  {
    id: 'RUN-2026-0303-001',
    sub_type: 'replenishment',
    status: 'failed',
    started_at: '2026-03-03T06:15:00',
    completed_at: '2026-03-03T06:16:02',
    duration_sec: 62,
    dry_run: false,
    stores_processed: 0,
    skus_evaluated: 0,
    actions_generated: 0,
    actions_approved: 0,
    total_units: 0,
    total_value_lakh: 0,
    triggered_by: 'cron',
  },
];

// ─── Mock Pullback Items ────────────────────────────────────────

export const arPullbacks: ARPullback[] = [
  {
    id: 'PB-001', run_id: 'RUN-2026-0305-001', sub_type: 'BottomSeller', item_type: 'fashion',
    store_id: 'S007', store_name: 'Mumbai Viviana Mall', store_grade: 'A3',
    sku: 'MC-TEE-4521-M', style_name: 'SS26 Washed Crew Tee', category: 'Menswear Casual', brick: 'Tees',
    units: 24, ros: 0.12, avg_ros: 0.85, str: 8, avg_str: 42, store_age_days: 62, network_age_days: 68, woc: 28.5,
    size_completeness_pct: 60,
    status: 'approved', replacement_sku: 'MC-POL-7823-M', replacement_style: 'SS26 Core Polo',
    replacement_match_level: 'brick', reason: 'ROS 86% below avg, STR 81% below avg — bottom performer',
  },
  {
    id: 'PB-002', run_id: 'RUN-2026-0305-001', sub_type: 'BottomSeller', item_type: 'fashion',
    store_id: 'S008', store_name: 'Kolkata South City Mall', store_grade: 'A3',
    sku: 'WW-DRS-1892-S', style_name: 'SS26 Floral Midi Dress', category: 'Womenswear Western', brick: 'Dresses',
    units: 18, ros: 0.08, avg_ros: 0.62, str: 6, avg_str: 38, store_age_days: 55, network_age_days: 60, woc: 32.1,
    size_completeness_pct: 45,
    status: 'approved', reason: 'ROS 87% below avg — no suitable replacement in DC',
  },
  {
    id: 'PB-003', run_id: 'RUN-2026-0305-004', sub_type: 'BrokenSet', item_type: 'fashion',
    store_id: 'S003', store_name: 'Select Citywalk', store_grade: 'A1',
    sku: 'MF-SHR-3401-L', style_name: 'AW25 Oxford Formal Shirt', category: 'Menswear Formal', brick: 'Shirts',
    units: 8, ros: 0.45, avg_ros: 0.52, str: 35, avg_str: 40, store_age_days: 112, network_age_days: 118, woc: 2.5, bsi: 0.32,
    size_completeness_pct: 40,
    size_breakdown: [
      { size: 'S', ip: 3, ads: 0.15, doc: 20.0, min: 1, max: 2, status: 'ok' },
      { size: 'M', ip: 0, ads: 0.45, doc: 0, min: 3, max: 6, status: 'oos' },
      { size: 'L', ip: 5, ads: 0.30, doc: 16.7, min: 2, max: 4, status: 'ok' },
      { size: 'XL', ip: 0, ads: 0.25, doc: 0, min: 2, max: 3, status: 'oos' },
      { size: 'XXL', ip: 0, ads: 0.08, doc: 0, min: 1, max: 1, status: 'oos' },
    ],
    status: 'approved', reason: 'BSI 0.32 — missing sizes M, XL. 3 of 5 pivotal sizes absent. >7d without replenishment — markdown mandatory per SOP-07.',
  },
  {
    id: 'PB-004', run_id: 'RUN-2026-0304-001', sub_type: 'LifecycleCrossed', item_type: 'fashion',
    store_id: 'S005', store_name: 'Bangalore Forum Mall', store_grade: 'A2',
    sku: 'WI-KRT-6712-M', style_name: 'AW25 Chanderi Kurta', category: 'Womenswear Ethnic', brick: 'Kurtas',
    units: 15, ros: 0.22, avg_ros: 0.35, str: 28, avg_str: 45, store_age_days: 92, network_age_days: 95, woc: 9.7,
    size_completeness_pct: 72,
    status: 'in_transit', reason: 'Network age 95d exceeded A1 threshold (90d). Phase A2→A3 transition triggered.',
  },
  {
    id: 'PB-005', run_id: 'RUN-2026-0305-001', sub_type: 'BottomSeller', item_type: 'fashion',
    store_id: 'S011', store_name: 'Kochi Lulu Mall', store_grade: 'A2',
    sku: 'FW-SND-2204-8', style_name: 'SS26 Leather Slide', category: 'Footwear', brick: 'Sandals',
    units: 12, ros: 0.15, avg_ros: 0.72, str: 11, avg_str: 48, store_age_days: 45, network_age_days: 52, woc: 11.4,
    size_completeness_pct: 83,
    status: 'pending', reason: 'ROS 79% below avg. Awaiting replacement matching.',
  },
  {
    id: 'PB-006', run_id: 'RUN-2026-0305-001', sub_type: 'BottomSeller', item_type: 'fashion',
    store_id: 'S001', store_name: 'Mumbai Palladium', store_grade: 'A+',
    sku: 'KW-TSH-8812-10Y', style_name: 'SS26 Graphic Tee Kids', category: 'Kidswear', brick: 'Tshirts',
    units: 20, ros: 0.18, avg_ros: 0.95, str: 12, avg_str: 55, store_age_days: 38, network_age_days: 42, woc: 15.8,
    size_completeness_pct: 100,
    status: 'rejected', reason: 'ROS 81% below avg — rejected: seasonal boost expected (summer)',
  },
];

// ─── Mock Replenishment Items ───────────────────────────────────

export const arReplenishments: ARReplenishment[] = [
  {
    id: 'REP-001', run_id: 'RUN-2026-0305-002', item_type: 'NOOS',
    store_id: 'S001', store_name: 'Mumbai Palladium', store_grade: 'A+',
    sku: 'MC-POL-7823-M', style_name: 'SS26 Core Polo', category: 'Menswear Casual',
    ros: 2.4, lead_time_days: 3, closing_stock: 2, replenishment_qty: 6,
    dc_available_qty: 48, fva_allocated_qty: 6, fill_rate_pct: 100,
    size_completeness_pct: 100, projected_stockout_days: 1,
    status: 'approved', delivery_mode: 'express', auto_approved: true, dispatch_sla_hours: 48,
    order_id: 'ORD-24501',
    // CORE integration
    trigger_type: 'STORE_MIN_BREACH',
    dc_doc_days: 18.2, vendor_fg_adequacy_pct: 82, next_inbound_eta: '2026-03-08',
    upstream_status: 'healthy',
    size_breakdown: [
      { size: 'S', ip: 2, ads: 0.8, doc: 2.5, min: 5, max: 10, status: 'low' },
      { size: 'M', ip: 0, ads: 2.4, doc: 0, min: 14, max: 31, status: 'oos' },
      { size: 'L', ip: 4, ads: 1.6, doc: 2.5, min: 10, max: 21, status: 'low' },
      { size: 'XL', ip: 3, ads: 0.9, doc: 3.3, min: 5, max: 12, status: 'low' },
    ],
    feasibility_status: 'FEASIBLE',
    store_need_by: '2026-03-06', dc_need_by: '2026-03-05', vendor_ship_by: '2026-03-02',
    surge_factor: 1.0, raw_ros: 2.4, oos_corrected: false,
  },
  {
    id: 'REP-002', run_id: 'RUN-2026-0305-002', item_type: 'NOOS',
    store_id: 'S002', store_name: 'Delhi Ambience Mall', store_grade: 'A+',
    sku: 'MC-POL-7823-L', style_name: 'SS26 Core Polo', category: 'Menswear Casual',
    ros: 2.1, lead_time_days: 3, closing_stock: 1, replenishment_qty: 6,
    dc_available_qty: 42, fva_allocated_qty: 5, fill_rate_pct: 83,
    size_completeness_pct: 80, projected_stockout_days: 0,
    status: 'approved', delivery_mode: 'standard', auto_approved: true, dispatch_sla_hours: 48,
    order_id: 'ORD-24502',
    // CORE integration
    trigger_type: 'STORE_MIN_BREACH',
    dc_doc_days: 16.5, vendor_fg_adequacy_pct: 78, next_inbound_eta: '2026-03-10',
    upstream_status: 'healthy',
    size_breakdown: [
      { size: 'S', ip: 3, ads: 0.6, doc: 5.0, min: 4, max: 8, status: 'ok' },
      { size: 'M', ip: 1, ads: 1.8, doc: 0.6, min: 11, max: 23, status: 'low' },
      { size: 'L', ip: 0, ads: 2.1, doc: 0, min: 13, max: 27, status: 'oos' },
      { size: 'XL', ip: 2, ads: 0.7, doc: 2.9, min: 4, max: 9, status: 'low' },
    ],
    feasibility_status: 'FEASIBLE',
    store_need_by: '2026-03-05', dc_need_by: '2026-03-04',
    surge_factor: 1.0, raw_ros: 1.7, oos_corrected: true,
  },
  {
    id: 'REP-003', run_id: 'RUN-2026-0305-002', item_type: 'fashion',
    store_id: 'S009', store_name: 'Hyderabad Nexus Mall', store_grade: 'A1',
    sku: 'WW-TOP-4562-S', style_name: 'SS26 Linen Blouse', category: 'Womenswear Western',
    ros: 1.8, lead_time_days: 4, closing_stock: 3, replenishment_qty: 5,
    dc_available_qty: 12, fva_allocated_qty: 4, fill_rate_pct: 80,
    size_completeness_pct: 75, projected_stockout_days: 2,
    status: 'approved', delivery_mode: 'standard', auto_approved: false, dispatch_sla_hours: 48,
    // CORE integration
    trigger_type: 'STORE_MIN_BREACH',
    dc_doc_days: 8.4, vendor_fg_adequacy_pct: 55, next_inbound_eta: '2026-03-14',
    upstream_status: 'constrained',
    size_breakdown: [
      { size: 'XS', ip: 0, ads: 0.4, doc: 0, min: 3, max: 6, status: 'oos' },
      { size: 'S', ip: 3, ads: 1.8, doc: 1.7, min: 11, max: 23, status: 'low' },
      { size: 'M', ip: 5, ads: 1.2, doc: 4.2, min: 7, max: 16, status: 'low' },
      { size: 'L', ip: 2, ads: 0.5, doc: 4.0, min: 3, max: 7, status: 'ok' },
    ],
    feasibility_status: 'PARTIALLY_FEASIBLE',
    constraint_annotations: ['DC DOC 8.4d approaching DC Min 14d — upstream vendor PO in production'],
    store_need_by: '2026-03-07', dc_need_by: '2026-03-06',
    surge_factor: 1.0, raw_ros: 1.8, oos_corrected: false,
  },
  {
    id: 'REP-004', run_id: 'RUN-2026-0305-002', item_type: 'NOOS',
    store_id: 'S010', store_name: 'DLF Promenade', store_grade: 'A+',
    sku: 'FW-SNK-1190-9', style_name: 'SS26 White Sneaker', category: 'Footwear',
    ros: 1.5, lead_time_days: 5, closing_stock: 0, replenishment_qty: 8,
    dc_available_qty: 6, fva_allocated_qty: 6, fill_rate_pct: 75,
    size_completeness_pct: 60, projected_stockout_days: 0,
    status: 'in_transit', delivery_mode: 'express', auto_approved: true, dispatch_sla_hours: 48,
    order_id: 'ORD-24503',
    // CORE integration
    trigger_type: 'DC_MIN_BREACH',
    dc_doc_days: 4.2, vendor_fg_adequacy_pct: 38, next_inbound_eta: '2026-03-18',
    upstream_status: 'critical',
    size_breakdown: [
      { size: '7', ip: 0, ads: 0.3, doc: 0, min: 2, max: 4, status: 'oos' },
      { size: '8', ip: 0, ads: 0.5, doc: 0, min: 3, max: 7, status: 'oos' },
      { size: '9', ip: 0, ads: 1.5, doc: 0, min: 9, max: 20, status: 'oos' },
      { size: '10', ip: 2, ads: 0.8, doc: 2.5, min: 5, max: 10, status: 'low' },
    ],
    feasibility_status: 'PARTIALLY_FEASIBLE',
    constraint_annotations: [
      'Vendor FG SS at 38% adequacy (below 50% threshold)',
      'Fabric shortfall: 420m needed, 280m available — greige conversion 6d',
    ],
    store_need_by: '2026-03-05', dc_need_by: '2026-03-04', vendor_ship_by: '2026-02-28',
    surge_factor: 1.0, raw_ros: 1.1, oos_corrected: true,
  },
  {
    id: 'REP-005', run_id: 'RUN-2026-0305-002', item_type: 'fashion',
    store_id: 'S004', store_name: 'Mumbai Inorbit Mall', store_grade: 'A1',
    sku: 'WI-KRT-8834-M', style_name: 'SS26 Cotton Anarkali', category: 'Womenswear Ethnic',
    ros: 1.2, lead_time_days: 4, closing_stock: 0, replenishment_qty: 5,
    dc_available_qty: 0, fva_allocated_qty: 0, fill_rate_pct: 0,
    size_completeness_pct: 100, projected_stockout_days: 0,
    status: 'pending', delivery_mode: 'standard', auto_approved: false, dispatch_sla_hours: 48,
    // CORE integration
    trigger_type: 'DC_PROJECTED_STOCKOUT',
    dc_doc_days: 0, vendor_fg_adequacy_pct: 12, next_inbound_eta: '2026-03-22',
    upstream_status: 'critical',
    feasibility_status: 'INFEASIBLE',
    constraint_annotations: [
      'DC stock zero — no units available for transfer',
      'Vendor FG SS depleted (12% adequacy)',
      'New production PO required — 25d garment lead time + 3d transit',
    ],
    store_need_by: '2026-03-05', dc_need_by: '2026-03-04',
    surge_factor: 1.0, raw_ros: 0.8, oos_corrected: true,
  },
];

// ─── Mock Redistribution Items ──────────────────────────────────

export const arRedistributions: ARRedistribution[] = [
  {
    id: 'RD-001', run_id: 'RUN-2026-0305-003', item_type: 'fashion',
    donor_store_id: 'S007', donor_store_name: 'Mumbai Viviana Mall', donor_grade: 'A3', donor_woc: 28.5,
    recipient_store_id: 'S001', recipient_store_name: 'Mumbai Palladium', recipient_grade: 'A+', recipient_woc: 1.2,
    sku: 'MC-TEE-4521-L', style_name: 'SS26 Washed Crew Tee', category: 'Menswear Casual',
    units: 12, value_lakh: 1.8, donor_ros: 0.12, recipient_ros: 2.4,
    status: 'approved', delivery_type: 'IST',
  },
  {
    id: 'RD-002', run_id: 'RUN-2026-0305-003', item_type: 'fashion',
    donor_store_id: 'S008', donor_store_name: 'Kolkata South City Mall', donor_grade: 'A3', donor_woc: 22.3,
    recipient_store_id: 'S003', recipient_store_name: 'Select Citywalk', recipient_grade: 'A1', recipient_woc: 2.8,
    sku: 'WW-DRS-1892-M', style_name: 'SS26 Floral Midi Dress', category: 'Womenswear Western',
    units: 8, value_lakh: 2.4, donor_ros: 0.08, recipient_ros: 1.6,
    status: 'in_transit', delivery_type: 'IST',
  },
  {
    id: 'RD-003', run_id: 'RUN-2026-0305-003', item_type: 'fashion',
    donor_store_id: 'S012', donor_store_name: 'Chandigarh Elante Mall', donor_grade: 'A2', donor_woc: 18.6,
    recipient_store_id: 'S009', recipient_store_name: 'Hyderabad Nexus Mall', recipient_grade: 'A1', recipient_woc: 3.1,
    sku: 'KW-DRS-5543-8Y', style_name: 'SS26 Summer Frock', category: 'Kidswear',
    units: 15, value_lakh: 1.2, donor_ros: 0.15, recipient_ros: 1.1,
    status: 'completed', delivery_type: 'DC_route',
  },
  {
    id: 'RD-004', run_id: 'RUN-2026-0305-003', item_type: 'fashion',
    donor_store_id: 'S011', donor_store_name: 'Kochi Lulu Mall', donor_grade: 'A2', donor_woc: 16.2,
    recipient_store_id: 'S002', recipient_store_name: 'Delhi Ambience Mall', recipient_grade: 'A+', recipient_woc: 1.5,
    sku: 'MF-SHR-3401-M', style_name: 'AW25 Oxford Formal Shirt', category: 'Menswear Formal',
    units: 6, value_lakh: 0.9, donor_ros: 0.18, recipient_ros: 1.8,
    status: 'pending', delivery_type: 'IST',
  },
];

// ─── Mock Daily Action Queue ────────────────────────────────────

export const arDailyActions: ARDailyAction[] = [
  {
    id: 'ACT-001', date: '2026-03-05', item_type: 'fashion', sku: 'WI-KRT-8834-M', style_name: 'SS26 Cotton Anarkali',
    category: 'Womenswear Ethnic', store_id: 'S004', store_name: 'Mumbai Inorbit Mall',
    action_type: 'replenishment', priority: 'critical', is_red_list: true,
    red_list_reason: 'Zero stock on top seller — stockout since 2d',
    units: 5, value_lakh: 0.8, status: 'pending',
    recommended_action: 'Emergency replenishment via express from DC West',
    network_age_days: 28, store_age_days: 28, projected_stockout_days: 0,
  },
  {
    id: 'ACT-002', date: '2026-03-05', item_type: 'NOOS', sku: 'MC-POL-7823-M', style_name: 'SS26 Core Polo',
    category: 'Menswear Casual', store_id: 'S010', store_name: 'DLF Promenade',
    action_type: 'replenishment', priority: 'critical', is_red_list: true,
    red_list_reason: 'NOOS item at zero stock in A+ store — critical failure per SOP-07',
    units: 8, value_lakh: 1.2, status: 'in_transit',
    recommended_action: 'Express replenishment dispatched — ETA 1d. NOOS zero-stock escalated to R&M Head.',
    network_age_days: 15, store_age_days: 15, projected_stockout_days: 0,
  },
  {
    id: 'ACT-003', date: '2026-03-05', item_type: 'fashion', sku: 'MC-TEE-4521-M', style_name: 'SS26 Washed Crew Tee',
    category: 'Menswear Casual', store_id: 'S007', store_name: 'Mumbai Viviana Mall',
    action_type: 'pullback', sub_type: 'BottomSeller', priority: 'high', is_red_list: false,
    units: 24, value_lakh: 3.6, status: 'approved',
    recommended_action: 'Pullback to DC + replace with SS26 Core Polo',
    network_age_days: 68, store_age_days: 62,
  },
  {
    id: 'ACT-004', date: '2026-03-05', item_type: 'fashion', sku: 'MF-SHR-3401-L', style_name: 'AW25 Oxford Formal Shirt',
    category: 'Menswear Formal', store_id: 'S003', store_name: 'Select Citywalk',
    action_type: 'pullback', sub_type: 'BrokenSet', priority: 'high', is_red_list: false,
    units: 8, value_lakh: 1.4, status: 'approved',
    recommended_action: 'Pull broken set — BSI 0.32, missing M and XL. >7d without replenishment — mandatory markdown per SOP-07.',
    network_age_days: 118, store_age_days: 112, size_completeness_pct: 40,
  },
  {
    id: 'ACT-005', date: '2026-03-05', item_type: 'fashion', sku: 'WI-KRT-6712-M', style_name: 'AW25 Chanderi Kurta',
    category: 'Womenswear Ethnic', store_id: 'S005', store_name: 'Bangalore Forum Mall',
    action_type: 'lifecycle_transition', priority: 'medium', is_red_list: false,
    units: 15, value_lakh: 2.1, status: 'pending',
    recommended_action: 'Transition A2→A3 — network age 95d. Move to markdown store.',
    network_age_days: 95, store_age_days: 92,
  },
  {
    id: 'ACT-006', date: '2026-03-05', item_type: 'fashion', sku: 'WW-DRS-1892-S', style_name: 'SS26 Floral Midi Dress',
    category: 'Womenswear Western', store_id: 'S008', store_name: 'Kolkata South City Mall',
    action_type: 'redistribution', priority: 'medium', is_red_list: false,
    units: 8, value_lakh: 2.4, status: 'in_transit',
    recommended_action: 'IST to Select Citywalk — donor WOC 22.3d, recipient WOC 2.8d. Fashion item only (NOOS ineligible per SOP-07).',
    network_age_days: 60, store_age_days: 55,
  },
  {
    id: 'ACT-007', date: '2026-03-05', item_type: 'fashion', sku: 'NA-BAG-3301-OS', style_name: 'AW25 Tote Handbag',
    category: 'Non-Apparel', store_id: 'S006', store_name: 'Chennai Express Avenue',
    action_type: 'rotation_alert', priority: 'critical', is_red_list: true,
    red_list_reason: 'Rotation detected — network age 72d, store age 8d, 3 transfers',
    units: 6, value_lakh: 1.8, status: 'escalated',
    recommended_action: 'Block further transfers. Investigate rotation pattern.',
    network_age_days: 72, store_age_days: 8,
  },
  {
    id: 'ACT-008', date: '2026-03-05', item_type: 'fashion', sku: 'FW-SND-2204-8', style_name: 'SS26 Leather Slide',
    category: 'Footwear', store_id: 'S011', store_name: 'Kochi Lulu Mall',
    action_type: 'markdown_trigger', priority: 'medium', is_red_list: false,
    units: 12, value_lakh: 1.5, status: 'pending',
    recommended_action: 'Stage 3 clearance — Day 45 threshold crossed, STR 11%. Reprice at 35-40% below MRP per SOP-09. Activate clearance counter.',
    network_age_days: 52, store_age_days: 45,
  },
  {
    id: 'ACT-009', date: '2026-03-05', item_type: 'fashion', sku: 'WI-SAR-9921-F', style_name: 'AW25 Banarasi Saree',
    category: 'Womenswear Ethnic', store_id: 'S012', store_name: 'Chandigarh Elante Mall',
    action_type: 'pullback', sub_type: 'LifecycleCrossed', priority: 'high', is_red_list: true,
    red_list_reason: 'Network age 142d, zero sales in 30d — must exit',
    units: 4, value_lakh: 3.2, status: 'pending',
    recommended_action: 'Lifecycle pullback — route to liquidation channel. Disposal hierarchy: Outlet → Employee Sale → NGO → Recycling (no landfill per SOP-09).',
    network_age_days: 142, store_age_days: 138,
  },
  {
    id: 'ACT-010', date: '2026-03-05', item_type: 'fashion', sku: 'WW-TOP-4562-S', style_name: 'SS26 Linen Blouse',
    category: 'Womenswear Western', store_id: 'S009', store_name: 'Hyderabad Nexus Mall',
    action_type: 'size_completion', priority: 'high', is_red_list: false,
    units: 5, value_lakh: 0.6, status: 'pending',
    recommended_action: 'Size completeness 75% — below 80% threshold per SOP-07. DC stock available. Auto-dispatch triggered.',
    network_age_days: 22, store_age_days: 18, size_completeness_pct: 75,
  },
  {
    id: 'ACT-011', date: '2026-03-05', item_type: 'NOOS', sku: 'MC-POL-7823-XL', style_name: 'SS26 Core Polo',
    category: 'Menswear Casual', store_id: 'S003', store_name: 'Select Citywalk',
    action_type: 'replenishment', priority: 'high', is_red_list: false,
    units: 4, value_lakh: 0.6, status: 'pending',
    recommended_action: 'NOOS ageing 27d approaching 30d breach threshold. Replenish before breach per SOP-07.',
    network_age_days: 12, store_age_days: 27, projected_stockout_days: 3,
  },
  {
    id: 'ACT-012', date: '2026-03-05', item_type: 'fast_fashion', sku: 'WW-BLZ-9901-M', style_name: 'SS26 Crop Blazer',
    category: 'Womenswear Western', store_id: 'S001', store_name: 'Mumbai Palladium',
    action_type: 'ros_decline', priority: 'medium', is_red_list: false,
    units: 10, value_lakh: 2.5, status: 'pending',
    recommended_action: 'ROS declined 38% week-on-week (≥30% threshold per SOP-07). Early exit or markdown decision required.',
    network_age_days: 32, store_age_days: 28, ros_wow_decline_pct: 38,
  },
];

// ─── Mock Lifecycle Transitions ─────────────────────────────────

export const arLifecycleTransitions: ARLifecycleTransition[] = [
  {
    id: 'LT-001', item_type: 'fashion', sku: 'WI-KRT-6712-M', style_name: 'AW25 Chanderi Kurta',
    category: 'Womenswear Ethnic', store_id: 'S005', store_name: 'Bangalore Forum Mall',
    from_phase: 'A1', to_phase: 'A2', trigger: 'age_based',
    network_age_days: 95, store_age_days: 92, sell_through_pct: 28,
    markdown_pct: 15,
    units: 15, value_lakh: 2.1, status: 'pending_approval',
    recommended_action: 'Move to A2 markdown tier — 15% discount. Fashion ageing 38d pre-warning passed.',
  },
  {
    id: 'LT-002', item_type: 'fashion', sku: 'MC-JKT-2201-L', style_name: 'AW25 Bomber Jacket',
    category: 'Menswear Casual', store_id: 'S002', store_name: 'Delhi Ambience Mall',
    from_phase: 'A2', to_phase: 'A3', trigger: 'str_gated',
    network_age_days: 128, store_age_days: 120, sell_through_pct: 18, str_gate_threshold: 25,
    markdown_pct: 35,
    units: 8, value_lakh: 2.8, status: 'auto_approved',
    recommended_action: 'Auto-transition to A3 — STR 18% below 25% gate. Stage 3 clearance: 35-40% below MRP per SOP-09. Route to clearance counter.',
  },
  {
    id: 'LT-003', item_type: 'fashion', sku: 'WW-SKT-7701-S', style_name: 'AW25 Pleated Midi Skirt',
    category: 'Womenswear Western', store_id: 'S009', store_name: 'Hyderabad Nexus Mall',
    from_phase: 'A0', to_phase: 'A1', trigger: 'age_based',
    network_age_days: 46, store_age_days: 42, sell_through_pct: 62,
    units: 22, value_lakh: 1.5, status: 'auto_approved',
    recommended_action: 'Natural transition A0→A1 at Day 45. Continue full price.',
  },
  {
    id: 'LT-004', item_type: 'fashion', sku: 'WI-SAR-9921-F', style_name: 'AW25 Banarasi Saree',
    category: 'Womenswear Ethnic', store_id: 'S012', store_name: 'Chandigarh Elante Mall',
    from_phase: 'A3', to_phase: 'liquidation', trigger: 'age_based',
    network_age_days: 142, store_age_days: 138, sell_through_pct: 4,
    clearance_weeks: 5, clearance_sell_through_pct: 52, markdown_pct: 40,
    units: 4, value_lakh: 3.2, status: 'pending_approval',
    recommended_action: 'Liquidation — clearance sell-through 52% after 5 weeks (<70% threshold). Route to Ajio clearance per SOP-09. Disposal hierarchy: Outlet → Employee → NGO → Recycling.',
  },
  {
    id: 'LT-005', item_type: 'fashion', sku: 'MF-TRS-4401-32', style_name: 'AW25 Wool Blend Trouser',
    category: 'Menswear Formal', store_id: 'S004', store_name: 'Mumbai Inorbit Mall',
    from_phase: 'A2', to_phase: 'A3', trigger: 'clearance_sell_through',
    network_age_days: 110, store_age_days: 98, sell_through_pct: 22,
    clearance_weeks: 4, clearance_sell_through_pct: 65, markdown_pct: 38,
    units: 6, value_lakh: 1.4, status: 'pending_approval',
    recommended_action: 'In-store clearance 65% after 4 weeks (<70% threshold per SOP-09). Transfer to Ajio clearance event at 35-40% markdown.',
  },
];

// ─── Mock Rotation Alerts ───────────────────────────────────────

export const arRotationAlerts: ARRotationAlert[] = [
  {
    id: 'ROT-001', sku: 'NA-BAG-3301-OS', style_name: 'AW25 Tote Handbag',
    category: 'Non-Apparel', store_id: 'S006', store_name: 'Chennai Express Avenue',
    network_age_days: 72, store_age_days: 8, transfer_count: 3,
    last_transfer_date: '2026-02-25',
    alert_type: 'rotation_detected', severity: 'critical', status: 'open',
    details: 'Network age 72d but store age only 8d. 3 transfers in 60 days (S003→S011→S008→S006). Likely rotation to avoid markdown.',
  },
  {
    id: 'ROT-002', sku: 'MF-TRS-4401-32', style_name: 'AW25 Wool Blend Trouser',
    category: 'Menswear Formal', store_id: 'S004', store_name: 'Mumbai Inorbit Mall',
    network_age_days: 85, store_age_days: 12, transfer_count: 2,
    last_transfer_date: '2026-02-21',
    alert_type: 'transfer_blocked', severity: 'high', status: 'acknowledged',
    details: 'Transfer request blocked — network age 85d, store age 12d. Pattern: 2 transfers, each resetting store age. Rule: network_age > 60d AND store_age < 14d.',
  },
  {
    id: 'ROT-003', sku: 'KW-JKT-6601-6Y', style_name: 'AW25 Puffer Jacket Kids',
    category: 'Kidswear', store_id: 'S008', store_name: 'Kolkata South City Mall',
    network_age_days: 95, store_age_days: 5, transfer_count: 4,
    last_transfer_date: '2026-02-28',
    alert_type: 'reversal_required', severity: 'critical', status: 'escalated',
    details: 'Reversal required — 4 transfers in 90 days. Network age 95d, store age 5d. Latest transfer reversed, item returned to S003 (original A1 store).',
  },
];

// ─── Mock Triage Bridge Items ───────────────────────────────────

export const arTriageBridges: ARTriageBridge[] = [
  {
    id: 'TB-001', triage_id: 'TRG-8812', sku: 'MC-TEE-4521-M', style_name: 'SS26 Washed Crew Tee',
    category: 'Menswear Casual', store_id: 'S007', store_name: 'Mumbai Viviana Mall',
    triage_day: 14, triage_signal: 'underperforming', ar_action_type: 'pullback',
    triage_str: 8, network_avg_str: 42, units: 24, status: 'ar_action_created',
    created_at: '2026-02-28',
  },
  {
    id: 'TB-002', triage_id: 'TRG-8845', sku: 'WW-DRS-1892-S', style_name: 'SS26 Floral Midi Dress',
    category: 'Womenswear Western', store_id: 'S008', store_name: 'Kolkata South City Mall',
    triage_day: 14, triage_signal: 'dead_stock', ar_action_type: 'redistribution',
    triage_str: 6, network_avg_str: 38, units: 18, status: 'ar_action_created',
    created_at: '2026-02-28',
  },
  {
    id: 'TB-003', triage_id: 'TRG-8901', sku: 'MF-SHR-3401-L', style_name: 'AW25 Oxford Formal Shirt',
    category: 'Menswear Formal', store_id: 'S003', store_name: 'Select Citywalk',
    triage_day: 7, triage_signal: 'broken_set', ar_action_type: 'pullback',
    triage_str: 35, network_avg_str: 40, units: 8, status: 'ar_action_created',
    created_at: '2026-03-01',
  },
  {
    id: 'TB-004', triage_id: 'TRG-8934', sku: 'FW-SND-2204-7', style_name: 'SS26 Leather Slide',
    category: 'Footwear', store_id: 'S005', store_name: 'Bangalore Forum Mall',
    triage_day: 7, triage_signal: 'underperforming', ar_action_type: 'replenishment',
    triage_str: 15, network_avg_str: 48, units: 6, status: 'pending',
    created_at: '2026-03-03',
  },
];

// ─── Mock Vendor Health (Gap 4) ─────────────────────────────────

export const arVendorHealth: ARVendorHealth[] = [
  {
    id: 'VH-001', vendor_name: 'Vendor A — Tirupur Textiles', vendor_tier: 'Primary',
    allocation_pct: 60, otif_pct: 97, otif_threshold: 95, ftr_pct: 96, ftr_threshold: 95,
    fg_ss_held: 2_450, fg_ss_required: 3_200, fg_ss_adequacy_pct: 76.6,
    ff_ss_held_meters: 8_500, ff_ss_required_meters: 12_000, ff_ss_adequacy_pct: 70.8,
    greige_ss_held_meters: 15_000,
    production_capacity_monthly: 25_000, production_committed: 18_200, production_available: 6_800,
    avg_lead_time_days: 28, status: 'healthy',
    last_order_date: '2026-02-18', costing_valid: true, cost_baseline_inr: 320,
  },
  {
    id: 'VH-002', vendor_name: 'Vendor B — Ludhiana Knits', vendor_tier: 'Secondary',
    allocation_pct: 30, otif_pct: 91, otif_threshold: 95, ftr_pct: 93, ftr_threshold: 95,
    fg_ss_held: 680, fg_ss_required: 1_600, fg_ss_adequacy_pct: 42.5,
    ff_ss_held_meters: 3_200, ff_ss_required_meters: 6_000, ff_ss_adequacy_pct: 53.3,
    greige_ss_held_meters: 5_000,
    production_capacity_monthly: 12_000, production_committed: 9_800, production_available: 2_200,
    avg_lead_time_days: 32, status: 'critical',
    last_order_date: '2026-01-05', costing_valid: false, cost_baseline_inr: 335,
  },
  {
    id: 'VH-003', vendor_name: 'Vendor C — Surat Silks', vendor_tier: 'Tertiary',
    allocation_pct: 10, otif_pct: 98, otif_threshold: 95, ftr_pct: 97, ftr_threshold: 95,
    fg_ss_held: 180, fg_ss_required: 530, fg_ss_adequacy_pct: 34.0,
    ff_ss_held_meters: 1_200, ff_ss_required_meters: 2_000, ff_ss_adequacy_pct: 60.0,
    greige_ss_held_meters: 3_500,
    production_capacity_monthly: 8_000, production_committed: 3_200, production_available: 4_800,
    avg_lead_time_days: 25, status: 'warning',
    last_order_date: '2026-02-25', costing_valid: true, cost_baseline_inr: 310,
  },
];

// ─── Mock Vendor Switch Events (Gap 4) ──────────────────────────

export const arVendorSwitchEvents: ARVendorSwitchEvent[] = [
  {
    id: 'VS-001', style_name: 'SS26 White Sneaker', category: 'Footwear',
    from_vendor: 'Vendor B', from_tier: 'Secondary',
    to_vendor: 'Vendor C', to_tier: 'Tertiary',
    allocation_before: 'A:60% / B:30% / C:10%',
    allocation_after: 'A:60% / B:10% / C:30%',
    switch_reason: 'OTIF_BELOW_THRESHOLD',
    triggering_metric: 'Vendor B OTIF = 91% (threshold = 95%)',
    timestamp: '2026-03-04T14:22:00',
    approved_by: 'System (auto)',
    reversal_eligible_date: '2026-03-18',
  },
  {
    id: 'VS-002', style_name: 'SS26 Core Polo', category: 'Menswear Casual',
    from_vendor: 'Vendor A', from_tier: 'Primary',
    to_vendor: 'Vendor B', to_tier: 'Secondary',
    allocation_before: 'A:60% / B:30% / C:10%',
    allocation_after: 'A:45% / B:45% / C:10%',
    switch_reason: 'CAPACITY_UNAVAILABLE',
    triggering_metric: 'Vendor A capacity utilization = 97% (no available slots)',
    timestamp: '2026-03-02T09:15:00',
    approved_by: 'System (auto)',
    reversal_eligible_date: '2026-03-16',
  },
];

// ─── Transfer Order Types & Data ────────────────────────────────

export type TransferStatus = 'not_started' | 'in_progress' | 'completed';
export type DeliveryType = 'IST' | 'DC_route' | 'Express' | 'Standard';

export interface TransferOrder {
  id: string;
  outOptionId: string;
  source: string;
  outQuantity: number;
  inOptionId: string;
  destination: string;
  inQuantity: number;
  deliveryType: DeliveryType;
  deliveryDate: string;
  status: TransferStatus;
  format: string;
  brand: string;
  fashionGrade: string;
  segment: string;
  family: string;
}

export const arTransferOrders: TransferOrder[] = [
  { id: 'ORD-20260308-001', outOptionId: 'MC-TEE-4521', source: 'Mumbai Viviana Mall', outQuantity: 24, inOptionId: 'MC-TEE-4521', destination: 'Mumbai Palladium', inQuantity: 24, deliveryType: 'IST', deliveryDate: '2026-03-10', status: 'in_progress', format: 'Trends', brand: 'Avaasa', fashionGrade: 'Fashion', segment: 'Menswear Casual', family: 'Tees' },
  { id: 'ORD-20260308-002', outOptionId: 'WW-DRS-1892', source: 'Kolkata South City Mall', outQuantity: 18, inOptionId: 'WW-DRS-1892', destination: 'Select Citywalk', inQuantity: 18, deliveryType: 'IST', deliveryDate: '2026-03-11', status: 'not_started', format: 'Centro', brand: 'FIG', fashionGrade: 'Fashion', segment: 'Womenswear Western', family: 'Dresses' },
  { id: 'ORD-20260308-003', outOptionId: 'MF-SHR-3401', source: 'DC West', outQuantity: 30, inOptionId: 'MF-SHR-3401', destination: 'Bangalore Forum Mall', inQuantity: 30, deliveryType: 'DC_route', deliveryDate: '2026-03-12', status: 'completed', format: 'Trends', brand: 'John Players', fashionGrade: 'Core', segment: 'Menswear Formal', family: 'Shirts' },
  { id: 'ORD-20260308-004', outOptionId: 'WI-KRT-6712', source: 'Chandigarh Elante Mall', outQuantity: 15, inOptionId: 'WI-KRT-6712', destination: 'Hyderabad Nexus Mall', inQuantity: 15, deliveryType: 'IST', deliveryDate: '2026-03-09', status: 'in_progress', format: 'Trends', brand: 'Avaasa', fashionGrade: 'Fashion', segment: 'Womenswear Ethnic', family: 'Kurtas' },
  { id: 'ORD-20260308-005', outOptionId: 'FW-SNK-1190', source: 'DC North', outQuantity: 40, inOptionId: 'FW-SNK-1190', destination: 'DLF Promenade', inQuantity: 40, deliveryType: 'Express', deliveryDate: '2026-03-09', status: 'not_started', format: 'Azorte', brand: 'Performax', fashionGrade: 'Core', segment: 'Footwear', family: 'Sneakers' },
  { id: 'ORD-20260308-006', outOptionId: 'KW-DRS-5543', source: 'Mumbai Inorbit Mall', outQuantity: 12, inOptionId: 'KW-DRS-5543', destination: 'Kochi Lulu Mall', inQuantity: 12, deliveryType: 'Standard', deliveryDate: '2026-03-14', status: 'not_started', format: 'Yousta', brand: 'Fame Forever', fashionGrade: 'Fast Fashion', segment: 'Kidswear', family: 'Dresses' },
  { id: 'ORD-20260308-007', outOptionId: 'MC-POL-7823', source: 'DC West', outQuantity: 50, inOptionId: 'MC-POL-7823', destination: 'Mumbai Palladium', inQuantity: 50, deliveryType: 'Express', deliveryDate: '2026-03-09', status: 'in_progress', format: 'Trends', brand: 'Netplay', fashionGrade: 'Core', segment: 'Menswear Casual', family: 'Polos' },
  { id: 'ORD-20260308-008', outOptionId: 'WW-TOP-4562', source: 'DC South', outQuantity: 25, inOptionId: 'WW-TOP-4562', destination: 'Chennai Express Avenue', inQuantity: 25, deliveryType: 'DC_route', deliveryDate: '2026-03-13', status: 'completed', format: 'Centro', brand: 'FIG', fashionGrade: 'Fashion', segment: 'Womenswear Western', family: 'Tops' },
  { id: 'ORD-20260308-009', outOptionId: 'WI-SAR-9921', source: 'Delhi Ambience Mall', outQuantity: 8, inOptionId: 'WI-SAR-9921', destination: 'Chandigarh Elante Mall', inQuantity: 8, deliveryType: 'Standard', deliveryDate: '2026-03-15', status: 'not_started', format: 'Trends', brand: 'Avaasa', fashionGrade: 'Fashion', segment: 'Womenswear Ethnic', family: 'Sarees' },
  { id: 'ORD-20260308-010', outOptionId: 'MC-JKT-2201', source: 'Mumbai Viviana Mall', outQuantity: 10, inOptionId: 'MC-JKT-2201', destination: 'Delhi Ambience Mall', inQuantity: 10, deliveryType: 'IST', deliveryDate: '2026-03-11', status: 'completed', format: 'Azorte', brand: 'Netplay', fashionGrade: 'Fashion', segment: 'Menswear Casual', family: 'Jackets' },
  { id: 'ORD-20260308-011', outOptionId: 'WW-BLZ-9901', source: 'DC West', outQuantity: 20, inOptionId: 'WW-BLZ-9901', destination: 'Mumbai Palladium', inQuantity: 20, deliveryType: 'Express', deliveryDate: '2026-03-10', status: 'in_progress', format: 'Project Eve', brand: 'FIG', fashionGrade: 'Fast Fashion', segment: 'Womenswear Western', family: 'Blazers' },
  { id: 'ORD-20260308-012', outOptionId: 'FW-SND-2204', source: 'Kochi Lulu Mall', outQuantity: 12, inOptionId: 'FW-SND-2204', destination: 'Bangalore Forum Mall', inQuantity: 12, deliveryType: 'IST', deliveryDate: '2026-03-12', status: 'not_started', format: 'Trends', brand: 'Performax', fashionGrade: 'Fashion', segment: 'Footwear', family: 'Sandals' },
  { id: 'ORD-20260308-013', outOptionId: 'MF-TRS-4401', source: 'DC North', outQuantity: 35, inOptionId: 'MF-TRS-4401', destination: 'Select Citywalk', inQuantity: 35, deliveryType: 'DC_route', deliveryDate: '2026-03-13', status: 'completed', format: 'Trends', brand: 'John Players', fashionGrade: 'Core', segment: 'Menswear Formal', family: 'Trousers' },
  { id: 'ORD-20260308-014', outOptionId: 'KW-TSH-8812', source: 'Hyderabad Nexus Mall', outQuantity: 20, inOptionId: 'KW-TSH-8812', destination: 'Mumbai Inorbit Mall', inQuantity: 20, deliveryType: 'Standard', deliveryDate: '2026-03-14', status: 'not_started', format: 'Yousta', brand: 'Fame Forever', fashionGrade: 'Fast Fashion', segment: 'Kidswear', family: 'Tshirts' },
  { id: 'ORD-20260308-015', outOptionId: 'NA-BAG-3301', source: 'Chennai Express Avenue', outQuantity: 6, inOptionId: 'NA-BAG-3301', destination: 'DLF Promenade', inQuantity: 6, deliveryType: 'IST', deliveryDate: '2026-03-10', status: 'in_progress', format: 'Trends', brand: 'Avaasa', fashionGrade: 'Fashion', segment: 'Non-Apparel', family: 'Bags' },
  { id: 'ORD-20260308-016', outOptionId: 'WI-KRT-8834', source: 'DC West', outQuantity: 45, inOptionId: 'WI-KRT-8834', destination: 'Mumbai Inorbit Mall', inQuantity: 45, deliveryType: 'Express', deliveryDate: '2026-03-09', status: 'in_progress', format: 'Trends', brand: 'Avaasa', fashionGrade: 'Fashion', segment: 'Womenswear Ethnic', family: 'Kurtas' },
  { id: 'ORD-20260308-017', outOptionId: 'MC-TEE-4521', source: 'DC South', outQuantity: 28, inOptionId: 'MC-TEE-4521', destination: 'Kochi Lulu Mall', inQuantity: 28, deliveryType: 'DC_route', deliveryDate: '2026-03-12', status: 'completed', format: 'Centro', brand: 'Netplay', fashionGrade: 'Core', segment: 'Menswear Casual', family: 'Tees' },
  { id: 'ORD-20260308-018', outOptionId: 'WW-SKT-7701', source: 'Bangalore Forum Mall', outQuantity: 14, inOptionId: 'WW-SKT-7701', destination: 'Hyderabad Nexus Mall', inQuantity: 14, deliveryType: 'IST', deliveryDate: '2026-03-11', status: 'not_started', format: 'Project Eve', brand: 'FIG', fashionGrade: 'Fashion', segment: 'Womenswear Western', family: 'Skirts' },
  { id: 'ORD-20260308-019', outOptionId: 'MC-POL-7823', source: 'DC North', outQuantity: 60, inOptionId: 'MC-POL-7823', destination: 'Delhi Ambience Mall', inQuantity: 55, deliveryType: 'Express', deliveryDate: '2026-03-09', status: 'in_progress', format: 'Trends', brand: 'Netplay', fashionGrade: 'Core', segment: 'Menswear Casual', family: 'Polos' },
  { id: 'ORD-20260308-020', outOptionId: 'KW-JKT-6601', source: 'Kolkata South City Mall', outQuantity: 10, inOptionId: 'KW-JKT-6601', destination: 'Chandigarh Elante Mall', inQuantity: 10, deliveryType: 'Standard', deliveryDate: '2026-03-16', status: 'not_started', format: 'Yousta', brand: 'Fame Forever', fashionGrade: 'Fashion', segment: 'Kidswear', family: 'Jackets' },
];

export const arTransferSummary = {
  totalUnitsAllocated: 12450,
  totalUnitsAllocatedTrend: '+4%',
  storesCovered: 187,
  storesCoveredTrend: '+11',
  activeTransfers: 34,
  activeTransfersTrend: '+12%',
  avgDOH: 18.5,
  avgDOHTrend: '+12%',
  pendingApprovals: 8,
  brokenSizeSets: 15,
};

// ─── Summary / Computed Stats ───────────────────────────────────

export const arSummary = {
  todayRuns: arPipelineRuns.filter(r => r.started_at.startsWith('2026-03-05')).length,
  completedRuns: arPipelineRuns.filter(r => r.status === 'completed').length,
  totalRuns: arPipelineRuns.length,
  failedRuns: arPipelineRuns.filter(r => r.status === 'failed').length,

  totalPullbacks: arPullbacks.length,
  approvedPullbacks: arPullbacks.filter(p => p.status === 'approved').length,
  pendingPullbacks: arPullbacks.filter(p => p.status === 'pending').length,

  totalReplenishments: arReplenishments.length,
  fulfilledReplenishments: arReplenishments.filter(r => r.fill_rate_pct === 100).length,
  stockoutReplenishments: arReplenishments.filter(r => r.fill_rate_pct === 0).length,
  avgFillRate: Math.round(arReplenishments.reduce((s, r) => s + r.fill_rate_pct, 0) / arReplenishments.length),

  totalRedistributions: arRedistributions.length,
  completedRedistributions: arRedistributions.filter(r => r.status === 'completed').length,

  dailyActionCount: arDailyActions.length,
  redListCount: arDailyActions.filter(a => a.is_red_list).length,
  criticalActions: arDailyActions.filter(a => a.priority === 'critical').length,

  pendingTransitions: arLifecycleTransitions.filter(t => t.status === 'pending_approval').length,
  activeRotationAlerts: arRotationAlerts.filter(a => a.status === 'open' || a.status === 'escalated').length,
  triageBridgePending: arTriageBridges.filter(t => t.status === 'pending').length,
};
