import type { ValidationCheck, ValidationSummary } from './types/raValidation';
import type { PlmSubmissionSummary, PlmSubmissionItem } from './types/raPlmSubmission';
import type { NarrativeContext, OptionMovement } from './types/raLifecycle';
import { classifyLifecycle, classifyMovement } from './types/raLifecycle';

export function computeValidationSummary(checks: ValidationCheck[]): ValidationSummary {
  let passed = 0;
  let failed = 0;
  let notApplicable = 0;
  let notChecked = 0;
  let checking = 0;
  let errors = 0;
  let hasBlockingFailure = false;

  for (const c of checks) {
    if (c.applicability === 'not_applicable') {
      notApplicable++;
      continue;
    }
    switch (c.evaluationState) {
      case 'not_run':
        notChecked++;
        break;
      case 'running':
        checking++;
        break;
      case 'error':
        errors++;
        break;
      case 'evaluated':
        if (c.outcome === 'pass') passed++;
        else if (c.outcome === 'fail') {
          failed++;
          if (c.submissionImpact === 'blocking') hasBlockingFailure = true;
        }
        break;
    }
  }

  const applicable = passed + failed;
  return {
    total: checks.length,
    passed,
    failed,
    notApplicable,
    notChecked,
    checking,
    errors,
    passRate: applicable > 0 ? passed / applicable : null,
    hasBlockingFailure,
  };
}

export function buildValidationChecks(
  historicalOptions: number,
  systemOptions: number,
  buyerOptions: number | null,
): ValidationCheck[] {
  const lifecycle = classifyLifecycle(historicalOptions);
  const isNew = lifecycle === 'new_introduction';

  return [
    {
      id: 'top-seller-retention',
      title: 'Top Seller Retention',
      scope: 'combination',
      applicability: isNew ? 'not_applicable' : 'applicable',
      evaluationState: isNew ? 'evaluated' : 'evaluated',
      outcome: isNew ? null : 'pass',
      submissionImpact: 'blocking',
      businessReason: isNew
        ? 'New introduction has no historical sellers to retain.'
        : `All top-5 sellers from prior season retained. ${historicalOptions} historical options reviewed.`,
      evidence: isNew ? [] : [
        { label: 'Top sellers reviewed', value: Math.min(historicalOptions, 5) },
        { label: 'Retained', value: Math.min(historicalOptions, 5) },
        { label: 'Removed', value: 0 },
      ],
    },
    {
      id: 'price-architecture',
      title: 'Price Architecture',
      scope: 'combination',
      applicability: 'applicable',
      evaluationState: 'evaluated',
      outcome: 'pass',
      submissionImpact: 'advisory',
      businessReason: 'System MRP within 40% of last-year sales-weighted median. Price ladder covers 3+ distinct price points.',
      evidence: [
        { label: 'Deviation from LY median', value: '12%' },
        { label: 'Distinct price points', value: 4 },
        { label: 'Threshold', value: '40%' },
      ],
    },
    {
      id: 'near-miss-options',
      title: 'Near-Miss Options',
      scope: 'combination',
      applicability: 'applicable',
      evaluationState: 'evaluated',
      outcome: systemOptions > 4 ? 'pass' : 'fail',
      submissionImpact: 'advisory',
      businessReason: systemOptions > 4
        ? 'No eliminated options within 80% of the selection cutoff.'
        : '2 eliminated options have demand velocity within 80% of the cutoff. Consider increasing option count.',
      evidence: [
        { label: 'Near-miss options found', value: systemOptions > 4 ? 0 : 2 },
        { label: 'Selection cutoff (P80 ROS)', value: '3.2', unit: 'units/store/week' },
        { label: 'Closest eliminated ROS', value: systemOptions > 4 ? '1.8' : '2.9', unit: 'units/store/week' },
      ],
      nextAction: systemOptions <= 4 ? { label: 'Review near-miss options', actionId: 'review-near-miss' } : undefined,
    },
    {
      id: 'assortment-balance',
      title: 'Assortment Balance',
      scope: 'range',
      applicability: 'applicable',
      evaluationState: 'evaluated',
      outcome: 'pass',
      submissionImpact: 'blocking',
      businessReason: 'Attribute distribution within 25pp of sales share across fabric, fit, and pattern dimensions.',
      evidence: [
        { label: 'Max deviation (fabric)', value: '8pp' },
        { label: 'Max deviation (fit)', value: '12pp' },
        { label: 'Threshold', value: '25pp' },
      ],
    },
    {
      id: 'newness-headroom',
      title: 'Newness Headroom',
      scope: 'range',
      applicability: 'applicable',
      evaluationState: 'evaluated',
      outcome: 'pass',
      submissionImpact: 'advisory',
      businessReason: 'Planogram headroom at 18% — within target range for Core grade (5-15% core, 15-30% fashion).',
      evidence: [
        { label: 'Total slots', value: 48 },
        { label: 'Filled slots', value: 39 },
        { label: 'Headroom', value: '18.8%' },
        { label: 'Target range', value: '15-30%' },
      ],
    },
    {
      id: 'repeat-vs-exit',
      title: 'Repeat vs Exit',
      scope: 'combination',
      applicability: isNew ? 'not_applicable' : 'applicable',
      evaluationState: isNew ? 'evaluated' : 'evaluated',
      outcome: isNew ? null : (buyerOptions != null && buyerOptions > systemOptions * 1.3 ? 'fail' : 'pass'),
      submissionImpact: 'advisory',
      businessReason: isNew
        ? 'New introduction — no prior season to compare churn against.'
        : 'Churn rate at 35% — within healthy evolution range (20-60%).',
      evidence: isNew ? [] : [
        { label: 'Repeated options', value: Math.round(historicalOptions * 0.65) },
        { label: 'Exited options', value: Math.round(historicalOptions * 0.35) },
        { label: 'Churn rate', value: '35%' },
        { label: 'Healthy range', value: '20-60%' },
      ],
    },
  ];
}

