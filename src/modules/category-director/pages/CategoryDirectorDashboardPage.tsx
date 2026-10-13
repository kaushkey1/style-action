import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePersonaStore } from '@/hooks/usePersonaStore';
// NOTE: When unhiding hidden tabs below (Store & Distribution, Supply & OTB),
// re-add `MapPin` / `Truck` to this import and re-add the matching tab component import below.
import { Activity, Package } from 'lucide-react';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
  FilterBar, FilterDateRange, FilterMultiSelect, FilterClear,
  Button,
  MobileFilterTrigger, MobileFilterSheet,
  type FilterDef,
} from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useToast } from '@/hooks/useToast';
import { useGlossaryTab } from '@/modules/glossary/useGlossary';
import { MorningBriefing } from '../components/MorningBriefing';
import { CategoryPerformanceTab } from '../components/CategoryPerformanceTab';
import { InventoryLifecycleTab } from '../components/InventoryLifecycleTab';
// HIDDEN — StoreDistributionTab import. To unhide: uncomment + re-add `MapPin` to lucide imports above.
// import { StoreDistributionTab } from '../components/StoreDistributionTab';
// HIDDEN — SupplyOTBTab import. To unhide: uncomment + re-add `Truck` to lucide imports above.
// import { SupplyOTBTab } from '../components/SupplyOTBTab';
import {
  useCategoryDirectorFilterStore,
  categoryDirectorFilterKey,
  getDefaultCategoryDirectorFilters,
  type CategoryDirectorFilters,
  formatOptions,
  brandOptions,
  fashionGradeOptions,
  categoryFallbackOptions,
  subcategoryFallbackOptions,
} from '../stores/useCategoryDirectorFilterStore';
import { useFilterOptions } from '../api/categoryDirectorHooks';
import { stripIndexPrefix } from '../lib/apiAdapters';
import { PRESELECTED_CATEGORY_NAMES } from '@/modules/dashboard/stores/useDashboardFilterStore';
import { getDataAvailableThroughDateIso } from '@/lib/utils';
import { PageInfoBanners } from '@/components/data-scope/PageInfoBanners';
import { getDataScopeSnapshotNote } from '@/data/mockDataScope';

// Convert ["Trends","Centro"] → [{ value: "Trends", label: "Trends" }] for FilterMultiSelect.
// Label drops any "N. " prefix from the BE (e.g. "9. WESTERN TOPS" → "WESTERN TOPS")
// while value stays raw so the BE filter contract is preserved.
function toMultiOptions(values: string[] | undefined): { value: string; label: string }[] {
  if (!values?.length) return [];
  return values.map((v) => ({ value: v, label: stripIndexPrefix(v) }));
}

// Return live API options when available, otherwise the fallback list.
// No 'all' sentinel is prepended — the FilterMultiSelect renders its own
// Select All checkbox at the top.
function withAllOption(
  apiValues: string[] | undefined,
  fallback: { value: string; label: string }[],
): { value: string; label: string }[] {
  const apiOptions = toMultiOptions(apiValues);
  return apiOptions.length ? apiOptions : fallback;
}

const TABS = [
  { id: 'ww-performance', name: 'Category Performance', icon: Activity },
  { id: 'ww-inventory', name: 'Inventory & Lifecycle', icon: Package },
  // HIDDEN — Store & Distribution tab. To unhide: uncomment.
  // { id: 'ww-stores', name: 'Store & Distribution', icon: MapPin },
  // HIDDEN — Supply & OTB tab awaiting data/UX sign-off. To unhide: uncomment.
  // { id: 'ww-supply', name: 'Supply & OTB', icon: Truck },
] as const;

const FILTER_QUERY_MAP: Record<keyof CategoryDirectorFilters, string> = {
  dateFrom: 'from_date',
  dateTo: 'to_date',
  format: 'formats',
  brand: 'brands',
  category: 'categories',
  subcategory: 'subcategories',
  fashionGrade: 'fashion_grades',
};

function filtersFromSearch(search: string): CategoryDirectorFilters {
  const params = new URLSearchParams(search);
  const defaults = getDefaultCategoryDirectorFilters();
  const get = (urlKey: string, storeKey: keyof CategoryDirectorFilters): string => {
    if (!params.has(urlKey)) return defaults[storeKey];
    const raw = params.get(urlKey);
    return raw?.trim() || defaults[storeKey];
  };
  return {
    dateFrom: params.has('from_date') ? (params.get('from_date')?.trim() ?? defaults.dateFrom) : defaults.dateFrom,
    dateTo: params.has('to_date') ? (params.get('to_date')?.trim() ?? defaults.dateTo) : defaults.dateTo,
    format: get('formats', 'format'),
    brand: get('brands', 'brand'),
    category: get('categories', 'category'),
    subcategory: get('subcategories', 'subcategory'),
    fashionGrade: get('fashion_grades', 'fashionGrade'),
  };
}

