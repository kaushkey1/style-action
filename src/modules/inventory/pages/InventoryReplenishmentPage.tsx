import { useState, useEffect, useRef, useCallback } from "react";
import {
  HelpCircle,
  Package,
  TrendingUp,
  Clock,
  AlertTriangle,
  CircleDollarSign,
  CheckSquare,
  AlertCircle,
  X,
  Download,
} from "lucide-react";
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
  PageHeader,
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
  Badge,
  Skeleton,
  Button,
  Pagination,
} from "@/components/ui";
import { cn, formatNumber, formatDate } from "@/lib/utils";
import { appApiFetch, IMPETUS_APP_BASE } from "@/lib/api";
import { useDownload } from "@/hooks/useDownload";
import { useModulePermissions } from "@/permissions";
import { generateReplenishmentStoReport } from "../api/inventoryApi";
import { getCurrencySymbol } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReplenishmentRecord {
  anr_replenishment_id: string;
  order_id: string | null;
  store_id: string | null;
  store_desc: string | null;
  article_id: string | null;
  article_description: string | null;
  current_stock: number | null;
  recommended: number | null;
  ros_rate: number | null;
  str_rate: number | null; // 0–1 range (e.g. 0.85 = 85%)
  cover_days: number | null;
  delivery_date: string | null;
  priority: string | null; // "High" | "Medium" | "Low"
  status: string | null; // "Pending" | "Approved" | "In transit" | "Delivered"
  mh_sbu_cd: string | null;
  brand_id: string | null;
  mh_segment_cd: string | null;
  mh_family_cd: string | null;
  fashion_grade: string | null;
}

interface ReplenishmentSummary {
  total_orders: number | "N/A";
  total_units: number | "N/A";
  total_value: number | "N/A";
  avg_delivery_time: number | "N/A";
  fill_rate: number | "N/A";
  stockout_risk: number | "N/A";
}

