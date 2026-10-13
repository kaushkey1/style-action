import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui';
import { TaskListCardView } from '@/modules/tasks/components/TaskListCardView';
import { FIXTURE_TASKS } from '../fixtures';
import type { Task, TaskListTab } from '@/modules/tasks/types/task.types';

// The row kebab (TaskActionsMenu) uses React Query + router, so the view needs
// both providers in tests.
function renderView(
  tasks: Task[] = FIXTURE_TASKS,
  tab: TaskListTab = 'assigned-to-me',
): ReturnType<typeof render> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TooltipProvider>
          <TaskListCardView tasks={tasks} tab={tab} />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TaskListCardView', () => {
  it('shows EmptyState when no tasks', () => {
    renderView([]);
    expect(screen.getByText(/No tasks match your filters/i)).toBeInTheDocument();
  });

  it('renders one row per task in a flat list — no status section headers', () => {
    renderView(FIXTURE_TASKS);
    // Every task title is present…
    for (const task of FIXTURE_TASKS) {
      expect(screen.getByText(task.title)).toBeInTheDocument();
    }
    // …and the old grouped section headers are gone (flat list, ordering from query).
    expect(screen.queryByText(/^Action Needed \(/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^In Flight \(/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Done \(/)).not.toBeInTheDocument();
  });

  it('exposes a task-options kebab on every row', () => {
    renderView(FIXTURE_TASKS);
    expect(screen.getAllByRole('button', { name: 'Task options' })).toHaveLength(
      FIXTURE_TASKS.length,
    );
  });
});
