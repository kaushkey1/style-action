import { useId, useState } from 'react';
import { ChevronDown, GitBranch } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatPercent, formatUnits } from '../display';
import { ErrorBlock, LoadingBlock } from '../QueryStates';
import type { OptionStoreDetail } from '../../api/types';
import { EngineLogicDiagram } from './EngineLogicDiagram';
import { useOptionEngine, type EngineGateDetail, type EngineValue, type OptionEngineBundle } from './optionEngineData';

const gateNames = ['Eligibility', 'Performance', 'Move', 'Rail health', 'Markdown'];
const labels: Record<string, string> = { skip: 'Not reached', not_evaluated: 'Not evaluated', pass: 'Pass', fail: 'Fail', pass_behind: 'Behind', excluded: 'Excluded', shadow_recorded: 'Shadow', stop_and_approve: 'Approval', concentration_not_evaluated: 'Concentration N/A', lifecycle_age: 'Lifecycle age · d', days_in_store: 'Receipt age · d', min_age_days: 'Min age · d', exit_day: 'Exit day', true_ros_daily: 'True ROS / day', depth_pct: 'Depth', reference_price: 'Reference price', marked_price: 'Marked price', current_price: 'Current price', margin_floor: 'Margin floor', behind_share: 'Behind share', curve_target: 'Curve target', curve_pct: 'Curve target', runway_min_days: 'Min runway · d', runway_days: 'Runway · d', pullback_cap: 'Pullback cap', pullback_count: 'Pullbacks', cooldown_days: 'Cooldown · d', transit_days: 'Transit · d', markdown_start_day: 'Markdown start · d' };
function label(value: string) { return labels[value] ?? value.replaceAll('_', ' ').replace(/^\w/, letter => letter.toUpperCase()); }
function number(value: EngineValue | undefined, key = ''): string {
  if (value === null || value === undefined || (typeof value === 'number' && !Number.isFinite(value))) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') return label(value);
  if (/price|floor$|headroom|cost|margin_at/.test(key)) return `₹${formatUnits(value)}`;
  if (/pct|share|gap|availability|curve_target|curve_pct|depth/.test(key)) return formatPercent(value);
  if (/ros/.test(key)) return value.toFixed(2);
  return formatUnits(value);
}
function Status({ value }: { value: string }) {
  return <Badge size="sm" variant={/not_evaluated|mismatch|fail|supply|approval|review/.test(value) ? 'warning' : 'outline'}>{label(value)}</Badge>;
}
function RuleTreeResult({ bundle }: { bundle: OptionEngineBundle }) {
  const outcome = bundle.gate?.outcome ?? 'unavailable';
  const gateCode = bundle.gate?.deciding_gate;
  const gate = bundle.gate?.gates.find(item => item.gate === gateCode);
  const unavailable = outcome === 'unavailable' || outcome === 'not_evaluated';
  return <section aria-label="Rule-tree result" className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-l-4 px-3 py-2.5', unavailable ? 'border-gray-200 border-l-gray-400 bg-gray-50' : 'border-teal-200 border-l-teal-600 bg-teal-50')}>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-medium text-gray-600">Rule-tree result</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-xl font-semibold tracking-tight text-gray-900">{label(outcome)}</h3>
        {gateCode && <span className="text-xs font-medium text-gray-600">{gateCode.replace('gate_', 'G')}{gate ? ` · ${gate.label}` : ''}</span>}
      </div>
    </div>
    {bundle.demo && <span className="text-[11px] text-gray-500">Illustrative · no execution</span>}
  </section>;
}
function GateValues({ gate }: { gate: EngineGateDetail }) {
  return <div className="space-y-3">{Object.entries(gate.metrics ?? {}).length > 0 && <dl className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">{Object.entries(gate.metrics ?? {}).map(([key,value]) => <div key={key}><dt className="text-xs text-gray-500">{label(key)}</dt><dd className="mt-1 text-xs font-semibold tabular-nums text-gray-900">{number(value, key)}</dd></div>)}</dl>}{gate.sub_gates?.filter(sub => sub.result !== 'skip').map(sub => <div className="space-y-3 border-t border-gray-100 pt-3" key={sub.gate}><div className="flex items-center gap-2 text-xs font-medium"><span>{sub.gate.replace('gate_', 'G').toUpperCase()} · {sub.label}</span><Status value={sub.result} /></div><GateValues gate={sub} /></div>)}</div>;
}
function GateTrace({ bundle }: { bundle: OptionEngineBundle }) {
  const [selected, setSelected] = useState<string | null>(null);
  const gates = bundle.gate?.gates ?? [];
  const visible = Array.from({length:5}, (_,i) => ({ i, gate: gates.find(gate => gate.gate === `gate_${i}`) })).filter(({ gate }) => gate?.result !== 'skip');
  const current = visible.find(({ gate }) => gate?.gate === selected)?.gate ?? visible.find(({ gate }) => gate?.gate === bundle.gate?.deciding_gate)?.gate ?? visible.find(({ gate }) => gate)?.gate;
  return <section className="space-y-2" aria-label="Decision gates">
    <h3 className="text-xs font-semibold text-gray-900">Decision gates</h3>
    <div className="overflow-hidden rounded-lg border border-gray-200">
      {visible.length === 1 && current ? <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-teal-50 px-3 py-2">
        <h4 className="text-xs font-semibold text-gray-900">{current.gate.replace('gate_', 'G')} · {current.label}</h4>
        {current.gate === bundle.gate?.deciding_gate && <span className="text-[11px] text-gray-500">Deciding</span>}
        <span className="ml-auto"><Status value={current.result} /></span>
      </div> : <div className="flex flex-wrap border-b border-gray-200 bg-gray-50/60">
        {visible.map(({ i, gate }) => <button key={i} type="button" aria-label={`G${i} ${gateNames[i]} ${gate ? label(gate.result) : 'Unavailable'}`} disabled={!gate} onClick={() => setSelected(`gate_${i}`)} aria-pressed={current?.gate === `gate_${i}`} className={cn('min-w-32 flex-1 space-y-0.5 border-b-2 px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-600', current?.gate === `gate_${i}` ? 'border-teal-600 bg-teal-50' : 'border-transparent hover:bg-gray-100 disabled:hover:bg-transparent')}>
          <span className="block text-[11px] text-gray-500">G{i}{bundle.gate?.deciding_gate === `gate_${i}` ? ' · Deciding' : ''}</span>
          <span className="block text-xs font-semibold text-gray-900">{gateNames[i]}</span>
          <span className="block text-[11px] text-gray-600">{gate ? label(gate.result) : 'Unavailable'}</span>
        </button>)}
      </div>}
      {current && <div className="p-3"><GateValues gate={current} /></div>}
    </div>
  </section>;
}

function EngineDisclosure({ title, summary, icon, children }: { title: string; summary: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return <div className="rounded-lg border border-gray-200">
    <button type="button" aria-label={title} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)} className="flex min-h-9 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 [@media(pointer:coarse)]:min-h-11">
      {icon}
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-0.5">
        <span className="font-semibold text-gray-900">{title}</span>
        <span className="text-[11px] text-gray-500">{summary}</span>
      </span>
      <ChevronDown className={cn('size-3.5 shrink-0 text-gray-500 transition-transform', open && 'rotate-180')} aria-hidden />
    </button>
    <div id={panelId} hidden={!open} className="min-w-0 space-y-3 border-t border-gray-200 p-2">
      {open && children}
    </div>
  </div>;
}

