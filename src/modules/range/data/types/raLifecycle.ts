export type CombinationLifecycle = 'new_introduction' | 'existing' | 'exit_candidate';

export type OptionMovement = 'increase' | 'decrease' | 'unchanged';

export interface NarrativeContext {
  lifecycle: CombinationLifecycle;
  optionMovement: OptionMovement;
  qtyMovement: OptionMovement;
  buyerOverride: boolean;
  selectionRationale: string;
  demandEvidence: string;
  capacityResult: string;
}

export function classifyLifecycle(historicalOptions: number): CombinationLifecycle {
  if (historicalOptions === 0) return 'new_introduction';
  return 'existing';
}

export function classifyMovement(historical: number, current: number): OptionMovement {
  if (current > historical) return 'increase';
  if (current < historical) return 'decrease';
  return 'unchanged';
}
