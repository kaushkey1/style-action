import { create } from 'zustand';

export interface DashboardFilters {
  dateFrom: string;
  dateTo: string;
  format: string;
  brand: string;
  category: string;
  subcategory: string;
  fashionGrade: string;
  siteType: string;
}

const SEASON_START = '2026-04-01';

const DEFAULT_DATE_TO = '2026-04-30';
/**
 * Category names (without serial-number prefix) that should be auto-selected
 * once the /filters API returns the full category list with correct prefixes.
 */
export const PRESELECTED_CATEGORY_NAMES = [
  'MEN APPAREL',
  'WOMEN APPAREL',
  'KIDS APPAREL',
  'INNERWEAR',
  'ACCESSORIES',
];

function getDefaultDateRange(): Pick<DashboardFilters, 'dateFrom' | 'dateTo'> {
  return {
    dateFrom: SEASON_START,
    dateTo: DEFAULT_DATE_TO,
  };
}

export function getDefaultDashboardFilters(): DashboardFilters {
  const { dateFrom, dateTo } = getDefaultDateRange();
  return {
    dateFrom,
    dateTo,
    format: 'all',
    brand: 'all',
    category: 'all',
    subcategory: 'all',
    fashionGrade: 'all',
    siteType: 'all',
  };
}

const defaultFilters: DashboardFilters = getDefaultDashboardFilters();

interface DashboardFilterState {
  filters: DashboardFilters;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
  /** Read filters from URL query params on mount */
  syncFromUrl: (searchParams: URLSearchParams) => void;
  /** Write current filters to URL query params (returns new search string) */
  buildUrlParams: () => string;
}

/** Map between URL param names and store filter keys */
const URL_PARAM_MAP: Record<string, keyof DashboardFilters> = {
  dateFrom: 'dateFrom',
  dateTo: 'dateTo',
  formats: 'format',
  brands: 'brand',
  categories: 'category',
  subcategories: 'subcategory',
  grades: 'fashionGrade',
  site_types: 'siteType',
};

/** URL param keys from the old (pre-migration) filter shape. Detected on mount so we can warn + strip. */
const STALE_URL_PARAM_KEYS = ['segments', 'classes', 'families', 'bricks'] as const;

export const useDashboardFilterStore = create<DashboardFilterState>((set, get) => ({
  filters: { ...defaultFilters },
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
  clearFilters: () => {
    const { dateFrom, dateTo } = getDefaultDateRange();
    set({
      filters: {
        dateFrom,
        dateTo,
        format: 'all',
        brand: 'all',
        category: 'all',
        subcategory: 'all',
        fashionGrade: 'all',
        siteType: 'all',
      },
    });
  },
  hasActiveFilters: () => {
    const { filters } = get();
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'dateFrom' || key === 'dateTo') return value !== '';
      return value !== 'all';
    });
  },
  syncFromUrl: (searchParams) => {
    // Warn (dev only) when stale pre-migration keys appear in the URL.
    if (import.meta.env.DEV) {
      const stale = STALE_URL_PARAM_KEYS.filter((k) => searchParams.has(k));
      if (stale.length > 0) {
        console.warn(`[DEV] Dropped stale URL params: ${stale.join(', ')}`);
      }
    }
    const updates: Partial<DashboardFilters> = {};
    for (const [urlKey, storeKey] of Object.entries(URL_PARAM_MAP)) {
      const val = searchParams.get(urlKey);
      if (val) updates[storeKey] = val;
    }
    if (Object.keys(updates).length > 0) {
      set((state) => ({ filters: { ...state.filters, ...updates } }));
    }
  },
  buildUrlParams: () => {
    const { filters } = get();
    const params = new URLSearchParams();
    for (const [urlKey, storeKey] of Object.entries(URL_PARAM_MAP)) {
      const val = filters[storeKey];
      if (storeKey === 'dateFrom' || storeKey === 'dateTo') {
        if (val) params.set(urlKey, val);
      } else if (val && val !== 'all') {
        params.set(urlKey, val);
      }
    }
    return params.toString();
  },
}));

// Filter options. No 'all' sentinel row — the FilterMultiSelect component
// renders a "Select All" checkbox at the top of every dropdown, and "no row
// selected" / "all rows selected" both map to the store's 'all' value.

export const formatOptions = [
  { value: 'trends', label: 'Trends' },
  { value: 'centro', label: 'Centro' },
  { value: 'yousta', label: 'Yousta' },
  { value: 'azorte', label: 'Azorte' },
  { value: 'project-eve', label: 'Project Eve' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'smart-bazaar', label: 'Smart Bazaar' },
];

export const brandOptions = [
  { value: 'trends', label: 'Trends' },
  { value: 'centro', label: 'Centro' },
  { value: 'yousta', label: 'Yousta' },
  { value: 'azorte', label: 'Azorte' },
  { value: 'avaasa', label: 'Avaasa' },
  { value: 'netplay', label: 'NetPlay' },
  { value: 'performax', label: 'Performax' },
  { value: 'frendz', label: 'Frendz' },
];

export const hitOptions = [
  { value: '1', label: 'Hit 1 (Apr)' },
  { value: '2', label: 'Hit 2 (May)' },
  { value: '3', label: 'Hit 3 (Jun)' },
  { value: '4', label: 'Hit 4 (Jul)' },
  { value: '5', label: 'Hit 5 (Aug)' },
  { value: '6', label: 'Hit 6 (Sep)' },
  { value: '7', label: 'Hit 7 (Oct)' },
  { value: '8', label: 'Hit 8 (Nov)' },
  { value: '9', label: 'Hit 9 (Dec)' },
  { value: '10', label: 'Hit 10 (Jan)' },
  { value: '11', label: 'Hit 11 (Feb)' },
  { value: '12', label: 'Hit 12 (Mar)' },
];

export const fashionGradeOptions = [
  { value: 'core', label: 'Core' },
  { value: 'ultimate', label: 'Ultimate' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'fast-fashion', label: 'Fast Fashion' },
];

/**
 * Empty fallbacks used while /filters API is loading or errors out.
 * Real categories/subcategories come from the API and replace these.
 */
export const categoryFallbackOptions: { value: string; label: string }[] = [];
export const subcategoryFallbackOptions: { value: string; label: string }[] = [];

/**
 * Produces a stable string key from current filters.
 * Use as a React `key` to trigger re-render when any filter changes.
 */
export function filterKey(filters: DashboardFilters): string {
  return Object.values(filters).join('|');
}

/**
 * Deterministic hash from filter combination → number between 0 and 1.
 * Used to produce consistent but visibly different mock values per filter set.
 */
export function filterSeed(filters: DashboardFilters): number {
  const str = Object.entries(filters)
    .filter(([, v]) => v !== 'all' && v !== '')
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
  if (!str) return 1; // no filters → multiplier 1 (original data)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  // Map to 0.55–0.95 range so filtered subsets look smaller but not empty
  return 0.55 + (Math.abs(hash) % 40) / 100;
}
