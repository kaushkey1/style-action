import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import type { InsightData } from '@/modules/store-view/api/insightsApi';

// --- API call ---

async function generateSalesPlanInsights(cycleId: string): Promise<InsightData> {
  return apiPost<InsightData>(`/sales-plan/cycles/${cycleId}/insights/generate`, {});
}

// --- Hook: auto-generate on mount, cache per cycle in React Query ---

interface UseSalesPlanInsightsResult {
  data: InsightData | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSalesPlanInsights(cycleId: string | undefined): UseSalesPlanInsightsResult {
  const queryClient = useQueryClient();
  const cacheKey = useMemo(() => ['sales-plan-insights', cycleId ?? ''] as const, [cycleId]);

  const [data, setData] = useState<InsightData | null>(
    () => queryClient.getQueryData<InsightData>([...cacheKey]) ?? null,
  );
  const [isLoading, setIsLoading] = useState(data === null && !!cycleId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetchedRef = useRef(false);

  // Auto-generate on mount (once per cycle per session).
  useEffect(() => {
    mountedRef.current = true;
    fetchedRef.current = false;
    if (!cycleId) return () => { mountedRef.current = false; };

    const existing = queryClient.getQueryData<InsightData>([...cacheKey]);
    if (existing) {
      setData(existing);
      setIsLoading(false);
      return () => { mountedRef.current = false; };
    }

    const generate = async (): Promise<void> => {
      if (fetchedRef.current) return;
      fetchedRef.current = true;
      setIsLoading(true);
      setIsGenerating(true);
      setError(null);
      try {
        const generated = await generateSalesPlanInsights(cycleId);
        if (mountedRef.current) {
          setData(generated);
          queryClient.setQueryData([...cacheKey], generated);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to generate insights');
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          setIsGenerating(false);
        }
      }
    };

    void generate();
    return () => { mountedRef.current = false; };
  }, [cacheKey, cycleId, queryClient]);

  const refresh = useCallback(() => {
    if (!cycleId) return;
    setIsGenerating(true);
    setError(null);
    void (async () => {
      try {
        const generated = await generateSalesPlanInsights(cycleId);
        if (mountedRef.current) {
          setData(generated);
          queryClient.setQueryData([...cacheKey], generated);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Regeneration failed');
        }
      } finally {
        if (mountedRef.current) setIsGenerating(false);
      }
    })();
  }, [cacheKey, cycleId, queryClient]);

  return { data, isLoading, isGenerating, error, refresh };
}
