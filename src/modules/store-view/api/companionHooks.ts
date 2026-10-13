import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/utils';
import { companionApi } from './companionApi';
import type {
  CompanionAiSummary,
  CompanionRange,
  CompanionSummaryView,
  StoreDirectoryParams,
} from './companionApi';

export const companionKeys = {
  all: ['companion'] as const,
  businessOverview: (r: CompanionRange) => [...companionKeys.all, 'business-overview', r] as const,
  salesDetail: (r: CompanionRange) => [...companionKeys.all, 'sales-detail', r] as const,
  storePerformance: (r: CompanionRange) => [...companionKeys.all, 'store-performance', r] as const,
  storeLocations: (r: CompanionRange) => [...companionKeys.all, 'store-locations', r] as const,
  storeDirectory: (r: CompanionRange, p: StoreDirectoryParams) =>
    [...companionKeys.all, 'store-directory', r, p] as const,
  storeDetail: (uid: string | null, r: CompanionRange) =>
    [...companionKeys.all, 'store-detail', uid, r] as const,
  aiSummary: (view: CompanionSummaryView, r: CompanionRange) =>
    [...companionKeys.all, 'ai-summary', view, r] as const,
};

export function useBusinessOverview(range: CompanionRange) {
  return useQuery({
    queryKey: companionKeys.businessOverview(range),
    queryFn: () => companionApi.businessOverview(range),
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useSalesDetail(range: CompanionRange, enabled = true) {
  return useQuery({
    queryKey: companionKeys.salesDetail(range),
    queryFn: () => companionApi.salesDetail(range),
    staleTime: STALE_TIMES.LISTING,
    enabled,
  });
}

export function useStorePerformance(range: CompanionRange) {
  return useQuery({
    queryKey: companionKeys.storePerformance(range),
    queryFn: () => companionApi.storePerformance(range),
    staleTime: STALE_TIMES.LISTING,
  });
}

/** All store pins for the network map — fetched lazily (only when the map shows). */
export function useStoreLocations(range: CompanionRange, enabled = true) {
  return useQuery({
    queryKey: companionKeys.storeLocations(range),
    queryFn: () => companionApi.storeLocations(range),
    staleTime: STALE_TIMES.LISTING,
    enabled,
  });
}

export function useStoreDirectory(range: CompanionRange, params: StoreDirectoryParams) {
  return useQuery({
    queryKey: companionKeys.storeDirectory(range, params),
    queryFn: () => companionApi.storeDirectory(range, params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
  });
}

export function useStoreDetail(uid: string | null, range: CompanionRange) {
  return useQuery({
    queryKey: companionKeys.storeDetail(uid, range),
    queryFn: () => companionApi.storeDetail(uid!, range),
    enabled: !!uid,
    staleTime: STALE_TIMES.DETAIL,
  });
}

/** AI briefing — LLM-generated, so keep it fresh for 30 min to avoid re-calls. */
export function useCompanionAiSummary(view: CompanionSummaryView, range: CompanionRange) {
  return useQuery({
    queryKey: companionKeys.aiSummary(view, range),
    queryFn: () => companionApi.aiSummary(view, range),
    staleTime: STALE_TIMES.FILTERS,
  });
}

/** Force-regenerate the briefing; seeds the query cache with the fresh result. */
export function useRefreshAiSummary(view: CompanionSummaryView, range: CompanionRange) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => companionApi.refreshAiSummary(view, range),
    onSuccess: (data: CompanionAiSummary) => {
      qc.setQueryData(companionKeys.aiSummary(view, range), data);
    },
  });
}

export function useProductOverview(range: CompanionRange) {
  return useQuery({
    queryKey: [...companionKeys.all, 'productOverview', range],
    queryFn: () => companionApi.productOverview(range),
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useJourneyFunnel(range: CompanionRange) {
  return useQuery({
    queryKey: [...companionKeys.all, 'journeyFunnel', range],
    queryFn: () => companionApi.journeyFunnel(range),
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useDiscoveryCatalogue(range: CompanionRange) {
  return useQuery({
    queryKey: [...companionKeys.all, 'discoveryCatalogue', range],
    queryFn: () => companionApi.discoveryCatalogue(range),
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useProductCx(range: CompanionRange) {
  return useQuery({
    queryKey: [...companionKeys.all, 'productCx', range],
    queryFn: () => companionApi.productCx(range),
    staleTime: STALE_TIMES.LISTING,
  });
}
