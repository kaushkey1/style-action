import { useNavigate, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  IndianRupee,
  TrendingUp,
  ShoppingBag,
  RefreshCw,
  Package,
  Zap,
  Bot,
  Truck,
  AlertTriangle,
  Activity,
  Clock,
  Target,
  Layers,
  Sparkles,
  Users,
  Heart,
  PackageCheck,
  Tag,
  MapPin,
  Settings,
  AlertCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Badge,
  Button,
  MetricCard,
  MetricGrid,
  SectionHeader,
  FilterBar,
  FilterMultiSelect,
  FilterDateRange,
  FilterClear,
  MobileFilterTrigger,
  MobileFilterSheet,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  EmptyState,
} from "@/components/ui";
import type { FilterDef } from "@/components/ui";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useToast } from "@/hooks/useToast";
import { useGlossaryTab } from "@/modules/glossary/useGlossary";
import { usePersonaStore } from "@/hooks/usePersonaStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useFeatureFlag } from "@/hooks/useScreenConfig";
import { cn, formatCompactNumber, getDataAvailableThroughDateIso, type RagStatus } from "@/lib/utils";
import {
  InsightsBanner,
  InsightsBannerSkeleton,
  InsightsEmpty,
  InsightsError,
} from "@/modules/store-view/components/InsightsBanner";
import { MorningBriefingExceptions } from "@/modules/briefing/components/MorningBriefingExceptions";
import { PageInfoBanners } from "@/components/data-scope/PageInfoBanners";
import { getDataScopeSnapshotNote } from "@/data/mockDataScope";
import { InsightsSidebar } from "@/modules/store-view/components/InsightsSidebar";
import { fetchPersonaInsights } from "@/modules/store-view/api/insightsApi";
import type {
  InsightData,
  InsightPersonaId,
} from "@/modules/store-view/api/insightsApi";
import {
  useDashboardFilterStore,
  filterKey,
  PRESELECTED_CATEGORY_NAMES,
} from "../stores/useDashboardFilterStore";
import type { DashboardFilters } from "../stores/useDashboardFilterStore";
import { personaMap } from "@/data/personaConfig";
import {
  dashboardApi,
  mapBusinessPulseKpiToDashboard,
  mapCommandCenterKpiToDashboard,
  type ScoreboardRow,
  type WorstPerformerCardData,
  type DashboardTabResponse,
  type FilterOptionsResponse,
  type BusinessPulseResponse,
  type CommandCenterKpiCard,
  type InventoryHealthResponse,
  type GeographyResponse,
  type OperationsResponse,
  type DashboardKpiCard,
} from "../api/dashboardApi";
import { BusinessPulseSection } from "../components/BusinessPulseSection";
import { computeNetRevenueTotal, formatRevenueCrMo } from "../utils/businessPulseMappers";
import { DashboardKpiGrid } from "../components/DashboardKpiGrid";
import { InventoryHealthSection } from "../components/InventoryHealthSection";
import { GeographySection } from "../components/GeographySection";
import { OperationsSupplyChainSection } from "../components/OperationsSupplyChainSection";
import type { CategoryDirectorFilters } from "@/modules/category-director/stores/useCategoryDirectorFilterStore";
import { useCategoryPerformance } from "@/modules/category-director/api/categoryDirectorHooks";
import { apiKpiToCategoryDirectorHealthKpi, kpiByCode } from "@/modules/category-director/lib/apiAdapters";
import type { CategoryDirectorHealthKpi } from "@/modules/category-director/data/mockCategoryDirectorData";
import type { KpiCard } from "@/modules/category-director/api/categoryDirectorApi";

// ---------------------------------------------------------------------------
// Icon map (used for both tab triggers and mock KPI tiles)
// ---------------------------------------------------------------------------

const kpiIcons: Record<string, LucideIcon> = {
  activity: Activity,
  "alert-triangle": AlertTriangle,
  bot: Bot,
  clock: Clock,
  heart: Heart,
  "indian-rupee": IndianRupee,
  layers: Layers,
  "map-pin": MapPin,
  package: Package,
  "package-check": PackageCheck,
  "refresh-cw": RefreshCw,
  settings: Settings,
  "shopping-bag": ShoppingBag,
  sparkles: Sparkles,
  tag: Tag,
  target: Target,
  "trending-up": TrendingUp,
  truck: Truck,
  users: Users,
  zap: Zap,
};

// ---------------------------------------------------------------------------
// Frontend tab ID → API tab slug
// ---------------------------------------------------------------------------

