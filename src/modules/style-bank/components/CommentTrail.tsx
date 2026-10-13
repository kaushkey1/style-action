import { cn } from '@/lib/utils';

// ── Props ───────────────────────────────────────────────────────────────

interface CommentTrailProps {
  designerNote?: string;
  designerAt?: string;
  buyerNote?: string;
  buyerAt?: string;
  categoryHeadNote?: string;
  categoryHeadAt?: string;
  className?: string;
}

// ── Relative-time helper ────────────────────────────────────────────────

function relativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;

  if (diffMs < 0 || diffMs < 60_000) return 'just now';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

// ── Entry configuration ─────────────────────────────────────────────────

interface TrailEntry {
  label: string;
  note: string;
  at: string;
  dotColor: string; // Tailwind bg class
}

// ── Component ───────────────────────────────────────────────────────────

export function CommentTrail({
  designerNote,
  designerAt,
  buyerNote,
  buyerAt,
  categoryHeadNote,
  categoryHeadAt,
  className,
}: CommentTrailProps) {
  const entries: TrailEntry[] = [];

  if (designerNote) {
    entries.push({
      label: 'Designer',
      note: designerNote,
      at: designerAt ?? '',
      dotColor: 'bg-green-500',
    });
  }

  if (buyerNote) {
    entries.push({
      label: 'Buyer',
      note: buyerNote,
      at: buyerAt ?? '',
      dotColor: 'bg-amber-500',
    });
  }

  if (categoryHeadNote) {
    entries.push({
      label: 'Category Head',
      note: categoryHeadNote,
      at: categoryHeadAt ?? '',
      dotColor: 'bg-primary',
    });
  }

  if (entries.length === 0) return null;

  return (
    <div className={cn('relative', className)}>
      {entries.map((entry, idx) => {
        const isLast = idx === entries.length - 1;

        return (
          <div key={entry.label} className="relative flex gap-2.5">
            {/* Vertical connector line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                  entry.dotColor
                )}
              />
              {!isLast && (
                <div className="w-px flex-1 bg-gray-200 my-0.5" />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-3 min-w-0', isLast && 'pb-0')}>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-gray-900">
                  {entry.label}
                </span>
                {entry.at && (
                  <span className="text-[10px] text-gray-400">
                    {relativeTime(entry.at)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                &ldquo;{entry.note}&rdquo;
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
