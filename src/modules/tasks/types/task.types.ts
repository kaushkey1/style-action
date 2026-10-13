/**
 * Task domain types. Locked to spec §R7 (state machine) + spec §R9 (API shape).
 * BE gaps documented in spec: due_date, status enum extensions, comment_type discriminator.
 */
export type TaskStatus =
  | 'pending'
  | 'open'
  | 'in_progress'
  | 'in_review'   // BE-gap: needs adding to enum
  | 'done'
  | 'blocked'
  | 'reopened'    // BE-gap: needs adding to enum
  | 'cancelled';

export type TaskPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type CommentType =
  | 'comment'
  | 'submission'
  | 'review_feedback'
  | 'reopen'
  | 'cancel'
  | 'restore';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string;
  assignor: string;
  exception_id: string | null;
  source: string;
  scope: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  unread_by_assignee: boolean;
  subscribers: string[];
}

export interface TaskComment {
  id: string;
  task_id: string;
  author: string;
  body: string;
  comment_type: CommentType;
  created_at: string;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  actor: string;
  event: string;
  kind: 'created' | 'status_change' | 'reassigned' | 'edited';
  from_status?: TaskStatus;
  to_status?: TaskStatus;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  initials: string;
  username: string | null;
  active: boolean;
}

export interface TaskFilters {
  search: string;
  /** Multi-select CSV of `TaskPriority` values (e.g. "Critical,High"), or 'all' when unfiltered. */
  priority: string;
  /** Multi-select CSV of assignor emails, or 'all' when unfiltered. */
  assignor: string;
  /** Multi-select CSV of 'with_exception' / 'general', or 'all' when unfiltered (both → all). */
  linked: string;
}

export const DEFAULT_TASK_FILTERS: TaskFilters = {
  search: '',
  priority: 'all',
  assignor: 'all',
  linked: 'all',
};

export function taskFilterKey(filters: TaskFilters): string {
  return [filters.search, filters.priority, filters.assignor, filters.linked].join('|');
}

export type TaskListTab = 'all' | 'assigned-to-me' | 'assigned-by-me';
export type TaskView = 'card' | 'table' | 'kanban';
