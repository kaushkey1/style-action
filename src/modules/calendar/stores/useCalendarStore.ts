import { create } from 'zustand';
import { mockDropJourneys, mockCalendarAlerts } from '../data/mockCalendarJourney';
import type { DropJourney, CalendarAlert, MilestoneStatus } from '../data/mockCalendarJourney';
import { mockCalendarHealth } from '../data/mockCalendarHealth';
import type { CalendarHealth } from '../data/mockCalendarHealth';
import { mockHumanGates } from '@/modules/exceptions/data/mockHumanGates';
import type { HumanGate } from '@/modules/exceptions/data/mockHumanGates';

export type SourcingEngine = 'fast_response' | 'scale_margin' | 'test_repeat';
export type DropStatus = 'on-track' | 'at-risk' | 'delayed' | 'completed';

interface CalendarState {
  // View state
  activeView: 'calendar' | 'pipeline' | 'health';

  // Drop data
  drops: DropJourney[];
  selectedDropId: string | null;
  selectedMilestoneId: string | null;

  // Alerts
  alerts: CalendarAlert[];

  // Human gates
  humanGates: HumanGate[];

  // Calendar health
  calendarHealth: CalendarHealth;

  // Filters
  seasonFilter: string | null;
  podFilter: string | null;
  engineFilter: SourcingEngine | null;
  statusFilter: DropStatus | null;

  // Actions
  setActiveView: (view: CalendarState['activeView']) => void;
  selectDrop: (dropId: string | null) => void;
  selectMilestone: (milestoneId: string | null) => void;

  // Filter actions
  setSeasonFilter: (season: string | null) => void;
  setPodFilter: (podId: string | null) => void;
  setEngineFilter: (engine: SourcingEngine | null) => void;
  setStatusFilter: (status: DropStatus | null) => void;

  // Gate actions
  approveGate: (gateId: string) => void;
  rejectGate: (gateId: string) => void;

  // Drop actions
  updateMilestoneStatus: (dropId: string, milestoneId: string, status: MilestoneStatus) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  // Initial state
  activeView: 'calendar',
  drops: mockDropJourneys,
  selectedDropId: null,
  selectedMilestoneId: null,
  alerts: mockCalendarAlerts,
  humanGates: mockHumanGates,
  calendarHealth: mockCalendarHealth,
  seasonFilter: null,
  podFilter: null,
  engineFilter: null,
  statusFilter: null,

  // View actions
  setActiveView: (view) => set({ activeView: view }),
  selectDrop: (dropId) => set({ selectedDropId: dropId }),
  selectMilestone: (milestoneId) => set({ selectedMilestoneId: milestoneId }),

  // Filter actions
  setSeasonFilter: (season) => set({ seasonFilter: season }),
  setPodFilter: (podId) => set({ podFilter: podId }),
  setEngineFilter: (engine) => set({ engineFilter: engine }),
  setStatusFilter: (status) => set({ statusFilter: status }),

  // Gate actions
  approveGate: (gateId) =>
    set((state) => ({
      humanGates: state.humanGates.map((gate) =>
        gate.id === gateId ? { ...gate, status: 'approved' } : gate
      ),
    })),

  rejectGate: (gateId) =>
    set((state) => ({
      humanGates: state.humanGates.map((gate) =>
        gate.id === gateId ? { ...gate, status: 'rejected' } : gate
      ),
    })),

  // Drop actions
  updateMilestoneStatus: (dropId, milestoneId, status) =>
    set((state) => ({
      drops: state.drops.map((drop) =>
        drop.id === dropId
          ? {
              ...drop,
              milestones: drop.milestones.map((milestone) =>
                milestone.id === milestoneId ? { ...milestone, status } : milestone
              ),
            }
          : drop
      ),
    })),
}));
