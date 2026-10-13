import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '@/hooks/useSearch';

interface TestItem {
  id: number;
  name: string;
  category: string;
}

const items: TestItem[] = [
  { id: 1, name: 'Apple', category: 'Fruit' },
  { id: 2, name: 'Banana', category: 'Fruit' },
  { id: 3, name: 'Carrot', category: 'Vegetable' },
  { id: 4, name: 'Avocado', category: 'Fruit' },
];

describe('useSearch', () => {
  it('returns all items when query is empty', () => {
    const { result } = renderHook(() =>
      useSearch(items, { fields: ['name', 'category'] })
    );
    expect(result.current.results).toEqual(items);
    expect(result.current.query).toBe('');
  });

  it('returns all items when fields array is empty', () => {
    const { result } = renderHook(() =>
      useSearch(items, { fields: [] })
    );

    act(() => {
      result.current.setQuery('Apple');
    });

    expect(result.current.results).toEqual(items);
  });

  it('filters items by a matching field value', () => {
    const { result } = renderHook(() =>
      useSearch(items, { fields: ['name'] })
    );

    act(() => {
      result.current.setQuery('apple');
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0]!.name).toBe('Apple');
  });

  it('performs case-insensitive search', () => {
    const { result } = renderHook(() =>
      useSearch(items, { fields: ['name'] })
    );

    act(() => {
      result.current.setQuery('BANANA');
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0]!.name).toBe('Banana');
  });

  it('searches across multiple fields', () => {
    const { result } = renderHook(() =>
      useSearch(items, { fields: ['name', 'category'] })
    );

    act(() => {
      result.current.setQuery('vegetable');
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0]!.name).toBe('Carrot');
  });

  it('returns multiple matches', () => {
    const { result } = renderHook(() =>
      useSearch(items, { fields: ['name'] })
    );

    act(() => {
      result.current.setQuery('a');
    });

    // Apple, Banana, Carrot, Avocado all contain 'a'
    expect(result.current.results).toHaveLength(4);
  });

  it('returns empty array when no items match', () => {
    const { result } = renderHook(() =>
      useSearch(items, { fields: ['name'] })
    );

    act(() => {
      result.current.setQuery('xyz');
    });

    expect(result.current.results).toHaveLength(0);
  });

  it('returns all items when query is cleared', () => {
    const { result } = renderHook(() =>
      useSearch(items, { fields: ['name'] })
    );

    act(() => {
      result.current.setQuery('apple');
    });
    expect(result.current.results).toHaveLength(1);

    act(() => {
      result.current.setQuery('');
    });
    expect(result.current.results).toEqual(items);
  });

  it('handles items with null field values', () => {
    const itemsWithNull = [
      { id: 1, name: 'Apple', category: null },
      { id: 2, name: 'Banana', category: 'Fruit' },
    ];

    const { result } = renderHook(() =>
      useSearch(itemsWithNull, { fields: ['name', 'category'] as (keyof typeof itemsWithNull[0])[] })
    );

    act(() => {
      result.current.setQuery('Fruit');
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0]!.name).toBe('Banana');
  });

  it('updates query state correctly', () => {
    const { result } = renderHook(() =>
      useSearch(items, { fields: ['name'] })
    );

    act(() => {
      result.current.setQuery('test');
    });

    expect(result.current.query).toBe('test');
  });
});
