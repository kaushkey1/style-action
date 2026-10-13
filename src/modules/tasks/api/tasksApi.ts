import { ApiService, IMPETUS_BASE, getImpetusHeaders } from '@/lib/api';
import type {
  Task,
  TaskComment,
  TaskListTab,
  TaskFilters,
  TaskPriority,
  TaskStatus,
} from '../types/task.types';

const BASE = `${IMPETUS_BASE}/tasks`;

// ─── Wire ↔ FE adapters ───────────────────────────────────────────────────────

type WirePriority = 'low' | 'medium' | 'high' | 'critical';

const PRIORITY_TO_WIRE: Record<TaskPriority, WirePriority> = {
  Critical: 'critical',
  High: 'high',
  Medium: 'medium',
  Low: 'low',
};
const PRIORITY_FROM_WIRE: Record<WirePriority, TaskPriority> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

interface ApiTask {
  id: string;
  title: string;
  description: string | null;
  priority: WirePriority;
  status: TaskStatus;
  assigned_to: string | null;
  created_by: string;
  exception_id: string | null;
  source: string;
  scope: string | null;
  due_date: string | null;
  unread_by_assignee: boolean;
  subscribers: string[];
  created_at: string;
  updated_at: string;
}

interface ApiComment {
  id: string;
  task_id: string;
  body: string;
  comment_type: TaskComment['comment_type'];
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ApiTaskWithComments extends ApiTask {
  comments?: ApiComment[];
}

function fromApiTask(api: ApiTask): Task {
  return {
    id: api.id,
    title: api.title,
    description: api.description ?? '',
    status: api.status,
    priority: PRIORITY_FROM_WIRE[api.priority],
    assigned_to: api.assigned_to ?? '',
    assignor: api.created_by,
    exception_id: api.exception_id,
    source: api.source ?? 'manual',
    scope: api.scope ?? null,
    due_date: api.due_date,
    created_at: api.created_at,
    updated_at: api.updated_at,
    unread_by_assignee: api.unread_by_assignee,
    subscribers: api.subscribers,
  };
}

export function fromApiComment(api: ApiComment): TaskComment {
  return {
    id: api.id,
    task_id: api.task_id,
    author: api.created_by,
    body: api.body,
    comment_type: api.comment_type,
    created_at: api.created_at,
  };
}

function buildHeaders(userEmail: string): Record<string, string> {
  return {
    ...getImpetusHeaders(),
    'x-user-data': JSON.stringify({ email: userEmail }),
  };
}

function unwrap<T>(resData: unknown): T {
  if (resData && typeof resData === 'object' && 'data' in resData) {
    return (resData as { data: T }).data;
  }
  return resData as T;
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export interface ListTasksParams {
  tab: TaskListTab;
  filters: TaskFilters;
  userEmail: string;
}

export async function listTasks(params: ListTasksParams): Promise<Task[]> {
  const { filters, userEmail } = params;
  const query: Record<string, string | number> = {
    order_by: 'updated_at',
    order: 'desc',
    limit: 200,
  };

  // skipForbiddenRedirect: this call is fired from MyTasksSection (Console
  // Home) and TasksTopBarIcon (every page's TopBar). A role whose URM lacks
  // the tasks endpoint must not be booted to /unauthorized — let the widget
  // render an empty state instead.
  const res = await ApiService.get(BASE, {
    params: query,
    headers: buildHeaders(userEmail),
    skipForbiddenRedirect: true,
  });
  const apiTasks = unwrap<ApiTask[]>(res.data) ?? [];
  let tasks = apiTasks.map(fromApiTask);

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    tasks = tasks.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }
  // Multi-select priority / assignor — filtered client-side from the CSV value
  // ('all' = no filter). The wire API takes a single value, so the fan-out is local.
  if (filters.priority !== 'all') {
    const selected = new Set(filters.priority.split(',').filter(Boolean));
    if (selected.size > 0) tasks = tasks.filter((t) => selected.has(t.priority));
  }
  if (filters.assignor !== 'all') {
    const selected = new Set(filters.assignor.split(',').filter(Boolean));
    if (selected.size > 0) tasks = tasks.filter((t) => selected.has(t.assignor));
  }
  // Multi-select linked filter — CSV of 'with_exception' / 'general'. Selecting
  // both (or neither) is equivalent to no filter.
  if (filters.linked !== 'all') {
    const sel = new Set(filters.linked.split(',').filter(Boolean));
    const wantsException = sel.has('with_exception');
    const wantsGeneral = sel.has('general');
    if (wantsException && !wantsGeneral) {
      tasks = tasks.filter((t) => t.exception_id !== null);
    } else if (wantsGeneral && !wantsException) {
      tasks = tasks.filter((t) => t.exception_id === null);
    }
  }

  return tasks;
}

export interface TaskWithComments {
  task: Task;
  comments: TaskComment[];
}

export async function getTask(
  id: string,
  userEmail: string,
): Promise<TaskWithComments | null> {
  const res = await ApiService.get(`${BASE}/${id}`, {
    headers: buildHeaders(userEmail),
  });
  const api = unwrap<ApiTaskWithComments | null>(res.data);
  if (!api) return null;
  return {
    task: fromApiTask(api),
    comments: (api.comments ?? []).map(fromApiComment),
  };
}

/**
 * Returns the most recently created non-cancelled task linked to an exception,
 * or null if none exist. Used by the /review panel to swap Create Task → View Task.
 */
export async function getTaskByException(
  exceptionId: string,
  userEmail: string,
): Promise<Task | null> {
  const res = await ApiService.get(BASE, {
    params: {
      exception_id: exceptionId,
      order_by: 'created_at',
      order: 'desc',
      limit: 50,
    },
    headers: buildHeaders(userEmail),
  });
  const apiTasks = unwrap<ApiTask[]>(res.data) ?? [];
  const active = apiTasks.find((t) => t.status !== 'cancelled');
  return active ? fromApiTask(active) : null;
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  title: string;
  description: string;
  assigned_to: string;
  priority: TaskPriority;
  due_date: string | null;
  exception_id: string | null;
  subscribers?: string[];
}

export async function createTask(input: CreateTaskInput, userEmail: string): Promise<Task> {
  const body = {
    title: input.title,
    description: input.description,
    priority: PRIORITY_TO_WIRE[input.priority],
    assigned_to: input.assigned_to,
    exception_id: input.exception_id,
    due_date: input.due_date,
    subscribers: input.subscribers ?? [userEmail, input.assigned_to],
  };
  const res = await ApiService.post(BASE, {
    data: body,
    headers: buildHeaders(userEmail),
  });
  const api = unwrap<ApiTask>(res.data);
  return fromApiTask(api);
}

export interface PatchTaskInput {
  id: string;
  patch: Partial<{
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    assigned_to: string;
    exception_id: string | null;
    due_date: string | null;
    unread_by_assignee: boolean;
  }>;
  reason?: string;
}

export async function patchTask(input: PatchTaskInput, userEmail: string): Promise<Task> {
  const { id, patch, reason } = input;
  const body: Record<string, unknown> = {};
  if (patch.title !== undefined) body.title = patch.title;
  if (patch.description !== undefined) body.description = patch.description;
  if (patch.priority !== undefined) body.priority = PRIORITY_TO_WIRE[patch.priority];
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.assigned_to !== undefined) body.assigned_to = patch.assigned_to;
  if (patch.exception_id !== undefined) body.exception_id = patch.exception_id;
  if (patch.due_date !== undefined) body.due_date = patch.due_date;
  if (patch.unread_by_assignee !== undefined) body.unread_by_assignee = patch.unread_by_assignee;
  if (reason !== undefined && reason.length > 0) body.reason = reason;

  const res = await ApiService.patch(`${BASE}/${id}`, {
    data: body,
    headers: buildHeaders(userEmail),
  });
  const api = unwrap<ApiTask>(res.data);
  return fromApiTask(api);
}

// ─── Pending count ────────────────────────────────────────────────────────────

export async function fetchPendingCount(userEmail: string): Promise<number> {
  // skipForbiddenRedirect: fired from TasksTopBarIcon, which mounts on every
  // route via the shared TopBar. See note above on listTasks.
  const res = await ApiService.get(`${BASE}/count/pending`, {
    params: { user: userEmail },
    headers: buildHeaders(userEmail),
    skipForbiddenRedirect: true,
  });
  const data = unwrap<{ count: number }>(res.data);
  return data?.count ?? 0;
}
