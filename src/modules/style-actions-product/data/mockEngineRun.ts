// Mock engine run data — hardcoded arrays for the engine dashboard prototype.

import type {
  EngineOutcomeRow,
  EngineRun,
  GateResult,
  PipelineStep,
  ReadinessCheck,
} from '../types/engine.types';

// ─── Readiness checks ─────────────────────────────────────────────────

const READINESS_CHECKS: readonly ReadinessCheck[] = [
  { name: 'Stock close', passed: true, detail: 'Stock close exists for 2026-10-07' },
  { name: 'Sales', passed: true, detail: 'Sales data present for 2026-10-07' },
  { name: 'Lead times', passed: true, detail: 'DC-to-store transit days present for 42 active stores' },
  { name: 'Costs', passed: true, detail: 'Blended cost and margin floor present for 1,843 active options' },
  { name: 'Space plan', passed: true, detail: 'Planned options/units exist for 38 space groups' },
  { name: 'VMI freshness', passed: true, detail: 'Accepted VMI run published 6 hours ago' },
];

// ─── Pipeline steps ───────────────────────────────────────────────────

const PIPELINE_STEPS: readonly PipelineStep[] = [
  { index: 1, name: 'Freeze snapshot', status: 'ran', stat: 'Stock, sales, GRNs, grades, space, lead times, costs, prices, VMI' },
  { index: 2, name: 'Data readiness', status: 'ran', stat: '6/6 checks passed' },
  { index: 3, name: 'Foundation measures', status: 'ran', stat: 'Inward, sell-through, gap, True ROS, availability, bands, broken, space fill' },
  { index: 4, name: 'Replenishment + test sends', status: 'ran', stat: '1,243 replenishment lines dispatched' },
  { index: 5, name: 'DC demand + shortfall', status: 'ran', stat: '87 stores with shortfall > 20%' },
  { index: 6, name: 'Rule tree (G0-G4)', status: 'ran', stat: '842 leave / 23 move / 87 discount' },
  { index: 7, name: 'Markdown evaluation', status: 'ran', stat: '312 markdown lines, 45 floor-clamped' },
  { index: 8, name: 'Governance routing', status: 'ran', stat: '289 auto-execute / 23 stop-and-approve' },
  {
    index: 9,
    name: 'Pullback run',
    status: 'ran',
    stat: '87 pullback lines across 6 sub-types',
    subSteps: [
      { index: 1, name: 'Broken size consolidation', status: 'ran', stat: '12 options consolidated' },
      { index: 2, name: 'Test-loser clearance', status: 'ran', stat: '8 test losers pulled' },
      { index: 3, name: 'Overfill correction', status: 'ran', stat: '15 stores de-stocked' },
      { index: 4, name: 'Lifecycle-end pullback', status: 'ran', stat: '22 options at end-of-life' },
      { index: 5, name: 'Core exit', status: 'ran', stat: '6 Core options exiting' },
      { index: 6, name: 'Replacement link', status: 'ran', stat: '24 replacements linked' },
      { index: 7, name: 'Route optimization', status: 'ran', stat: '87 routes assigned' },
      { index: 8, name: 'Space floor check', status: 'ran', stat: '3 floors breached, units retained' },
      { index: 9, name: 'Dispatch allocation', status: 'ran', stat: '87 lines allocated to DC' },
      { index: 10, name: 'Pullback reconciliation', status: 'ran', stat: '87 lines reconciled' },
    ],
  },
  { index: 10, name: 'Release + reconciliation', status: 'ran', stat: '1,642 lines released, 0 pending reconciliation' },
];

// ─── Gate helpers ─────────────────────────────────────────────────────

