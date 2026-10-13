import type { OptionStoreDetail } from '../api/types';
import type { EngineActionLine, EngineGateDetail, OptionEngineBundle, OptionGateResult } from '../components/engine/optionEngineData';
import { demoEngineEvaluations } from './demoEngineEvaluations';

/** UI fixtures only. These examples are not persisted engine runs or executable instructions. */
export function makeDemoOptionEngine(detail: Pick<OptionStoreDetail, 'row' | 'snapshot_id' | 'as_of' | 'mrp'>): OptionEngineBundle {
  const { row } = detail;
  const age = row.lifecycle_age;
  const ros = row.health?.true_ros_daily ?? null;
  const runId = `demo_engine_${detail.snapshot_id}`;
  const gates: EngineGateDetail[] = [
    { gate: 'gate_0', label: 'Eligibility', result: 'skip', metrics: { lifecycle_age: age, days_in_store: row.days_in_store, min_age_days: 14, exit_day: 90 } },
    { gate: 'gate_1', label: 'Performance', result: 'skip', metrics: { gap: row.gap, true_ros_daily: ros, band: row.health?.band ?? null } },
    { gate: 'gate_2', label: 'Move', result: 'skip', sub_gates: [
      { gate: 'gate_2a', label: 'Destination', result: 'not_evaluated', metrics: { eligible_destinations: null } },
      { gate: 'gate_2b', label: 'Runway', result: 'skip', metrics: { runway_days: age === null ? null : 90 - age - 2, runway_min_days: 21, transit_days: 2 } },
      { gate: 'gate_2c', label: 'Cap / cooldown', result: 'skip', metrics: { pullback_count: 0, pullback_cap: 3, cooldown_days: 21 } },
    ] },
    { gate: 'gate_3', label: 'Rail health', result: 'skip', metrics: { peer_count: null, behind_share: null } },
    { gate: 'gate_4', label: 'Markdown', result: 'skip', metrics: { markdown_start_day: 60 } },
  ];
  let outcome = 'wait';
  let deciding = 0;
  if (row.grade_class === 'Core') { outcome = 'not_evaluated'; gates[0]!.result = 'excluded'; }
  else if (age === null || row.days_in_store === null) gates[0]!.result = 'not_evaluated';
  else if (age >= 90) { outcome = 'liquidation'; gates[0]!.result = 'exit'; }
  else if (row.days_in_store < 14) gates[0]!.result = 'wait';
  else {
    gates[0]!.result = 'pass'; deciding = 1;
    if (ros === null || !Number.isFinite(ros)) gates[1]!.result = 'wait_unmeasurable';
    else if (row.health?.band === 'supply_constrained') { outcome = 'supply_hold'; gates[1]!.result = 'supply_constrained'; }
    else if (row.health?.band === 'over' || row.health?.band === 'on_track') { outcome = 'leave_alone'; gates[1]!.result = 'leave_alone'; }
    else if (row.health?.band !== 'under' && row.health?.band !== 'watch') gates[1]!.result = 'not_evaluated';
    else {
      gates[1]!.result = 'pass_behind'; gates[2]!.result = 'not_evaluated'; gates[3]!.result = 'not_evaluated'; deciding = 4;
      const canPrice = age >= 60 && detail.mrp !== null && detail.mrp > 0;
      outcome = canPrice ? 'discount' : 'hold';
      gates[4]!.result = canPrice ? 'discount' : age < 60 ? 'hold_not_day_60' : 'not_evaluated';
      if (canPrice) {
        const reference = detail.mrp!;
        const floor = Math.round(reference * 0.6); // Explicit demo cost fixture, not a financial feed.
        const tier = age < 75 ? 1 : age < 80 ? 2 : 3;
        const depth = [0.1, 0.2, 0.25][tier - 1]!;
        const price = Math.max(Math.round(reference * (1 - depth)), floor);
        gates[4]!.metrics = { current_price: reference, reference_price: reference, margin_floor: floor, headroom: reference - floor, tier, depth_pct: depth, marked_price: price, floor_binding: price === floor };
      }
    }
  }
  gates[deciding]!.is_deciding = true;
  const gate: OptionGateResult = {
    option_code: row.option_code, store_code: row.store_code, outcome, deciding_gate: `gate_${deciding}`,
    lifecycle_age: age, days_in_store: row.days_in_store, band: row.health?.band ?? null, gap: row.gap,
    true_ros_daily: ros, availability: row.health?.availability_basis === 'life' ? row.health.availability_life : row.health?.availability_14d ?? null,
    gates, settings_used: {
      min_age_days: { value: 14, scope: 'global' }, exit_day: { value: 90, scope: 'global' },
      curve_target: { value: 0.75, scope: 'global' }, markdown_start_day: { value: 60, scope: 'global' },
      pullback_cap: { value: 3, scope: 'global' }, cooldown_days: { value: 21, scope: 'global' },
      runway_min_days: { value: 21, scope: 'global' }, transit_days: { value: 2, scope: 'global' },
    },
  };
  const base = { run_id: runId, option_code: row.option_code, store_code: row.store_code, status: 'shadow_recorded', reconciliation_status: null };
  const lines: EngineActionLine[] = [];
  if (outcome === 'discount') {
    const m = gates[4]!.metrics!;
    lines.push({ ...base, line_id: `demo_md_${row.store_code}_${row.option_code}`, line_type: 'markdown', quantity: null,
      current_price: Number(m.current_price), reference_price: Number(m.reference_price), margin_floor: Number(m.margin_floor),
      marked_price: Number(m.marked_price), tier: Number(m.tier), depth: Number(m.depth_pct), deciding_gate: 'gate_4',
      autonomy_band: 'stop_and_approve', governance_trigger: 'concentration_not_evaluated' });
  }
  const pullbackNight = [1,4].includes(new Date(`${detail.as_of}T00:00:00Z`).getUTCDay());
  if (outcome === 'liquidation' && pullbackNight && row.on_hand > 0) lines.push({ ...base,
    line_id: `demo_exit_${row.store_code}_${row.option_code}`, line_type: 'lifecycle_end', quantity: row.on_hand,
    deciding_gate: 'gate_0', autonomy_band: 'manual', dest_dc: 'Demo DC', governance_trigger: 'exit_confirmation' });
  gate.engine_evaluations = demoEngineEvaluations(row, gate, lines, pullbackNight, runId);
  return { demo: true, run: { run_id: runId, snapshot_id: detail.snapshot_id, run_date: detail.as_of, phase: 'shadow', status: 'succeeded',
    settings_version: 'demo_settings_v1', finished_at: `${detail.as_of}T04:30:00Z`, pullback_night: pullbackNight }, gate, lines };
}
