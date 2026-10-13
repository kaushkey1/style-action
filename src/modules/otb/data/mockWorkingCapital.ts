export interface WorkingCapitalMetric {
  id: string;
  name: string;
  value: string;
  target: string;
  status: 'on-track' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
}

export interface ValueAtRiskBucket {
  ageBucket: string;
  value_cr: number;
  risk_pct: number;
  interest_cost_lakh: number;
}

export const workingCapitalMetrics: WorkingCapitalMetric[] = [
  {
    id: 'a1b2c3d4-4001-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Daily Revenue Run Rate',
    value: '₹82 Cr',
    target: '₹100 Cr',
    status: 'warning',
    trend: 'up',
    trendValue: '+₹5 Cr',
  },
  {
    id: 'a1b2c3d4-4002-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Inventory Days',
    value: '95 days',
    target: '90 days',
    status: 'warning',
    trend: 'down',
    trendValue: '-5 days',
  },
  {
    id: 'a1b2c3d4-4003-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Vendor Credit Days',
    value: '28 days',
    target: '30 days',
    status: 'warning',
    trend: 'flat',
  },
  {
    id: 'a1b2c3d4-4004-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'First-Through in 45d',
    value: '42%',
    target: '50%',
    status: 'warning',
    trend: 'up',
    trendValue: '+3%',
  },
  {
    id: 'a1b2c3d4-4005-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Cash Conversion Cycle',
    value: '67 days',
    target: '60 days',
    status: 'warning',
    trend: 'down',
    trendValue: '-4 days',
  },
  {
    id: 'a1b2c3d4-4006-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Total Inventory Value',
    value: '₹1,476 Cr',
    target: '--',
    status: 'on-track',
  },
];

export const valueAtRiskBuckets: ValueAtRiskBucket[] = [
  { ageBucket: '0-30 days', value_cr: 180, risk_pct: 2, interest_cost_lakh: 15 },
  { ageBucket: '31-60 days', value_cr: 285, risk_pct: 5, interest_cost_lakh: 47 },
  { ageBucket: '61-90 days', value_cr: 165, risk_pct: 10, interest_cost_lakh: 41 },
  { ageBucket: '91-120 days', value_cr: 148, risk_pct: 20, interest_cost_lakh: 74 },
  { ageBucket: '121-150 days', value_cr: 125, risk_pct: 35, interest_cost_lakh: 109 },
  { ageBucket: '151-180 days', value_cr: 92, risk_pct: 50, interest_cost_lakh: 115 },
  { ageBucket: '180+ days', value_cr: 325, risk_pct: 75, interest_cost_lakh: 610 },
];

export const workingCapitalSummary = {
  totalInventory_cr: 1476,
  totalVAR_cr: Math.round(valueAtRiskBuckets.reduce((sum, b) => sum + b.value_cr * b.risk_pct / 100, 0)),
  totalInterestCost_cr: Math.round(valueAtRiskBuckets.reduce((sum, b) => sum + b.interest_cost_lakh, 0)) / 100,
  agedInventory_cr: 325,
};
