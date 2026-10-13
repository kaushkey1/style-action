import { useMemo, useState, useRef, useCallback } from "react";
import { EmptyState, InfoHeaderIcon, SectionHeader, TableMetricsInfo, TableToolbar } from "@/components/ui";
import { useTableSearchSort } from "@/hooks/useTableSearchSort";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { useThresholds } from "@/hooks/useThresholds";
import { cn, classifyRag, ragToTextClass } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { ColumnFilterDropdown } from "@/modules/store-view/components/ColumnFilterDropdown";
import type { ColumnItem } from "@/modules/store-view/components/ColumnFilterDropdown";
import { AOPMobileCard } from "@/modules/aop/components/AOPMobileCard";
import type { SimpleTableConfig } from "../types/businessPulseUi";
import { MIN_METRIC_COL_PX, computeFirstColWidth, parseNumericValue } from "../utils/standardTable";

export interface StandardDataTableProps {
  config: SimpleTableConfig;
  searchable?: boolean;
  searchPlaceholder?: string;
  sortUrlParamPrefix?: string;
  defaultSortKey?: string;
  enableColumnManagement?: boolean;
  defaultVisibleColumns?: number;
  /**
   * Explicit frozen first-column width (px). When omitted, sizes to the longest
   * first-column label. Pass a shared value to optically align sibling tables.
   */
  firstColWidthPx?: number;
  /** Optional per-row drill affordance, rendered hover-revealed beside the first cell. */
  rowActions?: (row: string[]) => React.ReactNode;
  /**
   * KPI codes aligned to config.headers.slice(1). Null entries skip RAG coloring.
   * e.g. [null, null, "grossMargin", "avgSellThrough", "agedInventory"]
   */
  columnKpiCodes?: (string | null)[];
}

/**
 * Standardised CEO-dashboard leaf table: a frozen first column, metric columns
 * that fill the viewport (horizontal scroll only when they overflow), optional
 * show/hide column management (desktop only), search, and sort. On mobile it
 * renders metric cards (all columns) — column management is desktop-only.
 */
