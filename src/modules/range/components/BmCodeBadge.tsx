import { cn } from '@/lib/utils';
import { type BuyingModelId, BUYING_MODELS } from '../data/types/rangeArchitecture';

interface BmCodeBadgeProps {
  buyingModelId: BuyingModelId;
  className?: string;
  showFullLabel?: boolean;
}

export function BmCodeBadge({ buyingModelId, className, showFullLabel = false }: BmCodeBadgeProps) {
  const getStyles = () => {
    if (["BM-1", "BM-2", "BM-3", "BM-4", "BM-5"].includes(buyingModelId)) {
      return "bg-indigo-50 text-primary-700";
    }
    if (buyingModelId === "BM-6") {
      return "bg-amber-50 text-amber-700";
    }
    // BM-7, BM-8
    return "bg-gray-100 text-gray-600";
  };

  const model = BUYING_MODELS[buyingModelId];
  const displayText = showFullLabel ? model?.label || buyingModelId : model?.shortLabel || buyingModelId;

  return (
    <span className={cn(
      "rounded px-2 py-0.5 text-[10px] font-bold",
      getStyles(),
      className
    )}>
      {displayText}
    </span>
  );
}