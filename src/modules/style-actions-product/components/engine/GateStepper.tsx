import { useState } from 'react';

import { CheckCircle, Star, Circle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { GateResult, GateStatus } from '../../types/engine.types';

/** Icon for each gate status. */
function GateStatusIcon({ status }: { readonly status: GateStatus }): React.ReactNode {
  switch (status) {
    case 'passed':
      return <CheckCircle className="w-4 h-4 text-green-600 shrink-0" aria-label="Passed" />;
    case 'decided':
      return <Star className="w-4 h-4 text-primary shrink-0" aria-label="Decided here" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-600 shrink-0" aria-label="Failed" />;
    case 'not_reached':
      return <Circle className="w-4 h-4 text-gray-400 shrink-0" aria-label="Not reached" />;
  }
}

interface GateRowProps {
  readonly gate: GateResult;
  readonly isDeciding: boolean;
  readonly isAfterDeciding: boolean;
}

function GateRow({ gate, isDeciding, isAfterDeciding }: GateRowProps): React.ReactNode {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasFullInputs = gate.fullInputs.length > 0;

  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        isDeciding ? 'border-primary/40 bg-primary/5' : 'border-gray-200',
        isAfterDeciding ? 'opacity-50' : '',
      )}
    >
      <button
        type="button"
        className={cn(
          'flex w-full items-start gap-3 p-3 text-left transition-colors rounded-lg',
          hasFullInputs && !isAfterDeciding ? 'hover:bg-gray-50' : '',
        )}
        onClick={hasFullInputs && !isAfterDeciding ? () => setIsExpanded((prev) => !prev) : undefined}
        aria-expanded={hasFullInputs ? isExpanded : undefined}
        aria-label={`Gate ${gate.gate}: ${gate.name}. ${gate.testResult}`}
        disabled={!hasFullInputs || isAfterDeciding}
      >
        {/* Status icon */}
        <div className="pt-0.5">
          <GateStatusIcon status={gate.status} />
        </div>

        {/* Gate content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-900">
              Gate {gate.gate} &mdash; {gate.name}
            </span>
          </div>

          {/* Key inputs (collapsed view) */}
          {gate.keyInputs.length > 0 ? (
            <div className="space-y-0.5">
              {gate.keyInputs.map((input) => (
                <div key={input.label} className="text-xs text-gray-500">
                  <span className="text-gray-500">{input.label}:</span>{' '}
                  <span className="text-gray-700">{input.value}</span>
                </div>
              ))}
            </div>
          ) : null}

          {/* Test result */}
          <div className={cn(
            'text-xs mt-1',
            gate.status === 'decided' ? 'font-medium text-primary' : 'text-gray-500',
            gate.status === 'not_reached' ? 'text-gray-400 italic' : '',
          )}>
            {gate.testResult}
          </div>
        </div>

        {/* Expand chevron */}
        {hasFullInputs && !isAfterDeciding ? (
          <div className="pt-0.5 shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-400" />
            )}
          </div>
        ) : null}
      </button>

      {/* Expanded full inputs */}
      {isExpanded && hasFullInputs ? (
        <div className="border-t border-gray-100 mx-3 pb-3 pt-2">
          <table className="w-full text-xs">
            <tbody>
              {gate.fullInputs.map((input) => (
                <tr key={input.label}>
                  <td className="py-0.5 pr-3 text-gray-500 whitespace-nowrap align-top">{input.label}</td>
                  <td className="py-0.5 text-gray-700">{input.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

interface GateStepperProps {
  readonly gates: readonly GateResult[];
  readonly decidingGate: number;
}

/** Vertical 5-gate stepper showing the decision path for an option x store outcome. */
export function GateStepper({ gates, decidingGate }: GateStepperProps): React.ReactNode {
  return (
    <div className="space-y-2" role="list" aria-label="Gate decision path">
      {gates.map((gate) => (
        <div key={gate.gate} role="listitem">
          <GateRow
            gate={gate}
            isDeciding={gate.gate === decidingGate}
            isAfterDeciding={gate.gate > decidingGate}
          />
        </div>
      ))}
    </div>
  );
}
