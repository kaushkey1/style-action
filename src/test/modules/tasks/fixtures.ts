import type { Task } from '@/modules/tasks/types/task.types';

function makeTask(overrides: Partial<Task> & Pick<Task, 'id' | 'title' | 'status'>): Task {
  return {
    description: '',
    priority: 'Medium',
    assigned_to: 'bob@fynd.com',
    assignor: 'alice@fynd.com',
    exception_id: null,
    due_date: null,
    created_at: '2026-05-28T10:00:00Z',
    updated_at: '2026-05-28T10:00:00Z',
    unread_by_assignee: false,
    subscribers: ['alice@fynd.com', 'bob@fynd.com'],
    ...overrides,
  };
}

/**
 * Compact task fixture set covering every status and both bob/alice roles,
 * used by the TaskListCardView and TaskListTableView tests.
 */
export const FIXTURE_TASKS: Task[] = [
  // bob assignee — open (action needed)
  makeTask({
    id: 'F-101',
    title: 'Investigate Sarees margin breach',
    status: 'open',
    priority: 'Critical',
    exception_id: 'EXC-100',
    unread_by_assignee: true,
  }),
  // bob assignee — reopened
  makeTask({ id: 'F-102', title: 'Vendor SLA escalation', status: 'reopened', priority: 'High' }),
  // bob assignee — in_progress (in flight)
  makeTask({ id: 'F-103', title: 'Aged inventory audit', status: 'in_progress' }),
  // bob assignee — blocked
  makeTask({ id: 'F-104', title: 'Pricing sync blocked', status: 'blocked' }),
  // bob assignee — in_review (awaiting review)
  makeTask({ id: 'F-105', title: 'Q1 vendor reconciliation', status: 'in_review' }),
  // bob assignee — done (closed)
  makeTask({ id: 'F-106', title: 'Closed task 1', status: 'done' }),
  // bob assignee — cancelled
  makeTask({ id: 'F-107', title: 'Closed task 2', status: 'cancelled' }),
];
