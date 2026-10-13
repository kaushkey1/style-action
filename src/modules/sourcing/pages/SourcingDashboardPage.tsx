import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// `Target` icon removed with Quality & Materials tab — restore when un-hidden (see backlog #80).
import { Users, PackageCheck, Truck, ChevronDown, ChevronUp } from 'lucide-react';
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
import { SourcingMorningBriefing } from '../components/SourcingMorningBriefing';
import { VendorClusterTab } from '../components/VendorClusterTab';
import { POPipelineTab } from '../components/POPipelineTab';
import { LogisticsSLATab } from '../components/LogisticsSLATab';
// `QualityMaterialsTab` import removed with the tab — restore when un-hidden (see backlog #80).
// import { QualityMaterialsTab } from '../components/QualityMaterialsTab';
import {
  useSourcingFilterStore,
  sourcingFilterKey,
  getDefaultSourcingFilters,
  type SourcingFilters,
  formatOptions,
  brandOptions,
  fashionGradeOptions,
  siteTypeOptions,
  categoryFallbackOptions,
  subcategoryFallbackOptions,
} from '../stores/useSourcingFilterStore';
import { useClusterOptionsStore } from '../stores/useClusterOptionsStore';
import { useFilterOptions } from '../api/sourcingDirectorHooks';
import { stripIndexPrefix } from '@/modules/category-director/lib/apiAdapters';
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
  { id: 'src-vendor-cluster', name: 'Vendor & Cluster Teams', icon: Users },
  { id: 'src-po-pipeline', name: 'PO Pipeline', icon: PackageCheck },
  { id: 'src-logistics-sla', name: 'Logistics & SLA', icon: Truck },
  // HIDDEN — Quality & Materials tab has no live API data (entire tab is a documented data gap).
  // Tracked in docs/backlog/unsorted.md #80. Restore this entry when the QC inspection table
  // and fabric inventory table land on the backend.
  // { id: 'src-quality-materials', name: 'Quality & Materials', icon: Target },
] as const;

