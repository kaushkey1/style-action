import { create } from 'zustand';
import type { Exception } from '@/modules/exceptions/data/mockExceptions';
import type { CriticalKpiDecision } from '../data/mockDecisionData';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DecisionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'snoozed'
  | 'delegated'
  | 'auto-resolved';

export type DecisionItem =
  | { kind: 'exception'; data: Exception; decisionStatus: DecisionStatus }
  | { kind: 'kpi'; data: CriticalKpiDecision; decisionStatus: DecisionStatus };

export interface RejectionReason {
  reason: string;
  note?: string;
}

export interface SnoozeEntry {
  itemId: string;
  until: string; // ISO timestamp
}

export interface DelegationEntry {
  itemId: string;
  delegateeName: string;
  delegateeRole: string;
  note?: string;
}

interface DecisionQueueState {
  // Status overrides (pending → approved/rejected/snoozed/delegated)
  statusOverrides: Record<string, DecisionStatus>;
  rejectionReasons: Record<string, RejectionReason>;
  snoozedItems: SnoozeEntry[];
  delegations: Record<string, DelegationEntry>;
  comments: Record<string, string[]>;

  // Collapsed state (after approve/reject, card collapses to 48px)
  collapsedItems: Set<string>;

  // Overflow visibility
  showOverflow: boolean;

  // Actions
  approveItem: (id: string) => void;
  rejectItem: (id: string, reason: RejectionReason) => void;
  snoozeItem: (id: string, until: string) => void;
  delegateItem: (id: string, delegation: Omit<DelegationEntry, 'itemId'>) => void;
  addComment: (id: string, comment: string) => void;
  cancelAction: (id: string) => void;
  collapseItem: (id: string) => void;
  toggleOverflow: () => void;
  getStatus: (id: string) => DecisionStatus;
}

export const useDecisionQueueStore = create<DecisionQueueState>((set, get) => ({
  statusOverrides: {},
  rejectionReasons: {},
  snoozedItems: [],
  delegations: {},
  comments: {},
  collapsedItems: new Set(),
  showOverflow: false,

  approveItem: (id) =>
    set((s) => ({
      statusOverrides: { ...s.statusOverrides, [id]: 'approved' },
    })),

  rejectItem: (id, reason) =>
    set((s) => ({
      statusOverrides: { ...s.statusOverrides, [id]: 'rejected' },
      rejectionReasons: { ...s.rejectionReasons, [id]: reason },
    })),

  snoozeItem: (id, until) =>
    set((s) => ({
      statusOverrides: { ...s.statusOverrides, [id]: 'snoozed' },
      snoozedItems: [...s.snoozedItems, { itemId: id, until }],
    })),

  delegateItem: (id, delegation) =>
    set((s) => ({
      statusOverrides: { ...s.statusOverrides, [id]: 'delegated' },
      delegations: { ...s.delegations, [id]: { ...delegation, itemId: id } },
    })),

  addComment: (id, comment) =>
    set((s) => ({
      comments: {
        ...s.comments,
        [id]: [...(s.comments[id] ?? []), comment],
      },
    })),

  cancelAction: (id) =>
    set((s) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _s, ...restOverrides } = s.statusOverrides;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _r, ...restReasons } = s.rejectionReasons;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _d, ...restDelegations } = s.delegations;
      const newCollapsed = new Set(s.collapsedItems);
      newCollapsed.delete(id);
      return {
        statusOverrides: restOverrides,
        rejectionReasons: restReasons,
        delegations: restDelegations,
        snoozedItems: s.snoozedItems.filter((si) => si.itemId !== id),
        collapsedItems: newCollapsed,
      };
    }),

  collapseItem: (id) =>
    set((s) => {
      const newSet = new Set(s.collapsedItems);
      newSet.add(id);
      return { collapsedItems: newSet };
    }),

  toggleOverflow: () => set((s) => ({ showOverflow: !s.showOverflow })),

  getStatus: (id) => get().statusOverrides[id] ?? 'pending',
}));
