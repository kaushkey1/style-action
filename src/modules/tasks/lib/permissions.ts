import type { Task, TaskStatus } from '../types/task.types';

export type TaskAction =
  | 'submit_for_review'
  | 'mark_blocked'
  | 'approve_close'
  | 'request_changes'
  | 'edit'
  | 'reassign'
  | 'cancel'
  | 'reopen'
  | 'restore'
  | 'add_comment'
  | 'copy_link';

const EDITABLE_STATUSES: ReadonlySet<TaskStatus> = new Set([
  'open', 'in_progress', 'blocked', 'in_review', 'reopened',
]);

/** Single source of truth for who can do what (spec §R7). */
export function canUserDo(action: TaskAction, task: Task, userEmail: string): boolean {
  const isAssignee = task.assigned_to === userEmail;
  const isAssignor = task.assignor === userEmail;

  switch (action) {
    case 'copy_link':
    case 'add_comment':
      return task.subscribers.includes(userEmail) || isAssignee || isAssignor;

    case 'submit_for_review':
      return isAssignee && (task.status === 'in_progress' || task.status === 'reopened');

    case 'mark_blocked':
      return isAssignee && task.status === 'in_progress';

    case 'approve_close':
      return isAssignor && task.status === 'in_review';

    case 'request_changes':
      return isAssignor && task.status === 'in_review';

    case 'edit':
      return isAssignor && EDITABLE_STATUSES.has(task.status);

    case 'reassign':
      return isAssignor && task.status !== 'done' && task.status !== 'cancelled';

    case 'cancel':
      return isAssignor && task.status !== 'done' && task.status !== 'cancelled';

    case 'reopen':
      return isAssignor && task.status === 'done';

    case 'restore':
      return isAssignor && task.status === 'cancelled';

    default: {
      // Exhaustiveness check — TS compile error if a TaskAction is added without a case
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
