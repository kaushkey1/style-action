import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CascadeRiskPanelProps {
  cascadeChain: string[];
  /** Index of the current (blocked) step. Defaults to 0. */
  currentStepIndex?: number;
  className?: string;
}

export function CascadeRiskPanel({
  cascadeChain,
  currentStepIndex = 0,
  className,
}: CascadeRiskPanelProps) {
  const affected = cascadeChain.length - currentStepIndex;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Flow diagram */}
      <div className="flex items-center gap-1 flex-wrap">
        {cascadeChain.map((step, i) => {
          let pillColor = 'bg-gray-100 text-gray-500 border-gray-200';
          if (i < currentStepIndex) {
            pillColor = 'bg-success-50 text-success-700 border-success/30';
          } else if (i === currentStepIndex) {
            pillColor = 'bg-warning-50 text-warning-700 border-warning/30';
          }

          return (
            <div key={i} className="flex items-center gap-1">
              <span
                className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap',
                  pillColor,
                )}
              >
                {step}
              </span>
              {i < cascadeChain.length - 1 && (
                <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-gray-500">
          {affected} of {cascadeChain.length} steps affected
        </span>
      </div>
    </div>
  );
}
