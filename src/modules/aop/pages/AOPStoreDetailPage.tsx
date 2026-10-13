import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Download } from "lucide-react";
import {
  Button,
  FilterSearch,
  FilterPills,
  Pagination,
  SectionHeader,
  EmptyState,
  InfoHeaderIcon,
  TableMetricsInfo,
} from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { useDownload } from "@/hooks/useDownload";
import { IMPETUS_APP_BASE } from "@/lib/api";
import { useIsMobile } from "@/hooks/useMediaQuery";
import {
  fetchStorePerformance,
  type AOPStorePerformanceResponse,
  type AOPStorePerformanceRow,
  type AOPSummaryCard,
} from "../api/aopApi";
import { AOPMobileCard } from "../components/AOPMobileCard";
import {
  SEGMENT_PILL_OPTIONS,
  filterRowsBySegment,
} from "../data/segmentConfig";
import { getCurrencySymbol } from '@/lib/utils';

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactNode {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 whitespace-nowrap">
        {label}
      </p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function KpiStripShimmer(): React.ReactNode {
  return (
    // eslint-disable-next-line design-system/prefer-metric-grid -- KPI shimmer grid
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
        >
          <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
          <div className="h-6 bg-gray-200 rounded w-28" />
        </div>
      ))}
    </div>
  );
}

