import { create } from 'zustand';
import {
  getDefaultCategoryDirectorFilters,
  type CategoryDirectorFilters,
} from '@/modules/category-director/stores/useCategoryDirectorFilterStore';

/**
 * Module-scoped filter store for the Categories section.
 *
 * Reuses the `CategoryDirectorFilters` shape on purpose: the listing/detail
 * pages call the existing `useCategoryPerformance` hook, whose query key and
 * `buildParams` are keyed on that exact shape. Sharing the shape keeps the
 * React Query cache compatible with the dashboard's Category Performance tab
 * (same values → same cache entry → no extra network call).
 *
 * It is a SEPARATE store instance (not the dashboard's) so the listing can
 * default `category` to 'all' (show every category) without inheriting the
 * dashboard's category pre-selection, and so filter changes here don't leak
 * back into the dashboard.
 */

// Re-export the shared filter type so callers only depend on this module.
export type CategoriesFilters = CategoryDirectorFilters;

const defaultFilters: CategoriesFilters = getDefaultCategoryDirectorFilters();

interface CategoriesFilterState {
  filters: CategoriesFilters;
  setFilter: <K extends keyof CategoriesFilters>(key: K, value: CategoriesFilters[K]) => void;
  resetFilters: () => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

export function getDefaultCategoriesFilters(): CategoriesFilters {
  return getDefaultCategoryDirectorFilters();
}

export const useCategoriesFilterStore = create<CategoriesFilterState>((set, get) => ({
  filters: { ...defaultFilters },
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
  clearFilters: () => {
    set({ filters: { ...getDefaultCategoryDirectorFilters() } });
  },
  hasActiveFilters: () => {
    const defaults = getDefaultCategoryDirectorFilters();
    const { filters } = get();
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'dateFrom' || key === 'dateTo') return false;
      return value !== defaults[key as keyof CategoriesFilters];
    });
  },
}));

/** Stable string key from current filters — use as a React key / change detector. */
export function categoriesFilterKey(filters: CategoriesFilters): string {
  return Object.values(filters).join('|');
}
