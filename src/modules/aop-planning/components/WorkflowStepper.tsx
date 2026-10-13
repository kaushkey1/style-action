import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { CyclePhase, CycleStatus } from '../types/aopPlanning.types';
import { CYCLE_PHASES, PHASE_LABELS } from '../types/aopPlanning.types';

interface WorkflowStepperProps {
  currentPhase: CyclePhase;
  status: CycleStatus;
}

function getPhaseState(
  phaseIndex: number,
  currentIndex: number,
): 'completed' | 'current' | 'future' {
  if (phaseIndex < currentIndex) return 'completed';
  if (phaseIndex === currentIndex) return 'current';
  return 'future';
}

export function WorkflowStepper({ currentPhase }: WorkflowStepperProps): React.ReactNode {
  const currentIndex = CYCLE_PHASES.indexOf(currentPhase);

  return (
    <div className="flex items-center w-full overflow-x-auto" role="list" aria-label="Workflow progress">
      {CYCLE_PHASES.map((phase, index) => {
        const state = getPhaseState(index, currentIndex);
        const stepNumber = index + 1;
        const isLast = index === CYCLE_PHASES.length - 1;

        return (
          <React.Fragment key={phase}>
            <div
              className="flex flex-col items-center gap-1 shrink-0"
              role="listitem"
              aria-current={state === 'current' ? 'step' : undefined}
            >
              {/* Circle */}
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium',
                  state === 'completed' && 'bg-green-500 text-white',
                  state === 'current' && 'bg-primary text-white',
                  state === 'future' && 'bg-gray-200 text-gray-500',
                )}
              >
                {state === 'completed' ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  stepNumber
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-xs whitespace-nowrap',
                  state === 'completed' && 'text-green-700 font-medium',
                  state === 'current' && 'text-gray-900 font-semibold',
                  state === 'future' && 'text-gray-500',
                )}
              >
                {PHASE_LABELS[phase]}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'h-px flex-1 min-w-[24px] mx-1 mt-[-16px]',
                  index < currentIndex ? 'bg-green-500' : 'bg-gray-200',
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
