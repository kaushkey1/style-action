import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui';
import type { UnifiedItem } from '../data/mockReviewData';

interface ConnectedEntitiesProps {
  item: UnifiedItem;
}

export function ConnectedEntities({ item }: ConnectedEntitiesProps): React.ReactNode {
  if (!item.relatedEntityLabels?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-gray-500">Scope</span>
      {item.relatedEntityLabels.map((label) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600 cursor-default">
              {label}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {label} affected by this item
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
