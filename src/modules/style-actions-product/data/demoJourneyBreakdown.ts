import type { OptionStoreRow } from '../api/types';
import { ageStage, type JourneyBreakdown, type QuantitySlice, type PriceStage } from '../components/journey/inventoryBreakdown';

/** Illustrative lot and transaction mix ONLY. Not inferred engine results or an applied markdown. */
export function makeDemoJourneyBreakdown(row: OptionStoreRow): JourneyBreakdown {
  const seed = [...`${row.store_code}:${row.option_code}`].reduce((sum, char) => sum * 31 + char.charCodeAt(0) >>> 0, 0);
  const age = Math.max(0, row.days_in_store ?? 0);
  const slices = (units: number, kind: 'stock' | 'recent' | 'older'): QuantitySlice[] => {
    if (units < 0 || row.days_in_store === null) return [{ units, age: 'unknown', price: 'unknown' }];
    // Six weighted lots: units stay whole and the last lot absorbs the rounding remainder.
    const weights = [12, 16, 17, 15, 18, 22];
    let assigned = 0;
    return weights.map((weight, i) => {
      const count = i === weights.length - 1 ? units - assigned : Math.floor(units * weight / 100);
      assigned += count;
      const ageAtPoint = kind === 'stock' ? Math.floor(age * (0.4 + i * 0.12)) : kind === 'recent' ? Math.max(0, age - (seed + i * 3) % 14 - Math.floor(i * age / 16)) : Math.floor(Math.max(0, age - 14) * (0.2 + i * 0.15));
      const price: PriceStage = row.grade_class === 'Core' || ageAtPoint < 30 ? 'full' : ageAtPoint >= 90 ? (seed + i) % 4 >= 2 ? 'liquidation' : (seed + i) % 4 === 1 ? 'markdown' : 'full' : (seed + i) % 3 === 0 ? 'full' : 'markdown';
      return { units: count, age: ageStage(ageAtPoint), price };
    }).filter((slice) => slice.units !== 0);
  };
  const recent = slices(row.sales_14d, 'recent');
  const lifetime = row.sold ?? 0;
  const life = row.sold === null || lifetime < row.sales_14d || lifetime < 0 || row.sales_14d < 0
    ? [{ units: lifetime, age: 'unknown' as const, price: 'unknown' as const }]
    : [...recent, ...slices(lifetime - row.sales_14d, 'older')];
  return {
    stock: slices(row.on_hand, 'stock'), sold: { life, recent }, incoming: row.transit,
    // Separate dispatched movement fixture; never subtracted from on-hand a second time.
    outgoing: seed % 5 === 0 ? 3 + seed % 13 : 0, source: 'demo',
  };
}
