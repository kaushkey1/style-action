/**
 * Store Detail — consolidated, tabbed store page.
 *
 * Replaces the legacy store-detail banner (UnifiedPlanningDashboard `viewMode='store'`)
 * and folds the old standalone Store Intelligence into the "Catchment & Competition" tab.
 *
 * Tabs (URL-routed): Executive Summary · Categories · Catchment & Competition ·
 * Customer Voice · Product. The 2D planogram opens externally via the header
 * "Open in GMetri" / "Open PDF" buttons; fixture detail folds into each category.
 *
 * Data: a single /store-view/details query powers the header, KPI strip, data strip
 * and Categories; NPS via the NPS API; PDF via /store-view/{code}/layout. We NEVER
 * render fabricated values — anything without a live source shows "N/A" / "—".
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Building2,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ExternalLink,
  FileText,
  Shirt,
  Tag,
  LayoutGrid,
  Boxes,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  Badge,
  BottomSheet,
  Button,
  MetricCard,
  SectionHeader,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { cn, formatCurrency, formatDate, formatMonthYear, formatNumber, getLastYearMonth, isFullCalendarMonth, yearMonthToDateRange } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useStorePerformanceFilterStore } from '../stores/useStorePerformanceFilterStore';
import { appApiFetch } from '@/lib/api';
import { DashboardKpiGrid } from '@/modules/dashboard/components/DashboardKpiGrid';
import { npsKeys, fetchNPSStoreDetails } from '../api/npsApi';
import { useFixtureView } from '../api/storePerformanceHooks';
import {
  storeInsightKeys,
  fetchStoreInsights,
  fetchStoreTopActions,
  fetchStoreReport,
} from '../api/storeInsightsApi';
import type { StoreAction, ActionSeverity, TopActionsData, StoreInsightData } from '../api/storeInsightsApi';
import { StoreIntelligenceDetail } from '../components/StoreIntelligenceDetail';
import { CXIntelligenceTab } from '../components/CXIntelligenceTab';
import { ProductGrid } from '@/modules/product-display/components/ProductGrid';

/* ── Types (live /store-view/details shape; gm_pct exists at runtime but is not
 *    yet in the shared StoreView interface, so we declare what this page reads) ── */

interface StoreCategorySplit {
  category_desc: string;
  revenue: number | null;
  options: number | null;
  noos_pct: number | null;
  fashion_pct: number | null;
  cover_days: number | null;
  usable_sqft: number | null;
  sqft: number | null;
  gmrof_rs_per_sft: number | null;
  total_fixtures: number | null;
  pullback_qty: number | null;
  replenisment_qty: number | null;
}

interface StoreDetailResponse {
  store_name: string | null;
  city: string | null;
  region: string | null;
  sqft: number | null;
  aggregated_data: {
    month: string | null;
    revenue: number | null;
    noos_pct: number | null;
    fashion_pct: number | null;
    ly_growth: number | null;
    gm_pct: number | null;
    total_gross_margin: number | null;
    total_usable_sqft: number | null;
    gmrof: number | null;
    options_in_stock: number | null;
    total_options: number | null;
    store_level_planned_options: number | null;
    month_closing_stock_qty: number | null;
    nrm_pct: number | null;
    store_age_months: number | null;
    format_std: string | null;
  } | null;
  category_level_split: StoreCategorySplit[];
}

interface StoreLayoutResponse {
  files: { signed_url: string }[];
}

/** Store codes that are pinned to the top of the listing and get full feature access. */
const PINNED_STORE_CODES = new Set(['5943', '8053', '8055', '8080', 'TE94']);

/** Mobile tab-swipe tuning: min horizontal travel to change tab, and the slide distance. */
const SWIPE_THRESHOLD_PX = 60;
const TAB_SLIDE_OFFSET_PX = 32;

/** Direction-aware slide+fade for the mobile tab panel (dir: 1 = next, -1 = prev). */
const tabSlideVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? TAB_SLIDE_OFFSET_PX : dir < 0 ? -TAB_SLIDE_OFFSET_PX : 0, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -TAB_SLIDE_OFFSET_PX : dir < 0 ? TAB_SLIDE_OFFSET_PX : 0, opacity: 0 }),
};

const TABS = [
  { value: 'executive-summary', label: 'Executive Summary' },
  { value: 'categories', label: 'Categories' },
  { value: 'catchment', label: 'Catchment & Competition' },
  { value: 'customer-voice', label: 'CX Intelligence' },
  { value: 'product', label: 'Product' },
] as const;

type TabValue = (typeof TABS)[number]['value'];
const DEFAULT_TAB: TabValue = 'executive-summary';

function isTabValue(v: string | undefined): v is TabValue {
  return !!v && TABS.some((t) => t.value === v);
}

/** Category descriptions arrive numbered ("1. Men Apparel"); strip the prefix for display. */
function stripCategoryNumber(name: string): string {
  return name.replace(/^\d+\.\s*/, '');
}

/**
 * Period label for the store header: a full calendar month collapses to
 * "June, 2026"; any other range shows the start–end dates; no range shows
 * the API month. Keeps the header readable when the filter is a whole month.
 */
function getPeriodLabel(from: string | null, to: string | null, fallbackMonth: string): string {
  if (!from || !to) return `As of ${fallbackMonth}`;
  if (isFullCalendarMonth(from, to)) return formatMonthYear(from);
  return `${formatDate(from)} – ${formatDate(to)}`;
}

/* ── Small presentational helpers ── */

function HeaderChip({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }): React.ReactNode {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
      <Icon className="h-3.5 w-3.5 text-gray-400" aria-hidden />
      {children}
    </span>
  );
}

/** One label/value cell for the mobile store-info grid (below the title bar). */
function StoreInfoCell({ label, value }: { label: string; value: string }): React.ReactNode {
  return (
    <div className="p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function StoreDetailPair({ label, value, muted }: { label: string; value: string; muted?: boolean }): React.ReactNode {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={cn('text-sm font-semibold tabular-nums', muted ? 'text-gray-400' : 'text-gray-900')}>{value}</p>
    </div>
  );
}

/* ================================================================== */
/* Top Priority Actions                                                */
/* ================================================================== */

