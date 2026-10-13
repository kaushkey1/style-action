import { useQuery } from '@tanstack/react-query';
import { getTaskByException } from '../api/tasksApi';
import { taskKeys } from '../api/queryKeys';
import { useAuthStore } from '@/hooks/useAuthStore';

/**
 * Returns the active (non-cancelled) task raised against an exception, if any.
 * Used by the /review detail panel to switch the CTA between
 * "Create Task" and "View Task".
 */
export function useTaskByException(exceptionId: string | undefined) {
  const userEmail = useAuthStore((s) => s.user?.email ?? '');
  return useQuery({
    queryKey: exceptionId !== undefined ? taskKeys.byException(exceptionId) : (['tasks', 'byException', 'noop'] as const),
    queryFn: () =>
      exceptionId !== undefined ? getTaskByException(exceptionId, userEmail) : Promise.resolve(null),
    enabled: exceptionId !== undefined && userEmail.length > 0,
    staleTime: 60_000,
  });
}
