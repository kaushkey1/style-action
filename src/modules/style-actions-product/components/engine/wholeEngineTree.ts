import { buildLogicGraph, type LogicEdge, type LogicGraph, type LogicNode, type LogicTone, type LogicView } from './engineLogicModel';
import type { OptionEngineBundle } from './optionEngineData';

export type TreeEdgeState = 'active' | 'inactive' | 'unknown' | 'reference';
export interface TreeEdge extends LogicEdge {
  state?: TreeEdgeState;
  points?: [number, number][];
}
export interface TreeSection { id: string; title: string; note: string; x: number; y: number; width: number; height: number }
export interface WholeEngineTree extends Omit<LogicGraph, 'edges'> { width: number; sections: TreeSection[]; edges: TreeEdge[] }
const ACTIVE = new Set<LogicTone>(['passed', 'deciding', 'blocked']);
const skip = (status = 'Not taken'): Pick<LogicNode, 'tone' | 'status'> => ({ tone: 'skipped', status });
const unknown = (): Pick<LogicNode, 'tone' | 'status'> => ({ tone: 'unknown', status: 'Not recorded' });
const reached = (status = 'Recorded'): Pick<LogicNode, 'tone' | 'status'> => ({ tone: 'deciding', status });

export function treeEdgeState(edge: TreeEdge, nodes: LogicNode[]): TreeEdgeState {
  if (edge.state) return edge.state;
  const from = nodes.find(node => node.id === edge.from);
  const to = nodes.find(node => node.id === edge.to);
  if (from?.tone === 'skipped' || to?.tone === 'skipped') return 'inactive';
  if (from?.tone === 'unknown' || to?.tone === 'unknown') return 'unknown';
  if (from?.tone && to?.tone && ACTIVE.has(from.tone) && ACTIVE.has(to.tone)) return 'active';
  return 'reference';
}

function decorateRules(graph: LogicGraph, bundle: OptionEngineBundle) {
  const gate = bundle.gate;
  const deciding = gate?.deciding_gate;
  const excluded = gate?.gates.find(item => item.gate === 'gate_0')?.result === 'excluded';
  const canResolve = Boolean(gate && (excluded || /^gate_[0-4]$/.test(deciding ?? '')));
  const branch = (gateId: string, outcomes: string[]) => !canResolve ? unknown()
    : deciding === gateId && outcomes.includes(gate!.outcome) ? reached('Taken') : skip();
  const get = (id: string) => graph.nodes.find(node => node.id === id)!;
  Object.assign(get('scope'), !gate ? unknown() : excluded ? { tone: 'blocked', status: 'Grade excluded' } : get('g0').tone === 'unknown' ? unknown() : { tone: 'passed', status: 'Eligible grade' });
  Object.assign(get('excluded'), !gate ? unknown() : excluded ? reached('Taken') : skip());
  get('scope').h = 90;
  get('excluded').h = 90;
  for (let i = 0; i <= 4; i++) {
    const current = get(`g${i}`);
    // A terminal recorded gate proves later branches were not reached, even if their rows are absent.
    if (excluded || (canResolve && i > Number(deciding?.slice(-1)))) Object.assign(current, skip('Not reached'));
    else if (current.tone === 'reference') Object.assign(current, reached(current.status));
  }
  const remove = new Set(['g0out', 'g1out', 'price']);
  graph.nodes = graph.nodes.filter(node => !remove.has(node.id));
  graph.edges = graph.edges.filter(edge => !remove.has(edge.to));
  const outcome = (id: string, title: string, gateId: string, values: string[], y: number, engine?: string) => {
    graph.nodes.push({ id, title, lines: [], x: 480, y, w: 228, h: 62, ...branch(gateId, values), engine });
    graph.edges.push({ from: gateId.replace('gate_', 'g'), to: id, side: true });
  };
  outcome('liquidation', 'Liquidation', 'gate_0', ['liquidation'], 120, 'lifecycle_end');
  outcome('wait0', 'Wait · too new / unavailable', 'gate_0', ['wait'], 194);
  outcome('wait1', 'Wait · ROS unmeasurable', 'gate_1', ['wait'], 274);
  outcome('supply_hold', 'Supply hold', 'gate_1', ['supply_hold'], 340);
  outcome('leave_alone', 'Leave alone', 'gate_1', ['leave_alone'], 406);
  Object.assign(get('move'), branch('gate_2', ['move']));
  Object.assign(get('hold'), branch('gate_3', ['hold']));
  outcome('discount', 'Discount', 'gate_4', ['discount'], 844, 'markdown');
  outcome('hold4', 'Hold · age / missing inputs', 'gate_4', ['hold'], 914);
  outcome('hold_to_exit', 'Hold to exit · no headroom', 'gate_4', ['hold_to_exit'], 984);
  graph.nodes.push({ id: 'complete', title: 'Rule-tree result', lines: [gate?.outcome.replaceAll('_', ' ') ?? 'Outcome unavailable'], x: 12, y: 1100, w: 416, h: 84, ...(gate ? reached('Recorded outcome') : unknown()) });
  for (const id of ['excluded', 'liquidation', 'wait0', 'wait1', 'supply_hold', 'leave_alone', 'move', 'hold', 'discount', 'hold4', 'hold_to_exit']) graph.edges.push({ from: id, to: 'complete' });
  graph.height = 1200;
}

