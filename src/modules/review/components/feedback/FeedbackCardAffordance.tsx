import { useState, type ReactNode } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, BottomSheet } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { useInsightFeedback, useSubmitInsightFeedback } from '../../api/useInsightFeedback';
import { FeedbackForm, type Vote } from './FeedbackForm';
import { FeedbackRecap } from './FeedbackRecap';

interface AffordanceSlots {
  /** Goes in the InsightCard's right gutter, below the metric. */
  trigger: ReactNode;
  /** Inline-expand on desktop when engaged. Null when idle, submitted, or on mobile. */
  inlineForm: ReactNode | null;
  /** Always rendered. Manages its own open/close state. Portals to body, can live anywhere. */
  bottomSheet: ReactNode;
}

export function useFeedbackCardAffordance(insightId: string): AffordanceSlots {
  const { feedback: submission, isLoading } = useInsightFeedback(insightId);
  const { submit, isPending } = useSubmitInsightFeedback();
  const isMobile = useIsMobile();
  const { error: toastError } = useToast();

  // Engagement state. Desktop: drives inline form. Mobile: drives form sheet.
  const [engagedVote, setEngagedVote] = useState<Vote>(null);
  // Recap sheet (mobile only — desktop uses tooltip). Independent from engagement.
  const [recapSheetOpen, setRecapSheetOpen] = useState(false);

  const handleSubmit = (payload: { vote: Exclude<Vote, null>; text: string }): void => {
    submit(
      { insightId, feedback: payload.text, markedHelpful: payload.vote === 'helpful' },
      {
        onError: () => {
          toastError("Couldn't save feedback — try again.");
        },
      },
    );
    // Optimistically clear engagement; React Query invalidation will populate `submission`.
    // If submission fails, engagedVote is cleared anyway — user can re-engage.
    setEngagedVote(null);
  };

  const cancel = (): void => setEngagedVote(null);

  // ───── trigger slot ─────

  let trigger: ReactNode = null;

  if (isLoading) {
    trigger = <span className="block w-9 h-7 rounded-lg bg-gray-100 animate-pulse" />;
  } else if (submission) {
    const Icon = submission.marked_helpful ? ThumbsUp : ThumbsDown;
    const ariaLabel = `You marked this ${submission.marked_helpful ? 'Helpful' : 'Not helpful'}. ${
      isMobile ? 'Tap for details' : 'Hover for details'
    }`;
    const iconNode = (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-lg',
          isMobile ? 'w-9 h-9' : 'w-7 h-7',
          submission.marked_helpful
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-gray-100 text-gray-700 border border-gray-200',
        )}
      >
        <Icon className="w-3.5 h-3.5" fill="currentColor" />
      </span>
    );
    if (isMobile) {
      trigger = (
        <button
          type="button"
          onClick={() => setRecapSheetOpen(true)}
          aria-label={ariaLabel}
          className="inline-flex items-center justify-center min-h-11 min-w-11 focus:outline-none focus-kb:ring-4 focus-kb:ring-primary/20 rounded-lg"
        >
          {iconNode}
        </button>
      );
    } else {
      trigger = (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={ariaLabel}
              className="focus:outline-none focus-kb:ring-4 focus-kb:ring-primary/20 rounded-lg"
            >
              {iconNode}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            className="max-w-xs p-3 bg-white text-gray-900 border border-gray-200 shadow-lg"
          >
            <FeedbackRecap submission={submission} variant="inline" />
          </TooltipContent>
        </Tooltip>
      );
    }
  } else if (engagedVote && !isMobile) {
    // Desktop engaged — gutter shows nothing (form lives below the card content).
    trigger = null;
  } else {
    // Idle — desktop reserves layout space always (opacity toggle prevents card-height
    // jitter on hover); mobile always-visible.
    const sizeClass = isMobile ? 'w-11 h-11' : 'w-9 h-9';
    trigger = (
      <div
        className={cn(
          'flex items-center gap-1 transition-opacity duration-150',
          !isMobile &&
            'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto',
        )}
      >
        <button
          type="button"
          onClick={() => setEngagedVote('helpful')}
          aria-label="Mark helpful"
          className={cn(
            'inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500',
            'hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50 transition-colors',
            'focus:outline-none focus-kb:ring-4 focus-kb:ring-primary/20',
            sizeClass,
          )}
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setEngagedVote('not-helpful')}
          aria-label="Mark not helpful"
          className={cn(
            'inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500',
            'hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50 transition-colors',
            'focus:outline-none focus-kb:ring-4 focus-kb:ring-primary/20',
            sizeClass,
          )}
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ───── inlineForm slot (desktop engaged only) ─────

  const inlineForm =
    engagedVote && !isMobile && !submission ? (
      <div className="px-4 pb-3.5 -mt-1 ml-5">
        <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
          <FeedbackForm
            initialVote={engagedVote}
            showCancel
            isSubmitting={isPending}
            onSubmit={handleSubmit}
            onCancel={cancel}
          />
        </div>
      </div>
    ) : null;

  // ───── bottomSheet slot ─────
  // Single sheet that flips between two modes:
  //   - mobile + engaged + not yet submitted → form
  //   - any + recapSheetOpen → recap
  // Only one mode is active at a time.

  const formSheetOpen = isMobile && engagedVote !== null && !submission;
  const sheetOpen = formSheetOpen || recapSheetOpen;
  const handleSheetClose = (): void => {
    if (formSheetOpen) setEngagedVote(null);
    if (recapSheetOpen) setRecapSheetOpen(false);
  };

  const bottomSheet = (
    <BottomSheet
      isOpen={sheetOpen}
      onClose={handleSheetClose}
      title={formSheetOpen ? 'Add feedback' : 'Your feedback'}
    >
      {formSheetOpen && engagedVote !== null && (
        <FeedbackForm
          initialVote={engagedVote}
          showCancel
          isSubmitting={isPending}
          onSubmit={handleSubmit}
          onCancel={handleSheetClose}
        />
      )}
      {recapSheetOpen && submission && (
        <FeedbackRecap submission={submission} variant="inline" />
      )}
    </BottomSheet>
  );

  return { trigger, inlineForm, bottomSheet };
}
