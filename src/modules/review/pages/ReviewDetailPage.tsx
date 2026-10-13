import { useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useReviewItem, useReviewItems } from '../api/useReviewData';
import { ReviewDetailPanel } from '../components/ReviewDetailPanel';

// ─── Component ────────────────────────────────────────────────────────────

export function ReviewDetailPage(): React.ReactNode {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, loading: itemLoading } = useReviewItem(id ?? null);
  const { data: allItems, loading: allLoading } = useReviewItems();

  // Build the navigable item list (exceptions only — insights don't have detail pages)
  const navigableItems = useMemo(
    () => allItems.filter((i) => i.lifecycleState === 'exception'),
    [allItems],
  );

  const currentIndex = useMemo(
    () => (id ? navigableItems.findIndex((i) => i.id === id || i.displayId === id) : -1),
    [id, navigableItems],
  );

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < navigableItems.length - 1;

  const goToPrev = useCallback((): void => {
    if (!hasPrev) return;
    const prevItem = navigableItems[currentIndex - 1];
    if (prevItem) navigate(`/review/${prevItem.id}`, { replace: true });
  }, [hasPrev, navigableItems, currentIndex, navigate]);

  const goToNext = useCallback((): void => {
    if (!hasNext) return;
    const nextItem = navigableItems[currentIndex + 1];
    if (nextItem) navigate(`/review/${nextItem.id}`, { replace: true });
  }, [hasNext, navigableItems, currentIndex, navigate]);

  const goBack = useCallback((): void => {
    navigate('/review');
  }, [navigate]);

  // ── Loading state ─────────────────────────────────────────────────────
  if (itemLoading || allLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────
  if (!item) {
    return (
      <div className="flex flex-col min-h-0">
        <BackBar
          onBack={goBack}
          currentIndex={-1}
          totalCount={0}
          hasPrev={false}
          hasNext={false}
          onPrev={goToPrev}
          onNext={goToNext}
        />
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-500">Item not found</p>
        </div>
      </div>
    );
  }

  // ── Action handlers for the sticky footer ─────────────────────────────
  // The ReviewDetailPanel already handles approve/reject internally,
  // but we surface the primary actions in a sticky footer on mobile.

  return (
    <div className="fixed left-0 lg:left-[76px] right-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] bottom-0 z-[35] bg-gray-50 rounded-t-xl overflow-y-auto">
      {/* Sticky back bar */}
      <BackBar
        onBack={goBack}
        currentIndex={currentIndex}
        totalCount={navigableItems.length}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={goToPrev}
        onNext={goToNext}
      />

      {/* Content — ReviewDetailPanel provides its own px-4 pt-3.5 pb-4 */}
      <div>
        <ReviewDetailPanel item={item} />
      </div>

      {/* Sticky action footer — hidden for now, pushed to future release */}
      {/* {!item.isResolved && (
        <StickyActionFooter item={item} />
      )} */}
    </div>
  );
}

// ─── Back Bar ─────────────────────────────────────────────────────────────

interface BackBarProps {
  onBack: () => void;
  currentIndex: number;
  totalCount: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

function BackBar({
  onBack,
  currentIndex,
  totalCount,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: BackBarProps): React.ReactNode {
  return (
    <nav className="sticky top-0 z-10 flex items-center px-4 py-3 border-b border-gray-200 bg-white">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-gray-900 min-h-[44px] -ml-1.5 p-1.5"
        aria-label="Back to Action Register"
      >
        <ArrowLeft className="w-5 h-5 text-gray-500" />
        <span>Action Register</span>
      </button>

      {totalCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
          <span className="tabular-nums">{currentIndex + 1} of {totalCount}</span>
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className={cn(
              'p-1.5 rounded-md transition-colors min-h-[44px] min-w-[36px] flex items-center justify-center',
              hasPrev
                ? 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                : 'text-gray-400 cursor-not-allowed',
            )}
            aria-label="Previous item"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            className={cn(
              'p-1.5 rounded-md transition-colors min-h-[44px] min-w-[36px] flex items-center justify-center',
              hasNext
                ? 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                : 'text-gray-400 cursor-not-allowed',
            )}
            aria-label="Next item"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </nav>
  );
}

/* StickyActionFooter — hidden for now, pushed to future release */