const TAB_SLUG_MAP: Record<string, string> = {
  // apex-leadership
  "apex-overview": "overview",
  "apex-pulse": "business-pulse",
  "apex-financial": "financial",
  "apex-inventory": "inventory-health",
  "apex-geography": "geography",
  "apex-categories": "categories",
  "apex-supply": "supply-chain",
  // ceo
  "ceo-pulse": "business-pulse",
  "ceo-inventory": "inventory-health",
  "ceo-geography": "geography",
  "ceo-supply": "operations",
  "ceo-categories": "categories",
  financial: "financial",
  customer: "customer",
  "apex-working-capital": "working-capital",
  // category-director
  pnl: "category-pnl",
  "sell-through": "sell-through",
  "range-otb": "range-otb",
  "cat-store-health": "store-health",
  lifecycle: "lifecycle",
  // sourcing-director
  "src-financial": "margins-compliance",
  "vendor-perf": "vendor-performance",
  "po-pipeline": "po-pipeline",
  fabric: "fabric-position",
  quality: "quality",
  "src-logistics": "logistics-rfid",
  // marketing-director
  "mkt-financial": "financial",
  "mkt-customer": "customer",
  campaigns: "campaigns",
  "channel-mix": "channel-mix",
  crm: "crm",
  content: "content-pipeline",
  // regional-director
  "reg-financial": "financial",
  "store-rankings": "store-rankings",
  competition: "competition",
  "vm-compliance": "vm-compliance",
  // ops-lead
  "ops-overview": "overview",
  "ops-operations": "operations",
  delivery: "delivery",
  inventory: "inventory",
  "customer-service": "customer-service",
};

const CEO_COMMAND_CENTER_TABS = [
  { id: "ceo-pulse", name: "Business Pulse", icon: "activity", kpis: [] },
  { id: "ceo-inventory", name: "Inventory Health", icon: "package", kpis: [] },
  { id: "ceo-geography", name: "Geography", icon: "map-pin", kpis: [] },
  // Category Performance moved to /categories — hidden from dashboard tabs
  // { id: "ceo-categories", name: "Category Performance", icon: "shopping-bag", kpis: [] },
  // Reserved for future use:
  // { id: "financial", name: "Financial", icon: "wallet", kpis: [] },
  {
    id: "ceo-supply",
    name: "Operations & Supply Chain",
    icon: "truck",
    kpis: [],
  },
] as const;

/** Maps each CEO command-center tab to its org_config `dashboard` feature flag. */
const CEO_TAB_FEATURE_FLAGS: Record<string, string> = {
  "ceo-pulse": "show_business_pulse",
  "ceo-inventory": "show_inventory_health",
  "ceo-geography": "show_geography",
  "ceo-categories": "show_category_performance",
  "ceo-supply": "show_operations",
};

/** `/command-center-dashboard/{role}/…` segment — not derived from persona or org role. */
const COMMAND_CENTER_API_ROLE = "ceo";

function toCategoryDirectorFilters(f: DashboardFilters): CategoryDirectorFilters {
  return {
    dateFrom: f.dateFrom,
    dateTo: f.dateTo,
    format: f.format,
    brand: f.brand,
    category: f.category,
    subcategory: f.subcategory,
    fashionGrade: f.fashionGrade,
  };
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  on_track: "On Track",
  warning: "Warning",
  critical: "Critical",
  neutral: "-",
};

// Temporary KPI suppression requested by product/design.
const HIDDEN_KPI_LABELS = new Set([
  "Categories On-Track",
  "Markdown Triggers",
  "Top-Up POs Pending",
  "OTB Consumption",
  "First-Through Velocity",
  "Options Aged >45d",
]);

function statusBadgeVariant(
  status: string,
): "success" | "warning" | "error" | "default" {
  switch (status) {
    case "on_track":
      return "success";
    case "warning":
      return "warning";
    case "critical":
      return "error";
    default:
      return "default";
  }
}

function toRagStatus(s: string): RagStatus | undefined {
  if (s === "on_track") return "on-track";
  if (s === "warning") return "warning";
  if (s === "critical") return "critical";
  return undefined;
}

/**
 * Display frame for the Net Revenue tile — mirrors the Category Performance tab's
 * `ww-sales-plan` entry so the card resolves identically (label override, target,
 * neutral→warning status default via the shared adapter).
 */
const NET_REVENUE_FRAME: CategoryDirectorHealthKpi = {
  id: "ww-sales-plan",
  label: "Net Revenue",
  value: "N/A",
  target: "—",
  status: "warning",
  trendDelta: 0,
  trendLabel: "vs LW",
  trendDirection: "flat",
  infoKey: "Net Revenue vs Plan",
};

/**
 * "Net Revenue" KPI card for the Business Pulse strip. Status + target come from
 * the same `/category-performance` `ww-sales-plan` card the Category Performance
 * tab uses (via the shared adapter → "Warning" badge + "Target: ≥100% of plan").
 * While that fetch is unresolved, falls back to the net total already present in
 * the business-pulse payload so the value is never blank.
 */
function buildNetRevenueCard(
  pulse: BusinessPulseResponse,
  netSalesCard: KpiCard | undefined,
): DashboardKpiCard {
  const health = apiKpiToCategoryDirectorHealthKpi(netSalesCard, NET_REVENUE_FRAME, {
    labelOverride: "Net Revenue",
  });
  const isPlaceholder = health.value === "N/A";
  return {
    code: "net_revenue",
    label: "Net Revenue",
    description: "",
    value: null,
    value_formatted: isPlaceholder
      ? formatRevenueCrMo(computeNetRevenueTotal(pulse))
      : String(health.value),
    unit: "",
    target_label: isPlaceholder ? "—" : health.target,
    status: isPlaceholder ? "neutral" : health.status,
    color: "",
    bg_color: "",
  };
}

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

