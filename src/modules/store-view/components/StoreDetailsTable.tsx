import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pin, ChevronRight } from "lucide-react";
import {
  Badge,
  BottomSheet,
  EmptyState,
  InfoHeaderIcon,
  Pagination,
  SectionHeader,
  Skeleton,
  TableToolbar,
  TableMetricsInfo,
  DrillMenu,
} from "@/components/ui";
import {
  cn,
  formatNumber,
  formatCurrency,
  classifyRag,
  ragToTextClass,
} from "@/lib/utils";
import { getChartDrillTargets } from "@/lib/routing";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useThresholds } from "@/hooks/useThresholds";
import { StoreMobileCard } from "./StoreMobileCard";
import { ColumnFilterDropdown } from "./ColumnFilterDropdown";
import type { ColumnItem } from "./ColumnFilterDropdown";
import { npsKeys, fetchNPSScoresBulk } from "../api/npsApi";
import type {
  StoreListItem,
  StoreListResponse,
} from "../api/storePerformanceApi";

type SortDir = "asc" | "desc";

interface Column {
  key: string;
  label: string;
  tooltip: string;
  align: "left" | "right";
  sortable: boolean;
  defaultVisible: boolean;
  format: (item: StoreListItem) => string | number;
  sortValue: (item: StoreListItem) => number | string;
  className?: (item: StoreListItem) => string;
}

function n(v: number | null | undefined): number {
  return v ?? 0;
}

