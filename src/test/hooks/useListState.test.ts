import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useListState } from '@/hooks/useListState';

interface TestItem {
  id: string;
  name: string;
  status: string;
  score: number;
}

const items: TestItem[] = [
  { id: '1', name: 'Alpha', status: 'active', score: 80 },
  { id: '2', name: 'Beta', status: 'inactive', score: 60 },
  { id: '3', name: 'Gamma', status: 'active', score: 90 },
  { id: '4', name: 'Delta', status: 'inactive', score: 70 },
  { id: '5', name: 'Epsilon', status: 'active', score: 50 },
];

describe('useListState', () => {
  it('returns all items with default options', () => {
    const { result } = renderHook(() => useListState(items));
    expect(result.current.totalItems).toBe(5);
  });

  it('paginates items', () => {
    const { result } = renderHook(() =>
      useListState(items, { pageSize: 2 })
    );

    expect(result.current.pageItems).toHaveLength(2);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.currentPage).toBe(1);
  });

  it('exposes sort controls', () => {
    const { result } = renderHook(() =>
      useListState(items, { initialSort: { key: 'score', dir: 'asc' } })
    );

    expect(result.current.sortKey).toBe('score');
    expect(result.current.sortDir).toBe('asc');
  });

  it('supports selection', () => {
    const { result } = renderHook(() => useListState(items));

    expect(result.current.selectedId).toBeNull();

    act(() => result.current.setSelectedId('2'));
    expect(result.current.selectedId).toBe('2');

    act(() => result.current.clearSelection());
    expect(result.current.selectedId).toBeNull();
  });

  it('exposes filter controls', () => {
    const { result } = renderHook(() =>
      useListState(items, { initialFilters: { status: 'all' } })
    );

    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.filters).toEqual({ status: 'all' });
  });
});
