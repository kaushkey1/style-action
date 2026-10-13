// Types mirroring the canonical contract (style-actions-backend/contracts/openapi.yaml, copy at
// .screenflow/runs/style-actions-product/openapi.yaml). Change only together with the contract.

export type Provenance = 'observed' | 'derived' | 'provisional' | 'unavailable';
export type GradeClass = 'Fashion' | 'Ultimate' | 'Core' | 'Unmapped';
export type Cohort = 'under_min' | 'building' | 'checkpoint' | 'review' | 'exit_window' | 'exit' | 'core' | 'unknown';
export type SnapshotStatus = 'building' | 'ready' | 'failed';

export interface ApiErrorBody {
  code: string;
  message: string;
  detail?: unknown;
}

export interface Snapshot {
  snapshot_id: string;
  as_of: string;
  dcs: string[];
  focus_stores: string[];
  status: SnapshotStatus;
  source: 'bigquery' | 'fixture';
  query_version: string;
  created_at: string;
  built_at: string | null;
  bytes_processed: number;
  row_counts: Record<string, number>;
  finding_counts: Record<string, number>;
  error: string | null;
  /** Stores in the snapshot; null while building or failed (contract 0.3.0, D-snapshot-picker). */
  store_count: number | null;
  /** 1 = Scope 1 and 1a; 2 adds health (2b); 3 adds space (2c) (D-snapshot-content). */
  content_version: number;
  content_parts: ContentParts;
  history_range: DateRange | null;
  extension: SnapshotExtension | null;
}

