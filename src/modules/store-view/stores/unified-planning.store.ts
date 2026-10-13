import { create } from 'zustand';
import type {
  UnifiedPlanningState,
  ViewMode,
  Store,
  StoreGrade,
  CategoryDetails,
} from '../types/unified-planning.types';
import { generateStores } from '../data/mockStoreGenerator';

const generateMockCategoryDetails = (categoryId: string): CategoryDetails => {
  const categoryData: Record<string, Partial<CategoryDetails>> = {
    'mens-casual': {
      otbBudget: { current: 42, target: 100, percentage: 42 },
      targetLayer: { base: 24.28, baseChange: 25.3, mid: 18.45, midChange: 22, top: 14.18, topChange: -5, totalPercentage: 44 },
      proposition: { target: 215000, achieved: 385000, percentage: 84, lyComparison: 8.8 },
    },
    'mens-formal': {
      otbBudget: { current: 38, target: 100, percentage: 38 },
      targetLayer: { base: 18.92, baseChange: 18.2, mid: 15.67, midChange: 12, top: 11.45, topChange: 3, totalPercentage: 52 },
      proposition: { target: 180000, achieved: 295000, percentage: 78, lyComparison: 5.2 },
    },
    'womens-ethnic': {
      otbBudget: { current: 56, target: 100, percentage: 56 },
      targetLayer: { base: 32.15, baseChange: 32.1, mid: 24.88, midChange: 28, top: 18.92, topChange: 8, totalPercentage: 68 },
      proposition: { target: 285000, achieved: 425000, percentage: 92, lyComparison: 12.4 },
    },
    'womens-western': {
      otbBudget: { current: 45, target: 100, percentage: 45 },
      targetLayer: { base: 22.45, baseChange: 15.8, mid: 18.32, midChange: 10, top: 12.78, topChange: -2, totalPercentage: 48 },
      proposition: { target: 195000, achieved: 312000, percentage: 82, lyComparison: 6.8 },
    },
    'kids-wear': {
      otbBudget: { current: 35, target: 100, percentage: 35 },
      targetLayer: { base: 15.88, baseChange: 12.5, mid: 12.45, midChange: 8, top: 8.92, topChange: -4, totalPercentage: 38 },
      proposition: { target: 125000, achieved: 185000, percentage: 72, lyComparison: 4.2 },
    },
  };

  const baseData = categoryData[categoryId] || {};

  return {
    otbBudget: baseData.otbBudget || { current: 40, target: 100, percentage: 40 },
    targetLayer: baseData.targetLayer || {
      base: 20.78, baseChange: 25.3, mid: 32.48, midChange: 22, top: 14.18, topChange: -5, totalPercentage: 44,
    },
    buyingParallels: { planned: 17.98, actual: 9.98, variance: 8, percentage: 100 },
    rangeStructure: {
      totalOptions: 44145,
      newOptions: 32000,
      carryForward: 12145,
      distribution: [
        { label: '< ₹1 K', percentage: 18, color: 'var(--color-primary-700)' },
        { label: '₹1 K-2 K', percentage: 32, color: '#3b82f6' },
        { label: '₹2 K-3 K', percentage: 28, color: '#6366f1' },
        { label: '₹3 K+', percentage: 22, color: '#9ca3af' },
      ],
    },
    proposition: baseData.proposition || { target: 215000, achieved: 385000, percentage: 88, lyComparison: 8.8 },
    ftpTrends: [
      { name: 'Ornamental Silhouettes', value: 67, color: 'var(--color-primary-700)' },
      { name: 'Sustainable Cotton', value: 51, color: '#3b82f6' },
      { name: 'Classic Solids', value: 31, color: '#6366f1' },
      { name: 'Textured Weaves', value: 15, color: '#8b5cf6' },
      { name: 'Minimal Prints', value: 6, color: '#9ca3af' },
    ],
    storyPerformance: { ay: 113, al: 100, at: 87, as: 81 },
    optionMix: [
      { name: 'Core Basics', total: 1686, classic: 75, fashionBase: 15, fashionPulse: 7, fastFashion: 3 },
      { name: 'Seasonal', total: 4190, classic: 25, fashionBase: 45, fashionPulse: 20, fastFashion: 10 },
      { name: 'Fashion Forward', total: 2875, classic: 10, fashionBase: 25, fashionPulse: 45, fastFashion: 20 },
      { name: 'Trend Driven', total: 2849, classic: 5, fashionBase: 15, fashionPulse: 35, fastFashion: 45 },
    ],
    grades: ['Premium', 'Standard', 'Value', 'Economy'],
    gradeOptions: [
      { name: 'Premium Collection', values: [{ grade: 'Premium', value: 8200, color: 'var(--color-primary-700)' }, { grade: 'Standard', value: 5200, color: '#3b82f6' }] },
      { name: 'Core Range', values: [{ grade: 'Premium', value: 4800, color: 'var(--color-primary-700)' }, { grade: 'Standard', value: 6500, color: '#3b82f6' }, { grade: 'Value', value: 3200, color: '#6366f1' }] },
      { name: 'Entry Level', values: [{ grade: 'Standard', value: 3200, color: '#3b82f6' }, { grade: 'Value', value: 5500, color: '#6366f1' }, { grade: 'Economy', value: 4100, color: '#9ca3af' }] },
    ],
  };
};

