import { useState, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Badge, MetricCard, PageHeader, MetricGrid, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, EmptyState, Progress, Tabs, TabsList, TabsTrigger, TabsContent, FilterSelect, FilterSearch, FilterClear, Button } from '@/components/ui';
import {cn, formatCurrency, getActiveTenantId, getActiveOrgUuid, getFormattingConfig} from '@/lib/utils';
import { useOTBStore } from '../stores/otb.store';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { useDownload } from '@/hooks/useDownload';
import { IMPETUS_APP_BASE } from '@/lib/api';
import { usePodSummary, usePodStores, usePodLineItems, useOtbFilters, usePodFilters } from '../api/otbDashboardApi';
import { useModuleConfig } from '@/hooks/useScreenConfig';
import { parseOtbConfig } from '../data/otbTenantConfig';
import type { ApiDetailStore, ApiLineItem } from '../api/otbDashboardApi';

// ─── Helpers ─────────────────────────────────────────────────────────

interface PaginationInfo {
  page: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
}

function getUtilColor(util: number): string {
  if (util >= 85 && util <= 105) return 'bg-green-500';
  if ((util >= 70 && util < 85) || (util > 105 && util <= 110)) return 'bg-amber-500';
  return 'bg-red-500';
}

function getUtilTextColor(util: number): string {
  if (util >= 85 && util <= 105) return 'text-green-700';
  if ((util >= 70 && util < 85) || (util > 105 && util <= 110)) return 'text-amber-700';
  return 'text-red-700';
}

function getUtilBarColor(util: number): string {
  if (util >= 85 && util <= 105) return 'bg-success';
  if ((util >= 70 && util < 85) || (util > 105 && util <= 110)) return 'bg-warning';
  return 'bg-error';
}

function getPodStatus(util: number): { label: string; variant: 'success' | 'warning' | 'error' | 'default' } {
  if (util > 110) return { label: 'Over', variant: 'error' };
  if (util > 105) return { label: 'Watch', variant: 'warning' };
  if (util >= 85) return { label: 'Normal', variant: 'success' };
  if (util >= 70) return { label: 'Watch', variant: 'warning' };
  return { label: 'Under', variant: 'error' };
}

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-primary/10 text-primary';
    case 'A1': return 'bg-blue-100 text-blue-700';
    case 'A2': return 'bg-gray-100 text-gray-700';
    case 'A3': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function LoadingBlock({ className }: { className?: string }): React.ReactNode {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  );
}

