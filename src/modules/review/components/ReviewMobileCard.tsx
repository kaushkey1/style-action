import { useCallback, useRef, useState } from 'react';
import { ChevronRight, Bot } from 'lucide-react';
import { SeverityGlyph, Checkbox } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import { useSwipeAction } from '../hooks/useSwipeAction';
import type { UnifiedItem } from '../data/mockReviewData';

const LIFECYCLE_CONFIG: Record<string, { label: string; className: string }> = {
  insight: { label: 'Insight', className: 'text-sky-800 bg-sky-50 border-sky-200' },
  exception: { label: 'Exception', className: 'text-orange-800 bg-orange-50 border-orange-200' },
  approval: { label: 'Approval', className: 'text-primary-700 bg-primary-50 border-primary-200' },
};

interface ReviewMobileCardProps {
  item: UnifiedItem;
  isSelected: boolean;
  isBatchMode: boolean;
  onClick: () => void;
  onToggleSelect: () => void;
  onLongPress: () => void;
  onSwipeApprove?: () => void;
}

const LONG_PRESS_MS = 500;

export function ReviewMobileCard({
  item,
  isSelected,
  isBatchMode,
  onClick,
  onToggleSelect,
  onLongPress,
  onSwipeApprove,
}: ReviewMobileCardProps): React.ReactNode {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const [translateX, setTranslateX] = useState(0);

  const swipe = useSwipeAction({
    onSwipeRight: onSwipeApprove,
    impactInr: item.projectedImpactInr,
    disabled: isBatchMode || item.isResolved,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
    swipe.onTouchStart(e);
  }, [onLongPress, swipe]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (didLongPress.current) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    swipe.onTouchMove(e);
    setTranslateX(swipe.getTranslateX());
  }, [swipe]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    swipe.onTouchEnd(e);
    setTranslateX(0);
    if (!didLongPress.current && Math.abs(swipe.getTranslateX()) < 20) {
      if (isBatchMode) {
        onToggleSelect();
      } else {
        onClick();
      }
    }
  }, [swipe, isBatchMode, onClick, onToggleSelect]);

  const handleTouchCancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    swipe.onTouchCancel();
    setTranslateX(0);
  }, [swipe]);

  const swipeDirection = translateX > 20 ? 'right' : translateX < -20 ? 'left' : null;
  const lifecycle = LIFECYCLE_CONFIG[item.lifecycleState] ?? { label: 'Exception', className: 'text-orange-800 bg-orange-50 border-orange-200' };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Swipe background */}
      {swipeDirection === 'right' && !swipe.isSwipeDisabled && (
        <div className="absolute inset-0 bg-green-500 rounded-lg flex items-center pl-4">
          <span className="text-sm font-semibold text-white">
            {item.lifecycleState === 'insight' ? 'Acknowledge' : 'Approve'}
          </span>
        </div>
      )}

      {/* Card content */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`${item.title} — ${item.severity} ${item.domain}${swipe.isHighValue ? '. High value — swipe disabled, use detail panel to approve.' : ''}`}
        className={cn(
          'relative rounded-lg border bg-white p-3 cursor-pointer transition-transform',
          isSelected ? 'ring-2 ring-gray-900 border-gray-400' : 'border-gray-200',
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onClick={() => {
          if (isBatchMode) {
            onToggleSelect();
          } else {
            onClick();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        // eslint-disable-next-line no-restricted-syntax -- dynamic swipe transform requires inline style
        style={{ transform: `translateX(${translateX}px)` }}
      >
        {/* Top row: severity + content + chevron */}
        <div className="flex items-start gap-2">
          {isBatchMode && (
            <div className="shrink-0 pt-0.5">
              <Checkbox checked={isSelected} readOnly />
            </div>
          )}
          <div className="shrink-0 flex items-center h-5">
            <SeverityGlyph severity={item.severity} />
          </div>

          {/* Content — badges align with title baseline, not severity icon */}
          <div className="flex-1 min-w-0">
            {/* Title + impact */}
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-gray-900 flex-1 line-clamp-2">
                {item.title}
              </p>
              {item.projectedImpactInr > 0 && (
                <span className="shrink-0 text-sm font-bold text-gray-900 tabular-nums">
                  {formatCurrency(item.projectedImpactInr)}
                </span>
              )}
            </div>

            {/* Badges row — matches desktop chip style */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="inline-flex items-center text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                {item.domain}
              </span>
              <span className={cn(
                'inline-flex items-center text-xs font-medium border px-2 py-0.5 rounded-full',
                lifecycle.className,
              )}>
                {lifecycle.label}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                <Bot className="w-3 h-3 text-gray-400" />
                {item.agentName}
              </span>
              <span className="text-xs text-gray-400 ml-auto shrink-0">
                {item.relativeTime}
              </span>
            </div>
          </div>

          {/* Chevron — top-aligned, signals tappability */}
          {!isBatchMode && (
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}
