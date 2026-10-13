// Field metadata + client-side validation for the AnR admin config screen.
// Mirrors PARAM_SPECS in app/anr/config_admin/service.py — keep the two in sync.

import type { AnrConfigValues, AnrFieldError } from '../api/anrConfigApi';

export const FASHION_GRADES = ['FASHION', 'ULTIMATE', 'FASHION_BASICS', 'CORE'] as const;
export const LIFECYCLE_GRADES = ['FASHION', 'ULTIMATE', 'FASHION_BASICS'] as const;

export const GRADE_LABELS: Record<string, string> = {
  FASHION: 'Fashion',
  ULTIMATE: 'Ultimate',
  FASHION_BASICS: 'Fashion Basics',
  CORE: 'Core',
};

export const WEEKDAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type AnrFieldKind = 'num' | 'int' | 'bool' | 'enum' | 'days';

export interface AnrFieldMeta {
  key: string;
  label: string;
  kind: AnrFieldKind;
  /** enum options as value -> display label */
  options?: Array<{ value: string; label: string }>;
  /** numeric bounds; for 'num' the floor is exclusive unless the floor is 0 */
  min?: number;
  max?: number;
  hint?: string;
}

export interface AnrTabMeta {
  id: string;
  label: string;
  description: string;
  fields: AnrFieldMeta[];
}

const MANDATORY_OPTIONAL = [
  { value: 'mandatory', label: 'Mandatory' },
  { value: 'optional', label: 'Optional' },
];

