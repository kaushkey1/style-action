import { useState } from 'react';
import { Badge, Skeleton } from '@/components/ui';
import { cn, formatNumber } from '@/lib/utils';
import { useV3Formats, formatLabel, type V3FormatSummary } from '../api/spacePlanningV3Api';

const CATEGORY_COLORS: Record<string, string> = {
  WIW: 'bg-indigo-500',
  WWW: 'bg-violet-500',
  KW: 'bg-emerald-500',
  MC: 'bg-sky-500',
  MF: 'bg-amber-500',
};

const PODS_PREVIEW_COUNT = 8;

/** Compact sqft: 4,213,900 → "4.2M", 283,927 → "284k", 1,540 → "1,540". */
function fmtSqft(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000) return `${Math.round(v / 1_000)}k`;
  return formatNumber(v);
}

/** ₹ rate: 0 decimals (1 decimal below 100); 0/null renders as "—". */
function fmtRate(v: number | null): string {
  if (!v) return '—';
  return v < 100 ? `₹${v.toFixed(1)}` : `₹${formatNumber(Math.round(v))}`;
}

function Kpi({ label, value, unit }: { label: string; value: string; unit?: string }): React.ReactNode {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="mt-0.5">
        <span className="text-lg font-bold text-gray-900">{value}</span>
        {unit && <span className="text-xs text-gray-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function TrendChip({ pct }: { pct: number | null }): React.ReactNode {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-sm font-mono font-medium',
      pct == null ? 'text-gray-400' : pct > 0 ? 'text-green-700' : pct < 0 ? 'text-red-700' : 'text-gray-500',
    )}>
      {pct == null ? '—' : `${pct > 0 ? '▲ +' : pct < 0 ? '▼ ' : ''}${pct.toFixed(1)}%`}
    </span>
  );
}

function FormatCard({ fmt }: { fmt: V3FormatSummary }): React.ReactNode {
  const [showAllPods, setShowAllPods] = useState(false);
  const label = fmt.key === 'TST' ? 'TST' : formatLabel(fmt.key, null);

  const cats = [...fmt.categories].sort((a, b) => b.avgSharePct - a.avgSharePct);
  const shareTotal = cats.reduce((s, c) => s + c.avgSharePct, 0);

  const pods = fmt.pods; // already sorted by avg space desc from the API
  const maxPodSpace = pods[0]?.avgSpace ?? 0;
  const visiblePods = showAllPods ? pods : pods.slice(0, PODS_PREVIEW_COUNT);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* eslint-disable-next-line design-system/prefer-section-header -- card header: title + count chip */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-900">{label}</h3>
        <Badge variant="info" size="sm">{formatNumber(fmt.stores)} store{fmt.stores !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Row 1: space KPIs */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- compact in-card KPI grid, not a standalone metric section */}
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Carpet" value={fmtSqft(fmt.totalCarpet)} unit="sft" />
        <Kpi label="PL Pool" value={fmtSqft(fmt.totalPlPool)} unit="sft" />
        <Kpi label="Avg PL / Store" value={formatNumber(fmt.avgPlPool)} unit="sft" />
      </div>

      {/* Row 2: SPSF windows + trend chip */}
      <div className="flex items-start justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current SPSF</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{fmtRate(fmt.spsf.currentSpsf)}</p>
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prev-Yr SPSF</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{fmtRate(fmt.spsf.prevYearSpsf)}</p>
        </div>
        <TrendChip pct={fmt.spsf.spsfTrendPct} />
      </div>

      {/* Category split — stacked bar + legend */}
      {cats.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Category split · <span className="text-gray-700">avg share</span>
          </p>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100">
            {cats.map((c) => (
              <div
                key={c.code}
                className={cn(CATEGORY_COLORS[c.code] ?? 'bg-gray-400')}
                // eslint-disable-next-line no-restricted-syntax -- dynamic segment width from data
                style={{ width: `${shareTotal > 0 ? (c.avgSharePct / shareTotal) * 100 : 0}%` }}
                title={`${c.code}: ${c.avgSharePct.toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3">
            {cats.map((c) => (
              <div key={c.code} className="flex items-center gap-2 text-sm">
                <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', CATEGORY_COLORS[c.code] ?? 'bg-gray-400')} />
                <span className="font-semibold text-gray-900 w-11">{c.code}</span>
                <span className="font-bold text-gray-900 ml-auto">{c.avgSharePct.toFixed(1)}%</span>
                <span className="text-gray-400 font-mono w-20 text-right">{formatNumber(c.avgSpace)} sft</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subcategories — always visible, sized bars */}
      {pods.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Subcategories · <span className="text-gray-700">{pods.length} pods · by size</span>
          </p>
          <div className="space-y-2">
            {visiblePods.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-sm">
                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', CATEGORY_COLORS[p.categoryCode] ?? 'bg-gray-400')} />
                <span className="text-gray-700 truncate flex-1 min-w-0">{p.name}</span>
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                  <div
                    className={cn('h-full rounded-full', CATEGORY_COLORS[p.categoryCode] ?? 'bg-gray-400')}
                    // eslint-disable-next-line no-restricted-syntax -- dynamic width from data
                    style={{ width: `${maxPodSpace > 0 ? (p.avgSpace / maxPodSpace) * 100 : 0}%` }}
                  />
                </div>
                <span className="flex-shrink-0 w-20 text-right">
                  <span className="font-bold text-gray-900">{formatNumber(p.avgSpace)}</span>
                  <span className="text-xs text-gray-400 ml-0.5">sft</span>
                </span>
                <span className="flex-shrink-0 inline-flex px-2 py-0.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-600 justify-center min-w-16">
                  {formatNumber(p.avgOptions)} opts
                </span>
              </div>
            ))}
          </div>
          {pods.length > PODS_PREVIEW_COUNT && (
            <button
              onClick={() => setShowAllPods(!showAllPods)}
              className="mt-2 text-sm font-medium text-primary hover:underline"
              aria-expanded={showAllPods}
            >
              {showAllPods ? 'Show less ↑' : `Show all ${pods.length} pods ↓`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function FormatSummaryCards(): React.ReactNode {
  const { data, isLoading, isError } = useV3Formats();

  if (isError) return null; // auxiliary summary — the store table below still works

  if (isLoading) {
    return (
      // eslint-disable-next-line design-system/prefer-metric-grid -- card container grid (skeletons), not metric tiles
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const formats = data?.formats ?? [];
  if (formats.length === 0) return null;

  return (
    // eslint-disable-next-line design-system/prefer-metric-grid -- card container grid (format cards), not metric tiles
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {formats.map((f) => (
        <FormatCard key={f.key} fmt={f} />
      ))}
    </div>
  );
}
