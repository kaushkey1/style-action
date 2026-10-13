import { create } from 'zustand';

interface RangeState {
  // ─── UI State ───
  fiscalYear: string;
  season: string;
  selectedPodId: string | null;
  selectedStoreId: string | null;
  selectedBrickId: string | null;
  activeTab: 'network' | 'store-range' | 'segment-mix' | 'hierarchy' | 'space-planning' | 'performance';
  storeSubTab: 'range-plan' | 'fixture-map' | 'price-ladder' | 'carryover' | 'competitive-gaps';
  adminTab: 'range-params' | 'fashion-split' | 'price-ladder' | 'carryover' | 'ext-brands';

  // ─── Selection State ───
  selectedHit: string | null;
  selectedSegmentCode: string | null;
  selectedFamilyCode: string | null;
  bricksPage: number;
  bricksPageSize: number;

  // ─── Actions ───
  setActiveTab: (tab: RangeState['activeTab']) => void;
  setStoreSubTab: (tab: RangeState['storeSubTab']) => void;
  setAdminTab: (tab: RangeState['adminTab']) => void;
  selectPod: (podId: string | null) => void;
  selectStore: (storeId: string | null) => void;
  selectBrick: (brickId: string | null) => void;
  selectHit: (hit: string) => void;
  selectSegment: (segmentCode: string) => void;
  selectFamily: (familyCode: string) => void;
  setBricksPage: (page: number) => void;
  setBricksPageSize: (pageSize: number) => void;
  resetSegmentData: () => void;
  resetFamilyData: () => void;
}

export const useRangeStore = create<RangeState>((set) => ({
  // ─── UI State ───
  fiscalYear: 'FY 2026-27',
  season: 'SS26',
  selectedPodId: null,
  selectedStoreId: null,
  selectedBrickId: null,
  activeTab: 'network',
  storeSubTab: 'range-plan',
  adminTab: 'range-params',

  // ─── Selection State ───
  selectedHit: null,
  selectedSegmentCode: null,
  selectedFamilyCode: null,
  bricksPage: 1,
  bricksPageSize: 10,

  // ─── Actions ───
  setActiveTab: (tab) => set({ activeTab: tab }),
  setStoreSubTab: (tab) => set({ storeSubTab: tab }),
  setAdminTab: (tab) => set({ adminTab: tab }),
  selectPod: (podId) => set({ selectedPodId: podId }),
  selectStore: (storeId) => set({ selectedStoreId: storeId }),
  selectBrick: (brickId) => set({ selectedBrickId: brickId }),

  selectHit: (hit: string) => {
    set({ selectedHit: hit });
  },

  selectSegment: (segmentCode: string) => {
    set({ selectedSegmentCode: segmentCode });
  },

  selectFamily: (familyCode: string) => {
    set({ selectedFamilyCode: familyCode });
  },

  setBricksPage: (page: number) => {
    set({ bricksPage: page });
  },

  setBricksPageSize: (pageSize: number) => {
    set({ bricksPageSize: pageSize, bricksPage: 1 });
  },

  resetSegmentData: () => {
    set({
      selectedSegmentCode: null,
      selectedFamilyCode: null,
    });
  },

  resetFamilyData: () => {
    set({
      selectedFamilyCode: null,
      bricksPage: 1,
      bricksPageSize: 10,
    });
  },
}));
