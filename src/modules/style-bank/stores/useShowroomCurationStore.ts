import { create } from 'zustand';
import type {
  ShowroomStyle,
  StyleSource,
  CurationStage,
  ShortlistDecision,
  MoodBoard,
  MoodBoardAnnotation,
  CollectionSendBack,
  ConstraintCompliance,
  CollectionProgress,
  ShowroomSummary,
} from '../types/showroom-types';
import {
  mockMoodBoards,
  mockConstraintCompliance,
  mockCollectionProgress,
  mockShowroomSummary,
  getStageGateSummary,
} from '../data/mockStyleBank';
import type { StageGateSummary } from '../data/mockStyleBank';
import { fetchDesigns, fetchDesignDetail } from '../api/api';
import type { FilterOptions, AvailableFilters } from '../api/api';
import { normalizeGarmentToShowroomStyle } from '../api/normalizers';

// ── Helper: map API available_filters → FilterOptions ────────────────────

function toFilterOptions(af: AvailableFilters): FilterOptions {
  return {
    brands: af.brands ?? [],
    categories: af.categories ?? [],
    segments: af.segments ?? [],
  };
}

// ── POD name-to-id mapping for categoryFilter ───────────────────────────

const POD_CATEGORY_MAP: Record<string, string> = {
  'Men Formal': 'MW-1',
  'Men Casual': 'MW-2',
  'Men Ethnic': 'MW-3',
  'Women Western': 'WW-1',
  'Women Ethnic': 'WW-2',
  'Kids Wear': 'KW-1',
};

interface ShowroomCurationState {
  // Current context
  activePod: string | null;
  activeSeason: string;
  activeCurationStage: CurationStage;
  activePersona: 'designer' | 'buyer' | 'category_head';

  // Style data
  styles: ShowroomStyle[];
  filteredStyles: ShowroomStyle[];

  // Mood boards
  moodBoards: MoodBoard[];
  selectedMoodBoardId: string | null;

  // Constraint validation
  compliance: ConstraintCompliance | null;

  // Collection progress
  collectionProgress: CollectionProgress[];
  showroomSummary: ShowroomSummary | null;

  // Selection
  selectedStyleId: string | null;
  multiSelectIds: string[];

  // Filters — original
  sourceFilter: StyleSource | null;
  marginFilter: 'all' | 'passing' | 'failing';
  segmentFilter: string | null;
  priceTierFilter: 'entry' | 'mid' | 'premium' | null;

  // Filters — new multi-dimensional
  categoryFilter: string | null;
  brandFilter: string | null;
  collectionFilter: string | null;

  // UI state
  showConstraintPanel: boolean;
  showMoodBoardView: boolean;
  showProgressDashboard: boolean;

  // Brand research panel
  brandResearchPanel: { isOpen: boolean; brandId: string | null };

  // Curate view tab
  curateViewTab: 'styles' | 'boards';

  // API integration
  isLoading: boolean;
  error: string | null;
  filterOptions: FilterOptions;
  currentPage: number;
  totalCount: number;
  pageSize: number;
}

interface ShowroomCurationActions {
  // Navigation
  setActivePod: (podId: string | null) => void;
  setActiveSeason: (season: string) => void;
  setActiveCurationStage: (stage: CurationStage) => void;
  setActivePersona: (persona: 'designer' | 'buyer' | 'category_head') => void;

  // Style operations
  shortlistStyle: (styleId: string, decision: ShortlistDecision, note?: string) => void;
  bulkShortlist: (styleIds: string[], decision: ShortlistDecision) => void;
  assignToMoodBoard: (styleId: string, moodBoardId: string) => void;
  selectStyle: (styleId: string | null) => void;
  toggleMultiSelect: (styleId: string) => void;
  clearMultiSelect: () => void;
  addShortlistNote: (styleId: string, note: string) => void;

