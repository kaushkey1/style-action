import { create } from 'zustand';
import type { PlanningCycle } from '../data/mockAOPTypes';
import { SCENARIO_CONSERVATIVE_ID, SCENARIO_MODERATE_ID, SCENARIO_AGGRESSIVE_ID } from '../data/mockScenarios';
import { generateFiscalMonths, generateWeeksForMonth } from '../data/mockAOPVariance';

type AOPTab = 'dashboard' | 'planner' | 'comparison' | 'variance';
type VarianceView = 'by-category' | 'by-store' | 'by-format' | 'by-channel';
type VariancePeriodType = 'ytd' | 'mtd' | 'wtd' | 'custom';
type VarianceMetric = 'volume' | 'asp' | 'intake_gm' | 'gm_pct' | 'gross_revenue' | 'net_revenue';

// ─── Helper: Get default fiscal month and week ────────────────────────────

function getDefaultFiscalMonthAndWeek(): { month: string; week: string } {
  const now = new Date();

  // Define fiscal year boundaries: April 1, 2026 to March 31, 2027
  const fiscalYearStart = new Date(2026, 3, 1); // April 1, 2026 (month is 0-indexed)
  const fiscalYearEnd = new Date(2027, 2, 31);   // March 31, 2027

  // Check if current date is within fiscal year
  const isWithinFiscalYear = now >= fiscalYearStart && now <= fiscalYearEnd;

  let targetDate: Date;
  if (isWithinFiscalYear) {
    // Use current date if within fiscal year
    targetDate = now;
  } else {
    // Default to April 1, 2026 if outside fiscal year
    targetDate = fiscalYearStart;
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();
  const targetDay = targetDate.getDate();

  const monthName = monthNames[targetMonth];
  const monthLabel = `${monthName} ${targetYear}`;

  // Calculate week number based on day of month (1-7 = w1, 8-14 = w2, etc.)
  const weekNumber = Math.ceil(targetDay / 7);
  const weekId = `w${weekNumber}`;

  // Verify the month and week exist in available options
  const fiscalMonths = generateFiscalMonths(2026);
  const availableWeeks = generateWeeksForMonth(monthLabel);

  const monthExists = fiscalMonths.some(m => m.label === monthLabel);
  const weekExists = availableWeeks.some(w => w.id === weekId);

  // Use calculated values if they exist, otherwise fall back to first month/week
  const selectedMonth = monthExists ? monthLabel : fiscalMonths[0]?.label || 'Apr 2026';
  const selectedWeek = weekExists ? weekId : availableWeeks[0]?.id || 'w1';

  return {
    month: selectedMonth,
    week: selectedWeek
  };
}

const initialFiscalData = getDefaultFiscalMonthAndWeek();

interface AOPState {
  fiscalYear: string;
  planningCycle: PlanningCycle;
  activeTab: AOPTab;
  selectedStoreId: string | null;
  selectedPodId: string | null;
  activeScenarioId: string | null;
  comparisonScenarioIds: string[];
  variancePeriodType: VariancePeriodType;
  variancePeriod: string;
  varianceWeek: string;
  varianceView: VarianceView;
  varianceMetric: VarianceMetric;
  simulationInProgress: boolean;

  setFiscalYear: (fy: string) => void;
  setPlanningCycle: (cycle: PlanningCycle) => void;
  setActiveTab: (tab: AOPTab) => void;
  selectStore: (storeId: string | null) => void;
  selectPod: (podId: string | null) => void;
  setActiveScenario: (id: string | null) => void;
  setComparisonScenarios: (ids: string[]) => void;
  setVariancePeriodType: (type: VariancePeriodType) => void;
  setVariancePeriod: (period: string) => void;
  setVarianceWeek: (week: string) => void;
  setVarianceView: (view: VarianceView) => void;
  setVarianceMetric: (metric: VarianceMetric) => void;
  setSimulationInProgress: (v: boolean) => void;
}

export const useAOPStore = create<AOPState>((set) => ({
  fiscalYear: 'FY 2026-27',
  planningCycle: 'annual',
  activeTab: 'dashboard',
  selectedStoreId: null,
  selectedPodId: null,
  activeScenarioId: null,
  comparisonScenarioIds: [SCENARIO_CONSERVATIVE_ID, SCENARIO_MODERATE_ID, SCENARIO_AGGRESSIVE_ID],
  variancePeriodType: 'mtd',
  variancePeriod: initialFiscalData.month,
  varianceWeek: initialFiscalData.week,
  varianceView: 'by-category',
  varianceMetric: 'volume',
  simulationInProgress: false,

  setFiscalYear: (fiscalYear) => set({ fiscalYear }),
  setPlanningCycle: (planningCycle) => set({ planningCycle }),
  setActiveTab: (activeTab) => set({ activeTab }),
  selectStore: (selectedStoreId) => set({ selectedStoreId }),
  selectPod: (selectedPodId) => set({ selectedPodId }),
  setActiveScenario: (activeScenarioId) => set({ activeScenarioId }),
  setComparisonScenarios: (comparisonScenarioIds) => set({ comparisonScenarioIds }),
  setVariancePeriodType: (variancePeriodType) => set({ variancePeriodType }),
  setVariancePeriod: (variancePeriod) => set({ variancePeriod }),
  setVarianceWeek: (varianceWeek) => set({ varianceWeek }),
  setVarianceView: (varianceView) => set({ varianceView }),
  setVarianceMetric: (varianceMetric) => set({ varianceMetric }),
  setSimulationInProgress: (simulationInProgress) => set({ simulationInProgress }),
}));
