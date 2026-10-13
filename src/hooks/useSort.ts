import { useState, useMemo, useCallback } from 'react';

export function useSort<T>(
  items: T[],
  initialSort: { key: keyof T; dir: 'asc' | 'desc' }
) {
  const [sortKey, setSortKey] = useState<keyof T>(initialSort.key);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSort.dir);

  const toggleSort = useCallback((key: keyof T) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortDir('asc');
      }
      return key;
    });
  }, []);

  const results = useMemo(() => {
    const multiplier = sortDir === 'asc' ? 1 : -1;
    return Array.from(items).sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * multiplier;
      }

      return String(aVal).localeCompare(String(bVal)) * multiplier;
    });
  }, [items, sortKey, sortDir]);

  return { results, sortKey, sortDir, toggleSort };
}
