import { cn } from '@/lib/utils';
import { formatUnits } from '../display';
import { POSITION_LABEL, type InventoryPosition } from './inventoryJourney';

export const POSITION_COLOUR = { stock: 'bg-teal-700', transit: 'bg-amber-400', sold: 'bg-blue-600' } as const;
export function InventoryStack({ values, onSelect, label, compact = false }: {
  values: Record<InventoryPosition, number | null>;
  onSelect: (position: InventoryPosition) => void;
  label: string;
  compact?: boolean;
}) {
  const positions: InventoryPosition[] = ['stock', 'transit', 'sold'];
  const available = positions.every((key) => values[key] !== null && Number.isFinite(values[key]) && values[key]! >= 0);
  const total = positions.reduce((sum, key) => sum + (values[key] ?? 0), 0);
  if (!available) return <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">{values.sold === null ? 'Complete sales history unavailable' : 'Net adjustments prevent a proportional breakdown'}</p>;
  if (!total) return <div className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-500">No recorded units</div>;
  return <div role="group" aria-label={label} className={cn('flex w-full gap-0.5 overflow-hidden rounded-lg bg-gray-100', compact ? 'h-6' : 'h-8 [@media(pointer:coarse)]:h-11')}>
    {positions.map((key) => {
      const units = values[key]!;
      const share = units / total * 100;
      if (!units) return null;
      const description = `${POSITION_LABEL[key]}: ${formatUnits(units)} units · ${share.toFixed(1)}%${key === 'sold' ? ' · since first receipt' : ''}`;
      return <button key={key} type="button" onClick={() => onSelect(key)} title={description} aria-label={`${label} · ${description}`}
        className={cn('min-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold tabular-nums transition-opacity hover:opacity-80 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gray-900', POSITION_COLOUR[key], key === 'transit' ? 'text-gray-900' : 'text-white')}
        // eslint-disable-next-line no-restricted-syntax -- exact segment width represents its share of the recorded inventory balance
        style={{ width: `${share}%` }}>
        {!compact && share >= 12 ? `${formatUnits(units)} · ${share.toFixed(0)}%` : null}
      </button>;
    })}
  </div>;
}
