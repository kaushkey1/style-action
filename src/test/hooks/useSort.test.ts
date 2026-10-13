import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSort } from '@/hooks/useSort';

interface TestItem {
  id: number;
  name: string;
  score: number | null;
}

const items: TestItem[] = [
  { id: 1, name: 'Charlie', score: 85 },
  { id: 2, name: 'Alice', score: 92 },
  { id: 3, name: 'Bob', score: 78 },
];

describe('useSort', () => {
  describe('initial sorting', () => {
    it('sorts by string key in ascending order', () => {
      const { result } = renderHook(() =>
        useSort(items, { key: 'name', dir: 'asc' })
      );

      expect(result.current.results.map((i) => i.name)).toEqual([
        'Alice',
        'Bob',
        'Charlie',
      ]);
      expect(result.current.sortKey).toBe('name');
      expect(result.current.sortDir).toBe('asc');
    });

    it('sorts by string key in descending order', () => {
      const { result } = renderHook(() =>
        useSort(items, { key: 'name', dir: 'desc' })
      );

      expect(result.current.results.map((i) => i.name)).toEqual([
        'Charlie',
        'Bob',
        'Alice',
      ]);
    });

    it('sorts by numeric key in ascending order', () => {
      const { result } = renderHook(() =>
        useSort(items, { key: 'score', dir: 'asc' })
      );

      expect(result.current.results.map((i) => i.score)).toEqual([78, 85, 92]);
    });

    it('sorts by numeric key in descending order', () => {
      const { result } = renderHook(() =>
        useSort(items, { key: 'score', dir: 'desc' })
      );

      expect(result.current.results.map((i) => i.score)).toEqual([92, 85, 78]);
    });
  });

  describe('toggleSort', () => {
    it('flips direction when toggling the same key', () => {
      const { result } = renderHook(() =>
        useSort(items, { key: 'name', dir: 'asc' })
      );

      act(() => {
        result.current.toggleSort('name');
      });

      expect(result.current.sortDir).toBe('desc');
      expect(result.current.sortKey).toBe('name');
    });

    it('sets direction to asc when toggling a different key', () => {
      const { result } = renderHook(() =>
        useSort(items, { key: 'name', dir: 'desc' })
      );

      act(() => {
        result.current.toggleSort('score');
      });

      expect(result.current.sortKey).toBe('score');
      expect(result.current.sortDir).toBe('asc');
    });

    it('flips direction multiple times for the same key', () => {
      const { result } = renderHook(() =>
        useSort(items, { key: 'name', dir: 'asc' })
      );

      act(() => {
        result.current.toggleSort('name');
      });
      expect(result.current.sortDir).toBe('desc');

      act(() => {
        result.current.toggleSort('name');
      });
      expect(result.current.sortDir).toBe('asc');
    });
  });

  describe('null handling', () => {
    it('pushes null values to the end in ascending order', () => {
      const itemsWithNull: TestItem[] = [
        { id: 1, name: 'Charlie', score: null },
        { id: 2, name: 'Alice', score: 92 },
        { id: 3, name: 'Bob', score: 78 },
      ];

      const { result } = renderHook(() =>
        useSort(itemsWithNull, { key: 'score', dir: 'asc' })
      );

      expect(result.current.results.map((i) => i.score)).toEqual([
        78,
        92,
        null,
      ]);
    });

    it('pushes null values to the end in descending order', () => {
      const itemsWithNull: TestItem[] = [
        { id: 1, name: 'Charlie', score: null },
        { id: 2, name: 'Alice', score: 92 },
        { id: 3, name: 'Bob', score: 78 },
      ];

      const { result } = renderHook(() =>
        useSort(itemsWithNull, { key: 'score', dir: 'desc' })
      );

      expect(result.current.results.map((i) => i.score)).toEqual([
        92,
        78,
        null,
      ]);
    });

    it('handles all null values', () => {
      const allNull: TestItem[] = [
        { id: 1, name: 'A', score: null },
        { id: 2, name: 'B', score: null },
      ];

      const { result } = renderHook(() =>
        useSort(allNull, { key: 'score', dir: 'asc' })
      );

      expect(result.current.results).toHaveLength(2);
      expect(result.current.results.every((i) => i.score === null)).toBe(true);
    });
  });

  it('does not mutate the original array', () => {
    const original = [...items];
    renderHook(() => useSort(items, { key: 'name', dir: 'asc' }));
    expect(items).toEqual(original);
  });
});
