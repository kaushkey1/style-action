import { formatDate } from '@/lib/utils';

import { StyleActionsApiError } from '../api/client';

import type { BandFilter, Cohort, GradeClass, OptionSort, Provenance } from '../api/types';

export const BASE_PATH = '/style-actions-product';
export const EMPTY = '—';

/** URL parameters the workspace reads; every view state can be linked. */
export type WorkspaceParam =
  | 'snap'
  | 'dc'
  | 'store'
  | 'seg'
  | 'q'
  | 'sort'
  | 'page'
  | 'option'
  | 'panel'
  | 'code'
  | 'scope'
  | 'ranking'
  | 'segment'
  | 'brick'
  | 'grade'
  | 'lens'
  | 'band'
  | 'bq'
  | 'bpage'
  | 'sq'
  | 'spage'
  | 'view' | 'position' | 'jbrick' | 'jview' | 'jq' | 'jfocus' | 'jpage' | 'jperiod' | 'jage' | 'jprice' | 'jdirection' | 'eaction' | 'eengine' | 'ebrick' | 'eq' | 'estatus' | 'eoutcome' | 'epage' | 'eview';

export function workspaceHref(params: Partial<Record<WorkspaceParam, string | null>>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return `${BASE_PATH}${query ? `?${query}` : ''}`;
}

type LegacyRoute = 'health' | 'options' | 'option' | 'lifecycle';

/** Where a retired tab route (Overview, Data health, Options, 360, Lifecycle) lands in the workspace. */
export function legacyHref(route: LegacyRoute, params: { store?: string | null; cohort?: string | null; option?: string | null }): string {
  switch (route) {
    case 'health':
      return workspaceHref({ panel: 'health' });
    case 'options':
      return workspaceHref({ store: params.store, seg: params.cohort });
    case 'option':
      return workspaceHref({ store: params.store, option: params.option });
    case 'lifecycle':
      return workspaceHref({ store: params.store });
    default: {
      const exhaustive: never = route;
      return exhaustive;
    }
  }
}

export const COHORTS: readonly Cohort[] = ['under_min', 'building', 'checkpoint', 'review', 'exit_window', 'exit', 'core', 'unknown'];

export const COHORT_LABEL: Readonly<Record<Cohort, string>> = {
  under_min: 'Under 14 days',
  building: 'Building (14–59)',
  checkpoint: 'Day 60 checkpoint (60–69)',
  review: 'Exit review (70–80)',
  exit_window: 'Exit window (81–89)',
  exit: 'Day 90+ (exit due)',
  core: 'Core (no lifecycle)',
  unknown: 'Age unknown',
};

/** Age reads left to right in deepening gray; the review and exit stages carry status colour. */
export const COHORT_TONE: Readonly<Record<Cohort, string>> = {
  under_min: 'bg-gray-200',
  building: 'bg-gray-400',
  checkpoint: 'bg-gray-600',
  review: 'bg-amber-300',
  exit_window: 'bg-amber-400',
  exit: 'bg-amber-600',
  core: 'bg-white border border-gray-300',
  unknown: 'bg-white border border-dashed border-gray-400',
};

/** Cohorts that are still in their selling life (under 14 to 89 days). */
export const SELLING_COHORTS: readonly Cohort[] = ['under_min', 'building', 'checkpoint', 'review', 'exit_window'];

/** Short stage names for dense rows and the mix bar legend. */
export const COHORT_SHORT: Readonly<Record<Cohort, string>> = {
  under_min: 'Under 14d',
  building: '14–59',
  checkpoint: '60–69',
  review: '70–80 review',
  exit_window: '81–89',
  exit: 'Day 90+',
  core: 'Core',
  unknown: 'Unknown',
};

/** Worklist segment: a bucket, or one selling-life stage picked from the mix bar. */
export type Segment = 'selling' | 'all' | Cohort;

export const BUCKETS: readonly { readonly id: Segment; readonly label: string }[] = [
  { id: 'selling', label: 'In selling life' },
  { id: 'exit', label: 'Day 90+' },
  { id: 'core', label: 'Core' },
  { id: 'unknown', label: 'Age unknown' },
  { id: 'all', label: 'All' },
];

