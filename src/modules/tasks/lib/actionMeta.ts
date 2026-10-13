import type { TaskStatus, CommentType } from '../types/task.types';
import type { TaskAction } from './permissions';
import type { EmailEvent } from './emailMockToast';

export interface ActionMeta {
  /** Modal title. */
  title: string;
  /** Modal body intro (shown above textarea). */
  description: string;
  /** Required vs optional reason textarea. */
  reasonRequired: boolean;
  /** Optional placeholder text for the textarea. */
  reasonPlaceholder: string;
  /** Submit button label. */
  submitLabel: string;
  /** Use destructive (red) variant on submit. */
  destructive: boolean;
  /** Status to PATCH onto the task. */
  nextStatus: TaskStatus;
  /** Comment type to POST alongside (optional for some). */
  commentType?: CommentType;
  /** Email-mock event fired via emailMockToast helper. */
  emailEvent: EmailEvent;
}

/**
 * Static metadata for every actionable transition. Centralised so the modal
 * + handler are pure dispatch — no per-action conditionals scattered around.
 */
export const ACTION_META: Partial<Record<TaskAction, ActionMeta>> = {
  submit_for_review: {
    title: 'Submit for review',
    description: 'Send this task back to the assignor for approval. Add any notes about what was done.',
    reasonRequired: false,
    reasonPlaceholder: 'Optional summary of the work done…',
    submitLabel: 'Submit',
    destructive: false,
    nextStatus: 'in_review',
    commentType: 'submission',
    emailEvent: 'submitted_for_review',
  },
  mark_blocked: {
    title: 'Mark as blocked',
    description: 'Explain what is blocking progress so the assignor can help unblock you.',
    reasonRequired: true,
    reasonPlaceholder: 'What is blocking you?',
    submitLabel: 'Mark blocked',
    destructive: false,
    nextStatus: 'blocked',
    commentType: 'comment',
    emailEvent: 'marked_blocked',
  },
  request_changes: {
    title: 'Request changes',
    description: 'Send the task back to the assignee with feedback on what needs to change.',
    reasonRequired: true,
    reasonPlaceholder: 'What needs to change?',
    submitLabel: 'Request changes',
    destructive: false,
    nextStatus: 'in_progress',
    commentType: 'review_feedback',
    emailEvent: 'changes_requested',
  },
  approve_close: {
    title: 'Approve and close',
    description: 'Confirm the work is complete. The task will move to Done.',
    reasonRequired: false,
    reasonPlaceholder: 'Optional approval note…',
    submitLabel: 'Approve & close',
    destructive: false,
    nextStatus: 'done',
    emailEvent: 'approved_and_closed',
  },
  reopen: {
    title: 'Reopen task',
    description: 'Send this task back to the assignee for additional work.',
    reasonRequired: false,
    reasonPlaceholder: 'Optional reason for reopening…',
    submitLabel: 'Reopen',
    destructive: false,
    nextStatus: 'reopened',
    commentType: 'reopen',
    emailEvent: 'task_reopened',
  },
  cancel: {
    title: 'Cancel task',
    description: 'Cancel this task. The assignor can restore it later if needed.',
    reasonRequired: true,
    reasonPlaceholder: 'Why is this being cancelled?',
    submitLabel: 'Cancel task',
    destructive: true,
    nextStatus: 'cancelled',
    commentType: 'cancel',
    emailEvent: 'task_cancelled',
  },
  restore: {
    title: 'Restore task',
    description: 'Restore this task back to open. The assignee will be notified.',
    reasonRequired: false,
    reasonPlaceholder: 'Optional reason for restoring…',
    submitLabel: 'Restore',
    destructive: false,
    nextStatus: 'open',
    commentType: 'restore',
    emailEvent: 'task_restored',
  },
};
