import { describe, it, expect, beforeEach } from 'vitest';
import { useNavigationStore } from '@/hooks/useNavigationStore';

describe('useNavigationStore', () => {
  beforeEach(() => {
    useNavigationStore.setState({
      activeProductId: null,
      isL2PanelCollapsed: false,
    });
  });

  describe('default state', () => {
    it('has activeProductId as null by default', () => {
      expect(useNavigationStore.getState().activeProductId).toBeNull();
    });

    it('has isL2PanelCollapsed as false by default', () => {
      expect(useNavigationStore.getState().isL2PanelCollapsed).toBe(false);
    });
  });

  describe('setActiveProduct', () => {
    it('sets activeProductId to the provided id', () => {
      useNavigationStore.getState().setActiveProduct('product-42');
      expect(useNavigationStore.getState().activeProductId).toBe('product-42');
    });

    it('clears activeProductId when set to null', () => {
      useNavigationStore.getState().setActiveProduct('product-42');
      useNavigationStore.getState().setActiveProduct(null);
      expect(useNavigationStore.getState().activeProductId).toBeNull();
    });
  });

  describe('setL2PanelCollapsed', () => {
    it('sets isL2PanelCollapsed to true', () => {
      useNavigationStore.getState().setL2PanelCollapsed(true);
      expect(useNavigationStore.getState().isL2PanelCollapsed).toBe(true);
    });

    it('sets isL2PanelCollapsed to false', () => {
      useNavigationStore.setState({ isL2PanelCollapsed: true });
      useNavigationStore.getState().setL2PanelCollapsed(false);
      expect(useNavigationStore.getState().isL2PanelCollapsed).toBe(false);
    });
  });

  describe('toggleL2Panel', () => {
    it('toggles from false to true', () => {
      useNavigationStore.getState().toggleL2Panel();
      expect(useNavigationStore.getState().isL2PanelCollapsed).toBe(true);
    });

    it('toggles from true to false', () => {
      useNavigationStore.setState({ isL2PanelCollapsed: true });
      useNavigationStore.getState().toggleL2Panel();
      expect(useNavigationStore.getState().isL2PanelCollapsed).toBe(false);
    });

    it('toggles multiple times correctly', () => {
      const { toggleL2Panel } = useNavigationStore.getState();
      toggleL2Panel();
      expect(useNavigationStore.getState().isL2PanelCollapsed).toBe(true);
      toggleL2Panel();
      expect(useNavigationStore.getState().isL2PanelCollapsed).toBe(false);
      toggleL2Panel();
      expect(useNavigationStore.getState().isL2PanelCollapsed).toBe(true);
    });
  });
});
