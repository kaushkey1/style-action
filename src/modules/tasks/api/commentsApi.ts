import { ApiService, IMPETUS_BASE, getImpetusHeaders } from '@/lib/api';
import { fromApiComment } from './tasksApi';
import type { TaskComment, TaskActivity, CommentType } from '../types/task.types';

const BASE = `${IMPETUS_BASE}/tasks`;

interface ApiActivity {
  id: string;
  task_id: string;
  actor: string;
  kind: TaskActivity['kind'];
  event: string;
  from_status?: TaskActivity['from_status'];
  to_status?: TaskActivity['to_status'];
  created_at: string;
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

export async function listActivities(taskId: string, userEmail: string): Promise<TaskActivity[]> {
  const res = await ApiService.get(`${BASE}/${taskId}/activities`, {
    headers: buildHeaders(userEmail),
  });
  return unwrap<ApiActivity[]>(res.data) ?? [];
}

export interface PostCommentInput {
  task_id: string;
  body: string;
  comment_type?: CommentType;
}

export async function postComment(
  input: PostCommentInput,
  userEmail: string,
): Promise<TaskComment> {
  const res = await ApiService.post(`${BASE}/${input.task_id}/comments`, {
    data: {
      body: input.body,
      comment_type: input.comment_type ?? 'comment',
    },
    headers: buildHeaders(userEmail),
  });
  const api = unwrap<Parameters<typeof fromApiComment>[0]>(res.data);
  return fromApiComment(api);
}
