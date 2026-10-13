import type { AOPVariance, AOPVarianceTrend, ScenarioAssumption } from './mockAOPTypes';
import { POD_MW_P1, POD_MW_P2, POD_MW_P3, POD_WIW_P1, POD_WWW_P3, POD_KW_P1, POD_FW_P1, POD_NA_P1 } from '@/modules/otb/data/mockOTB';

// ─── Network-level monthly variance (Apr-Oct 2026) ──────────────────

export const mockNetworkVariance: AOPVariance[] = [
  {
    period: 'Apr 2026',
    planned: { revenue: 767, gm: 322, spsf: 680, turns: 6.0 },
    actual: { revenue: 758, gm: 319, spsf: 677, turns: 5.88 },
    variance: { revenue: -1.2, gm: -0.8, spsf: -0.5, turns: -2.0 },
    status: { revenue: 'on-track', gm: 'on-track', spsf: 'on-track', turns: 'on-track' },
  },
  {
    period: 'May 2026',
    planned: { revenue: 657, gm: 276, spsf: 680, turns: 6.0 },
    actual: { revenue: 645, gm: 272, spsf: 673, turns: 5.82 },
    variance: { revenue: -1.8, gm: -1.5, spsf: -1.0, turns: -3.0 },
    status: { revenue: 'on-track', gm: 'on-track', spsf: 'on-track', turns: 'on-track' },
  },
  {
    period: 'Jun 2026',
    planned: { revenue: 548, gm: 230, spsf: 680, turns: 6.0 },
    actual: { revenue: 534, gm: 225, spsf: 668, turns: 5.76 },
    variance: { revenue: -2.5, gm: -2.2, spsf: -1.8, turns: -4.0 },
    status: { revenue: 'on-track', gm: 'on-track', spsf: 'on-track', turns: 'on-track' },
  },
  {
    period: 'Jul 2026',
    planned: { revenue: 657, gm: 276, spsf: 680, turns: 6.0 },
    actual: { revenue: 637, gm: 268, spsf: 665, turns: 5.70 },
    variance: { revenue: -3.1, gm: -3.0, spsf: -2.2, turns: -5.0 },
    status: { revenue: 'on-track', gm: 'on-track', spsf: 'on-track', turns: 'on-track' },
  },
  {
    period: 'Aug 2026',
    planned: { revenue: 767, gm: 322, spsf: 680, turns: 6.0 },
    actual: { revenue: 738, gm: 308, spsf: 661, turns: 5.58 },
    variance: { revenue: -3.8, gm: -4.2, spsf: -2.8, turns: -7.0 },
    status: { revenue: 'on-track', gm: 'on-track', spsf: 'on-track', turns: 'warning' },
  },
  {
    period: 'Sep 2026',
    planned: { revenue: 876, gm: 368, spsf: 680, turns: 6.0 },
    actual: { revenue: 837, gm: 347, spsf: 660, turns: 5.52 },
    variance: { revenue: -4.5, gm: -5.8, spsf: -3.0, turns: -8.0 },
    status: { revenue: 'on-track', gm: 'warning', spsf: 'on-track', turns: 'warning' },
  },
  {
    period: 'Oct 2026',
    planned: { revenue: 1314, gm: 552, spsf: 680, turns: 6.0 },
    actual: { revenue: 1248, gm: 512, spsf: 658, turns: 5.40 },
    variance: { revenue: -5.0, gm: -7.2, spsf: -3.2, turns: -10.0 },
    status: { revenue: 'warning', gm: 'breach', spsf: 'on-track', turns: 'breach' },
  },
];

// ─── POD-level variance for October ─────────────────────────────────

export const mockPodVariance: AOPVariance[] = [
  {
    podId: POD_MW_P1, podName: 'MW Pod 1 (Shirts)', period: 'Oct 2026',
    planned: { revenue: 199, gm: 106, spsf: 750, turns: 6.0 },
    actual: { revenue: 195, gm: 104, spsf: 739, turns: 5.76 },
    variance: { revenue: -2.1, gm: -1.8, spsf: -1.5, turns: -4.0 },
    status: { revenue: 'on-track', gm: 'on-track', spsf: 'on-track', turns: 'on-track' },
  },
  {
    podId: POD_MW_P3, podName: 'MW Pod 3 (T-Shirts)', period: 'Oct 2026',
    planned: { revenue: 118, gm: 62, spsf: 685, turns: 6.0 },
    actual: { revenue: 108, gm: 56, spsf: 643, turns: 5.28 },
    variance: { revenue: -8.4, gm: -9.1, spsf: -6.2, turns: -12.0 },
    status: { revenue: 'breach', gm: 'breach', spsf: 'warning', turns: 'breach' },
  },
  {
    podId: POD_WIW_P1, podName: "WIW Pod 1 (Kurtas)", period: 'Oct 2026',
    planned: { revenue: 107, gm: 60, spsf: 810, turns: 6.0 },
    actual: { revenue: 108, gm: 60, spsf: 814, turns: 6.12 },
    variance: { revenue: 1.2, gm: 0.8, spsf: 0.5, turns: 2.0 },
    status: { revenue: 'on-track', gm: 'on-track', spsf: 'on-track', turns: 'on-track' },
  },
  {
    podId: POD_WWW_P3, podName: "WWW Pod 3 (Denims)", period: 'Oct 2026',
    planned: { revenue: 88, gm: 46, spsf: 625, turns: 6.0 },
    actual: { revenue: 78, gm: 39, spsf: 571, turns: 5.10 },
    variance: { revenue: -11.3, gm: -14.2, spsf: -8.7, turns: -15.0 },
    status: { revenue: 'breach', gm: 'breach', spsf: 'breach', turns: 'breach' },
  },
  {
    podId: POD_KW_P1, podName: 'KW Pod 1 (Boys)', period: 'Oct 2026',
    planned: { revenue: 73, gm: 40, spsf: 590, turns: 6.0 },
    actual: { revenue: 70, gm: 38, spsf: 578, turns: 5.64 },
    variance: { revenue: -3.8, gm: -4.2, spsf: -2.1, turns: -6.0 },
    status: { revenue: 'on-track', gm: 'on-track', spsf: 'on-track', turns: 'warning' },
  },
  {
    podId: POD_FW_P1, podName: 'Footwear Pod 1', period: 'Oct 2026',
    planned: { revenue: 66, gm: 34, spsf: 540, turns: 6.0 },
    actual: { revenue: 62, gm: 32, spsf: 514, turns: 5.52 },
    variance: { revenue: -6.7, gm: -5.9, spsf: -4.8, turns: -8.0 },
    status: { revenue: 'warning', gm: 'warning', spsf: 'on-track', turns: 'warning' },
  },
  {
    podId: POD_NA_P1, podName: 'Non-Apparel Pod 1', period: 'Oct 2026',
    planned: { revenue: 51, gm: 24, spsf: 480, turns: 6.0 },
    actual: { revenue: 50, gm: 24, spsf: 476, turns: 5.82 },
    variance: { revenue: -1.5, gm: -1.0, spsf: -0.8, turns: -3.0 },
    status: { revenue: 'on-track', gm: 'on-track', spsf: 'on-track', turns: 'on-track' },
  },
  {
    podId: POD_MW_P2, podName: 'MW Pod 2 (Trousers)', period: 'Oct 2026',
    planned: { revenue: 171, gm: 92, spsf: 720, turns: 6.0 },
    actual: { revenue: 165, gm: 89, spsf: 706, turns: 5.67 },
    variance: { revenue: -3.2, gm: -2.8, spsf: -2.0, turns: -5.5 },
    status: { revenue: 'on-track', gm: 'on-track', spsf: 'on-track', turns: 'warning' },
  },
];