function EngineLogicDisclosure({ bundle }: { bundle: OptionEngineBundle }) {
  return <EngineDisclosure title="Engine logic" summary="Whole tree · recorded path" icon={<GitBranch className="size-3.5 shrink-0 text-gray-500" aria-hidden />}>
    <EngineLogicDiagram bundle={bundle} />
  </EngineDisclosure>;
}

export function OptionEngineResults({ detail, runId }: { detail: OptionStoreDetail; runId?: string }) {
  const query = useOptionEngine(detail, runId);
  if (query.isLoading) return <LoadingBlock label="Loading engine results" />;
  if (query.error) return <ErrorBlock error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-gray-300 p-3"><h3 className="text-xs font-medium">Engine run</h3><Badge variant="outline">Unavailable for this snapshot</Badge></div>;
  return <EngineBundleResults bundle={query.data} />;
}

/** The action view can show engine evidence even when inventory metadata is unavailable. */
export function EngineBundleResults({ bundle }: { bundle: OptionEngineBundle }) {
  return <div className="space-y-3">
    <RuleTreeResult bundle={bundle} />
    <GateTrace bundle={bundle} />
    <EngineLogicDisclosure key={`${bundle.run.run_id}-${bundle.gate?.option_code ?? bundle.lines[0]?.option_code ?? 'unknown'}`} bundle={bundle} />
  </div>;
}
