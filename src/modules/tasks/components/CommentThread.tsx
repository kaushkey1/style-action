import { useMemo, useState } from 'react';
import { Send, RotateCcw, Undo2, X, MessageSquare, Activity as ActivityIcon } from 'lucide-react';
import { Avatar, EmptyState, ToggleGroup, ToggleGroupItem } from '@/components/ui';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { TaskComment, TaskActivity, CommentType } from '../types/task.types';

const COMMENT_TYPE_META: Record<
  CommentType,
  { label: string; Icon: typeof Send; iconClass: string; bg: string }
> = {
  comment:          { label: 'Comment',         Icon: MessageSquare, iconClass: 'text-gray-500',   bg: 'bg-gray-50' },
  submission:       { label: 'Submitted',       Icon: Send,          iconClass: 'text-purple-700', bg: 'bg-purple-50' },
  review_feedback:  { label: 'Review feedback', Icon: RotateCcw,     iconClass: 'text-amber-700',  bg: 'bg-amber-50' },
  reopen:           { label: 'Reopened',        Icon: Undo2,         iconClass: 'text-blue-700',   bg: 'bg-blue-50' },
  cancel:           { label: 'Cancelled',       Icon: X,             iconClass: 'text-red-700',    bg: 'bg-red-50' },
  restore:          { label: 'Restored',        Icon: Undo2,         iconClass: 'text-green-700',  bg: 'bg-green-50' },
};

type Filter = 'all' | 'comments' | 'activity';

interface CommentEntry {
  kind: 'comment';
  data: TaskComment;
}
interface ActivityEntry {
  kind: 'activity';
  data: TaskActivity;
}
type Entry = CommentEntry | ActivityEntry;

interface CommentThreadProps {
  comments: TaskComment[];
  activities: TaskActivity[];
  /** Render the "Conversation" label + filter OUTSIDE the card (mobile detail). */
  labelOutside?: boolean;
  /** Footer inside the card, below the feed (e.g. the composer) — combines them. */
  footer?: React.ReactNode;
}

/**
 * Interleaves comments + activities by timestamp (oldest first).
 * Filter switches between All / Comments only / Activity only.
 * `labelOutside` + `footer` let the mobile detail put the label/toggle above the
 * card and fold the composer into the same card (one Conversation container).
 */
export function CommentThread({ comments, activities, labelOutside = false, footer }: CommentThreadProps): React.JSX.Element {
  const [filter, setFilter] = useState<Filter>('all');

  const entries = useMemo<Entry[]>(() => {
    const merged: Entry[] = [
      ...comments.map<Entry>((c) => ({ kind: 'comment', data: c })),
      ...activities.map<Entry>((a) => ({ kind: 'activity', data: a })),
    ];
    merged.sort((a, b) => new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime());
    if (filter === 'comments') return merged.filter((e) => e.kind === 'comment');
    if (filter === 'activity') return merged.filter((e) => e.kind === 'activity');
    return merged;
  }, [comments, activities, filter]);

  const header = (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">Conversation</h3>
      <ToggleGroup
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        aria-label="Conversation filter"
      >
        <ToggleGroupItem value="all" aria-label="All entries">All</ToggleGroupItem>
        <ToggleGroupItem value="comments" aria-label="Comments only">Comments</ToggleGroupItem>
        <ToggleGroupItem value="activity" aria-label="Activity only">Activity</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );

  const feed = entries.length === 0 ? (
    <EmptyState description="No activity yet." />
  ) : (
    <ol className="space-y-3">
      {entries.map((entry) =>
        entry.kind === 'comment' ? (
          <CommentRow key={entry.data.id} comment={entry.data} />
        ) : (
          <ActivityRow key={entry.data.id} activity={entry.data} />
        ),
      )}
    </ol>
  );

  // Mobile: label + toggle above the card; feed + composer share one container.
  if (labelOutside) {
    return (
      <section aria-label="Comments and activity">
        <div className="mb-1.5">{header}</div>
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4">{feed}</div>
          {footer && <div className="border-t border-gray-100 p-4">{footer}</div>}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4" aria-label="Comments and activity">
      <div className="mb-3">{header}</div>
      {feed}
      {footer && <div className="mt-4 border-t border-gray-100 pt-4">{footer}</div>}
    </section>
  );
}

function CommentRow({ comment }: { comment: TaskComment }): React.JSX.Element {
  const meta = COMMENT_TYPE_META[comment.comment_type];
  const isPlainComment = comment.comment_type === 'comment';
  return (
    <li className="flex gap-3">
      <Avatar name={comment.author} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900">{comment.author}</span>
          {!isPlainComment && (
            <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', meta.iconClass, meta.bg)}>
              {meta.label}
            </span>
          )}
          <span className="text-xs text-gray-500 tabular-nums">{formatRelativeTime(comment.created_at)}</span>
        </div>
        <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{comment.body}</p>
      </div>
    </li>
  );
}

function ActivityRow({ activity }: { activity: TaskActivity }): React.JSX.Element {
  return (
    <li className="flex gap-3 text-xs text-gray-500 items-center">
      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
        <ActivityIcon className="w-3 h-3 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-gray-700">{activity.actor}</span> {activity.event}
        <span className="text-gray-400"> · {formatRelativeTime(activity.created_at)}</span>
      </div>
    </li>
  );
}
