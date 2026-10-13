import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CategoryDirectorFilters } from "../stores/useCategoryDirectorFilterStore";
// NOTE: When unhiding the Weekly Revenue / LFL Growth Trend charts below,
// re-add `LineChart, Line` to this import and restore `revenueChartConfig`,
// `lflChartConfig`, `weeklyData`, `lflData` further down.
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  Button,
  MetricCard,
  SectionHeader,
  InfoHeaderIcon,
  ChartTooltipContent,
  ChartLegendContent,
  TableToolbar,
  TableMetricsInfo,
  EmptyState,
  Skeleton,
  DrillMenu,
} from "@/components/ui";
import { cn, getCurrencySymbol, measureTextWidth, classifyRag, ragToTextClass } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useThresholds } from "@/hooks/useThresholds";
import { HEADER_TO_KPI } from "@/modules/dashboard/utils/columnKpiMap";
import { useTableSearchSort } from "@/hooks/useTableSearchSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { ColumnFilterDropdown } from "@/modules/store-view/components/ColumnFilterDropdown";
import type { ColumnItem } from "@/modules/store-view/components/ColumnFilterDropdown";
import { setSubcategoryDrill } from "../stores/subcategoryDrillStore";
import { ChartCard } from "@/modules/dashboard/components/ChartCard";
import { getChartDrillTargets } from "@/lib/routing";
import { DashboardKpiGrid } from "@/modules/dashboard/components/DashboardKpiGrid";
import { AOPMobileCard } from "@/modules/aop/components/AOPMobileCard";
// NOTE: re-add `CHART_BASELINE` when unhiding the Weekly Revenue / LFL Growth Trend charts below.
import {
  CHART_PRIMARY,
  CHART_PLAN,
  CHART_ACTUAL,
  CHART_SEQUENTIAL,
  CHART_GRID,
  CHART_AXIS_TICK,
} from "@/data/chartColors";
import type {
  DrilldownTableRow,
  CategoryDirectorHealthKpi,
} from "../data/mockCategoryDirectorData";
import { useCategoryPerformance } from "../api/categoryDirectorHooks";
import { useHeroKpiStore } from "../stores/useHeroKpiStore";
// NOTE: re-add `weeklyChartToRecharts` and `lflChartToRecharts` when unhiding the
// Weekly Revenue / LFL Growth Trend charts below.
import {
  kpiByCode,
  apiKpiToCategoryDirectorHealthKpi,
  cdStatusToRag,
  cdKpiSubtitle,
  fpMdChartToRecharts,
  subcategoryRevenueChartToRecharts,
  gmBySubcategoryChartToRecharts,
  aopVsActualChartToRecharts,
  subcategoryDrilldownToTree,
  subcategoryToCategoryMap,
  categoryPickerOptions,
  computeAxisWidth,
} from "../lib/apiAdapters";
import { SingleLineTick } from "../lib/chartAxis";

// Sub-category chart metric toggle (combines Revenue + GM% into one ChartCard).
type SubcatMetric = "revenue" | "grossRevenue" | "gmPct";
const SUBCAT_METRIC_OPTIONS = [
  { value: "grossRevenue", label: "Gross Revenue (₹ Cr)" },
  { value: "revenue", label: "Net Revenue (₹ Cr)" },
  { value: "gmPct", label: "Gross Margin (%)" },
];

// SingleLineTick + computeAxisWidth live in ../lib/chartAxis.tsx + ../lib/apiAdapters
// (shared with the Aged Stock by Grade chart on Inventory & Lifecycle).

/**
 * Resolve a chart's effective category: the user's selection when it's still a valid
 * option, otherwise the default (Menswear if present, else the first option). Because
 * the options are derived from the globally-filtered data, this auto-constrains every
 * chart to the global Category filter when it narrows to a single category, while
 * leaving the charts independent when the global filter is "all".
 */
function pickEffectiveCategory(selected: string, options: { value: string }[]): string {
  if (selected && options.some((o) => o.value === selected)) return selected;
  if (options.length === 0) return "";
  return options.find((o) => /men.*apparel|menswear/i.test(o.value))?.value ?? options[0]!.value;
}

/**
 * FE display config for the Category Performance KPI grid — render order,
 * labels, targets, and the API `code` that supplies each tile's value.
 * Values are never hardcoded here; missing API → "N/A" via the adapter.
 *
 * `labelOverride` is set when the BE still returns a legacy label that the
 * FE has since renamed (per CC Bug Tracker). Remove the override once the BE
 * label catches up.
 */
type PerfKpiMeta = {
  id: string;
  apiCode: string;
  label: string;
  target: string;
  infoKey: string;
  labelOverride?: boolean;
  /** Plan/reference tiles (e.g. AOP plan, Net Revenue plan) should not show a RAG badge — the value is a constant, not a performance outcome. */
  suppressStatus?: boolean;
};

