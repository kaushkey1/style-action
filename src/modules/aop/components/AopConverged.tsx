/* CONVERGED AOP page (merged Target + Variance) — wired to the Variance Tracker API.
   Target mode shows actuals; the Variance toggle surfaces variance % + Actual|Plan.
   Any metric the API returns as null renders "-" (values) / "N/A" (variance). */
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, ArrowLeft, Info, Download, TrendingUp, TrendingDown } from "lucide-react";
import {
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  FilterDateRange,
  FilterMultiSelect,
  FilterClear,
  FilterSearch,
  MobileFilterTrigger,
  MobileFilterSheet,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  MetricCard,
  EmptyState,
  Skeleton,
  TableMetricsInfo,
} from "@/components/ui";
import type { FilterDef } from "@/components/ui";
import { PageInfoBanners } from "@/components/data-scope/PageInfoBanners";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { cn, getDataAvailableThroughDateIso } from "@/lib/utils";
import { MonthPicker } from "./MonthPicker";
import { AopDrillTable } from "./AopDrillTable";
import { useAopVarianceTracker } from "../api/aopApi";
import {
  GROUP_LABEL,
  METRIC_COLS,
  toneClass,
  toneBg,
  fmtVarPa,
  resolveGlossaryKey,
  transformSummary,
  DATA_NOTE,
  type MetricCol,
  type BreakdownRow,
  type DrillRow,
  type GroupKey,
  type PlanActual,
  type FilterOption,
} from "../data/varianceView";

type Timeframe = "daily" | "monthly" | "yearly";

/** Tabs in the order requested: Channel · Store · Category · Format. */
const TABS: { value: GroupKey; label: string }[] = [
  { value: "channel", label: "By Channel" },
  { value: "store", label: "By Store" },
  { value: "category", label: "By Category" },
  { value: "format", label: "By Format" },
];

/** Per-metric formatter lookup (from the shared column defs). */
const METRIC_COL_BY_KEY = Object.fromEntries(METRIC_COLS.map((c) => [c.key, c])) as Record<MetricCol["key"], MetricCol>;

/** Metrics on a breakdown card — abbreviated labels, prod order (Vol · ASP · Gross · Net · Intake · GM%). */
const CARD_METRICS: { key: MetricCol["key"]; label: string }[] = [
  { key: "volume", label: "Vol" },
  { key: "asp", label: "ASP" },
  { key: "grossRevenue", label: "Gross Rev" },
  { key: "netRevenue", label: "Net Rev" },
  { key: "intakeGm", label: "Intake GM" },
  { key: "gmPct", label: "GM%" },
];

/** Glossary keys for the breakdown-card columns — feeds the mobile "Metric Definitions"
 *  bottom sheet next to the breakdown title (same component the dashboard uses). */
const CARD_METRIC_GLOSSARY_KEYS = CARD_METRICS.map((m) => resolveGlossaryKey(METRIC_COL_BY_KEY[m.key].label));

/** KPI strip on the detail page — uppercase labels, prod order. */
const DETAIL_KPIS: { key: MetricCol["key"]; label: string }[] = [
  { key: "volume", label: "Volume" },
  { key: "asp", label: "Average Selling Price" },
  { key: "grossRevenue", label: "Gross Revenue" },
  { key: "netRevenue", label: "Net Revenue" },
  { key: "intakeGm", label: "Intake Gross Margin" },
  { key: "gmPct", label: "Gross Margin %" },
];

/**
 * Toggle transition (design-lab: T3 "staggered pop"). Scoped here; disabled under
 * prefers-reduced-motion. Applied to state-free content (KPI cards, mobile breakdown
 * cards) — the desktop table keeps its sort/expand state, so it is not remounted.
 */
const AOP_ANIM_CSS = `
.aop-anim { animation: aop-pop .24s cubic-bezier(0.16,1,0.3,1) both; }
.aop-stagger > *:nth-child(1){ animation-delay: 0ms; }
.aop-stagger > *:nth-child(2){ animation-delay: 40ms; }
.aop-stagger > *:nth-child(3){ animation-delay: 80ms; }
.aop-stagger > *:nth-child(4){ animation-delay: 120ms; }
.aop-stagger > *:nth-child(5){ animation-delay: 160ms; }
.aop-stagger > *:nth-child(6){ animation-delay: 200ms; }
.aop-stagger > *:nth-child(7){ animation-delay: 240ms; }
.aop-stagger > *:nth-child(8){ animation-delay: 280ms; }
@keyframes aop-pop { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .aop-anim { animation: none; } }
`;