function makeLeaveAloneGates(age: number, grade: string, gap: number, ros: number, required: number): readonly GateResult[] {
  return [
    {
      gate: 0, name: 'Eligible?', status: 'passed',
      keyInputs: [
        { label: 'Lifecycle age', value: String(age) },
        { label: 'Grade', value: grade },
        { label: 'Test', value: 'none' },
      ],
      fullInputs: [
        { label: 'Lifecycle age', value: String(age) },
        { label: 'Grade', value: grade },
        { label: 'Test status', value: 'none' },
        { label: 'Has clock', value: 'Yes' },
      ],
      testResult: 'Passed',
    },
    {
      gate: 1, name: 'Behind the curve?', status: 'decided',
      keyInputs: [
        { label: 'Band', value: 'On/Over' },
        { label: 'Gap', value: `${gap}%` },
        { label: 'True ROS', value: ros.toFixed(2) },
      ],
      fullInputs: [
        { label: 'Band', value: 'On/Over' },
        { label: 'Gap', value: `${gap}%` },
        { label: 'True ROS (daily)', value: ros.toFixed(2) },
        { label: 'Required rate', value: required.toFixed(2) },
        { label: 'Pace test', value: `${ros.toFixed(2)} >= ${required.toFixed(2)}` },
      ],
      testResult: 'On track',
    },
    { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
  ];
}

function makeMoveGates(age: number, grade: string, gap: number, ros: number, required: number, dest: string, destGap: number, runway: number): readonly GateResult[] {
  return [
    {
      gate: 0, name: 'Eligible?', status: 'passed',
      keyInputs: [
        { label: 'Lifecycle age', value: String(age) },
        { label: 'Grade', value: grade },
      ],
      fullInputs: [
        { label: 'Lifecycle age', value: String(age) },
        { label: 'Grade', value: grade },
        { label: 'Test status', value: 'none' },
      ],
      testResult: 'Passed',
    },
    {
      gate: 1, name: 'Behind the curve?', status: 'passed',
      keyInputs: [
        { label: 'Band', value: 'Under' },
        { label: 'Gap', value: `${gap}%` },
        { label: 'True ROS', value: ros.toFixed(2) },
      ],
      fullInputs: [
        { label: 'Band', value: 'Under' },
        { label: 'Gap', value: `${gap}%` },
        { label: 'True ROS (daily)', value: ros.toFixed(2) },
        { label: 'Required rate', value: required.toFixed(2) },
        { label: 'Pace test', value: `${ros.toFixed(2)} < ${required.toFixed(2)}` },
      ],
      testResult: 'Behind',
    },
    {
      gate: 2, name: 'Move feasible?', status: 'decided',
      keyInputs: [
        { label: 'Best destination', value: `${dest} (gap ${destGap}%)` },
        { label: 'Runway', value: `${runway}d` },
        { label: 'Move count', value: '1/3' },
      ],
      fullInputs: [
        { label: 'DC shortfall', value: '0' },
        { label: 'Best destination', value: `${dest} (gap ${destGap}%)` },
        { label: 'Runway (days)', value: String(runway) },
        { label: 'Move count / cap', value: '1/3' },
        { label: 'Cooldown', value: '14 days since last' },
        { label: 'Space floor', value: 'OK' },
        { label: 'Set completion', value: 'OK' },
        { label: 'All 9 conditions', value: 'Pass' },
      ],
      testResult: 'All 9 conditions pass',
    },
    { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
  ];
}

/** The canonical blue linen shirt gates (from the spec worked example). */
const BLUE_LINEN_SHIRT_GATES: readonly GateResult[] = [
  {
    gate: 0, name: 'Eligible?', status: 'passed',
    keyInputs: [
      { label: 'Lifecycle age', value: '72' },
      { label: 'Grade', value: 'Fashion' },
      { label: 'Test', value: 'none' },
    ],
    fullInputs: [
      { label: 'Lifecycle age', value: '72' },
      { label: 'Grade', value: 'Fashion' },
      { label: 'Test status', value: 'none' },
      { label: 'Has clock', value: 'Yes' },
      { label: 'Mapped grade', value: 'Yes' },
    ],
    testResult: 'Passed',
  },
  {
    gate: 1, name: 'Behind the curve?', status: 'passed',
    keyInputs: [
      { label: 'Band', value: 'Under' },
      { label: 'Gap', value: '33%' },
      { label: 'True ROS', value: '0.40' },
    ],
    fullInputs: [
      { label: 'Band', value: 'Under' },
      { label: 'Gap', value: '33%' },
      { label: 'True ROS (daily)', value: '0.40' },
      { label: 'Required rate', value: '0.44' },
      { label: 'Pace test', value: '0.40 < 0.44' },
      { label: 'Availability', value: '92%' },
      { label: 'Already marked down', value: 'No' },
    ],
    testResult: 'Behind',
  },
  {
    gate: 2, name: 'Move feasible?', status: 'failed',
    keyInputs: [
      { label: 'Move count', value: '3/3' },
    ],
    fullInputs: [
      { label: 'DC shortfall', value: '0' },
      { label: 'Best destination', value: 'N/A' },
      { label: 'Move count / cap', value: '3/3' },
      { label: 'Reason', value: 'Move cap hit' },
    ],
    testResult: 'Not feasible (move cap hit)',
  },
  {
    gate: 3, name: 'Local rail healthy?', status: 'passed',
    keyInputs: [
      { label: 'Peers', value: '6 measurable' },
      { label: 'Behind', value: '4 (67%)' },
    ],
    fullInputs: [
      { label: 'Measurable peer count', value: '6' },
      { label: 'Behind count', value: '4' },
      { label: 'Behind share', value: '67%' },
      { label: 'Threshold', value: '50%' },
    ],
    testResult: 'Rail behind (67% >= 50%)',
  },
  {
    gate: 4, name: 'Discount?', status: 'decided',
    keyInputs: [
      { label: 'Age', value: '72 >= 60' },
      { label: 'Headroom', value: '₹474 > 0' },
      { label: 'Tier', value: '1 (10%)' },
    ],
    fullInputs: [
      { label: 'Lifecycle age', value: '72' },
      { label: 'Age threshold', value: '60' },
      { label: 'Margin headroom', value: '₹474' },
      { label: 'Ladder tier', value: '1' },
      { label: 'Depth', value: '10%' },
      { label: 'Marked price', value: '₹899' },
      { label: 'Margin floor', value: '₹525' },
      { label: 'Floor clamp', value: 'No' },
      { label: 'One-way door', value: 'No' },
      { label: 'Test option', value: 'No' },
    ],
    testResult: 'DISCOUNT',
  },
];

// ─── Outcome rows (approximately 50) ─────────────────────────────────

const MOCK_OUTCOMES: readonly EngineOutcomeRow[] = [
  // ── Blue linen shirt — the acid test ────────────────────────────
  {
    id: 'eo-001',
    optionCode: 'ABC-1234',
    optionName: 'Blue Linen Shirt',
    optionColour: 'Blue',
    storeCode: '456',
    storeName: 'Malad',
    outcome: 'DISCOUNT',
    actionSummary: 'Discount to ₹899 (tier 1, 10% off, day 72)',
    grade: 'Fashion',
    lifecycleAge: 72,
    lifecycleStage: 'Exit review',
    gap: -33,
    decidingGate: 4,
    gates: BLUE_LINEN_SHIRT_GATES,
    outputDetail: {
      kind: 'markdown',
      ladderTier: 1,
      depth: 10,
      priceTable: [
        { size: 'S', fullPrice: 999, ladderPrice: 899, floorPrice: 525, markedPrice: 899 },
        { size: 'M', fullPrice: 999, ladderPrice: 899, floorPrice: 525, markedPrice: 899 },
        { size: 'L', fullPrice: 999, ladderPrice: 899, floorPrice: 525, markedPrice: 899 },
        { size: 'XL', fullPrice: 999, ladderPrice: 899, floorPrice: 525, markedPrice: 899 },
      ],
      headroom: 474,
      floorClamp: false,
      oneWayDoor: false,
      nextStepEligible: true,
    },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T3'] },
  },

  // ── LEAVE ALONE outcomes (10) ───────────────────────────────────
  {
    id: 'eo-002', optionCode: 'DEF-5678', optionName: 'White Cotton Tee', optionColour: 'White',
    storeCode: '101', storeName: 'Andheri', outcome: 'LEAVE ALONE', actionSummary: '',
    grade: 'Fashion', lifecycleAge: 45, lifecycleStage: 'Checkpoint', gap: 5, decidingGate: 1,
    gates: makeLeaveAloneGates(45, 'Fashion', 5, 0.52, 0.48),
    outputDetail: { kind: 'hold', reason: 'On track — pace test passes', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-003', optionCode: 'GHI-9012', optionName: 'Navy Chinos', optionColour: 'Navy',
    storeCode: '102', storeName: 'Bandra', outcome: 'LEAVE ALONE', actionSummary: '',
    grade: 'Fashion', lifecycleAge: 30, lifecycleStage: 'Building', gap: 2, decidingGate: 1,
    gates: makeLeaveAloneGates(30, 'Fashion', 2, 0.55, 0.50),
    outputDetail: { kind: 'hold', reason: 'On track — gap within tolerance', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-004', optionCode: 'JKL-3456', optionName: 'Beige Kurta', optionColour: 'Beige',
    storeCode: '103', storeName: 'Powai', outcome: 'LEAVE ALONE', actionSummary: '',
    grade: 'Ultimate', lifecycleAge: 22, lifecycleStage: 'Building', gap: 8, decidingGate: 1,
    gates: makeLeaveAloneGates(22, 'Ultimate', 8, 0.60, 0.55),
    outputDetail: { kind: 'hold', reason: 'Catching up — pace test passes', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-005', optionCode: 'MNO-7890', optionName: 'Black Polo', optionColour: 'Black',
    storeCode: '104', storeName: 'Juhu', outcome: 'LEAVE ALONE', actionSummary: '',
    grade: 'Core', lifecycleAge: 120, lifecycleStage: 'Core active', gap: 0, decidingGate: 1,
    gates: makeLeaveAloneGates(120, 'Core', 0, 0.72, 0.65),
    outputDetail: { kind: 'hold', reason: 'Core option on track', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-006', optionCode: 'PQR-1234', optionName: 'Grey Joggers', optionColour: 'Grey',
    storeCode: '105', storeName: 'Thane', outcome: 'LEAVE ALONE', actionSummary: '',
    grade: 'Fashion', lifecycleAge: 50, lifecycleStage: 'Checkpoint', gap: -3, decidingGate: 1,
    gates: makeLeaveAloneGates(50, 'Fashion', -3, 0.48, 0.47),
    outputDetail: { kind: 'hold', reason: 'Marginally behind but pace test passes', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-007', optionCode: 'STU-5678', optionName: 'Mint Linen Top', optionColour: 'Mint',
    storeCode: '106', storeName: 'Dadar', outcome: 'LEAVE ALONE', actionSummary: '',
    grade: 'Fashion', lifecycleAge: 18, lifecycleStage: 'Under min', gap: 12, decidingGate: 1,
    gates: makeLeaveAloneGates(18, 'Fashion', 12, 0.68, 0.62),
    outputDetail: { kind: 'hold', reason: 'Early lifecycle, on track', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-008', optionCode: 'VWX-9012', optionName: 'Red Wrap Dress', optionColour: 'Red',
    storeCode: '107', storeName: 'Colaba', outcome: 'LEAVE ALONE', actionSummary: '',
    grade: 'Ultimate', lifecycleAge: 35, lifecycleStage: 'Building', gap: 4, decidingGate: 1,
    gates: makeLeaveAloneGates(35, 'Ultimate', 4, 0.58, 0.52),
    outputDetail: { kind: 'hold', reason: 'Over target — selling well', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-009', optionCode: 'YZA-3456', optionName: 'Olive Cargo Pants', optionColour: 'Olive',
    storeCode: '108', storeName: 'Goregaon', outcome: 'LEAVE ALONE', actionSummary: '',
    grade: 'Fashion', lifecycleAge: 40, lifecycleStage: 'Checkpoint', gap: 1, decidingGate: 1,
    gates: makeLeaveAloneGates(40, 'Fashion', 1, 0.50, 0.49),
    outputDetail: { kind: 'hold', reason: 'On track', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-010', optionCode: 'BCD-7890', optionName: 'Coral Blouse', optionColour: 'Coral',
    storeCode: '109', storeName: 'Worli', outcome: 'LEAVE ALONE', actionSummary: '',
    grade: 'Fashion', lifecycleAge: 28, lifecycleStage: 'Building', gap: 6, decidingGate: 1,
    gates: makeLeaveAloneGates(28, 'Fashion', 6, 0.56, 0.51),
    outputDetail: { kind: 'hold', reason: 'Ahead of curve', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-011', optionCode: 'EFG-1230', optionName: 'Indigo Denim Jacket', optionColour: 'Indigo',
    storeCode: '110', storeName: 'Lower Parel', outcome: 'LEAVE ALONE', actionSummary: '',
    grade: 'Ultimate', lifecycleAge: 55, lifecycleStage: 'Review', gap: -1, decidingGate: 1,
    gates: makeLeaveAloneGates(55, 'Ultimate', -1, 0.46, 0.45),
    outputDetail: { kind: 'hold', reason: 'Marginally behind but catching up', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },

  // ── SUPPLY HOLD outcomes (5) ────────────────────────────────────
  {
    id: 'eo-012', optionCode: 'HIJ-4560', optionName: 'Lavender Maxi Dress', optionColour: 'Lavender',
    storeCode: '456', storeName: 'Malad', outcome: 'SUPPLY HOLD', actionSummary: 'Supply issue — pivot sizes M, L unavailable 8 of 14 days',
    grade: 'Fashion', lifecycleAge: 32, lifecycleStage: 'Building', gap: -18, decidingGate: 1,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '32' }, { label: 'Grade', value: 'Fashion' }], fullInputs: [{ label: 'Lifecycle age', value: '32' }, { label: 'Grade', value: 'Fashion' }, { label: 'Test status', value: 'none' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'decided', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Availability', value: '72%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '18%' }, { label: 'Availability', value: '72% < 80%' }, { label: 'Missing sizes', value: 'M, L' }, { label: 'Days unavailable', value: '8 of 14' }], testResult: 'Supply hold — availability below 80%' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Pivot sizes M, L unavailable 8 of 14 days', nextStep: 'Awaiting replenishment' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'auto', triggers: ['T2'] },
  },
  {
    id: 'eo-013', optionCode: 'KLM-7891', optionName: 'Teal Palazzo', optionColour: 'Teal',
    storeCode: '101', storeName: 'Andheri', outcome: 'SUPPLY HOLD', actionSummary: 'Supply issue — size XS unavailable 10 of 14 days',
    grade: 'Fashion', lifecycleAge: 25, lifecycleStage: 'Building', gap: -22, decidingGate: 1,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '25' }, { label: 'Grade', value: 'Fashion' }], fullInputs: [{ label: 'Lifecycle age', value: '25' }, { label: 'Grade', value: 'Fashion' }, { label: 'Test status', value: 'none' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'decided', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Availability', value: '65%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '22%' }, { label: 'Availability', value: '65% < 80%' }, { label: 'Missing sizes', value: 'XS' }, { label: 'Days unavailable', value: '10 of 14' }], testResult: 'Supply hold — availability below 80%' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Size XS unavailable 10 of 14 days', nextStep: 'Awaiting replenishment' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-014', optionCode: 'NOP-2345', optionName: 'Sage Green Tunic', optionColour: 'Sage',
    storeCode: '102', storeName: 'Bandra', outcome: 'SUPPLY HOLD', actionSummary: 'Supply issue — sizes S, M unavailable 12 of 14 days',
    grade: 'Ultimate', lifecycleAge: 20, lifecycleStage: 'Building', gap: -28, decidingGate: 1,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '20' }, { label: 'Grade', value: 'Ultimate' }], fullInputs: [{ label: 'Lifecycle age', value: '20' }, { label: 'Grade', value: 'Ultimate' }, { label: 'Test status', value: 'none' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'decided', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Availability', value: '58%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '28%' }, { label: 'Availability', value: '58% < 80%' }, { label: 'Missing sizes', value: 'S, M' }, { label: 'Days unavailable', value: '12 of 14' }], testResult: 'Supply hold — availability below 80%' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Sizes S, M unavailable 12 of 14 days', nextStep: 'Awaiting replenishment' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-015', optionCode: 'QRS-6789', optionName: 'Charcoal Henley', optionColour: 'Charcoal',
    storeCode: '103', storeName: 'Powai', outcome: 'SUPPLY HOLD', actionSummary: 'Supply issue — size XXL unavailable 14 of 14 days',
    grade: 'Fashion', lifecycleAge: 40, lifecycleStage: 'Checkpoint', gap: -15, decidingGate: 1,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '40' }, { label: 'Grade', value: 'Fashion' }], fullInputs: [{ label: 'Lifecycle age', value: '40' }, { label: 'Grade', value: 'Fashion' }, { label: 'Test status', value: 'none' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'decided', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Availability', value: '75%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '15%' }, { label: 'Availability', value: '75% < 80%' }, { label: 'Missing sizes', value: 'XXL' }, { label: 'Days unavailable', value: '14 of 14' }], testResult: 'Supply hold — availability below 80%' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Size XXL unavailable 14 of 14 days', nextStep: 'Awaiting replenishment' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'auto', triggers: ['T2'] },
  },
  {
    id: 'eo-016', optionCode: 'TUV-0123', optionName: 'Dusty Rose Shirt Dress', optionColour: 'Dusty Rose',
    storeCode: '104', storeName: 'Juhu', outcome: 'SUPPLY HOLD', actionSummary: 'Supply issue — sizes L, XL unavailable 9 of 14 days',
    grade: 'Fashion', lifecycleAge: 35, lifecycleStage: 'Building', gap: -20, decidingGate: 1,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '35' }, { label: 'Grade', value: 'Fashion' }], fullInputs: [{ label: 'Lifecycle age', value: '35' }, { label: 'Grade', value: 'Fashion' }, { label: 'Test status', value: 'none' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'decided', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Availability', value: '68%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '20%' }, { label: 'Availability', value: '68% < 80%' }, { label: 'Missing sizes', value: 'L, XL' }, { label: 'Days unavailable', value: '9 of 14' }], testResult: 'Supply hold — availability below 80%' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Sizes L, XL unavailable 9 of 14 days', nextStep: 'Awaiting replenishment' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'auto', triggers: [] },
  },

  // ── MOVE outcomes (5) ───────────────────────────────────────────
  {
    id: 'eo-017', optionCode: 'WXY-4567', optionName: 'Ivory Silk Scarf', optionColour: 'Ivory',
    storeCode: '105', storeName: 'Thane', outcome: 'MOVE', actionSummary: 'Move to Oberoi #123 (gap −60%, True ROS 1.2, runway 24d)',
    grade: 'Fashion', lifecycleAge: 42, lifecycleStage: 'Checkpoint', gap: -35, decidingGate: 2,
    gates: makeMoveGates(42, 'Fashion', -35, 0.32, 0.50, 'Oberoi #123', -60, 24),
    outputDetail: { kind: 'hold', reason: 'Move approved to Oberoi #123', nextStep: 'Dispatch pending' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-018', optionCode: 'ZAB-8901', optionName: 'Mustard Shift Dress', optionColour: 'Mustard',
    storeCode: '106', storeName: 'Dadar', outcome: 'MOVE', actionSummary: 'Move to Phoenix #201 (gap −45%, True ROS 0.9, runway 18d)',
    grade: 'Fashion', lifecycleAge: 48, lifecycleStage: 'Checkpoint', gap: -30, decidingGate: 2,
    gates: makeMoveGates(48, 'Fashion', -30, 0.28, 0.42, 'Phoenix #201', -45, 18),
    outputDetail: { kind: 'hold', reason: 'Move approved to Phoenix #201', nextStep: 'Dispatch pending' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-019', optionCode: 'CDE-2345', optionName: 'Turquoise Crop Top', optionColour: 'Turquoise',
    storeCode: '107', storeName: 'Colaba', outcome: 'MOVE', actionSummary: 'Move to Inorbit #310 (gap −55%, True ROS 1.1, runway 20d)',
    grade: 'Fashion', lifecycleAge: 38, lifecycleStage: 'Building', gap: -28, decidingGate: 2,
    gates: makeMoveGates(38, 'Fashion', -28, 0.30, 0.44, 'Inorbit #310', -55, 20),
    outputDetail: { kind: 'hold', reason: 'Move approved to Inorbit #310', nextStep: 'Dispatch pending' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-020', optionCode: 'FGH-6789', optionName: 'Peach Palazzo', optionColour: 'Peach',
    storeCode: '108', storeName: 'Goregaon', outcome: 'MOVE', actionSummary: 'Move to Viviana #415 (gap −50%, True ROS 1.0, runway 22d)',
    grade: 'Ultimate', lifecycleAge: 36, lifecycleStage: 'Building', gap: -32, decidingGate: 2,
    gates: makeMoveGates(36, 'Ultimate', -32, 0.29, 0.46, 'Viviana #415', -50, 22),
    outputDetail: { kind: 'hold', reason: 'Move approved to Viviana #415', nextStep: 'Dispatch pending' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-021', optionCode: 'IJK-0123', optionName: 'Slate Blue Blazer', optionColour: 'Slate Blue',
    storeCode: '109', storeName: 'Worli', outcome: 'MOVE', actionSummary: 'Move to Atria #502 (gap −48%, True ROS 0.8, runway 30d)',
    grade: 'Fashion', lifecycleAge: 52, lifecycleStage: 'Review', gap: -25, decidingGate: 2,
    gates: makeMoveGates(52, 'Fashion', -25, 0.26, 0.38, 'Atria #502', -48, 30),
    outputDetail: { kind: 'hold', reason: 'Move approved to Atria #502', nextStep: 'Dispatch pending' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'auto', triggers: [] },
  },

  // ── HOLD outcomes (5) ───────────────────────────────────────────
  {
    id: 'eo-022', optionCode: 'LMN-4567', optionName: 'Sand Linen Shorts', optionColour: 'Sand',
    storeCode: '110', storeName: 'Lower Parel', outcome: 'HOLD', actionSummary: 'Hold — local rail healthy (3/6 peers selling)',
    grade: 'Fashion', lifecycleAge: 55, lifecycleStage: 'Review', gap: -20, decidingGate: 3,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '55' }, { label: 'Grade', value: 'Fashion' }], fullInputs: [{ label: 'Lifecycle age', value: '55' }, { label: 'Grade', value: 'Fashion' }, { label: 'Test status', value: 'none' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'passed', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '20%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '20%' }, { label: 'True ROS', value: '0.35' }, { label: 'Required rate', value: '0.42' }], testResult: 'Behind' },
      { gate: 2, name: 'Move feasible?', status: 'failed', keyInputs: [{ label: 'Move count', value: '3/3' }], fullInputs: [{ label: 'Move count / cap', value: '3/3' }, { label: 'Reason', value: 'Cap exhausted' }], testResult: 'Not feasible (cap exhausted)' },
      { gate: 3, name: 'Local rail healthy?', status: 'decided', keyInputs: [{ label: 'Peers', value: '6 measurable' }, { label: 'Behind', value: '3 (50%)' }], fullInputs: [{ label: 'Measurable peer count', value: '6' }, { label: 'Behind count', value: '3' }, { label: 'Behind share', value: '50%' }, { label: 'Threshold', value: '50%' }], testResult: 'Rail healthy (50% < 50% threshold, borderline)' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Local rail healthy — peers absorb demand', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-023', optionCode: 'OPQ-8901', optionName: 'Mauve Wide-leg Trousers', optionColour: 'Mauve',
    storeCode: '456', storeName: 'Malad', outcome: 'HOLD', actionSummary: 'Hold — local rail healthy (4/8 peers selling)',
    grade: 'Fashion', lifecycleAge: 50, lifecycleStage: 'Checkpoint', gap: -15, decidingGate: 3,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '50' }, { label: 'Grade', value: 'Fashion' }], fullInputs: [{ label: 'Lifecycle age', value: '50' }, { label: 'Grade', value: 'Fashion' }, { label: 'Test status', value: 'none' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'passed', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '15%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '15%' }, { label: 'True ROS', value: '0.38' }, { label: 'Required rate', value: '0.44' }], testResult: 'Behind' },
      { gate: 2, name: 'Move feasible?', status: 'failed', keyInputs: [{ label: 'Space floor', value: 'Breached' }], fullInputs: [{ label: 'Move count / cap', value: '2/3' }, { label: 'Space floor', value: 'Breached' }, { label: 'Reason', value: 'Space floor would be breached' }], testResult: 'Not feasible (space floor)' },
      { gate: 3, name: 'Local rail healthy?', status: 'decided', keyInputs: [{ label: 'Peers', value: '8 measurable' }, { label: 'Behind', value: '4 (50%)' }], fullInputs: [{ label: 'Measurable peer count', value: '8' }, { label: 'Behind count', value: '4' }, { label: 'Behind share', value: '50%' }], testResult: 'Rail healthy — selection miss' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Local rail healthy — selection miss', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-024', optionCode: 'RST-2345', optionName: 'Cream Peplum Top', optionColour: 'Cream',
    storeCode: '101', storeName: 'Andheri', outcome: 'HOLD', actionSummary: 'Hold — local rail healthy (2/5 peers selling)',
    grade: 'Ultimate', lifecycleAge: 48, lifecycleStage: 'Checkpoint', gap: -12, decidingGate: 3,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '48' }, { label: 'Grade', value: 'Ultimate' }], fullInputs: [{ label: 'Lifecycle age', value: '48' }, { label: 'Grade', value: 'Ultimate' }, { label: 'Test status', value: 'none' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'passed', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '12%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '12%' }, { label: 'True ROS', value: '0.40' }, { label: 'Required rate', value: '0.46' }], testResult: 'Behind' },
      { gate: 2, name: 'Move feasible?', status: 'failed', keyInputs: [{ label: 'Set completion', value: 'Broken' }], fullInputs: [{ label: 'Move count / cap', value: '1/3' }, { label: 'Set completion', value: 'Broken — missing sizes prevent move' }], testResult: 'Not feasible (set incomplete)' },
      { gate: 3, name: 'Local rail healthy?', status: 'decided', keyInputs: [{ label: 'Peers', value: '5 measurable' }, { label: 'Behind', value: '2 (40%)' }], fullInputs: [{ label: 'Measurable peer count', value: '5' }, { label: 'Behind count', value: '2' }, { label: 'Behind share', value: '40%' }], testResult: 'Rail healthy' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Local rail healthy — peers absorb demand', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-025', optionCode: 'UVW-6789', optionName: 'Fern Green Jumpsuit', optionColour: 'Fern Green',
    storeCode: '102', storeName: 'Bandra', outcome: 'HOLD', actionSummary: 'Hold — local rail healthy (5/10 peers selling)',
    grade: 'Fashion', lifecycleAge: 44, lifecycleStage: 'Checkpoint', gap: -18, decidingGate: 3,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '44' }, { label: 'Grade', value: 'Fashion' }], fullInputs: [{ label: 'Lifecycle age', value: '44' }, { label: 'Grade', value: 'Fashion' }, { label: 'Test status', value: 'none' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'passed', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '18%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '18%' }, { label: 'True ROS', value: '0.36' }, { label: 'Required rate', value: '0.42' }], testResult: 'Behind' },
      { gate: 2, name: 'Move feasible?', status: 'failed', keyInputs: [{ label: 'Cooldown', value: '3 days since last' }], fullInputs: [{ label: 'Move count / cap', value: '2/3' }, { label: 'Cooldown', value: '3 days since last — minimum 7' }], testResult: 'Not feasible (cooldown)' },
      { gate: 3, name: 'Local rail healthy?', status: 'decided', keyInputs: [{ label: 'Peers', value: '10 measurable' }, { label: 'Behind', value: '5 (50%)' }], fullInputs: [{ label: 'Measurable peer count', value: '10' }, { label: 'Behind count', value: '5' }, { label: 'Behind share', value: '50%' }], testResult: 'Rail healthy' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Local rail healthy', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-026', optionCode: 'XYZ-0124', optionName: 'Burgundy Wrap Skirt', optionColour: 'Burgundy',
    storeCode: '103', storeName: 'Powai', outcome: 'HOLD', actionSummary: 'Hold — local rail healthy (3/7 peers selling)',
    grade: 'Fashion', lifecycleAge: 46, lifecycleStage: 'Checkpoint', gap: -14, decidingGate: 3,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '46' }, { label: 'Grade', value: 'Fashion' }], fullInputs: [{ label: 'Lifecycle age', value: '46' }, { label: 'Grade', value: 'Fashion' }, { label: 'Test status', value: 'none' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'passed', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '14%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '14%' }, { label: 'True ROS', value: '0.37' }, { label: 'Required rate', value: '0.43' }], testResult: 'Behind' },
      { gate: 2, name: 'Move feasible?', status: 'failed', keyInputs: [{ label: 'DC shortfall', value: 'Yes' }], fullInputs: [{ label: 'DC shortfall', value: '15 units short' }, { label: 'Reason', value: 'DC cannot fulfil' }], testResult: 'Not feasible (DC shortfall)' },
      { gate: 3, name: 'Local rail healthy?', status: 'decided', keyInputs: [{ label: 'Peers', value: '7 measurable' }, { label: 'Behind', value: '3 (43%)' }], fullInputs: [{ label: 'Measurable peer count', value: '7' }, { label: 'Behind count', value: '3' }, { label: 'Behind share', value: '43%' }], testResult: 'Rail healthy' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Local rail healthy', nextStep: 'Re-evaluated next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },

  // ── DISCOUNT outcomes (8 more) ──────────────────────────────────
  {
    id: 'eo-027', optionCode: 'ABC-5670', optionName: 'Maroon Velvet Kurta', optionColour: 'Maroon',
    storeCode: '104', storeName: 'Juhu', outcome: 'DISCOUNT', actionSummary: 'Discount to ₹1,299 (tier 2, 20% off, day 68)',
    grade: 'Fashion', lifecycleAge: 68, lifecycleStage: 'Exit review', gap: -40, decidingGate: 4,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '68' }, { label: 'Grade', value: 'Fashion' }], fullInputs: [{ label: 'Lifecycle age', value: '68' }, { label: 'Grade', value: 'Fashion' }, { label: 'Test status', value: 'none' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'passed', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '40%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '40%' }, { label: 'True ROS', value: '0.28' }, { label: 'Required rate', value: '0.52' }], testResult: 'Behind' },
      { gate: 2, name: 'Move feasible?', status: 'failed', keyInputs: [{ label: 'Move count', value: '3/3' }], fullInputs: [{ label: 'Move count / cap', value: '3/3' }], testResult: 'Not feasible (cap hit)' },
      { gate: 3, name: 'Local rail healthy?', status: 'passed', keyInputs: [{ label: 'Peers', value: '5 measurable' }, { label: 'Behind', value: '4 (80%)' }], fullInputs: [{ label: 'Measurable peer count', value: '5' }, { label: 'Behind count', value: '4' }, { label: 'Behind share', value: '80%' }], testResult: 'Rail behind' },
      { gate: 4, name: 'Discount?', status: 'decided', keyInputs: [{ label: 'Age', value: '68 >= 60' }, { label: 'Headroom', value: '₹600 > 0' }, { label: 'Tier', value: '2 (20%)' }], fullInputs: [{ label: 'Lifecycle age', value: '68' }, { label: 'Margin headroom', value: '₹600' }, { label: 'Ladder tier', value: '2' }, { label: 'Depth', value: '20%' }, { label: 'Marked price', value: '₹1,299' }, { label: 'Margin floor', value: '₹699' }], testResult: 'DISCOUNT' },
    ],
    outputDetail: { kind: 'markdown', ladderTier: 2, depth: 20, priceTable: [{ size: 'S', fullPrice: 1599, ladderPrice: 1299, floorPrice: 699, markedPrice: 1299 }, { size: 'M', fullPrice: 1599, ladderPrice: 1299, floorPrice: 699, markedPrice: 1299 }, { size: 'L', fullPrice: 1599, ladderPrice: 1299, floorPrice: 699, markedPrice: 1299 }], headroom: 600, floorClamp: false, oneWayDoor: false, nextStepEligible: true },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T3'] },
  },
  {
    id: 'eo-028', optionCode: 'DEF-9012', optionName: 'Plum Silk Blouse', optionColour: 'Plum',
    storeCode: '105', storeName: 'Thane', outcome: 'DISCOUNT', actionSummary: 'Discount to ₹2,499 (tier 1, 10% off, day 65)',
    grade: 'Ultimate', lifecycleAge: 65, lifecycleStage: 'Exit review', gap: -30, decidingGate: 4,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '65' }, { label: 'Grade', value: 'Ultimate' }], fullInputs: [{ label: 'Lifecycle age', value: '65' }, { label: 'Grade', value: 'Ultimate' }, { label: 'Test status', value: 'none' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'passed', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '30%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '30%' }, { label: 'True ROS', value: '0.33' }, { label: 'Required rate', value: '0.48' }], testResult: 'Behind' },
      { gate: 2, name: 'Move feasible?', status: 'failed', keyInputs: [{ label: 'Cooldown', value: '2 days' }], fullInputs: [{ label: 'Move count / cap', value: '2/3' }, { label: 'Cooldown', value: '2 days — min 7' }], testResult: 'Not feasible (cooldown)' },
      { gate: 3, name: 'Local rail healthy?', status: 'passed', keyInputs: [{ label: 'Peers', value: '7 measurable' }, { label: 'Behind', value: '5 (71%)' }], fullInputs: [{ label: 'Measurable peer count', value: '7' }, { label: 'Behind count', value: '5' }, { label: 'Behind share', value: '71%' }], testResult: 'Rail behind' },
      { gate: 4, name: 'Discount?', status: 'decided', keyInputs: [{ label: 'Age', value: '65 >= 60' }, { label: 'Headroom', value: '₹800 > 0' }, { label: 'Tier', value: '1 (10%)' }], fullInputs: [{ label: 'Lifecycle age', value: '65' }, { label: 'Margin headroom', value: '₹800' }, { label: 'Ladder tier', value: '1' }, { label: 'Depth', value: '10%' }, { label: 'Marked price', value: '₹2,499' }, { label: 'Margin floor', value: '₹1,699' }], testResult: 'DISCOUNT' },
    ],
    outputDetail: { kind: 'markdown', ladderTier: 1, depth: 10, priceTable: [{ size: 'S', fullPrice: 2799, ladderPrice: 2499, floorPrice: 1699, markedPrice: 2499 }, { size: 'M', fullPrice: 2799, ladderPrice: 2499, floorPrice: 1699, markedPrice: 2499 }], headroom: 800, floorClamp: false, oneWayDoor: false, nextStepEligible: true },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T3'] },
  },
  {
    id: 'eo-029', optionCode: 'GHI-3456', optionName: 'Ochre Tapered Pants', optionColour: 'Ochre',
    storeCode: '106', storeName: 'Dadar', outcome: 'DISCOUNT', actionSummary: 'Discount to ₹749 (tier 3, 30% off, day 78)',
    grade: 'Fashion', lifecycleAge: 78, lifecycleStage: 'Exit', gap: -55, decidingGate: 4,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '78' }], fullInputs: [{ label: 'Lifecycle age', value: '78' }, { label: 'Grade', value: 'Fashion' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'passed', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '55%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '55%' }], testResult: 'Behind' },
      { gate: 2, name: 'Move feasible?', status: 'failed', keyInputs: [{ label: 'Move count', value: '3/3' }], fullInputs: [{ label: 'Move count / cap', value: '3/3' }], testResult: 'Not feasible' },
      { gate: 3, name: 'Local rail healthy?', status: 'passed', keyInputs: [{ label: 'Behind', value: '5/6 (83%)' }], fullInputs: [{ label: 'Measurable peer count', value: '6' }, { label: 'Behind count', value: '5' }], testResult: 'Rail behind' },
      { gate: 4, name: 'Discount?', status: 'decided', keyInputs: [{ label: 'Age', value: '78 >= 60' }, { label: 'Headroom', value: '₹350 > 0' }, { label: 'Tier', value: '3 (30%)' }], fullInputs: [{ label: 'Lifecycle age', value: '78' }, { label: 'Margin headroom', value: '₹350' }, { label: 'Ladder tier', value: '3' }, { label: 'Depth', value: '30%' }, { label: 'Marked price', value: '₹749' }, { label: 'Margin floor', value: '₹399' }], testResult: 'DISCOUNT' },
    ],
    outputDetail: { kind: 'markdown', ladderTier: 3, depth: 30, priceTable: [{ size: 'M', fullPrice: 1099, ladderPrice: 749, floorPrice: 399, markedPrice: 749 }], headroom: 350, floorClamp: false, oneWayDoor: false, nextStepEligible: false },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T3', 'T5'] },
  },
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `eo-0${30 + i}`,
    optionCode: `DSC-${1000 + i}`,
    optionName: ['Teal Shift Dress', 'Coral Knit Cardigan', 'Ivory Lace Top', 'Navy Pea Coat', 'Rose Pleated Skirt'][i] ?? '',
    optionColour: ['Teal', 'Coral', 'Ivory', 'Navy', 'Rose'][i] ?? '',
    storeCode: String(107 + i),
    storeName: ['Colaba', 'Goregaon', 'Worli', 'Lower Parel', 'Malad'][i] ?? '',
    outcome: 'DISCOUNT' as const,
    actionSummary: `Discount to ₹${[1199, 899, 1499, 2999, 649][i]} (tier ${[1, 2, 1, 1, 3][i]}, ${[10, 20, 10, 10, 30][i]}% off, day ${62 + i * 3})`,
    grade: (['Fashion', 'Fashion', 'Ultimate', 'Ultimate', 'Fashion'] as const)[i] ?? ('Fashion' as const),
    lifecycleAge: 62 + i * 3,
    lifecycleStage: 'Exit review' as const,
    gap: -(25 + i * 5),
    decidingGate: 4,
    gates: BLUE_LINEN_SHIRT_GATES, // Simplified for bulk
    outputDetail: { kind: 'markdown' as const, ladderTier: [1, 2, 1, 1, 3][i] ?? 1, depth: [10, 20, 10, 10, 30][i] ?? 10, priceTable: [{ size: 'M', fullPrice: 1500, ladderPrice: [1199, 899, 1499, 2999, 649][i] ?? 999, floorPrice: 500, markedPrice: [1199, 899, 1499, 2999, 649][i] ?? 999 }], headroom: 400 + i * 50, floorClamp: false, oneWayDoor: false, nextStepEligible: true },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed' as const, autonomyBand: 'stop-and-approve' as const, triggers: ['T3'] as const },
  })),

  // ── HOLD TO EXIT outcomes (4) ───────────────────────────────────
  {
    id: 'eo-035', optionCode: 'HTE-1001', optionName: 'Brown Suede Boots', optionColour: 'Brown',
    storeCode: '101', storeName: 'Andheri', outcome: 'HOLD TO EXIT', actionSummary: 'Hold to exit — headroom −₹51 (floor ₹700 > price ₹649)',
    grade: 'Fashion', lifecycleAge: 75, lifecycleStage: 'Exit', gap: -48, decidingGate: 4,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '75' }], fullInputs: [{ label: 'Lifecycle age', value: '75' }, { label: 'Grade', value: 'Fashion' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'passed', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '48%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '48%' }], testResult: 'Behind' },
      { gate: 2, name: 'Move feasible?', status: 'failed', keyInputs: [{ label: 'Move count', value: '3/3' }], fullInputs: [{ label: 'Move count / cap', value: '3/3' }], testResult: 'Not feasible' },
      { gate: 3, name: 'Local rail healthy?', status: 'passed', keyInputs: [{ label: 'Behind', value: '6/8 (75%)' }], fullInputs: [{ label: 'Measurable peer count', value: '8' }, { label: 'Behind count', value: '6' }], testResult: 'Rail behind' },
      { gate: 4, name: 'Discount?', status: 'decided', keyInputs: [{ label: 'Headroom', value: '−₹51' }], fullInputs: [{ label: 'Margin headroom', value: '−₹51' }, { label: 'Floor', value: '₹700' }, { label: 'Next price', value: '₹649' }], testResult: 'HOLD TO EXIT — no headroom' },
    ],
    outputDetail: { kind: 'hold', reason: 'Margin headroom exhausted (−₹51)', nextStep: 'Listed for Fashion Factory exit' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T5'] },
  },
  {
    id: 'eo-036', optionCode: 'HTE-1002', optionName: 'Charcoal Wool Blazer', optionColour: 'Charcoal',
    storeCode: '102', storeName: 'Bandra', outcome: 'HOLD TO EXIT', actionSummary: 'Hold to exit — headroom −₹120 (floor ₹2,200 > price ₹2,080)',
    grade: 'Ultimate', lifecycleAge: 80, lifecycleStage: 'Exit', gap: -52, decidingGate: 4,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '80' }], fullInputs: [{ label: 'Lifecycle age', value: '80' }, { label: 'Grade', value: 'Ultimate' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'passed', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '52%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '52%' }], testResult: 'Behind' },
      { gate: 2, name: 'Move feasible?', status: 'failed', keyInputs: [{ label: 'Move count', value: '3/3' }], fullInputs: [{ label: 'Move count / cap', value: '3/3' }], testResult: 'Not feasible' },
      { gate: 3, name: 'Local rail healthy?', status: 'passed', keyInputs: [{ label: 'Behind', value: '5/7 (71%)' }], fullInputs: [{ label: 'Measurable peer count', value: '7' }, { label: 'Behind count', value: '5' }], testResult: 'Rail behind' },
      { gate: 4, name: 'Discount?', status: 'decided', keyInputs: [{ label: 'Headroom', value: '−₹120' }], fullInputs: [{ label: 'Margin headroom', value: '−₹120' }, { label: 'Floor', value: '₹2,200' }, { label: 'Next price', value: '₹2,080' }], testResult: 'HOLD TO EXIT — no headroom' },
    ],
    outputDetail: { kind: 'hold', reason: 'Margin headroom exhausted (−₹120)', nextStep: 'Listed for Fashion Factory exit' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T5'] },
  },
  {
    id: 'eo-037', optionCode: 'HTE-1003', optionName: 'Olive Trench Coat', optionColour: 'Olive',
    storeCode: '103', storeName: 'Powai', outcome: 'HOLD TO EXIT', actionSummary: 'Hold to exit — headroom −₹85',
    grade: 'Fashion', lifecycleAge: 82, lifecycleStage: 'Exit', gap: -45, decidingGate: 4,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '82' }], fullInputs: [{ label: 'Lifecycle age', value: '82' }, { label: 'Grade', value: 'Fashion' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'passed', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '45%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '45%' }], testResult: 'Behind' },
      { gate: 2, name: 'Move feasible?', status: 'failed', keyInputs: [{ label: 'Space floor', value: 'Breached' }], fullInputs: [{ label: 'Space floor', value: 'Breached' }], testResult: 'Not feasible' },
      { gate: 3, name: 'Local rail healthy?', status: 'passed', keyInputs: [{ label: 'Behind', value: '4/6 (67%)' }], fullInputs: [{ label: 'Measurable peer count', value: '6' }, { label: 'Behind count', value: '4' }], testResult: 'Rail behind' },
      { gate: 4, name: 'Discount?', status: 'decided', keyInputs: [{ label: 'Headroom', value: '−₹85' }], fullInputs: [{ label: 'Margin headroom', value: '−₹85' }], testResult: 'HOLD TO EXIT' },
    ],
    outputDetail: { kind: 'hold', reason: 'Margin headroom exhausted', nextStep: 'Listed for Fashion Factory exit' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T5'] },
  },
  {
    id: 'eo-038', optionCode: 'HTE-1004', optionName: 'Rust Corduroy Jacket', optionColour: 'Rust',
    storeCode: '104', storeName: 'Juhu', outcome: 'HOLD TO EXIT', actionSummary: 'Hold to exit — headroom −₹30',
    grade: 'Fashion', lifecycleAge: 70, lifecycleStage: 'Exit review', gap: -38, decidingGate: 4,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'passed', keyInputs: [{ label: 'Lifecycle age', value: '70' }], fullInputs: [{ label: 'Lifecycle age', value: '70' }, { label: 'Grade', value: 'Fashion' }], testResult: 'Passed' },
      { gate: 1, name: 'Behind the curve?', status: 'passed', keyInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '38%' }], fullInputs: [{ label: 'Band', value: 'Under' }, { label: 'Gap', value: '38%' }], testResult: 'Behind' },
      { gate: 2, name: 'Move feasible?', status: 'failed', keyInputs: [{ label: 'Move count', value: '3/3' }], fullInputs: [{ label: 'Move count / cap', value: '3/3' }], testResult: 'Not feasible' },
      { gate: 3, name: 'Local rail healthy?', status: 'passed', keyInputs: [{ label: 'Behind', value: '4/5 (80%)' }], fullInputs: [{ label: 'Measurable peer count', value: '5' }, { label: 'Behind count', value: '4' }], testResult: 'Rail behind' },
      { gate: 4, name: 'Discount?', status: 'decided', keyInputs: [{ label: 'Headroom', value: '−₹30' }], fullInputs: [{ label: 'Margin headroom', value: '−₹30' }], testResult: 'HOLD TO EXIT' },
    ],
    outputDetail: { kind: 'hold', reason: 'Margin headroom exhausted', nextStep: 'Listed for Fashion Factory exit' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T5'] },
  },

  // ── LIQUIDATION outcomes (4) ────────────────────────────────────
  {
    id: 'eo-039', optionCode: 'LIQ-2001', optionName: 'Faded Chambray Shirt', optionColour: 'Light Blue',
    storeCode: '105', storeName: 'Thane', outcome: 'LIQUIDATION', actionSummary: 'Exit due — day 92, listed for Fashion Factory',
    grade: 'Fashion', lifecycleAge: 92, lifecycleStage: 'Exit', gap: -62, decidingGate: 0,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'decided', keyInputs: [{ label: 'Lifecycle age', value: '92' }, { label: 'Threshold', value: '90' }], fullInputs: [{ label: 'Lifecycle age', value: '92' }, { label: 'Liquidation threshold', value: '90' }, { label: 'Grade', value: 'Fashion' }], testResult: 'LIQUIDATION — age >= 90' },
      { gate: 1, name: 'Behind the curve?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Lifecycle age 92 exceeds liquidation threshold of 90', nextStep: 'Listed for Fashion Factory' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T6'] },
  },
  {
    id: 'eo-040', optionCode: 'LIQ-2002', optionName: 'Stone Wash Denim', optionColour: 'Stone',
    storeCode: '106', storeName: 'Dadar', outcome: 'LIQUIDATION', actionSummary: 'Exit due — day 95, listed for Fashion Factory',
    grade: 'Fashion', lifecycleAge: 95, lifecycleStage: 'Exit', gap: -70, decidingGate: 0,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'decided', keyInputs: [{ label: 'Lifecycle age', value: '95' }, { label: 'Threshold', value: '90' }], fullInputs: [{ label: 'Lifecycle age', value: '95' }, { label: 'Liquidation threshold', value: '90' }, { label: 'Grade', value: 'Fashion' }], testResult: 'LIQUIDATION — age >= 90' },
      { gate: 1, name: 'Behind the curve?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Lifecycle age 95 exceeds liquidation threshold', nextStep: 'Listed for Fashion Factory' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T6'] },
  },
  {
    id: 'eo-041', optionCode: 'LIQ-2003', optionName: 'Vintage Check Blazer', optionColour: 'Check',
    storeCode: '107', storeName: 'Colaba', outcome: 'LIQUIDATION', actionSummary: 'Exit due — day 100, listed for Fashion Factory',
    grade: 'Fashion', lifecycleAge: 100, lifecycleStage: 'Exit', gap: -75, decidingGate: 0,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'decided', keyInputs: [{ label: 'Lifecycle age', value: '100' }, { label: 'Threshold', value: '90' }], fullInputs: [{ label: 'Lifecycle age', value: '100' }, { label: 'Liquidation threshold', value: '90' }, { label: 'Grade', value: 'Fashion' }], testResult: 'LIQUIDATION — age >= 90' },
      { gate: 1, name: 'Behind the curve?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Lifecycle age 100 exceeds liquidation threshold', nextStep: 'Listed for Fashion Factory' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T6'] },
  },
  {
    id: 'eo-042', optionCode: 'LIQ-2004', optionName: 'Pastel Stripe Shirt', optionColour: 'Pastel',
    storeCode: '108', storeName: 'Goregaon', outcome: 'LIQUIDATION', actionSummary: 'Exit due — day 91, listed for Fashion Factory',
    grade: 'Fashion', lifecycleAge: 91, lifecycleStage: 'Exit', gap: -60, decidingGate: 0,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'decided', keyInputs: [{ label: 'Lifecycle age', value: '91' }, { label: 'Threshold', value: '90' }], fullInputs: [{ label: 'Lifecycle age', value: '91' }, { label: 'Liquidation threshold', value: '90' }, { label: 'Grade', value: 'Fashion' }], testResult: 'LIQUIDATION — age >= 90' },
      { gate: 1, name: 'Behind the curve?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Lifecycle age 91 exceeds liquidation threshold', nextStep: 'Listed for Fashion Factory' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T6'] },
  },

  // ── TEST CLEARANCE outcomes (3) ─────────────────────────────────
  {
    id: 'eo-043', optionCode: 'TST-3001', optionName: 'Neon Graphic Tee', optionColour: 'Neon',
    storeCode: '109', storeName: 'Worli', outcome: 'TEST CLEARANCE', actionSummary: 'Test killed — clearance pullback + markdown',
    grade: 'Fashion', lifecycleAge: 28, lifecycleStage: 'Building', gap: -80, decidingGate: 0,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'decided', keyInputs: [{ label: 'Test status', value: 'Killed' }], fullInputs: [{ label: 'Lifecycle age', value: '28' }, { label: 'Grade', value: 'Fashion' }, { label: 'Test status', value: 'Killed — sell-through < 10% at day 28' }], testResult: 'TEST CLEARANCE — killed test' },
      { gate: 1, name: 'Behind the curve?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Test option killed at day 28', nextStep: 'Clearance pullback + markdown in next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T7'] },
  },
  {
    id: 'eo-044', optionCode: 'TST-3002', optionName: 'Zebra Print Shorts', optionColour: 'Black/White',
    storeCode: '110', storeName: 'Lower Parel', outcome: 'TEST CLEARANCE', actionSummary: 'Test killed — clearance pullback + markdown',
    grade: 'Fashion', lifecycleAge: 21, lifecycleStage: 'Building', gap: -85, decidingGate: 0,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'decided', keyInputs: [{ label: 'Test status', value: 'Killed' }], fullInputs: [{ label: 'Lifecycle age', value: '21' }, { label: 'Grade', value: 'Fashion' }, { label: 'Test status', value: 'Killed — sell-through < 5% at day 21' }], testResult: 'TEST CLEARANCE — killed test' },
      { gate: 1, name: 'Behind the curve?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Test option killed at day 21', nextStep: 'Clearance pullback + markdown in next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T7'] },
  },
  {
    id: 'eo-045', optionCode: 'TST-3003', optionName: 'Holographic Sneakers', optionColour: 'Silver',
    storeCode: '456', storeName: 'Malad', outcome: 'TEST CLEARANCE', actionSummary: 'Test killed — clearance pullback + markdown',
    grade: 'Fashion', lifecycleAge: 25, lifecycleStage: 'Building', gap: -78, decidingGate: 0,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'decided', keyInputs: [{ label: 'Test status', value: 'Killed' }], fullInputs: [{ label: 'Lifecycle age', value: '25' }, { label: 'Grade', value: 'Fashion' }, { label: 'Test status', value: 'Killed — sell-through < 8% at day 25' }], testResult: 'TEST CLEARANCE — killed test' },
      { gate: 1, name: 'Behind the curve?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Test option killed at day 25', nextStep: 'Clearance pullback + markdown in next run' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'proposed', autonomyBand: 'stop-and-approve', triggers: ['T7'] },
  },

  // ── WAIT outcomes (5) ───────────────────────────────────────────
  {
    id: 'eo-046', optionCode: 'WAT-4001', optionName: 'Pink Silk Cami', optionColour: 'Pink',
    storeCode: '101', storeName: 'Andheri', outcome: 'WAIT', actionSummary: '',
    grade: 'Fashion', lifecycleAge: 8, lifecycleStage: 'Under min', gap: 0, decidingGate: 0,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'decided', keyInputs: [{ label: 'Lifecycle age', value: '8' }, { label: 'Min days', value: '14' }], fullInputs: [{ label: 'Lifecycle age', value: '8' }, { label: 'Minimum days threshold', value: '14' }, { label: 'Grade', value: 'Fashion' }], testResult: 'WAIT — under 14 days' },
      { gate: 1, name: 'Behind the curve?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Under minimum evaluation period (8/14 days)', nextStep: 'Re-evaluated when 14 days reached' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-047', optionCode: 'WAT-4002', optionName: 'Lime Cotton Shorts', optionColour: 'Lime',
    storeCode: '102', storeName: 'Bandra', outcome: 'WAIT', actionSummary: '',
    grade: 'Fashion', lifecycleAge: 5, lifecycleStage: 'Under min', gap: 0, decidingGate: 0,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'decided', keyInputs: [{ label: 'Lifecycle age', value: '5' }, { label: 'Min days', value: '14' }], fullInputs: [{ label: 'Lifecycle age', value: '5' }, { label: 'Minimum days threshold', value: '14' }, { label: 'Grade', value: 'Fashion' }], testResult: 'WAIT — under 14 days' },
      { gate: 1, name: 'Behind the curve?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Under minimum evaluation period (5/14 days)', nextStep: 'Re-evaluated when 14 days reached' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-048', optionCode: 'WAT-4003', optionName: 'Sky Blue Polo', optionColour: 'Sky Blue',
    storeCode: '103', storeName: 'Powai', outcome: 'WAIT', actionSummary: '',
    grade: 'Fashion', lifecycleAge: 10, lifecycleStage: 'Under min', gap: 0, decidingGate: 0,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'decided', keyInputs: [{ label: 'Lifecycle age', value: '10' }, { label: 'Min days', value: '14' }], fullInputs: [{ label: 'Lifecycle age', value: '10' }, { label: 'Minimum days threshold', value: '14' }, { label: 'Grade', value: 'Fashion' }], testResult: 'WAIT — under 14 days' },
      { gate: 1, name: 'Behind the curve?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Under minimum evaluation period (10/14 days)', nextStep: 'Re-evaluated when 14 days reached' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-049', optionCode: 'WAT-4004', optionName: 'Peach Chiffon Saree', optionColour: 'Peach',
    storeCode: '104', storeName: 'Juhu', outcome: 'WAIT', actionSummary: '',
    grade: 'Fashion', lifecycleAge: 3, lifecycleStage: 'Under min', gap: 0, decidingGate: 0,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'decided', keyInputs: [{ label: 'Lifecycle age', value: '3' }, { label: 'Min days', value: '14' }], fullInputs: [{ label: 'Lifecycle age', value: '3' }, { label: 'Minimum days threshold', value: '14' }, { label: 'Grade', value: 'Fashion' }], testResult: 'WAIT — under 14 days' },
      { gate: 1, name: 'Behind the curve?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Under minimum evaluation period (3/14 days)', nextStep: 'Re-evaluated when 14 days reached' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
  {
    id: 'eo-050', optionCode: 'WAT-4005', optionName: 'Tangerine Bomber', optionColour: 'Tangerine',
    storeCode: '105', storeName: 'Thane', outcome: 'WAIT', actionSummary: '',
    grade: 'Fashion', lifecycleAge: 12, lifecycleStage: 'Under min', gap: 0, decidingGate: 0,
    gates: [
      { gate: 0, name: 'Eligible?', status: 'decided', keyInputs: [{ label: 'Lifecycle age', value: '12' }, { label: 'Min days', value: '14' }], fullInputs: [{ label: 'Lifecycle age', value: '12' }, { label: 'Minimum days threshold', value: '14' }, { label: 'Grade', value: 'Fashion' }], testResult: 'WAIT — under 14 days' },
      { gate: 1, name: 'Behind the curve?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 2, name: 'Move feasible?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 3, name: 'Local rail healthy?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
      { gate: 4, name: 'Discount?', status: 'not_reached', keyInputs: [], fullInputs: [], testResult: 'Not reached' },
    ],
    outputDetail: { kind: 'hold', reason: 'Under minimum evaluation period (12/14 days)', nextStep: 'Re-evaluated when 14 days reached' },
    lineMetadata: { runId: 'run-20261008-nightly', lineState: 'released', autonomyBand: 'auto', triggers: [] },
  },
];

// ─── Full engine run ──────────────────────────────────────────────────

export const MOCK_ENGINE_RUN: EngineRun = {
  runId: 'run-20261008-nightly',
  runType: 'Nightly',
  asOfDate: '2026-10-07',
  runTimestamp: '2026-10-08T04:32:00',
  readinessChecks: READINESS_CHECKS,
  lineCounts: {
    replenishment: 1243,
    pullback: 87,
    markdown: 312,
  },
  pipeline: PIPELINE_STEPS,
  outcomes: MOCK_OUTCOMES,
};