const generatedStores = generateStores(2147);

const initialState: UnifiedPlanningState = {
  viewMode: 'store',
  networkMetrics: {
    totalStores: generatedStores.length,
    networkNPI: 128.28,
    sell: 104.8,
    lyGrowth: 20.8,
    idGap: 40.98,
    fillRate: 83,
  },
  categories: [
    { id: 'mens-casual', name: 'Mens Casual', itemCount: 1894, storeCount: 1045, lastSeasonItems: 10345, potentialNPI: 28.45, recoNPI: 105.3, ctrSth: 18.28, overOpn: 2839, score: 85 },
    { id: 'mens-formal', name: 'Mens Formal', itemCount: 1884, storeCount: 890, lastSeasonItems: 8500, potentialNPI: 22.78, recoNPI: 104.4, ctrSth: 14.88, overOpn: 2467, score: 82 },
    { id: 'womens-ethnic', name: 'Womens Ethnic', itemCount: 1946, storeCount: 1120, lastSeasonItems: 12000, potentialNPI: 38.92, recoNPI: 108.7, ctrSth: 24.98, overOpn: 3287, score: 92 },
    { id: 'womens-western', name: 'Womens Western', itemCount: 2098, storeCount: 950, lastSeasonItems: 9800, potentialNPI: 32.68, recoNPI: 106.2, ctrSth: 21.45, overOpn: 2952, score: 88 },
    { id: 'kids-wear', name: 'Kids Wear', itemCount: 1300, storeCount: 780, lastSeasonItems: 6500, potentialNPI: 18.58, recoNPI: 103.6, ctrSth: 12.18, overOpn: 1868, score: 78 },
  ],
  expandedCategoryId: null,
  categoryDetails: {},
  stores: generatedStores,
  selectedStoreId: null,
  expandedStoreId: null,
  selectedGrades: [],
  isLoading: false,
};

interface UnifiedPlanningActions {
  setViewMode: (mode: ViewMode) => void;
  toggleCategory: (categoryId: string) => void;
  toggleStore: (storeId: string) => void;
  selectStore: (storeId: string | null, storeData?: Partial<Store> | null) => void;
  toggleGradeFilter: (grade: StoreGrade) => void;
  loadCategoryDetails: (categoryId: string) => void;
  updateOTBBudget: (categoryId: string, percentage: number) => void;
  updateStoreGrade: (storeId: string, grade: StoreGrade) => void;
  getCategoryAggregates: () => {
    totalItems: number;
    totalStores: number;
    avgNPI: number;
    totalPotentialNPI: number;
    avgRecoNPI: number;
    totalCtrSth: number;
    totalOverOpn: number;
  };
  getStoreAggregates: () => {
    totalStores: number;
    totalRevenue: number;
    totalPotentialNPI: number;
    avgRecoNPI: number;
    totalCtrSth: number;
    totalOptions: number;
    avgScore: number;
  };
}

export interface StorePlanogramEntry {
  store_code: string;
  store_name: string;
  floor_name: string;
  floor_index: number;
  gcs_path: string;
  dg2n_url: string;
  status: string;
}

