import type { EngineCheck, OptionEngineBundle } from './optionEngineData';

export type LogicView = 'workflow' | 'rules' | 'replenishment' | 'pullbacks' | 'markdown' | 'dispatch';
export type LogicTone = 'reference' | 'passed' | 'blocked' | 'skipped' | 'unknown' | 'deciding';
export interface LogicNode {
  id: string; title: string; lines: string[]; x: number; y: number; w: number; h: number;
  status?: string; tone?: LogicTone; target?: LogicView;
  engine?: string;
}
export interface LogicEdge { from: string; to: string; label?: string; side?: boolean }
export interface LogicGraph { title: string; subtitle: string; height: number; nodes: LogicNode[]; edges: LogicEdge[] }
export const LOGIC_VIEWS: { id: LogicView; label: string }[] = [
  { id: 'workflow', label: 'Whole workflow' }, { id: 'rules', label: 'Rule tree' },
  { id: 'replenishment', label: 'Replenishment' }, { id: 'pullbacks', label: 'Pullbacks' },
  { id: 'markdown', label: 'Markdown' }, { id: 'dispatch', label: 'Review & execution' },
];
const titleCase = (value: string) => value.replaceAll('_', ' ').replace(/^\w/, letter => letter.toUpperCase());

/** These are reference diagrams, not an execution simulator. Only recorded evidence colours nodes. */
export function engineState(bundle: OptionEngineBundle, engine: string): Pick<LogicNode, 'status' | 'tone'> {
  const evaluation = bundle.gate?.engine_evaluations?.find(item => item.engine === engine);
  if (!evaluation) return { status: 'Not recorded', tone: 'unknown' };
  return { status: titleCase(evaluation.status), tone: evaluation.status === 'not_evaluated' ? 'unknown' : evaluation.status };
}
function checkState(bundle: OptionEngineBundle, engine: string, ids: string[]): Pick<LogicNode, 'status' | 'tone'> {
  const checks = bundle.gate?.engine_evaluations?.find(item => item.engine === engine)?.checks;
  const selected = ids.map(id => checks?.find(check => check.id === id));
  if (selected.some(check => check?.result === 'fail')) return { status: 'Failed check', tone: 'blocked' };
  if (selected.every(check => check?.result === 'skipped')) return { status: 'Not reached', tone: 'skipped' };
  if (selected.some(check => !check || check.result === 'not_evaluated')) return { status: 'Evidence unavailable', tone: 'unknown' };
  if (selected.every(check => check?.result === 'pass')) return { status: 'Checks passed', tone: 'passed' };
  return { status: 'Partially recorded', tone: 'unknown' };
}
function gateState(bundle: OptionEngineBundle, index: number): Pick<LogicNode, 'status' | 'tone'> {
  const gate = bundle.gate?.gates.find(item => item.gate === `gate_${index}`);
  if (!gate) return { status: 'Not recorded', tone: 'unknown' };
  if (gate.result === 'skip') return { status: 'Not reached', tone: 'skipped' };
  if (gate.result === 'not_evaluated') return { status: 'Not evaluated', tone: 'unknown' };
  if (bundle.gate?.deciding_gate === gate.gate) return { status: `${titleCase(gate.result)} · deciding`, tone: 'deciding' };
  if (gate.result.startsWith('pass')) return { status: titleCase(gate.result), tone: 'passed' };
  return { status: titleCase(gate.result), tone: 'reference' };
}

/** Prefer the selected run's setting/check threshold. A dagger always marks a reference default. */
export function logicSetting(bundle: OptionEngineBundle, key: string, fallback: number, unit = '', engine?: string): string {
  const evaluations = bundle.gate?.engine_evaluations ?? [];
  const check: EngineCheck | undefined = evaluations.filter(item => !engine || item.engine === engine)
    .flatMap(item => item.checks).find(item => item.parameter === key && typeof item.threshold === 'number');
  const setting = bundle.gate?.settings_used[key]?.value;
  const value = check?.threshold ?? setting;
  const known = typeof value === 'number' && Number.isFinite(value);
  const number = known ? value : fallback;
  return `${unit === '%' ? Math.round(number * 100) : number}${unit}${known ? '' : '†'}`;
}

