// TanStack Query hooks for the Sales Plan (AOP) backend.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/utils';
import { salesPlanApi, type SeasonalityWeight, type AddStorePayload } from './salesPlanApi';

export const salesPlanKeys = {
  all: ['sales-plan'] as const,
  cycles: () => [...salesPlanKeys.all, 'cycles'] as const,
  cycle: (id: string) => [...salesPlanKeys.all, 'cycle', id] as const,
  inputs: (id: string) => [...salesPlanKeys.all, 'inputs', id] as const,
  workspace: (id: string) => [...salesPlanKeys.all, 'workspace', id] as const,
  categories: (id: string, storeId: string) =>
    [...salesPlanKeys.all, 'categories', id, storeId] as const,
  categoryView: (id: string, channel?: string) =>
    [...salesPlanKeys.all, 'category-view', id, channel ?? 'all'] as const,
  versions: (id: string) => [...salesPlanKeys.all, 'versions', id] as const,
  changes: (id: string) => [...salesPlanKeys.all, 'changes', id] as const,
  rolling: (id: string) => [...salesPlanKeys.all, 'rolling', id] as const,
  channelVariance: (id: string) => [...salesPlanKeys.all, 'channel-variance', id] as const,
  brickView: (id: string, channel?: string) =>
    [...salesPlanKeys.all, 'brick-view', id, channel ?? 'all'] as const,
  storeBricks: (id: string, storeId: string) =>
    [...salesPlanKeys.all, 'store-bricks', id, storeId] as const,
  exceptions: (id: string) => [...salesPlanKeys.all, 'exceptions', id] as const,
  stores: (id: string) => [...salesPlanKeys.all, 'stores', id] as const,
};

export function useCycles() {
  return useQuery({
    queryKey: salesPlanKeys.cycles(),
    queryFn: salesPlanApi.listCycles,
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useCreateCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salesPlanApi.createCycle,
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesPlanKeys.cycles() }),
  });
}

export function useInputs(cycleId: string | undefined) {
  return useQuery({
    queryKey: salesPlanKeys.inputs(cycleId ?? ''),
    queryFn: () => salesPlanApi.getInputs(cycleId!),
    enabled: !!cycleId,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useWorkspace(cycleId: string | undefined, versionNo?: number) {
  return useQuery({
    // Version is an extra key segment so opening an older revision caches
    // separately; invalidations keyed on workspace(cycleId) still prefix-match
    // every version (only the current version is ever edited).
    queryKey: [...salesPlanKeys.workspace(cycleId ?? ''), versionNo ?? 'current'] as const,
    queryFn: () => salesPlanApi.getWorkspace(cycleId!, versionNo),
    enabled: !!cycleId,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useCategoryView(cycleId: string | undefined, channel?: string) {
  return useQuery({
    queryKey: salesPlanKeys.categoryView(cycleId ?? '', channel),
    queryFn: () => salesPlanApi.getCategoryView(cycleId!, channel),
    enabled: !!cycleId,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useRolling(cycleId: string | undefined) {
  return useQuery({
    queryKey: salesPlanKeys.rolling(cycleId ?? ''),
    queryFn: () => salesPlanApi.getRolling(cycleId!),
    enabled: !!cycleId,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useSetCycleStatus(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => salesPlanApi.setCycleStatus(cycleId, status),
    // Status/lock affects the cycle everywhere (landing, rolling, workspace gating).
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesPlanKeys.all }),
  });
}

export function useChanges(cycleId: string | undefined) {
  return useQuery({
    queryKey: salesPlanKeys.changes(cycleId ?? ''),
    queryFn: () => salesPlanApi.listChanges(cycleId!),
    enabled: !!cycleId,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useVersions(cycleId: string | undefined) {
  return useQuery({
    queryKey: salesPlanKeys.versions(cycleId ?? ''),
    queryFn: () => salesPlanApi.listVersions(cycleId!),
    enabled: !!cycleId,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useCreateRevision(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => salesPlanApi.createRevision(cycleId),
    onSuccess: (data) => {
      qc.setQueryData(salesPlanKeys.versions(cycleId), data);
      // The new revision becomes current, so all cycle-scoped reads change.
      void qc.invalidateQueries({ queryKey: salesPlanKeys.all });
    },
  });
}

export function useSetVersionStatus(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ versionNo, status }: { versionNo: number; status: 'DRAFT' | 'APPROVED' | 'REJECTED' }) =>
      salesPlanApi.setVersionStatus(cycleId, versionNo, status),
    onSuccess: (data) => {
      qc.setQueryData(salesPlanKeys.versions(cycleId), data);
      // Approval changes the downstream reference version — refresh cycle-scoped reads.
      void qc.invalidateQueries({ queryKey: salesPlanKeys.all });
    },
  });
}

export function useChannelVariance(cycleId: string | undefined) {
  return useQuery({
    queryKey: salesPlanKeys.channelVariance(cycleId ?? ''),
    queryFn: () => salesPlanApi.getChannelVariance(cycleId!),
    enabled: !!cycleId,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useBrickView(cycleId: string | undefined, channel?: string) {
  return useQuery({
    queryKey: salesPlanKeys.brickView(cycleId ?? '', channel),
    queryFn: () => salesPlanApi.getBrickView(cycleId!, channel),
    enabled: !!cycleId,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useStoreBricks(cycleId: string | undefined, storeId: string | null) {
  return useQuery({
    queryKey: salesPlanKeys.storeBricks(cycleId ?? '', storeId ?? ''),
    queryFn: () => salesPlanApi.getStoreBricks(cycleId!, storeId!),
    enabled: !!cycleId && !!storeId,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useUpdateStoreBricks(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      storeId: string;
      channel: string;
      allocations: { brickCd: string; pct: number }[];
    }) =>
      salesPlanApi.updateStoreBricks(cycleId, body.storeId, {
        channel: body.channel,
        allocations: body.allocations,
      }),
    onSuccess: (data, vars) => {
      qc.setQueryData(salesPlanKeys.storeBricks(cycleId, vars.storeId), data);
      void qc.invalidateQueries({ queryKey: salesPlanKeys.brickView(cycleId) });
    },
  });
}

export function useExceptions(cycleId: string | undefined) {
  return useQuery({
    queryKey: salesPlanKeys.exceptions(cycleId ?? ''),
    queryFn: () => salesPlanApi.listExceptions(cycleId!),
    enabled: !!cycleId,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useUpdateException(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ exceptionId, status }: {
      exceptionId: string;
      status: 'open' | 'acknowledged' | 'resolved';
    }) => salesPlanApi.updateException(cycleId, exceptionId, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: salesPlanKeys.exceptions(cycleId) });
      void qc.invalidateQueries({ queryKey: salesPlanKeys.cycles() });
    },
  });
}

export function useSetStoreClosure(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ storeCode, body }: {
      storeCode: string;
      body: { type: 'full' | 'temp' | 'relocation'; closureDate: string; reopenDate?: string; reason?: string };
    }) => salesPlanApi.setStoreClosure(cycleId, storeCode, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: salesPlanKeys.stores(cycleId) });
      void qc.invalidateQueries({ queryKey: salesPlanKeys.workspace(cycleId) });
    },
  });
}

export function useAddStore(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AddStorePayload) => salesPlanApi.addStore(cycleId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: salesPlanKeys.stores(cycleId) });
      void qc.invalidateQueries({ queryKey: salesPlanKeys.workspace(cycleId) });
    },
  });
}

