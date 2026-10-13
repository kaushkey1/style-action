import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { GuardrailStatus } from '../types/aopPlanning.types';

interface GuardrailChipProps {
  status: GuardrailStatus;
  growthPct: number;
  compact?: boolean;
}

const STATUS_STYLES: Record<GuardrailStatus, string> = {
  within: 'text-green-600 bg-green-50',
  above: 'text-amber-600 bg-amber-50',
  below: 'text-amber-600 bg-amber-50',
};

function formatGrowth(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function GuardrailChip({ status, growthPct, compact = false }: GuardrailChipProps): React.ReactNode {
  const formattedGrowth = formatGrowth(growthPct);

  if (compact) {
    return (
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium inline-flex items-center gap-1',
          STATUS_STYLES[status],
        )}
      >
        {status === 'above' && <ArrowUp className="w-3 h-3" />}
        {status === 'below' && <ArrowDown className="w-3 h-3" />}
        {formattedGrowth}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium inline-flex items-center gap-1',
        STATUS_STYLES[status],
      )}
    >
      {status === 'above' && <ArrowUp className="w-3 h-3" />}
      {status === 'below' && <ArrowDown className="w-3 h-3" />}
      {status === 'within' && 'within band'}
      {status === 'above' && 'above band'}
      {status === 'below' && 'below band'}
      <span>({formattedGrowth})</span>
    </span>
  );
}
