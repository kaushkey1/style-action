/* Action Register feedback block. Exceptions and insights are merged into one
   list, so each line item wires to its OWN feedback API (exception → exception
   feedback, insight → insight feedback) while sharing the exceptions feedback UI
   (FeedbackForm). The post-submit recap is intentionally NOT shown — we don't
   surface the submitted content back to the user; a neutral confirmation replaces
   it (and the same confirmation covers feedback already on record). */
import { CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { FeedbackForm } from '../feedback/FeedbackForm';
import { useExceptionFeedback, useSubmitExceptionFeedback } from '../../api/useExceptionFeedback';
import { useInsightFeedback, useSubmitInsightFeedback } from '../../api/useInsightFeedback';

function FeedbackSkeleton(): React.ReactNode {
  return (
    <div className="animate-pulse space-y-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="h-4 w-56 rounded bg-gray-200" />
      <div className="flex gap-2">
        <div className="h-9 w-24 rounded-lg bg-gray-200" />
        <div className="h-9 w-28 rounded-lg bg-gray-200" />
      </div>
      <div className="h-12 w-full rounded-lg bg-gray-200" />
    </div>
  );
}

function FeedbackConfirmation(): React.ReactNode {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" aria-hidden />
      Thanks — your feedback has been recorded.
    </div>
  );
}

function FeedbackFormShell({ isPending, onSubmit }: {
  isPending: boolean;
  onSubmit: (text: string, markedHelpful: boolean) => void;
}): React.ReactNode {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <FeedbackForm isSubmitting={isPending} onSubmit={({ vote, text }) => onSubmit(text, vote === 'helpful')} />
    </div>
  );
}

/** Exception line item → exception feedback API. The per-exception fetch is gated
    on `active` so the Action Register's always-mounted rows don't each fire one. */
function ExceptionFeedback({ id, active }: { id: string; active: boolean }): React.ReactNode {
  const { feedback, isLoading } = useExceptionFeedback(id, active);
  const { submit, isPending, isSuccess } = useSubmitExceptionFeedback();
  const { error: toastError } = useToast();

  if (isLoading) return <FeedbackSkeleton />;
  if (feedback || isSuccess) return <FeedbackConfirmation />;
  return (
    <FeedbackFormShell
      isPending={isPending}
      onSubmit={(text, markedHelpful) =>
        submit(
          { exceptionId: id, feedback: text, markedHelpful },
          { onError: () => toastError("Couldn't save feedback — try again.") },
        )
      }
    />
  );
}

/** Insight line item → insight feedback API (one shared query for all insights). */
function InsightFeedback({ id }: { id: string }): React.ReactNode {
  const { feedback, isLoading } = useInsightFeedback(id);
  const { submit, isPending, isSuccess } = useSubmitInsightFeedback();
  const { error: toastError } = useToast();

  if (isLoading) return <FeedbackSkeleton />;
  if (feedback || isSuccess) return <FeedbackConfirmation />;
  return (
    <FeedbackFormShell
      isPending={isPending}
      onSubmit={(text, markedHelpful) =>
        submit(
          { insightId: id, feedback: text, markedHelpful },
          { onError: () => toastError("Couldn't save feedback — try again.") },
        )
      }
    />
  );
}

export function RegisterFeedback({ kind, id, active = true }: {
  kind: 'exception' | 'insight';
  id: string;
  active?: boolean;
}): React.ReactNode {
  return kind === 'exception' ? <ExceptionFeedback id={id} active={active} /> : <InsightFeedback id={id} />;
}
