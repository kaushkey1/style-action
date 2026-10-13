export type AgentStatus = 'active' | 'idle' | 'blocked';
export type AgentDomain = 'Plan' | 'Buy' | 'Make' | 'Move' | 'Sell' | 'Market';
export type HALevel = 'HA4' | 'HA3' | 'HA2' | 'HA1';

export interface AgentAction {
  time: string;
  description: string;
  status: 'success' | 'blocked' | 'pending';
}

export interface Agent {
  id: string;
  shortId: string;
  name: string;
  description: string;
  status: AgentStatus;
  domain: AgentDomain;
  ha_level: HALevel;
  tasksToday: number;
  taskLabel: string;
  successRate: number;
  systems: string[];
  guardrails: string[];
  recentActions: AgentAction[];
  uptime: number;
}

export const mockAgents: Agent[] = [
  {
    id: 'd1a2b3c4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    shortId: 'DS-01',
    name: 'Demand Sensing',
    description: 'Consumes trend signals, competitor data, weather, and events for demand forecasting. Signal validation and confidence scoring.',
    status: 'active',
    domain: 'Plan',
    ha_level: 'HA3',
    tasksToday: 8,
    taskLabel: 'signals processed',
    successRate: 100,
    systems: ['FTF', 'Cortex'],
    guardrails: ['Forecast confidence threshold'],
    uptime: 99.3,
    recentActions: [
      { time: '10:00', description: 'Updated demand forecast with competitor pricing signals', status: 'success' },
      { time: '08:30', description: 'Processed FTF trend lifecycle update: 3 trends declining', status: 'success' },
    ],
  },
  {
    id: 'e2b3c4d5-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
    shortId: 'CC-01',
    name: 'Commercial Control',
    description: 'Tech pack completeness, BOM accuracy, cost simulation, fabric & trim selection, margin gate enforcement.',
    status: 'active',
    domain: 'Buy',
    ha_level: 'HA3',
    tasksToday: 24,
    taskLabel: 'cost sheets verified',
    successRate: 97,
    systems: ['Cortex', 'Procuro', 'Costing Engine'],
    guardrails: ['Fabric Gate', 'Margin floor enforcement'],
    uptime: 99.5,
    recentActions: [
      { time: '10:30', description: 'Blocked PO #PO-4590: fabric not secured in position', status: 'blocked' },
      { time: '10:00', description: 'Cost simulation completed for 24 new styles', status: 'success' },
      { time: '09:15', description: 'Verified BOM accuracy for AW26 range', status: 'success' },
    ],
  },
  {
    id: 'f3c4d5e6-7a8b-4c9d-0e1f-2a3b4c5d6e7f',
    shortId: 'SC-01',
    name: 'Supply Chain Flow',
    description: 'Inventory visibility, store vs warehouse routing, DSD optimization, returns routing, last-mile SLA tracking.',
    status: 'blocked',
    domain: 'Move',
    ha_level: 'HA3',
    tasksToday: 12,
    taskLabel: 'shipments tracked',
    successRate: 88,
    systems: ['IntelliPack', 'Fynd OMS', 'SAP'],
    guardrails: ['Delivery SLA compliance', 'DC utilization thresholds', 'DC Capacity'],
    uptime: 97.5,
    recentActions: [
      { time: '10:30', description: 'BLOCKED: Shipment #SH-9921 held due to QC failure', status: 'blocked' },
      { time: '09:45', description: 'Rerouted 3 shipments via alternate DC (DC-2)', status: 'success' },
      { time: '09:00', description: 'Daily logistics performance report generated', status: 'success' },
    ],
  },
  {
    id: 'a4d5e6f7-8b9c-4d0e-1f2a-3b4c5d6e7f8a',
    shortId: 'SN-01',
    name: 'Sell & Convert',
    description: 'Auto-listing across channels, dynamic pricing, promotion triggers, assisted selling, conversion rate monitoring.',
    status: 'active',
    domain: 'Sell',
    ha_level: 'HA3',
    tasksToday: 156,
    taskLabel: 'listings managed',
    successRate: 96,
    systems: ['Fynd OMS', 'Cortex', 'POS'],
    guardrails: ['Retail Margin Floor', 'Price parity monitoring'],
    uptime: 99.2,
    recentActions: [
      { time: '10:40', description: 'Auto-listed 85 styles on AJIO + store channels', status: 'success' },
      { time: '10:10', description: 'Dynamic pricing adjustment for 71 slow-movers', status: 'success' },
      { time: '09:30', description: 'Conversion alert: 5 stores below target', status: 'success' },
    ],
  },
  {
    id: 'b5e6f7a8-9c0d-4e1f-2a3b-4c5d6e7f8a9b',
    shortId: 'SE-01',
    name: 'Store Economist',
    description: 'Owns store P&L simulation. Orchestrates scenario selection via Wide-Mode Runner. Emits daily Plan of Record (PoR).',
    status: 'active',
    domain: 'Plan',
    ha_level: 'HA2',
    tasksToday: 63,
    taskLabel: 'analyses',
    successRate: 97,
    systems: ['Cortex', 'SAP', 'Fynd OMS'],
    guardrails: ['Three-Strike Rule', 'Sell-through threshold monitoring'],
    uptime: 99.8,
    recentActions: [
      { time: '10:45', description: 'Flagged Menswear Casual sell-through drop (12% below forecast)', status: 'success' },
      { time: '10:20', description: 'Generated daily trading report for all categories', status: 'success' },
      { time: '09:55', description: 'Alert: Footwear SS25 aged inventory at 180 days', status: 'success' },
    ],
  },
  {
    id: 'c6f7a8b9-0d1e-4f2a-3b4c-5d6e7f8a9b0c',
    shortId: 'PP-01',
    name: 'Pricing & Promo',
    description: 'Optimizes price ladders, promo depth, cadence. Enforces margin floors and manages markdown lifecycle.',
    status: 'active',
    domain: 'Sell',
    ha_level: 'HA2',
    tasksToday: 340,
    taskLabel: 'SKUs repriced',
    successRate: 99,
    systems: ['Cortex', 'Costing Engine', 'Fynd OMS'],
    guardrails: ['Retail Margin Floor', 'B2B/Export Price Floor', 'Markdown Budget'],
    uptime: 99.9,
    recentActions: [
      { time: '10:50', description: 'Repriced 340 SKUs for EOSS markdown wave', status: 'success' },
      { time: '10:15', description: 'Blocked underpriced listing: Style #ST-4521 (below floor)', status: 'success' },
      { time: '09:30', description: 'Competitor price analysis: 23 SKUs need review', status: 'success' },
    ],
  },
  {
    id: 'd7a8b9c0-1e2f-4a3b-4c5d-6e7f8a9b0c1d',
    shortId: 'AR-01',
    name: 'Allocation & Replenishment',
    description: 'Right qty to right fixture at right time. Min-cost service-level optimizer. VMI integration for Core items.',
    status: 'active',
    domain: 'Move',
    ha_level: 'HA2',
    tasksToday: 1200,
    taskLabel: 'units allocated',
    successRate: 95,
    systems: ['Cortex', 'SAP', 'Fynd OMS'],
    guardrails: ['DC Capacity', 'Allocation Minimum', 'Vendor concentration ≤ 25%'],
    uptime: 99.6,
    recentActions: [
      { time: '10:40', description: 'Reallocated 1,200 units across top 20 stores', status: 'success' },
      { time: '10:05', description: 'Held allocation for PO #PO-4521 (fabric delay)', status: 'pending' },
      { time: '09:22', description: 'Auto-allocated 800 units for replenishment cycle', status: 'success' },
    ],
  },
  {
    id: 'e8b9c0d1-2f3a-4b4c-5d6e-7f8a9b0c1d2e',
    shortId: 'SO-01',
    name: 'Store Ops Orchestrator',
    description: 'Turns AI decisions into tasks with SLAs. Coordinates labor, move lists, next-best actions via PulsePoint.',
    status: 'idle',
    domain: 'Sell',
    ha_level: 'HA2',
    tasksToday: 0,
    taskLabel: 'tasks',
    successRate: 0,
    systems: ['PulsePoint', 'GMetri'],
    guardrails: ['Store Safety', 'VM compliance minimum 85%'],
    uptime: 98.2,
    recentActions: [
      { time: '08:30', description: 'Scheduled VM refresh tasks for 45 stores', status: 'success' },
      { time: '07:45', description: 'Generated hygiene audit reports', status: 'success' },
    ],
  },
  {
    id: 'f9c0d1e2-3a4b-4c5d-6e7f-8a9b0c1d2e3f',
    shortId: 'CA-01',
    name: 'Customer Activation',
    description: 'Hyperlocal cohorts & journeys via UCP. Geo-fenced store visits. Omnichannel orchestration.',
    status: 'active',
    domain: 'Market',
    ha_level: 'HA2',
    tasksToday: 28,
    taskLabel: 'campaigns',
    successRate: 91,
    systems: ['UCP'],
    guardrails: ['Frequency Cap', 'Consent compliance', 'Campaign Budget'],
    uptime: 99.1,
    recentActions: [
      { time: '10:35', description: 'Activated EOSS preview campaign for VIP cohort (12 K customers)', status: 'success' },
      { time: '09:50', description: 'Blocked campaign: frequency cap exceeded for 2,400 customers', status: 'blocked' },
      { time: '09:15', description: 'Segmented new arrivals cohort: 8,200 customers', status: 'success' },
    ],
  },
  {
    id: 'a0d1e2f3-4b5c-4d6e-7f8a-9b0c1d2e3f4a',
    shortId: 'OG-01',
    name: 'OTB Guardian',
    description: 'OTB utilization tracking. Auto release/cancel/chase within guardrails. Pre-book:chase ratio enforcement.',
    status: 'active',
    domain: 'Buy',
    ha_level: 'HA2',
    tasksToday: 34,
    taskLabel: 'budget checks',
    successRate: 97,
    systems: ['Cortex', 'Procuro'],
    guardrails: ['OTB Hard Cap', 'Cash Envelope', 'Pre-book:Chase Ratio'],
    uptime: 99.7,
    recentActions: [
      { time: '10:42', description: 'Blocked Menswear Casual PO batch: OTB at 107%', status: 'blocked' },
      { time: '10:10', description: 'Released ₹45 L OTB for Womenswear Western', status: 'success' },
      { time: '09:35', description: 'Daily OTB consumption report generated', status: 'success' },
    ],
  },
];

/** Look up an agent's shortId from its UUID. Falls back to first 8 chars of the id. */
export const agentShortIdMap: Record<string, string> = Object.fromEntries(
  mockAgents.map((a) => [a.id, a.shortId])
);

export const agentSummary = {
  total: mockAgents.length,
  active: mockAgents.filter((a) => a.status === 'active').length,
  idle: mockAgents.filter((a) => a.status === 'idle').length,
  blocked: mockAgents.filter((a) => a.status === 'blocked').length,
  tasksToday: mockAgents.reduce((sum, a) => sum + a.tasksToday, 0),
  avgSuccessRate:
    Math.round(
      (mockAgents.filter((a) => a.successRate > 0).reduce((sum, a) => sum + a.successRate, 0) /
        mockAgents.filter((a) => a.successRate > 0).length) *
        10
    ) / 10,
};
