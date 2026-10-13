/* eslint-disable design-system/prefer-metric-grid, design-system/prefer-section-header */
import { useMemo, useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Brain,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Star,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertTriangle,
  Award,
} from "lucide-react";
import {
  Badge,
  BottomSheet,
  Button,
  MetricTooltip,
  EmptyState,
  Skeleton,
  InfoHeaderIcon,
  DrillMenu,
} from "@/components/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { getStoreCategoryDrillTargets, getChartDrillTargets } from "@/lib/routing";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { storeIntelligenceApi } from "../api/storeIntelligenceApi";
import type { StoreIntelligenceDetailResponse } from "../api/storeIntelligenceApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { CHART_PRIMARY, CHART_BASELINE, CHART_GRID } from "@/data/chartColors";
import { StoreProfileView } from "./StoreProfileView";
import { StoreComparisonSheet } from "./StoreComparisonSheet";
import { getCurrencySymbol, formatCurrency } from '@/lib/utils';


const formatBestPeriodLabel = (value: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  const yearMonthMatch = /^(\d{4})-(\d{1,2})$/.exec(trimmed);
  if (yearMonthMatch) {
    const year = Number(yearMonthMatch[1]);
    const month = Number(yearMonthMatch[2]);
    if (month >= 1 && month <= 12) {
      const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-US", {
        month: "short",
      });
      return `${monthLabel} - ${year}`;
    }
  }
  return trimmed;
};

const DEMAND_SIGNAL_LABELS: Record<string, string> = {
  'very-strong': 'Very Strong',
  strong: 'Strong',
  stable: 'Stable',
  weak: 'Weak',
  declining: 'Declining',
};

function demandSignalLabel(signal: string | null): string {
  if (!signal) return '';
  return DEMAND_SIGNAL_LABELS[signal] ?? signal;
}

function demandSignalVariant(
  signal: string | null,
): "success" | "destructive" | "secondary" {
  if (!signal) return "secondary";
  if (signal === "strong" || signal === "very-strong") return "success";
  if (signal === "weak" || signal === "declining") return "destructive";
  return "secondary";
}

function threatBadgeVariant(
  threat: string,
): "destructive" | "warning" | "secondary" {
  if (threat === "high" || threat === "HIGH") return "destructive";
  if (threat === "medium" || threat === "MEDIUM") return "warning";
  return "secondary";
}

// Deterministic tinted avatar colour from a brand name (stable per brand).
const COMPETITOR_AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-cyan-100 text-cyan-700",
  "bg-teal-100 text-teal-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

function competitorAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const idx = hash % COMPETITOR_AVATAR_COLORS.length;
  return COMPETITOR_AVATAR_COLORS[idx] ?? "bg-gray-100 text-gray-600";
}

/**
 * Competitor brand logo. Renders the API-provided `logoUrl` (once the backend supplies
 * it via the CDN) and falls back to a deterministic coloured-initial avatar on error or
 * when no logo is available — so the slot always shows something.
 */