/** The granularity Select trigger must match the filter triggers exactly so the toolbar
 *  row is one height. Mirrors the filter trigger classes (32px desktop / 44px mobile). */
const TIME_TRIGGER_CLS = "min-h-11 lg:min-h-8 h-8 px-3 text-base lg:text-xs";

/** Data starts at the beginning of FY26/27 (1 Apr 2026) — earlier dates/months aren't selectable. */
const DATA_START_DATE = "2026-04-01"; // ISO — daily date picker floor
const DATA_START_MONTH = "2026-04"; // YYYY-MM — month picker floor

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Selectable months from start→end (inclusive) as { value: "YYYY-MM", label: "Mon YYYY" }. */
function buildMonthOptions(startMonth: string, endMonth: string): FilterOption[] {
  const out: FilterOption[] = [];
  let y = Number(startMonth.slice(0, 4));
  let m = Number(startMonth.slice(5, 7));
  const ey = Number(endMonth.slice(0, 4));
  const em = Number(endMonth.slice(5, 7));
  while (y < ey || (y === ey && m <= em)) {
    out.push({ value: `${y}-${String(m).padStart(2, "0")}`, label: `${MONTH_ABBR[m - 1]} ${y}` });
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

/** Soft circular glow whose center sits well OFF the top-right corner (design-lab tuned).
 *  Rendered on a `::before` layer behind content; breathes on its own; reduced-motion aware. */
const GLOW_BASE =
  "relative isolate overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:content-[''] before:bg-radial-[circle_180px_at_110%_-10%] before:animate-[pulse_7s_ease-in-out_infinite] motion-reduce:before:animate-none";
const toneCardGradient: Record<PlanActual["tone"], string> = {
  positive: `${GLOW_BASE} before:from-success-500/15 before:to-success-500/0`,
  negative: `${GLOW_BASE} before:from-error-500/15 before:to-error-500/0`,
  neutral: "",
};

/** Distinct row names → filter options, preserving first-seen order. */
function toNameOptions(names: string[]): FilterOption[] {
  const seen = new Set<string>();
  const out: FilterOption[] = [];
  for (const name of names) {
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push({ value: name, label: name });
  }
  return out;
}

const parseMulti = (v: string): string[] => (v && v !== "all" ? v.split(",").filter(Boolean) : []);

// ─── Variance mode: Actual / Plan mini-block shown under a KPI value ──────────
function KpiVarianceBlock({ actual, plan }: { actual: string; plan: string }) {
  return (
    <div className="mt-2 flex items-end justify-between gap-3 border-t border-gray-100 pt-2">
      <div>
        <span className="block text-xs font-medium uppercase tracking-wide text-gray-400">Actual</span>
        <span className="text-sm font-semibold tabular-nums text-gray-900">{actual}</span>
      </div>
      <div className="text-right">
        <span className="block text-xs font-medium uppercase tracking-wide text-gray-400">Plan</span>
        <span className="text-sm font-semibold tabular-nums text-gray-700">{plan}</span>
      </div>
    </div>
  );
}

// ─── Mobile: one metric mini-cell in a breakdown card ─────────────────────────
function MobileMetricCell({ label, col, pa, variance }: { label: string; col: MetricCol; pa: PlanActual; variance: boolean }) {
  const f = col.format(pa);
  return (
    <div>
      <span className="block text-xs text-gray-500">{label}</span>
      {variance ? (
        <span className="mt-0.5 flex flex-col items-start gap-0.5">
          <span className={cn("inline-block rounded-lg px-1.5 py-0.5 text-xs font-medium tabular-nums", toneBg[pa.tone], toneClass[pa.tone])}>{fmtVarPa(pa)}</span>
          <span className="text-xs tabular-nums text-gray-500">{f.actual} · {f.plan}</span>
        </span>
      ) : (
        <span className="text-sm font-medium tabular-nums text-gray-900">{f.actual}</span>
      )}
    </div>
  );
}

// ─── Mobile: a breakdown card (tappable → drill when onOpen provided) ──────────
function MobileRowCard({ row, variance, onOpen }: { row: BreakdownRow; variance: boolean; onOpen?: () => void }) {
  const inner = (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="truncate text-base font-semibold text-gray-900">{row.name}</h3>
        {onOpen && <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {CARD_METRICS.map((m) => (
          <MobileMetricCell key={m.key} label={m.label} col={METRIC_COL_BY_KEY[m.key]} pa={row[m.key]} variance={variance} />
        ))}
      </div>
    </>
  );
  const base = "aop-anim block w-full rounded-lg border border-gray-200 bg-white p-3 text-left";
  return onOpen ? (
    <button
      type="button"
      onClick={onOpen}
      className={cn(base, "transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2")}
    >
      {inner}
    </button>
  ) : (
    <div className={base}>{inner}</div>
  );
}

// ─── Mobile: full-page category detail (prod layout — its own screen) ─────────
function MobileDetailPage({ row, variance, month, onMonthChange, onBack }: { row: DrillRow; variance: boolean; month: string; onMonthChange: (m: string) => void; onBack: () => void }) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const subs = (row.children ?? []).filter((s) => s.name.toLowerCase().includes(q));
  // Full-screen overlay (matches the dashboard drill-down): fixed z-[35] sits above the
  // z-30 MobileBottomBar so the bottom nav is hidden while drilled in — consistent with
  // SegmentDetailPage. Portaled to body so the fixed overlay escapes any ancestor stacking
  // context (AopConverged renders inside <main>).
  return createPortal(
    <div className="fixed left-0 right-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] bottom-0 z-[35] overflow-y-auto overscroll-contain rounded-t-xl bg-gray-50 lg:hidden">
      <style>{AOP_ANIM_CSS}</style>
      {/* Title bar — matches prod AOPRowDetail: sticky white app bar + bottom border, back · title · info · download. */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <button type="button" onClick={onBack} aria-label="Back" className="-ml-1.5 shrink-0 p-1.5 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 truncate text-base font-semibold text-gray-900">{row.name}</h2>
        <button type="button" aria-label="About these metrics" className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600"><Info className="h-4 w-4" /></button>
        <button type="button" aria-label="Download breakdown" className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600"><Download className="h-4 w-4" /></button>
      </div>

      <div className="space-y-5 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        {/* KPI strip — uppercase labels, 3-col (2 on the smallest phones) */}
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- custom variance detail cards (tone gradient + actual/plan line), not standard MetricCards */}
        <div key={variance ? "d-v" : "d-t"} className="aop-stagger grid grid-cols-2 gap-3 sm:grid-cols-3">
          {DETAIL_KPIS.map((k) => {
            const pa = row[k.key];
            const f = METRIC_COL_BY_KEY[k.key].format(pa);
            return (
              <div key={k.key} className={cn("aop-anim rounded-lg border border-gray-200 bg-white p-4", variance && toneCardGradient[pa.tone])}>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{k.label}</p>
                {variance ? (
                  <>
                    <p className={cn("mt-1 text-xl font-bold tabular-nums", toneClass[pa.tone])}>{fmtVarPa(pa)}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-gray-500">{f.actual} · plan {f.plan}</p>
                  </>
                ) : (
                  <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">{f.actual}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Breakdown — label + search + month, then sub-cards */}
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Breakdown</p>
          <div className="flex items-center gap-2">
            <FilterSearch value={search} onChange={setSearch} placeholder="Search sub-categories…" className="flex-1" />
            <MonthPicker value={month} onChange={onMonthChange} minMonth={DATA_START_MONTH} maxMonth={getDataAvailableThroughDateIso().slice(0, 7)} />
          </div>
          {subs.length > 0 ? (
            <div key={variance ? "s-v" : "s-t"} className="aop-stagger space-y-2">
              {subs.map((s) => (
                <MobileRowCard key={s.name} row={s} variance={variance} />
              ))}
            </div>
          ) : (
            <EmptyState title="No sub-categories" description={q ? `No sub-categories matching "${search}"` : "No sub-category breakdown available."} className="py-6" />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Mobile: breakdown card list (drill opens a full page via onOpenDetail) ───
function MobileBreakdown({ rows, variance, canDrill, onOpenDetail }: { rows: DrillRow[]; variance: boolean; canDrill: boolean; onOpenDetail: (row: DrillRow) => void }) {
  return (
    <div key={`l-${variance}`} className="aop-stagger space-y-2">
      {rows.map((r) => (
        <MobileRowCard
          key={r.name}
          row={r}
          variance={variance}
          onOpen={canDrill && r.children?.length ? () => onOpenDetail(r) : undefined}
        />
      ))}
    </div>
  );
}

// ─── Mobile: Variance Tracker (prod pattern — Top 5 / Bottom 5 ranked performers) ─
function MobileVarianceTracker({ rows }: { rows: BreakdownRow[] }) {
  const [mode, setMode] = useState<"bottom" | "top">("bottom");
  const [metricKey, setMetricKey] = useState<MetricCol["key"]>("volume");
  const col = METRIC_COL_BY_KEY[metricKey];
  // Rank by the selected metric's variance %: worst-first for Bottom, best-first for Top.
  const ranked = [...rows].sort((a, b) => a[metricKey].varPct - b[metricKey].varPct);
  const list = (mode === "bottom" ? ranked : [...ranked].reverse()).slice(0, 5);
  return (
    <div className="space-y-3">
      {/* Bottom/Top toggle + metric selector */}
      <div className="flex items-center justify-between gap-2">
        <div role="tablist" aria-label="Performer ranking" className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {([["bottom", "Bottom 5"], ["top", "Top 5"]] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={mode === k}
              onClick={() => setMode(k)}
              className={cn("min-h-9 rounded-lg px-3 text-sm font-medium transition-colors", mode === k ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
            >
              {label}
            </button>
          ))}
        </div>
        <Select value={metricKey} onValueChange={(v) => setMetricKey(v as MetricCol["key"])}>
          <SelectTrigger className="min-h-9 w-44 shrink-0 whitespace-nowrap" aria-label="Rank by metric"><SelectValue /></SelectTrigger>
          <SelectContent>
            {METRIC_COLS.map((c) => (
              <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ranked performer cards — standalone (no outer container), consistent with the KPI cards */}
      <h3 className="text-sm font-semibold text-gray-900">
        {mode === "bottom" ? "Bottom 5 Underperformers" : "Top 5 Performers"}
      </h3>
      <div key={`${mode}-${metricKey}`} className="aop-stagger space-y-2">
        {list.map((r) => {
          const pa = r[metricKey];
          const f = col.format(pa);
          const Icon = pa.tone === "positive" ? TrendingUp : pa.tone === "negative" ? TrendingDown : null;
          return (
            <div key={r.name} className="aop-anim rounded-lg border border-gray-200 bg-white p-4">
              <h4 className="text-base font-semibold text-gray-900">{r.name}</h4>
              {/* eslint-disable-next-line design-system/prefer-metric-grid -- Plan/Actual/Variance triple, not a KPI grid */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-500">Plan</p>
                  <p className="mt-0.5 text-sm tabular-nums text-gray-900">{f.plan}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Actual</p>
                  <p className="mt-0.5 text-sm tabular-nums text-gray-900">{f.actual}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Variance</p>
                  <p className={cn("mt-0.5 flex items-center gap-1 text-sm font-semibold tabular-nums", toneClass[pa.tone])}>
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {fmtVarPa(pa)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Loading skeletons ────────────────────────────────────────────────────────
function KpiSkeleton({ variance }: { variance: boolean }) {
  return (
    <div className={cn("grid gap-3", variance ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-2 md:grid-cols-3")}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-6 w-24" />
          {variance && <Skeleton className="mt-3 h-9 w-full" />}
        </div>
      ))}
    </div>
  );
}

function BreakdownSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <Skeleton className="h-5 w-48" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function AopConverged({ initialVariance = false }: { initialVariance?: boolean } = {}) {
  const [variance, setVariance] = useState(initialVariance);
  const [tab, setTab] = useState<GroupKey>("channel");
  const [timeframe, setTimeframe] = useState<Timeframe>("monthly");
  const [month, setMonth] = useState("2026-05");
  // Daily view date — defaults to the latest date with available data (T-2).
  const [day, setDay] = useState<string>(() => getDataAvailableThroughDateIso());
  const isMobile = useIsMobile();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileDetail, setMobileDetail] = useState<DrillRow | null>(null);

  // Per-tab dimension filters (multi-select, "all" = no filter applied)
  const [catFilter, setCatFilter] = useState("all");
  const [subcatFilter, setSubcatFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");

  // ── Data ──────────────────────────────────────────────────────────────────
  const periodType = timeframe === "yearly" ? "ytd" : timeframe === "daily" ? "wtd" : "mtd";
  const { data, isLoading, isError, error } = useAopVarianceTracker({
    groupBy: tab,
    periodType,
    ...(timeframe === "monthly" ? { monthYear: month } : {}),
    ...(timeframe === "daily" ? { fromDate: day, toDate: day } : {}),
  });
  const allRows = useMemo<DrillRow[]>(() => data?.rows ?? [], [data]);
  // On error / no data, fall back to 6 all-"-" KPI cards so the layout holds.
  const kpis = data?.kpis ?? (isLoading ? [] : transformSummary([]));

  // ── Filter options (derived from the fetched rows) ──────────────────────────
  const primaryOptions = useMemo(() => toNameOptions(allRows.map((r) => r.name)), [allRows]);
  const subcatOptions = useMemo(() => {
    if (tab !== "category") return [];
    const selectedCats = parseMulti(catFilter);
    const src = selectedCats.length ? allRows.filter((r) => selectedCats.includes(r.name)) : allRows;
    return toNameOptions(src.flatMap((r) => (r.children ?? []).map((c) => c.name)));
  }, [tab, allRows, catFilter]);

  // ── Client-side filtering (the VT API has no dimension params) ───────────────
  const drillRows = useMemo<DrillRow[]>(() => {
    if (tab === "category") {
      const catValues = parseMulti(catFilter);
      const subValues = parseMulti(subcatFilter);
      let out = catValues.length ? allRows.filter((r) => catValues.includes(r.name)) : allRows;
      if (subValues.length) {
        out = out
          .map((r) => ({ ...r, children: (r.children ?? []).filter((c) => subValues.includes(c.name)) }))
          .filter((r) => (r.children?.length ?? 0) > 0);
      }
      return out;
    }
    const raw = tab === "channel" ? channelFilter : tab === "store" ? storeFilter : formatFilter;
    const values = parseMulti(raw);
    return values.length ? allRows.filter((r) => values.includes(r.name)) : allRows;
  }, [tab, allRows, catFilter, subcatFilter, channelFilter, storeFilter, formatFilter]);

  // Active-filter check + clear for the current tab's dimension filter(s).
  const isActive = (v: string): boolean => !!v && v !== "all";
  const tabFiltersActive =
    tab === "category" ? isActive(catFilter) || isActive(subcatFilter)
    : tab === "channel" ? isActive(channelFilter)
    : tab === "store" ? isActive(storeFilter)
    : isActive(formatFilter);
  const activeFilterCount =
    tab === "category" ? (isActive(catFilter) ? 1 : 0) + (isActive(subcatFilter) ? 1 : 0)
    : tab === "channel" ? (isActive(channelFilter) ? 1 : 0)
    : tab === "store" ? (isActive(storeFilter) ? 1 : 0)
    : isActive(formatFilter) ? 1 : 0;
  const clearFilters = (): void => {
    if (tab === "category") {
      setCatFilter("all");
      setSubcatFilter("all");
    } else if (tab === "channel") {
      setChannelFilter("all");
    } else if (tab === "store") {
      setStoreFilter("all");
    } else {
      setFormatFilter("all");
    }
  };

  // Mobile filter sheet: timeframe + per-tab dimension defs + values + apply.
  const timeframeDef: FilterDef = {
    type: "select",
    key: "timeframe",
    label: "Timeframe",
    options: [
      { value: "daily", label: "Daily" },
      { value: "monthly", label: "Monthly" },
      { value: "yearly", label: "Yearly" },
    ],
  };
  const dimensionDefs: FilterDef[] =
    tab === "category" ? [
      { type: "multiselect", key: "category", label: "Category", options: primaryOptions },
      { type: "multiselect", key: "subcategory", label: "Sub-category", options: subcatOptions },
    ]
    : tab === "channel" ? [{ type: "multiselect", key: "channel", label: "Channel", options: primaryOptions }]
    : tab === "store" ? [{ type: "multiselect", key: "store", label: "Store", options: primaryOptions }]
    : [{ type: "multiselect", key: "format", label: "Format", options: primaryOptions }];
  const maxMonth = getDataAvailableThroughDateIso().slice(0, 7);
  const periodDefs: FilterDef[] =
    timeframe === "monthly" ? [{ type: "select", key: "month", label: "Month", options: buildMonthOptions(DATA_START_MONTH, maxMonth) }]
    : timeframe === "daily" ? [{ type: "daterange", key: "day", label: "Date", minDate: DATA_START_DATE, maxDate: getDataAvailableThroughDateIso() }]
    : [];
  const mobileFilterDefs: FilterDef[] = [timeframeDef, ...periodDefs, ...dimensionDefs];
  const toVal = (v: string): string => (isActive(v) ? v : "");
  const mobileFilterValues: Record<string, string> = {
    timeframe,
    ...(timeframe === "monthly" ? { month } : timeframe === "daily" ? { day: `${day}|${day}` } : {}),
    ...(tab === "category" ? { category: toVal(catFilter), subcategory: toVal(subcatFilter) }
    : tab === "channel" ? { channel: toVal(channelFilter) }
    : tab === "store" ? { store: toVal(storeFilter) }
    : { format: toVal(formatFilter) }),
  };
  const applyMobileFilters = (v: Record<string, string>): void => {
    if (v.timeframe) setTimeframe(v.timeframe as Timeframe);
    if (v.month) setMonth(v.month);
    if (v.day) {
      const from = v.day.split("|")[0];
      if (from) setDay(from);
    }
    if (tab === "category") {
      setCatFilter(v.category || "all");
      setSubcatFilter(v.subcategory || "all");
    } else if (tab === "channel") {
      setChannelFilter(v.channel || "all");
    } else if (tab === "store") {
      setStoreFilter(v.store || "all");
    } else {
      setFormatFilter(v.format || "all");
    }
  };

  const switchTab = (next: GroupKey): void => {
    setTab(next);
    setMobileDetail(null);
  };

  // Full-page category detail (prod pattern) — a dedicated screen, not an in-place panel.
  if (isMobile && mobileDetail) {
    return <MobileDetailPage row={mobileDetail} variance={variance} month={month} onMonthChange={setMonth} onBack={() => setMobileDetail(null)} />;
  }

  return (
    <div className="space-y-4">
      {/* Toggle transition keyframes — scoped, reduced-motion aware */}
      <style>{AOP_ANIM_CSS}</style>

      {/* ── Page header ── */}
      {/* eslint-disable-next-line design-system/prefer-section-header -- page title + variance toggle, not a section header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">AOP</h1>
        {/* Variance toggle — same on/off Switch on all breakpoints, right of the title */}
        <label htmlFor="aop-variance-toggle" className="flex items-center gap-2 min-h-11 lg:min-h-0 cursor-pointer">
          <span className="text-sm font-medium text-gray-700">Variance</span>
          <Switch id="aop-variance-toggle" checked={variance} onCheckedChange={(v) => { setVariance(v); setMobileDetail(null); }} aria-label="Toggle variance view" />
        </label>
      </div>

      {/* ── Data scope + glossary banners ── */}
      <PageInfoBanners note={DATA_NOTE} />

      {/* ── Sub-tabs — scrollable pill buttons on mobile (prod), underline tabs on desktop ── */}
      <div className="-mx-1 overflow-x-auto px-1 scrollbar-hide lg:hidden">
        <div className="flex items-center gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => switchTab(t.value)}
              aria-pressed={tab === t.value}
              className={cn(
                "min-h-11 shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                tab === t.value ? "bg-primary/10 text-primary" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="hidden lg:block">
        <Tabs value={tab} onValueChange={(v) => switchTab(v as GroupKey)}>
          <TabsList variant="underline">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} variant="underline">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* ── Filters: inline on desktop, bottom-sheet trigger on mobile ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Mobile: filter trigger → sheet */}
        <div className="lg:hidden">
          <MobileFilterTrigger activeCount={activeFilterCount} onOpen={() => setMobileFilterOpen(true)} />
        </div>
        {/* Desktop: inline dimension filters */}
        <div className="hidden flex-wrap items-center gap-2 lg:flex">
          {tab === "category" ? (
            <>
              <FilterMultiSelect value={catFilter} onChange={setCatFilter} options={primaryOptions} placeholder="All categories" />
              <FilterMultiSelect value={subcatFilter} onChange={setSubcatFilter} options={subcatOptions} placeholder="All sub-categories" />
            </>
          ) : tab === "channel" ? (
            <FilterMultiSelect value={channelFilter} onChange={setChannelFilter} options={primaryOptions} placeholder="All channels" />
          ) : tab === "store" ? (
            <FilterMultiSelect value={storeFilter} onChange={setStoreFilter} options={primaryOptions} placeholder="All stores" />
          ) : (
            <FilterMultiSelect value={formatFilter} onChange={setFormatFilter} options={primaryOptions} placeholder="All formats" />
          )}
          {tabFiltersActive && <FilterClear onClear={clearFilters} />}
        </div>

        {/* Time period — desktop only, inline next to the dimension filters; on mobile timeframe + period live inside the filter sheet */}
        <div className="hidden items-center gap-2 lg:flex">
          <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
            <SelectTrigger className={`${TIME_TRIGGER_CLS} w-32`} aria-label="Time period"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {timeframe === "daily" && (
            <FilterDateRange
              single
              hidePresets
              fromValue={day}
              toValue={day}
              onFromChange={setDay}
              onToChange={() => {}}
              minDate={DATA_START_DATE}
              maxDate={getDataAvailableThroughDateIso()}
            />
          )}
          {timeframe === "monthly" && (
            <MonthPicker value={month} onChange={setMonth} minMonth={DATA_START_MONTH} maxMonth={getDataAvailableThroughDateIso().slice(0, 7)} />
          )}
        </div>
      </div>

      <MobileFilterSheet
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        filters={mobileFilterDefs}
        values={mobileFilterValues}
        onApply={applyMobileFilters}
        onClear={clearFilters}
      />

      {/* ── Error banner ── */}
      {isError && (
        <div className="rounded-lg border border-error-500/30 bg-error-50 px-3 py-2 text-sm text-error-600">
          Failed to load AOP data{error instanceof Error ? `: ${error.message}` : "."}
        </div>
      )}

      {/* ── KPI strip — 1/row in variance (wide Actual|Plan block), else 2/row; 3/row desktop ── */}
      {isLoading ? (
        <KpiSkeleton variance={variance} />
      ) : (
        <div key={variance ? "kpi-v" : "kpi-t"} className={cn("aop-stagger grid gap-3", variance ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-2 md:grid-cols-3")}>
          {kpis.map((m) => (
            <div key={m.code} className="aop-anim">
              <MetricCard
                label={m.label}
                value={variance ? m.displayVar : m.displayActual}
                valueClassName={variance ? toneClass[m.value.tone] : undefined}
                className={variance ? toneCardGradient[m.value.tone] : undefined}
                infoKey={resolveGlossaryKey(m.label)}
              >
                {variance && <KpiVarianceBlock actual={m.displayActual} plan={m.displayPlan} />}
              </MetricCard>
            </div>
          ))}
        </div>
      )}

      {/* ── Breakdown — mobile (variance=Top/Bottom 5, target=drill cards) · desktop table ── */}
      {isLoading ? (
        <BreakdownSkeleton />
      ) : drillRows.length === 0 ? (
        <EmptyState
          title="No data available"
          description={`No ${GROUP_LABEL[tab].toLowerCase()} data for the selected period.`}
          className="rounded-lg border border-gray-200 bg-white py-10"
        />
      ) : isMobile ? (
        variance ? (
          <MobileVarianceTracker rows={drillRows} />
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {GROUP_LABEL[tab]} performance vs AOP
              <TableMetricsInfo metrics={CARD_METRIC_GLOSSARY_KEYS} />
            </h3>
            <MobileBreakdown key={tab} rows={drillRows} variance={false} canDrill={tab === "category"} onOpenDetail={setMobileDetail} />
          </div>
        )
      ) : (
        <AopDrillTable
          rows={drillRows}
          groupKey={tab}
          groupLabel={GROUP_LABEL[tab]}
          variance={variance}
          title={`${GROUP_LABEL[tab]} ${variance ? "variance vs AOP" : "performance vs AOP"}`}
        />
      )}
    </div>
  );
}
