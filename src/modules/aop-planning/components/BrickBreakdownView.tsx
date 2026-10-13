import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeader, EmptyState } from '@/components/ui';
import { useBrickView } from '../api/salesPlanHooks';

interface BrickBreakdownViewProps {
  cycleId: string;
  channel?: string; // undefined / '__all__' => all channels
}

function fmtCr(value: number): string {
  return `₹${value.toFixed(2)}`;
}

function fmtPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function golyClass(value: number): string {
  if (value > 0) return 'text-green-700';
  if (value < 0) return 'text-red-700';
  return 'text-gray-500';
}

export function BrickBreakdownView({ cycleId, channel }: BrickBreakdownViewProps): React.ReactNode {
  const ch = !channel || channel === '__all__' ? undefined : channel;
  const { data, isLoading, isError } = useBrickView(cycleId, ch);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(cat: string): void {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  if (isLoading) {
    return <div className="h-40 rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />;
  }
  if (isError || !data || data.categories.length === 0) {
    return (
      <EmptyState
        title="No category/brick data"
        description="Generate the plan to see the category → SAP brick breakdown."
        variant="neutral"
      />
    );
  }

  return (
    <div className="space-y-3">
      <SectionHeader title="Category → Brick (SAP)" />
      <p className="text-xs text-gray-500 -mt-1">
        Expand a category to see its SAP bricks. GOLY = latest estimate over last year (derived).
      </p>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-500 min-w-[220px]">Category / Brick</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Working (₹ Cr)</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Generated</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Latest Est</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">LY</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">GOLY</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.categories.map((cat) => {
                const isOpen = expanded.has(cat.category);
                return (
                  <React.Fragment key={cat.category}>
                    <tr className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        <button
                          type="button"
                          onClick={() => toggle(cat.category)}
                          className="inline-flex items-center gap-1.5"
                          aria-expanded={isOpen}
                          aria-label={isOpen ? `Collapse ${cat.category}` : `Expand ${cat.category}`}
                        >
                          {cat.bricks.length > 0 ? (
                            isOpen ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )
                          ) : (
                            <span className="w-4" />
                          )}
                          {cat.category}
                          {cat.bricks.length > 0 && (
                            <span className="text-xs text-gray-400 font-normal">({cat.bricks.length})</span>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{fmtCr(cat.value)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-500">{fmtCr(cat.generated)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{fmtCr(cat.latestEstimate)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-500">{fmtCr(cat.priorYear)}</td>
                      <td className={cn('px-4 py-3 text-right tabular-nums font-medium', golyClass(cat.golyPct))}>
                        {cat.priorYear > 0 ? fmtPct(cat.golyPct) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{cat.pctOfTotal.toFixed(1)}%</td>
                    </tr>
                    {isOpen &&
                      cat.bricks.map((b) => (
                        <tr key={b.brickCd} className="bg-gray-50/40 text-gray-600">
                          <td className="px-4 py-2 pl-12 text-xs">
                            {b.brickDesc}
                            <span className="text-gray-400"> ({b.brickCd})</span>
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-xs">{fmtCr(b.value)}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-xs text-gray-400">{fmtCr(b.generated)}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-xs">{fmtCr(b.latestEstimate)}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-xs text-gray-400">{fmtCr(b.priorYear)}</td>
                          <td className={cn('px-4 py-2 text-right tabular-nums text-xs font-medium', golyClass(b.golyPct))}>
                            {b.priorYear > 0 ? fmtPct(b.golyPct) : '—'}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-xs text-gray-500">
                            {b.pctOfCategory.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">{fmtCr(data.total)}</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