export function parseSegment(value: string | null): Segment {
  if (value === 'selling' || value === 'all') return value;
  const cohort = COHORTS.find((item) => item === value);
  return cohort ?? 'selling';
}

/** Cohort filter sent to the backend; undefined means every cohort. */
export function segmentCohorts(segment: Segment): Cohort[] | undefined {
  if (segment === 'all') return undefined;
  if (segment === 'selling') return [...SELLING_COHORTS];
  return [segment];
}

/** Sorts every snapshot answers. */
export const OPTION_SORTS_SCOPE1: readonly OptionSort[] = ['shortfall_desc', 'gap_desc', 'gap_asc', 'age_desc', 'age_asc', 'sold_desc', 'on_hand_desc', 'option_asc'];
/** Health sorts; 409 content_not_computed on a snapshot without health, so they are offered only with it (S2-R11). */
export const OPTION_SORTS_HEALTH: readonly OptionSort[] = ['true_ros_desc', 'true_ros_asc', 'cover_asc', 'cover_desc'];
export const OPTION_SORTS: readonly OptionSort[] = [...OPTION_SORTS_SCOPE1, ...OPTION_SORTS_HEALTH];

/** "DC" in user-facing text is "Distribution Centre" (S2-C50); ids, URL parameters and code keep "dc". */
export const DC_LABEL = 'Distribution Centre';
export const DC_LABEL_PLURAL = 'Distribution Centres';

/** Band filter values in reading order: the five bands (spec v2 §9.4), then options without a band by reason. */
export const BAND_FILTERS: readonly BandFilter[] = ['supply_constrained', 'under', 'watch', 'on_track', 'over', 'unmeasurable', 'core', 'no_gap'];

export const BAND_LABEL: Readonly<Record<BandFilter, string>> = {
  supply_constrained: 'Supply-constrained',
  under: 'Under',
  watch: 'Watch',
  on_track: 'On track',
  over: 'Over',
  unmeasurable: 'Unmeasurable',
  core: 'Core',
  no_gap: 'Gap not computed',
};

/** What each band means, for tooltips and the drawer's one-line reason (S2-C17 band rule). */
export const BAND_MEANING: Readonly<Record<BandFilter, string>> = {
  supply_constrained: 'Behind the curve by more than 10% while its pivotal sizes were available under 80% of days',
  under: 'At least 30% behind the curve with its pivotal sizes available',
  watch: 'Between 10% and 30% behind the curve',
  on_track: 'Within 10% of the curve',
  over: 'Ahead of the curve',
  unmeasurable: 'No pivotal set of sizes, so neither True ROS nor availability can be measured',
  core: 'Core options have no band; read them on True ROS and weeks of cover',
  no_gap: 'The gap to the curve could not be computed (see the gap reason)',
};

/** Short band names for dense cells, always shown with the count and explained by the lens legend (S2-C67 H2). */
export const BAND_SHORT: Readonly<Record<BandFilter, string>> = {
  supply_constrained: 'Supply-c.',
  under: 'Under',
  watch: 'Watch',
  on_track: 'On track',
  over: 'Over',
  unmeasurable: 'Unmeas.',
  core: 'Core',
  no_gap: 'Gap n/c',
};

/** One-line help for terms a planner may not know (S2-C67 M9). */
export const GLOSSARY = {
  trueRos: 'True ROS: rate of sale on in-stock days. Units sold on qualifying days only, so days a key size was out of stock do not drag it down.',
  pivotalSizes: 'Pivotal sizes: the few sizes that make up at least 80% of the option\'s sales in the 14 days.',
  qualifyingDays: 'Qualifying days: days when every pivotal size was in stock at the previous close and prices were normal.',
  vetoValidDays: 'Veto-valid days: days not excluded by the pricing rule (discounts over 50%, invalid prices).',
  optionStoreRows: 'Each option is counted once per store that holds it, so an option in 3 stores counts 3.',
  unmapped: 'Unmapped: the grade code is not Fashion, Ultimate or Core, so these options have no curve or space plan.',
} as const;

