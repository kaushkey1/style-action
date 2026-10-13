import { useEffect, useMemo, useState } from 'react';

interface UseTableSearchSortOptions<T> {
  /** Extract the searchable text from a row */
  searchField: (row: T) => string;
  /** Map of sort key → numeric value extractor. Keys become sort column options. */
  sortFields: Record<string, (row: T) => number>;
  /** Optional URL param prefix for persisting sort state in the URL (e.g. "aopTargetStorePerformance" → ?aopTargetStorePerformance_sort=...&aopTargetStorePerformance_dir=...) */
  sortUrlParamPrefix?: string;
  /** Initial sort direction when no URL state is present. Defaults to 'desc'
   *  for backwards compatibility with the ~10 tables already using this hook.
   *  Set to 'asc' for category-name default sorts (1 < 2 < … < Others). */
  defaultSortDir?: 'asc' | 'desc';
  /** Sort key used as the default when no URL state is present. Falls back to the
   *  first `sortFields` key when omitted or not a valid key. Use to keep a stable
   *  default after prepending a (possibly empty) leading column. */
  defaultSortKey?: string;
}

interface UseTableSearchSortResult<T> {
  search: string;
  setSearch: (value: string) => void;
  sortKey: string | null;
  sortDir: 'asc' | 'desc';
  setSortKey: (key: string | null) => void;
  setSortDir: (dir: 'asc' | 'desc') => void;
  /** Rows after search filter + sort applied */
  filteredRows: T[];
  /** Reset both search and sort */
  clearAll: () => void;
}

export function useTableSearchSort<T>(
  rows: T[],
  options: UseTableSearchSortOptions<T>,
): UseTableSearchSortResult<T> {
  const defaultSortKey =
    options.defaultSortKey && options.sortFields[options.defaultSortKey]
      ? options.defaultSortKey
      : (Object.keys(options.sortFields)[0] ?? null);

  // URL-backed sort param names (only when prefix is provided)
  const sortKeyParam = options.sortUrlParamPrefix
    ? `${options.sortUrlParamPrefix}_sort`
    : undefined;
  const sortDirParam = options.sortUrlParamPrefix
    ? `${options.sortUrlParamPrefix}_dir`
    : undefined;

  const getInitialSortKey = (): string | null => {
    if (sortKeyParam && typeof window !== 'undefined') {
      const fromUrl = new URLSearchParams(window.location.search).get(sortKeyParam);
      if (fromUrl && options.sortFields[fromUrl]) return fromUrl;
    }
    return defaultSortKey;
  };

  const fallbackSortDir: 'asc' | 'desc' = options.defaultSortDir ?? 'desc';
  const getInitialSortDir = (): 'asc' | 'desc' => {
    if (sortDirParam && typeof window !== 'undefined') {
      const fromUrl = new URLSearchParams(window.location.search).get(sortDirParam);
      if (fromUrl === 'asc' || fromUrl === 'desc') return fromUrl;
    }
    return fallbackSortDir;
  };

  const [search, setSearch] = useState('');
  const [sortKeyState, setSortKeyState] = useState<string | null>(getInitialSortKey);
  const [sortDirState, setSortDirState] = useState<'asc' | 'desc'>(getInitialSortDir);

  const urlBackedSort =
    Boolean(sortKeyParam) && Boolean(sortDirParam) && typeof window !== 'undefined';
  const sortFieldsSignature = Object.keys(options.sortFields).join('|');
  useEffect(() => {
    setSortKeyState(getInitialSortKey());
    setSortDirState(getInitialSortDir());
    // Re-hydrate when table identity changes (URL prefix / sortable columns).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKeyParam, sortDirParam, defaultSortKey, sortFieldsSignature]);

  const sortKey = sortKeyState;
  const sortDir = sortDirState;
  const effectiveSortKey = sortKey && options.sortFields[sortKey] ? sortKey : defaultSortKey;

  const setSortKey = (key: string | null): void => {
    setSortKeyState(key);
    if (!urlBackedSort || !sortKeyParam) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (key) params.set(sortKeyParam, key);
    else params.delete(sortKeyParam);
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
  };

  const setSortDir = (dir: 'asc' | 'desc'): void => {
    setSortDirState(dir);
    if (!urlBackedSort || !sortDirParam) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set(sortDirParam, dir);
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
  };

  const filteredRows = useMemo(() => {
    let result = rows;

    // Search filter
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((row) =>
        options.searchField(row).toLowerCase().includes(query),
      );
    }

    // Sort
    if (effectiveSortKey && options.sortFields[effectiveSortKey]) {
      const extractor = options.sortFields[effectiveSortKey];
      result = [...result].sort((a, b) => {
        const va = extractor(a);
        const vb = extractor(b);
        return sortDir === 'asc' ? va - vb : vb - va;
      });
    }

    return result;
  }, [rows, search, effectiveSortKey, sortDir, options]);

  const clearAll = (): void => {
    setSearch('');
    setSortKeyState(defaultSortKey);
    setSortDirState(fallbackSortDir);
    if (!urlBackedSort || !sortKeyParam || !sortDirParam) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (defaultSortKey) params.set(sortKeyParam, defaultSortKey);
    else params.delete(sortKeyParam);
    params.set(sortDirParam, fallbackSortDir);
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', nextUrl);
  };

  return {
    search,
    setSearch,
    sortKey,
    sortDir,
    setSortKey,
    setSortDir,
    filteredRows,
    clearAll,
  };
}
