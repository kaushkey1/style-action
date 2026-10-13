/**
 * AOP converged-view data layer.
 *
 * Types, formatters, tone helpers, and the transforms that map the Variance
 * Tracker API response (`fetchVarianceTracker`) into the shapes the converged
 * AOP page renders. All variance %, tone, and display strings are derived here
 * so components stay presentational. Any metric the API returns as null renders
 * as "-" (values) or "N/A" (variance), with a neutral tone.
 */
import { stripIndexPrefix } from "@/lib/routing";
import type {
  VarianceTrackerResponse,
  VarianceTrackerSummaryMetric,
  VarianceTrackerHeatmapRow,
  VarianceTrackerMetricValue,
  VarianceTrackerGroupBy,
} from "../api/aopApi";

// ─── Tone + plan/actual primitive ────────────────────────────────────────────
export type Tone = "positive" | "negative" | "neutral";

/** Deadzone (±%) within which a variance is treated as "on plan" (neutral). */
const NEUTRAL_BAND = 1.5;

export interface PlanActual {
  plan: number;
  actual: number;
  varPct: number;
  tone: Tone;
  /** API returned null for this side / variance — render "-" / "N/A". */
  planNull: boolean;
  actualNull: boolean;
  varNull: boolean;
}

function toneOf(varPct: number): Tone {
  if (Math.abs(varPct) < NEUTRAL_BAND) return "neutral";
  return varPct >= 0 ? "positive" : "negative";
}

/**
 * Build a null-safe PlanActual from raw API values. `scale` divides raw plan/
 * actual into display units (e.g. rupees → ₹ Cr). Variance prefers the API's
 * `variance_pct`; falls back to computing it when both sides are present.
 */
export function paFromApi(
  rawPlan: number | null,
  rawActual: number | null,
  rawVar: number | null,
  scale: number,
): PlanActual {
  const planNull = rawPlan == null;
  const actualNull = rawActual == null;
  const plan = (rawPlan ?? 0) / scale;
  const actual = (rawActual ?? 0) / scale;
  let varPct = 0;
  let varNull = false;
  if (rawVar != null) {
    varPct = rawVar;
  } else if (!planNull && !actualNull && plan !== 0) {
    varPct = ((actual - plan) / plan) * 100;
  } else {
    varNull = true;
  }
  const tone: Tone = planNull && actualNull ? "neutral" : varNull ? "neutral" : toneOf(varPct);
  return { plan, actual, varPct, tone, planNull, actualNull, varNull };
}

// ─── Aggregation (parent rows from children) ─────────────────────────────────
type AggMode = "sum" | "avg";

/**
 * Combine child PlanActuals into a parent. Nulls count as 0 (matching the
 * production Variance Tracker's aggregateMetric); a side is null only when
 * every child was null.
 */
function aggregatePa(cells: PlanActual[], mode: AggMode): PlanActual {
  if (cells.length === 0) return paFromApi(null, null, null, 1);
  const total = (pick: (c: PlanActual) => number): number => {
    const sum = cells.reduce((acc, c) => acc + pick(c), 0);
    return mode === "avg" ? sum / cells.length : sum;
  };
  const plan = total((c) => c.plan);
  const actual = total((c) => c.actual);
  const planNull = cells.every((c) => c.planNull);
  const actualNull = cells.every((c) => c.actualNull);
  const varNull = planNull || actualNull || plan === 0;
  const varPct = varNull ? 0 : ((actual - plan) / plan) * 100;
  const tone: Tone = varNull ? "neutral" : toneOf(varPct);
  return { plan, actual, varPct, tone, planNull, actualNull, varNull };
}

// ─── Display formatters (expect already-scaled numbers) ──────────────────────
export const fmtCr = (n: number): string => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
export const fmtUnitsMn = (n: number): string =>
  `${n.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mn`;
export const fmtPct = (n: number): string => `${n.toFixed(1)}%`;
export const fmtRupee = (n: number): string => `₹${Math.round(n).toLocaleString("en-IN")}`;
export const fmtVar = (n: number): string => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

/** Variance display with null-awareness — "N/A" when the API gave no variance. */
export const fmtVarPa = (pa: PlanActual): string => (pa.varNull ? "N/A" : fmtVar(pa.varPct));

export const toneClass: Record<Tone, string> = {
  positive: "text-success-600",
  negative: "text-error-600",
  neutral: "text-gray-500",
};
export const toneBg: Record<Tone, string> = {
  positive: "bg-success-50",
  negative: "bg-error-50",
  neutral: "bg-gray-50",
};

// ─── Metric metadata (order, labels, scale, formatter) ───────────────────────
export type MetricCode = "gross_revenue" | "net_revenue" | "volume" | "asp" | "intake_gm" | "gm_pct";

