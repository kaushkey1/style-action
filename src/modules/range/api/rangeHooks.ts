import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/utils';
import {
  rangeKeys,
  fetchHits,
  fetchHealthSummary,
  fetchRangeArchitectureHealthz,
  fetchSegments,
  fetchFilterOptions,
  fetchSegmentSummary,
  fetchFamilies,
  fetchBuyingModels,
  fetchStores,
  fetchStoreDetail,
  fetchRuns,
  fetchVersionCompare,
  fetchFamilyDetail,
  fetchBricks,
  fetchTrends,
  fetchHierarchy,
  updateBuyerEdit,
  bulkBuyerEdit,
  saveBmAllocation,
  fetchNetworkOverviewFilters,
  fetchNetworkOverview,
  fetchNetworkOverviewDetail,
  fetchNetworkOverviewDetailFilters,
  fetchNetworkOverviewDetailStores,
  fetchRAActivityLog,
  submitToPlm,
  fetchPlmSubmission,
  fetchPlmSubmissionItems,
  retryPlmSubmission,
} from './rangeApi';
import type { BuyerEditPayload, BulkBuyerEditPayload, BmAllocationPayload, PlmSelection, PlmSubmissionLookup } from './rangeApi';
export type { BuyerEditPayload, BulkBuyerEditPayload, BmAllocationPayload };

