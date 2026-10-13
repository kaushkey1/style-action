import { useState, useEffect, Fragment } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronLeft, Download } from "lucide-react";
import { useDownload } from "@/hooks/useDownload";
import { IMPETUS_APP_BASE } from "@/lib/api";
import { Button, EmptyState, SectionHeader, Pagination, InfoHeaderIcon, TableMetricsInfo } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import {
  fetchStorePerformance,
  type AOPStorePerformanceResponse,
  type FetchStorePerformanceParams,
  type AOPSummaryCard,
} from "../api/aopApi";
import { getAopAppBasePath } from "../utils/aopAppPath";
import { KPIStrip, KPIStripShimmer, TableShimmer } from "../components/AOPKpiStrip";

// Filter out AOP GM cards from API response
function filterAopGmCards(cards: AOPSummaryCard[] | null): AOPSummaryCard[] | null {
  if (!cards) return null;
  return cards.filter((card) => !card.label.toLowerCase().includes("aop gm"));
}

export function AOPStorePerformancePage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const aopAppBase = getAopAppBasePath(location.pathname);
  const [searchParams, setSearchParams] = useSearchParams();
  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [data, setData] = useState<AOPStorePerformanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get parameters from query params
  const category = searchParams.get("category");
  const tab = (searchParams.get("tab") as "format" | "channel" | "category" | "store") || "store";
  const storeType = (searchParams.get("store_type") as "existing" | "nso") || "existing";

  // Determine current level: 2 (categories for this store), 3 (bricks for this category)
  const level = !category ? 2 : 3;

  // Fetch data whenever level, page, or pageSize changes (yearly view only)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params: FetchStorePerformanceParams = {
          view_type: "store",
          is_monthly: false, // Always yearly view
          store: storeId || undefined,
          category: category || undefined,
          page,
          page_size: pageSize,
          store_type: storeType,
        };

        const response = await fetchStorePerformance(params);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storeId, category, page, pageSize, storeType]);

  // Handle row click for navigation to Level 3
  const handleRowClick = (rowId: string | null) => {
    if (!rowId || level === 3) return; // No navigation at Level 3

    const newParams = new URLSearchParams(searchParams);

    if (level === 2) {
      // Level 2: Navigate to Level 3 (bricks for this category)
      newParams.set("category", rowId);
    }

    setPage(1); // Reset to first page on drill-down
    setSearchParams(newParams);
  };

  // Handle back button
  const handleBack = () => {
    if (level === 3) {
      // Go back to Level 2 (remove category)
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("category");
      setPage(1);
      setSearchParams(newParams);
    } else {
      // Go back to main AOP dashboard with correct tab and store_type preserved
      const params = new URLSearchParams();
      params.set("tab", tab);
      if (tab === "store") {
        params.set("store_type", storeType);
      }
      navigate(`${aopAppBase}?${params.toString()}`);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const breadcrumbParentEarly = level === 3 && category ? (storeId ?? "Store") : "AOP";
  const currentTitleEarly = level === 3 && category ? category : (storeId ?? "Store");

  const mobileHeader = (
    <div className="-mx-4 -mt-4 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        <button onClick={handleBack} className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-700" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{breadcrumbParentEarly}</p>
          <h2 className="text-base font-semibold text-gray-900 truncate">{currentTitleEarly}</h2>
        </div>
      </div>
    </div>
  );

  const desktopHeader = (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="sm" onClick={handleBack}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <a href={`${aopAppBase}?tab=store`} className="hover:text-gray-900">
          AOP
        </a>
        <span>›</span>
        <span className="text-gray-900">{storeId}</span>
        {level === 3 && category && (
          <>
            <span>›</span>
            <span className="text-gray-900">{category}</span>
          </>
        )}
      </div>
    </div>
  );

  const headerBar = isMobile ? mobileHeader : desktopHeader;

  // Render initial loading state (no data yet)
  if (isLoading && !data) {
    return (
      <div className={cn("animate-fadeInUp", isMobile ? "space-y-3" : "space-y-4")}>
        {headerBar}
        <KPIStripShimmer />
        <TableShimmer rows={10} />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={cn(isMobile ? "space-y-3" : "space-y-4")}>
        {headerBar}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <a href={`${aopAppBase}?tab=store`} className="hover:text-gray-900">
              AOP
            </a>
            <span>›</span>
            <span className="text-gray-900">{storeId}</span>
            {level === 3 && category && (
              <>
                <span>›</span>
                <span className="text-gray-900">{category}</span>
              </>
            )}
          </div>
        </div>
        {}
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!data) {
    return (
      <div className={cn(isMobile ? "space-y-3" : "space-y-4")}>
        {headerBar}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <a href={`${aopAppBase}?tab=store`} className="hover:text-gray-900">
              AOP
            </a>
            <span>›</span>
            <span className="text-gray-900">{storeId}</span>
            {level === 3 && category && (
              <>
                <span>›</span>
                <span className="text-gray-900">{category}</span>
              </>
            )}
          </div>
        </div>
        <EmptyState description="No data available" />
      </div>
    );
  }

  const isClickable = level === 2; // Only Level 2 (categories) is clickable

  const breadcrumbParent = level === 3 && category ? (storeId ?? "Store") : "AOP";
  const currentTitle = level === 3 && category ? category : (storeId ?? "Store");

  const downloadHandler = () =>
    download("/aop/store-performance", "aop_store_detail.xlsx", {
      params: {
        view_type: "store",
        is_monthly: "false",
        store: storeId || "",
        ...(category ? { category } : {}),
        store_type: storeType,
      },
    });

  return (
    <div className={cn("animate-fadeInUp", isMobile ? "space-y-3" : "space-y-4")}>
      {/* Mobile header — consistent with AOPRowDetail */}
      {isMobile ? (
        <div className="-mx-4 -mt-4 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleBack}
              className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-700"
              aria-label="Back"
              disabled={isLoading}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 truncate">{breadcrumbParent}</p>
              <h2 className="text-base font-semibold text-gray-900 truncate">{currentTitle}</h2>
            </div>
            <button
              onClick={downloadHandler}
              disabled={isDownloading}
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shrink-0"
              aria-label="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Desktop header */
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack} disabled={isLoading}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex-1 flex items-center gap-2 text-sm text-gray-500">
            <a href={`${aopAppBase}?tab=store`} className="hover:text-gray-900">
              AOP
            </a>
            <span>›</span>
            <span className="text-gray-900">{storeId}</span>
            {level === 3 && category && (
              <>
                <span>›</span>
                <span className="text-gray-900">{category}</span>
              </>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={downloadHandler} disabled={isDownloading} className="shrink-0">
            <Download className="w-4 h-4 mr-1.5" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </div>
      )}

      {/* Summary KPI Cards */}
      {isLoading ? (
        <KPIStripShimmer />
      ) : (
        data?.summary_cards &&
        data.summary_cards.length > 0 && <KPIStrip cards={filterAopGmCards(data.summary_cards)} />
      )}

      {/* Performance Table */}
      {isLoading ? (
        <TableShimmer rows={10} />
      ) : (
        <Fragment>
          {/* Mobile: Card view */}
          {isMobile ? (
            <div className="space-y-2">
              <SectionHeader
                title={
                  <>
                    {data?.dimension_label || "Category"} Breakdown{" "}
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
              {!data || data.rows.length === 0 ? (
                <EmptyState description="No data available" />
              ) : (
                data.rows.map((row: AOPStorePerformanceResponse["rows"][0], idx: number) => (
                  <button
                    key={row.id || idx}
                    onClick={() => isClickable && row.id && handleRowClick(row.id)}
                    disabled={!isClickable || !row.id}
                    className={cn(
                      "w-full text-left bg-white rounded-lg border border-gray-200 p-3 transition-all duration-200",
                      isClickable && row.id
                        ? "hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2"
                        : "cursor-default",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{row.label}</h3>
                      {isClickable && row.id && <ChevronLeft className="w-4 h-4 text-gray-400 shrink-0 rotate-180" />}
                    </div>
                    {/* eslint-disable-next-line design-system/prefer-metric-grid -- store card metrics, not a KPI grid */}
                    <div className="grid grid-cols-3 gap-x-3 gap-y-1.5">
                      <div>
                        <div className="text-xs text-gray-500">Volume</div>
                        <div
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            row.volume == null ? "text-gray-400" : "text-gray-900",
                          )}
                        >
                          {row.volume == null ? "NA" : row.volume.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">ASP</div>
                        <div
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            row.display_asp === "NA" ? "text-gray-400" : "text-gray-900",
                          )}
                        >
                          {row.display_asp}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Gross Rev</div>
                        <div
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            row.display_value === "NA" ? "text-gray-400" : "text-gray-900",
                          )}
                        >
                          {row.display_value}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Net Rev</div>
                        <div
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            row.display_net_revenue === "NA" ? "text-gray-400" : "text-gray-900",
                          )}
                        >
                          {row.display_net_revenue}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Intake GM</div>
                        <div
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            row.intake_gm_pct == null ? "text-gray-400" : "text-gray-900",
                          )}
                        >
                          {row.intake_gm_pct == null ? "NA" : `${row.intake_gm_pct.toFixed(1)}%`}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Del GM%</div>
                        <div
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            row.delivered_gm_pct == null ? "text-gray-400" : "text-gray-900",
                          )}
                        >
                          {row.delivered_gm_pct == null ? "NA" : `${row.delivered_gm_pct.toFixed(1)}%`}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
              {data?.pagination && (
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.total_pages}
                  onPageChange={handlePageChange}
                  totalItems={data.pagination.total_items}
                  pageSize={data.pagination.page_size}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={[10, 20, 50]}
                />
              )}
            </div>
          ) : (
            /* Desktop: Table view */
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <SectionHeader
                title={
                  <>
                    {data?.dimension_label || "Category"} Breakdown{" "}
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
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 font-medium text-gray-500 text-left whitespace-nowrap sticky left-0 bg-gray-50 z-10">
                        {data?.dimension_label || "Category"}
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 w-full justify-end">
                          Volume (Thousands) <InfoHeaderIcon metricKey="Volume (Thousands)" />
                        </span>
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 w-full justify-end">
                          ASP <InfoHeaderIcon metricKey="ASP" />
                        </span>
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 w-full justify-end">
                          Gross Revenue (Lakhs) <InfoHeaderIcon metricKey="Gross Revenue (Lakhs)" />
                        </span>
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 w-full justify-end">
                          Net Revenue (Lakhs) <InfoHeaderIcon metricKey="Net Revenue (Lakhs)" />
                        </span>
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 w-full justify-end">
                          Intake GM <InfoHeaderIcon metricKey="Intake GM" />
                        </span>
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-500 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 w-full justify-end">
                          Delivered GM% <InfoHeaderIcon metricKey="Delivered GM%" />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {!data || data.rows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No data available
                        </td>
                      </tr>
                    ) : (
                      data.rows.map((row: AOPStorePerformanceResponse["rows"][0], idx: number) => (
                        <tr
                          key={row.id || idx}
                          onClick={() => isClickable && row.id && handleRowClick(row.id)}
                          className={cn(
                            "transition-colors",
                            isClickable && row.id ? "hover:bg-gray-50/50 cursor-pointer" : "cursor-default",
                          )}
                        >
                          <td className="px-3 py-2 sticky left-0 bg-white z-10">
                            <div className="font-medium text-gray-900 text-sm">{row.label}</div>
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-mono text-sm",
                              row.volume == null ? "text-gray-400" : "text-gray-700",
                            )}
                          >
                            {row.volume == null ? "NA" : row.volume.toFixed(2)}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-mono text-sm",
                              row.display_asp === "NA" ? "text-gray-400" : "text-gray-700",
                            )}
                          >
                            {row.display_asp}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-mono text-sm",
                              row.display_value === "NA" ? "text-gray-400" : "text-gray-700",
                            )}
                          >
                            {row.display_value}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-mono text-sm",
                              row.display_net_revenue === "NA" ? "text-gray-400" : "text-gray-700",
                            )}
                          >
                            {row.display_net_revenue}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-mono text-sm",
                              row.intake_gm_pct == null ? "text-gray-400" : "text-gray-700",
                            )}
                          >
                            {row.intake_gm_pct == null ? "NA" : `${row.intake_gm_pct.toFixed(1)}%`}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-mono text-sm",
                              row.delivered_gm_pct == null ? "text-gray-400" : "text-gray-700",
                            )}
                          >
                            {row.delivered_gm_pct == null ? "NA" : `${row.delivered_gm_pct.toFixed(1)}%`}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data?.pagination && (
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.total_pages}
                  onPageChange={handlePageChange}
                  totalItems={data.pagination.total_items}
                  pageSize={data.pagination.page_size}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={[10, 20, 50]}
                />
              )}
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
}
