import { formatUnits } from './display';

import type { StoreSummary } from '../api/types';

/** Store selector rules for stores without data (Scope 1a R3, decision F-D1, rulings C1 and C2). */

export interface StoreOption {
  value: string;
  label: string;
}

/** "code · name · city", with a "no data" mark for a store that holds no stock or sales in the snapshot. */
export function storeSelectorLabel(store: StoreSummary): string {
  const parts = [store.store_code, store.name, store.city];
  if (!store.has_data) parts.push('no data');
  return parts.filter(Boolean).join(' · ');
}

/**
 * Selector options sorted by store code. Stores without data are hidden unless `showWithoutData`;
 * the selected store is always listed so the trigger can name it.
 */
export function storePickerOptions(stores: readonly StoreSummary[], showWithoutData: boolean, selected: string | null): StoreOption[] {
  return stores
    .filter((store) => showWithoutData || store.has_data || store.store_code === selected)
    .sort((a, b) => a.store_code.localeCompare(b.store_code))
    .map((store) => ({ value: store.store_code, label: storeSelectorLabel(store) }));
}

interface StoreChoice {
  readonly stores: readonly StoreSummary[];
  readonly urlStore: string | null;
  readonly savedStore: string | null;
  readonly focusStores: readonly string[];
}

/**
 * The store the workspace opens on (ruling C1): a store named in the URL always wins; otherwise the
 * saved store if it has data, else the first focus store with data, else the first store with data.
 * When no store has data, the first focus store (or first store) opens so its empty state explains why.
 */
export function chooseStoreCode({ stores, urlStore, savedStore, focusStores }: StoreChoice): string | null {
  if (urlStore) return urlStore;
  const withData = stores.filter((store) => store.has_data);
  const hasData = (code: string | null): boolean => Boolean(code && withData.some((store) => store.store_code === code));
  if (hasData(savedStore)) return savedStore;
  const focusWithData = focusStores.find((code) => hasData(code));
  if (focusWithData) return focusWithData;
  if (withData[0]) return withData[0].store_code;
  const listedFocus = focusStores.find((code) => stores.some((store) => store.store_code === code));
  return listedFocus ?? stores[0]?.store_code ?? null;
}

/** "212 stores with data · 59 without"; the "· 0 without" part is omitted (ruling C2). */
export function storeCountText(withData: number, without: number): string {
  const head = `${formatUnits(withData)} ${withData === 1 ? 'store' : 'stores'} with data`;
  return without > 0 ? `${head} · ${formatUnits(without)} without` : head;
}

/** Label of the toggle that shows or hides stores without data in the selector. */
export function noDataToggleLabel(without: number, isShown: boolean): string {
  if (isShown) return 'Hide stores with no data';
  return `Show ${formatUnits(without)} ${without === 1 ? 'store' : 'stores'} with no data`;
}

/** Why the selector hides some stores, stated from the data rather than as a business fact (review W5). */
export function noDataHint(isShown: boolean): string {
  if (isShown) return 'Stores marked "no data" have no stock or sales rows in this snapshot.';
  return 'Stores with no stock or sales rows in this snapshot are hidden.';
}
