import { describe, it, expect, beforeEach } from 'vitest';
import { usePersonaStore } from '@/hooks/usePersonaStore';

describe('usePersonaStore', () => {
  beforeEach(() => {
    usePersonaStore.setState({ personaId: 'ceo' });
  });

  it('has default persona of "ceo"', () => {
    const state = usePersonaStore.getState();
    expect(state.personaId).toBe('ceo');
  });

  it('sets persona via setPersona', () => {
    usePersonaStore.getState().setPersona('category');
    expect(usePersonaStore.getState().personaId).toBe('category');
  });

  it('updates persona multiple times', () => {
    const { setPersona } = usePersonaStore.getState();
    setPersona('category');
    expect(usePersonaStore.getState().personaId).toBe('category');

    setPersona('ceo');
    expect(usePersonaStore.getState().personaId).toBe('ceo');
  });
});
