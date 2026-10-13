import { describe, it, expect } from 'vitest';
import { DEFAULT_TASK_FILTERS, taskFilterKey, type TaskFilters } from '@/modules/tasks/types/task.types';

describe('taskFilterKey', () => {
  it('returns identical key for two equal filter objects', () => {
    const filtersA: TaskFilters = { search: 'foo', priority: 'High', assignor: 'alice@fynd.com', linked: 'with_exception' };
    const filtersB: TaskFilters = { search: 'foo', priority: 'High', assignor: 'alice@fynd.com', linked: 'with_exception' };
    expect(taskFilterKey(filtersA)).toBe(taskFilterKey(filtersB));
  });

  it('returns different keys for different searches', () => {
    expect(taskFilterKey({ ...DEFAULT_TASK_FILTERS, search: 'a' }))
      .not.toBe(taskFilterKey({ ...DEFAULT_TASK_FILTERS, search: 'b' }));
  });

  it('default filter key is stable', () => {
    expect(taskFilterKey(DEFAULT_TASK_FILTERS)).toBe('|all|all|all');
  });
});
