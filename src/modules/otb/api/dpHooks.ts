import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/utils';
import {
  dpKeys,
  fetchDpFilters,
  fetchDpPlans,
  fetchDpAllocations,
  fetchDpAllocationFilters,
  downloadDpPlans,
  downloadDpAllocations,
  sendToProcuro,
} from './dpApi';

export function useDpFilters(params?: Parameters<typeof fetchDpFilters>[0]) {
  return useQuery({
    queryKey: dpKeys.filters(params),
    queryFn: () => fetchDpFilters(params),
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function useDpPlans(params?: Parameters<typeof fetchDpPlans>[0]) {
  return useQuery({
    queryKey: dpKeys.planList(params ?? {}),
    queryFn: () => fetchDpPlans(params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
  });
}

export function useDpAllocations(
  dpPlanId: string,
  params?: Parameters<typeof fetchDpAllocations>[1],
) {
  return useQuery({
    queryKey: dpKeys.allocationList(dpPlanId, params ?? {}),
    queryFn: () => fetchDpAllocations(dpPlanId, params),
    staleTime: STALE_TIMES.DETAIL,
    placeholderData: keepPreviousData,
    enabled: !!dpPlanId,
  });
}

export function useDpAllocationFilters(dpPlanId: string) {
  return useQuery({
    queryKey: dpKeys.allocationFilters(dpPlanId),
    queryFn: () => fetchDpAllocationFilters(dpPlanId),
    staleTime: STALE_TIMES.FILTERS,
    enabled: !!dpPlanId,
  });
}

export function useDownloadDpPlans() {
  return useMutation({
    mutationFn: (params?: Parameters<typeof downloadDpPlans>[0]) =>
      downloadDpPlans(params),
  });
}

export function useDownloadDpAllocations() {
  return useMutation({
    mutationFn: ({ dpPlanId, params }: { dpPlanId: string; params?: Parameters<typeof downloadDpAllocations>[1] }) =>
      downloadDpAllocations(dpPlanId, params),
  });
}

export function useSendToProcuro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, params }: { runId: string; params?: { drop_number?: number } }) =>
      sendToProcuro(runId, params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dpKeys.all });
    },
  });
}
