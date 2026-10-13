import { useQuery } from '@tanstack/react-query';
import { fetchThresholds, type KpiThreshold } from '@/modules/admin/api/thresholdApi';

const THIRTY_MINUTES = 30 * 60 * 1000;

export const thresholdKeys = {
  all: ['thresholds'] as const,
};

/**
 * Fetches all KPI thresholds from /insights/thresholds and returns them as a
 * Map keyed by kpi_code for O(1) lookups. Cached for 30 minutes.
 */
export function useThresholds(): Map<string, KpiThreshold> {
  const { data } = useQuery({
    queryKey: thresholdKeys.all,
    queryFn: () => fetchThresholds(),
    staleTime: THIRTY_MINUTES,
    gcTime: THIRTY_MINUTES,
  });

  if (!data) return new Map();
  const map = new Map<string, KpiThreshold>();
  for (const t of data) {
    map.set(t.kpi_code, t);
  }
  return map;
}