// ─── Variance trend for charts ──────────────────────────────────────

export const mockVarianceTrend: AOPVarianceTrend[] = [
  { month: 'Apr', planned: 767, actual: 758, variancePct: -1.2 },
  { month: 'May', planned: 657, actual: 645, variancePct: -1.8 },
  { month: 'Jun', planned: 548, actual: 534, variancePct: -2.5 },
  { month: 'Jul', planned: 657, actual: 637, variancePct: -3.1 },
  { month: 'Aug', planned: 767, actual: 738, variancePct: -3.8 },
  { month: 'Sep', planned: 876, actual: 837, variancePct: -4.5 },
  { month: 'Oct', planned: 1314, actual: 1248, variancePct: -5.0 },
];

// ─── Assumption tracker ─────────────────────────────────────────────

export const mockAssumptionTracker: ScenarioAssumption[] = [
  { id: 'at-1', category: 'growth', description: 'YoY Growth', value: '+8%', source: 'Business Head directive', confidence: 'high', actualValue: '+3.2% (YTD)', actualStatus: 'warning' },
  { id: 'at-2', category: 'operations', description: 'New Store Openings', value: '25 by Q2', source: 'Real estate pipeline', confidence: 'medium', actualValue: '18 opened', actualStatus: 'on-track' },
  { id: 'at-3', category: 'macro', description: 'Consumer Sentiment', value: 'Stable', source: 'RBI consumer confidence', confidence: 'medium', actualValue: 'Softening', actualStatus: 'warning' },
  { id: 'at-4', category: 'competition', description: 'Competitor Entry', value: 'Minor', source: 'Market intelligence', confidence: 'medium', actualValue: 'H&M 5 stores', actualStatus: 'breach' },
  { id: 'at-5', category: 'operations', description: 'Fabric Inflation', value: '+4%', source: 'Vendor quotes Q4', confidence: 'high', actualValue: '+3.8%', actualStatus: 'on-track' },
  { id: 'at-6', category: 'weather', description: 'Monsoon', value: 'Normal', source: 'IMD forecast', confidence: 'medium', actualValue: 'Delayed 2 weeks', actualStatus: 'breach' },
];

// ─── Dynamic Month/Week Generation ─────────────────────────────────

/**
 * Generate fiscal year months (April to March) based on current year
 * If current year is 2026, returns Apr 2026 - Mar 2027
 */
export function generateFiscalMonths(currentYear: number = 2026): Array<{ id: string; label: string }> {
  const months = [
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December', 'January', 'February', 'March'
  ];

  const result: Array<{ id: string; label: string }> = [];

  months.forEach((month, index) => {
    // Apr-Dec use currentYear, Jan-Mar use currentYear+1
    const year = index < 9 ? currentYear : currentYear + 1;
    const monthShort = month.substring(0, 3);
    result.push({
      id: `${monthShort.toLowerCase()}${year.toString().slice(-2)}`,
      label: `${monthShort} ${year}`
    });
  });

  return result;
}

/**
 * Generate weeks for a given month dynamically
 */
export function generateWeeksForMonth(monthLabel: string): Array<{ id: string; label: string }> {
  // Parse month and year from label (e.g., "Oct 2026")
  const [monthStr, yearStr] = monthLabel.split(' ');
  if (!monthStr || !yearStr) return [];

  const monthMap: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const month = monthMap[monthStr];
  const year = parseInt(yearStr);

  if (month === undefined || isNaN(year)) return [];

  // Get number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate weeks
  const weeks: Array<{ id: string; label: string }> = [];
  let weekNum = 1;
  let startDay = 1;

  while (startDay <= daysInMonth) {
    const endDay = Math.min(startDay + 6, daysInMonth);
    weeks.push({
      id: `w${weekNum}`,
      label: `Week ${weekNum} (${monthStr} ${startDay}-${endDay}, ${year})`
    });
    startDay += 7;
    weekNum++;
  }

  return weeks;
}

/**
 * Get weeks by month - memoized map
 */
export function getWeeksByMonth(): Record<string, Array<{ id: string; label: string }>> {
  const fiscalMonths = generateFiscalMonths();
  const weeksByMonth: Record<string, Array<{ id: string; label: string }>> = {};

  fiscalMonths.forEach(({ label }) => {
    weeksByMonth[label] = generateWeeksForMonth(label);
  });

  return weeksByMonth;
}

// ─── WTD (Week-to-Date) Variance Data ──────────────────────────────

export interface WTDVariance {
  day: string;
  dayLabel: string;
  variancePct: number;
}

// Base variance patterns by week (will be enriched with dates)
const baseWTDVariance: Record<string, number[]> = {
  w1: [-1.2, -2.1, -2.8, -3.5, -4.2, -4.6, -5.0],
  w2: [-5.2, -5.5, -5.8, -6.0, -6.3, -6.5, -6.8],
  w3: [-6.9, -7.2, -7.4, -7.6, -7.8, -8.0, -8.2],
  w4: [-8.3, -8.5, -8.6, -8.8, -9.0, -9.2, -9.4],
  w5: [-9.5, -9.6, -9.7, -9.8, -9.9, -10.0, -10.1],
};

/**
 * Generate WTD variance data with dates for a specific month and week
 */
export function generateWTDVarianceWithDates(monthLabel: string, weekId: string): WTDVariance[] {
  // Parse month and year from label (e.g., "Oct 2026")
  const [monthStr, yearStr] = monthLabel.split(' ');
  if (!monthStr || !yearStr) return [];

  const monthMap: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const month = monthMap[monthStr];
  const year = parseInt(yearStr);

  if (month === undefined || isNaN(year)) return [];

  // Get week number (1-5)
  const weekNum = parseInt(weekId.replace('w', ''));
  if (isNaN(weekNum)) return [];

  // Calculate start day of the week
  const startDay = (weekNum - 1) * 7 + 1;

  // Get variance values for this week
  const variances = baseWTDVariance[weekId] || baseWTDVariance.w1 || [];

  // Generate 7 days with dates
  const result: WTDVariance[] = [];
  for (let i = 0; i < 7; i++) {
    const dayOfMonth = startDay + i;
    const date: Date = new Date(year, month, dayOfMonth);

    // Only add if still within the same month
    if (date.getMonth() === month) {
      const dayName = dayNames[date.getDay()] || 'Day';
      const dayLabel = `${monthStr} ${dayOfMonth}, ${year}`;

      result.push({
        day: dayName,
        dayLabel,
        variancePct: variances[i] || 0
      });
    }
  }

  return result;
}

