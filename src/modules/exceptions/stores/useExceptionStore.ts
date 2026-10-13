import { create } from 'zustand';
import type { Exception, ExceptionStatus } from '../data/mockExceptions';

interface ExceptionOverride {
  status: ExceptionStatus;
}

interface ExceptionStore {
  baseExceptions: Exception[];
  overrides: Record<string, ExceptionOverride>;
  exceptions: Exception[];
  initialize: (exceptions: Exception[]) => void;
  approveException: (id: string) => void;
  rejectException: (id: string) => void;
}

function deriveExceptions(
  base: Exception[],
  overrides: Record<string, ExceptionOverride>,
): Exception[] {
  return base.map((exc) => {
    const override = overrides[exc.id];
    return override ? { ...exc, ...override } : exc;
  });
}

export const useExceptionStore = create<ExceptionStore>((set) => ({
  baseExceptions: [],
  overrides: {},
  exceptions: [],

  initialize: (exceptions: Exception[]) => {
    set((state) => ({
      baseExceptions: exceptions,
      exceptions: deriveExceptions(exceptions, state.overrides),
    }));
  },

  approveException: (id: string) => {
    set((state) => {
      const overrides = { ...state.overrides, [id]: { status: 'resolved' as ExceptionStatus } };
      return { overrides, exceptions: deriveExceptions(state.baseExceptions, overrides) };
    });
  },

  rejectException: (id: string) => {
    set((state) => {
      const overrides = { ...state.overrides, [id]: { status: 'human-overridden' as ExceptionStatus } };
      return { overrides, exceptions: deriveExceptions(state.baseExceptions, overrides) };
    });
  },
}));
