import type { OptionStoreRow } from '../../api/types';

export type SalesWindow = 'life' | 'recent';
export type InventoryPosition = 'stock' | 'transit' | 'sold';
export const POSITION_LABEL = { stock: 'In store', transit: 'In transit', sold: 'Sold' } as const;
export function parsePosition(value: string | null): InventoryPosition {
  return value === 'transit' || value === 'sold' ? value : 'stock';
}
export function positionUnits(row: OptionStoreRow, position: InventoryPosition, salesWindow: SalesWindow = 'recent'): number {
  return position === 'stock' ? row.on_hand : position === 'transit' ? row.transit : salesWindow === 'life' ? row.sold ?? 0 : row.sales_14d;
}
export function brickOf(row: OptionStoreRow): string {
  return row.brick?.trim().toUpperCase() || 'UNCLASSIFIED';
}
export function brickName(brick: string): string {
  return brick.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export function needsReview(row: OptionStoreRow): boolean {
  return row.health?.band === 'supply_constrained' || row.health?.band === 'under' || row.health?.band === 'watch' ||
    (row.grade_class !== 'Core' && (row.days_in_store ?? 0) >= 90 && row.on_hand > 0);
}
export function performanceLabel(row: OptionStoreRow): string {
  if (row.health?.band === 'supply_constrained') return 'Size availability issue';
  if (row.gap === null) return 'Target unavailable';
  if (row.gap > 0.1) return 'Below sales target';
  if (row.gap < -0.1) return 'Above sales target';
  return 'Near sales target';
}
export function ageLabel(row: OptionStoreRow): string {
  return row.days_in_store === null ? 'Age unknown' : `${row.days_in_store} days`;
}
export interface JourneyBrick {
  key: string;
  rows: OptionStoreRow[];
  units: number;
  recentSales: number;
  reviewCount: number;
  agedUnits: number;
}
/** The existing option endpoint is the source for all three mutually scoped views. Sales remain net, including returns. */
export function groupInventory(rows: readonly OptionStoreRow[], position: InventoryPosition, salesWindow: SalesWindow = 'recent', quantity = (row: OptionStoreRow) => positionUnits(row, position, salesWindow)): JourneyBrick[] {
  const groups = new Map<string, JourneyBrick>();
  for (const row of rows) {
    if (quantity(row) === 0) continue;
    const key = brickOf(row);
    const group = groups.get(key) ?? { key, rows: [], units: 0, recentSales: 0, reviewCount: 0, agedUnits: 0 };
    group.rows.push(row);
    group.units += quantity(row);
    group.recentSales += row.sales_14d;
    group.reviewCount += Number(needsReview(row));
    group.agedUnits += (row.days_in_store ?? 0) >= 90 ? row.on_hand : 0;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.units - a.units || a.key.localeCompare(b.key));
}
export function matchesJourneySearch(row: OptionStoreRow, query: string): boolean {
  const value = query.trim().toLowerCase();
  return !value || [row.option_code, row.option_name, row.brick, row.brand].some((field) => field?.toLowerCase().includes(value));
}

/** Stocks + transit + net sold since receipt form the existing contract's reconstructed inward total. */
export function inventoryBalance(rows: readonly OptionStoreRow[]) {
  return {
    stock: rows.reduce((sum, row) => sum + row.on_hand, 0),
    transit: rows.reduce((sum, row) => sum + row.transit, 0),
    sold: rows.some((row) => row.sold === null) ? null : rows.reduce((sum, row) => sum + (row.sold ?? 0), 0),
  };
}