export function generateNarrative(
  historicalOptions: number,
  systemOptions: number,
  buyerOptions: number | null,
  historicalQty: number,
  systemQty: number,
  buyerQty: number | null,
  storeCount: number,
): NarrativeContext {
  const lifecycle = classifyLifecycle(historicalOptions);
  const optionMovement = historicalOptions === 0 ? 'increase' as OptionMovement : classifyMovement(historicalOptions, systemOptions);
  const qtyMovement = historicalQty === 0 ? 'increase' as OptionMovement : classifyMovement(historicalQty, systemQty);
  const hasBuyerOverride = buyerOptions != null && buyerOptions !== systemOptions;
  const effectiveOptions = buyerOptions ?? systemOptions;
  const effectiveQty = buyerQty ?? systemQty;

  let selectionRationale: string;
  let demandEvidence: string;
  let capacityResult: string;

  if (lifecycle === 'new_introduction') {
    selectionRationale = `New introduction: ${effectiveOptions} planned options and ${formatNarrativeQty(effectiveQty)} units across ${storeCount} stores.`;
    demandEvidence = 'Demand predicted by FTF engine using similar-brick proxy performance, market trends, and store cluster affinity.';
    capacityResult = `${effectiveOptions} options fit within planogram capacity across ${storeCount} stores.`;
  } else if (optionMovement === 'increase') {
    const delta = systemOptions - historicalOptions;
    selectionRationale = `Increase from ${historicalOptions} to ${systemOptions} planned options (+${delta}).`;
    demandEvidence = `Historical sales data shows growing demand velocity. Rate of sale exceeds selection threshold across ${storeCount} stores.`;
    capacityResult = `${systemOptions} options within planogram slot capacity. Depth per option: ${systemOptions > 0 ? Math.round(systemQty / systemOptions) : 0} units.`;
  } else if (optionMovement === 'decrease') {
    const delta = historicalOptions - systemOptions;
    selectionRationale = `Reduce from ${historicalOptions} to ${systemOptions} planned options (-${delta}).`;
    demandEvidence = `Historical sales show declining demand. ${delta} options fell below the selection threshold.`;
    capacityResult = `${systemOptions} options retained from ${historicalOptions}. Review sell-through before confirming reduction.`;
  } else {
    if (qtyMovement !== 'unchanged') {
      const qtyDelta = systemQty - historicalQty;
      selectionRationale = `Option count unchanged at ${systemOptions}; quantity ${qtyDelta > 0 ? 'increases' : 'decreases'} by ${formatNarrativeQty(Math.abs(qtyDelta))} units.`;
    } else {
      selectionRationale = `Maintaining ${systemOptions} options with ${formatNarrativeQty(systemQty)} units. Stable demand pattern.`;
    }
    demandEvidence = `Historical rate of sale is stable. Selection threshold confirms all ${systemOptions} options above cutoff.`;
    capacityResult = `No change in option allocation. ${storeCount} stores continue to receive this combination.`;
  }

  if (hasBuyerOverride) {
    const buyerDelta = (buyerOptions ?? 0) - systemOptions;
    selectionRationale = `Buyer ${buyerDelta > 0 ? 'increased' : 'decreased'} from ${systemOptions} to ${buyerOptions} options (${buyerDelta > 0 ? '+' : ''}${buyerDelta} versus system recommendation).`;
  }

  return {
    lifecycle,
    optionMovement,
    qtyMovement,
    buyerOverride: hasBuyerOverride,
    selectionRationale,
    demandEvidence,
    capacityResult,
  };
}

