import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResetOnPersonaChange } from '@/hooks/useResetOnPersonaChange';
import { usePersonaStore } from '@/hooks/usePersonaStore';

describe('useResetOnPersonaChange', () => {
  beforeEach(() => {
    usePersonaStore.setState({ personaId: 'ceo' });
  });

  it('does not call callback on initial render', () => {
    const callback = vi.fn();
    renderHook(() => useResetOnPersonaChange(callback));

    expect(callback).not.toHaveBeenCalled();
  });

  it('calls callback when persona changes', () => {
    const callback = vi.fn();
    renderHook(() => useResetOnPersonaChange(callback));

    act(() => {
      usePersonaStore.getState().setPersona('category');
    });

    expect(callback).toHaveBeenCalledOnce();
  });

  it('calls callback on each persona change', () => {
    const callback = vi.fn();
    renderHook(() => useResetOnPersonaChange(callback));

    act(() => usePersonaStore.getState().setPersona('category'));
    act(() => usePersonaStore.getState().setPersona('ceo'));

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('does not call callback when persona is set to the same value', () => {
    const callback = vi.fn();
    renderHook(() => useResetOnPersonaChange(callback));

    act(() => usePersonaStore.getState().setPersona('ceo'));

    expect(callback).not.toHaveBeenCalled();
  });
});
