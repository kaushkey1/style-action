import { Check, ChevronRight } from 'lucide-react';
import type { CurationStage } from '../types/showroom-types';
import { cn } from '@/lib/utils';

interface CurationStageStepperProps {
  podId?: string;
  activeStage: 'designer_shortlist' | 'buyer_shortlist' | 'final_approved';
  onStageClick: (stage: CurationStage) => void;
  className?: string;
}

const STAGES: {
  key: 'designer_shortlist' | 'buyer_shortlist' | 'final_approved';
  label: string;
}[] = [
  { key: 'designer_shortlist', label: 'Designer' },
  { key: 'buyer_shortlist', label: 'Buyer' },
  { key: 'final_approved', label: 'Category Head' },
];

const STAGE_ORDER: Record<string, number> = {
  designer_shortlist: 0,
  buyer_shortlist: 1,
  final_approved: 2,
};

export function CurationStageStepper({
  activeStage,
  onStageClick,
  className,
}: CurationStageStepperProps) {
  const activeIndex = STAGE_ORDER[activeStage] ?? 0;

  return (
    <div className={cn('flex items-center gap-1 bg-gray-50 rounded-lg p-3', className)}>
      {STAGES.map((stage, idx) => {
        const isActive = stage.key === activeStage;
        const isCompleted = idx < activeIndex;
        const isPending = idx > activeIndex;

        return (
          <div key={stage.key} className="flex items-center gap-1">
            {idx > 0 && (
              <ChevronRight
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isCompleted ? 'text-green-500' : 'text-gray-400'
                )}
              />
            )}
            <button
              type="button"
              onClick={() => onStageClick(stage.key)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2',
                isActive && 'bg-primary text-white',
                isCompleted && 'bg-green-50 text-green-700 border border-green-200',
                isPending && 'bg-gray-100 text-gray-500'
              )}
            >
              {isCompleted && (
                <Check className="w-3 h-3 text-green-600" />
              )}
              <span>{stage.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
