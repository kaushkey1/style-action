import { create } from 'zustand';

export interface CategoryDirectorFilters {
  dateFrom: string;
  dateTo: string;
  format: string;
  brand: string;
  category: string;
  subcategory: string;
  fashionGrade: string;
}

const SEASON_START = '2026-04-01';
const DEFAULT_DATE_TO = '2026-04-30';

export function getDefaultCategoryDirectorFilters(): CategoryDirectorFilters {
  return {
    dateFrom: SEASON_START,
    dateTo: DEFAULT_DATE_TO,
    format: 'all',
    brand: 'all',
    category: 'all',
    subcategory: 'all',
    fashionGrade: 'all',
  };
}

const defaultFilters: CategoryDirectorFilters = getDefaultCategoryDirectorFilters();

interface CategoryWWFilterState {
  filters: CategoryDirectorFilters;
  setFilter: <K extends keyof CategoryDirectorFilters>(key: K, value: CategoryDirectorFilters[K]) => void;
  resetFilters: () => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

export const useCategoryDirectorFilterStore = create<CategoryWWFilterState>((set, get) => ({
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

// ── Filter option lists (mirrors dashboard) ─────────────────────────────────
// No 'all' sentinel row — the FilterMultiSelect renders a "Select All" check-
// box, and "all rows selected" maps to the store's 'all' value via applyDraft.

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
  { value: 'frendz', label: 'Frendz' },
];

export const fashionGradeOptions = [
  { value: 'core', label: 'Core' },
  { value: 'ultimate', label: 'Ultimate' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'fast-fashion', label: 'Fast Fashion' },
];

export const categoryFallbackOptions: { value: string; label: string }[] = [];
export const subcategoryFallbackOptions: { value: string; label: string }[] = [];

/**
 * Stable string key from current filters. Use as React key to trigger re-render
 * when any filter changes.
 */
export function categoryDirectorFilterKey(filters: CategoryDirectorFilters): string {
  return Object.values(filters).join('|');
}
