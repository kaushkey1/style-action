import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/utils';
import { sourcingDirectorApi } from './sourcingDirectorApi';
import type { SourcingFilters } from '../stores/useSourcingFilterStore';

export const sourcingDirectorKeys = {
  all: ['sourcing-director'] as const,
  filters: (f: SourcingFilters) =>
    [...sourcingDirectorKeys.all, 'filters', f] as const,
  vendorCluster: (f: SourcingFilters) =>
    [...sourcingDirectorKeys.all, 'vendor-cluster-teams', f] as const,
  poPipeline: (f: SourcingFilters) =>
    [...sourcingDirectorKeys.all, 'po-pipeline', f] as const,
  logisticsSla: (f: SourcingFilters) =>
    [...sourcingDirectorKeys.all, 'logistics-sla', f] as const,
  qualityMaterials: (f: SourcingFilters) =>
    [...sourcingDirectorKeys.all, 'quality-materials', f] as const,
};

export function useFilterOptions(f: SourcingFilters) {
  return useQuery({
    queryKey: sourcingDirectorKeys.filters(f),
    queryFn: () => sourcingDirectorApi.filters(f),
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function useVendorClusterTeams(f: SourcingFilters) {
  return useQuery({
    queryKey: sourcingDirectorKeys.vendorCluster(f),
    // Cold call can take ~60s on first hit per filter combo
    // (vendor_load_capacity throughput join). React Query default retry is fine.
    queryFn: () => sourcingDirectorApi.vendorClusterTeams(f),
    staleTime: STALE_TIMES.LISTING,
  });
}

export function usePoPipeline(f: SourcingFilters) {
  return useQuery({
    queryKey: sourcingDirectorKeys.poPipeline(f),
    queryFn: () => sourcingDirectorApi.poPipeline(f),
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useLogisticsSla(f: SourcingFilters) {
  return useQuery({
    queryKey: sourcingDirectorKeys.logisticsSla(f),
    queryFn: () => sourcingDirectorApi.logisticsSla(f),
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useQualityMaterials(f: SourcingFilters) {
  // Entire tab is data-gap until QC + fabric tables land — response is
  // essentially instant (no BQ call), but we still cache to avoid duplicate
  // requests on tab switches.
  return useQuery({
    queryKey: sourcingDirectorKeys.qualityMaterials(f),
    queryFn: () => sourcingDirectorApi.qualityMaterials(f),
    staleTime: STALE_TIMES.LISTING,
  });
}
