import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../api/client';
import { styleActionsKeys } from '../../api/queries';
import type { OptionStoreRow, Page } from '../../api/types';

/** Read-only adapter over the existing paginated API. Never display partial pages as store totals. */
export async function loadJourneyInventory(snapshotId: string, storeCode: string): Promise<OptionStoreRow[]> {
  const read = (page: number) => apiGet<Page<OptionStoreRow>>('/v1/option-stores', {
    snapshot_id: snapshotId, store_code: storeCode, sort: 'option_asc', page, page_size: 200,
  });
  const first = await read(1);
  if (!Number.isInteger(first.page_size) || first.page_size < 1) throw new Error('Invalid inventory page size');
  const pages = Math.ceil(first.total / first.page_size);
  if (pages > 10000) throw new Error('Inventory exceeds the supported page limit');
  const rows = [...first.items];
  // Bounded batches avoid a burst of requests for large stores. Cache is scoped by store and snapshot.
  for (let start = 2; start <= pages; start += 4) {
    const batch = await Promise.all(Array.from({ length: Math.min(4, pages - start + 1) }, (_, i) => read(start + i)));
    batch.forEach((page) => rows.push(...page.items));
  }
  if (rows.length !== first.total || new Set(rows.map((row) => row.option_code)).size !== rows.length) {
    throw new Error('The complete inventory could not be loaded. Please retry.');
  }
  return rows;
}
export function useJourneyInventory(snapshotId: string, storeCode: string) {
  return useQuery({
    queryKey: [...styleActionsKeys.all, 'inventory-journey', snapshotId, storeCode],
    queryFn: () => loadJourneyInventory(snapshotId, storeCode),
    staleTime: 5 * 60 * 1000,
  });
}
