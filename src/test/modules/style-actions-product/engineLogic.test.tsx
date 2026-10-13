import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OptionStoreDetail } from '@/modules/style-actions-product/api/types';
import { demoResponse, DEMO_SNAPSHOT_ID } from '@/modules/style-actions-product/data/demoApi';
import { makeDemoOptionEngine } from '@/modules/style-actions-product/data/demoOptionEngine';
import { EngineLogicDiagram } from '@/modules/style-actions-product/components/engine/EngineLogicDiagram';
import { buildLogicGraph, engineState, logicSetting } from '@/modules/style-actions-product/components/engine/engineLogicModel';
import { buildWholeEngineTree, treeEdgeState } from '@/modules/style-actions-product/components/engine/wholeEngineTree';
import type { OptionEngineBundle } from '@/modules/style-actions-product/components/engine/optionEngineData';

async function demo(option = '700000206_SAND') {
  const detail = await demoResponse('GET', `/v1/option-stores/PUN01/${option}`, { snapshot_id: DEMO_SNAPSHOT_ID }).json() as OptionStoreDetail;
  return makeDemoOptionEngine(detail);
}
let bundle: OptionEngineBundle;
beforeEach(async () => { bundle = await demo(); });
afterEach(() => vi.unstubAllGlobals());

describe('whole engine tree and recorded paths', () => {
  it('connects all detailed stages and seven engines, with rule tree and replenishment in parallel', () => {
    const graph = buildWholeEngineTree(bundle);
    expect(graph.sections.map(item => item.id)).toEqual(['rules', 'replenishment', 'pullbacks', 'markdown', 'dispatch']);
    expect(new Set(graph.nodes.map(node => node.engine).filter(Boolean)).size).toBe(7);
    expect(graph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: 'snapshot', to: 'rules:scope' }),
      expect.objectContaining({ from: 'snapshot', to: 'replenishment:eligible' }),
      expect.objectContaining({ from: 'rules:complete', to: 'pullbacks:demand' }),
      expect.objectContaining({ from: 'replenishment:lines', to: 'pullbacks:demand' }),
      expect.objectContaining({ from: 'pullbacks:review', to: 'markdown:nomination' }),
      expect.objectContaining({ from: 'markdown:routing', to: 'dispatch:proposed' }),
    ]));
    expect(graph.edges.some(edge => edge.from.startsWith('rules:') && edge.to.startsWith('replenishment:'))).toBe(false);
    const ids = new Set(graph.nodes.map(node => node.id));
    expect(ids.size).toBe(graph.nodes.length);
    expect(graph.nodes.every(node => node.x >= 0 && node.y >= 0 && node.x + node.w <= graph.width && node.y + node.h <= graph.height)).toBe(true);
    expect(graph.edges.every(edge => ids.has(edge.from) && ids.has(edge.to))).toBe(true);
    expect(graph.nodes.every(node => graph.edges.some(edge => edge.from === node.id || edge.to === node.id))).toBe(true);
  });

  it('greys untaken branches and later gates after G0 exit, but retains the failed replenishment check', () => {
    const graph = buildWholeEngineTree(bundle);
    const node = (id: string) => graph.nodes.find(item => item.id === id)!;
    expect(node('rules:liquidation').tone).toBe('deciding');
    for (const id of ['g1', 'g2', 'g3', 'g4', 'excluded', 'wait0', 'wait1', 'supply_hold', 'leave_alone', 'move', 'hold', 'discount', 'hold4', 'hold_to_exit']) expect(node(`rules:${id}`).tone, id).toBe('skipped');
    expect(node('replenishment:eligible').tone).toBe('blocked');
    expect(node('replenishment:skip').tone).toBe('deciding');
    expect(node('replenishment:target').tone).toBe('skipped');
    expect(graph.nodes.filter(item => item.id.startsWith('markdown:')).every(item => item.tone === 'skipped')).toBe(true);
    for (const edge of graph.edges.filter(item => !item.state && (node(item.from).tone === 'skipped' || node(item.to).tone === 'skipped'))) expect(treeEdgeState(edge, graph.nodes)).toBe('inactive');
    expect(graph.edges.find(edge => edge.from === 'pullbacks:lifecycle' && edge.to === 'dispatch:proposed')).toMatchObject({ state: 'active' });
  });

  it('distinguishes unavailable checks from untaken outcomes for a markdown option', async () => {
    const graph = buildWholeEngineTree(await demo('700000305_ROSE'));
    const node = (id: string) => graph.nodes.find(item => item.id === id)!;
    expect(node('rules:discount').tone).toBe('deciding');
    expect(node('rules:g2').tone).toBe('unknown');
    expect(node('rules:g3').tone).toBe('unknown');
    expect(node('rules:hold4').tone).toBe('skipped');
    for (const id of ['missing', 'exit', 'same']) expect(node(`markdown:${id}`).tone).toBe('skipped');
    expect(node('markdown:price').status).toContain('1,124');
  });

  it('does not infer passes from action lines or missing traces', () => {
    bundle.gate = null;
    expect(bundle.lines.length).toBeGreaterThan(0);
    expect(engineState(bundle, 'lifecycle_end')).toEqual({ status: 'Not recorded', tone: 'unknown' });
    const graph = buildWholeEngineTree(bundle);
    for (const id of ['rules:g0', 'rules:g4', 'rules:liquidation', 'replenishment:eligible', 'pullbacks:lifecycle', 'markdown:nomination']) expect(graph.nodes.find(node => node.id === id)?.tone, id).toBe('unknown');
    expect(graph.nodes.find(node => node.id === 'dispatch:proposed')?.tone).toBe('deciding');
  });

  it('stops a shadow run before live execution and highlights only reached states in live phase', () => {
    const graph = buildWholeEngineTree(bundle);
    expect(graph.nodes.find(node => node.id === 'dispatch:shadow')?.tone).toBe('deciding');
    expect(graph.nodes.filter(node => node.id.startsWith('dispatch:') && !['dispatch:proposed', 'dispatch:shadow'].includes(node.id)).every(node => node.tone === 'skipped')).toBe(true);
    bundle.run.phase = 'live';
    bundle.lines[0]!.status = 'reconciled';
    bundle.lines[0]!.autonomy_band = 'manual';
    const live = buildWholeEngineTree(bundle);
    for (const id of ['route', 'approval', 'release', 'received', 'reconciled']) expect(live.nodes.find(node => node.id === `dispatch:${id}`)?.tone).toBe('deciding');
    for (const id of ['shadow', 'auto', 'review', 'blocked', 'expiry', 'mismatch']) expect(live.nodes.find(node => node.id === `dispatch:${id}`)?.tone).toBe('skipped');
  });

  it('greys markdown calculations after a recorded missing-price stop', () => {
    bundle.lines = [];
    const evaluation = bundle.gate!.engine_evaluations!.find(item => item.engine === 'markdown')!;
    evaluation.status = 'blocked';
    evaluation.reason_code = 'missing_price';
    const graph = buildWholeEngineTree(bundle);
    expect(graph.nodes.find(node => node.id === 'markdown:missing')?.tone).toBe('deciding');
    for (const id of ['margin', 'ladder', 'price', 'concentration', 'routing']) expect(graph.nodes.find(node => node.id === `markdown:${id}`)?.tone).toBe('skipped');
  });

  it('uses recorded thresholds including zero and marks unconfirmed defaults', () => {
    expect(logicSetting(bundle, 'repl_window_day', 60, 'd', 'replenishment')).toBe('60d');
    expect(logicSetting(bundle, 'concentration_brick_pct', 0.15, '%')).toBe('15%†');
    bundle.gate!.settings_used.cooldown_days = { value: 0, scope: 'global' };
    expect(logicSetting(bundle, 'cooldown_days', 21, 'd')).toBe('0d');
    bundle.gate!.engine_evaluations!.find(item => item.engine === 'replenishment')!.checks.find(check => check.id === 'window')!.threshold = 45;
    expect(buildLogicGraph('replenishment', bundle).nodes[0]!.lines.join(' ')).toContain('≤ 45d');
  });
});