const SEVERITY_CONFIG: Record<ActionSeverity, { label: string; badgeVariant: 'error' | 'warning' | 'info' | 'default'; icon: typeof AlertTriangle }> = {
  CRITICAL: { label: 'CRITICAL', badgeVariant: 'error', icon: AlertTriangle },
  HIGH: { label: 'HIGH', badgeVariant: 'warning', icon: AlertCircle },
  MEDIUM: { label: 'MEDIUM', badgeVariant: 'info', icon: Info },
  LOW: { label: 'LOW', badgeVariant: 'default', icon: Info },
};

function ActionCard({ action, backLabel, backPath }: { action: StoreAction; backLabel: string; backPath: string }): React.ReactNode {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const cfg = SEVERITY_CONFIG[action.severity] ?? SEVERITY_CONFIG.MEDIUM;
  const SeverityIcon = cfg.icon;
  const isApprovalRequired = action.status === 'Approval Required';
  const openAction = (): void => {
    navigate(`/tasks/${action.id}`, { state: { backLabel, backPath } });
  };

  const severityBadge = (
    <Badge variant={cfg.badgeVariant} size="sm">
      <SeverityIcon className="h-3 w-3" aria-hidden />
      {cfg.label}
    </Badge>
  );
  const statusBadge = (
    <Badge
      variant={isApprovalRequired ? 'warning' : 'success'}
      size="sm"
      className={cn('shrink-0', !isApprovalRequired && 'border border-green-300 bg-transparent text-green-700')}
    >
      {action.status}
    </Badge>
  );
  const domainBadge = (
    <Badge variant="default" size="sm" className="uppercase tracking-wide">
      {action.domain}
    </Badge>
  );

  // Desktop — original layout: status right-aligned, whole card clickable, no footer.
  if (!isMobile) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={openAction}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAction(); } }}
        aria-label={`View task: ${action.title}`}
        className="rounded-lg border border-gray-200 bg-white p-4 space-y-2 cursor-pointer transition-all hover:border-gray-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {severityBadge}
            {domainBadge}
          </div>
          {statusBadge}
        </div>
        <p className="text-sm font-medium text-gray-900 leading-snug">{action.title}</p>
        <p className="text-sm text-gray-500 line-clamp-3">{action.description}</p>
      </div>
    );
  }

  // Mobile — status/pending next to severity + a compact "View Action" footer.
  // The whole card is tappable, so the footer is a visual affordance, not the hit
  // target — we override Button's mobile min-h-12 to keep the strip tight.
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-sm">
      <div
        role="button"
        tabIndex={0}
        onClick={openAction}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAction(); } }}
        aria-label={`View task: ${action.title}`}
        className="cursor-pointer space-y-1.5 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        {/* Severity + status/pending + domain, grouped together */}
        <div className="flex flex-wrap items-center gap-2">
          {severityBadge}
          {statusBadge}
          {domainBadge}
        </div>
        <p className="text-sm font-medium text-gray-900 leading-snug">{action.title}</p>
        <p className="text-sm text-gray-500 line-clamp-3">{action.description}</p>
      </div>
      <div className="flex border-t border-gray-100 bg-gray-50 px-3">
        <Button variant="ghost" size="sm" className="min-h-9 h-9 flex-1 text-primary" onClick={openAction}>
          View Action
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function TopPriorityActions({ topActions, isLoading, backLabel, backPath }: { topActions: TopActionsData | undefined; isLoading: boolean; backLabel: string; backPath: string }): React.ReactNode {
  const isMobile = useIsMobile();
  if (isLoading) {
    return (
      <section className="space-y-3">
        <SectionHeader title="Top Priority Actions" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 h-28 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!topActions || topActions.actions.length === 0) {
    return (
      <section className="space-y-3">
        <SectionHeader title="Top Priority Actions" />
        <EmptyState description="No prioritized actions available for this store." />
      </section>
    );
  }

  const { actions, showing, total, severity_counts } = topActions;
  const criticalCount = severity_counts.CRITICAL ?? 0;
  const highCount = severity_counts.HIGH ?? 0;
  const mediumCount = severity_counts.MEDIUM ?? 0;

  return (
    // Desktop keeps the section's own 12px rhythm; mobile drops it and lets the
    // header's mb-2 sit the cards tight to the title (proximity — they're related).
    <section className={cn(!isMobile && 'space-y-3')}>
      <SectionHeader
        title="Top Priority Actions"
        className={isMobile ? 'mb-2' : undefined}
        // Summary count + severity chips are desktop-only — noise on mobile, and the
        // empty flex wrapper would otherwise add phantom spacing below the title.
        actions={
          isMobile ? undefined : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{showing} of {total} actions</span>
              {criticalCount > 0 && <Badge variant="error" size="sm">{criticalCount} critical</Badge>}
              {highCount > 0 && <Badge variant="warning" size="sm">{highCount} high</Badge>}
              {mediumCount > 0 && <Badge variant="info" size="sm">{mediumCount} medium</Badge>}
            </div>
          )
        }
      />
      <div className="space-y-3">
        {actions.map((action) => (
          <ActionCard key={action.id} action={action} backLabel={backLabel} backPath={backPath} />
        ))}
      </div>
    </section>
  );
}

/* ================================================================== */
/* Executive Summary                                                   */
/* ================================================================== */

interface ExecutiveSummaryProps {
  agg: StoreDetailResponse['aggregated_data'];
  sqft: number | null;
  npsScore: number | null;
  isLoading: boolean;
  npsLoading: boolean;
  storeName: string;
  storeInsights: StoreInsightData | undefined;
  insightsLoading: boolean;
  topActions: TopActionsData | undefined;
  topActionsLoading: boolean;
  currentPath: string;
  isPinned: boolean;
}