function decorateReplenishment(graph: LogicGraph, bundle: OptionEngineBundle) {
  const evaluation = bundle.gate?.engine_evaluations?.find(item => item.engine === 'replenishment');
  const get = (id: string) => graph.nodes.find(node => node.id === id)!;
  const eligible = get('eligible');
  const knownFail = eligible.tone === 'blocked' || evaluation?.status === 'skipped';
  const eligiblePassed = eligible.tone === 'passed';
  Object.assign(get('skip'), knownFail ? reached('Taken') : eligiblePassed ? skip() : unknown());
  const lines = bundle.lines.filter(line => line.line_type === 'replenishment');
  Object.assign(get('lines'), lines.length ? reached(`${lines.length} line${lines.length === 1 ? '' : 's'} produced`) : evaluation && ['blocked', 'skipped'].includes(evaluation.status) ? skip('No line produced') : unknown());
  const dispatch = evaluation?.outputs?.find(item => ['dispatch_qty', 'dispatch_quantity', 'dispatch_units'].includes(item.key))?.value;
  Object.assign(get('zero'), knownFail ? skip('Not reached') : dispatch === 0 ? reached('Taken') : typeof dispatch === 'number' && dispatch > 0 ? skip() : unknown());
  // Only a failed eligibility prerequisite, not a missing/zero action count, bypasses the calculations.
  if (knownFail) for (const id of ['target', 'capacity', 'sizes', 'dc']) Object.assign(get(id), skip('Not reached'));
  for (const node of graph.nodes) node.engine = 'replenishment';
}

function decoratePullbacks(graph: LogicGraph, bundle: OptionEngineBundle) {
  const engines: Record<string, string> = { broken: 'broken', consolidation: 'consolidation', overfill: 'overfill', lifecycle: 'lifecycle_end', replacement: 'replacement' };
  for (const node of graph.nodes) {
    if (engines[node.id]) {
      node.engine = engines[node.id];
      if (bundle.run.pullback_night === false) Object.assign(node, skip('Not scheduled'));
    }
  }
  const evaluation = bundle.gate?.engine_evaluations?.find(item => item.engine === 'lifecycle_end');
  const get = (id: string) => graph.nodes.find(node => node.id === id)!;
  Object.assign(get('priority'), bundle.run.pullback_night === false ? skip('Not scheduled')
    : bundle.lines.some(line => line.line_type === 'lifecycle_end') ? reached('Exit selected')
    : evaluation && ['blocked', 'skipped'].includes(evaluation.status) ? skip() : unknown());
  const floorEngines = bundle.gate?.engine_evaluations?.filter(item => ['broken', 'consolidation', 'overfill'].includes(item.engine)) ?? [];
  const floorChecks = floorEngines.flatMap(item => item.checks.filter(check => check.id === 'space_floor'));
  Object.assign(get('floor'), bundle.run.pullback_night === false || floorChecks.length === 3 && floorChecks.every(check => check.result === 'skipped') ? skip('Not reached')
    : floorChecks.some(check => check.result === 'fail') ? { tone: 'blocked', status: 'Floor check failed' }
    : floorChecks.some(check => check.result === 'pass') ? { tone: 'passed', status: 'Floor check passed' } : unknown());
  Object.assign(get('demand'), bundle.run.pullback_night === false ? skip('Not scheduled') : unknown());
  const lines = bundle.lines.filter(line => Object.values(engines).includes(line.line_type));
  Object.assign(get('review'), lines.length ? reached(`${lines.length} pullback line${lines.length === 1 ? '' : 's'}`) : skip('No line produced'));
  // Engines are independently evaluated in priority order. Do not draw a taken path through skipped types.
  graph.edges = [
    ...Object.keys(engines).map(id => ({ from: 'demand', to: id, label: id === 'broken' ? 'Evaluate candidates' : undefined })),
    { from: 'priority', to: 'lifecycle', label: 'Exit priority' },
    { from: 'broken', to: 'floor', side: true, label: 'Floor constraint' },
    ...Object.keys(engines).map(id => ({ from: id, to: 'review', label: id === 'replacement' ? 'Produced lines' : undefined })),
  ];
}

