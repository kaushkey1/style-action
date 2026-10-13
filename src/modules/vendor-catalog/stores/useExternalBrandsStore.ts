import { create } from 'zustand';
import type {
  Slot,
  BrandStyle,
  Session,
  MatchResult,
  FilterState,
  SortState,
  CenterView,
  CoverageMetrics,
  BrandConcentration,
} from '../types/external-brands.types';
import {
  matchStylesWithSlots,
  sortMatches,
  groupMatchesBySlot,
  groupMatchesByStyle,
} from '../utils/matchEngine';
import { mockSessions, mockSlots, mockStyles } from '../data/mockExternalBrands';

interface ExternalBrandsState {
  // Core Data
  session: Session | null;
  slots: Slot[];
  styles: BrandStyle[];
  matches: MatchResult[];

  // UI State
  centerView: CenterView;
  selectedSlotId: string | null;
  selectedStyleId: string | null;
  detailPanelStyleId: string | null;
  expandedDrops: Set<string>;
  expandedBricks: Set<string>;

  // Filters & Sort
  filterState: FilterState;
  sortState: SortState;

  // Derived Data
  slotMatches: Map<string, MatchResult[]>;
  styleMatches: Map<string, MatchResult[]>;
  coverageMetrics: CoverageMetrics;
  brandConcentrations: BrandConcentration[];

  // Actions
  loadSession: (sessionId?: string) => void;
  setCenterView: (view: CenterView) => void;
  selectSlot: (slotId: string | null) => void;
  selectStyle: (styleId: string | null) => void;
  openStyleDetail: (styleId: string | null) => void;
  closeStyleDetail: () => void;
  toggleDropExpansion: (dropId: string) => void;
  toggleBrickExpansion: (brick: string) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
  updateSort: (sort: Partial<SortState>) => void;

  // Style Actions
  confirmStyle: (styleId: string, slotId: string) => void;
  rejectStyle: (styleId: string, slotId: string) => void;
  manuallyShortlistStyle: (styleId: string, slotId: string) => void;
  removeManualShortlist: (styleId: string, slotId: string) => void;

  // Slot Actions
  markSlotAsGap: (slotId: string) => void;
  unmarkSlotAsGap: (slotId: string) => void;
  lockSlot: (slotId: string) => void;
  unlockSlot: (slotId: string) => void;

  // Utility
  refreshMatches: () => void;
  calculateCoverage: () => void;
  calculateBrandConcentrations: () => void;
}