function stripPrefix(v: string): string {
  return v.replace(/^\d+\.\s*/, '');
}

function toMultiOptions(values?: string[]): { value: string; label: string }[] {
  if (!values?.length) return [];
  return values.map((v) => ({ value: v, label: stripPrefix(v) }));
}

function normalizeRoleSlug(roleSlug: string | null): string {
  if (!roleSlug) return "";
  return roleSlug
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

const FILTER_QUERY_MAP: Record<keyof DashboardFilters, string> = {
  dateFrom: "from_date",
  dateTo: "to_date",
  format: "formats",
  brand: "brands",
  category: "categories",
  subcategory: "subcategories",
  fashionGrade: "fashion_grades",
  siteType: "site_types",
};

function filtersFromSearch(search: string): DashboardFilters {
  const params = new URLSearchParams(search);
  const current = useDashboardFilterStore.getState().filters;
  const getMulti = (key: string, storeKey: keyof DashboardFilters): string => {
    if (!params.has(key)) return current[storeKey];
    const raw = params.get(key);
    if (!raw || raw.trim().length === 0) return current[storeKey];
    return raw;
  };
  return {
    dateFrom: params.has("from_date")
      ? (params.get("from_date")?.trim() ?? "")
      : current.dateFrom,
    dateTo: params.has("to_date")
      ? (params.get("to_date")?.trim() ?? "")
      : current.dateTo,
    format: getMulti("formats", "format"),
    brand: getMulti("brands", "brand"),
    category: getMulti("categories", "category"),
    subcategory: getMulti("subcategories", "subcategory"),
    fashionGrade: getMulti("fashion_grades", "fashionGrade"),
    siteType: getMulti("site_types", "siteType"),
  };
}

function withFilterQuery(search: string, filters: DashboardFilters): string {
  const params = new URLSearchParams(search);
  for (const [key, q] of Object.entries(FILTER_QUERY_MAP) as [
    keyof DashboardFilters,
    string,
  ][]) {
    const value = filters[key];
    if (key === "dateFrom" || key === "dateTo") {
      if (value) params.set(q, value);
      else params.delete(q);
      continue;
    }
    if (value && value !== "all") params.set(q, value);
    else params.delete(q);
  }
  const next = params.toString();
  return next ? `?${next}` : "";
}

// ---------------------------------------------------------------------------
// Revenue Scoreboard
// ---------------------------------------------------------------------------

function RevenueScoreboard({ rows }: { rows: ScoreboardRow[] }) {
  if (!rows.length) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Revenue Scoreboard" />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 pr-3 font-medium text-gray-500">
                Period
              </th>
              <th className="text-right py-2 px-3 font-medium text-gray-500">
                Actual
              </th>
              <th className="text-right py-2 px-3 font-medium text-gray-500">
                Plan
              </th>
              <th className="text-right py-2 px-3 font-medium text-gray-500">
                Ach %
              </th>
              <th className="text-right py-2 pl-3 font-medium text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.period}
                className="border-b border-gray-50 last:border-0"
              >
                <td className="py-2 pr-3 font-medium text-gray-900">
                  {row.period}
                </td>
                <td className="py-2 px-3 text-right font-semibold text-gray-900">
                  {row.actual_formatted}
                </td>
                <td
                  className={cn(
                    "py-2 px-3 text-right",
                    row.is_plan_placeholder ? "text-gray-400" : "text-gray-900",
                  )}
                >
                  {row.plan_formatted}
                </td>
                <td
                  className={cn(
                    "py-2 px-3 text-right",
                    row.is_plan_placeholder ? "text-gray-400" : "text-gray-900",
                  )}
                >
                  {row.ach_pct_formatted}
                </td>
                <td className="py-2 pl-3 text-right">
                  {row.status && row.status_color ? (
                    <Badge
                      variant={statusBadgeVariant(row.status)}
                      className="text-xs"
                    >
                      {STATUS_LABELS[row.status] ?? row.status}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Worst Performers
// ---------------------------------------------------------------------------

function ApiWorstPerformerCard({ card }: { card: WorstPerformerCardData }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {card.dimension}
        </span>
        <span className="text-xs font-semibold bg-red-100 text-red-600 rounded-full px-2.5 py-0.5">
          {card.metric_label}
        </span>
      </div>
      <h4 className="text-sm font-bold text-gray-900 mb-1.5">
        {card.entity_name}
      </h4>
      <div className="flex items-center gap-2 text-sm mb-2">
        <span>
          Value:{" "}
          <strong
            // eslint-disable-next-line no-restricted-syntax -- API provides dynamic hex color per card
            style={{ color: card.value_color }}
          >
            {card.value_formatted}
          </strong>
        </span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500">{card.target_label}</span>
      </div>
      {card.detail_lines.length > 0 && (
        <div className="space-y-0.5">
          {card.detail_lines.map((line, i) => {
            const isAgentLine = line.toLowerCase().includes("agent");
            return (
              <p
                key={i}
                className={cn(
                  "text-sm",
                  isAgentLine ? "text-primary" : "text-gray-500",
                )}
              >
                {line}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WorstPerformersSection({
  cards,
}: {
  cards: WorstPerformerCardData[];
}) {
  if (!cards.length) return null;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title={
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-500" />
            Worst Performers
          </span>
        }
      />
      <div className="space-y-3 mt-3">
        {cards.map((card) => (
          <ApiWorstPerformerCard key={card.dimension} card={card} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading / error
// ---------------------------------------------------------------------------

function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner size="lg" />
    </div>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertCircle className="w-5 h-5 shrink-0" />
      <div>
        <p className="font-medium">Failed to load dashboard data</p>
        <p className="text-xs text-red-500 mt-0.5">{message}</p>
      </div>
    </div>
  );
}

const showRevenueScoreboard = false;

function getErrorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.detail === "string") return o.detail;
  }
  return "Unknown error";
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DashboardPage() {
  const { personaId } = usePersonaStore();
  const activeRoleSlug = useAuthStore((s) => s.activeRoleSlug);
  const { filters, setFilter, resetFilters, clearFilters } =
    useDashboardFilterStore();
  const { success: toastSuccess } = useToast();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  // Insights state
  const INSIGHT_PERSONAS: InsightPersonaId[] = [
    "ceo",
    "regional",
    "sourcing",
    "ops",
    "category",
    "category-director",
    "marketing",
  ];
  const insightPersonaId = INSIGHT_PERSONAS.includes(
    personaId as InsightPersonaId,
  )
    ? (personaId as InsightPersonaId)
    : null;
  const [insightsData, setInsightsData] = useState<InsightData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(false);
  const [insightsEmpty, setInsightsEmpty] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // API state
  const [filterOptions, setFilterOptions] =
    useState<FilterOptionsResponse | null>(null);
  const [tabData, setTabData] = useState<DashboardTabResponse | null>(null);
  const [businessPulseData, setBusinessPulseData] =
    useState<BusinessPulseResponse | null>(null);
  const [businessPulseError, setBusinessPulseError] = useState<string | null>(
    null,
  );
  /** Raw `data` object from command-center tab endpoint (CEO dashboard). */
  const [ceoCommandCenterPayload, setCeoCommandCenterPayload] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Applied filters — API calls only fire when these change
  const [appliedFilters, setAppliedFilters] =
    useState<DashboardFilters>(filters);
  const filtersChanged = filterKey(filters) !== filterKey(appliedFilters);

  const normalizedRoleSlug = normalizeRoleSlug(activeRoleSlug);

  // Insights / labels use the selected persona; Command Center tabs are the same for every user.
  const persona = personaMap[personaId];

  const HIDDEN_TABS = new Set(["apex-financial", "apex-categories"]);
  // Each CEO tab is gated by its org_config `dashboard` feature flag (defaults to
  // shown when the flag or config is absent — see useFeatureFlag).
  const showBusinessPulse = useFeatureFlag("dashboard", "show_business_pulse");
  const showInventoryHealth = useFeatureFlag(
    "dashboard",
    "show_inventory_health",
  );
  const showGeography = useFeatureFlag("dashboard", "show_geography");
  const showCategoryPerformance = useFeatureFlag(
    "dashboard",
    "show_category_performance",
  );
  const showOperations = useFeatureFlag("dashboard", "show_operations");
  const tabFlagEnabled: Record<string, boolean> = {
    show_business_pulse: showBusinessPulse,
    show_inventory_health: showInventoryHealth,
    show_geography: showGeography,
    show_category_performance: showCategoryPerformance,
    show_operations: showOperations,
  };
  const tabs = CEO_COMMAND_CENTER_TABS.filter((t) => {
    if (HIDDEN_TABS.has(t.id)) return false;
    const flag = CEO_TAB_FEATURE_FLAGS[t.id];
    return flag ? (tabFlagEnabled[flag] ?? true) : true;
  });

  // Active tab from URL (validated against available tabs)
  const tabParam = new URLSearchParams(location.search).get("tab");
  const defaultTabId = tabs[0]?.id ?? "";
  const activeTabId = tabs.some((t) => t.id === tabParam)
    ? tabParam!
    : defaultTabId;

  // Feed the glossary breadcrumb's Tab segment.
  useGlossaryTab(tabs.find((t) => t.id === activeTabId)?.name);

  const apiRole = COMMAND_CENTER_API_ROLE;
  const apiTab = TAB_SLUG_MAP[activeTabId] ?? null;

  const applyFiltersToUrl = useCallback(
    (nextFilters: DashboardFilters) => {
      const nextSearch = withFilterQuery(location.search, nextFilters);
      const currentSearch = location.search || "";
      if (nextSearch !== currentSearch) {
        navigate(
          { pathname: "/dashboard", search: nextSearch },
          { replace: true },
        );
      }
    },
    [location.search, navigate],
  );

  const handleTabChange = (value: string) => {
    if (value === activeTabId) return;
    const params = new URLSearchParams(location.search);
    if (value === defaultTabId) params.delete("tab");
    else params.set("tab", value);
    const next = params.toString();
    navigate(`/dashboard${next ? `?${next}` : ""}`, { replace: true });
  };

  // URL → store filters (reload + back/forward persistence).
  useEffect(() => {
    const parsed = filtersFromSearch(location.search);
    const current = useDashboardFilterStore.getState().filters;
    if (filterKey(parsed) === filterKey(current)) return;
    useDashboardFilterStore.setState({ filters: parsed });
    setAppliedFilters(parsed);
  }, [location.search]);

  // Reset filters + clear tab data when persona changes
  const prevPersonaRef = useRef(personaId);
  useEffect(() => {
    if (prevPersonaRef.current !== personaId) {
      prevPersonaRef.current = personaId;
      resetFilters();
      // Zustand updates are synchronous — read the reset state directly
      setAppliedFilters(useDashboardFilterStore.getState().filters);
      setTabData(null);
      setBusinessPulseData(null);
      setBusinessPulseError(null);
      setCeoCommandCenterPayload(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personaId]);

  // Fetch insights when persona changes
  const loadInsights = (pid: InsightPersonaId) => {
    let cancelled = false;
    setInsightsLoading(true);
    setInsightsError(false);
    setInsightsEmpty(false);

    fetchPersonaInsights(pid)
      .then((data) => {
        if (!cancelled) setInsightsData(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.status_code === 404 || err?.detail?.includes("No insight")) {
          setInsightsEmpty(true);
        } else {
          setInsightsError(true);
        }
        setInsightsData(null);
      })
      .finally(() => {
        if (!cancelled) setInsightsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    if (!insightPersonaId) {
      setInsightsData(null);
      setInsightsError(false);
      setInsightsEmpty(false);
      setInsightsLoading(false);
      return;
    }

    return loadInsights(insightPersonaId);
  }, [insightPersonaId]);

  // Cascading filter options: refetch whenever any filter value changes.
  useEffect(() => {
    dashboardApi
      .filterOptions(filters)
      .then(setFilterOptions)
      .catch((err) => {
        console.error("[Dashboard] Failed to load filter options:", err);
      });
  }, [filters]);

  // Fetch tab data — always `/command-center-dashboard/ceo/{segment}` (not tied to persona or org role).
  useEffect(() => {
    if (!apiRole || !apiTab) {
      setTabData(null);
      setBusinessPulseData(null);
      setBusinessPulseError(null);
      setCeoCommandCenterPayload(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setBusinessPulseError(null);

    const isBusinessPulseTab = apiTab === "business-pulse";

    const run = async () => {
      try {
        const raw = await dashboardApi.commandCenterTab(
          apiRole,
          apiTab,
          appliedFilters,
        );
        if (cancelled) return;
        setCeoCommandCenterPayload(raw);
        const kpiRaw = raw.kpi_cards;
        const kpis = Array.isArray(kpiRaw)
          ? (kpiRaw as CommandCenterKpiCard[]).map(
              mapCommandCenterKpiToDashboard,
            )
          : [];
        setTabData({
          snapshot_date: new Date().toISOString().slice(0, 10),
          kpi_cards: kpis,
          revenue_scoreboard: [],
          worst_performers: [],
        });
        setError(null);
        if (isBusinessPulseTab) {
          setBusinessPulseData(raw as unknown as BusinessPulseResponse);
          setBusinessPulseError(null);
        } else {
          setBusinessPulseData(null);
          setBusinessPulseError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setTabData(null);
          setBusinessPulseData(null);
          setBusinessPulseError(null);
          setCeoCommandCenterPayload(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [apiRole, apiTab, appliedFilters, personaId]);

  // Filter select options
  const fmtOptions = useMemo(
    () => toMultiOptions(filterOptions?.formats),
    [filterOptions],
  );
  const brdOptions = useMemo(
    () => toMultiOptions(filterOptions?.brands),
    [filterOptions],
  );
  const catOptions = useMemo(
    () => toMultiOptions(filterOptions?.categories),
    [filterOptions],
  );

  // Auto-select predefined categories once the /filters API returns the full
  // list with correct serial-number prefixes. Runs once on initial load.
  const catPreselected = useRef(false);
  useEffect(() => {
    if (catPreselected.current || catOptions.length === 0) return;
    const current = filters.category;
    if (current && current !== 'all') {
      catPreselected.current = true;
      return;
    }
    catPreselected.current = true;
    const apiLookup = new Map(catOptions.map((o) => [stripPrefix(o.value).toUpperCase(), o.value]));
    const resolved = PRESELECTED_CATEGORY_NAMES
      .map((name) => apiLookup.get(name.toUpperCase()))
      .filter((v): v is string => v !== undefined);
    if (resolved.length > 0) {
      const joined = resolved.join(',');
      setFilter('category', joined);
      setAppliedFilters((prev) => ({ ...prev, category: joined }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time preselection when API options first load
  }, [catOptions]);

  const subcatOptions = useMemo(
    () => toMultiOptions(filterOptions?.subcategories),
    [filterOptions],
  );
  const grdOptions = useMemo(() => {
    const gradeStrings = filterOptions?.fashion_grades ?? [];
    if (gradeStrings.length > 0) {
      return gradeStrings.map((g) => ({ value: g, label: g }));
    }
    const gradeObjects = filterOptions?.grades ?? [];
    if (gradeObjects.length > 0) {
      return gradeObjects.map((g) => ({ value: g.code, label: g.label }));
    }
    return [];
  }, [filterOptions]);
  const sttOptions = useMemo(
    () => toMultiOptions(
      filterOptions?.site_types?.length ? filterOptions.site_types : ['STORE', 'DC'],
    ),
    [filterOptions],
  );

  // Net Revenue tile on the Business Pulse strip reuses the Category Performance
  // tab's `/category-performance` data (status + target). Gated to the pulse tab;
  // shares React Query cache with that tab so there's no duplicate request.
  const categoryPerf = useCategoryPerformance(
    toCategoryDirectorFilters(appliedFilters),
    { enabled: activeTabId === "ceo-pulse" },
  );

  const displayKpiCards = useMemo((): DashboardKpiCard[] => {
    let cards: DashboardKpiCard[] = [];
    if (activeTabId === "ceo-pulse" && businessPulseData?.kpi_cards?.length) {
      // Business Pulse strip: drop Revenue Run Rate + Rate of Sale, and insert
      // Net Revenue right after Gross Revenue. Checked before the generic
      // tabData branch because tabData.kpi_cards is also populated for this tab.
      const HIDDEN_PULSE_CODES = new Set(["revenue_run_rate", "ros"]);
      const netSalesCard = kpiByCode(categoryPerf.data?.kpi_cards, "ww-sales-plan");
      const netCard = buildNetRevenueCard(businessPulseData, netSalesCard);
      const ordered: DashboardKpiCard[] = [];
      for (const raw of businessPulseData.kpi_cards) {
        if (HIDDEN_PULSE_CODES.has(raw.code)) continue;
        const card = mapBusinessPulseKpiToDashboard(raw);
        ordered.push(card);
        if (card.code === "gross_sales") ordered.push(netCard);
      }
      if (!ordered.some((c) => c.code === "net_revenue")) {
        ordered.unshift(netCard);
      }
      cards = ordered;
    } else if (tabData?.kpi_cards?.length) {
      cards = tabData.kpi_cards;
    } else {
      cards = tabData?.kpi_cards ?? [];
    }
    // Append inventory key_metrics to the main KPI grid when on the inventory tab.
    if (activeTabId === "ceo-inventory" && ceoCommandCenterPayload) {
      const invPayload =
        ceoCommandCenterPayload as unknown as InventoryHealthResponse;
      const invMetrics = invPayload?.key_metrics ?? [];
      const converted: DashboardKpiCard[] = invMetrics.map((m) => ({
        code: m.label.toLowerCase().replace(/\s+/g, "_"),
        label: m.label,
        description: "",
        value: m.value,
        value_formatted: m.value_formatted,
        unit: "",
        target_label: m.target,
        status: (m.status === "on_track" ||
        m.status === "warning" ||
        m.status === "critical"
          ? m.status
          : "neutral") as DashboardKpiCard["status"],
        color: "",
        bg_color: "",
      }));
      cards = [...cards, ...converted];
    }
    return cards.filter(
      (card) => !HIDDEN_KPI_LABELS.has((card.label ?? "").trim()),
    );
  }, [activeTabId, businessPulseData, tabData, ceoCommandCenterPayload, categoryPerf.data]);

  // KPI grid layout is owned by <DashboardKpiGrid> — see ux-patterns.md §20.

  // Mobile filter sheet definitions
  const mobileFilterDefs: FilterDef[] = useMemo(
    () => [
      { type: "daterange" as const, key: "date", label: "Date Range", minDate: "2026-04-01", maxDate: getDataAvailableThroughDateIso() },
      {
        type: "multiselect" as const,
        key: "format",
        label: "Format",
        options: fmtOptions,
      },
      {
        type: "multiselect" as const,
        key: "brand",
        label: "Brand",
        options: brdOptions,
      },
      {
        type: "multiselect" as const,
        key: "category",
        label: "Category",
        options: catOptions,
      },
      {
        type: "multiselect" as const,
        key: "subcategory",
        label: "Subcategory",
        options: subcatOptions,
      },
      {
        type: "multiselect" as const,
        key: "fashionGrade",
        label: "Grade",
        options: grdOptions,
      },
      {
        type: "multiselect" as const,
        key: "siteType",
        label: "Site Type",
        options: sttOptions,
      },
    ],
    [
      fmtOptions,
      brdOptions,
      catOptions,
      subcatOptions,
      grdOptions,
      sttOptions,
    ],
  );

  const mobileFilterValues = useMemo(
    () => ({
      date: `${filters.dateFrom}|${filters.dateTo}`,
      format: filters.format,
      brand: filters.brand,
      category: filters.category,
      subcategory: filters.subcategory,
      fashionGrade: filters.fashionGrade,
      siteType: filters.siteType,
    }),
    [filters],
  );

  const mobileActiveFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateFrom || filters.dateTo) count++;
    for (const key of [
      "format",
      "brand",
      "category",
      "subcategory",
      "fashionGrade",
      "siteType",
    ] as const) {
      if (filters[key] && filters[key] !== "all") count++;
    }
    return count;
  }, [filters]);

  const handleMobileFilterApply = useCallback(
    (vals: Record<string, string>) => {
      // Parse date range
      const [dateFrom, dateTo] = (vals.date ?? "|").split("|");
      setFilter("dateFrom", dateFrom ?? "");
      setFilter("dateTo", dateTo ?? "");
      // Apply all other filters
      for (const key of [
        "format",
        "brand",
        "category",
        "subcategory",
        "fashionGrade",
        "siteType",
      ] as const) {
        setFilter(key, vals[key] ?? "all");
      }
      // Auto-apply to API
      const newFilters = useDashboardFilterStore.getState().filters;
      setAppliedFilters(newFilters);
      applyFiltersToUrl(newFilters);
    },
    [applyFiltersToUrl, setFilter],
  );

  const handleClearAllFilters = useCallback(() => {
    clearFilters();
    const reset = useDashboardFilterStore.getState().filters;
    setAppliedFilters(reset);
    applyFiltersToUrl(reset);
    toastSuccess("Filters have been cleared");
  }, [applyFiltersToUrl, clearFilters, toastSuccess]);

  const handleFilterChange = useCallback(
    (key: Parameters<typeof setFilter>[0], value: string) => {
      setFilter(key, value);
    },
    [setFilter],
  );

  return (
    <div className="space-y-4 animate-fadeInUp lg:-mt-2">
      {/* 1. Persona Insights */}
      {insightPersonaId && (
        <>
          {insightsLoading && <InsightsBannerSkeleton />}
          {insightsError && insightPersonaId && (
            <InsightsError onRetry={() => loadInsights(insightPersonaId)} />
          )}
          {insightsEmpty && (
            <InsightsEmpty personaLabel={persona?.name ?? "User"} />
          )}
          {!insightsLoading && insightsData && (
            <>
              {personaId === 'ceo' ? (
                <MorningBriefingExceptions
                  key={`${insightPersonaId}-${insightsData.insight_run_id}`}
                  data={insightsData}
                  onViewAll={() => navigate('/review')}
                />
              ) : (
                <InsightsBanner
                  key={`${insightPersonaId}-${insightsData.insight_run_id}`}
                  data={insightsData}
                  onViewAll={() => navigate('/review?tab=insights&from=dashboard')}
                  onOpenInsight={(id) => navigate(`/review?tab=insights&insight=${id}&from=dashboard`)}
                />
              )}
            </>
          )}
          {!insightsLoading && insightsData && (
            <InsightsSidebar
              data={insightsData}
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          )}
        </>
      )}

      {/* Data scope notice */}
      <PageInfoBanners note={getDataScopeSnapshotNote()} />

      {/* 2. Mobile filter sheet — portal, must stay mounted outside the sticky region */}
      {isMobile && (
        <MobileFilterSheet
          isOpen={mobileFilterOpen}
          onClose={() => setMobileFilterOpen(false)}
          filters={mobileFilterDefs}
          values={mobileFilterValues}
          onApply={handleMobileFilterApply}
          onClear={handleClearAllFilters}
        />
      )}

      {/* 3. Persona tabs with sticky filters + tab strip */}
      {tabs.length > 0 && (
        <Tabs
          value={activeTabId}
          onValueChange={handleTabChange}
          key={`${personaId}:${normalizedRoleSlug}`}
        >
          {/* Sticky control bar — filters + tab strip stay pinned while content scrolls */}
          <div className="sticky top-0 z-20 -mx-4 px-4 py-3 space-y-3 bg-gray-50/90 backdrop-blur-sm">
            {isMobile ? (
              <MobileFilterTrigger
                activeCount={mobileActiveFilterCount}
                onOpen={() => setMobileFilterOpen(true)}
              />
            ) : (
              <FilterBar>
                <FilterDateRange
                  fromValue={filters.dateFrom}
                  toValue={filters.dateTo}
                  onFromChange={(v) => handleFilterChange("dateFrom", v)}
                  onToChange={(v) => handleFilterChange("dateTo", v)}
                  minDate="2026-04-01"
                  maxDate={getDataAvailableThroughDateIso()}
                />
                <FilterMultiSelect
                  value={filters.format}
                  onChange={(v) => handleFilterChange("format", v)}
                  options={fmtOptions}
                  placeholder="Format"
                />
                <FilterMultiSelect
                  value={filters.brand}
                  onChange={(v) => handleFilterChange("brand", v)}
                  options={brdOptions}
                  placeholder="Brand"
                />
                <FilterMultiSelect
                  value={filters.category}
                  onChange={(v) => handleFilterChange("category", v)}
                  options={catOptions}
                  placeholder="Category"
                />
                {/* Sub-Category sits immediately after Category by design — they're
                    read together as a hierarchy. See ux-patterns.md "Global Filter Strip". */}
                <FilterMultiSelect
                  value={filters.subcategory}
                  onChange={(v) => handleFilterChange("subcategory", v)}
                  options={subcatOptions}
                  placeholder="Sub-Category"
                />
                <FilterMultiSelect
                  value={filters.siteType}
                  onChange={(v) => handleFilterChange("siteType", v)}
                  options={sttOptions}
                  placeholder="Site Type"
                />
                <FilterMultiSelect
                  value={filters.fashionGrade}
                  onChange={(v) => setFilter("fashionGrade", v)}
                  options={grdOptions}
                  placeholder="Grade"
                />
                {filtersChanged && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setAppliedFilters(filters);
                      applyFiltersToUrl(filters);
                    }}
                    className="text-xs text-nowrap"
                  >
                    Apply Filters
                  </Button>
                )}
                <FilterClear
                    className="text-nowrap border p-2 rounded-lg border-gray-300"
                    onClear={handleClearAllFilters}
                  />
              </FilterBar>
            )}

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4 min-w-0 overflow-x-scroll scrollbar-hide">
              <TabsList variant="underline">
                {tabs.map((tab) => {
                  const TabIcon = kpiIcons[tab.icon] ?? Activity;
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} variant="underline">
                      <TabIcon className="w-3.5 h-3.5" />
                      <span className="whitespace-nowrap">{tab.name}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {apiRole ? (
                loading ? (
                  <DashboardLoading />
                ) : error ? (
                  <DashboardError message={error} />
                ) : tabData ? (
                  <div className="space-y-4">
                    {displayKpiCards.length > 0 && (
                      <DashboardKpiGrid>
                        {displayKpiCards.map((card) => (
                          <MetricCard
                            key={card.code}
                            // size="sm"
                            label={
                              card.label === "ROS"
                                ? "Rate of Sale Per Day"
                                : card.label === "Gross Sales"
                                  ? "Gross Revenue"
                                  : card.label
                            }
                            infoKey={
                              typeof card.label === "string"
                                ? (card.label === "Gross Sales" ? "Gross Revenue" : card.label)
                                : undefined
                            }
                            infoExtra={
                              card.discount_formatted
                                ? `Discount: ${card.discount_formatted}`
                                : undefined
                            }
                            // description={card.description}
                            value={
                              card.value != null &&
                              Number.isFinite(card.value) &&
                              Math.abs(card.value) >= 1000 &&
                              !/[₹%CrLk/]/.test(card.value_formatted)
                                ? formatCompactNumber(card.value)
                                : card.value_formatted
                            }
                            status={card.is_placeholder ? undefined : toRagStatus(card.status)}
                            subtitle={
                              card.is_placeholder
                                ? "Data integration in progress"
                                : card.target_label && card.target_label.trim() !== "—"
                                  ? `Target: ${card.target_label}`
                                  : undefined
                            }
                            className={
                              card.is_placeholder ? "opacity-60" : undefined
                            }
                          />
                        ))}
                      </DashboardKpiGrid>
                    )}
                    {Boolean(showRevenueScoreboard) && (
                      <MetricGrid columns={2}>
                        <RevenueScoreboard
                          rows={tabData.revenue_scoreboard ?? []}
                        />
                        <WorstPerformersSection
                          cards={tabData.worst_performers ?? []}
                        />
                      </MetricGrid>
                    )}
                    {tab.id === "ceo-pulse" && (
                      <BusinessPulseSection
                        pulse={businessPulseData}
                        pulseError={businessPulseError}
                      />
                    )}
                    {tab.id === "ceo-inventory" && (
                      <InventoryHealthSection
                        data={
                          ceoCommandCenterPayload as unknown as InventoryHealthResponse
                        }
                        hideKeyMetrics
                      />
                    )}
                    {tab.id === "ceo-geography" && (
                      <GeographySection
                        data={
                          ceoCommandCenterPayload as unknown as GeographyResponse
                        }
                      />
                    )}
                    {/* Reserved for future use:
                    {tab.id === "financial" && (
                      <FinancialSection data={ceoCommandCenterPayload as unknown as FinancialResponse} />
                    )}
                    */}
                    {tab.id === "ceo-supply" && (
                      <OperationsSupplyChainSection
                        data={
                          ceoCommandCenterPayload as unknown as OperationsResponse
                        }
                      />
                    )}
                  </div>
                ) : null
              ) : (
                <EmptyState
                  title="No live dashboard for this role"
                  description="This persona is not yet connected to live API data."
                  variant="neutral"
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