// Legacy export for backward compatibility
export const mockWTDVariance: Record<string, WTDVariance[]> = {
  w1: [
    { day: 'Mon', dayLabel: 'Oct 1, 2026', variancePct: -1.2 },
    { day: 'Tue', dayLabel: 'Oct 2, 2026', variancePct: -2.1 },
    { day: 'Wed', dayLabel: 'Oct 3, 2026', variancePct: -2.8 },
    { day: 'Thu', dayLabel: 'Oct 4, 2026', variancePct: -3.5 },
    { day: 'Fri', dayLabel: 'Oct 5, 2026', variancePct: -4.2 },
    { day: 'Sat', dayLabel: 'Oct 6, 2026', variancePct: -4.6 },
    { day: 'Sun', dayLabel: 'Oct 7, 2026', variancePct: -5.0 },
  ],
  w2: [
    { day: 'Mon', dayLabel: 'Oct 8, 2026', variancePct: -5.2 },
    { day: 'Tue', dayLabel: 'Oct 9, 2026', variancePct: -5.5 },
    { day: 'Wed', dayLabel: 'Oct 10, 2026', variancePct: -5.8 },
    { day: 'Thu', dayLabel: 'Oct 11, 2026', variancePct: -6.0 },
    { day: 'Fri', dayLabel: 'Oct 12, 2026', variancePct: -6.3 },
    { day: 'Sat', dayLabel: 'Oct 13, 2026', variancePct: -6.5 },
    { day: 'Sun', dayLabel: 'Oct 14, 2026', variancePct: -6.8 },
  ],
  w3: [
    { day: 'Mon', dayLabel: 'Oct 15, 2026', variancePct: -6.9 },
    { day: 'Tue', dayLabel: 'Oct 16, 2026', variancePct: -7.2 },
    { day: 'Wed', dayLabel: 'Oct 17, 2026', variancePct: -7.4 },
    { day: 'Thu', dayLabel: 'Oct 18, 2026', variancePct: -7.6 },
    { day: 'Fri', dayLabel: 'Oct 19, 2026', variancePct: -7.8 },
    { day: 'Sat', dayLabel: 'Oct 20, 2026', variancePct: -8.0 },
    { day: 'Sun', dayLabel: 'Oct 21, 2026', variancePct: -8.2 },
  ],
  w4: [
    { day: 'Mon', dayLabel: 'Oct 22, 2026', variancePct: -8.3 },
    { day: 'Tue', dayLabel: 'Oct 23, 2026', variancePct: -8.5 },
    { day: 'Wed', dayLabel: 'Oct 24, 2026', variancePct: -8.6 },
    { day: 'Thu', dayLabel: 'Oct 25, 2026', variancePct: -8.8 },
    { day: 'Fri', dayLabel: 'Oct 26, 2026', variancePct: -9.0 },
    { day: 'Sat', dayLabel: 'Oct 27, 2026', variancePct: -9.2 },
    { day: 'Sun', dayLabel: 'Oct 28, 2026', variancePct: -9.4 },
  ],
  w5: [
    { day: 'Mon', dayLabel: 'Oct 29, 2026', variancePct: -9.5 },
    { day: 'Tue', dayLabel: 'Oct 30, 2026', variancePct: -9.6 },
    { day: 'Wed', dayLabel: 'Oct 31, 2026', variancePct: -9.7 },
  ],
};

// ─── Variance Data by Metric ───────────────────────────────────────

export interface MetricVarianceData {
  dayLabel: string;
  planned: number;
  actual: number;
  variancePct: number;
}

// Base metric values for realistic variance calculation
const baseMetrics = {
  volume: { base: 100, unit: 'Mn Units' },
  asp: { base: 600, unit: '₹' },
  intake_gm: { base: 45, unit: '%' },
  gm_pct: { base: 35, unit: '%' },
  gross_revenue: { base: 1200, unit: '₹ Cr' },
  net_revenue: { base: 1140, unit: '₹ Cr' },
};

/**
 * Generate YTD (Year to Date) variance data
 * Shows monthly aggregated data from April to current month
 */
export function generateYTDVariance(metric: keyof typeof baseMetrics = 'volume'): MetricVarianceData[] {
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const baseValue = baseMetrics[metric].base;

  return months.map((month, idx) => {
    const planned = baseValue * (1 + idx * 0.08);
    const variancePct = -1.2 - (idx * 0.6); // Gradually worsening trend
    const actual = planned * (1 + variancePct / 100);

    return {
      dayLabel: `${month} 2026`,
      planned: Number(planned.toFixed(2)),
      actual: Number(actual.toFixed(2)),
      variancePct: Number(variancePct.toFixed(2)),
    };
  });
}

/**
 * Generate MTD (Month to Date) variance data
 * Shows daily data for the current month
 */
export function generateMTDVariance(
  monthLabel: string,
  metric: keyof typeof baseMetrics = 'volume'
): MetricVarianceData[] {
  const parts = monthLabel.split(' ');
  const monthStr = parts[0];
  const yearStr = parts[1];

  if (!monthStr || !yearStr) return [];

  const baseValue = baseMetrics[metric].base;

  const monthMap: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const month = monthMap[monthStr];
  const year = parseInt(yearStr);

  if (month === undefined || isNaN(year)) return [];

  // Get number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate daily data for the month
  const result: MetricVarianceData[] = [];
  for (let day = 1; day <= Math.min(daysInMonth, 31); day++) {
    const planned = baseValue * (1 + day * 0.005);
    const variancePct = -2.0 - (day * 0.15); // Daily worsening trend
    const actual = planned * (1 + variancePct / 100);

    result.push({
      dayLabel: `${monthStr} ${day}`,
      planned: Number(planned.toFixed(2)),
      actual: Number(actual.toFixed(2)),
      variancePct: Number(variancePct.toFixed(2)),
    });
  }

  return result;
}

/**
 * Generate WTD (Week to Date) variance data
 * Shows daily data for the current week (Mon-Sun or partial week)
 */
