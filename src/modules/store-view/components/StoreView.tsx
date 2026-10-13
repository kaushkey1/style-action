/* eslint-disable design-system/prefer-section-header -- dense inline category expansion cards; compound components too heavy for this layout */
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, ExternalLink, Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { npsKeys, fetchNPSScoresBulk } from '../api/npsApi';
import type { Store, StoreGrade } from '../types/unified-planning.types';
import type { LifecyclePhase, PullbackSubType } from '@/modules/dashboard/data/mockAR';
import { Pagination, Input, FilterBar, FilterMultiSelect, EmptyState, Button, Badge, SectionHeader, MetricGrid, MetricCard, MobileFilterSheet, TableToolbar } from '@/components/ui';
import { PageInfoBanners } from '@/components/data-scope/PageInfoBanners';
import type { FilterDef } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { appApiFetch } from '@/lib/api';
import { useUnifiedPlanningStore } from '../stores/unified-planning.store';
import { ColumnFilterDropdown } from './ColumnFilterDropdown';
import type { ColumnItem } from './ColumnFilterDropdown';

// ── API response types ──

interface ApiStoreListItem {
  store_code: string;
  store_name: string;
  city: string | null;
  grade: string | null;
  region: string | null;
  format_std: string | null;
  sqft: number | null;
  monthly_revenue: number;
  options: number;
  total_usable_sqft: number | null;
}

interface ApiStoreListResponse {
  data: ApiStoreListItem[];
  total: number;
  limit: number;
  offset: number;
}

interface ApiCategoryData {
  category_desc: string;
  revenue: number;
  options: number;
  stock: number;
  noos_pct: number;
  fashion_pct: number;
  cover_days: number | null;
  sqft: number | null;
  gmrof_rs_per_sft: number | null;
  total_fixtures: number | null;
  otb: number | null;
  otb_remaining: number | null;
  pullback_qty: number | null;
  usable_sqft: number | null;
  replenisment_qty: number | null;
}

interface ApiPlanogramEntry {
  store_code: string;
  store_name: string;
  floor_name: string;
  floor_index: number;
  gcs_path: string;
  dg2n_url: string;
  status: string;
}

interface ApiStoreDetailResponse {
  store_code: string;
  store_name: string;
  city: string | null;
  region: string | null;
  sqft: number | null;
  categories: string[];
  aggregated_data: {
    month: string;
    fao_percentage: number;
    pl_percentage: number;
    revenue: number;
    options: number;
    total_options: number | null;
    options_in_stock: number | null;
    noos_pct: number;
    fashion_pct: number;
    aop: number;
    gross_sales: number | null;
    total_gross_margin: number | null;
    otb: number | null;
    stock: number;
    month_closing_stock_qty: number | null;
    ly_growth: number | null;
    nrm_pct: number | null;
    store_age_months: number | null;
    format_std: string | null;
  };
  category_level_split: ApiCategoryData[];
  planogram: ApiPlanogramEntry[];
}

// ── Map API listing item to Store type ──

function mapApiStoreToStore(item: ApiStoreListItem): Store {
  return {
    id: item.store_code,
    name: item.store_name || item.store_code,
    format: item.format_std || '',
    city: item.city || '',
    grade: (item.grade || '') as StoreGrade,
    region: item.region || '',
    state: '',
    sqft: item.sqft,
    totalUsableSqft: item.total_usable_sqft ?? null,
    monthlyRevenue: item.monthly_revenue ?? null,
    aop: null,
    options: item.options ?? 0,
    potentialNPI: 0,
    recoNPI: 100,
    ctrSth: 0,
    score: 0,
    categories: [],
    latitude: 0,
    longitude: 0,
    cluster: 'C1',
    clusterLabel: '',
    competitiveGapScore: 0,
    catchmentAffluence: 0,
    twinGapSpsf: 0,
    hasReclassificationTrigger: false,
  };
}

// ── Map API detail categories to category data ──