  // Mood board operations
  createMoodBoard: (board: Omit<MoodBoard, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteMoodBoard: (boardId: string) => void;
  selectMoodBoard: (boardId: string | null) => void;
  convertMoodBoardToShortlist: (boardId: string) => void;
  addMoodBoardAnnotation: (boardId: string, styleId: string, note: string) => void;

  // Validation
  runConstraintCheck: () => void;

  // Filters — original
  setSourceFilter: (filter: StyleSource | null) => void;
  setMarginFilter: (filter: 'all' | 'passing' | 'failing') => void;
  setSegmentFilter: (filter: string | null) => void;
  setPriceTierFilter: (filter: 'entry' | 'mid' | 'premium' | null) => void;

  // Filters — new multi-dimensional
  setCategoryFilter: (filter: string | null) => void;
  setBrandFilter: (filter: string | null) => void;
  setCollectionFilter: (filter: string | null) => void;

  // Stage gate actions
  lockShortlist: (podId: string) => void;
  approveCollection: (podId: string) => void;
  approveWithExclusions: (podId: string, excludedStyleIds: string[]) => void;
  getStageGateSummary: (podId: string) => StageGateSummary | null;

  // Send-back
  sendBackCollection: (podId: string, generalComment: string, flaggedStyles: Array<{ styleId: string; comment: string }>) => void;

  // Brand research panel
  openBrandResearch: (brandId: string) => void;
  closeBrandResearch: () => void;

  // Curate view tab
  setCurateViewTab: (tab: 'styles' | 'boards') => void;

  // UI
  toggleConstraintPanel: () => void;
  toggleMoodBoardView: () => void;
  toggleProgressDashboard: () => void;

  // Initialize
  initializeCuration: (podId: string, season: string) => void;

  // API integration
  loadFilterOptions: () => Promise<void>;
  fetchStyles: () => Promise<void>;
  setPage: (page: number) => void;
  fetchStyleDetail: (garmentId: string) => Promise<ShowroomStyle | null>;
}

type FilterState = Pick<
  ShowroomCurationState,
  'activePod' | 'activeCurationStage' | 'sourceFilter' | 'marginFilter' | 'segmentFilter' | 'priceTierFilter' | 'categoryFilter' | 'brandFilter' | 'collectionFilter'
>;

function applyFilters(
  styles: ShowroomStyle[],
  state: FilterState
): ShowroomStyle[] {
  let result = styles;

  // activePod filter (backward compat)
  if (state.activePod) {
    result = result.filter((s) => s.podId === state.activePod);
  }

  // categoryFilter maps category name to podId
  if (state.categoryFilter) {
    const podId = POD_CATEGORY_MAP[state.categoryFilter] ?? state.categoryFilter;
    result = result.filter((s) => s.podId === podId);
  }

  // brandFilter maps to product.brandId
  if (state.brandFilter) {
    result = result.filter((s) => s.product.brandId === state.brandFilter);
  }

  // collectionFilter maps to product.collectionId
  if (state.collectionFilter) {
    result = result.filter((s) => s.product.collectionId === state.collectionFilter);
  }

  if (state.sourceFilter) {
    result = result.filter((s) => s.source === state.sourceFilter);
  }

  if (state.marginFilter === 'passing') {
    result = result.filter((s) => s.commercial.marginPass);
  } else if (state.marginFilter === 'failing') {
    result = result.filter((s) => !s.commercial.marginPass);
  }

  if (state.segmentFilter) {
    result = result.filter((s) => s.segmentId === state.segmentFilter);
  }

  if (state.priceTierFilter) {
    result = result.filter((s) => s.priceTier === state.priceTierFilter);
  }

  return result;
}

function refilter(get: () => ShowroomCurationState & ShowroomCurationActions, overrides?: Partial<FilterState>) {
  const state = get();
  const filterState: FilterState = {
    activePod: state.activePod,
    activeCurationStage: state.activeCurationStage,
    sourceFilter: state.sourceFilter,
    marginFilter: state.marginFilter,
    segmentFilter: state.segmentFilter,
    priceTierFilter: state.priceTierFilter,
    categoryFilter: state.categoryFilter,
    brandFilter: state.brandFilter,
    collectionFilter: state.collectionFilter,
    ...overrides,
  };
  return applyFilters(state.styles, filterState);
}

export const useShowroomCurationStore = create<ShowroomCurationState & ShowroomCurationActions>(
  (set, get) => ({
    // Initial state
    activePod: null,
    activeSeason: 'SS26',
    activeCurationStage: 'pool',
    activePersona: 'designer',

    styles: [],
    filteredStyles: [],

    moodBoards: mockMoodBoards,
    selectedMoodBoardId: null,

    compliance: mockConstraintCompliance,

    collectionProgress: mockCollectionProgress,
    showroomSummary: mockShowroomSummary,

    selectedStyleId: null,
    multiSelectIds: [],

    sourceFilter: null,
    marginFilter: 'all',
    segmentFilter: null,
    priceTierFilter: null,

    categoryFilter: null,
    brandFilter: null,
    collectionFilter: null,

    showConstraintPanel: false,
    showMoodBoardView: false,
    showProgressDashboard: false,

    brandResearchPanel: { isOpen: false, brandId: null },

    curateViewTab: 'styles',

    isLoading: false,
    error: null,
    filterOptions: { categories: [], brands: [], segments: [] },
    currentPage: 1,
    totalCount: 0,
    pageSize: 100,

    // ── Navigation actions ────────────────────────────────────────────────

    setActivePod: (podId) => {
      set({ activePod: podId });
      set({ filteredStyles: refilter(get, { activePod: podId }) });
    },

    setActiveSeason: (season) => set({ activeSeason: season }),

    setActiveCurationStage: (stage) => {
      set({ activeCurationStage: stage });
      set({ filteredStyles: refilter(get, { activeCurationStage: stage }) });
    },

    setActivePersona: (persona) => set({ activePersona: persona }),

    // ── Style operations ──────────────────────────────────────────────────

    shortlistStyle: (styleId, decision, note) => {
      const { activePersona, styles } = get();
      const updatedStyles = styles.map((s) => {
        if (s.product.id !== styleId) return s;

        const updated = { ...s, shortlistStatus: { ...s.shortlistStatus } };
        const now = new Date().toISOString();

        if (activePersona === 'designer') {
          updated.shortlistStatus.designer = decision;
          updated.shortlistStatus.designerNote = note;
          updated.shortlistStatus.designerAt = now;
          if (decision === 'shortlisted') updated.curationStage = 'designer_shortlist';
        } else if (activePersona === 'buyer') {
          updated.shortlistStatus.buyer = decision;
          updated.shortlistStatus.buyerNote = note;
          updated.shortlistStatus.buyerAt = now;
          if (decision === 'shortlisted') updated.curationStage = 'buyer_shortlist';
        } else {
          updated.shortlistStatus.categoryHead = decision;
          updated.shortlistStatus.categoryHeadNote = note;
          updated.shortlistStatus.categoryHeadAt = now;
          if (decision === 'shortlisted') updated.curationStage = 'final_approved';
        }

        return updated;
      });

      set({ styles: updatedStyles });
      const state = get();
      set({ filteredStyles: applyFilters(updatedStyles, state) });
    },

    bulkShortlist: (styleIds, decision) => {
      const { shortlistStyle } = get();
      styleIds.forEach((id) => shortlistStyle(id, decision));
      set({ multiSelectIds: [] });
    },

    assignToMoodBoard: (styleId, moodBoardId) => {
      const { styles, moodBoards } = get();
      const updatedStyles = styles.map((s) => {
        if (s.product.id !== styleId) return s;
        if (s.moodBoardIds.includes(moodBoardId)) return s;
        return { ...s, moodBoardIds: [...s.moodBoardIds, moodBoardId] };
      });

      const updatedBoards = moodBoards.map((b) => {
        if (b.id !== moodBoardId) return b;
        if (b.styleIds.includes(styleId)) return b;
        return { ...b, styleIds: [...b.styleIds, styleId], updatedAt: new Date().toISOString() };
      });

      set({ styles: updatedStyles, moodBoards: updatedBoards });
      const state = get();
      set({ filteredStyles: applyFilters(updatedStyles, state) });
    },

    selectStyle: (styleId) => set({ selectedStyleId: styleId, ...(styleId ? { showConstraintPanel: false } : {}) }),

    toggleMultiSelect: (styleId) => {
      const { multiSelectIds } = get();
      if (multiSelectIds.includes(styleId)) {
        set({ multiSelectIds: multiSelectIds.filter((id) => id !== styleId) });
      } else {
        set({ multiSelectIds: [...multiSelectIds, styleId] });
      }
    },

    clearMultiSelect: () => set({ multiSelectIds: [] }),

    addShortlistNote: (styleId, note) => {
      const { activePersona, styles } = get();
      const updatedStyles = styles.map((s) => {
        if (s.product.id !== styleId) return s;
        const updated = { ...s, shortlistStatus: { ...s.shortlistStatus } };
        if (activePersona === 'designer') {
          updated.shortlistStatus.designerNote = note;
        } else if (activePersona === 'buyer') {
          updated.shortlistStatus.buyerNote = note;
        } else {
          updated.shortlistStatus.categoryHeadNote = note;
        }
        return updated;
      });
      set({ styles: updatedStyles });
      const state = get();
      set({ filteredStyles: applyFilters(updatedStyles, state) });
    },

    // ── Mood board operations ─────────────────────────────────────────────

    createMoodBoard: (board) => {
      const { moodBoards } = get();
      const newBoard: MoodBoard = {
        ...board,
        id: `mb-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set({ moodBoards: [...moodBoards, newBoard] });
    },

    deleteMoodBoard: (boardId) => {
      const { moodBoards, styles } = get();
      const updatedStyles = styles.map((s) => ({
        ...s,
        moodBoardIds: s.moodBoardIds.filter((id) => id !== boardId),
      }));
      set({
        moodBoards: moodBoards.filter((b) => b.id !== boardId),
        styles: updatedStyles,
      });
      const state = get();
      set({ filteredStyles: applyFilters(updatedStyles, state) });
    },

    selectMoodBoard: (boardId) => set({ selectedMoodBoardId: boardId }),

    convertMoodBoardToShortlist: (boardId) => {
      const { moodBoards, shortlistStyle } = get();
      const board = moodBoards.find((b) => b.id === boardId);
      if (!board) return;
      board.styleIds.forEach((id) => shortlistStyle(id, 'shortlisted'));
    },

    addMoodBoardAnnotation: (boardId, styleId, note) => {
      const { moodBoards, activePersona } = get();
      const authorMap: Record<string, string> = {
        designer: 'Designer',
        buyer: 'Buyer',
        category_head: 'Category Head',
      };
      const annotation: MoodBoardAnnotation = {
        styleId,
        note,
        author: authorMap[activePersona] ?? activePersona,
        updatedAt: new Date().toISOString(),
      };

      const updatedBoards = moodBoards.map((b) => {
        if (b.id !== boardId) return b;
        return {
          ...b,
          annotations: [...b.annotations, annotation],
          updatedAt: new Date().toISOString(),
        };
      });

      set({ moodBoards: updatedBoards });
    },

    // ── Validation ────────────────────────────────────────────────────────

    runConstraintCheck: () => {
      // In a real app this would recalculate; for mock we just use the static data
      set({ compliance: mockConstraintCompliance });
    },

    // ── Filters — original ────────────────────────────────────────────────

    setSourceFilter: (filter) => {
      set({ sourceFilter: filter });
      set({ filteredStyles: refilter(get, { sourceFilter: filter }) });
    },

    setMarginFilter: (filter) => {
      set({ marginFilter: filter });
      set({ filteredStyles: refilter(get, { marginFilter: filter }) });
    },

    setSegmentFilter: (filter) => {
      set({ segmentFilter: filter });
      set({ filteredStyles: refilter(get, { segmentFilter: filter }) });
    },

    setPriceTierFilter: (filter) => {
      set({ priceTierFilter: filter });
      set({ filteredStyles: refilter(get, { priceTierFilter: filter }) });
    },

    // ── Filters — new multi-dimensional ───────────────────────────────────

    setCategoryFilter: (filter) => {
      set({ categoryFilter: filter, currentPage: 1 });
      get().fetchStyles();
    },

    setBrandFilter: (filter) => {
      set({ brandFilter: filter, currentPage: 1 });
      get().fetchStyles();
    },

    setCollectionFilter: (filter) => {
      set({ collectionFilter: filter, currentPage: 1 });
      get().fetchStyles();
    },

    // ── Stage gate actions ────────────────────────────────────────────────

    lockShortlist: (podId) => {
      const { collectionProgress } = get();
      const updatedProgress = collectionProgress.map((p) => {
        if (p.podId !== podId) return p;
        if (p.status !== 'buyer_review') return p;
        return { ...p, status: 'cat_head_review' as const };
      });
      set({ collectionProgress: updatedProgress });
    },

    approveCollection: (podId) => {
      const { collectionProgress } = get();
      const updatedProgress = collectionProgress.map((p) => {
        if (p.podId !== podId) return p;
        return { ...p, status: 'finalized' as const, completionPercentage: 100 };
      });
      set({ collectionProgress: updatedProgress });
    },

    approveWithExclusions: (podId, excludedStyleIds) => {
      const { collectionProgress, styles } = get();
      // Move excluded styles back to buyer stage
      const updatedStyles = styles.map((s) => {
        if (s.podId !== podId) return s;
        if (!excludedStyleIds.includes(s.product.id)) return s;
        return {
          ...s,
          curationStage: 'buyer_shortlist' as CurationStage,
          shortlistStatus: {
            ...s.shortlistStatus,
            categoryHead: 'rejected' as ShortlistDecision,
            categoryHeadNote: 'Excluded during final approval — returned to buyer stage',
            categoryHeadAt: new Date().toISOString(),
          },
        };
      });

      const updatedProgress = collectionProgress.map((p) => {
        if (p.podId !== podId) return p;
        return { ...p, status: 'finalized' as const, completionPercentage: 100 };
      });

      set({ styles: updatedStyles, collectionProgress: updatedProgress });
      const state = get();
      set({ filteredStyles: applyFilters(updatedStyles, state) });
    },

    getStageGateSummary: (podId) => {
      return getStageGateSummary(podId);
    },

    // ── Send-back ─────────────────────────────────────────────────────────

    sendBackCollection: (podId, generalComment, flaggedStyles) => {
      const { collectionProgress, activePersona } = get();
      const authorMap: Record<string, string> = {
        designer: 'Designer',
        buyer: 'Buyer',
        category_head: 'Category Head',
      };
      const sendBack: CollectionSendBack = {
        podId,
        generalComment,
        flaggedStyles,
        sentBackBy: authorMap[activePersona] ?? activePersona,
        sentBackAt: new Date().toISOString(),
      };

      const updatedProgress = collectionProgress.map((p) => {
        if (p.podId !== podId) return p;
        return {
          ...p,
          sendBacks: [...(p.sendBacks ?? []), sendBack],
        };
      });

      set({ collectionProgress: updatedProgress });
    },

    // ── Brand research panel ──────────────────────────────────────────────

    openBrandResearch: (brandId) => {
      set({ brandResearchPanel: { isOpen: true, brandId } });
    },

    closeBrandResearch: () => {
      set({ brandResearchPanel: { isOpen: false, brandId: null } });
    },

    // ── Curate view tab ───────────────────────────────────────────────────

    setCurateViewTab: (tab) => set({ curateViewTab: tab }),

    // ── UI toggles ────────────────────────────────────────────────────────

    toggleConstraintPanel: () => set((s) => ({ showConstraintPanel: !s.showConstraintPanel, ...(!s.showConstraintPanel ? { selectedStyleId: null } : {}) })),
    toggleMoodBoardView: () => set((s) => ({ showMoodBoardView: !s.showMoodBoardView })),
    toggleProgressDashboard: () => set((s) => ({ showProgressDashboard: !s.showProgressDashboard })),

    // ── Initialize ────────────────────────────────────────────────────────

    initializeCuration: (podId, season) => {
      set({
        activePod: podId,
        categoryFilter: null,
        brandFilter: null,
        collectionFilter: null,
        activeSeason: season,
        activeCurationStage: 'pool',
        selectedStyleId: null,
        multiSelectIds: [],
        sourceFilter: null,
        marginFilter: 'all',
        segmentFilter: null,
        priceTierFilter: null,
      });
      set({ filteredStyles: refilter(get, { activePod: podId }) });
    },

    // ── API integration actions ───────────────────────────────────────────

    loadFilterOptions: async () => {
      try {
        const res = await fetchDesigns({ limit: 1 });
        set({ filterOptions: toFilterOptions(res.available_filters) });
      } catch {
        // If the initial fetch fails, filters remain empty — fetchStyles will retry
      }
    },

    fetchStyles: async () => {
      const { categoryFilter, brandFilter, collectionFilter, currentPage, pageSize } = get();

      set({ isLoading: true, error: null });

      try {
        const res = await fetchDesigns({
          brand_names: brandFilter ? [brandFilter] : undefined,
          categories: categoryFilter ? [categoryFilter] : undefined,
          segments: collectionFilter ? [collectionFilter] : undefined,
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
        });

        const styles = res.data.map((g, i) => normalizeGarmentToShowroomStyle(g, i));

        // Update filter options — preserve the full brand list from initial load,
        // only cascade categories and segments from the filtered response
        const prev = get().filterOptions;
        set({
          styles,
          filteredStyles: styles,
          totalCount: res.total,
          filterOptions: {
            brands: prev.brands.length > 0 ? prev.brands : (res.available_filters.brands ?? []),
            categories: res.available_filters.categories ?? [],
            segments: res.available_filters.segments ?? [],
          },
          isLoading: false,
        });
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'Failed to fetch designs',
          isLoading: false,
        });
      }
    },

    setPage: (page) => {
      set({ currentPage: page });
      get().fetchStyles();
    },

    fetchStyleDetail: async (garmentId) => {
      try {
        const garment = await fetchDesignDetail(garmentId);
        if (!garment) return null;
        return normalizeGarmentToShowroomStyle(garment, 0);
      } catch (err) {
        console.error('Failed to fetch design detail:', err);
        return null;
      }
    },
  })
);
