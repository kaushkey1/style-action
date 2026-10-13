import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { Avatar, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { MentionInput, type MentionInputHandle, type MentionChange } from './MentionInput';

interface CommentComposerProps {
  taskId: string;
  /** Drop the card wrapper — for embedding inside another card (mobile detail). */
  bare?: boolean;
  /** Full-width Send button below the input (mobile), instead of the inline footer row. */
  fullWidthSend?: boolean;
}

const EMPTY_DRAFT: MentionChange = { text: '', mentions: [] };

/**
 * Comment composer with @mention autocomplete.
 * - Mentions render as real pill chips (name shown) and serialize to `@email`
 *   in the submitted body (see {@link MentionInput}).
 * - Submits via Cmd/Ctrl+Enter or the Send button.
 */
export function CommentComposer({ taskId, bare = false, fullWidthSend = false }: CommentComposerProps): React.JSX.Element {
  const { addComment } = useTaskMutations();
  const userEmail = useAuthStore((s) => s.user?.email ?? '');
  const [draft, setDraft] = useState<MentionChange>(EMPTY_DRAFT);
  const inputRef = useRef<MentionInputHandle>(null);

  const submit = (): void => {
    const trimmed = draft.text.trim();
    if (!trimmed || addComment.isPending) return;
    addComment.mutate(
      {
        task_id: taskId,
        body: trimmed,
        comment_type: 'comment',
      },
      {
        onSuccess: () => {
          inputRef.current?.clear();
          setDraft(EMPTY_DRAFT);
        },
      },
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn('space-y-2', !bare && 'bg-white border border-gray-200 rounded-lg p-4')}
    >
      {bare ? (
        <MentionInput
          ref={inputRef}
          onChange={setDraft}
          onSubmit={submit}
          placeholder="Write a comment… Use @ to mention someone."
          ariaLabel="Comment body"
        />
      ) : (
        <div className="flex gap-3">
          <Avatar name={userEmail || 'You'} size="sm" />
          <div className="flex-1 min-w-0">
            <MentionInput
              ref={inputRef}
              onChange={setDraft}
              onSubmit={submit}
              placeholder="Write a comment… Use @ to mention someone."
              ariaLabel="Comment body"
            />
          </div>
        </div>
      )}
      {fullWidthSend ? (
        <>
          {draft.mentions.length > 0 && (
            <p className="text-xs text-gray-500">Mentions: {draft.mentions.join(', ')}</p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={!draft.text.trim() || addComment.isPending}>
            <Send className="w-4 h-4" />
            {addComment.isPending ? 'Sending…' : 'Send'}
          </Button>
        </>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            {draft.mentions.length > 0 && (
              <span>Mentions: {draft.mentions.join(', ')} · </span>
            )}
            <span className="hidden lg:inline">Cmd/Ctrl + Enter to send</span>
          </p>
          <Button type="submit" size="sm" disabled={!draft.text.trim() || addComment.isPending}>
            <Send className="w-3.5 h-3.5" />
            {addComment.isPending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      )}
    </form>
  );
}
