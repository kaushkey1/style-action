import { create } from 'zustand';
import type { Product, Collection, ViewMode, DiscoverLayout } from '../types/types';

interface StyleBankState {
  viewMode: ViewMode;
  selectedCollection: Collection | null;
  selectedProduct: Product | null;
  searchQuery: string;
  categoryFilter: string | null;
  discoverLayout: DiscoverLayout;
  sortOrder: string;
  setViewMode: (mode: ViewMode) => void;
  setSelectedCollection: (collection: Collection | null) => void;
  setSelectedProduct: (product: Product | null) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string | null) => void;
  setDiscoverLayout: (layout: DiscoverLayout) => void;
  setSortOrder: (order: string) => void;
}

export const useStyleBankStore = create<StyleBankState>((set) => ({
  viewMode: 'discover',
  selectedCollection: null,
  selectedProduct: null,
  searchQuery: '',
  categoryFilter: null,
  discoverLayout: 'grid',
  sortOrder: 'newest',
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedCollection: (collection) => set({ selectedCollection: collection }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setDiscoverLayout: (layout) => set({ discoverLayout: layout }),
  setSortOrder: (order) => set({ sortOrder: order }),
}));
