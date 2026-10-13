import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic data-fetching hook. Calls `fetcher` on mount and whenever `deps` change.
 * Automatically cancels stale requests via a request counter.
 */
export function useApiData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
): { data: T | null; loading: boolean; error: string | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const counterRef = useRef(0);

  const execute = useCallback(() => {
    const id = ++counterRef.current;
    setLoading(true);
    setError(null);
    fetcherRef.current()
      .then((d) => { if (counterRef.current === id) setData(d); })
      .catch((e) => { if (counterRef.current === id) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (counterRef.current === id) setLoading(false); });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls dependencies
  useEffect(() => { execute(); }, deps);

  return { data, loading, error, refetch: execute };
}
