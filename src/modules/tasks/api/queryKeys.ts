import type { TaskFilters } from '../types/task.types';

export interface TaskListParams {
  filters: TaskFilters;
}

/** Single source of truth for TanStack Query cache keys. */
export const taskKeys = {
  all:        ['tasks'] as const,
  lists:      ()                       => [...taskKeys.all,    'list'] as const,
  list:       (p: TaskListParams)      => [...taskKeys.lists(), p]      as const,
  details:    ()                       => [...taskKeys.all,    'detail'] as const,
  detail:     (id: string)             => [...taskKeys.details(), id]    as const,
  activities: (id: string)             => [...taskKeys.detail(id), 'activities'] as const,
  pendingCount: (userEmail: string)    => [...taskKeys.all, 'pendingCount', userEmail] as const,
  byException: (exceptionId: string)   => [...taskKeys.all, 'byException', exceptionId] as const,
};

export interface UserListParams {
  search: string;
  activeOnly: boolean;
}

export const userKeys = {
  all:    ['users'] as const,
  lists:  ()                       => [...userKeys.all, 'list'] as const,
  list:   (p: UserListParams)      => [...userKeys.lists(), p] as const,
};
