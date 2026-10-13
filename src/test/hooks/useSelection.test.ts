import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSelection } from '@/hooks/useSelection';

describe('useSelection', () => {
  it('starts with selectedId as null', () => {
    const { result } = renderHook(() => useSelection());
    expect(result.current.selectedId).toBeNull();
  });

  it('sets selectedId via setSelectedId', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.setSelectedId('item-1');
    });

    expect(result.current.selectedId).toBe('item-1');
  });

  it('updates selectedId when changed', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.setSelectedId('item-1');
    });
    expect(result.current.selectedId).toBe('item-1');

    act(() => {
      result.current.setSelectedId('item-2');
    });
    expect(result.current.selectedId).toBe('item-2');
  });

  it('clears selection via clearSelection', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.setSelectedId('item-1');
    });
    expect(result.current.selectedId).toBe('item-1');

    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedId).toBeNull();
  });

  it('handles clearing when already null', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedId).toBeNull();
  });
});
