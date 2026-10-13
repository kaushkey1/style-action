import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  PageHeader,
  MetricCard,
  MetricGrid,
  Card,
  SectionHeader,
  EmptyState,
  Button,
  FilterBar,
  FilterDateRange,
  FilterMultiSelect,
  FilterClear,
  MobileFilterTrigger,
  MobileFilterSheet,
  ShimmerKpiGrid,
  ShimmerTable,
  type FilterDef,
} from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useToast } from '@/hooks/useToast';
import { getDataAvailableThroughDateIso } from '@/lib/utils';
import { useCategorySummary, useFilterOptions } from '@/modules/category-director/api/categoryDirectorHooks';
import {
  cdStatusToRag,
  cdKpiSubtitle,
  stripIndexPrefix,
} from '@/modules/category-director/lib/apiAdapters';
import {
  formatOptions,
  brandOptions,
  fashionGradeOptions,
} from '@/modules/category-director/stores/useCategoryDirectorFilterStore';
import {
  useCategoriesFilterStore,
  categoriesFilterKey,
  type CategoriesFilters,
} from '../stores/useCategoriesFilterStore';
import {
  toCategoryListRowsFromSummary,
  selectKpiCards,
  LIST_KPI_META,
  type CategoryListRow,
} from '../api/categoriesAdapters';
import { CategoryListTable } from '../components/CategoryListTable';

// ["Trends","Centro"] → [{ value, label }]; label drops any "N. " prefix.
function toMultiOptions(values: string[] | undefined): { value: string; label: string }[] {
  if (!values?.length) return [];
  return values.map((v) => ({ value: v, label: stripIndexPrefix(v) }));
}

function withFallback(
  apiValues: string[] | undefined,
  fallback: { value: string; label: string }[],
): { value: string; label: string }[] {
  const apiOptions = toMultiOptions(apiValues);
  return apiOptions.length ? apiOptions : fallback;
}

const MOBILE_FILTER_KEYS = ['format', 'brand', 'category', 'fashionGrade'] as const;

const DEFAULT_SORT = 'revenue-desc';
const SORT_OPTIONS = [
  { value: 'revenue-desc', label: 'Net Revenue (high → low)' },
  { value: 'revenue-asc', label: 'Net Revenue (low → high)' },
];

