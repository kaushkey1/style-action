import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui';
import { TaskListTableView } from '@/modules/tasks/components/TaskListTableView';
import type { Task } from '@/modules/tasks/types/task.types';
import { FIXTURE_TASKS } from '../fixtures';

// The row kebab (TaskActionsMenu) uses React Query + router, so the view needs
// both providers in tests.
function renderView(tasks: Task[] = FIXTURE_TASKS) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TooltipProvider>
          <TaskListTableView tasks={tasks} tab="assigned-to-me" />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TaskListTableView', () => {
  it('renders every task in a single flat table — no status sub-tabs', () => {
    renderView();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    const table = screen.getByRole('table');
    // header row + one row per fixture task (no per-status filtering)
    expect(within(table).getAllByRole('row')).toHaveLength(FIXTURE_TASKS.length + 1);
  });

  it('shows tasks of every status together (open and done)', () => {
    renderView();
    const table = screen.getByRole('table');
    expect(within(table).getByText('Investigate Sarees margin breach')).toBeInTheDocument();
    expect(within(table).getByText('Closed task 1')).toBeInTheDocument();
  });

  it('exposes a task-options kebab on every row', () => {
    renderView();
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('button', { name: 'Task options' })).toHaveLength(FIXTURE_TASKS.length);
  });

  it('renders an empty state when there are no tasks', () => {
    renderView([]);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText(/no tasks match/i)).toBeInTheDocument();
  });
});