export function generateWTDVarianceByMetric(
  monthLabel: string,
  weekId: string,
  metric: keyof typeof baseMetrics = 'volume'
): MetricVarianceData[] {
  const parts = monthLabel.split(' ');
  const monthStr = parts[0];
  const yearStr = parts[1];

  if (!monthStr || !yearStr) return [];

  const baseValue = baseMetrics[metric].base;

  const monthMap: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const month = monthMap[monthStr];
  const year = parseInt(yearStr);

  if (month === undefined || isNaN(year)) return [];

  const weekNum = parseInt(weekId.replace('w', ''));
  if (isNaN(weekNum)) return [];

  const startDay = (weekNum - 1) * 7 + 1;

  // Variance pattern for the week (progressive)
  const variancePattern = [-1.5, -2.3, -3.1, -3.8, -4.5, -5.2, -5.8];

  const result: MetricVarianceData[] = [];
  for (let i = 0; i < 7; i++) {
    const dayOfMonth = startDay + i;
    const currentDate: Date = new Date(year, month, dayOfMonth);

    if (currentDate.getMonth() === month) {
      const planned = baseValue * (1 + i * 0.01);
      const variancePct = variancePattern[i] || 0;
      const actual = planned * (1 + variancePct / 100);

      const dayName = dayNames[currentDate.getDay()];
      result.push({
        dayLabel: `${dayName}, ${monthStr} ${dayOfMonth}`,
        planned: Number(planned.toFixed(2)),
        actual: Number(actual.toFixed(2)),
        variancePct: Number(variancePct.toFixed(2)),
      });
    }
  }

  return result;
}

// ─── Category Variance Data (Updated Structure) ────────────────────

export interface CategoryVariance {
  categoryId: string;
  categoryName: string;
  period: string;
  volume: { plan: number; actual: number; variance: number };
  asp: { plan: number; actual: number; variance: number };
  intakeGm: { plan: number; actual: number; variance: number };
  gmPct: { plan: number; actual: number; variance: number };
  grossRevenue: { plan: number; actual: number; variance: number };
  netRevenue: { plan: number; actual: number; variance: number };
}

