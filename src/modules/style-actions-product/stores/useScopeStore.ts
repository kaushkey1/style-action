import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ScopeState {
  /** Snapshot chosen by the user; null means "latest ready". */
  snapshotId: string | null;
  /** Store shown by single-store screens (Options, Lifecycle). */
  storeCode: string | null;
  setSnapshot: (snapshotId: string | null) => void;
  setStore: (storeCode: string) => void;
}

export const useScopeStore = create<ScopeState>()(
  persist(
    (set) => ({
      snapshotId: null,
      storeCode: null,
      setSnapshot: (snapshotId) => set({ snapshotId }),
      setStore: (storeCode) => set({ storeCode }),
    }),
    { name: 'style-actions-product:scope' },
  ),
);
