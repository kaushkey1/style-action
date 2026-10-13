import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet } from '@/modules/style-actions-product/api/client';
import { demoResponse, DEMO_SNAPSHOT_ID } from '@/modules/style-actions-product/data/demoApi';
import { makeDemoOptionEngine } from '@/modules/style-actions-product/data/demoOptionEngine';
import { compareEngineInputs, loadOptionEngine, validateEngineScope, type OptionEngineBundle } from '@/modules/style-actions-product/components/engine/optionEngineData';
import { OptionEngineResults } from '@/modules/style-actions-product/components/engine/OptionEngineResults';
import type { OptionStoreDetail } from '@/modules/style-actions-product/api/types';

vi.mock('@/modules/style-actions-product/api/client', async (original) => ({ ...await original<typeof import('@/modules/style-actions-product/api/client')>(), apiGet: vi.fn() }));
let detail: OptionStoreDetail;
let bundle: OptionEngineBundle;
beforeEach(async () => {
  vi.mocked(apiGet).mockReset();
  detail = await demoResponse('GET', '/v1/option-stores/PUN01/700000305_ROSE', { snapshot_id: DEMO_SNAPSHOT_ID }).json() as OptionStoreDetail;
  bundle = makeDemoOptionEngine(detail);
});
function mockRun(result = bundle) {
  vi.mocked(apiGet).mockImplementation(async (path) => {
    if (path === '/v1/engine/runs') return { items: [{ ...result.run, snapshot_id: 'wrong_snapshot', run_id: 'run_wrong', finished_at: '2030-01-01' }, result.run] };
    if (path.endsWith('/lines')) return { items: result.lines, total: result.lines.length };
    if (path.includes('/gates/')) return result.gate;
    return result.run;
  });
}
describe('option engine evidence', () => {
  it('keeps demo lines scoped to the same snapshot, option and store and marks every line as shadow', () => {
    expect(() => validateEngineScope(bundle, detail)).not.toThrow();
    expect(bundle.demo).toBe(true);
    expect(bundle.gate?.outcome).toBe('discount');
    expect(bundle.lines[0]?.line_type).toBe('markdown');
    expect(bundle.lines.every(line => line.status === 'shadow_recorded')).toBe(true);
    expect(bundle.lines[0]?.marked_price).toBeGreaterThanOrEqual(bundle.lines[0]?.margin_floor ?? 0);
    expect(bundle.gate?.gates[3]?.result).toBe('not_evaluated');
  });
  it('distinguishes input mismatches and missing evidence from zero', () => {
    expect(compareEngineInputs(bundle.gate, detail).every(row => row.status === 'Match')).toBe(true);
    bundle.gate!.gap = (detail.row.gap ?? 0) + 0.1;
    bundle.gate!.true_ros_daily = null;
    const rows = compareEngineInputs(bundle.gate, detail);
    expect(rows.find(row => row.label === 'Sales gap')?.status).toBe('Mismatch');
    expect(rows.find(row => row.label === 'True ROS · /day')?.status).toBe('Unavailable');
    bundle.gate!.true_ros_daily = 0;
    detail.row.health!.true_ros_daily = 0;
    expect(compareEngineInputs(bundle.gate, detail).find(row => row.label === 'True ROS · /day')?.status).toBe('Match');
  });
  it('selects the matching completed run instead of the newest run from another snapshot', async () => {
    mockRun();
    const result = await loadOptionEngine(detail, false);
    expect(result?.run.run_id).toBe(bundle.run.run_id);
    expect(result?.demo).toBe(false);
    expect(apiGet).not.toHaveBeenCalledWith('/v1/engine/runs/run_wrong');
  });
  it('rejects wrong-snapshot and wrong-option results', () => {
    expect(() => validateEngineScope({ ...bundle, run: { ...bundle.run, snapshot_id: 'wrong' } }, detail)).toThrow('do not match');
    expect(() => validateEngineScope({ ...bundle, lines: [{ ...bundle.lines[0]!, option_code: 'wrong' }] }, detail)).toThrow('do not match');
    expect(() => validateEngineScope({ ...bundle, lines: [{ ...bundle.lines[0]!, store_code: 'wrong' }] }, detail)).toThrow('do not match');
  });
  it('collects all line pages and rejects incomplete responses', async () => {
    const second = { ...bundle.lines[0]!, line_id: 'second', size: 'M' };
    mockRun();
    const original = vi.mocked(apiGet).getMockImplementation()!;
    vi.mocked(apiGet).mockImplementation(async (path, query) => path.endsWith('/lines') ? { items: query?.page === 2 ? [second] : bundle.lines, page_size: 1, total: 2 } : original(path,query));
    expect((await loadOptionEngine(detail,false))?.lines).toHaveLength(2);
    vi.mocked(apiGet).mockImplementation(async (path, query) => path.endsWith('/lines') ? { items: bundle.lines, total: 2 } : original(path,query));
    await expect(loadOptionEngine(detail,false)).rejects.toThrow('incomplete');
  });
  it('does not manufacture lines when there is no matching run or for excluded Core options', async () => {
    vi.mocked(apiGet).mockResolvedValue({ items: [{ ...bundle.run, snapshot_id: 'other' }] });
    expect(await loadOptionEngine(detail,false)).toBeNull();
    const core = makeDemoOptionEngine({ ...detail, row: { ...detail.row, grade_class: 'Core' } });
    expect(core.gate?.outcome).toBe('not_evaluated');
    expect(core.lines).toHaveLength(0);
    expect(core.gate?.gates.slice(1).every(gate=>gate.result==='skip')).toBe(true);
  });
});

describe('numeric engine display', () => {
  it('shows the rule-tree result, deciding gates and setting thresholds', async () => {
    mockRun();
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><OptionEngineResults detail={detail} /></QueryClientProvider>);
    const result = await screen.findByRole('region', { name: 'Rule-tree result' });
    expect(within(result).getByRole('heading', { name: 'Discount' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Engine outputs', exact: true })).not.toBeInTheDocument();
    expect(screen.getByText('G4 · Deciding')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'G2 Move Not evaluated' }));
    expect(screen.getByText('G2A · Destination')).toBeInTheDocument();
    expect(screen.queryByText('G2B · Runway')).not.toBeInTheDocument();
    expect(screen.queryByText('G2C · Cap / cooldown')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'G3 Rail health Not evaluated' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /G0 Eligibility/ }));
    const minimumAge = screen.getByText('Min age · d', { selector: 'dt' });
    expect(minimumAge.nextElementSibling).toHaveTextContent('14');
  });
});
