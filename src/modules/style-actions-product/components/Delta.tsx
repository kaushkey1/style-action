import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import { cn } from '@/lib/utils';

import { deltaDisplay } from './scope';

import type { Comparison } from '../api/types';

interface DeltaProps {
  readonly value: number | null | undefined;
  readonly comparison: Comparison | null;
  readonly testid?: string;
  /** Extra tooltip line, e.g. that finding counts may cross content versions (S2-C22). */
  readonly note?: string;
  readonly className?: string;
}

/**
 * A headline figure's change vs the previous snapshot of the same DCs (S2-R4): "+N", "−N" or "0", or an
 * em dash whose tooltip says why nothing is compared. Neutral ink: a change in stock is not good or bad by itself.
 */
export function Delta({ value, comparison, testid, note, className }: DeltaProps): React.ReactNode {
  const delta = deltaDisplay(value, comparison, note);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* A button, so keyboard users reach the reason too (S2-C67 L4). */}
        <Button
          variant="ghost"
          size="sm"
          className={cn('inline-flex h-auto min-h-0 rounded px-0.5 py-0 text-xs font-normal tabular-nums text-gray-500 hover:bg-transparent', className)}
        >
          <span data-testid={testid}>{delta.text}</span>
          <span className="sr-only">{`: ${delta.reason}`}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{delta.reason}</TooltipContent>
    </Tooltip>
  );
}