export interface ContentParts {
  health: boolean;
  space: boolean;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface SnapshotExtension {
  status: 'running' | 'succeeded' | 'failed';
  from_version: number;
  to_version: number;
  started_at: string;
  finished_at: string | null;
  error: string | null;
}

export interface SnapshotQuery {
  name: string;
  rows: number;
  bytes_processed: number;
  duration_ms: number;
  job_id: string | null;
}

export interface SnapshotDetail extends Snapshot {
  queries: SnapshotQuery[];
}

export interface Health {
  status: 'ok' | 'degraded';
  build_id: string;
  postgres: boolean;
  source: { kind: 'bigquery' | 'fixture'; reachable: boolean; message?: string | null };
  data_dates: { stock_latest: string | null; sales_latest: string | null };
  latest_snapshot: Snapshot | null;
  can_build_snapshot: boolean;
  default_scope: { dcs: string[]; focus_stores: string[]; as_of: string | null };
  /** What this server builds and extends to (1 in 2a, 2 in 2b, 3 in 2c). */
  content_version: number;
}

export interface Finding {
  code: string;
  severity: 'info' | 'warning' | 'error';
  store_code: string | null;
  option_code: string | null;
  article: string | null;
  detail: string;
  units: number | null;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export type GradeMix = Record<GradeClass, number>;

export interface StoreSummary {
  store_code: string;
  name: string;
  city: string | null;
  format: string | null;
  dc_code: string;
  is_focus: boolean;
  options: number;
  saleable_units: number;
  transit_units: number;
  sales_14d_units: number;
  grade_mix: GradeMix;
  /** Sum of `finding_counts` (contract 0.2.0, ruling C10). */
  finding_count: number;
  cohorts: Partial<Record<Cohort, number>>;
  /** Findings at this store by code; only codes present, each at least 1 (decision D-store-finding-counts). */
  finding_counts: Record<string, number>;
  /** False when the store had no stock on the as-of date and no sales in the window (decision D-store-has-data). */
  has_data: boolean;
  /** Units short of the curve over the store's selling-life options (D-dc-level). */
  units_short: number;
  /** On hand + in transit of the store's day 90+ options. */
  day90_units: number;
  /** Change vs the comparison snapshot; null when not compared or the store is absent there (D-headline-deltas). */
  deltas: StoreDeltas | null;
  bands: BandCounts | null;
  space: SpaceCounts | null;
}

export interface StoreList {
  snapshot_id: string;
  as_of: string;
  items: StoreSummary[];
  comparison: Comparison;
}

export type ComparisonStatus = 'compared' | 'same_as_of' | 'no_previous';

export interface Comparison {
  status: ComparisonStatus;
  snapshot_id: string | null;
  as_of: string | null;
  built_at: string | null;
}

export interface StoreDeltas {
  options: number;
  saleable_units: number;
  transit_units: number;
  sales_14d_units: number;
  finding_count: number;
  cohorts: Record<string, number>;
}

export interface DcDeltas extends StoreDeltas {
  stores: number;
  stores_with_data: number;
}

export interface BandCounts {
  supply_constrained: number;
  over: number;
  on_track: number;
  watch: number;
  under: number;
  unmeasurable: number;
  core: number;
  no_gap: number;
}

export interface SpaceCounts {
  groups: number;
  planned_groups: number;
  no_plan: number;
  below_floor: number;
  overfilled: number;
  flagged: number;
  in_band: number;
  plan_options: number;
  plan_qty: number;
  planned_live_options: number;
  planned_units: number;
  options_fill: number | null;
  units_fill: number | null;
}

export type Band = 'supply_constrained' | 'over' | 'on_track' | 'watch' | 'under';
/** The five bands plus options without a band by reason (BandCounts keys); the listOptionStores `band` filter. */
export type BandFilter = Band | 'unmeasurable' | 'core' | 'no_gap';

export interface AvailabilityDay {
  date: string;
  vetoed: boolean;
  qualifying: boolean;
  units: number;
}

export interface AvailabilitySize {
  size: string | null;
  articles: string[];
  pivotal: boolean;
  contribution_rank: number | null;
  eligible_units: number;
  prev_close_in_stock: boolean[];
  units: number[];
}

/** getOptionStoreAvailability: the drawer's 14-day size × day grid (D-size-day-availability). */
export interface OptionStoreAvailability {
  snapshot_id: string;
  as_of: string;
  store_code: string;
  option_code: string;
  observation_start: string;
  observation_end: string;
  days: AvailabilityDay[];
  sizes: AvailabilitySize[];
  health: OptionHealth;
}

export interface OptionHealth {
  band: Band | null;
  no_band_reason: 'core' | 'no_gap' | 'unmeasurable' | null;
  availability_basis: 'life' | 'observation' | null;
  pivotal_sizes: (string | null)[];
  eligible_units: number;
  qualified_units: number;
  qualifying_days: number;
  veto_valid_days: number;
  true_ros_daily: number | null;
  true_ros_30d: number | null;
  /** Why True ROS is unmeasurable; the missing_size_* reasons arrive with contract 0.3.2 (D-missing-size). */
  unmeasurable_reason: 'no_pivotal_set' | 'too_few_qualifying_days' | 'missing_size_sales' | 'missing_size_stock' | 'missing_size_both' | null;
  availability_14d: number | null;
  availability_life: number | null;
  life_coverage: number | null;
  /** Why whole-life availability is null although a pivotal set exists (0.3.3, D-life-unavailable). */
  life_unavailable_reason: 'life_missing_size' | null;
  first_seen: string | null;
  weeks_of_cover: number | null;
  cover_reason: 'unmeasurable_rate' | 'zero_rate' | null;
  duplicate_rows: number;
}

export interface SpaceFill {
  plan_brick: string | null;
  plan_options: number | null;
  plan_qty: number | null;
  plan_qty_source: 'planogram' | 'fallback_depth' | null;
  depth: number | null;
  options_fill: number | null;
  units_fill: number | null;
  floor_rule: 'options_and_units' | 'units_only';
  below_floor: boolean;
  overfilled: boolean;
  no_plan: boolean;
}

/** One segment x brick x grade group of a store (getStoreBricks, contract 0.3.1, D-brick-scope1-lens). */
export interface StoreBrickRow {
  segment: string | null;
  brick: string | null;
  /** Normalised brick; the listOptionStores `brick` filter value. */
  brick_key: string;
  grade_class: GradeClass;
  options: number;
  live_options: number;
  units: number;
  /** Units short of the curve of the group's selling-life options; groups add up to StoreSummary.units_short. */
  units_short: number;
  units_short_options: number;
  /** On hand + in transit of the group's day 90+ options; groups add up to StoreSummary.day90_units. */
  day90_units: number;
  day90_options: number;
  bands: BandCounts | null;
  space: SpaceFill | null;
}

export interface StoreBricks {
  snapshot_id: string;
  as_of: string;
  store_code: string;
  content_parts: ContentParts;
  items: StoreBrickRow[];
}

export interface DcItem {
  dc_code: string;
  name: string | null;
  stores: number;
  stores_with_data: number;
}

export interface DcList {
  snapshot_id: string;
  as_of: string;
  items: DcItem[];
}

export type DcRanking = 'units_short' | 'day90_stock' | 'data_gaps' | 'most_under' | 'worst_fill';

export interface DcTotals {
  stores: number;
  stores_with_data: number;
  stores_without_data: number;
  options: number;
  saleable_units: number;
  transit_units: number;
  sales_14d_units: number;
  grade_mix: GradeMix;
  cohorts: Partial<Record<Cohort, number>>;
  finding_count: number;
  finding_counts: Record<string, number>;
  units_short: number;
  day90_units: number;
  bands: BandCounts | null;
  space: SpaceCounts | null;
}

export interface DcSummary {
  snapshot_id: string;
  as_of: string;
  dc_code: string;
  name: string | null;
  ranking: DcRanking;
  comparison: Comparison;
  totals: DcTotals;
  deltas: DcDeltas | null;
  stores: StoreSummary[];
}

export interface DcStockRow {
  brick: string | null;
  grade_class: GradeClass;
  options: number;
  units: number;
}

export interface DcStock {
  snapshot_id: string;
  as_of: string;
  dc_code: string;
  attributes_source: 'dc_rows' | 'store_rows';
  totals: { options: number; units: number };
  items: DcStockRow[];
  unclassified: { options: number; units: number };
}

export interface OptionStoreRow {
  store_code: string;
  option_code: string;
  option_name: string | null;
  brand: string | null;
  brick: string | null;
  grade_code: string | null;
  grade_class: GradeClass;
  first_grn: string | null;
  days_in_store: number | null;
  lifecycle_age: number | null;
  cohort: Cohort;
  inward: number | null;
  sold: number | null;
  sell_through: number | null;
  expected: number | null;
  gap: number | null;
  gap_reason: string | null;
  on_hand: number;
  transit: number;
  sales_14d: number;
  curve_provisional: boolean;
  flags: string[];
  /** Null until the snapshot holds health (2b). */
  health: OptionHealth | null;
}

export interface SizeRow {
  size: string | null;
  article: string;
  on_hand: number;
  transit: number;
  sold: number;
}

export interface CurvePoint {
  day: number;
  date: string;
  expected_pct: number | null;
  actual_pct: number | null;
}

export interface OptionStoreDetail {
  snapshot_id: string;
  as_of: string;
  row: OptionStoreRow;
  store_name: string;
  hierarchy: { segment: string | null; family: string | null; class: string | null; brick: string | null; season: string | null };
  mrp: number | null;
  last_grn: string | null;
  sto_issued: number | null;
  inward_mismatch: boolean;
  sizes: SizeRow[];
  curve: CurvePoint[];
  weekly_sales: { week_start: string; units: number }[];
  findings: Finding[];
  provenance: Record<string, Provenance>;
  /** The option's brick x grade group with its space fill; null without space content (2c). */
  shelf: StoreBrickRow | null;
}

export interface CohortCount {
  cohort: Cohort;
  grade_class: GradeClass;
  options: number;
  units: number;
}

export interface Lifecycle {
  snapshot_id: string;
  as_of: string;
  store_code: string;
  total_options: number;
  cohorts: CohortCount[];
  curve_provisional: boolean;
}

export type OptionSort =
  | 'true_ros_desc'
  | 'true_ros_asc'
  | 'cover_desc'
  | 'cover_asc'
  | 'shortfall_desc'
  | 'gap_desc'
  | 'gap_asc'
  | 'age_desc'
  | 'age_asc'
  | 'sold_desc'
  | 'on_hand_desc'
  | 'option_asc';

export interface OptionQuery {
  snapshotId: string;
  storeCode: string;
  gradeClass?: GradeClass;
  /** Sent as a comma-separated list (decision D-cohort-list). */
  cohorts?: readonly Cohort[];
  q?: string;
  /** Segment and normalised brick of a matrix cell (matched after normalisation, S2-C11). */
  segment?: string;
  brick?: string;
  /** Sent as a comma-separated list; needs health (409 content_not_computed otherwise). */
  bands?: readonly BandFilter[];
  sort?: OptionSort;
  page?: number;
  pageSize?: number;
}
