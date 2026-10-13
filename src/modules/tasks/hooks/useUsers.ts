import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { listUsers } from '../api/usersApi';
import { userKeys } from '../api/queryKeys';

export interface UseUsersOptions {
  /** Server-side substring filter (ILIKE on email/username/first/last). */
  search?: string;
  /** Exclude deactivated users when true. Defaults to true. */
  activeOnly?: boolean;
  /** Disable the query (e.g. dropdown closed). Defaults to true. */
  enabled?: boolean;
}

/**
 * Searchable user list backed by `GET /v1.0/users`. The `search` param is the
 * server-side ILIKE substring; callers are expected to debounce it before
 * passing it in so we don't fire on every keystroke.
 */
export function useUsers(options: UseUsersOptions = {}) {
  const { search = '', activeOnly = true, enabled = true } = options;
  return useQuery({
    queryKey: userKeys.list({ search, activeOnly }),
    queryFn: () => listUsers({ search, activeOnly, limit: 50 }),
    staleTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled,
  });
}
