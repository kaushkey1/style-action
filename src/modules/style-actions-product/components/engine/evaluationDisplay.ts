import type { EngineEvaluation } from './optionEngineData';

export function evaluationCounts(evaluation?: EngineEvaluation) {
  const checks = evaluation?.checks ?? [];
  return { pass: checks.filter(check => check.result === 'pass').length, fail: checks.filter(check => check.result === 'fail').length, skipped: checks.filter(check => check.result === 'skipped').length, missing: checks.filter(check => check.result === 'not_evaluated').length };
}

const REASONS: Record<string, string> = {
  outside_replenishment_window: 'Replenishment window closed', grade_excluded: 'Grade excluded', not_live: 'No live stock',
  replenishment_inputs_missing: 'Operational inputs missing', outside_pullback_schedule: 'Not a pullback run',
  lifecycle_exit_priority: 'Lifecycle exit takes priority', size_route_inputs_missing: 'Size / routing inputs missing',
  candidate_not_eligible: 'Candidate not eligible', candidate_age_excluded: 'Candidate outside age window', demand_floor_inputs_missing: 'Demand / floor inputs missing',
  fill_floor_inputs_missing: 'Fill / floor inputs missing', exit_not_due: 'Exit not due', no_stock_to_pull: 'No stock to pull',
  lifecycle_age_missing: 'Lifecycle age missing', replacement_age_ineligible: 'Replacement window closed',
  post_pull_inputs_missing: 'Post-pull inputs missing', no_discount_nomination: 'No markdown nomination',
  price_inputs_missing: 'Price inputs missing', action_emitted: 'Action produced', no_dispatch_needed: 'No dispatch needed',
};
export function evaluationReason(evaluation?: EngineEvaluation): string {
  if (!evaluation) return 'Evaluation trace unavailable';
  return REASONS[evaluation.reason_code] ?? evaluation.reason_code.replaceAll('_', ' ').replace(/^\w/, letter => letter.toUpperCase());
}
