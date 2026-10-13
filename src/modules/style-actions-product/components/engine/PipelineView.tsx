import { useState } from 'react';

import { CheckCircle, Circle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { PipelineStep, PipelineStepStatus } from '../../types/engine.types';

/** Icon and colour for each pipeline step status. */
function StepStatusIcon({ status }: { readonly status: PipelineStepStatus }): React.ReactNode {
  switch (status) {
    case 'ran':
      return <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />;
    case 'skipped':
      return <Circle className="w-4 h-4 text-gray-400 shrink-0" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-600 shrink-0" />;
  }
}

interface PipelineStepRowProps {
  readonly step: PipelineStep;
  readonly isSubStep?: boolean;
}

function PipelineStepRow({ step, isSubStep = false }: PipelineStepRowProps): React.ReactNode {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubSteps = step.subSteps && step.subSteps.length > 0;

  return (
    <div>
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-2 py-2 text-left transition-colors',
          isSubStep ? 'pl-8' : 'pl-0',
          hasSubSteps ? 'hover:bg-gray-50 rounded-md px-2' : '',
        )}
        onClick={hasSubSteps ? () => setIsExpanded((prev) => !prev) : undefined}
        aria-expanded={hasSubSteps ? isExpanded : undefined}
        aria-label={hasSubSteps ? `${step.name}: ${step.stat}. ${isExpanded ? 'Collapse' : 'Expand'} sub-steps` : `${step.name}: ${step.stat}`}
        tabIndex={hasSubSteps ? 0 : -1}
        disabled={!hasSubSteps}
      >
        <StepStatusIcon status={step.status} />
        <span className="text-xs font-medium text-gray-700 shrink-0">
          {isSubStep ? step.index : `${step.index}.`}
        </span>
        <span className="text-xs text-gray-700 min-w-0 flex-1 truncate">{step.name}</span>
        <span className="text-xs text-gray-500 shrink-0 hidden sm:inline">{step.stat}</span>
        {hasSubSteps ? (
          isExpanded ? (
            <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
          )
        ) : null}
      </button>
      {hasSubSteps && isExpanded && step.subSteps ? (
        <div className="border-l-2 border-gray-100 ml-2 mt-1">
          {step.subSteps.map((sub) => (
            <PipelineStepRow key={sub.index} step={sub} isSubStep />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface PipelineViewProps {
  readonly steps: readonly PipelineStep[];
}

/** Vertical list of engine pipeline steps with status icons and expandable sub-steps. */
export function PipelineView({ steps }: PipelineViewProps): React.ReactNode {
  return (
    <div className="space-y-0.5 py-2">
      {steps.map((step) => (
        <PipelineStepRow key={step.index} step={step} />
      ))}
    </div>
  );
}
