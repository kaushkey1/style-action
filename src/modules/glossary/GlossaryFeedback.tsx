/**
 * Glossary feedback — reuses the insights/exceptions FeedbackForm + FeedbackRecap
 * with the insight-card "collapsible thumbs" interaction. Per-metric local state.
 * (Prototype: no backend. A useMetricFeedback API hook can replace the local
 * state when a feedback endpoint exists.)
 */
import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedbackForm, type Vote } from '@/modules/review/components/feedback/FeedbackForm';
import { FeedbackRecap, type SubmissionLike } from '@/modules/review/components/feedback/FeedbackRecap';

const PROMPT = 'Was this definition helpful?';

export function GlossaryFeedback({ metricKey }: { metricKey: string }): React.JSX.Element {
  const [submissions, setSubmissions] = useState<Record<string, SubmissionLike>>({});
  const [engagedVote, setEngagedVote] = useState<Vote>(null);
  const [engagedFor, setEngagedFor] = useState(metricKey);

  // Reset the open form when switching metrics (submissions persist per metric).
  if (engagedFor !== metricKey) {
    setEngagedFor(metricKey);
    setEngagedVote(null);
  }

  const submission = submissions[metricKey];

  const handleSubmit = ({ vote, text }: { vote: Exclude<Vote, null>; text: string }): void => {
    setSubmissions((prev) => ({
      ...prev,
      [metricKey]: {
        marked_helpful: vote === 'helpful',
        feedback: text,
        created_at: new Date().toISOString(),
      },
    }));
    setEngagedVote(null);
  };

  return (
    <div className="border-t border-gray-100 mt-1 pt-4">
      {submission ? (
        <FeedbackRecap submission={submission} variant="panel" />
      ) : engagedVote ? (
        <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
          <FeedbackForm
            initialVote={engagedVote}
            prompt={PROMPT}
            showCancel
            onSubmit={handleSubmit}
            onCancel={() => setEngagedVote(null)}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">{PROMPT}</span>
          <div className="flex items-center gap-2">
            <ThumbButton icon={ThumbsUp} label="Helpful" onClick={() => setEngagedVote('helpful')} />
            <ThumbButton icon={ThumbsDown} label="Not helpful" onClick={() => setEngagedVote('not-helpful')} />
          </div>
        </div>
      )}
    </div>
  );
}

function ThumbButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof ThumbsUp;
  label: string;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700',
        'min-h-11 lg:min-h-9 hover:border-gray-300 hover:bg-gray-50 transition-colors',
        'focus:outline-none focus-kb:ring-4 focus-kb:ring-primary/20 active:scale-[0.98]',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
