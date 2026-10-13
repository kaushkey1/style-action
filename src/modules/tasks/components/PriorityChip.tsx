import React from 'react';
import { AlertCircle, AlertTriangle, Circle } from 'lucide-react';
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import type { TaskPriority } from '../types/task.types';

// Canonical priority scale — kept in lockstep with the exception severity badge
// (`SEVERITY_BADGE`: S1→Critical/error, S2→High/warning, S3→Medium/info, S4→Low/default)
// and the create-task PriorityPicker, so a level reads the same colour on every surface.
const PRIORITY_VARIANT_MAP: Record<TaskPriority, 'error' | 'warning' | 'info' | 'default'> = {
  Critical: 'error',
  High:     'warning',
  Medium:   'info',
  Low:      'default',
};

const PRIORITY_ICON: Record<TaskPriority, React.JSX.Element> = {
  Critical: <AlertCircle    className="w-3 h-3" />,
  High:     <AlertTriangle  className="w-3 h-3" />,
  Medium:   <Circle         className="w-3 h-3" />,
  Low:      <Circle         className="w-3 h-3" />,
};

const PRIORITY_DEFINITION: Record<TaskPriority, string> = {
  Critical: 'Page within 1h. Revenue / margin breach >₹5L impact.',
  High:     'Same-day attention. Vendor SLA miss, NOOS stockout.',
  Medium:   'Within 48h. Default priority.',
  Low:      'Within 1 week. Background work.',
};

export interface PriorityChipProps {
  priority: TaskPriority;
}

/** Non-interactive priority indicator. Tooltip on hover shows the definition. */
export function PriorityChip({ priority }: PriorityChipProps): React.JSX.Element {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* inline-flex so the trigger wraps the badge tightly (no line-height leading)
            and centers cleanly in a flex row — keeps it optically aligned with siblings. */}
        <span className="inline-flex">
          <Badge variant={PRIORITY_VARIANT_MAP[priority]}>
            {PRIORITY_ICON[priority]}
            {priority}
          </Badge>
        </span>
      </TooltipTrigger>
      <TooltipContent>{PRIORITY_DEFINITION[priority]}</TooltipContent>
    </Tooltip>
  );
}
