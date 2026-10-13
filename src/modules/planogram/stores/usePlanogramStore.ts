import { create } from 'zustand';
import type {
  BrandFilter,
  SummaryData,
  UploadHistoryItem,
  UploadStatus,
  UploadResult,
} from '../types/planogram.types';
import {
  fetchPlanogramFilters,
  fetchPlanogramSummary,
  downloadPlanogram,
  uploadPlanogram,
  fetchUploadHistory,
} from '../api/planogramApi';

interface PlanogramStore {
  // Brand selection
  brands: BrandFilter[];
  selectedBrandId: string | null;
  brandsLoading: boolean;
  brandsError: string | null;

  // Summary
  summary: SummaryData | null;
  summaryLoading: boolean;
  summaryError: string | null;

  // Upload state machine
  uploadStatus: UploadStatus;
  uploadResult: UploadResult | null;
  abortController: AbortController | null;

  // Download
  downloading: boolean;

  // Upload history
  uploadHistory: UploadHistoryItem[];
  historyLoading: boolean;
  historyError: string | null;
  historyPage: number;
  historyPageSize: number;
  historyHasMore: boolean;

  // Tab
  activeTab: 'upload' | 'history';

  // Actions
  loadBrands: () => Promise<void>;
  selectBrand: (brandId: string) => void;
  loadSummary: (brandId: string) => Promise<void>;
  downloadExcel: () => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  cancelUpload: () => void;
  resetUpload: () => void;
  loadUploadHistory: () => Promise<void>;
  setHistoryPage: (page: number) => void;
  setHistoryPageSize: (size: number) => void;
  setActiveTab: (tab: 'upload' | 'history') => void;
}

export const usePlanogramStore = create<PlanogramStore>((set, get) => ({
  // Initial state
  brands: [],
  selectedBrandId: null,
  brandsLoading: false,
  brandsError: null,

  summary: null,
  summaryLoading: false,
  summaryError: null,

  uploadStatus: 'idle',
  uploadResult: null,
  abortController: null,

  downloading: false,

  uploadHistory: [],
  historyLoading: false,
  historyError: null,
  historyPage: 1,
  historyPageSize: 10,
  historyHasMore: false,

  activeTab: 'upload',

  // ── Actions ──────────────────────────────────────────────────────

  loadBrands: async () => {
    set({ brandsLoading: true, brandsError: null });
    try {
      const data = await fetchPlanogramFilters();
      set({ brands: data.brands, brandsLoading: false });
    } catch {
      set({ brandsLoading: false, brandsError: 'Failed to load brands. Please try again.' });
    }
  },

  selectBrand: (brandId: string) => {
    set({ selectedBrandId: brandId, summary: null, uploadStatus: 'idle', uploadResult: null });
    get().loadSummary(brandId);
  },

  loadSummary: async (brandId: string) => {
    set({ summaryLoading: true, summaryError: null });
    try {
      const data = await fetchPlanogramSummary(brandId);
      set({ summary: data, summaryLoading: false });
    } catch {
      set({ summaryLoading: false, summaryError: 'Failed to load summary.' });
    }
  },

  downloadExcel: async () => {
    const brandId = get().selectedBrandId;
    if (!brandId) return;
    set({ downloading: true });
    try {
      await downloadPlanogram(brandId);
    } catch {
      // apiFetchBlob handles the download; errors are rare
    } finally {
      set({ downloading: false });
    }
  },

  uploadFile: async (file: File) => {
    const brandId = get().selectedBrandId;
    if (!brandId) return;

    const controller = new AbortController();
    set({
      uploadStatus: 'uploading',
      uploadResult: { file: { name: file.name, size: file.size } },
      abortController: controller,
    });

    const result = await uploadPlanogram(file, brandId, controller.signal);

    // If the request was aborted, don't update state (cancelUpload already reset it)
    if (controller.signal.aborted) return;

    if (result.success) {
      set({
        uploadStatus: 'success',
        uploadResult: {
          file: { name: file.name, size: file.size },
          successData: result.data,
        },
        abortController: null,
      });
      // Refresh summary since data changed
      const brandId = get().selectedBrandId;
      if (brandId) {
        get().loadSummary(brandId);
      }
    } else if (result.validationErrors) {
      set({
        uploadStatus: 'validation_error',
        uploadResult: {
          file: { name: file.name, size: file.size },
          validationErrors: result.validationErrors,
          totalRows: result.validationErrors.total_rows,
          errorMessage: result.errorMessage,
        },
        abortController: null,
      });
    } else {
      set({
        uploadStatus: 'server_error',
        uploadResult: {
          file: { name: file.name, size: file.size },
          errorMessage: result.errorMessage,
        },
        abortController: null,
      });
    }
  },

  cancelUpload: () => {
    const controller = get().abortController;
    if (controller) controller.abort();
    set({ uploadStatus: 'idle', uploadResult: null, abortController: null });
  },

  resetUpload: () => {
    set({ uploadStatus: 'idle', uploadResult: null, abortController: null });
  },

  loadUploadHistory: async () => {
    const { historyPage, historyPageSize } = get();
    const offset = (historyPage - 1) * historyPageSize;
    set({ historyLoading: true, historyError: null });
    try {
      // Fetch one extra to detect if there's a next page
      const data = await fetchUploadHistory({ limit: historyPageSize + 1, offset });
      const hasMore = data.uploads.length > historyPageSize;
      const uploads = hasMore ? data.uploads.slice(0, historyPageSize) : data.uploads;
      set({ uploadHistory: uploads, historyHasMore: hasMore, historyLoading: false });
    } catch {
      set({ historyLoading: false, historyError: 'Failed to load upload history.' });
    }
  },

  setHistoryPage: (page: number) => {
    set({ historyPage: page });
    get().loadUploadHistory();
  },

  setHistoryPageSize: (size: number) => {
    set({ historyPageSize: size, historyPage: 1 });
    get().loadUploadHistory();
  },

  setActiveTab: (tab: 'upload' | 'history') => {
    set({ activeTab: tab });
    if (tab === 'history') {
      get().loadUploadHistory();
    }
  },
}));