function withFilterQuery(search: string, filters: CategoryDirectorFilters): string {
  const params = new URLSearchParams(search);
  for (const [key, q] of Object.entries(FILTER_QUERY_MAP) as [keyof CategoryDirectorFilters, string][]) {
    const value = filters[key];
    if (key === 'dateFrom' || key === 'dateTo') {
      if (value) params.set(q, value);
      else params.delete(q);
      continue;
    }
    if (value && value !== 'all') params.set(q, value);
    else params.delete(q);
  }
  const next = params.toString();
  return next ? `?${next}` : '';
}

export function CategoryDirectorDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { success: toastSuccess } = useToast();

  // Set persona store so InsightsListing on /review reads the correct persona
  const setPersona = usePersonaStore((s) => s.setPersona);
  useEffect(() => { setPersona('category-director'); }, [setPersona]);
  const tabParam = new URLSearchParams(location.search).get('tab');
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam! : TABS[0].id;
  useGlossaryTab(TABS.find((t) => t.id === activeTab)?.name);

  const { filters, setFilter, clearFilters, hasActiveFilters } = useCategoryDirectorFilterStore();
  // Draft → applied gate. The store IS the draft (chip-level Apply commits to it);
  // `appliedFilters` is the snapshot tab components consume. Changes only reach
  // the BE when the user clicks the global "Apply Filters" button. Matches the
  // CEO /dashboard pattern (DashboardPage.tsx) — keeps slow BQ calls batched.
  // See docs/references/ui/ux-patterns.md "Global Filter Strip".
  const [appliedFilters, setAppliedFilters] = useState<CategoryDirectorFilters>(filters);
  const filtersChanged = categoryDirectorFilterKey(filters) !== categoryDirectorFilterKey(appliedFilters);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Cascading filter options from API — when present, replace hardcoded lists.
  // Falls back to hardcoded options on load / error so the page never renders
  // empty dropdowns. The mock-only tabs ignore filter values either way.
  const { data: apiFilters } = useFilterOptions(filters);
  const liveFormatOptions = useMemo(
    () => withAllOption(apiFilters?.formats, formatOptions),
    [apiFilters?.formats],
  );
  const liveBrandOptions = useMemo(
    () => withAllOption(apiFilters?.brands, brandOptions),
    [apiFilters?.brands],
  );
  const liveCategoryOptions = useMemo(
    () => withAllOption(apiFilters?.categories, categoryFallbackOptions),
    [apiFilters?.categories],
  );
  const liveSubcategoryOptions = useMemo(
    () => withAllOption(apiFilters?.subcategories, subcategoryFallbackOptions),
    [apiFilters?.subcategories],
  );
  const liveFashionGradeOptions = useMemo(
    () => withAllOption(apiFilters?.fashion_grades, fashionGradeOptions),
    [apiFilters?.fashion_grades],
  );

  const catPreselected = useRef(false);
  useEffect(() => {
    if (catPreselected.current || liveCategoryOptions.length === 0) return;
    const current = filters.category;
    if (current && current !== 'all') {
      catPreselected.current = true;
      return;
    }
    catPreselected.current = true;
    const apiLookup = new Map(
      liveCategoryOptions.map((o) => [stripIndexPrefix(o.value).toUpperCase(), o.value]),
    );
    const resolved = PRESELECTED_CATEGORY_NAMES
      .map((name) => apiLookup.get(name.toUpperCase()))
      .filter((v): v is string => v !== undefined);
    if (resolved.length > 0) {
      const joined = resolved.join(',');
      setFilter('category', joined);
      setAppliedFilters((prev) => ({ ...prev, category: joined }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time preselection when API options first load
  }, [liveCategoryOptions]);

  const applyFiltersToUrl = useCallback(
    (nextFilters: CategoryDirectorFilters) => {
      const nextSearch = withFilterQuery(location.search, nextFilters);
      const currentSearch = location.search || '';
      if (nextSearch !== currentSearch) {
        navigate({ pathname: '/dashboard', search: nextSearch }, { replace: true });
      }
    },
    [location.search, navigate],
  );

  // URL → store sync (back/forward + reload)
  useEffect(() => {
    const parsed = filtersFromSearch(location.search);
    const current = useCategoryDirectorFilterStore.getState().filters;
    if (categoryDirectorFilterKey(parsed) === categoryDirectorFilterKey(current)) return;
    useCategoryDirectorFilterStore.setState({ filters: parsed });
    setAppliedFilters(parsed);
  }, [location.search]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(location.search);
    if (value === TABS[0].id) params.delete('tab');
    else params.set('tab', value);
    const next = params.toString();
    navigate(`/dashboard${next ? `?${next}` : ''}`, { replace: true });
  };

  // ── Mobile filter sheet config (mirrors /dashboard) ─────────────────────

  const mobileFilterDefs: FilterDef[] = useMemo(
    () => [
      { type: 'daterange', key: 'date', label: 'Date Range', minDate: '2026-04-01', maxDate: getDataAvailableThroughDateIso() },
      { type: 'multiselect', key: 'format', label: 'Format', options: liveFormatOptions },
      { type: 'multiselect', key: 'brand', label: 'Brand', options: liveBrandOptions },
      { type: 'multiselect', key: 'category', label: 'Category', options: liveCategoryOptions },
      { type: 'multiselect', key: 'subcategory', label: 'Subcategory', options: liveSubcategoryOptions },
      { type: 'multiselect', key: 'fashionGrade', label: 'Grade', options: liveFashionGradeOptions },
    ],
    [
      liveFormatOptions,
      liveBrandOptions,
      liveCategoryOptions,
      liveSubcategoryOptions,
      liveFashionGradeOptions,
    ],
  );

  const mobileFilterValues = useMemo(
    () => ({
      date: `${filters.dateFrom}|${filters.dateTo}`,
      format: filters.format,
      brand: filters.brand,
      category: filters.category,
      subcategory: filters.subcategory,
      fashionGrade: filters.fashionGrade,
    }),
    [filters],
  );

  const mobileActiveFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateFrom || filters.dateTo) count++;
    for (const key of ['format', 'brand', 'category', 'subcategory', 'fashionGrade'] as const) {
      if (filters[key] && filters[key] !== 'all') count++;
    }
    return count;
  }, [filters]);

  const handleMobileFilterApply = useCallback(
    (vals: Record<string, string>) => {
      const [dateFrom, dateTo] = (vals.date ?? '|').split('|');
      setFilter('dateFrom', dateFrom ?? '');
      setFilter('dateTo', dateTo ?? '');
      for (const key of ['format', 'brand', 'category', 'subcategory', 'fashionGrade'] as const) {
        setFilter(key, vals[key] ?? 'all');
      }
      // Mobile sheet's Apply commits draft AND applied in one shot — no
      // separate global Apply step on mobile.
      const next: CategoryDirectorFilters = {
        dateFrom: dateFrom ?? '',
        dateTo: dateTo ?? '',
        format: vals.format ?? 'all',
        brand: vals.brand ?? 'all',
        category: vals.category ?? 'all',
        subcategory: vals.subcategory ?? 'all',
        fashionGrade: vals.fashionGrade ?? 'all',
      };
      setAppliedFilters(next);
      applyFiltersToUrl(next);
    },
    [setFilter, applyFiltersToUrl],
  );

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filters);
    applyFiltersToUrl(filters);
  }, [filters, applyFiltersToUrl]);

  const handleClearAllFilters = useCallback(() => {
    clearFilters();
    const reset = getDefaultCategoryDirectorFilters();
    setAppliedFilters(reset);
    applyFiltersToUrl(reset);
    toastSuccess('Filters have been cleared');
  }, [clearFilters, applyFiltersToUrl, toastSuccess]);

  return (
    <div className="space-y-4 animate-fadeInUp">
      <MorningBriefing />

      {/* Data scope notice — surfaces the T-2 data lag (matches CEO dashboard). */}
      <PageInfoBanners note={getDataScopeSnapshotNote()} />

      {/* Mobile filter sheet — portal, must stay mounted outside the sticky region */}
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

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Sticky control bar — filters + tab strip stay pinned while content scrolls */}
        <div className="sticky top-0 z-20 -mx-4 px-4 py-3 space-y-3 bg-gray-50/90 backdrop-blur-sm">
          {isMobile ? (
            <MobileFilterTrigger
              activeCount={mobileActiveFilterCount}
              onOpen={() => setMobileFilterOpen(true)}
            />
          ) : (
            <FilterBar>
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
              {/* Sub-Category sits immediately after Category by design — they're
                  read together as a hierarchy. See ux-patterns.md "Global Filter Strip". */}
              <FilterMultiSelect
                value={filters.subcategory}
                onChange={(v) => setFilter('subcategory', v)}
                options={liveSubcategoryOptions}
                placeholder="Sub-Category"
              />
              <FilterMultiSelect
                value={filters.fashionGrade}
                onChange={(v) => setFilter('fashionGrade', v)}
                options={liveFashionGradeOptions}
                placeholder="Grade"
              />
              {filtersChanged && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApplyFilters}
                  className="text-nowrap"
                >
                  Apply Filters
                </Button>
              )}
              {hasActiveFilters() && (
                <FilterClear
                  className="text-nowrap border p-2 rounded-lg border-gray-300"
                  onClear={handleClearAllFilters}
                />
              )}
            </FilterBar>
          )}

          <TabsList variant="underline">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} variant="underline">
                <tab.icon className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{tab.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="ww-performance"><CategoryPerformanceTab filters={appliedFilters} /></TabsContent>
        <TabsContent value="ww-inventory"><InventoryLifecycleTab filters={appliedFilters} /></TabsContent>
        {/* HIDDEN — Store & Distribution tab panel. To unhide: uncomment + re-add MapPin to lucide imports + re-add StoreDistributionTab import. */}
        {/* <TabsContent value="ww-stores"><StoreDistributionTab filters={appliedFilters} /></TabsContent> */}
        {/* HIDDEN — Supply & OTB tab panel awaiting data/UX sign-off. To unhide: uncomment. */}
        {/* <TabsContent value="ww-supply"><SupplyOTBTab filters={appliedFilters} /></TabsContent> */}
      </Tabs>
    </div>
  );
}