interface MetricMeta {
  label: string;
  unit: string;
  /** Raw API value ÷ scale → display units. */
  scale: number;
  fmt: (n: number) => string;
}

const METRIC_META: Record<MetricCode, MetricMeta> = {
  gross_revenue: { label: "Gross Revenue", unit: "₹ Cr", scale: 1e7, fmt: fmtCr },
  net_revenue: { label: "Net Revenue", unit: "₹ Cr", scale: 1e7, fmt: fmtCr },
  volume: { label: "Volume", unit: "Mn units", scale: 1e6, fmt: fmtUnitsMn },
  asp: { label: "Average Selling Price", unit: "₹", scale: 1, fmt: fmtRupee },
  intake_gm: { label: "Intake Gross Margin", unit: "%", scale: 1, fmt: fmtPct },
  gm_pct: { label: "Gross Margin %", unit: "%", scale: 1, fmt: fmtPct },
};

/** KPI strip order (also drives the summary transform). */
const KPI_ORDER: MetricCode[] = ["gross_revenue", "net_revenue", "volume", "asp", "intake_gm", "gm_pct"];

// ─── Breakdown row + drill types ─────────────────────────────────────────────
export type MetricKey = "volume" | "asp" | "grossRevenue" | "netRevenue" | "intakeGm" | "gmPct";

export interface BreakdownRow {
  name: string;
  /** Grouping hints from the API (populated for the category dimension). */
  category?: string | null;
  subCategory?: string | null;
  volume: PlanActual;
  asp: PlanActual;
  grossRevenue: PlanActual;
  netRevenue: PlanActual;
  intakeGm: PlanActual;
  gmPct: PlanActual;
}

export interface DrillRow extends BreakdownRow {
  children?: BreakdownRow[];
}

export type GroupKey = VarianceTrackerGroupBy; // "category" | "channel" | "format" | "store"

export const GROUP_LABEL: Record<GroupKey, string> = {
  category: "Category",
  channel: "Channel",
  store: "Store",
  format: "Format",
};

export interface FilterOption {
  value: string;
  label: string;
}

/** Column descriptor — the display + variance accessor per breakdown metric. */
export interface MetricCol {
  key: MetricKey;
  label: string;
  format: (pa: PlanActual) => { plan: string; actual: string };
}

const fmtSide = (pa: PlanActual, side: "plan" | "actual", fmt: (n: number) => string): string =>
  (side === "plan" ? pa.planNull : pa.actualNull) ? "-" : fmt(pa[side]);

export const METRIC_COLS: MetricCol[] = [
  { key: "grossRevenue", label: "Gross Revenue", format: (p) => ({ plan: fmtSide(p, "plan", fmtCr), actual: fmtSide(p, "actual", fmtCr) }) },
  { key: "netRevenue", label: "Net Revenue", format: (p) => ({ plan: fmtSide(p, "plan", fmtCr), actual: fmtSide(p, "actual", fmtCr) }) },
  { key: "volume", label: "Volume", format: (p) => ({ plan: fmtSide(p, "plan", fmtUnitsMn), actual: fmtSide(p, "actual", fmtUnitsMn) }) },
  { key: "asp", label: "Average Selling Price", format: (p) => ({ plan: fmtSide(p, "plan", fmtRupee), actual: fmtSide(p, "actual", fmtRupee) }) },
  { key: "intakeGm", label: "Intake Gross Margin", format: (p) => ({ plan: fmtSide(p, "plan", fmtPct), actual: fmtSide(p, "actual", fmtPct) }) },
  { key: "gmPct", label: "Gross Margin %", format: (p) => ({ plan: fmtSide(p, "plan", fmtPct), actual: fmtSide(p, "actual", fmtPct) }) },
];

// ─── KPI summary transform ───────────────────────────────────────────────────
export interface KpiMetric {
  code: MetricCode;
  label: string;
  unit: string;
  value: PlanActual;
  displayPlan: string;
  displayActual: string;
  displayVar: string;
}

export function transformSummary(metrics: VarianceTrackerSummaryMetric[]): KpiMetric[] {
  const byCode = new Map(metrics.map((m) => [m.code, m]));
  return KPI_ORDER.map((code) => {
    const meta = METRIC_META[code];
    const m = byCode.get(code);
    const value = paFromApi(m?.plan ?? null, m?.actual ?? null, m?.variance_pct ?? null, meta.scale);
    return {
      code,
      label: meta.label,
      unit: meta.unit,
      value,
      displayPlan: value.planNull ? "-" : meta.fmt(value.plan),
      displayActual: value.actualNull ? "-" : meta.fmt(value.actual),
      displayVar: fmtVarPa(value),
    };
  });
}