function mapApiCategoriesToCategories(categories: ApiCategoryData[]) {
  return categories.map((cat) => {
    const id = cat.category_desc.toLowerCase().replace(/['\s]+/g, '-').replace(/-+/g, '-');
    const noosPercent = Math.round(cat.noos_pct || 0);
    const fashionPercent = Math.round(cat.fashion_pct || 0);
    const otbTotal = cat.otb || 0;
    const otbRem = cat.otb_remaining || 0;

    return {
      id,
      name: cat.category_desc,
      salesMd: cat.revenue || 0,
      otbRem,
      options: cat.options || 0,
      cover: cat.cover_days || 0,
      otbBudget: 0,
      space: 0,
      targetAop: 0,
      targetLyChange: 0,
      buyingPlanned: 0,
      buyingActual: 0,
      rangeOpts: cat.options || 0,
      mosPercent: 0,
      qty: cat.stock || 0,
      fashionPercent,
      executionRecn: 0,
      executionMrpn: 0,
      fill: 0,
      spaceSqft: cat.sqft || 0,
      spaceSpsf: cat.gmrof_rs_per_sft || 0,
      spaceGmro1: '0.00',
      spaceGmrof: cat.gmrof_rs_per_sft || 0,
      fixtures: {
        wallBay: { count: 0, utilization: 0 },
        fourRail: { count: 0, utilization: 0 },
        nestedTable: { count: 0, utilization: 0 },
      },
      brands: [] as { name: string; base: number; wallbay: number; fourRail: number; nested: number }[],
      ftpTrends: [] as { name: string; value: number }[],
      stockAging: {
        totalQty: cat.stock || 0,
        segments: [] as { label: string; pct: number; qty: number; color: string }[],
        a3Pct: 0,
      },
      lifecyclePhase: 'A0' as LifecyclePhase,
      arPullbackCount: cat.pullback_qty ?? 0,
      arPullbackSubTypes: [] as { type: PullbackSubType; count: number }[],
      arReplenCount: 0,
      arReplenFillRate: 0,
      arRedistInCount: 0,
      arRedistOutCount: 0,
      fixtureConstraint: 'ok' as const,
      projectedRev: cat.revenue || 0,
      aopPercent: 0,
      lyGrowth: 0,
      otbTotal,
      replenishment: cat.replenisment_qty ?? 0,
      noosPercent,
      fashionPyramid: (() => {
        const coreBasic = noosPercent;
        const basic = Math.round(coreBasic * 0.35);
        const core = coreBasic - basic;
        const remaining = 100 - coreBasic;
        const trend = Math.round(remaining * 0.45);
        const fashion = remaining - trend;
        return { trend, fashion, core, basic };
      })(),
      noosStockoutItems: 0,
      usableSqft: cat.usable_sqft ?? null,
      totalFixtures: cat.total_fixtures ?? null,
    };
  });
}


interface StoreViewProps {
  selectedStoreId: string | null;
  onSelectStore: (storeId: string | null, storeData?: Partial<Store> | null) => void;
  yearMonth?: string;
  timePeriod?: 'MTD' | 'Last Month';
  onLoadingChange?: (loading: boolean) => void;
  onTotalChange?: (total: number) => void;
  hideCategories?: boolean;
}


type SortField = 'name' | 'city' | 'sqft' | 'monthlyRevenue' | 'options';
type SortDir = 'asc' | 'desc';
const PAGE_SIZE = 25;

// Sort columns for TableToolbar
const SORT_COLUMNS = [
  { key: 'name', label: 'Store Name' },
  { key: 'city', label: 'City' },
  { key: 'sqft', label: 'Sqft' },
  { key: 'monthlyRevenue', label: 'Revenue' },
  { key: 'options', label: 'Options' },
];

// Column definitions for ColumnFilterDropdown
type ColumnKey = 'format' | 'city' | 'grade' | 'region' | 'sqft' | 'usableSqft' | 'monthlyRevenue' | 'options' | 'npsScore';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  align: 'left' | 'center' | 'right';
  sortField?: SortField;
  defaultVisible: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'format', label: 'Format', align: 'left', defaultVisible: true },
  { key: 'city', label: 'City', align: 'left', sortField: 'city', defaultVisible: true },
  { key: 'grade', label: 'Grade', align: 'center', defaultVisible: true },
  { key: 'region', label: 'Region', align: 'center', defaultVisible: true },
  { key: 'sqft', label: 'Sqft', align: 'right', sortField: 'sqft', defaultVisible: true },
  { key: 'usableSqft', label: 'Usable Sqft', align: 'right', defaultVisible: true },
  { key: 'monthlyRevenue', label: 'Revenue', align: 'right', sortField: 'monthlyRevenue', defaultVisible: true },
  { key: 'options', label: 'Options', align: 'right', sortField: 'options', defaultVisible: true },
  { key: 'npsScore', label: 'NPS Score', align: 'right', defaultVisible: true },
];

const DEFAULT_VISIBLE_KEYS: ColumnKey[] = ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);

const COLUMN_FILTER_ITEMS: ColumnItem[] = [
  { key: 'storeCode', label: 'Store Code', locked: true },
  { key: 'storeName', label: 'Store Name', locked: true },
  ...ALL_COLUMNS.map((c) => ({ key: c.key, label: c.label })),
];

