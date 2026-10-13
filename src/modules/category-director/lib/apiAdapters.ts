import { compareCategoryNames, formatCurrency, type RagStatus } from '@/lib/utils';
import type {
  KpiCard,
  ChartDataPoint,
  CategoryPerfRow,
  BrokenSizesRow,
  VendorDeliveryRow,
  MarkdownTriggerRow,
  StoreHealthByGradeRow,
} from '../api/categoryDirectorApi';
import type {
  CategoryDirectorHealthKpi,
  DrilldownTableRow,
  MdTriggerRow,
  StoreHealthRow,
} from '../data/mockCategoryDirectorData';

// ─── Value helpers ───────────────────────────────────────────────────────

/**
 * Strip the leading "N. " number prefix from a category/subcategory string.
 * Example: "9. WESTERN TOPS" → "WESTERN TOPS". Pass-through if no prefix.
 *
 * The /filters API returns subcategories as numbered strings ("9. WESTERN TOPS"),
 * but row data fields like `r.class` are returned without the prefix
 * ("WESTERN TOPS"). Use this to compare a filter value against a row field.
 */
export function stripIndexPrefix(value: string): string {
  return value.replace(/^\d+\.\s*/, '');
}

// ─── KPI helpers ─────────────────────────────────────────────────────────

/** Look up a KPI card by `code` in the response array. Returns undefined if missing. */
export function kpiByCode(cards: KpiCard[] | undefined, code: string): KpiCard | undefined {
  return cards?.find((c) => c.code === code);
}

/** True when the API returned a placeholder card for this metric. */
export function isPlaceholderKpi(card: KpiCard | undefined): boolean {
  if (!card) return true;
  const formatted = (card.value_formatted ?? '').trim().toUpperCase();
  return card.value === null || formatted === 'N/A' || formatted === '';
}

/** API status → existing CategoryDirectorHealthKpi status (drop 'neutral' → 'warning' to keep visual continuity with mock). */
function apiStatusToHealthStatus(s: KpiCard['status']): CategoryDirectorHealthKpi['status'] {
  if (s === 'on_track' || s === 'warning' || s === 'critical') return s;
  return 'warning';
}

/**
 * Convert a CategoryDirectorHealthKpi status (snake_case) to the shared
 * RagStatus type (kebab-case) used by `<MetricCard status={...}>`. Returns
 * `undefined` for empty/unknown values so the badge slot stays hidden.
 */
export function cdStatusToRag(s: CategoryDirectorHealthKpi['status'] | undefined): RagStatus | undefined {
  if (s === 'on_track') return 'on-track';
  if (s === 'warning') return 'warning';
  if (s === 'critical') return 'critical';
  return undefined;
}

/**
 * Build the subtitle string for a CD KPI card following the dashboard
 * convention (see `ux-patterns.md` §20):
 *   - placeholder cards → "Data integration in progress"
 *   - cards with a real target → "Target: {target}"
 *   - cards with no target ("-", "—", "") → no subtitle
 */
export function cdKpiSubtitle({
  value,
  target,
}: Pick<CategoryDirectorHealthKpi, 'value' | 'target'>): string | undefined {
  if (value === 'N/A' || value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return 'Data integration in progress';
  }
  const trimmed = target?.trim();
  if (!trimmed || trimmed === '-' || trimmed === '—') return undefined;
  return `Target: ${trimmed}`;
}

/**
 * Sourcing-style wrapper that carries a `dataGapReason` when the API didn't
 * return a usable value. Callers can opt into reading it (e.g. to badge a
 * card or to hide it via a filter); ignoring it gives a plain
 * CategoryDirectorHealthKpi-shaped object.
 */
export interface CategoryDirectorHealthKpiWithGap extends CategoryDirectorHealthKpi {
  dataGapReason?: string;
}

/**
 * Convert an API KPI card to the CategoryDirectorHealthKpi UI shape.
 *
 * Policy: never fall back to the mock VALUE. When the API returns no card or a
 * placeholder (value === null / value_formatted === "N/A"), keep the fallback's
 * identity fields (id, label, infoKey, target) so the card slot stays mounted
 * and labelled, but set value to "N/A" and surface `dataGapReason` so the
 * caller can decide whether to badge / hide the card.
 *
 * Mirrors the Sourcing pattern (`apiKpiToSrcHealthKpi`).
 */
