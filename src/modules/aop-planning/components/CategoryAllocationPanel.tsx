import { useState, useMemo } from 'react';
import { Sheet, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { CategoryAllocation } from '../types/aopPlanning.types';

interface CategoryAllocationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  fyTotal: number;
  allocations: CategoryAllocation[];
  onApply: (updated: CategoryAllocation[]) => void;
}

export function CategoryAllocationPanel({
  isOpen,
  onClose,
  storeName,
  fyTotal,
  allocations,
  onApply,
}: CategoryAllocationPanelProps): React.ReactNode {
  const [draft, setDraft] = useState<CategoryAllocation[]>(() =>
    allocations.map((a) => ({ ...a })),
  );

  // Reset the draft when fresh allocations arrive (e.g. after a save + refetch).
  // React-recommended "adjust state during render on prop change" pattern.
  const [syncedAllocations, setSyncedAllocations] = useState(allocations);
  if (syncedAllocations !== allocations) {
    setSyncedAllocations(allocations);
    setDraft(allocations.map((a) => ({ ...a })));
  }

  const totalPct = useMemo(
    () => Math.round(draft.reduce((s, d) => s + d.pct, 0) * 10) / 10,
    [draft],
  );

  const isValid = totalPct >= 99.5 && totalPct <= 100.5;
  const isOver = totalPct > 100.5;

  const withValue = (pct: number): number => Math.round((fyTotal * pct) / 100 * 100) / 100;

  // Only the edited box changes; other categories are left untouched.
  function handlePctChange(category: string, newPct: number): void {
    setDraft((prev) =>
      prev.map((d) =>
        d.category === category ? { ...d, pct: newPct, value: withValue(newPct) } : d,
      ),
    );
  }

  function handleApply(): void {
    onApply(draft);
    onClose();
  }

  function handleReset(): void {
    setDraft(allocations.map((a) => ({ ...a })));
  }

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Category Allocation"
      side="right"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm font-semibold text-gray-900">{storeName}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            FY Total: <span className="font-medium text-gray-700">₹{fyTotal.toFixed(2)} Cr</span>
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left font-medium text-gray-500">Category</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500 w-20">%</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Value (₹ Cr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {draft.map((alloc) => (
                <tr key={alloc.category} className="hover:bg-gray-50/50">
                  <td className="px-3 py-2 font-medium text-gray-900">{alloc.category}</td>
                  <td className="px-3 py-2 text-right">
                    {/* eslint-disable-next-line no-restricted-syntax -- inline percentage editor in table cell */}
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={alloc.pct}
                      onChange={(e) => handlePctChange(alloc.category, parseFloat(e.target.value) || 0)}
                      className="w-16 text-right text-sm border border-gray-200 rounded px-1.5 py-1 tabular-nums focus:ring-1 focus:ring-primary focus:border-primary"
                      aria-label={`${alloc.category} allocation percentage`}
                    />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-700">
                    ₹{alloc.value.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td className="px-3 py-2 font-semibold text-gray-900">Total</td>
                <td className="px-3 py-2 text-right">
                  <Badge className={cn(
                    'tabular-nums',
                    isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
                  )}>
                    {totalPct.toFixed(1)}%
                  </Badge>
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold text-gray-900">
                  ₹{draft.reduce((s, d) => s + d.value, 0).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {!isValid && (
          <p className="text-xs text-red-600">
            {isOver
              ? `Total is above 100% (currently ${totalPct.toFixed(1)}%). Reduce some categories.`
              : `Allocation must sum to 100%. Currently at ${totalPct.toFixed(1)}%.`}
          </p>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={!isValid} onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
