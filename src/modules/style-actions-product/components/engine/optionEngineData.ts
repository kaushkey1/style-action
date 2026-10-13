import { useQuery } from '@tanstack/react-query';
import { apiGet, pathCode, StyleActionsApiError } from '../../api/client';
import { STYLE_ACTIONS_DEMO } from '../../api/demoMode';
import { styleActionsKeys } from '../../api/queries';
import type { OptionStoreDetail } from '../../api/types';

export type EngineValue = number | string | boolean | null;
export type EngineCheckResult = 'pass' | 'fail' | 'skipped' | 'not_evaluated';
export type EngineMetricUnit = 'number' | 'days' | 'percent' | 'currency' | 'rate' | 'text';
export interface EngineCheck {
  id: string; label: string; result: EngineCheckResult; value: EngineValue;
  operator?: '<' | '<=' | '>' | '>=' | '=' | 'in' | 'available'; threshold?: EngineValue;
  unit?: EngineMetricUnit; parameter?: string; setting_scope?: string; reason_code?: string;
}
export interface EngineEvaluation {
  engine: string; status: 'passed' | 'blocked' | 'skipped' | 'not_evaluated'; reason_code: string;
  checks: EngineCheck[]; outputs?: { key: string; label: string; value: EngineValue; unit?: EngineMetricUnit }[];
  line_ids?: string[]; run_id?: string;
}
export interface EngineGateDetail {
  gate: string; label: string; result: string; is_deciding?: boolean;
  metrics?: Record<string, EngineValue>; sub_gates?: EngineGateDetail[];
}
export interface OptionGateResult {
  option_code: string; store_code: string; outcome: string; deciding_gate: string | null;
  lifecycle_age: number | null; days_in_store: number | null; band: string | null;
  gap: number | null; true_ros_daily: number | null; availability: number | null;
  gates: EngineGateDetail[];
  settings_used: Record<string, { value: EngineValue; scope: string; scope_key?: string | null }>;
  /** Optional recorded engine traces, including engines that emitted zero lines. Never inferred from line counts. */
  engine_evaluations?: EngineEvaluation[];
}
export interface EngineActionLine {
  line_id: string; run_id?: string; option_code: string; store_code: string; line_type: string;
  status: string; quantity: number | null; size?: string | null; article?: string | null;
  current_price?: number | null; marked_price?: number | null; reference_price?: number | null;
  margin_floor?: number | null; depth?: number | null; tier?: number | null;
  dest_store?: string | null; dest_dc?: string | null; linked_line_id?: string | null;
  autonomy_band?: string | null; governance_trigger?: string | null; reconciliation_status?: string | null;
  deciding_gate?: string | null; settings_used?: Record<string, unknown>;
}
export interface OptionEngineRun {
  run_id: string; snapshot_id: string; run_date: string; phase: string; status: string;
  settings_version: string | null; finished_at: string | null; pullback_night?: boolean;
}
export interface OptionEngineBundle {
  run: OptionEngineRun; gate: OptionGateResult | null; lines: EngineActionLine[]; demo: boolean;
}
interface ResultList<T> { items: T[]; total?: number; page_size?: number; page?: number }

