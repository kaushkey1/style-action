/**
 * PulsePoint store audit, sourced live from BigQuery via impetus-agentic-central.
 *
 * These types previously lived inside a 1.16 MB mock data file that existed only
 * to hold them; the audit path is fully live now, so they belong here.
 *
 * `ChecklistTheme` is a closed union on purpose: the score engine maps it
 * exhaustively to journey stages, so the backend only surfaces audits whose
 * questionnaire sections match these five titles.
 */

export type AuditGrade = 'Good' | 'Amber' | 'Red' | 'Insufficient' | 'N/A' | 'NOT_SUBMITTED';
export type AuditRating = 'Good' | 'Amber' | 'Red';
export type AuditTag =
  | 'GRADE_CONFIRMED'
  | 'VIDEO_CONTRADICTS_GRADE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'SUBMITTER_NOTE_CONFIRMS'
  | 'NO_RELEVANT_VIDEO';
export type ActionPriority = 'S0' | 'S1' | 'S2';

export type ChecklistTheme =
  | 'Store Entry'
  | 'In-Store Look & Feel'
  | 'Product Exploration'
  | 'Trial Avenues'
  | 'Checkout & Experience';

export interface StoreAuditChecklistItem {
  /** Section/question ordinal, e.g. '2.3'. */
  itemKey: string;
  itemName: string;
  theme: ChecklistTheme;
  submittedGrade: AuditGrade;
  videoGrade: AuditGrade;
  /** The reconciled grade — this is what drives the score. */
  finalGrade: AuditGrade;
  tag: AuditTag;
  reasoning: string;
  /**
   * Always null today: the warehouse stores a relative storage key rather than a
   * playable URL, and the CDN base is not known to the API.
   */
  videoUrl: string | null;
}

export interface StoreAuditActionItem {
  priority: ActionPriority;
  issue: string;
  /** Best-effort link to a checklist itemKey; '' when undetermined. */
  relatedChecklist: string;
  description: string;
}

export interface StoreAuditData {
  storeCode: string;
  storeName: string;
  city: string;
  region: string;
  /** Mean of final grades, on a 0.00–3.00 scale. */
  overallScore: number;
  overallRating: AuditRating;
  s0Count: number;
  s1Count: number;
  s2Count: number;
  healthSummary: string;
  checklistItems: StoreAuditChecklistItem[];
  actionItems: StoreAuditActionItem[];
}