export const ANR_CONFIG_TABS: AnrTabMeta[] = [
  {
    id: 'replenishment',
    label: 'Replenishment',
    description:
      'Planogram-based replenishment targets. Available store stock = on-hand + in-transit; DC allocation prioritised by weeks of cover.',
    fields: [
      { key: 'plano_options_target', label: 'Planogram Options Target', kind: 'num', min: 0, max: 3, hint: '1.0 = 100% of planogram' },
      { key: 'plano_qty_target', label: 'Planogram Quantity Target', kind: 'num', min: 0, max: 3, hint: '1.0 = 100% of planogram' },
      {
        key: 'frequency', label: 'Replenishment Frequency', kind: 'enum',
        options: [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }],
      },
      { key: 'include_in_transit', label: 'Include In-Transit Stock', kind: 'bool' },
      {
        key: 'dc_allocation_priority', label: 'DC Allocation Priority', kind: 'enum',
        options: [{ value: 'woc', label: 'Weeks of Cover (WOC)' }],
      },
    ],
  },
  {
    id: 'pullback_global',
    label: 'Pullback – Global',
    description:
      'Run days and cross-type priority order. Options younger than the minimum age are never eligible; active Core stays excluded.',
    fields: [
      { key: 'run_days', label: 'Pullback Run Days', kind: 'days' },
      { key: 'priority_consolidation', label: 'Consolidation Priority', kind: 'int', min: 1, max: 4 },
      { key: 'priority_lifecycle', label: 'Lifecycle Priority', kind: 'int', min: 1, max: 4 },
      { key: 'priority_broken', label: 'Broken Priority', kind: 'int', min: 1, max: 4 },
      { key: 'priority_overfill', label: 'Overfill Priority', kind: 'int', min: 1, max: 4 },
      { key: 'full_option_pullback', label: 'Full-Option Pullback', kind: 'bool' },
      { key: 'min_pullback_age_days', label: 'Minimum Pullback Age (days)', kind: 'int', min: 0, max: 365 },
    ],
  },
  {
    id: 'consolidation',
    label: 'Consolidation',
    description:
      'Triggers when DC stock falls below DC demand; pulls full options from the lowest-selling stores until demand is met.',
    fields: [
      {
        key: 'trigger', label: 'Trigger', kind: 'enum',
        options: [{ value: 'dc_stock_lt_demand', label: 'DC Stock < DC Demand' }],
      },
      {
        key: 'store_ranking', label: 'Store Ranking Metric', kind: 'enum',
        options: [{ value: 'lowest_sales_qty', label: 'Lowest Sales Qty' }],
      },
      { key: 'planogram_protection', label: 'Planogram Protection', kind: 'bool' },
      { key: 'min_pullback_age_days', label: 'Minimum Pullback Age (days)', kind: 'int', min: 0, max: 365 },
      { key: 'stop_at_dc_demand', label: 'Stop at DC Demand', kind: 'bool' },
      { key: 'full_option_pullback', label: 'Full-Option Pullback', kind: 'bool' },
    ],
  },
  {
    id: 'broken_size_set',
    label: 'Broken Size Set',
    description:
      'An option is broken when more than the threshold share of pivotal sizes is missing (strictly greater, not equal).',
    fields: [
      { key: 'pivotal_size_contribution', label: 'Pivotal Size Contribution', kind: 'num', min: 0, max: 1, hint: '0.8 = sizes covering 80% of revenue' },
      { key: 'missing_pivotal_threshold', label: 'Missing Pivotal Size Threshold', kind: 'num', min: 0, max: 1, hint: 'broken when missing share is strictly above this' },
      {
        key: 'store_ranking', label: 'Store Ranking', kind: 'enum',
        options: [{ value: 'lowest_sales_qty', label: 'Lowest Sales Qty' }],
      },
      { key: 'planogram_protection', label: 'Planogram Protection', kind: 'bool' },
      { key: 'min_pullback_age_days', label: 'Minimum Pullback Age (days)', kind: 'int', min: 0, max: 365 },
      { key: 'full_option_pullback', label: 'Full-Option Pullback', kind: 'bool' },
    ],
  },
  {
    id: 'lifecycle',
    label: 'Lifecycle',
    description:
      'Per-grade ageing thresholds. Soft pullback respects planogram protection; hard pullback overrides it. Active Core has no lifecycle pullback — once discontinued it follows the Fashion parameters.',
    fields: [
      { key: 'min_pullback_age_days', label: 'Minimum Pullback Age (days)', kind: 'int', min: 0, max: 365 },
      { key: 'soft_threshold_days', label: 'Soft Lifecycle Threshold (days)', kind: 'int', min: 1, max: 730 },
      { key: 'hard_threshold_days', label: 'Hard Lifecycle Threshold (days)', kind: 'int', min: 1, max: 730 },
      { key: 'soft_options_protection', label: 'Soft Options Protection', kind: 'num', min: 0, max: 2, hint: '1.0 = 100% plano' },
      { key: 'soft_qty_protection', label: 'Soft Quantity Protection', kind: 'num', min: 0, max: 2, hint: '0.9 = 90% plano' },
      {
        key: 'hard_protection', label: 'Hard Threshold Protection', kind: 'enum',
        options: [{ value: 'none', label: 'None' }, { value: 'planogram', label: 'Planogram' }],
      },
    ],
  },
  {
    id: 'overfill',
    label: 'Overfill',
    description:
      'Evaluated against planogram only. Lower thresholds cannot exceed the upper ones; older inventory is pulled back first.',
    fields: [
      { key: 'upper_options_threshold', label: 'Upper Planogram Options Threshold', kind: 'num', min: 0, max: 3, hint: '1.2 = 120%' },
      { key: 'upper_qty_threshold', label: 'Upper Planogram Quantity Threshold', kind: 'num', min: 0, max: 3, hint: '1.2 = 120%' },
      { key: 'lower_options_threshold', label: 'Lower Planogram Options Threshold', kind: 'num', min: 0, max: 3, hint: '1.0 = 100%' },
      { key: 'lower_qty_threshold', label: 'Lower Planogram Quantity Threshold', kind: 'num', min: 0, max: 3, hint: '0.9 = 90%' },
      { key: 'min_pullback_age_days', label: 'Minimum Pullback Age (days)', kind: 'int', min: 0, max: 365 },
      {
        key: 'ranking', label: 'Ranking Metric', kind: 'enum',
        options: [{ value: 'inventory_age', label: 'Inventory Age' }],
      },
      { key: 'dc_demand_restriction', label: 'DC Demand Restriction', kind: 'bool' },
      { key: 'full_option_pullback', label: 'Full-Option Pullback', kind: 'bool' },
    ],
  },
  {
    id: 'dc_demand',
    label: 'DC Demand',
    description:
      'Demand cover per fashion grade in weeks. Core stays visibility-only while active.',
    fields: [
      {
        key: 'mode', label: 'Mode', kind: 'enum',
        options: [
          { value: 'cover', label: 'Cover (weeks)' },
          { value: 'visibility_only', label: 'Visibility Only' },
        ],
      },
      { key: 'cover_weeks', label: 'Default Cover (weeks)', kind: 'int', min: 1, max: 52 },
    ],
  },
  {
    id: 'replacement',
    label: 'Replacement',
    description:
      'Attribute matching per grade. A replacement must have a complete size set at DC; options already live at the store are not eligible.',
    fields: [
      { key: 'match_segment', label: 'Match Segment', kind: 'enum', options: MANDATORY_OPTIONAL },
      { key: 'match_family', label: 'Match Family', kind: 'enum', options: MANDATORY_OPTIONAL },
      { key: 'match_class', label: 'Match Class', kind: 'enum', options: MANDATORY_OPTIONAL },
      { key: 'match_brick', label: 'Match Brick', kind: 'enum', options: MANDATORY_OPTIONAL },
      { key: 'match_fashion_grade', label: 'Match Fashion Grade', kind: 'enum', options: MANDATORY_OPTIONAL },
      { key: 'match_mrp', label: 'Match MRP', kind: 'enum', options: MANDATORY_OPTIONAL },
      {
        key: 'complete_size_set_dc', label: 'Complete Size Set at DC', kind: 'enum',
        options: [{ value: 'mandatory', label: 'Mandatory' }],
      },
      {
        key: 'existing_live_option', label: 'Existing Live Option at Store', kind: 'enum',
        options: [{ value: 'not_eligible', label: 'Not Eligible' }],
      },
    ],
  },
];