export const mockCategoryVariance: CategoryVariance[] = [
  {
    categoryId: 'mw_denim', categoryName: 'Men Western: Denim Bottoms', period: 'Oct 2026',
    volume: { plan: 28.5, actual: 27.6, variance: -3.2 },
    asp: { plan: 720, actual: 735, variance: 2.1 },
    intakeGm: { plan: 46.5, actual: 45.2, variance: -2.8 },
    gmPct: { plan: 35.8, actual: 34.5, variance: -3.6 },
    grossRevenue: { plan: 1825.0, actual: 1768.0, variance: -3.1 },
    netRevenue: { plan: 1730.0, actual: 1675.0, variance: -3.2 },
  },
  {
    categoryId: 'mw_nondenim', categoryName: 'Men Western: Non-Denim Bottoms', period: 'Oct 2026',
    volume: { plan: 25.2, actual: 24.5, variance: -2.8 },
    asp: { plan: 680, actual: 692, variance: 1.8 },
    intakeGm: { plan: 44.8, actual: 43.6, variance: -2.7 },
    gmPct: { plan: 34.2, actual: 33.1, variance: -3.2 },
    grossRevenue: { plan: 1650.0, actual: 1605.0, variance: -2.7 },
    netRevenue: { plan: 1565.0, actual: 1520.0, variance: -2.9 },
  },
  {
    categoryId: 'mw_tshirts', categoryName: 'Men Western: Casual T-shirts', period: 'Oct 2026',
    volume: { plan: 45.8, actual: 40.2, variance: -12.2 },
    asp: { plan: 420, actual: 405, variance: -3.6 },
    intakeGm: { plan: 42.5, actual: 38.8, variance: -8.7 },
    gmPct: { plan: 32.5, actual: 29.2, variance: -10.2 },
    grossRevenue: { plan: 1180.0, actual: 1025.0, variance: -13.1 },
    netRevenue: { plan: 1120.0, actual: 972.0, variance: -13.2 },
  },
  {
    categoryId: 'mw_shirts', categoryName: 'Men Western: Casual Shirts', period: 'Oct 2026',
    volume: { plan: 32.5, actual: 31.8, variance: -2.2 },
    asp: { plan: 780, actual: 792, variance: 1.5 },
    intakeGm: { plan: 47.2, actual: 46.5, variance: -1.5 },
    gmPct: { plan: 36.8, actual: 36.2, variance: -1.6 },
    grossRevenue: { plan: 1990.0, actual: 1950.0, variance: -2.0 },
    netRevenue: { plan: 1890.0, actual: 1850.0, variance: -2.1 },
  },
  {
    categoryId: 'mw_formal_shirts', categoryName: 'Men Western: Formal Shirts', period: 'Oct 2026',
    volume: { plan: 22.8, actual: 22.0, variance: -3.5 },
    asp: { plan: 850, actual: 862, variance: 1.4 },
    intakeGm: { plan: 48.5, actual: 47.2, variance: -2.7 },
    gmPct: { plan: 37.5, actual: 36.3, variance: -3.2 },
    grossRevenue: { plan: 1450.0, actual: 1400.0, variance: -3.4 },
    netRevenue: { plan: 1375.0, actual: 1330.0, variance: -3.3 },
  },
  {
    categoryId: 'mw_formal_trouser', categoryName: 'Men Western: Formal Trouser & Suits', period: 'Oct 2026',
    volume: { plan: 18.5, actual: 18.0, variance: -2.7 },
    asp: { plan: 920, actual: 935, variance: 1.6 },
    intakeGm: { plan: 49.0, actual: 47.5, variance: -3.1 },
    gmPct: { plan: 38.2, actual: 37.0, variance: -3.1 },
    grossRevenue: { plan: 1320.0, actual: 1280.0, variance: -3.0 },
    netRevenue: { plan: 1250.0, actual: 1215.0, variance: -2.8 },
  },
  {
    categoryId: 'mi_festive', categoryName: 'Men Indian: Festive Wear', period: 'Oct 2026',
    volume: { plan: 15.2, actual: 15.8, variance: 3.9 },
    asp: { plan: 650, actual: 665, variance: 2.3 },
    intakeGm: { plan: 46.0, actual: 47.5, variance: 3.3 },
    gmPct: { plan: 35.5, actual: 36.8, variance: 3.7 },
    grossRevenue: { plan: 890.0, actual: 920.0, variance: 3.4 },
    netRevenue: { plan: 845.0, actual: 875.0, variance: 3.6 },
  },
  {
    categoryId: 'm_sports', categoryName: 'Men: Sports / Athleisure', period: 'Oct 2026',
    volume: { plan: 38.5, actual: 37.5, variance: -2.6 },
    asp: { plan: 520, actual: 530, variance: 1.9 },
    intakeGm: { plan: 43.5, actual: 42.8, variance: -1.6 },
    gmPct: { plan: 33.8, actual: 33.2, variance: -1.8 },
    grossRevenue: { plan: 760.0, actual: 740.0, variance: -2.6 },
    netRevenue: { plan: 720.0, actual: 702.0, variance: -2.5 },
  },
  {
    categoryId: 'ww_tops', categoryName: 'Women: Western Tops', period: 'Oct 2026',
    volume: { plan: 42.5, actual: 41.5, variance: -2.4 },
    asp: { plan: 550, actual: 560, variance: 1.8 },
    intakeGm: { plan: 44.2, actual: 43.0, variance: -2.7 },
    gmPct: { plan: 34.0, actual: 33.0, variance: -2.9 },
    grossRevenue: { plan: 1250.0, actual: 1220.0, variance: -2.4 },
    netRevenue: { plan: 1185.0, actual: 1158.0, variance: -2.3 },
  },
  {
    categoryId: 'ww_dress', categoryName: 'Women: Western Dress & Jackets', period: 'Oct 2026',
    volume: { plan: 18.8, actual: 18.2, variance: -3.2 },
    asp: { plan: 780, actual: 790, variance: 1.3 },
    intakeGm: { plan: 46.5, actual: 45.0, variance: -3.2 },
    gmPct: { plan: 35.8, actual: 34.5, variance: -3.6 },
    grossRevenue: { plan: 980.0, actual: 950.0, variance: -3.1 },
    netRevenue: { plan: 930.0, actual: 902.0, variance: -3.0 },
  },
  {
    categoryId: 'ww_denim', categoryName: 'Women Western Denim Bottoms', period: 'Oct 2026',
    volume: { plan: 22.5, actual: 19.8, variance: -12.0 },
    asp: { plan: 690, actual: 670, variance: -2.9 },
    intakeGm: { plan: 45.0, actual: 39.5, variance: -12.2 },
    gmPct: { plan: 34.5, actual: 30.2, variance: -12.5 },
    grossRevenue: { plan: 880.0, actual: 770.0, variance: -12.5 },
    netRevenue: { plan: 835.0, actual: 730.0, variance: -12.6 },
  },
  {
    categoryId: 'ww_nondenim', categoryName: 'Women Western Non-Denim Bottoms', period: 'Oct 2026',
    volume: { plan: 28.2, actual: 27.5, variance: -2.5 },
    asp: { plan: 520, actual: 528, variance: 1.5 },
    intakeGm: { plan: 43.0, actual: 42.0, variance: -2.3 },
    gmPct: { plan: 33.2, actual: 32.5, variance: -2.1 },
    grossRevenue: { plan: 720.0, actual: 702.0, variance: -2.5 },
    netRevenue: { plan: 683.0, actual: 666.0, variance: -2.5 },
  },
  {
    categoryId: 'wi_kurta', categoryName: 'Women Indian Kurta/SKD/Bottoms', period: 'Oct 2026',
    volume: { plan: 25.5, actual: 25.8, variance: 1.2 },
    asp: { plan: 620, actual: 632, variance: 1.9 },
    intakeGm: { plan: 47.5, actual: 48.0, variance: 1.1 },
    gmPct: { plan: 36.8, actual: 37.2, variance: 1.1 },
    grossRevenue: { plan: 1070.0, actual: 1085.0, variance: 1.4 },
    netRevenue: { plan: 1015.0, actual: 1030.0, variance: 1.5 },
  },
  {
    categoryId: 'wi_saree', categoryName: 'Women Indian: Saree/Lehenga', period: 'Oct 2026',
    volume: { plan: 12.8, actual: 13.1, variance: 2.3 },
    asp: { plan: 850, actual: 868, variance: 2.1 },
    intakeGm: { plan: 48.0, actual: 48.8, variance: 1.7 },
    gmPct: { plan: 37.2, actual: 37.8, variance: 1.6 },
    grossRevenue: { plan: 850.0, actual: 870.0, variance: 2.4 },
    netRevenue: { plan: 808.0, actual: 827.0, variance: 2.4 },
  },
  {
    categoryId: 'wi_festive', categoryName: 'Women Indian/Fusion: Festive SKD', period: 'Oct 2026',
    volume: { plan: 18.5, actual: 18.9, variance: 2.2 },
    asp: { plan: 720, actual: 735, variance: 2.1 },
    intakeGm: { plan: 47.0, actual: 47.8, variance: 1.7 },
    gmPct: { plan: 36.5, actual: 37.0, variance: 1.4 },
    grossRevenue: { plan: 940.0, actual: 960.0, variance: 2.1 },
    netRevenue: { plan: 893.0, actual: 912.0, variance: 2.1 },
  },
  {
    categoryId: 'w_sports', categoryName: 'Women: Sports / Athleisure', period: 'Oct 2026',
    volume: { plan: 32.5, actual: 31.7, variance: -2.5 },
    asp: { plan: 480, actual: 488, variance: 1.7 },
    intakeGm: { plan: 42.5, actual: 41.8, variance: -1.6 },
    gmPct: { plan: 32.8, actual: 32.2, variance: -1.8 },
    grossRevenue: { plan: 680.0, actual: 662.0, variance: -2.6 },
    netRevenue: { plan: 645.0, actual: 628.0, variance: -2.6 },
  },
];

// ─── Store Variance Data (Updated Structure) ───────────────────────

export interface StoreVariance {
  storeId: string;
  storeName: string;
  period: string;
  volume: { plan: number; actual: number; variance: number };
  asp: { plan: number; actual: number; variance: number };
  intakeGm: { plan: number; actual: number; variance: number };
  gmPct: { plan: number; actual: number; variance: number };
  grossRevenue: { plan: number; actual: number; variance: number };
  netRevenue: { plan: number; actual: number; variance: number };
}

