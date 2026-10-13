/* eslint-disable design-system/prefer-section-header -- validation cards use custom inline layouts */
import { ShieldCheck, XCircle, MinusCircle, Clock, Loader, AlertTriangle, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import type { ValidationCheck, ValidationSummary } from '../data/types/raValidation';

const STATE_CONFIG = {
  passed: { icon: ShieldCheck, iconClass: 'text-emerald-500', bg: 'bg-white', border: 'border-gray-200', label: 'Passed', badgeVariant: 'success' as const },
  failed: { icon: XCircle, iconClass: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'Failed', badgeVariant: 'destructive' as const },
  not_applicable: { icon: MinusCircle, iconClass: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-100', label: 'Not applicable', badgeVariant: 'secondary' as const },
  not_run: { icon: Clock, iconClass: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-100', label: 'Not checked', badgeVariant: 'secondary' as const },
  running: { icon: Loader, iconClass: 'text-blue-500 animate-spin', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Checking', badgeVariant: 'info' as const },
  error: { icon: AlertTriangle, iconClass: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Error', badgeVariant: 'warning' as const },
} as const;

function getCheckState(check: ValidationCheck): keyof typeof STATE_CONFIG {
  if (check.applicability === 'not_applicable') return 'not_applicable';
  switch (check.evaluationState) {
    case 'not_run': return 'not_run';
    case 'running': return 'running';
    case 'error': return 'error';
    case 'evaluated': return check.outcome === 'pass' ? 'passed' : 'failed';
  }
}

export function ValidationCheckCard({ check }: { check: ValidationCheck }): React.ReactNode {
  const [expanded, setExpanded] = useState(false);
  const state = getCheckState(check);
  const config = STATE_CONFIG[state];
  const Icon = config.icon;
  const hasEvidence = check.evidence.length > 0;

  return (
    <div className={cn('rounded-lg p-3 border', config.bg, config.border)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', config.iconClass)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold text-gray-900">{check.title}</p>
            {check.scope === 'range' && (
              <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1 py-0.5">Range-level</span>
            )}
          </div>
          <p className="text-[10px] text-gray-600 mt-0.5">{check.businessReason}</p>
          {hasEvidence && (
            <button
              type="button"
              onClick={() => setExpanded(prev => !prev)}
              className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronDown className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')} />
              {expanded ? 'Hide details' : 'Show evidence'}
            </button>
          )}
          {expanded && hasEvidence && (
            <div className="mt-2 space-y-1 pl-0.5">
              {check.evidence.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">{e.label}</span>
                  <span className="font-medium text-gray-700">
                    {e.value}{e.unit ? ` ${e.unit}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {check.submissionImpact === 'blocking' && state === 'failed' && (
            <Badge variant="destructive" size="sm">Blocking</Badge>
          )}
          {check.submissionImpact === 'advisory' && state === 'failed' && (
            <Badge variant="warning" size="sm">Advisory</Badge>
          )}
          <Badge variant={config.badgeVariant} size="sm">{config.label}</Badge>
        </div>
      </div>
    </div>
  );
}

export function ValidationSummaryBar({ summary }: { summary: ValidationSummary }): React.ReactNode {
  const parts: string[] = [];
  if (summary.passed > 0) parts.push(`${summary.passed} passed`);
  if (summary.failed > 0) parts.push(`${summary.failed} failed`);
  if (summary.notApplicable > 0) parts.push(`${summary.notApplicable} not applicable`);
  if (summary.notChecked > 0) parts.push(`${summary.notChecked} not checked`);
  if (summary.checking > 0) parts.push(`${summary.checking} checking`);
  if (summary.errors > 0) parts.push(`${summary.errors} error`);

  const applicableTotal = summary.passed + summary.failed;

  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100 mb-3">
      <p className="text-xs text-gray-600">
        {parts.join(' · ')}
      </p>
      {summary.passRate != null && applicableTotal > 0 && (
        <p className="text-xs font-medium text-gray-700">
          {summary.passed} of {applicableTotal} applicable checks passed
        </p>
      )}
    </div>
  );
}