/** Follow a documented paginated response when supplied; never treat an incomplete list as all results. */
export async function readAllEngineResults<T>(path: string, filters: Record<string, string> = {}): Promise<T[]> {
  const first = await apiGet<ResultList<T>>(path, filters);
  if (!Array.isArray(first.items)) throw new Error('Invalid engine response');
  if ((first.total !== undefined && (!Number.isInteger(first.total) || first.total < 0)) || (first.page !== undefined && first.page !== 1)) throw new Error('Invalid engine pagination');
  const items = [...first.items];
  if (first.total !== undefined && first.total > items.length) {
    if (!first.page_size || !Number.isInteger(first.page_size) || first.page_size < 1) throw new Error('Engine results are incomplete');
    const pages = Math.ceil(first.total / first.page_size);
    if (pages > 10000) throw new Error('Engine results exceed the page limit');
    for (let page = 2; page <= pages; page++) {
      const next = await apiGet<ResultList<T>>(path, { ...filters, page, page_size: first.page_size });
      if (!Array.isArray(next.items) || (next.page !== undefined && next.page !== page) || (next.total !== undefined && next.total !== first.total)) throw new Error('Engine results are incomplete');
      items.push(...next.items);
    }
  }
  if (first.total !== undefined && items.length !== first.total) throw new Error('Engine results are incomplete');
  return items;
}
export function validateEngineScope(bundle: OptionEngineBundle, detail: OptionStoreDetail): void {
  const { run, gate, lines } = bundle;
  const matches = (value: { option_code: string; store_code: string }) => value.option_code === detail.row.option_code && value.store_code === detail.row.store_code;
  if (run.snapshot_id !== detail.snapshot_id || (gate && !matches(gate)) || lines.some((line) => !matches(line) || (line.run_id && line.run_id !== run.run_id))) {
    throw new StyleActionsApiError(409, { code: 'engine_scope_mismatch', message: 'Engine run and option evidence do not match' });
  }
  if (new Set(lines.map((line) => line.line_id)).size !== lines.length) throw new Error('Duplicate engine lines');
  validateEngineEvaluations(gate, run.run_id);
}
export function validateEngineEvaluations(gate: OptionGateResult | null, runId: string): void {
  const evaluations = gate?.engine_evaluations;
  if (evaluations === undefined) return;
  if (!Array.isArray(evaluations) || new Set(evaluations.map(item => item.engine)).size !== evaluations.length) throw new Error('Invalid engine evaluation trace');
  for (const evaluation of evaluations) {
    if (!evaluation.engine || (evaluation.run_id && evaluation.run_id !== runId) || !['passed','blocked','skipped','not_evaluated'].includes(evaluation.status) || !Array.isArray(evaluation.checks) || new Set(evaluation.checks.map(check => check.id)).size !== evaluation.checks.length || evaluation.checks.some(check => !['pass','fail','skipped','not_evaluated'].includes(check.result))) throw new Error('Invalid engine evaluation trace');
  }
}
export async function loadOptionEngine(detail: OptionStoreDetail, demo = STYLE_ACTIONS_DEMO, runId?: string): Promise<OptionEngineBundle | null> {
  if (demo) {
    const { makeDemoOptionEngine } = await import('../../data/demoOptionEngine');
    const bundle = makeDemoOptionEngine(detail);
    if (runId && bundle.run.run_id !== runId) throw new Error('Engine run does not match');
    return bundle;
  }
  let runs: OptionEngineRun[];
  try { runs = runId ? [await apiGet<OptionEngineRun>(`/v1/engine/runs/${pathCode(runId, 'snapshot')}`)] : await readAllEngineResults<OptionEngineRun>('/v1/engine/runs'); }
  catch (error) { if (error instanceof StyleActionsApiError && error.status === 404) return null; throw error; }
  const selected = runs.filter((run) => (!runId || run.run_id === runId) && run.snapshot_id === detail.snapshot_id && run.status === 'succeeded')
    .sort((a, b) => (b.finished_at ?? '').localeCompare(a.finished_at ?? ''))[0];
  if (!selected) return null;
  const base = `/v1/engine/runs/${pathCode(selected.run_id, 'snapshot')}`;
  const [run, gate, lines] = await Promise.all([
    apiGet<OptionEngineRun>(base),
    apiGet<OptionGateResult>(`${base}/gates/${pathCode(detail.row.store_code, 'store')}/${pathCode(detail.row.option_code, 'option')}`)
      .catch((error: unknown) => { if (error instanceof StyleActionsApiError && error.status === 404) return null; throw error; }),
    readAllEngineResults<EngineActionLine>(`${base}/lines`, { store_code: detail.row.store_code, option_code: detail.row.option_code }),
  ]);
  const result = { run, gate, lines, demo: false };
  if (run.run_id !== selected.run_id || run.status !== 'succeeded') throw new Error('Engine run is not complete');
  validateEngineScope(result, detail);
  return result;
}
export function useOptionEngine(detail: OptionStoreDetail, runId?: string) {
  return useQuery({ queryKey: [...styleActionsKeys.all, 'option-engine', detail.snapshot_id, detail.row.store_code, detail.row.option_code, runId ?? 'latest'], queryFn: () => loadOptionEngine(detail, STYLE_ACTIONS_DEMO, runId), staleTime: 5 * 60 * 1000, retry: 1 });
}

export interface InputComparison { label: string; engine: EngineValue; evidence: EngineValue; delta: number | null; status: 'Match' | 'Mismatch' | 'Unavailable'; unit: 'number' | 'percent' | 'rate' | 'text' }
export function compareEngineInputs(gate: OptionGateResult | null, detail: OptionStoreDetail): InputComparison[] {
  const row = detail.row;
  const compare = (label: string, engine: EngineValue | undefined, evidence: EngineValue | undefined, unit: InputComparison['unit'] = 'number'): InputComparison => {
    const known = (value: EngineValue | undefined) => value !== null && value !== undefined && (typeof value !== 'number' || Number.isFinite(value));
    const available = known(engine) && known(evidence);
    const delta = available && typeof engine === 'number' && typeof evidence === 'number' ? engine - evidence : null;
    const same = delta !== null ? Math.abs(delta) < 1e-6 : engine === evidence;
    return { label, engine: known(engine) ? engine! : null, evidence: known(evidence) ? evidence! : null, delta, unit, status: !available ? 'Unavailable' : same ? 'Match' : 'Mismatch' };
  };
  return [
    compare('Lifecycle age · d', gate?.lifecycle_age, row.lifecycle_age),
    compare('Receipt age · d', gate?.days_in_store, row.days_in_store),
    compare('Sales gap', gate?.gap, row.gap, 'percent'),
    compare('True ROS · /day', gate?.true_ros_daily, row.health?.true_ros_daily, 'rate'),
    compare('Availability', gate?.availability, row.health?.availability_basis === 'life' ? row.health.availability_life : row.health?.availability_basis === 'observation' ? row.health.availability_14d : null, 'percent'),
    compare('Band', gate?.band, row.health?.band, 'text'),
  ];
}
