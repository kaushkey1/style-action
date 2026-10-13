import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, History, Clock, User, Download, Search, X } from 'lucide-react';
import {
  PageHeader,
  ShimmerTable,
  FilterSelect,
  FilterBar,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  EmptyState,
  Pagination,
  Sheet,
  Badge,
  Button,
  FilterClear,
  Input,
} from '@/components/ui';
import {cn, debounce, formatCurrency, getCurrencySymbol, getActiveTenantId} from '@/lib/utils';
import { useFeatureFlag } from '@/hooks/useScreenConfig';
import {
  getStageBadgeConfig,
} from '../data/mockBuyingModuleV2';
import { useCategoryMonths } from '../api/categoryBuyPlanApi';
import { lakhText, planPath, toMonth } from '../api/categoryPlanData';
import { CategoryQueryState } from '../components/CategoryQueryState';

// ─── Buying Module Pipeline (Category Tab content) ─────────────────────────
const STAGE_OPTIONS = [
  { value: 'all', label: 'All Stages' },
  { value: 'planning', label: 'Planning' },
  { value: 'demand_calc', label: 'Demand Calc' },
  { value: 'buyer_review', label: 'Buyer Review' },
  { value: 'cat_approval', label: 'Cat Approval' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'otb_review', label: 'OTB Review' },
  { value: 'released', label: 'Released' },
]

