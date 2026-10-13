import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn, classifyRag, ragToTextClass } from '@/lib/utils';
import { geographyPods, type GeographyPod } from '../data/mockApexData';
import { useThresholds } from '@/hooks/useThresholds';

type SortKey = 'name' | 'storeCount' | 'revenue' | 'revenuePerStore' | 'sellThrough' | 'grossMargin' | 'agedInventory';
type SortDir = 'asc' | 'desc';

const statusBadge: Record<GeographyPod['status'], { variant: 'success' | 'warning' | 'error'; label: string }> = {
  'on-track': { variant: 'success', label: 'On Track' },
  warning: { variant: 'warning', label: 'Watch' },
  critical: { variant: 'error', label: 'Critical' },
};

function parseNumeric(val: string): number {
  return parseFloat(val.replace(/[₹,%/dayL CrLmo]/g, '')) || 0;
}

export function ApexGeographyDrilldown() {
  const thresholds = useThresholds();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...geographyPods].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'name': cmp = a.name.localeCompare(b.name); break;
      case 'storeCount': cmp = a.storeCount - b.storeCount; break;
      case 'revenue': cmp = parseNumeric(a.revenue) - parseNumeric(b.revenue); break;
      case 'revenuePerStore': cmp = parseNumeric(a.revenuePerStore) - parseNumeric(b.revenuePerStore); break;
      case 'sellThrough': cmp = parseNumeric(a.sellThrough) - parseNumeric(b.sellThrough); break;
      case 'grossMargin': cmp = parseNumeric(a.grossMargin) - parseNumeric(b.grossMargin); break;
      case 'agedInventory': cmp = parseNumeric(a.agedInventory) - parseNumeric(b.agedInventory); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Summary stats
  const totalStores = geographyPods.reduce((s, p) => s + p.storeCount, 0);
  const onTrack = geographyPods.filter((p) => p.status === 'on-track').length;
  const warning = geographyPods.filter((p) => p.status === 'warning').length;
  const critical = geographyPods.filter((p) => p.status === 'critical').length;

  return (
    <div className="space-y-3">
      {/* Summary cards */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- custom status summary cards with conditional border colors, not a standard metric grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Stores</p>
          <p className="text-lg font-bold text-gray-900">{totalStores.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Across 10 PODs</p>
        </div>
        <div className="bg-white rounded-lg border border-success/30 bg-success-50/30 p-3">
          <p className="text-xs text-gray-500">On Track PODs</p>
          <p className="text-lg font-semibold text-green-700">{onTrack}</p>
          <p className="text-xs text-gray-400">Meeting all targets</p>
        </div>
        <div className="bg-white rounded-lg border border-warning/30 bg-warning-50/30 p-3">
          <p className="text-xs text-gray-500">Watch PODs</p>
          <p className="text-lg font-semibold text-amber-700">{warning}</p>
          <p className="text-xs text-gray-400">Below 1+ targets</p>
        </div>
        <div className="bg-white rounded-lg border border-error/30 bg-error-50/30 p-3">
          <p className="text-xs text-gray-500">Critical PODs</p>
          <p className="text-lg font-semibold text-red-700">{critical}</p>
          <p className="text-xs text-gray-400">Needs intervention</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">10 Operations PODs — Performance Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50">
                {([
                  ['name', 'POD Name'],
                  ['', 'States'],
                  ['storeCount', 'Stores'],
                  ['revenue', 'Revenue'],
                  ['revenuePerStore', 'Rev/Store'],
                  ['sellThrough', 'ST%'],
                  ['grossMargin', 'GM%'],
                  ['agedInventory', 'Aged Inv%'],
                  ['', 'Status'],
                ] as [SortKey | '', string][]).map(([key, label], colIdx) => (
                  <th
                    key={label}
                    className={cn(
                      'px-3 py-2 font-medium text-gray-500',
                      colIdx <= 1 ? 'text-left' : 'text-right',
                      key && 'cursor-pointer hover:text-gray-900 select-none'
                    )}
                    onClick={() => key && handleSort(key)}
                  >
                    <span
                      className={cn(
                        'flex items-center gap-1',
                        colIdx > 1 && 'w-full justify-end',
                      )}
                    >
                      {label}
                      {key && sortKey === key && <ArrowUpDown className="w-3 h-3" />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((pod) => {
                const badge = statusBadge[pod.status];
                return (
                  <tr
                    key={pod.id}
                    className={cn(
                      'border-t border-gray-100 hover:bg-gray-50 transition-colors',
                      pod.status === 'critical' && 'bg-red-50/30'
                    )}
                  >
                    <td className="px-3 py-2.5 font-medium text-gray-900">{pod.name}</td>
                    <td className="px-3 py-2.5 text-gray-500 max-w-[160px] truncate">{pod.states}</td>
                    <td className="px-3 py-2.5 text-right text-gray-900 font-medium tabular-nums whitespace-nowrap">
                      {pod.storeCount}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-900 font-medium tabular-nums whitespace-nowrap">
                      {pod.revenue}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-900 font-medium tabular-nums whitespace-nowrap">
                      {pod.revenuePerStore}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2.5 text-right font-medium tabular-nums whitespace-nowrap',
                        ragToTextClass(classifyRag(parseNumeric(pod.sellThrough), thresholds.get('avgSellThrough') ?? null)),
                      )}
                    >
                      {pod.sellThrough}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2.5 text-right font-medium tabular-nums whitespace-nowrap',
                        ragToTextClass(classifyRag(parseNumeric(pod.grossMargin), thresholds.get('grossMargin') ?? null)),
                      )}
                    >
                      {pod.grossMargin}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2.5 text-right font-medium tabular-nums whitespace-nowrap',
                        ragToTextClass(classifyRag(parseNumeric(pod.agedInventory), thresholds.get('agedInventory') ?? null)),
                      )}
                    >
                      {pod.agedInventory}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
