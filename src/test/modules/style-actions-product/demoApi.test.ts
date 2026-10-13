import { describe, expect, it } from 'vitest';
import { DEMO_SNAPSHOT_ID, demoResponse } from '@/modules/style-actions-product/data/demoApi';
import type { DcSummary, OptionStoreAvailability, OptionStoreDetail, OptionStoreRow, Page, StoreBricks, StoreList } from '@/modules/style-actions-product/api/types';

async function get<T>(path: string, query: Record<string, string | number> = {}): Promise<T> {
  const response = demoResponse('GET', path, { snapshot_id: DEMO_SNAPSHOT_ID, ...query });
  expect(response.status).toBe(200);
  return response.json() as Promise<T>;
}

describe('local Style Actions dummy data', () => {
  it('reconciles option, store, brick and distribution-centre inventory totals', async () => {
    const stores = await get<StoreList>('/v1/stores');
    expect(stores.items).toHaveLength(12);
    for (const store of stores.items) {
      const options = await get<Page<OptionStoreRow>>('/v1/option-stores', { store_code: store.store_code, page_size: 200 });
      const bricks = await get<StoreBricks>(`/v1/stores/${store.store_code}/bricks`);
      expect(options.total).toBe(96);
      expect(options.items.reduce((n, r) => n + r.on_hand, 0)).toBe(store.saleable_units);
      expect(options.items.reduce((n, r) => n + r.transit, 0)).toBe(store.transit_units);
      expect(bricks.items.reduce((n, r) => n + r.units, 0)).toBe(store.saleable_units + store.transit_units);
      expect(bricks.items.reduce((n, r) => n + r.units_short, 0)).toBeCloseTo(store.units_short);
    }
    const dc = await get<DcSummary>('/v1/dcs/DCWEST');
    expect(dc.stores).toHaveLength(4);
    expect(dc.totals.saleable_units).toBe(dc.stores.reduce((n, s) => n + s.saleable_units, 0));
    expect(dc.totals.options).toBe(384);
  });

  it('returns distinct pages and applies search, bands and compound category filters', async () => {
    const query = { store_code: 'MUM01', sort: 'age_desc', page_size: 10 };
    const first = await get<Page<OptionStoreRow>>('/v1/option-stores', { ...query, page: 1 });
    const second = await get<Page<OptionStoreRow>>('/v1/option-stores', { ...query, page: 2 });
    expect(first.total).toBe(96);
    expect(second.items).toHaveLength(10);
    expect(second.items.some(r => first.items.some(f => f.option_code === r.option_code))).toBe(false);
    expect(first.items[9]!.days_in_store).toBeGreaterThanOrEqual(second.items[0]!.days_in_store!);
    const filtered = await get<Page<OptionStoreRow>>('/v1/option-stores', { store_code: 'MUM01', segment: 'menswear', brick: 'shirts', q: 'linen' });
    expect(filtered.total).toBe(12);
    const constrained = await get<Page<OptionStoreRow>>('/v1/option-stores', { store_code: 'MUM01', band: 'supply_constrained' });
    expect(constrained.total).toBeGreaterThan(0);
    expect(constrained.items.every(r => r.health?.band === 'supply_constrained')).toBe(true);
  });

  it('reconciles size and observation details with the selected product row', async () => {
    const list = await get<Page<OptionStoreRow>>('/v1/option-stores', { store_code: 'MUM01', page_size: 200 });
    for (const row of list.items) {
      const detail = await get<OptionStoreDetail>(`/v1/option-stores/MUM01/${row.option_code}`);
      expect(detail.sizes.reduce((n, s) => n + s.on_hand, 0)).toBe(row.on_hand);
      expect(detail.sizes.reduce((n, s) => n + s.transit, 0)).toBe(row.transit);
      expect(detail.sizes.reduce((n, s) => n + s.sold, 0)).toBe(row.sold);
      expect(row.sold! + row.on_hand + row.transit).toBe(row.inward);
      expect(detail.weekly_sales.reduce((n, w) => n + w.units, 0)).toBe(row.sold);
      expect(detail.curve.at(-1)?.actual_pct).toBeCloseTo(row.sell_through!);
      const grid = await get<OptionStoreAvailability>(`/v1/option-stores/MUM01/${row.option_code}/availability`);
      expect(grid.days.reduce((n, day) => n + day.units, 0)).toBe(row.sales_14d);
      expect(grid.days.filter(day => day.qualifying).length).toBe(row.health?.qualifying_days);
      expect(grid.days.filter(day => day.date < row.first_grn!).every(day => day.units === 0 && !day.qualifying)).toBe(true);
    }
  });

  it('uses separate dated snapshots and rejects missing records and write requests', async () => {
    const current = await get<StoreList>('/v1/stores');
    const previous = await get<StoreList>('/v1/stores', { snapshot_id: 'snap_demo_20261001' });
    expect(current.as_of).not.toBe(previous.as_of);
    expect(current.items[0]!.deltas?.saleable_units).toBe(current.items[0]!.saleable_units - previous.items[0]!.saleable_units);
    expect(demoResponse('GET', '/v1/option-stores/UNKNOWN/missing').status).toBe(404);
    expect(demoResponse('GET', '/v1/stores', { snapshot_id: 'missing' }).status).toBe(404);
    expect(demoResponse('POST', '/v1/snapshots').status).toBe(405);
  });
});
