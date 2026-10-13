import { create } from 'zustand';

// Re-export the canonical option lists from /category-director so the two
// command-dashboard pages stay in lockstep when filter taxonomies change.
export {
  formatOptions,
  brandOptions,
  fashionGradeOptions,
  categoryFallbackOptions,
  subcategoryFallbackOptions,
} from '@/modules/category-director/stores/useCategoryDirectorFilterStore';

export interface SourcingFilters {
  dateFrom: string;
  dateTo: string;
  format: string;
  brand: string;
  category: string;
  subcategory: string;
  fashionGrade: string;
  /** CSV string of selected cluster names ('all' = no filter), matches FilterMultiSelect contract. */
  clusters: string;
  /** 'all' | 'STORE' | 'DC' — maps to the `store_type` API query param. */
  siteType: string;
}

const SEASON_START = '2026-04-01';
const DEFAULT_DATE_TO = '2026-04-30';

export function getDefaultSourcingFilters(): SourcingFilters {
  return {
    dateFrom: SEASON_START,
    dateTo: DEFAULT_DATE_TO,
    format: 'all',
    brand: 'all',
    category: 'all',
    subcategory: 'all',
    fashionGrade: 'all',
    clusters: 'all',
    siteType: 'all',
  };
}

const defaultFilters: SourcingFilters = getDefaultSourcingFilters();

interface SourcingFilterState {
  filters: SourcingFilters;
  setFilter: <K extends keyof SourcingFilters>(key: K, value: SourcingFilters[K]) => void;
  resetFilters: () => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

export const useSourcingFilterStore = create<SourcingFilterState>((set, get) => ({
  filters: { ...defaultFilters },
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
  clearFilters: () =>
    set({
      filters: {
        dateFrom: '',
        dateTo: '',
        format: 'all',
        brand: 'all',
        category: 'all',
        subcategory: 'all',
        fashionGrade: 'all',
        clusters: 'all',
        siteType: 'all',
      },
    }),
  hasActiveFilters: () => {
    const { filters } = get();
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'dateFrom' || key === 'dateTo') return value !== '';
      return value !== 'all';
    });
  },
}));

// Site Type options match /dashboard's Site Type chip (values are sent verbatim
// as the `store_type` API query param — must be 'STORE' or 'DC' uppercase).
// No 'all' row — Select All checkbox in FilterMultiSelect maps to 'all' sentinel.
export const siteTypeOptions = [
  { value: 'STORE', label: 'STORE' },
  { value: 'DC', label: 'DC' },
];

/**
 * Stable string key from current filters. Used by the page-level draft→applied
 * dirty check (filterKey(filters) !== filterKey(appliedFilters)).
 */
export function sourcingFilterKey(filters: SourcingFilters): string {
  return Object.values(filters).join('|');
}
