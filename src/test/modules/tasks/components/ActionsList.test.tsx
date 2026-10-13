import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui';
import { ActionsList } from '@/modules/tasks/components/ActionsList';
import type { Task } from '@/modules/tasks/types/task.types';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TSK-T01',
    title: 'Test task',
    description: 'desc',
    status: 'open',
    priority: 'Medium',
    assigned_to: 'bob@fynd.com',
    assignor: 'alice@fynd.com',
    exception_id: null,
    due_date: null,
    created_at: '2026-05-29T00:00:00Z',
    updated_at: '2026-05-29T00:00:00Z',
    unread_by_assignee: false,
    subscribers: ['bob@fynd.com', 'alice@fynd.com'],
    ...overrides,
  };
}

function renderList(task: Task, userEmail: string) {
  return render(
    <MemoryRouter>
      <TooltipProvider>
        <ActionsList task={task} userEmail={userEmail} />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

describe('ActionsList', () => {
  it('renders no actions for a stranger (not assignee or assignor or subscriber)', () => {
    const task = makeTask({ subscribers: ['alice@fynd.com', 'bob@fynd.com'] });
    const { container } = renderList(task, 'stranger@fynd.com');
    expect(container.firstChild).toBeNull();
  });

  it('renders Edit + Reassign + Cancel for assignor on an open task', () => {
    const task = makeTask({ status: 'open' });
    renderList(task, 'alice@fynd.com');
    expect(screen.getByRole('button', { name: /Edit/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reassign/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel task/ })).toBeInTheDocument();
  });

  it('renders Submit for review + Mark blocked for assignee on an in_progress task', () => {
    const task = makeTask({ status: 'in_progress' });
    renderList(task, 'bob@fynd.com');
    expect(screen.getByRole('button', { name: /Submit for review/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mark blocked/ })).toBeInTheDocument();
  });

  it('renders Approve & close + Request changes for assignor when task is in_review', () => {
    const task = makeTask({ status: 'in_review' });
    renderList(task, 'alice@fynd.com');
    expect(screen.getByRole('button', { name: /Approve & close/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Request changes/ })).toBeInTheDocument();
  });

  it('renders Restore for assignor on cancelled task', () => {
    const task = makeTask({ status: 'cancelled' });
    renderList(task, 'alice@fynd.com');
    expect(screen.getByRole('button', { name: /Restore/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reopen/ })).not.toBeInTheDocument();
  });
});
