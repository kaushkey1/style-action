import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import type { InsightData } from '@/modules/store-view/api/insightsApi';
import type { OtbFormulaType } from '../data/otbTenantConfig';

// --- API call ---

async function generateOtbInsights(
  season?: string,
): Promise<InsightData> {
  const params: Record<string, string> = {};
  if (season) params.season = season;
  return apiPost<InsightData>('/otb/insights/generate', params);
}

// --- Hook: auto-generate on mount, cache in React Query ---

interface UseOtbInsightsResult {
  data: InsightData | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  refresh: (season?: string) => void;
}

export function useOtbInsights(
  formula: OtbFormulaType,
  season?: string,
): UseOtbInsightsResult {
  const personaId = formula === 'rbl' ? 'otb-rbl' : 'otb-fnl';
  const queryClient = useQueryClient();
  const cacheKey = useMemo(() => ['otb-insights', personaId] as const, [personaId]);

  const [data, setData] = useState<InsightData | null>(
    () => queryClient.getQueryData<InsightData>([...cacheKey]) ?? null,
  );
  const [isLoading, setIsLoading] = useState(data === null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetchedRef = useRef(false);
  const seasonRef = useRef(season);
  seasonRef.current = season;

  // Auto-generate on mount (once per persona per session)
  useEffect(() => {
    mountedRef.current = true;
    fetchedRef.current = false;

    // If React Query has in-memory cache (same session), use it immediately
    const existing = queryClient.getQueryData<InsightData>([...cacheKey]);
    if (existing) {
      setData(existing);
      setIsLoading(false);
      return () => { mountedRef.current = false; };
    }

    // No in-memory cache — generate fresh
    const generate = async () => {
      if (fetchedRef.current) return;
      fetchedRef.current = true;

      setIsLoading(true);
      setIsGenerating(true);
      setError(null);

      try {
        const generated = await generateOtbInsights(seasonRef.current);

        if (mountedRef.current) {
          setData(generated);
          setIsGenerating(false);
          setIsLoading(false);
          queryClient.setQueryData([...cacheKey], generated);
        }
      } catch (err) {
        if (mountedRef.current) {
          const msg = err instanceof Error ? err.message : 'Failed to generate insights';
          setError(msg);
          setIsLoading(false);
          setIsGenerating(false);
        }
      }
    };

    void generate();

    return () => { mountedRef.current = false; };
  }, [cacheKey, queryClient]);

  // Refresh (manual regenerate)
  const refresh = useCallback((refreshSeason?: string) => {
    setIsGenerating(true);
    setError(null);
    void (async () => {
      try {
        const generated = await generateOtbInsights(refreshSeason ?? seasonRef.current);
        if (mountedRef.current) {
          setData(generated);
          queryClient.setQueryData([...cacheKey], generated);
        }
      } catch (err) {
        if (mountedRef.current) {
          const msg = err instanceof Error ? err.message : 'Regeneration failed';
          setError(msg);
        }
      } finally {
        if (mountedRef.current) {
          setIsGenerating(false);
        }
      }
    })();
  }, [cacheKey, queryClient]);

  return { data, isLoading, isGenerating, error, refresh };
}
