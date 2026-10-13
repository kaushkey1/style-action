import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/utils';
import { storePerformanceApi } from './storePerformanceApi';
import type { StorePerformanceFilterParams } from './storePerformanceApi';

export const storePerformanceKeys = {
  all: ['store-performance'] as const,
  list: (f: StorePerformanceFilterParams, page: number, pageSize: number) =>
    [...storePerformanceKeys.all, 'list', f, page, pageSize] as const,
  kpi: (f: StorePerformanceFilterParams) =>
    [...storePerformanceKeys.all, 'kpi', f] as const,
  cluster: (f: StorePerformanceFilterParams) =>
    [...storePerformanceKeys.all, 'cluster', f] as const,
  fixture: (storeId: string | null, yearMonth?: string) =>
    [...storePerformanceKeys.all, 'fixture', storeId, yearMonth] as const,
  grades: (f?: StorePerformanceFilterParams) =>
    [...storePerformanceKeys.all, 'grades', f] as const,
  formats: (f?: StorePerformanceFilterParams) =>
    [...storePerformanceKeys.all, 'formats', f] as const,
  regions: (f?: StorePerformanceFilterParams) =>
    [...storePerformanceKeys.all, 'regions', f] as const,
  cities: (f?: StorePerformanceFilterParams) =>
    [...storePerformanceKeys.all, 'cities', f] as const,
};

export function useStoreList(
  filters: StorePerformanceFilterParams,
  page: number,
  pageSize: number,
) {
  return useQuery({
    queryKey: storePerformanceKeys.list(filters, page, pageSize),
    queryFn: () => storePerformanceApi.list(filters, page, pageSize),
    staleTime: STALE_TIMES.LISTING,
    placeholderData: keepPreviousData,
  });
}


export function useKpiSummary(filters: StorePerformanceFilterParams) {
  return useQuery({
    queryKey: storePerformanceKeys.kpi(filters),
    queryFn: () => storePerformanceApi.kpiSummary(filters),
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useClusterData(filters: StorePerformanceFilterParams) {
  return useQuery({
    queryKey: storePerformanceKeys.cluster(filters),
    queryFn: () => storePerformanceApi.clusterData(filters),
    staleTime: STALE_TIMES.LISTING,
  });
}

export function useFilterGrades(filters?: StorePerformanceFilterParams) {
  return useQuery({
    queryKey: storePerformanceKeys.grades(filters),
    queryFn: () => storePerformanceApi.filterGrades(filters),
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function useFilterFormats(filters?: StorePerformanceFilterParams) {
  return useQuery({
    queryKey: storePerformanceKeys.formats(filters),
    queryFn: () => storePerformanceApi.filterFormats(filters),
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function useFilterRegions(filters?: StorePerformanceFilterParams) {
  return useQuery({
    queryKey: storePerformanceKeys.regions(filters),
    queryFn: () => storePerformanceApi.filterRegions(filters),
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function useFilterCities(filters?: StorePerformanceFilterParams) {
  return useQuery({
    queryKey: storePerformanceKeys.cities(filters),
    queryFn: () => storePerformanceApi.filterCities(filters),
    staleTime: STALE_TIMES.FILTERS,
  });
}

export function useFixtureView(storeId: string | null, yearMonth?: string) {
  return useQuery({
    queryKey: storePerformanceKeys.fixture(storeId, yearMonth),
    queryFn: () => storePerformanceApi.fixtureView(storeId!, yearMonth),
    enabled: !!storeId,
    staleTime: STALE_TIMES.DETAIL,
  });
}
