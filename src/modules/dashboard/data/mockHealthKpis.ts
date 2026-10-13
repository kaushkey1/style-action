export interface HealthKpi {
  id: string;
  label: string;
  value: number;
  valueFormatted: string;
  target: string;
  targetValue: number;
  unit: string;
  status: 'on_track' | 'warning' | 'critical';
  trendDelta: number;
  trendLabel: string;
  trendDirection: 'up' | 'down' | 'flat';
  agentCommentary: string;
  linkedExceptionIds: string[];
  tabDeepLink: string;
}

export const healthKpis: HealthKpi[] = [
  {
    id: 'revenue-vs-aop',
    label: 'Revenue vs AOP',
    value: 74,
    valueFormatted: '₹74 Cr/day',
    target: '₹100 Cr/day',
    targetValue: 100,
    unit: 'Cr/day',
    status: 'critical',
    trendDelta: -3.2,
    trendLabel: 'vs yesterday',
    trendDirection: 'down',
    agentCommentary: 'Revenue run rate declined 3.2% vs yesterday. Kids Wear and Fashion Factory are the primary drags. Menswear and Women Western holding steady.',
    linkedExceptionIds: ['a1b2c3d4-e002-4a5b-8c6d-7e8f9a0b1c2d'],
    tabDeepLink: '/?tab=apex-pulse',
  },
  {
    id: 'gross-margin',
    label: 'Gross Margin %',
    value: 41.7,
    valueFormatted: '41.7%',
    target: '≥42%',
    targetValue: 42,
    unit: '%',
    status: 'warning',
    trendDelta: 0.4,
    trendLabel: 'vs last week',
    trendDirection: 'up',
    agentCommentary: 'GM% improved +0.4pts WoW, approaching the 42% target. Full-price sell-through improving across Trends and Centro formats.',
    linkedExceptionIds: [],
    tabDeepLink: '/?tab=apex-pulse',
  },
  {
    id: 'sell-through',
    label: 'Avg Sell-Through',
    value: 68,
    valueFormatted: '68%',
    target: '≥70%',
    targetValue: 70,
    unit: '%',
    status: 'critical',
    trendDelta: -1.8,
    trendLabel: 'vs last week',
    trendDirection: 'down',
    agentCommentary: 'Sell-through dropped 1.8pts. Fashion Factory at 58% is the worst format. Seasonal styles in Women Indian segment are underperforming.',
    linkedExceptionIds: [],
    tabDeepLink: '/?tab=apex-inventory',
  },
  {
    id: 'aged-stock',
    label: 'Aged Stock %',
    value: 13.85,
    valueFormatted: '13.85%',
    target: '<10.5%',
    targetValue: 10.5,
    unit: '%',
    status: 'critical',
    trendDelta: 1.35,
    trendLabel: 'vs last month',
    trendDirection: 'up',
    agentCommentary: 'Aged inventory at 13.85% (₹262 Cr), breaching the 10.5% threshold. 206 K options aged beyond 180 days. Markdown programme prepared for approval.',
    linkedExceptionIds: ['kpi-aged-inventory'],
    tabDeepLink: '/?tab=apex-inventory',
  },
  {
    id: 'net-sales-plan',
    label: 'Net Revenue vs Plan',
    value: 92,
    valueFormatted: '92%',
    target: '≥100%',
    targetValue: 100,
    unit: '%',
    status: 'warning',
    trendDelta: -1.1,
    trendLabel: 'vs last month',
    trendDirection: 'down',
    agentCommentary: 'Net sales achievement at 92% of plan. Gap driven by lower footfall in Tier-2 markets and delayed EOSS promotions.',
    linkedExceptionIds: [],
    tabDeepLink: '/?tab=apex-pulse',
  },
];

/** 30-day trend mock data for KPI detail drawer */
export const kpiTrendData: Record<string, { date: string; value: number }[]> = {
  'revenue-vs-aop': Array.from({ length: 30 }, (_, i) => ({
    date: `Mar ${i + 1}`,
    value: 70 + Math.random() * 15 + (i > 20 ? -5 : 0),
  })),
  'gross-margin': Array.from({ length: 30 }, (_, i) => ({
    date: `Mar ${i + 1}`,
    value: 38 + Math.random() * 6 + i * 0.1,
  })),
  'sell-through': Array.from({ length: 30 }, (_, i) => ({
    date: `Mar ${i + 1}`,
    value: 65 + Math.random() * 10 - (i > 20 ? 3 : 0),
  })),
  'aged-stock': Array.from({ length: 30 }, (_, i) => ({
    date: `Mar ${i + 1}`,
    value: 10 + i * 0.13 + Math.random() * 1.5,
  })),
  'net-sales-plan': Array.from({ length: 30 }, (_, i) => ({
    date: `Mar ${i + 1}`,
    value: 88 + Math.random() * 8 + (i > 15 ? -2 : 0),
  })),
};
