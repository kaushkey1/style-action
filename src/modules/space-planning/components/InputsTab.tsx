import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SectionHeader } from '@/components/ui';
import { cn, formatNumber } from '@/lib/utils';
import { useSpacePlanStore } from '../stores/useSpacePlanStore';
import type { EnvelopeStep } from '../data/mockSpacePlanningData';

function AssumptionRow({ label, value, muted }: { label: string; value: string; muted?: boolean }): React.ReactNode {
  return (
    /* eslint-disable-next-line design-system/prefer-section-header -- data label-value pair in assumptions card */
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={cn('text-sm font-mono', muted ? 'text-gray-400' : 'text-gray-900')}>{value}</span>
    </div>
  );
}

function DerivationRow({ step, isLast }: { step: EnvelopeStep; isLast: boolean }): React.ReactNode {
  const [expanded, setExpanded] = useState(false);
  const children = step.children ?? [];
  const hasChildren = children.length > 0;
  const prefix = step.isSubtraction ? '− ' : step.isResult ? '= ' : '';

  return (
    <div className={cn('py-1.5 border-b border-gray-50 last:border-b-0', isLast && 'border-t border-gray-200')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-1 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-0.5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-expanded={expanded}
              aria-label={`Toggle ${step.label} breakdown`}
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-3.5 flex-shrink-0" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className={cn(
              'text-sm',
              step.isSubtraction ? 'text-gray-500' : 'text-gray-900',
              step.isResult && 'font-semibold',
              isLast && 'font-bold text-green-700',
            )}>
              {prefix}{step.label}
            </p>
            {step.rule && <p className="text-xs text-gray-400">{step.rule}</p>}
          </div>
        </div>
        <span className={cn(
          'text-sm font-mono flex-shrink-0',
          step.isSubtraction ? 'text-red-700' : 'text-gray-900',
          step.isResult && 'font-semibold',
          isLast && 'font-bold text-green-700',
        )}>
          {step.isSubtraction ? `−${formatNumber(step.value)}` : formatNumber(step.value)}
        </span>
      </div>

      {expanded && hasChildren && (
        <div className="mt-1 pl-8 space-y-0.5">
          {children.map((child) => (
            // eslint-disable-next-line design-system/prefer-section-header -- deduction sub-row (label + value), not a section header
            <div key={child.label} className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                · {child.label}
                {child.rule && <span className="text-gray-400 ml-1.5">{child.rule}</span>}
              </p>
              <span className="text-xs font-mono text-red-700">−{formatNumber(child.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EfficiencyBandsRow({ bands }: { bands: Record<string, { low: number; high: number }> }): React.ReactNode {
  const entries = Object.entries(bands);

  if (entries.length === 0) {
    return <AssumptionRow label="Efficiency bands" value="per category" muted />;
  }

  const lows = entries.map(([, b]) => b.low);
  const highs = entries.map(([, b]) => b.high);
  const rangeLabel = `${Math.min(...lows).toFixed(2)} – ${Math.max(...highs).toFixed(2)}`;

  return (
    <div className="py-1.5 border-b border-gray-50">
      <AssumptionRow label="Efficiency bands" value={rangeLabel} />
      <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-0.5 pl-0.5">
        {entries.map(([code, b]) => (
          <span key={code} className="text-xs text-gray-400">
            {code}: {b.low.toFixed(2)}–{b.high.toFixed(2)}
          </span>
        ))}
      </div>
    </div>
  );
}

function WspsfRow({ weights }: { weights: [number, number, number] }): React.ReactNode {
  return (
    <div className="py-1.5 border-b border-gray-50">
      <AssumptionRow label="wSPSF weights" value={weights.join(' / ')} />
      <div className="flex items-center gap-3 mt-0.5 pl-0.5">
        <span className="text-xs text-gray-400">LY same season: {weights[0]}</span>
        <span className="text-xs text-gray-400">Recent 3M: {weights[1]}</span>
        <span className="text-xs text-gray-400">Past 3Y avg: {weights[2]}</span>
      </div>
    </div>
  );
}

export function InputsTab(): React.ReactNode {
  const assumptions = useSpacePlanStore((s) => s.assumptions);
  const carpetArea = useSpacePlanStore((s) => s.carpetArea);
  const envelope = useSpacePlanStore((s) => s.envelope);

  if (!assumptions) return null;

  const maxValue = carpetArea;

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Model parameters — two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="Space Derivation" subtitle="Carpet to PL Pool — this store's actual values" />
          <div className="mt-3">
            {envelope.map((step, i) => (
              <DerivationRow key={step.label} step={step} isLast={i === envelope.length - 1} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader title="Planning Parameters" subtitle="Weights and assumptions" />
          <div className="mt-3">
            <EfficiencyBandsRow bands={assumptions.efficiencyBands} />
            <WspsfRow weights={assumptions.wSpsfWeights} />
            <div className="py-1.5 border-b border-gray-50">
              <AssumptionRow label="Blend weights" value={assumptions.blend.join(' / ')} />
              <div className="flex items-center gap-3 mt-0.5 pl-0.5">
                <span className="text-xs text-gray-400">Past performance: {assumptions.blend[0]}</span>
                <span className="text-xs text-gray-400">AOP target: {assumptions.blend[1]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Space Envelope — Visual Waterfall */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Space Envelope" subtitle="Carpet area to PL Pool derivation" />
        <div className="mt-4 space-y-1.5">
          {envelope.map((step, i) => {
            const absValue = Math.abs(step.value);
            const barWidth = maxValue > 0 ? (absValue / maxValue) * 100 : 0;
            const isLast = i === envelope.length - 1;

            return (
              <div key={i} className={cn('flex items-center gap-3', isLast && 'mt-2 pt-2 border-t border-gray-200')}>
                <div className={cn('w-[260px] flex-shrink-0 text-sm', step.isSubtraction ? 'text-gray-500 pl-4' : 'text-gray-900', isLast && 'font-bold text-green-700')}>
                  {step.isSubtraction ? '−' : step.isResult ? '=' : ''} {step.label}
                </div>
                <div className="flex-1 h-7 bg-gray-50 rounded overflow-hidden relative">
                  <div
                    className={cn(
                      'h-full rounded flex items-center justify-end pr-2 text-xs font-mono font-medium text-white transition-all',
                      step.isSubtraction ? 'bg-red-400/70' : isLast ? 'bg-green-500' : step.isResult ? 'bg-gray-400' : 'bg-primary/70',
                    )}
                    // eslint-disable-next-line no-restricted-syntax -- dynamic width from data
                    style={{ width: `${Math.max(barWidth, 3)}%` }}
                  >
                    {barWidth > 10 && (step.value < 0 ? `−${formatNumber(absValue)}` : formatNumber(absValue))}
                  </div>
                </div>
                <div className={cn('w-20 text-right text-sm font-mono flex-shrink-0', step.isSubtraction ? 'text-red-700 font-medium' : isLast ? 'text-green-700 font-bold' : 'text-gray-900')}>
                  {step.value < 0 ? `−${formatNumber(absValue)}` : formatNumber(absValue)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
