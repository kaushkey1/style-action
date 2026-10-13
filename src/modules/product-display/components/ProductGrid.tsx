import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Package, ImageOff, SlidersHorizontal, Search, X } from 'lucide-react';
import {
  Badge, Button, EmptyState, FilterBar, FilterClear, FilterMultiSelect, FilterSearch,
  Input, MetricCard, MetricGrid, MobileFilterSheet, Pagination, Skeleton,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui';
import type { FilterDef } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { formatNumber } from '@/lib/utils';
import { useProductList, useStoreFilters } from '../api/storeProductApi';
import type { ProductListItem } from '../api/storeProductApi';

const PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { value: 'health_score-asc', label: 'Health (worst first)' },
  { value: 'health_score-desc', label: 'Health (best first)' },
  { value: 'sell_through_pct-asc', label: 'Sell-through (low)' },
  { value: 'sell_through_pct-desc', label: 'Sell-through (high)' },
  { value: 'age_days-desc', label: 'Age (oldest)' },
  { value: 'age_days-asc', label: 'Age (newest)' },
  { value: 'markdown_pct-desc', label: 'Markdown (highest)' },
  { value: 'sellable_stock-desc', label: 'Stock (highest)' },
];

/** Category / sub-category names arrive numbered ("1. Men Apparel"); strip the prefix for display. */
function stripNum(s: string): string {
  return s.replace(/^\d+\.\s*/, '');
}


interface ProductGridProps {
  storeCode: string;
  fromDate?: string;
  toDate?: string;
}

