import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUpDown, HelpCircle, Download } from "lucide-react";
import { useDownload } from "@/hooks/useDownload";
import { appApiPost, IMPETUS_APP_BASE } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import {
  MetricCard,
  MetricGrid,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  FilterBar,
  FilterSearch,
  FilterMultiSelect,
  FilterClear,
  PageHeader,
  Button,
  DataTable,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  EmptyState,
  Pagination,
} from "@/components/ui";
import {
  fetchAllocationSummary,
  fetchAllocationOrders,
  fetchAllocationFilterOptions,
  type AllocationOrder,
  type AllocationSummaryData,
} from "../api/inventoryApi";
import { useApiData } from "@/hooks/useApiData";
import { cn, formatNumber } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────

type SortField = "id" | "delivery_type" | "delivery_date";
type SortDirection = "asc" | "desc";

// Map sort fields to API column names
const sortFieldToApi: Record<SortField, string> = {
  id: "order_id",
  delivery_type: "delivery_type",
  delivery_date: "delivery_date",
};

const statusTabs = ["all", "Not Started", "In Progress", "Completed"] as const;
type StatusTab = (typeof statusTabs)[number];

const statusLabels: Record<StatusTab, string> = {
  all: "All",
  "Not Started": "Not Started",
  "In Progress": "In Progress",
  Completed: "Completed",
};

// ─── KPI Tooltip Badge ────────────────────────────────────────────────