function decorateMarkdown(graph: LogicGraph, bundle: OptionEngineBundle) {
  const evaluation = bundle.gate?.engine_evaluations?.find(item => item.engine === 'markdown');
  const line = bundle.lines.find(item => item.line_type === 'markdown');
  const skipped = evaluation?.status === 'skipped';
  const get = (id: string) => graph.nodes.find(node => node.id === id)!;
  for (const node of graph.nodes) {
    node.engine = 'markdown';
    if (skipped) Object.assign(node, skip('Not reached'));
    else if (!node.tone) Object.assign(node, unknown());
  }
  if (skipped) Object.assign(get('nomination'), skip('No markdown nomination'));
  if (line) {
    Object.assign(get('nomination'), reached('Taken'));
    Object.assign(get('missing'), skip());
    Object.assign(get('exit'), skip());
    Object.assign(get('same'), skip());
    Object.assign(get('ladder'), reached(line.tier == null ? 'Tier recorded in output' : `Tier ${line.tier}`));
    Object.assign(get('price'), reached(line.marked_price == null ? 'Price output recorded' : `Proposed ₹${line.marked_price.toLocaleString('en-IN')}`));
    Object.assign(get('routing'), reached(`${line.autonomy_band?.replaceAll('_', ' ') ?? 'Routing unavailable'}`));
    if (line.governance_trigger?.includes('not_evaluated')) Object.assign(get('concentration'), { tone: 'unknown', status: 'Checks unavailable · approval required' });
  }
  if (!skipped && !line) {
    const reason = evaluation?.reason_code;
    const stoppedAt = reason && ['missing_price', 'missing_cost'].includes(reason) ? 'missing'
      : reason && ['headroom_nonpositive', 'hold_to_exit'].includes(reason) ? 'exit'
      : reason && ['same_tier', 'already_at_tier'].includes(reason) ? 'same' : undefined;
    if (stoppedAt) {
      Object.assign(get(stoppedAt), reached('Taken'));
      for (const id of ['missing', 'exit', 'same']) if (id !== stoppedAt) Object.assign(get(id), skip());
      const downstream = stoppedAt === 'missing' ? ['margin', 'ladder', 'price', 'concentration', 'routing'] : stoppedAt === 'exit' ? ['ladder', 'price', 'concentration', 'routing'] : ['price', 'concentration', 'routing'];
      for (const id of downstream) Object.assign(get(id), skip('Not reached'));
    }
  }
}

