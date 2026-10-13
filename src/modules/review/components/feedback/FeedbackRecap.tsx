import { ThumbsUp, ThumbsDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SubmissionLike {
  marked_helpful: boolean;
  feedback: string;
  created_at: string;
}

interface Props {
  submission: SubmissionLike;
  variant?: 'panel' | 'inline';
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function FeedbackRecap({ submission, variant = 'panel' }: Props): React.ReactNode {
  const Icon = submission.marked_helpful ? ThumbsUp : ThumbsDown;

  if (variant === 'inline') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>
            You marked this{' '}
            <span className="font-medium text-gray-900">
              {submission.marked_helpful ? 'Helpful' : 'Not helpful'}
            </span>{' '}
            <span className="text-gray-400">· {relativeTime(submission.created_at)}</span>
          </span>
        </div>
        {submission.feedback && (
          <p className="text-sm text-gray-600 border-l-2 border-gray-200 pl-3 italic">
            &ldquo;{submission.feedback}&rdquo;
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3 space-y-2 bg-white">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Your feedback</h3>
        <span className="text-xs text-gray-500">{relativeTime(submission.created_at)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded-lg shrink-0',
            submission.marked_helpful ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700',
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="text-sm text-gray-700">
          Marked{' '}
          <span className="font-medium text-gray-900">
            {submission.marked_helpful ? 'Helpful' : 'Not helpful'}
          </span>
        </span>
      </div>
      {submission.feedback && (
        <p className="text-sm text-gray-600 border-l-2 border-gray-200 pl-3 italic">
          &ldquo;{submission.feedback}&rdquo;
        </p>
      )}
    </div>
  );
}
