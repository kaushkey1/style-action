import { useQuery } from '@tanstack/react-query';
import { listActivities } from '../api/commentsApi';
import { taskKeys } from '../api/queryKeys';
import { useTaskDetail } from './useTaskDetail';
import { useAuthStore } from '@/hooks/useAuthStore';
import type { TaskComment } from '../types/task.types';

/**
 * Comments come embedded in `GET /tasks/{id}` — no separate list endpoint.
 * We re-use the detail query and select the comments out.
 */
export function useTaskComments(taskId: string | undefined): { data: TaskComment[] | undefined; isLoading: boolean } {
  const detail = useTaskDetail(taskId);
  return {
    data: detail.data?.comments,
    isLoading: detail.isLoading,
  };
}

export function useTaskActivities(taskId: string | undefined) {
  const userEmail = useAuthStore((s) => s.user?.email ?? '');
  return useQuery({
    queryKey: taskId !== undefined ? taskKeys.activities(taskId) : (['tasks', 'activities', 'noop'] as const),
    queryFn: () => (taskId !== undefined ? listActivities(taskId, userEmail) : Promise.resolve([])),
    enabled: taskId !== undefined && userEmail.length > 0,
    staleTime: 60_000,
  });
}
