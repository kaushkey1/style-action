import type {
  AdminConfigSections,
  AdminDeductionRules,
  AdminFieldError,
  AdminMappings,
  AdminPlanningParameters,
  AdminPodMasterRow,
  AdminSeasonWindows,
} from '../../api/adminConfigApi';
import {
  ADMIN_CATEGORIES,
  ADMIN_FLOOR_CONFIGS,
  ADMIN_FLOORS,
  ADMIN_FORMATS,
  ADMIN_STORE_TYPES,
} from './adminConfigShared';

// Client-side mirror of the server's §5 validation (admin_service.py) so
// fields flag problems live, before save. Tab/field keys match the server's
// 422 payload exactly — the same display plumbing renders both.

const EPS = 1e-9;
const BOR_RATE_MAX = 0.5;
const DED_SUM_MAX = 0.15;
const BAND_MAX = 3;
const FIXTURE_MAX = 500;
const WATERFILL_ITER_MIN = 10;
const WATERFILL_ITER_MAX = 1000;
const SPSF_WINDOW_MONTHS = 3;

const MODE_SOURCES: Record<string, string[]> = {
  footwear: ['file', 'formula'],
  nonapps_acc: ['file', 'formula'],
  iw_lingerie: ['file', 'formula'],
  bor: ['formula'],
};
const FOOTWEAR_SCOPES = ['P0_ONLY', 'ALL_ROWS'];
const DED_SUM_KEYS = ['ded_non_apps', 'ded_accessories', 'ded_innerwear', 'ded_lingerie'];
const FORMULA_LINE_RATES: Record<string, string[]> = {
  footwear: ['footwear_rate'],
  nonapps_acc: ['ded_non_apps', 'ded_accessories'],
  iw_lingerie: ['ded_innerwear', 'ded_lingerie'],
  bor: [],
};

type AddError = (tab: string, field: string, error: string) => void;

function validatePlanning(pp: AdminPlanningParameters, add: AddError): void {
  const wSum = pp.wspsf_same_season + pp.wspsf_recency + pp.wspsf_three_yr;
  if (Math.abs(wSum - 1) > EPS) {
    add('planning_parameters', 'wspsf_recency', 'weights must sum to 1.0');
  }
  if (Math.abs(pp.blend_past + pp.blend_aop - 1) > EPS) {
    add('planning_parameters', 'blend_past', 'blend_past + blend_aop must equal 1.0');
  }
  const zeroToOne: (keyof AdminPlanningParameters)[] = [
    'wspsf_same_season',
    'wspsf_recency',
    'wspsf_three_yr',
    'blend_past',
    'blend_aop',
    'sell_through_default',
  ];
  for (const k of zeroToOne) {
    if (!(pp[k] >= 0 && pp[k] <= 1)) add('planning_parameters', k, 'must be between 0 and 1');
  }
  if (!(pp.bor_rate >= 0 && pp.bor_rate <= BOR_RATE_MAX)) {
    add('planning_parameters', 'bor_rate', `must be between 0 and ${BOR_RATE_MAX}`);
  }
  if (pp.bor_min_carpet_sqft < 0) {
    add('planning_parameters', 'bor_min_carpet_sqft', 'must be ≥ 0');
  }
  if (!(pp.lft_sqft_factor > 0)) add('planning_parameters', 'lft_sqft_factor', 'must be > 0');
  if (!(pp.waterfill_tolerance > 0)) {
    add('planning_parameters', 'waterfill_tolerance', 'must be > 0');
  }
  if (
    !(pp.waterfill_max_iter >= WATERFILL_ITER_MIN && pp.waterfill_max_iter <= WATERFILL_ITER_MAX)
  ) {
    add(
      'planning_parameters',
      'waterfill_max_iter',
      `must be between ${WATERFILL_ITER_MIN} and ${WATERFILL_ITER_MAX}`,
    );
  }
}

function validateDeductions(ded: AdminDeductionRules, add: AddError): void {
  for (const [line, mode] of Object.entries(ded.modes)) {
    const allowed = MODE_SOURCES[line];
    if (!allowed) {
      add('deduction_rules', line, 'unknown deduction line');
      continue;
    }
    if (!allowed.includes(mode.source)) {
      add('deduction_rules', line, `source must be one of ${allowed.join(', ')}`);
    }
    if (line === 'footwear' && !FOOTWEAR_SCOPES.includes(mode.scope ?? '')) {
      add('deduction_rules', 'footwear.scope', `scope must be one of ${FOOTWEAR_SCOPES.join(', ')}`);
    }
  }
  for (const [k, v] of Object.entries(ded.formula_rates)) {
    if (v === null || v === undefined || v < 0) add('deduction_rules', k, 'must be ≥ 0');
  }
  const dedSum = DED_SUM_KEYS.reduce((acc, k) => acc + (ded.formula_rates[k] ?? 0), 0);
  if (dedSum > DED_SUM_MAX + EPS) {
    add(
      'deduction_rules',
      'ded_non_apps',
      `the four deduction rates together must be ≤ ${DED_SUM_MAX}`,
    );
  }
  for (const [line, rateKeys] of Object.entries(FORMULA_LINE_RATES)) {
    if (ded.modes[line]?.source === 'formula') {
      for (const k of rateKeys) {
        if (!((ded.formula_rates[k] ?? 0) > 0)) {
          add('deduction_rules', k, `must be > 0 while ${line} is in formula mode`);
        }
      }
    }
  }
}

