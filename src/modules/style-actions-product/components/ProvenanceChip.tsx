import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import { cn } from '@/lib/utils';

import { PROVENANCE_META } from './display';

import type { Provenance } from '../api/types';

// Ported from the Style Actions prototype (style-actions-platform/components/ProvenanceChip.tsx).
const PROVENANCE_CLASSES: Readonly<Record<Provenance, string>> = {
  observed: 'border-gray-300 text-gray-700',
  derived: 'border-gray-300 text-gray-600 border-dashed',
  provisional: 'border-amber-200 bg-amber-50 text-amber-800',
  unavailable: 'border-gray-200 bg-gray-50 text-gray-500',
};

interface ProvenanceChipProps {
  readonly provenance: Provenance;
  readonly note?: string;
  readonly className?: string;
}

/** Small label stating where a value comes from; hover or tap explains it. */
export function ProvenanceChip({ provenance, note, className }: ProvenanceChipProps): React.ReactNode {
  const meta = PROVENANCE_META[provenance];
  const text = note ? `${meta.description}. ${note}` : meta.description;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-1.5 py-px text-xs font-medium leading-4 whitespace-nowrap',
            PROVENANCE_CLASSES[provenance],
            className,
          )}
        >
          {meta.label}
          <span className="sr-only">: {text}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}
