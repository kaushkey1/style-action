import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPost, pathCode } from './client';

import type {
  DcList,
  DcRanking,
  DcStock,
  DcSummary,
  Finding,
  OptionStoreAvailability,
  Health,
  Lifecycle,
  OptionQuery,
  OptionStoreDetail,
  OptionStoreRow,
  Page,
  Snapshot,
  SnapshotDetail,
  StoreBricks,
  StoreList,
} from './types';

const POLL_MS = 2000;
const HEALTH_STALE_MS = 60 * 1000;
const DATA_STALE_MS = 5 * 60 * 1000;

export const styleActionsKeys = {
  all: ['style-actions-product'] as const,
  health: () => [...styleActionsKeys.all, 'health'] as const,
  snapshots: () => [...styleActionsKeys.all, 'snapshots'] as const,
  snapshot: (id: string) => [...styleActionsKeys.all, 'snapshot', id] as const,
  findings: (id: string, code: string | null, store: string | null, dc: string | null, page: number) =>
    [...styleActionsKeys.all, 'findings', id, code, store, dc, page] as const,
  stores: (id: string) => [...styleActionsKeys.all, 'stores', id] as const,
  options: (query: OptionQuery) => [...styleActionsKeys.all, 'options', query] as const,
  option: (id: string, store: string, option: string) => [...styleActionsKeys.all, 'option', id, store, option] as const,
  lifecycle: (id: string, store: string) => [...styleActionsKeys.all, 'lifecycle', id, store] as const,
  dcs: (id: string) => [...styleActionsKeys.all, 'dcs', id] as const,
  dcSummary: (id: string, dc: string, ranking: DcRanking) => [...styleActionsKeys.all, 'dc-summary', id, dc, ranking] as const,
  dcStock: (id: string, dc: string) => [...styleActionsKeys.all, 'dc-stock', id, dc] as const,
  storeBricks: (id: string, store: string) => [...styleActionsKeys.all, 'store-bricks', id, store] as const,
  availability: (id: string, store: string, option: string) => [...styleActionsKeys.all, 'availability', id, store, option] as const,
};

export function useHealth() {
  return useQuery({ queryKey: styleActionsKeys.health(), queryFn: () => apiGet<Health>('/v1/health'), staleTime: HEALTH_STALE_MS });
}

export function useSnapshots() {
  return useQuery({
    queryKey: styleActionsKeys.snapshots(),
    queryFn: () => apiGet<{ items: Snapshot[] }>('/v1/snapshots'),
    staleTime: HEALTH_STALE_MS,
  });
}

/** Snapshot detail; polls while the snapshot is building or its extension is running (S2-R20). */
export function useSnapshot(snapshotId: string | null) {
  return useQuery({
    queryKey: styleActionsKeys.snapshot(snapshotId ?? 'none'),
    queryFn: () => apiGet<SnapshotDetail>(`/v1/snapshots/${pathCode(snapshotId, 'snapshot')}`),
    enabled: Boolean(snapshotId),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'building' || data?.extension?.status === 'running' ? POLL_MS : false;
    },
  });
}

/** Starts extending a ready snapshot to the server's content version (POST extend: 202 started, 200 nothing to do). */
export function useExtendSnapshot() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (snapshotId: string) => apiPost<Snapshot>(`/v1/snapshots/${pathCode(snapshotId, 'snapshot')}/extend`),
    onSuccess: (snapshot) => {
      client.setQueryData<SnapshotDetail>(styleActionsKeys.snapshot(snapshot.snapshot_id), (current) => (current ? { ...current, ...snapshot } : current));
      void client.invalidateQueries({ queryKey: styleActionsKeys.snapshot(snapshot.snapshot_id) });
    },
  });
}

/** The option's 14-day size × day grid for the drawer (getOptionStoreAvailability; 409 without health). */
export function useOptionStoreAvailability(snapshotId: string | null, storeCode: string, optionCode: string | null, isEnabled: boolean) {
  return useQuery({
    queryKey: styleActionsKeys.availability(snapshotId ?? 'none', storeCode, optionCode ?? 'none'),
    queryFn: () =>
      apiGet<OptionStoreAvailability>(`/v1/option-stores/${pathCode(storeCode, 'store')}/${pathCode(optionCode, 'option')}/availability`, {
        snapshot_id: snapshotId,
      }),
    enabled: Boolean(isEnabled && snapshotId && storeCode && optionCode),
    staleTime: DATA_STALE_MS,
  });
}

export function useBuildSnapshot() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { as_of: string; dcs: string[]; focus_stores: string[] }) => apiPost<Snapshot>('/v1/snapshots', body),
    onSuccess: (created) => {
      // List the new snapshot at once, so a view that switches to it never sees it as "not listed" (S2-C7).
      client.setQueryData<{ items: Snapshot[] }>(styleActionsKeys.snapshots(), (current) => ({
        items: [created, ...(current?.items ?? []).filter((item) => item.snapshot_id !== created.snapshot_id)],
      }));
      void client.invalidateQueries({ queryKey: styleActionsKeys.snapshots() });
      void client.invalidateQueries({ queryKey: styleActionsKeys.health() });
    },
  });
}

