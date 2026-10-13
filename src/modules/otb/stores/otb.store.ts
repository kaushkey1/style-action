import { create } from 'zustand';
import type {
  OTBBudget,
  OTBLineItem,
  ChaseRecommendation,
  ChaseHistory,
  MicroDrop,
  MicroDropSignal,
  OTBReallocation,
  OTBConfig,
  OTBReconciliation,
  SellThroughTriage,
  TestLot,
  FashionOptionLifecycle,
  VendorScorecard,
  TriageClassification,
} from '../types/otb.types';
import {
  mockOTBBudget,
  mockOTBLineItems,
  mockChaseRecommendations,
  mockChaseHistory,
  mockMicroDrops,
  mockMicroDropSignals,
  mockReallocations,
  mockOTBConfig,
  mockReconciliations,
  mockSellThroughTriage,
  mockTestLots,
  mockFashionLifecycle,
  mockVendorScorecards,
} from '../data/mockOTB';

interface OTBState {
  fiscalYear: string;
  half: 'H1' | 'H2' | 'FY';

  budget: OTBBudget | null;
  lineItems: OTBLineItem[];

  chaseRecommendations: ChaseRecommendation[];
  chaseHistory: ChaseHistory[];

  microDrops: MicroDrop[];
  microDropSignals: MicroDropSignal[];

  reallocations: OTBReallocation[];

  reconciliations: OTBReconciliation[];
  triageItems: SellThroughTriage[];
  testLots: TestLot[];
  fashionLifecycle: FashionOptionLifecycle[];
  vendorScorecards: VendorScorecard[];

  config: OTBConfig;

  activeTab: 'dashboard' | 'pod-detail' | 'chase' | 'fashion' | 'utilization';
  selectedPodId: string | null;
  selectedStoreId: string | null;
}

interface OTBActions {
  setActiveTab: (tab: OTBState['activeTab']) => void;
  selectPod: (podId: string | null) => void;
  selectStore: (storeId: string | null) => void;

  approveChase: (recommendationId: string) => void;
  rejectChase: (recommendationId: string) => void;
  approveAllP1: () => void;

  approveMicroDrop: (dropId: string) => void;
  dismissSignal: (signalId: string) => void;

  approveReallocation: (reallocationId: string) => void;
  rejectReallocation: (reallocationId: string) => void;

  updateConfig: (config: Partial<OTBConfig>) => void;

  lockBudget: () => void;
  createPOFromChase: (recommendationId: string) => void;
  modifyReallocation: (reallocationId: string, newAmount: number) => void;

  classifyTriage: (id: string, classification: TriageClassification) => void;
  updateTestLotSignal: (id: string, signal: 'green' | 'amber' | 'red') => void;
  confirmTestLotClassification: (id: string, classification: TriageClassification) => void;
  triggerCascade: (optionId: string) => void;
  flagAntiRotation: (optionId: string, storeId: string) => void;

  updatePurchaseValue: (lineItemId: string, newValue: number, reason?: string) => void;
  approveEdit: (lineItemId: string) => void;
  rejectEdit: (lineItemId: string) => void;
}

