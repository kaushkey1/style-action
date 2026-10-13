import { fetchStoreData } from './storeDataApi';

/** RAG band; null for metrics StoreOps leaves uncoloured. */
export type SalesKpiStatus = 'on-track' | 'warning' | 'critical';

export interface SalesKpiConstituent {
  label: string;
  value: number;
  prefix: string;
  suffix: string;
  /** Value is in lakhs — format with formatCurrencyFromLakhs, not as raw rupees. */
  isCurrencyLakhs: boolean;
}

export interface SalesKpiCard {
  name: string;
  label: string;
  value: number | null;
  prefix: string;
  suffix: string;
  status: SalesKpiStatus | null;
  constituents: SalesKpiConstituent[];
}

export interface StoreSalesData {
  storeCode: string;
  storeName: string;
  fromDate: string;
  toDate: string;
  maxDate: string | null;
  daysWithData: number;
  cards: SalesKpiCard[];
}

export const storeSalesKeys = {
  all: ['store-sales'] as const,
  store: (storeCode: string, startDate: string, endDate: string) =>
    [...storeSalesKeys.all, storeCode, startDate, endDate] as const,
};

/**
 * Fetch StoreOps sales KPIs for a store over a date range.
 *
 * Resolves to `null` when the store has no sales rows in the window — the
 * backend returns 200 with `data: null` for that case, which is not an error.
 */
export async function fetchStoreSales(
  storeCode: string,
  startDate: string,
  endDate: string,
): Promise<StoreSalesData | null> {
  return fetchStoreData<StoreSalesData>(`/store-view/store-sales/${encodeURIComponent(storeCode)}`, {
    from_date: startDate,
    to_date: endDate,
  });
}