function BuyingModulePipelineView({ navigate: nav }: { navigate: (path: string) => void }) {
  const [yearFilter, setYearFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const query = useCategoryMonths()
  const months = useMemo(() => (query.data?.items ?? []).map(toMonth), [query.data])
  const yearOptions = [
    { value: 'all', label: 'All Years' },
    ...(query.data?.years ?? []).map(year => ({ value: String(year), label: String(year) })),
  ]
  const filtered = useMemo(() => months.filter((m) => {
    if (yearFilter !== 'all' && String(m.year) !== yearFilter) return false
    if (stageFilter !== 'all' && m.stage !== stageFilter) return false
    return true
  }), [months, yearFilter, stageFilter])
  const hasFilters = yearFilter !== 'all' || stageFilter !== 'all'
  if (query.isPending || query.isError) return <CategoryQueryState query={query} variant="months" />

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <FilterBar>
          <FilterSelect value={yearFilter} onChange={setYearFilter} placeholder="All Years" options={yearOptions} />
          <FilterSelect value={stageFilter} onChange={setStageFilter} placeholder="All Stages" options={STAGE_OPTIONS} />
          {hasFilters && <FilterClear onClear={() => { setYearFilter('all'); setStageFilter('all') }} />}
        </FilterBar>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No buy plans found" description="No buy plans match the selected filters." />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <th className="text-left px-4 py-2.5">SALE MONTH</th>
                  <th className="text-right px-4 py-2.5">CATEGORIES</th>
                  <th className="text-right px-4 py-2.5">TOTAL OPTIONS</th>
                  <th className="text-right px-4 py-2.5">ACTIONS PENDING</th>
                  <th className="text-right px-4 py-2.5">HELD</th>
                  <th className="text-right px-4 py-2.5">OTB VALUE (₹L)</th>
                  <th className="text-left px-4 py-2.5">STAGE</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((month) => {
                  const { label: stageLabel, variant: stageVariant } = getStageBadgeConfig(month.stage)
                  return (
                    <tr
                      key={month.saleMonth}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => nav(planPath(month.saleMonth, undefined, undefined, undefined, month.runId))}
                    >
                      <td className="px-4 py-3"><span className="text-sm font-medium text-gray-900">{month.label}</span></td>
                      <td className="px-4 py-3 text-right text-sm">{month.categories}</td>
                      <td className="px-4 py-3 text-right text-sm">{month.optionsTotal > 0 ? month.optionsTotal.toLocaleString() : '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {month.flaggedCount !== null && month.flaggedCount > 0 ? <Badge variant="warning" size="sm">{month.flaggedCount}</Badge> : <span className="text-gray-400 text-sm">-</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {month.heldCount > 0 ? <Badge variant="error" size="sm">{month.heldCount}</Badge> : <span className="text-gray-400 text-sm">-</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">{lakhText(month.otbValue)}</td>
                      <td className="px-4 py-3"><Badge variant={stageVariant} size="sm">{stageLabel}</Badge></td>
                      <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
import {
  useBrandViewFilters,
  useBrandViewListing,
  useDownloadBrandView,
} from '../api/buyPlanHooks';
import { fetchBuyPlanHistory } from '../api/buyPlanApi';
import type {
  BrandViewItem,
  BuyPlanHistoryEntry,
} from '../api/buyPlanApi';

export default function BuyPlanCategoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const showCategoryView = useFeatureFlag('buy_plan', 'show_category_view');
  const showBrandView = useFeatureFlag('buy_plan', 'show_brand_view');
  const isDemoOrg = getActiveTenantId() === 'demo_org';
  const defaultTab = showCategoryView ? 'category' : 'brand';

  const tabParam = searchParams.get('tab');
  const activeTab: 'category' | 'brand' =
    tabParam === 'brand' && showBrandView ? 'brand' :
    tabParam === 'category' && showCategoryView ? 'category' :
    defaultTab;

  useEffect(() => {
    if (!tabParam) {
      setSearchParams({ tab: defaultTab }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: set default tab param
  }, []);

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const [catHistoryItem, setCatHistoryItem] = useState<BrandViewItem | null>(null);

  // Brand View Filters
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [familyFilter, setFamilyFilter] = useState<string>('all');
  const [brandHitFilter, setBrandHitFilter] = useState<string>('all');
  const [brandStatusFilter, setBrandStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [brandPage, setBrandPage] = useState(1);
  const [brandPageSize, setBrandPageSize] = useState(10);

  // Version History panel state
  const [historyPlan, setHistoryPlan] = useState<BrandViewItem | null>(null);

  // Debounced search handler - updates searchQuery after 400ms of inactivity
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => setSearchQuery(value), 400),
    [],
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSetSearch(value);
  }, [debouncedSetSearch]);

  const handleSearchClear = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
  }, []);


  // ── React Query: base filters ─────────────────────────────────────
  const { data: brandFilters } = useBrandViewFilters();

  // ── React Query: cascading filters ────────────────────────────────
  const { data: cascadedSegmentsData, isFetching: isFetchingSegments } = useBrandViewFilters(
    brandFilter !== 'all' ? { brand: brandFilter } : undefined,
  );
  const cascadedSegments = brandFilter !== 'all' ? (cascadedSegmentsData?.segments ?? null) : null;

  const { data: cascadedFamiliesData, isFetching: isFetchingFamilies } = useBrandViewFilters(
    brandFilter !== 'all' && segmentFilter !== 'all'
      ? { brand: brandFilter, segment: segmentFilter }
      : undefined,
  );
  const cascadedFamilies = brandFilter !== 'all' && segmentFilter !== 'all'
    ? (cascadedFamiliesData?.families ?? null)
    : null;

  // ── React Query: brand view listing ───────────────────────────────
  const listingParams = useMemo(() => {
    const p: Record<string, string | number | undefined> = { page: brandPage, page_size: brandPageSize };
    if (brandFilter !== 'all') p.brand = brandFilter;
    if (segmentFilter !== 'all') p.segment = segmentFilter;
    if (familyFilter !== 'all') p.family = familyFilter.split('::')[0];
    if (brandHitFilter !== 'all') p.hit = brandHitFilter;
    if (brandStatusFilter !== 'all') p.status = brandStatusFilter;
    if (searchQuery.trim()) p.search = searchQuery.trim();
    return p;
  }, [brandFilter, segmentFilter, familyFilter, brandHitFilter, brandStatusFilter, searchQuery, brandPage, brandPageSize]);

  const { data: listingData, isLoading: brandLoading, isFetching: brandFetching } = useBrandViewListing(listingParams);
  const brandPlans: BrandViewItem[] = listingData?.buy_plans ?? [];
  const brandPagination = listingData?.pagination ?? { page: 1, page_size: 10, total_records: 0, total_pages: 1 };

  // ── React Query: download mutation ────────────────────────────────
  const downloadMutation = useDownloadBrandView();
  const downloading = downloadMutation.isPending;

  // ── Cascading filter handlers ─────────────────────────────────────
  const handleBrandChange = useCallback((v: string) => {
    setBrandFilter(v);
    setSegmentFilter('all');
    setFamilyFilter('all');
    setBrandPage(1);
  }, []);

  const handleSegmentChange = useCallback((v: string) => {
    setSegmentFilter(v);
    setFamilyFilter('all');
    setBrandPage(1);
  }, []);

  const handleBrandPlanClick = (runId: string) => {
    navigate(`/buy-plans/brand/${runId}`);
  };

  const handleBrandPageChange = (page: number) => {
    setBrandPage(page);
  };

  const handleBrandPageSizeChange = (pageSize: number) => {
    setBrandPageSize(pageSize);
    setBrandPage(1);
  };

  const handleDownload = useCallback(() => {
    const params: Record<string, string | undefined> = {};
    if (brandFilter !== 'all') params.brand = brandFilter;
    if (segmentFilter !== 'all') params.segment = segmentFilter;
    if (familyFilter !== 'all') params.family = familyFilter.split('::')[0];
    if (brandHitFilter !== 'all') params.hit = brandHitFilter;
    if (brandStatusFilter !== 'all') params.status = brandStatusFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    downloadMutation.mutate(params);
  }, [brandFilter, segmentFilter, familyFilter, brandHitFilter, brandStatusFilter, searchQuery, downloadMutation]);

  // Build segment filter options - use cascaded segments if available
  const segmentOptions = (cascadedSegments ?? brandFilters?.segments ?? [])
    .map(s => ({ value: s, label: s }));

  // Build family filter options - use cascaded families if available
  // Use unique keys (family::segment) so Radix doesn't merge duplicates in the trigger
  const familySource = cascadedFamilies ?? brandFilters?.families ?? [];
  const familyOptions = familySource
    .filter(f => segmentFilter === 'all' || f.segment === segmentFilter)
    .map(f => ({ value: `${f.family}::${f.segment}`, label: f.family }));

  if (brandLoading && activeTab === 'brand' && !brandPlans.length) {
    return (
      <div className="space-y-6">
        <PageHeader title="Buy Plans" />
        <ShimmerTable rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Buy Plans" />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'category' | 'brand')}>
        <TabsList variant="underline">
          {showCategoryView && <TabsTrigger value="category">Category View</TabsTrigger>}
          {showBrandView && <TabsTrigger value="brand">Brand View</TabsTrigger>}
        </TabsList>

        <TabsContent value="category" className="space-y-4">
          {/* Buying Module Pipeline - month-level pipeline view with stage tracking */}
          <BuyingModulePipelineView navigate={navigate} />
        </TabsContent>

        <TabsContent value="brand" className="space-y-4">
          {/* Brand View Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            {/* eslint-disable-next-line design-system/prefer-section-header -- filter bar + action, not a section header */}
            <div className="flex items-center justify-between gap-4">
              <FilterBar>
                <FilterSelect
                  value={brandFilter}
                  onChange={handleBrandChange}
                  placeholder="All Brands"
                  options={[
                    { value: 'all', label: 'All Brands' },
                    ...(brandFilters?.brands ?? []).map(b => ({ value: b, label: b }))
                  ]}
                  searchable
                />
                <FilterSelect
                  value={segmentFilter}
                  onChange={handleSegmentChange}
                  placeholder={isDemoOrg ? 'All Categories' : 'All Segments'}
                  options={[
                    { value: 'all', label: isDemoOrg ? 'All Categories' : 'All Segments' },
                    ...segmentOptions
                  ]}
                  disabled={brandFilter === 'all' || isFetchingSegments}
                  searchable
                />
                <FilterSelect
                  value={familyFilter}
                  onChange={setFamilyFilter}
                  placeholder={isDemoOrg ? 'All Subcategories' : 'All Families'}
                  options={[
                    { value: 'all', label: isDemoOrg ? 'All Subcategories' : 'All Families' },
                    ...familyOptions
                  ]}
                  disabled={segmentFilter === 'all' || isFetchingFamilies}
                  searchable
                />
                <FilterSelect
                  value={brandHitFilter}
                  onChange={setBrandHitFilter}
                  placeholder={isDemoOrg ? 'All Months' : 'All Hit Months'}
                  options={[
                    { value: 'all', label: isDemoOrg ? 'All Months' : 'All Hit Months' },
                    ...(brandFilters?.hits ?? []).map(h => ({ value: h, label: h }))
                  ]}
                  searchable
                />
                {!isDemoOrg && (
                  <FilterSelect
                    value={brandStatusFilter}
                    onChange={setBrandStatusFilter}
                    placeholder="All Statuses"
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      ...(brandFilters?.statuses ?? []).map(s => ({ value: s, label: s }))
                    ]}
                    searchable
                  />
                )}
                {(brandFilter !== 'all' || segmentFilter !== 'all' || familyFilter !== 'all' || brandHitFilter !== 'all' || brandStatusFilter !== 'all') && (
                  <FilterClear onClear={() => { setBrandFilter('all'); setSegmentFilter('all'); setFamilyFilter('all'); setBrandHitFilter('all'); setBrandStatusFilter('all'); setBrandPage(1); }} />
                )}
              </FilterBar>
              <div className="flex items-center gap-2 shrink-0">
                <Input
                  type="text"
                  placeholder="Search buy plans..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  leftIcon={<Search className="w-4 h-4" />}
                  rightIcon={searchInput ? (
                    <button
                      type="button"
                      onClick={handleSearchClear}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : undefined}
                  containerClassName="w-48 md:w-56"
                  className="h-9 !py-0"
                  aria-label="Search buy plans"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={downloading || brandLoading}
                  className="shrink-0"
                >
                  <Download className="w-4 h-4" />
                  {downloading ? 'Downloading...' : 'Download'}
                </Button>
              </div>
            </div>
          </div>

          {/* Brand Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium">
                    <th className="text-left px-4 py-2.5">BUY PLAN ID</th>
                    <th className="text-left px-4 py-2.5">BRAND</th>
                    <th className="text-left px-4 py-2.5">{isDemoOrg ? 'CATEGORY' : 'SEGMENT'}</th>
                    <th className="text-left px-4 py-2.5">{isDemoOrg ? 'SUBCATEGORY' : 'FAMILY'}</th>
                    {!isDemoOrg && <th className="text-left px-4 py-2.5">FASHION GRADE</th>}
                    <th className="text-left px-4 py-2.5">{isDemoOrg ? 'MONTH' : 'HIT'}</th>
                    <th className="text-right px-4 py-2.5">EXP. REVENUE</th>
                    <th className="text-center px-4 py-2.5">OPTIONS</th>
                    {!isDemoOrg && <th className="text-center px-4 py-2.5">STATUS</th>}
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {brandLoading || (brandFetching && !brandPlans.length) ? (
                    <tr>
                      <td colSpan={isDemoOrg ? 8 : 10} className="px-4 py-8">
                        <p className="text-sm text-gray-400 text-center">Loading...</p>
                      </td>
                    </tr>
                  ) : brandPlans.length === 0 ? (
                    <tr>
                      <td colSpan={isDemoOrg ? 8 : 10} className="px-4 py-8">
                        <EmptyState description="No brands match your current filters" />
                      </td>
                    </tr>
                  ) : (
                    brandPlans.map((plan) => (
                    <tr
                      key={plan.run_id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleBrandPlanClick(plan.run_id)}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-primary">{plan.buy_plan_display_id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{plan.brand}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{plan.segment}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{plan.family}</span>
                      </td>
                      {!isDemoOrg && (
                        <td className="px-4 py-3">
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            plan.fashion_grade === 'APL-Core' ? 'bg-blue-100 text-blue-700' :
                            plan.fashion_grade === 'APL-Fashion' ? 'bg-purple-100 text-purple-700' :
                            plan.fashion_grade === 'APL-Fashion Basics' ? 'bg-green-100 text-green-700' :
                            plan.fashion_grade === 'APL-Ultimate' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          )}>
                            {plan.fashion_grade_desc || plan.fashion_grade}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{plan.hit}</span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-sm font-medium text-primary">
                          {formatCurrency(plan.expected_revenue)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium">{plan.options}</span>
                      </td>
                      {!isDemoOrg && (
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={
                              plan.status.toLowerCase() === 'approved' ? 'success' :
                              plan.status.toLowerCase().includes('sent') ? 'info' :
                              plan.status.toLowerCase().includes('partial') ? 'default' :
                              plan.status.toLowerCase() === 'rejected' ? 'destructive' :
                              plan.status.toLowerCase().includes('pending') ? 'warning' :
                              plan.status.toLowerCase() === 'draft' ? 'secondary' :
                              'default'
                            }
                            size="sm"
                            className="whitespace-nowrap"
                          >
                            {plan.status}
                          </Badge>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Version History"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHistoryPlan(plan);
                            }}
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={brandPagination.page}
              totalPages={brandPagination.total_pages}
              onPageChange={handleBrandPageChange}
              totalItems={brandPagination.total_records}
              pageSize={brandPagination.page_size}
              onPageSizeChange={handleBrandPageSizeChange}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Brand Version History Side Panel */}
      <Sheet
        isOpen={historyPlan !== null}
        onClose={() => setHistoryPlan(null)}
        title="Version History"
        description={historyPlan ? `${historyPlan.brand} - ${historyPlan.family} - ${historyPlan.fashion_grade}` : undefined}
        width="md"
      >
        {historyPlan && <VersionHistoryPanel plan={historyPlan} />}
      </Sheet>

      {/* Category Version History Side Panel */}
      <Sheet
        isOpen={catHistoryItem !== null}
        onClose={() => setCatHistoryItem(null)}
        title="Version History"
        description={catHistoryItem ? `${catHistoryItem.segment} - ${catHistoryItem.family} - ${catHistoryItem.fashion_grade}` : undefined}
        width="md"
      >
        {catHistoryItem && <VersionHistoryPanel plan={catHistoryItem} />}
      </Sheet>
    </div>
  );
}

// ── Version History Panel ────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  quantity_update: 'Quantity Updated',
  toggle: 'Option Toggled',
  mrp_update: 'MRP Updated',
};

const FIELD_LABELS: Record<string, string> = {
  quantity: 'Quantity',
  is_active: 'Active Status',
  mrp: 'MRP',
};

function formatFieldValue(field: string, value: string | null): string {
  if (value === null) return '-';
  if (field === 'is_active') return value === 'True' ? 'Active' : 'Inactive';
  if (field === 'quantity') return Number(value).toLocaleString();
  if (field === 'mrp') return `${getCurrencySymbol()}${Number(value).toLocaleString()}`;
  return value;
}

/* eslint-disable design-system/prefer-section-header */
function VersionHistoryPanel({ plan }: { plan: BrandViewItem }) {
  const [entries, setEntries] = useState<BuyPlanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect -- async fetch
    setError(null);

    fetchBuyPlanHistory(plan.run_id)
      .then(res => {
        if (cancelled) return;
        // Merge toggle + quantity history, sort by changed_at descending
        const merged = [...res.toggle_history, ...res.quantity_history];
        merged.sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
        setEntries(merged);
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load history');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [plan.run_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-400">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="px-5 py-8">
        <EmptyState description="No changes recorded for this buy plan" />
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <p className="text-xs text-gray-500 mb-4">{entries.length} change{entries.length !== 1 ? 's' : ''} recorded</p>
      <div className="relative">
        <div className="absolute left-3 top-3 bottom-3 w-px bg-gray-200" />
        <div className="space-y-4">
          {entries.map((entry, idx) => {
            const date = new Date(entry.changed_at);
            const formattedDate = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const formattedTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={entry.id} className="relative pl-8">
                <div className={cn(
                  'absolute left-1.5 top-2.5 w-3 h-3 rounded-full border-2',
                  idx === 0 ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300',
                )} />

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge variant={entry.action === 'toggle' ? 'warning' : 'default'} size="sm">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formattedDate}, {formattedTime}</span>
                    </div>
                  </div>

                  {entry.style && (
                    <p className="text-sm font-medium text-gray-900 mb-0.5">{entry.style}</p>
                  )}

                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <User className="w-3 h-3" />
                    <span>{entry.changed_by}</span>
                  </div>

                  <div className="flex items-center text-xs gap-1.5">
                    <span className="text-gray-500">{FIELD_LABELS[entry.field_name] ?? entry.field_name}:</span>
                    <span className="text-red-500 line-through">{formatFieldValue(entry.field_name, entry.old_value)}</span>
                    <span className="text-gray-400">&rarr;</span>
                    <span className="text-green-600 font-medium">{formatFieldValue(entry.field_name, entry.new_value)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