/** Unit-of-measure (₹, %, units) lives at the cell level — never in the column header. */
const COLUMNS: Column[] = [
  {
    key: "store",
    label: "Store",
    tooltip: "Store name, with store ID shown beneath.",
    align: "left",
    sortable: true,
    defaultVisible: true,
    format: (r) => r.store_name,
    sortValue: (r) => r.store_name,
  },
  {
    key: "grade",
    label: "Grade",
    tooltip:
      "Store performance grade assigned based on revenue and size (A, A1, B, etc.)",
    align: "left",
    sortable: true,
    defaultVisible: true,
    format: (r) => r.grade ?? "—",
    sortValue: (r) => r.grade ?? "",
  },
  {
    key: "aop",
    label: "AOP",
    tooltip: "Annual Operating Plan — revenue target for the selected period",
    align: "right",
    sortable: true,
    defaultVisible: true,
    format: (r) => formatCurrency(n(r.aop_gross_revenue)),
    sortValue: (r) => n(r.aop_gross_revenue),
  },
  {
    key: "actual",
    label: "Actual",
    tooltip: "Actual gross sales revenue achieved in the selected period",
    align: "right",
    sortable: true,
    defaultVisible: true,
    format: (r) => formatCurrency(n(r.total_gross_sales)),
    sortValue: (r) => n(r.total_gross_sales),
  },
  {
    key: "spsf",
    label: "SPSF",
    tooltip:
      "Sales Per Square Foot — gross revenue divided by usable floor area",
    align: "right",
    sortable: true,
    defaultVisible: true,
    format: (r) => formatNumber(Math.round(n(r.spsf))),
    sortValue: (r) => n(r.spsf),
  },
  {
    key: "over_90",
    label: ">90 Days",
    tooltip:
      "Number of options (styles) in-stock aged over 90 days — slow-moving inventory",
    align: "right",
    sortable: true,
    defaultVisible: true,
    format: (r) =>
      r.options_instock_age_over_90 != null
        ? formatNumber(r.options_instock_age_over_90)
        : "—",
    sortValue: (r) => n(r.options_instock_age_over_90),
  },
  {
    key: "fillrate",
    label: "Fill Rate",
    tooltip:
      "Fill rate — month closing stock quantity as a percentage of total capacity",
    align: "right",
    sortable: true,
    defaultVisible: true,
    format: (r) => (r.fillrate != null ? `${r.fillrate.toFixed(1)}%` : "—"),
    sortValue: (r) => n(r.fillrate),
  },
  {
    key: "nps_score",
    label: "NPS",
    tooltip:
      "Net Promoter Score — customer loyalty metric ranging from -100 to 100",
    align: "right",
    sortable: true,
    defaultVisible: true,
    format: () => "",
    sortValue: () => 0,
  },
  {
    key: "doh",
    label: "DOH",
    tooltip:
      "Days on hand — estimated days of stock remaining at current sales rate",
    align: "right",
    sortable: true,
    defaultVisible: true,
    format: (r) => (r.DOH != null ? String(Math.round(r.DOH)) : "—"),
    sortValue: (r) => n(r.DOH),
  },
  {
    key: "dead_capital",
    label: "Dead Capital",
    tooltip: "Capital locked in zero-sales / non-moving stock (₹)",
    align: "right",
    sortable: true,
    defaultVisible: true,
    format: (r) =>
      r.dead_capital != null ? formatCurrency(r.dead_capital) : "—",
    sortValue: (r) => n(r.dead_capital),
  },
  {
    key: "opportunity",
    label: "Opportunity",
    tooltip: "Estimated revenue opportunity — awaiting API data.",
    align: "right",
    sortable: false,
    defaultVisible: false,
    format: () => "—",
    sortValue: () => 0,
    className: () => "text-gray-400",
  },
  {
    key: "zero_sale",
    label: "Zero-Sale",
    tooltip: "Percentage of options with zero sales in the selected period",
    align: "right",
    sortable: true,
    defaultVisible: true,
    format: (r) =>
      r.zero_sales_option_pct != null
        ? `${r.zero_sales_option_pct.toFixed(1)}%`
        : "—",
    sortValue: (r) => n(r.zero_sales_option_pct),
  },
  {
    key: "city",
    label: "City",
    tooltip: "City where the store is located",
    align: "left",
    sortable: true,
    defaultVisible: false,
    format: (r) => r.city ?? "—",
    sortValue: (r) => r.city ?? "",
  },
  {
    key: "region",
    label: "Region",
    tooltip: "Geographic region the store reports to",
    align: "left",
    sortable: true,
    defaultVisible: false,
    format: (r) => r.region ?? "—",
    sortValue: (r) => r.region ?? "",
  },
  {
    key: "achv",
    label: "Achv",
    tooltip:
      "Achievement percentage — Actual revenue as a percentage of AOP target",
    align: "right",
    sortable: true,
    defaultVisible: false,
    format: (r) => `${n(r.gross_sales_achievement).toFixed(1)}%`,
    sortValue: (r) => n(r.gross_sales_achievement),
  },
  {
    key: "usable_sqft",
    label: "Usable Sq Ft",
    tooltip: "Total usable retail floor area in square feet",
    align: "right",
    sortable: true,
    defaultVisible: false,
    format: (r) => formatNumber(Math.round(n(r.total_usable_sqft))),
    sortValue: (r) => n(r.total_usable_sqft),
  },
  {
    key: "fresh_pct",
    label: "Fresh%",
    tooltip:
      "Percentage of inventory that is fresh (received within the last 45 days)",
    align: "right",
    sortable: true,
    defaultVisible: true,
    format: (r) => (r.fresh_pct != null ? `${r.fresh_pct.toFixed(1)}%` : "—"),
    sortValue: (r) => n(r.fresh_pct),
  },
  {
    key: "below_45",
    label: "<45 Days",
    tooltip: "Number of options (styles) in-stock aged less than 45 days",
    align: "right",
    sortable: true,
    defaultVisible: false,
    format: (r) =>
      r.options_instock_age_below_45 != null
        ? formatNumber(r.options_instock_age_below_45)
        : "—",
    sortValue: (r) => n(r.options_instock_age_below_45),
  },
  {
    key: "between_45_90",
    label: "45-90 Days",
    tooltip: "Number of options (styles) in-stock aged between 45 and 90 days",
    align: "right",
    sortable: true,
    defaultVisible: false,
    format: (r) =>
      r.options_instock_age_between_45_90 != null
        ? formatNumber(r.options_instock_age_between_45_90)
        : "—",
    sortValue: (r) => n(r.options_instock_age_between_45_90),
  },
  {
    key: "month_closing_stock_qty",
    label: "Closing Qty",
    tooltip:
      "Month closing stock quantity — total units in stock at end of month",
    align: "right",
    sortable: true,
    defaultVisible: false,
    format: (r) =>
      r.month_closing_stock_qty != null
        ? formatNumber(Math.round(r.month_closing_stock_qty))
        : "—",
    sortValue: (r) => n(r.month_closing_stock_qty),
  },
  {
    key: "age",
    label: "Age",
    tooltip: "Store age in months since opening",
    align: "right",
    sortable: true,
    defaultVisible: false,
    format: (r) =>
      r.store_age_months != null ? `${r.store_age_months} mo` : "—",
    sortValue: (r) => n(r.store_age_months),
  },
];