export function useHits() {
  return useQuery({
    queryKey: rangeKeys.hits(),
    queryFn: fetchHits,
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function useHealthSummary(hit: string) {
  return useQuery({
    queryKey: rangeKeys.healthSummary(hit),
    queryFn: () => fetchHealthSummary(hit),
    staleTime: STALE_TIMES.LISTING,
    enabled: !!hit,
  });
}

// Manual liveness probe against the Cortex Range Architecture service
// (`/service/application/cortex-range-architecture/v1.0/healthz`). Exposed as a
// mutation so it only fires when the user clicks the Health Check button.
export function useRangeArchitectureHealthCheck() {
  return useMutation({
    mutationFn: fetchRangeArchitectureHealthz,
  });
}

export function useSegments(hit: string, filters?: Parameters<typeof fetchSegments>[1]) {
  return useQuery({
    queryKey: rangeKeys.segments(hit, filters),
    queryFn: () => fetchSegments(hit, filters),
    staleTime: STALE_TIMES.LISTING,
    enabled: !!hit,
  });
}

export function useFilterOptions(hit?: string) {
  return useQuery({
    queryKey: rangeKeys.filterOptions(hit),
    queryFn: () => fetchFilterOptions(hit),
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function useSegmentSummary(segmentCode: string, hit: string) {
  return useQuery({
    queryKey: rangeKeys.segmentSummary(segmentCode, hit),
    queryFn: () => fetchSegmentSummary(segmentCode, hit),
    staleTime: STALE_TIMES.LISTING,
    enabled: !!segmentCode && !!hit,
  });
}

export function useFamilies(segmentCode: string, hit: string) {
  return useQuery({
    queryKey: rangeKeys.families(segmentCode, hit),
    queryFn: () => fetchFamilies(segmentCode, hit),
    staleTime: STALE_TIMES.LISTING,
    enabled: !!segmentCode && !!hit,
  });
}

export function useBuyingModels(segmentCode: string, hit: string) {
  return useQuery({
    queryKey: rangeKeys.buyingModels(segmentCode, hit),
    queryFn: () => fetchBuyingModels(segmentCode, hit),
    staleTime: STALE_TIMES.LISTING,
    enabled: !!segmentCode && !!hit,
  });
}

export function useStores(params: Parameters<typeof fetchStores>[0]) {
  return useQuery({
    queryKey: rangeKeys.stores(params),
    queryFn: () => fetchStores(params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
    enabled: !!params.hit,
  });
}

export function useStoreDetail(storeId: string, hit: string, segmentCode?: string) {
  return useQuery({
    queryKey: rangeKeys.storeDetail(storeId, hit, segmentCode),
    queryFn: () => fetchStoreDetail(storeId, hit, segmentCode),
    staleTime: STALE_TIMES.DETAIL,
    enabled: !!storeId && !!hit,
  });
}

export function useRuns(params: Parameters<typeof fetchRuns>[0]) {
  return useQuery({
    queryKey: rangeKeys.runs(params),
    queryFn: () => fetchRuns(params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
    enabled: !!params.hit,
  });
}

export function useVersionCompare(params: Parameters<typeof fetchVersionCompare>[0]) {
  return useQuery({
    queryKey: rangeKeys.versionCompare(params),
    queryFn: () => fetchVersionCompare(params),
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useFamilyDetail(segmentCode: string, familyCode: string, hit: string) {
  return useQuery({
    queryKey: rangeKeys.familyDetail(segmentCode, familyCode, hit),
    queryFn: () => fetchFamilyDetail(segmentCode, familyCode, hit),
    staleTime: STALE_TIMES.DETAIL,
    enabled: !!segmentCode && !!familyCode && !!hit,
  });
}

export function useBricks(segmentCode: string, familyCode: string, hit: string, page?: number, pageSize?: number) {
  return useQuery({
    queryKey: rangeKeys.bricks(segmentCode, familyCode, hit, page, pageSize),
    queryFn: () => fetchBricks(segmentCode, familyCode, hit, page, pageSize),
    staleTime: STALE_TIMES.DETAIL,
    placeholderData: keepPreviousData,
    enabled: !!segmentCode && !!familyCode && !!hit,
  });
}

export function useTrends(segmentCode: string, hit: string) {
  return useQuery({
    queryKey: rangeKeys.trends(segmentCode, hit),
    queryFn: () => fetchTrends(segmentCode, hit),
    staleTime: STALE_TIMES.LISTING,
    enabled: !!segmentCode && !!hit,
  });
}

export function useHierarchy(level: 'segment' | 'family' | 'brick', code: string, hit: string) {
  return useQuery({
    queryKey: rangeKeys.hierarchy(level, code, hit),
    queryFn: () => fetchHierarchy(level, code, hit),
    staleTime: STALE_TIMES.LISTING,
    enabled: !!code && !!hit,
  });
}

export function useUpdateBuyerEdit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ resultId, payload }: { resultId: string; payload: BuyerEditPayload }) =>
      updateBuyerEdit(resultId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rangeKeys.all });
    },
  });
}

export function useBulkBuyerEdit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkBuyerEditPayload) => bulkBuyerEdit(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rangeKeys.all });
    },
  });
}

export function useSaveBmAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ segmentCode, familyCode, payload }: {
      segmentCode: string;
      familyCode: string;
      payload: BmAllocationPayload;
    }) => saveBmAllocation(segmentCode, familyCode, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rangeKeys.all });
    },
  });
}

// ── Network Overview ──────────────────────────────────────────────────────

