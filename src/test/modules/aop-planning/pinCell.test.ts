import { describe, it, expect, beforeEach } from 'vitest';
import { useAOPPlanningStore } from '@/modules/aop-planning/stores/useAOPPlanningStore';
import { PLAN_MONTHS } from '@/modules/aop-planning/data/mockChannels';
import type { MonthCell, PlanningGridRow } from '@/modules/aop-planning/types/aopPlanning.types';

function cell(monthId: string, value: number, extra: Partial<MonthCell> = {}): MonthCell {
  return { monthId, value, isPinned: false, isEdited: false, priorYear: value, ...extra };
}

function makeRow(id: string, parentId: string | null, months: MonthCell[]): PlanningGridRow {
  const fyTotal = months.reduce((s, m) => s + m.value, 0);
  return {
    id,
    level: parentId ? 'channel' : 'total',
    label: id,
    parentId,
    channelId: null,
    storeClassification: null,
    storeGrade: null,
    isNewStore: false,
    months,
    fyTotal,
    priorYearTotal: fyTotal,
    growthPct: 0,
    guardrailStatus: 'within',
    guardrailBand: { minGrowth: -10, maxGrowth: 20 },
    gmPct: 12,
    grossMargin: 0,
    categoryAllocations: [],
  };
}

function seed(months: MonthCell[]): void {
  const channel = makeRow('ch:Distribution', 'total', months);
  const total = makeRow(
    'total',
    null,
    months.map((m) => cell(m.monthId, m.value)),
  );
  useAOPPlanningStore.setState({ gridRows: [total, channel] });
}

function channelRow(): PlanningGridRow {
  const r = useAOPPlanningStore.getState().gridRows.find((x) => x.id === 'ch:Distribution');
  if (!r) throw new Error('channel row missing');
  return r;
}

// A flat channel: 12 months x 4.0 = FY 48.0.
const flatMonths = (): MonthCell[] => PLAN_MONTHS.map((m) => cell(m.id, 4));

describe('useAOPPlanningStore.pinCell (channel redistribution)', () => {
  beforeEach(() => {
    useAOPPlanningStore.setState({ gridRows: [] });
  });

  it('sets the edited month and holds the FY total constant', () => {
    seed(flatMonths());
    useAOPPlanningStore.getState().pinCell('ch:Distribution', 'apr', 5);
    const r = channelRow();
    expect(r.months.find((m) => m.monthId === 'apr')?.value).toBe(5);
    expect(r.fyTotal).toBeCloseTo(48, 2);
    expect(r.months.reduce((s, m) => s + m.value, 0)).toBeCloseTo(48, 2);
  });

  it('marks only the edited month as edited (not auto-adjusted months)', () => {
    seed(flatMonths());
    useAOPPlanningStore.getState().pinCell('ch:Distribution', 'apr', 5);
    const edited = channelRow().months.filter((m) => m.isEdited);
    expect(edited).toHaveLength(1);
    expect(edited[0]?.monthId).toBe('apr');
  });

  it('never modifies actual (locked) months and holds the non-actual total constant', () => {
    const months = PLAN_MONTHS.map((m) =>
      m.id === 'may' ? cell(m.id, 4, { isActual: true }) : cell(m.id, 4),
    );
    seed(months);
    useAOPPlanningStore.getState().pinCell('ch:Distribution', 'apr', 5);
    expect(channelRow().months.find((m) => m.monthId === 'may')?.value).toBe(4); // untouched
    const nonActualSum = channelRow()
      .months.filter((m) => !m.isActual)
      .reduce((s, m) => s + m.value, 0);
    expect(nonActualSum).toBeCloseTo(44, 2); // 48 total - 4 (locked May)
  });

  it('does nothing when the edited month itself is a locked actual', () => {
    const months = PLAN_MONTHS.map((m) =>
      m.id === 'apr' ? cell(m.id, 4, { isActual: true }) : cell(m.id, 4),
    );
    seed(months);
    useAOPPlanningStore.getState().pinCell('ch:Distribution', 'apr', 9);
    expect(channelRow().months.find((m) => m.monthId === 'apr')?.value).toBe(4);
  });
});
