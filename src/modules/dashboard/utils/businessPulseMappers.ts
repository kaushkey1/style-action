import { compareCategoryNames } from "@/lib/utils";
import { stripIndexPrefix } from "@/modules/category-director/lib/apiAdapters";
import type {
  BusinessPulseChartPoint,
  BusinessPulseFashionGradeRow,
  BusinessPulseFormatRow,
  BusinessPulseRevenueMarginRow,
  BusinessPulseResponse,
} from "../api/dashboardApi";
import type { CategoryShare, DrilldownRow, MonthlyRevenuePoint, SimpleTableConfig } from "../types/businessPulseUi";

/** Copy for the revenue & margin drilldown table (labels only — data from API). */
export const REVENUE_MARGIN_COPY = {
  title: "Revenue & Margin by Category",
  headers: ["Name", "Gross Revenue", "Net Revenue", "Gross Margin", "Sell Through", "Aged Inv", "Fresh", "ROS"],
} as const;

const INR_IN_CRORE = 10_000_000;
const INR_IN_LAKH = 100_000;
const INR_IN_THOUSAND = 1_000;

const PIE_PALETTE = ["#6366f1", "#22c55e", "#8b5cf6", "#eab308", "#f97316", "#06b6d4", "#ec4899"];

function finiteOr(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function slugify(name: string | undefined | null, index: number): string {
  const raw = String(name ?? "").trim();
  const base = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "row"}-${index}`;
}

export function inrToCrores(value: number): number {
  return value / INR_IN_CRORE;
}

/** Same thresholds as Geography `pickInrScale` / `fmtInrScaled` — per-cell unit from value. */
function pickInrScaleForTableCell(value: number): {
  divisor: number;
  suffix: "Cr" | "L" | "K" | "";
} {
  const abs = Math.abs(value);
  if (abs >= INR_IN_CRORE) return { divisor: INR_IN_CRORE, suffix: "Cr" };
  if (abs >= INR_IN_LAKH) return { divisor: INR_IN_LAKH, suffix: "L" };
  if (abs >= INR_IN_THOUSAND) return { divisor: INR_IN_THOUSAND, suffix: "K" };
  return { divisor: 1, suffix: "" };
}

/**
 * Format absolute INR for Business Pulse tables (segment, fashion grade, format).
 * Uses Cr when ≥ 1 Cr; otherwise L (lakhs) / K / whole rupees like Geography charts.
 */
export function formatRevenueCrMo(value: number): string {
  if (!Number.isFinite(value)) return "\u2014";
  const scale = pickInrScaleForTableCell(value);
  if (scale.divisor === 1) {
    return `\u20B9${Math.round(value).toLocaleString("en-IN")}`;
  }
  const scaled = value / scale.divisor;
  const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return `\u20B9${scaled.toFixed(digits)} ${scale.suffix}`;
}

/**
 * Total Net Revenue (INR) for the period. Sums the same net `revenue` the Category
 * Performance pods use, so the KPI matches that tab exactly. Prefers `format_table`
 * (flat, dedicated net field); falls back to `revenue_margin_table` if absent.
 */
export function computeNetRevenueTotal(pulse: BusinessPulseResponse): number {
  const fromFormat = (pulse.format_table ?? []).reduce(
    (sum, r) => sum + finiteOr(r.total_net_sales),
    0,
  );
  if (fromFormat > 0) return fromFormat;
  return (pulse.revenue_margin_table ?? []).reduce(
    (sum, r) => sum + finiteOr(r.revenue),
    0,
  );
}

/**
 * Read the gross-revenue figure from a Business Pulse table row, tolerant of the
 * field name the BE eventually ships (gross_revenue / gross_sales / total_gross_sales).
 * Returns null when absent so callers render an em-dash placeholder until the API
 * provides it.
 */
function grossRevenueFromRow(row: {
  gross_revenue?: number | null;
  gross_sales?: number | null;
  total_gross_sales?: number | null;
}): number | null {
  const raw = row.gross_revenue ?? row.gross_sales ?? row.total_gross_sales;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Gross-revenue cell: formatted ₹ when present, em-dash placeholder until the API provides it. */
function formatGrossCell(value: number | null): string {
  return value == null ? "—" : formatRevenueCrMo(value);
}

function formatMonthShort(label: string | undefined | null): string {
  const trimmed = String(label ?? "").trim();
  const m = /^(\d{4})-(\d{2})$/.exec(trimmed);
  if (!m) return trimmed;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = new Date(y, mo, 1);
  return d.toLocaleString("en-IN", { month: "short" });
}

/** `value` = actual, `value2` = target/plan when both are present. */
export function mapMonthlyRevenueChartForLine(points: BusinessPulseChartPoint[]): MonthlyRevenuePoint[] {
  return points.map((p) => {
    const actualInr = finiteOr(p.value);
    if (p.value2 != null) {
      return {
        month: formatMonthShort(p.label),
        actual: inrToCrores(actualInr),
        target: inrToCrores(finiteOr(p.value2)),
      };
    }
    return {
      month: formatMonthShort(p.label),
      actual: inrToCrores(actualInr),
      target: inrToCrores(actualInr),
    };
  });
}

export function mapCategoryChartToPie(points: BusinessPulseChartPoint[]): CategoryShare[] {
  const sorted = [...points].sort((a, b) => finiteOr(b.value) - finiteOr(a.value)).slice(0, 5);
  const total = sorted.reduce((s, x) => s + finiteOr(x.value), 0);
  return sorted.map((p, i) => {
    const raw = (p.label ?? "").trim() || "Unknown";
    return {
      name: stripIndexPrefix(raw),
      value: total > 0 ? Math.round((finiteOr(p.value) / total) * 100) : 0,
      color: PIE_PALETTE[i % PIE_PALETTE.length] ?? "#6366f1",
    };
  });
}

export function mapRevenueMarginTable(rows: BusinessPulseRevenueMarginRow[]): DrilldownRow[] {
  type MetricNode = {
    revenue: number;
    grossRevenue: number | null;
    gmPct: number;
    stPct: number;
    ros: number | null;
    agedPct: number;
    freshPct: number;
  };

  function normalizeLabel(value: unknown, fallback = ""): string {
    if (typeof value !== "string") return fallback;
    const v = value.trim();
    return v.length ? v : fallback;
  }

  function rosFromRow(r: BusinessPulseRevenueMarginRow): number | null {
    const raw = r.ROS ?? r.ros;
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function metricFromRow(r: BusinessPulseRevenueMarginRow): MetricNode {
    return {
      revenue: finiteOr(r.revenue),
      grossRevenue: grossRevenueFromRow(r),
      gmPct: finiteOr(r.gm_pct),
      stPct: finiteOr(r.sell_through_pct),
      ros: rosFromRow(r),
      agedPct: finiteOr(r.aged_inv_pct),
      freshPct: finiteOr(r.fresh_pct),
    };
  }

  function aggregateMetrics(nodes: MetricNode[]): MetricNode {
    if (nodes.length === 0) {
      return {
        revenue: 0,
        grossRevenue: null,
        gmPct: 0,
        stPct: 0,
        ros: null,
        agedPct: 0,
        freshPct: 0,
      };
    }
    const revenueTotal = nodes.reduce((sum, n) => sum + n.revenue, 0);
    const avg = (pick: (n: MetricNode) => number) => nodes.reduce((sum, n) => sum + pick(n), 0) / nodes.length;
    const rosValues = nodes.map((node) => node.ros).filter((x): x is number => x != null);
    const rosAgg = rosValues.length > 0 ? rosValues.reduce((sum, value) => sum + value, 0) : null;
    // Gross revenue: sum present values; null when no child carries one (so the
    // parent stays "—" until the API ships the field).
    const grossValues = nodes.map((node) => node.grossRevenue).filter((x): x is number => x != null);
    const grossAgg = grossValues.length > 0 ? grossValues.reduce((sum, value) => sum + value, 0) : null;
    return {
      revenue: revenueTotal,
      grossRevenue: grossAgg,
      gmPct: avg((n) => n.gmPct),
      stPct: avg((n) => n.stPct),
      ros: rosAgg,
      agedPct: avg((n) => n.agedPct),
      freshPct: avg((n) => n.freshPct),
    };
  }

  function formatRosCell(value: number | null): string {
    if (value == null) return "\u2014";
    const ceiled = Math.ceil(value);
    const abs = Math.abs(ceiled);
    if (abs >= 10_000_000) return `${(ceiled / 10_000_000).toFixed(1)} Cr`;
    if (abs >= 100_000) return `${(ceiled / 100_000).toFixed(1)} L`;
    if (abs >= 1_000) return `${(ceiled / 1_000).toFixed(1)} K`;
    return ceiled.toLocaleString("en-IN");
  }

  function toValues(n: MetricNode): string[] {
    return [
      formatGrossCell(n.grossRevenue),
      formatRevenueCrMo(n.revenue),
      `${n.gmPct.toFixed(1)}%`,
      `${Math.round(n.stPct)}%`,
      `${Math.round(n.agedPct)}%`,
      `${Math.round(n.freshPct)}%`,
      formatRosCell(n.ros),
    ];
  }

  // Group flat rows by category (parent) \u2192 subcategory_desc (child).
  // Each unique (category, subcategory_desc) pair is one leaf row.
  const categoryMap = new Map<
    string,
    {
      firstSeenIndex: number;
      rows: BusinessPulseRevenueMarginRow[];
      subcategories: Map<string, BusinessPulseRevenueMarginRow[]>;
    }
  >();

  rows.forEach((row, i) => {
    const category = normalizeLabel(row.name);
    if (!category) return;
    if (/^category\s+\d+$/i.test(category)) return; // drop synthetic stale labels
    const subcategory = normalizeLabel(row.subcategory_desc, "");

    const node =
      categoryMap.get(category) ??
      (() => {
        const created = {
          firstSeenIndex: i,
          rows: [] as BusinessPulseRevenueMarginRow[],
          subcategories: new Map<string, BusinessPulseRevenueMarginRow[]>(),
        };
        categoryMap.set(category, created);
        return created;
      })();

    node.rows.push(row);

    if (subcategory) {
      const subRows = node.subcategories.get(subcategory) ?? [];
      subRows.push(row);
      node.subcategories.set(subcategory, subRows);
    }
  });

  // Sort by raw prefixed names (preserves BE-defined "1, 2, …, Others" order),
  // then strip the prefix at the display layer below so the UI shows
  // "WESTERN TOPS" instead of "9. WESTERN TOPS".
  const sortedCategoryEntries = Array.from(categoryMap.entries()).sort(
    ([a], [b]) => compareCategoryNames(a, b),
  );

  const parents: DrilldownRow[] = sortedCategoryEntries.map(([category, bucket], categoryIdx) => {
    const subcategoryEntries = Array.from(bucket.subcategories.entries());
    subcategoryEntries.sort(([a], [b]) => compareCategoryNames(a, b));

    const subcategoryChildren: DrilldownRow[] = subcategoryEntries.map(([subName, subRows], subIdx) => ({
      id: slugify(`${category}-${subName}`, subIdx),
      name: stripIndexPrefix(subName),
      values: toValues(aggregateMetrics(subRows.map(metricFromRow))),
    }));

    const node: DrilldownRow = {
      id: slugify(category, bucket.firstSeenIndex + categoryIdx),
      name: stripIndexPrefix(category),
      values: toValues(aggregateMetrics(bucket.rows.map(metricFromRow))),
    };
    if (subcategoryChildren.length > 0) {
      node.children = subcategoryChildren;
    }
    return node;
  });

  return parents;
}

function formatUnitsK(n: number): string {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)} L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} K`;
  return String(n);
}

