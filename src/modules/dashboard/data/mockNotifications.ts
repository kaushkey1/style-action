export type NotificationType = 'agent-action' | 'escalation' | 'sla-breach' | 'approval-request' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export const mockNotifications: Notification[] = [
  {
    id: 'n-001',
    type: 'escalation',
    title: 'S1 Exception Escalated',
    description: 'Fabric delay cascade risk escalated to Category Director after SLA breach.',
    timestamp: '2026-02-20T09:45:00+05:30',
    read: false,
    actionUrl: '/exceptions',
  },
  {
    id: 'n-002',
    type: 'approval-request',
    title: 'OTB Lock Needs Dual Sign-off',
    description: 'Womenswear Western SS26 OTB Lock requires Finance Head co-approval.',
    timestamp: '2026-02-20T09:30:00+05:30',
    read: false,
    actionUrl: '/approvals',
  },
  {
    id: 'n-003',
    type: 'agent-action',
    title: 'Replenishment Engine: 23 POs Generated',
    description: 'Auto-generated replenishment POs for fast-moving styles overnight. Fill rate maintained at 94%.',
    timestamp: '2026-02-20T07:00:00+05:30',
    read: false,
    actionUrl: '/agents',
  },
  {
    id: 'n-004',
    type: 'sla-breach',
    title: 'SLA Breach: Style Closure Gate',
    description: 'Menswear Formal Q1 style closure gate SLA expired. Escalated to Category Head.',
    timestamp: '2026-02-20T06:05:00+05:30',
    read: false,
    actionUrl: '/approvals',
  },
  {
    id: 'n-005',
    type: 'agent-action',
    title: 'Price Sentinel: Markdown Adjustments',
    description: 'Adjusted markdown ladder for 42 aged styles. Projected recovery: 12 L.',
    timestamp: '2026-02-20T05:30:00+05:30',
    read: false,
    actionUrl: '/inventory',
  },
  {
    id: 'n-006',
    type: 'approval-request',
    title: 'Below-Cost Markdown Approval',
    description: 'Winter Outerwear batch requires CEO + Finance Head dual sign-off for below-cost sale.',
    timestamp: '2026-02-19T21:00:00+05:30',
    read: true,
    actionUrl: '/approvals',
  },
  {
    id: 'n-007',
    type: 'system',
    title: 'Morning Briefing Ready',
    description: 'Your daily morning briefing for Feb 20, 2026 is ready for review.',
    timestamp: '2026-02-20T07:30:00+05:30',
    read: true,
    actionUrl: '/',
  },
  {
    id: 'n-008',
    type: 'agent-action',
    title: 'Liquidation Trigger: B2B Routing',
    description: 'Initiated B2B outlet routing for 180+ day stock batch LQ-0089 (2,400 units).',
    timestamp: '2026-02-20T07:15:00+05:30',
    read: true,
    actionUrl: '/inventory',
  },
  {
    id: 'n-009',
    type: 'escalation',
    title: 'Vendor OTIF Below Threshold',
    description: 'Bombay Rayon Fashions OTIF at 62% for 3 consecutive weeks. Vendor switch recommended.',
    timestamp: '2026-02-19T18:00:00+05:30',
    read: true,
    actionUrl: '/exceptions',
  },
  {
    id: 'n-010',
    type: 'approval-request',
    title: 'Phase Transition Gate',
    description: "Summer '26 Drop 3 ready for PLAN to BUY phase transition. All milestones green.",
    timestamp: '2026-02-20T06:00:00+05:30',
    read: false,
    actionUrl: '/approvals',
  },
  {
    id: 'n-011',
    type: 'agent-action',
    title: 'Conversion Sentinel Alert',
    description: '5 stores flagged with conversion drop >15%. 3 resolved via CSA redeployment.',
    timestamp: '2026-02-20T04:00:00+05:30',
    read: true,
    actionUrl: '/store-view',
  },
  {
    id: 'n-012',
    type: 'system',
    title: 'Daily Close Summary Available',
    description: 'Yesterday: Revenue 4.8 Cr (92% of target). 18 exceptions resolved, 4 escalated.',
    timestamp: '2026-02-19T17:00:00+05:30',
    read: true,
    actionUrl: '/',
  },
  {
    id: 'n-013',
    type: 'sla-breach',
    title: 'Liquidation Routing SLA Warning',
    description: 'Batch LQ-0089 liquidation routing gate has 9h remaining before escalation to Business Head.',
    timestamp: '2026-02-20T08:00:00+05:30',
    read: false,
    actionUrl: '/approvals',
  },
  {
    id: 'n-014',
    type: 'agent-action',
    title: 'Chase Order Auto-Approved',
    description: 'Style MWC-4521 chase order (3,500 units) auto-approved. Sell-through at 92%, ROS 4.2x.',
    timestamp: '2026-02-19T14:00:00+05:30',
    read: true,
    actionUrl: '/agents',
  },
  {
    id: 'n-015',
    type: 'approval-request',
    title: 'Space Plan Approval Required',
    description: 'Store TRS-0142 refit plan: 15% space reallocation from Formal to Casual.',
    timestamp: '2026-02-19T08:00:00+05:30',
    read: true,
    actionUrl: '/approvals',
  },

  // ── OTB Module Notifications ──────────────────────────────────────────
  {
    id: 'n-016',
    type: 'agent-action',
    title: 'OTB Guardian: Chase Auto-Approved',
    description: 'A11 auto-approved chase reorder for Classic Oxford Shirt — ₹3.1 Cr, 18 stores (within ±10% auto-threshold).',
    timestamp: '2026-02-20T10:15:00+05:30',
    read: false,
    actionUrl: '/otb/core-noos',
  },
  {
    id: 'n-017',
    type: 'escalation',
    title: 'OTB Breach Alert: MW Pod 3',
    description: 'OTB breach alert: MW Pod 3 exceeded 105% cap. PO creation blocked pending reallocation.',
    timestamp: '2026-02-20T08:30:00+05:30',
    read: false,
    actionUrl: '/otb/utilization',
  },
  {
    id: 'n-018',
    type: 'approval-request',
    title: 'Cross-POD Reallocation Approval',
    description: 'Cross-POD reallocation requires approval: ₹33 Cr from WWW Pod 1 → MW Pod 3.',
    timestamp: '2026-02-20T09:00:00+05:30',
    read: false,
    actionUrl: '/approvals',
  },
  {
    id: 'n-019',
    type: 'system',
    title: 'Weekly OTB Reconciliation Ready',
    description: 'Weekly OTB reconciliation ready for review — 3 categories, week ending Feb 28.',
    timestamp: '2026-02-28T18:00:00+05:30',
    read: true,
    actionUrl: '/otb',
  },
];

/** Returns the count of initially unread mock notifications. */
export function getUnreadCount(): number {
  return mockNotifications.filter((n) => !n.read).length;
}
