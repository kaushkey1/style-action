import { useToast } from '@/hooks/useToast';
import { useExceptionFeedback, useSubmitExceptionFeedback } from '../../api/useExceptionFeedback';
import { FeedbackForm } from './FeedbackForm';
import { FeedbackRecap } from './FeedbackRecap';

interface Props {
  exceptionId: string;
}

export function FeedbackPanelSection({ exceptionId }: Props): React.ReactNode {
  const { feedback, isLoading } = useExceptionFeedback(exceptionId);
  const { submit, isPending } = useSubmitExceptionFeedback();
  const { error: toastError } = useToast();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 p-3 bg-white animate-pulse space-y-3">
        <div className="h-4 w-56 bg-gray-200 rounded" />
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-gray-200 rounded-lg" />
          <div className="h-9 w-28 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-12 w-full bg-gray-200 rounded-lg" />
        <div className="flex justify-end">
          <div className="h-8 w-32 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (feedback) {
    return <FeedbackRecap submission={feedback} variant="panel" />;
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3 bg-white">
      <FeedbackForm
        isSubmitting={isPending}
        onSubmit={({ vote, text }) => {
          submit(
            { exceptionId, feedback: text, markedHelpful: vote === 'helpful' },
            {
              onError: () => {
                toastError("Couldn't save feedback — try again.");
              },
            },
          );
        }}
      />
    </div>
  );
}
