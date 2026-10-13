import type { PlmProcessingSummary, PlmPublicationItem, PlmSubmissionData } from '../../api/rangeApi';

export type PlmSubmissionStatus =
  | 'not_submitted'
  | 'submitting'
  | 'submitted'
  | 'partially_submitted'
  | 'submission_failed'
  | 'awaiting_confirmation'
  | 'paused'
  | 'needs_review';

export function publicationStatus(
  status: PlmSubmissionData['status'], processing?: PlmProcessingSummary['status'],
): PlmSubmissionStatus {
  if (processing === 'SUCCESS') return 'submitted';
  if (processing === 'PARTIAL_FAILURE') return 'partially_submitted';
  if (processing === 'VALIDATION_FAILED' || processing === 'FAILED') return 'submission_failed';
  if (processing === 'NEEDS_REVIEW') return 'needs_review';
  const statuses: Record<PlmSubmissionData['status'], PlmSubmissionStatus> = {
    ACCEPTED: 'submitting', PUBLISHING: 'submitting', PUBLISHED: 'submitted',
    PARTIAL_FAILURE: 'partially_submitted', FAILED: 'submission_failed',
    NEEDS_REVIEW: 'needs_review', PAUSED: 'paused', HTTP_COMPLETED: 'submitted',
  };
  return statuses[status];
}

export function submissionItemStatus(item: PlmPublicationItem): PlmSubmissionItem['status'] {
  switch (item.plm_result?.status) {
    case 'SUCCESS': return 'accepted';
    case 'VALIDATION_FAILED':
    case 'FAILED': return 'failed';
    case 'SKIPPED': return 'skipped';
  }
  switch (item.state) {
    case 'PUBLISHED': return 'submitted';
    case 'FAILED': return 'failed';
    case 'UNKNOWN': return 'unresolved';
    default: return 'processing';
  }
}

export function formatPlmBatchRef(submission: Pick<PlmSubmissionData, 'submission_id' | 'created_at'>): string {
  const suffix = submission.submission_id.replaceAll('-', '').slice(0, 12).toUpperCase();
  const createdAt = new Date(submission.created_at);
  const month = Number.isNaN(createdAt.getTime()) ? '' : `${createdAt.toISOString().slice(0, 7)}-`;
  return `PLM-${month}${suffix}`;
}

export function submissionItemDetail(item: PlmPublicationItem): string {
  const result = item.plm_result;
  const error = [result?.error_message, result?.error, result?.errors?.filter(value => value.trim()).join('; '),
    result?.error_code, result ? null : item.error_code].find(value => value?.trim());
  if (error) return error.trim();
  const styleCode = result?.style_code?.trim() || result?.style_id?.trim();
  if (styleCode) return `Style: ${styleCode}`;
  switch (submissionItemStatus(item)) {
    case 'accepted': return 'PLM confirmed this style.';
    case 'skipped': return 'This style already exists in PLM.';
    case 'failed': return 'Submission failed. No reason was provided.';
    case 'unresolved': return 'Delivery could not be confirmed. Review required.';
    case 'processing': return 'Submission is in progress.';
    case 'submitted': return item.ack_requested
      ? 'Awaiting confirmation from PLM.' : 'Sent to PLM. No result is available.';
  }
}

export interface PlmSubmissionSummary {
  status: PlmSubmissionStatus;
  totalItems: number;
  accepted: number;
  failed: number;
  processing: number;
  latestAttemptAt: string | null;
  batchRef: string | null;
  failuresByReason: Array<{ reason: string; count: number }>;
  retryEligibleCount: number;
  hasSavedItems?: boolean;
}

export interface PlmSubmissionItem {
  id: string;
  brick: string;
  brand: string;
  attributes: string;
  status: 'submitted' | 'accepted' | 'failed' | 'processing' | 'unresolved' | 'skipped';
  errorReason: string | null;
  businessError: string | null;
  retryEligible: boolean;
  styleCode: string | null;
  detail?: string;
}

export const PLM_STATUS_CONFIG: Record<PlmSubmissionStatus, { label: string; bg: string; text: string; dot: string }> = {
  not_submitted: { label: 'Not submitted', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  submitting: { label: 'Submitting', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  submitted: { label: 'Submitted to PLM', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  partially_submitted: { label: 'Partially submitted', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  submission_failed: { label: 'Failed', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  awaiting_confirmation: { label: 'Awaiting confirmation', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  paused: { label: 'Submission paused', bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  needs_review: { label: 'Needs review', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};