// ─── Pagination Bar ─────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function PaginationBar({ pagination, pageSize, onPageChange, onPageSizeChange }: {
  pagination: PaginationInfo;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}): React.ReactNode {
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const pageInputValue = editingPage ?? String(pagination.page);
  const start = (pagination.page - 1) * pageSize + 1;
  const end = Math.min(pagination.page * pageSize, pagination.total);

  function handlePageInputCommit(): void {
    if (editingPage === null) return;
    const num = parseInt(editingPage, 10);
    if (!isNaN(num) && num >= 1 && num <= pagination.totalPages) {
      onPageChange(num);
    }
    setEditingPage(null);
  }

  return (
    // eslint-disable-next-line design-system/prefer-section-header -- pagination bar
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Rows per page</span>
        {/* eslint-disable-next-line no-restricted-syntax -- pagination page size select */}
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-7 px-1.5 text-xs border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus-kb:ring-1 focus-kb:ring-primary/30"
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500">
          {start}–{end} of {pagination.total.toLocaleString(getFormattingConfig().locale)}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Page</span>
          {/* eslint-disable-next-line no-restricted-syntax -- pagination page input */}
          <input
            type="text"
            value={pageInputValue}
            onChange={(e) => setEditingPage(e.target.value)}
            onBlur={handlePageInputCommit}
            onKeyDown={(e) => { if (e.key === 'Enter') handlePageInputCommit(); }}
            className="w-10 h-7 text-center text-xs border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus-kb:ring-1 focus-kb:ring-primary/30"
          />
          <span className="text-xs text-gray-500">of {pagination.totalPages}</span>
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center justify-center w-7 h-7 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="flex items-center justify-center w-7 h-7 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Store Breakdown Tab ─────────────────────────────────────────────

const GRADE_OPTIONS = ['All', 'A', 'A1', 'A2', 'A3'] as const;
const STATUS_OPTIONS = ['All', 'Warnings Only'] as const;

function StoreBreakdownSection({ segment, family, searchDebounced }: { segment: string; family: string; searchDebounced: string }): React.ReactNode {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const storeParams = useMemo(() => ({
    segment,
    family,
    page,
    page_size: pageSize,
    grade: gradeFilter !== 'All' ? gradeFilter : undefined,
    search: searchDebounced || undefined,
  }), [segment, family, page, pageSize, gradeFilter, searchDebounced]);

  const { data: storeData, isLoading: loading } = usePodStores(storeParams);

  const rows = storeData?.items ?? [];
  const pagination: PaginationInfo | null = storeData
    ? { page: storeData.page, totalPages: storeData.total_pages, total: storeData.total, hasNext: storeData.has_next }
    : null;

  const handlePageSizeChange = useCallback((size: number) => { setPageSize(size); setPage(1); }, []);
  const handleGradeFilter = useCallback((g: string) => { setGradeFilter(g); setPage(1); }, []);
  const handleStatusFilter = useCallback((s: string) => { setStatusFilter(s); setPage(1); }, []);

  const filteredRows = statusFilter === 'Warnings Only'
    ? rows.filter((r) => r.alerts && r.alerts.length > 0)
    : rows;

  const totalBudget = filteredRows.reduce((s, r) => s + r.budget, 0);
  const totalConsumed = filteredRows.reduce((s, r) => s + r.consumed, 0);
  const totalUtil = totalBudget > 0 ? Math.round((totalConsumed / totalBudget) * 100) : 0;

  return (
    <div>
      {/* Filter pills */}
      <div className="px-4 py-2.5 border-b border-gray-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Grade</span>
          <div className="flex gap-1">
            {GRADE_OPTIONS.map((g) => (
              <button
                key={g}
                onClick={() => handleGradeFilter(g)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-full font-medium transition-colors',
                  gradeFilter === g
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Status</span>
          <div className="flex gap-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusFilter(s)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-full font-medium transition-colors',
                  statusFilter === s
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {pagination && (
          <span className="ml-auto text-xs text-gray-500">{pagination.total.toLocaleString(getFormattingConfig().locale)} stores</span>
        )}
      </div>

      {loading ? (
        <LoadingBlock className="h-40" />
      ) : (
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Store</DataTableHead>
            <DataTableHead align="center">Grade</DataTableHead>
            <DataTableHead align="right">OTB Budget</DataTableHead>
            <DataTableHead align="right">Consumed</DataTableHead>
            <DataTableHead align="center">Util%</DataTableHead>
            <DataTableHead align="right">Cover Days</DataTableHead>
            <DataTableHead align="right">Capacity</DataTableHead>
            <DataTableHead align="center">Alerts</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {filteredRows.length === 0 ? (
              <tr><td colSpan={8}><EmptyState description="No stores found" /></td></tr>
            ) : filteredRows.map((store: ApiDetailStore, i: number) => (
              <DataTableRow key={store.site || i}>
                <DataTableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{store.store_name ?? '—'}</span>
                    {store.city && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {store.city}
                      </span>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell align="center">
                  <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', gradeColor(store.grade ?? ''))}>
                    {store.grade ?? '—'}
                  </span>
                </DataTableCell>
                <DataTableCell align="right" className="font-mono">{formatCurrency(store.budget)}</DataTableCell>
                <DataTableCell align="right" className="font-mono">{formatCurrency(store.consumed)}</DataTableCell>
                <DataTableCell>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={cn('w-2 h-2 rounded-full', getUtilColor(store.util_pct))} />
                    <span className={cn('font-medium', getUtilTextColor(store.util_pct))}>{store.util_pct}%</span>
                  </div>
                </DataTableCell>
                <DataTableCell align="right" className="text-gray-700">{store.cover_days != null ? `${store.cover_days}d` : '—'}</DataTableCell>
                <DataTableCell align="right" className="text-gray-700">{store.capacity_pct != null ? `${store.capacity_pct}%` : '—'}</DataTableCell>
                <DataTableCell align="center">
                  {store.alerts && store.alerts.length > 0 ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                  )}
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
          {filteredRows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-medium">
                <td className="p-3 text-gray-900 font-semibold" colSpan={2}>Total</td>
                <td className="p-3 text-right text-gray-900 font-mono">{formatCurrency(totalBudget)}</td>
                <td className="p-3 text-right text-gray-900 font-mono">{formatCurrency(totalConsumed)}</td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={cn('w-2 h-2 rounded-full', getUtilColor(totalUtil))} />
                    <span className={cn('font-semibold', getUtilTextColor(totalUtil))}>{totalUtil}%</span>
                  </div>
                </td>
                <td className="p-3" colSpan={3} />
              </tr>
            </tfoot>
          )}
        </DataTable>
      )}
      {pagination && !loading && (
        <PaginationBar pagination={pagination} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} />
      )}
    </div>
  );
}

function StoreBreakdownTab({ segment, family }: { segment: string; family: string }): React.ReactNode {
  const [storeSearch, setStoreSearch] = useState('');
  const [storeSearchDebounced, setStoreSearchDebounced] = useState('');
  const storeSearchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const handleStoreSearch = useCallback((value: string) => {
    setStoreSearch(value);
    if (storeSearchTimer.current) clearTimeout(storeSearchTimer.current);
    storeSearchTimer.current = setTimeout(() => {
      setStoreSearchDebounced(value);
    }, 400);
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Tabs defaultValue="store-breakdown">
        {/* eslint-disable-next-line design-system/prefer-section-header -- custom table header with tabs and search */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <TabsList variant="underline" className="border-b-0">
            <TabsTrigger value="store-breakdown">Store Breakdown</TabsTrigger>
            <TabsTrigger value="timeline" disabled>Timeline</TabsTrigger>
            <TabsTrigger value="edit-log" disabled>Edit Log</TabsTrigger>
          </TabsList>
          <FilterSearch value={storeSearch} onChange={handleStoreSearch} placeholder="Search store or city..." />
        </div>
        <TabsContent value="store-breakdown" className="mt-0">
          <StoreBreakdownSection segment={segment} family={family} searchDebounced={storeSearchDebounced} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-0">
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-gray-500">Timeline view coming soon</p>
          </div>
        </TabsContent>
        <TabsContent value="edit-log" className="mt-0">
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-gray-500">Edit log coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── OTB Line Items Section ──────────────────────────────────────────

function lineItemDownloadHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Tenant-ID': getActiveTenantId(),
    'X-Org-ID': getActiveOrgUuid(),
  };
}

function OTBLineItemsSection({ segment, family, podId, segmentLabel, familyLabel, otbConfig }: { segment: string; family: string; podId: string; segmentLabel?: string; familyLabel?: string; otbConfig: import('../data/otbTenantConfig').OtbModuleConfig }): React.ReactNode {
  const [searchParams, setSearchParams] = useSearchParams();
  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('brand_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Search state
  const [lineSearch, setLineSearch] = useState('');
  const [lineSearchDebounced, setLineSearchDebounced] = useState('');
  const lineSearchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const handleLineSearch = useCallback((value: string) => {
    setLineSearch(value);
    if (lineSearchTimer.current) clearTimeout(lineSearchTimer.current);
    lineSearchTimer.current = setTimeout(() => {
      setLineSearchDebounced(value);
      setPage(1);
    }, 400);
  }, []);

  // Filters — persisted in URL search params
  const brandFilter = searchParams.get('brand') || 'all';
  const gradeFilter = searchParams.get('grade') || 'all';
  const hitFilter = searchParams.get('hit') || 'all';

  const setFilterParam = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === 'all') { next.delete(key); } else { next.set(key, value); }
      return next;
    });
  }, [setSearchParams]);

  const setBrandFilter = useCallback((v: string) => setFilterParam('brand', v), [setFilterParam]);
  const setGradeFilter = useCallback((v: string) => setFilterParam('grade', v), [setFilterParam]);
  const setHitFilter = useCallback((v: string) => setFilterParam('hit', v), [setFilterParam]);

  const anyFilterActive = brandFilter !== 'all' || gradeFilter !== 'all' || hitFilter !== 'all';
  const clearAllFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('brand'); next.delete('grade'); next.delete('hit');
      return next;
    });
    setPage(1);
  }, [setSearchParams]);

  // Fetch filter options via React Query
  const { data: filterData } = usePodFilters();
  const brandOptions = useMemo(() =>
    filterData?.brands?.map((b) => ({ value: b.code, label: b.display_name })) ?? [],
    [filterData?.brands],
  );
  const gradeOptions = useMemo(() =>
    filterData?.grades?.map((g) => ({ value: g.code, label: g.display_name })) ?? [],
    [filterData?.grades],
  );
  const hitOpts = useMemo(() =>
    filterData?.hits?.map((h) => ({ value: h.code, label: h.display_name })) ?? [],
    [filterData?.hits],
  );

  // Build line items query params
  const lineItemParams = useMemo(() => ({
    segment,
    family,
    page,
    page_size: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder,
    brands: brandFilter !== 'all' ? brandFilter : undefined,
    grades: gradeFilter !== 'all' ? gradeFilter : undefined,
    hits: hitFilter !== 'all' ? hitFilter : undefined,
    search: lineSearchDebounced || undefined,
  }), [segment, family, page, pageSize, sortBy, sortOrder, brandFilter, gradeFilter, hitFilter, lineSearchDebounced]);

  const { data: lineItemData, isLoading: loading } = usePodLineItems(lineItemParams);

  const rows = lineItemData?.items ?? [];
  const summary = lineItemData?.summary ?? null;
  const pagination: PaginationInfo | null = lineItemData
    ? { page: lineItemData.page, totalPages: lineItemData.total_pages, total: lineItemData.total, hasNext: lineItemData.has_next }
    : null;

  const handlePageSizeChange = useCallback((size: number) => { setPageSize(size); setPage(1); }, []);

  const handleFilterChange = useCallback((setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  }, []);

  function handleSort(col: string): void {
    if (sortBy === col) {
      setSortOrder((prev) => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
    setPage(1);
  }

  function renderSortableHead(col: string, label: string, align?: 'left' | 'right' | 'center'): React.ReactNode {
    const active = sortBy === col;
    return (
      <DataTableHead align={align}>
        <button onClick={() => handleSort(col)} className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors">
          {label}
          {active && <span className="text-primary">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
        </button>
      </DataTableHead>
    );
  }

  const segLabel = segmentLabel ?? `${otbConfig.hierarchy.level1.label} ${segment}`;
  const famLabel = familyLabel ?? `${otbConfig.hierarchy.level2.label} ${family}`;
  const showBrandFilter = otbConfig.filters.includes('brand') || otbConfig.filters.includes('segment');

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* eslint-disable-next-line design-system/prefer-section-header -- custom table header with inline search */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">OTB Line Items</h3>
        <div className="flex items-center gap-2">
          <FilterSearch value={lineSearch} onChange={handleLineSearch} placeholder="Search OTB number or brand..." />
          <Button variant="outline" size="sm" onClick={() => download('/otb/budget/segment-family-detail/line-items', 'otb_line_items.xlsx', { params: { segment, family }, headers: lineItemDownloadHeaders() })} disabled={isDownloading} className="shrink-0">
            <Download className="w-4 h-4 mr-1.5" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-4 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterSelect
            value={segment}
            onChange={() => {}}
            options={[{ value: segment, label: segLabel }]}
            disabled
            className="min-w-[10rem]"
          />
          <FilterSelect
            value={family}
            onChange={() => {}}
            options={[{ value: family, label: famLabel }]}
            disabled
            className="min-w-[8rem]"
          />
          {showBrandFilter && (
            <FilterSelect
              value={brandFilter}
              onChange={handleFilterChange(setBrandFilter)}
              placeholder="All Brands"
              options={[
                { value: 'all', label: 'All Brands' },
                ...brandOptions,
              ]}
              className="min-w-[10rem]"
              searchable
            />
          )}
          <FilterSelect
            value={gradeFilter}
            onChange={handleFilterChange(setGradeFilter)}
            placeholder="All Grades"
            options={[
              { value: 'all', label: 'All Grades' },
              ...gradeOptions,
            ]}
            className="min-w-[9rem]"
            searchable
          />
          <FilterSelect
            value={hitFilter}
            onChange={handleFilterChange(setHitFilter)}
            placeholder="All Hits"
            options={[
              { value: 'all', label: 'All Hits' },
              ...hitOpts,
            ]}
            className="min-w-[8rem]"
            searchable
          />
          {anyFilterActive && <FilterClear onClear={clearAllFilters} />}
        </div>
      </div>
      {loading ? (
        <LoadingBlock className="h-40" />
      ) : (
        <DataTable>
          <DataTableHeader>
            {renderSortableHead('plan_name', 'OTB Number')}
            {renderSortableHead('brand_id', 'Brand')}
            {renderSortableHead('grade', 'Grade', 'center')}
            {renderSortableHead('hit', 'Hit', 'center')}
            {renderSortableHead('recommended', 'Recommended', 'right')}
            {renderSortableHead('purchase', 'Purchase', 'right')}
            <DataTableHead align="right">Variance</DataTableHead>
            {renderSortableHead('util_pct', 'Util%', 'center')}
            <DataTableHead align="center">Status</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {rows.length === 0 ? (
              <tr><td colSpan={9}><EmptyState description="No line items found" /></td></tr>
            ) : rows.map((item: ApiLineItem, i: number) => {
              const status = getPodStatus(item.util_pct);
              return (
                <DataTableRow key={`${item.plan_name}-${i}`}>
                  <DataTableCell>
                    <Link
                      to={(() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('otb_id', item.otb_id);
                        return `/otb/pod/${podId}/sheet/${item.plan_name}?${params.toString()}`;
                      })()}
                      className="font-mono text-xs font-medium text-primary hover:text-primary/80 hover:underline"
                    >
                      {item.plan_name}
                    </Link>
                  </DataTableCell>
                  <DataTableCell className="text-gray-700">{item.brand}</DataTableCell>
                  <DataTableCell align="center"><Badge variant="default" size="sm">{item.grade}</Badge></DataTableCell>
                  <DataTableCell align="center"><span className="text-xs font-medium text-gray-700">{item.hit}</span></DataTableCell>
                  <DataTableCell align="right" className="font-mono">{formatCurrency(item.recommended, { decimals: 2 })}</DataTableCell>
                  <DataTableCell align="right" className="font-mono">{formatCurrency(item.purchase, { decimals: 2 })}</DataTableCell>
                  <DataTableCell align="right">
                    {item.variance_pct == null ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <span className={cn('text-xs font-medium', getUtilTextColor(100 + item.variance_pct))}>
                        {item.variance_pct > 0 ? '+' : ''}{item.variance_pct.toFixed(1)}%
                      </span>
                    )}
                  </DataTableCell>
                  <DataTableCell>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={cn('w-2 h-2 rounded-full', getUtilColor(item.util_pct))} />
                      <span className={cn('font-medium', getUtilTextColor(item.util_pct))}>{item.util_pct}%</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell align="center"><Badge variant={status.variant} size="sm">{status.label}</Badge></DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>
          {summary && rows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-medium">
                <td className="p-3 text-gray-900 font-semibold" colSpan={4}>Total</td>
                <td className="p-3 text-right text-gray-900 font-mono">{formatCurrency(summary.total_recommended, { decimals: 2 })}</td>
                <td className="p-3 text-right text-gray-900 font-mono">{formatCurrency(summary.total_purchase, { decimals: 2 })}</td>
                <td className="p-3" />
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={cn('w-2 h-2 rounded-full', getUtilColor(summary.total_util_pct))} />
                    <span className={cn('font-semibold', getUtilTextColor(summary.total_util_pct))}>{summary.total_util_pct}%</span>
                  </div>
                </td>
                <td className="p-3" />
              </tr>
            </tfoot>
          )}
        </DataTable>
      )}
      {pagination && !loading && (
        <PaginationBar pagination={pagination} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export function OTBPodDetailPage(): React.ReactNode {
  const { podId } = useParams<{ podId: string }>();
  const [searchParams] = useSearchParams();
  const fiscalYear = useOTBStore((s) => s.fiscalYear);
  const rawOtbConfig = useModuleConfig<Record<string, unknown>>('otb');
  const otbConfig = useMemo(() => parseOtbConfig(rawOtbConfig), [rawOtbConfig]);

  // Build OTB dashboard link preserving dashboard-level filters (format/segment/family)
  const otbDashboardLink = (() => {
    const dashParams = new URLSearchParams();
    const format = searchParams.get('format');
    const seg = searchParams.get('segment');
    const fam = searchParams.get('family');
    if (format) dashParams.set('format', format);
    if (seg) dashParams.set('segment', seg);
    if (fam) dashParams.set('family', fam);
    const qs = dashParams.toString();
    return `/otb${qs ? `?${qs}` : ''}`;
  })();

  // Parse segment-family from podId (format: "SEGMENT-FAMILY" where family may contain hyphens)
  const podStr = podId ?? '';
  const firstDash = podStr.indexOf('-');
  const segment = firstDash > 0 ? podStr.slice(0, firstDash) : podStr;
  const family = firstDash > 0 ? podStr.slice(firstDash + 1) : '';

  // ── Fetch summary via React Query ──
  const { data: detail, isLoading: detailLoading } = usePodSummary(segment ?? '', family ?? '');

  // ── Fetch display names from general filters ──
  const { data: filtersData } = useOtbFilters();
  const segmentLabel = useMemo(() => {
    const seg = filtersData?.segments?.find((s) => s.code === segment);
    return seg?.display_name ?? null;
  }, [filtersData?.segments, segment]);
  const familyLabel = useMemo(() => {
    const fam = filtersData?.families?.find((f) => f.code === family);
    return fam?.display_name ?? null;
  }, [filtersData?.families, family]);

  const l1Label = otbConfig.hierarchy.level1.label;
  const l2Label = otbConfig.hierarchy.level2.label;
  const pageTitle = segmentLabel && familyLabel
    ? `${segmentLabel} — ${familyLabel}`
    : segment && family
      ? `${l1Label} ${segment} — ${l2Label} ${family}`
      : `${l1Label} / ${l2Label} Detail`;
  const utilStatus = detail ? getPodStatus(detail.utilization_pct) : null;

  // ─── Not found / loading ──────────────────────────────────────────
  if (!segment || !family) {
    return (
      <div>
        <PageHeader
          title={`${l1Label} / ${l2Label} Detail`}
          backTo={{ label: 'Open-to-Buy', path: otbDashboardLink }}
        />
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-500">Invalid {l1Label.toLowerCase()}/{l2Label.toLowerCase()}: <span className="font-mono font-medium text-gray-700">{podId}</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader
        title={pageTitle}
        backTo={{ label: 'Open-to-Buy', path: otbDashboardLink }}
        badges={<Badge variant="primary" size="sm">{fiscalYear}</Badge>}
      />

      {/* Summary KPIs */}
      {detailLoading ? (
        <LoadingBlock className="h-24" />
      ) : detail ? (
        <MetricGrid columns={4}>
          <MetricCard label="Budget" value={formatCurrency(detail.budget, { decimals: 2 })} />
          <MetricCard label="Consumed" value={formatCurrency(detail.consumed, { decimals: 2 })} />
          <MetricCard
            label="Utilization"
            value={`${detail.utilization_pct}%`}
            badge={utilStatus ? <Badge variant={utilStatus.variant} size="sm">{utilStatus.label}</Badge> : undefined}
          >
            <Progress
              value={detail.utilization_pct}
              size="sm"
              className="mt-2"
              indicatorClassName={getUtilBarColor(detail.utilization_pct)}
            />
          </MetricCard>
          <MetricCard label="OTB Count" value={detail.otb_count.toLocaleString(getFormattingConfig().locale)} />
        </MetricGrid>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-500">Unable to load summary data.</p>
        </div>
      )}

      {/* OTB Line Items */}
      <OTBLineItemsSection segment={segment} family={family} podId={podId!} segmentLabel={segmentLabel ?? undefined} familyLabel={familyLabel ?? undefined} otbConfig={otbConfig} />

      {/* Store Breakdown — hidden for channel-led orgs */}
      {otbConfig.breakdown_type !== 'channel' && (
        <StoreBreakdownTab segment={segment} family={family} />
      )}
    </div>
  );
}
