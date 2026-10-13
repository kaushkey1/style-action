import { useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  KpiLabel,
  SectionHeader,
  EmptyState,
  MetricGrid,
  MetricCard,
} from '@/components/ui';
import { cn, formatNumber } from '@/lib/utils';
import { getStoreById } from '@/modules/aop/data/mockAOPStorePlans'; // mock-ok — config lookup

interface AopRevenueTabProps {
  storeId: string;
}

export function AopRevenueTab({ storeId }: AopRevenueTabProps) {
  const store = useMemo(() => getStoreById(storeId), [storeId]);

  if (!store) return <EmptyState description="No AOP data available for this store" />;

  const fashionPct = store.segments.length > 0
    ? Math.round(store.segments.reduce((s, seg) => s + seg.fashionSplit.fashionPct, 0) / store.segments.length)
    : 30;

  return (
    <div className="space-y-4">
      {/* Store AOP Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="AOP Metrics" className="mb-4" />
        <MetricGrid columns={3}>
          {[
            { label: 'Annual Revenue', value: `₹${store.annualRevenue.toFixed(2)} Cr` },
            { label: 'Gross Margin', value: `₹${store.annualGM.toFixed(2)} Cr (${store.blendedDeliveredMargin}%)` },
            { label: <><KpiLabel abbr="SPSF" /></>, value: `₹${formatNumber(store.spsfTarget)}` },
            { label: 'Saleable SFT', value: formatNumber(store.saleableArea) },
            { label: 'Garments', value: formatNumber(store.garmentCapacity) },
            { label: 'Options', value: formatNumber(store.optionCount) },
            { label: 'Cover Days', value: `${store.targetCoverDays}` },
            { label: 'Turns', value: `${store.targetTurns}x` },
            { label: 'Fashion %', value: `${fashionPct}%` },
          ].map((m, idx) => (
            <MetricCard key={idx} label={m.label} value={m.value} />
          ))}
        </MetricGrid>
      </div>

      {/* Segment Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Segment Revenue Breakdown" className="mb-4" />
        {store.segments.length === 0 ? (
          <EmptyState description="No segment data available" />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Segment</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3">SFT</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3"><KpiLabel abbr="SPSF" /></th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3">Ann Revenue</th>
                <th className="text-right text-xs font-medium text-gray-500 pb-3">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {store.segments.map((seg) => (
                <tr key={seg.segmentId} className="border-b border-gray-50">
                  <td className="py-3 text-sm font-medium text-gray-900">{seg.segmentName}</td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">{formatNumber(seg.allocatedSFT)}</td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">₹{formatNumber(seg.spsfTarget)}</td>
                  <td className="py-3 text-sm text-gray-700 text-right tabular-nums">₹{seg.annualRevenue.toFixed(2)} Cr</td>
                  <td className={cn(
                    'py-3 text-sm text-right tabular-nums font-semibold',
                    seg.efficiency > 110 ? 'text-green-700' : seg.efficiency < 85 ? 'text-red-700' : 'text-gray-700'
                  )}>
                    {seg.efficiency}%
                    {seg.efficiency > 110 && <ArrowUpRight className="w-3 h-3 inline ml-0.5" />}
                    {seg.efficiency < 85 && <ArrowDownRight className="w-3 h-3 inline ml-0.5" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
