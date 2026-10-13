import { create } from 'zustand';
import type {
  CycleStatus,
  ChannelId,
  Measure,
  PlanningCycle,
  PlanningGridRow,
  PlanningException,
  PlanningScenario,
  ReviewEntry,
  AuditEntry,
  UserTask,
  NewStoreProjection,
  ExceptionStatus,
  ProjectionMethod,
  StoreClassification,
  CategoryAllocation,
  ChannelTargetInput,
} from '../types/aopPlanning.types';
import { VALID_TRANSITIONS } from '../types/aopPlanning.types';
import type { NewStoreInput } from '../components/AddNewStoreDialog';
import { PLAN_MONTHS } from '../data/mockChannels';
import { buildMockGrid } from '../data/mockPlanningGrid';
import { SEASONALITY_WEIGHTS, getGuardrailBand, computeGuardrailStatus } from '../data/mockGuardrails';
import { MOCK_CYCLES } from '../data/mockCycles';
import { MOCK_PLANNING_GRID } from '../data/mockPlanningGrid';
import { MOCK_EXCEPTIONS } from '../data/mockExceptions';
import { MOCK_SCENARIOS } from '../data/mockScenarios';
import { MOCK_NEW_STORE_PROJECTIONS } from '../data/mockNewStoreProjections';
import { MOCK_AUDIT_ENTRIES, MOCK_REVIEWS, MOCK_USER_TASKS } from '../data/mockAuditHistory';

interface AOPPlanningState {
  cycles: PlanningCycle[];
  activeCycleId: string | null;
  gridRows: PlanningGridRow[];
  activeChannelId: ChannelId;
  activeMeasure: Measure;
  expandedRowIds: string[];
  expandedGolyRowIds: string[];
  exceptions: PlanningException[];
  scenarios: PlanningScenario[];
  reviews: ReviewEntry[];
  auditLog: AuditEntry[];
  userTasks: UserTask[];
  newStoreProjections: NewStoreProjection[];
  exceptionsDrawerOpen: boolean;
  selectedNewStoreId: string | null;
  selectedStoreForCategory: string | null;
  classificationFilter: StoreClassification | 'ALL';
  searchQuery: string;
  lastSavedAt: string | null;
  isDirty: boolean;

