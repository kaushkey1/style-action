import { create } from 'zustand';
import { getDataAvailableThroughDateIso } from '@/lib/utils';
import type { StorePerformanceFilterParams } from '../api/storePerformanceApi';

export interface StorePerformanceFilters {
  dateFrom: string;
  dateTo: string;
  format: string;
  cluster: string;
  region: string;
  city: string;
  category: string;
}

function getLastMonthRange(): { from: string; to: string } {
  const now = new Date();
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
  const fmt = (d: Date): string =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { from: fmt(firstOfLastMonth), to: fmt(lastOfLastMonth) };
}

export function getDefaultStorePerformanceFilters(): StorePerformanceFilters {
  const lastMonth = getLastMonthRange();
  return {
    dateFrom: lastMonth.from,
    dateTo: lastMonth.to,
    format: 'TRENDS',
    cluster: 'all',
    region: 'all',
    city: 'all',
    category: 'all',
  };
}

const defaultFilters = getDefaultStorePerformanceFilters();

interface StorePerformanceFilterState {
  filters: StorePerformanceFilters;
  setFilter: <K extends keyof StorePerformanceFilters>(
    key: K,
    value: StorePerformanceFilters[K],
  ) => void;
  resetFilters: () => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

export const useStorePerformanceFilterStore =
  create<StorePerformanceFilterState>((set, get) => ({
    filters: { ...defaultFilters },
    setFilter: (key, value) =>
      set((state) => ({ filters: { ...state.filters, [key]: value } })),
    resetFilters: () => set({ filters: { ...getDefaultStorePerformanceFilters() } }),
    clearFilters: () => {
      const { dateFrom, dateTo } = get().filters;
      set({ filters: { ...getDefaultStorePerformanceFilters(), dateFrom, dateTo } });
    },
    hasActiveFilters: () => {
      const defaults = getDefaultStorePerformanceFilters();
      const { filters } = get();
      return Object.entries(filters).some(([key, value]) => {
        if (key === 'dateFrom' || key === 'dateTo') return false;
        return value !== defaults[key as keyof StorePerformanceFilters];
      });
    },
  }));

export function storePerformanceFilterKey(
  filters: StorePerformanceFilters,
): string {
  return Object.values(filters).join('|');
}

export function toApiParams(
  filters: StorePerformanceFilters,
): StorePerformanceFilterParams {
  const yearMonth =
    filters.dateFrom && filters.dateTo
      ? filters.dateFrom.slice(0, 7)
      : undefined;
  return {
    year_month: yearMonth,
    startDate: filters.dateFrom || undefined,
    endDate: filters.dateTo || undefined,
    format_std: filters.format !== 'all' ? filters.format : undefined,
    store_grade: filters.cluster !== 'all' ? filters.cluster : undefined,
    region: filters.region !== 'all' ? filters.region : undefined,
    city: filters.city !== 'all' ? filters.city : undefined,
    category: filters.category !== 'all' ? filters.category : undefined,
  };
}

export function getPresetDateRange(
  preset: string,
): { from: string; to: string } | null {
  const now = new Date();
  const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
  const fmt = (d: Date): string =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const t2 = getDataAvailableThroughDateIso();

  switch (preset) {
    case 'mtd':
      return {
        from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
        to: t2,
      };
    case 'wtd': {
      const sunday = new Date(now);
      sunday.setDate(sunday.getDate() - sunday.getDay());
      return { from: fmt(sunday), to: t2 };
    }
    case 'qtd': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      return {
        from: `${now.getFullYear()}-${pad(qMonth + 1)}-01`,
        to: t2,
      };
    }
    case 'ytd':
      return { from: `${now.getFullYear()}-01-01`, to: t2 };
    case 'last-month':
      return getLastMonthRange();
    default:
      return null;
  }
}
