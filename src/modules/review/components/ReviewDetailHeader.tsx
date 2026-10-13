import type { UnifiedItem } from '../data/mockReviewData';

interface ReviewDetailHeaderProps {
  item: UnifiedItem;
  onApprove?: () => void;
  onReject?: () => void;
  onAcknowledge?: () => void;
  /** Right-aligned slot on the badge row — used for top-right CTAs (e.g. Create Task). */
  actions?: React.ReactNode;
}

/**
 * Right-pane header. Stripped down 2026-06-02 per product — domain pill,
 * lifecycle pill, severity glyph, severity pill, relativeTime, agent row,
 * and the regex-parsed impact line were all removed. Keeps: title (with
 * inline action slot for Create Task) and owner when assigned.
 */
export function ReviewDetailHeader({ item, actions }: ReviewDetailHeaderProps): React.ReactNode {
  return (
    <div>
      {/* Title + actions on one horizontal row. */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <h2 className="flex-1 min-w-0 text-lg font-semibold text-gray-900 leading-snug text-balance">{item.title}</h2>
        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </div>

      {/* Impact line removed 2026-06-02 — see ReviewListItem for rationale. */}

      {/* Owner — only show when actually assigned */}
      {item.ownerId && item.ownerName && (
        <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-[10px] font-medium text-gray-600">
              {item.ownerName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </span>
            {item.ownerName}
          </span>
        </div>
      )}
    </div>
  );
}

/* LinkedItemRef — hidden for now, pushed to future release
function LinkedItemRef({ linkedItemId, currentLifecycle }: { linkedItemId: string; currentLifecycle: string }): React.ReactNode {
  const items = useReviewStore((s) => s.items);
  const linked = items.find((i) => i.id === linkedItemId)
    ?? mockReviewItems.find((i) => i.id === linkedItemId);
  if (!linked) return null;
  const label = currentLifecycle === 'approval' ? 'Exception' : 'Approval';
  return (
    <a href={`/review/${linkedItemId}`} className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 transition-colors mt-1">
      <Link2 className="w-3 h-3 shrink-0" />
      <span>Linked {label}: {linked.displayId}</span>
    </a>
  );
}
*/
