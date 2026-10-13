import { create } from 'zustand';
import { mockActions, type ActionRecord } from '../data/mockActionHistory';

interface ActionHistoryState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  actions: ActionRecord[];
  cancelAction: (id: string) => void;
}

export const useActionHistoryStore = create<ActionHistoryState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  actions: mockActions,
  cancelAction: (id) =>
    set((s) => ({
      actions: s.actions.map((a) =>
        a.id === id ? { ...a, status: 'cancelled' as const, executionTime: 'Cancelled' } : a,
      ),
    })),
}));