/** Finding records for one code, scoped to a store, a DC (S2-R2 drawer scope "This DC") or all stores. */
export function useFindings(snapshotId: string | null, code: string | null, storeCode: string | null, page: number, dcCode: string | null = null) {
  return useQuery({
    queryKey: styleActionsKeys.findings(snapshotId ?? 'none', code, storeCode, dcCode, page),
    queryFn: () =>
      apiGet<Page<Finding>>(`/v1/snapshots/${pathCode(snapshotId, 'snapshot')}/findings`, {
        code,
        store_code: storeCode,
        dc_code: dcCode,
        page,
        page_size: 50,
      }),
    enabled: Boolean(snapshotId && code),
    placeholderData: keepPreviousData,
  });
}

export function useStores(snapshotId: string | null) {
  return useQuery({
    queryKey: styleActionsKeys.stores(snapshotId ?? 'none'),
    queryFn: () => apiGet<StoreList>('/v1/stores', { snapshot_id: snapshotId }),
    enabled: Boolean(snapshotId),
    staleTime: DATA_STALE_MS,
  });
}

export function useOptionStores(query: OptionQuery | null) {
  return useQuery({
    queryKey: styleActionsKeys.options(query ?? { snapshotId: 'none', storeCode: 'none' }),
    queryFn: () =>
      apiGet<Page<OptionStoreRow>>('/v1/option-stores', {
        snapshot_id: query?.snapshotId,
        store_code: query?.storeCode,
        grade_class: query?.gradeClass,
        cohort: query?.cohorts?.join(','),
        q: query?.q,
        segment: query?.segment,
        brick: query?.brick,
        band: query?.bands?.join(','),
        sort: query?.sort,
        page: query?.page,
        page_size: query?.pageSize,
      }),
    enabled: Boolean(query?.snapshotId && query?.storeCode),
    placeholderData: keepPreviousData,
    staleTime: DATA_STALE_MS,
  });
}

export function useOptionStore(snapshotId: string | null, storeCode: string, optionCode: string) {
  return useQuery({
    queryKey: styleActionsKeys.option(snapshotId ?? 'none', storeCode, optionCode),
    queryFn: () =>
      apiGet<OptionStoreDetail>(`/v1/option-stores/${pathCode(storeCode, 'store')}/${pathCode(optionCode, 'option')}`, {
        snapshot_id: snapshotId,
      }),
    enabled: Boolean(snapshotId && storeCode && optionCode),
    staleTime: DATA_STALE_MS,
  });
}

export function useLifecycle(snapshotId: string | null, storeCode: string | null) {
  return useQuery({
    queryKey: styleActionsKeys.lifecycle(snapshotId ?? 'none', storeCode ?? 'none'),
    queryFn: () => apiGet<Lifecycle>('/v1/lifecycle', { snapshot_id: snapshotId, store_code: storeCode }),
    enabled: Boolean(snapshotId && storeCode),
    staleTime: DATA_STALE_MS,
  });
}

/** DCs of a snapshot with their store counts (listDcs; the DC selector on both views). */
export function useDcs(snapshotId: string | null) {
  return useQuery({
    queryKey: styleActionsKeys.dcs(snapshotId ?? 'none'),
    queryFn: () => apiGet<DcList>('/v1/dcs', { snapshot_id: snapshotId }),
    enabled: Boolean(snapshotId),
    staleTime: DATA_STALE_MS,
  });
}

/** DC totals, deltas and ranked stores (getDcSummary); the previous ranking stays on screen while the next loads. */
export function useDcSummary(snapshotId: string | null, dcCode: string | null, ranking: DcRanking) {
  return useQuery({
    queryKey: styleActionsKeys.dcSummary(snapshotId ?? 'none', dcCode ?? 'none', ranking),
    queryFn: () =>
      apiGet<DcSummary>(`/v1/dcs/${pathCode(dcCode, 'dc')}`, {
        snapshot_id: snapshotId,
        ranking: ranking === 'units_short' ? undefined : ranking,
      }),
    enabled: Boolean(snapshotId && dcCode),
    placeholderData: keepPreviousData,
    staleTime: DATA_STALE_MS,
  });
}

/** The DC's own stock by brick and grade (getDcStock, S2-C10). */
export function useDcStock(snapshotId: string | null, dcCode: string | null) {
  return useQuery({
    queryKey: styleActionsKeys.dcStock(snapshotId ?? 'none', dcCode ?? 'none'),
    queryFn: () => apiGet<DcStock>(`/v1/dcs/${pathCode(dcCode, 'dc')}/stock`, { snapshot_id: snapshotId }),
    enabled: Boolean(snapshotId && dcCode),
    staleTime: DATA_STALE_MS,
  });
}

/** The store's segment x brick x grade groups (getStoreBricks, contract 0.3.1): the brick matrix's source. */
export function useStoreBricks(snapshotId: string | null, storeCode: string | null) {
  return useQuery({
    queryKey: styleActionsKeys.storeBricks(snapshotId ?? 'none', storeCode ?? 'none'),
    queryFn: () => apiGet<StoreBricks>(`/v1/stores/${pathCode(storeCode, 'store')}/bricks`, { snapshot_id: snapshotId }),
    enabled: Boolean(snapshotId && storeCode),
    staleTime: DATA_STALE_MS,
  });
}
