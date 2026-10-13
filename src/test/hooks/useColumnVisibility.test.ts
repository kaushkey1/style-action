import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';

const HEADERS = [
  'Name',
  'Gross Revenue',
  'Net Revenue',
  'Gross Margin',
  'Sell Through',
  'Aged Inv',
  'Fresh',
  'ROS',
];

describe('useColumnVisibility', () => {
  it('defaults to the first 5 columns visible (locked + 4 toggleable)', () => {
    const { result } = renderHook(() => useColumnVisibility(HEADERS, { defaultVisibleCount: 5 }));
    expect(result.current.lockedKey).toBe('Name');
    expect(result.current.defaultVisibleKeys).toEqual([
      'Gross Revenue',
      'Net Revenue',
      'Gross Margin',
      'Sell Through',
    ]);
    expect(result.current.displayHeaders).toEqual([
      'Name',
      'Gross Revenue',
      'Net Revenue',
      'Gross Margin',
      'Sell Through',
    ]);
  });

  it('shows all columns when disabled', () => {
    const { result } = renderHook(() => useColumnVisibility(HEADERS, { enabled: false }));
    expect(result.current.displayHeaders).toEqual(HEADERS);
  });

  it('updates displayHeaders when visibleKeys change (hide + reorder)', () => {
    const { result } = renderHook(() => useColumnVisibility(HEADERS));
    act(() => result.current.setVisibleKeys(['ROS', 'Net Revenue']));
    expect(result.current.visibleKeys).toEqual(['ROS', 'Net Revenue']);
    expect(result.current.displayHeaders).toEqual(['Name', 'ROS', 'Net Revenue']);
  });

  it('drops stale keys not present in the current columns', () => {
    const { result } = renderHook(() => useColumnVisibility(HEADERS));
    act(() => result.current.setVisibleKeys(['Net Revenue', 'Nonexistent']));
    expect(result.current.visibleKeys).toEqual(['Net Revenue']);
    expect(result.current.displayHeaders).toEqual(['Name', 'Net Revenue']);
  });

  it('valueIndexOf maps a header to its index within row values (headers.slice(1))', () => {
    const { result } = renderHook(() => useColumnVisibility(HEADERS));
    expect(result.current.valueIndexOf('Gross Revenue')).toBe(0);
    expect(result.current.valueIndexOf('ROS')).toBe(6);
    expect(result.current.valueIndexOf('Name')).toBe(-1);
  });
});
