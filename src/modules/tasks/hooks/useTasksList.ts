import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { listTasks, type ListTasksParams } from '../api/tasksApi';
import { taskKeys } from '../api/queryKeys';

export function useTasksList(params: ListTasksParams) {
  return useQuery({
    queryKey: taskKeys.list({ filters: params.filters }),
    queryFn: () => listTasks(params),
    enabled: params.userEmail.length > 0,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    // No retries — a 403 here means the role lacks the tasks endpoint;
    // retrying won't help and just spams the BE on every page nav.
    retry: false,
  });
}