const PINNED_STORE_CODES = new Set(['5943', '8053', '8055', '8080', 'TE94']);

const LOCKED_KEYS = new Set(["store"]);
const TOGGLEABLE_COLUMNS = COLUMNS.filter((c) => !LOCKED_KEYS.has(c.key));
const DEFAULT_VISIBLE_KEYS = TOGGLEABLE_COLUMNS.filter(
  (c) => c.defaultVisible,
).map((c) => c.key);

const COLUMN_FILTER_ITEMS: ColumnItem[] = [
  { key: "store", label: "Store", locked: true },
  ...TOGGLEABLE_COLUMNS.map((c) => ({ key: c.key, label: c.label })),
];

/** Sort options for the TableToolbar sort popover (single-stack sort — no per-column header sorting). */
const SORT_COLUMNS = COLUMNS.filter((c) => c.sortable).map((c) => ({
  key: c.key,
  label: c.label,
}));
/** Metric labels for the glossary button (TableMetricsInfo). */
const METRIC_LABELS = COLUMNS.filter((c) => c.key !== "store").map(
  (c) => c.label,
);

interface StoreDetailsTableProps {
  data: StoreListResponse | undefined;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  npsFilterType?: string;
}

export function StoreDetailsTable({
  data,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  search,
  onSearchChange,
  npsFilterType = "last_month",
}: StoreDetailsTableProps): React.ReactNode {
  const isMobile = useIsMobile();
  const thresholds = useThresholds();
  const navigate = useNavigate();
  const location = useLocation();
  const isCommandContext = location.pathname.startsWith("/command/");
  const basePath = isCommandContext ? "/command/store-view" : "/store-view";
  const [sortKey, setSortKey] = useState<string | null>("actual");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  // Mobile drill-down bottom sheet — one shared sheet keyed by the selected store.
  const [drillStore, setDrillStore] = useState<StoreListItem | null>(null);
  const [visibleColumnKeys, setVisibleColumnKeys] =
    useState<string[]>(DEFAULT_VISIBLE_KEYS);

  const visibleColumns = useMemo(
    () =>
      COLUMNS.filter(
        (c) => LOCKED_KEYS.has(c.key) || visibleColumnKeys.includes(c.key),
      ).sort((a, b) => {
        if (LOCKED_KEYS.has(a.key) && LOCKED_KEYS.has(b.key)) return 0;
        if (LOCKED_KEYS.has(a.key)) return -1;
        if (LOCKED_KEYS.has(b.key)) return 1;
        return (
          visibleColumnKeys.indexOf(a.key) - visibleColumnKeys.indexOf(b.key)
        );
      }),
    [visibleColumnKeys],
  );

  const isCustomDateRange = ![
    "mtd",
    "wtd",
    "qtd",
    "ytd",
    "last_month",
  ].includes(npsFilterType);
  const { data: npsScoresMap } = useQuery({
    queryKey: npsKeys.scoresBulk(npsFilterType),
    queryFn: () => fetchNPSScoresBulk(npsFilterType),
    staleTime: 5 * 60 * 1000,
    enabled: !isCustomDateRange,
  });

  const sortedRows = useMemo(() => {
    const rows = data?.data ?? [];
    const col = sortKey ? COLUMNS.find((c) => c.key === sortKey) : null;
    const sorted = col
      ? [...rows].sort((a, b) => {
          let aVal: number | string;
          let bVal: number | string;
          if (sortKey === "nps_score") {
            aVal = npsScoresMap?.[a.store_code] ?? -1;
            bVal = npsScoresMap?.[b.store_code] ?? -1;
          } else {
            aVal = col.sortValue(a);
            bVal = col.sortValue(b);
          }
          const cmp =
            typeof aVal === "number" && typeof bVal === "number"
              ? aVal - bVal
              : String(aVal).localeCompare(String(bVal));
          return sortDir === "asc" ? cmp : -cmp;
        })
      : [...rows];

    const pinned = sorted.filter((r) => PINNED_STORE_CODES.has(r.store_code));
    const rest = sorted.filter((r) => !PINNED_STORE_CODES.has(r.store_code));
    return [...pinned, ...rest];
  }, [data, sortKey, sortDir, npsScoresMap]);

  const handleSortChange = (key: string | null, dir: SortDir): void => {
    setSortKey(key);
    setSortDir(dir);
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title={
            <>
              Store Details <TableMetricsInfo metrics={METRIC_LABELS} />
            </>
          }
        />
        <TableToolbar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search store name or ID..."
          sortColumns={SORT_COLUMNS}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={handleSortChange}
        />
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : sortedRows.length === 0 ? (
          <EmptyState
            title="No stores found"
            description={
              search
                ? `No stores matching "${search}"`
                : "No store data for the selected filters."
            }
            variant="neutral"
          />
        ) : (
          <>
            {sortedRows.map((r) => (
              <StoreMobileCard
                key={r.store_code}
                title={r.store_name}
                badge={
                  <Badge variant="default" className="shrink-0 tabular-nums">
                    {r.store_code}
                  </Badge>
                }
                metrics={[
                  { label: "Grade", value: r.grade ?? "—" },
                  {
                    label: "AOP",
                    value: formatCurrency(n(r.aop_gross_revenue)),
                  },
                  {
                    label: "Actual",
                    value: formatCurrency(n(r.total_gross_sales)),
                  },
                  {
                    label: ">90 Days",
                    value:
                      r.options_instock_age_over_90 != null
                        ? formatNumber(r.options_instock_age_over_90)
                        : "—",
                  },
                  { label: "SPSF", value: formatNumber(Math.round(n(r.spsf))) },
                  {
                    label: "Fill Rate",
                    value: r.fillrate != null ? `${r.fillrate.toFixed(1)}%` : "—",
                  },
                ]}
                onView={() =>
                  navigate(
                    `${basePath}/store/${r.store_code}${location.search}`,
                  )
                }
                onDrill={() => setDrillStore(r)}
              />
            ))}
            {data && (
              <Pagination
                currentPage={page}
                totalPages={data.total_pages}
                totalItems={data.total}
                pageSize={pageSize}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                pageSizeOptions={[10, 25, 50]}
              />
            )}
          </>
        )}
        <BottomSheet
          isOpen={drillStore != null}
          onClose={() => setDrillStore(null)}
          title={drillStore ? `Drill into ${drillStore.store_name}` : undefined}
        >
          <div className="space-y-1 pb-2">
            {drillStore &&
              getChartDrillTargets("store-category", {
                store: drillStore.store_code,
                from: "store-view",
              }).map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      const to = t.to;
                      setDrillStore(null);
                      navigate(to);
                    }}
                    className="flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-left transition-colors hover:bg-gray-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-900">{t.label}</span>
                      <span className="block truncate text-xs text-gray-500">{t.preview}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                  </button>
                );
              })}
          </div>
        </BottomSheet>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title={
          <>
            Store Details <TableMetricsInfo metrics={METRIC_LABELS} />
          </>
        }
        actions={
          <div className="flex items-center gap-3">
            <div className="w-[260px]">
              <TableToolbar
                search={search}
                onSearchChange={onSearchChange}
                searchPlaceholder="Search store name or ID..."
                sortColumns={SORT_COLUMNS}
                sortKey={sortKey}
                sortDir={sortDir}
                onSortChange={handleSortChange}
              />
            </div>
            <ColumnFilterDropdown
              columns={COLUMN_FILTER_ITEMS}
              visibleKeys={visibleColumnKeys}
              onApply={setVisibleColumnKeys}
              defaultVisibleKeys={DEFAULT_VISIBLE_KEYS}
            />
          </div>
        }
      />

      {/* Table — horizontal scroll only; vertical scroll follows the page */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gray-50 z-10",
                    col.align === "right" ? "text-right" : "text-left",
                    col.key === "store" && "left-0 z-20",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      col.align === "right" && "justify-end",
                    )}
                  >
                    {col.label}
                    <InfoHeaderIcon
                      metricKey={col.label}
                      description={col.tooltip}
                    />
                  </span>
                </th>
              ))}
              <th
                className="py-2.5 px-3 sticky top-0 bg-gray-50 z-10 w-10"
                aria-label="Drill-down actions"
              />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="py-2.5 px-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                  <td className="py-2.5 px-3">
                    <Skeleton className="h-4 w-6" />
                  </td>
                </tr>
              ))
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="py-8">
                  <EmptyState
                    title="No stores found"
                    description={
                      search
                        ? `No stores matching "${search}"`
                        : "No store data for the selected filters."
                    }
                    variant="neutral"
                  />
                </td>
              </tr>
            ) : (
              sortedRows.map((r) => (
                <tr
                  key={r.store_code}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 cursor-pointer"
                  onClick={() =>
                    navigate(
                      `${basePath}/store/${r.store_code}${location.search}`,
                    )
                  }
                >
                  {visibleColumns.map((col) => {
                    const value = col.format(r);
                    const extraClass = col.className?.(r);

                    if (col.key === "store") {
                      const isPinned = PINNED_STORE_CODES.has(r.store_code);
                      return (
                        <td
                          key={col.key}
                          className="py-2.5 px-3 sticky left-0 z-10 bg-white"
                        >
                          <div className="flex items-center gap-1.5">
                            {isPinned && (
                              <Pin className="h-3 w-3 shrink-0 text-gray-400" fill="currentColor" aria-label="Pinned store" />
                            )}
                            <span className="font-medium text-gray-900 whitespace-nowrap">
                              {r.store_name}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 tabular-nums">
                            {r.store_code}
                          </div>
                        </td>
                      );
                    }

                    if (col.key === "nps_score") {
                      const nps = npsScoresMap?.[r.store_code];
                      const npsRagClass = nps != null ? ragToTextClass(classifyRag(nps, thresholds.get('nps') ?? null)) : null;
                      return (
                        <td key={col.key} className={cn('py-2.5 px-3 text-right tabular-nums whitespace-nowrap', npsRagClass ?? 'text-gray-700', npsRagClass && 'font-semibold')}>
                          {nps != null ? nps : <span className="text-gray-400">—</span>}
                        </td>
                      );
                    }

                    if (col.key === "grade") {
                      const gradeVariant =
                        r.grade === "A"
                          ? "success"
                          : r.grade === "A1"
                            ? "primary"
                            : r.grade === "A2"
                              ? "warning"
                              : r.grade === "A3"
                                ? "error"
                                : ("default" as const);
                      return (
                        <td key={col.key} className="py-2.5 px-3">
                          {r.grade ? (
                            <Badge
                              variant={gradeVariant}
                              className="text-[10px]"
                            >
                              {r.grade}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      );
                    }

                    const ragClass = (() => {
                      switch (col.key) {
                        case 'achv':
                          return ragToTextClass(classifyRag(n(r.gross_sales_achievement), thresholds.get('gsAchievement') ?? null));
                        case 'fresh_pct':
                          return r.fresh_pct != null ? ragToTextClass(classifyRag(r.fresh_pct, thresholds.get('freshPercent') ?? null)) : null;
                        case 'spsf':
                          return ragToTextClass(classifyRag(n(r.spsf), thresholds.get('salesPerSqft') ?? null));
                        case 'fillrate':
                          return r.fillrate != null ? ragToTextClass(classifyRag(r.fillrate, thresholds.get('fillRate') ?? null)) : null;
                        case 'doh':
                          return r.DOH != null ? ragToTextClass(classifyRag(r.DOH, thresholds.get('daysOnHand') ?? null)) : null;
                        case 'zero_sale':
                          return r.zero_sales_option_pct != null ? ragToTextClass(classifyRag(r.zero_sales_option_pct, thresholds.get('stockoutRate') ?? null)) : null;
                        case 'over_90':
                          return r.options_instock_age_over_90 != null ? ragToTextClass(classifyRag(r.options_instock_age_over_90, thresholds.get('fashionAgeing') ?? null)) : null;
                        default:
                          return null;
                      }
                    })();

                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "py-2.5 px-3 tabular-nums whitespace-nowrap",
                          col.align === "right" ? "text-right" : "text-left",
                          col.key === "store_name"
                            ? "font-medium text-gray-900 max-w-[200px] truncate"
                            : (ragClass ?? "text-gray-700"),
                          ragClass && "font-semibold",
                          extraClass,
                        )}
                      >
                        {value}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-right">
                    <DrillMenu
                      rowLabel={r.store_name}
                      targets={getChartDrillTargets("store-category", {
                        store: r.store_code,
                        from: "store-view",
                      })}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — flush footer; Pagination provides its own border-t + padding */}
      {data && data.total_pages > 1 && (
        <div className="-mx-4 -mb-4 mt-3">
          <Pagination
            currentPage={page}
            totalPages={data.total_pages}
            totalItems={data.total}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[10, 25, 50]}
          />
        </div>
      )}
    </div>
  );
}