/** Band segment tones: status colour carries meaning and always travels with the label. */
export const BAND_TONE: Readonly<Record<BandFilter, string>> = {
  supply_constrained: 'bg-amber-600',
  under: 'bg-red-500',
  watch: 'bg-amber-300',
  on_track: 'bg-green-500',
  over: 'bg-blue-400',
  unmeasurable: 'bg-white border border-dashed border-gray-400',
  core: 'bg-white border border-gray-300',
  no_gap: 'bg-gray-200',
};

/** Badge variant per band in rows and the drawer. */
export const BAND_BADGE: Readonly<Record<BandFilter, 'error' | 'warning' | 'success' | 'info' | 'default' | 'outline'>> = {
  supply_constrained: 'warning',
  under: 'error',
  watch: 'warning',
  on_track: 'success',
  over: 'info',
  unmeasurable: 'outline',
  core: 'outline',
  no_gap: 'outline',
};

export function parseBands(value: string | null): BandFilter[] {
  if (!value) return [];
  return value.split(',').flatMap((item) => BAND_FILTERS.filter((band) => band === item));
}

export const UNMEASURABLE_LABEL: Readonly<Record<string, string>> = {
  no_pivotal_set: 'No pivotal set of sizes: no positive sale survived the pricing veto',
  too_few_qualifying_days: 'Fewer than 3 qualifying days in the 14-day window',
  missing_size_sales: 'Sales rows without a size code',
  missing_size_stock: 'Stock rows without a size code',
  missing_size_both: 'Sales and stock rows without a size code',
};

/** Worklist default: lifecycle clock, oldest first, so options nearest the review and exit thresholds lead.
 * The "Most behind the curve" panel ranks by units short (decision D-shortfall-sort), so the two never repeat on load. */
export const DEFAULT_SORT: OptionSort = 'age_desc';

/** Some non-apparel articles carry only a colour as option code, so unrelated articles share one "option" (open ruling, spec §12). */
export function isColourOnlyCode(optionCode: string): boolean {
  return !/\d/.test(optionCode);
}

export const GRADE_CLASSES: readonly GradeClass[] = ['Fashion', 'Ultimate', 'Core', 'Unmapped'];

export const GAP_REASON_LABEL: Readonly<Record<string, string>> = {
  no_first_grn: 'No GRN date at this store',
  future_grn: 'GRN date after the as-of date',
  grade_conflict: 'Sizes carry different grades',
  core: 'Core has no sell-through curve',
  unmapped_grade: 'Grade is not Fashion, Ultimate or Core',
  under_min_age: 'Under the 14-day minimum age',
  negative_sales: 'Net sales are negative (returns)',
  no_inward: 'No inward quantity',
  zero_expected: 'Expected sales are zero',
};

export const FINDING_LABEL: Readonly<Record<string, string>> = {
  NEGATIVE_STOCK: 'Negative stock',
  BLANK_OPTION: 'Article without option code',
  NO_FIRST_GRN: 'No GRN date',
  UNMAPPED_GRADE: 'Unmapped grade',
  GRADE_CONFLICT: 'Conflicting grades',
  INWARD_MISMATCH: 'Inward vs STO mismatch',
  SALES_WINDOW_SHORT: 'Older than sales window',
  FUTURE_GRN: 'GRN after as-of date',
  NEGATIVE_SALES: 'Negative net sales',
  SALES_WITHOUT_STOCK_ROW: 'Sales without stock row',
  MISSING_LEAD_TIME: 'No lead time',
  NO_PLANOGRAM: 'No planogram',
  STORE_WITHOUT_DATA: 'Store without data',
  DUPLICATE_SALES_ROW: 'Duplicate sales row',
  NO_SPACE_PLAN: 'No space plan',
};

/** How a finding affects the Scope 1 numbers; groups the Data health findings table. */
export type FindingEffect = 'excluded' | 'adjusted' | 'no_gap' | 'context';

