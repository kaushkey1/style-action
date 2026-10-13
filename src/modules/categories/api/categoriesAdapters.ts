import { compareCategoryNames, formatCurrency, type RagStatus } from '@/lib/utils';
import {
  stripIndexPrefix,
  apiKpiToCategoryDirectorHealthKpi,
} from '@/modules/category-director/lib/apiAdapters';
import type {
  CategoryPerfRow,
  CategorySummaryRow,
} from '@/modules/category-director/api/categoryDirectorApi';
import type { CategoryDirectorHealthKpi } from '@/modules/category-director/data/mockCategoryDirectorData';

const RUPEE_TO_CR = 1 / 10_000_000;

// Variance band thresholds for the listing status pill (vs AOP plan).
const WATCH_VARIANCE_PCT = -20; // ≥ -20% and < 0 → Watch; below → Critical

// ─── Status derivation ──────────────────────────────────────────────────────

/**
 * Derive the listing RAG status for a category row.
 * Data-driven when an AOP plan exists (variance of net sales vs plan); falls
 * back to the dummy `statusOverride` (or 'warning') when the API has no plan.
 */
export function deriveCategoryStatus(row: CategoryPerfRow): RagStatus {
  const actual = row.net_sales;
  const plan = row.plan_net_sales;
  const hasPlan = plan !== null && Number.isFinite(plan) && plan !== 0;
  if (!hasPlan || actual === null || !Number.isFinite(actual)) {
    return 'warning';
  }
  const variancePct = ((actual - plan!) / plan!) * 100;
  if (variancePct >= 0) return 'on-track';
  if (variancePct >= WATCH_VARIANCE_PCT) return 'warning';
  return 'critical';
}

// ─── List view model ────────────────────────────────────────────────────────

export interface CategoryListRow {
  /** Raw API category value, e.g. "1. MEN APPAREL" — used for the API filter contract. */
  rawName: string;
  /** Display / route name with the numeric prefix stripped, e.g. "MEN APPAREL". */
  name: string;
  status: RagStatus;
  /** Whether the API returned an AOP plan — drives "No plan set" labelling. */
  hasPlan: boolean;
  revenueFormatted: string;
  gmPctFormatted: string;
  /** Raw gross-margin % (for sorting); null = data gap. */
  gmPct: number | null;
  /** Variance vs plan as a signed string, or null when no plan. */
  variancePct: number | null;
  varianceFormatted: string;
  /** Share of total net revenue (0–100), for the "% of revenue" sub-line. */
  revenueSharePct: number;
  /** % of in-stock options with no sales in the window. null = data gap. */
  zeroSalePct: number | null;
  zeroSaleFormatted: string;
  /** Number of open actions for this category from the insights API. null = no data. */
  actionCount: number | null;
}

