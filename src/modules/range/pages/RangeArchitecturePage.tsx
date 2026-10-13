/* eslint-disable design-system/prefer-section-header -- range architecture uses custom layouts */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { ChevronRight, Package, Download, Clock, History, User, Search, X, Activity } from 'lucide-react';
import { ResponsiveContainer, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { CHART_CATEGORICAL, CHART_GRID, CHART_AXIS_TICK } from '@/data/chartColors';
import { useDownload } from '@/hooks/useDownload';
import { useToast } from '@/hooks/useToast';
import { useFeatureFlag } from '@/hooks/useScreenConfig';
import { IMPETUS_APP_BASE } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { cn, debounce, getActiveTenantId } from '@/lib/utils';
import {
  EmptyState,
  ShimmerCard,
  ShimmerTable,
  MetricGrid,
  MetricCard,
  Card,
  Button,
  FilterSelect,
  Pagination,
  Sheet,
  Badge,
  Input,
  Progress,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui';
import { StatusBadge } from '../components/StatusBadge';
import { useRangeStore } from '../stores/useRangeStore';
import { useHits, useHealthSummary, useRangeArchitectureHealthCheck, useNetworkOverview, useNetworkOverviewFilters, useRAActivityLog } from '../api/rangeHooks';
import type { NetworkOverviewRow, PlmSubmissionRecord } from '../api/rangeApi';

// Category name mapping removed — now comes from API

const GRADE_COLOR_DEFAULT = { bg: 'bg-gray-100', text: 'text-gray-700' };

const FASHION_GRADE_COLORS: Record<string, { bg: string; text: string }> = {
  COR: { bg: 'bg-blue-100', text: 'text-blue-700' },
  FSH: { bg: 'bg-purple-100', text: 'text-purple-700' },
  ULT: { bg: 'bg-amber-100', text: 'text-amber-700' },
  FB:  GRADE_COLOR_DEFAULT,
};


const DEFAULT_PAGE_SIZE = 10;

export default function RangeArchitecturePage(): React.ReactNode {
  const navigate = useNavigate();
  const showHealthSummary = useFeatureFlag('range', 'show_health_summary');
  const isDemoOrg = getActiveTenantId() === 'demo_org';
  // OTB Budget is only meaningful for Superdry (VC-backed). Other orgs show Total Value (Σ buy_qty × ASP) instead.
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [historyRow, setHistoryRow] = useState<NetworkOverviewRow | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);
  const selectedHit = useRangeStore((s) => s.selectedHit);
  const selectHit = useRangeStore((s) => s.selectHit);

  const { data: availableHits, isLoading: hitsLoading } = useHits();

  useEffect(() => {
    if (!availableHits?.hits) return;
    const validHits = availableHits.hits.map(h => h.hit);
    if (!selectedHit || !validHits.includes(selectedHit)) {
      selectHit(availableHits.default_hit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset hit when available hits change
  }, [availableHits]);

  const validatedHit = useMemo(() => {
    if (!availableHits?.hits) return '';
    const validHits = availableHits.hits.map(h => h.hit);
    if (selectedHit && validHits.includes(selectedHit)) return selectedHit;
    return availableHits.default_hit ?? '';
  }, [availableHits, selectedHit]);

  const { data: healthSummary } = useHealthSummary(validatedHit);
  const { success: toastSuccess, error: toastError } = useToast();
  const { mutate: checkHealth, isPending: isCheckingHealth } = useRangeArchitectureHealthCheck();

  const handleHealthCheck = useCallback(() => {
    checkHealth(undefined, {
      onSuccess: () => toastSuccess('Range Architecture health API responded successfully.', 'API healthy'),
      onError: (err) =>
        toastError(err instanceof Error ? err.message : 'Request failed.', 'Health check failed'),
    });
  }, [checkHealth, toastSuccess, toastError]);
  const { data: filtersData } = useNetworkOverviewFilters(categoryFilter !== 'all' ? categoryFilter : undefined);
  const { data: overviewData, isLoading: overviewLoading, isFetching: overviewFetching } = useNetworkOverview({
    hit: validatedHit,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    subcategory: subcategoryFilter !== 'all' ? subcategoryFilter : undefined,
    fashion_grade: gradeFilter !== 'all' ? gradeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchQuery || undefined,
    page,
    page_size: pageSize,
  });

  const networkItems = useMemo(() => overviewData?.items ?? [], [overviewData]);
  const totalItems = overviewData?.total ?? 0;
  const totalPages = overviewData?.total_pages ?? 1;

  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => { setSearchQuery(value); setPage(1); }, 400),
    [],
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    debouncedSetSearch(e.target.value);
  }, [debouncedSetSearch]);

  const handleSearchClear = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  }, []);

  const handlePageChange = useCallback((p: number) => setPage(p), []);
  const handlePageSizeChange = useCallback((ps: number) => {
    setPageSize(ps);
    setPage(1);
  }, []);

  const isLoading = hitsLoading || overviewLoading;

  // Portfolio totals computed from current page items
  const portfolioTotals = useMemo(() => {
    const totalOptions = networkItems.reduce((s, r) => s + r.options, 0);
    const totalStores = networkItems.reduce((s, r) => s + r.stores, 0);
    const cappedCount = networkItems.filter(r => r.capped).length;
    return { totalOptions, totalStores, cappedCount };
  }, [networkItems]);

  // Category mix breakdown for the visualization
  const categoryMix = useMemo(() => {
    const groups: Record<string, { label: string; options: number }> = {};
    for (const item of networkItems) {
      const key = item.category;
      const label = item.category_label ?? item.category;
      if (!groups[key]) groups[key] = { label, options: 0 };
      groups[key].options += item.options;
    }
    const entries = Object.values(groups).sort((a, b) => b.options - a.options);
    const totalOpts = entries.reduce((s, e) => s + e.options, 0);
    return entries.map(e => ({
      ...e,
      pct: totalOpts > 0 ? Math.round((e.options / totalOpts) * 100) : 0,
    }));
  }, [networkItems]);

  const { data: activityLogData } = useRAActivityLog(historyRow?.run_id);
  const historyEntries = useMemo(() => {
    if (!activityLogData?.items || !historyRow) return [];
    return activityLogData.items.filter(
      e => e.category === historyRow.category && e.subcategory === historyRow.subcategory && e.fashion_grade === historyRow.fashion_grade,
    );
  }, [activityLogData, historyRow]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="h-[52px] px-6 flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Range Architecture</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleHealthCheck}
            disabled={isCheckingHealth}
            className="shrink-0 min-h-[44px] md:min-h-0"
          >
            <Activity className="w-4 h-4 mr-1.5" />
            {isCheckingHealth ? 'Checking…' : 'Health Check'}
          </Button>
        </div>
        <div className="h-[40px] px-6 flex items-center">
          <div className="flex gap-6">
            <button className="text-sm font-medium text-primary-700 border-b-2 border-indigo-700 pb-2">
              Range Overview
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {isLoading && (
          <>
            {showHealthSummary && (
              <MetricGrid columns={3}>
                <ShimmerCard />
                <ShimmerCard />
                <ShimmerCard />
              </MetricGrid>
            )}
            <ShimmerTable rows={4} />
          </>
        )}

        {!isLoading && networkItems.length === 0 && !searchQuery && (
          <EmptyState
            icon={Package}
            title="No range data available"
            description="Unable to load range architecture data. Please try again later."
          />
        )}

        {/* ── Portfolio Dashboard ── */}
        {showHealthSummary && !isLoading && (healthSummary || overviewData) && (() => {
          const bs = overviewData?.budgetSummary;
          const budgetPct = bs && bs.totalBudget > 0 ? Math.round((bs.totalCapped / bs.totalBudget) * 100) : null;
          const cfs = healthSummary?.core_fashion_split;
          const lock = healthSummary?.range_lock_progress;
          return (
            <section aria-label="Range summary" className="space-y-4">
              <MetricGrid columns={3} className="mb-0">
                <MetricCard
                  label="Total Options"
                  value={portfolioTotals.totalOptions.toLocaleString()}
                  subtitle={`Across ${totalItems} categor${totalItems !== 1 ? 'ies' : 'y'}${lock ? ` · ${lock.completed_segments} locked` : ''}`}
                />
                {cfs ? (
                  <MetricCard
                    label="Core / Fashion"
                    value={`${cfs.core_pct}% / ${cfs.fashion_pct}%`}
                    subtitle="Core / Fashion split by options"
                  />
                ) : (
                  <MetricCard
                    label="Stores"
                    value={portfolioTotals.totalStores.toLocaleString()}
                    subtitle="Total store placements"
                  />
                )}
                {budgetPct != null && bs ? (
                  <MetricCard
                    label="Budget Utilization"
                    value={`${budgetPct}%`}
                    subtitle={`₹${(bs.totalCapped / 1e7).toFixed(1)} / ₹${(bs.totalBudget / 1e7).toFixed(1)} Cr`}
                    badge={portfolioTotals.cappedCount > 0
                      ? <Badge variant="warning">{portfolioTotals.cappedCount} capped</Badge>
                      : undefined}
                  >
                    <Progress value={budgetPct} size="sm" className="mt-2" />
                  </MetricCard>
                ) : lock ? (
                  <MetricCard
                    label="Range Lock"
                    value={`${lock.pct}%`}
                    subtitle={`${lock.completed_segments} / ${lock.total_segments} categories locked`}
                  >
                    <Progress value={lock.pct} size="sm" className="mt-2" />
                  </MetricCard>
                ) : (
                  <MetricCard
                    label="Stores"
                    value={portfolioTotals.totalStores.toLocaleString()}
                    subtitle="Total store placements"
                  />
                )}
              </MetricGrid>

              {/* Bottom row: Category mix bar chart (if > 1 category) */}
              {categoryMix.length > 1 && (
                <Card className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    <p className="text-xs text-gray-500 font-medium shrink-0">Category Mix</p>
                    <div className="flex-1 h-[48px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={categoryMix.slice(0, 6)}
                          layout="vertical"
                          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                          barCategoryGap={4}
                        >
                          <XAxis type="number" hide />
                          <YAxis
                            type="category"
                            dataKey="label"
                            width={70}
                            tick={{ fontSize: 10, fill: CHART_AXIS_TICK }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <RechartsTooltip
                            cursor={{ fill: CHART_GRID }}
                            contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb', padding: '4px 8px' }}
                            formatter={(value, _name, props) => {
                              const v = typeof value === 'number' ? value : Number(value);
                              const pct = (props?.payload as { pct?: number })?.pct ?? 0;
                              return [`${v.toLocaleString()} opts (${pct}%)`, ''];
                            }}
                          />
                          <Bar dataKey="options" radius={[0, 3, 3, 0]} barSize={8}>
                            {categoryMix.slice(0, 6).map((_entry, i) => (
                              <Cell key={i} fill={CHART_CATEGORICAL[i % CHART_CATEGORICAL.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </Card>
              )}
            </section>
          );
        })()}

        {!isLoading && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FilterSelect
                    value={categoryFilter}
                    onChange={(v) => { setCategoryFilter(v); setSubcategoryFilter('all'); setPage(1); }}
                    placeholder="All Categories"
                    options={[
                      { value: 'all', label: 'All Categories' },
                      ...(filtersData?.categories ?? []).map(c => ({ value: c.code, label: c.label })),
                    ]}
                    searchable
                  />
                  <FilterSelect
                    value={subcategoryFilter}
                    onChange={(v) => { setSubcategoryFilter(v); setPage(1); }}
                    placeholder="All Subcategories"
                    options={[
                      { value: 'all', label: 'All Subcategories' },
                      ...(filtersData?.subcategories ?? []).map(s => ({ value: s.code, label: s.label })),
                    ]}
                    searchable
                  />
                  {!isDemoOrg && (
                    <FilterSelect
                      value={gradeFilter}
                      onChange={(v) => { setGradeFilter(v); setPage(1); }}
                      placeholder="All Grades"
                      options={[
                        { value: 'all', label: 'All Grades' },
                        ...(filtersData?.grades ?? []).map(g => ({ value: g.code, label: g.label })),
                      ]}
                      searchable
                    />
                  )}
                  {!isDemoOrg && (
                    <FilterSelect
                      value={statusFilter}
                      onChange={(v) => { setStatusFilter(v); setPage(1); }}
                      placeholder="All Statuses"
                      options={[
                        { value: 'all', label: 'All Statuses' },
                        ...(filtersData?.statuses ?? []).map(s => ({ value: s, label: s })),
                      ]}
                    />
                  )}
                  {availableHits && (
                    <FilterSelect
                      value={validatedHit || ''}
                      onChange={selectHit}
                      placeholder="Select Hit"
                      options={availableHits.hits.map(hit => ({
                        value: hit.hit,
                        label: hit.hit,
                      }))}
                      searchable
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Search..."
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
                    containerClassName="w-56"
                    className="h-9 !py-0"
                    aria-label="Search categories"
                  />
                  {validatedHit && (
                    <Button variant="outline" size="sm" onClick={() => download('/range/network-overview', 'range_network_overview.xlsx', { params: { hit: validatedHit, download: 'true' } })} disabled={isDownloading} className="shrink-0">
                      <Download className="w-4 h-4 mr-1.5" />
                      {isDownloading ? 'Downloading...' : 'Download'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {networkItems.length === 0 ? (
              <EmptyState description={searchQuery ? 'No results match your search' : 'No range data available'} />
            ) : (
              <div className={cn("overflow-x-auto transition-opacity", overviewFetching && !overviewLoading && "opacity-50 pointer-events-none")}>
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium">
                      <th className="text-left px-4 py-2.5">CATEGORY</th>
                      <th className="text-left px-4 py-2.5">SUBCATEGORY</th>
                      {!isDemoOrg && <th className="text-left px-4 py-2.5">FASHION GRADE</th>}
                      <th className="text-left px-4 py-2.5">{isDemoOrg ? 'SEASON' : 'HIT'}</th>
                      <th className="text-right px-4 py-2.5">OPTIONS</th>
                      {!isDemoOrg && <th className="text-right px-4 py-2.5">STORES</th>}
                      {!isDemoOrg && <th className="text-center px-4 py-2.5">STATUS</th>}
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {networkItems.map((item) => {
                      const gradeColors = FASHION_GRADE_COLORS[item.fashion_grade] ?? GRADE_COLOR_DEFAULT;
                      // Codes stay as the drill-down keys; names are passed as labels
                      // so the detail page can show readable titles (VC-backed tenants).
                      const q = new URLSearchParams({
                        category: item.category,
                        subcategory: item.subcategory ?? '',
                        fashion_grade: item.fashion_grade,
                        fashion_grade_desc: item.fashion_grade_desc ?? item.fashion_grade,
                        category_label: item.category_label ?? item.category,
                        subcategory_label: item.subcategory_label ?? item.subcategory ?? '',
                        hit: item.hit,
                      });
                      const detailPath = `/range/detail/${item.run_id}?${q.toString()}`;

                      return (
                        <tr
                          key={`${item.category}-${item.subcategory}-${item.fashion_grade}-${item.run_id}`}
                          className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                          tabIndex={0}
                          role="link"
                          aria-label={`View ${item.fashion_grade} details for ${item.category_label ?? item.category} ${item.subcategory_label ?? item.subcategory}`}
                          onClick={() => navigate(detailPath)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(detailPath); } }}
                        >
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-primary">{item.category_label ?? item.category}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{item.subcategory_label ?? item.subcategory ?? '-'}</span>
                          </td>
                          {!isDemoOrg && (
                            <td className="px-4 py-3">
                              <span className={cn(
                                'px-2 py-0.5 rounded text-xs font-medium',
                                gradeColors.bg, gradeColors.text,
                              )}>
                                {item.fashion_grade_desc ?? item.fashion_grade}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{item.hit}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-sm font-medium text-gray-900">{item.options}</span>
                              {item.capped && item.originalOptions != null && item.originalOptions > item.options && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="shrink-0">
                                      <Badge variant="warning" size="sm">Capped</Badge>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>Original: {item.originalOptions} options — capped to {item.options} to fit OTB budget</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                          {!isDemoOrg && (
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm text-gray-900">{item.stores}</span>
                            </td>
                          )}
                          {!isDemoOrg && (
                            <td className="px-4 py-3 text-center">
                              <StatusBadge status={item.status} />
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setHistoryRow(item); }}
                                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                                aria-label="Version history"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      {/* Version History Side Panel */}
      <Sheet
        isOpen={historyRow !== null}
        onClose={() => { setHistoryRow(null); setExpandedEntryId(null); }}
        title="Version History"
        description={historyRow ? `${historyRow.category} - ${historyRow.subcategory} - ${historyRow.fashion_grade_desc ?? historyRow.fashion_grade}` : undefined}
        width="md"
      >
        {historyRow && (
          <div className="px-5 py-4">
            <p className="text-xs text-gray-500 mb-4">
              {historyEntries.length} change{historyEntries.length !== 1 ? 's' : ''} recorded
            </p>
            {historyEntries.length === 0 ? (
              <EmptyState description="No changes recorded for this entry" />
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-3 bottom-3 w-px bg-gray-200" />
                <div className="space-y-4">
                  {historyEntries.map((entry, idx) => {
                    const date = entry.created_at ? new Date(entry.created_at) : null;
                    const formattedDate = date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                    const formattedTime = date ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
                    const records = entry.payload?.records ?? [];
                    const hasRecords = records.length > 0;
                    const isExpanded = expandedEntryId === entry.id;

                    return (
                      <div key={entry.id} className="relative pl-8">
                        <div className={cn(
                          'absolute left-1.5 top-2.5 w-3 h-3 rounded-full border-2',
                          idx === 0 ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300',
                        )} />
                        <div
                          className={cn(
                            'bg-gray-50 rounded-lg p-3 border border-gray-100',
                            hasRecords && 'cursor-pointer hover:border-gray-300',
                          )}
                          {...(hasRecords ? {
                            role: 'button',
                            tabIndex: 0,
                            onClick: () => setExpandedEntryId(isExpanded ? null : entry.id),
                            onKeyDown: (e: React.KeyboardEvent) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setExpandedEntryId(isExpanded ? null : entry.id);
                              }
                            },
                            'aria-expanded': isExpanded,
                          } : {})}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <Badge
                              variant={entry.action === 'submit_to_plm' ? 'info' : entry.action === 'ra_generated' ? 'success' : 'default'}
                              size="sm"
                            >
                              {entry.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{formattedDate}, {formattedTime}</span>
                            </div>
                          </div>
                          {entry.created_by && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                              <User className="w-3 h-3" />
                              <span>{entry.created_by}</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-700">
                            Status: <span className="font-medium">{entry.status}</span>
                          </div>
                          {hasRecords && (
                            <div className="text-xs text-gray-700 font-medium mt-1.5 underline underline-offset-2">
                              {isExpanded ? 'Hide records' : `View ${records.length} record${records.length !== 1 ? 's' : ''} sent to PLM`}
                            </div>
                          )}
                        </div>
                        {isExpanded && hasRecords && (
                          <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
                                  <th className="text-left px-2 py-1.5 font-medium whitespace-nowrap">Brick</th>
                                  <th className="text-left px-2 py-1.5 font-medium whitespace-nowrap">Brand</th>
                                  <th className="text-left px-2 py-1.5 font-medium whitespace-nowrap">Fabric</th>
                                  <th className="text-left px-2 py-1.5 font-medium whitespace-nowrap">Fit</th>
                                  <th className="text-left px-2 py-1.5 font-medium whitespace-nowrap">Pattern</th>
                                  <th className="text-right px-2 py-1.5 font-medium whitespace-nowrap">MRP</th>
                                  <th className="text-right px-2 py-1.5 font-medium whitespace-nowrap">Qty</th>
                                  <th className="text-left px-2 py-1.5 font-medium whitespace-nowrap">Result</th>
                                  <th className="text-left px-2 py-1.5 font-medium whitespace-nowrap">Style Code</th>
                                </tr>
                              </thead>
                              <tbody>
                                {records.map((rec: PlmSubmissionRecord, i: number) => (
                                  <tr key={`${entry.id}-${i}`} className="border-b border-gray-100 last:border-0">
                                    <td className="px-2 py-1.5 text-gray-900 whitespace-nowrap">{rec.brick || '-'}</td>
                                    <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">{rec.brand || '-'}</td>
                                    <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">{rec.fabric || '-'}</td>
                                    <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">{rec.fit || '-'}</td>
                                    <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">{rec.pattern || '-'}</td>
                                    <td className="px-2 py-1.5 text-right text-gray-700 whitespace-nowrap">{rec.mrp ? `₹${rec.mrp}` : '-'}</td>
                                    <td className="px-2 py-1.5 text-right text-gray-700 whitespace-nowrap">{rec.quantity ?? '-'}</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap">
                                      <Badge
                                        variant={rec.result === 'created' ? 'success' : rec.result === 'already_exists' ? 'info' : 'error'}
                                        size="sm"
                                      >
                                        {rec.result === 'created' ? 'Created' : rec.result === 'already_exists' ? 'Exists' : 'Failed'}
                                      </Badge>
                                    </td>
                                    <td className="px-2 py-1.5 text-gray-700 whitespace-nowrap">{rec.style_code || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