function gradeBadgeClass(grade: StoreGrade): string {
  switch (grade) {
    case 'A+': return 'bg-emerald-100 text-emerald-700';
    case 'A1': return 'bg-blue-100 text-blue-700';
    case 'A2': return 'bg-indigo-100 text-primary-700';
    case 'B1': return 'bg-amber-100 text-amber-700';
    case 'B2': return 'bg-gray-200 text-gray-700';
    case 'C1': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}


export function StoreView({ selectedStoreId, onSelectStore, yearMonth, timePeriod, onLoadingChange, onTotalChange, hideCategories }: StoreViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isCommandContext = location.pathname.startsWith('/command/');
  const storeBasePath = isCommandContext ? '/command/store-view' : '/store-view';
  const setStorePlanogram = useUnifiedPlanningStore((s) => s.setStorePlanogram);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const { data: npsScoresMap } = useQuery({
    queryKey: npsKeys.scoresBulk('mtd'),
    queryFn: () => fetchNPSScoresBulk('mtd'),
    staleTime: 5 * 60 * 1000,
    enabled: !selectedStoreId,
  });

  // Mobile state
  const isMobile = useIsMobile();
  const [mobileStores, setMobileStores] = useState<Store[]>([]);
  const [mobileOffset, setMobileOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Table state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sortField, setSortField] = useState<SortField>('monthlyRevenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Column visibility state
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<ColumnKey[]>(DEFAULT_VISIBLE_KEYS);

  // Derive visible column definitions from key order
  const visibleColumns = useMemo(() => {
    return visibleColumnKeys
      .map((key) => ALL_COLUMNS.find((c) => c.key === key))
      .filter((c): c is ColumnDef => c != null);
  }, [visibleColumnKeys]);

  // Draft filter state (user edits these via dropdowns)
  const [draftFormat, setDraftFormat] = useState('TRENDS');
  const [draftRegion, setDraftRegion] = useState('all');
  const [draftGrade, setDraftGrade] = useState('all');
  const [draftCity, setDraftCity] = useState('all');

  // Applied filter state (actually sent to API — only updated on "Apply")
  const [appliedFilters, setAppliedFilters] = useState({
    format: 'TRENDS', region: 'all', grade: 'all', city: 'all',
  });

  const filtersChanged =
    draftFormat !== appliedFilters.format ||
    draftRegion !== appliedFilters.region ||
    draftGrade !== appliedFilters.grade ||
    draftCity !== appliedFilters.city;

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({ format: draftFormat, region: draftRegion, grade: draftGrade, city: draftCity });
    setCurrentPage(1);
  }, [draftFormat, draftRegion, draftGrade, draftCity]);

  const handleClearFilters = useCallback(() => {
    setDraftFormat('TRENDS');
    setDraftRegion('all');
    setDraftGrade('all');
    setDraftCity('all');
    setAppliedFilters({ format: 'TRENDS', region: 'all', grade: 'all', city: 'all' });
    setSearchQuery('');
    setDebouncedSearch('');
    setCurrentPage(1);
  }, []);

  // Dynamic filter options from API
  // const [filterFormats, setFilterFormats] = useState<string[]>([]);
  const [filterGrades, setFilterGrades] = useState<string[]>([]);
  const [filterRegions, setFilterRegions] = useState<string[]>([]);
  const [filterCities, setFilterCities] = useState<string[]>([]);

  // API state — listing
  const [apiStores, setApiStores] = useState<Store[]>([]);
  const [apiTotal, setApiTotal] = useState(0);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // API state — detail
  const [storeDetail, setStoreDetail] = useState<ApiStoreDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Notify parent of loading state changes
  const onLoadingChangeRef = useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;
  useEffect(() => {
    onLoadingChangeRef.current?.(isLoadingList || isLoadingDetail);
  }, [isLoadingList, isLoadingDetail]);

  // Notify parent of total count changes
  const onTotalChangeRef = useRef(onTotalChange);
  onTotalChangeRef.current = onTotalChange;
  useEffect(() => {
    onTotalChangeRef.current?.(apiTotal);
  }, [apiTotal]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 300);
  }, []);

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  // Fetch dynamic filter options from API — cascading on draft changes (before Apply)
  useEffect(() => {
    const fmt = draftFormat !== 'all' ? draftFormat : 'TRENDS';
    const rgn = draftRegion !== 'all' ? draftRegion : undefined;
    const grd = draftGrade !== 'all' ? draftGrade : undefined;
    const cty = draftCity !== 'all' ? draftCity : undefined;

    const ym = yearMonth;
    Promise.all([
      appApiFetch<{ grades: string[] }>('/store-view/filters/grades', { format_std: fmt, region: rgn, city: cty, year_month: ym }).catch(() => ({ grades: [] })),
      appApiFetch<{ regions: string[] }>('/store-view/filters/regions', { format_std: fmt, store_grade: grd, city: cty, year_month: ym }).catch(() => ({ regions: [] })),
      appApiFetch<{ cities: string[] }>('/store-view/filters/cities', { format_std: fmt, region: rgn, store_grade: grd, year_month: ym }).catch(() => ({ cities: [] })),
    ]).then(([gradesRes, regionsRes, citiesRes]) => {
      setFilterGrades(gradesRes.grades || []);
      setFilterRegions(regionsRes.regions || []);
      setFilterCities(citiesRes.cities || []);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yearMonth is stable (memoized in parent)
  }, [draftFormat, draftRegion, draftGrade, draftCity]);

  // Sort change handler for TableToolbar
  const handleToolbarSortChange = useCallback((key: string | null, dir: 'asc' | 'desc') => {
    if (key) {
      setSortField(key as SortField);
      setSortDir(dir);
    } else {
      setSortField('monthlyRevenue');
      setSortDir('desc');
    }
    setCurrentPage(1);
  }, []);

  // ── Fetch store list from API ──
  useEffect(() => {
    let cancelled = false;
    const fetchList = async () => {
      setIsLoadingList(true);
      try {
        const res = await appApiFetch<ApiStoreListResponse>('/store-view/list', {
          limit: PAGE_SIZE,
          offset: (currentPage - 1) * PAGE_SIZE,
          search: debouncedSearch || undefined,
          format_std: appliedFilters.format !== 'all' ? appliedFilters.format : undefined,
          region: appliedFilters.region !== 'all' ? appliedFilters.region : undefined,
          store_grade: appliedFilters.grade !== 'all' ? appliedFilters.grade : undefined,
          city: appliedFilters.city !== 'all' ? appliedFilters.city : undefined,
          year_month: yearMonth || undefined,
        });
        if (!cancelled) {
          setApiStores((res.data || []).map(mapApiStoreToStore));
          setApiTotal(res.total || 0);
        }
      } catch (e) {
        console.error('Failed to fetch store list:', e);
        if (!cancelled) { setApiStores([]); setApiTotal(0); }
      } finally {
        if (!cancelled) setIsLoadingList(false);
      }
    };
    fetchList();
    return () => { cancelled = true; };
  }, [debouncedSearch, currentPage, appliedFilters, yearMonth]);

  // ── Fetch store detail from API ──
  useEffect(() => {
    if (!selectedStoreId) { setStoreDetail(null); return; }
    let cancelled = false;
    const fetchDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const res = await appApiFetch<ApiStoreDetailResponse>('/store-view/details', {
          store_id: selectedStoreId,
          year_month: yearMonth || undefined,
        });
        if (!cancelled) {
          setStoreDetail(res);
          setStorePlanogram(res.planogram || []);
          // Update store data in parent so header/banner render on direct URL load
          onSelectStore(selectedStoreId, {
            id: res.store_code,
            name: res.store_name || res.store_code,
            city: res.city || '',
            region: res.region || '',
            sqft: res.sqft ?? null,
            monthlyRevenue: res.aggregated_data?.revenue ?? null,
            aop: res.aggregated_data?.aop ?? null,
            options: res.aggregated_data?.options ?? 0,
            optionsInStock: res.aggregated_data?.options_in_stock ?? null,
            totalOptions: res.aggregated_data?.total_options ?? null,
            categories: res.categories || [],
            noosPct: res.aggregated_data?.noos_pct ?? null,
            fashionPct: res.aggregated_data?.fashion_pct ?? null,
            grossSales: res.aggregated_data?.gross_sales ?? null,
            otbTotal: res.aggregated_data?.otb ?? null,
            stockValue: res.aggregated_data?.stock ?? null,
            monthClosingStockQty: res.aggregated_data?.month_closing_stock_qty ?? null,
            total_gross_margin: res.aggregated_data?.total_gross_margin ?? null,
            lyGrowth: res.aggregated_data?.ly_growth ?? null,
            format: res.aggregated_data?.format_std || '',
            nrmPct: res.aggregated_data?.nrm_pct ?? null,
            storeAgeMonths: res.aggregated_data?.store_age_months ?? null,
          });
        }
      } catch (e) {
        console.error('Failed to fetch store detail:', e);
      } finally {
        if (!cancelled) setIsLoadingDetail(false);
      }
    };
    fetchDetail();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSelectStore & setStorePlanogram are stable Zustand actions
  }, [selectedStoreId, yearMonth]);

  // Sort API stores client-side (within the current page)
  const sortedStores = useMemo(() => {
    const result = [...apiStores];
    result.sort((a, b) => {
      let aVal: number | string | null;
      let bVal: number | string | null;
      if (sortField === 'name') { aVal = a.name; bVal = b.name; }
      else if (sortField === 'city') { aVal = a.city; bVal = b.city; }
      else {
        aVal = a[sortField]; bVal = b[sortField];
      }

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return result;
  }, [apiStores, sortField, sortDir]);

  // Pagination from API total
  const totalPages = Math.ceil(apiTotal / PAGE_SIZE) || 1;
  const totalItems = apiTotal;
  const pageItems = sortedStores;

  const hasActiveFilters = appliedFilters.region !== 'all' || appliedFilters.grade !== 'all' || appliedFilters.city !== 'all' || debouncedSearch.trim() !== ''
    || draftRegion !== 'all' || draftGrade !== 'all' || draftCity !== 'all';

  // ── Mobile filter definitions ──
  const mobileFilterDefs = useMemo((): FilterDef[] => [
    { type: 'multiselect', key: 'region', label: 'Region', options: filterRegions.map((r) => ({ value: r, label: r })) },
    { type: 'multiselect', key: 'grade', label: 'Grade', options: filterGrades.map((g) => ({ value: g, label: g })) },
    { type: 'multiselect', key: 'city', label: 'City', options: filterCities.map((c) => ({ value: c, label: c })) },
  ], [filterRegions, filterGrades, filterCities]);

  const mobileFilterValues = useMemo((): Record<string, string> => ({
    region: appliedFilters.region,
    grade: appliedFilters.grade,
    city: appliedFilters.city,
  }), [appliedFilters.region, appliedFilters.grade, appliedFilters.city]);

  const activeFilterCount = useMemo((): number => {
    let count = 0;
    if (appliedFilters.region !== 'all') count++;
    if (appliedFilters.grade !== 'all') count++;
    if (appliedFilters.city !== 'all') count++;
    return count;
  }, [appliedFilters.region, appliedFilters.grade, appliedFilters.city]);

  const handleMobileFilterApply = useCallback((values: Record<string, string>) => {
    const region = values.region ?? 'all';
    const grade = values.grade ?? 'all';
    const city = values.city ?? 'all';
    setDraftRegion(region);
    setDraftGrade(grade);
    setDraftCity(city);
    setAppliedFilters({ format: draftFormat, region, grade, city });
    setCurrentPage(1);
    setMobileStores([]);
    setMobileOffset(0);
  }, [draftFormat]);

  const handleMobileFilterClear = useCallback(() => {
    handleClearFilters();
    setMobileStores([]);
    setMobileOffset(0);
  }, [handleClearFilters]);

  // ── Mobile: sync sortedStores to mobileStores on initial page load ──
  useEffect(() => {
    if (isMobile && currentPage === 1 && sortedStores.length > 0) {
      setMobileStores(sortedStores);
      setMobileOffset(sortedStores.length);
    }
  }, [isMobile, currentPage, sortedStores]);

  // ── Mobile: reset mobileStores when filters or search change ──
  useEffect(() => {
    if (isMobile) {
      setMobileStores([]);
      setMobileOffset(0);
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset on filter/search changes, not on isMobile toggling layout
  }, [appliedFilters, debouncedSearch]);

  // ── Mobile: Load More handler ──
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await appApiFetch<ApiStoreListResponse>('/store-view/list', {
        limit: PAGE_SIZE,
        offset: mobileOffset,
        search: debouncedSearch || undefined,
        format_std: appliedFilters.format !== 'all' ? appliedFilters.format : undefined,
        region: appliedFilters.region !== 'all' ? appliedFilters.region : undefined,
        store_grade: appliedFilters.grade !== 'all' ? appliedFilters.grade : undefined,
        city: appliedFilters.city !== 'all' ? appliedFilters.city : undefined,
        year_month: yearMonth || undefined,
      });
      const newStores = (res.data || []).map(mapApiStoreToStore);
      setMobileStores((prev) => [...prev, ...newStores]);
      setMobileOffset((prev) => prev + newStores.length);
    } catch (e) {
      console.error('Failed to load more stores:', e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, mobileOffset, debouncedSearch, appliedFilters, yearMonth]);

  // Cell renderer for dynamic columns
  const renderCell = useCallback((col: ColumnDef, store: Store): React.ReactNode => {
    switch (col.key) {
      case 'format':
        return <span className="text-gray-600">{store.format != null && store.format !== '' ? store.format : <span className="text-gray-400">N/A</span>}</span>;
      case 'city':
        return <span className="text-gray-600">{store.city != null && store.city !== '' ? store.city : <span className="text-gray-400">N/A</span>}</span>;
      case 'grade':
        return store.grade ? (
          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${gradeBadgeClass(store.grade)}`}>
            {store.grade}
          </span>
        ) : <span className="text-gray-400">N/A</span>;
      case 'region':
        return <span className="text-gray-600">{store.region != null && store.region !== '' ? store.region : <span className="text-gray-400">N/A</span>}</span>;
      case 'sqft':
        return <span className="tabular-nums">{store.sqft != null ? formatNumber(store.sqft) : <span className="text-gray-400">N/A</span>}</span>;
      case 'usableSqft':
        return <span className="tabular-nums">{store.totalUsableSqft != null ? formatNumber(store.totalUsableSqft) : <span className="text-gray-400">N/A</span>}</span>;
      case 'monthlyRevenue':
        return <span className="tabular-nums font-medium text-gray-900">{store.monthlyRevenue != null ? formatCurrency(store.monthlyRevenue) : <span className="text-gray-400">N/A</span>}</span>;
      case 'options':
        return <span className="tabular-nums">{store.options != null ? formatNumber(store.options) : <span className="text-gray-400">N/A</span>}</span>;
      case 'npsScore': {
        const nps = npsScoresMap?.[store.id];
        return nps != null
          ? <span className="tabular-nums font-medium text-gray-900">{nps}</span>
          : <span className="text-gray-400">N/A</span>;
      }
    }
  }, [npsScoresMap]);

  // If no store selected, show store data table
  if (!selectedStoreId) {
    return (
      <div className="space-y-3">
        {/* ── Info banner — standardized via shared PageInfoBanners ── */}
        <PageInfoBanners note="Showing store data for Trends format only. Default view: Last Month." />

        {/* ── Mobile search + filter trigger ── */}
        <div className="flex items-center gap-2 md:hidden">
          <Input
            type="text"
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            containerClassName="flex-1"
            leftIcon={<Search className="w-4 h-4" />}
            rightIcon={searchQuery ? (
              <button
                onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setCurrentPage(1); setMobileStores([]); setMobileOffset(0); }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : undefined}
          />
          <Button
            variant="outline"
            className="shrink-0 min-h-[44px]"
            onClick={() => setFilterSheetOpen(true)}
            aria-label={`Open filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="primary" size="sm">{activeFilterCount}</Badge>
            )}
          </Button>
        </div>

        {/* ── Desktop: Table Container ── */}
        <div className="hidden md:block">
          {isLoadingList ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Skeleton table header */}
              <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-14 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-14 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-10 bg-gray-200 rounded animate-pulse ml-auto" />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-14 bg-gray-200 rounded animate-pulse" />
              </div>
              {/* Skeleton rows */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50">
                  {/* eslint-disable-next-line no-restricted-syntax -- dynamic width for varied skeleton widths */}
                  <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${140 + (i % 3) * 30}px` }} />
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-5 w-10 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-14 bg-gray-100 rounded animate-pulse ml-auto" />
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
              {/* Skeleton pagination */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                <div className="flex items-center gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-7 w-7 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          ) : pageItems.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <EmptyState
                icon={Search}
                description="No stores match the current filters"
                action={
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              {/* Section header with search, filters, sort, columns */}
              <SectionHeader
                title="Store Listing"
                actions={
                  <div className="flex items-center gap-2">
                    <FilterBar className="gap-1.5">
                      <FilterMultiSelect
                        value={draftRegion}
                        onChange={setDraftRegion}
                        placeholder="Region"
                        options={filterRegions.map((r) => ({ value: r, label: r }))}
                      />
                      <FilterMultiSelect
                        value={draftGrade}
                        onChange={setDraftGrade}
                        placeholder="Grade"
                        options={filterGrades.map((g) => ({ value: g, label: g }))}
                      />
                      <FilterMultiSelect
                        value={draftCity}
                        onChange={setDraftCity}
                        placeholder="City"
                        options={filterCities.map((c) => ({ value: c, label: c }))}
                      />
                      {filtersChanged && (
                        <Button size="sm" onClick={handleApplyFilters}>
                          Apply
                        </Button>
                      )}
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                          Clear
                        </Button>
                      )}
                    </FilterBar>
                    <TableToolbar
                      search={searchQuery}
                      onSearchChange={handleSearchChange}
                      searchPlaceholder="Search stores..."
                      sortColumns={SORT_COLUMNS}
                      sortKey={sortField}
                      sortDir={sortDir}
                      onSortChange={handleToolbarSortChange}
                      className="w-auto"
                    />
                    <div className="hidden lg:flex">
                      <ColumnFilterDropdown
                        columns={COLUMN_FILTER_ITEMS}
                        visibleKeys={visibleColumnKeys}
                        onApply={(keys) => setVisibleColumnKeys(keys as ColumnKey[])}
                        defaultVisibleKeys={DEFAULT_VISIBLE_KEYS}
                      />
                    </div>
                  </div>
                }
              />

              {/* Table with overflow scroll */}
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="py-2.5 font-medium text-gray-500 text-xs whitespace-nowrap text-left pl-3 pr-3 sticky left-0 bg-gray-50 z-10">
                        Store Code
                      </th>
                      <th className="py-2.5 font-medium text-gray-500 text-xs whitespace-nowrap text-left pl-3 pr-3">
                        Store Name
                      </th>
                      {visibleColumns.map((col) => (
                        <th
                          key={col.key}
                          className={cn(
                            'py-2.5 font-medium text-gray-500 text-xs whitespace-nowrap px-3',
                            col.align === 'right' && 'text-right',
                            col.align === 'center' && 'text-center',
                            col.align === 'left' && 'text-left',
                          )}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pageItems.map((store) => (
                      <tr
                        key={store.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          onSelectStore(store.id, store);
                          navigate(`${storeBasePath}/store/${store.id}`);
                        }}
                      >
                        <td className="py-3 pl-3 pr-3 text-sm text-gray-600 tabular-nums whitespace-nowrap sticky left-0 bg-white z-10">
                          {store.id}
                        </td>
                        <td
                          className="py-3 pl-3 pr-3 text-sm text-gray-900 font-medium max-w-[240px] truncate whitespace-nowrap"
                          title={store.name}
                        >
                          {store.name}
                        </td>
                        {visibleColumns.map((col) => (
                          <td
                            key={col.key}
                            className={cn(
                              'py-3 px-3 text-sm',
                              col.align === 'right' && 'text-right',
                              col.align === 'center' && 'text-center',
                            )}
                          >
                            {renderCell(col, store)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  pageSize={PAGE_SIZE}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Mobile: Store Cards + Load More ── */}
        <div className="md:hidden space-y-3">
          {isLoadingList && mobileStores.length === 0 ? (
            // Mobile skeleton cards
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-3/5 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-8 bg-gray-100 rounded-full animate-pulse" />
                </div>
                <div className="h-3 w-2/5 bg-gray-100 rounded animate-pulse" />
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex-1 space-y-1">
                    <div className="h-2.5 w-14 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="h-2.5 w-14 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))
          ) : mobileStores.length === 0 && !isLoadingList ? (
            <div className="bg-white rounded-lg border border-gray-200">
              <EmptyState
                icon={Search}
                description="No stores match the current filters"
              />
              <div className="flex justify-center pb-4">
                <Button variant="ghost" size="sm" onClick={handleMobileFilterClear}>
                  Clear filters
                </Button>
              </div>
            </div>
          ) : (
            <>
              {mobileStores.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => {
                    onSelectStore(store.id, store);
                    navigate(`${storeBasePath}/store/${store.id}`);
                  }}
                  className="w-full text-left bg-white rounded-lg border border-gray-200 p-3 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  {/* Row 1: Name + chevron */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 truncate flex-1">{store.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </div>
                  {/* Row 2: Code + City + Grade badge */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <span className="tabular-nums">{store.id}</span>
                    {store.city && (
                      <>
                        <span aria-hidden="true">&middot;</span>
                        <span>{store.city}</span>
                      </>
                    )}
                    {store.grade && (
                      <>
                        <span aria-hidden="true">&middot;</span>
                        <Badge variant="default" size="sm">{store.grade}</Badge>
                      </>
                    )}
                  </div>
                  {/* Row 3: Region + sqft */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                    {store.region && <span>{store.region}</span>}
                    {store.sqft != null && (
                      <>
                        {store.region && <span aria-hidden="true">&middot;</span>}
                        <span className="tabular-nums">{formatNumber(store.sqft)} sft</span>
                      </>
                    )}
                  </div>
                  {/* Row 4: Revenue + Options metrics */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase">Revenue</p>
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">
                        {store.monthlyRevenue != null ? formatCurrency(store.monthlyRevenue) : <span className="text-gray-400">N/A</span>}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 uppercase">Options</p>
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">
                        {store.options != null ? formatNumber(store.options) : <span className="text-gray-400">N/A</span>}
                      </p>
                    </div>
                  </div>
                </button>
              ))}

              {/* Load More button */}
              {mobileStores.length < apiTotal && (
                <Button
                  variant="outline"
                  className="w-full min-h-[44px]"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading stores...</span>
                    </>
                  ) : (
                    <span>Load More ({formatNumber(mobileStores.length)} of {formatNumber(apiTotal)})</span>
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        {/* ── Mobile Filter Sheet ── */}
        <MobileFilterSheet
          isOpen={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          filters={mobileFilterDefs}
          values={mobileFilterValues}
          onApply={handleMobileFilterApply}
          onClear={handleMobileFilterClear}
        />
      </div>
    );
  }

  // ── Store detail view ──

  if (isLoadingDetail || !storeDetail) {
    return (
      <div className="space-y-4">
        {/* Skeleton section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        {/* Skeleton segment cards */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-gray-100 rounded animate-pulse" />
                <div>
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line no-restricted-syntax -- dynamic width for varied skeleton widths */}
                    <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${100 + (i % 3) * 30}px` }} />
                    <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
                  </div>
                  <div className="h-3 w-28 bg-gray-100 rounded animate-pulse mt-1.5" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="text-right min-w-[55px]">
                    <div className="h-2.5 w-14 bg-gray-100 rounded animate-pulse mb-1.5" />
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
                <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse" />
                <div className="w-5 h-5 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const storeName = storeDetail.store_name;
  const storeCategories = mapApiCategoriesToCategories(storeDetail.category_level_split ?? []);

  if (hideCategories) return null;

  return (
    <div className="space-y-4">
      {/* Categories Header */}
      <SectionHeader
        title="Categories"
        actions={<span className="text-sm text-gray-500">{storeCategories.length} categories</span>}
      />

      {/* Category Rows */}
      <div className="space-y-2">
        {storeCategories.length === 0 ? <EmptyState description="No categories to display" /> : storeCategories.map((category) => {
          const isExpanded = expandedCategoryId === category.id;

          return (
            <div
              key={category.id}
              className={`bg-white rounded-lg border transition-all ${
                isExpanded ? 'border-primary shadow-md' : 'border-gray-200 shadow-sm'
              }`}
            >
              {/* Category Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedCategoryId(isExpanded ? null : category.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedCategoryId(isExpanded ? null : category.id);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <button aria-label={isExpanded ? 'Collapse category' : 'Expand category'} className={`relative w-6 h-6 flex items-center justify-center rounded transition-colors ${
                    isExpanded ? 'bg-primary text-white' : 'text-gray-400'
                  }`}>
                    <span className="absolute -inset-2.5" aria-hidden="true" />
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900">{category.name.replace(/^\d+\.\s*/, '')}</h4>
                    </div>
                    {/* <p className="text-xs text-gray-500 mt-0.5">
                      {category.spaceSqft ? `${formatNumber(category.spaceSqft)} sft · ` : ''}
                    </p> */}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right min-w-[70px]">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Monthly Rev</p>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatCurrency(category.salesMd)}</p>
                  </div>
                  <div className="text-right min-w-[55px]">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Options</p>
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatNumber(category.options)}</p>
                  </div>
                  {timePeriod !== 'Last Month' && (
                    <div className="text-right min-w-[55px]">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Cover</p>
                      <p className="text-sm font-semibold text-amber-600 tabular-nums">{category.cover}d</p>
                    </div>
                  )}
                  {/* <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    category.fill >= 90 ? 'bg-emerald-100 text-emerald-700' :
                    category.fill >= 80 ? 'bg-blue-100 text-blue-700' :
                    category.fill >= 70 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {category.fill}
                  </div> */}
                  <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90 text-primary' : 'text-gray-400'}`} />
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                  <div className="space-y-4">
                  {/* Main Grid */}
                  <div className="grid grid-cols-8 gap-4 items-stretch">
                    {/* RANGE */}
                    <div className="col-span-2 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Range</h5>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </div>
                      <div
                        className="flex-1 bg-white rounded-lg p-3 border border-gray-100 cursor-pointer hover:border-primary/40 transition-colors"
                        onClick={() => navigate(`/range/store/${selectedStoreId}?segment=${encodeURIComponent(category.name)}`)}
                        role="link"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/range/store/${selectedStoreId}?segment=${encodeURIComponent(category.name)}`); }}
                      >
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Options</p>
                          <p className="text-xl font-bold text-gray-900 tabular-nums">{category.rangeOpts}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 mb-1">
                            NOOS <span className="font-medium text-gray-700">{category.noosPercent}%</span> /
                            Fashion <span className="font-medium text-gray-700">{100 - category.noosPercent}%</span>
                          </p>
                          <div className="flex h-2 rounded overflow-hidden">
                            {/* eslint-disable-next-line no-restricted-syntax -- dynamic width based on percentage */}
                            <div className="bg-gray-400" style={{ width: `${category.noosPercent}%` }} />
                            {/* eslint-disable-next-line no-restricted-syntax -- dynamic width based on percentage */}
                            <div className="bg-blue-500" style={{ width: `${100 - category.noosPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EXECUTION */}
                    <div className="col-span-6 flex flex-col gap-3">
                      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Execution</h5>
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        {/* Replenishment */}
                        <div className="bg-white rounded-lg p-3 border border-gray-100 flex flex-col">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Replenishment</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Qty</span>
                            <span className="text-base font-bold text-gray-900 tabular-nums">{category.replenishment ? formatNumber(category.replenishment) : <span className="text-gray-400">N/A</span>}</span>
                          </div>
                        </div>

                        {/* Pullback */}
                        <div
                          className="bg-white rounded-lg p-3 border border-gray-100 cursor-pointer hover:border-primary/40 transition-colors flex flex-col"
                          onClick={() => navigate(`/inventory/actions?tab=pullback&store=${encodeURIComponent(storeName)}&segment=${encodeURIComponent(category.name)}`)}
                          role="link"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/inventory/actions?tab=pullback&store=${encodeURIComponent(storeName)}&segment=${encodeURIComponent(category.name)}`); }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pullback</span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Items</span>
                              <span className="text-base font-bold text-gray-900 tabular-nums">{category.arPullbackCount}</span>
                            </div>
                            {category.arPullbackCount > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {category.arPullbackSubTypes.map((st: { type: PullbackSubType; count: number }, i: number) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                                    {st.type.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* Space Performance */}
                    <div className="pt-4 border-t border-gray-200">
                      <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Space Performance</h5>
                      <MetricGrid columns={3} className="mb-0">
                        <MetricCard
                          label="Total SFT"
                          value={category.usableSqft != null ? formatNumber(category.usableSqft) : 'N/A'}
                          valueClassName="text-lg"
                        />
                        <MetricCard
                          label="GMROF"
                          value={category.spaceGmrof != null ? `${formatCurrency(category.spaceGmrof)}/SFT` : 'N/A'}
                          valueClassName="text-lg"
                        />
                        <MetricCard
                          label="Total Fixtures"
                          value={category.totalFixtures != null ? formatNumber(category.totalFixtures) : 'N/A'}
                          valueClassName="text-lg"
                        />
                      </MetricGrid>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