export const mockStoreVariance: StoreVariance[] = [
  {
    storeId: 'store_001', storeName: 'Brahmapur Church Rd', period: 'Oct 2026',
    volume: { plan: 8.5, actual: 8.1, variance: -4.71 },
    asp: { plan: 620, actual: 632, variance: 1.94 },
    intakeGm: { plan: 44.5, actual: 43.2, variance: -2.92 },
    gmPct: { plan: 34.2, actual: 33.1, variance: -3.22 },
    grossRevenue: { plan: 450.0, actual: 430.0, variance: -4.44 },
    netRevenue: { plan: 427.0, actual: 408.0, variance: -4.45 },
  },
  {
    storeId: 'store_002', storeName: 'CoochBehar SN Road', period: 'Oct 2026',
    volume: { plan: 9.2, actual: 8.0, variance: -13.04 },
    asp: { plan: 650, actual: 625, variance: -3.85 },
    intakeGm: { plan: 45.0, actual: 38.5, variance: -14.44 },
    gmPct: { plan: 35.0, actual: 30.5, variance: -12.86 },
    grossRevenue: { plan: 520.0, actual: 460.0, variance: -11.54 },
    netRevenue: { plan: 494.0, actual: 437.0, variance: -11.54 },
  },
  {
    storeId: 'store_003', storeName: 'Gangtok Golden Plaza', period: 'Oct 2026',
    volume: { plan: 6.8, actual: 7.0, variance: 2.94 },
    asp: { plan: 580, actual: 595, variance: 2.59 },
    intakeGm: { plan: 43.5, actual: 44.8, variance: 2.99 },
    gmPct: { plan: 33.5, actual: 34.5, variance: 2.99 },
    grossRevenue: { plan: 380.0, actual: 390.0, variance: 2.63 },
    netRevenue: { plan: 361.0, actual: 371.0, variance: 2.77 },
  },
  {
    storeId: 'store_004', storeName: 'Jalpaiguri Kadamtala', period: 'Oct 2026',
    volume: { plan: 5.8, actual: 5.0, variance: -13.79 },
    asp: { plan: 590, actual: 568, variance: -3.73 },
    intakeGm: { plan: 44.0, actual: 36.5, variance: -17.05 },
    gmPct: { plan: 34.0, actual: 28.8, variance: -15.29 },
    grossRevenue: { plan: 340.0, actual: 300.0, variance: -11.76 },
    netRevenue: { plan: 323.0, actual: 285.0, variance: -11.76 },
  },
  {
    storeId: 'store_005', storeName: 'Kottayam Vettiyil', period: 'Oct 2026',
    volume: { plan: 5.2, actual: 5.0, variance: -3.85 },
    asp: { plan: 600, actual: 608, variance: 1.33 },
    intakeGm: { plan: 44.2, actual: 42.5, variance: -3.85 },
    gmPct: { plan: 34.0, actual: 32.5, variance: -4.41 },
    grossRevenue: { plan: 290.0, actual: 280.0, variance: -3.45 },
    netRevenue: { plan: 275.0, actual: 266.0, variance: -3.27 },
  },
  {
    storeId: 'store_006', storeName: 'Mangalore CityCentre', period: 'Oct 2026',
    volume: { plan: 5.5, actual: 5.1, variance: -7.27 },
    asp: { plan: 610, actual: 618, variance: 1.31 },
    intakeGm: { plan: 44.5, actual: 42.0, variance: -5.62 },
    gmPct: { plan: 34.2, actual: 32.2, variance: -5.85 },
    grossRevenue: { plan: 310.0, actual: 290.0, variance: -6.45 },
    netRevenue: { plan: 294.0, actual: 275.0, variance: -6.46 },
  },
  {
    storeId: 'store_007', storeName: 'Nellore Kondayapalem', period: 'Oct 2026',
    volume: { plan: 4.8, actual: 4.8, variance: 0.00 },
    asp: { plan: 570, actual: 575, variance: 0.88 },
    intakeGm: { plan: 43.0, actual: 43.0, variance: 0.00 },
    gmPct: { plan: 33.0, actual: 33.2, variance: 0.61 },
    grossRevenue: { plan: 260.0, actual: 260.0, variance: 0.00 },
    netRevenue: { plan: 247.0, actual: 247.0, variance: 0.00 },
  },
  {
    storeId: 'store_008', storeName: 'RRL Trends Haralur', period: 'Oct 2026',
    volume: { plan: 4.2, actual: 4.0, variance: -4.76 },
    asp: { plan: 560, actual: 568, variance: 1.43 },
    intakeGm: { plan: 42.5, actual: 42.5, variance: 0.00 },
    gmPct: { plan: 32.5, actual: 32.5, variance: 0.00 },
    grossRevenue: { plan: 220.0, actual: 210.0, variance: -4.55 },
    netRevenue: { plan: 209.0, actual: 200.0, variance: -4.31 },
  },
  {
    storeId: 'store_009', storeName: 'RRL Trends Namchi Li', period: 'Oct 2026',
    volume: { plan: 5.0, actual: 4.6, variance: -8.00 },
    asp: { plan: 580, actual: 588, variance: 1.38 },
    intakeGm: { plan: 43.5, actual: 41.2, variance: -5.29 },
    gmPct: { plan: 33.5, actual: 31.8, variance: -5.07 },
    grossRevenue: { plan: 270.0, actual: 250.0, variance: -7.41 },
    netRevenue: { plan: 256.0, actual: 237.0, variance: -7.42 },
  },
  {
    storeId: 'store_010', storeName: 'TV Lucknow Qaiser Ba', period: 'Oct 2026',
    volume: { plan: 6.2, actual: 5.8, variance: -6.45 },
    asp: { plan: 630, actual: 640, variance: 1.59 },
    intakeGm: { plan: 44.8, actual: 43.2, variance: -3.57 },
    gmPct: { plan: 34.5, actual: 33.2, variance: -3.77 },
    grossRevenue: { plan: 350.0, actual: 330.0, variance: -5.71 },
    netRevenue: { plan: 332.0, actual: 313.0, variance: -5.72 },
  },
  {
    storeId: 'store_011', storeName: 'TW Vaikom', period: 'Oct 2026',
    volume: { plan: 3.8, actual: 4.0, variance: 5.26 },
    asp: { plan: 540, actual: 555, variance: 2.78 },
    intakeGm: { plan: 42.0, actual: 43.8, variance: 4.29 },
    gmPct: { plan: 32.2, actual: 33.8, variance: 4.97 },
    grossRevenue: { plan: 190.0, actual: 200.0, variance: 5.26 },
    netRevenue: { plan: 180.0, actual: 190.0, variance: 5.56 },
  },
  {
    storeId: 'store_012', storeName: 'Vizag Daba Garden', period: 'Oct 2026',
    volume: { plan: 7.5, actual: 6.9, variance: -8.00 },
    asp: { plan: 640, actual: 650, variance: 1.56 },
    intakeGm: { plan: 45.2, actual: 42.0, variance: -7.08 },
    gmPct: { plan: 35.0, actual: 32.5, variance: -7.14 },
    grossRevenue: { plan: 420.0, actual: 390.0, variance: -7.14 },
    netRevenue: { plan: 399.0, actual: 370.0, variance: -7.27 },
  },
];

// ─── Format Variance Data ───────────────────────────────────────

export interface FormatVariance {
  formatId: string;
  formatName: string;
  period: string;
  volume: { plan: number; actual: number; variance: number };
  asp: { plan: number; actual: number; variance: number };
  intakeGm: { plan: number; actual: number; variance: number };
  gmPct: { plan: number; actual: number; variance: number };
  grossRevenue: { plan: number; actual: number; variance: number };
  netRevenue: { plan: number; actual: number; variance: number };
}