function validateBands(bands: AdminConfigSections['efficiency_bands'], add: AddError): void {
  for (const cat of ADMIN_CATEGORIES) {
    const band = bands[cat];
    if (!band) {
      add('efficiency_bands', cat, 'category band missing');
      continue;
    }
    if (!(band.min > 0 && band.min <= band.max && band.max <= BAND_MAX)) {
      add('efficiency_bands', cat, `band must satisfy 0 < min ≤ max ≤ ${BAND_MAX}`);
    }
  }
}

function validateFixture(rows: AdminConfigSections['fixture_capacity'], add: AddError): void {
  for (const row of rows) {
    const label = `${row.fixture_type}|${row.category}`;
    if (!(ADMIN_CATEGORIES as readonly string[]).includes(row.category)) {
      add('fixture_capacity', label, 'unknown category');
    }
    if (!(row.min >= 0 && row.min <= row.max && row.max <= FIXTURE_MAX)) {
      add('fixture_capacity', label, `must satisfy 0 ≤ min ≤ max ≤ ${FIXTURE_MAX}`);
    }
  }
}

function validateFloor(rows: AdminConfigSections['floor_placement'], add: AddError): void {
  const seen = new Set<string>();
  for (const row of rows) {
    const key = `${row.store_type}|${row.floor_config}|${row.category}`;
    seen.add(key);
    if (!(ADMIN_FLOORS as readonly string[]).includes(row.floor)) {
      add('floor_placement', key, 'invalid floor');
    }
  }
  for (const st of ADMIN_STORE_TYPES) {
    for (const fc of ADMIN_FLOOR_CONFIGS) {
      for (const cat of ADMIN_CATEGORIES) {
        if (!seen.has(`${st}|${fc}|${cat}`)) {
          add('floor_placement', `${st}|${fc}|${cat}`, 'missing cell');
        }
      }
    }
  }
}

function validatePodMaster(rows: AdminPodMasterRow[], add: AddError): void {
  for (const row of rows) {
    if (!(row.min_sqft >= 0 && row.min_sqft <= row.max_sqft)) {
      add('pod_master', row.pod_id, 'must satisfy 0 ≤ min_sqft ≤ max_sqft');
    }
  }
}

function validateFormats(fmtCat: AdminConfigSections['format_category'], add: AddError): void {
  for (const [fmt, cats] of Object.entries(fmtCat)) {
    if (!(ADMIN_FORMATS as readonly string[]).includes(fmt)) {
      add('format_category', fmt, 'unknown format');
    }
    if (cats.length === 0) add('format_category', fmt, 'at least one category required');
    for (const cat of cats) {
      if (!(ADMIN_CATEGORIES as readonly string[]).includes(cat)) {
        add('format_category', fmt, `unknown category ${cat}`);
      }
    }
  }
  for (const fmt of ADMIN_FORMATS) {
    if (!(fmt in fmtCat)) add('format_category', fmt, 'format missing');
  }
}

function lastDayOfMonth(year: number, monthOneBased: number): number {
  return new Date(year, monthOneBased, 0).getDate();
}

function validateSeasons(sw: AdminSeasonWindows, add: AddError): void {
  for (const section of ['spsf', 'sheet1', 'season'] as const) {
    for (const w of sw[section] ?? []) {
      if (!w.sales_start || !w.sales_end) continue;
      const d1 = new Date(`${w.sales_start}T00:00:00`);
      const d2 = new Date(`${w.sales_end}T00:00:00`);
      if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) {
        add('season_windows', w.window, 'invalid date');
        continue;
      }
      if (d1 > d2) {
        add('season_windows', w.window, 'sales_start must be ≤ sales_end');
      } else if (section === 'spsf') {
        const months =
          d2.getFullYear() * 12 + d2.getMonth() - (d1.getFullYear() * 12 + d1.getMonth()) + 1;
        const isWhole =
          d1.getDate() === 1 && d2.getDate() === lastDayOfMonth(d2.getFullYear(), d2.getMonth() + 1);
        if (months !== SPSF_WINDOW_MONTHS || !isWhole) {
          add(
            'season_windows',
            w.window,
            `SPSF windows must be exactly ${SPSF_WINDOW_MONTHS} whole months`,
          );
        }
      }
    }
  }
  if (sw.probe_order.length === 0) {
    add('season_windows', 'probe_order', 'probe order must not be empty');
  }
  if (new Set(sw.probe_order).size !== sw.probe_order.length) {
    add('season_windows', 'probe_order', 'probe order must not contain duplicates');
  }
}

