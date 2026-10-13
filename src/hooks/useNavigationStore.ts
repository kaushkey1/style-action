import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface NavigationState {
  activeProductId: string | null;
  setActiveProduct: (id: string | null) => void;

  isL2PanelCollapsed: boolean;
  setL2PanelCollapsed: (collapsed: boolean) => void;
  toggleL2Panel: () => void;

  // Mobile navigation state (NOT persisted)
  isMobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;

  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  isAskImpetusOpen: boolean;
  setAskImpetusOpen: (open: boolean) => void;

  isProductSwitcherOpen: boolean;
  setProductSwitcherOpen: (open: boolean) => void;

  isProfileSheetOpen: boolean;
  setProfileSheetOpen: (open: boolean) => void;

  // AI chat state (NOT persisted — session only)
  chatMessages: ChatMessage[];
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  clearChatMessages: () => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      activeProductId: null,
      setActiveProduct: (id) => set({ activeProductId: id }),

      isL2PanelCollapsed: false,
      setL2PanelCollapsed: (collapsed) => set({ isL2PanelCollapsed: collapsed }),
      toggleL2Panel: () => set((state) => ({ isL2PanelCollapsed: !state.isL2PanelCollapsed })),

      // Mobile navigation state
      isMobileMenuOpen: false,
      openMobileMenu: () => set({ isMobileMenuOpen: true }),
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),

      isSearchOpen: false,
      setSearchOpen: (open) => set({ isSearchOpen: open }),

      isAskImpetusOpen: false,
      setAskImpetusOpen: (open) => set({ isAskImpetusOpen: open }),

      isProductSwitcherOpen: false,
      setProductSwitcherOpen: (open) => set({ isProductSwitcherOpen: open }),

      isProfileSheetOpen: false,
      setProfileSheetOpen: (open) => set({ isProfileSheetOpen: open }),

      // AI chat state
      chatMessages: [],
      addChatMessage: (role, content) =>
        set((state) => ({
          chatMessages: [
            ...state.chatMessages,
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, content, timestamp: Date.now() },
          ],
        })),
      clearChatMessages: () => set({ chatMessages: [] }),
    }),
    {
      name: 'impetus-nav',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => sessionStorage.removeItem(name),
      },
      partialize: (state) => ({
        activeProductId: state.activeProductId,
      } as unknown as NavigationState),
    },
  ),
);