function decorateDispatch(graph: LogicGraph, bundle: OptionEngineBundle) {
  const get = (id: string) => graph.nodes.find(node => node.id === id)!;
  const hasLines = bundle.lines.length > 0;
  const shadow = bundle.run.phase === 'shadow';
  for (const node of graph.nodes) Object.assign(node, !hasLines || shadow ? skip(shadow ? 'Not executed · shadow run' : 'No action lines') : unknown());
  Object.assign(get('proposed'), hasLines ? reached(`${bundle.lines.length} recorded line${bundle.lines.length === 1 ? '' : 's'}`) : skip('No action lines'));
  Object.assign(get('shadow'), shadow && hasLines ? reached('This run stops here') : skip());
  if (shadow || !hasLines) return;
  Object.assign(get('route'), reached('Live phase'));
  const bandNodes = { auto: ['auto'], review: ['review_window'], approval: ['stop_and_approve', 'manual'] };
  const allBandsKnown = bundle.lines.every(line => Boolean(line.autonomy_band));
  for (const [id, bands] of Object.entries(bandNodes)) Object.assign(get(id), bundle.lines.some(line => bands.includes(line.autonomy_band ?? '')) ? reached('Selected route') : allBandsKnown ? skip() : unknown());
  const stateNodes: Record<string, string[]> = {
    release: ['released', 'accepted_downstream', 'in_transit_or_applied', 'received_or_priced', 'reconciled', 'mismatch', 'expired'],
    received: ['received_or_priced', 'reconciled', 'mismatch'], blocked: ['blocked', 'held', 'rejected'], expiry: ['expired'],
    reconciled: ['reconciled'], mismatch: ['mismatch'],
  };
  const statuses = bundle.lines.map(line => line.status.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase());
  const knownStates = new Set(['proposed', 'in_review', 'shadow_recorded', ...Object.values(stateNodes).flat()]);
  for (const [id, states] of Object.entries(stateNodes)) Object.assign(get(id), statuses.some(status => states.includes(status)) ? reached('Reached')
    : statuses.every(status => knownStates.has(status)) ? skip('Not reached') : unknown());
  if (bundle.lines.some(line => line.reconciliation_status === 'matched')) Object.assign(get('reconciled'), reached('Matched'));
  if (bundle.lines.some(line => line.reconciliation_status === 'mismatch')) Object.assign(get('mismatch'), reached('Mismatch'));
}