export const useExternalBrandsStore = create<ExternalBrandsState>((set, get) => ({
  // Initial State
  session: null,
  slots: [],
  styles: [],
  matches: [],

  centerView: 'session-overview',
  selectedSlotId: null,
  selectedStyleId: null,
  detailPanelStyleId: null,
  expandedDrops: new Set(['Drop 1']),
  expandedBricks: new Set(),

  filterState: {
    brands: [],
    bricks: [],
    fashionGrades: [],
    priceBands: {},
    statuses: [],
    similarity: {},
    drops: [],
  },

  sortState: {
    field: 'similarity',
    direction: 'desc',
  },

  slotMatches: new Map(),
  styleMatches: new Map(),
  coverageMetrics: {
    totalSlots: 0,
    coveredSlots: 0,
    partialSlots: 0,
    pendingSlots: 0,
    acceptedGaps: 0,
    emptySlots: 0,
    confirmedStyles: 0,
    pendingStyles: 0,
  },
  brandConcentrations: [],

  // Actions
  loadSession: (sessionId?: string) => {
    const session = sessionId
      ? mockSessions.find(s => s.id === sessionId) || mockSessions[0]
      : mockSessions[0];

    if (!session) return;

    const slots = mockSlots;
    const styles = mockStyles;
    const matches = matchStylesWithSlots(styles, slots);

    set({
      session,
      slots,
      styles,
      matches: sortMatches(matches),
      slotMatches: groupMatchesBySlot(matches),
      styleMatches: groupMatchesByStyle(matches),
    });

    get().calculateCoverage();
    get().calculateBrandConcentrations();
  },

  setCenterView: (view) => set({ centerView: view }),

  selectSlot: (slotId) => {
    set({
      selectedSlotId: slotId,
      centerView: slotId ? 'matches' : get().centerView,
    });
  },

  selectStyle: (styleId) => set({ selectedStyleId: styleId }),

  openStyleDetail: (styleId) => set({ detailPanelStyleId: styleId }),

  closeStyleDetail: () => set({ detailPanelStyleId: null }),

  toggleDropExpansion: (dropId) => {
    const expanded = new Set(get().expandedDrops);
    if (expanded.has(dropId)) {
      expanded.delete(dropId);
    } else {
      expanded.add(dropId);
    }
    set({ expandedDrops: expanded });
  },

  toggleBrickExpansion: (brick) => {
    const expanded = new Set(get().expandedBricks);
    if (expanded.has(brick)) {
      expanded.delete(brick);
    } else {
      expanded.add(brick);
    }
    set({ expandedBricks: expanded });
  },

  updateFilters: (filters) => {
    set({ filterState: { ...get().filterState, ...filters } });
  },

  updateSort: (sort) => {
    set({ sortState: { ...get().sortState, ...sort } });
  },

  confirmStyle: (styleId, slotId) => {
    const { slots, styles } = get();

    // Update style state
    const styleIndex = styles.findIndex(s => s.id === styleId);
    const style = styles[styleIndex];
    if (styleIndex !== -1 && style) {
      const updatedStyles = [...styles];
      updatedStyles[styleIndex] = {
        ...style,
        state: 'confirmed',
      };

      // Update slot state
      const slotIndex = slots.findIndex(s => s.id === slotId);
      const slot = slots[slotIndex];
      if (slotIndex !== -1 && slot) {
        const updatedSlots = [...slots];
        const match = get().matches.find(m => m.styleId === styleId && m.slotId === slotId);

        if (match) {
          // Add to shortlist
          const existingShortlist = slot.shortlist.filter(
            sm => sm.styleId !== styleId
          );

          updatedSlots[slotIndex] = {
            ...slot,
            state: 'covered',
            shortlist: [
              ...existingShortlist,
              {
                styleId,
                score: match.score,
                state: 'confirmed',
                breakdown: match.breakdown,
                bestFitSlot: slotId,
                alternateSlots: [],
                confirmedAt: new Date(),
                confirmedBy: 'current-user',
              },
            ],
          };
        }

        set({ styles: updatedStyles, slots: updatedSlots });
        get().refreshMatches();
      }
    }
  },

  rejectStyle: (styleId, slotId) => {
    const { slots, styles } = get();

    // Update style state
    const styleIndex = styles.findIndex(s => s.id === styleId);
    const style = styles[styleIndex];
    if (styleIndex !== -1 && style) {
      const updatedStyles = [...styles];
      updatedStyles[styleIndex] = {
        ...style,
        state: 'rejected',
      };

      // Remove from slot shortlist
      const slotIndex = slots.findIndex(s => s.id === slotId);
      const slot = slots[slotIndex];
      if (slotIndex !== -1 && slot) {
        const updatedSlots = [...slots];
        const filteredShortlist = slot.shortlist.filter(sm => sm.styleId !== styleId);

        // Update slot state if no confirmed styles
        const hasConfirmed = filteredShortlist.some(sm => sm.state === 'confirmed');

        updatedSlots[slotIndex] = {
          ...slot,
          shortlist: filteredShortlist,
          state: hasConfirmed ? slot.state : 'empty',
        };

        set({ styles: updatedStyles, slots: updatedSlots });
        get().refreshMatches();
      }
    }
  },

  manuallyShortlistStyle: (styleId, slotId) => {
    const { slots, styles } = get();

    // Update style state
    const styleIndex = styles.findIndex(s => s.id === styleId);
    const style = styles[styleIndex];
    if (styleIndex !== -1 && style) {
      const updatedStyles = [...styles];
      updatedStyles[styleIndex] = {
        ...style,
        state: 'manually_shortlisted',
      };

      // Add to slot shortlist
      const slotIndex = slots.findIndex(s => s.id === slotId);
      const slot = slots[slotIndex];
      if (slotIndex !== -1 && slot) {
        const updatedSlots = [...slots];
        const match = get().matches.find(m => m.styleId === styleId && m.slotId === slotId);

        if (match) {
          const existingShortlist = slot.shortlist.filter(
            sm => sm.styleId !== styleId
          );

          updatedSlots[slotIndex] = {
            ...slot,
            shortlist: [
              ...existingShortlist,
              {
                styleId,
                score: match.score,
                state: 'manually_shortlisted',
                breakdown: match.breakdown,
                bestFitSlot: slotId,
                alternateSlots: [],
              },
            ],
          };
        }

        set({ styles: updatedStyles, slots: updatedSlots });
        get().refreshMatches();
      }
    }
  },

  removeManualShortlist: (styleId, slotId) => {
    const { slots } = get();

    // Remove from slot shortlist
    const slotIndex = slots.findIndex(s => s.id === slotId);
    const slot = slots[slotIndex];
    if (slotIndex !== -1 && slot) {
      const updatedSlots = [...slots];
      updatedSlots[slotIndex] = {
        ...slot,
        shortlist: slot.shortlist.filter(sm => sm.styleId !== styleId),
      };

      set({ slots: updatedSlots });
      get().refreshMatches();
    }
  },

  markSlotAsGap: (slotId) => {
    const { slots } = get();
    const slotIndex = slots.findIndex(s => s.id === slotId);
    const slot = slots[slotIndex];

    if (slotIndex !== -1 && slot) {
      const updatedSlots = [...slots];
      updatedSlots[slotIndex] = {
        ...slot,
        state: 'accepted_gap',
      };

      set({ slots: updatedSlots });
      get().calculateCoverage();
    }
  },

  unmarkSlotAsGap: (slotId) => {
    const { slots } = get();
    const slotIndex = slots.findIndex(s => s.id === slotId);
    const slot = slots[slotIndex];

    if (slotIndex !== -1 && slot) {
      const updatedSlots = [...slots];
      updatedSlots[slotIndex] = {
        ...slot,
        state: 'empty',
      };

      set({ slots: updatedSlots });
      get().calculateCoverage();
    }
  },

  lockSlot: (slotId) => {
    const { slots } = get();
    const slotIndex = slots.findIndex(s => s.id === slotId);
    const slot = slots[slotIndex];

    if (slotIndex !== -1 && slot) {
      const updatedSlots = [...slots];
      const currentState = slot.state;

      updatedSlots[slotIndex] = {
        ...slot,
        isLocked: true,
        state: currentState === 'covered' ? 'locked_covered' : 'locked_partial',
      };

      set({ slots: updatedSlots });
    }
  },

  unlockSlot: (slotId) => {
    const { slots } = get();
    const slotIndex = slots.findIndex(s => s.id === slotId);
    const slot = slots[slotIndex];

    if (slotIndex !== -1 && slot) {
      const updatedSlots = [...slots];
      const currentState = slot.state;

      updatedSlots[slotIndex] = {
        ...slot,
        isLocked: false,
        state: currentState === 'locked_covered' ? 'covered' :
               currentState === 'locked_partial' ? 'partial' : currentState,
      };

      set({ slots: updatedSlots });
    }
  },

  refreshMatches: () => {
    const { styles, slots } = get();
    const matches = matchStylesWithSlots(styles, slots);

    set({
      matches: sortMatches(matches),
      slotMatches: groupMatchesBySlot(matches),
      styleMatches: groupMatchesByStyle(matches),
    });

    get().calculateCoverage();
    get().calculateBrandConcentrations();
  },

  calculateCoverage: () => {
    const { slots, styles } = get();

    const metrics: CoverageMetrics = {
      totalSlots: slots.length,
      coveredSlots: slots.filter(s => s.state === 'covered' || s.state === 'locked_covered').length,
      partialSlots: slots.filter(s => s.state === 'partial' || s.state === 'locked_partial').length,
      pendingSlots: slots.filter(s => s.state === 'auto_shortlist_pending').length,
      acceptedGaps: slots.filter(s => s.state === 'accepted_gap').length,
      emptySlots: slots.filter(s => s.state === 'empty').length,
      confirmedStyles: styles.filter(s => s.state === 'confirmed' || s.state === 'locked').length,
      pendingStyles: styles.filter(s =>
        s.state === 'auto_shortlisted' ||
        s.state === 'manually_shortlisted'
      ).length,
    };

    set({ coverageMetrics: metrics });
  },

  calculateBrandConcentrations: () => {
    const { styles } = get();

    const confirmedStyles = styles.filter(s => s.state === 'confirmed' || s.state === 'locked');
    const brandCounts = new Map<string, number>();

    confirmedStyles.forEach(style => {
      brandCounts.set(style.brand, (brandCounts.get(style.brand) || 0) + 1);
    });

    const totalConfirmed = confirmedStyles.length;

    const concentrations: BrandConcentration[] = Array.from(brandCounts.entries()).map(([brand, count]) => ({
      brand,
      confirmedCount: count,
      percentageOfCategory: totalConfirmed > 0 ? (count / totalConfirmed) * 100 : 0,
      cap: 30, // Default 30% cap
      isOverCap: totalConfirmed > 0 ? (count / totalConfirmed) * 100 > 30 : false,
    }));

    set({ brandConcentrations: concentrations });
  },
}));