function CompetitorLogo({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}): React.ReactNode {
  const [failed, setFailed] = useState(false);
  const shape = "h-9 w-9 shrink-0 rounded-lg border border-gray-200";
  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        className={cn(shape, "bg-white object-cover")}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className={cn(shape, competitorAvatarColor(name), "flex items-center justify-center text-sm font-semibold")}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

// ── Review sentiment type ──

interface ReviewSentimentItem {
  topic: string;
  sentiment: "positive" | "negative" | "neutral";
  quote: string;
  rating: number;
}

interface DemandTableRow {
  category: string;
  salesIndex: number | null;
  growthYoY: number | null;
  sellThrough30: number | null;
  signal: string | null;
  bestPeriod: string | null;
  bestRev: number | null;
  currentRev: number | null;
}

interface StoreIntelligenceDetailProps {
  storeId: string;
  storeIds?: string[];
  yearMonth: string;
  /** Hide the internal back-button + store-name title row when embedded in a host
   *  page that already provides the header (e.g. the Store Detail tab). */
  hideHeader?: boolean;
  /** Sub-tab (Profile/Demand/Competition/Actions) style. Defaults to the
   *  standalone page's underline tabs; embed hosts can request pills to
   *  differentiate from the host page's own underline tabs. */
  subTabVariant?: 'underline' | 'pills';
}

export function StoreIntelligenceDetail({
  storeId,
  storeIds,
  yearMonth,
  hideHeader = false,
  subTabVariant = 'underline',
}: StoreIntelligenceDetailProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isCommandContext = location.pathname.startsWith("/command/");
  const storeDetailBasePath = isCommandContext
    ? "/command/store-view/store"
    : "/store-view/store";

  const isMobile = useIsMobile();

  const [comparisonOpen, setComparisonOpen] = useState(false);
  // Mobile demand card → drill-down bottom sheet (consistent with the store-list card).
  const [drillCategory, setDrillCategory] = useState<string | null>(null);

  // API state
  const [apiDetail, setApiDetail] =
    useState<StoreIntelligenceDetailResponse | null>(null);
  const [apiLoading, setApiLoading] = useState(true);

  const peerStoreIds = useMemo(() => [storeId], [storeId]);

  // sessionStorage tab memory
  const tabStorageKey = `intelligence-tab-${storeId}`;
  const savedTab =
    typeof window !== "undefined"
      ? sessionStorage.getItem(tabStorageKey)
      : null;
  const [activeTab, setActiveTab] = useState(savedTab || "profile");

  useEffect(() => {
    sessionStorage.setItem(tabStorageKey, activeTab);
  }, [activeTab, tabStorageKey]);

  // Fetch store detail from API
  useEffect(() => {
    let cancelled = false;
    setApiLoading(true);
    setApiDetail(null);
    const fetchDetail = async () => {
      try {
        const data = await storeIntelligenceApi.detail(storeId, { year_month: yearMonth });
        if (!cancelled) setApiDetail(data);
      } catch (e) {
        console.error("Failed to fetch store detail:", e);
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    };
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [storeId, yearMonth]);

  const competitors = useMemo(() => {
    // Prefer flat competition_analysis; fall back to analysis_data.competitiveLandscape.competitors
    if (apiDetail?.competition_analysis?.length) {
      return apiDetail.competition_analysis.map((c, i) => ({
        id: `comp-${i}`,
        storeName: c.competitor_name ?? "Unknown",
        brandChain: "",
        tier: "direct" as string,
        distanceKm: c.distance_km ?? 0,
        latitude: c.latitude ?? 0,
        longitude: c.longitude ?? 0,
        estimatedSft: c.estimated_size_sft ?? 0,
        rating: c.google_rating ?? 0,
        threatLevel: "" as string,
        pricePositioning: "" as string,
        categoryStrength: "" as string,
        logoUrl: c.logo_url ?? undefined,
      }));
    }
    const landscape = apiDetail?.analysis_data?.competitiveLandscape as
      | {
          competitors?: {
            storeName?: string;
            brandChain?: string;
            tier?: string;
            distanceKm?: number;
            latitude?: number;
            longitude?: number;
            estimatedSizeSft?: number;
            pricePositioning?: string;
            categoryStrength?: string;
            threatLevel?: string;
            googleRating?: number;
            logoUrl?: string;
          }[];
        }
      | undefined;
    if (landscape?.competitors?.length) {
      return landscape.competitors.map((c, i) => ({
        id: `comp-${i}`,
        storeName: c.storeName ?? "Unknown",
        brandChain: c.brandChain ?? "",
        tier: c.tier ?? "direct",
        distanceKm: c.distanceKm ?? 0,
        latitude: c.latitude ?? 0,
        longitude: c.longitude ?? 0,
        estimatedSft: c.estimatedSizeSft ?? 0,
        rating: c.googleRating ?? 0,
        threatLevel: c.threatLevel ?? "",
        pricePositioning: c.pricePositioning ?? "",
        categoryStrength: c.categoryStrength ?? "",
        logoUrl: c.logoUrl ?? undefined,
      }));
    }
    return [];
  }, [apiDetail]);

  // Competitive landscape narrative from analysis_data
  const competitiveLandscape = useMemo(() => {
    const landscape = apiDetail?.analysis_data?.competitiveLandscape as
      | {
          intensityScore?: string;
          biggestThreat?: string;
          gapsToExploit?: string;
          whatCompetitorsDoBetter?: string;
        }
      | undefined;
    if (!landscape) return null;
    return {
      intensityScore: landscape.intensityScore ?? null,
      biggestThreat: landscape.biggestThreat ?? null,
      gapsToExploit: landscape.gapsToExploit ?? null,
      whatCompetitorsDoBetter: landscape.whatCompetitorsDoBetter ?? null,
    };
  }, [apiDetail]);

  // Map center: compute from competitors with valid coordinates
  const mapCenter = useMemo<[number, number] | null>(() => {
    const withCoords = competitors.filter((c) => c.latitude && c.longitude);
    if (withCoords.length > 0) {
      const lat =
        withCoords.reduce((s, c) => s + c.latitude, 0) / withCoords.length;
      const lng =
        withCoords.reduce((s, c) => s + c.longitude, 0) / withCoords.length;
      return [lat, lng];
    }
    return null;
  }, [competitors]);

  // Demand table data from API
  const demandTableData = useMemo<DemandTableRow[]>(() => {
    if (apiDetail?.category_demand_profile?.length) {
      return apiDetail.category_demand_profile.map((cat) => {
        const categoryName =
          cat.segment_std ?? cat.category_desc ?? cat.category ?? "Unknown";
        const currentRevValue =
          cat.monthly_revenue != null ? Number(cat.monthly_revenue) : null;
        const bestRevValue = cat.best_rev != null ? Number(cat.best_rev) : null;

        return {
          category: categoryName,
          salesIndex: cat.sales_index != null ? Number(cat.sales_index) : null,
          growthYoY:
            cat.growth_yoy_pct != null ? Number(cat.growth_yoy_pct) : null,
          sellThrough30: cat.sell_through_rate ?? null,
          signal: cat.signal ?? null,
          bestPeriod: cat.best_period ?? null,
          bestRev: Number.isFinite(bestRevValue) ? bestRevValue : null,
          currentRev: Number.isFinite(currentRevValue) ? currentRevValue : null,
        };
      });
    }
    return [];
  }, [apiDetail]);

  // Review sentiments from API store_ratings
  const reviewSentiments = useMemo<ReviewSentimentItem[]>(() => {
    if (apiDetail?.store_ratings?.reviews) {
      try {
        const parsed = JSON.parse(apiDetail.store_ratings.reviews) as {
          author: string;
          rating: number;
          text: string;
        }[];
        return parsed.slice(0, 4).map((r) => ({
          topic: r.author,
          sentiment: (r.rating >= 4
            ? "positive"
            : r.rating <= 2
              ? "negative"
              : "neutral") as "positive" | "negative" | "neutral",
          quote: r.text,
          rating: r.rating,
        }));
      } catch {
        /* no-op */
      }
    }
    return [];
  }, [apiDetail]);

  // Prev/next store navigation
  const currentIdx = storeIds?.indexOf(storeId) ?? -1;
  const hasPrevStore = currentIdx > 0;
  const hasNextStore = storeIds ? currentIdx < storeIds.length - 1 : false;
  const goToPrevStore = useCallback(() => {
    if (hasPrevStore && storeIds) {
      const prevId = storeIds[currentIdx - 1];
      if (prevId) navigate(`${storeDetailBasePath}/${prevId}`);
    }
  }, [hasPrevStore, storeIds, currentIdx, navigate, storeDetailBasePath]);
  const goToNextStore = useCallback(() => {
    if (hasNextStore && storeIds) {
      const nextId = storeIds[currentIdx + 1];
      if (nextId) navigate(`${storeDetailBasePath}/${nextId}`);
    }
  }, [hasNextStore, storeIds, currentIdx, navigate, storeDetailBasePath]);

  // Deep research panel state (moved from StoreProfileView for cross-tab visibility)
  const [deepResearchOpen, setDeepResearchOpen] = useState(false);

  // Sales pattern chart data from API
  const salesPatternData = useMemo(() => {
    if (apiDetail?.category_demand_profile?.length) {
      return apiDetail.category_demand_profile.map((cat) => {
        const currentRev = parseFloat(String(cat.monthly_revenue ?? "0"));
        const growthYoY = Number(cat.growth_yoy_pct ?? 0);
        const lastYearRev =
          growthYoY !== 0 ? currentRev / (1 + growthYoY / 100) : currentRev;
        return {
          category:
            cat.segment_std ?? cat.category_desc ?? cat.category ?? "Unknown",
          TY: Math.round(currentRev * 10) / 10,
          LY: Math.round(lastYearRev * 10) / 10,
        };
      });
    }
    return [];
  }, [apiDetail]);

  // API-sourced top actions (from analysis_data.topActions)
  const apiTopActions = useMemo(() => {
    const actions = apiDetail?.analysis_data?.topActions as
      | { title?: string; description?: string }[]
      | undefined;
    if (!actions?.length) return [];
    return actions.map((a, i) => ({
      id: `api-action-${i}`,
      title: a.title ?? "",
      description: a.description ?? "",
    }));
  }, [apiDetail]);

  if (apiLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-3 space-y-2"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-20 w-full mt-2" />
            </div>
          ))}
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  if (!apiDetail) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500">
          No intelligence profile found for store {storeId}
        </p>
      </div>
    );
  }

  const storeName = apiDetail?.store_name ?? storeId;

  return (
    // When embedded (hideHeader), tighten the gap to the host's primary tab bar so
    // the sub-tabs don't float — offsets the sticky tab bar's py-3 dead space.
    <div className={cn("space-y-4", hideHeader && "-mt-3")}>
      {/* Page title row — hidden when embedded; the host page provides the header */}
      {!hideHeader && (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button */}
          <button
            onClick={() => navigate(storeDetailBasePath)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors shrink-0 min-h-11 md:min-h-0"
            aria-label="Back to all stores"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Prev/Next + Store name */}
          <div className="flex items-center gap-1 min-w-0">
            {storeIds && storeIds.length > 1 && (
              <button
                onClick={goToPrevStore}
                disabled={!hasPrevStore}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous store"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
            )}
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              {storeName}
            </h2>
            {storeIds && storeIds.length > 1 && (
              <button
                onClick={goToNextStore}
                disabled={!hasNextStore}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next store"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          {/* Cluster label */}
          {apiDetail?.cluster && (
            <span className="text-xs text-gray-500 hidden sm:inline shrink-0">
              {apiDetail.cluster}
            </span>
          )}
        </div>
      </div>
      )}

      {/* Comparison sheet */}
      {comparisonOpen && (
        <StoreComparisonSheet
          storeIds={peerStoreIds}
          onClose={() => setComparisonOpen(false)}
        />
      )}

      {/* Tabs + Analysis button */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Sub-tabs (scrollable pills on mobile, per subTabVariant on desktop) +
            analysis button (desktop-only; mobile gets the card below).
            Sticky on both breakpoints: pins just below the host's primary tab bar
            (71px mobile / 56px desktop) so the sub-tabs stay put while content
            scrolls. pb-2 only (no top padding) — the primary bar's py-3 already
            separates it, so extra top padding reads as a double gap. */}
        <div className="sticky top-[59px] z-10 -mx-4 flex items-center justify-between gap-2 bg-gray-50 px-4 pb-2 lg:top-[61px]">
          <TabsList variant={subTabVariant}>
            <TabsTrigger variant={subTabVariant} value="profile">
              Profile
            </TabsTrigger>
            <TabsTrigger variant={subTabVariant} value="demand">
              Demand
            </TabsTrigger>
            <TabsTrigger variant={subTabVariant} value="competition">
              Competition
            </TabsTrigger>
            <TabsTrigger variant={subTabVariant} value="recommendations">
              Actions ({apiTopActions.length})
            </TabsTrigger>
          </TabsList>
          {activeTab === "profile" &&
            apiDetail?.detailed_analysis_pdf_cdn_url && (
              <button
                onClick={() => setDeepResearchOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-600 transition-colors shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Run Full Analysis
              </button>
            )}
        </div>

        {/* Mobile: Run Full Analysis card — profile tab only */}
        {activeTab === "profile" &&
          apiDetail?.detailed_analysis_pdf_cdn_url && (
            <button
              onClick={() => setDeepResearchOpen(true)}
              className="lg:hidden w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-3 transition-colors text-left group mt-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Run Full Analysis
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    AI-generated deep dive into catchment, competition, demand,
                    and strategic opportunities
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            </button>
          )}

        {/* Profile */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          <StoreProfileView
            storeId={storeId}
            apiDetail={apiDetail}
            hideStoreName
            deepResearchOpen={deepResearchOpen}
            onDeepResearchOpenChange={setDeepResearchOpen}
          />
        </TabsContent>

        {/* Demand */}
        <TabsContent value="demand" className="space-y-4 mt-4">
          <div className="hidden md:block bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Category Demand Profile
              </h3>
            </div>
            <div className="overflow-hidden">
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[12%]" />
                  <col className="w-[9%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[7%]" />
                </colgroup>
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500">
                    <th className="px-3 py-2 text-left">Segment</th>
                    <th className="px-3 py-2 text-right">
                      <MetricTooltip metricKey="growthYoY">
                        Growth YoY
                      </MetricTooltip>
                    </th>
                    <th className="px-3 py-2 text-right">
                      <MetricTooltip metricKey="sellThrough">
                        ST 30d
                      </MetricTooltip>
                    </th>
                    <th className="px-3 py-2 text-right">
                      <MetricTooltip metricKey="bestPeriod">
                        Best Period
                      </MetricTooltip>
                    </th>
                    <th className="px-3 py-2 text-right">
                      <MetricTooltip metricKey="bestRevenue">
                        Best Rev.
                      </MetricTooltip>
                    </th>
                    <th className="px-3 py-2 text-right">
                      <MetricTooltip metricKey="currentRevenue">
                        Current Rev.
                      </MetricTooltip>
                    </th>
                    <th className="px-3 py-2 text-center">
                      <MetricTooltip metricKey="demandSignal">
                        Signal
                      </MetricTooltip>
                    </th>
                    <th className="px-3 py-2 w-10"><span className="sr-only">Drill</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {demandTableData.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState description="No category demand data to display" />
                      </td>
                    </tr>
                  ) : (
                    demandTableData.map((cat) => (
                      <tr key={cat.category} className="group hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {cat.category}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {cat.growthYoY != null ? (
                            <span
                              className={`inline-flex items-center gap-0.5 ${cat.growthYoY > 0 ? "text-emerald-600" : "text-red-600"}`}
                            >
                              {cat.growthYoY > 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {cat.growthYoY}%
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                          {cat.sellThrough30 != null ? (
                            `${cat.sellThrough30}%`
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600 text-xs">
                          {formatBestPeriodLabel(cat.bestPeriod) ?? (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                          {cat.bestRev != null ? (
                            formatCurrency(cat.bestRev)
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-900">
                          {cat.currentRev != null ? (
                            formatCurrency(cat.currentRev)
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {cat.signal != null ? (
                            <Badge variant={demandSignalVariant(cat.signal)}>
                              {demandSignalLabel(cat.signal)}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <DrillMenu
                            rowLabel={cat.category}
                            targets={getStoreCategoryDrillTargets({ category: cat.category, store: storeId, from: 'store-view' })}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: Demand category cards */}
          <div className="md:hidden space-y-3">
            {demandTableData.length === 0 ? (
              <EmptyState description="No category demand data to display" />
            ) : (
              demandTableData.map((cat) => (
                <div
                  key={cat.category}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white"
                >
                  <div className="p-3">
                  <h4 className="truncate text-sm font-semibold text-gray-900">
                    {cat.category}
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Growth YoY
                      </p>
                      <p
                        className={cn(
                          "text-sm font-medium tabular-nums",
                          cat.growthYoY != null
                            ? cat.growthYoY > 0
                              ? "text-green-700"
                              : "text-red-700"
                            : "text-gray-400",
                        )}
                      >
                        {cat.growthYoY != null
                          ? `${cat.growthYoY > 0 ? "+" : ""}${cat.growthYoY}%`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Sell-Through
                      </p>
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">
                        {cat.sellThrough30 != null
                          ? `${cat.sellThrough30}%`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Current Rev.
                      </p>
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">
                        {cat.currentRev != null
                          ? formatCurrency(cat.currentRev)
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Signal</p>
                      <div className="mt-0.5">
                        {cat.signal != null ? (
                          <Badge variant={demandSignalVariant(cat.signal)}>
                            {demandSignalLabel(cat.signal)}
                          </Badge>
                        ) : (
                          <span className="text-sm font-medium text-gray-400">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {cat.bestPeriod && (
                    <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-primary-50/60 px-3 py-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-primary">
                        <TrendingUp className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                          Peak month
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatBestPeriodLabel(cat.bestPeriod)}
                          {cat.bestRev != null && (
                            <>
                              {" "}
                              <span className="font-normal text-gray-400">·</span>{" "}
                              <span className="tabular-nums">{formatCurrency(cat.bestRev)}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  </div>
                  {/* Drill-down — outline button + bottom sheet, consistent with the store-list card. */}
                  <div className="flex border-t border-gray-100 bg-gray-50 p-3">
                    <Button
                      variant="outline"
                      size="md"
                      className="relative min-h-10 flex-1"
                      onClick={() => setDrillCategory(cat.category)}
                    >
                      <span className="absolute inset-x-0 top-1/2 h-11 -translate-y-1/2 lg:hidden" aria-hidden />
                      Drill down
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Shared drill-down bottom sheet for the mobile demand cards. */}
          <BottomSheet
            isOpen={drillCategory != null}
            onClose={() => setDrillCategory(null)}
            title={drillCategory ? `Drill into ${drillCategory}` : undefined}
          >
            <div className="space-y-1 pb-2">
              {drillCategory &&
                getStoreCategoryDrillTargets({ category: drillCategory, store: storeId, from: "store-view" }).map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { const to = t.to; setDrillCategory(null); navigate(to); }}
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

          {/* TY vs LY Revenue pattern */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">
                Revenue Pattern: TY vs LY (Lakhs)
              </h3>
              <span className="ml-auto">
                <DrillMenu rowLabel="categories" targets={getChartDrillTargets('store-category', { store: storeId, from: 'store-view' })} />
              </span>
            </div>
            <ResponsiveContainer width="100%" minWidth={0} height={isMobile ? 180 : 220}>
              <BarChart data={salesPatternData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  interval={isMobile ? "preserveStartEnd" : 0}
                />
                <YAxis tick={{ fontSize: 12 }} hide={isMobile} />
                <Tooltip formatter={(value) => [`${getCurrencySymbol()}${value} L`, ""]} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="LY"
                  fill={CHART_BASELINE}
                  name="Last Year"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="TY"
                  fill={CHART_PRIMARY}
                  name="This Year"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* Competition */}
        <TabsContent value="competition" className="space-y-4 mt-4">
          {/* Store-level competitor map — `isolate` gives it its own stacking context
              so Leaflet's high pane/control z-indexes (200–1000) can't escape and
              paint over the sticky primary/sub tab bars. */}
          {mapCenter && (
            <div className="isolate bg-white rounded-lg border border-gray-200 overflow-hidden h-[300px]">
              <MapContainer
                center={mapCenter}
                zoom={14}
                className="h-full w-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* Competitor markers */}
                {competitors.map((comp) => {
                  const tierColor =
                    comp.tier === "direct"
                      ? "#ef4444"
                      : comp.tier === "aspirational"
                        ? "#f59e0b"
                        : comp.tier === "value"
                          ? "#6b7280"
                          : "#a855f7";
                  return comp.latitude && comp.longitude ? (
                    <CircleMarker
                      key={comp.id}
                      center={[comp.latitude, comp.longitude]}
                      radius={6}
                      pathOptions={{
                        fillColor: tierColor,
                        fillOpacity: 0.8,
                        color: tierColor,
                        weight: 1,
                      }}
                    >
                      <Popup>
                        <div className="text-xs">
                          <p className="font-semibold">{comp.storeName}</p>
                          {comp.brandChain && (
                            <p className="text-gray-500">{comp.brandChain}</p>
                          )}
                          <p className="text-gray-500 capitalize">
                            {comp.tier} · {comp.distanceKm} km
                          </p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ) : null;
                })}
              </MapContainer>
            </div>
          )}
          {mapCenter && (
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Direct
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />{" "}
                Aspirational
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-500" /> Value
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />{" "}
                Local
              </span>
            </div>
          )}

          {/* Competitive Landscape — intensity header, with the threat/gap/edge
              insights folded into the same card below a divider. */}
          {competitiveLandscape &&
            (competitiveLandscape.intensityScore ||
              competitiveLandscape.biggestThreat ||
              competitiveLandscape.gapsToExploit ||
              competitiveLandscape.whatCompetitorsDoBetter) && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="flex items-center justify-between px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Competitive Landscape
                  </h3>
                  {competitiveLandscape.intensityScore && (
                    <Badge
                      variant={
                        competitiveLandscape.intensityScore === "HIGH"
                          ? "destructive"
                          : competitiveLandscape.intensityScore === "MEDIUM"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {competitiveLandscape.intensityScore} Intensity
                    </Badge>
                  )}
                </div>
                {(competitiveLandscape.biggestThreat ||
                  competitiveLandscape.gapsToExploit ||
                  competitiveLandscape.whatCompetitorsDoBetter) && (
                  <div className="grid grid-cols-1 gap-4 border-t border-gray-100 p-4 md:grid-cols-3">
                    {competitiveLandscape.biggestThreat && (
                      <div>
                        <h4 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-500">
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          Biggest Threat
                        </h4>
                        <p className="text-xs leading-relaxed text-gray-700">
                          {competitiveLandscape.biggestThreat}
                        </p>
                      </div>
                    )}
                    {competitiveLandscape.gapsToExploit && (
                      <div>
                        <h4 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-green-50 text-green-600">
                            <Target className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          Gaps to Exploit
                        </h4>
                        <p className="text-xs leading-relaxed text-gray-700">
                          {competitiveLandscape.gapsToExploit}
                        </p>
                      </div>
                    )}
                    {competitiveLandscape.whatCompetitorsDoBetter && (
                      <div>
                        <h4 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                            <Award className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          What Competitors Do Better
                        </h4>
                        <p className="text-xs leading-relaxed text-gray-700">
                          {competitiveLandscape.whatCompetitorsDoBetter}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Competitor table */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Nearby Competitors ({competitors.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500">
                    <th className="px-4 py-2 text-left">
                      <span className="inline-flex items-center gap-1">
                        Competitor <InfoHeaderIcon metricKey="Competitor" />
                      </span>
                    </th>
                    <th className="px-3 py-2 text-left">
                      <span className="inline-flex items-center gap-1">
                        Brand / Chain <InfoHeaderIcon metricKey="Brand/Chain" />
                      </span>
                    </th>
                    <th className="px-3 py-2 text-center">
                      <span className="inline-flex items-center gap-1">
                        Tier <InfoHeaderIcon metricKey="Tier" />
                      </span>
                    </th>
                    <th className="px-3 py-2 text-right">
                      <span className="inline-flex items-center gap-1 justify-end">
                        Distance <InfoHeaderIcon metricKey="Distance" />
                      </span>
                    </th>
                    <th className="px-3 py-2 text-right">
                      <span className="inline-flex items-center gap-1 justify-end">
                        Rating <InfoHeaderIcon metricKey="Rating" />
                      </span>
                    </th>
                    <th className="px-3 py-2 text-right">
                      <span className="inline-flex items-center gap-1 justify-end">
                        Est. SFT <InfoHeaderIcon metricKey="Est. SFT" />
                      </span>
                    </th>
                    <th className="px-3 py-2 text-center">
                      <span className="inline-flex items-center gap-1">
                        Threat <InfoHeaderIcon metricKey="Threat" />
                      </span>
                    </th>
                    <th className="px-3 py-2 text-left">
                      <span className="inline-flex items-center gap-1">
                        Category Strength{" "}
                        <InfoHeaderIcon metricKey="Category Strength" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {competitors.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState description="No competitors to display" />
                      </td>
                    </tr>
                  ) : (
                    competitors.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">
                          <div className="flex items-center gap-2.5">
                            <CompetitorLogo name={c.storeName} logoUrl={c.logoUrl} />
                            <span className="min-w-0 truncate">{c.storeName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {c.brandChain || "–"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {c.tier && (
                            <Badge variant="outline" className="capitalize">
                              {c.tier}
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                          {c.distanceKm ? `${c.distanceKm} km` : "–"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {c.rating > 0 ? c.rating.toFixed(1) : "–"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {c.estimatedSft > 0
                            ? c.estimatedSft.toLocaleString("en-IN")
                            : "–"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {c.threatLevel && (
                            <Badge
                              variant={
                                c.threatLevel === "high"
                                  ? "destructive"
                                  : c.threatLevel === "medium"
                                    ? "warning"
                                    : "secondary"
                              }
                              size="sm"
                              className="capitalize"
                            >
                              {c.threatLevel}
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600 text-xs max-w-[260px]">
                          {c.categoryStrength || "–"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: Competitor cards */}
          <div className="md:hidden space-y-3">
            {competitors.length === 0 ? (
              <EmptyState description="No competitors to display" />
            ) : (
              competitors.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="flex gap-2.5">
                    <CompetitorLogo name={c.storeName} logoUrl={c.logoUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-balance text-sm font-semibold leading-snug text-gray-900">
                            {c.storeName}
                          </h4>
                          {(c.tier || c.brandChain) && (
                            <p className="mt-0.5 text-xs text-gray-500">
                              {c.tier && <span className="capitalize">{c.tier}</span>}
                              {c.tier && c.brandChain && " · "}
                              {c.brandChain}
                            </p>
                          )}
                        </div>
                        {c.threatLevel && (
                          <Badge
                            variant={threatBadgeVariant(c.threatLevel)}
                            size="sm"
                            className="shrink-0 capitalize"
                          >
                            {c.threatLevel} threat
                          </Badge>
                        )}
                      </div>
                      {c.categoryStrength && (
                        <div className="mt-3">
                          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Category Strength
                          </p>
                          <p className="text-pretty text-sm leading-relaxed text-gray-700">
                            {c.categoryStrength}
                          </p>
                        </div>
                      )}
                      <div className="mt-3 grid grid-cols-3 gap-x-4 border-t border-gray-100 pt-2.5">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-gray-400">Distance</p>
                          <p className="text-sm font-medium tabular-nums text-gray-700">
                            {c.distanceKm ? `${c.distanceKm} km` : "–"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-gray-400">Rating</p>
                          <p className="text-sm font-medium tabular-nums text-gray-700">
                            {c.rating > 0 ? c.rating.toFixed(1) : "–"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-gray-400">Est. SFT</p>
                          <p className="text-sm font-medium tabular-nums text-gray-700">
                            {c.estimatedSft > 0 ? c.estimatedSft.toLocaleString("en-IN") : "–"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Review Sentiment Cards */}
          {reviewSentiments.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">
                  Review Sentiment
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Customer feedback analysis across key topics
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                {reviewSentiments.map(
                  (review: ReviewSentimentItem, idx: number) => {
                    const SentimentIcon =
                      review.sentiment === "positive"
                        ? ThumbsUp
                        : review.sentiment === "negative"
                          ? ThumbsDown
                          : Minus;
                    const sentimentColor =
                      review.sentiment === "positive"
                        ? "text-emerald-600"
                        : review.sentiment === "negative"
                          ? "text-red-600"
                          : "text-gray-500";
                    const sentimentBg =
                      review.sentiment === "positive"
                        ? "bg-emerald-50"
                        : review.sentiment === "negative"
                          ? "bg-red-50"
                          : "bg-gray-50";
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "rounded-lg border border-gray-100 p-3",
                          sentimentBg,
                        )}
                      >
                        {}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <SentimentIcon
                              className={cn("w-3.5 h-3.5", sentimentColor)}
                            />
                            <span className="text-xs font-semibold text-gray-900">
                              {review.topic}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500" />
                            <span className="text-xs tabular-nums font-medium text-gray-700">
                              {review.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 italic">
                          "{review.quote}"
                        </p>
                        <Badge
                          variant={
                            review.sentiment === "positive"
                              ? "success"
                              : review.sentiment === "negative"
                                ? "error"
                                : "default"
                          }
                          size="sm"
                          className="mt-2"
                        >
                          {review.sentiment}
                        </Badge>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Actions */}
        <TabsContent value="recommendations" className="space-y-4 mt-4">
          {apiTopActions.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">
                  Recommended Actions ({apiTopActions.length})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  AI-generated strategic actions based on store intelligence
                  analysis
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {apiTopActions.map((action) => (
                  <div key={action.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center">
                        <Target className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {action.title}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState description="No actions available for this store" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
