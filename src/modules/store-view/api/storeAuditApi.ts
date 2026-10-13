import type { StoreAuditData } from '@/modules/store-view/types/storeAudit.types';
import { fetchStoreData } from './storeDataApi';

export const storeAuditKeys = {
  all: ['store-audit'] as const,
  store: (storeCode: string) => [...storeAuditKeys.all, storeCode] as const,
};

/**
 * Fetch a store's latest PulsePoint audit.
 *
 * Resolves to `null` when the store has never been audited — the backend
 * returns 200 with `data: null` for that case, which is not an error.
 */
export async function fetchStoreAudit(storeCode: string): Promise<StoreAuditData | null> {
  return fetchStoreData<StoreAuditData>(`/store-view/store-audit/${encodeURIComponent(storeCode)}`);
}
