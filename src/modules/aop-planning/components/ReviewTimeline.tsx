import React from 'react';
import { cn } from '@/lib/utils';

import type { ReviewEntry, ReviewAction } from '../types/aopPlanning.types';

interface ReviewTimelineProps {
  entries: ReviewEntry[];
}

const ACTION_DOT_COLOR: Record<ReviewAction, string> = {
  submitted: 'bg-blue-500',
  approved: 'bg-green-500',
  revision_requested: 'bg-amber-500',
  locked: 'bg-primary',
  promoted: 'bg-primary',
  comment: 'bg-gray-400',
};

const ACTION_LABELS: Record<ReviewAction, string> = {
  submitted: 'Submitted for Review',
  approved: 'Approved',
  revision_requested: 'Revision Requested',
  locked: 'Locked',
  promoted: 'Promoted',
  comment: 'Comment',
};

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

function sortByTimestampDesc(entries: ReadonlyArray<ReviewEntry>): ReviewEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function ReviewTimeline({ entries }: ReviewTimelineProps): React.ReactNode {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No review activity yet
      </p>
    );
  }

  const sorted = sortByTimestampDesc(entries);

  return (
    <div className="relative">
      {sorted.map((entry, index) => {
        const isLast = index === sorted.length - 1;
        const dotColor = ACTION_DOT_COLOR[entry.action];
        const actionLabel = ACTION_LABELS[entry.action];

        return (
          <div key={entry.id} className="flex gap-4">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={cn('w-3 h-3 rounded-full shrink-0 mt-1', dotColor)}
                aria-hidden="true"
              />
              {!isLast && (
                <div
                  className="w-px flex-1 bg-gray-200 my-1"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-4 min-w-0 flex-1', isLast && 'pb-0')}>
              <p className="text-sm font-semibold text-gray-900">
                {actionLabel}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {entry.actor} ({entry.actorRole})
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatTimestamp(entry.timestamp)}
              </p>
              {entry.comment && (
                <p className="text-sm text-gray-700 mt-1.5 bg-gray-50 rounded-lg p-3">
                  {entry.comment}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