export const mockFormatVariance: FormatVariance[] = [
  {
    formatId: 'trends', formatName: 'TRENDS', period: 'Oct 2026',
    volume: { plan: 185.5, actual: 178.2, variance: -3.94 },
    asp: { plan: 720, actual: 735, variance: 2.08 },
    intakeGm: { plan: 46.5, actual: 45.1, variance: -3.01 },
    gmPct: { plan: 36.2, actual: 34.8, variance: -3.87 },
    grossRevenue: { plan: 11850.0, actual: 11520.0, variance: -2.78 },
    netRevenue: { plan: 11250.0, actual: 10950.0, variance: -2.67 },
  },
  {
    formatId: 'ajio', formatName: 'Ajio', period: 'Oct 2026',
    volume: { plan: 52.8, actual: 54.2, variance: 2.65 },
    asp: { plan: 540, actual: 555, variance: 2.78 },
    intakeGm: { plan: 42.5, actual: 43.8, variance: 3.06 },
    gmPct: { plan: 32.8, actual: 33.9, variance: 3.35 },
    grossRevenue: { plan: 2480.0, actual: 2620.0, variance: 5.65 },
    netRevenue: { plan: 2350.0, actual: 2485.0, variance: 5.74 },
  },
  {
    formatId: 'shein', formatName: 'Shein', period: 'Oct 2026',
    volume: { plan: 45.2, actual: 48.8, variance: 7.96 },
    asp: { plan: 480, actual: 495, variance: 3.13 },
    intakeGm: { plan: 39.5, actual: 41.5, variance: 5.06 },
    gmPct: { plan: 30.2, actual: 31.8, variance: 5.30 },
    grossRevenue: { plan: 1920.0, actual: 2140.0, variance: 11.46 },
    netRevenue: { plan: 1820.0, actual: 2030.0, variance: 11.54 },
  },
  {
    formatId: 'fashion_factory', formatName: 'FASHION FACTORY', period: 'Oct 2026',
    volume: { plan: 95.2, actual: 91.5, variance: -3.89 },
    asp: { plan: 650, actual: 662, variance: 1.85 },
    intakeGm: { plan: 44.0, actual: 42.8, variance: -2.73 },
    gmPct: { plan: 34.0, actual: 32.9, variance: -3.24 },
    grossRevenue: { plan: 5520.0, actual: 5350.0, variance: -3.08 },
    netRevenue: { plan: 5240.0, actual: 5080.0, variance: -3.05 },
  },
  {
    formatId: 'smart_bazar', formatName: 'Smart Bazar', period: 'Oct 2026',
    volume: { plan: 118.5, actual: 114.2, variance: -3.63 },
    asp: { plan: 520, actual: 532, variance: 2.31 },
    intakeGm: { plan: 41.5, actual: 40.5, variance: -2.41 },
    gmPct: { plan: 32.0, actual: 31.2, variance: -2.50 },
    grossRevenue: { plan: 5280.0, actual: 5120.0, variance: -3.03 },
    netRevenue: { plan: 5015.0, actual: 4865.0, variance: -2.99 },
  },
  {
    formatId: 'footwear', formatName: 'FOOTWEAR', period: 'Oct 2026',
    volume: { plan: 42.5, actual: 40.8, variance: -4.00 },
    asp: { plan: 890, actual: 905, variance: 1.69 },
    intakeGm: { plan: 48.0, actual: 46.5, variance: -3.13 },
    gmPct: { plan: 37.5, actual: 36.2, variance: -3.47 },
    grossRevenue: { plan: 3250.0, actual: 3180.0, variance: -2.15 },
    netRevenue: { plan: 3085.0, actual: 3020.0, variance: -2.11 },
  },
  {
    formatId: 'yousta', formatName: 'YOUSTA', period: 'Oct 2026',
    volume: { plan: 68.5, actual: 65.2, variance: -4.82 },
    asp: { plan: 580, actual: 592, variance: 2.07 },
    intakeGm: { plan: 43.2, actual: 41.8, variance: -3.24 },
    gmPct: { plan: 33.5, actual: 32.5, variance: -2.99 },
    grossRevenue: { plan: 3520.0, actual: 3420.0, variance: -2.84 },
    netRevenue: { plan: 3345.0, actual: 3250.0, variance: -2.84 },
  },
  {
    formatId: 'azorte', formatName: 'AZORTE', period: 'Oct 2026',
    volume: { plan: 28.5, actual: 24.8, variance: -12.98 },
    asp: { plan: 850, actual: 820, variance: -3.53 },
    intakeGm: { plan: 49.5, actual: 43.2, variance: -12.73 },
    gmPct: { plan: 39.0, actual: 34.2, variance: -12.31 },
    grossRevenue: { plan: 2180.0, actual: 1850.0, variance: -15.14 },
    netRevenue: { plan: 2070.0, actual: 1755.0, variance: -15.22 },
  },
  {
    formatId: 'gap', formatName: 'GAP', period: 'Oct 2026',
    volume: { plan: 35.2, actual: 30.5, variance: -13.35 },
    asp: { plan: 920, actual: 895, variance: -2.72 },
    intakeGm: { plan: 50.5, actual: 44.5, variance: -11.88 },
    gmPct: { plan: 40.0, actual: 35.5, variance: -11.25 },
    grossRevenue: { plan: 2950.0, actual: 2520.0, variance: -14.58 },
    netRevenue: { plan: 2800.0, actual: 2390.0, variance: -14.64 },
  },
  {
    formatId: 'jiomart', formatName: 'Jio Mart', period: 'Oct 2026',
    volume: { plan: 38.5, actual: 39.8, variance: 3.38 },
    asp: { plan: 520, actual: 535, variance: 2.88 },
    intakeGm: { plan: 41.0, actual: 42.2, variance: 2.93 },
    gmPct: { plan: 31.5, actual: 32.5, variance: 3.17 },
    grossRevenue: { plan: 1850.0, actual: 1920.0, variance: 3.78 },
    netRevenue: { plan: 1755.0, actual: 1820.0, variance: 3.70 },
  },
  {
    formatId: 'vretail', formatName: 'VRetail', period: 'Oct 2026',
    volume: { plan: 82.5, actual: 79.8, variance: -3.27 },
    asp: { plan: 690, actual: 705, variance: 2.17 },
    intakeGm: { plan: 45.5, actual: 44.2, variance: -2.86 },
    gmPct: { plan: 35.2, actual: 34.2, variance: -2.84 },
    grossRevenue: { plan: 4820.0, actual: 4720.0, variance: -2.07 },
    netRevenue: { plan: 4575.0, actual: 4485.0, variance: -1.97 },
  },
  {
    formatId: 'export', formatName: 'Export', period: 'Oct 2026',
    volume: { plan: 5.8, actual: 6.2, variance: 6.90 },
    asp: { plan: 1250, actual: 1285, variance: 2.80 },
    intakeGm: { plan: 52.0, actual: 53.5, variance: 2.88 },
    gmPct: { plan: 42.5, actual: 43.8, variance: 3.06 },
    grossRevenue: { plan: 650.0, actual: 695.0, variance: 6.92 },
    netRevenue: { plan: 618.0, actual: 660.0, variance: 6.80 },
  },
  {
    formatId: 'zivame', formatName: 'ZIVAME', period: 'Oct 2026',
    volume: { plan: 18.5, actual: 16.2, variance: -12.43 },
    asp: { plan: 780, actual: 750, variance: -3.85 },
    intakeGm: { plan: 48.5, actual: 42.8, variance: -11.75 },
    gmPct: { plan: 38.5, actual: 34.2, variance: -11.17 },
    grossRevenue: { plan: 1280.0, actual: 1095.0, variance: -14.45 },
    netRevenue: { plan: 1215.0, actual: 1040.0, variance: -14.40 },
  },
  {
    formatId: 'clovia', formatName: 'CLOVIA', period: 'Oct 2026',
    volume: { plan: 22.5, actual: 19.8, variance: -12.00 },
    asp: { plan: 720, actual: 695, variance: -3.47 },
    intakeGm: { plan: 47.5, actual: 42.0, variance: -11.58 },
    gmPct: { plan: 37.8, actual: 33.8, variance: -10.58 },
    grossRevenue: { plan: 1485.0, actual: 1260.0, variance: -15.15 },
    netRevenue: { plan: 1410.0, actual: 1195.0, variance: -15.25 },
  },
  {
    formatId: 'amante', formatName: 'AMANTE', period: 'Oct 2026',
    volume: { plan: 15.8, actual: 13.5, variance: -14.56 },
    asp: { plan: 850, actual: 820, variance: -3.53 },
    intakeGm: { plan: 49.0, actual: 42.5, variance: -13.27 },
    gmPct: { plan: 39.5, actual: 34.8, variance: -11.90 },
    grossRevenue: { plan: 1220.0, actual: 1015.0, variance: -16.80 },
    netRevenue: { plan: 1160.0, actual: 965.0, variance: -16.81 },
  },
  {
    formatId: 'swadesh', formatName: 'SWADESH', period: 'Oct 2026',
    volume: { plan: 8.5, actual: 8.8, variance: 3.53 },
    asp: { plan: 950, actual: 975, variance: 2.63 },
    intakeGm: { plan: 50.0, actual: 51.5, variance: 3.00 },
    gmPct: { plan: 40.5, actual: 41.8, variance: 3.21 },
    grossRevenue: { plan: 720.0, actual: 745.0, variance: 3.47 },
    netRevenue: { plan: 685.0, actual: 708.0, variance: 3.36 },
  },
];

