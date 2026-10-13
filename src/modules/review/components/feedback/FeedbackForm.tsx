import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';
import { Button, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';

export type Vote = 'helpful' | 'not-helpful' | null;

interface Props {
  initialVote?: Vote;
  initialText?: string;
  showCancel?: boolean;
  isSubmitting?: boolean;
  /** Heading shown above the vote buttons. Defaults to the recommendation prompt. */
  prompt?: string;
  onSubmit: (payload: { vote: Exclude<Vote, null>; text: string }) => void;
  onCancel?: () => void;
}

export function FeedbackForm({
  initialVote = null,
  initialText = '',
  showCancel = false,
  isSubmitting = false,
  prompt = 'Was this recommendation helpful?',
  onSubmit,
  onCancel,
}: Props): React.ReactNode {
  const [vote, setVote] = useState<Vote>(initialVote);
  const [text, setText] = useState(initialText);

  const submit = (): void => {
    if (!vote || isSubmitting) return;
    onSubmit({ vote, text });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">{prompt}</h3>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setVote('helpful')}
          aria-pressed={vote === 'helpful'}
          className={cn(
            'flex items-center gap-1.5 px-3 rounded-lg border text-sm font-medium transition-colors',
            'min-h-11 lg:min-h-9 focus:outline-none focus-kb:ring-4 focus-kb:ring-primary/20',
            vote === 'helpful'
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50',
          )}
        >
          <ThumbsUp className="w-3.5 h-3.5" /> Helpful
        </button>
        <button
          type="button"
          onClick={() => setVote('not-helpful')}
          aria-pressed={vote === 'not-helpful'}
          className={cn(
            'flex items-center gap-1.5 px-3 rounded-lg border text-sm font-medium transition-colors',
            'min-h-11 lg:min-h-9 focus:outline-none focus-kb:ring-4 focus-kb:ring-primary/20',
            vote === 'not-helpful'
              ? 'bg-gray-100 border-gray-400 text-gray-800'
              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50',
          )}
        >
          <ThumbsDown className="w-3.5 h-3.5" /> Not helpful
        </button>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Anything else? (optional)"
        rows={2}
        className="text-sm"
        aria-label="Additional feedback"
      />

      <div className="flex justify-end gap-2">
        {showCancel && onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            <X className="w-3.5 h-3.5 mr-1" /> Cancel
          </Button>
        )}
        <Button size="sm" disabled={!vote || isSubmitting} onClick={submit}>
          <Send className="w-3.5 h-3.5 mr-1.5" /> {isSubmitting ? 'Submitting...' : 'Send feedback'}
        </Button>
      </div>
    </div>
  );
}