interface PaginatedResponse {
  items: ReplenishmentRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface SelectOption {
  value: string;
  label: string;
}

interface FilterOptions {
  stores: SelectOption[];
  categories: SelectOption[];
  families: SelectOption[];
  brands: SelectOption[];
  priorities: SelectOption[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 20;

// Status tab key → API statuses param value
const TAB_STATUS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

const TAB_LABELS: Record<string, string> = {
  all: "All",
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

// P1 = highest priority, P4 = lowest
const PRIORITY_BADGE: Record<string, string> = {
  P1: "bg-red-50 text-red-700",
  P2: "bg-amber-50 text-amber-700",
  P3: "bg-blue-50 text-blue-700",
  P4: "bg-gray-100 text-gray-600",
};

const STATUS_BADGE: Record<string, string> = {
  "Not Started": "bg-gray-100 text-gray-600",
  "In Progress": "bg-blue-50 text-blue-700",
  Completed: "bg-green-50 text-green-700",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDeliveryDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + "T00:00:00Z") : new Date(iso);
    return formatDate(d);
  } catch {
    return iso;
  }
}

function formatSummaryValue(val: number | "N/A", format: "integer" | "currency" | "days" | "percent"): string {
  if (val === "N/A") return "—";
  if (format === "currency") return `${getCurrencySymbol()}${val.toLocaleString("en-IN")}`;
  if (format === "days") return `${val}d`;
  if (format === "percent") return `${val}%`;
  return formatNumber(val as number);
}

function stockColor(val: number | null): string {
  if (val === null) return "text-gray-400";
  if (val === 0) return "text-red-600 font-semibold";
  if (val <= 2) return "text-amber-600 font-semibold";
  return "text-gray-900";
}

function strColor(val: number | null): string {
  if (val === null) return "text-gray-400";
  if (val >= 90) return "text-green-600 font-semibold";
  if (val >= 75) return "text-amber-600 font-semibold";
  return "text-red-600 font-semibold";
}

function coverColor(val: number | null): string {
  if (val === null) return "text-gray-400";
  if (val < 15) return "text-red-600 font-semibold";
  if (val < 20) return "text-amber-600 font-semibold";
  return "text-green-600";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiInfo({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-gray-400 hover:text-gray-500 transition-colors" aria-label="More info">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function KpiSkeletonRow() {
  return (
    <MetricGrid columns={3}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
      ))}
    </MetricGrid>
  );
}

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100">
          {Array.from({ length: 13 }).map((__, j) => (
            <td key={j} className="px-3 py-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function InventoryReplenishmentPage() {
  const { edit: canEdit } = useModulePermissions("inventory");
  // Filter / sort / pagination state
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [familyFilter, setFamilyFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Data state
  const [summary, setSummary] = useState<ReplenishmentSummary | null>(null);
  const [items, setItems] = useState<ReplenishmentRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    stores: [],
    categories: [],
    families: [],
    brands: [],
    priorities: [],
  });

  // Loading / error state
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(true);
  const [listError, setListError] = useState(false);

  // Search debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  }, []);

  // ── Fetch summary (home) once on mount ──
  useEffect(() => {
     
    setIsSummaryLoading(true);
    appApiFetch<ReplenishmentSummary>("/anr/replenishment/home")
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setIsSummaryLoading(false));
  }, []);

  // ── Fetch filter options from replenishment filter API ──
  useEffect(() => {
    appApiFetch<{
      store: { label: string; value: string }[];
      brand: { label: string; value: string }[];
      category: { label: string; value: string }[];
      family: { label: string; value: string }[];
      priority: { label: string; value: string }[];
    }>("/anr/replenishment/filter-options")
      .then((data) => {
        if (!data) return;

        // Deduplicate by value to avoid duplicate keys
        const uniqueByValue = (items: { label: string; value: string }[]) => {
          const seen = new Set<string>();
          return items.filter((item) => {
            if (seen.has(item.value)) return false;
            seen.add(item.value);
            return true;
          });
        };

        const stores = uniqueByValue(data.store ?? []);
        const brands = uniqueByValue(data.brand ?? []);
        const categories = uniqueByValue(data.category ?? []);
        const families = uniqueByValue(data.family ?? []);
        const priorities = uniqueByValue(data.priority ?? []);

        setFilterOptions({
          stores: stores.map((s) => ({ value: s.value, label: s.value })),
          brands: brands.map((b) => ({ value: b.value, label: b.label })),
          categories: categories.map((c) => ({ value: c.value, label: c.label })),
          families: families.map((f) => ({ value: f.value, label: f.label })),
          priorities: priorities.map((p) => ({ value: p.value, label: p.label })),
        });
      })
      .catch(() => {});
  }, []);


  // ── Fetch list on filter/page change ──
  useEffect(() => {
     
    setIsListLoading(true);
    setListError(false);

    const params: Record<string, string | number> = {
      page,
      page_size: pageSize,
      sort_by: "created_at",
      sort_order: "desc",
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (activeTab !== "all") params.statuses = TAB_STATUS[activeTab] as string;
    if (storeFilter !== "all") params.stores = storeFilter;
    if (categoryFilter !== "all") params.segments = categoryFilter;
    if (familyFilter !== "all") params.families = familyFilter;
    if (brandFilter !== "all") params.brands = brandFilter;
    if (priorityFilter !== "all") params.priorities = priorityFilter;

    appApiFetch<PaginatedResponse>("/anr/replenishment", params)
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
        setTabCounts((prev) => ({ ...prev, [activeTab]: data.total }));
      })
      .catch(() => setListError(true))
      .finally(() => setIsListLoading(false));
  }, [activeTab, debouncedSearch, storeFilter, categoryFilter, familyFilter, brandFilter, priorityFilter, page, pageSize]);

  // ── Handlers ──
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const resetPage = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const clearAllFilters = () => {
    setStoreFilter("all");
    setCategoryFilter("all");
    setFamilyFilter("all");
    setBrandFilter("all");
    setPriorityFilter("all");
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
  };

