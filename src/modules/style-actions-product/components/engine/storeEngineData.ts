import { useQuery } from '@tanstack/react-query';
import { apiGet, pathCode, StyleActionsApiError } from '../../api/client';
import { STYLE_ACTIONS_DEMO } from '../../api/demoMode';
import { styleActionsKeys } from '../../api/queries';
import type { OptionStoreRow } from '../../api/types';
import { brickOf } from '../journey/inventoryJourney';
import { readAllEngineResults, validateEngineEvaluations, type EngineActionLine, type OptionEngineRun, type OptionGateResult } from './optionEngineData';

export type EngineDecision = Pick<OptionGateResult, 'option_code' | 'store_code' | 'outcome' | 'deciding_gate'> & Partial<OptionGateResult> & { run_id?: string };
export interface StoreEngineBundle { run: OptionEngineRun; lines: EngineActionLine[]; decisions: EngineDecision[] | null; demo: boolean }
export const ENGINE_TYPES = [
  { key: 'replenishment', group: 'movement', label: 'Replenishment', colour: 'bg-teal-600', text: 'text-white' },
  { key: 'broken', group: 'movement', label: 'Broken sizes', colour: 'bg-sky-600', text: 'text-white' },
  { key: 'consolidation', group: 'movement', label: 'Consolidation', colour: 'bg-indigo-600', text: 'text-white' },
  { key: 'overfill', group: 'movement', label: 'Overfill', colour: 'bg-cyan-600', text: 'text-white' },
  { key: 'lifecycle_end', group: 'movement', label: 'Lifecycle exit', colour: 'bg-rose-600', text: 'text-white' },
  { key: 'replacement', group: 'movement', label: 'Replacement', colour: 'bg-emerald-600', text: 'text-white' },
  { key: 'markdown', group: 'price', label: 'Markdown', colour: 'bg-violet-600', text: 'text-white' },
] as const;
export type EngineActionGroup = 'all' | 'movement' | 'price' | 'decisions' | 'other';
const OUTCOME_LABEL: Record<string, string> = { leave_alone: 'Leave alone', supply_hold: 'Supply hold', hold: 'Hold', hold_to_exit: 'Hold to exit', wait: 'Wait', not_evaluated: 'Not evaluated', discount: 'Discount', liquidation: 'Liquidation', move: 'Move' };
export function resultLabel(value: string): string {
  return OUTCOME_LABEL[value] ?? ({ shadow_recorded: 'Shadow', in_review: 'Needs approval', stop_and_approve: 'Approval required' } as Record<string, string>)[value] ?? value.replaceAll('_', ' ').replace(/^\w/, letter => letter.toUpperCase());
}
export function engineType(key: string) {
  return ENGINE_TYPES.find(type => type.key === key) ?? { key, label: resultLabel(key), colour: 'bg-gray-600', text: 'text-white' };
}
export function actionGroup(line: EngineActionLine): 'movement' | 'price' | 'other' {
  return ENGINE_TYPES.find(type => type.key === line.line_type)?.group ?? 'other';
}
export function validateStoreEngine(bundle: StoreEngineBundle, snapshotId: string, storeCode: string): void {
  if (bundle.run.snapshot_id !== snapshotId || bundle.run.status !== 'succeeded' || [...bundle.lines, ...(bundle.decisions ?? [])].some(item => item.store_code !== storeCode || (item.run_id && item.run_id !== bundle.run.run_id))) {
    throw new StyleActionsApiError(409, { code: 'engine_scope_mismatch', message: 'Engine outputs do not match this store and snapshot' });
  }
  if (new Set(bundle.lines.map(line => line.line_id)).size !== bundle.lines.length) throw new Error('Duplicate engine lines');
  if (bundle.decisions && new Set(bundle.decisions.map(gate => gate.option_code)).size !== bundle.decisions.length) throw new Error('Duplicate engine decisions');
}
export async function loadStoreEngine(snapshotId: string, storeCode: string, demo = STYLE_ACTIONS_DEMO): Promise<StoreEngineBundle | null> {
  if (demo) {
    const [{ demoEngineInputs }, { makeDemoOptionEngine }] = await Promise.all([import('../../data/demoApi'), import('../../data/demoOptionEngine')]);
    const bundles = demoEngineInputs(snapshotId, storeCode).map(makeDemoOptionEngine);
    if (!bundles.length) return null;
    const result = { run: bundles[0]!.run, lines: bundles.flatMap(bundle => bundle.lines), decisions: bundles.flatMap(bundle => bundle.gate ? [bundle.gate] : []), demo: true };
    validateStoreEngine(result, snapshotId, storeCode);
    return result;
  }
  let runs: OptionEngineRun[];
  try { runs = await readAllEngineResults<OptionEngineRun>('/v1/engine/runs'); }
  catch (error) { if (error instanceof StyleActionsApiError && error.status === 404) return null; throw error; }
  const selected = runs.filter(run => run.snapshot_id === snapshotId && run.status === 'succeeded')
    .sort((a, b) => (b.finished_at ?? '').localeCompare(a.finished_at ?? ''))[0];
  if (!selected) return null;
  const base = `/v1/engine/runs/${pathCode(selected.run_id, 'snapshot')}`;
  const [run, lines, decisions] = await Promise.all([
    apiGet<OptionEngineRun>(base),
    readAllEngineResults<EngineActionLine>(`${base}/lines`, { store_code: storeCode }),
    readAllEngineResults<EngineDecision>(`${base}/gates`, { store_code: storeCode }).catch((error: unknown) => {
      if (error instanceof StyleActionsApiError && error.status === 404) return null;
      throw error;
    }),
  ]);
  if (run.run_id !== selected.run_id) throw new Error('Engine run changed while loading');
  const result = { run, lines, decisions, demo: false };
  validateStoreEngine(result, snapshotId, storeCode);
  return result;
}
export function useStoreEngine(snapshotId: string, storeCode: string) {
  return useQuery({ queryKey: [...styleActionsKeys.all, 'store-engine', snapshotId, storeCode], queryFn: () => loadStoreEngine(snapshotId, storeCode), staleTime: 5 * 60 * 1000, retry: 1 });
}
export async function loadEngineDecision(runId: string, storeCode: string, optionCode: string): Promise<OptionGateResult | null> {
  try {
    const gate = await apiGet<OptionGateResult & { run_id?: string }>(`/v1/engine/runs/${pathCode(runId, 'snapshot')}/gates/${pathCode(storeCode, 'store')}/${pathCode(optionCode, 'option')}`);
    if (gate.store_code !== storeCode || gate.option_code !== optionCode || (gate.run_id && gate.run_id !== runId)) throw new Error('Engine decision does not match this option and run');
    validateEngineEvaluations(gate, runId);
    return gate;
  } catch (error) { if (error instanceof StyleActionsApiError && error.status === 404) return null; throw error; }
}
export interface EngineOption {
  code: string; name: string; brick: string; lines: EngineActionLine[]; decision: EngineDecision | null;
}
/** Only recorded outputs create an entry. Stock with no engine evidence is never labelled "no action". */
export function engineOptions(bundle: StoreEngineBundle, rows: readonly OptionStoreRow[]): EngineOption[] {
  const metadata = new Map(rows.map(row => [row.option_code, row]));
  const map = new Map<string, EngineOption>();
  const get = (code: string) => {
    if (!map.has(code)) { const row = metadata.get(code); map.set(code, { code, name: row?.option_name ?? code, brick: row ? brickOf(row) : 'UNCLASSIFIED', lines: [], decision: null }); }
    return map.get(code)!;
  };
  bundle.lines.forEach(line => get(line.option_code).lines.push(line));
  bundle.decisions?.forEach(decision => { get(decision.option_code).decision = decision; });
  return [...map.values()];
}
export interface EngineFilters { action: EngineActionGroup; engine?: string | null; status?: string | null; outcome?: string | null; brick?: string | null; query?: string }
export function filterEngineOptions(options: readonly EngineOption[], filters: EngineFilters): EngineOption[] {
  const query = filters.query?.trim().toLowerCase();
  return options.flatMap(option => {
    if (filters.brick && filters.brick !== option.brick) return [];
    if (query && ![option.code, option.name, option.brick].some(value => value.toLowerCase().includes(query))) return [];
    if (filters.action === 'decisions') return !option.lines.length && option.decision && (!filters.outcome || option.decision.outcome === filters.outcome) ? [option] : [];
    const lines = option.lines.filter(line => (filters.action === 'all' || actionGroup(line) === filters.action) && (!filters.engine || line.line_type === filters.engine) && (!filters.status || line.status === filters.status));
    return lines.length ? [{ ...option, lines }] : [];
  });
}
export function movementQuantity(lines: readonly EngineActionLine[]): { known: number; missing: number; lines: number } {
  const movements = lines.filter(line => actionGroup(line) === 'movement');
  return { known: movements.reduce((sum, line) => sum + (line.quantity != null && Number.isFinite(line.quantity) ? line.quantity : 0), 0), missing: movements.filter(line => line.quantity === null || !Number.isFinite(line.quantity)).length, lines: movements.length };
}
