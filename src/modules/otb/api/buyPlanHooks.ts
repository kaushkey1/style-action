import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/utils';
import { dpKeys } from './dpApi';
import {
  buyPlanKeys,
  fetchBuyPlanFilters,
  fetchCategories,
  fetchFashionGrades,
  fetchOptions,
  fetchBrandViewFilters,
  fetchBrandViewListing,
  fetchRunOptionsFilters,
  fetchRunOptions,
  fetchBuyPlanHistory,
  downloadRunOptions,
  downloadBrandView,
  toggleOptionActive,
  updateOptionQuantity,
  updateRunStatus,
  sendToDp,
} from './buyPlanApi';

export function useBuyPlanFilters() {
  return useQuery({
    queryKey: buyPlanKeys.filters(),
    queryFn: fetchBuyPlanFilters,
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function useCategories(params?: Parameters<typeof fetchCategories>[0]) {
  return useQuery({
    queryKey: buyPlanKeys.categories(params),
    queryFn: () => fetchCategories(params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
  });
}

export function useFashionGrades(categoryCode: string, params?: Parameters<typeof fetchFashionGrades>[1]) {
  return useQuery({
    queryKey: buyPlanKeys.fashionGrades(categoryCode, params),
    queryFn: () => fetchFashionGrades(categoryCode, params),
    staleTime: STALE_TIMES.LISTING,
    enabled: !!categoryCode,
  });
}

export function useOptions(params: Parameters<typeof fetchOptions>[0]) {
  return useQuery({
    queryKey: buyPlanKeys.options(params),
    queryFn: () => fetchOptions(params),
    staleTime: STALE_TIMES.DETAIL,
    enabled: !!params.category && !!params.grade && !!params.hit,
  });
}

export function useBrandViewFilters(params?: Parameters<typeof fetchBrandViewFilters>[0]) {
  return useQuery({
    queryKey: buyPlanKeys.brandViewFilters(params),
    queryFn: () => fetchBrandViewFilters(params),
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function useBrandViewListing(params?: Parameters<typeof fetchBrandViewListing>[0]) {
  return useQuery({
    queryKey: buyPlanKeys.brandViewListing(params),
    queryFn: () => fetchBrandViewListing(params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
  });
}

export function useRunOptionsFilters(runId: string) {
  return useQuery({
    queryKey: buyPlanKeys.runOptionsFilters(runId),
    queryFn: () => fetchRunOptionsFilters(runId),
    staleTime: STALE_TIMES.FILTERS,
    enabled: !!runId,
  });
}

export function useRunOptions(runId: string, params?: Parameters<typeof fetchRunOptions>[1]) {
  return useQuery({
    queryKey: buyPlanKeys.runOptions(runId, params),
    queryFn: () => fetchRunOptions(runId, params),
    staleTime: STALE_TIMES.DETAIL,
    enabled: !!runId,
  });
}

export function useBuyPlanHistory(runId: string) {
  return useQuery({
    queryKey: buyPlanKeys.history(runId),
    queryFn: () => fetchBuyPlanHistory(runId),
    staleTime: STALE_TIMES.HISTORY,
    enabled: !!runId,
  });
}

export function useDownloadRunOptions() {
  return useMutation({
    mutationFn: ({ runId, params }: { runId: string; params?: Record<string, string> }) =>
      downloadRunOptions(runId, params),
  });
}

export function useDownloadBrandView() {
  return useMutation({
    mutationFn: (params?: Parameters<typeof downloadBrandView>[0]) =>
      downloadBrandView(params),
  });
}

export function useToggleOptionActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ optionId, isActive }: { optionId: number; isActive: boolean }) =>
      toggleOptionActive(optionId, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: buyPlanKeys.all });
    },
  });
}

export function useUpdateOptionQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ optionId, quantity, deliveryDate, mrp, costPrice, costingDisabled }: {
      optionId: number;
      quantity: number;
      deliveryDate?: string | null;
      mrp?: number | null;
      costPrice?: number | null;
      costingDisabled?: boolean;
    }) => updateOptionQuantity(optionId, quantity, deliveryDate, mrp, costPrice, costingDisabled),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: buyPlanKeys.all });
    },
  });
}

export function useUpdateRunStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, status }: { runId: string; status: string }) =>
      updateRunStatus(runId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: buyPlanKeys.all });
    },
  });
}

export function useSendToDp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => sendToDp(runId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: buyPlanKeys.all });
      void queryClient.invalidateQueries({ queryKey: dpKeys.all });
    },
  });
}
