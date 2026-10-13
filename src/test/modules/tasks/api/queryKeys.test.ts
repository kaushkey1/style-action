import { describe, it, expect } from 'vitest';
import { taskKeys, userKeys } from '@/modules/tasks/api/queryKeys';
import { DEFAULT_TASK_FILTERS } from '@/modules/tasks/types/task.types';

describe('taskKeys', () => {
  it('all is a stable prefix', () => {
    expect(taskKeys.all).toEqual(['tasks']);
  });
  it('list key is structurally equal for equal params', () => {
    const params = { tab: 'assigned-to-me' as const, filters: DEFAULT_TASK_FILTERS };
    expect(taskKeys.list(params)).toEqual(taskKeys.list(params));
  });
  it('detail key nests under details key', () => {
    expect(taskKeys.detail('T1')).toEqual(['tasks', 'detail', 'T1']);
  });
  it('activities key nests under detail key', () => {
    expect(taskKeys.activities('T1')).toEqual(['tasks', 'detail', 'T1', 'activities']);
  });
  it('pendingCount keys are per-user', () => {
    expect(taskKeys.pendingCount('a@x')).not.toEqual(taskKeys.pendingCount('b@x'));
  });
});

describe('userKeys', () => {
  it('lists prefix is stable', () => {
    expect(userKeys.lists()).toEqual(['users', 'list']);
  });
  it('list key is structurally equal for equal params', () => {
    const params = { search: 'sara', activeOnly: true };
    expect(userKeys.list(params)).toEqual(userKeys.list(params));
  });
  it('different search params produce different keys', () => {
    expect(userKeys.list({ search: 'a', activeOnly: true })).not.toEqual(
      userKeys.list({ search: 'b', activeOnly: true }),
    );
  });
});