describe('whole tree exploration', () => {
  it('keeps all stages mounted during jumps and shows numeric evidence on engine selection', async () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn()); // scrolling is verified in the browser
    const user = userEvent.setup();
    render(<EngineLogicDiagram bundle={bundle} />);
    const flow = screen.getByRole('group', { name: 'Whole engine workflow flowchart' });
    Object.defineProperty(flow.parentElement, 'scrollTo', { value: vi.fn(), configurable: true });
    expect(flow.querySelectorAll('[data-stage]').length).toBe(5);
    expect(screen.queryByRole('table', { name: 'Recorded checks for Replenishment' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Replenishment', exact: true }));
    expect(screen.getByRole('group', { name: 'Whole engine workflow flowchart' })).toBe(flow);
    expect(flow.querySelector('[data-node-id="rules:g0"]')).toBeInTheDocument();
    expect(flow.querySelector('[data-node-id="dispatch:reconciled"]')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Inspect 1 · Eligibility recorded checks' }));
    expect(screen.getByRole('table', { name: 'Recorded checks for Replenishment' })).toBeInTheDocument();
    expect(screen.getByText('96 d')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close recorded checks' }));
    expect(screen.queryByRole('table', { name: 'Recorded checks for Replenishment' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand', exact: true }));
    expect(screen.getByRole('dialog', { name: 'Whole engine tree' })).toBeInTheDocument();
    expect(screen.getAllByRole('group', { name: 'Whole engine workflow flowchart' })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Close', exact: true }));
    expect(screen.getByRole('button', { name: 'Expand', exact: true })).toBeInTheDocument();
  });
});
