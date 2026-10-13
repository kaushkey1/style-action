import { describe, it, expect } from 'vitest';
import { canUserDo } from '@/modules/tasks/lib/permissions';
import type { Task } from '@/modules/tasks/types/task.types';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'T1',
    title: 'x', description: '',
    status: 'in_progress',
    priority: 'Medium',
    assigned_to: 'bob@fynd.com',
    assignor: 'alice@fynd.com',
    exception_id: null,
    due_date: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    unread_by_assignee: false,
    subscribers: ['alice@fynd.com', 'bob@fynd.com'],
    ...overrides,
  };
}

describe('canUserDo — assignee actions', () => {
  it('assignee can submit_for_review when in_progress', () => {
    expect(canUserDo('submit_for_review', makeTask({ status: 'in_progress' }), 'bob@fynd.com')).toBe(true);
  });
  it('assignee can submit_for_review when reopened', () => {
    expect(canUserDo('submit_for_review', makeTask({ status: 'reopened' }), 'bob@fynd.com')).toBe(true);
  });
  it('assignor cannot submit_for_review', () => {
    expect(canUserDo('submit_for_review', makeTask({ status: 'in_progress' }), 'alice@fynd.com')).toBe(false);
  });
  it('assignee can mark_blocked when in_progress', () => {
    expect(canUserDo('mark_blocked', makeTask({ status: 'in_progress' }), 'bob@fynd.com')).toBe(true);
  });
  it('assignee cannot mark_blocked when in_review', () => {
    expect(canUserDo('mark_blocked', makeTask({ status: 'in_review' }), 'bob@fynd.com')).toBe(false);
  });
});

describe('canUserDo — assignor actions', () => {
  it('assignor can approve_close when in_review', () => {
    expect(canUserDo('approve_close', makeTask({ status: 'in_review' }), 'alice@fynd.com')).toBe(true);
  });
  it('assignor can request_changes when in_review', () => {
    expect(canUserDo('request_changes', makeTask({ status: 'in_review' }), 'alice@fynd.com')).toBe(true);
  });
  it('assignor can edit on open/in_progress/blocked/in_review/reopened', () => {
    (['open', 'in_progress', 'blocked', 'in_review', 'reopened'] as const).forEach((s) => {
      expect(canUserDo('edit', makeTask({ status: s }), 'alice@fynd.com')).toBe(true);
    });
  });
  it('assignor cannot edit done or cancelled', () => {
    (['done', 'cancelled'] as const).forEach((s) => {
      expect(canUserDo('edit', makeTask({ status: s }), 'alice@fynd.com')).toBe(false);
    });
  });
  it('assignor can reopen done tasks only', () => {
    expect(canUserDo('reopen', makeTask({ status: 'done' }), 'alice@fynd.com')).toBe(true);
    expect(canUserDo('reopen', makeTask({ status: 'cancelled' }), 'alice@fynd.com')).toBe(false);
    expect(canUserDo('reopen', makeTask({ status: 'in_review' }), 'alice@fynd.com')).toBe(false);
  });
  it('assignor can restore cancelled tasks only', () => {
    expect(canUserDo('restore', makeTask({ status: 'cancelled' }), 'alice@fynd.com')).toBe(true);
    expect(canUserDo('restore', makeTask({ status: 'done' }), 'alice@fynd.com')).toBe(false);
  });
  it('assignor can cancel any non-terminal status', () => {
    (['open', 'in_progress', 'blocked', 'in_review', 'reopened'] as const).forEach((s) => {
      expect(canUserDo('cancel', makeTask({ status: s }), 'alice@fynd.com')).toBe(true);
    });
    expect(canUserDo('cancel', makeTask({ status: 'done' }), 'alice@fynd.com')).toBe(false);
    expect(canUserDo('cancel', makeTask({ status: 'cancelled' }), 'alice@fynd.com')).toBe(false);
  });
  it('assignor can reassign any non-terminal status', () => {
    (['open', 'in_progress', 'blocked', 'in_review', 'reopened'] as const).forEach((s) => {
      expect(canUserDo('reassign', makeTask({ status: s }), 'alice@fynd.com')).toBe(true);
    });
  });
  it('assignor cannot reassign done or cancelled tasks', () => {
    expect(canUserDo('reassign', makeTask({ status: 'done' }), 'alice@fynd.com')).toBe(false);
    expect(canUserDo('reassign', makeTask({ status: 'cancelled' }), 'alice@fynd.com')).toBe(false);
  });
  it('assignee cannot reassign their own task', () => {
    expect(canUserDo('reassign', makeTask({ status: 'in_progress' }), 'bob@fynd.com')).toBe(false);
  });
});

describe('canUserDo — universal actions', () => {
  it('subscriber can add_comment + copy_link', () => {
    expect(canUserDo('add_comment', makeTask(), 'bob@fynd.com')).toBe(true);
    expect(canUserDo('add_comment', makeTask(), 'alice@fynd.com')).toBe(true);
    expect(canUserDo('copy_link',   makeTask(), 'bob@fynd.com')).toBe(true);
  });
  it('non-subscriber cannot add_comment', () => {
    expect(canUserDo('add_comment', makeTask(), 'random@fynd.com')).toBe(false);
  });
});