export function buildLogicGraph(view: LogicView, bundle: OptionEngineBundle): LogicGraph {
  const setting = (key: string, fallback: number, unit = '', engine?: string) => logicSetting(bundle, key, fallback, unit, engine);
  const exit = setting('exit_day', 90, 'd');
  const minAge = setting('min_age_days', 14, 'd');
  const replWindow = setting('repl_window_day', 60, 'd', 'replenishment');
  const nodes: LogicNode[] = [];
  const edges: LogicEdge[] = [];
  const node = (id: string, title: string, lines: string[], x: number, y: number, w = 416, h = 108, state: Partial<LogicNode> = {}) => {
    nodes.push({ id, title, lines, x, y, w, h, ...state });
  };
  const link = (from: string, to: string, label?: string, side = false) => edges.push({ from, to, label, side });
  const shadow = bundle.run.phase === 'shadow';

  if (view === 'workflow') {
    node('snapshot', 'Snapshot + pinned settings', ['One run · one store · one option'], 216, 12, 288, 66);
    node('rules', 'Rule tree · G0–G4', ['Eligibility → performance → move → rail → margin'], 12, 132, 332, 110,
      { target: 'rules', status: bundle.gate ? titleCase(bundle.gate.outcome) : 'Not recorded', tone: bundle.gate ? 'deciding' : 'unknown' });
    node('replenishment', 'Replenishment', ['Eligibility → target → capacity → sizes → DC supply'], 376, 132, 332, 110, { target: 'replenishment', ...engineState(bundle, 'replenishment') });
    node('pullbacks', 'Pullback engines · Mon / Thu', ['Broken sizes · consolidation · overfill', 'Lifecycle exit · replacement'], 182, 296, 356, 112,
      { target: 'pullbacks', status: bundle.run.pullback_night === undefined ? 'Schedule not recorded' : bundle.run.pullback_night ? 'Pullback run' : 'Not a pullback run', tone: 'reference' });
    node('markdown', 'Markdown engine', ['Discount nomination / already marked down'], 182, 458, 356, 94, { target: 'markdown', ...engineState(bundle, 'markdown') });
    node('routing', 'Review & governance', ['Auto · review window · approval · manual'], 12, 610, 332, 96, { target: 'dispatch' });
    node('dispatch', 'Dispatch & reconciliation', ['Release → transit / price → match'], 376, 610, 332, 96,
      { target: 'dispatch', ...(shadow ? { status: 'Shadow only · no execution', tone: 'deciding' as const } : {}) });
    link('snapshot', 'rules', 'In parallel'); link('snapshot', 'replenishment', 'Nightly');
    link('rules', 'pullbacks', 'Nominations'); link('replenishment', 'pullbacks', 'Post-replenishment stock');
    link('pullbacks', 'markdown', 'Next scheduled stage'); link('markdown', 'routing', 'All proposed lines'); link('routing', 'dispatch', 'Route by phase', true);
    return { title: 'Whole engine workflow', subtitle: 'Select a stage to open its decision diagram.', height: 730, nodes, edges };
  }

  if (view === 'rules') {
    node('scope', 'Eligible grade', ['Fashion / Ultimate only'], 12, 12, 416, 70);
    node('excluded', 'Core excluded', ['No rule-tree judgement'], 480, 12, 228, 70);
    node('g0', 'G0 · Eligibility', [`Lifecycle age ≥ ${exit}`, `Receipt age < ${minAge}`], 12, 132, 416, 112, gateState(bundle, 0));
    node('g0out', 'Liquidation / wait', ['Exit age → liquidation', 'Too new → wait'], 480, 132, 228, 112);
    node('g1', 'G1 · Performance', ['ROS unavailable → wait', 'Supply-constrained → supply hold', 'Over / on-track → leave alone'], 12, 294, 416, 134, gateState(bundle, 1));
    node('g1out', 'Observe', ['Wait / supply hold / leave alone'], 480, 294, 228, 96);
    node('g2', 'G2 · Move feasibility · all must pass', ['Destination in same DC · selling + below space plan', `${exit} − age − ${setting('transit_days', 2, 'd')} ≥ ${setting('runway_min_days', 21, 'd')} runway`, `Pullbacks < ${setting('pullback_cap', 3)}`, `No prior pullback OR cooldown ≥ ${setting('cooldown_days', 21, 'd')}`], 12, 478, 416, 142, gateState(bundle, 2));
    node('move', 'MOVE nomination', ['Queue for next pullback run'], 480, 478, 228, 96, { target: 'pullbacks' });
    node('g3', 'G3 · Local rail health', ['Healthy → hold', 'Dead → G4', 'Thresholds missing → G4 + approval'], 12, 670, 416, 134, gateState(bundle, 3));
    node('hold', 'HOLD', ['Observe; no action line'], 480, 670, 228, 84);
    node('g4', 'G4 · Margin headroom', ['Already marked down → discount ladder', `Age < ${setting('markdown_start_day', 60, 'd')} / missing cost or price → hold`, 'Headroom = current price − margin floor', 'Headroom > 0 → discount · ≤ 0 → hold to exit'], 12, 854, 416, 162, gateState(bundle, 4));
    node('price', 'DISCOUNT / HOLD / EXIT', ['Discount → markdown engine', 'Other outcomes → observe'], 480, 854, 228, 120, { target: 'markdown' });
    link('scope', 'excluded', 'Core', true); link('scope', 'g0', 'Fashion / Ultimate');
    link('g0', 'g0out', 'Stop', true); link('g0', 'g1', 'Otherwise');
    link('g1', 'g1out', 'Stop', true); link('g1', 'g2', 'Watch / under');
    link('g2', 'move', 'All pass', true); link('g2', 'g3', 'Any fail');
    link('g3', 'hold', 'Healthy', true); link('g3', 'g4', 'Dead / thresholds missing'); link('g4', 'price', 'Outcome', true);
    return { title: 'Rule-tree decisions', subtitle: 'Colour shows recorded gate results; unrecorded branches remain reference logic.', height: 1040, nodes, edges };
  }

  if (view === 'replenishment') {
    node('eligible', '1 · Eligibility', ['Fashion / Ultimate · live store inventory', `Lifecycle age ≤ ${replWindow} · no pending / held pullback`, 'Not marked down, except size completion'], 12, 12, 416, 140,
      checkState(bundle, 'replenishment', ['grade', 'live', 'window', 'pending_pullback', 'marked_down']));
    node('skip', 'No replenishment', ['Any eligibility check fails'], 480, 12, 228, 90);
    node('target', '2 · Target quantity', ['ceil(max(True ROS × (lead time + 1),', 'pivotal-size count))'], 12, 202, 416, 116, checkState(bundle, 'replenishment', ['target']));
    node('capacity', '3 · Capacity cap', ['Targets + non-replenished inventory ≤ space plan', 'Cut lowest ROS first · preserve pivotal-size minimum'], 12, 368, 416, 118, checkState(bundle, 'replenishment', ['capacity']));
    node('sizes', '4 · Size allocation & dispatch', ['1 unit per pivotal size; remainder by eligible-unit share', 'Floor shares; leftovers to largest fractions (tie: size code)', 'Dispatch = max(0, size target − inventory position)'], 12, 536, 416, 148, checkState(bundle, 'replenishment', ['size_dispatch']));
    node('zero', 'No dispatch line', ['Computed dispatch = 0'], 480, 536, 228, 90);
    node('dc', '5 · Distribution Centre rationing', ['If supply is short: gap ↑ · ROS ↓ · store code', 'Supply-constrained / under-min-age rank as gap 0', 'Pass 1: 1 unit of largest-shortfall pivotal size', 'Pass 2: remaining dispatch until supply runs out'], 12, 734, 416, 160, checkState(bundle, 'replenishment', ['dc_rationing']));
    node('lines', 'Replenishment lines → governance', ['Auto release in live phase · shadow records only'], 12, 944, 416, 86, { target: 'dispatch', ...engineState(bundle, 'replenishment') });
    link('eligible', 'skip', 'Fail', true); link('eligible', 'target', 'Eligible'); link('target', 'capacity'); link('capacity', 'sizes');
    link('sizes', 'zero', '= 0', true); link('sizes', 'dc', '> 0'); link('dc', 'lines');
    return { title: 'Replenishment logic', subtitle: 'Runs independently of the rule tree. Zero action lines do not imply a passed evaluation.', height: 1054, nodes, edges };
  }

  if (view === 'pullbacks') {
    node('demand', 'DC demand after replenishment', [`Eligible contributors: live · lifecycle age ≤ ${replWindow}`, 'Σ max(0, ROS × (lead time + cover days) − position)', 'Shortfall = max(0, demand − post-replenishment DC stock)'], 12, 12, 416, 120);
    node('priority', 'Lifecycle exit precedence', [`Fashion / Ultimate age ≥ ${exit}`, 'Exit takes priority; floor ignored'], 480, 12, 228, 120);
    node('broken', '1 · Broken size set', [`Broken > ${setting('broken_threshold', 0.5, '%')} OR enabled pivot-out rule`, 'Highest-STR selling destination · full option via DC', 'Space floor applies · not limited by shortfall'], 12, 178, 416, 134, engineState(bundle, 'broken'));
    node('floor', 'Space floor · when applied', [`Post-pull options ≥ ${setting('space_floor_options', 1, '%')} of plan`, `Post-pull units ≥ ${setting('space_floor_qty', 0.9, '%')} of plan`, 'DC rebuilds a complete pivotal set after broken-size pull'], 480, 178, 228, 150);
    node('consolidation', '2 · Consolidation', [`Shortfall > 0 · under / watch ≥ 60d† / Core ≥ ${minAge}`, `Exclude SC / over / on-track / marked-down / age ≥ ${exit}`, 'Rank gap ↓ (Core: cover ↓) · oldest tie-break · space floor'], 12, 362, 416, 144, engineState(bundle, 'consolidation'));
    node('overfill', '3 · Overfill', [`Options fill OR units fill > ${setting('overfill_threshold', 1.2, '%', 'overfill')}`, 'Oldest whole weeks → cover ↓ → option code', 'Stop at floor / fill threshold · not limited by shortfall'], 12, 556, 416, 134, engineState(bundle, 'overfill'));
    node('lifecycle', '4 · Lifecycle exit', [`Fashion / Ultimate · first pullback at age ≥ ${exit}`, 'Full option → DC → Fashion Factory', 'Ignore floor · human confirms batch'], 12, 740, 416, 134, engineState(bundle, 'lifecycle_end'));
    node('replacement', '5 · Replacement after pulls', ['Below store × brick × grade space plan', 'Match segment / family / class / brick / grade', `Complete DC pivots · age ≤ ${replWindow} · not already live`, 'Release / hold with linked pullback'], 12, 924, 416, 142, engineState(bundle, 'replacement'));
    node('review', 'Review & governance', [`${setting('review_window_hours', 12, 'h')} review window`, 'Lifecycle exit: manual confirmation'], 480, 924, 228, 118, { target: 'dispatch' });
    link('demand', 'broken', 'Mon / Thu'); link('broken', 'consolidation', 'Next eligible type');
    link('consolidation', 'overfill', 'Next eligible type'); link('overfill', 'lifecycle', 'Subject to exit precedence');
    link('lifecycle', 'replacement', 'After pulls'); link('replacement', 'review', 'Lines', true);
    return { title: 'Pullback & replacement logic', subtitle: 'After rule tree + replenishment. Move nominations inform routing; independent triggers still apply.', height: 1090, nodes, edges };
  }

  if (view === 'markdown') {
    node('nomination', '1 · Enter markdown engine', ['DISCOUNT outcome OR already marked down'], 12, 12, 416, 100, engineState(bundle, 'markdown'));
    node('prereq', '2 · Price & cost prerequisites', ['Current price and cost / margin inputs required', 'Blended cost = base cost + taxes + buffer', 'Margin floor = blended cost + category margin'], 12, 162, 416, 136, checkState(bundle, 'markdown', ['price']));
    node('missing', 'Exclude', ['Missing price / cost inputs'], 480, 162, 228, 90);
    node('margin', '3 · Margin headroom', ['Headroom = current price − margin floor'], 12, 348, 416, 90);
    node('exit', 'Hold to exit', ['Headroom ≤ 0 · no markdown line'], 480, 348, 228, 90);
    node('ladder', '4 · Ladder & tier progression', [
      `${setting('ladder_tier_1_day_start', 60)}–${setting('ladder_tier_1_day_end', 74)}d → ${setting('ladder_tier_1_depth', 0.1, '%')} · tier 1`,
      `${setting('ladder_tier_2_day_start', 75)}–${setting('ladder_tier_2_day_end', 79)}d → ${setting('ladder_tier_2_depth', 0.2, '%')} · tier 2`,
      `${setting('ladder_tier_3_day_start', 80)}–${setting('ladder_tier_3_day_end', 89)}d → ${setting('ladder_tier_3_depth', 0.25, '%')} · tier 3`,
    ], 12, 488, 416, 126);
    node('same', 'No new line', ['Already priced at this tier'], 480, 488, 228, 90);
    node('price', '5 · Proposed marked price', ['max(reference price × (1 − depth), margin floor)', 'Cumulative depth · flag if the floor binds'], 12, 664, 416, 116, checkState(bundle, 'markdown', ['floor']));
    node('concentration', '6 · Concentration & governance', [`Brick > ${setting('concentration_brick_pct', 0.15, '%')} · category > ${setting('concentration_category_pct', 0.2, '%')} over ${setting('concentration_window_days', 7, 'd')}`, 'Rupee cap breach / missing thresholds → approval', 'Floor / early / Core-Ultimate / manual / rail N/A → approval'], 12, 830, 416, 134);
    node('routing', 'Route markdown line', ['Within auto band → release', 'Approval band → in review'], 480, 830, 228, 112, { target: 'dispatch' });
    link('nomination', 'prereq'); link('prereq', 'missing', 'Missing', true); link('prereq', 'margin', 'Available');
    link('margin', 'exit', '≤ 0', true); link('margin', 'ladder', '> 0'); link('ladder', 'same', 'Same tier', true);
    link('ladder', 'price', 'New tier'); link('price', 'concentration'); link('concentration', 'routing', 'Lines', true);
    return { title: 'Markdown logic', subtitle: 'Recorded traces and reference rules are shown separately; proposals are not applied prices.', height: 988, nodes, edges };
  }

  node('proposed', 'Proposed lines', ['Replenishment · pullbacks · markdown'], 216, 12, 288, 76);
  node('shadow', 'Shadow recorded · stop', ['No export · no execution'], 12, 150, 256, 96, shadow ? { status: 'This run', tone: 'deciding' } : {});
  node('route', 'Live phase · autonomy routing', ['Auto / review / approval / manual'], 366, 150, 342, 96);
  node('auto', 'Auto', ['Replenishment / eligible markdown', 'Release immediately'], 12, 318, 220, 110);
  node('review', 'Review window', [`Pullback / replacement · ${setting('review_window_hours', 12, 'h')}`, 'Unblocked window → release', 'Upheld block → held'], 250, 318, 220, 122);
  node('approval', 'Approval / manual', ['Triggers T1–T7 / missing checks', 'Exit batch: human confirmation'], 488, 318, 220, 110);
  node('release', 'Released → accepted downstream', ['Moves: in transit → received', 'Prices: applied → priced'], 12, 510, 416, 112);
  node('blocked', 'Blocked / rejected', ['Upheld block → held', 'Rejected → stop'], 480, 510, 228, 112);
  node('received', 'Received / priced', ['Compare expected with actual'], 12, 684, 416, 90);
  node('expiry', 'Expired', [`STO not processed in ${setting('sto_expiry_hours', 72, 'h')}`], 480, 684, 228, 90);
  node('reconciled', 'Reconciled', ['Actual matches expected'], 12, 836, 332, 86);
  node('mismatch', 'Mismatch', ['Actual differs from expected'], 376, 836, 332, 86);
  link('proposed', 'shadow', 'Shadow phase'); link('proposed', 'route', 'Live phase');
  link('route', 'auto', 'Auto band'); link('route', 'review', 'Review band'); link('route', 'approval', 'Approval band');
  link('auto', 'release'); link('review', 'release', 'Unblocked'); link('approval', 'release', 'Approved'); link('approval', 'blocked', 'Blocked / rejected');
  link('release', 'received', 'Processed'); link('release', 'expiry', 'Timeout');
  link('received', 'reconciled', 'Match'); link('received', 'mismatch', 'Differ');
  return { title: 'Review, execution & reconciliation', subtitle: shadow ? 'This run stops at shadow recording. Downstream states are reference only.' : 'Documented state transitions; actual line states are listed below.', height: 950, nodes, edges };
}
