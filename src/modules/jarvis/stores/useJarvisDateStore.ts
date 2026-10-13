// ─── Jarvis Date Filter Store ───────────────────────────────────────────────

import { create } from 'zustand';
import type { DatePreset, DateRange } from '../api/smartiTypes';

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getToday(): string {
  return formatDate(new Date());
}

function getStartOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday = start
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function computeDateRange(preset: DatePreset, customStart?: string, customEnd?: string): DateRange {
  const now = new Date();

  switch (preset) {
    case 'today':
      return { preset, startDate: getToday(), endDate: getToday() };
    case 'this-week': {
      const start = getStartOfWeek(now);
      return { preset, startDate: formatDate(start), endDate: getToday() };
    }
    case 'last-week': {
      const thisWeekStart = getStartOfWeek(now);
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
      return { preset, startDate: formatDate(lastWeekStart), endDate: formatDate(lastWeekEnd) };
    }
    case 'this-month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { preset, startDate: formatDate(start), endDate: getToday() };
    }
    case 'custom':
      return {
        preset,
        startDate: customStart ?? getToday(),
        endDate: customEnd ?? getToday(),
      };
    default: {
      const _exhaustive: never = preset;
      return { preset: 'today', startDate: getToday(), endDate: getToday() + _exhaustive };
    }
  }
}

interface JarvisDateState {
  dateRange: DateRange;
  setPreset: (preset: DatePreset) => void;
  setCustomRange: (startDate: string, endDate: string) => void;
}

export const useJarvisDateStore = create<JarvisDateState>((set) => ({
  dateRange: computeDateRange('today'),

  setPreset: (preset: DatePreset) => {
    set({ dateRange: computeDateRange(preset) });
  },

  setCustomRange: (startDate: string, endDate: string) => {
    set({ dateRange: computeDateRange('custom', startDate, endDate) });
  },
}));
