import React from 'react';
import { cn } from '@/lib/utils';
import { SectionHeader, EmptyState } from '@/components/ui';
import { useChannelVariance } from '../api/salesPlanHooks';

interface ChannelVariancePanelProps {
  cycleId: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  EBO: 'EBO',
  Distribution: 'Distribution',
  'Superdry.in': 'Superdry.in',
  SIS: 'SIS',
  MBO: 'MBO',
  Others: 'Others',
  Omni: 'Omni',
};

function fmtCr(value: number): string {
  return `₹${value.toFixed(2)} Cr`;
}

export function ChannelVariancePanel({ cycleId }: ChannelVariancePanelProps): React.ReactNode {
  const { data, isLoading, isError } = useChannelVariance(cycleId);

  return (
    <div className="space-y-3">
      <SectionHeader title="Channel Variance" />
      <p className="text-xs text-gray-500 -mt-1">
        Top-down channel targets vs post-edit bottom-up (sum of store working plans).
      </p>
      {isLoading ? (
        <div className="h-24 rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />
      ) : isError || !data ? (
        <EmptyState title="Unable to load variance" description="Try regenerating the plan." />
      ) : data.channels.length === 0 ? (
        <EmptyState title="No channels" description="Generate the plan to see channel variance." />
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Channel</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Top-Down Target</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Bottom-Up (Σ stores)</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Variance</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Variance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.channels.map((ch) => (
                  <tr key={ch.channel} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {CHANNEL_LABELS[ch.channel] ?? ch.channel}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{fmtCr(ch.topDown)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">{fmtCr(ch.bottomUp)}</td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right tabular-nums font-medium',
                        ch.variance > 0 ? 'text-green-700' : ch.variance < 0 ? 'text-red-700' : 'text-gray-700',
                      )}
                    >
                      {ch.variance > 0 ? '+' : ''}
                      {ch.variance.toFixed(2)}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right tabular-nums font-medium',
                        Math.abs(ch.variancePct) > 5
                          ? 'text-red-600'
                          : Math.abs(ch.variancePct) > 1
                            ? 'text-amber-600'
                            : 'text-green-600',
                      )}
                    >
                      {ch.variancePct > 0 ? '+' : ''}
                      {ch.variancePct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
