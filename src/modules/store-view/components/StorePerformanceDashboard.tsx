import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import {
  FilterBar,
  FilterMultiSelect,
  FilterSelect,
  FilterClear,
  MobileFilterTrigger,
  MobileFilterSheet,
  Button,
} from "@/components/ui";
import type { FilterDef } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useToast } from "@/hooks/useToast";
import { useThresholds } from "@/hooks/useThresholds";
import { PageInfoBanners } from "@/components/data-scope/PageInfoBanners";
import {
  useStoreList,
  useKpiSummary,
  useClusterData,
  useFilterGrades,
  useFilterFormats,
  useFilterRegions,
  useFilterCities,
} from "../api/storePerformanceHooks";
import {
  useStorePerformanceFilterStore,
  storePerformanceFilterKey,
  toApiParams,
  getPresetDateRange,
} from "../stores/useStorePerformanceFilterStore";
import type { StorePerformanceFilters } from "../stores/useStorePerformanceFilterStore";
import { dashboardApi } from "@/modules/dashboard/api/dashboardApi";
import type { FilterOptionsResponse } from "@/modules/dashboard/api/dashboardApi";
import { PRESELECTED_CATEGORY_NAMES } from "@/modules/dashboard/stores/useDashboardFilterStore";
import { StoreKpiCards } from "./StoreKpiCards";
import { StoreClusterCharts } from "./StoreClusterCharts";
import { StoreDetailsTable } from "./StoreDetailsTable";
import { StockLevelChart } from "./StockLevelChart";
import { StoreGradeCards } from "./StoreGradeCards";
import { fetchScopeInsights } from "../api/insightsApi";
import { InsightsBanner } from "./InsightsBanner";
import { useStoreDistribution } from "@/modules/category-director/api/categoryDirectorHooks";
import type { CategoryDirectorFilters } from "@/modules/category-director/stores/useCategoryDirectorFilterStore";
import { getDefaultCategoryDirectorFilters } from "@/modules/category-director/stores/useCategoryDirectorFilterStore";

const DATE_PRESETS = [
  { key: "last-month", label: "Last Month" },
  { key: "mtd", label: "MTD" },
  { key: "qtd", label: "QTD" },
];

function stripPrefix(v: string): string {
  return v.replace(/^\d+\.\s*/, '');
}

function toMultiOptions(values: string[] | undefined): { value: string; label: string }[] {
  if (!values?.length) return [];
  return values.map((v) => ({ value: v, label: v }));
}

function toCategoryOptions(values: string[] | undefined): { value: string; label: string }[] {
  if (!values?.length) return [];
  return values.map((v) => ({ value: v, label: stripPrefix(v) }));
}

/* ── Top-level tab row: Overview (this dashboard) + IP Health Dashboard ──
 * "IP Health Dashboard" is a hover menu, not a page — it only reveals the
 * three sub-apps. Wire real routes to the items when they exist. */

const IP_HEALTH_ITEMS: { label: string; path?: string; comingSoon?: boolean }[] = [
  { label: "Companion App", path: "companion-app" },
  { label: "KIOSK", comingSoon: true },
  { label: "PulsePoint", comingSoon: true },
];

