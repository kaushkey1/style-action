import React, { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  ChevronDown,
  Check,
  Download,
  Info,
} from "lucide-react";
import { FilterSearch, BottomSheet } from "@/components/ui";
import { cn } from "@/lib/utils";
import { METRIC_DESCRIPTIONS } from "@/data/metricDescriptions";
import { stripIndexPrefix } from "@/modules/category-director/lib/apiAdapters";

interface DetailKpi {
  label: string;
  value: string;
}

export interface DetailGroup {
  name: string;
  volume: number;
  asp: number;
  display_asp: string;
  value: number;
  display_value: string;
  net_revenue: number;
  display_net_revenue: string;
  intake_gm_pct: number;
  delivered_gm_pct: number;
  children: DetailGroupChild[];
}

export interface DetailGroupChild {
  name: string;
  volume: string;
  asp: string;
  grossRev: string;
  netRev: string;
  intakeGm: string;
  delGm: string;
}

interface BrickData {
  kpis: DetailKpi[];
  bricks: DetailGroupChild[];
}

// Metrics info button — shows all KPI descriptions in a BottomSheet
function MetricsInfoButton({
  metricKeys,
}: {
  metricKeys: string[];
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const entries = metricKeys
    .map((key) => {
      const entry = METRIC_DESCRIPTIONS[key];
      return entry
        ? { key, tooltip: entry.tooltip, formula: entry.formula }
        : null;
    })
    .filter(
      (e): e is { key: string; tooltip: string; formula: string } => e != null,
    );

  if (entries.length === 0) return <></>;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
        aria-label="Metric definitions"
      >
        <Info className="w-4 h-4" />
      </button>
      <BottomSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Metric Definitions"
        zIndex={90}
      >
        <div className="space-y-3 pb-4">
          {entries.map((e) => (
            <div
              key={e.key}
              className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
            >
              <p className="text-sm font-medium text-gray-900">{e.key}</p>
              <p className="text-sm text-gray-600 mt-0.5">{e.tooltip}</p>
              {e.formula && (
                <p className="text-xs text-gray-500 italic mt-1">
                  Formula: {e.formula}
                </p>
              )}
            </div>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

// Calendar bottom sheet for daily date picker
const MONTH_MAP: Record<string, { m: number; y: number }> = {
  apr26: { m: 3, y: 2026 },
  may26: { m: 4, y: 2026 },
  jun26: { m: 5, y: 2026 },
  jul26: { m: 6, y: 2026 },
  aug26: { m: 7, y: 2026 },
  sep26: { m: 8, y: 2026 },
  oct26: { m: 9, y: 2026 },
  nov26: { m: 10, y: 2026 },
  dec26: { m: 11, y: 2026 },
  jan27: { m: 0, y: 2027 },
  feb27: { m: 1, y: 2027 },
  mar27: { m: 2, y: 2027 },
};

export function CalendarBottomSheet({
  open,
  onClose,
  selectedMonth,
  selectedDay,
  months,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  selectedMonth: string;
  selectedDay: number;
  months: Array<{ id: string; label: string; short?: string }>;
  onSelect: (monthId: string, day: number) => void;
}): React.JSX.Element {
  const [viewMonth, setViewMonth] = useState(selectedMonth);

  // Sync view month when selected month changes
  React.useEffect(() => {
    setViewMonth(selectedMonth);
  }, [selectedMonth]);

  const mi = MONTH_MAP[viewMonth];
  const viewMonthObj = months.find((m) => m.id === viewMonth);
  const firstDay = mi ? new Date(mi.y, mi.m, 1).getDay() : 0; // 0=Sun
  const daysInMonth = mi ? new Date(mi.y, mi.m + 1, 0).getDate() : 30;

  const viewMonthIdx = months.findIndex((m) => m.id === viewMonth);
  const canPrev = viewMonthIdx > 0;
  const canNext = viewMonthIdx < months.length - 1;

  return (
    <BottomSheet isOpen={open} onClose={onClose} zIndex={70}>
      <div className="pb-4">
        {/* eslint-disable-next-line design-system/prefer-section-header -- calendar month nav, not a section header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            type="button"
            onClick={() =>
              canPrev && setViewMonth(months[viewMonthIdx - 1]!.id)
            }
            disabled={!canPrev}
            className={cn(
              "relative w-8 h-8 flex items-center justify-center rounded-lg text-base",
              canPrev
                ? "text-gray-600 hover:bg-gray-100"
                : "text-gray-400 cursor-not-allowed",
            )}
          >
            <span className="absolute -inset-1.5" aria-hidden="true" />
            &lsaquo;
          </button>
          <span className="text-sm font-semibold text-gray-900">
            {viewMonthObj?.label ?? viewMonth}
          </span>
          <button
            type="button"
            onClick={() =>
              canNext && setViewMonth(months[viewMonthIdx + 1]!.id)
            }
            disabled={!canNext}
            className={cn(
              "relative w-8 h-8 flex items-center justify-center rounded-lg text-base",
              canNext
                ? "text-gray-600 hover:bg-gray-100"
                : "text-gray-400 cursor-not-allowed",
            )}
          >
            <span className="absolute -inset-1.5" aria-hidden="true" />
            &rsaquo;
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <span
              key={d}
              className="text-xs text-gray-400 text-center font-medium py-1"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const isSelected =
              viewMonth === selectedMonth && day === selectedDay;
            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelect(viewMonth, day)}
                className={cn(
                  "w-full aspect-square flex items-center justify-center text-sm rounded-full transition-colors",
                  isSelected
                    ? "bg-primary text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}

// Month picker button — opens a BottomSheet at z-[70] to stack above the z-[60] portal
function MonthPickerButton({
  monthFilter,
}: {
  monthFilter: {
    selectedMonth: string;
    onMonthChange: (m: string) => void;
    months: Array<{ id: string; label: string; short?: string }>;
    isDaily?: boolean;
    selectedDay?: number;
    onDayChange?: (d: number) => void;
    getDays?: (
      monthId: string,
    ) => Array<{ id: string; day: number; label: string }>;
  };
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const monthObj = monthFilter.months.find(
    (m) => m.id === monthFilter.selectedMonth,
  );

  // Daily view: calendar bottom sheet
  if (monthFilter.isDaily) {
    const day = monthFilter.selectedDay ?? 1;
    const mIdx: Record<string, string> = {
      apr26: "04",
      may26: "05",
      jun26: "06",
      jul26: "07",
      aug26: "08",
      sep26: "09",
      oct26: "10",
      nov26: "11",
      dec26: "12",
      jan27: "01",
      feb27: "02",
      mar27: "03",
    };
    const yr: Record<string, string> = {
      apr26: "2026",
      may26: "2026",
      jun26: "2026",
      jul26: "2026",
      aug26: "2026",
      sep26: "2026",
      oct26: "2026",
      nov26: "2026",
      dec26: "2026",
      jan27: "2027",
      feb27: "2027",
      mar27: "2027",
    };
    const dayLabel = `${String(day).padStart(2, "0")}/${mIdx[monthFilter.selectedMonth] ?? "04"}/${yr[monthFilter.selectedMonth] ?? "2026"}`;
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 min-h-9 lg:h-8 px-2 text-base lg:text-xs rounded-lg border border-gray-300 bg-white text-gray-900 whitespace-nowrap shrink-0"
        >
          <CalendarDays className="w-3.5 h-3.5 text-gray-500" />
          <span>{dayLabel}</span>
        </button>
        <CalendarBottomSheet
          open={open}
          onClose={() => setOpen(false)}
          selectedMonth={monthFilter.selectedMonth}
          selectedDay={day}
          months={monthFilter.months}
          onSelect={(monthId, d) => {
            monthFilter.onMonthChange(monthId);
            monthFilter.onDayChange?.(d);
            setOpen(false);
          }}
        />
      </>
    );
  }

  // Monthly view: button + bottom sheet
  const selectedLabel = monthObj?.label ?? monthFilter.selectedMonth;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-between gap-1 min-h-9 lg:h-8 px-2 text-base lg:text-xs rounded-lg border border-gray-300 bg-white text-gray-900 whitespace-nowrap shrink-0"
      >
        <span>{selectedLabel}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      <BottomSheet isOpen={open} onClose={() => setOpen(false)} zIndex={70}>
        <div className="space-y-1 pb-4">
          {monthFilter.months.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                monthFilter.onMonthChange(m.id);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left text-sm min-h-12 transition-colors",
                monthFilter.selectedMonth === m.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-700 hover:bg-gray-50",
              )}
            >
              {m.label}
              {monthFilter.selectedMonth === m.id && (
                <Check className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

interface AOPRowDetailProps {
  title: string;
  kpis: DetailKpi[];
  groups: DetailGroup[];
  loading?: boolean;
  /** When set, skips L1 and starts directly at L2 for this group */
  initialGroup?: DetailGroup;
  onBack: () => void;
  onDownload?: () => void;
  /** Fetch brick breakdown for a sub-category. Returns KPIs + brick rows. */
  onFetchBricks?: (categoryName: string) => Promise<BrickData>;
  /** Month/date filter — shown in drill-down views when provided */
  monthFilter?: {
    selectedMonth: string;
    onMonthChange: (month: string) => void;
    months: Array<{ id: string; label: string; short?: string }>;
    isDaily?: boolean;
    selectedDay?: number;
    onDayChange?: (day: number) => void;
    getDays?: (
      monthId: string,
    ) => Array<{ id: string; day: number; label: string }>;
  };
}

export function AOPRowDetail({
  title,
  kpis,
  groups,
  loading,
  onBack,
  onDownload,
  onFetchBricks,
  initialGroup,
  monthFilter,
}: AOPRowDetailProps): React.JSX.Element {
  // Auto-skip L1 when there's only one group — go directly to L2
  const autoSkipGroup =
    !initialGroup && !loading && groups.length === 1 && groups[0]
      ? groups[0]
      : null;
  const [selectedGroup, setSelectedGroup] = useState<DetailGroup | null>(
    initialGroup ?? null,
  );

  // Effect: auto-select the single group when data loads
  React.useEffect(() => {
    if (autoSkipGroup && !selectedGroup) {
      setSelectedGroup(autoSkipGroup);
    }
  }, [autoSkipGroup, selectedGroup]);
  const [brickView, setBrickView] = useState<{
    childName: string;
    data: BrickData | null;
    loading: boolean;
  } | null>(null);

  // Search states for each drill-down level
  const [groupSearch, setGroupSearch] = useState("");
  const [childSearch, setChildSearch] = useState("");
  const [brickSearch, setBrickSearch] = useState("");

  // Lock body scroll while overlay is open (iOS-safe)
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overscrollBehavior = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleChildClick = useCallback(
    (child: DetailGroupChild) => {
      if (!onFetchBricks) return;
      setBrickSearch("");
      setBrickView({ childName: child.name, data: null, loading: true });
      onFetchBricks(child.name)
        .then((data) =>
          setBrickView((prev) =>
            prev ? { ...prev, data, loading: false } : null,
          ),
        )
        .catch(() =>
          setBrickView((prev) => (prev ? { ...prev, loading: false } : null)),
        );
    },
    [onFetchBricks],
  );

  // Filtered lists for each level
  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    const q = groupSearch.toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, groupSearch]);

  const filteredChildren = useMemo(() => {
    if (!selectedGroup) return [];
    if (!childSearch.trim()) return selectedGroup.children;
    const q = childSearch.toLowerCase();
    return selectedGroup.children.filter((c) =>
      c.name.toLowerCase().includes(q),
    );
  }, [selectedGroup, childSearch]);

  const filteredBricks = useMemo(() => {
    const bricks = brickView?.data?.bricks;
    if (!bricks?.length) return [];
    if (!brickSearch.trim()) return bricks;
    const q = brickSearch.toLowerCase();
    return bricks.filter((b) => b.name.toLowerCase().includes(q));
  }, [brickView, brickSearch]);

  // L3 — Brick breakdown view
  if (selectedGroup && brickView) {
    const breadcrumbParts = title === selectedGroup.name
      ? [title]
      : [title, selectedGroup.name];
    const breadcrumb = breadcrumbParts.map(stripIndexPrefix).join(' › ');
    return createPortal(
      <div className="fixed left-0 right-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] bottom-0 z-[35] bg-gray-50 overflow-y-auto overscroll-contain lg:hidden">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setBrickView(null)}
              className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-700"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 truncate">{breadcrumb}</p>
              <h2 className="text-base font-semibold text-gray-900 truncate">
                {stripIndexPrefix(brickView.childName)}
              </h2>
            </div>
            <MetricsInfoButton
              metricKeys={[
                "Volume",
                "ASP",
                "Gross Revenue (Cr)",
                "Net Revenue (Cr)",
                "Intake GM",
                "Delivered GM%",
                "AOP GM%",
              ]}
            />
            {onDownload && <DownloadButton onClick={onDownload} />}
          </div>
        </div>

        {brickView.loading && <LoadingShimmer />}

        {brickView.data && (
          <>
            {/* L3 KPIs */}
            <div className="p-4">
              {/* eslint-disable-next-line design-system/prefer-metric-grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {brickView.data.kpis.map((kpi) => (
                  <KpiCard
                    key={kpi.label}
                    label={kpi.label}
                    value={kpi.value}
                  />
                ))}
              </div>
            </div>

            {/* L3 Brick cards */}
            {brickView.data.bricks.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Brick Breakdown
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <FilterSearch
                      placeholder="Search bricks..."
                      value={brickSearch}
                      onChange={setBrickSearch}
                    />
                  </div>
                  {monthFilter && (
                    <MonthPickerButton monthFilter={monthFilter} />
                  )}
                </div>
                {filteredBricks.length === 0 && brickSearch && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No results for &ldquo;{brickSearch}&rdquo;
                  </p>
                )}
                <div className="space-y-3">
                  {filteredBricks.map((brick, idx) => (
                    <div
                      key={`${brick.name}-${idx}`}
                      className="bg-white rounded-lg border border-gray-200 p-3"
                    >
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        {brick.name}
                      </h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <MetricRow label="Vol" value={brick.volume} />
                        <MetricRow label="ASP" value={brick.asp} />
                        <MetricRow label="Gross Rev" value={brick.grossRev} />
                        <MetricRow label="Net Rev" value={brick.netRev} />
                        <MetricRow label="Intake GM" value={brick.intakeGm} />
                        <MetricRow label="Del GM%" value={brick.delGm} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>,
      document.body,
    );
  }

  // L2 — Group's sub-categories
  if (selectedGroup) {
    return createPortal(
      <div className="fixed left-0 right-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] bottom-0 z-[35] bg-gray-50 overflow-y-auto overscroll-contain lg:hidden">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() =>
                autoSkipGroup || initialGroup
                  ? onBack()
                  : setSelectedGroup(null)
              }
              className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-700"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              {title !== selectedGroup.name && (
                <p className="text-xs text-gray-500 truncate">{title}</p>
              )}
              <h2 className="text-base font-semibold text-gray-900 truncate">
                {selectedGroup.name}
              </h2>
            </div>
            <MetricsInfoButton
              metricKeys={[
                "Volume",
                "ASP",
                "Gross Revenue (Cr)",
                "Net Revenue (Cr)",
                "Intake GM",
                "Delivered GM%",
              ]}
            />
            {onDownload && <DownloadButton onClick={onDownload} />}
          </div>
        </div>

        <div className="p-4">
          {/* eslint-disable-next-line design-system/prefer-metric-grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <KpiCard
              label="Volume"
              value={formatVolume(selectedGroup.volume)}
            />
            <KpiCard label="ASP" value={selectedGroup.display_asp} />
            <KpiCard label="Value" value={selectedGroup.display_value} />
            <KpiCard
              label="Net Revenue"
              value={selectedGroup.display_net_revenue}
            />
            <KpiCard
              label="Intake GM"
              value={`${selectedGroup.intake_gm_pct.toFixed(1)}%`}
            />
            <KpiCard
              label="Delivered GM%"
              value={`${selectedGroup.delivered_gm_pct.toFixed(1)}%`}
            />
          </div>
        </div>

        {selectedGroup.children.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Breakdown
            </p>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <FilterSearch
                  placeholder="Search sub-categories..."
                  value={childSearch}
                  onChange={setChildSearch}
                />
              </div>
              {monthFilter && <MonthPickerButton monthFilter={monthFilter} />}
            </div>
            {filteredChildren.length === 0 && childSearch && (
              <p className="text-sm text-gray-500 text-center py-4">
                No results for &ldquo;{childSearch}&rdquo;
              </p>
            )}
            <div className="space-y-3">
              {filteredChildren.map((child, idx) => (
                <button
                  key={`${child.name}-${idx}`}
                  onClick={() => handleChildClick(child)}
                  disabled={!onFetchBricks}
                  className={cn(
                    "w-full text-left bg-white rounded-lg border border-gray-200 p-3",
                    onFetchBricks &&
                      "hover:border-primary/30 hover:shadow-md transition-all duration-200",
                    "focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {child.name}
                    </h4>
                    {onFetchBricks && (
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <MetricRow label="Vol" value={child.volume} />
                    <MetricRow label="ASP" value={child.asp} />
                    <MetricRow label="Gross Rev" value={child.grossRev} />
                    <MetricRow label="Net Rev" value={child.netRev} />
                    <MetricRow label="Intake GM" value={child.intakeGm} />
                    <MetricRow label="Del GM%" value={child.delGm} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>,
      document.body,
    );
  }

  // L1 — Group-level cards
  return createPortal(
    <div className="fixed left-0 right-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] bottom-0 z-[35] bg-gray-50 overflow-y-auto lg:hidden">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-700"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-gray-900 truncate flex-1">
            {title}
          </h2>
          <MetricsInfoButton metricKeys={kpis.map((k) => k.label)} />
          {onDownload && <DownloadButton onClick={onDownload} />}
        </div>
      </div>

      <div className="p-4">
        {/* eslint-disable-next-line design-system/prefer-metric-grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} />
          ))}
        </div>
      </div>

      {loading && <LoadingShimmer />}

      {!loading && groups.length > 0 && (
        <div className="px-4 pb-4 pb-safe">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <FilterSearch
                placeholder="Search..."
                value={groupSearch}
                onChange={setGroupSearch}
              />
            </div>
            {monthFilter && <MonthPickerButton monthFilter={monthFilter} />}
          </div>
          {filteredGroups.length === 0 && groupSearch && (
            <p className="text-sm text-gray-500 text-center py-4">
              No results for &ldquo;{groupSearch}&rdquo;
            </p>
          )}
          <div className="space-y-3">
            {filteredGroups.map((group) => (
              <button
                key={group.name}
                onClick={() => {
                  if (group.children.length > 0) {
                    setChildSearch("");
                    setSelectedGroup(group);
                  }
                }}
                className={cn(
                  "w-full text-left bg-white rounded-lg border border-gray-200 p-3",
                  group.children.length > 0 &&
                    "hover:border-primary/30 hover:shadow-md transition-all duration-200",
                  "focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2",
                )}
                disabled={group.children.length === 0}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {group.name}
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-gray-900 tabular-nums">
                      {group.display_value}
                    </span>
                    {group.children.length > 0 && (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <MetricRow
                    label="Volume"
                    value={formatVolume(group.volume)}
                  />
                  <MetricRow label="ASP" value={group.display_asp} />
                  <MetricRow
                    label="Net Rev"
                    value={group.display_net_revenue}
                  />
                  <MetricRow
                    label="Intake GM"
                    value={`${group.intake_gm_pct.toFixed(1)}%`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

function LoadingShimmer(): React.JSX.Element {
  return (
    <div className="px-4 pb-4">
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <span className="block text-sm font-medium tabular-nums text-gray-900">
        {value}
      </span>
    </div>
  );
}

function DownloadButton({
  onClick,
}: {
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
      aria-label="Download"
    >
      <Download className="w-4 h-4" />
    </button>
  );
}

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)} K`;
  return v.toFixed(2);
}
