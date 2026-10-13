import { BarChart2, Eye, ClipboardCheck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCXScoreLabel } from '../data/cxScoreEngine';

import type { CXScoreResult, CXSourceKey } from '../data/cxScoreEngine';

const SOURCE_META: Record<CXSourceKey, { icon: typeof BarChart2; color: string; bgColor: string; trackColor: string }> = {
  nps: { icon: BarChart2, color: 'text-primary-600', bgColor: 'bg-primary-500', trackColor: 'bg-primary-100' },
  silentNps: { icon: Eye, color: 'text-gray-600', bgColor: 'bg-gray-500', trackColor: 'bg-gray-100' },
  audit: { icon: ClipboardCheck, color: 'text-amber-600', bgColor: 'bg-amber-500', trackColor: 'bg-amber-100' },
  google: { icon: Star, color: 'text-amber-500', bgColor: 'bg-amber-400', trackColor: 'bg-amber-100' },
};

function ScoreDonut({ score }: { score: number }): React.ReactNode {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const strokeColor = score >= 70 ? 'var(--color-primary-500)' : score >= 50 ? 'var(--color-primary-400)' : '#f59e0b';

  return (
    <div className="relative w-36 h-36 sm:w-40 sm:h-40 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128" aria-hidden>
        <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--color-primary-50)" strokeWidth="12" />
        <circle
          cx="64" cy="64" r={radius} fill="none"
          stroke={strokeColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-gray-900">{score}</span>
        <span className="text-[11px] text-gray-500 font-medium">{getCXScoreLabel(score)}</span>
      </div>
    </div>
  );
}

function SourceRow({ label, score, rawValue, rawUnit, available, sourceKey }: {
  label: string;
  score: number;
  rawValue: number | null;
  rawUnit: string;
  available: boolean;
  sourceKey: CXSourceKey;
}): React.ReactNode {
  const meta = SOURCE_META[sourceKey];
  const Icon = meta.icon;

  return (
    <div className={cn('flex items-center gap-3 py-1.5', !available && 'opacity-30')}>
      <div className={cn('flex h-7 w-7 items-center justify-center rounded-md shrink-0', available ? 'bg-primary-50' : 'bg-gray-100')}>
        <Icon className={cn('h-3.5 w-3.5', available ? 'text-primary-500' : 'text-gray-400')} aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        {/* eslint-disable-next-line design-system/prefer-section-header -- source row label + value pair, not a page section */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">{label}</span>
          <span className="text-xs text-gray-500 tabular-nums">
            {available && rawValue != null ? `${rawValue} ${rawUnit}` : '—'}
          </span>
        </div>
        <div className={cn('h-1.5 rounded-full overflow-hidden', available ? meta.trackColor : 'bg-gray-100')}>
          {available ? (
            /* eslint-disable-next-line no-restricted-syntax -- dynamic score bar width */
            <div className={cn('h-full rounded-full transition-all duration-500', meta.bgColor)} style={{ width: `${score}%` }} />
          ) : null}
        </div>
      </div>
      <span className={cn('text-sm font-semibold tabular-nums w-8 text-right', available ? 'text-gray-900' : 'text-gray-400')}>
        {available ? score : '—'}
      </span>
    </div>
  );
}

interface CXScoreHeaderProps {
  result: CXScoreResult;
}

export function CXScoreHeader({ result }: CXScoreHeaderProps): React.ReactNode {
  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-primary-50/30 to-white p-4">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <ScoreDonut score={result.compositeScore} />

        <div className="flex-1 w-full">
          {/* eslint-disable-next-line design-system/prefer-section-header -- score header with donut chart, not a page section */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Customer Experience Score</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Based on {result.availableSourceCount} data source{result.availableSourceCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {result.sources.map((source) => (
              <SourceRow
                key={source.key}
                label={source.label}
                score={source.normalized}
                rawValue={source.rawValue}
                rawUnit={source.rawUnit}
                available={source.available}
                sourceKey={source.key}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
