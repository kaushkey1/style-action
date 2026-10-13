import { useState } from 'react';
import { CheckCircle, AlertTriangle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge, SectionHeader } from '@/components/ui';
import { cn } from '@/lib/utils';
import { getStoreAllocationProcess } from '@/modules/range/data/mockSpacePlanning';
import type { AllocationProcessStep } from '@/modules/range/data/mockSpacePlanning';

interface AllocationProcessFlowProps {
  storeId: string;
  storeName: string;
  storeGrade: string;
}

const statusConfig: Record<AllocationProcessStep['status'], { icon: typeof CheckCircle; color: string; label: string; badgeClass: string }> = {
  complete: { icon: CheckCircle, color: 'text-emerald-500', label: 'Complete', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', label: 'Warning', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  'in-progress': { icon: Loader2, color: 'text-blue-500', label: 'In Progress', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export function AllocationProcessFlow({ storeId, storeName, storeGrade }: AllocationProcessFlowProps) {
  const steps = getStoreAllocationProcess(storeId);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  if (steps.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">No allocation process data available.</p>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <SectionHeader
        title="8-Step Allocation Process"
        actions={<span className="text-xs text-gray-500">{storeName} ({storeGrade})</span>}
        className="mb-6"
      />

      <div className="relative">
        {steps.map((step, i) => {
          const config = statusConfig[step.status];
          const Icon = config.icon;
          const isExpanded = expandedStep === step.step;
          const isLast = i === steps.length - 1;

          return (
            <div key={step.step} className="relative flex gap-4">
              {/* Vertical line */}
              {!isLast && (
                // eslint-disable-next-line no-restricted-syntax -- dynamic height for timeline connector between steps
                <div className="absolute left-4 top-9 w-px bg-gray-200" style={{ height: 'calc(100% - 12px)' }} />
              )}

              {/* Step number circle */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 text-xs font-bold z-10',
                step.status === 'complete' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
                step.status === 'warning' ? 'border-amber-300 bg-amber-50 text-amber-700' :
                'border-blue-300 bg-blue-50 text-blue-700'
              )}>
                {step.step}
              </div>

              {/* Content */}
              <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                  className="w-full flex items-center gap-3 text-left group"
                  aria-expanded={isExpanded}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{step.name}</span>
                      <Badge variant="outline" className={cn('text-xs px-1.5 py-0 border', config.badgeClass)}>
                        <Icon className={cn('w-3 h-3 mr-1', config.color, step.status === 'in-progress' && 'animate-spin')} />
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{step.outputSummary}</p>
                  </div>
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-gray-600" />
                  }
                </button>

                {isExpanded && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md text-xs text-gray-600 leading-relaxed border border-gray-100">
                    {step.detail}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
        Click any step to expand computation details.
      </p>
    </div>
  );
}