const PERF_KPI_META: PerfKpiMeta[] = [
  // Order locked 2026-06-01 per stakeholder: plan → actual → achievement, then
  // the rest. labelOverride: true forces FE-renamed labels ('Gross Revenue …')
  // to win over BE-returned legacy 'Gross Sales …'.
  // ww-md-cost ('MD Cost % of Gross') hidden 2026-06-01.
  // ww-fp-st2 / ww-st-season relocated to Inventory & Lifecycle 2026-06-01.
  {
    id: "ww-gs-aop",
    apiCode: "ww-gs-aop",
    label: "Gross Revenue AOP/Plan",
    target: "—",
    infoKey: "Gross Revenue AOP/Plan",
    labelOverride: true,
    suppressStatus: true,
  },
  {
    id: "ww-K001",
    apiCode: "ww-K001",
    label: "Gross Revenue",
    target: "—",
    infoKey: "Gross Revenue",
    labelOverride: true,
  },
  {
    id: "ww-gs-ach",
    apiCode: "ww-gs-ach",
    label: "Achievement %",
    target: "≥100%",
    infoKey: "Achievement %",
    labelOverride: true,
  },
  {
    id: "ww-sales-plan",
    apiCode: "ww-sales-plan",
    label: "Net Revenue",
    target: "—",
    infoKey: "Net Revenue vs Plan",
    labelOverride: true,
    suppressStatus: true,
  },
  {
    id: "ww-K191",
    apiCode: "ww-gm",
    label: "Realised GM %",
    target: "≥45%",
    infoKey: "Gross Margin",
  },
  {
    id: "ww-gmroi",
    apiCode: "ww-gmroi",
    label: "GMROI",
    target: "≥2.5x",
    infoKey: "GMROI",
  },
  {
    id: "ww-intake",
    apiCode: "ww-intake",
    label: "Intake Margin %",
    target: "≥50%",
    infoKey: "Intake Margin %",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseNumeric(value: string | number | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const match = String(value).replace(/,/g, "").match(/(-?[\d.]+)\s*(K|L|Cr)?/i);
  if (!match || !match[1]) return 0;
  const n = parseFloat(match[1]);
  if (!Number.isFinite(n)) return 0;
  const unit = match[2]?.toUpperCase();
  if (unit === "CR") return n * 10_000_000;
  if (unit === "L") return n * 100_000;
  if (unit === "K") return n * 1_000;
  return n;
}

// ---------------------------------------------------------------------------
// Chart configs
// ---------------------------------------------------------------------------

// HIDDEN — revenueChartConfig + lflChartConfig used by hidden charts below.
// To unhide: uncomment.
// const revenueChartConfig = {
//   actual: { label: 'Actual', color: CHART_PRIMARY },
//   plan: { label: 'Plan', color: CHART_BASELINE },
// };

// Full Price vs Markdown are two components of the same metric (revenue) →
// two-tone indigo (solid = full price, light = markdown), not an off-palette hue.
const fpMdChartConfig = {
  fullPrice: { label: "Full Price", color: CHART_PRIMARY },
  markdown: { label: "Markdown", color: CHART_SEQUENTIAL[2]! },
};

const aopVsActualChartConfig = {
  actual: { label: "Actual", color: CHART_ACTUAL },
  plan: { label: "AOP Plan", color: CHART_PLAN },
};

/**
 * Custom tooltip for the AOP-vs-Actual chart — surfaces the achievement %
 * alongside the two ₹-formatted bars per v4 spec §1.19.
 */
interface AopVsActualPayloadEntry {
  payload?: {
    name?: string;
    actual?: number;
    plan?: number;
    achievementPct?: number | null;
  };
}
interface AopVsActualTooltipProps {
  active?: boolean;
  payload?: AopVsActualPayloadEntry[];
  label?: string;
}
function AopVsActualTooltip({
  active,
  payload,
  label,
}: AopVsActualTooltipProps): React.ReactNode {
  if (!active || !payload?.length) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;
  const ach = datum.achievementPct;
  const achText = ach == null ? "—" : `${ach.toFixed(1)}%`;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-xs">
      {label && <p className="font-medium text-gray-900 mb-1.5">{label}</p>}
      <div className="space-y-1">
        {/* eslint-disable design-system/prefer-section-header -- tooltip row, not a section header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              // eslint-disable-next-line no-restricted-syntax -- dynamic series color from chart config
              style={{ backgroundColor: aopVsActualChartConfig.actual.color }}
            />
            <span className="text-gray-500">Actual</span>
          </div>
          <span className="font-medium text-gray-900 tabular-nums">
            {getCurrencySymbol()}
            {(datum.actual ?? 0).toFixed(2)} Cr
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              // eslint-disable-next-line no-restricted-syntax -- dynamic series color from chart config
              style={{ backgroundColor: aopVsActualChartConfig.plan.color }}
            />
            <span className="text-gray-500">AOP Plan</span>
          </div>
          <span className="font-medium text-gray-900 tabular-nums">
            {getCurrencySymbol()}
            {(datum.plan ?? 0).toFixed(2)} Cr
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 mt-1 border-t border-gray-100">
          <span className="text-gray-500">Achievement</span>
          <span className="font-medium text-gray-900 tabular-nums">
            {achText}
          </span>
        </div>
        {/* eslint-enable design-system/prefer-section-header */}
      </div>
    </div>
  );
}

/**
 * Custom tooltip for the FP-vs-MD chart.
 * v3 (2026-05-30): the chart grain switched from week → subcategory, so the
 * tooltip now just shows the subcategory label and the two stacked values.
 */
interface FpMdTooltipProps {
  active?: boolean;
  payload?: Array<Record<string, unknown>>;
  label?: string;
}
function FpMdTooltip({
  active,
  payload,
  label,
}: FpMdTooltipProps): React.ReactNode {
  return (
    <ChartTooltipContent
      active={active}
      payload={payload}
      label={label}
      config={fpMdChartConfig}
      valueFormatter={(v) => `${getCurrencySymbol()}${v} Cr`}
    />
  );
}

// const lflChartConfig = {
//   actual: { label: 'LFL Actual', color: CHART_PRIMARY },
//   target: { label: 'Target', color: CHART_BASELINE },
// };

// ---------------------------------------------------------------------------
// Sub-Category Drilldown
// ---------------------------------------------------------------------------

// v4 (2026-05-30): expanded with AOP Net Revenue, Var to Plan, Intake Margin %, Discount.
// v5 (2026-06-02): added Fill Rate % (saleable / total stock units).
// Cells from adapter: [name, Net Revenue, AOP Net Revenue, Var to Plan, GM%,
//                      Intake Margin %, FP ST %, Markdown %, Discount, ST Rate, Aged%, Fill Rate %]
const DRILLDOWN_HEADERS = [
  "Category / Subcategory",
  "Net Revenue",
  "AOP Net Revenue",
  "Var to Plan",
  "GM%",
  "Intake Margin %",
  "FP ST %",
  "Markdown %",
  "Discount",
  "Sellthrough Rate",
  "Aged%",
  "Fill Rate %",
];
const DRILLDOWN_INFO_KEYS: Record<string, string> = {
  "Category / Subcategory": "Subcategory",
  "Net Revenue": "Net Revenue",
  "AOP Net Revenue": "AOP Net Revenue",
  "Var to Plan": "Var to Plan",
  "GM%": "GM%",
  "Intake Margin %": "Intake Margin %",
  "FP ST %": "FP ST %",
  "Markdown %": "Markdown %",
  Discount: "Discount",
  "Sellthrough Rate": "ST %",
  "Aged%": "Aged Inv",
  "Fill Rate %": "Fill Rate %",
  DOH: "Days on Hand",
};
const DRILLDOWN_SORT_FIELDS: Record<string, (r: DrilldownTableRow) => number> =
  {
    // Default sort: Net Revenue desc (first key wins, see useTableSearchSort).
    // Category / Subcategory removed as a sort option 2026-06-02 per product —
    // the adapter (`subcategoryDrilldownToTree`) already returns rows in
    // category-prefix order, so users never lose access to that grouping.
    "Net Revenue": (r) => parseNumeric(r.cells[1]),
    "AOP Net Revenue": (r) => parseNumeric(r.cells[2]),
    "Var to Plan": (r) => parseNumeric(r.cells[3]),
    "GM%": (r) => parseNumeric(r.cells[4]),
    "Intake Margin %": (r) => parseNumeric(r.cells[5]),
    "FP ST %": (r) => parseNumeric(r.cells[6]),
    "Markdown %": (r) => parseNumeric(r.cells[7]),
    Discount: (r) => parseNumeric(r.cells[8]),
    "Sellthrough Rate": (r) => parseNumeric(r.cells[9]),
    "Aged%": (r) => parseNumeric(r.cells[10]),
    "Fill Rate %": (r) => parseNumeric(r.cells[11]),
  };
const DRILLDOWN_NAV_HEADERS = [
  "Name",
  "Net Revenue",
  "AOP Net Revenue",
  "Var to Plan",
  "GM%",
  "Intake Margin %",
  "FP ST %",
  "Markdown %",
  "Discount",
  "ST Rate",
  "Aged%",
  "Fill Rate %",
];

// --- Stable name-column width (matches /dashboard DrilldownTable.tsx) -------
// Sized to fit the widest name across the WHOLE tree (parents + children) so it
// doesn't jump when sub-rows expand/collapse.
const NAME_COL_INDENT_PX = 20; // per nesting depth (matches row paddingLeft)
const NAME_COL_CHROME_PX = 52; // chevron + gap + cell padding
const NAME_COL_MIN_PX = 200;
const NAME_COL_MAX_PX = 480;
/** Minimum width per metric column before horizontal scroll appears. */
const MIN_METRIC_COL_PX = 150;

function estimateDrilldownNameColWidth(rows: DrilldownTableRow[]): number {
  let max = 0;
  const walk = (rs: DrilldownTableRow[], depth: number): void => {
    for (const r of rs) {
      const w =
        measureTextWidth(String(r.cells[0] ?? "")) +
        depth * NAME_COL_INDENT_PX +
        NAME_COL_CHROME_PX;
      if (w > max) max = w;
      if (r.children?.length) walk(r.children, depth + 1);
    }
  };
  walk(rows, 0);
  return Math.round(Math.min(Math.max(max, NAME_COL_MIN_PX), NAME_COL_MAX_PX));
}

function NestedDrilldownRow({
  row,
  depth,
  expandedRows,
  onToggle,
  visibleIndices,
  stickyIndicator,
  thresholdMap,
  visibleKpiCodes,
}: {
  row: DrilldownTableRow;
  depth: number;
  expandedRows: Set<string>;
  onToggle: (name: string) => void;
  /** Indices into a row's metric cells (cells[1..]) for the visible columns, in order. */
  visibleIndices: number[];
  /** Divider/shadow class applied to the frozen first cell while horizontally scrolled. */
  stickyIndicator: string;
  thresholdMap: Map<string, import('@/modules/admin/api/thresholdApi').KpiThreshold>;
  visibleKpiCodes: (string | null)[];
}) {
  const hasChildren = row.children && row.children.length > 0;
  const name = String(row.cells[0]);
  const expanded = expandedRows.has(name);

  return (
    <>
      <tr
        className={cn(
          "border-b border-gray-50 last:border-0 transition-colors",
          hasChildren
            ? "hover:bg-gray-50 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
            : "hover:bg-gray-50/50",
          depth > 0 && "bg-gray-50/30",
        )}
        role={hasChildren ? "button" : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        aria-expanded={hasChildren ? expanded : undefined}
        aria-label={
          hasChildren
            ? `${expanded ? "Collapse" : "Expand"} ${name}`
            : undefined
        }
        onClick={() => hasChildren && onToggle(name)}
        onKeyDown={(e) => {
          if (hasChildren && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onToggle(name);
          }
        }}
      >
        <td
          className={cn(
            "py-2.5 pr-3 font-medium text-gray-900 whitespace-nowrap sticky left-0 z-10 bg-white",
            stickyIndicator,
          )}
        >
          {/* eslint-disable no-restricted-syntax -- dynamic padding for tree depth */}
          <div
            className="flex items-center gap-1.5"
            style={{ paddingLeft: depth * NAME_COL_INDENT_PX }}
          >
            {/* eslint-enable no-restricted-syntax */}
            {hasChildren &&
              (expanded ? (
                <ChevronDown
                  className="w-4 h-4 text-gray-400 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <ChevronRight
                  className="w-4 h-4 text-gray-400 shrink-0"
                  aria-hidden="true"
                />
              ))}
            {!hasChildren && (
              <span className="w-4 shrink-0" aria-hidden="true" />
            )}
            <span
              className={
                depth === 0
                  ? "font-semibold"
                  : depth === 1
                    ? "font-medium text-gray-700"
                    : "font-normal text-gray-600"
              }
            >
              {row.cells[0]}
            </span>
          </div>
        </td>
        {visibleIndices.map((idx, j) => {
          const cellVal = row.cells[idx + 1];
          const kpiCode = visibleKpiCodes[j] ?? null;
          const threshold = kpiCode ? thresholdMap.get(kpiCode) : null;
          const numVal = typeof cellVal === 'number' ? cellVal : parseFloat(String(cellVal ?? '').replace(/[^0-9.-]/g, ''));
          const rag = threshold && Number.isFinite(numVal) && cellVal !== '—' && cellVal != null ? classifyRag(numVal, threshold) : null;
          return (
            <td
              key={j}
              className={cn("py-2.5 px-3 text-right tabular-nums whitespace-nowrap", ragToTextClass(rag))}
            >
              {cellVal}
            </td>
          );
        })}
      </tr>
      {expanded &&
        row.children?.map((child, i) => (
          <NestedDrilldownRow
            key={i}
            row={child}
            depth={depth + 1}
            expandedRows={expandedRows}
            onToggle={onToggle}
            visibleIndices={visibleIndices}
            stickyIndicator={stickyIndicator}
            thresholdMap={thresholdMap}
            visibleKpiCodes={visibleKpiCodes}
          />
        ))}
    </>
  );
}

function collectExpandableNames(rows: DrilldownTableRow[]): Set<string> {
  const names = new Set<string>();
  for (const row of rows) {
    if (row.children && row.children.length > 0) {
      names.add(String(row.cells[0]));
      for (const child of row.children) {
        if (child.children && child.children.length > 0) {
          names.add(String(child.cells[0]));
        }
      }
    }
  }
  return names;
}

// Recursive substring match across class + descendants
function rowMatchesQuery(row: DrilldownTableRow, q: string): boolean {
  if (!q) return true;
  const name = String(row.cells[0]).toLowerCase();
  if (name.includes(q)) return true;
  return (row.children ?? []).some((c) => rowMatchesQuery(c, q));
}

function DrilldownSection({ rows }: { rows: DrilldownTableRow[] }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const thresholdMap = useThresholds();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    setSortKey,
    setSortDir,
    filteredRows,
  } = useTableSearchSort(rows, {
    // searchField returns a flat string; we pre-filter using rowMatchesQuery for tree-aware matching
    searchField: (r) => {
      const collect = (row: DrilldownTableRow): string =>
        [String(row.cells[0]), ...(row.children ?? []).map(collect)].join(" ");
      return collect(r);
    },
    sortFields: DRILLDOWN_SORT_FIELDS,
    defaultSortDir: "desc",
  });

  // Override the simple .includes() with our recursive matcher (the hook's flat-string search above
  // already concatenates all child names, so matches still work — this just keeps the parent rows
  // visible when only a child name matches).
  const visibleRows = useMemo(
    () =>
      filteredRows.filter((r) =>
        rowMatchesQuery(r, search.trim().toLowerCase()),
      ),
    [filteredRows, search],
  );

  // Column show/hide — desktop only; disabled on mobile so cards keep all metrics.
  const {
    displayHeaders,
    visibleKeys,
    setVisibleKeys,
    defaultVisibleKeys,
    lockedKey,
    toggleable,
    valueIndexOf,
  } = useColumnVisibility(DRILLDOWN_HEADERS, {
    enabled: !isMobile,
    defaultVisibleCount: 6,
  });

  const columnItems = useMemo<ColumnItem[]>(
    () => [
      ...(lockedKey != null ? [{ key: lockedKey, label: lockedKey, locked: true }] : []),
      ...toggleable.map((h) => ({ key: h, label: h })),
    ],
    [lockedKey, toggleable],
  );

  // Indices into a row's metric cells (cells[1..]) for the visible columns, in order.
  const visibleIndices = useMemo(
    () => displayHeaders.slice(1).map((h) => valueIndexOf(h)),
    [displayHeaders, valueIndexOf],
  );

  // KPI codes for each visible column (aligned to visibleIndices).
  const allKpiCodes = useMemo(
    () => DRILLDOWN_HEADERS.slice(1).map((h) => HEADER_TO_KPI[h] ?? null),
    [],
  );
  const visibleKpiCodes = useMemo(
    () => visibleIndices.map((i) => allKpiCodes[i] ?? null),
    [visibleIndices, allKpiCodes],
  );

  // Fixed name-column width (from the full tree) → stable across expand/collapse.
  const nameColWidthPx = useMemo(
    () => estimateDrilldownNameColWidth(rows),
    [rows],
  );

  // Frozen-column divider/shadow only while horizontally scrolled.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) setIsScrolled(el.scrollLeft > 0);
  }, []);
  const stickyIndicator = isScrolled
    ? "border-r border-gray-300 shadow-[6px_0_10px_-4px_rgba(0,0,0,0.2)]"
    : "";

  const expandAll = () => {
    setExpandedRows(collectExpandableNames(visibleRows));
  };
  const collapseAll = () => setExpandedRows(new Set());

  const toggleRow = (name: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const expandCollapseButtons = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={expandAll}
        aria-label="Expand all rows"
      >
        <ChevronsUpDown className="w-4 h-4 mr-1.5" /> Expand
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={collapseAll}
        aria-label="Collapse all rows"
      >
        <ChevronsDownUp className="w-4 h-4 mr-1.5" /> Collapse
      </Button>
    </div>
  );

  const tableToolbar = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search sub categories..."
      sortColumns={displayHeaders.slice(1).map((h) => ({ key: h, label: h }))}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => {
        setSortKey(k);
        setSortDir(d);
      }}
    />
  );

  // Desktop: Expand/Collapse + TableToolbar + Columns inline next to the title.
  // Mobile: only Expand/Collapse next to title; TableToolbar moves below
  // (matches /dashboard's DrilldownTable.tsx pattern).
  const desktopActions = (
    <div className="flex items-center gap-3">
      {expandCollapseButtons}
      {tableToolbar}
      <ColumnFilterDropdown
        columns={columnItems}
        visibleKeys={visibleKeys}
        onApply={setVisibleKeys}
        defaultVisibleKeys={defaultVisibleKeys}
      />
    </div>
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Expand/Collapse hidden on mobile — cards drill into a detail page, not inline. */}
        <SectionHeader
          title={
            <>
              Sub-Category Performance{" "}
              <TableMetricsInfo metrics={Object.keys(DRILLDOWN_INFO_KEYS)} />
            </>
          }
        />
        <div>{tableToolbar}</div>
        {visibleRows.map((row) => {
          const name = String(row.cells[0]);
          const hasChildren = !!row.children?.length;
          return (
            <AOPMobileCard
              key={name}
              title={name}
              metrics={DRILLDOWN_NAV_HEADERS.slice(1, 4).map((h, idx) => ({
                label: h,
                value: String(row.cells[idx + 1] ?? ""),
              }))}
              onClick={() => {
                if (hasChildren) {
                  setSubcategoryDrill(row, DRILLDOWN_NAV_HEADERS, name);
                  navigate(
                    "/dashboard/subcategory/" + encodeURIComponent(name),
                  );
                }
              }}
              showChevron={hasChildren}
            />
          );
        })}
        {visibleRows.length === 0 && search && (
          <EmptyState
            title="No results"
            description={`No sub-categories matching "${search}"`}
            variant="neutral"
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title="Sub-Category Performance"
        actions={desktopActions}
      />
      {/* Fixed first column; metric columns fill the viewport. Min-width makes the
          table overflow (horizontal scroll) only once the visible columns can't fit.
          No negative-margin gutter — it would leave a strip left of the frozen column
          where scrolled cells bleed through (sticky pins to the content box).
          `isolate` scopes the frozen column's z-index to this table so it can't paint over
          the page's sticky header/tab bar (also z-20). */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-x-auto mt-3 isolate"
      >
        {/* eslint-disable no-restricted-syntax -- dynamic min-width + data-derived first-col width can't be static Tailwind */}
        <table
          className="w-full table-fixed text-sm"
          style={{
            minWidth: `${nameColWidthPx + (displayHeaders.length - 1) * MIN_METRIC_COL_PX}px`,
          }}
        >
          <colgroup>
            <col style={{ width: `${nameColWidthPx}px` }} />
            {displayHeaders.slice(1).map((_, i) => (
              <col key={i} />
            ))}
          </colgroup>
          {/* eslint-enable no-restricted-syntax */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {displayHeaders.map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "py-2.5 font-medium text-gray-500 whitespace-nowrap",
                    i === 0
                      ? cn("text-left pl-3 pr-3 sticky left-0 z-20 bg-gray-50", stickyIndicator)
                      : "text-right px-3",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      i > 0 && "w-full justify-end",
                    )}
                  >
                    {h}
                    {DRILLDOWN_INFO_KEYS[h] && (
                      <InfoHeaderIcon metricKey={DRILLDOWN_INFO_KEYS[h]} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && search ? (
              <tr>
                <td colSpan={displayHeaders.length} className="py-6">
                  <EmptyState
                    title="No results"
                    description={`No sub-categories matching "${search}"`}
                    variant="neutral"
                    className="py-6"
                  />
                </td>
              </tr>
            ) : (
              visibleRows.map((row, i) => (
                <NestedDrilldownRow
                  key={i}
                  row={row}
                  depth={0}
                  expandedRows={expandedRows}
                  onToggle={toggleRow}
                  visibleIndices={visibleIndices}
                  stickyIndicator={stickyIndicator}
                  thresholdMap={thresholdMap}
                  visibleKpiCodes={visibleKpiCodes}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------

export function CategoryPerformanceTab({
  filters,
}: {
  filters: CategoryDirectorFilters;
}) {
  const isMobile = useIsMobile();
  const setHeroKpis = useHeroKpiStore((s) => s.setHeroKpis);

  const { data, isLoading, isError, refetch } = useCategoryPerformance(filters);

  // Hoist the 6 hero KPI cards into the shared store on every successful fetch.
  // The Sell-Through tab reads from there so users don't pay a second fetch on
  // tab switch.
  useEffect(() => {
    if (data?.kpi_cards?.length) {
      setHeroKpis(data.kpi_cards);
    }
  }, [data, setHeroKpis]);

  // Adapter outputs (fall back to empty arrays during load/error so chart
  // surfaces stay mounted and skeletons handle the UX). Values come from the
  // API; if a tile's API code is missing we render "N/A" — no mock fallback.
  const perfKpiCards = useMemo<CategoryDirectorHealthKpi[]>(() => {
    return PERF_KPI_META.map((meta) => {
      const card = kpiByCode(data?.kpi_cards, meta.apiCode);
      const frame: CategoryDirectorHealthKpi = {
        id: meta.id,
        label: meta.label,
        value: "N/A",
        target: meta.target,
        status: "warning",
        trendDelta: 0,
        trendLabel: "vs LW",
        trendDirection: "flat",
        infoKey: meta.infoKey,
      };
      return apiKpiToCategoryDirectorHealthKpi(card, frame, {
        labelOverride: meta.labelOverride ? meta.label : undefined,
      });
    });
  }, [data?.kpi_cards]);

  // HIDDEN — weeklyData + lflData consumed by hidden charts below.
  // To unhide: uncomment.
  // const weeklyData = useMemo(() => weeklyChartToRecharts(data?.weekly_revenue_chart), [data?.weekly_revenue_chart]);
  const fpMdData = useMemo(
    () => fpMdChartToRecharts(data?.fp_vs_md_chart),
    [data?.fp_vs_md_chart],
  );
  const subcatRevData = useMemo(
    () => subcategoryRevenueChartToRecharts(data?.revenue_by_subcategory_chart),
    [data?.revenue_by_subcategory_chart],
  );
  const gmBySubcatData = useMemo(
    () => gmBySubcategoryChartToRecharts(data?.gm_by_subcategory_chart),
    [data?.gm_by_subcategory_chart],
  );
  const aopVsActualData = useMemo(
    () => aopVsActualChartToRecharts(data?.aop_vs_actual_chart),
    [data?.aop_vs_actual_chart],
  );
  // Single horizontal-bar chart with a metric toggle (Revenue ↔ GM%).
  // Shares the AOP chart's category filter (declared below) so picking a
  // category once filters both charts in this grid.
  const [subcatMetric, setSubcatMetric] = useState<SubcatMetric>("revenue");
  // AOP vs Actual — horizontal layout shares the SingleLineTick treatment so
  // long sub-category names render flush-left with truncation + tooltip,
  // matching the Revenue by Sub-Category chart in the same grid.
  //
  // Category filter: the BE `aop_vs_actual_chart` payload only carries
  // subcategory labels, not their parent category. We rebuild the mapping from
  // `subcategory_drilldown` and filter the chart in the FE. Default = first
  // category whose name matches /men.*apparel|menswear/i (per stakeholder
  // request 2026-06-01), with a fall-through to the first category alphabetically.
  const aopCategoryOptions = useMemo(
    () => categoryPickerOptions(data?.category_perf_table),
    [data?.category_perf_table],
  );
  const subcatToCatMap = useMemo(
    () => subcategoryToCategoryMap(data?.subcategory_drilldown),
    [data?.subcategory_drilldown],
  );
  // Each chart owns its category selector (independent). Options come from the
  // globally-filtered data, so when the global Category filter narrows to one
  // category every chart is constrained to it; when global = "all" the charts can
  // each show a different category. Empty state → default via pickEffectiveCategory.
  const [fpMdCategory, setFpMdCategory] = useState<string>("");
  const [subcatCategory, setSubcatCategory] = useState<string>("");
  const [aopCategory, setAopCategory] = useState<string>("");
  const effFpMd = pickEffectiveCategory(fpMdCategory, aopCategoryOptions);
  const effSubcat = pickEffectiveCategory(subcatCategory, aopCategoryOptions);
  const effAop = pickEffectiveCategory(aopCategory, aopCategoryOptions);

  const filteredAopData = useMemo(
    () =>
      effAop
        ? aopVsActualData.filter((r) => subcatToCatMap.get(r.name) === effAop)
        : aopVsActualData,
    [aopVsActualData, subcatToCatMap, effAop],
  );
  const filteredSubcatRev = useMemo(
    () =>
      effSubcat
        ? subcatRevData.filter((r) => subcatToCatMap.get(r.name) === effSubcat)
        : subcatRevData,
    [subcatRevData, subcatToCatMap, effSubcat],
  );
  const filteredGmBySubcat = useMemo(
    () =>
      effSubcat
        ? gmBySubcatData.filter((r) => subcatToCatMap.get(r.name) === effSubcat)
        : gmBySubcatData,
    [gmBySubcatData, subcatToCatMap, effSubcat],
  );
  const filteredFpMdData = useMemo(
    () =>
      effFpMd
        ? fpMdData.filter((r) => subcatToCatMap.get(r.name) === effFpMd)
        : fpMdData,
    [fpMdData, subcatToCatMap, effFpMd],
  );
  const subcatChartData = useMemo(() => {
    if (subcatMetric === "gmPct") return filteredGmBySubcat;
    if (subcatMetric === "grossRevenue") {
      return [...filteredSubcatRev]
        .map((r) => ({ name: r.name, value: r.gross }))
        .sort((a, b) => b.value - a.value);
    }
    return filteredSubcatRev;
  }, [subcatMetric, filteredSubcatRev, filteredGmBySubcat]);
  // Radial-bar view for every metric — ranked indigo arcs (biggest = darkest).
  const subcatPieData = useMemo(
    () => [...subcatChartData].sort((a, b) => b.value - a.value),
    [subcatChartData],
  );
  const subcatTotal = useMemo(
    () => subcatPieData.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    [subcatPieData],
  );
  // Largest value drives the angle scale (arc length ∝ value). GM% is a rate → no total/share.
  const subcatMax = useMemo(
    () =>
      subcatPieData.reduce((m, d) => Math.max(m, Number(d.value) || 0), 0) || 1,
    [subcatPieData],
  );
  const isRateMetric = subcatMetric === "gmPct";
  const aopAxisFontSize = isMobile ? 10 : 12;
  const aopChartAxisWidth = useMemo(
    () =>
      computeAxisWidth(
        filteredAopData.map((d) => d.name),
        aopAxisFontSize,
        isMobile ? 140 : 220,
      ),
    [filteredAopData, aopAxisFontSize, isMobile],
  );
  const fpMdAxisFontSize = isMobile ? 10 : 12;
  const fpMdChartAxisWidth = useMemo(
    () =>
      computeAxisWidth(
        filteredFpMdData.map((d) => d.name),
        fpMdAxisFontSize,
        isMobile ? 140 : 200,
      ),
    [filteredFpMdData, fpMdAxisFontSize, isMobile],
  );
  // const lflData = useMemo(() => lflChartToRecharts(data?.lfl_trend_chart), [data?.lfl_trend_chart]);
  const drilldownRows = useMemo(
    () =>
      subcategoryDrilldownToTree(
        data?.category_perf_table,
        data?.subcategory_drilldown,
      ),
    [data?.category_perf_table, data?.subcategory_drilldown],
  );

  if (isError) {
    return (
      <EmptyState
        title="Couldn't load Category Performance"
        description="The dashboard service didn't respond. Try again in a moment."
        icon={AlertCircle}
        action={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Retry
          </Button>
        }
      />
    );
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <DashboardKpiGrid>
          {PERF_KPI_META.map((meta) => (
            <Skeleton key={meta.id} className="h-[88px] w-full" />
          ))}
        </DashboardKpiGrid>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Skeleton className="h-[280px] w-full" />
          <Skeleton className="h-[280px] w-full" />
        </div>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[260px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DashboardKpiGrid>
        {perfKpiCards.map((kpi) => {
          const meta = PERF_KPI_META.find((m) => m.id === kpi.id);
          return (
            <MetricCard
              key={kpi.id}
              label={kpi.label}
              value={kpi.value}
              infoKey={kpi.infoKey}
              status={meta?.suppressStatus ? undefined : cdStatusToRag(kpi.status)}
              subtitle={cdKpiSubtitle(kpi)}
            />
          );
        })}
      </DashboardKpiGrid>

      {/* Charts -- 2x2 grid (2 charts hidden until data sign-off) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* HIDDEN — Weekly Revenue chart. To unhide: uncomment.
        <ChartCard title="Weekly Revenue" description="Actual vs Plan (₹ Cr)">
          <div className="h-[260px]">
            {weeklyData.length === 0 ? (
              <EmptyState description="No weekly revenue data for this window" className="h-full flex items-center justify-center" />
            ) : (
              <ResponsiveContainer width="100%" minWidth={0} height="100%">
                <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="week" tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_TICK }} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0} />
                  <YAxis tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
                  <Tooltip content={<ChartTooltipContent config={revenueChartConfig} valueFormatter={(v) => `₹${v} Cr`} />} />
                  <Legend content={<ChartLegendContent config={revenueChartConfig} />} />
                  <Bar dataKey="actual" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} barSize={isMobile ? 16 : 24} />
                  <Bar dataKey="plan" fill={CHART_BASELINE} radius={[4, 4, 0, 0]} barSize={isMobile ? 16 : 24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
        */}

        <ChartCard
          title="Full-Price vs Markdown Revenue"
          filterOptions={aopCategoryOptions}
          filterValue={effFpMd}
          onFilterChange={setFpMdCategory}
        >
          <div className="h-[260px]">
            {filteredFpMdData.length === 0 ? (
              <EmptyState
                description="No full-price vs markdown data for this window"
                className="h-full flex items-center justify-center"
              />
            ) : (
              <ResponsiveContainer width="100%" minWidth={0} height="100%">
                <BarChart
                  data={filteredFpMdData}
                  layout="vertical"
                  margin={{ top: 8, right: 12, bottom: 8, left: 5 }}
                  barCategoryGap={isMobile ? 4 : 8}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={CHART_GRID}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: CHART_AXIS_TICK }}
                    tickLine={false}
                    axisLine={false}
                    hide={isMobile}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={fpMdChartAxisWidth}
                    interval={0}
                    tick={(props) => (
                      <SingleLineTick
                        {...props}
                        fontSize={fpMdAxisFontSize}
                        maxChars={isMobile ? 18 : 26}
                        axisWidth={fpMdChartAxisWidth}
                      />
                    )}
                  />
                  <Tooltip content={<FpMdTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 8 }}
                    content={<ChartLegendContent config={fpMdChartConfig} />}
                  />
                  <Bar
                    dataKey="fullPrice"
                    fill={CHART_PRIMARY}
                    radius={[0, 4, 4, 0]}
                    barSize={isMobile ? 10 : 14}
                  />
                  <Bar
                    dataKey="markdown"
                    fill={CHART_SEQUENTIAL[2]}
                    radius={[0, 4, 4, 0]}
                    barSize={isMobile ? 10 : 14}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title={
            subcatMetric === "revenue"
              ? "Net Revenue by Sub-Category"
              : subcatMetric === "grossRevenue"
                ? "Gross Revenue by Sub-Category"
                : "Gross Margin by Sub-Category"
          }
          filterOptions={SUBCAT_METRIC_OPTIONS}
          filterValue={subcatMetric}
          onFilterChange={(v) => setSubcatMetric(v as SubcatMetric)}
          secondaryFilterOptions={aopCategoryOptions}
          secondaryFilterValue={effSubcat}
          onSecondaryFilterChange={setSubcatCategory}
          headerAction={<DrillMenu rowLabel="sub-categories" targets={getChartDrillTargets('category', { from: 'dashboard' })} />}
        >
          <div className="h-[260px]">
            {subcatChartData.length === 0 ? (
              <EmptyState
                description={
                  subcatMetric === "gmPct"
                    ? "No GM% data for this window"
                    : "No sub-category sales for this window"
                }
                className="h-full flex items-center justify-center"
              />
            ) : (
              // Radial bars for every metric — pie-like distinctiveness, but arc length =
              // magnitude (not share), so GM% (a rate) is valid too. Ranked indigo ramp.
              <div className="h-full flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:flex-1 min-w-0 h-[150px] sm:h-full">
                  <ResponsiveContainer width="100%" minWidth={0} height="100%">
                    <RadialBarChart
                      data={subcatPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius="30%"
                      outerRadius="100%"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, subcatMax]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        dataKey="value"
                        angleAxisId={0}
                        background={{ fill: CHART_GRID }}
                        cornerRadius={6}
                      >
                        {subcatPieData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_SEQUENTIAL[i % CHART_SEQUENTIAL.length]}
                          />
                        ))}
                      </RadialBar>
                      {/* Custom tooltip: radial payloads expose the row on `payload[0].payload`
                          (the shared tooltip would show the index "3" + dataKey "value").
                          Pinned to the empty top-left corner + cursor off so it never overlaps
                          the arcs or the centre label. */}
                      <Tooltip
                        cursor={false}
                        position={{ x: 4, y: 4 }}
                        wrapperStyle={{ outline: "none", zIndex: 10 }}
                        content={({ active, payload }) => {
                          if (!active || !payload || payload.length === 0)
                            return null;
                          const row = payload[0]?.payload as
                            | { name?: string; value?: number }
                            | undefined;
                          if (!row) return null;
                          const share =
                            subcatTotal > 0
                              ? (Number(row.value) / subcatTotal) * 100
                              : 0;
                          return (
                            <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 shadow-lg">
                              <div className="text-xs font-medium text-gray-900">
                                {row.name}
                              </div>
                              <div className="text-xs tabular-nums text-gray-600">
                                {isRateMetric
                                  ? `${row.value}%`
                                  : `₹${row.value} Cr · ${share.toFixed(0)}%`}
                              </div>
                            </div>
                          );
                        }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  {!isRateMetric && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        {`₹${subcatTotal >= 100 ? Math.round(subcatTotal) : subcatTotal.toFixed(1)} Cr`}
                      </span>
                      <span className="text-[10px] text-gray-500">Total</span>
                    </div>
                  )}
                </div>
                <ul className="w-full sm:w-[44%] shrink-0 space-y-1.5 overflow-y-auto max-h-full pr-1">
                  {subcatPieData.map((d, i) => {
                    const share =
                      subcatTotal > 0
                        ? (Number(d.value) / subcatTotal) * 100
                        : 0;
                    return (
                      <li
                        key={d.name}
                        className="flex items-center gap-2 text-xs"
                      >
                        {/* eslint-disable-next-line no-restricted-syntax -- dynamic slice colour from the chart ramp */}
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_SEQUENTIAL[i % CHART_SEQUENTIAL.length] }} />
                        <span className="truncate text-gray-600 flex-1 min-w-0">
                          {d.name}
                        </span>
                        <span className="tabular-nums text-gray-900 font-medium shrink-0">
                          {isRateMetric ? `${d.value}%` : `₹${d.value} Cr`}
                        </span>
                        {!isRateMetric && (
                          <span className="tabular-nums text-gray-400 shrink-0 w-9 text-right">
                            {share.toFixed(0)}%
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="AOP vs Actual by Sub-Category"
          className="lg:col-span-2"
          filterOptions={aopCategoryOptions}
          filterValue={effAop}
          onFilterChange={setAopCategory}
          headerAction={<DrillMenu rowLabel="sub-categories" targets={getChartDrillTargets('category', { from: 'dashboard' })} />}
        >
          <div className="h-[420px]">
            {filteredAopData.length === 0 ? (
              <EmptyState
                description="No AOP vs Actual data for this window"
                className="h-full flex items-center justify-center"
              />
            ) : (
              <ResponsiveContainer width="100%" minWidth={0} height="100%">
                <BarChart
                  data={filteredAopData}
                  layout="vertical"
                  margin={{ top: 8, right: 12, bottom: 8, left: 5 }}
                  barCategoryGap={isMobile ? 4 : 8}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={CHART_GRID}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: CHART_AXIS_TICK }}
                    tickLine={false}
                    axisLine={false}
                    hide={isMobile}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={aopChartAxisWidth}
                    interval={0}
                    tick={(props) => (
                      <SingleLineTick
                        {...props}
                        fontSize={aopAxisFontSize}
                        maxChars={isMobile ? 18 : 28}
                        axisWidth={aopChartAxisWidth}
                      />
                    )}
                  />
                  <Tooltip content={<AopVsActualTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 8 }}
                    content={
                      <ChartLegendContent config={aopVsActualChartConfig} />
                    }
                  />
                  <Bar
                    dataKey="actual"
                    fill={CHART_ACTUAL}
                    radius={[0, 4, 4, 0]}
                    barSize={isMobile ? 10 : 14}
                  />
                  <Bar
                    dataKey="plan"
                    fill={CHART_PLAN}
                    radius={[0, 4, 4, 0]}
                    barSize={isMobile ? 10 : 14}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        {/* HIDDEN — LFL Growth Trend chart. To unhide: uncomment.
        <ChartCard title="LFL Growth Trend" description="Like-for-like growth % vs target">
          <div className="h-[260px]">
            {lflData.length === 0 ? (
              <EmptyState description="No like-for-like data for this window" className="h-full flex items-center justify-center" />
            ) : (
              <ResponsiveContainer width="100%" minWidth={0} height="100%">
                <LineChart data={lflData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="week" tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_TICK }} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0} />
                  <YAxis tick={{ fontSize: 12, fill: CHART_AXIS_TICK }} tickLine={false} axisLine={false} hide={isMobile} />
                  <Tooltip content={<ChartTooltipContent config={lflChartConfig} valueFormatter={(v) => `${v}%`} />} />
                  <Legend content={<ChartLegendContent config={lflChartConfig} />} />
                  <Line type="monotone" dataKey="actual" stroke={CHART_PRIMARY} strokeWidth={2} dot={{ r: 3, fill: CHART_PRIMARY }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="target" stroke={CHART_BASELINE} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
        */}
      </div>

      <DrilldownSection rows={drilldownRows} />
    </div>
  );
}
