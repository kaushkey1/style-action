// ---------------------------------------------------------------------------
// Standardized Chart Color Palettes
// All chart data colors MUST be imported from this file.
// Grid lines, axis text, tooltip borders, and other UI chrome are NOT
// covered here — those remain inline as layout/styling concerns.
// ---------------------------------------------------------------------------
//
// COLOR CONTRACT — pick the token by what the data IS, not by chart type:
//   • Single metric / one series .............. CHART_PRIMARY (one indigo, no rainbow)
//   • Plan vs Actual (same metric, 2 states) .. CHART_PLAN + CHART_ACTUAL (two-tone indigo)
//   • Ordinal buckets (age, tiers, ranks) ..... CHART_SEQUENTIAL (one-hue ramp = hierarchy)
//   • Nominal categories (regions, brands) .... CHART_CATEGORICAL (distinct hues, stable order)
//   • Health / performance .................... CHART_STATUS (RAG — reserved for status only)
//   • Positive vs negative variance ........... CHART_DIVERGING
// Colour is semantic only: never give a single-metric bar/category set a rainbow —
// the category is already named on the axis, so multi-hue would encode nothing.
// ---------------------------------------------------------------------------

/** Primary brand color for single-series charts (lines, bars, areas). */
export const CHART_PRIMARY = '#6366f1'; // indigo-500

/** Baseline / target / reference-line color. */
export const CHART_BASELINE = '#9ca3af'; // gray-400

/**
 * Plan-vs-Actual two-tone (same hue = same metric, two states).
 * Plan/AOP = light indigo (muted), Actual = solid indigo. Use this pair for
 * EVERY plan-vs-actual / AOP-vs-actual comparison so the encoding never varies.
 */
export const CHART_PLAN = '#a5b4fc'; // indigo-300
export const CHART_ACTUAL = CHART_PRIMARY; // indigo-500

/**
 * Sequential palette — monochrome indigo for parts-of-whole breakdowns
 * where items are related (subcategories, store tiers, pipeline stages).
 * 6 values: darkest → lightest.
 */
export const CHART_SEQUENTIAL = [
  '#6366f1', // indigo-500
  '#818cf8', // indigo-400
  '#a5b4fc', // indigo-300
  '#c7d2fe', // indigo-200
  '#e0e7ff', // indigo-100
  '#eef2ff', // indigo-50
];

/**
 * Categorical palette — perceptually distinct hues for comparing
 * different entities (regions, scenarios, independent metrics).
 * 8 values; use as many as needed.
 */
export const CHART_CATEGORICAL = [
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#60a5fa', // blue-400
  '#f97316', // orange-500
  '#10b981', // emerald-500
];

/** Semantic status colors — RAG encoding for health / performance. */
export const CHART_STATUS = {
  success: '#10b981',  // emerald-500
  warning: '#f59e0b',  // amber-500
  critical: '#ef4444', // red-500
  neutral: '#9ca3af',  // gray-400
} as const;

/** Diverging pair — positive vs negative values (margin flow, variance). */
export const CHART_DIVERGING = {
  positive: '#6366f1', // indigo-500
  negative: '#f97316', // orange-500
} as const;

// ---------------------------------------------------------------------------
// Chart Chrome — non-data visual elements (grids, axes, borders)
// These are layout/styling concerns, separate from data colors above.
// ---------------------------------------------------------------------------

/** CartesianGrid stroke — Tailwind gray-100 */
export const CHART_GRID = '#f3f4f6';

/** Axis tick text fill (numeric labels) — Tailwind gray-400 */
export const CHART_AXIS_TICK = '#9ca3af';

/** Axis category label fill (named labels) — Tailwind gray-500 */
export const CHART_AXIS_LABEL = '#6b7280';

/** Tooltip / popover border — Tailwind gray-200 */
export const CHART_BORDER = '#e5e7eb';
