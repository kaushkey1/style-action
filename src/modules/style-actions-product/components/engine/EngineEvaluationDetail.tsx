import { Badge, DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow } from '@/components/ui';
import { formatPercent, formatUnits } from '../display';
import type { EngineCheck, EngineCheckResult, EngineEvaluation, EngineMetricUnit, EngineValue } from './optionEngineData';
import { evaluationCounts, evaluationReason } from './evaluationDisplay';
export function EvaluationStatus({ status }: { status?: EngineEvaluation['status'] }) {
  const label = status === 'passed' ? 'Passed' : status === 'blocked' ? 'Blocked' : status === 'skipped' ? 'Skipped' : status === 'not_evaluated' ? 'Not evaluated' : 'Not recorded';
  return <Badge size="sm" variant={status === 'passed' ? 'success' : status === 'blocked' ? 'error' : status === 'not_evaluated' ? 'warning' : 'outline'}>{label}</Badge>;
}
function valueText(value: EngineValue | undefined, unit?: EngineMetricUnit): string {
  if (value == null || (typeof value === 'number' && !Number.isFinite(value))) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') return value.replaceAll('_', ' ').replace(/^\w/, letter => letter.toUpperCase());
  if (unit === 'currency') return `₹${formatUnits(value)}`;
  if (unit === 'percent') return formatPercent(value);
  if (unit === 'rate') return value.toFixed(2);
  return `${formatUnits(value)}${unit === 'days' ? ' d' : ''}`;
}
function ruleText(check: EngineCheck): string {
  if (check.operator === 'available') return 'Available';
  if (check.threshold == null) return '—';
  const operator = check.operator ? ({ '<=': '≤', '>=': '≥', in: '∈' } as Record<string, string>)[check.operator] ?? check.operator : '';
  return `${operator} ${valueText(check.threshold, check.unit)}`.trim();
}
function CheckResult({ result }: { result: EngineCheckResult }) {
  return <Badge size="sm" variant={result === 'pass' ? 'success' : result === 'fail' ? 'error' : result === 'not_evaluated' ? 'warning' : 'outline'}>{result === 'pass' ? 'Pass' : result === 'fail' ? 'Fail' : result === 'skipped' ? 'Not reached' : 'Unavailable'}</Badge>;
}
export function EngineEvaluationDetail({ name, evaluation, demo }: { name: string; evaluation?: EngineEvaluation; demo: boolean }) {
  const counts = evaluationCounts(evaluation);
  return <section aria-label={`${name} evaluation`} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h4 className="text-sm font-semibold text-gray-900">{name} checks</h4><span className="text-xs text-gray-500">{evaluationReason(evaluation)}</span></div><div className="flex items-center gap-2">{demo && evaluation && <Badge size="sm" variant="outline">Demo checks</Badge>}<EvaluationStatus status={evaluation?.status} /></div></div>
    {!evaluation ? <p className="text-xs text-gray-500">No recorded checks for this engine in this run.</p> : <>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums"><span className="text-teal-700">{counts.pass} passed</span><span className="text-rose-700">{counts.fail} failed</span><span className="text-gray-500">{counts.skipped} not reached</span><span className="text-amber-800">{counts.missing} unavailable</span></div>
      <DataTable minWidth="540px"><caption className="sr-only">Recorded checks for {name}</caption><DataTableHeader><DataTableHead>Check</DataTableHead><DataTableHead align="right">Value</DataTableHead><DataTableHead align="right">Rule</DataTableHead><DataTableHead>Result</DataTableHead></DataTableHeader><DataTableBody>
        {evaluation.checks.map(check => <DataTableRow key={check.id}><DataTableCell className="py-2 text-xs font-medium"><span>{check.label}</span>{check.parameter && <span className="mt-0.5 block text-[10px] font-normal text-gray-500" title={check.parameter}>{check.parameter} · {check.setting_scope ?? 'Scope unavailable'}</span>}</DataTableCell><DataTableCell align="right" className="py-2 text-xs tabular-nums">{valueText(check.value, check.unit)}</DataTableCell><DataTableCell align="right" className="py-2 text-xs tabular-nums">{ruleText(check)}</DataTableCell><DataTableCell className="py-2"><CheckResult result={check.result} /></DataTableCell></DataTableRow>)}
      </DataTableBody></DataTable>
      {evaluation.outputs && evaluation.outputs.length > 0 && <dl className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-3 sm:grid-cols-4">{evaluation.outputs.map(metric => <div key={metric.key}><dt className="text-[11px] text-gray-500">{metric.label}</dt><dd className="mt-0.5 text-base font-semibold tabular-nums text-gray-900">{valueText(metric.value, metric.unit)}</dd></div>)}</dl>}
    </>}
  </section>;
}
