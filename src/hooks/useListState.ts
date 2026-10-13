import { useSearch } from '@/hooks/useSearch';
import { useFilters } from '@/hooks/useFilters';
import { useSort } from '@/hooks/useSort';
import { usePagination } from '@/hooks/usePagination';
import { useSelection } from '@/hooks/useSelection';

export function useListState<T>(
  items: T[],
  options: {
    pageSize?: number;
    searchFields?: (keyof T)[];
    initialFilters?: Record<string, string>;
    initialSort?: { key: keyof T; dir: 'asc' | 'desc' };
  } = {}
) {
  const search = useSearch(items, {
    fields: (options.searchFields ?? []) as (keyof T)[],
  });

  const filters = useFilters(search.results, options.initialFilters ?? {});

  const sort = useSort(filters.results, {
    key: (options.initialSort?.key ?? ('id' as keyof T)) as keyof T,
    dir: options.initialSort?.dir ?? 'desc',
  });

  const page = usePagination(sort.results, {
    pageSize: options.pageSize ?? 10,
  });

  const selection = useSelection();

  return {
    // Search
    query: search.query,
    setQuery: search.setQuery,
    // Filters
    filters: filters.filters,
    setFilter: filters.setFilter,
    hasActiveFilters: filters.hasActive,
    clearAllFilters: filters.clearAll,
    // Sort
    sortKey: sort.sortKey,
    sortDir: sort.sortDir,
    toggleSort: sort.toggleSort,
    // Pagination
    pageItems: page.pageItems,
    currentPage: page.currentPage,
    setCurrentPage: page.setCurrentPage,
    totalPages: page.totalPages,
    totalItems: page.totalItems,
    // Selection
    selectedId: selection.selectedId,
    setSelectedId: selection.setSelectedId,
    clearSelection: selection.clearSelection,
  };
}
