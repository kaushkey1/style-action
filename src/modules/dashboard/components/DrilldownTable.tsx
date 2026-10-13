import { useState, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronRight, ChevronDown, ChevronsUpDown, ChevronsDownUp } from "lucide-react";
import { Button, EmptyState, InfoHeaderIcon, SectionHeader, TableToolbar, TableMetricsInfo } from "@/components/ui";
import { useTableSearchSort } from "@/hooks/useTableSearchSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useThresholds } from "@/hooks/useThresholds";
import { cn, measureTextWidth, classifyRag, ragToTextClass } from "@/lib/utils";
import { ColumnFilterDropdown } from "@/modules/store-view/components/ColumnFilterDropdown";
import type { ColumnItem } from "@/modules/store-view/components/ColumnFilterDropdown";
import type { DrilldownRow } from "../types/businessPulseUi";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DrilldownTableProps {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: DrilldownRow[];
  /** Show search + sort toolbar above the table */
  searchable?: boolean;
  /** Prefix for URL search params that persist sort state (e.g. "bpSegment") */
  sortUrlParamPrefix?: string;
  /** Default sort column when no URL state is present (defaults to first metric). */
  defaultSortKey?: string;
  /** Enable the desktop "Columns" show/hide control. */
  enableColumnManagement?: boolean;
  /** Total columns visible by default (locked first column + N-1 metrics). */
  defaultVisibleColumns?: number;
  /** Optional per-row drill affordance, rendered hover-revealed in the name cell. */
  rowActions?: (ctx: { row: DrilldownRow; depth: number; parentName?: string }) => React.ReactNode;
  /**
   * KPI codes aligned to headers.slice(1). Null entries skip RAG coloring for that column.
   * e.g. [null, null, "grossMargin", "avgSellThrough", "agedInventory"]
   */
  columnKpiCodes?: (string | null)[];
}

/** Re-map a row tree's `values` to a subset/reorder of columns by original value index. */
function projectRow(row: DrilldownRow, indices: number[]): DrilldownRow {
  return {
    ...row,
    values: indices.map((i) => (i >= 0 ? (row.values[i] ?? "") : "")),
    children: row.children?.map((c) => projectRow(c, indices)),
  };
}

// --- Stable name-column width ---------------------------------------------
// The name column width is fixed to fit the widest name across the WHOLE tree
// (parents + all children) so it does not jump when sub-rows expand/collapse.
const NAME_COL_INDENT_PX = 24; // per nesting depth (matches row indentation)
const NAME_COL_CHROME_PX = 52; // chevron + gap + cell padding
const NAME_COL_MIN_PX = 200;
const NAME_COL_MAX_PX = 480;
/** Minimum width per metric column before horizontal scroll appears. */
const MIN_METRIC_COL_PX = 150;

/** Pixel width needed for the name column to fit every row (collapsed or expanded). */
function estimateNameColWidth(rows: DrilldownRow[]): number {
  let max = 0;
  const walk = (rs: DrilldownRow[], depth: number): void => {
    for (const r of rs) {
      const w = measureTextWidth(r.name) + depth * NAME_COL_INDENT_PX + NAME_COL_CHROME_PX;
      if (w > max) max = w;
      if (r.children?.length) walk(r.children, depth + 1);
    }
  };
  walk(rows, 0);
  return Math.round(Math.min(Math.max(max, NAME_COL_MIN_PX), NAME_COL_MAX_PX));
}

// ---------------------------------------------------------------------------
// Helpers – collect all IDs in a tree
// ---------------------------------------------------------------------------