/** All detailed stages are mounted together. Navigation only pans the single canvas. */
export function buildWholeEngineTree(bundle: OptionEngineBundle): WholeEngineTree {
  const sections: TreeSection[] = [];
  const nodes: LogicNode[] = [{ id: 'snapshot', title: 'Snapshot + pinned settings', lines: ['One option · one store · one engine run', 'Rule tree and replenishment run in parallel'], x: 620, y: 12, w: 320, h: 92, tone: 'passed', status: 'Run recorded' }];
  const edges: TreeEdge[] = [];
  function append(view: Exclude<LogicView, 'workflow'>, title: string, note: string, x: number, y: number) {
    const graph = buildLogicGraph(view, bundle);
    if (view === 'rules') decorateRules(graph, bundle);
    if (view === 'replenishment') decorateReplenishment(graph, bundle);
    if (view === 'pullbacks') decoratePullbacks(graph, bundle);
    if (view === 'markdown') decorateMarkdown(graph, bundle);
    if (view === 'dispatch') decorateDispatch(graph, bundle);
    sections.push({ id: view, title, note, x, y, width: 752, height: graph.height + 84 });
    for (const node of graph.nodes) nodes.push({ ...node, target: undefined, id: `${view}:${node.id}`, x: node.x + x + 16, y: node.y + y + 64 });
    for (const edge of graph.edges) {
      const item: TreeEdge = { ...edge, from: `${view}:${edge.from}`, to: `${view}:${edge.to}` };
      if (view === 'pullbacks' && edge.to === 'review') {
        const engine = graph.nodes.find(node => node.id === edge.from)?.engine;
        item.state = bundle.lines.some(line => line.line_type === engine) ? 'active' : 'inactive';
      }
      // Dedicated gutters keep pullback fan-out and collection lines away from the decision cards.
      if (view === 'rules' && edge.to === 'complete') {
        const from = nodes.find(node => node.id === item.from)!;
        const to = nodes.find(node => node.id === item.to)!;
        const busX = x + 744;
        item.points = [[from.x + from.w, from.y + from.h / 2], [busX, from.y + from.h / 2], [busX, to.y + to.h / 2], [to.x + to.w, to.y + to.h / 2]];
      }
      if (view === 'pullbacks' && !edge.side) {
        const from = nodes.find(node => node.id === item.from)!;
        const to = nodes.find(node => node.id === item.to)!;
        const busX = x + (edge.to === 'review' || edge.from === 'priority' ? 756 : 4);
        item.points = edge.to === 'review' || edge.from === 'priority'
          ? [[from.x + from.w, from.y + from.h / 2], [busX, from.y + from.h / 2], [busX, to.y + to.h / 2], [to.x + to.w, to.y + to.h / 2]]
          : [[from.x, from.y + from.h / 2], [busX, from.y + from.h / 2], [busX, to.y + to.h / 2], [to.x, to.y + to.h / 2]];
        item.label = undefined;
      }
      edges.push(item);
    }
  }
  append('rules', '01 · Rule tree', 'G0–G4 · all outcomes shown', 16, 180);
  append('replenishment', '02 · Replenishment', 'Runs alongside the rule tree', 816, 180);
  append('pullbacks', '03 · Pullbacks & replacement', 'Mon / Thu · after both parallel stages', 416, 1480);
  append('markdown', '04 · Markdown', 'After pullbacks · discount nomination or existing markdown', 416, 2780);
  append('dispatch', '05 · Review, execution & reconciliation', 'Shadow stops before live execution', 416, 3970);

  const connect = (fromId: string, toId: string, label?: string, busX?: number, state?: TreeEdgeState) => {
    const from = nodes.find(node => node.id === fromId)!;
    const to = nodes.find(node => node.id === toId)!;
    edges.push({ from: fromId, to: toId, label, state, ...(busX === undefined ? {} : { points: [[from.x + from.w, from.y + from.h / 2], [busX, from.y + from.h / 2], [busX, to.y + to.h / 2], [to.x + to.w, to.y + to.h / 2]] as [number, number][] }) });
  };
  connect('snapshot', 'rules:scope', 'Parallel');
  connect('snapshot', 'replenishment:eligible', 'Parallel');
  // Completion dependencies are reference connectors, not claims that a particular option produced a line.
  connect('rules:complete', 'pullbacks:demand', 'After both stages', undefined, 'reference');
  connect('replenishment:lines', 'pullbacks:demand', 'Post-replenishment DC stock', undefined, 'reference');
  const nominate = (fromId: string, toId: string, busX: number, right: boolean) => {
    const from = nodes.find(node => node.id === fromId)!;
    const to = nodes.find(node => node.id === toId)!;
    edges.push({ from: fromId, to: toId, points: [[from.x + from.w, from.y + from.h / 2], [790, from.y + from.h / 2], [790, 1460], [busX, 1460], [busX, to.y + to.h / 2], [right ? to.x + to.w : to.x, to.y + to.h / 2]] });
  };
  nominate('rules:liquidation', 'pullbacks:priority', 1220, true);
  nominate('rules:move', 'pullbacks:demand', 400, false);
  const discount = nodes.find(node => node.id === 'rules:discount')!;
  const nomination = nodes.find(node => node.id === 'markdown:nomination')!;
  edges.push({ from: discount.id, to: nomination.id, points: [[discount.x + discount.w, discount.y + discount.h / 2], [790, discount.y + discount.h / 2], [790, 1460], [1200, 1460], [1200, nomination.y + nomination.h / 2], [nomination.x + nomination.w, nomination.y + nomination.h / 2]] });
  connect('pullbacks:review', 'markdown:nomination', 'Next scheduled stage', undefined, 'reference');
  connect('markdown:routing', 'dispatch:proposed', 'All produced lines', undefined, 'reference');
  // Actual line paths bypass unrelated skipped engines. Gray nodes never carry the highlighted trace.
  for (const [id, engine] of Object.entries({ 'replenishment:lines': 'replenishment', 'pullbacks:broken': 'broken', 'pullbacks:consolidation': 'consolidation', 'pullbacks:overfill': 'overfill', 'pullbacks:lifecycle': 'lifecycle_end', 'pullbacks:replacement': 'replacement', 'markdown:price': 'markdown' })) {
    if (bundle.lines.some(line => line.line_type === engine)) connect(id, 'dispatch:proposed', 'Recorded output', 1548, 'active');
  }
  return { title: 'Whole engine workflow', subtitle: 'Every gate and engine in one tree. Grey branches were not taken for this option.', width: 1584, height: 5030, nodes, edges, sections };
}
