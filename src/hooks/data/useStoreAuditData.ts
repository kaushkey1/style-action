import { useQuery } from '@tanstack/react-query';
import type { StoreAuditData } from '@/modules/store-view/types/storeAudit.types';
import { fetchStoreAudit, storeAuditKeys } from '@/modules/store-view/api/storeAuditApi';
import { STALE_TIMES } from '@/lib/utils';

interface UseStoreAuditDataResult {
  data: StoreAuditData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Live PulsePoint audit data for a store, sourced from BigQuery via
 * impetus-agentic-central.
 *
 * `data` is `null` both while loading and for stores that have never been
 * audited; callers distinguish the two with `loading`. Audits are refreshed at
 * most daily upstream, hence the long stale time.
 */
export function useStoreAuditData(storeCode: string | null): UseStoreAuditDataResult {
  const query = useQuery({
    queryKey: storeAuditKeys.store(storeCode ?? ''),
    queryFn: () => fetchStoreAudit(storeCode as string),
    enabled: !!storeCode,
    staleTime: STALE_TIMES.FILTERS,
    // These are slow warehouse/Places calls; a retry doubles the wait
    // without making an empty or failing result any more likely to succeed.
    retry: false,
  });

  return {
    data: query.data ?? null,
    // `enabled: false` leaves the query pending forever, so treat a missing
    // storeCode as "not loading" rather than surfacing an endless skeleton.
    loading: !!storeCode && query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}
