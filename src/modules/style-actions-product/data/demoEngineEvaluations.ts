import type { OptionStoreRow } from '../api/types';
import type { EngineActionLine, EngineCheck, EngineEvaluation, EngineValue, OptionGateResult } from '../components/engine/optionEngineData';

/** Illustrative traces for the existing demo outputs. Missing operational inputs remain unevaluated. */
export function demoEngineEvaluations(row: OptionStoreRow, gate: OptionGateResult, lines: EngineActionLine[], pullbackNight: boolean, runId: string): EngineEvaluation[] {
  const age = row.lifecycle_age;
  const fashion = row.grade_class === 'Fashion' || row.grade_class === 'Ultimate';
  const check = (id: string, label: string, value: EngineValue, operator: EngineCheck['operator'], threshold: EngineValue, pass: boolean | null, extra: Partial<EngineCheck> = {}): EngineCheck => ({
    id, label, value, operator, threshold, result: pass === null ? 'not_evaluated' : pass ? 'pass' : 'fail', ...extra,
  });
  const missing = (id: string, label: string, operator?: EngineCheck['operator'], threshold: EngineValue = null, extra: Partial<EngineCheck> = {}): EngineCheck => ({ id, label, value: null, result: 'not_evaluated', operator, threshold, ...extra });
  const grade = () => check('grade', 'Eligible grade', row.grade_class, 'in', 'Fashion / Ultimate', fashion);
  const scheduled = () => check('cadence', 'Pullback run', pullbackNight, '=', true, pullbackNight);
  const window = () => check('window', 'Lifecycle age', age, '<=', 60, age === null ? null : age <= 60, { unit: 'days', parameter: 'repl_window_day', setting_scope: 'global' });
  const beforeExit = () => fashion
    ? check('exit_priority', 'Lifecycle exit priority', age, '<', 90, age === null ? null : age < 90, { unit: 'days', parameter: 'exit_day', setting_scope: 'global' })
    : check('exit_priority', 'Lifecycle exit applies', false, '=', false, true);
  function evaluation(engine: string, checks: EngineCheck[], stopReason: string, missingReason: string, skip = false, outputs: EngineEvaluation['outputs'] = []): EngineEvaluation {
    // Once a recorded prerequisite fails, downstream checks are not reached; do not invent their values.
    const failAt = checks.findIndex(item => item.result === 'fail');
    const traced = checks.map((item, i) => failAt >= 0 && i > failAt ? { ...item, value: null, result: 'skipped' as const } : item);
    const emitted = lines.filter(line => line.line_type === engine);
    return { engine, run_id: runId, status: failAt >= 0 ? skip ? 'skipped' : 'blocked' : traced.some(item => item.result === 'not_evaluated') ? 'not_evaluated' : 'passed',
      reason_code: failAt >= 0 ? stopReason : traced.some(item => item.result === 'not_evaluated') ? missingReason : emitted.length ? 'action_emitted' : 'no_dispatch_needed',
      checks: traced, line_ids: emitted.map(line => line.line_id), outputs: [...outputs, { key: 'emitted_lines', label: 'Emitted lines', value: emitted.length }] };
  }
  const replenishment = evaluation('replenishment', [
    grade(), check('live', 'Store inventory position', row.on_hand + row.transit, '>', 0, row.on_hand + row.transit > 0), window(),
    missing('pending_pullback', 'Pending / held pullback', '=', 0),
    missing('marked_down', 'Current markdown state', '=', false),
    missing('target', 'Target / lead-time inputs', 'available'),
    missing('capacity', 'Capacity cap', 'available'),
    missing('size_dispatch', 'Size targets / position', 'available'),
    missing('dc_rationing', 'Distribution Centre supply', 'available'),
  ], !fashion ? 'grade_excluded' : row.on_hand + row.transit <= 0 ? 'not_live' : 'outside_replenishment_window', 'replenishment_inputs_missing', !fashion);
  const broken = evaluation('broken', [scheduled(), beforeExit(),
    missing('broken_trigger', 'Broken sizes OR pivot out', 'available', null, { parameter: 'broken_threshold / broken_pivot_out', setting_scope: 'global' }),
    missing('destination', 'Eligible destination', '>', 0),
    missing('space_floor', 'Post-pull space floor', 'available'),
  ], !pullbackNight ? 'outside_pullback_schedule' : 'lifecycle_exit_priority', 'size_route_inputs_missing', true);
  const candidate = row.grade_class === 'Core' ? row.days_in_store === null ? null : row.days_in_store >= 14
    : row.health?.band === 'under' ? true : row.health?.band === 'watch' ? age === null ? null : age >= 60 : row.health?.band ? false : null;
  const consolidation = evaluation('consolidation', [scheduled(),
    check('exit_priority', 'Candidate lifecycle age', age, '<', 90, age === null ? null : age < 90, { unit: 'days', parameter: 'exit_day', setting_scope: 'global' }),
    check('candidate', 'Candidate band / age', row.grade_class === 'Core' ? row.grade_class : row.health?.band ?? null, 'in', 'Under / Watch ≥60d / Core ≥14d', candidate),
    missing('dc_shortfall', 'Remaining Distribution Centre shortfall', '>', 0),
    missing('marked_down', 'Current markdown state', '=', false),
    missing('space_floor', 'Post-pull space floor', 'available'),
  ], !pullbackNight ? 'outside_pullback_schedule' : age !== null && age >= 90 ? fashion ? 'lifecycle_exit_priority' : 'candidate_age_excluded' : 'candidate_not_eligible', 'demand_floor_inputs_missing', !pullbackNight || (age !== null && age >= 90));
  const overfill = evaluation('overfill', [scheduled(), beforeExit(),
    missing('fill', 'Options OR units fill', '>', 1.2, { unit: 'percent', parameter: 'overfill_threshold', setting_scope: 'global' }),
    missing('space_floor', 'Post-pull space floor', 'available'),
    missing('rank', 'Donor rank / cutoff', 'available'),
  ], !pullbackNight ? 'outside_pullback_schedule' : 'lifecycle_exit_priority', 'fill_floor_inputs_missing', true);
  const lifecycle = evaluation('lifecycle_end', [grade(), scheduled(),
    check('exit_age', 'Lifecycle age', age, '>=', 90, age === null ? null : age >= 90, { unit: 'days', parameter: 'exit_day', setting_scope: 'global' }),
    check('pull_qty', 'On-hand units', row.on_hand, '>', 0, row.on_hand > 0),
  ], !fashion ? 'grade_excluded' : !pullbackNight ? 'outside_pullback_schedule' : age !== null && age >= 90 && row.on_hand <= 0 ? 'no_stock_to_pull' : 'exit_not_due', 'lifecycle_age_missing', !fashion || !pullbackNight,
  lines.some(line => line.line_type === 'lifecycle_end') ? [{ key: 'pull_qty', label: 'Pull quantity', value: row.on_hand }, { key: 'floor_applied', label: 'Space floor applied', value: false }] : []);
  const replacement = evaluation('replacement', [scheduled(), grade(), window(),
    missing('post_pull_gap', 'Post-pull space shortfall', '>', 0),
    missing('not_live', 'Candidate live after pulls', '=', false),
    missing('dc_pivots', 'Complete pivotal set at Distribution Centre', '=', true),
    missing('linked_pull', 'Linked pullback line', 'available'),
  ], !pullbackNight ? 'outside_pullback_schedule' : !fashion ? 'grade_excluded' : 'replacement_age_ineligible', 'post_pull_inputs_missing', !pullbackNight || !fashion);
  const markdownLine = lines.find(line => line.line_type === 'markdown');
  const markdown = evaluation('markdown', [
    check('nomination', 'Rule-tree outcome', gate.outcome, '=', 'discount', gate.outcome === 'discount'),
    check('price', 'Reference price', markdownLine?.reference_price ?? null, '>', 0, markdownLine?.reference_price == null ? null : markdownLine.reference_price > 0, { unit: 'currency' }),
    check('floor', 'Proposed price', markdownLine?.marked_price ?? null, '>=', markdownLine?.margin_floor ?? null, markdownLine?.marked_price == null || markdownLine.margin_floor == null ? null : markdownLine.marked_price >= markdownLine.margin_floor, { unit: 'currency', parameter: 'margin_floor', setting_scope: 'option' }),
  ], 'no_discount_nomination', 'price_inputs_missing', true,
  markdownLine ? [{ key: 'marked_price', label: 'Proposed price', value: markdownLine.marked_price ?? null, unit: 'currency' }, { key: 'depth', label: 'Depth', value: markdownLine.depth ?? null, unit: 'percent' }, { key: 'tier', label: 'Tier', value: markdownLine.tier ?? null }] : []);
  return [replenishment, broken, consolidation, overfill, lifecycle, replacement, markdown];
}
