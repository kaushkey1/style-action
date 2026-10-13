import { create } from 'zustand';
import { operationKey, ruleOperation } from '../api/aopAdminDraft';
import type { Configuration, DraftChange } from '../types/aopAdmin';

type Patch = Record<string, DraftChange | undefined>;
interface HistoryEntry { before: Patch; after: Patch; label: string; mergeKey?: string }
interface Draft { baseConfiguration: Configuration; changes: Record<string, DraftChange>; past: HistoryEntry[]; future: HistoryEntry[] }
const HISTORY_LIMIT = 50;
interface DraftState {
  drafts: Record<string, Draft>;
  edit: (scope: string, base: Configuration, change: DraftChange) => void;
  editBatch: (scope: string, base: Configuration, changes: DraftChange[], label: string) => void;
  undo: (scope: string) => void;
  redo: (scope: string) => void;
  replace: (scope: string, base: Configuration, changes?: Draft['changes']) => void;
}

function applyPatch(changes: Draft['changes'], patch: Patch): Draft['changes'] {
  const next = { ...changes };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete next[key];
    else next[key] = value;
  }
  return next;
}

function updateDraft(state: DraftState, scope: string, base: Configuration, incoming: DraftChange[], label: string, mergeKey?: string): Pick<DraftState, 'drafts'> {
  const draft = state.drafts[scope] ?? { baseConfiguration: base, changes: {}, past: [], future: [] };
  const before: Patch = {};
  const after: Patch = {};
  const savedParameterKeys = incoming.some(({ operation }) => operation.op === 'remove_parameter')
    ? new Set(draft.baseConfiguration.parameter_rules.map((rule) => operationKey(ruleOperation(rule)))) : null;
  for (const change of incoming) {
    const op = change.operation;
    if (op.op === 'set_channel_setting' && op.value !== null && !change.error && (op.field === 'growth_pct' || op.field === 'gsv_target')) {
      const counterpart = operationKey({ ...op, field: op.field === 'growth_pct' ? 'gsv_target' : 'growth_pct' });
      before[counterpart] = draft.changes[counterpart];
      after[counterpart] = undefined;
    }
    const key = operationKey(op);
    before[key] = draft.changes[key];
    // Resetting a newly entered override cancels its draft; only saved rules need deletion.
    after[key] = op.op === 'remove_parameter' && !savedParameterKeys?.has(key) ? undefined : change;
  }
  if (!incoming.length) return { drafts: state.drafts };
  const changes = applyPatch(draft.changes, after);
  const last = draft.past.at(-1);
  // Consecutive keystrokes in one field form one undo step. Bulk actions never merge.
  const merge = mergeKey && last?.mergeKey === mergeKey && !draft.future.length;
  const entry = { before: merge ? { ...before, ...last.before } : before, after: merge ? { ...last.after, ...after } : after, label, mergeKey };
  const past = [...(merge ? draft.past.slice(0, -1) : draft.past), entry].slice(-HISTORY_LIMIT);
  return { drafts: { ...state.drafts, [scope]: { ...draft, changes, past, future: [] } } };
}

// Preserve edits across navigation, isolated by tenant and organisation, in memory only.
export const useAopAdminDraftStore = create<DraftState>((set) => ({
  drafts: {},
  edit: (scope, base, change) => set((state) => updateDraft(state, scope, base, [change], 'Edit value', operationKey(change.operation))),
  editBatch: (scope, base, changes, label) => set((state) => updateDraft(state, scope, base, changes, label)),
  undo: (scope) => set((state) => {
    const draft = state.drafts[scope];
    const entry = draft?.past.at(-1);
    if (!draft || !entry) return state;
    return { drafts: { ...state.drafts, [scope]: { ...draft, changes: applyPatch(draft.changes, entry.before), past: draft.past.slice(0, -1), future: [...draft.future, entry] } } };
  }),
  redo: (scope) => set((state) => {
    const draft = state.drafts[scope];
    const entry = draft?.future.at(-1);
    if (!draft || !entry) return state;
    return { drafts: { ...state.drafts, [scope]: { ...draft, changes: applyPatch(draft.changes, entry.after), past: [...draft.past, entry], future: draft.future.slice(0, -1) } } };
  }),
  replace: (scope, base, changes = {}) => set((state) => ({ drafts: { ...state.drafts, [scope]: { baseConfiguration: base, changes, past: [], future: [] } } })),
}));

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', (event) => {
    if (Object.values(useAopAdminDraftStore.getState().drafts).some((draft) => Object.keys(draft.changes).length)) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
}
