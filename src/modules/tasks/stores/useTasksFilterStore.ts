import { create } from 'zustand';
import { DEFAULT_TASK_FILTERS, type TaskFilters } from '../types/task.types';

interface State {
  /** Draft filters being edited in the UI. */
  filters: TaskFilters;
  setFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
}

/**
 * Draft-only filter store. Pages keep an `appliedFilters` useState that's
 * promoted from this draft via an explicit "Apply" action — see
 * docs/references/ui/ux-patterns.md §Global Filter Strip.
 */
export const useTasksFilterStore = create<State>((set) => ({
  filters: DEFAULT_TASK_FILTERS,
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: DEFAULT_TASK_FILTERS }),
}));
