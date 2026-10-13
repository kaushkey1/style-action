import { create } from 'zustand';
import type { ReviewTab, UnifiedItem } from '../data/mockReviewData';

type SortOption = 'impact-desc' | 'severity-desc' | 'sla-asc' | 'recency';

interface ReviewFilters {
  severity: string;
  lifecycle: string;
  domain: string;
  agent: string;
  impact: string;
  owner: string;
  confidence: string;
}

const EMPTY_FILTERS: ReviewFilters = {
  severity: 'all',
  lifecycle: 'all',
  domain: 'all',
  agent: 'all',
  impact: 'all',
  owner: 'all',
  confidence: 'all',
};

interface ReviewStore {
  selectedItemId: string | null;
  batchSelectedIds: string[];
  activeTab: ReviewTab;
  filters: ReviewFilters;
  sort: SortOption;
  isBatchMode: boolean;

  selectItem: (id: string | null) => void;
  toggleBatchItem: (id: string) => void;
  selectBatchItems: (ids: string[]) => void;
  clearBatch: () => void;
  setActiveTab: (tab: ReviewTab) => void;
  setFilter: <K extends keyof ReviewFilters>(key: K, value: ReviewFilters[K]) => void;
  clearFilters: () => void;
  setSort: (sort: SortOption) => void;
  setBatchMode: (enabled: boolean) => void;

  items: UnifiedItem[];
  setItems: (items: UnifiedItem[]) => void;
  approveItem: (id: string) => void;
  undoApprove: (id: string) => void;
  rejectItem: (id: string, reasonCode?: string, note?: string) => void;
  acknowledgeItem: (id: string) => void;
}

export const useReviewStore = create<ReviewStore>((set) => ({
  selectedItemId: null,
  batchSelectedIds: [],
  activeTab: 'allOpen',
  filters: { ...EMPTY_FILTERS },
  sort: 'impact-desc',
  isBatchMode: false,
  items: [],

  selectItem: (id) => set({ selectedItemId: id }),

  toggleBatchItem: (id) =>
    set((state) => {
      const ids = state.batchSelectedIds.includes(id)
        ? state.batchSelectedIds.filter((x) => x !== id)
        : [...state.batchSelectedIds, id];
      return { batchSelectedIds: ids, isBatchMode: ids.length > 0 };
    }),

  selectBatchItems: (ids) => set({ batchSelectedIds: ids, isBatchMode: ids.length > 0 }),

  clearBatch: () => set({ batchSelectedIds: [], isBatchMode: false }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  clearFilters: () => set({ filters: { ...EMPTY_FILTERS } }),

  setSort: (sort) => set({ sort }),

  setBatchMode: (enabled) =>
    set((state) => ({
      isBatchMode: enabled,
      batchSelectedIds: enabled ? state.batchSelectedIds : [],
    })),

  setItems: (items) => set({ items }),

  approveItem: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, status: 'resolved' as const, isResolved: true, resolvedAt: new Date().toISOString() } : item,
      ),
    })),

  undoApprove: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, status: 'awaiting-approval' as const, isResolved: false } : item,
      ),
      selectedItemId: id,
    })),

  rejectItem: (id, reasonCode, note) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? {
          ...item,
          status: 'human-overridden' as const,
          isResolved: true,
          resolvedAt: new Date().toISOString(),
          auditLog: [
            ...item.auditLog,
            ...(reasonCode ? [{ timestamp: new Date().toISOString(), actor: 'Current User', action: `Rejected: ${reasonCode}${note ? ` — ${note}` : ''}` }] : []),
          ],
        } : item,
      ),
    })),

  acknowledgeItem: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, status: 'resolved' as const, isResolved: true, resolvedAt: new Date().toISOString() } : item,
      ),
    })),
}));
