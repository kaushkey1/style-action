/* eslint-disable design-system/prefer-section-header -- distribution plan brand view uses custom layouts */
import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Download } from 'lucide-react';
import {
  PageHeader,
  FilterSelect,
  FilterBar,
  FilterClear,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Badge,
  ShimmerTable,
  EmptyState,
  Pagination,
} from '@/components/ui';
import {cn, getCurrencySymbol, getActiveTenantId} from '@/lib/utils';
import { useFeatureFlag } from '@/hooks/useScreenConfig';
import {
  useDpFilters,
  useDpPlans,
  useDownloadDpPlans,
} from '../api/dpHooks';
import type { DpPlanItem } from '../api/dpApi';
import { mockCategoryDpPlans } from '../data/mockDpCategoryView';

// ── Status badge helper ──────────────────────────────────────────────

const DP_STATUS_BADGE: Record<string, { variant: 'default' | 'info' | 'success' | 'warning' | 'destructive' | 'secondary'; label: string }> = {
  draft: { variant: 'secondary', label: 'Draft' },
  engine_running: { variant: 'info', label: 'Engine Running' },
  engine_failed: { variant: 'destructive', label: 'Engine Failed' },
  dp_generated: { variant: 'info', label: 'DP Generated' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'destructive', label: 'Rejected' },
  submitted_to_procuro: { variant: 'success', label: 'DP Submitted' },
  procuro_acknowledged: { variant: 'success', label: 'DP Acknowledged' },
  po_created: { variant: 'success', label: 'PO Created' },
  executed: { variant: 'success', label: 'Executed' },
};

function formatStatusLabel(status: string): string {
  const parts = status.split('_');
  if (parts.length <= 1) return status;
  return parts.map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(' ');
}

function getDpStatusBadge(status: string): { variant: 'default' | 'info' | 'success' | 'warning' | 'destructive' | 'secondary'; label: string } {
  return DP_STATUS_BADGE[status] ?? { variant: 'default', label: formatStatusLabel(status) };
}

// ── Fashion grade badge helper ───────────────────────────────────────

