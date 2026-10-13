import { useQuery } from '@tanstack/react-query';
import { fetchPendingCount } from '../api/tasksApi';
import { taskKeys } from '../api/queryKeys';

/**
 * Server-side count: assignee-bucket [open, reopened, blocked]
 *                  + assignor-bucket [in_review, blocked].
 */
export function useTasksPendingCount(userEmail: string) {
  return useQuery({
    queryKey: taskKeys.pendingCount(userEmail),
    queryFn: () => fetchPendingCount(userEmail),
    enabled: userEmail.length > 0,
    staleTime: 60_000,
    // No retries — a 403 here means the role lacks the tasks endpoint;
    // retrying won't help and just spams the BE on every page nav.
    retry: false,
  });
}
