import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { demoResponse, DEMO_SNAPSHOT_ID } from '@/modules/style-actions-product/data/demoApi';
import { optionBreakdown, breakdownUnits, quantitySlices, stageTotals, ageStage, type StageFilters } from '@/modules/style-actions-product/components/journey/inventoryBreakdown';
import { StageStack } from '@/modules/style-actions-product/components/journey/BreakdownBars';
import { groupInventory } from '@/modules/style-actions-product/components/journey/inventoryJourney';
import type { OptionStoreRow, Page } from '@/modules/style-actions-product/api/types';

async function rows() {
  return (await demoResponse('GET', '/v1/option-stores', { snapshot_id: DEMO_SNAPSHOT_ID, store_code: 'PUN01', page_size: 200 }).json() as Page<OptionStoreRow>).items;
}

describe('inventory stage accounting', () => {
  it('reconciles age and price to the exact stock and sales totals, and transit to both directions', async () => {
    const data = await rows();
    const index = new Map(data.map((row) => [row.option_code, optionBreakdown(row, true)]));
    for (const row of data) {
      const mix = index.get(row.option_code)!;
      expect(breakdownUnits(mix, 'stock', 'life')).toBe(row.on_hand);
      expect(breakdownUnits(mix, 'sold', 'life')).toBe(row.sold);
      expect(breakdownUnits(mix, 'sold', 'recent')).toBe(row.sales_14d);
      expect(breakdownUnits(mix, 'transit', 'life')).toBe(row.transit + (mix.outgoing ?? 0));
      for (const position of ['stock', 'sold'] as const) for (const period of ['life', 'recent'] as const) {
        for (const dimension of ['age', 'price'] as const) {
          const total = Object.values(stageTotals([row], index, position, period, dimension)).reduce<number>((sum, units) => sum + (units ?? 0), 0);
          expect(total).toBe(breakdownUnits(mix, position, period));
        }
      }
      // Every recent transaction is included in lifetime with the SAME sale-time attributes.
      for (const recent of mix.sold.recent) {
        const sameStage = (slice: typeof recent) => slice.age === recent.age && slice.price === recent.price;
        expect(mix.sold.life.filter(sameStage).reduce((sum, slice) => sum + slice.units, 0)).toBeGreaterThanOrEqual(mix.sold.recent.filter(sameStage).reduce((sum, slice) => sum + slice.units, 0));
      }
    }
    expect(Object.values(stageTotals(data, index, 'transit', 'life', 'direction'))).toEqual([216,103]);
  });
  it('cross-filters actual matching units, with the same result at store, brick and option level', async () => {
    const data = await rows();
    const index = new Map(data.map((row) => [row.option_code, optionBreakdown(row, true)]));
    const filters: StageFilters = { age: 'age_90_plus', price: 'liquidation' };
    const quantity = (row: OptionStoreRow) => breakdownUnits(index.get(row.option_code)!, 'stock', 'life', filters);
    const groups = groupInventory(data, 'stock', 'life', quantity);
    const ageTotal = stageTotals(data, index, 'stock', 'life', 'age', filters).age_90_plus;
    const priceTotal = stageTotals(data, index, 'stock', 'life', 'price', filters).liquidation;
    expect(ageTotal).toBeGreaterThan(0);
    expect(ageTotal).toBe(priceTotal);
    expect(groups.reduce((sum, brick) => sum + brick.units, 0)).toBe(ageTotal);
    expect(groups.flatMap((brick) => brick.rows).reduce((sum, row) => sum + quantity(row), 0)).toBe(ageTotal);
    expect(data.some((row) => quantity(row) > 0 && quantity(row) < row.on_hand)).toBe(true);
  });
  it('keeps live stages unknown and outbound unavailable; does not treat an unknown direction as zero', async () => {
    const [row] = await rows();
    const mix = optionBreakdown(row, false);
    const index = new Map([[row.option_code, mix]]);
    expect(mix.source).toBe('unavailable');
    expect(mix.stock).toEqual([{ units: row.on_hand, age: 'unknown', price: 'unknown' }]);
    expect(mix.outgoing).toBeNull();
    expect(stageTotals([row], index, 'transit', 'life', 'direction')).toEqual({ incoming: row.transit, outgoing: null });
    render(<StageStack dimension="direction" values={{ incoming: row.transit, outgoing: null }} label="Transit" />);
    expect(screen.getByText('Direction split unavailable')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /100.0%/ })).not.toBeInTheDocument();
  });
  it('retains negative net sales without drawing misleading proportional bars', async () => {
    const [row] = await rows();
    const mix = optionBreakdown({ ...row, sales_14d: -3 }, true);
    expect(quantitySlices(mix, 'sold', 'recent')).toEqual([{ units: -3, age: 'unknown', price: 'unknown' }]);
    render(<StageStack dimension="price" values={{ full: 0, markdown: 0, liquidation: 0, unknown: -3 }} label="Returned" />);
    expect(screen.getByText('Net adjustments · see quantities')).toBeInTheDocument();
    expect(screen.getByText('−3')).toBeInTheDocument();
  });
  it('uses non-overlapping age boundaries', () => {
    expect([0,29,30,59,60,89,90,180].map(ageStage)).toEqual(['age_0_29','age_0_29','age_30_59','age_30_59','age_60_89','age_60_89','age_90_plus','age_90_plus']);
  });
});
