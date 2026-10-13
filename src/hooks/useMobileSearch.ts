import { useState, useMemo, useCallback } from 'react';
import { searchIndex, type SearchItem } from '@/data/searchIndex';
import { debounce } from '@/lib/utils';
import { useModuleEnabled } from '@/hooks/useScreenConfig';
import { useProductNavigation } from '@/hooks/useProductNavigation';

const STORAGE_KEY = 'impetus-recent-searches';
const MAX_RECENTS = 10;
const MAX_RESULTS = 12;

function getRecents(): SearchItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecents(items: SearchItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_RECENTS)));
}

export type SearchScope = 'all' | 'product' | 'module' | 'feature';

export function useMobileSearch() {
  const isPoReviewEnabled = useModuleEnabled('po_review', false);
  const { visibleProducts } = useProductNavigation();
  const visibleProductIds = useMemo(
    () => new Set(visibleProducts.map((product) => product.id)),
    [visibleProducts],
  );
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [recentSearches, setRecentSearches] = useState<SearchItem[]>(getRecents);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetQuery = useCallback(
    debounce((value: string) => setDebouncedQuery(value), 150),
    [],
  );

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      debouncedSetQuery(value);
    },
    [debouncedSetQuery],
  );

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const lower = debouncedQuery.toLowerCase();

    return searchIndex
      .filter((item) => {
        if (item.id === 'cortex-po-review' && !isPoReviewEnabled) return false;
        if (!visibleProductIds.has(item.type === 'product' ? item.id : item.productId ?? '')) return false;
        if (scope !== 'all' && item.type !== scope) return false;
        return (
          item.label.toLowerCase().includes(lower) ||
          item.path.toLowerCase().includes(lower) ||
          item.keywords?.some((kw) => kw.toLowerCase().includes(lower))
        );
      })
      .slice(0, MAX_RESULTS);
  }, [debouncedQuery, scope, isPoReviewEnabled, visibleProductIds]);

  const addToRecent = useCallback((item: SearchItem) => {
    setRecentSearches((prev) => {
      const next = [item, ...prev.filter((r) => r.id !== item.id)].slice(0, MAX_RECENTS);
      saveRecents(next);
      return next;
    });
  }, []);

  const removeFromRecent = useCallback((id: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveRecents(next);
      return next;
    });
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    query,
    setQuery: handleQueryChange,
    clearQuery,
    scope,
    setScope,
    results,
    recentSearches: recentSearches.filter((item) =>
      (item.id !== 'cortex-po-review' || isPoReviewEnabled) &&
      visibleProductIds.has(item.type === 'product' ? item.id : item.productId ?? ''),
    ),
    addToRecent,
    removeFromRecent,
    hasQuery: debouncedQuery.trim().length > 0,
  };
}