export function useNetworkOverviewFilters(category?: string) {
  return useQuery({
    queryKey: rangeKeys.networkOverviewFilters(category),
    queryFn: () => fetchNetworkOverviewFilters(category),
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function useNetworkOverview(params: {
  hit: string;
  category?: string;
  subcategory?: string;
  fashion_grade?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: rangeKeys.networkOverview(params),
    queryFn: () => fetchNetworkOverview(params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
    enabled: !!params.hit,
  });
}

export function useNetworkOverviewDetailFilters(params: {
  run_id: string;
  category: string;
  subcategory: string;
  fashion_grade: string;
}) {
  return useQuery({
    queryKey: rangeKeys.networkOverviewDetailFilters(params),
    queryFn: () => fetchNetworkOverviewDetailFilters(params),
    staleTime: STALE_TIMES.FILTERS,
    // fashion_grade is empty for VC-backed/merge tenants (grade not carried on the
    // catalogue side), so it must not gate the query — only the brick coordinates do.
    enabled: !!params.run_id && !!params.category && !!params.subcategory,
  });
}

export function useNetworkOverviewDetail(params: {
  run_id: string;
  category: string;
  subcategory: string;
  fashion_grade: string;
  page?: number;
  page_size?: number;
  brick?: string;
  fabric?: string;
  fit?: string;
  length?: string;
  pattern?: string;
}) {
  return useQuery({
    queryKey: rangeKeys.networkOverviewDetail(params),
    queryFn: () => fetchNetworkOverviewDetail(params),
    staleTime: STALE_TIMES.DETAIL,
    placeholderData: keepPreviousData,
    // fashion_grade is empty for VC-backed/merge tenants (grade not carried on the
    // catalogue side), so it must not gate the query — only the brick coordinates do.
    enabled: !!params.run_id && !!params.category && !!params.subcategory,
  });
}

export function useNetworkOverviewDetailStores(params: {
  run_id: string;
  category: string;
  subcategory: string;
  fashion_grade: string;
  brick?: string;
  fabric?: string;
  fit?: string;
  length?: string;
  pattern?: string;
}) {
  return useQuery({
    queryKey: rangeKeys.networkOverviewDetailStores(params),
    queryFn: () => fetchNetworkOverviewDetailStores(params),
    staleTime: STALE_TIMES.DETAIL,
    // fashion_grade is empty for VC-backed/merge tenants; brick still gates stores.
    enabled: !!params.run_id && !!params.category && !!params.subcategory && !!params.brick,
  });
}

export function useRAActivityLog(runId?: string) {
  return useQuery({
    queryKey: rangeKeys.activityLog(runId),
    queryFn: () => fetchRAActivityLog({ run_id: runId, page_size: 100 }),
    staleTime: STALE_TIMES.DETAIL,
    enabled: !!runId,
  });
}

export function useSubmitToPlm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { run_id: string; category: string; subcategory: string; fashion_grade: string }) =>
      submitToPlm(params),
    onSuccess: (result, params) => {
      if ('submission_id' in result) {
        queryClient.setQueryData<PlmSubmissionLookup>(rangeKeys.plmSubmission(params), {
          transport: result.transport, submission: result,
        });
      }
      void queryClient.invalidateQueries({ queryKey: rangeKeys.all });
    },
  });
}

export function usePlmSubmission(params: PlmSelection) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: rangeKeys.plmSubmission(params),
    queryFn: () => fetchPlmSubmission(params),
    enabled: !!params.run_id && !!params.category && !!params.subcategory,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: query => {
      const submission = query.state.data?.submission;
      return query.state.status !== 'error'
        && submission?.transport === 'kafka'
        && (submission.status === 'ACCEPTED' || submission.status === 'PUBLISHING')
        ? 2000 : false;
    },
    refetchIntervalInBackground: false,
  });
  const submissionId = query.data?.submission?.submission_id;
  const publicationState = query.data?.submission?.status;
  const processingState = query.data?.submission?.processing?.status;
  useEffect(() => {
    if (publicationState) {
      void queryClient.invalidateQueries({ queryKey: [...rangeKeys.all, 'no-data'] });
      void queryClient.invalidateQueries({ queryKey: [...rangeKeys.all, 'plm-items', submissionId] });
    }
  }, [submissionId, publicationState, processingState, queryClient]);
  return query;
}

export function usePlmSubmissionItems(id: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: rangeKeys.plmItems(id, page),
    queryFn: () => fetchPlmSubmissionItems(id, page),
    enabled: enabled && !!id,
    staleTime: 0,
  });
}

export function useRetryPlmSubmission(params: PlmSelection) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryPlmSubmission,
    onSuccess: result => {
      queryClient.setQueryData<PlmSubmissionLookup>(rangeKeys.plmSubmission(params), {
        transport: result.transport, submission: result,
      });
      void queryClient.invalidateQueries({ queryKey: rangeKeys.all });
    },
  });
}
