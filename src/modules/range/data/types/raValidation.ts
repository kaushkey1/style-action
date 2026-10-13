export type ValidationApplicability = 'applicable' | 'not_applicable';
export type ValidationEvalState = 'not_run' | 'running' | 'evaluated' | 'error';
export type ValidationOutcome = 'pass' | 'fail' | null;
export type SubmissionImpact = 'blocking' | 'advisory';

export interface ValidationCheck {
  id: string;
  title: string;
  scope: 'option' | 'combination' | 'range';
  applicability: ValidationApplicability;
  evaluationState: ValidationEvalState;
  outcome: ValidationOutcome;
  submissionImpact: SubmissionImpact;
  businessReason: string;
  evidence: Array<{ label: string; value: string | number; unit?: string }>;
  nextAction?: { label: string; actionId: string };
  evaluatedAt?: string;
  evaluatedPlanVersion?: string;
}

export interface ValidationSummary {
  total: number;
  passed: number;
  failed: number;
  notApplicable: number;
  notChecked: number;
  checking: number;
  errors: number;
  passRate: number | null;
  hasBlockingFailure: boolean;
}