  // Checkbox selection for STO report
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isStoLoading, setIsStoLoading] = useState(false);

  const selectableItems = items.filter((o) => o.order_id && o.status !== "In Progress");
  const allSelected = selectableItems.length > 0 && selectableItems.every((o) => selectedRows.has(o.order_id as string));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(selectableItems.map((o) => o.order_id as string)));
    }
  };

  const toggleRow = (orderId: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const handleGenerateSto = async () => {
    if (selectedRows.size === 0) return;
    setIsStoLoading(true);
    try {
      await generateReplenishmentStoReport(Array.from(selectedRows));
    } catch {
      // Error is logged by the API layer
    } finally {
      setIsStoLoading(false);
    }
  };

  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);

  // ── Derived UI ──
  const s = summary;

  const hasActiveFilters =
    storeFilter !== "all" ||
    categoryFilter !== "all" ||
    familyFilter !== "all" ||
    brandFilter !== "all" ||
    priorityFilter !== "all" ||
    search !== "";


  const tabLabel = (key: string) => {
    const count = tabCounts[key];
    const base = TAB_LABELS[key];
    return count !== undefined ? `${base} (${formatNumber(count)})` : base;
  };

  return (
    <div className="animate-fadeInUp space-y-4">
      <PageHeader
        title="Inventory Replenishment"
        backTo={{ label: "Inventory", path: "/inventory/actions" }}
      />

      {/* ── KPI Summary ── */}
      {isSummaryLoading ? (
        <KpiSkeletonRow />
      ) : (
        s &&
        (() => {
          const cards = [
            typeof s.total_orders === "number" && (
              <MetricCard
                key="total_orders"
                label="Total Orders"
                value={formatSummaryValue(s.total_orders, "integer")}
                icon={Package}
                badge={<KpiInfo text="Total replenishment orders in the latest run" />}
              />
            ),
            typeof s.total_units === "number" && (
              <MetricCard
                key="total_units"
                label="Total Units"
                value={formatSummaryValue(s.total_units, "integer")}
                icon={TrendingUp}
                badge={<KpiInfo text="Sum of all recommended replenishment units" />}
              />
            ),
            typeof s.total_value === "number" && (
              <MetricCard
                key="total_value"
                label="Total Value"
                value={formatSummaryValue(s.total_value, "currency")}
                icon={CircleDollarSign}
                badge={<KpiInfo text="Total monetary value of replenishment orders (₹)" />}
              />
            ),
            typeof s.avg_delivery_time === "number" && (
              <MetricCard
                key="avg_delivery_time"
                label="Avg Delivery Time"
                value={formatSummaryValue(s.avg_delivery_time, "days")}
                icon={Clock}
                badge={<KpiInfo text="Average days from today to expected delivery" />}
              />
            ),
            typeof s.fill_rate === "number" && (
              <MetricCard
                key="fill_rate"
                label="Fill Rate"
                value={formatSummaryValue(s.fill_rate, "percent")}
                icon={CheckSquare}
                badge={<KpiInfo text="Average fill rate across replenishment orders" />}
              />
            ),
            typeof s.stockout_risk === "number" && (
              <MetricCard
                key="stockout_risk"
                label="Stockout Risk"
                value={formatSummaryValue(s.stockout_risk, "integer")}
                icon={AlertTriangle}
                valueClassName={(s.stockout_risk as number) > 0 ? "text-red-600" : undefined}
                badge={<KpiInfo text="Items at risk of stockout if replenishment is delayed" />}
              />
            ),
          ].filter(Boolean);
          return cards.length > 0 ? <MetricGrid columns={3}>{cards}</MetricGrid> : null;
        })()
      )}

      {/* ── Tabs + Search ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="border-b border-gray-200">
          <TabsList variant="underline" className="border-b-0">
            {Object.keys(TAB_LABELS).map((key) => (
              <TabsTrigger key={key} value={key} variant="underline">
                {tabLabel(key)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── Filter bar + Search ── */}
        <div className="flex items-center gap-3 py-3">
          <FilterBar className="mb-0">
            <FilterMultiSelect
              value={storeFilter}
              onChange={resetPage(setStoreFilter)}
              options={filterOptions.stores}
              placeholder="Stores"
            />
            <FilterMultiSelect
              value={categoryFilter}
              onChange={resetPage(setCategoryFilter)}
              options={filterOptions.categories}
              placeholder="Segments"
            />
            <FilterMultiSelect
              value={familyFilter}
              onChange={resetPage(setFamilyFilter)}
              options={filterOptions.families}
              placeholder="Families"
            />
            <FilterMultiSelect
              value={brandFilter}
              onChange={resetPage(setBrandFilter)}
              options={filterOptions.brands}
              placeholder="Brands"
            />
            <FilterMultiSelect
              value={priorityFilter}
              onChange={resetPage(setPriorityFilter)}
              options={filterOptions.priorities}
              placeholder="Priorities"
            />
          </FilterBar>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="shrink-0">
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </Button>
          )}
          <FilterSearch
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by Order ID, Product, Store..."
            className="w-72 shrink-0 ml-auto"
          />
          {canEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateSto}
              disabled={isStoLoading || selectedRows.size === 0}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
            >
              {isStoLoading ? "Submitting..." : "Submit"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const downloadParams: Record<string, string> = {};
              if (debouncedSearch) downloadParams.search = debouncedSearch;
              if (activeTab !== "all") downloadParams.statuses = TAB_STATUS[activeTab] as string;
              if (storeFilter !== "all") downloadParams.stores = storeFilter;
              if (categoryFilter !== "all") downloadParams.segments = categoryFilter;
              if (familyFilter !== "all") downloadParams.families = familyFilter;
              if (brandFilter !== "all") downloadParams.brands = brandFilter;
              if (priorityFilter !== "all") downloadParams.priorities = priorityFilter;
              download("/anr/replenishment", "replenishment_orders.xlsx", { params: downloadParams });
            }}
            disabled={isDownloading}
            className="shrink-0"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </div>

        {/* ── Table content (shared across all tabs) ── */}
        {Object.keys(TAB_LABELS).map((key) => (
          <TabsContent key={key} value={key}>
            {listError ? (
              <EmptyState
                icon={AlertCircle}
                title="Failed to load replenishment data"
                description="Please try refreshing the page"
              />
            ) : !isListLoading && items.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No replenishment orders"
                description={
                  storeFilter !== "all" ||
                  categoryFilter !== "all" ||
                  brandFilter !== "all" ||
                  priorityFilter !== "all" ||
                  debouncedSearch
                    ? "No results match your current filters"
                    : "No replenishment orders found for this run"
                }
              />
            ) : (
              <>
                <DataTable>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <DataTableHead className="w-10">
                        {/* eslint-disable-next-line no-restricted-syntax -- checkbox, not text input */}
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus-kb:ring-primary/20"
                          aria-label="Select all rows"
                        />
                      </DataTableHead>
                      <DataTableHead>Order ID</DataTableHead>
                      <DataTableHead>Store</DataTableHead>
                      <DataTableHead>Article ID</DataTableHead>
                      <DataTableHead>Article Description</DataTableHead>
                      <DataTableHead align="right">Current Stock</DataTableHead>
                      <DataTableHead align="right">Replenished Quantity</DataTableHead>
                      <DataTableHead align="right">ROS Rate</DataTableHead>
                      <DataTableHead align="right">STR Rate</DataTableHead>
                      <DataTableHead align="right">Cover Days</DataTableHead>
                      <DataTableHead>Delivery Date</DataTableHead>
                      <DataTableHead>Priority</DataTableHead>
                      <DataTableHead>Status</DataTableHead>
                    </tr>
                  </thead>
                  <DataTableBody>
                    {isListLoading ? (
                      <TableSkeletonRows />
                    ) : (
                      items.map((order) => (
                        <DataTableRow key={order.anr_replenishment_id}>
                          <DataTableCell className="w-10">
                            {/* eslint-disable-next-line no-restricted-syntax -- checkbox, not text input */}
                            <input
                              type="checkbox"
                              checked={selectedRows.has(order.order_id ?? "")}
                              onChange={() => order.order_id && toggleRow(order.order_id)}
                              disabled={!order.order_id || order.status === "In Progress"}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus-kb:ring-primary/20 disabled:opacity-40"
                              aria-label={`Select ${order.order_id ?? "order"}`}
                            />
                          </DataTableCell>
                          <DataTableCell>
                            <span className="font-medium text-gray-900 font-mono text-[11px]">
                              {order.order_id ?? "—"}
                            </span>
                          </DataTableCell>
                          <DataTableCell>
                            <span className="font-medium text-gray-900">
                              {order.store_id ?? "—"}
                            </span>
                          </DataTableCell>
                          <DataTableCell>
                            <span className="text-gray-700 font-mono text-[11px]">{order.article_id ?? "—"}</span>
                          </DataTableCell>
                          <DataTableCell>
                            <span className="text-gray-700">{order.article_description ?? "—"}</span>
                          </DataTableCell>
                          <DataTableCell align="right">
                            <span className={cn("text-xs", stockColor(order.current_stock))}>
                              {order.current_stock ?? "—"}
                            </span>
                          </DataTableCell>
                          <DataTableCell align="right">
                            <span className="font-medium text-gray-900">
                              {order.recommended != null ? formatNumber(order.recommended) : "—"}
                            </span>
                          </DataTableCell>
                          <DataTableCell align="right">
                            <span className="text-gray-700">
                              {order.ros_rate != null ? order.ros_rate.toFixed(1) : "—"}
                            </span>
                          </DataTableCell>
                          <DataTableCell align="right">
                            <span className={cn("text-xs", strColor(order.str_rate))}>
                              {order.str_rate != null ? `${order.str_rate.toFixed(0)}%` : "—"}
                            </span>
                          </DataTableCell>
                          <DataTableCell align="right">
                            <span className={cn("text-xs", coverColor(order.cover_days))}>
                              {order.cover_days != null ? order.cover_days.toFixed(1) : "—"}
                            </span>
                          </DataTableCell>
                          <DataTableCell>
                            <span className="text-gray-700 whitespace-nowrap">
                              {formatDeliveryDate(order.delivery_date)}
                            </span>
                          </DataTableCell>
                          <DataTableCell>
                            {order.priority ? (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[10px] font-semibold",
                                  PRIORITY_BADGE[order.priority] ?? "bg-gray-100 text-gray-600",
                                )}
                              >
                                {order.priority}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </DataTableCell>
                          <DataTableCell>
                            {order.status ? (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[10px] font-medium",
                                  STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600",
                                )}
                              >
                                {order.status}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </DataTableCell>
                        </DataTableRow>
                      ))
                    )}
                  </DataTableBody>
                </DataTable>

                {/* ── Pagination ── */}
                {!isListLoading && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalItems={total}
                    pageSize={pageSize}
                    onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                    pageSizeOptions={[10, 20, 50, 100]}
                  />
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default InventoryReplenishmentPage;