function KpiTooltipBadge({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="More info">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Sortable Column Header ───────────────────────────────────────────

function SortableHeader({
  label,
  field,
  currentField,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentField === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={cn("inline-flex items-center gap-1 hover:text-gray-900 transition-colors", className)}
    >
      {label}
      <ArrowUpDown className={cn("w-3 h-3", isActive ? "text-gray-900" : "text-gray-400")} />
    </button>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

function InventoryActionsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isGeneratingSTO, setIsGeneratingSTO] = useState(false);

  // Local allocation-specific filters (not shared with Command Center)
  const [brand, setBrand] = useState("all");
  const [segment, setSegment] = useState("all");
  const [family, setFamily] = useState("all");
  const [fashionGrade, setFashionGrade] = useState("all");
  const [store, setStore] = useState("all");
  const anyFilterActive =
    brand !== "all" || segment !== "all" || family !== "all" || fashionGrade !== "all" || store !== "all";
  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);
  const { success, error } = useToast();

  // Debounce search: wait 300ms after user stops typing
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  // ── Deep-link seeding (mount-only): apply ?stoId/?sku/?segment/?family/?grade/?store from the URL.
  //    Destination side only — drill triggers live in the design lab, not in this page.
  const [searchParams] = useSearchParams();
  const deepLinkSeeded = useRef(false);
  useEffect(() => {
    if (deepLinkSeeded.current) return;
    deepLinkSeeded.current = true;
    const sto = searchParams.get("stoId");
    const sku = searchParams.get("sku");
    if (sto) setSearch(sto);
    else if (sku) setSearch(sku);
    const seg = searchParams.get("segment");
    if (seg) setSegment(seg);
    const fam = searchParams.get("family");
    if (fam) setFamily(fam);
    const grd = searchParams.get("grade");
    if (grd) setFashionGrade(grd);
    const st = searchParams.get("store");
    if (st) setStore(st);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only deep-link seed
  }, []);

  // Build filter params for orders API
  const allocFilterParams = useMemo(() => {
    const p: Record<string, string | undefined> = {};
    if (segment !== "all") p.segment = segment;
    if (family !== "all") p.family = family;
    if (brand !== "all") p.brand = brand;
    if (fashionGrade !== "all") p.fashion_grade = fashionGrade;
    if (store !== "all") p.source = store;
    return p;
  }, [segment, family, brand, fashionGrade, store]);

  // Fetch filter options from allocation filter-options API
  const { data: filterData } = useApiData(fetchAllocationFilterOptions, []);

  const toOptions = useCallback((items: unknown[]): { value: string; label: string }[] => {
    const seen = new Set<string>();
    const result: { value: string; label: string }[] = [];
    for (const item of items) {
      if (typeof item === 'string') {
        if (!seen.has(item)) { seen.add(item); result.push({ value: item, label: item }); }
      } else if (item && typeof item === 'object' && 'value' in item) {
        const v = String((item as Record<string, unknown>).value);
        const l = String((item as Record<string, unknown>).label ?? v);
        if (!seen.has(v)) { seen.add(v); result.push({ value: v, label: l }); }
      }
    }
    return result;
  }, []);

  const apiBrandOptions = useMemo(() => toOptions(filterData?.brand ?? []), [filterData, toOptions]);
  const apiSegmentOptions = useMemo(() => toOptions(filterData?.segment ?? []), [filterData, toOptions]);
  const apiFamilyOptions = useMemo(() => toOptions(filterData?.family ?? []), [filterData, toOptions]);
  const apiFashionGradeOptions = useMemo(() => toOptions(filterData?.grade ?? filterData?.fashion_grade ?? []), [filterData, toOptions]);
  const apiStoreOptions = useMemo(() => toOptions(filterData?.store ?? filterData?.source ?? []), [filterData, toOptions]);

  // Fetch allocation summary
  const { data: summary, loading: summaryLoading } = useApiData<AllocationSummaryData>(
    () => fetchAllocationSummary(Object.keys(allocFilterParams).length > 0 ? allocFilterParams : undefined),
    [allocFilterParams],
  );

  // Fetch paginated orders
  const { data: ordersData, loading: ordersLoading } = useApiData(
    () =>
      fetchAllocationOrders({
        page,
        page_size: pageSize,
        sort_by: sortFieldToApi[sortField],
        sort_order: sortDirection,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: debouncedSearch || undefined,
        segment: segment !== "all" ? segment : undefined,
        family: family !== "all" ? family : undefined,
        brand: brand !== "all" ? brand : undefined,
        fashion_grade: fashionGrade !== "all" ? fashionGrade : undefined,
        source: store !== "all" ? store : undefined,
      }),
    [
      page,
      pageSize,
      sortField,
      sortDirection,
      statusFilter,
      debouncedSearch,
      segment,
      family,
      brand,
      fashionGrade,
      store,
    ],
  );

  const orders: AllocationOrder[] = ordersData?.items ?? [];
  const totalOrders = ordersData?.total ?? 0;
  const totalPages = ordersData?.total_pages ?? 0;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const handleStatusChange = (v: string) => {
    setStatusFilter(v as StatusTab);
    setPage(1);
  };

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const selectableOrders = orders.filter((o) => o.status !== "In Progress");
  const allSelected =
    selectableOrders.length > 0 && selectableOrders.every((o) => selectedRows.has(o.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(selectableOrders.map((o) => o.id)));
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerateSTOReport = async () => {
    if (selectedRows.size === 0) {
      error("Please select at least one order");
      return;
    }

    setIsGeneratingSTO(true);
    try {
      const response = await appApiPost<{
        success: boolean;
        message: string;
        gcs_file_path: string;
        procuro_response: unknown;
      }>("/inventory/allocation-orders/generate-sto-report", Array.from(selectedRows));

      if (response?.success) {
        success(response.message || "STO report generated successfully");
        setSelectedRows(new Set());
      } else {
        error("Failed to generate STO report");
      }
    } catch (err) {
      console.error("STO generation error:", err);
      error(
        err instanceof Error ? err.message : "Failed to generate STO report. Please try again.",
      );
    } finally {
      setIsGeneratingSTO(false);
    }
  };

  // Status counts from summary
  const statusCounts = useMemo(() => {
    const counts = summary?.status_counts ?? {};
    return {
      all: summary?.total_orders ?? 0,
      "Not Started": counts["Not Started"] ?? 0,
      "In Progress": counts["In Progress"] ?? 0,
      Completed: counts["Completed"] ?? 0,
    };
  }, [summary]);

  const s = summary;

  return (
    <div className="animate-fadeInUp space-y-4">
      <PageHeader
        title="Allocation Actions"
      />

      {/* KPI Summary */}
      <MetricGrid columns={3}>
        <MetricCard
          label="Total Units Allocated"
          value={summaryLoading ? "..." : formatNumber(s?.total_units_allocated ?? 0)}
          badge={<KpiTooltipBadge text="Total units allocated across all active transfer orders" />}
        />
        <MetricCard
          label="Stores Covered"
          value={summaryLoading ? "..." : formatNumber(s?.stores_covered ?? 0)}
          badge={<KpiTooltipBadge text="Number of unique source stores involved in transfers" />}
        />
        <MetricCard
          label="Active Transfers"
          value={summaryLoading ? "..." : formatNumber(s?.active_transfers ?? 0)}
          badge={<KpiTooltipBadge text="Transfer orders not yet completed" />}
        />
        <MetricCard
          label="Avg Units/Order"
          value={summaryLoading ? "..." : String(s?.avg_units_per_order ?? 0)}
          badge={<KpiTooltipBadge text="Average number of units per transfer order" />}
        />
        <MetricCard
          label="Pending Approvals"
          value={summaryLoading ? "..." : formatNumber(s?.pending_approvals ?? 0)}
          badge={<KpiTooltipBadge text="Transfer orders awaiting start" />}
        />
        <MetricCard
          label="Total Orders"
          value={summaryLoading ? "..." : formatNumber(s?.total_orders ?? 0)}
          badge={<KpiTooltipBadge text="Total transfer orders in the latest run" />}
        />
      </MetricGrid>

      {/* Status Tabs + Search */}
      <Tabs value={statusFilter} onValueChange={handleStatusChange}>
        <div className="border-b border-gray-200">
          <TabsList variant="underline" className="border-b-0">
            {statusTabs.map((key) => (
              <TabsTrigger key={key} value={key} variant="underline">
                {statusLabels[key]} ({formatNumber(statusCounts[key])})
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-2 mt-4 mb-0">
          <FilterBar className="mb-0 flex-1">
            <FilterMultiSelect
              value={brand}
              onChange={handleFilterChange(setBrand)}
              options={apiBrandOptions}
              placeholder="Brands"
            />
            <FilterMultiSelect
              value={segment}
              onChange={handleFilterChange(setSegment)}
              options={apiSegmentOptions}
              placeholder="Segments"
            />
            <FilterMultiSelect
              value={family}
              onChange={handleFilterChange(setFamily)}
              options={apiFamilyOptions}
              placeholder="Families"
            />
            <FilterMultiSelect
              value={fashionGrade}
              onChange={handleFilterChange(setFashionGrade)}
              options={apiFashionGradeOptions}
              placeholder="Fashion Grades"
            />
            <FilterMultiSelect
              value={store}
              onChange={handleFilterChange(setStore)}
              options={apiStoreOptions}
              placeholder="Stores"
            />
            {anyFilterActive && (
              <FilterClear
                onClear={() => {
                  setBrand("all");
                  setSegment("all");
                  setFamily("all");
                  setFashionGrade("all");
                  setStore("all");
                  setPage(1);
                }}
              />
            )}
          </FilterBar>
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Search by Order ID, Source, Destination..."
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateSTOReport}
            disabled={isGeneratingSTO || selectedRows.size === 0}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
          >
            {isGeneratingSTO ? "Submitting..." : "Submit"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              download("/inventory/allocation-orders", "allocation_orders.xlsx", {
                params: {
                  ...allocFilterParams,
                  ...(debouncedSearch ? { search: debouncedSearch } : {}),
                },
              })
            }
            disabled={isDownloading || !anyFilterActive}
            className="shrink-0"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </div>

        {/* Single content container for all tab values */}
        {statusTabs.map((key) => (
          <TabsContent key={key} value={key}>
            {ordersLoading ? (
              <div className="py-12 text-center text-gray-400 text-sm">Loading transfer orders...</div>
            ) : orders.length === 0 ? (
              <EmptyState description="No transfer orders match your filters" />
            ) : (
              <>
                <DataTable>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <DataTableHead rowSpan={2} className="w-10">
                        {/* eslint-disable-next-line no-restricted-syntax -- checkbox, not text input */}
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus-kb:ring-primary/20"
                          aria-label="Select all rows"
                        />
                      </DataTableHead>
                      <DataTableHead rowSpan={2}>
                        <SortableHeader label="Order ID" field="id" currentField={sortField} onSort={handleSort} />
                      </DataTableHead>
                      <DataTableHead
                        colSpan={4}
                        align="center"
                        className="border-b border-gray-200 border-l border-gray-200"
                      >
                        Out Going
                      </DataTableHead>
                      <DataTableHead rowSpan={2} className="border-l border-gray-200">
                        <SortableHeader
                          label="Delivery Type"
                          field="delivery_type"
                          currentField={sortField}
                          onSort={handleSort}
                        />
                      </DataTableHead>
                      <DataTableHead
                        colSpan={2}
                        align="center"
                        className="border-b border-gray-200 border-l border-gray-200"
                      >
                        Replacement
                      </DataTableHead>
                    </tr>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <DataTableHead className="border-l border-gray-200">Option ID</DataTableHead>
                      <DataTableHead>Source</DataTableHead>
                      <DataTableHead align="right">Quantity</DataTableHead>
                      <DataTableHead>Destination</DataTableHead>
                      <DataTableHead className="border-l border-gray-200">Option ID</DataTableHead>
                      <DataTableHead align="right">Quantity</DataTableHead>
                    </tr>
                  </thead>
                  <DataTableBody>
                    {orders.map((order) => (
                      <DataTableRow key={order.id}>
                        <DataTableCell className="w-10">
                          {/* eslint-disable-next-line no-restricted-syntax -- checkbox, not text input */}
                          <input
                            type="checkbox"
                            checked={selectedRows.has(order.id)}
                            onChange={() => toggleRow(order.id)}
                            disabled={order.status === "In Progress"}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus-kb:ring-primary/20 disabled:opacity-40"
                            aria-label={`Select ${order.id}`}
                          />
                        </DataTableCell>
                        <DataTableCell>
                          <span className="font-medium text-gray-900">{order.id}</span>
                        </DataTableCell>
                        <DataTableCell className="border-l border-gray-100">
                          <span className="font-mono text-gray-700">{order.out_option_id ?? "--"}</span>
                        </DataTableCell>
                        <DataTableCell>{order.source ?? "--"}</DataTableCell>
                        <DataTableCell align="right">{formatNumber(order.out_quantity)}</DataTableCell>
                        <DataTableCell>{order.destination ?? "--"}</DataTableCell>
                        <DataTableCell className="border-l border-gray-100">
                          {order.delivery_type ?? "--"}
                        </DataTableCell>
                        <DataTableCell className="border-l border-gray-100">
                          <span className="font-mono text-gray-700">{order.in_option_id ?? "--"}</span>
                        </DataTableCell>
                        <DataTableCell align="right">{formatNumber(order.in_quantity)}</DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>

                {/* Pagination */}
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={totalOrders}
                  pageSize={pageSize}
                  onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                  pageSizeOptions={[25, 50, 100, 500]}
                />
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default InventoryActionsPage;
