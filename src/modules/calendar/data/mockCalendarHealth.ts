// Calendar Health Dashboard — mock data for health metrics and trends

import type { JourneyPhase } from './mockCalendarJourney';

// ─── Types ──────────────────────────────────────────────────────────

/**
 * Health metrics for a single journey phase (PLAN, BUY, MAKE, MOVE, SELL)
 */
export interface PhaseHealth {
  activeMilestones: number;
  onTime: number;
  atRisk: number;
  missed: number;
  health: number; // 0-100 health score
}

/**
 * Health metrics for a category pod
 */
export interface PodHealth {
  podId: string;
  podName: string;
  activeDrops: number;
  health: number; // 0-100 health score
  cascadeRisks: number;
  pendingGates: number;
}

/**
 * Overall calendar health dashboard data
 */
export interface CalendarHealth {
  overall: number; // 0-100 overall health score
  byPhase: Record<JourneyPhase, PhaseHealth>;
  byPod: PodHealth[];
  weeklyTrend: { week: string; health: number }[];
  pendingGates: number;
  overdueGates: number;
  cascadeRisks: number;
}

// ─── Mock Data ──────────────────────────────────────────────────────

/**
 * Calendar Health Dashboard mock data
 * Data from spec §13.5 wireframe — represents current state across all drops
 */
export const mockCalendarHealth: CalendarHealth = {
  // Overall health score across all phases and pods
  overall: 85,

  // Health breakdown by journey phase
  byPhase: {
    PLAN: {
      activeMilestones: 42,
      onTime: 36,
      atRisk: 4,
      missed: 2,
      health: 86,
    },
    BUY: {
      activeMilestones: 18,
      onTime: 16,
      atRisk: 2,
      missed: 0,
      health: 89,
    },
    MAKE: {
      activeMilestones: 24,
      onTime: 22,
      atRisk: 1,
      missed: 1,
      health: 92,
    },
    MOVE: {
      activeMilestones: 8,
      onTime: 8,
      atRisk: 0,
      missed: 0,
      health: 100,
    },
    SELL: {
      activeMilestones: 15,
      onTime: 12,
      atRisk: 2,
      missed: 1,
      health: 80,
    },
  },

  // Health breakdown by category pod
  byPod: [
    {
      podId: 'MW-2',
      podName: "Men's Casuals",
      activeDrops: 2,
      health: 88,
      cascadeRisks: 0,
      pendingGates: 1,
    },
    {
      podId: 'WW-1',
      podName: "Women's Western",
      activeDrops: 1,
      health: 72,
      cascadeRisks: 1,
      pendingGates: 2,
    },
    {
      podId: 'WW-3',
      podName: "Women's Denim",
      activeDrops: 2,
      health: 95,
      cascadeRisks: 0,
      pendingGates: 0,
    },
    {
      podId: 'KW-1',
      podName: 'Kidswear',
      activeDrops: 1,
      health: 74,
      cascadeRisks: 1,
      pendingGates: 1,
    },
    {
      podId: 'MF-1',
      podName: "Men's Formal",
      activeDrops: 1,
      health: 91,
      cascadeRisks: 0,
      pendingGates: 0,
    },
    {
      podId: 'WIW-1',
      podName: "Women's Indian",
      activeDrops: 1,
      health: 86,
      cascadeRisks: 0,
      pendingGates: 1,
    },
    {
      podId: 'MW-1',
      podName: "Men's Westernwear",
      activeDrops: 1,
      health: 92,
      cascadeRisks: 0,
      pendingGates: 0,
    },
    {
      podId: 'NOOS',
      podName: 'NOOS / Basics',
      activeDrops: 1,
      health: 97,
      cascadeRisks: 0,
      pendingGates: 0,
    },
  ],

  // 12-week health trend
  weeklyTrend: [
    { week: 'W1', health: 92 },
    { week: 'W2', health: 94 },
    { week: 'W3', health: 93 },
    { week: 'W4', health: 91 },
    { week: 'W5', health: 90 },
    { week: 'W6', health: 88 },
    { week: 'W7', health: 87 },
    { week: 'W8', health: 85 },
    { week: 'W9', health: 83 },
    { week: 'W10', health: 82 },
    { week: 'W11', health: 84 },
    { week: 'W12', health: 85 },
  ],

  // Summary metrics
  pendingGates: 6,
  overdueGates: 2,
  cascadeRisks: 2,
};
