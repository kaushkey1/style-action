export interface StrikeTriggerRule {
  id: string;
  name: string;
  condition: string;
  kpiId: string;
  severity: 'S1' | 'S2';
  autoStrikeAfter: string;    // e.g., "3 consecutive weeks" or "2 months"
  description: string;
}

export interface RestructuringAction {
  id: string;
  categoryTeamId: string;
  triggerDate: string;
  status: 'proposed' | 'in-progress' | 'completed';
  actions: { type: string; description: string; assignedTo: string; deadline: string; status: 'pending' | 'done' }[];
}

export interface StrikeResetCondition {
  id: string;
  name: string;
  criteria: string;
  reviewCycle: string;
}

export const strikeTriggerRules: StrikeTriggerRule[] = [
  { id: 'a1b2c3d4-2001-4a5b-8c6d-7e8f9a0b1c2d', name: 'Sell-Through Breach', condition: 'Sell-through < 80% for 3 consecutive weeks', kpiId: 'K001', severity: 'S2', autoStrikeAfter: '3 consecutive weeks', description: 'Triggers when 15-day sell-through remains below 80% target for three straight measurement windows' },
  { id: 'a1b2c3d4-2002-4a5b-8c6d-7e8f9a0b1c2d', name: 'Negative Growth', condition: 'YoY growth negative for 2 consecutive months', kpiId: 'K001', severity: 'S1', autoStrikeAfter: '2 months', description: 'Triggers when category shows negative year-over-year growth for two straight months' },
  { id: 'a1b2c3d4-2003-4a5b-8c6d-7e8f9a0b1c2d', name: 'Operating Loss', condition: 'EBITDA negative for 1 quarter', kpiId: 'K169', severity: 'S1', autoStrikeAfter: '1 quarter', description: 'Triggers when category reports operating loss (negative EBITDA) for a full quarter' },
  { id: 'a1b2c3d4-2004-4a5b-8c6d-7e8f9a0b1c2d', name: 'Customer NPS Collapse', condition: 'NPS < 60 for 4 consecutive weeks', kpiId: 'K018', severity: 'S2', autoStrikeAfter: '4 weeks', description: 'Triggers when customer NPS drops below 60 threshold for four straight weeks' },
  { id: 'a1b2c3d4-2005-4a5b-8c6d-7e8f9a0b1c2d', name: 'Inventory Aging Crisis', condition: 'Aged inventory > 25% of total for 2 months', kpiId: 'K029', severity: 'S1', autoStrikeAfter: '2 months', description: 'Triggers when aged inventory (>90 days) exceeds 25% of category stock for two months' },
  { id: 'a1b2c3d4-2006-4a5b-8c6d-7e8f9a0b1c2d', name: 'Conversion Decline', condition: 'Conversion rate < 25% for 3 consecutive weeks', kpiId: 'K008', severity: 'S2', autoStrikeAfter: '3 weeks', description: 'Triggers when store/category conversion drops below 25% for three measurement periods' },
];

export const restructuringActions: RestructuringAction[] = [
  {
    id: 'a1b2c3d4-2101-4a5b-8c6d-7e8f9a0b1c2d',
    categoryTeamId: 'a1b2c3d4-1004-4a5b-8c6d-7e8f9a0b1c2d', // Menswear Formal
    triggerDate: '2026-02-01',
    status: 'in-progress',
    actions: [
      { type: 'Leadership Review', description: 'Category Head performance review with CEO', assignedTo: 'CEO', deadline: '2026-02-15', status: 'done' },
      { type: 'Space Reallocation', description: 'Reduce floor space from 28,000 to 20,000 sqft', assignedTo: 'Ops Head', deadline: '2026-02-28', status: 'pending' },
      { type: 'Range Rationalization', description: 'Cut SKU count from 450 to 280 styles', assignedTo: 'Range Architect (RA1)', deadline: '2026-03-01', status: 'pending' },
      { type: 'Team Restructuring', description: 'Merge with Menswear Casual team under single head', assignedTo: 'HR Head', deadline: '2026-03-15', status: 'pending' },
      { type: 'Budget Revision', description: 'Revise OTB from ₹120 Cr to ₹80 Cr', assignedTo: 'Finance Head', deadline: '2026-02-20', status: 'done' },
    ],
  },
  {
    id: 'a1b2c3d4-2102-4a5b-8c6d-7e8f9a0b1c2d',
    categoryTeamId: 'a1b2c3d4-100c-4a5b-8c6d-7e8f9a0b1c2d', // Winter & Outerwear
    triggerDate: '2026-01-05',
    status: 'in-progress',
    actions: [
      { type: 'Leadership Review', description: 'Category Head replacement initiated', assignedTo: 'CEO', deadline: '2026-01-20', status: 'done' },
      { type: 'Liquidation Plan', description: 'Aggressive markdown + B2B routing for remaining stock', assignedTo: 'LT1 Agent', deadline: '2026-02-28', status: 'pending' },
      { type: 'Category Evaluation', description: 'Evaluate category viability for AW26 season', assignedTo: 'Strategy Head', deadline: '2026-03-31', status: 'pending' },
      { type: 'Space Reallocation', description: 'Reassign 50% space to Sportswear and Innerwear', assignedTo: 'Space Optimizer (A3)', deadline: '2026-03-01', status: 'pending' },
    ],
  },
];

export const strikeResetConditions: StrikeResetCondition[] = [
  { id: 'a1b2c3d4-2201-4a5b-8c6d-7e8f9a0b1c2d', name: 'Quarterly Recovery', criteria: 'All triggering KPIs return to Green for full quarter', reviewCycle: 'End of quarter' },
  { id: 'a1b2c3d4-2202-4a5b-8c6d-7e8f9a0b1c2d', name: 'Restructuring Completion', criteria: 'All restructuring actions completed + 1 month positive performance', reviewCycle: 'Monthly review' },
  { id: 'a1b2c3d4-2203-4a5b-8c6d-7e8f9a0b1c2d', name: 'CEO Override', criteria: 'CEO explicitly resets strike count with documented rationale', reviewCycle: 'Ad-hoc' },
];
