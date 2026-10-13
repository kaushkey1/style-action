import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePersonaConfig } from '@/hooks/usePersonaConfig';
import { usePersonaStore } from '@/hooks/usePersonaStore';

describe('usePersonaConfig', () => {
  beforeEach(() => {
    usePersonaStore.setState({ personaId: 'ceo' });
  });

  it('returns config for the current persona', () => {
    const configs = { ceo: { label: 'CEO View' }, 'head-buying': { label: 'Buying View' } };
    const { result } = renderHook(() => usePersonaConfig(configs));

    expect(result.current).toEqual({ label: 'CEO View' });
  });

  it('falls back to first available config if current persona not configured', () => {
    usePersonaStore.setState({ personaId: 'head-buying' as never });
    const configs = { ceo: { label: 'CEO View' } };
    const { result } = renderHook(() => usePersonaConfig(configs));

    expect(result.current).toEqual({ label: 'CEO View' });
  });

  it('throws when no config and no fallback', () => {
    usePersonaStore.setState({ personaId: 'head-buying' as never });
    expect(() => {
      renderHook(() => usePersonaConfig({}));
    }).toThrow('no config for persona');
  });
});
