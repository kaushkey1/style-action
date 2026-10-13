import { create } from 'zustand';

export type TimePeriod = 'WTD' | 'MTD' | 'YTD';

interface TimePeriodState {
  timePeriod: TimePeriod;
  setTimePeriod: (period: TimePeriod) => void;
}

export const useTimePeriodStore = create<TimePeriodState>((set) => ({
  timePeriod: 'MTD',
  setTimePeriod: (period) => set({ timePeriod: period }),
}));