export const useOTBStore = create<OTBState & OTBActions>((set) => ({
  fiscalYear: (() => {
    const year = new Date().getFullYear();
    return `FY ${year}-${String(year + 1).slice(2)}`;
  })(),
  half: 'H1',

  budget: mockOTBBudget,
  lineItems: mockOTBLineItems,

  chaseRecommendations: mockChaseRecommendations,
  chaseHistory: mockChaseHistory,

  microDrops: mockMicroDrops,
  microDropSignals: mockMicroDropSignals,

  reallocations: mockReallocations,

  reconciliations: mockReconciliations,
  triageItems: mockSellThroughTriage,
  testLots: mockTestLots,
  fashionLifecycle: mockFashionLifecycle,
  vendorScorecards: mockVendorScorecards,

  config: mockOTBConfig,

  activeTab: 'dashboard',
  selectedPodId: null,
  selectedStoreId: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  selectPod: (podId) => set({ selectedPodId: podId }),
  selectStore: (storeId) => set({ selectedStoreId: storeId }),

  approveChase: (recommendationId) =>
    set((state) => ({
      chaseRecommendations: state.chaseRecommendations.map((rec) =>
        rec.id === recommendationId
          ? { ...rec, status: 'approved', approvedBy: 'Current User', approvedAt: new Date().toISOString() }
          : rec
      ),
    })),

  rejectChase: (recommendationId) =>
    set((state) => ({
      chaseRecommendations: state.chaseRecommendations.map((rec) =>
        rec.id === recommendationId
          ? { ...rec, status: 'rejected' }
          : rec
      ),
    })),

  approveAllP1: () =>
    set((state) => ({
      chaseRecommendations: state.chaseRecommendations.map((rec) =>
        rec.priority === 'P1' && rec.status === 'pending'
          ? { ...rec, status: 'approved', approvedBy: 'Current User', approvedAt: new Date().toISOString() }
          : rec
      ),
    })),

  approveMicroDrop: (dropId) =>
    set((state) => ({
      microDrops: state.microDrops.map((drop) =>
        drop.id === dropId ? { ...drop, status: 'approved' } : drop
      ),
    })),

  dismissSignal: (signalId) =>
    set((state) => ({
      microDropSignals: state.microDropSignals.filter((s) => s.id !== signalId),
    })),

  approveReallocation: (reallocationId) =>
    set((state) => ({
      reallocations: state.reallocations.map((r) =>
        r.id === reallocationId
          ? { ...r, status: 'approved', approvedBy: 'Current User' }
          : r
      ),
    })),

  rejectReallocation: (reallocationId) =>
    set((state) => ({
      reallocations: state.reallocations.map((r) =>
        r.id === reallocationId ? { ...r, status: 'rejected' } : r
      ),
    })),

  updateConfig: (configUpdate) =>
    set((state) => ({
      config: { ...state.config, ...configUpdate },
    })),

  lockBudget: () =>
    set((state) => ({
      budget: state.budget
        ? { ...state.budget, status: 'locked' as const, lockedAt: new Date().toISOString() }
        : state.budget,
    })),

  createPOFromChase: (recommendationId) =>
    set((state) => ({
      chaseRecommendations: state.chaseRecommendations.map((rec) =>
        rec.id === recommendationId && rec.status === 'approved'
          ? { ...rec, status: 'po-created' as const }
          : rec
      ),
    })),

  modifyReallocation: (reallocationId, newAmount) =>
    set((state) => ({
      reallocations: state.reallocations.map((r) =>
        r.id === reallocationId && r.status === 'recommended'
          ? { ...r, amount: newAmount }
          : r
      ),
    })),

  classifyTriage: (id, classification) =>
    set((state) => ({
      triageItems: state.triageItems.map((item) =>
        item.id === id
          ? { ...item, classification, status: 'action-taken' as const }
          : item
      ),
    })),

  updateTestLotSignal: (id, signal) =>
    set((state) => ({
      testLots: state.testLots.map((lot) =>
        lot.id === id ? { ...lot, day7Signal: signal } : lot
      ),
    })),

  confirmTestLotClassification: (id, classification) =>
    set((state) => ({
      testLots: state.testLots.map((lot) =>
        lot.id === id
          ? {
              ...lot,
              day14Classification: classification,
              status: classification === 'winner' ? 'winner-scaling' as const : 'killed' as const,
            }
          : lot
      ),
    })),

  triggerCascade: (optionId) =>
    set((state) => ({
      fashionLifecycle: state.fashionLifecycle.map((opt) => {
        if (opt.optionId !== optionId) return opt;
        const stageOrder: Array<typeof opt.currentStage> = ['a0-a1-fresh', 'a2-a3-cascade', 'liquidation', 'written-off'];
        const currentIdx = stageOrder.indexOf(opt.currentStage);
        const nextStage = currentIdx >= 0 && currentIdx < stageOrder.length - 1
          ? stageOrder[currentIdx + 1] ?? opt.currentStage
          : opt.currentStage;
        return { ...opt, currentStage: nextStage };
      }),
    })),

  flagAntiRotation: (optionId, storeId) =>
    set((state) => ({
      fashionLifecycle: state.fashionLifecycle.map((opt) =>
        opt.optionId === optionId
          ? {
              ...opt,
              storePositions: opt.storePositions.map((pos) =>
                pos.storeId === storeId
                  ? { ...pos, antiRotationFlag: true }
                  : pos
              ),
            }
          : opt
      ),
    })),

  updatePurchaseValue: (lineItemId, newValue, reason) =>
    set((state) => ({
      lineItems: state.lineItems.map((item) => {
        if (item.id !== lineItemId) return item;
        const variancePct = item.recommendedValue > 0
          ? Math.round(((newValue - item.recommendedValue) / item.recommendedValue) * 1000) / 10
          : 0;
        const requiresApproval = Math.abs(variancePct) > 10;
        const edit = {
          id: `edit-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          actor: 'Current User',
          actorRole: 'Category Buyer',
          oldValue: item.purchaseValue,
          newValue,
          variancePct,
          requiresApproval,
          status: requiresApproval ? 'pending' as const : 'auto-approved' as const,
          reason,
        };
        return {
          ...item,
          purchaseValue: newValue,
          editStatus: requiresApproval ? 'pending-approval' as const : 'none' as const,
          editHistory: [...item.editHistory, edit],
        };
      }),
    })),

  approveEdit: (lineItemId) =>
    set((state) => ({
      lineItems: state.lineItems.map((item) => {
        if (item.id !== lineItemId) return item;
        const updatedHistory = item.editHistory.map((edit, idx) =>
          idx === item.editHistory.length - 1 && edit.status === 'pending'
            ? { ...edit, status: 'approved' as const, approvedBy: 'VP Merchandising', approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) }
            : edit
        );
        return { ...item, editStatus: 'none' as const, editHistory: updatedHistory };
      }),
    })),

  rejectEdit: (lineItemId) =>
    set((state) => ({
      lineItems: state.lineItems.map((item) => {
        if (item.id !== lineItemId) return item;
        const lastPending = [...item.editHistory].reverse().find((e) => e.status === 'pending');
        const revertValue = lastPending ? lastPending.oldValue : item.purchaseValue;
        const updatedHistory = item.editHistory.map((edit, idx) =>
          idx === item.editHistory.length - 1 && edit.status === 'pending'
            ? { ...edit, status: 'rejected' as const }
            : edit
        );
        return { ...item, purchaseValue: revertValue, editStatus: 'none' as const, editHistory: updatedHistory };
      }),
    })),
}));