export const useUnifiedPlanningStore = create<UnifiedPlanningState & UnifiedPlanningActions & { expandedStoreId: string | null; selectedStoreData: Partial<Store> | null; storePlanogram: StorePlanogramEntry[]; setStorePlanogram: (planogram: StorePlanogramEntry[]) => void }>(
  (set, get) => ({
    ...initialState,
    expandedStoreId: null,
    selectedStoreData: null,
    storePlanogram: [],
    setStorePlanogram: (planogram) => set({ storePlanogram: planogram }),

    setViewMode: (mode) => {
      const planningModes = ['space'];
      set({
        viewMode: mode,
        expandedCategoryId: null,
        expandedStoreId: null,
        ...(planningModes.includes(mode) ? { selectedStoreId: null } : {}),
      });
    },

    toggleCategory: (categoryId) => {
      const { expandedCategoryId, categoryDetails } = get();
      if (expandedCategoryId === categoryId) {
        set({ expandedCategoryId: null });
      } else {
        if (!categoryDetails[categoryId]) {
          set((state) => ({
            categoryDetails: { ...state.categoryDetails, [categoryId]: generateMockCategoryDetails(categoryId) },
          }));
        }
        set({ expandedCategoryId: categoryId });
      }
    },

    toggleStore: (storeId) => {
      const { expandedStoreId } = get();
      set({ expandedStoreId: expandedStoreId === storeId ? null : storeId });
    },

    selectStore: (storeId, storeData) => set({ selectedStoreId: storeId, selectedStoreData: storeData ?? null, ...(!storeId ? { storePlanogram: [] } : {}) }),

    toggleGradeFilter: (grade) => {
      const { selectedGrades } = get();
      if (selectedGrades.includes(grade)) {
        set({ selectedGrades: selectedGrades.filter((g) => g !== grade) });
      } else {
        set({ selectedGrades: [...selectedGrades, grade] });
      }
    },

    loadCategoryDetails: (categoryId) => {
      const { categoryDetails } = get();
      if (!categoryDetails[categoryId]) {
        set((state) => ({
          categoryDetails: { ...state.categoryDetails, [categoryId]: generateMockCategoryDetails(categoryId) },
        }));
      }
    },

    updateStoreGrade: (storeId, grade) => {
      set((state) => ({
        stores: state.stores.map((s) => (s.id === storeId ? { ...s, grade } : s)),
      }));
    },

    updateOTBBudget: (categoryId, percentage) => {
      const { categoryDetails } = get();
      const existingDetails = categoryDetails[categoryId];
      if (!existingDetails) return;

      set({
        categoryDetails: {
          ...categoryDetails,
          [categoryId]: {
            ...existingDetails,
            otbBudget: { ...existingDetails.otbBudget, percentage, current: percentage },
          },
        },
      });
    },

    getCategoryAggregates: () => {
      const { categories } = get();
      return {
        totalItems: categories.reduce((sum, c) => sum + c.itemCount, 0),
        totalStores: categories.reduce((sum, c) => sum + c.storeCount, 0),
        avgNPI: categories.reduce((sum, c) => sum + c.potentialNPI, 0) / categories.length,
        totalPotentialNPI: categories.reduce((sum, c) => sum + c.potentialNPI, 0),
        avgRecoNPI: categories.reduce((sum, c) => sum + c.recoNPI, 0) / categories.length,
        totalCtrSth: categories.reduce((sum, c) => sum + c.ctrSth, 0),
        totalOverOpn: categories.reduce((sum, c) => sum + c.overOpn, 0),
      };
    },

    getStoreAggregates: () => {
      const { stores } = get();
      return {
        totalStores: stores.length,
        totalRevenue: stores.reduce((sum, s) => sum + (s.monthlyRevenue ?? 0), 0),
        totalPotentialNPI: stores.reduce((sum, s) => sum + s.potentialNPI, 0),
        avgRecoNPI: stores.reduce((sum, s) => sum + s.recoNPI, 0) / stores.length,
        totalCtrSth: stores.reduce((sum, s) => sum + s.ctrSth, 0),
        totalOptions: stores.reduce((sum, s) => sum + s.options, 0),
        avgScore: stores.reduce((sum, s) => sum + s.score, 0) / stores.length,
      };
    },
  })
);