function ExecutiveSummary({ agg, sqft, npsScore, isLoading, npsLoading, storeName, storeInsights, insightsLoading, topActions, topActionsLoading, currentPath, isPinned }: ExecutiveSummaryProps): React.ReactNode {
  const [aiOpen, setAiOpen] = useState(true);
  const dash = isLoading ? '—' : 'N/A';
  const num = (v: number | null | undefined): string => (v != null ? formatNumber(v) : dash);
  const pct = (v: number | null | undefined): string => (v != null ? `${v.toFixed(1)}%` : dash);

  const storeCode = storeInsights?.store_code ?? '';
  const shortName = storeName.split(',')[0] ?? storeName;
  const replaceCode = (text: string): string =>
    storeCode ? text.replace(new RegExp(`store ${storeCode}`, 'gi'), shortName) : text;

  const rawSummary = storeInsights?.summary?.trim() || null;
  const summary = rawSummary ? replaceCode(rawSummary) : null;
  const rawQuestion = storeInsights?.morning_question?.trim() || null;
  const morningQuestion = rawQuestion ? replaceCode(rawQuestion) : null;
  const noosFashion =
    agg?.noos_pct != null && agg?.fashion_pct != null
      ? `${Math.round(agg.noos_pct)}% / ${Math.round(agg.fashion_pct)}%`
      : dash;

  // Pillar metrics — derived from live values only; "N/A" where no source exists.
  const gmrof = agg?.gmrof != null ? `${formatCurrency(agg.gmrof)}/sft` : dash;
  const pillars: { icon: typeof Shirt; name: string; metric: string }[] = [
    {
      icon: Shirt,
      name: 'Right Range',
      metric:
        agg?.options_in_stock != null && agg?.store_level_planned_options != null
          ? `${formatNumber(agg.options_in_stock)} of ${formatNumber(agg.store_level_planned_options)} options live`
          : dash,
    },
    { icon: Tag, name: 'Right Margin', metric: agg?.gm_pct != null ? `${agg.gm_pct.toFixed(1)}% gross margin` : dash },
    { icon: LayoutGrid, name: 'Right Space', metric: `${gmrof} GMROF` },
  ];

  return (
    <div className="space-y-4">
      {/* AI briefing — store-health pillars live; narrative API not yet wired */}
      <section className="rounded-lg border border-gray-200 bg-gradient-to-br from-primary-50/50 to-white p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" aria-hidden />
            AI Generated
          </span>
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            aria-expanded={aiOpen}
            aria-label={aiOpen ? 'Collapse briefing' : 'Expand briefing'}
            className="rounded-md p-0.5 text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', aiOpen && 'rotate-180')} aria-hidden />
          </button>
        </div>
        {insightsLoading || isLoading ? (
          <div className="mt-2 space-y-1.5">
            <div className="h-5 w-2/3 rounded bg-gray-200 animate-pulse" />
            <div className="h-3.5 w-full rounded bg-gray-200 animate-pulse" />
            <div className="h-3.5 w-5/6 rounded bg-gray-200 animate-pulse" />
            <div className="h-3.5 w-4/6 rounded bg-gray-200 animate-pulse" />
          </div>
        ) : (
          <>
            <h2 className="mt-2 text-base font-medium text-gray-900 text-balance">
              {morningQuestion ?? `What needs attention at ${shortName}?`}
            </h2>
            {aiOpen && summary ? (
              <p className="mt-1 text-sm text-gray-700 leading-relaxed">{summary}</p>
            ) : null}
          </>
        )}
      </section>

      {/* Store health pillars — swipable carousel on mobile, 3-col grid on desktop */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- pillar cards, not the KPI strip */}
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible">
        {isLoading
          ? [1, 2, 3].map((i) => (
              <div key={i} className="snap-start shrink-0 w-[78%] space-y-3 rounded-lg border border-gray-200 bg-white p-4 sm:w-[46%] lg:w-auto">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-gray-200 animate-pulse shrink-0" />
                  <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
                </div>
                <div className="h-4 w-36 rounded bg-gray-200 animate-pulse" />
              </div>
            ))
          : pillars.map((p) => {
              const Icon = p.icon;
              const metricMuted = p.metric.includes('N/A') || p.metric.includes('—');
              return (
                <div key={p.name} className="snap-start shrink-0 w-[78%] rounded-lg border border-gray-200 bg-white p-4 sm:w-[46%] lg:w-auto">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="text-sm font-medium text-gray-900">{p.name}</span>
                    </div>
                  </div>
                  <p className={cn('mt-3 text-sm', metricMuted ? 'text-gray-400' : 'text-gray-700')}>{p.metric}</p>
                </div>
              );
            })}
      </div>

      {/* Headline KPIs */}
      {isLoading || npsLoading ? (
        <DashboardKpiGrid>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
              <div className="h-3 w-24 rounded bg-gray-200 animate-pulse" />
              <div className="h-7 w-32 rounded bg-gray-200 animate-pulse" />
              <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
            </div>
          ))}
        </DashboardKpiGrid>
      ) : (
        <DashboardKpiGrid>
          <MetricCard label="NOOS / Fashion" value={noosFashion} />
          <MetricCard
            label="Revenue"
            value={agg?.revenue != null ? formatCurrency(agg.revenue) : dash}
            valueClassName="text-green-700"
          />
          <MetricCard label="YOY Growth" value={agg?.ly_growth != null ? `${agg.ly_growth}%` : dash} />
          <MetricCard label="NPS Score" value={npsScore != null ? `${npsScore} pts` : dash} />
        </DashboardKpiGrid>
      )}

      {/* Secondary store-profile strip */}
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- compact label/value pairs, not headline KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {isLoading
            ? [1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-2.5 w-16 rounded bg-gray-200 animate-pulse" />
                  <div className="h-4 w-12 rounded bg-gray-200 animate-pulse" />
                </div>
              ))
            : <>
                <StoreDetailPair label="Gross Margin %" value={pct(agg?.gm_pct)} muted={agg?.gm_pct == null} />
                <StoreDetailPair label="Total Options" value={num(agg?.options_in_stock)} muted={agg?.options_in_stock == null} />
                <StoreDetailPair label="Stock Quantity" value={num(agg?.month_closing_stock_qty)} muted={agg?.month_closing_stock_qty == null} />
                <StoreDetailPair label="Format" value={agg?.format_std || dash} muted={!agg?.format_std} />
                <StoreDetailPair label="Sq Ft" value={num(sqft)} muted={sqft == null} />
                <StoreDetailPair label="NRM %" value={pct(agg?.nrm_pct)} muted={agg?.nrm_pct == null} />
                <StoreDetailPair
                  label="Age"
                  value={agg?.store_age_months != null ? `${agg.store_age_months} mo` : dash}
                  muted={agg?.store_age_months == null}
                />
              </>
          }
        </div>
      </div>

      {isPinned && (
        <TopPriorityActions
          topActions={topActions}
          isLoading={topActionsLoading}
          backLabel={shortName}
          backPath={currentPath}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/* Categories                                                          */
/* ================================================================== */

function StatTile({ label, value, sub, muted }: { label: string; value: string; sub?: string; muted?: boolean }): React.ReactNode {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cn('mt-1 text-xl font-semibold tabular-nums', muted ? 'text-gray-400' : 'text-gray-900')}>{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-gray-400">{sub}</p> : null}
    </div>
  );
}

function CategoryDetail({ cat, storeId, yearMonth }: { cat: StoreCategorySplit; storeId: string; yearMonth: string }): React.ReactNode {
  const isMobile = useIsMobile();
  const totalSft = cat.usable_sqft ?? cat.sqft;
  const gmrof = cat.gmrof_rs_per_sft != null ? `${formatCurrency(cat.gmrof_rs_per_sft)}/sft` : 'N/A';
  const { data: fixtureData, isLoading: fixtureLoading } = useFixtureView(storeId, yearMonth);
  const noos = cat.noos_pct;
  const fashion = cat.fashion_pct;
  const hasSplit = noos != null && fashion != null;

  return (
    <div key={cat.category_desc} className="animate-fadeInUp space-y-5">
      {/* Info strip — mobile: 2×2 metric grid (name lives in the drill title bar);
          desktop: name + revenue + inline stats (the master-detail header). */}
      {isMobile ? (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <StoreInfoCell label="Revenue" value={cat.revenue != null ? formatCurrency(cat.revenue) : '—'} />
            <StoreInfoCell label="Sq Ft" value={totalSft != null ? formatNumber(totalSft) : '—'} />
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <StoreInfoCell label="Fixtures" value={cat.total_fixtures != null ? formatNumber(cat.total_fixtures) : '—'} />
            <StoreInfoCell label="GMROF" value={cat.gmrof_rs_per_sft != null ? `${formatCurrency(cat.gmrof_rs_per_sft)}/sft` : '—'} />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <h3 className="text-base font-medium text-gray-900">{stripCategoryNumber(cat.category_desc)}</h3>
            <p className="mt-0.5 text-xs text-gray-500">{cat.revenue != null ? `${formatCurrency(cat.revenue)} monthly revenue` : 'Revenue N/A'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 tabular-nums">
            <span>{totalSft != null ? `${formatNumber(totalSft)} sft` : 'sft N/A'}</span>
            <span>{cat.total_fixtures != null ? `${cat.total_fixtures} fixtures` : 'fixtures N/A'}</span>
            <span>{gmrof} GMROF</span>
          </div>
        </div>
      )}

      {/* Range */}
      <section>
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Range</p>
        <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500">Live options</p>
              <p className="text-3xl font-semibold text-gray-900 tabular-nums">{cat.options != null ? formatNumber(cat.options) : 'N/A'}</p>
            </div>
            <p className="text-xs text-gray-500">
              {hasSplit ? (
                <>
                  NOOS <span className="font-medium text-gray-700">{Math.round(noos)}%</span> · Fashion{' '}
                  <span className="font-medium text-gray-700">{Math.round(fashion)}%</span>
                </>
              ) : (
                <span className="text-gray-400">NOOS / Fashion N/A</span>
              )}
            </p>
          </div>
          {hasSplit && (
            <>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-gray-200">
                {/* eslint-disable-next-line no-restricted-syntax -- dynamic NOOS split width */}
                <div className="bg-gray-400" style={{ width: `${noos}%` }} />
                {/* eslint-disable-next-line no-restricted-syntax -- dynamic Fashion split width */}
                <div className="bg-primary-500" style={{ width: `${fashion}%` }} />
              </div>
              {/* eslint-disable-next-line design-system/prefer-section-header -- NOOS/Fashion bar legend, not a section header */}
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400">
                <span>Never out of stock</span>
                <span>Fashion</span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Execution */}
      <section>
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Execution</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatTile
            label="Replenishment (Qty)"
            value={cat.replenisment_qty != null ? formatNumber(cat.replenisment_qty) : 'N/A'}
            sub="in-transit + planned"
            muted={cat.replenisment_qty == null}
          />
          <StatTile
            label="Pullback (Items)"
            value={cat.pullback_qty != null ? formatNumber(cat.pullback_qty) : 'N/A'}
            sub="flagged for return / markdown"
            muted={cat.pullback_qty == null}
          />
        </div>
      </section>

      {/* Space Performance */}
      <section>
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Space Performance</p>
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- space stats, not the KPI strip */}
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile label="Total SFT" value={totalSft != null ? formatNumber(totalSft) : 'N/A'} muted={totalSft == null} />
          <StatTile label="GMROF" value={gmrof} sub="gross margin / sft" muted={cat.gmrof_rs_per_sft == null} />
          <StatTile label="Total Fixtures" value={cat.total_fixtures != null ? String(cat.total_fixtures) : 'N/A'} muted={cat.total_fixtures == null} />
        </div>
      </section>

      {/* Fixtures — desktop: table in a card; mobile: cards, no wrapping container. */}
      <section>
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Fixtures</p>
        {fixtureLoading ? (
          <p className={cn('mt-2 text-sm text-gray-400', !isMobile && 'rounded-lg border border-gray-200 bg-white p-4')}>Loading fixture data…</p>
        ) : !fixtureData || fixtureData.overlay.length === 0 ? (
          <p className={cn('mt-2 text-sm text-gray-400', !isMobile && 'rounded-lg border border-gray-200 bg-white p-4')}>No fixture data available for this store.</p>
        ) : (
          <div className={cn('mt-2 space-y-3', !isMobile && 'rounded-lg border border-gray-200 bg-white p-4')}>
            {/* eslint-disable-next-line design-system/prefer-metric-grid -- fixture summary stats, not headline KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Total Fixtures" value={fixtureData.total_fixtures != null ? formatNumber(fixtureData.total_fixtures) : 'N/A'} muted={fixtureData.total_fixtures == null} />
              <StatTile label="Max Capacity" value={fixtureData.max_capacity != null ? formatNumber(fixtureData.max_capacity) : 'N/A'} muted={fixtureData.max_capacity == null} />
              <StatTile label="Current Stock" value={fixtureData.current_stock != null ? formatNumber(fixtureData.current_stock) : 'N/A'} muted={fixtureData.current_stock == null} />
              <StatTile label="Avg Utilization" value={fixtureData.avg_utilization != null ? `${Math.round(fixtureData.avg_utilization)}%` : 'N/A'} muted={fixtureData.avg_utilization == null} />
            </div>
            {isMobile ? (
              <div className="space-y-2">
                {fixtureData.overlay.map((row, idx) => (
                  <div key={`${row.fixture_type ?? ''}-${idx}`} className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-sm font-medium text-gray-900">{row.fixture_type ?? '—'}</p>
                    <div className="mt-2 flex gap-8">
                      <div>
                        <span className="block text-[11px] uppercase tracking-wide text-gray-400">Count</span>
                        <span className="text-sm tabular-nums text-gray-700">{row.fixture_count ?? '—'}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] uppercase tracking-wide text-gray-400">Slots</span>
                        <span className="text-sm tabular-nums text-gray-700">{row.slots ?? '—'}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] uppercase tracking-wide text-gray-400">Filled</span>
                        <span className="text-sm tabular-nums text-gray-700">{row.filledslots ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-2 pr-4 text-left font-medium text-gray-500">Fixture Type</th>
                      <th className="py-2 pr-4 text-right font-medium text-gray-500">Count</th>
                      <th className="py-2 pr-4 text-right font-medium text-gray-500">Slots</th>
                      <th className="py-2 text-right font-medium text-gray-500">Filled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixtureData.overlay.map((row, idx) => (
                      <tr key={`${row.fixture_type ?? ''}-${idx}`} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-2 pr-4 text-gray-800">{row.fixture_type ?? '—'}</td>
                        <td className="py-2 pr-4 text-right tabular-nums text-gray-700">{row.fixture_count ?? '—'}</td>
                        <td className="py-2 pr-4 text-right tabular-nums text-gray-700">{row.slots ?? '—'}</td>
                        <td className="py-2 text-right tabular-nums text-gray-700">{row.filledslots ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/** Mobile category list card — tap drills into the full-screen category detail. */
function CategoryCard({ cat, onOpen }: { cat: StoreCategorySplit; onOpen: () => void }): React.ReactNode {
  const totalSft = cat.usable_sqft ?? cat.sqft;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full rounded-lg border border-gray-200 bg-white p-3 text-left transition-colors hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-gray-900">{stripCategoryNumber(cat.category_desc)}</h3>
          <p className="mt-0.5 text-xs text-gray-500 tabular-nums">
            {cat.options != null ? `${formatNumber(cat.options)} options` : 'options N/A'}
            {totalSft != null ? ` · ${formatNumber(totalSft)} sft` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 tabular-nums">{cat.revenue != null ? formatCurrency(cat.revenue) : 'N/A'}</p>
            <p className="text-[11px] text-gray-400">monthly</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        </div>
      </div>
    </button>
  );
}

function CategoriesTab({ categories, isLoading, storeId, yearMonth }: { categories: StoreCategorySplit[]; isLoading: boolean; storeId: string; yearMonth: string }): React.ReactNode {
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Mobile drill: direction drives the slide-in; swipeStartRef tracks the gesture.
  const [navDir, setNavDir] = useState<'next' | 'prev'>('next');
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const prefersReducedMotion = useReducedMotion();

  if (!isLoading && categories.length === 0) {
    return (
      <>
        <SectionHeader title="Category Health" />
        <EmptyState description="No category data available for this store." />
      </>
    );
  }

  const sectionTitle = (
    <>
      Category Health <span className="font-normal text-gray-400">({categories.length})</span>
    </>
  );

  // Mobile: a category list; tapping drills into a full-screen detail overlay
  // (matches the AOP category drill-down). Portaled to body so it escapes the
  // tab-swipe area and covers the store action bar for an immersive detail view.
  if (isMobile) {
    const drilledIndex = selectedId ? categories.findIndex((c) => c.category_desc === selectedId) : -1;
    const drilled = drilledIndex >= 0 ? categories[drilledIndex] : null;
    const goPrev = (): void => {
      const prev = categories[drilledIndex - 1];
      if (prev) { setNavDir('prev'); setSelectedId(prev.category_desc); }
    };
    const goNext = (): void => {
      const next = categories[drilledIndex + 1];
      if (next) { setNavDir('next'); setSelectedId(next.category_desc); }
    };
    return (
      <div className="space-y-3">
        <SectionHeader title={sectionTitle} />
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[68px] rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <CategoryCard key={cat.category_desc} cat={cat} onOpen={() => setSelectedId(cat.category_desc)} />
            ))}
          </div>
        )}
        {drilled &&
          createPortal(
            // Portaled to body (escapes the tab-swipe area + covers the action bar).
            // Swipe navigates categories (prev/next); stopPropagation keeps the gesture
            // from also reaching the tab-swipe handler — portaled events bubble the React tree.
            <div
              className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[45] flex flex-col bg-gray-50 lg:hidden"
              onTouchStart={(e) => {
                e.stopPropagation();
                const t = e.touches[0];
                swipeStartRef.current = t ? { x: t.clientX, y: t.clientY } : null;
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                const start = swipeStartRef.current;
                swipeStartRef.current = null;
                const t = e.changedTouches[0];
                if (!start || !t) return;
                const dx = t.clientX - start.x;
                const dy = t.clientY - start.y;
                // Horizontal swipe only — ignore vertical scrolls and diagonal drags.
                if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
                if (dx < 0) goNext(); else goPrev();
              }}
            >
              {/* Title bar: back (→ list) labelled with the category name + prev/next controls. */}
              <nav className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label="Back to categories"
                  className="-ml-1.5 flex min-h-11 min-w-0 items-center gap-2 rounded-md p-1.5 text-sm font-semibold text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <ArrowLeft className="h-5 w-5 shrink-0 text-gray-500" aria-hidden />
                  <span className="truncate">{stripCategoryNumber(drilled.category_desc)}</span>
                </button>
                {categories.length > 1 && (
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="mr-1 tabular-nums text-xs text-gray-500">{drilledIndex + 1} / {categories.length}</span>
                    <button
                      type="button"
                      onClick={goPrev}
                      disabled={drilledIndex === 0}
                      aria-label="Previous category"
                      className="flex h-11 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={drilledIndex === categories.length - 1}
                      aria-label="Next category"
                      className="flex h-11 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden />
                    </button>
                  </div>
                )}
              </nav>
              <motion.div
                key={drilled.category_desc}
                initial={{ opacity: 0, x: prefersReducedMotion ? 0 : navDir === 'next' ? 16 : -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
              >
                <CategoryDetail cat={drilled} storeId={storeId} yearMonth={yearMonth} />
              </motion.div>
            </div>,
            document.body,
          )}
      </div>
    );
  }

  // Desktop: master-detail (list + detail pane side by side) — unchanged.
  const active = categories.find((c) => c.category_desc === selectedId) ?? categories[0];

  return (
    <div className="space-y-3">
      <SectionHeader title={sectionTitle} />
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Master list */}
        <div className="space-y-2 lg:w-80 lg:shrink-0">
          {categories.map((cat) => {
            const isActive = active != null && cat.category_desc === active.category_desc;
            const totalSft = cat.usable_sqft ?? cat.sqft;
            return (
              <button
                key={cat.category_desc}
                type="button"
                onClick={() => setSelectedId(cat.category_desc)}
                aria-pressed={isActive}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors duration-150 ease-out focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary',
                  isActive ? 'border-primary-200 bg-primary-50' : 'border-gray-200 bg-white hover:bg-gray-50',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cn('truncate text-sm font-medium', isActive ? 'text-primary-900' : 'text-gray-900')}>{stripCategoryNumber(cat.category_desc)}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 tabular-nums">
                    {cat.options != null ? `${formatNumber(cat.options)} options` : 'options N/A'}
                    {totalSft != null ? ` · ${formatNumber(totalSft)} sft` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 tabular-nums">{cat.revenue != null ? formatCurrency(cat.revenue) : 'N/A'}</p>
                  <p className="text-[11px] text-gray-400">monthly</p>
                </div>
                <ChevronRight className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-500' : 'text-gray-400')} aria-hidden />
              </button>
            );
          })}
        </div>

        {/* Detail pane */}
        <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50/60 p-4">
          {active ? <CategoryDetail cat={active} storeId={storeId} yearMonth={yearMonth} /> : <EmptyState description="Select a category." />}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Header actions (GMetri / PDF)                                       */
/* ================================================================== */

const openExternal = (url: string): void => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

/** Shared source of the GMetri / Floor Layout / Report links (queries dedupe by key). */
function useStoreActionLinks(storeId: string, isPinned: boolean): {
  dg2nSrc: string;
  pdfUrl: string | null;
  reportUrl: string | null;
} {
  const dg2nSrc = `https://ai.dg2n.com/trends/s/${storeId}/digital-twin-anon`;
  const { data: layoutData } = useQuery({
    queryKey: ['store-layout', storeId],
    queryFn: () => appApiFetch<StoreLayoutResponse>(`/store-view/${storeId}/layout`),
    staleTime: 5 * 60 * 1000,
  });
  const { data: reportData } = useQuery({
    queryKey: storeInsightKeys.report(storeId),
    queryFn: () => fetchStoreReport(storeId),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: isPinned,
  });
  return {
    dg2nSrc,
    pdfUrl: layoutData?.files?.[0]?.signed_url ?? null,
    reportUrl: reportData?.report_url ?? null,
  };
}

/** Desktop header actions — GMetri / Floor Layout / Report as inline buttons. */
function StoreHeaderActions({ storeId, isPinned }: { storeId: string; isPinned: boolean }): React.ReactNode {
  const { dg2nSrc, pdfUrl, reportUrl } = useStoreActionLinks(storeId, isPinned);
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Button variant="outline" size="sm" onClick={() => openExternal(dg2nSrc)} aria-label="Open in GMetri">
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Open in GMetri
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={!pdfUrl}
        onClick={() => pdfUrl && openExternal(pdfUrl)}
        aria-label="Open Floor Layout"
      >
        <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Floor Layout
      </Button>
      {isPinned && (
        <Button
          variant="primary"
          size="sm"
          disabled={!reportUrl}
          onClick={() => reportUrl && openExternal(reportUrl)}
          aria-label="Open Store Intelligence Report"
        >
          <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Store Intelligence Report
        </Button>
      )}
    </div>
  );
}

/** Mobile sticky bottom action bar — combined GMetri/Layout (→ bottom sheet) + Report. */
function StoreMobileActionBar({ storeId, isPinned }: { storeId: string; isPinned: boolean }): React.ReactNode {
  const { dg2nSrc, pdfUrl, reportUrl } = useStoreActionLinks(storeId, isPinned);
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <>
      {/* Portaled to body: the page root uses `animate-fadeInUp` (a transform),
          which would otherwise trap this `fixed` bar inside that containing block. */}
      {createPortal(
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-gray-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] lg:hidden">
          <Button
            variant="outline"
            size="md"
            className="relative min-h-11 flex-1"
            onClick={() => setSheetOpen(true)}
            aria-label="Store views: GMetri and Floor Layout"
          >
            <Boxes className="h-4 w-4 shrink-0" aria-hidden />
            Store Views
          </Button>
          {isPinned && (
            <Button
              variant="primary"
              size="md"
              className="relative min-h-11 flex-1"
              disabled={!reportUrl}
              onClick={() => reportUrl && openExternal(reportUrl)}
              aria-label="Open Store Intelligence Report"
            >
              <FileText className="h-4 w-4 shrink-0" aria-hidden />
              Intelligence Report
            </Button>
          )}
        </div>,
        document.body,
      )}
      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="Store views">
        <div className="space-y-1 pb-2">
          <button
            type="button"
            onClick={() => { setSheetOpen(false); openExternal(dg2nSrc); }}
            className="flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-left transition-colors hover:bg-gray-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <ExternalLink className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-gray-900">Open in GMetri</span>
              <span className="block truncate text-xs text-gray-500">3D digital twin walkthrough</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          </button>
          <button
            type="button"
            disabled={!pdfUrl}
            onClick={() => { if (pdfUrl) { setSheetOpen(false); openExternal(pdfUrl); } }}
            className="flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <FileText className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-gray-900">Floor Layout</span>
              <span className="block truncate text-xs text-gray-500">{pdfUrl ? 'View store layout PDF' : 'Layout not available'}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          </button>
        </div>
      </BottomSheet>
    </>
  );
}

/* ================================================================== */
/* Page                                                                */
/* ================================================================== */

export function StoreDetailPage(): React.ReactNode {
  const { storeId, tab } = useParams<{ storeId: string; tab?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchParams] = useSearchParams();
  const isCommandContext = location.pathname.startsWith('/command/');
  const basePath = isCommandContext ? '/command/store-view' : '/store-view';
  const locationState = location.state as { dateFrom?: string; dateTo?: string } | null;
  const storeFilters = useStorePerformanceFilterStore((s) => s.filters);
  // Prefer URL params (survive refresh) → navigation state → Zustand store (preserves list-page filter) → last month.
  const dateFromParam = searchParams.get('dateFrom') ?? locationState?.dateFrom ?? storeFilters.dateFrom ?? null;
  const dateToParam = searchParams.get('dateTo') ?? locationState?.dateTo ?? storeFilters.dateTo ?? null;
  const yearMonth = dateFromParam ? dateFromParam.slice(0, 7) : getLastYearMonth();
  // For product tab: use the exact date range passed in (MTD/QTD may be partial months).
  const { fromDate: defaultProductFromDate, toDate: defaultProductToDate } = yearMonthToDateRange(yearMonth);
  const productFromDate = dateFromParam ?? defaultProductFromDate;
  const productToDate = dateToParam ?? defaultProductToDate;
  const activeTab: TabValue = isTabValue(tab) ? tab : DEFAULT_TAB;

  const handleTabChange = useCallback(
    (value: string) => {
      // Replace rather than push so tab switches don't stack up in the browser history.
      // This means navigate(-1) from any tab returns directly to the Store View list.
      if (storeId) navigate(`${basePath}/store/${storeId}/${value}${location.search}`, { replace: true });
    },
    [navigate, basePath, storeId, location.search],
  );

  const handleBack = useCallback(() => {
    // location.key is 'default' only when there is no prior history entry (e.g. direct link).
    // In that case fall back to URL-based navigation; otherwise use browser back (instant + cache hit).
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(`${basePath}${location.search}`);
    }
  }, [navigate, basePath, location.key, location.search]);

  const { data, isLoading } = useQuery({
    queryKey: ['store-detail', storeId, yearMonth, dateFromParam, dateToParam],
    queryFn: () => appApiFetch<StoreDetailResponse>('/store-view/details', {
      store_id: storeId!,
      year_month: yearMonth,
      ...(dateFromParam ? { startDate: dateFromParam } : {}),
      ...(dateToParam ? { endDate: dateToParam } : {}),
    }),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: npsData, isLoading: npsLoading } = useQuery({
    queryKey: npsKeys.storeDetails(storeId ?? '', dateFromParam ?? undefined, dateToParam ?? undefined),
    queryFn: () => fetchNPSStoreDetails(storeId!, dateFromParam ?? undefined, dateToParam ?? undefined),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: storeInsights, isLoading: insightsLoading } = useQuery({
    queryKey: storeInsightKeys.summary(storeId ?? ''),
    queryFn: () => fetchStoreInsights(storeId!),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: topActions, isLoading: topActionsLoading } = useQuery({
    queryKey: storeInsightKeys.topActions(storeId ?? '', 5),
    queryFn: () => fetchStoreTopActions(storeId!, 5),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
  });

  // Hide the app bottom nav on this focused detail page (mobile) so the sticky
  // store action bar owns the bottom — same pattern as the dashboard drill-down.
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('nav[aria-label="Bottom navigation"]');
    if (nav) nav.style.display = 'none';
    return () => {
      if (nav) nav.style.display = '';
    };
  }, []);

  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const [swipeDir, setSwipeDir] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; scroller: boolean } | null>(null);

  // Measure the sticky tab bar so the Product tab's sticky search/filter toolbar can
  // pin flush beneath it — written to the --product-sticky-top CSS var on the root,
  // which ProductGrid's sticky toolbar reads (falls back to 0 elsewhere).
  const tabBarRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = tabBarRef.current;
    const root = rootRef.current;
    if (!bar || !root) return;
    const measure = (): void => root.style.setProperty('--product-sticky-top', `${bar.offsetHeight}px`);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);

  if (!storeId) {
    return (
      <div className="animate-fadeInUp">
        <h1 className="text-2xl font-bold text-gray-900">Store Detail</h1>
        <p className="mt-4 text-sm text-gray-500">No store selected. Open a store from Store View.</p>
      </div>
    );
  }

  const agg = data?.aggregated_data ?? null;
  const storeName = data?.store_name || storeId;
  const location_ = [data?.city, data?.region].filter(Boolean).join(', ');
  const npsScore = npsData?.performance?.nps_score ?? null;
  const isPinned = PINNED_STORE_CODES.has(storeId);
  const periodLabel = getPeriodLabel(dateFromParam, dateToParam, agg?.month ?? yearMonth);

  /* ── Mobile tab swipe: gesture detection + direction-aware slide ── */
  const activeIndex = TABS.findIndex((t) => t.value === activeTab);

  const changeTab = (value: string): void => {
    const to = TABS.findIndex((t) => t.value === value);
    setSwipeDir(to > activeIndex ? 1 : to < activeIndex ? -1 : 0);
    handleTabChange(value);
  };

  const goToIndex = (index: number): void => {
    const clamped = Math.max(0, Math.min(TABS.length - 1, index));
    const target = TABS[clamped];
    if (target && clamped !== activeIndex) changeTab(target.value);
  };

  // A swipe that begins inside a horizontal scroller (pillar carousel, tables,
  // filter bar) belongs to that scroller — never to the tab swipe.
  const startsInHorizontalScroller = (target: EventTarget | null): boolean => {
    let el = target instanceof HTMLElement ? target : null;
    while (el && el !== document.body) {
      if (el.scrollWidth > el.clientWidth + 4) {
        const overflowX = window.getComputedStyle(el).overflowX;
        if (overflowX === 'auto' || overflowX === 'scroll') return true;
      }
      el = el.parentElement;
    }
    return false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    const t = e.touches[0];
    touchStartRef.current = t ? { x: t.clientX, y: t.clientY, scroller: startsInHorizontalScroller(e.target) } : null;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>): void => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    const t = e.changedTouches[0];
    if (!start || start.scroller || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Only a decisive, mostly-horizontal swipe changes tabs.
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    goToIndex(dx < 0 ? activeIndex + 1 : activeIndex - 1);
  };

  const renderTabPanel = (value: TabValue): React.ReactNode => {
    switch (value) {
      case 'executive-summary':
        return (
          <ExecutiveSummary
            agg={agg}
            sqft={data?.sqft ?? null}
            npsScore={npsScore}
            isLoading={isLoading}
            npsLoading={npsLoading}
            storeName={storeName}
            storeInsights={storeInsights}
            insightsLoading={insightsLoading}
            topActions={topActions}
            topActionsLoading={topActionsLoading}
            currentPath={location.pathname}
            isPinned={isPinned}
          />
        );
      case 'categories':
        return <CategoriesTab categories={data?.category_level_split ?? []} isLoading={isLoading} storeId={storeId} yearMonth={yearMonth} />;
      case 'catchment':
        return <StoreIntelligenceDetail storeId={storeId} yearMonth={yearMonth} hideHeader subTabVariant="pills" />;
      case 'customer-voice':
        return <CXIntelligenceTab storeCode={storeId} storeName={storeName} />;
      case 'product':
        return <ProductGrid storeCode={storeId} fromDate={productFromDate} toDate={productToDate} />;
      default: {
        const _exhaustive: never = value;
        return _exhaustive;
      }
    }
  };

  const titleBar = (
    // eslint-disable-next-line design-system/prefer-section-header -- store detail title bar, not a SectionHeader
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back to Store View"
          className="relative -ml-1 shrink-0 rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <span className="absolute -inset-1.5 lg:hidden" aria-hidden />
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <h1 className="flex min-w-0 items-baseline gap-1.5 text-lg font-bold text-gray-900 md:text-xl">
          <span className="truncate">{storeName}</span>
          <span className="shrink-0 text-base font-normal text-gray-500">({storeId})</span>
        </h1>
      </div>
      {/* Desktop keeps inline actions; mobile moves them to a sticky bottom bar. */}
      <div className="hidden lg:block">
        <StoreHeaderActions storeId={storeId} isPinned={isPinned} />
      </div>
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="animate-fadeInUp space-y-4 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0"
    >
      {isMobile ? (
        <>
          {/* Title bar */}
          {titleBar}
          {/* Store info strip — a distinct 2×2 spec panel below (outside) the title bar.
              mb-0 zeroes the root's space-y-4 bottom gap to the tab bar (which already
              has its own py-3), so the info strip doesn't float above the tabs. */}
          <div className="mb-0 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              <StoreInfoCell label="Format" value={agg?.format_std || '—'} />
              <StoreInfoCell label="Location" value={location_ || '—'} />
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              <StoreInfoCell label="Size" value={data?.sqft != null ? `${formatNumber(data.sqft)} sq ft` : '—'} />
              <StoreInfoCell label="Period" value={periodLabel} />
            </div>
          </div>
        </>
      ) : (
        // mb-0 zeroes the root's space-y-4 gap to the tab bar; the tab bar's own
        // lg:pt-4 (16px) then provides a single, clean header→tabs spacing.
        <div className="mb-0 space-y-2 border-b border-gray-200 pb-3">
          {titleBar}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {agg?.format_std && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {agg.format_std}
              </span>
            )}
            {location_ && <HeaderChip icon={MapPin}>{location_}</HeaderChip>}
            {data?.sqft != null && <HeaderChip icon={Building2}>{formatNumber(data.sqft)} sq ft</HeaderChip>}
            <HeaderChip icon={CalendarDays}>{periodLabel}</HeaderChip>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={changeTab}>
        {/* Sticky tab bar — pinned under the app TopBar while content scrolls.
            Mobile: pt-3 (12px breathing room above the tabs); desktop: lg:pt-4 for a
            clean 16px header→tabs gap (header uses mb-0). pb-3 both. */}
        <div ref={tabBarRef} className="sticky top-0 z-20 -mx-4 bg-gray-50/90 px-4 pb-3 pt-3 backdrop-blur-sm lg:pt-4">
          <TabsList variant="underline">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} variant="underline" className="whitespace-nowrap">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {isMobile ? (
          // Mobile: one swipeable panel with a direction-aware slide. Swipes that
          // start inside a horizontal scroller are ignored so inner scrolling works.
          // overflow-x-clip (not overflow-hidden): clips the horizontal tab-slide
          // WITHOUT becoming a scroll container, so sticky sub-tabs inside a tab
          // (e.g. Catchment) can still pin to the page scroll.
          <div className="overflow-x-clip" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <AnimatePresence mode="wait" custom={swipeDir} initial={false}>
              <motion.div
                key={activeTab}
                custom={swipeDir}
                variants={tabSlideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.32, 0.72, 0, 1] }}
                className={activeTab === 'product' ? 'mt-0' : 'mt-4'}
                role="tabpanel"
                tabIndex={0}
                aria-label={`${TABS[activeIndex]?.label ?? ''} panel`}
              >
                {renderTabPanel(activeTab)}
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <>
            <TabsContent value="executive-summary" className="mt-4">{renderTabPanel('executive-summary')}</TabsContent>
            <TabsContent value="categories" className="mt-4">{renderTabPanel('categories')}</TabsContent>
            <TabsContent value="catchment" className="mt-4">{renderTabPanel('catchment')}</TabsContent>
            <TabsContent value="customer-voice" className="mt-4">{renderTabPanel('customer-voice')}</TabsContent>
            <TabsContent value="product" className="mt-4">{renderTabPanel('product')}</TabsContent>
          </>
        )}
      </Tabs>

      {/* Mobile sticky bottom actions — GMetri/Layout (bottom sheet) + Report */}
      <StoreMobileActionBar storeId={storeId} isPinned={PINNED_STORE_CODES.has(storeId)} />
    </div>
  );
}

export default StoreDetailPage;
