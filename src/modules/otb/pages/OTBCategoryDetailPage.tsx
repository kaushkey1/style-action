import { useState, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  Badge,
  MetricCard,
  PageHeader,
  MetricGrid,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  EmptyState,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  FilterSelect,
  FilterSearch,
  FilterClear,
  Button,
} from '@/components/ui';
import {cn, formatCurrency, getFormattingConfig} from '@/lib/utils';
import { useOTBStore } from '../stores/otb.store';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { useDownload } from '@/hooks/useDownload';
import { IMPETUS_APP_BASE } from '@/lib/api';
import {
  mockCategoryRows,
  mockCategoryStores,
  getCategoryLineItems,
  getCategoryName,
  getCategoryStatus,
} from '../data/mockOTBCategory';

import type { OTBCategoryLineItem, OTBCategoryStore } from '../data/mockOTBCategory';

// ─── Helpers ────────────────────────────────────────────────────────

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

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-primary/10 text-primary';
    case 'A1': return 'bg-blue-100 text-blue-700';
    case 'A2': return 'bg-gray-100 text-gray-700';
    case 'A3': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-700';
  }
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
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-gray-500">Rows per page</span>
          {/* eslint-disable-next-line no-restricted-syntax -- compact pagination page-size select */}
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-7 px-1.5 text-base sm:text-xs border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-gray-500">
          {start}–{end} of {pagination.total.toLocaleString(getFormattingConfig().locale)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Page</span>
          {/* eslint-disable-next-line no-restricted-syntax -- compact pagination page input */}
          <input
            type="text"
            value={pageInputValue}
            onChange={(e) => setEditingPage(e.target.value)}
            onBlur={handlePageInputCommit}
            onKeyDown={(e) => { if (e.key === 'Enter') handlePageInputCommit(); }}
            className="w-10 h-7 text-center text-base sm:text-xs border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <span className="text-xs text-gray-500">of {pagination.totalPages}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center justify-center min-w-10 min-h-10 sm:w-7 sm:h-7 sm:min-w-0 sm:min-h-0 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="flex items-center justify-center min-w-10 min-h-10 sm:w-7 sm:h-7 sm:min-w-0 sm:min-h-0 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Store Breakdown Section ────────────────────────────────────────

const GRADE_OPTIONS = ['All', 'A', 'A1', 'A2', 'A3'] as const;
const STATUS_OPTIONS = ['All', 'Warnings Only'] as const;

function StoreBreakdownSection({ searchDebounced }: { searchDebounced: string }): React.ReactNode {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);

  const handlePageSizeChange = useCallback((size: number) => { setPageSize(size); setPage(1); }, []);
  const handleGradeFilter = useCallback((g: string) => { setGradeFilter(g); setPage(1); }, []);
  const handleStatusFilter = useCallback((s: string) => { setStatusFilter(s); setPage(1); }, []);

  // Filter stores
  const filteredStores = useMemo(() => {
    let stores: OTBCategoryStore[] = mockCategoryStores;
    if (gradeFilter !== 'All') {
      stores = stores.filter((s) => s.grade === gradeFilter);
    }
    if (statusFilter === 'Warnings Only') {
      stores = stores.filter((s) => s.alerts.length > 0);
    }
    if (searchDebounced) {
      const q = searchDebounced.toLowerCase();
      stores = stores.filter((s) => s.store_name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q));
    }
    return stores;
  }, [gradeFilter, statusFilter, searchDebounced]);

  // Pagination
  const totalFiltered = filteredStores.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedStores = filteredStores.slice((page - 1) * pageSize, page * pageSize);

  const pagination: PaginationInfo = {
    page,
    totalPages,
    total: totalFiltered,
    hasNext: page < totalPages,
  };

  const totalBudget = filteredStores.reduce((s, r) => s + r.budget, 0);
  const totalConsumed = filteredStores.reduce((s, r) => s + r.consumed, 0);
  const totalUtil = totalBudget > 0 ? Math.round((totalConsumed / totalBudget) * 100) : 0;

  return (
    <div>
      {/* Filter pills + download */}
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
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">{totalFiltered} stores</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => download('/otb/category/stores', 'otb_category_stores.xlsx')}
            disabled={isDownloading}
            className="shrink-0"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
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
            {paginatedStores.length === 0 ? (
              <tr><td colSpan={8}><EmptyState description="No stores found" /></td></tr>
            ) : paginatedStores.map((store, i) => (
              <DataTableRow key={store.site || i}>
                <DataTableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{store.store_name}</span>
                    {store.city && (
                      <span className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {store.city}
                      </span>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell align="center">
                  <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', gradeColor(store.grade))}>
                    {store.grade}
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
                  {store.alerts.length > 0 ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                  )}
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
          {paginatedStores.length > 0 && (
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
      </div>
      <PaginationBar pagination={pagination} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} />
    </div>
  );
}

function StoreBreakdownTab(): React.ReactNode {
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
          <StoreBreakdownSection searchDebounced={storeSearchDebounced} />
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

// ─── OTB Line Items Section ─────────────────────────────────────────

function OTBLineItemsSection({ categoryCode, categoryName }: { categoryCode: string; categoryName: string }): React.ReactNode {
  const [searchParams, setSearchParams] = useSearchParams();
  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('otbNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Search
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

  // Filters persisted in URL
  const brickFilter = searchParams.get('brick') || 'all';
  const subFilter = searchParams.get('sub') || 'all';
  const gradeFilter = searchParams.get('grade') || 'all';
  const hitFilter = searchParams.get('hit') || 'all';

  const setFilterParam = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === 'all') { next.delete(key); } else { next.set(key, value); }
      return next;
    });
    setPage(1);
  }, [setSearchParams]);

  const setBrickFilterValue = useCallback((v: string) => setFilterParam('brick', v), [setFilterParam]);
  const setSubFilterValue = useCallback((v: string) => setFilterParam('sub', v), [setFilterParam]);
  const setGradeFilterValue = useCallback((v: string) => setFilterParam('grade', v), [setFilterParam]);
  const setHitFilterValue = useCallback((v: string) => setFilterParam('hit', v), [setFilterParam]);

  const anyFilterActive = brickFilter !== 'all' || subFilter !== 'all' || gradeFilter !== 'all' || hitFilter !== 'all';
  const clearAllFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('brick');
      next.delete('sub');
      next.delete('grade');
      next.delete('hit');
      return next;
    });
    setPage(1);
  }, [setSearchParams]);

  // Get all line items for this category
  const allLineItems = useMemo(() => getCategoryLineItems(categoryCode), [categoryCode]);

  // Build filter options
  const brickOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];
    for (const item of allLineItems) {
      if (!seen.has(item.brick)) {
        seen.add(item.brick);
        options.push({ value: item.brick, label: item.brick });
      }
    }
    return [{ value: 'all', label: 'All Bricks' }, ...options];
  }, [allLineItems]);

  const subcategoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];
    for (const item of allLineItems) {
      if (!seen.has(item.subcategory)) {
        seen.add(item.subcategory);
        options.push({ value: item.subcategory, label: item.subcategory });
      }
    }
    return [{ value: 'all', label: 'All Sub Categories' }, ...options];
  }, [allLineItems]);

  const gradeOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];
    for (const item of allLineItems) {
      if (!seen.has(item.grade)) {
        seen.add(item.grade);
        options.push({ value: item.grade, label: item.grade });
      }
    }
    return [{ value: 'all', label: 'All Grades' }, ...options];
  }, [allLineItems]);

  const hitOptions = useMemo(() => {
    const seen = new Set<number>();
    const options: { value: string; label: string }[] = [];
    for (const item of allLineItems) {
      if (!seen.has(item.hit)) {
        seen.add(item.hit);
        options.push({ value: String(item.hit), label: `Hit ${item.hit}` });
      }
    }
    return [{ value: 'all', label: 'All Hits' }, ...options];
  }, [allLineItems]);

  // Filter + search + sort
  const filteredItems = useMemo(() => {
    let items: OTBCategoryLineItem[] = allLineItems;
    if (brickFilter !== 'all') {
      items = items.filter((i) => i.brick === brickFilter);
    }
    if (subFilter !== 'all') {
      items = items.filter((i) => i.subcategory === subFilter);
    }
    if (gradeFilter !== 'all') {
      items = items.filter((i) => i.grade === gradeFilter);
    }
    if (hitFilter !== 'all') {
      items = items.filter((i) => String(i.hit) === hitFilter);
    }
    if (lineSearchDebounced) {
      const q = lineSearchDebounced.toLowerCase();
      items = items.filter((i) => i.otbNumber.toLowerCase().includes(q) || i.subcategory.toLowerCase().includes(q));
    }
    // Sort
    items = [...items].sort((a, b) => {
      const key = sortBy as keyof OTBCategoryLineItem;
      const aVal = a[key];
      const bVal = b[key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return items;
  }, [allLineItems, brickFilter, subFilter, gradeFilter, hitFilter, lineSearchDebounced, sortBy, sortOrder]);

  // Pagination
  const totalFiltered = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const pagination: PaginationInfo = {
    page,
    totalPages,
    total: totalFiltered,
    hasNext: page < totalPages,
  };

  const handlePageSizeChange = useCallback((size: number) => { setPageSize(size); setPage(1); }, []);

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

  // Totals for footer
  const totalRecommended = filteredItems.reduce((s, r) => s + r.recommended, 0);
  const totalPurchase = filteredItems.reduce((s, r) => s + r.purchase, 0);
  const totalUtilFooter = totalRecommended > 0 ? Math.round((totalPurchase / totalRecommended) * 100) : 0;

  // Summary strip text
  const summaryText = anyFilterActive || lineSearchDebounced
    ? `${totalFiltered} line items · ${allLineItems.length - totalFiltered} filtered`
    : `${totalFiltered} line items`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">OTB Line Items</h3>
        <div className="flex items-center gap-2">
          <FilterSearch value={lineSearch} onChange={handleLineSearch} placeholder="Search OTB number or subcategory..." />
          <Button
            variant="outline"
            size="sm"
            onClick={() => download('/otb/category/line-items', 'otb_category_line_items.xlsx')}
            disabled={isDownloading}
            className="shrink-0"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-4 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterSelect
            value={categoryCode}
            onChange={() => {}}
            options={[{ value: categoryCode, label: categoryName }]}
            disabled
            className="min-w-[10rem]"
          />
          <FilterSelect
            value={subFilter}
            onChange={setSubFilterValue}
            placeholder="All Sub Categories"
            options={subcategoryOptions}
            className="min-w-[10rem]"
            searchable
          />
          <FilterSelect
            value={brickFilter}
            onChange={setBrickFilterValue}
            placeholder="All Bricks"
            options={brickOptions}
            className="min-w-[9rem]"
            searchable
          />
          <FilterSelect
            value={gradeFilter}
            onChange={setGradeFilterValue}
            placeholder="All Grades"
            options={gradeOptions}
            className="min-w-[9rem]"
            searchable
          />
          <FilterSelect
            value={hitFilter}
            onChange={setHitFilterValue}
            placeholder="All Hits"
            options={hitOptions}
            className="min-w-[8rem]"
            searchable
          />
          {anyFilterActive && <FilterClear onClear={clearAllFilters} />}
        </div>
        <p className="text-xs text-gray-500 px-1 mt-2">{summaryText}</p>
      </div>

      <div className="overflow-x-auto">
        <DataTable>
          <DataTableHeader>
            {renderSortableHead('otbNumber', 'OTB Number')}
            <DataTableHead>Category</DataTableHead>
            <DataTableHead>Sub Category</DataTableHead>
            {renderSortableHead('grade', 'Grade', 'center')}
            {renderSortableHead('hit', 'Hit', 'center')}
            {renderSortableHead('recommended', 'Recommended', 'right')}
            {renderSortableHead('purchase', 'Purchase', 'right')}
            <DataTableHead align="right">Variance</DataTableHead>
            {renderSortableHead('utilPct', 'Util%', 'center')}
            <DataTableHead align="center">Status</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {paginatedItems.length === 0 ? (
              <tr><td colSpan={10}><EmptyState description="No line items found" /></td></tr>
            ) : paginatedItems.map((item) => {
              const status = getCategoryStatus(item.utilPct);
              return (
                <DataTableRow key={item.id}>
                  <DataTableCell>
                    <Link
                      to={`/otb/category/${categoryCode}/detail/${item.otbId}`}
                      className="font-mono text-xs font-medium text-primary hover:text-primary/80 hover:underline"
                    >
                      {item.otbNumber}
                    </Link>
                  </DataTableCell>
                  <DataTableCell className="text-gray-700">{item.category}</DataTableCell>
                  <DataTableCell className="text-gray-700">{item.subcategory}</DataTableCell>
                  <DataTableCell align="center"><Badge variant="default" size="sm">{item.grade}</Badge></DataTableCell>
                  <DataTableCell align="center"><span className="text-xs font-medium text-gray-700">{item.hit}</span></DataTableCell>
                  <DataTableCell align="right" className="font-mono">{formatCurrency(item.recommended)}</DataTableCell>
                  <DataTableCell align="right" className="font-mono">{formatCurrency(item.purchase)}</DataTableCell>
                  <DataTableCell align="right">
                    {item.variancePct == null ? (
                      <span className="text-xs text-gray-400">{'—'}</span>
                    ) : (
                      <span className={cn('text-xs font-medium', getUtilTextColor(100 + item.variancePct))}>
                        {item.variancePct > 0 ? '+' : ''}{item.variancePct.toFixed(1)}%
                      </span>
                    )}
                  </DataTableCell>
                  <DataTableCell>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={cn('w-2 h-2 rounded-full', getUtilColor(item.utilPct))} />
                      <span className={cn('font-medium', getUtilTextColor(item.utilPct))}>{item.utilPct}%</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell align="center"><Badge variant={status.variant} size="sm">{status.label}</Badge></DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>
          {paginatedItems.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-medium">
                <td className="p-3 text-gray-900 font-semibold" colSpan={5}>Total</td>
                <td className="p-3 text-right text-gray-900 font-mono">{formatCurrency(totalRecommended)}</td>
                <td className="p-3 text-right text-gray-900 font-mono">{formatCurrency(totalPurchase)}</td>
                <td className="p-3" />
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={cn('w-2 h-2 rounded-full', getUtilColor(totalUtilFooter))} />
                    <span className={cn('font-semibold', getUtilTextColor(totalUtilFooter))}>{totalUtilFooter}%</span>
                  </div>
                </td>
                <td className="p-3" />
              </tr>
            </tfoot>
          )}
        </DataTable>
      </div>
      <PaginationBar pagination={pagination} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} />
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────

export function OTBCategoryDetailPage(): React.ReactNode {
  const { categoryId } = useParams<{ categoryId: string }>();
  const fiscalYear = useOTBStore((s) => s.fiscalYear);

  const categoryCode = categoryId ?? '';
  const categoryName = getCategoryName(categoryCode);

  // Compute summary KPIs from category rows
  const categoryRows = useMemo(
    () => mockCategoryRows.filter((r) => r.categoryCode === categoryCode),
    [categoryCode],
  );
  const lineItems = useMemo(() => getCategoryLineItems(categoryCode), [categoryCode]);

  const totalBudget = categoryRows.reduce((s, r) => s + r.budget, 0);
  const totalConsumed = categoryRows.reduce((s, r) => s + r.consumed, 0);
  const utilizationPct = totalBudget > 0 ? Math.round((totalConsumed / totalBudget) * 100) : 0;
  const utilStatus = getCategoryStatus(utilizationPct);

  // Invalid categoryId
  if (!categoryName) {
    return (
      <div className="space-y-4 animate-fadeInUp">
        <PageHeader
          title="Category Detail"
          backTo={{ label: 'Open-to-Buy', path: '/otb/category' }}
        />
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-500">Invalid category: <span className="font-mono font-medium text-gray-700">{categoryCode}</span></p>
          <Link to="/otb/category" className="text-sm text-primary hover:underline mt-2 inline-block">
            Back to Category listing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader
        title={categoryName}
        backTo={{ label: 'Open-to-Buy', path: '/otb/category' }}
        badges={<Badge variant="primary" size="sm">{fiscalYear}</Badge>}
      />

      {/* Summary KPIs */}
      <MetricGrid columns={4}>
        <MetricCard label="Budget" value={formatCurrency(totalBudget)} />
        <MetricCard label="Consumed" value={formatCurrency(totalConsumed)} />
        <MetricCard
          label="Utilization"
          value={`${utilizationPct}%`}
          badge={<Badge variant={utilStatus.variant} size="sm">{utilStatus.label}</Badge>}
        >
          <Progress
            value={utilizationPct}
            size="sm"
            className="mt-2"
            indicatorClassName={getUtilBarColor(utilizationPct)}
          />
        </MetricCard>
        <MetricCard label="OTB Count" value={lineItems.length.toLocaleString(getFormattingConfig().locale)} />
      </MetricGrid>

      {/* OTB Line Items */}
      <OTBLineItemsSection categoryCode={categoryCode} categoryName={categoryName} />

      {/* Store Breakdown */}
      <StoreBreakdownTab />
    </div>
  );
}
