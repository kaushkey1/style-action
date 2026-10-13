import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TaskView } from '../types/task.types';

interface State {
  view: TaskView;
  setView: (v: TaskView) => void;
}

/** Persisted view choice — survives reloads via localStorage key `tasks.view`. */
export const useTasksViewStore = create<State>()(
  persist(
    (set) => ({
      view: 'kanban',
      setView: (v) => set({ view: v }),
    }),
    { name: 'tasks.view' },
  ),
);