export function ProductGrid({ storeCode, fromDate, toDate }: ProductGridProps): React.ReactNode {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL params (survive page refresh / direct link)
  const [segment, setSegment] = useState(() => searchParams.get('category') ?? 'all');
  const [family, setFamily] = useState(() => searchParams.get('subcategory') ?? 'all');
  const [grade, setGrade] = useState(() => searchParams.get('fashion_grade') ?? 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('health_score-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 300);
  }, []);

  const [sortField, sortDir] = sort.split('-') as [string, string];

  const { data, isLoading, isError } = useProductList(storeCode, {
    category: segment !== 'all' ? segment : undefined,
    family: family !== 'all' ? family : undefined,
    fashion_grade: grade !== 'all' ? grade : undefined,
    search: debouncedSearch || undefined,
    sort_by: sortField,
    sort_dir: sortDir,
    limit: PAGE_SIZE,
    offset: (currentPage - 1) * PAGE_SIZE,
  }, fromDate, toDate);

  const { data: filtersData } = useStoreFilters(storeCode, fromDate, toDate, segment !== 'all' ? segment : undefined);

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const kpis = data?.kpis;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const categories = filtersData?.categories ?? [];
  const subcategories = filtersData?.subcategories ?? [];
  const fashionGrades = filtersData?.fashion_grades ?? [];

  const isMobile = useIsMobile();

  // Per-filter change handlers — desktop inline FilterBar
  const handleSegmentChange = useCallback((val: string) => {
    setSegment(val);
    setFamily('all');
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val === 'all') { next.delete('category'); } else { next.set('category', val); }
      next.delete('subcategory');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleFamilyChange = useCallback((val: string) => {
    setFamily(val);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val === 'all') { next.delete('subcategory'); } else { next.set('subcategory', val); }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleGradeChange = useCallback((val: string) => {
    setGrade(val);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val === 'all') { next.delete('fashion_grade'); } else { next.set('fashion_grade', val); }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Clear removes all product filters from URL and resets state to 'all'
  const handleClearFilters = useCallback(() => {
    setSegment('all');
    setFamily('all');
    setGrade('all');
    setSearchQuery('');
    setDebouncedSearch('');
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('category');
      next.delete('subcategory');
      next.delete('fashion_grade');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const hasActiveFilters = segment !== 'all' || family !== 'all' || grade !== 'all' || debouncedSearch.trim() !== '';
  const activeFilterCount = [segment, family, grade].filter((v) => v !== 'all').length;

  // Apply the buffered draft from the master-detail Filter & Sort sheet all at once.
  const handleSheetApply = useCallback((vals: Record<string, string>) => {
    const nextCategory = vals.category || 'all';
    const nextSubcategory = vals.subcategory || 'all';
    const nextGrade = vals.grade || 'all';
    setSort(vals.sort || 'health_score-asc');
    setSegment(nextCategory);
    setFamily(nextSubcategory);
    setGrade(nextGrade);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (nextCategory === 'all') next.delete('category'); else next.set('category', nextCategory);
      if (nextSubcategory === 'all') next.delete('subcategory'); else next.set('subcategory', nextSubcategory);
      if (nextGrade === 'all') next.delete('fashion_grade'); else next.set('fashion_grade', nextGrade);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const sheetValues = useMemo<Record<string, string>>(
    () => ({ sort, category: segment, subcategory: family, grade }),
    [sort, segment, family, grade],
  );

  // Sort is single-select; Category / Sub Category / Fashion Grade are searchable
  // multiselects — same component + "Select All" pattern as the dashboard filters.
  const sheetFilters = useMemo<FilterDef[]>(() => {
    const cats = filtersData?.categories ?? [];
    const subs = filtersData?.subcategories ?? [];
    const grades = filtersData?.fashion_grades ?? [];
    return [
      { type: 'select', key: 'sort', label: 'Sort', options: SORT_OPTIONS },
      { type: 'multiselect', key: 'category', label: 'Category', options: cats.map((s) => ({ value: s, label: stripNum(s) })) },
      { type: 'multiselect', key: 'subcategory', label: 'Sub Category', options: subs.map((f) => ({ value: f, label: stripNum(f) })) },
      { type: 'multiselect', key: 'grade', label: 'Fashion Grade', options: grades.map((g) => ({ value: g, label: stripNum(g) })) },
    ];
  }, [filtersData]);

  return (
    <div className="space-y-4">
      {isMobile ? (
        <>
          {/* Mobile: search (left) + Filter & Sort button (right) → master-detail sheet.
              Sticky directly under the store-detail tab bar. --product-sticky-top is the
              tab-bar height (set by the page); falls back to 0 when there's no sticky tab
              bar above (standalone product page). Full-bleed gray bg masks content
              scrolling underneath. pt-3 keeps the controls off the tab bar's bottom edge
              (otherwise the shared pixel row clips their top border); pb-3 separates the
              KPIs below. */}
          <div className="sticky top-[var(--product-sticky-top,0px)] z-10 -mx-4 flex items-center gap-2 bg-gray-50/95 px-4 pb-3 pt-3 backdrop-blur-sm">
            <FilterSearch
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search style..."
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSheetOpen(true)}
              className="min-h-11 shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter &amp; Sort
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
          {/* Combined Filter & Sort — master-detail sheet (matches the dashboard filter pattern). */}
          <MobileFilterSheet
            isOpen={sheetOpen}
            onClose={() => setSheetOpen(false)}
            filters={sheetFilters}
            values={sheetValues}
            onApply={handleSheetApply}
            onClear={handleClearFilters}
          />
        </>
      ) : (
        /* Desktop: inline filter bar — unchanged from baseline */
        <FilterBar className="flex-wrap gap-2">
          <FilterMultiSelect
            value={segment}
            onChange={handleSegmentChange}
            options={categories.map((s) => ({ value: s, label: stripNum(s) }))}
            placeholder="Category"
          />
          <FilterMultiSelect
            value={family}
            onChange={handleFamilyChange}
            options={subcategories.map((f) => ({ value: f, label: stripNum(f) }))}
            placeholder="Sub Category"
          />
          <FilterMultiSelect
            value={grade}
            onChange={handleGradeChange}
            options={fashionGrades.map((g) => ({ value: g, label: stripNum(g) }))}
            placeholder="Fashion Grade"
          />

          {hasActiveFilters && <FilterClear onClear={handleClearFilters} />}

          <div className="flex items-center gap-2 ml-auto">
            <Input
              type="text"
              placeholder="Search style..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              containerClassName="w-48"
              className="h-8 text-sm"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              rightIcon={searchQuery ? (
                <button onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setCurrentPage(1); }} className="relative text-gray-400 hover:text-gray-600 transition-colors" aria-label="Clear search">
                  <span className="absolute -inset-2" aria-hidden="true" />
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined}
            />
            <Select value={sort} onValueChange={(v) => { setSort(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-auto min-w-[160px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </FilterBar>
      )}

      {/* KPI strip */}
      {kpis && (
        <MetricGrid columns={5}>
          <MetricCard label="Total Options" value={formatNumber(kpis.total_options)} valueClassName="text-2xl" />
          <MetricCard label="Avg Sell Through" value={`${kpis.avg_sell_through}%`} valueClassName="text-2xl" />
          <MetricCard label="Aged > 90" value={formatNumber(kpis.aged_count)} valueClassName="text-2xl text-red-700" />
          <MetricCard label="Avg Markdown" value={`${kpis.avg_markdown}%`} valueClassName="text-2xl" />
          {kpis.broken_options != null && (
            <MetricCard label="Broken Options" value={formatNumber(kpis.broken_options)} valueClassName="text-2xl text-amber-700" />
          )}
        </MetricGrid>
      )}

      {/* Loading state — skeleton cards mirror the grid so there's no spinner-to-grid jump */}
      {isLoading && (
        // eslint-disable-next-line design-system/prefer-metric-grid -- skeleton product cards, not metrics
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-gray-200 overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-2">
                  <Skeleton className="h-7" />
                  <Skeleton className="h-7" />
                  <Skeleton className="h-7" />
                  <Skeleton className="h-7" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <EmptyState
          icon={Package}
          description="Failed to load products. Please try again."
          action={<Button variant="outline-destructive" size="sm" onClick={() => window.location.reload()}>Retry</Button>}
        />
      )}

      {/* Product grid */}
      {!isLoading && !isError && products.length === 0 && (
        <EmptyState
          icon={Package}
          description="No options match the current filters"
          action={<Button variant="outline-destructive" size="sm" onClick={handleClearFilters}>Clear filters</Button>}
        />
      )}

      {!isLoading && !isError && products.length > 0 && (
        <>
          {/* eslint-disable-next-line design-system/prefer-metric-grid -- product card grid, not metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.option_code}
                product={product}
                onClick={() => navigate(`/products/${storeCode}/${product.option_code}${location.search}`)}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={total}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </div>
  );
}

// ─── Product Card ───────────────────────────────────────────────────────────

interface ProductCardProps {
  product: ProductListItem;
  onClick: () => void;
}

function ProductCard({ product, onClick }: ProductCardProps): React.ReactNode {
  const tags: { label: string; variant: 'info' | 'warning' | 'error' | 'default' }[] = [];
  if (product.is_new) tags.push({ label: 'New', variant: 'info' });
  if (product.is_aged) tags.push({ label: 'Aged', variant: 'default' });
  if (product.health_score < 55) tags.push({ label: 'At Risk', variant: 'error' });
  else if (product.health_score < 75) tags.push({ label: 'Watch', variant: 'warning' });

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 hover:border-primary/30 hover:shadow-md transition-[border-color,box-shadow,scale] duration-200 active:scale-[0.96] cursor-pointer focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${product.option_code}`}
    >
      <div className="aspect-[4/3] bg-gray-100 rounded-t-lg overflow-hidden ring-1 ring-inset ring-black/10">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.option_code}
            className="w-full h-full object-contain"
            loading="lazy"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              el.parentElement?.classList.add('flex', 'items-center', 'justify-center');
              const icon = document.createElement('div');
              icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
              el.parentElement?.appendChild(icon);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900 truncate flex-1" title={product.option_code}>{product.option_code}</p>
            {product.fashion_grade_desc && (
              <Badge variant="default" size="sm" className="shrink-0">{product.fashion_grade_desc}</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 text-pretty">
            {product.color}{product.category ? ` · ${stripNum(product.category)}` : ''}{product.subcategory ? ` · ${stripNum(product.subcategory)}` : ''}
          </p>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <Badge key={t.label} variant={t.variant} size="sm">{t.label}</Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Sell Through</p>
            <p className="text-sm font-semibold text-gray-900 tabular-nums">{product.sell_through_pct}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Age</p>
            <p className="text-sm font-semibold text-gray-900 tabular-nums">{product.age_days}d</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Markdown</p>
            <p className="text-sm font-semibold text-gray-900 tabular-nums">{product.markdown_pct}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Health</p>
            <p className="text-sm font-semibold text-gray-900 tabular-nums">{product.health_score}</p>
          </div>
          {product.foh_qty != null && (
            <div>
              <p className="text-xs text-gray-500">FOH Qty</p>
              <p className="text-sm font-semibold text-gray-900 tabular-nums">{product.foh_qty}</p>
            </div>
          )}
          {product.boh_qty != null && (
            <div>
              <p className="text-xs text-gray-500">BOH Qty</p>
              <p className="text-sm font-semibold text-gray-900 tabular-nums">{product.boh_qty}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
