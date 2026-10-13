import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/utils';
import {
  vendorCatalogKeys,
  fetchCatalogList,
  fetchCatalogFilters,
  fetchCatalogDetail,
  fetchStyles,
  updateStyles,
  uploadCatalogFile,
} from './vendorCatalogApi';
import type { CatalogListParams, StylesListParams, StyleEditItem } from './vendorCatalogApi';

export function useCatalogList(params: CatalogListParams = {}) {
  return useQuery({
    queryKey: vendorCatalogKeys.catalogList(params),
    queryFn: () => fetchCatalogList(params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
  });
}

export function useCatalogFilters() {
  return useQuery({
    queryKey: vendorCatalogKeys.catalogFilters(),
    queryFn: fetchCatalogFilters,
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function useCatalogDetail(runId: string | undefined) {
  return useQuery({
    queryKey: vendorCatalogKeys.catalogDetail(runId ?? ''),
    queryFn: () => fetchCatalogDetail(runId ?? ''),
    staleTime: STALE_TIMES.DETAIL,
    enabled: !!runId,
  });
}

export function useStyles(runId: string | undefined, params: StylesListParams = {}) {
  return useQuery({
    queryKey: vendorCatalogKeys.styles(runId ?? '', params),
    queryFn: () => fetchStyles(runId ?? '', params),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
    enabled: !!runId,
  });
}

export function useUpdateStyles(runId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (edits: StyleEditItem[]) => updateStyles(runId ?? '', edits),
    onSuccess: async () => {
      // Force-refresh every variant of the styles + detail query for this
      // run so the card immediately reflects the saved values. invalidate
      // alone leaves placeholderData visible while the refetch settles —
      // refetchQueries with type:'all' is more aggressive and works even
      // when the query is still within its staleTime window.
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: [...vendorCatalogKeys.all, 'styles', runId ?? ''],
          type: 'all',
        }),
        queryClient.refetchQueries({
          queryKey: vendorCatalogKeys.catalogDetail(runId ?? ''),
          type: 'all',
        }),
      ]);
    },
  });
}

export function useUploadCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadCatalogFile,
    onSuccess: async () => {
      // Bust catalog list + filters so the just-uploaded run shows up.
      await Promise.all([
        queryClient.refetchQueries({ queryKey: vendorCatalogKeys.catalogLists(), type: 'all' }),
        queryClient.refetchQueries({ queryKey: vendorCatalogKeys.catalogFilters(), type: 'all' }),
      ]);
    },
  });
}