function TableShimmer(): React.ReactNode {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded mb-2" />
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AOPStoreDetailPage(): React.ReactNode {
  const { storeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { download } = useDownload(IMPETUS_APP_BASE);

  const category = searchParams.get("category");
  const storeType = (searchParams.get("store_type") ?? "existing") as
    | "existing"
    | "nso";
  const decodedStoreId = storeId ? decodeURIComponent(storeId) : "";

  // Data state
  const [data, setData] = useState<AOPStorePerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Segment filter + search + pagination
  const [segment, setSegment] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Build a fetch key to reset state and trigger fetches
  const fetchKey = `${decodedStoreId}|${category ?? ""}|${storeType}|${page}|${pageSize}`;

  // Fetch data when store/category/page changes
  useEffect(() => {
    if (!decodedStoreId) return;

    let cancelled = false;

    const params: Parameters<typeof fetchStorePerformance>[0] = {
      view_type: "store",
      store: decodedStoreId,
      store_type: storeType,
      page,
      page_size: pageSize,
    };

    if (category) {
      params.category = category;
    }

    setLoading(true);
    setError(null);

    fetchStorePerformance(params)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load data";
          setError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchKey captures all dependencies
  }, [fetchKey]);

  // Reset search when store/category changes (not page changes)
  const storeKey = `${decodedStoreId}|${category ?? ""}|${storeType}`;
  const prevStoreKeyRef = useRef(storeKey);
  if (prevStoreKeyRef.current !== storeKey) {
    prevStoreKeyRef.current = storeKey;
    setSegment("all");
    setSearch("");
    setPage(1);
  }

  // Determine what data to show
  const isBrickView = !!category;
  const sectionTitle = isBrickView ? "BRICK Breakdown" : "CATEGORY Breakdown";
  const dimensionLabel =
    data?.dimension_label ?? (isBrickView ? "BRICK" : "CATEGORY");

  // Get rows from data
  const allRows = useMemo(
    (): AOPStorePerformanceRow[] => data?.rows ?? [],
    [data],
  );

  // Filter by segment, then by search (client-side filtering on top of server-paginated data)
  const segmentedRows = useMemo(
    () => filterRowsBySegment(allRows, segment),
    [allRows, segment],
  );

  const filteredRows = useMemo(() => {
    if (!search.trim()) return segmentedRows;
    const q = search.toLowerCase();
    return segmentedRows.filter((r) => r.label.toLowerCase().includes(q));
  }, [segmentedRows, search]);

  // When filtering client-side (search or segment), paginate locally; otherwise use server pagination
  const isClientFiltered = !!search.trim() || segment !== "all";
  const totalItems = isClientFiltered
    ? filteredRows.length
    : (data?.pagination?.total_items ?? 0);
  const totalPages = isClientFiltered
    ? Math.max(1, Math.ceil(filteredRows.length / pageSize))
    : (data?.pagination?.total_pages ?? 1);

  const paginatedRows = useMemo(() => {
    if (isClientFiltered) {
      const start = (page - 1) * pageSize;
      return filteredRows.slice(start, start + pageSize);
    }
    return filteredRows;
  }, [filteredRows, page, pageSize, isClientFiltered]);

  // Handlers
  const handleBack = useCallback(() => {
    if (category) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("category");
      setSearchParams(newParams);
    } else {
      navigate("/aop?tab=store&store_type=" + storeType);
    }
  }, [category, searchParams, setSearchParams, navigate, storeType]);

  const handleCategoryClick = useCallback(
    (categoryName: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("category", categoryName);
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  // KPI cards from summary_cards
  const kpiCards = data?.summary_cards ?? [];

  // Breadcrumbs
  const breadcrumbParts = [
    {
      label: "AOP",
      onClick: () => navigate("/aop?tab=store&store_type=" + storeType),
    },
    {
      label: decodedStoreId,
      onClick: category ? () => handleBack() : undefined,
    },
    ...(category ? [{ label: category }] : []),
  ];

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Header: Back + Breadcrumbs + Download */}
      {/* eslint-disable-next-line design-system/prefer-section-header -- navigation breadcrumb bar, not section header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <nav className="hidden sm:flex items-center gap-1 text-sm text-gray-500 min-w-0 truncate">
            {breadcrumbParts.map((part, i) => (
              <span key={i} className="flex items-center gap-1 min-w-0">
                {i > 0 && <span className="text-gray-400">›</span>}
                {part.onClick ? (
                  <button
                    onClick={part.onClick}
                    className="text-gray-500 hover:text-gray-900 truncate"
                  >
                    {part.label}
                  </button>
                ) : (
                  <span className="text-gray-900 font-medium truncate">
                    {part.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => download("/aop/download", "aop-store-detail.xlsx")}
          className="shrink-0"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Download</span>
        </Button>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <KpiStripShimmer />
      ) : (
        // eslint-disable-next-line design-system/prefer-metric-grid -- API-driven KPI cards, variable count
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map((card: AOPSummaryCard) => (
            <KpiCard
              key={card.label}
              label={card.label}
              value={card.display_value}
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <EmptyState
          title="Failed to load data"
          description={error}
          variant="neutral"
        />
      )}

      {/* Data table */}
      {loading ? (
        <TableShimmer />
      ) : (
        !error && (
          <div className="space-y-3">
            <SectionHeader
              title={
                <>
                  {sectionTitle}{" "}
                  <TableMetricsInfo
                    metrics={[
                      "Volume (Thousands)",
                      "ASP",
                      "Gross Revenue (Lakhs)",
                      "Net Revenue (Lakhs)",
                      "Intake GM",
                      "Delivered GM%",
                    ]}
                  />
                </>
              }
            />

            {/* Search + Segment pills */}
            {allRows.length > 3 && (
              <FilterSearch
                placeholder={`Search ${isBrickView ? "bricks" : "categories"}...`}
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
              />
            )}
            {!isBrickView && (
              <div className="overflow-x-auto scrollbar-hide">
                <FilterPills
                  value={segment}
                  onChange={(v) => {
                    setSegment(v);
                    setPage(1);
                  }}
                  options={SEGMENT_PILL_OPTIONS}
                  className="whitespace-nowrap"
                />
              </div>
            )}

            {/* Empty state */}
            {filteredRows.length === 0 ? (
              <EmptyState
                title={
                  search
                    ? `No ${isBrickView ? "bricks" : "categories"} found`
                    : "No data available"
                }
                description={
                  search
                    ? `No results matching "${search}"`
                    : "No breakdown data available for this store."
                }
                variant="neutral"
              />
            ) : isMobile ? (
              /* Mobile: Card view */
              <div className="space-y-3">
                {paginatedRows.map((row, idx) => (
                  <AOPMobileCard
                    key={`${row.label}-${idx}`}
                    title={row.label}
                    metrics={[
                      {
                        label: "Volume (Th)",
                        value:
                          row.volume != null ? row.volume.toFixed(2) : "NA",
                      },
                      {
                        label: "ASP",
                        value:
                          row.display_asp ??
                          (row.asp != null ? formatCurrency(row.asp) : "NA"),
                      },
                      {
                        label: "Gross Rev (L)",
                        value:
                          row.display_value ??
                          (row.value != null
                            ? formatCurrency(row.value)
                            : "NA"),
                      },
                      {
                        label: "Net Rev (L)",
                        value:
                          row.display_net_revenue ??
                          (row.net_revenue != null
                            ? formatCurrency(row.net_revenue)
                            : "NA"),
                      },
                      {
                        label: "Intake GM",
                        value:
                          row.intake_gm_pct != null
                            ? `${row.intake_gm_pct.toFixed(1)}%`
                            : "NA",
                      },
                      {
                        label: "Delivered GM%",
                        value:
                          row.delivered_gm_pct != null
                            ? `${row.delivered_gm_pct.toFixed(1)}%`
                            : "NA",
                      },
                    ]}
                    onClick={() => {
                      if (!isBrickView) handleCategoryClick(row.label);
                    }}
                    className={isBrickView ? "cursor-default" : undefined}
                  />
                ))}
              </div>
            ) : (
              /* Desktop: Table view */
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3.5 px-4 font-medium text-gray-500 text-xs whitespace-nowrap">
                          {dimensionLabel}
                        </th>
                        <th className="text-right py-3.5 px-4 font-medium text-gray-500 text-xs whitespace-nowrap">
                          Volume (Thousands){" "}
                          <InfoHeaderIcon metricKey="Volume (Thousands)" />
                        </th>
                        <th className="text-right py-3.5 px-4 font-medium text-gray-500 text-xs whitespace-nowrap">
                          ASP <InfoHeaderIcon metricKey="ASP" />
                        </th>
                        <th className="text-right py-3.5 px-4 font-medium text-gray-500 text-xs whitespace-nowrap">
                          Gross Revenue (Lakhs){" "}
                          <InfoHeaderIcon metricKey="Gross Revenue (Lakhs)" />
                        </th>
                        <th className="text-right py-3.5 px-4 font-medium text-gray-500 text-xs whitespace-nowrap">
                          Net Revenue (Lakhs){" "}
                          <InfoHeaderIcon metricKey="Net Revenue (Lakhs)" />
                        </th>
                        <th className="text-right py-3.5 px-4 font-medium text-gray-500 text-xs whitespace-nowrap">
                          Intake GM <InfoHeaderIcon metricKey="Intake GM" />
                        </th>
                        <th className="text-right py-3.5 px-4 font-medium text-gray-500 text-xs whitespace-nowrap">
                          Delivered GM%{" "}
                          <InfoHeaderIcon metricKey="Delivered GM%" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((row, idx) => (
                        <tr
                          key={`${row.label}-${idx}`}
                          onClick={() => {
                            if (!isBrickView) handleCategoryClick(row.label);
                          }}
                          className={cn(
                            "border-b border-gray-50 last:border-0",
                            !isBrickView &&
                              "cursor-pointer hover:bg-gray-50 transition-colors",
                          )}
                        >
                          <td className="py-3.5 px-4 font-medium text-gray-900">
                            {row.label}
                          </td>
                          <td className="py-3.5 px-4 text-right text-gray-700 tabular-nums">
                            {row.volume != null ? row.volume.toFixed(2) : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right text-gray-700 tabular-nums">
                            {row.display_asp ??
                              (row.asp != null
                                ? `${getCurrencySymbol()}${row.asp.toLocaleString("en-IN")}`
                                : "—")}
                          </td>
                          <td className="py-3.5 px-4 text-right text-gray-700 tabular-nums">
                            {row.display_value ??
                              (row.value != null
                                ? `${getCurrencySymbol()}${row.value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "—")}
                          </td>
                          <td className="py-3.5 px-4 text-right text-gray-700 tabular-nums">
                            {row.display_net_revenue ??
                              (row.net_revenue != null
                                ? `${getCurrencySymbol()}${row.net_revenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "—")}
                          </td>
                          <td className="py-3.5 px-4 text-right text-gray-700 tabular-nums">
                            {row.intake_gm_pct != null
                              ? `${row.intake_gm_pct.toFixed(1)}%`
                              : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right text-gray-700 tabular-nums">
                            {row.delivered_gm_pct != null
                              ? `${row.delivered_gm_pct.toFixed(1)}%`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalItems > pageSize && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </div>
        )
      )}
    </div>
  );
}
