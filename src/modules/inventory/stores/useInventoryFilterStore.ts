import { create } from 'zustand';

export interface InventoryFilters {
  format: string;
  segment: string;
  brick: string;
  family: string;
  class: string;
  fashionGrade: string;
  store: string;
}

const defaultFilters: InventoryFilters = {
  format: 'all',
  segment: 'all',
  brick: 'all',
  family: 'all',
  class: 'all',
  fashionGrade: 'all',
  store: 'all',
};

function filterKey(f: InventoryFilters): string {
  return JSON.stringify(f);
}

interface InventoryFilterState {
  /** Draft filters — bound to the dropdowns; edited live but not applied to data. */
  filters: InventoryFilters;
  /** Applied filters — what the data fetches read; updated only via applyFilters(). */
  appliedFilters: InventoryFilters;
  setFilter: <K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) => void;
  /** Commit the current draft to the applied filters (triggers data refetch). */
  applyFilters: () => void;
  /** Reset both draft and applied to defaults (immediate clear). */
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
  /** True when the draft differs from what's applied (enables the Apply button). */
  isDirty: () => boolean;
}

export const useInventoryFilterStore = create<InventoryFilterState>((set, get) => ({
  filters: { ...defaultFilters },
  appliedFilters: { ...defaultFilters },
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  applyFilters: () => set((state) => ({ appliedFilters: { ...state.filters } })),
  resetFilters: () => set({ filters: { ...defaultFilters }, appliedFilters: { ...defaultFilters } }),
  hasActiveFilters: () => {
    const { appliedFilters } = get();
    return Object.values(appliedFilters).some((v) => v !== 'all');
  },
  isDirty: () => {
    const { filters, appliedFilters } = get();
    return filterKey(filters) !== filterKey(appliedFilters);
  },
}));

// Segment options — values match mock inventory data `category` field
export const inventorySegmentOptions = [
  { value: 'all', label: 'All Segments' },
  { value: 'Menswear Casual', label: "Men's Casuals" },
  { value: 'Menswear Formal', label: "Men's Formals" },
  { value: 'Womenswear Ethnic', label: "Women's Indian Wear" },
  { value: 'Womenswear Western', label: "Women's Western Wear" },
  { value: 'Kidswear', label: 'Kids Wear' },
  { value: 'Footwear', label: 'Footwear' },
];