function collectAllIds(rows: DrilldownRow[]): string[] {
  const ids: string[] = [];
  for (const row of rows) {
    if (row.children?.length) {
      ids.push(row.id);
      ids.push(...collectAllIds(row.children));
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Flatten tree into <tr> array (keeps all rows in one <tbody>)
// ---------------------------------------------------------------------------

function flattenRows(
  rows: DrilldownRow[],
  depth: number,
  expanded: Set<string>,
  onToggle: (id: string) => void,
  nameIndicatorClass: string,
  thresholdMap: Map<string, import('@/modules/admin/api/thresholdApi').KpiThreshold>,
  columnKpiCodes: (string | null)[],
  renderActions?: (ctx: { row: DrilldownRow; depth: number; parentName?: string }) => React.ReactNode,
  parentName?: string,
): React.ReactNode[] {
  const result: React.ReactNode[] = [];

  for (const row of rows) {
    const hasChildren = Boolean(row.children?.length);
    const isExpanded = expanded.has(row.id);

    result.push(
      <tr
        key={row.id}
        className={cn(
          "group border-b border-gray-100 transition-colors",
          hasChildren && "cursor-pointer hover:bg-gray-50/50",
        )}
        onClick={hasChildren ? () => onToggle(row.id) : undefined}
        role={hasChildren ? "button" : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        onKeyDown={
          hasChildren
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggle(row.id);
                }
              }
            : undefined
        }
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-label={hasChildren ? `Expand ${row.name}` : undefined}
      >
        {/* Name cell with indentation + chevron — sticky + no-wrap so long sub-category names stay on one line */}
        <td className={cn("py-3 pl-3 pr-3 text-sm text-gray-900 whitespace-nowrap sticky left-0 z-10 bg-white", nameIndicatorClass)}>
          {/* eslint-disable-next-line no-restricted-syntax -- dynamic indentation depth for nested tree rows */}
          <span className="flex items-center gap-2" style={{ paddingLeft: depth * 24 }}>
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              )
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span
              className={cn(
                depth === 0 && "font-semibold",
                depth === 1 && "text-gray-700 font-medium",
                depth === 2 && "text-gray-600",
              )}
            >
              {row.name}
            </span>
          </span>
        </td>

        {/* Value cells */}
        {row.values.map((val, i) => {
          const kpiCode = columnKpiCodes[i] ?? null;
          const threshold = kpiCode ? thresholdMap.get(kpiCode) : null;
          const rag = threshold && val !== "—" ? classifyRag(parseNumericValue(val), threshold) : null;
          return (
            <td key={i} className={cn("py-3 px-3 text-sm text-right tabular-nums whitespace-nowrap", ragToTextClass(rag))}>
              {val}
            </td>
          );
        })}

        {/* Trailing drill column (always visible) */}
        {renderActions && (
          <td className="py-3 px-3 text-right align-middle">{renderActions({ row, depth, parentName })}</td>
        )}
      </tr>,
    );

    if (hasChildren && isExpanded) {
      result.push(...flattenRows(row.children!, depth + 1, expanded, onToggle, nameIndicatorClass, thresholdMap, columnKpiCodes, renderActions, row.name));
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function parseNumericValue(val: string): number {
  const match = val.match(/([\d.]+)\s*(K|L|Cr)?/i);
  if (!match || !match[1]) return 0;
  const n = parseFloat(match[1]);
  if (!Number.isFinite(n)) return 0;
  const unit = match[2]?.toUpperCase();
  if (unit === "CR") return n * 10_000_000;
  if (unit === "L") return n * 100_000;
  if (unit === "K") return n * 1_000;
  return n;
}

export function DrilldownTable({
  title,
  subtitle,
  headers,
  rows,
  searchable = false,
  sortUrlParamPrefix,
  defaultSortKey,
  enableColumnManagement = false,
  defaultVisibleColumns = 6,
  rowActions,
  columnKpiCodes = [],
}: DrilldownTableProps): React.ReactNode {
  const isMobile = useIsMobile();
  const thresholdMap = useThresholds();
  const [searchParams, setSearchParams] = useSearchParams();
  const expandedParamKey = "bpSegmentExpanded";
  const expandedMode = searchParams.get(expandedParamKey);
  const [expanded, setExpanded] = useState<Set<string>>(
    () =>
      new Set(
        expandedMode === "expanded" ? collectAllIds(rows) : [],
      ),
  );

  // Column show/hide (desktop). Disabled → all columns visible (no-op).
  const {
    displayHeaders,
    visibleKeys,
    setVisibleKeys,
    defaultVisibleKeys,
    lockedKey,
    toggleable,
    valueIndexOf,
  } = useColumnVisibility(headers, {
    enabled: enableColumnManagement,
    defaultVisibleCount: defaultVisibleColumns,
  });

  const columnItems = useMemo<ColumnItem[]>(
    () => [
      ...(lockedKey != null ? [{ key: lockedKey, label: lockedKey, locked: true }] : []),
      ...toggleable.map((h) => ({ key: h, label: h })),
    ],
    [lockedKey, toggleable],
  );

  // Re-map each row's values to the visible columns (in chosen order).
  const visibleIndices = useMemo(
    () => displayHeaders.slice(1).map((h) => valueIndexOf(h)),
    [displayHeaders, valueIndexOf],
  );
  const displayRows = useMemo(
    () => rows.map((r) => projectRow(r, visibleIndices)),
    [rows, visibleIndices],
  );

  // Project columnKpiCodes to match the visible column order.
  const visibleKpiCodes = useMemo(
    () => visibleIndices.map((i) => columnKpiCodes[i] ?? null),
    [visibleIndices, columnKpiCodes],
  );

  // Fixed name-column width (from the full tree) → stable across expand/collapse.
  const nameColWidthPx = useMemo(() => estimateNameColWidth(rows), [rows]);

  // Frozen-column divider/shadow only while horizontally scrolled.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) setIsScrolled(el.scrollLeft > 0);
  }, []);
  const headerStickyIndicator = isScrolled
    ? "border-r border-gray-300 shadow-[6px_0_10px_-4px_rgba(0,0,0,0.2)]"
    : "";
  const bodyStickyIndicator = isScrolled
    ? "border-r border-gray-300 shadow-[6px_0_10px_-4px_rgba(0,0,0,0.2)]"
    : "";

  // Build sort field extractors from the visible columns (values aligned to displayHeaders[1..]).
  const sortFields: Record<string, (row: DrilldownRow) => number> = {};
  displayHeaders.slice(1).forEach((h, i) => {
    sortFields[h] = (row: DrilldownRow) => parseNumericValue(row.values[i] ?? "0");
  });

  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } = useTableSearchSort(displayRows, {
    searchField: (row) => row.name,
    sortFields,
    sortUrlParamPrefix,
    defaultSortKey,
  });

  const toggleRow = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const nextParams = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : searchParams,
    );
    nextParams.set(expandedParamKey, "expanded");
    setSearchParams(nextParams, { replace: true });
    setExpanded(new Set(collectAllIds(rows)));
  }, [rows, searchParams, setSearchParams]);

  const collapseAll = useCallback(() => {
    const nextParams = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : searchParams,
    );
    nextParams.set(expandedParamKey, "collapsed");
    setSearchParams(nextParams, { replace: true });
    setExpanded(new Set());
  }, [searchParams, setSearchParams]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title={
          <>
            {title} <TableMetricsInfo metrics={displayHeaders.slice(1)} />
          </>
        }
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-3">
            {/* Expand/Collapse hidden on mobile — the drill-down renders as cards there. */}
            <div className="hidden lg:flex items-center gap-2">
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
            {searchable && !isMobile && (
              <TableToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search segments..."
                sortColumns={displayHeaders.slice(1).map((h) => ({ key: h, label: h }))}
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={(k, d) => {
                  setSortKey(k);
                  setSortDir(d);
                }}
              />
            )}
            {enableColumnManagement && !isMobile && (
              <ColumnFilterDropdown
                columns={columnItems}
                visibleKeys={visibleKeys}
                onApply={setVisibleKeys}
                defaultVisibleKeys={defaultVisibleKeys}
              />
            )}
          </div>
        }
      />
      {searchable && isMobile && (
        <div className="mt-3">
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search segments..."
            sortColumns={displayHeaders.slice(1).map((h) => ({ key: h, label: h }))}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={(k, d) => {
              setSortKey(k);
              setSortDir(d);
            }}
          />
        </div>
      )}

      {/* Fixed first column; metric columns fill the viewport. Min-width makes the
          table overflow (horizontal scroll) only once the visible columns can't fit.
          No negative-margin gutter — it would leave a strip left of the frozen column
          where scrolled cells bleed through (sticky pins to the content box).
          `isolate` scopes the frozen column's z-index to this table so it can't paint over
          the page's sticky header/tab bar (also z-20). */}
      <div ref={scrollRef} onScroll={handleScroll} className="overflow-x-auto mt-3 isolate">
        {/* eslint-disable no-restricted-syntax -- dynamic min-width + data-derived first-col width can't be static Tailwind */}
        <table
          className="w-full table-fixed text-sm"
          style={{ minWidth: `${nameColWidthPx + (displayHeaders.length - 1) * MIN_METRIC_COL_PX + (rowActions ? 52 : 0)}px` }}
        >
          <colgroup>
            <col style={{ width: `${nameColWidthPx}px` }} />
            {displayHeaders.slice(1).map((_, i) => (
              <col key={i} />
            ))}
            {rowActions && <col style={{ width: "52px" }} />}
          </colgroup>
          {/* eslint-enable no-restricted-syntax */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {displayHeaders.map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "py-2.5 font-medium text-gray-500 text-xs whitespace-nowrap",
                    i === 0
                      ? cn("text-left pl-3 pr-3 sticky left-0 z-20 bg-gray-50", headerStickyIndicator)
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
                    {i > 0 && <InfoHeaderIcon metricKey={h} />}
                  </span>
                </th>
              ))}
              {rowActions && (
                <th className="py-2.5 px-3"><span className="sr-only">Drill</span></th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={displayHeaders.length + (rowActions ? 1 : 0)} className="py-6">
                  <EmptyState
                    title="No category rows"
                    description="The API returned no revenue & margin rows for this filter set."
                    className="py-6"
                  />
                </td>
              </tr>
            ) : filteredRows.length === 0 && search ? (
              <tr>
                <td colSpan={displayHeaders.length + (rowActions ? 1 : 0)} className="py-6">
                  <EmptyState
                    title="No results"
                    description={`No segments matching "${search}"`}
                    variant="neutral"
                    className="py-6"
                  />
                </td>
              </tr>
            ) : (
              flattenRows(filteredRows, 0, expanded, toggleRow, bodyStickyIndicator, thresholdMap, visibleKpiCodes, rowActions, undefined)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