function validateMappings(
  mp: AdminMappings,
  podMaster: AdminPodMasterRow[],
  add: AddError,
): void {
  const podIds = new Set(podMaster.map((p) => p.pod_id));
  for (const row of mp.brick_pod) {
    if (!(ADMIN_CATEGORIES as readonly string[]).includes(row.category)) {
      add('mappings', `brick_pod:${row.brick}`, 'unknown category');
    }
    const pod = row.pod_label;
    // 26*/28* labels are engine pass-throughs the server accepts too
    if (!podIds.has(pod) && !pod.startsWith('26') && !pod.startsWith('28')) {
      add('mappings', `brick_pod:${row.brick}`, `pod '${pod}' not in pod master`);
    }
  }
  const seen = new Set<string>();
  for (const row of mp.pod_xwalk) {
    if (!(ADMIN_CATEGORIES as readonly string[]).includes(row.category)) {
      add('mappings', `pod_xwalk:${row.subcategory}`, 'unknown category');
    }
    if (row.seq < 1) add('mappings', `pod_xwalk:${row.subcategory}`, 'seq must be ≥ 1');
    const key = `${row.subcategory}|${row.seq}`;
    if (seen.has(key)) {
      add('mappings', `pod_xwalk:${row.subcategory}`, 'duplicate seq for subcategory');
    }
    seen.add(key);
  }
  for (const row of mp.brand_scope) {
    if (row.brand !== row.brand.toUpperCase()) {
      add('mappings', `brand_scope:${row.brand}`, 'brands must be UPPER-case');
    }
  }
}

export const DEDUCTION_SEQUENCE_LINES = [
  'non_apps',
  'accessories',
  'innerwear',
  'lingerie',
  'footwear',
  'bor',
];
export const ROUNDING_RULES = ['standard', 'floor', 'ceiling', 'largest_remainder'];

function validateSequenceLft(draft: AdminConfigSections, add: AddError): void {
  const seq = draft.deduction_rules.sequence?.length
    ? draft.deduction_rules.sequence
    : DEDUCTION_SEQUENCE_LINES;
  if ([...seq].sort().join(',') !== [...DEDUCTION_SEQUENCE_LINES].sort().join(',')) {
    add(
      'deduction_rules',
      'sequence',
      `sequence must contain each of ${DEDUCTION_SEQUENCE_LINES.join(', ')} exactly once`,
    );
  }
  if (!ROUNDING_RULES.includes(draft.rounding_rule || 'standard')) {
    add('planning_parameters', 'rounding_rule', `must be one of ${ROUNDING_RULES.join(', ')}`);
  }
  for (const [cat, o] of Object.entries(draft.lft_options ?? {})) {
    if (!(ADMIN_CATEGORIES as readonly string[]).includes(cat)) {
      add('planning_parameters', `lft_options.${cat}`, 'unknown category');
      continue;
    }
    if (!(o.lft_factor > 0)) {
      add('planning_parameters', `lft_options.${cat}`, 'lft_factor must be > 0');
    }
    if (!(o.options_per_lft > 0)) {
      add('planning_parameters', `lft_options.${cat}`, 'options_per_lft must be > 0');
    }
    if (!(o.min_options >= 0 && o.min_options <= o.max_options)) {
      add('planning_parameters', `lft_options.${cat}`, 'must satisfy 0 ≤ min_options ≤ max_options');
    }
  }
}

/** Full-draft validation, mirroring the server's §5 list. */
export function validateAdminDraft(draft: AdminConfigSections): AdminFieldError[] {
  const errors: AdminFieldError[] = [];
  const add: AddError = (tab, field, error) => {
    errors.push({ tab, field, error });
  };
  validatePlanning(draft.planning_parameters, add);
  validateDeductions(draft.deduction_rules, add);
  validateBands(draft.efficiency_bands, add);
  validateFixture(draft.fixture_capacity, add);
  validateFloor(draft.floor_placement, add);
  validatePodMaster(draft.pod_master, add);
  validateFormats(draft.format_category, add);
  validateSeasons(draft.season_windows, add);
  validateMappings(draft.mappings, draft.pod_master, add);
  validateSequenceLft(draft, add);
  validateCategoryMin(draft.category_min_space, add);
  return errors;
}

/** All five categories or none; every minimum must be a positive sqft value. */
function validateCategoryMin(
  catMin: AdminConfigSections['category_min_space'],
  add: AddError,
): void {
  const entries = Object.entries(catMin ?? {});
  if (entries.length === 0) return;
  const missing = (ADMIN_CATEGORIES as readonly string[]).filter((c) => !(c in catMin));
  if (missing.length > 0) {
    add('category_min_space', 'categories', `missing categories: ${missing.join(', ')}`);
  }
  for (const [cat, value] of entries) {
    if (!Number.isFinite(value) || value <= 0) {
      add('category_min_space', cat, 'minimum space must be a positive number (sqft)');
    }
  }
}
