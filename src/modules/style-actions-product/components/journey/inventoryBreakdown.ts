import type { OptionStoreRow } from '../../api/types';
import { STYLE_ACTIONS_DEMO } from '../../api/demoMode';
import { makeDemoJourneyBreakdown } from '../../data/demoJourneyBreakdown';
import type { InventoryPosition, SalesWindow } from './inventoryJourney';

export const AGE_STAGES = [
  { key: 'age_0_29', label: '0–29 days', colour: 'bg-teal-600', text: 'text-white' },
  { key: 'age_30_59', label: '30–59 days', colour: 'bg-sky-600', text: 'text-white' },
  { key: 'age_60_89', label: '60–89 days', colour: 'bg-amber-400', text: 'text-gray-900' },
  { key: 'age_90_plus', label: '90+ days', colour: 'bg-rose-600', text: 'text-white' },
  { key: 'unknown', label: 'Unknown', colour: 'bg-gray-300', text: 'text-gray-900' },
] as const;
export const PRICE_STAGES = [
  { key: 'full', label: 'Full price', colour: 'bg-indigo-600', text: 'text-white' },
  { key: 'markdown', label: 'Markdown', colour: 'bg-violet-400', text: 'text-gray-900' },
  { key: 'liquidation', label: 'Liquidation', colour: 'bg-orange-500', text: 'text-gray-900' },
  { key: 'unknown', label: 'Unknown', colour: 'bg-gray-300', text: 'text-gray-900' },
] as const;
export const DIRECTIONS = [
  { key: 'incoming', label: 'Coming to store', colour: 'bg-teal-600', text: 'text-white' },
  { key: 'outgoing', label: 'Going from store', colour: 'bg-orange-500', text: 'text-gray-900' },
] as const;
export type AgeStage = typeof AGE_STAGES[number]['key'];
export type PriceStage = typeof PRICE_STAGES[number]['key'];
export type Direction = typeof DIRECTIONS[number]['key'];
export type BreakdownDimension = 'age' | 'price' | 'direction';
export type StageFilters = { age?: AgeStage | null; price?: PriceStage | null; direction?: Direction | null };
export interface QuantitySlice { units: number; age: AgeStage; price: PriceStage; direction?: Direction }
export interface JourneyBreakdown {
  stock: QuantitySlice[];
  sold: Record<SalesWindow, QuantitySlice[]>;
  incoming: number;
  outgoing: number | null;
  source: 'demo' | 'unavailable';
}
export const STAGES = { age: AGE_STAGES, price: PRICE_STAGES, direction: DIRECTIONS };
export type BreakdownIndex = ReadonlyMap<string, JourneyBreakdown>;
export function ageStage(days: number): AgeStage {
  return days < 30 ? 'age_0_29' : days < 60 ? 'age_30_59' : days < 90 ? 'age_60_89' : 'age_90_plus';
}

/** Existing snapshots lack lot age, realised price stage and outbound shipments. Never infer them from recommendations. */
export function optionBreakdown(row: OptionStoreRow, demo = STYLE_ACTIONS_DEMO): JourneyBreakdown {
  if (demo) return makeDemoJourneyBreakdown(row);
  const unknown = (units: number): QuantitySlice[] => [{ units, age: 'unknown', price: 'unknown' }];
  return { stock: unknown(row.on_hand), sold: { life: unknown(row.sold ?? 0), recent: unknown(row.sales_14d) }, incoming: row.transit, outgoing: null, source: 'unavailable' };
}
export function quantitySlices(data: JourneyBreakdown, position: InventoryPosition, period: SalesWindow): QuantitySlice[] {
  if (position === 'stock') return data.stock;
  if (position === 'sold') return data.sold[period];
  return [{ units: data.incoming, age: 'unknown', price: 'unknown', direction: 'incoming' }, ...(data.outgoing === null ? [] : [{ units: data.outgoing, age: 'unknown' as const, price: 'unknown' as const, direction: 'outgoing' as const }])];
}
export function matchesStages(slice: QuantitySlice, filters: StageFilters): boolean {
  return (!filters.age || slice.age === filters.age) && (!filters.price || slice.price === filters.price) && (!filters.direction || slice.direction === filters.direction);
}
export function breakdownUnits(data: JourneyBreakdown, position: InventoryPosition, period: SalesWindow, filters: StageFilters = {}): number {
  return quantitySlices(data, position, period).filter((slice) => matchesStages(slice, filters)).reduce((sum, slice) => sum + slice.units, 0);
}
export function stageTotals(rows: readonly OptionStoreRow[], index: BreakdownIndex, position: InventoryPosition, period: SalesWindow, dimension: BreakdownDimension, filters: StageFilters = {}): Record<string, number | null> {
  const totals: Record<string, number | null> = Object.fromEntries(STAGES[dimension].map((stage) => [stage.key, 0]));
  // A bar keeps its own stages visible; it responds to the OTHER dimension's selection.
  const otherFilters = { ...filters, [dimension]: null };
  for (const row of rows) {
    const data = index.get(row.option_code);
    if (!data) continue;
    for (const slice of quantitySlices(data, position, period)) {
      if (!matchesStages(slice, otherFilters)) continue;
      const key = slice[dimension];
      if (key) totals[key] = (totals[key] ?? 0) + slice.units;
    }
  }
  if (dimension === 'direction' && rows.some((row) => index.get(row.option_code)?.outgoing == null)) totals.outgoing = null;
  return totals;
}
