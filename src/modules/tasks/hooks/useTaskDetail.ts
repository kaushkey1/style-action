import { useQuery } from '@tanstack/react-query';
import { getTask } from '../api/tasksApi';
import { taskKeys } from '../api/queryKeys';
import { useAuthStore } from '@/hooks/useAuthStore';

export function useTaskDetail(id: string | undefined) {
  const userEmail = useAuthStore((s) => s.user?.email ?? '');
  return useQuery({
    queryKey: id !== undefined ? taskKeys.detail(id) : (['tasks', 'detail', 'noop'] as const),
    queryFn: () => (id !== undefined ? getTask(id, userEmail) : Promise.resolve(null)),
    enabled: id !== undefined && userEmail.length > 0,
    staleTime: 60_000,
  });
}
