import { Eye, CheckCircle, XCircle } from 'lucide-react';
import type { Task } from '../types/task.types';

interface BannerProps {
  task: Task;
}

/**
 * Shown to the assignor when a task is awaiting their review.
 * Always-on context strip — distinct from the action CTAs in the page header.
 */
export function ReviewBanner({ task }: BannerProps): React.JSX.Element {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-3">
      <Eye className="w-4 h-4 text-purple-700 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-purple-900 font-medium">Awaiting your review</p>
        <p className="text-xs text-purple-700">
          {task.assigned_to} submitted this task for your review. Approve to close or request changes.
        </p>
      </div>
    </div>
  );
}

/**
 * Shown when a task has reached a terminal state (done / cancelled).
 * Done shows green; cancelled shows gray with restore hint.
 */
export function ClosedBanner({ task }: BannerProps): React.JSX.Element {
  if (task.status === 'cancelled') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3">
        <XCircle className="w-4 h-4 text-gray-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 font-medium">Cancelled</p>
          <p className="text-xs text-gray-600">
            The assignor can restore this task back to open.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
      <CheckCircle className="w-4 h-4 text-green-700 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-green-900 font-medium">Closed</p>
        <p className="text-xs text-green-700">
          Approved by {task.assignor}. The assignor can reopen if follow-up is needed.
        </p>
      </div>
    </div>
  );
}
