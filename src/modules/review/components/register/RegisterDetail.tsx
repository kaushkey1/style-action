import { useState } from 'react';
import { ChevronRight, ChevronDown, Sparkles, BookOpen, Calculator, FileText } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ActionGroup } from './ActionGroup';
import { LinkedEntities } from './LinkedEntities';
import { DrillInto } from './DrillInto';
import { RegisterFeedback } from './RegisterFeedback';
import { inr } from './registerTokens';
import { SEVERITY_BADGE } from '../../lib/severityBadge';
import type { RegisterException, RegisterInsight } from '../../hooks/useRegisterRows';
import type { EndState } from './registerTokens';

function renderBold(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
      : part,
  );
}

const toneLabel = (t: 'critical' | 'warning' | 'on-track' | 'monitoring'): string => {
  if (t === 'on-track') return 'On track';
  if (t === 'monitoring') return 'Monitoring';
  if (t === 'warning') return 'Watch';
  return 'Critical';
};

export function RegisterDetail({ kind, id, variant = 'panel', data, endState, onEndStateChange, active = true, hideStakeSummary = false }: {
  kind: 'insight' | 'exception';
  id: string;
  variant?: 'panel' | 'inline';
  data: RegisterException | RegisterInsight | undefined;
  endState?: EndState;
  onEndStateChange?: (state: EndState) => void;
  /** When false, defers the per-item feedback fetch (row mounted but collapsed). */
  active?: boolean;
  /** Hide the "Value at stake" summary line in the solution card (used when the
      stake is already shown in a header chip, e.g. the mobile detail). */
  hideStakeSummary?: boolean;
}): React.ReactNode {
  const [calcOpen, setCalcOpen] = useState(false);
  const isMobile = useIsMobile();

  if (kind === 'exception') {
    const exc = data as RegisterException | undefined;
    if (!exc) return null;

    const steps: string[] = [];
    if (exc.remediation && exc.remediation.trim() && exc.remediation !== 'NA') {
      const sentences = exc.remediation.split(/\.\s+/).filter(s => s.trim());
      steps.push(...(sentences.length > 0 ? sentences.map(s => s.trim()) : [exc.remediation.trim()]));
    }
    if (steps.length === 0) steps.push('NA');

    return (
      <div className="space-y-3">
        {variant === 'panel' && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <Badge variant={SEVERITY_BADGE[exc.severity].variant} dot size="sm">
                  {SEVERITY_BADGE[exc.severity].label}
                </Badge>
                <span className="tabular-nums text-xs text-gray-400">{exc.code}</span>
              </div>
              <h3 className="text-balance text-lg font-semibold leading-snug text-gray-900">{exc.title}</h3>
              <p className="mt-1.5 text-sm">
                <span className="tabular-nums font-semibold text-gray-900">{inr(exc.valueInr)}</span>
                <span className="text-gray-500"> at stake</span>
              </p>
            </div>
            {endState && onEndStateChange && (
              <div className="shrink-0">
                <ActionGroup exception={exc} endState={endState} onEndStateChange={onEndStateChange} />
              </div>
            )}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="bg-gradient-to-br from-primary-50/80 via-white to-purple-50/50 p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary-500" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-600">AI Analysis</span>
              <span className="text-[11px] text-gray-400">· {exc.agent}</span>
            </div>
            <p className="text-pretty text-sm leading-relaxed text-gray-700">{exc.aiSummary}</p>
            {exc.impactDescription && exc.impactDescription !== exc.aiSummary && (
              <p className="text-pretty mt-2 text-sm leading-relaxed text-gray-600">{exc.impactDescription}</p>
            )}
          </div>

          <div className="border-t border-gray-200 bg-white p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Suggested solution</p>
            {steps.length > 0 && steps[0] !== 'NA' ? (
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className={cn('flex gap-2.5 text-sm text-gray-700', isMobile ? 'items-center' : 'items-start')}>
                    <span className={cn('tabular-nums flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600', !isMobile && 'mt-0.5')}>{i + 1}</span>
                    <span className="text-pretty">{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-600">No specific action recommended</p>
            )}
            {!hideStakeSummary && (
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-2.5">
                <span className="tabular-nums inline-flex items-center gap-1 text-xs text-gray-700">
                  Value at stake <span className="font-semibold text-gray-900">{inr(exc.valueInr)}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {exc.scope && exc.scope.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-500">Affected entities</p>
            <div className="flex flex-wrap gap-1.5">
              {exc.scope.map((s, i) => (
                <span key={i} className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <DrillInto category={exc.category} />

        <LinkedEntities emptyHint="No linked insight or task" />

        <RegisterFeedback kind="exception" id={id} active={active} />
      </div>
    );
  }

  const ins = data as RegisterInsight | undefined;
  if (!ins) return null;

  return (
    <div className="space-y-3">
      {variant === 'panel' && (
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            {ins.tone && (
              <Badge
                variant={ins.tone === 'critical' ? 'error' : ins.tone === 'warning' ? 'warning' : ins.tone === 'monitoring' ? 'info' : 'success'}
                dot
                size="sm"
              >
                {toneLabel(ins.tone)}
              </Badge>
            )}
            <span className="tabular-nums text-xs text-gray-400">{ins.code}</span>
          </div>
          <h3 className="text-balance text-lg font-semibold leading-snug text-gray-900">{ins.title}</h3>
          {ins.valueAtStakeInr != null && (
            <p className="mt-1.5 text-sm">
              <span className="tabular-nums font-semibold text-gray-900">{inr(ins.valueAtStakeInr)}</span>
              <span className="text-gray-500"> at stake</span>
            </p>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="bg-gradient-to-br from-primary-50/80 via-white to-purple-50/50 p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary-500" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-600">AI Analysis</span>
            <span className="text-[11px] text-gray-400">· {ins.agent}</span>
          </div>
          <p className="text-pretty text-sm leading-relaxed text-gray-700">{renderBold(ins.summary)}</p>
          {ins.metricName && (
            /* eslint-disable-next-line design-system/prefer-section-header -- metric label with value, not a section header */
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-200 pt-3">
              <span className="text-xs font-medium text-gray-700">{ins.metricName}</span>
              <span className="tabular-nums text-sm">
                <span className="font-semibold text-gray-900">{ins.metricValue ?? '-'}</span>
                {ins.thresholdValue != null && (
                  <span className="text-gray-400"> (target {ins.thresholdValue})</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      <DrillInto category={ins.category} />

      {ins.calc && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setCalcOpen((v) => !v)}
            className="flex w-full items-center gap-1.5 px-3 py-2 min-h-11 lg:min-h-0 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-inset focus-kb:ring-primary/40"
            aria-expanded={calcOpen}
          >
            {calcOpen
              ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
            How we derived this
          </button>
          {calcOpen && (
            <div className="space-y-3 border-t border-gray-100 p-3">
              {ins.calc.what && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-gray-500" /><span className="text-sm font-semibold text-gray-900">What it means</span></div>
                  <p className="text-pretty text-sm text-gray-600">{ins.calc.what}</p>
                </div>
              )}
              {ins.calc.plain && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5"><Calculator className="h-3.5 w-3.5 text-gray-500" /><span className="text-sm font-semibold text-gray-900">How we calculate it</span></div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><p className="font-mono text-sm text-gray-700">{ins.calc.plain}</p></div>
                </div>
              )}
              {ins.calc.example && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-amber-500" /><span className="text-sm font-semibold text-gray-900">Worked example</span></div>
                  <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2"><p className="text-pretty text-sm text-amber-900">{ins.calc.example}</p></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <LinkedEntities emptyHint="No exception raised from this insight yet" />

      <RegisterFeedback kind="insight" id={id} active={active} />
    </div>
  );
}