function getFashionGradeClasses(grade: string): string {
  switch (grade) {
    case 'Core': return 'bg-blue-100 text-blue-700';
    case 'Fashion': return 'bg-purple-100 text-purple-700';
    case 'Fashion Basics': return 'bg-green-100 text-green-700';
    case 'Ultimate': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

// ── Category View (mock data, brand-view-style table) ───────────────

function DistributionPlanCategoryContent() {
  const navigate = useNavigate();

  const [catBrandFilter, setCatBrandFilter] = useState<string>('all');
  const [catBrickFilter, setCatBrickFilter] = useState<string>('all');
  const [catCategoryFilter, setCatCategoryFilter] = useState<string>('all');
  const [catSubcategoryFilter, setCatSubcategoryFilter] = useState<string>('all');
  const [catFashionGradeFilter, setCatFashionGradeFilter] = useState<string>('all');
  const [catHitFilter, setCatHitFilter] = useState<string>('all');
  const [catSeasonFilter, setCatSeasonFilter] = useState<string>('all');
  const [catStatusFilter, setCatStatusFilter] = useState<string>('all');
  const [catPage, setCatPage] = useState(1);
  const [catPageSize, setCatPageSize] = useState(20);

  const filteredPlans = useMemo(() => {
    return mockCategoryDpPlans.filter(p => {
      if (catBrandFilter !== 'all' && p.brand !== catBrandFilter) return false;
      if (catBrickFilter !== 'all' && p.brick !== catBrickFilter) return false;
      if (catCategoryFilter !== 'all' && p.category !== catCategoryFilter) return false;
      if (catSubcategoryFilter !== 'all' && p.subcategory !== catSubcategoryFilter) return false;
      if (catFashionGradeFilter !== 'all' && p.fashion_grade_desc !== catFashionGradeFilter) return false;
      if (catHitFilter !== 'all' && p.hit !== catHitFilter) return false;
      if (catSeasonFilter !== 'all' && p.season !== catSeasonFilter) return false;
      if (catStatusFilter !== 'all' && p.status !== catStatusFilter) return false;
      return true;
    });
  }, [catBrandFilter, catBrickFilter, catCategoryFilter, catSubcategoryFilter, catFashionGradeFilter, catHitFilter, catSeasonFilter, catStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / catPageSize));
  const pagedPlans = filteredPlans.slice((catPage - 1) * catPageSize, catPage * catPageSize);

  const filterOptions = useMemo(() => {
    const unique = <T,>(arr: T[]): T[] => [...new Set(arr)];
    return {
      brands: unique(mockCategoryDpPlans.map(p => p.brand)),
      bricks: unique(mockCategoryDpPlans.map(p => p.brick)),
      categories: unique(mockCategoryDpPlans.map(p => p.category)),
      subcategories: unique(mockCategoryDpPlans.map(p => p.subcategory)),
      fashionGrades: unique(mockCategoryDpPlans.map(p => p.fashion_grade_desc)),
      hits: unique(mockCategoryDpPlans.map(p => p.hit)),
      seasons: unique(mockCategoryDpPlans.map(p => p.season)),
      statuses: unique(mockCategoryDpPlans.map(p => p.status)),
    };
  }, []);

  const handleCategoryChange = useCallback((v: string) => {
    setCatCategoryFilter(v);
    setCatSubcategoryFilter('all');
    setCatPage(1);
  }, []);

  const catHasActiveFilters = catBrandFilter !== 'all' || catBrickFilter !== 'all' ||
    catCategoryFilter !== 'all' || catSubcategoryFilter !== 'all' ||
    catFashionGradeFilter !== 'all' || catHitFilter !== 'all' ||
    catSeasonFilter !== 'all' || catStatusFilter !== 'all';

  const clearCatFilters = useCallback(() => {
    setCatBrandFilter('all');
    setCatBrickFilter('all');
    setCatCategoryFilter('all');
    setCatSubcategoryFilter('all');
    setCatFashionGradeFilter('all');
    setCatHitFilter('all');
    setCatSeasonFilter('all');
    setCatStatusFilter('all');
    setCatPage(1);
  }, []);

  const handleCatPlanClick = (dpPlanId: string) => {
    navigate(`/distribution-plans/category-detail/${dpPlanId}`);
  };

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <FilterBar className="mb-0">
            <FilterSelect
              value={catBrandFilter}
              onChange={(v) => { setCatBrandFilter(v); setCatPage(1); }}
              placeholder="All Brands"
              options={[
                { value: 'all', label: 'All Brands' },
                ...filterOptions.brands.map(b => ({ value: b, label: b })),
              ]}
              searchable
            />
            <FilterSelect
              value={catBrickFilter}
              onChange={(v) => { setCatBrickFilter(v); setCatPage(1); }}
              placeholder="All Bricks"
              options={[
                { value: 'all', label: 'All Bricks' },
                ...filterOptions.bricks.map(b => ({ value: b, label: b })),
              ]}
              searchable
            />
            <FilterSelect
              value={catCategoryFilter}
              onChange={handleCategoryChange}
              placeholder="All Categories"
              options={[
                { value: 'all', label: 'All Categories' },
                ...filterOptions.categories.map(c => ({ value: c, label: c })),
              ]}
              searchable
            />
            <FilterSelect
              value={catSubcategoryFilter}
              onChange={(v) => { setCatSubcategoryFilter(v); setCatPage(1); }}
              placeholder="All Subcategories"
              options={[
                { value: 'all', label: 'All Subcategories' },
                ...filterOptions.subcategories.map(s => ({ value: s, label: s })),
              ]}
              searchable
            />
            <FilterSelect
              value={catFashionGradeFilter}
              onChange={(v) => { setCatFashionGradeFilter(v); setCatPage(1); }}
              placeholder="All Fashion Grades"
              options={[
                { value: 'all', label: 'All Fashion Grades' },
                ...filterOptions.fashionGrades.map(g => ({ value: g, label: g })),
              ]}
              searchable
            />
            <FilterSelect
              value={catHitFilter}
              onChange={(v) => { setCatHitFilter(v); setCatPage(1); }}
              placeholder="All Hits"
              options={[
                { value: 'all', label: 'All Hits' },
                ...filterOptions.hits.map(h => ({ value: h, label: h })),
              ]}
              searchable
            />
            <FilterSelect
              value={catSeasonFilter}
              onChange={(v) => { setCatSeasonFilter(v); setCatPage(1); }}
              placeholder="All Seasons"
              options={[
                { value: 'all', label: 'All Seasons' },
                ...filterOptions.seasons.map(s => ({ value: s, label: s })),
              ]}
              searchable
            />
            <FilterSelect
              value={catStatusFilter}
              onChange={(v) => { setCatStatusFilter(v); setCatPage(1); }}
              placeholder="All Statuses"
              options={[
                { value: 'all', label: 'All Statuses' },
                ...filterOptions.statuses.map(s => ({ value: s, label: formatStatusLabel(s) })),
              ]}
              searchable
            />
            {catHasActiveFilters && <FilterClear onClear={clearCatFilters} />}
          </FilterBar>
          <Button variant="outline" size="sm" className="shrink-0">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-auto max-h-[calc(100vh-360px)]">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium whitespace-nowrap">
                <th className="text-left px-4 py-2.5">CATEGORY</th>
                <th className="text-left px-4 py-2.5">SUBCATEGORY</th>
                <th className="text-left px-4 py-2.5">FASHION GRADE</th>
                <th className="text-center px-4 py-2.5">YEAR</th>
                <th className="text-center px-4 py-2.5">HIT</th>
                <th className="text-center px-4 py-2.5">SEASON</th>
                <th className="text-center px-4 py-2.5">DROP</th>
                <th className="text-right px-4 py-2.5">QTY</th>
                <th className="text-right px-4 py-2.5">VALUE</th>
                <th className="text-center px-4 py-2.5">STORES</th>
                <th className="text-center px-4 py-2.5">STATUS</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {pagedPlans.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8">
                    <EmptyState description="No distribution plans match your current filters" />
                  </td>
                </tr>
              ) : (
                pagedPlans.map((plan) => {
                  const statusBadge = getDpStatusBadge(plan.status);
                  return (
                    <tr
                      key={`${plan.dp_plan_id}-${plan.drop_number ?? 0}`}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleCatPlanClick(plan.dp_plan_id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{plan.category}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{plan.subcategory}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getFashionGradeClasses(plan.fashion_grade_desc))}>
                          {plan.fashion_grade_desc}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-sm font-medium">{plan.year}</span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-sm text-gray-600">{plan.hit}</span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-sm text-gray-600">{plan.season}</span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {plan.drop_number != null ? (
                          <Badge variant="secondary" size="sm" className="whitespace-nowrap">
                            Drop {plan.drop_number}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-sm font-medium">{formatQty(plan.qty)}</span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-sm font-medium">{formatValue(plan.total_value)}</span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-sm text-gray-600">{plan.total_stores}</span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Badge variant={statusBadge.variant} size="sm" className="whitespace-nowrap">
                          {statusBadge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={catPage}
          totalPages={totalPages}
          onPageChange={setCatPage}
          totalItems={filteredPlans.length}
          pageSize={catPageSize}
          onPageSizeChange={(ps) => { setCatPageSize(ps); setCatPage(1); }}
        />
      </div>
    </>
  );
}

// ── Format helpers ───────────────────────────────────────────────────

function formatQty(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)} K`;
  return value.toLocaleString();
}

function formatValue(value: number): string {
  if (value >= 10000000) return `${getCurrencySymbol()}${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `${getCurrencySymbol()}${(value / 100000).toFixed(1)} L`;
  if (value >= 1000) return `${getCurrencySymbol()}${(value / 1000).toFixed(0)} K`;
  return `${getCurrencySymbol()}${value.toLocaleString()}`;
}

// ── Main Component ───────────────────────────────────────────────────

export default function DistributionPlanBrandView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading] = useState(false);

  const showCategoryView = useFeatureFlag('dp', 'show_category_view');
  const showBrandView = useFeatureFlag('dp', 'show_brand_view');
  const isDemoOrg = getActiveTenantId() === 'demo_org';
  const defaultTab = showCategoryView ? 'category' : 'brand';

  // Tab state from URL
  const tabParam = searchParams.get('tab');
  const activeTab: 'category' | 'brand' =
    tabParam === 'brand' && showBrandView ? 'brand' :
    tabParam === 'category' && showCategoryView ? 'category' :
    defaultTab;

  const setActiveTab = (tab: string) => {
    setSearchParams(
      tab === 'category' ? {} : { tab },
      { replace: true },
    );
  };

  // Brand View Filters
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [familyFilter, setFamilyFilter] = useState<string>('all');
  const [fashionGradeFilter, setFashionGradeFilter] = useState<string>('all');
  const [hitFilter, setHitFilter] = useState<string>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [brandPage, setBrandPage] = useState(1);
  const [brandPageSize, setBrandPageSize] = useState(20);


  // ── React Query: base filters ─────────────────────────────────────
  const { data: dpFilters } = useDpFilters();

  // ── React Query: cascading filters ────────────────────────────────
  const { data: cascadedSegmentsData, isFetching: isFetchingSegments } = useDpFilters(
    brandFilter !== 'all' ? { brand: brandFilter } : undefined,
  );
  const cascadedSegments = brandFilter !== 'all' ? (cascadedSegmentsData?.segments ?? null) : null;

  const { data: cascadedFamiliesData, isFetching: isFetchingFamilies } = useDpFilters(
    brandFilter !== 'all' && segmentFilter !== 'all'
      ? { brand: brandFilter, segment: segmentFilter }
      : undefined,
  );
  const cascadedFamilies = brandFilter !== 'all' && segmentFilter !== 'all'
    ? (cascadedFamiliesData?.families ?? null)
    : null;

  const { data: cascadedGradesData, isFetching: isFetchingGrades } = useDpFilters(
    brandFilter !== 'all' && segmentFilter !== 'all' && familyFilter !== 'all'
      ? { brand: brandFilter, segment: segmentFilter, family: familyFilter }
      : undefined,
  );
  const cascadedFashionGrades = brandFilter !== 'all' && segmentFilter !== 'all' && familyFilter !== 'all'
    ? (cascadedGradesData?.fashion_grades ?? null)
    : null;

  // ── React Query: plans listing ────────────────────────────────────
  const plansParams = useMemo(() => {
    const p: Record<string, string | number | undefined> = { page: brandPage, page_size: brandPageSize };
    if (brandFilter !== 'all') p.brand = brandFilter;
    if (segmentFilter !== 'all') p.segment = segmentFilter;
    if (familyFilter !== 'all') p.family = familyFilter;
    if (fashionGradeFilter !== 'all') p.fashion_grade = fashionGradeFilter;
    if (hitFilter !== 'all') p.hit = hitFilter;
    if (seasonFilter !== 'all') p.season = seasonFilter;
    if (statusFilter !== 'all') p.status = statusFilter;
    return p;
  }, [brandFilter, segmentFilter, familyFilter, fashionGradeFilter, hitFilter, seasonFilter, statusFilter, brandPage, brandPageSize]);

  const { data: plansData, isLoading: brandLoading, isFetching: brandFetching } = useDpPlans(plansParams);
  const brandPlans: DpPlanItem[] = plansData?.plans ?? [];
  const brandPagination = plansData?.pagination ?? { page: 1, page_size: 20, total_records: 0, total_pages: 1 };

  // ── React Query: download mutation ────────────────────────────────
  const downloadMutation = useDownloadDpPlans();
  const downloading = downloadMutation.isPending;

  // ── Cascading filter handlers ─────────────────────────────────────
  const handleBrandChange = useCallback((v: string) => {
    setBrandFilter(v);
    setSegmentFilter('all');
    setFamilyFilter('all');
    setFashionGradeFilter('all');
    setBrandPage(1);
  }, []);

  const handleSegmentChange = useCallback((v: string) => {
    setSegmentFilter(v);
    setFamilyFilter('all');
    setFashionGradeFilter('all');
    setBrandPage(1);
  }, []);

  const handleFamilyChange = useCallback((v: string) => {
    setFamilyFilter(v);
    setFashionGradeFilter('all');
    setBrandPage(1);
  }, []);

  const handlePageChange = (page: number) => {
    setBrandPage(page);
  };

  const handlePageSizeChange = (pageSize: number) => {
    setBrandPageSize(pageSize);
    setBrandPage(1);
  };

  const handlePlanClick = (dpPlanId: string, buyPlanId: string, dropNumber?: number) => {
    const params = new URLSearchParams({ runId: buyPlanId });
    if (dropNumber != null) params.set('dropNumber', String(dropNumber));
    navigate(`/distribution-plans/${dpPlanId}?${params.toString()}`);
  };

  const handleDownload = useCallback(() => {
    const params: Record<string, string | undefined> = {};
    if (brandFilter !== 'all') params.brand = brandFilter;
    if (segmentFilter !== 'all') params.segment = segmentFilter;
    if (familyFilter !== 'all') params.family = familyFilter;
    if (fashionGradeFilter !== 'all') params.fashion_grade = fashionGradeFilter;
    if (hitFilter !== 'all') params.hit = hitFilter;
    if (seasonFilter !== 'all') params.season = seasonFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    downloadMutation.mutate(params);
  }, [brandFilter, segmentFilter, familyFilter, fashionGradeFilter, hitFilter, seasonFilter, statusFilter, downloadMutation]);

  const clearFilters = useCallback(() => {
    setBrandFilter('all');
    setSegmentFilter('all');
    setFamilyFilter('all');
    setFashionGradeFilter('all');
    setHitFilter('all');
    setSeasonFilter('all');
    setStatusFilter('all');
    setBrandPage(1);
  }, []);

  const hasActiveFilters = brandFilter !== 'all' || segmentFilter !== 'all' ||
    familyFilter !== 'all' || fashionGradeFilter !== 'all' ||
    hitFilter !== 'all' || seasonFilter !== 'all' || statusFilter !== 'all';

  // Build filter options
  const segmentOptions = useMemo(() =>
    (cascadedSegments ?? dpFilters?.segments ?? []).map(s => ({ value: s.code, label: s.name })),
    [cascadedSegments, dpFilters?.segments],
  );

  const familyOptions = useMemo(() =>
    (cascadedFamilies ?? dpFilters?.families ?? []).map(f => ({ value: f.code, label: f.name })),
    [cascadedFamilies, dpFilters?.families],
  );

  const fashionGradeOptions = useMemo(() =>
    (cascadedFashionGrades ?? dpFilters?.fashion_grades ?? []).map(g => ({ value: g.code, label: g.name })),
    [cascadedFashionGrades, dpFilters?.fashion_grades],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Distribution Plans" />
        <ShimmerTable rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Distribution Plans" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="underline">
          {showCategoryView && <TabsTrigger value="category">Category View</TabsTrigger>}
          {showBrandView && <TabsTrigger value="brand">Brand View</TabsTrigger>}
        </TabsList>

        <TabsContent value="category" className="space-y-4">
          <DistributionPlanCategoryContent />
        </TabsContent>

        <TabsContent value="brand" className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between gap-4">
              <FilterBar className="mb-0">
                <FilterSelect
                  value={brandFilter}
                  onChange={handleBrandChange}
                  placeholder="All Brands"
                  options={[
                    { value: 'all', label: 'All Brands' },
                    ...(dpFilters?.brands ?? []).map(b => ({ value: b.code, label: b.name }))
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
                  onChange={handleFamilyChange}
                  placeholder={isDemoOrg ? 'All Subcategories' : 'All Families'}
                  options={[
                    { value: 'all', label: isDemoOrg ? 'All Subcategories' : 'All Families' },
                    ...familyOptions
                  ]}
                  disabled={segmentFilter === 'all' || isFetchingFamilies}
                  searchable
                />
                <FilterSelect
                  value={fashionGradeFilter}
                  onChange={setFashionGradeFilter}
                  placeholder="All Fashion Grades"
                  options={[
                    { value: 'all', label: 'All Fashion Grades' },
                    ...fashionGradeOptions
                  ]}
                  disabled={familyFilter === 'all' || isFetchingGrades}
                  searchable
                />
                <FilterSelect
                  value={hitFilter}
                  onChange={setHitFilter}
                  placeholder={isDemoOrg ? 'All Months' : 'All Hits'}
                  options={[
                    { value: 'all', label: isDemoOrg ? 'All Months' : 'All Hits' },
                    ...(dpFilters?.hits ?? []).map(h => ({ value: h, label: h }))
                  ]}
                  searchable
                />
                {!isDemoOrg && (
                  <FilterSelect
                    value={seasonFilter}
                    onChange={setSeasonFilter}
                    placeholder="All Seasons"
                    options={[
                      { value: 'all', label: 'All Seasons' },
                      ...(dpFilters?.seasons ?? []).map(s => ({ value: s, label: s }))
                    ]}
                    searchable
                  />
                )}
                {!isDemoOrg && (
                  <FilterSelect
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="All Statuses"
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      ...(dpFilters?.statuses ?? []).map(s => ({ value: s, label: formatStatusLabel(s) }))
                    ]}
                    searchable
                  />
                )}
                {hasActiveFilters && <FilterClear onClear={clearFilters} />}
              </FilterBar>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={handleDownload}
                disabled={downloading || brandLoading}
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Downloading...' : 'Download'}
              </Button>
            </div>
          </div>

          {/* Plans Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-auto max-h-[calc(100vh-360px)]">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium whitespace-nowrap">
                    <th className="text-left px-4 py-2.5">DP PLAN ID</th>
                    <th className="text-left px-4 py-2.5">BRAND</th>
                    <th className="text-left px-4 py-2.5">{isDemoOrg ? 'CATEGORY' : 'SEGMENT'}</th>
                    <th className="text-left px-4 py-2.5">{isDemoOrg ? 'SUBCATEGORY' : 'FAMILY'}</th>
                    {!isDemoOrg && <th className="text-left px-4 py-2.5">FASHION GRADE</th>}
                    <th className="text-center px-4 py-2.5">YEAR</th>
                    <th className="text-center px-4 py-2.5">{isDemoOrg ? 'MONTH' : 'HIT'}</th>
                    {!isDemoOrg && <th className="text-center px-4 py-2.5">SEASON</th>}
                    {!isDemoOrg && <th className="text-center px-4 py-2.5">DROP</th>}
                    <th className="text-right px-4 py-2.5">QTY</th>
                    <th className="text-right px-4 py-2.5">VALUE</th>
                    {!isDemoOrg && <th className="text-center px-4 py-2.5">STORES</th>}
                    {!isDemoOrg && <th className="text-center px-4 py-2.5">STATUS</th>}
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {brandLoading || (brandFetching && !brandPlans.length) ? (
                    <tr>
                      <td colSpan={isDemoOrg ? 9 : 14} className="px-4 py-8">
                        <p className="text-sm text-gray-400 text-center">Loading...</p>
                      </td>
                    </tr>
                  ) : brandPlans.length === 0 ? (
                    <tr>
                      <td colSpan={isDemoOrg ? 9 : 14} className="px-4 py-8">
                        <EmptyState description="No distribution plans match your current filters" />
                      </td>
                    </tr>
                  ) : (
                    brandPlans.map((plan) => {
                      const statusBadge = getDpStatusBadge(plan.status);
                      return (
                        <tr
                          key={`${plan.dp_plan_id}-${plan.drop_number ?? 0}`}
                          className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handlePlanClick(plan.dp_plan_id, plan.buy_plan_id, plan.drop_number)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-primary">{plan.display_dp_name}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{plan.brand_desc}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{plan.segment_desc}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{plan.family_desc}</span>
                          </td>
                          {!isDemoOrg && (
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getFashionGradeClasses(plan.fashion_grade_desc))}>
                                {plan.fashion_grade_desc}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="text-sm font-medium">{plan.year}</span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="text-sm text-gray-600">{plan.hit}</span>
                          </td>
                          {!isDemoOrg && (
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <span className="text-sm text-gray-600">{plan.season}</span>
                            </td>
                          )}
                          {!isDemoOrg && (
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              {plan.drop_number != null ? (
                                <Badge variant="secondary" size="sm" className="whitespace-nowrap">
                                  Drop {plan.drop_number}
                                </Badge>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm font-medium">{formatQty(plan.qty)}</span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm font-medium">{formatValue(plan.total_value)}</span>
                          </td>
                          {!isDemoOrg && (
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <span className="text-sm text-gray-600">{plan.total_stores}</span>
                            </td>
                          )}
                          {!isDemoOrg && (
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <Badge variant={statusBadge.variant} size="sm" className="whitespace-nowrap">
                                {statusBadge.label}
                              </Badge>
                            </td>
                          )}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={brandPagination.page}
              totalPages={brandPagination.total_pages}
              onPageChange={handlePageChange}
              totalItems={brandPagination.total_records}
              pageSize={brandPagination.page_size}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
