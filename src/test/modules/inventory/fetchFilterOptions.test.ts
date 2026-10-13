import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the fetch layer so we can capture the params fetchFilterOptions builds.
vi.mock('@/lib/api', () => ({
  appApiFetch: vi.fn().mockResolvedValue({}),
  apiFetchBlob: vi.fn(),
  appApiPost: vi.fn(),
  IMPETUS_APP_BASE: '',
}));

import { appApiFetch } from '@/lib/api';
import { fetchFilterOptions } from '@/modules/inventory/api/inventoryApi';
import type { InventoryFilters } from '@/modules/inventory/stores/useInventoryFilterStore';

const mockFetch = vi.mocked(appApiFetch);

const ALL: InventoryFilters = {
  format: 'all', segment: 'all', brick: 'all', family: 'all',
  class: 'all', fashionGrade: 'all', store: 'all',
};

function lastParams(): Record<string, unknown> {
  const call = mockFetch.mock.calls.at(-1);
  expect(call?.[0]).toBe('/inventory/filter-options');
  return (call?.[1] ?? {}) as Record<string, unknown>;
}

beforeEach(() => mockFetch.mockClear());

describe('fetchFilterOptions param mapping', () => {
  it('sends no dimension params when everything is "all"', async () => {
    await fetchFilterOptions(ALL);
    expect(lastParams()).toEqual({});
  });

  it('sends only the selected dimensions (omits "all"), mapping keys correctly', async () => {
    await fetchFilterOptions({
      ...ALL,
      segment: 'MENS WEAR',
      family: 'BOTTOM',
      class: 'SHORTS',
      brick: 'DENIM SHORTS',
      fashionGrade: 'APL-FASHION',
      format: 'EBO',
    });
    expect(lastParams()).toEqual({
      segment: 'MENS WEAR',
      family: 'BOTTOM',
      class: 'SHORTS',
      brick: 'DENIM SHORTS',
      fashion_grade: 'APL-FASHION', // camelCase → snake_case
      format: 'EBO',
    });
    // store is NOT part of filter-options (it's an independent list)
    expect(lastParams()).not.toHaveProperty('store');
  });

  it('passes multi-value selections through as CSV', async () => {
    await fetchFilterOptions({ ...ALL, segment: 'MENS WEAR,WOMENS WEAR' });
    expect(lastParams()).toEqual({ segment: 'MENS WEAR,WOMENS WEAR' });
  });

  it('sends a partial (non-linear) selection — family without segment', async () => {
    await fetchFilterOptions({ ...ALL, family: 'BOTTOM' });
    expect(lastParams()).toEqual({ family: 'BOTTOM' });
  });

  it('handles being called with no argument', async () => {
    await fetchFilterOptions();
    expect(lastParams()).toEqual({});
  });
});
