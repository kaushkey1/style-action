import React from 'react';
import { cn } from '@/lib/utils';

import type { Measure } from '../types/aopPlanning.types';
import { MEASURE_LABELS } from '../types/aopPlanning.types';

interface MeasureToggleProps {
  value: Measure;
  onChange: (measure: Measure) => void;
}

const MEASURES: Measure[] = ['net_sales', 'gross_margin', 'gm_pct'];

export function MeasureToggle({ value, onChange }: MeasureToggleProps): React.ReactNode {
  return (
    <div
      className="border border-gray-200 rounded-lg inline-flex"
      role="radiogroup"
      aria-label="Select measure"
    >
      {MEASURES.map((measure) => {
        const isActive = measure === value;
        return (
          <button
            key={measure}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(measure)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium transition-colors min-w-[80px] min-h-[36px]',
              'first:rounded-l-lg last:rounded-r-lg',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isActive
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-50',
            )}
          >
            {MEASURE_LABELS[measure]}
          </button>
        );
      })}
    </div>
  );
}