export function useAddStoresBulk(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stores: AddStorePayload[]) => salesPlanApi.addStoresBulk(cycleId, stores),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: salesPlanKeys.stores(cycleId) });
      void qc.invalidateQueries({ queryKey: salesPlanKeys.workspace(cycleId) });
    },
  });
}

export function useStores(cycleId: string | undefined) {
  return useQuery({
    queryKey: salesPlanKeys.stores(cycleId ?? ''),
    queryFn: () => salesPlanApi.listStores(cycleId!),
    enabled: !!cycleId,
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useStoreCategories(cycleId: string | undefined, storeId: string | null) {
  return useQuery({
    queryKey: salesPlanKeys.categories(cycleId ?? '', storeId ?? ''),
    queryFn: () => salesPlanApi.getStoreCategories(cycleId!, storeId!),
    enabled: !!cycleId && !!storeId,
    staleTime: STALE_TIMES.DETAIL,
  });
}

export function useGenerate(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => salesPlanApi.generate(cycleId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesPlanKeys.all }),
  });
}

export function useUpdateChannelTarget(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channel, body }: {
      channel: string;
      body: { netSalesTarget?: number; growthPct?: number; gmPctTarget?: number };
    }) => salesPlanApi.updateChannelTarget(cycleId, channel, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesPlanKeys.inputs(cycleId) }),
  });
}

export function useUpdateSeasonality(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ weights, reason }: { weights: SeasonalityWeight[]; reason: string }) =>
      salesPlanApi.updateSeasonality(cycleId, weights, reason),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesPlanKeys.inputs(cycleId) }),
  });
}

export function useUpdateGrowthFactor(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (growthPct: number) => salesPlanApi.updateGrowthFactor(cycleId, growthPct),
    onSuccess: (data) => {
      // Write the fresh inputs straight into the cache so the table updates immediately,
      // then invalidate the rest (workspace/cycle aggregates) which the reseed also changed.
      qc.setQueryData(salesPlanKeys.inputs(cycleId), data);
      void qc.invalidateQueries({ queryKey: salesPlanKeys.all });
    },
  });
}

export function useAddChannel(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; target: number; gmPct: number }) =>
      salesPlanApi.addChannel(cycleId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesPlanKeys.inputs(cycleId) }),
  });
}

export function useUpdateCell(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { channel: string; storeId: string; monthId: string; value: number }) =>
      salesPlanApi.updateCell(cycleId, body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: salesPlanKeys.workspace(cycleId) }),
  });
}

export function useUpdateChannelCell(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { channel: string; monthId: string; value: number }) =>
      salesPlanApi.updateChannelCell(cycleId, body),
    // The PUT already returns the recomputed workspace, so seed it straight into the
    // cache (only the current version is editable) instead of firing a second GET. On
    // rejection, invalidate to roll back the optimistic pinCell.
    onSuccess: (data) => {
      qc.setQueryData([...salesPlanKeys.workspace(cycleId), 'current'], data);
    },
    onError: () => void qc.invalidateQueries({ queryKey: salesPlanKeys.workspace(cycleId) }),
  });
}

export function useUpdateStoreCategories(cycleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, channel, allocations }: {
      storeId: string;
      channel: string;
      allocations: { category: string; pct: number }[];
    }) => salesPlanApi.updateStoreCategories(cycleId, storeId, { channel, allocations }),
    onSuccess: (data, vars) => {
      // Write the fresh server result straight into the cache so reopening is correct.
      qc.setQueryData(salesPlanKeys.categories(cycleId, vars.storeId), data);
      void qc.invalidateQueries({ queryKey: salesPlanKeys.categories(cycleId, vars.storeId) });
      void qc.invalidateQueries({ queryKey: salesPlanKeys.categoryView(cycleId) });
      void qc.invalidateQueries({ queryKey: salesPlanKeys.workspace(cycleId) });
    },
  });
}