export function StandardDataTable({
  config,
  searchable = false,
  searchPlaceholder,
  sortUrlParamPrefix,
  defaultSortKey,
  enableColumnManagement = false,
  defaultVisibleColumns = 6,
  firstColWidthPx,
  rowActions,
  columnKpiCodes = [],
}: StandardDataTableProps): React.ReactNode {
  const isMobile = useIsMobile();
  const thresholdMap = useThresholds();
  const empty = config.rows.length === 0;

  // Column show/hide — desktop only; disabled on mobile so cards keep all metrics.
  const {
    displayHeaders,
    visibleKeys,
    setVisibleKeys,
    defaultVisibleKeys,
    lockedKey,
    toggleable,
    valueIndexOf,
  } = useColumnVisibility(config.headers, {
    enabled: enableColumnManagement && !isMobile,
    defaultVisibleCount: defaultVisibleColumns,
  });

  const columnItems = useMemo<ColumnItem[]>(
    () => [
      ...(lockedKey != null ? [{ key: lockedKey, label: lockedKey, locked: true }] : []),
      ...toggleable.map((h) => ({ key: h, label: h })),
    ],
    [lockedKey, toggleable],
  );

  // Project each row (string[]) to the visible columns: name + visible metrics in order.
  const visibleIndices = useMemo(
    () => displayHeaders.slice(1).map((h) => valueIndexOf(h)),
    [displayHeaders, valueIndexOf],
  );
  const displayRows = useMemo(
    () => config.rows.map((row) => [row[0] ?? "", ...visibleIndices.map((i) => row[i + 1] ?? "")]),
    [config.rows, visibleIndices],
  );

  // Project columnKpiCodes to match the visible column order.
  const visibleKpiCodes = useMemo(
    () => visibleIndices.map((i) => columnKpiCodes[i] ?? null),
    [visibleIndices, columnKpiCodes],
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

  // Fixed first-column width sized to fit the longest label (header + names), or an explicit override.
  const computedFirstColWidthPx = useMemo(
    () =>
      firstColWidthPx ??
      computeFirstColWidth([config.headers[0] ?? "", ...config.rows.map((row) => row[0] ?? "")]),
    [firstColWidthPx, config.headers, config.rows],
  );

  // Sort fields from the visible columns (values aligned to displayHeaders[1..]).
  const sortFields: Record<string, (row: string[]) => number> = {};
  displayHeaders.slice(1).forEach((h, i) => {
    sortFields[h] = (row: string[]) => parseNumericValue(row[i + 1] ?? "0");
  });

  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } = useTableSearchSort(
    displayRows,
    {
      searchField: (row) => row[0] ?? "",
      sortFields,
      sortUrlParamPrefix,
      defaultSortKey,
    },
  );

  const toolbarActions = searchable ? (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={searchPlaceholder ?? `Search ${config.title.toLowerCase()}...`}
      sortColumns={displayHeaders.slice(1).map((h) => ({ key: h, label: h }))}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => {
        setSortKey(k);
        setSortDir(d);
      }}
    />
  ) : null;

  if (empty) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title={config.title} />
        <EmptyState title="No data" description="The API returned no rows for this section." className="py-10" />
      </div>
    );
  }

  // Mobile: card view (all metrics — column management is desktop-only)
  if (isMobile) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title={
            <>
              {config.title} <TableMetricsInfo metrics={displayHeaders.slice(1)} />
            </>
          }
        />
        {toolbarActions ? <div>{toolbarActions}</div> : null}
        {filteredRows.map((row, idx) => (
          <AOPMobileCard
            key={idx}
            title={row[0] ?? "—"}
            metrics={row.slice(1).map((val, i) => ({
              label: displayHeaders[i + 1] ?? "",
              value: val,
            }))}
            onClick={() => {
              /* no drill-down for leaf tables */
            }}
            className="cursor-default"
            showChevron={false}
          />
        ))}
        {searchable && filteredRows.length === 0 && search && (
          <EmptyState title="No results" description={`No items matching "${search}"`} variant="neutral" />
        )}
      </div>
    );
  }

  // Desktop: table view — fixed first column; metric columns fill the viewport.
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title={config.title}
        actions={
          <div className="flex items-center gap-3">
            {toolbarActions}
            {enableColumnManagement && (
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
      {/* Min-width triggers horizontal scroll only when metric columns overflow the viewport.
          No negative-margin gutter — it would leave a strip left of the frozen column where
          scrolled cells bleed through (sticky pins to the content box, not the padding box).
          `isolate` scopes the frozen column's z-index to this table so it can't paint over the
          page's sticky header/tab bar (also z-20). */}
      <div ref={scrollRef} onScroll={handleScroll} className="overflow-x-auto mt-3 isolate">
        {/* eslint-disable no-restricted-syntax -- dynamic min-width + data-derived first-col width can't be static Tailwind */}
        <table
          className="w-full table-fixed text-sm"
          style={{ minWidth: `${computedFirstColWidthPx + (displayHeaders.length - 1) * MIN_METRIC_COL_PX + (rowActions ? 52 : 0)}px` }}
        >
          <colgroup>
            <col style={{ width: `${computedFirstColWidthPx}px` }} />
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
                    "py-2 font-medium text-gray-500 text-xs whitespace-nowrap",
                    i === 0
                      ? cn("text-left pl-3 pr-3 sticky left-0 z-20 bg-gray-50", stickyIndicator)
                      : "text-right px-3",
                  )}
                >
                  <span className={cn("inline-flex items-center gap-1", i > 0 && "w-full justify-end")}>
                    {h}
                    {i > 0 && <InfoHeaderIcon metricKey={h} />}
                  </span>
                </th>
              ))}
              {rowActions && (
                <th className="py-2 px-3"><span className="sr-only">Drill</span></th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-gray-50 last:border-0">
                {row.map((cell, cellIdx) => {
                  if (cellIdx === 0) {
                    return (
                      <td
                        key={cellIdx}
                        className={cn("py-2.5 text-sm pl-3 pr-3 font-medium text-gray-900 whitespace-nowrap sticky left-0 z-10 bg-white", stickyIndicator)}
                      >
                        {cell}
                      </td>
                    );
                  }
                  const kpiCode = visibleKpiCodes[cellIdx - 1] ?? null;
                  const threshold = kpiCode ? thresholdMap.get(kpiCode) : null;
                  const rag = threshold && cell !== "—" ? classifyRag(parseNumericValue(cell), threshold) : null;
                  return (
                    <td
                      key={cellIdx}
                      className={cn("py-2.5 text-sm px-3 text-right tabular-nums whitespace-nowrap", ragToTextClass(rag))}
                    >
                      {cell}
                    </td>
                  );
                })}
                {rowActions && (
                  <td className="py-2.5 px-3 text-right">{rowActions(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
