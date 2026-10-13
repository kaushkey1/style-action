import { cn } from '@/lib/utils';
import { SourceBadge } from './SourceBadge';

import type { FunnelStage } from '@/modules/jarvis/data/mockJarvis';

const STAGE_COLORS = [
  '#4f46e5',
  '#6366f1',
  '#818cf8',
  '#a5b4fc',
] as const;

interface JourneyFunnelProps {
  stages: FunnelStage[];
  className?: string;
}

function formatLargeNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toLocaleString();
}

export function JourneyFunnel({ stages, className }: JourneyFunnelProps): React.ReactNode {
  const maxValue = stages[0]?.value ?? 1;

  if (stages.length === 0) return null;

  return (
    <div className={cn('space-y-0', className)}>
      {stages.map((stage, i) => {
        const widthPercent = Math.max((stage.value / maxValue) * 100, 12);
        const color = STAGE_COLORS[i % STAGE_COLORS.length] ?? '#818cf8';
        const prevStage = i > 0 ? stages[i - 1] : undefined;
        const conversionFromPrev = prevStage && prevStage.value > 0
          ? ((stage.value / prevStage.value) * 100).toFixed(1)
          : null;
        const abandoned = prevStage ? prevStage.value - stage.value : 0;

        return (
          <div key={`${stage.stage}-${stage.label}`}>
            {/* Drop-off connector between stages */}
            {i > 0 && (
              <div className="relative ml-6 pl-6 border-l-2 border-dashed border-gray-200 py-2">
                <div className="flex items-center gap-3 text-xs">
                  {conversionFromPrev !== null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-green-700 font-medium tabular-nums">
                      {conversionFromPrev}% proceeded
                    </span>
                  )}
                  {abandoned > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-red-600 font-medium tabular-nums">
                      {formatLargeNumber(abandoned)} abandoned
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stage row */}
            <div className="flex items-stretch gap-4">
              {/* Step number */}
              <div className="flex flex-col items-center shrink-0 w-12">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  // eslint-disable-next-line no-restricted-syntax -- dynamic stage color from funnel data
                  style={{ backgroundColor: color }}
                >
                  {i + 1}
                </div>
                {i < stages.length - 1 && (
                  <div className="flex-1 w-0.5 bg-gray-200 mt-1" />
                )}
              </div>

              {/* Bar + metrics */}
              <div className="flex-1 min-w-0 pb-1">
                {/* Label row */}
                { }
                <div className="flex items-baseline gap-3 mb-1.5">
                  <span className="text-sm font-medium text-gray-900">{stage.label}</span>
                  <SourceBadge source={stage.source} />
                </div>

                {/* Bar */}
                <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                    // eslint-disable-next-line no-restricted-syntax -- dynamic funnel bar width and color from data
                    style={{ width: `${widthPercent}%`, backgroundColor: color }}
                  />
                  <div className="relative h-full flex items-center px-3">
                    <span className={cn(
                      'text-sm font-bold tabular-nums',
                      widthPercent > 30 ? 'text-white' : 'text-gray-900',
                    )}>
                      {formatLargeNumber(stage.value)}
                    </span>
                    {i > 0 && (
                      <span className={cn(
                        'ml-2 text-xs tabular-nums',
                        widthPercent > 40 ? 'text-white/70' : 'text-gray-500',
                      )}>
                        ({Math.round((stage.value / maxValue) * 100)}% of total)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Overall conversion */}
      {stages.length >= 2 && (
        <div className="mt-4 ml-16 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
          <span className="text-xs text-gray-500">Overall conversion</span>
          <span className="text-sm font-bold text-gray-900 tabular-nums">
            {maxValue > 0 ? ((stages[stages.length - 1]!.value / maxValue) * 100).toFixed(1) : '0'}%
          </span>
          <span className="text-xs text-gray-400">
            {formatLargeNumber(stages[0]?.value ?? 0)} &rarr; {formatLargeNumber(stages[stages.length - 1]?.value ?? 0)}
          </span>
        </div>
      )}
    </div>
  );
}