  setActiveCycle: (cycleId: string | null) => void;
  setActiveChannel: (channelId: ChannelId) => void;
  setActiveMeasure: (measure: Measure) => void;
  toggleRowExpanded: (rowId: string) => void;
  toggleGolyExpanded: (rowId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setClassificationFilter: (filter: StoreClassification | 'ALL') => void;
  setSearchQuery: (query: string) => void;

  pinCell: (rowId: string, monthId: string, newValue: number) => void;
  unpinCell: (rowId: string, monthId: string) => void;

  transitionCycleStatus: (cycleId: string, newStatus: CycleStatus) => boolean;

  acknowledgeException: (exceptionId: string) => void;
  resolveException: (exceptionId: string) => void;
  toggleExceptionsDrawer: () => void;

  selectNewStore: (storeId: string | null) => void;
  setProjectionMethod: (storeId: string, method: ProjectionMethod) => void;
  acknowledgeProjection: (storeId: string) => void;

  addReview: (entry: Omit<ReviewEntry, 'id'>) => void;
  addNewStore: (input: NewStoreInput) => void;
  setActiveScenario: (scenarioId: string) => void;
  selectStoreForCategory: (storeId: string | null) => void;
  updateCategoryAllocation: (storeId: string, allocations: CategoryAllocation[]) => void;
  createScenario: (name: string, type: 'base' | 'optimistic' | 'conservative', growthMod: number, gmMod: number) => void;
  generatePlan: (targets: ChannelTargetInput[], seasonWeights: number[]) => void;
  saveDraft: () => void;
  createCycle: (name: string, fiscalYear: string) => void;
  hydrate: (payload: {
    cycle?: PlanningCycle;
    gridRows?: PlanningGridRow[];
    exceptions?: PlanningException[];
  }) => void;
}

export const useAOPPlanningStore = create<AOPPlanningState>((set, get) => ({
  cycles: MOCK_CYCLES,
  activeCycleId: 'cycle-1',
  gridRows: MOCK_PLANNING_GRID,
  activeChannelId: 'EBO',
  activeMeasure: 'net_sales',
  expandedRowIds: MOCK_PLANNING_GRID.filter((r) => r.level !== 'store').map((r) => r.id),
  expandedGolyRowIds: [],
  exceptions: MOCK_EXCEPTIONS,
  scenarios: MOCK_SCENARIOS,
  reviews: MOCK_REVIEWS,
  auditLog: MOCK_AUDIT_ENTRIES,
  userTasks: MOCK_USER_TASKS,
  newStoreProjections: MOCK_NEW_STORE_PROJECTIONS,
  exceptionsDrawerOpen: false,
  selectedNewStoreId: null,
  selectedStoreForCategory: null,
  classificationFilter: 'ALL',
  searchQuery: '',
  lastSavedAt: null,
  isDirty: false,

  setActiveCycle: (cycleId) => set({ activeCycleId: cycleId }),
  setActiveChannel: (channelId) => set({ activeChannelId: channelId }),
  setActiveMeasure: (measure) => set({ activeMeasure: measure }),

  toggleRowExpanded: (rowId) =>
    set((state) => {
      const isExpanded = state.expandedRowIds.includes(rowId);
      return {
        expandedRowIds: isExpanded
          ? state.expandedRowIds.filter((id) => id !== rowId)
          : [...state.expandedRowIds, rowId],
      };
    }),

  toggleGolyExpanded: (rowId) =>
    set((state) => {
      const isExpanded = state.expandedGolyRowIds.includes(rowId);
      return {
        expandedGolyRowIds: isExpanded
          ? state.expandedGolyRowIds.filter((id) => id !== rowId)
          : [...state.expandedGolyRowIds, rowId],
      };
    }),

  expandAll: () =>
    set((state) => ({
      expandedRowIds: state.gridRows.map((r) => r.id),
    })),

  collapseAll: () => set({ expandedRowIds: ['total'] }),

  setClassificationFilter: (filter) => set({ classificationFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  pinCell: (rowId, monthId, newValue) =>
    set((state) => {
      const rowIndex = state.gridRows.findIndex((r) => r.id === rowId);
      if (rowIndex === -1) return state;

      const row = state.gridRows[rowIndex];
      if (!row) return state;

      const pinnedMonthIndex = row.months.findIndex((m) => m.monthId === monthId);
      if (pinnedMonthIndex === -1) return state;
      const pinnedMonth = row.months[pinnedMonthIndex];
      // Actual (elapsed) months are locked and cannot be edited or re-phased into.
      if (!pinnedMonth || pinnedMonth.isActual) return state;

      const oldFyTotal = row.fyTotal;
      // Adjustable = not the edited cell, not user-pinned, not a locked actual.
      const isAdjustable = (m: (typeof row.months)[number], i: number): boolean =>
        i !== pinnedMonthIndex && !m.isPinned && !m.isActual;
      // Hold the sum of NON-ACTUAL months constant: actual months are fixed facts and
      // stay out of the redistribution pool (matches the backend redistribution).
      const nonActualOldSum = row.months.reduce((s, m) => (m.isActual ? s : s + m.value), 0);
      const fixedNonActualSum = row.months.reduce(
        (s, m, i) => (i !== pinnedMonthIndex && !m.isActual && m.isPinned ? s + m.value : s),
        0,
      );
      const remaining = nonActualOldSum - newValue - fixedNonActualSum;
      const adjustableIdx = row.months
        .map((m, i) => (isAdjustable(m, i) ? i : -1))
        .filter((i) => i >= 0);
      const nonPinnedSum = adjustableIdx.reduce((s, i) => s + (row.months[i]?.value ?? 0), 0);

      const newMonths = row.months.map((m, i) => {
        // Only the edited cell is marked edited; auto-adjusted months keep their flag.
        if (i === pinnedMonthIndex) {
          return { ...m, value: newValue, isPinned: true, isEdited: true };
        }
        if (!isAdjustable(m, i)) return m;
        const proportion = nonPinnedSum > 0 ? m.value / nonPinnedSum : 1 / adjustableIdx.length;
        return { ...m, value: Math.round(remaining * proportion * 100) / 100 };
      });

      // Absorb the 2-dp rounding residual on the largest adjustable month so the row's
      // FY total is held exactly constant (matches the backend redistribution).
      if (adjustableIdx.length > 0) {
        const sum = newMonths.reduce((s, m) => s + m.value, 0);
        const diff = Math.round((oldFyTotal - sum) * 100) / 100;
        if (Math.abs(diff) >= 0.01) {
          let largestIdx = -1;
          let largestVal = -Infinity;
          for (const i of adjustableIdx) {
            const v = newMonths[i]?.value ?? 0;
            if (v > largestVal) {
              largestVal = v;
              largestIdx = i;
            }
          }
          const largestMonth = largestIdx >= 0 ? newMonths[largestIdx] : undefined;
          if (largestMonth) {
            newMonths[largestIdx] = {
              ...largestMonth,
              value: Math.round((largestMonth.value + diff) * 100) / 100,
            };
          }
        }
      }

      const updatedRows = [...state.gridRows];
      const newFyTotal = newMonths.reduce((s, m) => s + m.value, 0);
      updatedRows[rowIndex] = { ...row, months: newMonths, fyTotal: Math.round(newFyTotal * 100) / 100 };

      function reaggregate(parentId: string | null): void {
        if (!parentId) return;
        const pIdx = updatedRows.findIndex((r) => r.id === parentId);
        if (pIdx === -1) return;
        const parent = updatedRows[pIdx];
        if (!parent) return;
        const children = updatedRows.filter((r) => r.parentId === parentId);
        const aggMonths = PLAN_MONTHS.map((m) => {
          const val = children.reduce((s, r) => s + (r.months.find((mc) => mc.monthId === m.id)?.value ?? 0), 0);
          const py = children.reduce((s, r) => s + (r.months.find((mc) => mc.monthId === m.id)?.priorYear ?? 0), 0);
          return { monthId: m.id, value: Math.round(val * 100) / 100, isPinned: false, isEdited: false, priorYear: Math.round(py * 100) / 100 };
        });
        const fy = aggMonths.reduce((s, m) => s + m.value, 0);
        const prior = aggMonths.reduce((s, m) => s + m.priorYear, 0);
        const growth = prior > 0 ? ((fy - prior) / prior) * 100 : 0;
        updatedRows[pIdx] = {
          ...parent,
          months: aggMonths,
          fyTotal: Math.round(fy * 100) / 100,
          priorYearTotal: Math.round(prior * 100) / 100,
          growthPct: Math.round(growth * 10) / 10,
          guardrailStatus: computeGuardrailStatus(growth, parent.guardrailBand),
        };
        reaggregate(parent.parentId);
      }
      reaggregate(row.parentId);

      return { gridRows: updatedRows, isDirty: true };
    }),

  unpinCell: (rowId, monthId) =>
    set((state) => {
      const rowIndex = state.gridRows.findIndex((r) => r.id === rowId);
      if (rowIndex === -1) return state;

      const row = state.gridRows[rowIndex];
      if (!row) return state;

      const newMonths = row.months.map((m) =>
        m.monthId === monthId ? { ...m, isPinned: false } : m,
      );

      const updatedRows = [...state.gridRows];
      updatedRows[rowIndex] = { ...row, months: newMonths };
      return { gridRows: updatedRows };
    }),

  transitionCycleStatus: (cycleId, newStatus) => {
    const state = get();
    const cycle = state.cycles.find((c) => c.id === cycleId);
    if (!cycle) return false;

    const validNext = VALID_TRANSITIONS[cycle.status];
    if (!validNext.includes(newStatus)) return false;

    if (newStatus === 'SUBMITTED') {
      const hardCount = state.exceptions.filter(
        (e) => e.cycleId === cycleId && e.severity === 'hard' && e.status === 'open',
      ).length;
      if (hardCount > 0) return false;
    }

    const now = new Date().toISOString();
    set((s) => ({
      cycles: s.cycles.map((c) => {
        if (c.id !== cycleId) return c;
        return {
          ...c,
          status: newStatus,
          updatedAt: now,
          submittedAt: newStatus === 'SUBMITTED' ? now : c.submittedAt,
          approvedAt: newStatus === 'APPROVED' ? now : c.approvedAt,
          lockedAt: newStatus === 'LOCKED' ? now : c.lockedAt,
          promotedAt: newStatus === 'PROMOTED' ? now : c.promotedAt,
        };
      }),
    }));
    return true;
  },

  acknowledgeException: (exceptionId) =>
    set((state) => ({
      exceptions: state.exceptions.map((e) =>
        e.id === exceptionId ? { ...e, status: 'acknowledged' as ExceptionStatus } : e,
      ),
    })),

  resolveException: (exceptionId) =>
    set((state) => ({
      exceptions: state.exceptions.map((e) =>
        e.id === exceptionId
          ? { ...e, status: 'resolved' as ExceptionStatus, resolvedBy: 'User', resolvedAt: new Date().toISOString() }
          : e,
      ),
    })),

  toggleExceptionsDrawer: () =>
    set((state) => ({ exceptionsDrawerOpen: !state.exceptionsDrawerOpen })),

  selectNewStore: (storeId) => set({ selectedNewStoreId: storeId }),

  setProjectionMethod: (storeId, method) =>
    set((state) => ({
      newStoreProjections: state.newStoreProjections.map((p) =>
        p.storeId === storeId ? { ...p, selectedMethod: method } : p,
      ),
    })),

  acknowledgeProjection: (storeId) =>
    set((state) => ({
      newStoreProjections: state.newStoreProjections.map((p) =>
        p.storeId === storeId
          ? { ...p, isAcknowledged: true, acknowledgedBy: 'User', acknowledgedAt: new Date().toISOString() }
          : p,
      ),
    })),

  addReview: (entry) =>
    set((state) => ({
      reviews: [...state.reviews, { ...entry, id: `rev-${state.reviews.length + 1}` }],
    })),

  setActiveScenario: (scenarioId) =>
    set((state) => ({
      scenarios: state.scenarios.map((s) => ({ ...s, isActive: s.id === scenarioId })),
      cycles: state.cycles.map((c) =>
        c.id === state.activeCycleId ? { ...c, activeScenarioId: scenarioId } : c,
      ),
    })),

  addNewStore: (input) =>
    set((state) => {
      const storeId = `new-${Date.now()}`;
      const activeWeights = SEASONALITY_WEIGHTS.slice(input.openingMonthIndex);
      const activeWeightSum = activeWeights.reduce((a, b) => a + b, 0);

      const primaryTarget = input.selectedMethod === 'waterfall'
        ? input.waterfallAnnualTarget
        : ((): number => {
            const refStore = state.gridRows.find((r) => r.id === input.referenceStoreId);
            return refStore ? refStore.fyTotal * (input.referenceAdjustmentPct / 100) : input.waterfallAnnualTarget;
          })();

      const months = PLAN_MONTHS.map((m, i) => {
        if (i < input.openingMonthIndex) {
          return { monthId: m.id, value: 0, isPinned: false, isEdited: false, priorYear: 0 };
        }
        const weight = SEASONALITY_WEIGHTS[i] ?? 1;
        const value = Math.round((primaryTarget * weight) / activeWeightSum * 100) / 100;
        return { monthId: m.id, value, isPinned: false, isEdited: false, priorYear: 0 };
      });

      const fyTotal = months.reduce((s, m) => s + m.value, 0);
      const band = getGuardrailBand(input.grade);

      const newRow: PlanningGridRow = {
        id: storeId,
        level: 'store',
        label: `${input.name} — ${input.city}`,
        parentId: `${input.channelId}-${input.category}`,
        channelId: input.channelId,
        storeClassification: 'NEW',
        storeGrade: input.grade,
        isNewStore: true,
        months,
        fyTotal: Math.round(fyTotal * 100) / 100,
        priorYearTotal: 0,
        growthPct: 0,
        guardrailStatus: computeGuardrailStatus(0, band),
        guardrailBand: band,
        gmPct: 12.0,
        grossMargin: Math.round(fyTotal * 0.12 * 100) / 100,
        categoryAllocations: [],
      };

      const refStore = state.gridRows.find((r) => r.id === input.referenceStoreId);
      const refAnnual = refStore ? refStore.fyTotal * (input.referenceAdjustmentPct / 100) : 0;
      const refActiveWeightSum = activeWeightSum;
      const refMonths = PLAN_MONTHS.map((_, i) => {
        if (i < input.openingMonthIndex) return 0;
        const weight = SEASONALITY_WEIGHTS[i] ?? 1;
        return Math.round((refAnnual * weight) / refActiveWeightSum * 100) / 100;
      });
      const refTotal = refMonths.reduce((a, b) => a + b, 0);

      const waterfallMonths = PLAN_MONTHS.map((_, i) => {
        if (i < input.openingMonthIndex) return 0;
        const weight = SEASONALITY_WEIGHTS[i] ?? 1;
        return Math.round((input.waterfallAnnualTarget * weight) / activeWeightSum * 100) / 100;
      });
      const waterfallTotal = waterfallMonths.reduce((a, b) => a + b, 0);

      const variancePct = refTotal > 0
        ? Math.round(((waterfallTotal - refTotal) / refTotal) * 100)
        : 0;

      const newProjection: NewStoreProjection = {
        storeId,
        storeName: `${input.name} — ${input.city}`,
        channelId: input.channelId,
        waterfallTotal: Math.round(waterfallTotal * 100) / 100,
        waterfallMonths,
        referenceStoreId: input.referenceStoreId ?? '',
        referenceStoreName: refStore?.label ?? '',
        referenceTotal: Math.round(refTotal * 100) / 100,
        referenceMonths: refMonths,
        variancePct,
        selectedMethod: input.selectedMethod,
        isAcknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
      };

      const newExceptions: PlanningException[] = [];
      if (Math.abs(variancePct) > 20 && input.referenceStoreId) {
        newExceptions.push({
          id: `exc-new-${storeId}`,
          cycleId: state.activeCycleId ?? 'cycle-1',
          severity: 'soft',
          rule: 'NEWSTORE_VAR_UNACK',
          message: `New-store variance unacknowledged — waterfall vs reference Δ${variancePct}%`,
          affectedEntity: `${input.name} — ${input.city}`,
          affectedEntityId: storeId,
          channelId: input.channelId,
          deepLinkRowId: storeId,
          status: 'open',
          resolvedBy: null,
          resolvedAt: null,
        });
      }

      return {
        gridRows: [...state.gridRows, newRow],
        newStoreProjections: [...state.newStoreProjections, newProjection],
        exceptions: [...state.exceptions, ...newExceptions],
        expandedRowIds: state.expandedRowIds.includes(storeId)
          ? state.expandedRowIds
          : [...state.expandedRowIds, storeId],
      };
    }),

  selectStoreForCategory: (storeId) => set({ selectedStoreForCategory: storeId }),

  updateCategoryAllocation: (storeId, allocations) =>
    set((state) => {
      const updatedRows = state.gridRows.map((r) => {
        if (!r.id.startsWith(storeId)) return r;
        if (r.id === storeId || r.id.includes('::')) {
          return { ...r, categoryAllocations: allocations };
        }
        return r;
      });
      return { gridRows: updatedRows };
    }),

  createScenario: (name, type, growthMod, gmMod) =>
    set((state) => {
      const base = state.scenarios.find((s) => s.type === 'base');
      if (!base) return state;

      const newScenario = {
        ...base,
        id: `scenario-${type}-${Date.now()}`,
        name,
        type,
        isActive: false,
        totalNetSales: Math.round(base.totalNetSales * (1 + growthMod / 100) * 10) / 10,
        totalGrossMargin: Math.round(base.totalGrossMargin * (1 + (growthMod + gmMod) / 100) * 10) / 10,
        avgGmPct: Math.round((base.avgGmPct + gmMod) * 10) / 10,
        growthVsPY: Math.round((base.growthVsPY + growthMod) * 10) / 10,
        channelBreakdown: base.channelBreakdown.map((ch) => ({
          ...ch,
          netSales: Math.round(ch.netSales * (1 + growthMod / 100) * 10) / 10,
          grossMargin: Math.round(ch.grossMargin * (1 + (growthMod + gmMod) / 100) * 10) / 10,
          gmPct: Math.round((ch.gmPct + gmMod) * 10) / 10,
          growthPct: Math.round((ch.growthPct + growthMod) * 10) / 10,
        })),
      };

      return { scenarios: [...state.scenarios, newScenario] };
    }),

  generatePlan: (targets, seasonWeights) =>
    set(() => {
      const baseGrid = buildMockGrid();
      const updatedRows = baseGrid.map((row) => {
        if (row.level === 'channel') {
          const target = targets.find((t) => t.channelId === row.channelId);
          if (!target) return row;
          const newMonths = row.months.map((m, i) => {
            const weight = seasonWeights[i] ?? 1;
            const weightSum = seasonWeights.reduce((s, w) => s + w, 0);
            const value = Math.round((target.netSalesTarget * weight / weightSum) * 100) / 100;
            return { ...m, value, priorYear: Math.round(m.priorYear * (target.pyActual / (row.priorYearTotal || 1)) * 100) / 100 };
          });
          const fyTotal = newMonths.reduce((s, m) => s + m.value, 0);
          const pyTotal = newMonths.reduce((s, m) => s + m.priorYear, 0);
          const growthPct = pyTotal > 0 ? ((fyTotal - pyTotal) / pyTotal) * 100 : 0;
          return {
            ...row,
            months: newMonths,
            fyTotal: Math.round(fyTotal * 100) / 100,
            priorYearTotal: Math.round(pyTotal * 100) / 100,
            growthPct: Math.round(growthPct * 10) / 10,
            gmPct: target.gmPctTarget,
            grossMargin: Math.round(fyTotal * (target.gmPctTarget / 100) * 100) / 100,
            guardrailStatus: computeGuardrailStatus(growthPct, row.guardrailBand),
          };
        }
        if (row.level === 'store') {
          const target = targets.find((t) => t.channelId === row.channelId);
          if (!target) return row;
          const channelBase = baseGrid.find((r) => r.id === row.channelId);
          const storeShare = channelBase && channelBase.fyTotal > 0 ? row.fyTotal / channelBase.fyTotal : 0;
          const storeTarget = target.netSalesTarget * storeShare;
          const newMonths = row.months.map((_, i) => {
            const weight = seasonWeights[i] ?? 1;
            const weightSum = seasonWeights.reduce((s, w) => s + w, 0);
            const value = Math.round((storeTarget * weight / weightSum) * 100) / 100;
            const pyValue = row.months[i]?.priorYear ?? 0;
            return { monthId: PLAN_MONTHS[i]?.id ?? '', value, isPinned: false, isEdited: false, priorYear: pyValue };
          });
          const fyTotal = newMonths.reduce((s, m) => s + m.value, 0);
          const pyTotal = newMonths.reduce((s, m) => s + m.priorYear, 0);
          const growthPct = pyTotal > 0 ? ((fyTotal - pyTotal) / pyTotal) * 100 : 0;
          return {
            ...row,
            months: newMonths,
            fyTotal: Math.round(fyTotal * 100) / 100,
            priorYearTotal: Math.round(pyTotal * 100) / 100,
            growthPct: Math.round(growthPct * 10) / 10,
            gmPct: Math.round((target.gmPctTarget + (row.gmPct - (channelBase?.gmPct ?? 12))) * 10) / 10,
            grossMargin: Math.round(fyTotal * (row.gmPct / 100) * 100) / 100,
            guardrailStatus: computeGuardrailStatus(growthPct, row.guardrailBand),
          };
        }
        if (row.level === 'total') {
          const totalTarget = targets.reduce((s, t) => s + t.netSalesTarget, 0);
          const totalPY = targets.reduce((s, t) => s + t.pyActual, 0);
          const newMonths = PLAN_MONTHS.map((m, i) => {
            const weight = seasonWeights[i] ?? 1;
            const weightSum = seasonWeights.reduce((s, w) => s + w, 0);
            const value = Math.round((totalTarget * weight / weightSum) * 100) / 100;
            const pyValue = Math.round((totalPY * weight / weightSum) * 100) / 100;
            return { monthId: m.id, value, isPinned: false, isEdited: false, priorYear: pyValue };
          });
          const fyTotal = newMonths.reduce((s, mc) => s + mc.value, 0);
          const growthPct = totalPY > 0 ? ((fyTotal - totalPY) / totalPY) * 100 : 0;
          const blendedGm = totalTarget > 0
            ? targets.reduce((s, t) => s + (t.gmPctTarget * t.netSalesTarget), 0) / totalTarget
            : 12;
          return {
            ...row,
            months: newMonths,
            fyTotal: Math.round(fyTotal * 100) / 100,
            priorYearTotal: Math.round(totalPY * 100) / 100,
            growthPct: Math.round(growthPct * 10) / 10,
            gmPct: Math.round(blendedGm * 10) / 10,
            grossMargin: Math.round(fyTotal * (blendedGm / 100) * 100) / 100,
            guardrailStatus: computeGuardrailStatus(growthPct, row.guardrailBand),
          };
        }
        return row;
      });

      return {
        gridRows: updatedRows,
        expandedRowIds: updatedRows.filter((r) => r.level !== 'store').map((r) => r.id),
        isDirty: false,
        lastSavedAt: null,
      };
    }),

  saveDraft: () =>
    set({ lastSavedAt: new Date().toISOString(), isDirty: false }),

  createCycle: (name, fiscalYear) =>
    set((state) => {
      const newCycle: PlanningCycle = {
        id: `cycle-${Date.now()}`,
        name,
        fiscalYear,
        brand: 'Superdry',
        status: 'DRAFT',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'User',
        submittedBy: null,
        submittedAt: null,
        reviewedBy: null,
        approvedAt: null,
        lockedBy: null,
        lockedAt: null,
        promotedAt: null,
        activeScenarioId: 'scenario-base',
        readinessChecks: state.cycles[0]?.readinessChecks.map((rc) => ({ ...rc, status: 'pending' as const })) ?? [],
        exceptionCount: { hard: 0, soft: 0 },
      };
      return { cycles: [...state.cycles, newCycle] };
    }),

  hydrate: (payload) =>
    set((state) => {
      const next: Partial<AOPPlanningState> = {};
      if (payload.cycle) {
        const others = state.cycles.filter((c) => c.id !== payload.cycle!.id);
        next.cycles = [payload.cycle, ...others];
        next.activeCycleId = payload.cycle.id;
      }
      if (payload.gridRows) {
        next.gridRows = payload.gridRows;
        next.expandedRowIds = payload.gridRows
          .filter((r) => r.level !== 'store')
          .map((r) => r.id);
      }
      if (payload.exceptions) {
        next.exceptions = payload.exceptions;
      }
      return next;
    }),
}));
