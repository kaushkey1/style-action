import React from 'react';
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import type { TaskStatus } from '../types/task.types';

const STATUS_VARIANT_MAP: Record<TaskStatus, 'error' | 'info' | 'purple' | 'success' | 'warning' | 'default'> = {
  pending:     'default',
  open:        'error',
  in_progress: 'warning',
  in_review:   'purple',
  done:        'success',
  blocked:     'warning',
  reopened:    'error',
  cancelled:   'default',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending:     'Pending',
  open:        'Open',
  in_progress: 'In progress',
  in_review:   'In review',
  done:        'Done',
  blocked:     'Blocked',
  reopened:    'Reopened',
  cancelled:   'Cancelled',
};

const STATUS_DEFINITION: Record<TaskStatus, string> = {
  pending:     'Task created by agent — awaiting assignment.',
  open:        'Task created — assignee has not viewed yet.',
  in_progress: 'Active work in progress.',
  in_review:   'Assignee submitted; awaiting your review.',
  done:        'Approved and closed.',
  blocked:     'Assignee marked blocked — needs help.',
  reopened:    'Previously done; reopened for more work.',
  cancelled:   'Stopped without resolution. Can be restored.',
};

export interface TaskStatusPillProps {
  status: TaskStatus;
}

/** Non-interactive status indicator. Tooltip on hover shows the definition. */
export function TaskStatusPill({ status }: TaskStatusPillProps): React.JSX.Element {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* inline-flex so the trigger wraps the badge tightly (no line-height leading)
            and centers cleanly in a flex row — keeps it optically aligned with siblings. */}
        <span className="inline-flex">
          <Badge dot variant={STATUS_VARIANT_MAP[status]}>
            {STATUS_LABEL[status]}
          </Badge>
        </span>
      </TooltipTrigger>
      <TooltipContent>{STATUS_DEFINITION[status]}</TooltipContent>
    </Tooltip>
  );
}