export function SourcingDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { success: toastSuccess } = useToast();
  const tabParam = new URLSearchParams(location.search).get('tab');
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam! : TABS[0].id;
  useGlossaryTab(TABS.find((t) => t.id === activeTab)?.name);

  const { filters, setFilter, clearFilters, hasActiveFilters } = useSourcingFilterStore();
  // Draft → applied gate. The store IS the draft (chip-level Apply commits to it);
  // `appliedFilters` is the snapshot tab components consume. Changes only reach
  // the BE when the user clicks the global "Apply Filters" button. Matches the
  // CEO /dashboard pattern. See docs/references/ui/ux-patterns.md "Global Filter Strip".
  const [appliedFilters, setAppliedFilters] = useState<SourcingFilters>(filters);
  const filtersChanged = sourcingFilterKey(filters) !== sourcingFilterKey(appliedFilters);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Cascading filter options from API — when present, replace hardcoded lists.
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

  // Cluster options come from the Vendor & Cluster Teams scorecard — /filters
  // doesn't return them. Tab 1 populates this store on every successful fetch.
  // No 'all' sentinel row — Select All checkbox handles that.
  const apiClusters = useClusterOptionsStore((s) => s.clusters);
  const liveClusterOptions = useMemo(
    () => apiClusters.map((c) => ({ value: c, label: c })),
    [apiClusters],
  );

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(location.search);
    if (value === TABS[0].id) params.delete('tab');
    else params.set('tab', value);
    const next = params.toString();
    navigate(`/dashboard${next ? `?${next}` : ''}`, { replace: true });
  };

  // ── Mobile filter sheet config ─────────────────────────────────────────

  const mobileFilterDefs: FilterDef[] = useMemo(
    () => [
      { type: 'daterange', key: 'date', label: 'Date Range' },
      { type: 'multiselect', key: 'format', label: 'Format', options: liveFormatOptions },
      { type: 'multiselect', key: 'brand', label: 'Brand', options: liveBrandOptions },
      { type: 'multiselect', key: 'category', label: 'Category', options: liveCategoryOptions },
      { type: 'multiselect', key: 'subcategory', label: 'Subcategory', options: liveSubcategoryOptions },
      { type: 'multiselect', key: 'siteType', label: 'Site Type', options: siteTypeOptions },
      { type: 'multiselect', key: 'clusters', label: 'Cluster', options: liveClusterOptions },
      { type: 'multiselect', key: 'fashionGrade', label: 'Grade', options: liveFashionGradeOptions },
    ],
    [
      liveFormatOptions, liveBrandOptions, liveCategoryOptions, liveSubcategoryOptions,
      liveFashionGradeOptions, liveClusterOptions,
    ],
  );

  const mobileFilterValues = useMemo(
    () => ({
      date: `${filters.dateFrom}|${filters.dateTo}`,
      format: filters.format,
      brand: filters.brand,
      category: filters.category,
      subcategory: filters.subcategory,
      siteType: filters.siteType,
      clusters: filters.clusters,
      fashionGrade: filters.fashionGrade,
    }),
    [filters],
  );

  const mobileActiveFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateFrom || filters.dateTo) count++;
    for (const key of ['format', 'brand', 'category', 'subcategory', 'siteType', 'clusters', 'fashionGrade'] as const) {
      if (filters[key] && filters[key] !== 'all') count++;
    }
    return count;
  }, [filters]);

  const handleMobileFilterApply = useCallback(
    (vals: Record<string, string>) => {
      const [dateFrom, dateTo] = (vals.date ?? '|').split('|');
      setFilter('dateFrom', dateFrom ?? '');
      setFilter('dateTo', dateTo ?? '');
      for (const key of ['format', 'brand', 'category', 'subcategory', 'siteType', 'clusters', 'fashionGrade'] as const) {
        setFilter(key, vals[key] ?? 'all');
      }
      // Mobile sheet's Apply commits both draft AND applied in one shot.
      const next: SourcingFilters = {
        dateFrom: dateFrom ?? '',
        dateTo: dateTo ?? '',
        format: vals.format ?? 'all',
        brand: vals.brand ?? 'all',
        category: vals.category ?? 'all',
        subcategory: vals.subcategory ?? 'all',
        siteType: vals.siteType ?? 'all',
        clusters: vals.clusters ?? 'all',
        fashionGrade: vals.fashionGrade ?? 'all',
      };
      setAppliedFilters(next);
    },
    [setFilter],
  );

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filters);
  }, [filters]);

  const handleClearAllFilters = useCallback(() => {
    clearFilters();
    setAppliedFilters(getDefaultSourcingFilters());
    toastSuccess('Filters have been cleared');
  }, [clearFilters, toastSuccess]);

  return (
    <div className="space-y-4 animate-fadeInUp">
      <SourcingMorningBriefing />

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
                value={filters.siteType}
                onChange={(v) => setFilter('siteType', v)}
                options={siteTypeOptions}
                placeholder="Site Type"
              />
              {showMoreFilters && (
                <>
                  <FilterMultiSelect
                    value={filters.clusters}
                    onChange={(v) => setFilter('clusters', v)}
                    options={liveClusterOptions}
                    placeholder="Cluster"
                  />
                  <FilterMultiSelect
                    value={filters.fashionGrade}
                    onChange={(v) => setFilter('fashionGrade', v)}
                    options={liveFashionGradeOptions}
                    placeholder="Grade"
                  />
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMoreFilters((v) => !v)}
                className="text-xs inline-flex text-nowrap"
              >
                {showMoreFilters ? 'Less filters' : 'More filters'}
                {showMoreFilters ? (
                  <ChevronUp className="w-3 h-3 ml-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-1" />
                )}
              </Button>
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

        <TabsContent value="src-vendor-cluster"><VendorClusterTab filters={appliedFilters} /></TabsContent>
        <TabsContent value="src-po-pipeline"><POPipelineTab filters={appliedFilters} /></TabsContent>
        <TabsContent value="src-logistics-sla"><LogisticsSLATab filters={appliedFilters} /></TabsContent>
        {/* HIDDEN — Quality & Materials tab (backlog #80). Restore alongside the TABS entry above. */}
        {/* <TabsContent value="src-quality-materials"><QualityMaterialsTab filters={appliedFilters} /></TabsContent> */}
      </Tabs>
    </div>
  );
}