function formatNarrativeQty(qty: number): string {
  if (qty >= 1000) return `${(qty / 1000).toFixed(1)}K`;
  return qty.toString();
}

export const MOCK_PLM_SUBMISSION: PlmSubmissionSummary = {
  status: 'partially_submitted',
  totalItems: 10,
  accepted: 7,
  failed: 3,
  processing: 0,
  latestAttemptAt: '2026-09-09T14:32:00Z',
  batchRef: 'PLM-2026-09-0042',
  failuresByReason: [
    { reason: 'Duplicate style code in PLM', count: 2 },
    { reason: 'Missing mandatory field: fabric composition', count: 1 },
  ],
  retryEligibleCount: 3,
};

export const MOCK_PLM_ITEMS: PlmSubmissionItem[] = [
  { id: 'plm-1', brick: 'Crew Neck Tee', brand: 'Netplay', attributes: 'Cotton / Regular / Short', status: 'accepted', errorReason: null, businessError: null, retryEligible: false, styleCode: 'NP-TEE-2026-001' },
  { id: 'plm-2', brick: 'Crew Neck Tee', brand: 'Netplay', attributes: 'Cotton / Slim / Short', status: 'accepted', errorReason: null, businessError: null, retryEligible: false, styleCode: 'NP-TEE-2026-002' },
  { id: 'plm-3', brick: 'Crew Neck Tee', brand: 'Netplay', attributes: 'Polyblend / Regular / Short', status: 'accepted', errorReason: null, businessError: null, retryEligible: false, styleCode: 'NP-TEE-2026-003' },
  { id: 'plm-4', brick: 'V-Neck Tee', brand: 'Netplay', attributes: 'Cotton / Regular / Short', status: 'accepted', errorReason: null, businessError: null, retryEligible: false, styleCode: 'NP-VNK-2026-001' },
  { id: 'plm-5', brick: 'V-Neck Tee', brand: 'Netplay', attributes: 'Cotton / Slim / Short', status: 'accepted', errorReason: null, businessError: null, retryEligible: false, styleCode: 'NP-VNK-2026-002' },
  { id: 'plm-6', brick: 'Henley Tee', brand: 'Netplay', attributes: 'Cotton / Regular / Short', status: 'accepted', errorReason: null, businessError: null, retryEligible: false, styleCode: 'NP-HNL-2026-001' },
  { id: 'plm-7', brick: 'Henley Tee', brand: 'Netplay', attributes: 'Cotton / Slim / Short', status: 'accepted', errorReason: null, businessError: null, retryEligible: false, styleCode: 'NP-HNL-2026-002' },
  { id: 'plm-8', brick: 'Polo Tee', brand: 'Netplay', attributes: 'Pique / Regular / Short', status: 'failed', errorReason: 'Duplicate style code in PLM', businessError: 'A style with matching attributes already exists in PLM (NP-PLO-2025-004). Merge or archive the existing record first.', retryEligible: true, styleCode: null },
  { id: 'plm-9', brick: 'Polo Tee', brand: 'Netplay', attributes: 'Pique / Slim / Short', status: 'failed', errorReason: 'Duplicate style code in PLM', businessError: 'A style with matching attributes already exists in PLM (NP-PLO-2025-005). Merge or archive the existing record first.', retryEligible: true, styleCode: null },
  { id: 'plm-10', brick: 'Tank Top', brand: 'Netplay', attributes: 'Cotton / Regular / Sleeveless', status: 'failed', errorReason: 'Missing mandatory field: fabric composition', businessError: 'PLM requires a fabric composition percentage (e.g., "100% Cotton"). Update the attribute data and retry.', retryEligible: true, styleCode: null },
];
