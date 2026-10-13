import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

import type { EngineOutcome } from '../../types/engine.types';

/** Colour mapping for each engine outcome to a Badge variant + optional overrides. */
const OUTCOME_STYLES: Record<EngineOutcome, { variant: 'success' | 'warning' | 'error' | 'primary' | 'default' | 'purple' | 'info'; className?: string }> = {
  'LEAVE ALONE': { variant: 'success' },
  'SUPPLY HOLD': { variant: 'warning' },
  MOVE: { variant: 'primary' },
  HOLD: { variant: 'default' },
  DISCOUNT: { variant: 'error' },
  'HOLD TO EXIT': { variant: 'warning' },
  LIQUIDATION: { variant: 'error', className: 'bg-red-200 text-red-900' },
  'TEST CLEARANCE': { variant: 'purple' },
  WAIT: { variant: 'default', className: 'bg-gray-50 text-gray-500' },
};

interface OutcomeBadgeProps {
  readonly outcome: EngineOutcome;
  readonly className?: string;
}

/** Semantic badge for the 9 engine outcome types. */
export function OutcomeBadge({ outcome, className }: OutcomeBadgeProps): React.ReactNode {
  const style = OUTCOME_STYLES[outcome];
  return (
    <Badge
      variant={style.variant}
      size="sm"
      className={cn(style.className, className)}
    >
      {outcome}
    </Badge>
  );
}
