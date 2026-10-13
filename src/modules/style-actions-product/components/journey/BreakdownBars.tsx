import { cn } from '@/lib/utils';
import type { OptionStoreRow } from '../../api/types';
import { formatUnits } from '../display';
import type { InventoryPosition, SalesWindow } from './inventoryJourney';
import { STAGES, stageTotals, type BreakdownDimension, type BreakdownIndex, type StageFilters } from './inventoryBreakdown';

export function StageStack({ dimension, values, selected, label, compact = false, onSelect }: {
  dimension: BreakdownDimension; values: Record<string, number | null>; selected?: string | null;
  label: string; compact?: boolean; onSelect?: (key: string) => void;
}) {
  const stages = STAGES[dimension].filter((stage) => stage.key !== 'unknown' || values.unknown !== 0);
  const total = Object.values(values).reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const valid = Object.values(values).every((value) => value !== null && Number.isFinite(value) && value >= 0);
  return <div className="min-w-0 space-y-1" role="group" aria-label={label}>
    {valid && total > 0 ? <div className={cn('flex overflow-hidden rounded-md bg-gray-100', compact ? 'h-5' : 'h-6 [@media(pointer:coarse)]:h-9')}>
      {stages.map((stage) => {
        const value = values[stage.key] ?? 0;
        if (!value) return null;
        const share = value / total * 100;
        const name = `${label} · ${stage.label}: ${formatUnits(value)} units · ${share.toFixed(1)}%`;
        return <button type="button" key={stage.key} title={name} aria-label={name} aria-pressed={selected === stage.key} disabled={!onSelect} onClick={() => onSelect?.(stage.key)}
          className={cn('min-w-0 overflow-hidden whitespace-nowrap border-r border-white/40 text-[11px] font-semibold tabular-nums last:border-0 hover:brightness-110 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gray-950 disabled:opacity-100', stage.colour, stage.text, selected && selected !== stage.key && 'opacity-30')}
          // eslint-disable-next-line no-restricted-syntax -- widths encode exact unit shares without minimum-width distortion
          style={{ width: `${share}%` }}>
          {share >= (compact ? 16 : 10) ? formatUnits(value) : null}
        </button>;
      })}
    </div> : <div className={cn('rounded-md bg-gray-50 px-2 text-xs text-gray-500', compact ? 'py-0.5' : 'py-2.5')}>{!valid ? Object.values(values).some((value) => value === null) ? 'Direction split unavailable' : 'Net adjustments · see quantities' : '0 units'}</div>}
    {!compact && <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
      {stages.map((stage) => <button key={stage.key} type="button" disabled={!onSelect || values[stage.key] == null || values[stage.key] === 0} onClick={() => onSelect?.(stage.key)} aria-label={`Filter ${label} by ${stage.label}`} aria-pressed={selected === stage.key} className={cn('flex items-center gap-0.5 rounded px-0 py-0.5 text-[11px] [@media(pointer:coarse)]:min-h-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900 disabled:opacity-100', (values[stage.key] === 0 || values[stage.key] == null) && 'opacity-50', selected === stage.key ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-600')}><span className={cn('size-2 shrink-0 rounded-sm', stage.colour)} /><span>{stage.label}</span><span className="font-semibold tabular-nums text-gray-900">{formatUnits(values[stage.key])}</span>{valid && total > 0 && <span className="text-[10px] tabular-nums text-gray-400">{Math.round((values[stage.key] ?? 0) / total * 100)}%</span>}</button>)}
    </div>}
  </div>;
}

export function BreakdownBars({ rows, index, position, period, filters = {}, label, compact = false, onSelect }: {
  rows: readonly OptionStoreRow[]; index: BreakdownIndex; position: InventoryPosition; period: SalesWindow;
  filters?: StageFilters; label: string; compact?: boolean; onSelect?: (dimension: BreakdownDimension, key: string) => void;
}) {
  const dimensions: BreakdownDimension[] = position === 'transit' ? ['direction'] : ['age', 'price'];
  return <div className={cn(compact ? 'space-y-1' : position === 'transit' ? 'space-y-2' : 'grid gap-3 md:grid-cols-2')}>
    {dimensions.map((dimension) => <div key={dimension} className={cn('min-w-0', compact ? 'grid grid-cols-[2.7rem_minmax(0,1fr)] items-center gap-2' : 'space-y-1')}>
      <div className={cn('font-medium text-gray-600', compact ? 'text-[10px]' : 'text-xs')}>{dimension === 'direction' ? compact ? 'Transit' : 'Shipment direction' : dimension === 'price' ? compact ? 'Price' : position === 'sold' ? 'Price stage at sale' : 'Selling price stage' : compact ? 'Age' : position === 'sold' ? 'Inventory age at sale' : 'Inventory age in store'}</div>
      <StageStack dimension={dimension} values={stageTotals(rows, index, position, period, dimension, filters)} selected={filters[dimension]} label={`${label} ${dimension}`} compact={compact} onSelect={onSelect ? (key) => onSelect(dimension, key) : undefined} />
    </div>)}
  </div>;
}
