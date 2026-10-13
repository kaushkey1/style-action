import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui';
import { TaskRowCard } from '@/modules/tasks/components/TaskRowCard';
import type { Task } from '@/modules/tasks/types/task.types';

const task: Task = {
  id: 'TSK-101',
  title: 'Investigate margin breach',
  description: 'S2 breach on hero SKU',
  status: 'open',
  priority: 'Critical',
  assigned_to: 'bob@fynd.com',
  assignor: 'alice@fynd.com',
  exception_id: 'EXC-STOCK-AGING',
  due_date: '2026-05-30T18:00:00Z',
  created_at: '2026-05-28T16:14:00Z',
  updated_at: '2026-05-28T16:14:00Z',
  unread_by_assignee: true,
  subscribers: ['alice@fynd.com', 'bob@fynd.com'],
};

// The row renders TaskActionsMenu (React Query) inside a router + tooltip context.
function renderRow(rowTask: Task = task): ReturnType<typeof render> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TooltipProvider>
          <TaskRowCard task={rowTask} />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TaskRowCard', () => {
  it('renders the title', () => {
    renderRow();
    expect(screen.getByText(task.title)).toBeInTheDocument();
  });

  it('shows NEW badge for unread open tasks', () => {
    renderRow();
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('does NOT show NEW badge for in_progress tasks', () => {
    renderRow({ ...task, status: 'in_progress', unread_by_assignee: true });
    expect(screen.queryByText('NEW')).not.toBeInTheDocument();
  });

  it('linked exception button renders', () => {
    renderRow();
    expect(screen.getByText(task.exception_id!)).toBeInTheDocument();
  });

  it('exposes a task-options kebab', () => {
    renderRow();
    expect(screen.getByRole('button', { name: 'Task options' })).toBeInTheDocument();
  });
});