// ─── Breakdown transform ─────────────────────────────────────────────────────
const cell = (v: VarianceTrackerMetricValue, scale: number): PlanActual =>
  paFromApi(v.plan, v.actual, v.variance_pct, scale);

function heatmapRowToBreakdown(row: VarianceTrackerHeatmapRow): BreakdownRow {
  return {
    name: stripIndexPrefix(row.dimension_value),
    category: row.category,
    subCategory: row.sub_category,
    volume: cell(row.volume, METRIC_META.volume.scale),
    asp: cell(row.asp, METRIC_META.asp.scale),
    grossRevenue: cell(row.gross_revenue, METRIC_META.gross_revenue.scale),
    netRevenue: cell(row.net_revenue, METRIC_META.net_revenue.scale),
    intakeGm: cell(row.intake_gm, METRIC_META.intake_gm.scale),
    gmPct: cell(row.gm_pct, METRIC_META.gm_pct.scale),
  };
}

/** Sum for additive metrics; average for ratio metrics (mirrors prod aggregateMetric). */
const AGG_MODE: Record<MetricKey, AggMode> = {
  volume: "sum",
  grossRevenue: "sum",
  netRevenue: "sum",
  asp: "avg",
  intakeGm: "avg",
  gmPct: "avg",
};

function combineRows(name: string, rows: BreakdownRow[]): BreakdownRow {
  const pick = (key: MetricKey): PlanActual => aggregatePa(rows.map((r) => r[key]), AGG_MODE[key]);
  return {
    name,
    volume: pick("volume"),
    asp: pick("asp"),
    grossRevenue: pick("grossRevenue"),
    netRevenue: pick("netRevenue"),
    intakeGm: pick("intakeGm"),
    gmPct: pick("gmPct"),
  };
}

function transformBreakdown(rows: VarianceTrackerHeatmapRow[], groupBy: GroupKey): DrillRow[] {
  const leaves = rows.map(heatmapRowToBreakdown);

  if (groupBy === "category") {
    // category → sub-category (brick leaves collapsed into their sub-category).
    const catMap = new Map<string, Map<string, BreakdownRow[]>>();
    for (const leaf of leaves) {
      const cat = stripIndexPrefix(leaf.category ?? "Others");
      const sub = stripIndexPrefix(
        !leaf.subCategory || leaf.subCategory === "None" ? "Uncategorized" : leaf.subCategory,
      );
      let subMap = catMap.get(cat);
      if (!subMap) {
        subMap = new Map();
        catMap.set(cat, subMap);
      }
      const bucket = subMap.get(sub);
      if (bucket) bucket.push(leaf);
      else subMap.set(sub, [leaf]);
    }
    return Array.from(catMap.entries()).map(([cat, subMap]) => {
      const children = Array.from(subMap.entries()).map(([sub, items]) => combineRows(sub, items));
      const all = Array.from(subMap.values()).flat();
      return { ...combineRows(cat, all), children };
    });
  }

  // Flat dimensions — aggregate by name (robust if a dimension is split by category).
  const map = new Map<string, BreakdownRow[]>();
  for (const leaf of leaves) {
    const bucket = map.get(leaf.name);
    if (bucket) bucket.push(leaf);
    else map.set(leaf.name, [leaf]);
  }
  return Array.from(map.entries()).map(([name, items]) => {
    const [first] = items;
    return items.length === 1 && first ? first : combineRows(name, items);
  });
}

// ─── Top-level transform (stable ref for React Query `select`) ───────────────
export interface VarianceView {
  kpis: KpiMetric[];
  rows: DrillRow[];
}

export function transformVarianceTracker(res: VarianceTrackerResponse): VarianceView {
  return {
    kpis: transformSummary(res.variance_summary?.metrics ?? []),
    rows: transformBreakdown(res.heatmap?.rows ?? [], res.group_by),
  };
}

// ─── Glossary key remap (labels → canonical METRIC_DESCRIPTIONS keys) ────────
const AOP_METRIC_KEYS: Record<string, string> = {
  Volume: "AOP Volume",
  "Average Selling Price": "AOP ASP",
  "Gross Revenue": "AOP Gross Revenue",
  "Net Revenue": "AOP Net Revenue",
  "Intake Gross Margin": "AOP Intake GM",
  "Gross Margin %": "AOP GM%",
};

/** Map a display label to its canonical glossary key (falls back to the label). */
export const resolveGlossaryKey = (label: string): string => AOP_METRIC_KEYS[label] ?? label;

// ─── Page copy ───────────────────────────────────────────────────────────────
export const DATA_NOTE =
  "Consolidated snapshot for Impetus-inwarded articles, refreshed on a T-2 cycle. MTD/YTD reflect the latest month with available actuals, not the current calendar month.";
