import { useState, useMemo, useCallback } from 'react';

export function useFilters<T, F extends Record<string, string>>(
  items: T[],
  initialFilters: F
) {
  const [filters, setFilters] = useState<F>(initialFilters);

  const setFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters(() => {
      const reset = {} as Record<string, string>;
      for (const key of Object.keys(initialFilters)) {
        reset[key] = 'all';
      }
      return reset as F;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasActive = useMemo(
    () => Object.values(filters).some((v) => v !== 'all'),
    [filters]
  );

  const results = useMemo(() => {
    const activeEntries = Object.entries(filters).filter(
      ([, value]) => value !== 'all'
    );
    if (activeEntries.length === 0) return items;

    return items.filter((item) =>
      activeEntries.every(
        ([key, value]) => String((item as Record<string, unknown>)[key]) === value
      )
    );
  }, [items, filters]);

  return { results, filters, setFilter, hasActive, clearAll };
}
