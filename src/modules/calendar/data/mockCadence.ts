export interface CadenceEvent {
  id: string;
  time: string; // HH:mm
  name: string;
  status: "completed" | "active" | "upcoming";
  summary?: string;
  participants?: string[];
}

export interface MorningBriefing {
  date: string;
  vitals: {
    metric: string;
    value: string;
    vsTarget: string;
    status: "on-track" | "warning" | "critical";
  }[];
  overnightAgentActions: {
    agentId: string;
    agentName: string;
    action: string;
    outcome: string;
  }[];
  pendingApprovals: number;
  s1Exceptions: number;
  s2Exceptions: number;
}

export interface DailyClose {
  date: string;
  revenue: string;
  revenueVsTarget: string;
  revenueStatus: "on-track" | "warning" | "critical";
  exceptionsResolved: number;
  exceptionsEscalated: number;
  agentActionsToday: number;
  topWin: string;
  topConcern: string;
}

export const dailyCadence: CadenceEvent[] = [
  {
    id: "a1b2c3d4-c001-4a5b-8c6d-7e8f9a0b1c2d",
    time: "07:00",
    name: "Agent Overnight Report",
    status: "completed",
    summary: "14 autonomous actions, 3 escalations",
    participants: ["System"],
  },
  {
    id: "a1b2c3d4-c002-4a5b-8c6d-7e8f9a0b1c2d",
    time: "07:30",
    name: "Morning Briefing",
    status: "completed",
    summary: "Revenue \u20B94.8 Cr vs \u20B95.2 Cr target",
    participants: ["CEO", "Category Heads"],
  },
  {
    id: "a1b2c3d4-c003-4a5b-8c6d-7e8f9a0b1c2d",
    time: "08:00",
    name: "Approval Window",
    status: "completed",
    summary: "6 gates processed, 2 pending",
    participants: ["Category Heads", "Finance"],
  },
  {
    id: "a1b2c3d4-c004-4a5b-8c6d-7e8f9a0b1c2d",
    time: "10:00",
    name: "Ops Standup",
    status: "active",
    summary: "Top 10 exceptions triage",
    participants: ["Ops Head", "POD Heads", "Store Leads"],
  },
  {
    id: "a1b2c3d4-c005-4a5b-8c6d-7e8f9a0b1c2d",
    time: "12:00",
    name: "Midday Pulse",
    status: "upcoming",
    summary: "Real-time revenue check",
    participants: ["Category Heads"],
  },
  {
    id: "a1b2c3d4-c006-4a5b-8c6d-7e8f9a0b1c2d",
    time: "15:00",
    name: "CM Review Calls",
    status: "upcoming",
    summary: "Category-wise performance review",
    participants: ["Category Directors", "Merchandisers"],
  },
  {
    id: "a1b2c3d4-c007-4a5b-8c6d-7e8f9a0b1c2d",
    time: "17:00",
    name: "Daily Close",
    status: "upcoming",
    summary: "Day summary & overnight plan",
    participants: ["CEO", "Ops Head"],
  },
  {
    id: "a1b2c3d4-c008-4a5b-8c6d-7e8f9a0b1c2d",
    time: "18:00",
    name: "Agent Planning Cycle",
    status: "upcoming",
    summary: "Agents prepare next-day actions",
    participants: ["System"],
  },
];

export const morningBriefing: MorningBriefing = {
  date: "2026-02-20",
  vitals: [
    {
      metric: "Yesterday Revenue",
      value: "\u20B94.8 Cr",
      vsTarget: "92% of \u20B95.2 Cr",
      status: "warning",
    },
    {
      metric: "Gross Margin",
      value: "41.2%",
      vsTarget: "vs 42% target",
      status: "on-track",
    },
    {
      metric: "Bills Generated",
      value: "12,847",
      vsTarget: "98% of target",
      status: "on-track",
    },
    {
      metric: "ATS",
      value: "\u20B92,180",
      vsTarget: "\u20B92,150 target",
      status: "on-track",
    },
    {
      metric: "Markdown%",
      value: "8.5%",
      vsTarget: "vs 10% budget",
      status: "on-track",
    },
    {
      metric: "Sell-Through (15d)",
      value: "71%",
      vsTarget: "vs 75% target",
      status: "warning",
    },
  ],
  overnightAgentActions: [
    {
      agentId: "b3e4f5a6-7c8d-4e9f-0a1b-2c3d4e5f6a7b",
      agentName: "Replenishment Engine",
      action: "Auto-generated 23 replenishment POs for fast-moving styles",
      outcome: "Fill rate maintained at 94%",
    },
    {
      agentId: "c8f9a0b1-2d3e-4f4a-5b6c-7d8e9f0a1b2c",
      agentName: "Conversion Sentinel",
      action: "Flagged 5 stores with conversion drop >15%",
      outcome: "3 resolved via CSA redeployment",
    },
    {
      agentId: "e8b9c0d1-2f3a-4b4c-5d6e-7f8a9b0c1d2e",
      agentName: "Price Sentinel",
      action: "Adjusted markdown ladder for 42 aged styles",
      outcome: "Projected \u20B912 L recovery",
    },
    {
      agentId: "a2d3e4f5-6b7c-4d8e-9f0a-1b2c3d4e5f6a",
      agentName: "Liquidation Trigger",
      action: "Initiated B2B routing for 180+ day stock batch",
      outcome: "Awaiting approval (Gate LQ-0089)",
    },
  ],
  pendingApprovals: 7,
  s1Exceptions: 3,
  s2Exceptions: 8,
};

export const dailyClose: DailyClose = {
  date: "2026-02-19",
  revenue: "\u20B94.8 Cr",
  revenueVsTarget: "92%",
  revenueStatus: "warning",
  exceptionsResolved: 18,
  exceptionsEscalated: 4,
  agentActionsToday: 47,
  topWin:
    "Footwear SS26 sell-through hit 92% \u2014 Chase orders auto-triggered for top 5 styles",
  topConcern:
    "Menswear Formal EBITDA still negative \u2014 Strike 3 review scheduled for Feb 22",
};
