import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { SEVERITY_BADGE } from '../lib/severityBadge';
import type { UnifiedItem } from '../data/mockReviewData';

interface ReviewListItemProps {
  item: UnifiedItem;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  onToggleSelect: () => void;
}

export function ReviewListItem({
  item,
  isActive,
  isSelected,
  onClick,
}: ReviewListItemProps): React.ReactNode {
  const sev = SEVERITY_BADGE[item.severity];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${item.title} — ${sev.label}`}
      className={cn(
        'group flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 cursor-pointer transition-colors',
        isActive && 'bg-primary-100',
        isSelected && !isActive && 'bg-primary-50',
        !isActive && !isSelected && 'bg-white hover:bg-gray-50',
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Title + severity pill only. Impact column removed 2026-06-02 — BE has
          no dedicated numeric impact field, and the regex-parsed value from
          `impact_narrative` populated only ~3 of 16 rows (rupee-mentioning
          narratives). To restore: wait for BE `projected_impact_inr` field. */}
      <p className="flex-1 min-w-0 text-sm font-medium text-gray-900 line-clamp-2">
        {item.title}
      </p>
      <Badge variant={sev.variant} size="sm" className="shrink-0">{sev.label}</Badge>
    </div>
  );
}
