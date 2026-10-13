import { describe, it, expect, beforeEach } from 'vitest';
import { useSidebarStore } from '@/hooks/useSidebarStore';

describe('useSidebarStore', () => {
  beforeEach(() => {
    useSidebarStore.setState({ isCollapsed: false });
  });

  it('has sidebar expanded by default', () => {
    expect(useSidebarStore.getState().isCollapsed).toBe(false);
  });

  it('collapses sidebar via setCollapsed', () => {
    useSidebarStore.getState().setCollapsed(true);
    expect(useSidebarStore.getState().isCollapsed).toBe(true);
  });

  it('expands sidebar via setCollapsed', () => {
    useSidebarStore.setState({ isCollapsed: true });
    useSidebarStore.getState().setCollapsed(false);
    expect(useSidebarStore.getState().isCollapsed).toBe(false);
  });

  it('toggles sidebar state', () => {
    expect(useSidebarStore.getState().isCollapsed).toBe(false);

    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().isCollapsed).toBe(true);

    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().isCollapsed).toBe(false);
  });
});