export function CategoriesListPage(): React.ReactNode {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { success: toastSuccess } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, setFilter, clearFilters } = useCategoriesFilterStore();

  // On mount: hydrate store from URL params if present, then write the resolved
  // filter state to URL so the address bar always reflects active filters.
  useEffect(() => {
    const urlDateFrom = searchParams.get('dateFrom');
    const urlDateTo = searchParams.get('dateTo');
    const urlFormat = searchParams.get('format');
    const urlBrand = searchParams.get('brand');
    const urlCategory = searchParams.get('category');
    const urlFashionGrade = searchParams.get('grades') ?? searchParams.get('fashionGrade');
    const hasUrlFilters = !!(
      urlDateFrom ||
      urlDateTo ||
      (urlFormat && urlFormat !== 'all') ||
      (urlBrand && urlBrand !== 'all') ||
      (urlCategory && urlCategory !== 'all') ||
      (urlFashionGrade && urlFashionGrade !== 'all')
    );

    if (hasUrlFilters) {
      setFilter('dateFrom', urlDateFrom ?? '');
      setFilter('dateTo', urlDateTo ?? '');
      setFilter('format', urlFormat ?? 'all');
      setFilter('brand', urlBrand ?? 'all');
      setFilter('category', urlCategory ?? 'all');
      setFilter('fashionGrade', urlFashionGrade ?? 'all');
    }

    // Write resolved filters to URL (including defaults like the date range).
    const resolved = hasUrlFilters
      ? {
          dateFrom: urlDateFrom ?? '',
          dateTo: urlDateTo ?? '',
          format: urlFormat ?? 'all',
          brand: urlBrand ?? 'all',
          category: urlCategory ?? 'all',
          fashionGrade: urlFashionGrade ?? 'all',
        }
      : filters;
    const next = new URLSearchParams();
    if (resolved.dateFrom) next.set('dateFrom', resolved.dateFrom);
    if (resolved.dateTo) next.set('dateTo', resolved.dateTo);
    if (resolved.format !== 'all') next.set('format', resolved.format);
    if (resolved.brand !== 'all') next.set('brand', resolved.brand);
    if (resolved.category !== 'all') next.set('category', resolved.category);
    if (resolved.fashionGrade !== 'all') next.set('grades', resolved.fashionGrade);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: sync URL ↔ store once on page load
  }, []);

  // Draft → applied gate: the store is the draft; `appliedFilters` is what the
  // query consumes. Changes only reach the API on Apply (mirrors the dashboard).
  const [appliedFilters, setAppliedFilters] = useState<CategoriesFilters>(() => {
    // Initialize from URL if params exist, otherwise use store defaults.
    const dateFrom = searchParams.get('dateFrom') ?? '';
    const dateTo = searchParams.get('dateTo') ?? '';
    const format = searchParams.get('format') ?? 'all';
    const brand = searchParams.get('brand') ?? 'all';
    const category = searchParams.get('category') ?? 'all';
    const subcategory = filters.subcategory;
    const fashionGrade = searchParams.get('grades') ?? searchParams.get('fashionGrade') ?? 'all';
    const hasUrlFilters =
      dateFrom || dateTo || format !== 'all' || brand !== 'all' || category !== 'all' || fashionGrade !== 'all';
    return hasUrlFilters
      ? { dateFrom, dateTo, format, brand, category, subcategory, fashionGrade }
      : filters;
  });
  const filtersChanged = categoriesFilterKey(filters) !== categoriesFilterKey(appliedFilters);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { data: apiFilters } = useFilterOptions(filters);
  const liveFormatOptions = useMemo(() => withFallback(apiFilters?.formats, formatOptions), [apiFilters?.formats]);
  const liveBrandOptions = useMemo(() => withFallback(apiFilters?.brands, brandOptions), [apiFilters?.brands]);
  const liveCategoryOptions = useMemo(() => withFallback(apiFilters?.categories, []), [apiFilters?.categories]);
  const liveFashionGradeOptions = useMemo(
    () => withFallback(apiFilters?.fashion_grades, fashionGradeOptions),
    [apiFilters?.fashion_grades],
  );

  const { data, isLoading, isError, refetch } = useCategorySummary(appliedFilters);

  const kpiCards = useMemo(() => selectKpiCards(data?.kpi_cards, LIST_KPI_META), [data?.kpi_cards]);
  const listRows = useMemo(() => toCategoryListRowsFromSummary(data?.category_table), [data?.category_table]);

  // Sort (view-only, not an API filter). revenueSharePct is monotonic with net
  // revenue, so it orders categories by revenue without a separate numeric field.
  const [sortKey, setSortKey] = useState<string>(DEFAULT_SORT);
  const sortedRows = useMemo(() => {
    const arr = [...listRows];
    arr.sort((a, b) =>
      sortKey === 'revenue-asc'
        ? a.revenueSharePct - b.revenueSharePct
        : b.revenueSharePct - a.revenueSharePct,
    );
    return arr;
  }, [listRows, sortKey]);

  const handleSelect = useCallback(
    (row: CategoryListRow) => {
      // Forward current URL params to the detail page so filters are preserved.
      const qs = searchParams.toString();
      const path = `/categories/${encodeURIComponent(row.name)}${qs ? `?${qs}` : ''}`;
      navigate(path);
    },
    [navigate, searchParams],
  );

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filters);
    // Persist applied filters to URL for shareability / reload persistence.
    const next = new URLSearchParams();
    if (filters.dateFrom) next.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) next.set('dateTo', filters.dateTo);
    if (filters.format && filters.format !== 'all') next.set('format', filters.format);
    if (filters.brand && filters.brand !== 'all') next.set('brand', filters.brand);
    if (filters.category && filters.category !== 'all') next.set('category', filters.category);
    if (filters.fashionGrade && filters.fashionGrade !== 'all') next.set('grades', filters.fashionGrade);
    setSearchParams(next, { replace: true });
  }, [filters, setSearchParams]);

  const handleClearAllFilters = useCallback(() => {
    clearFilters();
    const reset = useCategoriesFilterStore.getState().filters;
    setAppliedFilters(reset);
    // Preserve the current date in the URL — only non-date filters are cleared.
    const next = new URLSearchParams();
    if (reset.dateFrom) next.set('dateFrom', reset.dateFrom);
    if (reset.dateTo) next.set('dateTo', reset.dateTo);
    setSearchParams(next, { replace: true });
    toastSuccess('Filters have been cleared');
  }, [clearFilters, setSearchParams, toastSuccess]);

  // ── Mobile filter sheet config ──────────────────────────────────────────
  const mobileFilterDefs: FilterDef[] = useMemo(
    () => [
      { type: 'select', key: 'sort', label: 'Sort', options: SORT_OPTIONS },
      { type: 'daterange', key: 'date', label: 'Date Range', minDate: '2026-04-01', maxDate: getDataAvailableThroughDateIso() },
      { type: 'multiselect', key: 'format', label: 'Format', options: liveFormatOptions },
      { type: 'multiselect', key: 'brand', label: 'Brand', options: liveBrandOptions },
      { type: 'multiselect', key: 'category', label: 'Category', options: liveCategoryOptions },
      { type: 'multiselect', key: 'fashionGrade', label: 'Grade', options: liveFashionGradeOptions },
    ],
    [liveFormatOptions, liveBrandOptions, liveCategoryOptions, liveFashionGradeOptions],
  );

  const mobileFilterValues = useMemo(
    () => ({
      sort: sortKey,
      date: `${filters.dateFrom}|${filters.dateTo}`,
      format: filters.format,
      brand: filters.brand,
      category: filters.category,
      fashionGrade: filters.fashionGrade,
    }),
    [filters, sortKey],
  );

  const mobileActiveFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateFrom || filters.dateTo) count++;
    for (const key of MOBILE_FILTER_KEYS) {
      if (filters[key] && filters[key] !== 'all') count++;
    }
    return count;
  }, [filters]);

  const handleMobileFilterApply = useCallback(
    (vals: Record<string, string>) => {
      setSortKey(vals.sort || DEFAULT_SORT);
      const [dateFrom, dateTo] = (vals.date ?? '|').split('|');
      setFilter('dateFrom', dateFrom ?? '');
      setFilter('dateTo', dateTo ?? '');
      for (const key of MOBILE_FILTER_KEYS) {
        setFilter(key, vals[key] ?? 'all');
      }
      setAppliedFilters({
        dateFrom: dateFrom ?? '',
        dateTo: dateTo ?? '',
        format: vals.format ?? 'all',
        brand: vals.brand ?? 'all',
        category: vals.category ?? 'all',
        subcategory: filters.subcategory,
        fashionGrade: vals.fashionGrade ?? 'all',
      });
    },
    [setFilter, filters.subcategory],
  );

  return (
    <div className="animate-fadeInUp">
      <PageHeader
        title="Categories"
      />

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

      {/* Sticky filter/sort bar — pinned under the app TopBar while content scrolls (dashboard pattern).
          Owns its own py-4 (16px), so the title→filter and filter→content gaps stay an even 16px AND
          the bar keeps breathing room on both edges when pinned. The root drops space-y-4 (content
          below has its own space-y-4 wrapper) so this padding doesn't stack into a double gap. */}
      <div className="sticky top-0 z-20 -mx-4 bg-gray-50/90 px-4 py-4 backdrop-blur-sm">
      {isMobile ? (
        <MobileFilterTrigger
          activeCount={mobileActiveFilterCount}
          onOpen={() => setMobileFilterOpen(true)}
        />
      ) : (
        <FilterBar className="mb-0">
          <FilterDateRange
            fromValue={filters.dateFrom}
            toValue={filters.dateTo}
            onFromChange={(v) => setFilter('dateFrom', v)}
            onToChange={(v) => setFilter('dateTo', v)}
            minDate="2026-04-01"
            maxDate={getDataAvailableThroughDateIso()}
          />
          <FilterMultiSelect
            value={filters.format}
            onChange={(v) => setFilter('format', v)}
            options={liveFormatOptions}
            placeholder="Format"
          />
          <FilterMultiSelect
            value={filters.brand}
            onChange={(v) => setFilter('brand', v)}
            options={liveBrandOptions}
            placeholder="Brand"
          />
          <FilterMultiSelect
            value={filters.category}
            onChange={(v) => setFilter('category', v)}
            options={liveCategoryOptions}
            placeholder="Category"
          />
          <FilterMultiSelect
            value={filters.fashionGrade}
            onChange={(v) => setFilter('fashionGrade', v)}
            options={liveFashionGradeOptions}
            placeholder="Grade"
          />
          {filtersChanged && (
            <Button variant="primary" size="sm" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          )}
          <FilterClear onClear={handleClearAllFilters} />
        </FilterBar>
      )}
      </div>

      {isError ? (
        <EmptyState
          title="Couldn't load categories"
          description="The dashboard service didn't respond. Try again in a moment."
          icon={AlertCircle}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1.5" /> Retry
            </Button>
          }
        />
      ) : isLoading && !data ? (
        <div className="space-y-4">
          <ShimmerKpiGrid />
          <ShimmerTable rows={6} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* KPIs: 1-per-row on phones, 2-col on tablet (md), 4-col on desktop (lg). */}
          <MetricGrid columns={4} className="xs:grid-cols-1 md:grid-cols-2">
            {kpiCards.map((kpi) => (
              <MetricCard
                key={kpi.id}
                label={kpi.label}
                value={kpi.value}
                infoKey={kpi.infoKey}
                status={cdStatusToRag(kpi.status)}
                subtitle={cdKpiSubtitle(kpi)}
              />
            ))}
          </MetricGrid>

          {isMobile ? (
            // Mobile: title outside, status-led rows own their container (no card-in-card).
            <div>
              <SectionHeader
                title="Category performance"
                subtitle="Select a category to open its detail view"
              />
              {listRows.length === 0 ? (
                <EmptyState
                  title="No categories found"
                  description="No category data matches the current filters."
                />
              ) : (
                <CategoryListTable rows={sortedRows} onSelect={handleSelect} />
              )}
            </div>
          ) : (
            <Card className="p-4">
              {listRows.length === 0 ? (
                <>
                  <SectionHeader title="Category performance" />
                  <EmptyState
                    title="No categories found"
                    description="No category data matches the current filters."
                  />
                </>
              ) : (
                <CategoryListTable
                  rows={sortedRows}
                  onSelect={handleSelect}
                  title="Category performance"
                />
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
