import { create } from 'zustand';
import type { HumanGate, GateStatus } from '../data/mockHumanGates';

interface GateOverride {
  status: GateStatus;
}

interface HumanGateStore {
  baseGates: HumanGate[];
  overrides: Record<string, GateOverride>;
  gates: HumanGate[];
  initialize: (gates: HumanGate[]) => void;
  approveGate: (id: string) => void;
  rejectGate: (id: string) => void;
}

function deriveGates(
  base: HumanGate[],
  overrides: Record<string, GateOverride>,
): HumanGate[] {
  return base.map((gate) => {
    const override = overrides[gate.id];
    return override ? { ...gate, ...override } : gate;
  });
}

export const useHumanGateStore = create<HumanGateStore>((set) => ({
  baseGates: [],
  overrides: {},
  gates: [],

  initialize: (gates: HumanGate[]) => {
    set((state) => ({
      baseGates: gates,
      gates: deriveGates(gates, state.overrides),
    }));
  },

  approveGate: (id: string) => {
    set((state) => {
      const overrides = { ...state.overrides, [id]: { status: 'approved' as GateStatus } };
      return { overrides, gates: deriveGates(state.baseGates, overrides) };
    });
  },

  rejectGate: (id: string) => {
    set((state) => {
      const overrides = { ...state.overrides, [id]: { status: 'rejected' as GateStatus } };
      return { overrides, gates: deriveGates(state.baseGates, overrides) };
    });
  },
}));
