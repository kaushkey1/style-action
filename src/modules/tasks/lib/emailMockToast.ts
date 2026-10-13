/**
 * FE-side mock for spec §R6 email templates.
 *
 * Every task mutation that would trigger an outbound email in production
 * routes through this module so we can:
 *   1. Centralise the toast copy in one place
 *   2. Surface the recipient consistently
 *   3. Easily swap to a real SMTP webhook once BE wires §R6
 *
 * Replace the {@link emailToast} body with a real fetch when BE ships.
 */
import type { useToast } from '@/hooks/useToast';

export type EmailEvent =
  | 'task_assigned'        // assignor → assignee
  | 'submitted_for_review' // assignee → assignor
  | 'changes_requested'    // assignor → assignee
  | 'approved_and_closed'  // assignor → assignee
  | 'marked_blocked'       // assignee → assignor
  | 'task_reopened'        // assignor → assignee
  | 'task_cancelled'       // assignor → assignee
  | 'task_restored';       // assignor → assignee

const COPY: Record<EmailEvent, (recipient: string) => string> = {
  task_assigned:        (r) => `Email sent to ${r} — new task assigned`,
  submitted_for_review: (r) => `Sent for review to ${r}`,
  changes_requested:    (r) => `Sent back to ${r} with feedback`,
  approved_and_closed:  (r) => `Task closed — ${r} notified`,
  marked_blocked:       (r) => `${r} has been notified the task is blocked`,
  task_reopened:        (r) => `Reopened — ${r} notified`,
  task_cancelled:       (r) => `Task cancelled — ${r} notified`,
  task_restored:        (r) => `Task restored — ${r} notified`,
};

type ToastApi = ReturnType<typeof useToast>;

/**
 * Fires the success toast for a given email event.
 * Pass the live `toast` instance from `useToast()` at the callsite — keeping
 * this a plain function (not a hook) so it can be called from anywhere.
 */
export function emailToast(toast: ToastApi, event: EmailEvent, recipient: string): void {
  toast.success(COPY[event](recipient));
}