function pctOrDash(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(1)}%`;
}

/**
 * Build listing rows from the old `/category-performance` `category_perf_table`.
 * Still used by the detail page context; retained for backward compat.
 */
export function toCategoryListRows(
  categoryRows: CategoryPerfRow[] | undefined,
): CategoryListRow[] {
  if (!categoryRows?.length) return [];

  const totalNet = categoryRows.reduce((sum, r) => sum + (r.net_sales ?? 0), 0);

  const sorted = [...categoryRows].sort((a, b) =>
    compareCategoryNames(a.category, b.category),
  );

  return sorted.map((row) => {
    const name = stripIndexPrefix(row.category);
    const actual = row.net_sales;
    const plan = row.plan_net_sales;
    const hasPlan = plan !== null && Number.isFinite(plan) && plan !== 0;

    let variancePct: number | null = null;
    if (hasPlan && actual !== null && Number.isFinite(actual)) {
      variancePct = ((actual - plan!) / plan!) * 100;
    }

    return {
      rawName: row.category,
      name,
      status: deriveCategoryStatus(row),
      hasPlan,
      revenueFormatted: actual !== null ? formatCurrency(actual) : '—',
      gmPctFormatted: pctOrDash(row.gm_pct),
      gmPct: row.gm_pct,
      variancePct,
      varianceFormatted:
        variancePct === null
          ? '—'
          : `${variancePct > 0 ? '+' : ''}${variancePct.toFixed(1)}%`,
      revenueSharePct: totalNet > 0 ? ((actual ?? 0) / totalNet) * 100 : 0,
      zeroSalePct: null,
      zeroSaleFormatted: '—',
      actionCount: null,
    };
  });
}

/**
 * Derive listing RAG status from a `CategorySummaryRow`.
 * Uses `var_to_plan_pct` when an AOP plan exists; "warning" otherwise (no plan).
 */
function deriveSummaryRowStatus(row: CategorySummaryRow): RagStatus {
  const hasPlan = row.aop_net_revenue !== null && Number.isFinite(row.aop_net_revenue) && row.aop_net_revenue !== 0;
  if (!hasPlan || row.var_to_plan_pct === null) return 'warning';
  if (row.var_to_plan_pct >= 0) return 'on-track';
  if (row.var_to_plan_pct >= WATCH_VARIANCE_PCT) return 'warning';
  return 'critical';
}

/**
 * Build listing rows from the `/category-summary` `category_table`.
 * This is the primary source for the Categories listing page.
 */
export function toCategoryListRowsFromSummary(
  categoryRows: CategorySummaryRow[] | undefined,
): CategoryListRow[] {
  if (!categoryRows?.length) return [];

  const totalRevenue = categoryRows.reduce((sum, r) => sum + (r.revenue ?? 0), 0);

  const sorted = [...categoryRows].sort((a, b) =>
    compareCategoryNames(a.category, b.category),
  );

  return sorted.map((row) => {
    const hasPlan =
      row.aop_net_revenue !== null &&
      Number.isFinite(row.aop_net_revenue) &&
      row.aop_net_revenue !== 0;
    const variancePct = row.var_to_plan_pct;

    return {
      rawName: row.category,
      name: stripIndexPrefix(row.category),
      status: deriveSummaryRowStatus(row),
      hasPlan,
      revenueFormatted: row.revenue_formatted,
      gmPctFormatted: pctOrDash(row.gm_pct),
      gmPct: row.gm_pct,
      variancePct,
      varianceFormatted:
        variancePct === null
          ? '—'
          : `${variancePct > 0 ? '+' : ''}${variancePct.toFixed(1)}%`,
      revenueSharePct: totalRevenue > 0 ? ((row.revenue ?? 0) / totalRevenue) * 100 : 0,
      zeroSalePct: row.zero_sale_pct,
      zeroSaleFormatted: pctOrDash(row.zero_sale_pct),
      actionCount: row.action_count ?? null,
    };
  });
}

// ─── Sub-category (detail) view model ───────────────────────────────────────

export interface SubcategoryRow {
  name: string;
  netRevenueFormatted: string;
  planRevenueFormatted: string;
  variancePct: number | null;
  varianceFormatted: string;
  gmPctFormatted: string;
  intakeMarginFormatted: string;
}

/**
 * Build the sub-category table rows for a single category from the API
 * `subcategory_drilldown`, filtered to the given raw category name and sorted
 * by Net Revenue (desc) — matching the desktop Category Performance drilldown
 * and the Net-Revenue-vs-AOP chart on the detail page.
 */
export function toSubcategoryRows(
  subcategoryRows: CategoryPerfRow[] | undefined,
  rawCategoryName: string,
): SubcategoryRow[] {
  if (!subcategoryRows?.length) return [];

  return subcategoryRows
    .filter((r) => r.category === rawCategoryName && r.subcategory !== null)
    .sort((a, b) => (b.net_sales ?? 0) - (a.net_sales ?? 0))
    .map((r) => {
      const actual = r.net_sales;
      const plan = r.plan_net_sales;
      const hasPlan = plan !== null && Number.isFinite(plan) && plan !== 0;
      let variancePct: number | null = null;
      if (hasPlan && actual !== null && Number.isFinite(actual)) {
        variancePct = ((actual - plan!) / plan!) * 100;
      }
      return {
        name: stripIndexPrefix(r.subcategory ?? ''),
        netRevenueFormatted: actual !== null ? formatCurrency(actual) : '—',
        planRevenueFormatted: hasPlan ? formatCurrency(plan!) : '—',
        variancePct,
        varianceFormatted:
          variancePct === null
            ? '—'
            : `${variancePct > 0 ? '+' : ''}${variancePct.toFixed(1)}%`,
        gmPctFormatted: pctOrDash(r.gm_pct),
        intakeMarginFormatted: pctOrDash(r.intake_margin_pct),
      };
    });
}

// ─── Detail charts: Net Revenue vs AOP and revenue mix by sub-category ───────

export interface SubcatBarPoint {
  name: string;
  actual: number; // ₹ Cr
  plan: number; // ₹ Cr
}

/** Net Revenue (actual) vs AOP plan per sub-category, in ₹ Cr, for the bar chart. */
export function toSubcatRevenueVsPlan(
  subcategoryRows: CategoryPerfRow[] | undefined,
  rawCategoryName: string,
): SubcatBarPoint[] {
  if (!subcategoryRows?.length) return [];
  return subcategoryRows
    .filter((r) => r.category === rawCategoryName && r.subcategory !== null)
    .sort((a, b) => (b.net_sales ?? 0) - (a.net_sales ?? 0))
    .map((r) => ({
      name: stripIndexPrefix(r.subcategory ?? ''),
      actual: Number(((r.net_sales ?? 0) * RUPEE_TO_CR).toFixed(2)),
      plan: Number(((r.plan_net_sales ?? 0) * RUPEE_TO_CR).toFixed(2)),
    }));
}

export interface SubcatMixPoint {
  name: string;
  value: number; // ₹ Cr
  sharePct: number; // 0–100
}

/** Net Revenue mix (share of category total) per sub-category, for the donut chart. */
export function toSubcatRevenueMix(
  subcategoryRows: CategoryPerfRow[] | undefined,
  rawCategoryName: string,
): SubcatMixPoint[] {
  if (!subcategoryRows?.length) return [];
  const rows = subcategoryRows.filter(
    (r) => r.category === rawCategoryName && r.subcategory !== null,
  );
  const total = rows.reduce((sum, r) => sum + (r.net_sales ?? 0), 0);
  return rows
    .sort((a, b) => (b.net_sales ?? 0) - (a.net_sales ?? 0))
    .map((r) => ({
      name: stripIndexPrefix(r.subcategory ?? ''),
      value: Number(((r.net_sales ?? 0) * RUPEE_TO_CR).toFixed(2)),
      sharePct: total > 0 ? ((r.net_sales ?? 0) / total) * 100 : 0,
    }));
}

// ─── KPI selection ──────────────────────────────────────────────────────────

export interface CategoriesKpiMeta {
  id: string;
  apiCode: string;
  label: string;
  target: string;
  infoKey: string;
  labelOverride?: boolean;
}

/** KPI tiles for the Categories LIST page — powered by `/category-summary`. */
export const LIST_KPI_META: CategoriesKpiMeta[] = [
  { id: 'gross-revenue', apiCode: 'gross-revenue', label: 'Gross Revenue', target: '≥₹720 Cr', infoKey: 'Gross Revenue', labelOverride: true },
  { id: 'achievement-pct', apiCode: 'achievement-pct', label: 'Achievement %', target: '≥100%', infoKey: 'Achievement %', labelOverride: true },
  { id: 'gmroi', apiCode: 'gmroi', label: 'GMROI', target: '≥2.5x', infoKey: 'GMROI' },
  { id: 'realised-gm', apiCode: 'realised-gm', label: 'Realised GM %', target: '≥45%', infoKey: 'Realised GM %' },
];

/** KPI tiles for a single category DETAIL page (still uses /category-performance). */
export const DETAIL_KPI_META: CategoriesKpiMeta[] = [
  { id: 'ww-sales-plan', apiCode: 'ww-sales-plan', label: 'Net Revenue', target: '—', infoKey: 'Net Revenue vs Plan', labelOverride: true },
  { id: 'ww-K191', apiCode: 'ww-gm', label: 'Realised GM %', target: '≥45%', infoKey: 'Realised GM %' },
  { id: 'ww-gmroi', apiCode: 'ww-gmroi', label: 'GMROI', target: '≥2.5x', infoKey: 'GMROI' },
  { id: 'ww-intake', apiCode: 'ww-intake', label: 'Intake Margin %', target: '≥50%', infoKey: 'Intake Margin %' },
];

type AnyKpiCard = {
  code?: string;
  label?: string;
  value: number | null;
  value_formatted?: string;
  target?: string | null;
  status: 'on_track' | 'warning' | 'critical' | 'neutral';
  trend_pct?: number | null;
  data_gap_reason?: string | null;
};

function kpiByCodeGeneric(
  cards: AnyKpiCard[] | undefined,
  code: string,
): AnyKpiCard | undefined {
  return cards?.find((c) => c.code === code);
}

/**
 * Map API KPI cards onto the chosen meta list, reusing the category-director
 * adapter so placeholder/"N/A" handling stays identical to the dashboard.
 */
export function selectKpiCards(
  cards: AnyKpiCard[] | undefined,
  meta: CategoriesKpiMeta[],
): CategoryDirectorHealthKpi[] {
  return meta.map((m) => {
    const rawCard = kpiByCodeGeneric(cards, m.apiCode);
    // Normalise to the KpiCard shape expected by apiKpiToCategoryDirectorHealthKpi.
    const card = rawCard
      ? {
          code: rawCard.code ?? m.apiCode,
          label: rawCard.label ?? m.label,
          value: rawCard.value,
          value_formatted: rawCard.value_formatted ?? '',
          target: rawCard.target ?? '',
          status: rawCard.status,
          trend_pct: rawCard.trend_pct ?? null,
          data_gap_reason: rawCard.data_gap_reason ?? null,
        }
      : undefined;
    const frame: CategoryDirectorHealthKpi = {
      id: m.id,
      label: m.label,
      value: 'N/A',
      target: m.target,
      status: 'warning',
      trendDelta: 0,
      trendLabel: 'vs LW',
      trendDirection: 'flat',
      infoKey: m.infoKey,
    };
    return apiKpiToCategoryDirectorHealthKpi(card, frame, {
      labelOverride: m.labelOverride ? m.label : undefined,
    });
  });
}

// Re-export CategorySummaryRow so the listing page can type-check without
// importing from the deeper api module.
export type { CategorySummaryRow };