const PRIORITY_KEYS = [
  'priority_consolidation',
  'priority_lifecycle',
  'priority_broken',
  'priority_overfill',
] as const;

export function gradesForTab(tabId: string): readonly string[] {
  return tabId === 'lifecycle' ? LIFECYCLE_GRADES : FASHION_GRADES;
}

/** cover_weeks is hidden + not required when a grade runs visibility-only. */
export function isFieldHidden(tabId: string, key: string, values: Record<string, string>): boolean {
  return tabId === 'dc_demand' && key === 'cover_weeks' && values.mode === 'visibility_only';
}

function checkField(meta: AnrFieldMeta, raw: string | undefined): string | null {
  const text = (raw ?? '').trim();
  if (!text) return 'Mandatory field cannot be blank';
  if (meta.kind === 'enum' && meta.options && !meta.options.some((o) => o.value === text)) {
    return `Must be one of: ${meta.options.map((o) => o.value).join(', ')}`;
  }
  if (meta.kind === 'bool' && text !== 'true' && text !== 'false') {
    return 'Must be true or false';
  }
  if (meta.kind === 'int') {
    if (!/^-?\d+$/.test(text)) return 'Must be a whole number';
    const n = Number(text);
    if (meta.min !== undefined && n < meta.min) return `Must be between ${meta.min} and ${meta.max}`;
    if (meta.max !== undefined && n > meta.max) return `Must be between ${meta.min} and ${meta.max}`;
  }
  if (meta.kind === 'num') {
    const n = Number(text);
    if (Number.isNaN(n)) return 'Must be a number';
    const lo = meta.min ?? 0;
    const hi = meta.max ?? Number.POSITIVE_INFINITY;
    const zeroAllowed = lo === 0 && n === 0;
    if (!(n > lo && n <= hi) && !zeroAllowed) {
      return `Must be greater than ${lo} and at most ${hi}`;
    }
  }
  if (meta.kind === 'days') {
    const days = text.split(',').map((d) => d.trim()).filter(Boolean);
    if (days.length === 0) return 'At least one run day is required';
    const bad = days.filter((d) => !WEEKDAYS.includes(d as (typeof WEEKDAYS)[number]));
    if (bad.length > 0) return `Invalid day(s): ${bad.join(', ')}`;
  }
  return null;
}

function crossFieldErrors(tabId: string, values: Record<string, string>): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  if (tabId === 'lifecycle') {
    const soft = Number(values.soft_threshold_days);
    const hard = Number(values.hard_threshold_days);
    if (Number.isInteger(soft) && Number.isInteger(hard) && soft >= hard) {
      out.push(['soft_threshold_days', 'Soft threshold must be lower than hard threshold']);
    }
  }
  if (tabId === 'overfill') {
    const pairs: Array<[string, string]> = [
      ['lower_options_threshold', 'upper_options_threshold'],
      ['lower_qty_threshold', 'upper_qty_threshold'],
    ];
    for (const [loK, upK] of pairs) {
      const lo = Number(values[loK]);
      const up = Number(values[upK]);
      if (!Number.isNaN(lo) && !Number.isNaN(up) && lo > up) {
        out.push([loK, 'Lower threshold cannot exceed the upper threshold']);
      }
    }
  }
  if (tabId === 'pullback_global') {
    const prios = PRIORITY_KEYS.map((k) => (values[k] ?? '').trim());
    if (prios.every((p) => /^\d+$/.test(p)) && new Set(prios).size !== PRIORITY_KEYS.length) {
      out.push(['priorities', 'Pullback priorities must be unique (1-4)']);
    }
  }
  if (tabId === 'dc_demand' && values.mode === 'cover' && !(values.cover_weeks ?? '').trim()) {
    out.push(['cover_weeks', 'Cover weeks is required when mode is cover']);
  }
  return out;
}

/** Full client-side validation — same field naming as the server ("FG · key"). */
export function validateAnrConfig(values: AnrConfigValues): AnrFieldError[] {
  const errors: AnrFieldError[] = [];
  for (const tab of ANR_CONFIG_TABS) {
    for (const fg of gradesForTab(tab.id)) {
      const fgValues = values[tab.id]?.[fg] ?? {};
      for (const meta of tab.fields) {
        if (isFieldHidden(tab.id, meta.key, fgValues)) continue;
        const msg = checkField(meta, fgValues[meta.key]);
        if (msg) errors.push({ tab: tab.id, field: `${fg} · ${meta.key}`, error: msg });
      }
      for (const [key, msg] of crossFieldErrors(tab.id, fgValues)) {
        errors.push({ tab: tab.id, field: `${fg} · ${key}`, error: msg });
      }
    }
  }
  return errors;
}

/** Errors for one tab+grade, keyed by param key, for inline field display. */
export function fieldErrorMap(
  errors: AnrFieldError[],
  tabId: string,
  grade: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of errors) {
    if (e.tab !== tabId) continue;
    const [fg, ...rest] = e.field.split(' · ');
    if (fg !== grade) continue;
    const key = rest.join(' · ');
    if (key && !out[key]) out[key] = e.error;
  }
  return out;
}
