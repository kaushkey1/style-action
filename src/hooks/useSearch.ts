import { useState, useMemo, useCallback } from 'react';

export function useSearch<T>(
  items: T[],
  options: { fields: (keyof T)[] }
) {
  const [query, setQuery] = useState('');

  const stableSetQuery = useCallback((q: string) => setQuery(q), []);

  const results = useMemo(() => {
    if (!query) return items;
    if (options.fields.length === 0) return items;

    const lower = query.toLowerCase();
    return items.filter((item) =>
      options.fields.some((field) => {
        const val = item[field];
        if (val == null) return false;
        return String(val).toLowerCase().includes(lower);
      })
    );
  }, [items, query, options.fields]);

  return { results, query, setQuery: stableSetQuery };
}
