import { useState, useEffect, useCallback, useRef } from 'react';
import { isMockMode } from '@/environment';
import type { Agent } from '../data/mockAgents';

const loadMock = () => import('../data/mockAgents');

interface AgentsDataResult {
  data: Agent[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAgentsData(): AgentsDataResult {
  const [data, setData] = useState<Agent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);

    if (isMockMode()) {
      loadMock()
        .then((m) => {
          if (mountedRef.current) {
            setData(m.mockAgents);
            setLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (mountedRef.current) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
            setLoading(false);
          }
        });
    } else {
      setError('API not connected');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: fetch is stable via useCallback with no deps
  }, []);

  return { data, loading, error, refetch: fetch };
}