export function apiKpiToCategoryDirectorHealthKpi(
  card: KpiCard | undefined,
  fallback: CategoryDirectorHealthKpi,
  options?: { labelOverride?: string },
): CategoryDirectorHealthKpiWithGap {
  if (isPlaceholderKpi(card)) {
    return {
      ...fallback,
      label: options?.labelOverride ?? card?.label ?? fallback.label,
      value: 'N/A',
      target: card?.target ?? fallback.target,
      status: 'warning',
      trendDelta: 0,
      trendDirection: 'flat',
      dataGapReason: card?.data_gap_reason ?? 'Data source not yet available.',
    };
  }
  return {
    ...fallback,
    label: options?.labelOverride ?? card!.label ?? fallback.label,
    value: card!.value_formatted ?? fallback.value,
    target: card!.target ?? fallback.target,
    status: apiStatusToHealthStatus(card!.status),
    trendDelta: card!.trend_pct ?? fallback.trendDelta,
  };
}

// ─── Chart adapters ──────────────────────────────────────────────────────

const RUPEE_TO_CR = 1 / 10_000_000;

function isoToWeekLabel(iso: string, idx: number): string {
  if (!iso) return `W${idx + 1}`;
  // ISO date "2026-03-29" → "W14" (ISO week). Cheap calc: count weeks from Jan 1 of the year.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return `W${idx + 1}`;
  const start = new Date(d.getFullYear(), 0, 1);
  const day = Math.floor((d.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((day + start.getDay() + 1) / 7);
  return `W${week}`;
}

/** Weekly revenue chart. API returns actual only; plan stays mocked (0 until OTB integration). */
export function weeklyChartToRecharts(
  points: ChartDataPoint[] | undefined,
): { week: string; actual: number; plan: number }[] {
  if (!points?.length) return [];
  return points.map((p, i) => ({
    week: isoToWeekLabel(p.label, i),
    actual: Number((p.value * RUPEE_TO_CR).toFixed(2)),
    plan: 0,
  }));
}

/** Full-price vs markdown stacked bar.
 *  v3 (2026-05-30): grain switched from week → subcategory. label = subcategory_desc,
 *  value = FP ₹, value2 = MD ₹. Rows arrive sorted by total net sales desc. */
export function fpMdChartToRecharts(
  points: ChartDataPoint[] | undefined,
): { name: string; fullPrice: number; markdown: number }[] {
  if (!points?.length) return [];
  return points.map((p) => ({
    name: stripIndexPrefix(p.label),
    fullPrice: Number((p.value * RUPEE_TO_CR).toFixed(2)),
    markdown: Number(((p.value2 ?? 0) * RUPEE_TO_CR).toFixed(2)),
  }));
}

/** Revenue by sub-category horizontal bar.
 *  v3 (2026-05-30): renamed from classRevenueChartToRecharts. label = subcategory,
 *  value = net revenue ₹, value2 = gross revenue ₹. Sorted net rev desc by BE. */
export function subcategoryRevenueChartToRecharts(
  points: ChartDataPoint[] | undefined,
): { name: string; value: number; gross: number }[] {
  if (!points?.length) return [];
  return points.map((p) => ({
    name: stripIndexPrefix(p.label),
    value: Number((p.value * RUPEE_TO_CR).toFixed(1)),
    gross: Number(((p.value2 ?? 0) * RUPEE_TO_CR).toFixed(1)),
  }));
}

/** GM% by sub-category horizontal bar.
 *  v3 NEW (2026-05-30). label = subcategory, value = GM % (1 dp). Sorted GM% desc by BE. */
export function gmBySubcategoryChartToRecharts(
  points: ChartDataPoint[] | undefined,
): { name: string; value: number }[] {
  if (!points?.length) return [];
  return points.map((p) => ({
    name: stripIndexPrefix(p.label),
    value: Number(p.value.toFixed(1)),
  }));
}

/** AOP vs Actual grouped bar chart.
 *  v4 NEW (2026-05-30). label = subcategory_desc, value = actual gross sales (₹),
 *  value2 = AOP plan gross sales (₹), pct = achievement % (null when plan is 0).
 *  Server-side: sorted by actual_gross_sales DESC, clipped to top-20. */
export function aopVsActualChartToRecharts(
  points: ChartDataPoint[] | undefined,
): { name: string; actual: number; plan: number; achievementPct: number | null }[] {
  if (!points?.length) return [];
  return points.map((p) => ({
    name: stripIndexPrefix(p.label),
    actual: Number((p.value * RUPEE_TO_CR).toFixed(2)),
    plan: Number(((p.value2 ?? 0) * RUPEE_TO_CR).toFixed(2)),
    achievementPct: p.pct == null ? null : Number(p.pct.toFixed(1)),
  }));
}

/** LFL trend. Target stays the FE constant 8 per the doc. */
export function lflChartToRecharts(
  points: ChartDataPoint[] | undefined,
): { week: string; actual: number; target: number }[] {
  if (!points?.length) return [];
  return points.map((p, i) => ({
    week: isoToWeekLabel(p.label, i),
    actual: Number(p.value.toFixed(1)),
    target: 8,
  }));
}

/** Inventory age distribution donut. Uses `pct` field. */
export function ageDistributionToRecharts(
  points: ChartDataPoint[] | undefined,
): { name: string; value: number }[] {
  if (!points?.length) return [];
  return points.map((p) => ({
    name: p.label,
    value: Number((p.pct ?? 0).toFixed(1)),
  }));
}

/** Aged stock by grade horizontal bar. Only grades present in response are rendered. */
export function agedByGradeToRecharts(
  points: ChartDataPoint[] | undefined,
): { name: string; value: number }[] {
  if (!points?.length) return [];
  return points.map((p) => ({
    name: p.label,
    value: Number((p.pct ?? 0).toFixed(1)),
  }));
}

// ─── Table adapters ──────────────────────────────────────────────────────

function rupeeOrDash(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return formatCurrency(value);
}

function pctOrDash(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(1)}%`;
}

/** Variance % (actual vs plan net sales). null/0 plan → '—'. */
function varToPlanPct(actual: number | null, plan: number | null): string {
  if (actual === null || plan === null || !Number.isFinite(plan) || plan === 0) return '—';
  const pct = ((actual - plan) / plan) * 100;
  if (!Number.isFinite(pct)) return '—';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

/**
 * Build a lookup of stripped-subcategory-name → stripped-category-name from
 * the drilldown rows. Used by the AOP-vs-Actual chart's category filter to
 * map chart row labels (which only carry subcategory names) back to their
 * parent category. Empty input returns an empty Map.
 */
export function subcategoryToCategoryMap(
  subcategoryRows: CategoryPerfRow[] | undefined,
): Map<string, string> {
  const out = new Map<string, string>();
  for (const r of subcategoryRows ?? []) {
    if (r.subcategory) {
      out.set(stripIndexPrefix(r.subcategory), stripIndexPrefix(r.category));
    }
  }
  return out;
}

/**
 * Unique parent-category names (stripped, sorted via compareCategoryNames) for
 * the AOP-vs-Actual filter dropdown. Pulled from `category_perf_table` so the
 * ordering matches the Sub-Category Performance table parent rows.
 */
export function categoryPickerOptions(
  categoryRows: CategoryPerfRow[] | undefined,
): { value: string; label: string }[] {
  const seen = new Set<string>();
  const out: { raw: string; stripped: string }[] = [];
  for (const r of categoryRows ?? []) {
    if (!seen.has(r.category)) {
      seen.add(r.category);
      out.push({ raw: r.category, stripped: stripIndexPrefix(r.category) });
    }
  }
  out.sort((a, b) => compareCategoryNames(a.raw, b.raw));
  return out.map((c) => ({ value: c.stripped, label: c.stripped }));
}

/**
 * Sub-Category Performance drilldown tree builder. v3 (2026-05-30) merges
 * `category_perf_table` (category rollups, `subcategory === null`) and
 * `subcategory_drilldown` (per-subcategory rows) into a single 2-level tree.
 * Parent (category) rows come from `category_perf_table` so the API's
 * aggregated values are used directly — no FE re-aggregation needed.
 *
 * Cell layout (matches existing DRILLDOWN_HEADERS):
 *   [name, Net Revenue, AOP Net Revenue, Var to Plan, GM%, Intake Margin %,
 *    FP ST %, Markdown %, Discount, Sellthrough Rate, Aged%, DOH, Fill Rate %]
 *
 * v4 (2026-05-30): widened with AOP Net Revenue, Var to Plan, Intake Margin %,
 * Discount, and DOH on top of the v2 column set.
 *
 * Sell-through (v2 spec, 2026-05-29): FP ST and Sellthrough Rate now use
 * per-numerator denominators (`fp_qty + stk_qty` vs `qty_sold + stk_qty`), so
 * `st >= fp` no longer holds row-by-row. The API field was renamed
 * `season_sell_through_pct` → `sell_through_pct`. Caveat: the standalone H2
 * "Full-Price ST" KPI tile (`ww-fp-st`) is a per-site AVG and may differ from
 * the column by a few percentage points — intentional, different aggregation.
 */
export function subcategoryDrilldownToTree(
  categoryRows: CategoryPerfRow[] | undefined,
  subcategoryRows: CategoryPerfRow[] | undefined,
): DrilldownTableRow[] {
  const childrenByCategory = new Map<string, CategoryPerfRow[]>();
  for (const r of subcategoryRows ?? []) {
    const bucket = childrenByCategory.get(r.category) ?? [];
    bucket.push(r);
    childrenByCategory.set(r.category, bucket);
  }

  const rowFromCategoryPerf = (r: CategoryPerfRow, useSubcategoryLabel: boolean): DrilldownTableRow => {
    const name = useSubcategoryLabel ? r.subcategory ?? r.category : r.category;
    return {
      cells: [
        // Display-only: strip "N. " prefix so cells show "WESTERN TOPS" not "9. WESTERN TOPS".
        // Sort uses the raw prefixed string via compareCategoryNames, so order is preserved.
        stripIndexPrefix(name),
        rupeeOrDash(r.net_sales),
        rupeeOrDash(r.plan_net_sales),       // v4: AOP plan net sales
        varToPlanPct(r.net_sales, r.plan_net_sales), // v4: var % to plan
        pctOrDash(r.gm_pct),
        pctOrDash(r.intake_margin_pct),      // v4: intake margin %
        r.fp_sell_through_pct !== null ? `${r.fp_sell_through_pct}%` : '—',
        r.md_pct !== null ? `${r.md_pct.toFixed(1)}%` : '—',
        rupeeOrDash(r.discount_rs),          // v4: discount ₹
        r.sell_through_pct !== null ? `${r.sell_through_pct}%` : '—',
        r.aged_pct !== null ? `${r.aged_pct}%` : '—',
        r.days_on_hand !== null ? `${r.days_on_hand}d` : '—',
        r.fill_rate_pct !== null ? `${r.fill_rate_pct}%` : '—', // v5 (2026-06-02): saleable / total stock units
      ],
    };
  };

  // Sort categories by RAW prefixed name; comparator orders 1, 2, …, Others last.
  const sortedCategoryRows = [...(categoryRows ?? [])].sort((a, b) =>
    compareCategoryNames(a.category, b.category),
  );

  return sortedCategoryRows.map((parent) => {
    const subs = childrenByCategory.get(parent.category) ?? [];
    const sortedSubs = [...subs].sort((a, b) =>
      compareCategoryNames(a.subcategory ?? '', b.subcategory ?? ''),
    );
    return {
      ...rowFromCategoryPerf(parent, false),
      children: sortedSubs.map((s) => rowFromCategoryPerf(s, true)),
    };
  });
}

/**
 * Map the BE `markdown_triggers_table` (site-level rollup, spec v2 §3.11) into
 * the existing `MdTriggerRow` shape so the table can switch source without
 * refactoring the row renderer. Fields not surfaced today (optionId/stage/time/
 * mdAction) are filled with placeholders since their UI columns are hidden.
 *
 * Returns null (not []) when the API response is undefined — callers use the
 * `?? mockRows` fallback to keep the table populated during BE rollout.
 */
export function markdownTriggersTableToRows(
  rows: MarkdownTriggerRow[] | undefined,
): MdTriggerRow[] | null {
  if (!rows) return null;
  return rows.map((r) => ({
    optionId: r.site,                                                       // unique key — UI column is hidden
    store: r.site,
    storeName: r.store_name ?? '—',
    doh: r.days_on_hand !== null ? String(r.days_on_hand) : '—',
    stPct: r.sell_through_pct !== null ? `${r.sell_through_pct}%` : '—',
    fpStPct: r.fp_sell_through_pct !== null ? `${r.fp_sell_through_pct}%` : '—',
    stage: '',                                                              // hidden — kept for shape compat
    time: '',                                                               // column removed in spec v2
    mdAction: '',                                                           // column removed in spec v2
  }));
}

interface BrokenSizeMockRow {
  category: string;
  totalOptions: string;
  broken: string;
  brokenPct: string;
  atRiskRevenue: string;
  avgMissingSizes: string;
}

/**
 * Map the BE `store_health_by_grade` rollup into the existing
 * `StoreHealthRow` UI shape used by the Store & Distribution tab. Counts are
 * formatted with Indian thousands separators and revenue per day is rendered
 * as `₹X.X Cr/day` (BE already pre-divides by 1 Cr in `revenue_per_day_cr`).
 *
 * Returns null (not []) when the API response is undefined so callers can
 * fall back to mock rows while the API rolls out.
 */
export function storeHealthByGradeToRows(
  rows: StoreHealthByGradeRow[] | undefined,
): StoreHealthRow[] | null {
  if (!rows) return null;
  const fmtCount = (n: number | null): string =>
    n === null || !Number.isFinite(n) ? '—' : n.toLocaleString('en-IN');
  const fmtRevPerDay = (cr: number | null): string =>
    cr === null || !Number.isFinite(cr) ? '—' : `₹${cr.toFixed(1)} Cr/day`;
  return rows.map((r) => ({
    grade: r.store_grade,
    stores: fmtCount(r.total_stores),
    rightStocked: fmtCount(r.right_stocked_stores),
    overstocked: fmtCount(r.overstocked_stores),
    understocked: fmtCount(r.understocked_stores),
    revPerDay: fmtRevPerDay(r.revenue_per_day_cr),
  }));
}

export function brokenSizesToRows(rows: BrokenSizesRow[] | undefined): BrokenSizeMockRow[] {
  if (!rows?.length) return [];
  return rows.map((r) => ({
    category: r.category,
    totalOptions: r.total_options !== null ? r.total_options.toLocaleString('en-IN') : '—',
    broken: r.broken_sets !== null ? r.broken_sets.toLocaleString('en-IN') : '—',
    brokenPct: r.broken_pct !== null ? `${r.broken_pct.toFixed(1)}%` : '—',
    atRiskRevenue:
      r.value_at_risk_cr !== null ? `₹${r.value_at_risk_cr.toFixed(1)} Cr` : '—',
    avgMissingSizes:
      r.avg_missing_sizes !== null ? r.avg_missing_sizes.toFixed(1) : '—',
  }));
}

// Approximate character width for label-driven axis sizing on vertical bar
// charts. Pairs with the SingleLineTick component in ./chartAxis. Slightly
// generous so descender/wide letters don't crowd the bar.
const AXIS_LABEL_LEFT_GUTTER = 4;
const AXIS_LABEL_RIGHT_PADDING = 12;
const CHAR_WIDTH_PX_AT_12 = 7.2;
const CHAR_WIDTH_PX_AT_10 = 6;

export function computeAxisWidth(labels: readonly string[], fontSize: number, max: number): number {
  const charWidth = fontSize >= 12 ? CHAR_WIDTH_PX_AT_12 : CHAR_WIDTH_PX_AT_10;
  const longest = labels.reduce((m, l) => Math.max(m, l.length), 0);
  return Math.min(Math.ceil(longest * charWidth) + AXIS_LABEL_LEFT_GUTTER + AXIS_LABEL_RIGHT_PADDING, max);
}

/** Vendor Delivery chart. Top N by OTIF% desc. */
export function vendorDeliveryToChart(
  rows: VendorDeliveryRow[] | undefined,
  topN: number,
): { name: string; value: number }[] {
  if (!rows?.length) return [];
  return [...rows]
    .filter((r) => r.otif_pct !== null)
    .sort((a, b) => (b.otif_pct ?? 0) - (a.otif_pct ?? 0))
    .slice(0, topN)
    .map((r) => ({
      name: r.vendor,
      value: Number((r.otif_pct ?? 0).toFixed(1)),
    }));
}

// ─── Label / formatting tweaks ───────────────────────────────────────────

/** Tab 4 ww-stores: API returns "2125 of 4672" → UI wants "2,125 / 4,672" with en-IN commas. */
export function storesValueFormatToDisplay(formatted: string): string {
  return formatted
    .replace(' of ', ' / ')
    .replace(/\b(\d{4,})\b/g, (_match, digits: string) =>
      Number(digits).toLocaleString('en-IN'),
    );
}

/**
 * Tab 4 ww-rev-store: API label "Revenue / Store / Day" → UI label "Rev per Store".
 * Signature kept as a function (not constant) so future locale/i18n logic can
 * branch on the inbound label without ripple changes.
 */
export function revPerStoreLabelOverride(): string {
  return 'Rev per Store';
}