// ─── Channel Variance Data ──────────────────────────────────────

export interface ChannelVariance {
  channelId: string;
  channelName: string;
  period: string;
  volume: { plan: number; actual: number; variance: number };
  asp: { plan: number; actual: number; variance: number };
  intakeGm: { plan: number; actual: number; variance: number };
  gmPct: { plan: number; actual: number; variance: number };
  grossRevenue: { plan: number; actual: number; variance: number };
  netRevenue: { plan: number; actual: number; variance: number };
}

export const mockChannelVariance: ChannelVariance[] = [
  {
    channelId: 'offline_stores', channelName: 'Offline Stores', period: 'Oct 2026',
    volume: { plan: 485.2, actual: 465.8, variance: -4.00 },
    asp: { plan: 690, actual: 705, variance: 2.17 },
    intakeGm: { plan: 45.8, actual: 44.5, variance: -2.84 },
    gmPct: { plan: 35.2, actual: 33.8, variance: -3.98 },
    grossRevenue: { plan: 28150.0, actual: 27620.0, variance: -1.88 },
    netRevenue: { plan: 26700.0, actual: 26200.0, variance: -1.87 },
  },
  {
    channelId: 'online_business', channelName: 'Online Business', period: 'Oct 2026',
    volume: { plan: 120.5, actual: 124.8, variance: 3.57 },
    asp: { plan: 520, actual: 535, variance: 2.88 },
    intakeGm: { plan: 41.5, actual: 42.8, variance: 3.13 },
    gmPct: { plan: 31.8, actual: 33.1, variance: 4.09 },
    grossRevenue: { plan: 5580.0, actual: 5920.0, variance: 6.09 },
    netRevenue: { plan: 5290.0, actual: 5610.0, variance: 6.05 },
  },
  {
    channelId: 'distribution_lfr_ecom', channelName: 'Distribution, LFR & ECOM', period: 'Oct 2026',
    volume: { plan: 95.8, actual: 88.5, variance: -7.62 },
    asp: { plan: 550, actual: 542, variance: -1.45 },
    intakeGm: { plan: 42.0, actual: 39.8, variance: -5.24 },
    gmPct: { plan: 32.5, actual: 30.8, variance: -5.23 },
    grossRevenue: { plan: 4520.0, actual: 4150.0, variance: -8.19 },
    netRevenue: { plan: 4280.0, actual: 3935.0, variance: -8.06 },
  },
  {
    channelId: 'inter_format_ajio', channelName: 'Inter format sales- Ajio', period: 'Oct 2026',
    volume: { plan: 52.8, actual: 54.5, variance: 3.22 },
    asp: { plan: 540, actual: 555, variance: 2.78 },
    intakeGm: { plan: 42.0, actual: 43.2, variance: 2.86 },
    gmPct: { plan: 32.5, actual: 33.6, variance: 3.38 },
    grossRevenue: { plan: 2480.0, actual: 2640.0, variance: 6.45 },
    netRevenue: { plan: 2350.0, actual: 2505.0, variance: 6.60 },
  },
  {
    channelId: 'export', channelName: 'Export', period: 'Oct 2026',
    volume: { plan: 5.8, actual: 6.2, variance: 6.90 },
    asp: { plan: 1250, actual: 1285, variance: 2.80 },
    intakeGm: { plan: 52.0, actual: 53.5, variance: 2.88 },
    gmPct: { plan: 42.5, actual: 43.8, variance: 3.06 },
    grossRevenue: { plan: 650.0, actual: 695.0, variance: 6.92 },
    netRevenue: { plan: 618.0, actual: 660.0, variance: 6.80 },
  },
  {
    channelId: 'inter_format_sales', channelName: 'Inter format sales', period: 'Oct 2026',
    volume: { plan: 45.2, actual: 42.8, variance: -5.31 },
    asp: { plan: 620, actual: 612, variance: -1.29 },
    intakeGm: { plan: 43.5, actual: 41.8, variance: -3.91 },
    gmPct: { plan: 33.8, actual: 32.5, variance: -3.85 },
    grossRevenue: { plan: 2450.0, actual: 2320.0, variance: -5.31 },
    netRevenue: { plan: 2325.0, actual: 2200.0, variance: -5.38 },
  },
];
