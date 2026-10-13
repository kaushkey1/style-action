import { useMemo } from 'react';
import { SectionHeader, EmptyState, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { PlanningGridRow, ChannelId } from '../types/aopPlanning.types';
import { CHANNEL_CATEGORIES, PRODUCT_CATEGORIES } from '../data/mockChannels';

interface CategoryBreakdownViewProps {
  gridRows: PlanningGridRow[];
  activeChannelId: ChannelId | '__all__';
}

interface CategorySummary {
  category: string;
  totalValue: number;
  pctOfChannel: number;
  storeCount: number;
  topStore: string;
  topStoreValue: number;
}

export function CategoryBreakdownView({
  gridRows,
  activeChannelId,
}: CategoryBreakdownViewProps): React.ReactNode {
  const isAll = activeChannelId === '__all__';

  const channelStores = useMemo(
    () => gridRows.filter((r) =>
      r.level === 'store' && (isAll || r.channelId === activeChannelId),
    ),
    [gridRows, activeChannelId, isAll],
  );

  // Derive the denominator from the filtered stores so it works regardless of row-id format.
  const channelTotal = useMemo(
    () => channelStores.reduce((s, r) => s + r.fyTotal, 0),
    [channelStores],
  );

  const titleLabel = isAll ? 'All Channels' : activeChannelId;

  const categories = useMemo(
    () => isAll
      ? [...PRODUCT_CATEGORIES]
      : (CHANNEL_CATEGORIES[activeChannelId as ChannelId] ?? []),
    [activeChannelId, isAll],
  );

  const categorySummaries = useMemo((): CategorySummary[] => {
    return categories.map((category) => {
      let totalValue = 0;
      let storeCount = 0;
      let topStore = '';
      let topStoreValue = 0;

      for (const store of channelStores) {
        const alloc = store.categoryAllocations.find((a) => a.category === category);
        if (alloc && alloc.value > 0) {
          totalValue += alloc.value;
          storeCount++;
          if (alloc.value > topStoreValue) {
            topStoreValue = alloc.value;
            topStore = store.label;
          }
        }
      }

      return {
        category,
        totalValue: Math.round(totalValue * 100) / 100,
        pctOfChannel: channelTotal > 0 ? Math.round((totalValue / channelTotal) * 100 * 10) / 10 : 0,
        storeCount,
        topStore,
        topStoreValue: Math.round(topStoreValue * 100) / 100,
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
  }, [categories, channelStores, channelTotal]);

  if (categorySummaries.length === 0) {
    return <EmptyState title="No category data" description="No category allocations found for this channel." variant="neutral" />;
  }

  const maxValue = Math.max(...categorySummaries.map((c) => c.totalValue));

  return (
    <div className="space-y-4">
      <SectionHeader title={`Category Breakdown — ${titleLabel}`} />

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 min-w-[200px]">Allocation</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Value (₹ Cr)</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">% of Channel</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Stores</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Top Contributor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categorySummaries.map((cat) => {
                const barWidth = maxValue > 0 ? (cat.totalValue / maxValue) * 100 : 0;
                return (
                  <tr key={cat.category} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{cat.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-gray-700 rounded-full h-2 transition-all"
                            // eslint-disable-next-line no-restricted-syntax -- dynamic bar width from computed data
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 tabular-nums w-10 text-right">{cat.pctOfChannel}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                      ₹{cat.totalValue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {cat.pctOfChannel.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {cat.storeCount}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[180px]">
                      {cat.topStore} <span className="text-gray-400">(₹{cat.topStoreValue.toFixed(2)})</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">
                  ₹{categorySummaries.reduce((s, c) => s + c.totalValue, 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-gray-900">100%</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Per-store category breakdown */}
      <SectionHeader title="Store × Category Detail" />
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-500 sticky left-0 bg-gray-50 z-10 min-w-[200px]">Store</th>
                {categories.map((cat) => (
                  <th key={cat} className="px-3 py-3 text-right font-medium text-gray-500 whitespace-nowrap min-w-[80px]">
                    {cat}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium text-gray-500 min-w-[80px]">FY Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {channelStores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-gray-900 sticky left-0 bg-white z-10 whitespace-nowrap">
                    {store.label}
                    {store.storeClassification && store.storeClassification !== 'LFL' && (
                      <Badge
                        size="sm"
                        variant={store.storeClassification === 'NEW' ? 'info' : store.storeClassification === 'CLOSURE' ? 'error' : 'warning'}
                        className="ml-1.5"
                      >
                        {store.storeClassification}
                      </Badge>
                    )}
                  </td>
                  {categories.map((cat) => {
                    const alloc = store.categoryAllocations.find((a) => a.category === cat);
                    return (
                      <td key={cat} className={cn(
                        'px-3 py-2.5 text-right tabular-nums whitespace-nowrap',
                        alloc && alloc.value > 0 ? 'text-gray-700' : 'text-gray-400',
                      )}>
                        {alloc && alloc.value > 0 ? `₹${alloc.value.toFixed(2)}` : '—'}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-gray-900 whitespace-nowrap">
                    ₹{store.fyTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