export const FINDING_EFFECT_LABEL: Readonly<Record<FindingEffect, string>> = {
  excluded: 'Excluded from measures',
  adjusted: 'Value adjusted',
  no_gap: 'Gap not computed',
  context: 'Context only',
};

export const FINDING_EFFECTS: readonly FindingEffect[] = ['excluded', 'adjusted', 'no_gap', 'context'];

/** What each finding code does to the numbers, in the backend's own terms (snapshot/findings.py). */
export const FINDING_META: Readonly<Record<string, { effect: FindingEffect; meaning: string }>> = {
  BLANK_OPTION: { effect: 'excluded', meaning: 'Article has no option code, so it is left out of every measure' },
  NEGATIVE_STOCK: { effect: 'adjusted', meaning: 'Negative saleable stock is counted as 0 in on-shelf units' },
  SALES_WINDOW_SHORT: { effect: 'adjusted', meaning: 'First GRN is older than the sales window, so cumulative sales are truncated' },
  NO_FIRST_GRN: { effect: 'no_gap', meaning: 'No GRN date at the store, so age and curve are unknown' },
  UNMAPPED_GRADE: { effect: 'no_gap', meaning: 'Grade is not Fashion, Ultimate or Core, so there is no curve' },
  GRADE_CONFLICT: { effect: 'no_gap', meaning: 'Articles of one option carry different grades' },
  FUTURE_GRN: { effect: 'no_gap', meaning: 'GRN date is after the as-of date' },
  NEGATIVE_SALES: { effect: 'no_gap', meaning: 'Net sales since the reference date are negative (returns)' },
  INWARD_MISMATCH: { effect: 'context', meaning: 'Net inward and STO-issued quantity differ by more than 20%' },
  SALES_WITHOUT_STOCK_ROW: { effect: 'context', meaning: 'Articles sold in the window with no stock row on the as-of date; count is articles' },
  MISSING_LEAD_TIME: { effect: 'context', meaning: 'No DC-to-store lead time; needed by replenishment, not by Scope 1 measures' },
  NO_PLANOGRAM: { effect: 'context', meaning: 'No active planogram rows; needed by space steps, not by Scope 1 measures' },
  STORE_WITHOUT_DATA: {
    effect: 'context',
    meaning: 'No stock on the as-of date and no sales in the sales window; the store stays in the snapshot and is hidden from the store selector by default',
  },
  DUPLICATE_SALES_ROW: {
    effect: 'adjusted',
    meaning: 'Same sales row delivered in more than one daily file; counted once in True ROS (default rule, to confirm)',
  },
  NO_SPACE_PLAN: { effect: 'context', meaning: 'Live stock in a brick × grade with no usable space plan; fill shown as —' },
};

export function findingEffect(code: string): FindingEffect {
  return FINDING_META[code]?.effect ?? 'context';
}

export interface FindingCountRow {
  code: string;
  count: number;
}

/**
 * Finding counts as rows, largest first; equal counts rank by effect on the numbers (excluded, adjusted,
 * no gap, context), then by code. Codes with no findings are left out.
 */
export function findingCountRows(counts: Readonly<Record<string, number>>): FindingCountRow[] {
  const effectRank = (code: string): number => FINDING_EFFECTS.indexOf(findingEffect(code));
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count || effectRank(a.code) - effectRank(b.code) || a.code.localeCompare(b.code));
}

export const PROVENANCE_META: Readonly<Record<Provenance, { label: string; description: string }>> = {
  observed: { label: 'Observed', description: 'Read from the source system for the snapshot date' },
  derived: { label: 'Derived', description: 'Calculated from observed data with the agreed definitions' },
  provisional: { label: 'Provisional', description: 'Depends on a rule still awaiting business sign-off (curve after day 60)' },
  unavailable: { label: 'Unavailable', description: 'The source does not hold this value for this record' },
};

const MINUS = '−';
/** Unit figures are whole numbers everywhere: labels, tooltips, sr-only text and aria-labels (S2-C42). */
const wholeFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
/** Bytes are not units; they keep one decimal ("1.5 GB"). */
const bytesFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });

