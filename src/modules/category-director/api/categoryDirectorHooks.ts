import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/utils';
import { categoryDirectorApi } from './categoryDirectorApi';
import type { CategoryDirectorFilters } from '../stores/useCategoryDirectorFilterStore';

export const categoryDirectorKeys = {
  all: ['category-director'] as const,
  filters: (f: CategoryDirectorFilters) =>
    [...categoryDirectorKeys.all, 'filters', f] as const,
  performance: (f: CategoryDirectorFilters) =>
    [...categoryDirectorKeys.all, 'category-performance', f] as const,
  summary: (f: CategoryDirectorFilters) =>
    [...categoryDirectorKeys.all, 'category-summary', f] as const,
  sellThrough: (f: CategoryDirectorFilters) =>
    [...categoryDirectorKeys.all, 'sell-through-options', f] as const,
  inventory: (f: CategoryDirectorFilters) =>
    [...categoryDirectorKeys.all, 'inventory-lifecycle', f] as const,
  storeDist: (f: CategoryDirectorFilters) =>
    [...categoryDirectorKeys.all, 'store-distribution', f] as const,
  supplyOtb: (f: CategoryDirectorFilters) =>
    [...categoryDirectorKeys.all, 'supply-otb', f] as const,
};

export function useFilterOptions(f: CategoryDirectorFilters) {
  return useQuery({
    queryKey: categoryDirectorKeys.filters(f),
    queryFn: () => categoryDirectorApi.filters(f),
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function useCategoryPerformance(
  f: CategoryDirectorFilters,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: categoryDirectorKeys.performance(f),
    queryFn: () => categoryDirectorApi.categoryPerformance(f),
    staleTime: STALE_TIMES.LISTING,
    enabled: options?.enabled ?? true,
  });
}

export function useCategorySummary(
  f: CategoryDirectorFilters,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: categoryDirectorKeys.summary(f),
    queryFn: () => categoryDirectorApi.categorySummary(f),
    staleTime: STALE_TIMES.LISTING,
    enabled: options?.enabled ?? true,
  });
}

export function useSellThroughOptions(f: CategoryDirectorFilters) {
  return useQuery({
    queryKey: categoryDirectorKeys.sellThrough(f),
    queryFn: () => categoryDirectorApi.sellThroughOptions(f),
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useInventoryLifecycle(f: CategoryDirectorFilters) {
  return useQuery({
    queryKey: categoryDirectorKeys.inventory(f),
    queryFn: () => categoryDirectorApi.inventoryLifecycle(f),
    // Cold call ~15s (broken-set CTE); cached afterwards.
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useStoreDistribution(f: CategoryDirectorFilters) {
  return useQuery({
    queryKey: categoryDirectorKeys.storeDist(f),
    queryFn: () => categoryDirectorApi.storeDistribution(f),
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useSupplyOtb(f: CategoryDirectorFilters) {
  return useQuery({
    queryKey: categoryDirectorKeys.supplyOtb(f),
    queryFn: () => categoryDirectorApi.supplyOtb(f),
    staleTime: STALE_TIMES.LISTING,
  });
}