function DashboardTabs(): React.ReactNode {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const base = pathname.startsWith("/jarvis") ? "/jarvis" : "/command";

  const triggerCls = (active: boolean) =>
    cn(
      "-mb-px border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors",
      active
        ? "border-primary text-primary"
        : "border-transparent text-gray-600 hover:text-gray-900",
    );

  return (
    <div className="flex items-stretch gap-6 border-b border-gray-200">
      <span className={triggerCls(true)}>Overview</span>

      <div className="group relative">
        <button
          type="button"
          aria-haspopup="menu"
          className={cn(triggerCls(false), "inline-flex items-center gap-1.5")}
        >
          IP Health Dashboard
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </button>
        {/* Wrapper carries pt-1 as an invisible bridge so the cursor can cross
            the gap to the menu without leaving the group (which would hide it). */}
        <div className="invisible absolute left-0 top-full z-30 pt-1 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
          <div role="menu" className="w-56 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
            {IP_HEALTH_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.comingSoon}
                onClick={item.path ? () => navigate(`${base}/${item.path}`) : undefined}
                className={cn(
                  "block w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                  item.comingSoon
                    ? "cursor-not-allowed text-gray-400"
                    : "text-gray-700 hover:bg-gray-50",
                )}
              >
                {item.label}
                {item.comingSoon && <span className="ml-1.5 text-xs text-gray-400">(coming soon)</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StorePerformanceDashboard(): React.ReactNode {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const thresholds = useThresholds();
  const [searchParams, setSearchParams] = useSearchParams();
  const { success: toastSuccess } = useToast();

  const { data: storeInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights', 'store-view'],
    queryFn: () => fetchScopeInsights('store-view'),
    staleTime: 5 * 60 * 1000,
  });

  const { filters, setFilter, clearFilters } = useStorePerformanceFilterStore();

  // On mount, rehydrate Zustand store + local state from URL params so back-nav restores filters correctly.
  const urlSeeded = useRef(false);
  if (!urlSeeded.current && searchParams.size > 0) {
    urlSeeded.current = true;
    const urlDateFrom = searchParams.get('dateFrom');
    const urlDateTo = searchParams.get('dateTo');
    const urlFormat = searchParams.get('format');
    const urlGrade = searchParams.get('grade');
    const urlRegion = searchParams.get('region');
    const urlCity = searchParams.get('city');
    const urlCategory = searchParams.get('category');
    if (urlDateFrom) { useStorePerformanceFilterStore.getState().setFilter('dateFrom', urlDateFrom); }
    if (urlDateTo) { useStorePerformanceFilterStore.getState().setFilter('dateTo', urlDateTo); }
    if (urlFormat) { useStorePerformanceFilterStore.getState().setFilter('format', urlFormat); }
    if (urlGrade) { useStorePerformanceFilterStore.getState().setFilter('cluster', urlGrade); }
    if (urlRegion) { useStorePerformanceFilterStore.getState().setFilter('region', urlRegion); }
    if (urlCity) { useStorePerformanceFilterStore.getState().setFilter('city', urlCity); }
    if (urlCategory) { useStorePerformanceFilterStore.getState().setFilter('category', urlCategory); }
  }

  const urlPeriod = searchParams.get('period') ?? 'last-month';

  const [appliedFilters, setAppliedFilters] = useState<StorePerformanceFilters>(() => {
    const base = useStorePerformanceFilterStore.getState().filters;
    return { ...base };
  });
  const filtersChanged = storePerformanceFilterKey(filters) !== storePerformanceFilterKey(appliedFilters);

  const [activePreset, setActivePreset] = useState<string>(urlPeriod);
  const [appliedPreset, setAppliedPreset] = useState<string>(urlPeriod);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);


  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On first mount with no URL params, write the current applied filters to URL so sharing/refresh works.
  useEffect(() => {
    if (searchParams.size === 0) {
      const f = appliedFilters;
      const p = appliedPreset;
      const params: Record<string, string> = {};
      if (f.dateFrom) params.dateFrom = f.dateFrom;
      if (f.dateTo) params.dateTo = f.dateTo;
      if (p !== 'last-month') params.period = p;
      if (f.format !== 'all') params.format = f.format;
      if (f.cluster !== 'all') params.grade = f.cluster;
      if (f.region !== 'all') params.region = f.region;
      if (f.city !== 'all') params.city = f.city;
      if (f.category !== 'all') params.category = f.category;
      if (Object.keys(params).length > 0) {
        setSearchParams(params, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: seed URL from defaults once
  }, []);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const apiFilters = useMemo(() => {
    const params = toApiParams(appliedFilters);
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    } else {
      // Only pin store codes when not searching — search results should be unrestricted.
      params.store_codes = '5943,8053,8055,8080,TE94';
    }
    return params;
  }, [appliedFilters, debouncedSearch]);

  const { data: kpiData, isLoading: kpiLoading } = useKpiSummary(apiFilters);
  const { data: clusterData, isLoading: clusterLoading } = useClusterData(apiFilters);
  const { data: storeData, isLoading: storeLoading } = useStoreList(apiFilters, page, pageSize);

  const storeHealthFilters = useMemo<CategoryDirectorFilters>(() => {
    const defaults = getDefaultCategoryDirectorFilters();
    return {
      ...defaults,
      dateFrom: appliedFilters.dateFrom || defaults.dateFrom,
      dateTo: appliedFilters.dateTo || defaults.dateTo,
      format: appliedFilters.format !== "all" ? appliedFilters.format : "all",
      fashionGrade: appliedFilters.cluster !== "all" ? appliedFilters.cluster : "all",
    };
  }, [appliedFilters]);
  const { data: storeDistData, isLoading: distLoading } = useStoreDistribution(storeHealthFilters);
  const gradeRows = (() => {
    const health = storeDistData?.store_health_by_grade ?? [];
    const perf = storeDistData?.store_performance_by_grade ?? [];
    if (perf.length === 0) return health;
    const perfByGrade = new Map(perf.map((r) => [r.store_grade.toUpperCase(), r]));
    return health.map((row) => ({ ...row, ...perfByGrade.get(row.store_grade.toUpperCase()) }));
  })();

  const { data: gradesData } = useFilterGrades();
  const { data: formatsData } = useFilterFormats();
  const { data: regionsData } = useFilterRegions();
  const { data: citiesData } = useFilterCities(apiFilters);

  const [categoryFilterOptions, setCategoryFilterOptions] =
    useState<FilterOptionsResponse | null>(null);

  useEffect(() => {
    dashboardApi
      .filterOptions()
      .then(setCategoryFilterOptions)
      .catch(() => {});
     
  }, []);

  const categoryOptions = useMemo(
    () => toCategoryOptions(categoryFilterOptions?.categories),
    [categoryFilterOptions],
  );

  const catPreselected = useRef(false);
  useEffect(() => {
    if (catPreselected.current || categoryOptions.length === 0) return;

    // Deep-link: a drill can pre-filter the store list by ?category= (matched to a real option,
    // prefix-stripped + case-insensitive). subCategory is carried in the URL but store view has no
    // sub-category filter dimension, so it can't be applied here. Destination side only.
    const deepCat = searchParams.get('category');
    if (deepCat) {
      catPreselected.current = true;
      const apiLookup = new Map(categoryOptions.map((o) => [stripPrefix(o.value).toUpperCase(), o.value]));
      const resolved = apiLookup.get(stripPrefix(deepCat).toUpperCase());
      if (resolved) {
        setFilter('category', resolved);
        setAppliedFilters((prev) => ({ ...prev, category: resolved }));
      }
      return;
    }

    const current = filters.category;
    if (current && current !== 'all') {
      catPreselected.current = true;
      return;
    }
    catPreselected.current = true;
    const apiLookup = new Map(categoryOptions.map((o) => [stripPrefix(o.value).toUpperCase(), o.value]));
    const resolved = PRESELECTED_CATEGORY_NAMES
      .map((name) => apiLookup.get(name.toUpperCase()))
      .filter((v): v is string => v !== undefined);
    if (resolved.length > 0) {
      const joined = resolved.join(',');
      setFilter('category', joined);
      setAppliedFilters((prev) => {
        const next = { ...prev, category: joined };
        // Write defaults to URL now that category is resolved (only when URL has no params yet).
        setSearchParams((existing) => {
          if (!existing.get('category')) {
            const p: Record<string, string> = {};
            Object.entries(existing).forEach(([k, v]) => { p[k] = v; });
            existing.forEach((v, k) => { p[k] = v; });
            p.category = joined;
            return p;
          }
          return existing;
        }, { replace: true });
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time preselection when API options first load
  }, [categoryOptions]);

  const gradeOptions = useMemo(() => toMultiOptions(gradesData?.grades), [gradesData]);
  const formatOptions = useMemo(() => toMultiOptions(formatsData?.formats), [formatsData]);
  const regionOptions = useMemo(() => toMultiOptions(regionsData?.regions), [regionsData]);
  const cityOptions = useMemo(() => toMultiOptions(citiesData?.cities), [citiesData]);

  // The resolved preselected category string is the "cleared" baseline for the category filter.
  // It must not count as an active filter — the Clear button should disappear after clearing.
  const defaultCategory = useMemo(() => {
    if (categoryOptions.length === 0) return 'all';
    const apiLookup = new Map(categoryOptions.map((o) => [stripPrefix(o.value).toUpperCase(), o.value]));
    const resolved = PRESELECTED_CATEGORY_NAMES
      .map((name) => apiLookup.get(name.toUpperCase()))
      .filter((v): v is string => v !== undefined);
    return resolved.length > 0 ? resolved.join(',') : 'all';
  }, [categoryOptions]);


  // Deep-link: seed format / region / city from the URL once their option lists load (defensive match).
  const miscSeeded = useRef(false);
  useEffect(() => {
    if (miscSeeded.current) return;
    const fmt = searchParams.get('format');
    const region = searchParams.get('region');
    const city = searchParams.get('city');
    if (!fmt && !region && !city) { miscSeeded.current = true; return; }
    if (fmt && formatOptions.length === 0) return;
    if (region && regionOptions.length === 0) return;
    if (city && cityOptions.length === 0) return;
    miscSeeded.current = true;
    const ci = (v: string, list: { value: string }[]): string | undefined =>
      list.find((o) => o.value.toLowerCase() === v.toLowerCase())?.value;
    const fmtMatch = fmt ? ci(fmt, formatOptions) : undefined;
    const regionMatch = region ? ci(region, regionOptions) : undefined;
    const cityMatch = city ? ci(city, cityOptions) : undefined;
    if (fmtMatch) { setFilter('format', fmtMatch); setAppliedFilters((p) => ({ ...p, format: fmtMatch })); }
    if (regionMatch) { setFilter('region', regionMatch); setAppliedFilters((p) => ({ ...p, region: regionMatch })); }
    if (cityMatch) { setFilter('city', cityMatch); setAppliedFilters((p) => ({ ...p, city: cityMatch })); }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-seed once option lists load
  }, [formatOptions, regionOptions, cityOptions]);

  const writeFiltersToUrl = useCallback((f: StorePerformanceFilters, preset: string) => {
    const params: Record<string, string> = {};
    if (f.dateFrom) params.dateFrom = f.dateFrom;
    if (f.dateTo) params.dateTo = f.dateTo;
    if (preset !== 'last-month') params.period = preset;
    if (f.format !== 'all') params.format = f.format;
    if (f.cluster !== 'all') params.grade = f.cluster;
    if (f.region !== 'all') params.region = f.region;
    if (f.city !== 'all') params.city = f.city;
    if (f.category !== 'all') params.category = f.category;
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filters);
    setAppliedPreset(activePreset);
    setPage(1);
    writeFiltersToUrl(filters, activePreset);
    toastSuccess("Filters applied");
  }, [filters, activePreset, toastSuccess, writeFiltersToUrl]);

  const handleClearAllFilters = useCallback(() => {
    clearFilters();
    const cleared = useStorePerformanceFilterStore.getState().filters;
    if (defaultCategory !== 'all') {
      useStorePerformanceFilterStore.getState().setFilter('category', defaultCategory);
    }
    const withCategory = { ...cleared, category: defaultCategory };
    setAppliedFilters(withCategory);
    setActivePreset("last-month");
    setAppliedPreset("last-month");
    setPage(1);
    const params: Record<string, string> = {};
    if (cleared.dateFrom) params.dateFrom = cleared.dateFrom;
    if (cleared.dateTo) params.dateTo = cleared.dateTo;
    if (defaultCategory !== 'all') params.category = defaultCategory;
    setSearchParams(params, { replace: true });
    toastSuccess("Filters cleared");
  }, [clearFilters, toastSuccess, setSearchParams, defaultCategory]);

  const handlePresetClick = useCallback(
    (presetKey: string) => {
      const range = getPresetDateRange(presetKey);
      if (range) {
        setFilter("dateFrom", range.from);
        setFilter("dateTo", range.to);
        setActivePreset(presetKey);
        // Period selection auto-applies and immediately syncs to URL so back-nav restores it.
        const updated = { ...useStorePerformanceFilterStore.getState().filters, dateFrom: range.from, dateTo: range.to };
        setAppliedFilters(updated);
        setAppliedPreset(presetKey);
        setPage(1);
        writeFiltersToUrl(updated, presetKey);
      }
    },
    [setFilter, writeFiltersToUrl],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const mobileFilterDefs: FilterDef[] = [
    {
      type: "multiselect",
      key: "format",
      label: "Format",
      options: formatOptions,
    },
    {
      type: "multiselect",
      key: "cluster",
      label: "Grade",
      options: gradeOptions,
    },
    {
      type: "multiselect",
      key: "region",
      label: "Region",
      options: regionOptions,
    },
    {
      type: "multiselect",
      key: "category",
      label: "Category",
      options: categoryOptions,
    },
    {
      type: "multiselect",
      key: "city",
      label: "City",
      options: cityOptions,
    },
  ];

  const mobileFilterValues: Record<string, string> = {
    date: `${filters.dateFrom}|${filters.dateTo}`,
    format: filters.format,
    cluster: filters.cluster,
    category: filters.category,
    region: filters.region,
    city: filters.city,
  };

  const mobileActiveFilterCount =
    [filters.format, filters.cluster, filters.category, filters.region, filters.city].filter((v) => v !== "all").length +
    (filters.dateFrom ? 1 : 0);

  const handleMobileFilterApply = useCallback(
    (values: Record<string, string>) => {
      const [from = "", to = ""] = (values["date"] ?? "").split("|");
      setFilter("dateFrom", from);
      setFilter("dateTo", to);
      setFilter("format", values["format"] ?? "all");
      setFilter("cluster", values["cluster"] ?? "all");
      setFilter("category", values["category"] ?? "all");
      setFilter("region", values["region"] ?? "all");
      setFilter("city", values["city"] ?? "all");
      const updated = useStorePerformanceFilterStore.getState().filters;
      setAppliedFilters(updated);
      setPage(1);
    },
    [setFilter],
  );

  return (
    <div className="space-y-4 animate-fadeInUp lg:-mt-2">
      <h1 className="sr-only">Store Performance Dashboard</h1>

      <DashboardTabs />

      {/* Morning briefing first — the AI-generated overview leads. */}
      {!insightsLoading && storeInsights && storeInsights.insights.length > 0 && (
        <InsightsBanner
          data={storeInsights}
          onViewAll={() => navigate('/review?tab=insights&from=store-view')}
          onOpenInsight={(id) => navigate(`/review?tab=insights&insight=${id}&from=store-view`)}
          drillFrom="store-view"
        />
      )}

      {/* Data scope note sits below the briefing — it's metadata, not the headline. */}
      <PageInfoBanners note="Store performance data refreshed on a T-2 cycle. Default view: Last Month." />

      {/* Mobile filter sheet */}
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

      {/* Filter bar — z-30 so it sits above the table's sticky header (z-20) and
          frozen store column (z-10), which share this scroll container. */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-gray-50/90 backdrop-blur-sm">
        {isMobile ? (
          <MobileFilterTrigger activeCount={mobileActiveFilterCount} onOpen={() => setMobileFilterOpen(true)} />
        ) : (
          <FilterBar className="!mb-0">
            <FilterSelect
              value={activePreset}
              onChange={handlePresetClick}
              options={DATE_PRESETS.map((p) => ({ value: p.key, label: p.label }))}
              placeholder="Date range"
            />
            <FilterMultiSelect
              value={filters.format}
              onChange={(v) => setFilter("format", v)}
              options={formatOptions}
              placeholder="Format"
            />
            <FilterMultiSelect
              value={filters.cluster}
              onChange={(v) => setFilter("cluster", v)}
              options={gradeOptions}
              placeholder="Grade"
            />
            <FilterMultiSelect
              value={filters.category}
              onChange={(v) => setFilter("category", v)}
              options={categoryOptions}
              placeholder="Category"
            />
            <FilterMultiSelect
              value={filters.region}
              onChange={(v) => setFilter("region", v)}
              options={regionOptions}
              placeholder="Region"
            />
            <FilterMultiSelect
              value={filters.city}
              onChange={(v) => setFilter("city", v)}
              options={cityOptions}
              placeholder="City"
            />
            {filtersChanged && (
              <Button size="sm" onClick={handleApplyFilters} className="text-xs text-nowrap">
                Apply Filters
              </Button>
            )}
            <FilterClear
              className="text-nowrap border p-2 rounded-lg border-gray-300"
              onClear={handleClearAllFilters}
            />
          </FilterBar>
        )}
      </div>

      {/* KPI Cards */}
      <StoreKpiCards data={kpiData} isLoading={kpiLoading} />

      {/* Charts: AOP vs Actual + Stock Level by Grade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StoreClusterCharts data={clusterData} isLoading={clusterLoading} />
        <StockLevelChart rows={gradeRows} isLoading={distLoading} />
      </div>

      {/* Store Performance by Grade */}
      <StoreGradeCards rows={gradeRows} isLoading={distLoading} thresholds={thresholds} />

      {/* Store Details Table */}
      <StoreDetailsTable
        data={storeData}
        isLoading={storeLoading}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        search={search}
        onSearchChange={handleSearchChange}
        npsFilterType={appliedPreset.replace('-', '_')}
      />
    </div>
  );
}
