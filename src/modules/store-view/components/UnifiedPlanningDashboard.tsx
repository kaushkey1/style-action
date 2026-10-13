import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, TrendingUp, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button, PageHeader, Badge, MetricCard } from '@/components/ui';
import { DashboardKpiGrid } from '@/modules/dashboard/components/DashboardKpiGrid';
import { npsKeys, fetchNPSStoreDetails } from '../api/npsApi';
import { useUnifiedPlanningStore } from '../stores/unified-planning.store';
import { useRetailPlanningStore } from '../stores/retail-planning.store';
import { CategoryDetailsPanel } from './CategoryDetailsPanel';
import { StoreView } from './StoreView';
import { StoreDigitalTwin } from './StoreDigitalTwin';
import { SpaceAllocation } from './SpaceAllocation';
import { formatCurrency, formatNumber, getLastYearMonth, formatDate } from '@/lib/utils';
import type { ViewMode, Store } from '../types/unified-planning.types';

const PLANNING_MODES: ViewMode[] = ['space'];

export function UnifiedPlanningDashboard() {
  const { viewMode: urlViewModeParam, storeId: urlStoreId } = useParams<{ viewMode?: string; storeId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isCommandContext = location.pathname.startsWith('/command/');
  const storeBasePath = isCommandContext ? '/command/store-view' : '/store-view';
  const {
    viewMode,
    setViewMode,
    networkMetrics,
    categories,
    expandedCategoryId,
    selectedStoreId,
    selectedStoreData,
    toggleCategory,
    selectStore,
    categoryDetails,
    getCategoryAggregates,
    storePlanogram,
  } = useUnifiedPlanningStore();

  const initializeDashboard = useRetailPlanningStore((s) => s.initializeDashboard);
  const [timePeriod] = useState<'MTD' | 'Last Month'>('Last Month');
  const [, setIsStoreLoading] = useState(false);
  const [apiStoreTotal, setApiStoreTotal] = useState(0);
  const [digitalTwinView, setDigitalTwinView] = useState<'2d' | 'fixture' | 'nps'>('2d');

  const yearMonth = useMemo(() => getLastYearMonth(), []);

  const { data: npsStoreData } = useQuery({
    queryKey: npsKeys.storeDetails(selectedStoreId ?? ''),
    queryFn: () => fetchNPSStoreDetails(selectedStoreId!),
    enabled: !!selectedStoreId && viewMode === 'store',
    staleTime: 5 * 60 * 1000,
  });

  // Derive viewMode from URL params
  const urlViewMode: ViewMode = (urlViewModeParam || 'store') as ViewMode;

  // Store detail storeId from URL
  const storeViewStoreId = urlViewMode === 'store' && urlStoreId
    ? urlStoreId
    : undefined;

  // Sync URL-derived viewMode to Zustand store
  useEffect(() => {
    if (urlViewMode !== viewMode) {
      setViewMode(urlViewMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlViewMode]);

  // Sync URL storeId → Zustand selectedStoreId for store view
  useEffect(() => {
    if (urlViewMode !== 'store') return;
    if (storeViewStoreId && selectedStoreId !== storeViewStoreId) {
      selectStore(storeViewStoreId);
    } else if (!storeViewStoreId && selectedStoreId) {
      selectStore(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeViewStoreId, urlViewMode]);

  const isPlanningMode = PLANNING_MODES.includes(viewMode);
  const isAnalyticsMode = viewMode === 'store' || viewMode === 'category';

  // Initialize planning data when entering any planning mode
  useEffect(() => {
    if (isPlanningMode) {
      initializeDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlanningMode]);

  const categoryAggregates = getCategoryAggregates();

  // Compute the store for header display from API-fetched selectedStoreData
  const currentStoreForHeader = selectedStoreId
    ? (selectedStoreData as Store | null) ?? null
    : null;

  return (
    <div className="animate-fadeInUp">
      {/* Page Header */}
      {viewMode === 'store' && selectedStoreId && currentStoreForHeader ? (
        <div className="flex items-start justify-between gap-4 mb-4">
          {/* Left: back icon + title/subtitle stack */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => { selectStore(null); navigate(storeBasePath); }}
              aria-label="Back to all stores"
              className="mt-1 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/40 rounded p-1 -m-1 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg lg:text-xl font-bold text-gray-900">
                  {currentStoreForHeader.name} ({selectedStoreId})
                </h1>
                {currentStoreForHeader.grade && <Badge variant="default" size="sm">{currentStoreForHeader.grade}</Badge>}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {currentStoreForHeader.city || ''}{currentStoreForHeader.city ? ' · ' : ''}{currentStoreForHeader.sqft ? `${formatNumber(currentStoreForHeader.sqft)} sft · ` : ''}{currentStoreForHeader.categories?.length ?? 0} Categories
              </p>
            </div>
          </div>

          {/* Right: primary actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/products/${selectedStoreId}`)}
            >
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              Store Product Details
            </Button>
          </div>
        </div>
      ) : viewMode === 'category' ? (
        <PageHeader title="Category View" />
      ) : viewMode === 'space' ? (
        <PageHeader title="Space Planning" />
      ) : (
        <PageHeader title="Store View" />
      )}

      {/* Main content */}
      <div>
        {/* Planning sub-views */}
        {viewMode === 'space' && <SpaceAllocation />}
        {/* Store Summary Banner (only when a store is selected) */}
        {viewMode === 'store' && selectedStoreId && (() => {
          const currentStore = currentStoreForHeader;
          if (!currentStore) return null;
          const monthlyRev = currentStore.monthlyRevenue ?? 0;
          const opts = timePeriod === 'MTD'
            ? (currentStore.optionsInStock ?? currentStore.options ?? 0)
            : (currentStore.totalOptions ?? currentStore.options ?? 0);
          const noosPct = currentStore.noosPct ?? null;
          const fashionPct = currentStore.fashionPct ?? null;
          const stockValue = currentStore.monthClosingStockQty ?? null;
          const noosFashionSplit = noosPct != null && fashionPct != null
            ? `${Math.round(noosPct)}% / ${Math.round(fashionPct)}%`
            : null;

          return (
            <div className="space-y-3 mb-6">
              {/* Headline KPIs — 4 MetricCards in the Dashboard grid */}
              <DashboardKpiGrid>
                <MetricCard
                  label="NOOS / Fashion"
                  value={noosFashionSplit ?? 'N/A'}
                  subtitle="NOOS / Fashion split"
                />
                <MetricCard
                  label="Revenue"
                  value={monthlyRev ? formatCurrency(monthlyRev) : 'N/A'}
                  valueClassName="text-green-700"
                  subtitle="Last month"
                />
                <MetricCard
                  label="YOY Growth"
                  value={currentStore.lyGrowth != null ? `${currentStore.lyGrowth}%` : 'N/A'}
                  subtitle="vs same period last year"
                />
                <MetricCard
                  label="NPS Score"
                  value={npsStoreData?.performance?.nps_score != null ? `${npsStoreData.performance.nps_score} pts` : 'N/A'}
                  subtitle={npsStoreData?.performance?.totalResponses != null ? `${npsStoreData.performance.totalResponses} responses` : undefined}
                />
              </DashboardKpiGrid>

              {/* Secondary store profile — 7 equal-width columns (2 → 4 → 7 responsive) */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                {/* eslint-disable-next-line design-system/prefer-metric-grid -- intentionally lighter than MetricCard: compact label/value pairs for descriptive store attributes, not headline metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <StoreDetailPair
                    label="Monthly GM"
                    value={currentStore.total_gross_margin != null ? formatCurrency(currentStore.total_gross_margin) : 'N/A'}
                    muted={currentStore.total_gross_margin == null}
                  />
                  <StoreDetailPair
                    label={timePeriod === 'MTD' ? 'Options in Stock' : 'Total Options'}
                    value={formatNumber(opts)}
                  />
                  <StoreDetailPair
                    label="Stock Quantity"
                    value={stockValue != null ? formatNumber(stockValue) : 'N/A'}
                    muted={stockValue == null}
                  />
                  <StoreDetailPair
                    label="Format"
                    value={currentStore.format || 'N/A'}
                    muted={!currentStore.format}
                  />
                  <StoreDetailPair
                    label="Sq Ft"
                    value={currentStore.sqft ? formatNumber(currentStore.sqft) : 'N/A'}
                    muted={!currentStore.sqft}
                  />
                  <StoreDetailPair
                    label="NRM %"
                    value={currentStore.nrmPct != null ? `${currentStore.nrmPct.toFixed(1)}%` : 'N/A'}
                    muted={currentStore.nrmPct == null}
                  />
                  <StoreDetailPair
                    label="Age"
                    value={currentStore.storeAgeMonths != null ? `${currentStore.storeAgeMonths} mo` : 'N/A'}
                    muted={currentStore.storeAgeMonths == null}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Analytics content */}
        {isAnalyticsMode && (
          <div>
            {/* Store Digital Twin Section (only when a store is selected) */}
            {viewMode === 'store' && selectedStoreId && currentStoreForHeader && (
              <StoreDigitalTwin
                storeCode={selectedStoreId}
                storeId={selectedStoreId}
                yearMonth={yearMonth}
                planogram={storePlanogram}
                onViewChange={setDigitalTwinView}
              />
            )}

            {/* Section Header */}
            {!(viewMode === 'store' && selectedStoreId) && (
              /* eslint-disable-next-line design-system/prefer-section-header -- conditional dynamic label, not a standard section */
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    {viewMode === 'category' ? 'Categories' : 'Stores'}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {viewMode === 'category'
                      ? `Aggregated across ${formatNumber(networkMetrics.totalStores)} stores`
                      : `${formatNumber(apiStoreTotal)} stores across all regions`}
                  </span>
                </div>
              </div>
            )}

            {/* Category View */}
            {viewMode === 'category' && (
              <div className="space-y-2">
                {categories.map((category) => {
                  const isExpanded = expandedCategoryId === category.id;
                  const details = categoryDetails[category.id];
                  const isPositiveGrowth = category.recoNPI > 105;

                  return (
                    <div
                      key={category.id}
                      className={`bg-white rounded-lg border transition-all ${isExpanded ? 'border-primary shadow-md' : 'border-gray-200 shadow-sm hover:border-gray-300'
                        }`}
                    >
                      <div
                        // eslint-disable-next-line design-system/prefer-section-header -- category accordion row, not a standard section
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => toggleCategory(category.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleCategory(category.id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <button
                            aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
                            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isExpanded ? 'bg-primary text-white' : 'text-gray-400 hover:text-gray-600'
                              }`}
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-gray-900">{category.name}</h3>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                {formatNumber(category.itemCount)} Items
                              </span>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                {formatNumber(category.storeCount)} Stores
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Last Season: {formatNumber(category.lastSeasonItems)} items
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="text-right min-w-[80px]">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Potential NPI</p>
                            <p className="font-semibold text-gray-900 tabular-nums">{formatCurrency(category.potentialNPI * 10000000, { decimals: 2 })}</p>
                          </div>
                          <div className="text-right min-w-[70px]">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Reco NPI</p>
                            <p className={`font-semibold tabular-nums flex items-center gap-1 justify-end ${isPositiveGrowth ? 'text-emerald-600' : 'text-gray-900'}`}>
                              {isPositiveGrowth && <TrendingUp className="w-3 h-3" />}
                              {category.recoNPI}%
                            </p>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Ctr Sth</p>
                            <p className="font-semibold text-gray-900 tabular-nums">{formatCurrency(category.ctrSth * 10000000, { decimals: 2 })}</p>
                          </div>
                          <div className="text-right min-w-[60px]">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Options</p>
                            <p className="font-semibold text-gray-900 tabular-nums">{formatNumber(category.overOpn)}</p>
                          </div>
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${category.score >= 90 ? 'bg-emerald-100 text-emerald-700' :
                              category.score >= 80 ? 'bg-blue-100 text-blue-700' :
                                category.score >= 70 ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-600'
                            }`}>
                            {category.score}
                          </div>
                          <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90 text-primary' : 'text-gray-400'}`} />
                        </div>
                      </div>

                      {isExpanded && details && <CategoryDetailsPanel category={category} details={details} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Store View */}
            {viewMode === 'store' && (
              <StoreView
                selectedStoreId={selectedStoreId}
                onSelectStore={selectStore}
                yearMonth={yearMonth}
                timePeriod={timePeriod}
                onLoadingChange={setIsStoreLoading}
                onTotalChange={setApiStoreTotal}
                hideCategories={digitalTwinView !== '2d'}
              />
            )}

            {/* Footer */}
            {!(viewMode === 'store' && selectedStoreId) && (
              <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
                <p>
                  {viewMode === 'category'
                    ? `Data Summary \u2022 ${formatNumber(categoryAggregates.totalItems)} Items \u2022 ${formatNumber(networkMetrics.totalStores)} Stores \u2022 ${categories.length} Categories`
                    : `Data Summary \u2022 ${formatNumber(apiStoreTotal)} Stores`}
                </p>
                <p>Last Updated: {formatDate(new Date())}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Label/value pair used in the store summary banner's secondary detail strip. */
function StoreDetailPair({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${muted ? 'text-gray-400' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}
