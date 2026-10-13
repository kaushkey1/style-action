import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OptionStoreDetail } from '@/modules/style-actions-product/api/types';
import { demoResponse, DEMO_SNAPSHOT_ID } from '@/modules/style-actions-product/data/demoApi';
import { makeDemoOptionEngine } from '@/modules/style-actions-product/data/demoOptionEngine';
import { EngineBundleResults } from '@/modules/style-actions-product/components/engine/OptionEngineResults';
import { EngineEvaluationDetail } from '@/modules/style-actions-product/components/engine/EngineEvaluationDetail';
import { validateEngineEvaluations, type OptionEngineBundle } from '@/modules/style-actions-product/components/engine/optionEngineData';

let detail: OptionStoreDetail;
let bundle: OptionEngineBundle;
beforeEach(async () => {
  detail = await demoResponse('GET', '/v1/option-stores/PUN01/700000206_SAND', { snapshot_id: DEMO_SNAPSHOT_ID }).json() as OptionStoreDetail;
  bundle = makeDemoOptionEngine(detail);
});

describe('engine evaluation evidence', () => {
  it('explains zero-output replenishment and the emitted lifecycle pull for the same option', () => {
    expect(bundle.gate?.engine_evaluations).toHaveLength(7);
    const replenishment = bundle.gate!.engine_evaluations!.find(item => item.engine === 'replenishment')!;
    expect(replenishment.status).toBe('blocked');
    expect(replenishment.checks.find(check => check.id === 'window')).toMatchObject({ value: 96, operator: '<=', threshold: 60, result: 'fail' });
    expect(replenishment.checks.find(check => check.id === 'live')?.result).toBe('pass');
    expect(replenishment.checks.find(check => check.id === 'dc_rationing')).toMatchObject({ value: null, result: 'skipped' });
    expect(replenishment.line_ids).toEqual([]);
    const lifecycle = bundle.gate!.engine_evaluations!.find(item => item.engine === 'lifecycle_end')!;
    expect(lifecycle.status).toBe('passed');
    expect(lifecycle.line_ids).toEqual(bundle.lines.map(line => line.line_id));
    expect(lifecycle.outputs).toContainEqual({ key: 'pull_qty', label: 'Pull quantity', value: 36 });
  });

  it('does not treat missing operational inputs as passes when replenishment is eligible', () => {
    const eligible = makeDemoOptionEngine({ ...detail, row: { ...detail.row, lifecycle_age: 30 } });
    const replenishment = eligible.gate!.engine_evaluations!.find(item => item.engine === 'replenishment')!;
    expect(replenishment.status).toBe('not_evaluated');
    expect(replenishment.checks.find(check => check.id === 'window')?.result).toBe('pass');
    expect(replenishment.checks.find(check => check.id === 'dc_rationing')).toMatchObject({ value: null, result: 'not_evaluated' });
    expect(replenishment.line_ids).toEqual([]);
  });

  it('rejects a trace from another run or duplicated engine/check identities', () => {
    const gate = structuredClone(bundle.gate!);
    gate.engine_evaluations![0]!.run_id = 'another_run';
    expect(() => validateEngineEvaluations(gate, bundle.run.run_id)).toThrow('Invalid engine evaluation trace');
    gate.engine_evaluations![0]!.run_id = bundle.run.run_id;
    gate.engine_evaluations![0]!.checks.push(gate.engine_evaluations![0]!.checks[0]!);
    expect(() => validateEngineEvaluations(gate, bundle.run.run_id)).toThrow('Invalid engine evaluation trace');
    gate.engine_evaluations = [bundle.gate!.engine_evaluations![0]!, bundle.gate!.engine_evaluations![0]!];
    expect(() => validateEngineEvaluations(gate, bundle.run.run_id)).toThrow('Invalid engine evaluation trace');
  });

  it('does not claim lifecycle exit takes priority for excluded Core options', () => {
    const core = makeDemoOptionEngine({ ...detail, row: { ...detail.row, grade_class: 'Core' } });
    const evaluations = core.gate!.engine_evaluations!;
    expect(evaluations.find(item => item.engine === 'lifecycle_end')?.reason_code).toBe('grade_excluded');
    expect(evaluations.find(item => item.engine === 'broken')?.status).toBe('not_evaluated');
    expect(evaluations.find(item => item.engine === 'overfill')?.status).toBe('not_evaluated');
    expect(evaluations.find(item => item.engine === 'consolidation')?.reason_code).toBe('candidate_age_excluded');
    expect(core.lines).toHaveLength(0);
  });
});

describe('engine evaluation drill-down', () => {
  it('renders recorded checks used by the engine tree inspector', () => {
    const evaluations = bundle.gate!.engine_evaluations!;
    const { rerender } = render(<EngineEvaluationDetail name="Replenishment" evaluation={evaluations.find(item => item.engine === 'replenishment')} demo />);
    const checks = screen.getByRole('table', { name: 'Recorded checks for Replenishment' });
    const ageRow = within(checks).getByText('Lifecycle age').closest('tr')!;
    expect(within(ageRow).getByText('96 d')).toBeInTheDocument();
    expect(within(ageRow).getByText('≤ 60 d')).toBeInTheDocument();
    expect(within(ageRow).getByText('Fail')).toBeInTheDocument();
    expect(within(checks).getAllByText('Pass')).toHaveLength(2);
    expect(within(checks).getAllByText('Not reached')).toHaveLength(6);
    rerender(<EngineEvaluationDetail name="Lifecycle exit" evaluation={evaluations.find(item => item.engine === 'lifecycle_end')} demo />);
    const lifecycle = screen.getByRole('region', { name: 'Lifecycle exit evaluation' });
    expect(within(lifecycle).getByText('Pull quantity')).toBeInTheDocument();
    expect(within(lifecycle).getAllByText('Pass')).toHaveLength(4);
    rerender(<EngineEvaluationDetail name="Markdown" evaluation={evaluations.find(item => item.engine === 'markdown')} demo />);
    expect(screen.getByRole('table', { name: 'Recorded checks for Markdown' })).toBeInTheDocument();
  });

  it('keeps the result and logic available without inventing checks when the API has no traces', async () => {
    const user = userEvent.setup();
    const withoutTraces = structuredClone(bundle);
    delete withoutTraces.gate!.engine_evaluations;
    withoutTraces.demo = false;
    render(<EngineBundleResults bundle={withoutTraces} />);
    expect(within(screen.getByRole('region', { name: 'Rule-tree result' })).getByRole('heading', { name: 'Liquidation' })).toBeInTheDocument();
    vi.stubGlobal('requestAnimationFrame', vi.fn()); // scrolling is verified in the browser
    await user.click(screen.getByRole('button', { name: 'Engine logic', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Inspect 1 · Eligibility recorded checks' }));
    const evaluation = screen.getByRole('region', { name: 'Replenishment evaluation' });
    expect(within(evaluation).getByText('Not recorded')).toBeInTheDocument();
    expect(within(evaluation).getByText('No recorded checks for this engine in this run.')).toBeInTheDocument();
    expect(within(evaluation).queryByText('Passed')).not.toBeInTheDocument();
  });
});