function fashionGradeUsesNewApiShape(rows: BusinessPulseFashionGradeRow[]): boolean {
  return rows.some(
    (r) =>
      (r.fashion_grade_bucket != null && String(r.fashion_grade_bucket).trim() !== "") ||
      r.mix_pct != null ||
      (r.revenue != null && r.total_net_sales == null),
  );
}

export function mapFashionGradeTable(rows: BusinessPulseFashionGradeRow[]): SimpleTableConfig {
  if (fashionGradeUsesNewApiShape(rows)) {
    return {
      title: "Performance by Fashion Grade",
      headers: ["Grade", "Gross Revenue", "Net Revenue", "Gross Margin", "Sell Through", "Aged Inv", "Mix", "Markdown"],
      rows: rows.map((r) => {
        const grade = (r.fashion_grade_bucket ?? r.FASHION_GRADE_STD)?.trim() || "—";
        const revenue = finiteOr(r.revenue ?? r.total_net_sales);
        const gm = finiteOr(r.gm_pct ?? r.margin_pct);
        const mix = r.mix_pct != null ? `${finiteOr(r.mix_pct).toFixed(1)}%` : "—";
        const st = r.sell_through_pct != null ? `${finiteOr(r.sell_through_pct).toFixed(1)}%` : "—";
        const aged = r.aged_pct != null ? `${finiteOr(r.aged_pct).toFixed(1)}%` : "—";
        const md = r.markdown_pct != null ? `${finiteOr(r.markdown_pct).toFixed(2)}%` : "—";
        return [grade, formatGrossCell(grossRevenueFromRow(r)), formatRevenueCrMo(revenue), `${gm.toFixed(1)}%`, st, aged, mix, md];
      }),
    };
  }

  return {
    title: "Performance by Fashion Grade",
    headers: ["Grade", "Gross Revenue", "Net Revenue", "Gross Margin", "Stores", "Units Sold"],
    rows: rows.map((r) => [
      r.FASHION_GRADE_STD?.trim() ? r.FASHION_GRADE_STD : "—",
      formatGrossCell(grossRevenueFromRow(r)),
      formatRevenueCrMo(finiteOr(r.total_net_sales)),
      `${finiteOr(r.margin_pct).toFixed(1)}%`,
      finiteOr(r.store_count, 0).toLocaleString("en-IN"),
      formatUnitsK(finiteOr(r.total_units_sold)),
    ]),
  };
}

