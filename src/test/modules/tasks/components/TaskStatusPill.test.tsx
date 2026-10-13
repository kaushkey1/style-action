import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TooltipProvider } from '@/components/ui';
import { TaskStatusPill } from '@/modules/tasks/components/TaskStatusPill';
import type { TaskStatus } from '@/modules/tasks/types/task.types';

// Humanized labels rendered by TaskStatusPill (raw enum is never shown to users).
const STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
  blocked: 'Blocked',
  reopened: 'Reopened',
  cancelled: 'Cancelled',
};

const ALL_STATUSES = Object.keys(STATUS_LABELS) as TaskStatus[];

describe('TaskStatusPill', () => {
  it.each(ALL_STATUSES)('renders the %s status with its humanized label', (status) => {
    render(
      <TooltipProvider>
        <TaskStatusPill status={status} />
      </TooltipProvider>
    );
    expect(screen.getByText(STATUS_LABELS[status])).toBeInTheDocument();
  });
});