/** Rounds half away from zero (half-up for the non-negative unit figures); never returns −0. */
export function roundUnits(value: number): number {
  const rounded = Math.sign(value) * Math.round(Math.abs(value));
  return rounded === 0 ? 0 : rounded;
}

/** A unit figure as a whole number with Indian digit grouping; unknown values render as an em dash (S2-C42). */
export function formatUnits(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY;
  const rounded = roundUnits(value);
  const text = wholeFormat.format(Math.abs(rounded));
  return rounded < 0 ? `${MINUS}${text}` : text;
}

/** Fractional unit measures such as expected units, shown whole like every other unit figure (S2-C42). */
export function formatWholeUnits(value: number | null | undefined): string {
  return formatUnits(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY;
  const rounded = Math.round(value * 100);
  return rounded < 0 ? `${MINUS}${Math.abs(rounded)}%` : `${rounded}%`;
}

export function formatDay(value: string | null | undefined): string {
  return value ? formatDate(value) : EMPTY;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return EMPTY;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${bytesFormat.format(bytes / 1024 ** exponent)} ${units[exponent]}`;
}

const BACKEND_UNREACHABLE = 'The Style Actions backend could not be reached.';
const SCOPE_TOO_LARGE_FALLBACK = 'The scope has more stores than one snapshot may hold.';

function scopeLimitSentence(detail: unknown): string {
  if (typeof detail !== 'object' || detail === null) return SCOPE_TOO_LARGE_FALLBACK;
  const limit = 'limit' in detail ? detail.limit : undefined;
  const storeCount = 'store_count' in detail ? detail.store_count : undefined;
  if (typeof limit !== 'number' || typeof storeCount !== 'number') return SCOPE_TOO_LARGE_FALLBACK;
  return `Scope has ${formatUnits(storeCount)} stores; the limit is ${formatUnits(limit)}`;
}

/** What the Build snapshot action says when the backend refuses; `scope_too_large` gets its own title (Scope 1a R7). */
export function buildErrorText(error: unknown): { title: string; message: string } {
  if (!(error instanceof StyleActionsApiError)) return { title: 'Snapshot not started', message: BACKEND_UNREACHABLE };
  if (error.code === 'scope_too_large') {
    return { title: 'Snapshot not started: the scope is too large', message: error.message.trim() || scopeLimitSentence(error.detail) };
  }
  return { title: 'Snapshot not started', message: `${error.message} (${error.code})` };
}

/**
 * Plain copy for a failed build or extension. The backend records a stable code (detail in its log, S2-C66 L2); the
 * UI shows fixed text for it and never the raw error.
 */
const FAILURE_COPY: Readonly<Record<string, string>> = {
  interrupted_by_restart: 'It was interrupted by a server restart. Start it again.',
  'interrupted by restart': 'It was interrupted by a server restart. Start it again.',
  source_query_failed: 'A source query failed. Try again later; the server log has the details.',
  source_unreachable: 'The data source could not be reached. Try again later.',
  scope_too_large: 'The scope has more stores than one snapshot may hold.',
  database_error: 'The database refused the change. The server log has the details.',
};
const FAILURE_FALLBACK = 'It stopped with an error; the server log has the details.';

export function failureText(error: string | null | undefined): string | null {
  if (!error) return null;
  return FAILURE_COPY[error.trim()] ?? FAILURE_FALLBACK;
}

const depthFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/** The label of a plan quantity estimated from the default depth, read from the group's own depth (S2-C67 L6). */
export function fallbackDepthText(depth: number | null): string {
  return depth === null ? 'Plan qty estimated from the default depth' : `Plan qty estimated (${depthFormat.format(depth)} per option)`;
}

/** A backend error as one plain sentence ending in a full stop; its code goes in a tooltip, not the text (S2-C67 L3). */
export function errorSentence(error: unknown): { sentence: string; code: string | null } {
  if (!(error instanceof StyleActionsApiError)) return { sentence: BACKEND_UNREACHABLE, code: null };
  const text = error.message.trim() || 'The request failed';
  return { sentence: /[.!?]$/.test(text) ? text : `${text}.`, code: error.code };
}
