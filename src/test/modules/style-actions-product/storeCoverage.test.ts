import { describe, expect, it } from 'vitest';

import {
  chooseStoreCode,
  noDataHint,
  noDataToggleLabel,
  storeCountText,
  storePickerOptions,
  storeSelectorLabel,
} from '@/modules/style-actions-product/components/storeCoverage';

import type { StoreSummary } from '@/modules/style-actions-product/api/types';

function store(code: string, overrides: Partial<StoreSummary> = {}): StoreSummary {
  return {
    store_code: code,
    name: `Store ${code}`,
    city: 'Mumbai',
    format: 'TRENDS',
    dc_code: 'S3KG',
    is_focus: false,
    options: 1,
    saleable_units: 1,
    transit_units: 0,
    sales_14d_units: 0,
    grade_mix: { Fashion: 1, Ultimate: 0, Core: 0, Unmapped: 0 },
    finding_count: 0,
    cohorts: {},
    finding_counts: {},
    has_data: true,
    ...overrides,
  };
}

/** The fixture snapshot after Scope 1a: focus 8080 and 5943, then 9591, then the empty 9592. */
const FIXTURE: readonly StoreSummary[] = [
  store('8080', { name: 'RRL Trends Main Street Mall Mu', is_focus: true }),
  store('5943', { name: 'RRL Trends Infinity Mall Malad', is_focus: true }),
  store('9591', { name: 'Mumbai Amisha Empire Mira Road' }),
  store('9592', { name: 'Empty Fixture Store', has_data: false, options: 0, finding_count: 1, finding_counts: { STORE_WITHOUT_DATA: 1 } }),
];

describe('storeSelectorLabel', () => {
  it('joins code, name and city', () => {
    expect(storeSelectorLabel(FIXTURE[0] as StoreSummary)).toBe('8080 · RRL Trends Main Street Mall Mu · Mumbai');
  });

  it('drops a missing city', () => {
    expect(storeSelectorLabel(store('1', { name: 'Solo', city: null }))).toBe('1 · Solo');
  });

  it('marks a store without data', () => {
    expect(storeSelectorLabel(FIXTURE[3] as StoreSummary)).toBe('9592 · Empty Fixture Store · Mumbai · no data');
  });
});

describe('storePickerOptions', () => {
  it('hides stores without data by default, sorted by code', () => {
    expect(storePickerOptions(FIXTURE, false, '8080').map((option) => option.value)).toEqual(['5943', '8080', '9591']);
  });

  it('lists every store when stores without data are shown', () => {
    expect(storePickerOptions(FIXTURE, true, '8080').map((option) => option.value)).toEqual(['5943', '8080', '9591', '9592']);
  });

  it('keeps the selected store listed even when it has no data', () => {
    expect(storePickerOptions(FIXTURE, false, '9592').map((option) => option.value)).toEqual(['5943', '8080', '9591', '9592']);
  });

  it('ignores a selected code that is not in the snapshot', () => {
    expect(storePickerOptions(FIXTURE, false, 'ZZZ9').map((option) => option.value)).toEqual(['5943', '8080', '9591']);
  });

  it('returns no options for an empty store list', () => {
    expect(storePickerOptions([], false, null)).toEqual([]);
  });
});

describe('chooseStoreCode (ruling C1)', () => {
  const focus = ['8080', '5943'];

  it('lets a store named in the URL win, even one without data', () => {
    expect(chooseStoreCode({ stores: FIXTURE, urlStore: '9592', savedStore: '8080', focusStores: focus })).toBe('9592');
  });

  it('lets a URL store win even when it is not in the snapshot', () => {
    expect(chooseStoreCode({ stores: FIXTURE, urlStore: 'ZZZ9', savedStore: '8080', focusStores: focus })).toBe('ZZZ9');
  });

  it('opens the saved store when it has data', () => {
    expect(chooseStoreCode({ stores: FIXTURE, urlStore: null, savedStore: '9591', focusStores: focus })).toBe('9591');
  });

  it('skips a saved store without data for the first focus store with data', () => {
    expect(chooseStoreCode({ stores: FIXTURE, urlStore: null, savedStore: '9592', focusStores: focus })).toBe('8080');
  });

  it('skips a saved store that is not in the snapshot', () => {
    expect(chooseStoreCode({ stores: FIXTURE, urlStore: null, savedStore: 'ZZZ9', focusStores: focus })).toBe('8080');
  });

  it('skips focus stores without data', () => {
    const stores = [store('A', { has_data: false }), store('B'), store('C')];
    expect(chooseStoreCode({ stores, urlStore: null, savedStore: null, focusStores: ['A', 'C'] })).toBe('C');
  });

  it('falls back to the first store with data in list order', () => {
    const stores = [store('A', { has_data: false }), store('B'), store('C')];
    expect(chooseStoreCode({ stores, urlStore: null, savedStore: null, focusStores: ['A'] })).toBe('B');
  });

  it('opens the first focus store when no store has data, so its empty state explains why', () => {
    const stores = [store('A', { has_data: false }), store('B', { has_data: false })];
    expect(chooseStoreCode({ stores, urlStore: null, savedStore: null, focusStores: ['B'] })).toBe('B');
    expect(chooseStoreCode({ stores, urlStore: null, savedStore: null, focusStores: [] })).toBe('A');
  });

  it('returns null when the snapshot has no stores', () => {
    expect(chooseStoreCode({ stores: [], urlStore: null, savedStore: '8080', focusStores: focus })).toBeNull();
  });

  it('treats an empty URL store as absent', () => {
    expect(chooseStoreCode({ stores: FIXTURE, urlStore: '', savedStore: null, focusStores: focus })).toBe('8080');
  });
});

describe('storeCountText (ruling C2)', () => {
  it('states stores with and without data', () => {
    expect(storeCountText(212, 59)).toBe('212 stores with data · 59 without');
    expect(storeCountText(3, 1)).toBe('3 stores with data · 1 without');
  });

  it('uses the singular for one store with data', () => {
    expect(storeCountText(1, 2)).toBe('1 store with data · 2 without');
  });

  it('omits "· 0 without" when every store has data', () => {
    expect(storeCountText(47, 0)).toBe('47 stores with data');
    expect(storeCountText(1, 0)).toBe('1 store with data');
  });

  it('groups large counts', () => {
    expect(storeCountText(1200, 0)).toBe('1,200 stores with data');
  });
});

describe('noDataToggleLabel', () => {
  it('offers to show the hidden stores, singular and plural', () => {
    expect(noDataToggleLabel(1, false)).toBe('Show 1 store with no data');
    expect(noDataToggleLabel(59, false)).toBe('Show 59 stores with no data');
  });

  it('offers to hide them once shown', () => {
    expect(noDataToggleLabel(59, true)).toBe('Hide stores with no data');
  });
});

describe('noDataHint (review W5)', () => {
  it('says why stores are hidden while they are hidden', () => {
    expect(noDataHint(false)).toBe('Stores with no stock or sales rows in this snapshot are hidden.');
  });

  it('says what the "no data" mark means once they are shown', () => {
    expect(noDataHint(true)).toBe('Stores marked "no data" have no stock or sales rows in this snapshot.');
  });
});