export function mapFormatTable(rows: BusinessPulseFormatRow[]): SimpleTableConfig {
  return {
    title: "Performance by Format",
    headers: ["Format", "Gross Revenue", "Net Revenue", "Gross Margin", "Stores", "Units Sold"],
    rows: rows.map((r) => [
      r.FORMAT_DESC_STD?.trim() ? r.FORMAT_DESC_STD : "—",
      formatRevenueCrMo(finiteOr(r.total_gross_sales)),
      formatRevenueCrMo(finiteOr(r.total_net_sales)),
      `${finiteOr(r.margin_pct).toFixed(1)}%`,
      finiteOr(r.store_count, 0).toLocaleString("en-IN"),
      formatUnitsK(finiteOr(r.total_units_sold)),
    ]),
  };
}

export function computeKpiHealthFromPulse(pulse: BusinessPulseResponse): {
  total: number;
  onTrack: number;
  warning: number;
  critical: number;
} {
  const cards = pulse.kpi_cards;
  if (!cards.length) {
    return { total: 0, onTrack: 0, warning: 0, critical: 0 };
  }
  let onTrack = 0;
  let warning = 0;
  let critical = 0;
  for (const c of cards) {
    if (c.status === "on_track") onTrack += 1;
    else if (c.status === "warning") warning += 1;
    else if (c.status === "critical") critical += 1;
  }
  return { total: cards.length, onTrack, warning, critical };
}
