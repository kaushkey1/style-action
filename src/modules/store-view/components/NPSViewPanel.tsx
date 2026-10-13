import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info, Sparkles, Loader2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, Button, Skeleton, EmptyState, Switch, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  npsKeys,
  fetchNPSDPI,
  fetchNPSFeedbacks,
  fetchNPSAISummary,
} from '../api/npsApi';
import type { NPSDPIDriver, NPSFeedbackItem } from '../types/nps.types';

function extractSummaryParagraph(markdown: string): string {
  const match = markdown.match(/##\s*Summary\s*\n?([\s\S]*?)(?=\n##|\n#|$)/i);
  if (match?.[1]) return match[1].trim();
  const stripped = markdown.replace(/^#+\s+.*$/gm, '').trim();
  return stripped.split(/\n\n/)[0]?.trim() || markdown;
}

type FeedbackSort = 'newest' | 'highest' | 'lowest';

const SORT_CONFIG: Record<FeedbackSort, { sort: string; order: string; npsMin?: number; npsMax?: number }> = {
  newest: { sort: 'response_date', order: 'desc' },
  highest: { sort: 'response_date', order: 'desc', npsMin: 7, npsMax: 10 },
  lowest: { sort: 'response_date', order: 'desc', npsMin: 0, npsMax: 6 },
};

function getScoreColor(score: number): string {
  if (score >= 9) return 'bg-green-100 text-green-700';
  if (score >= 7) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

// ── AI Summary Section ──────────────────────────────────────────────

function AISummarySection({ storeCode, storeName, filterType = 'last_month' }: { storeCode: string; storeName?: string; filterType?: string }): React.ReactNode {
  const { data, isLoading, error } = useQuery({
    queryKey: npsKeys.aiSummary(storeCode, filterType),
    queryFn: () => fetchNPSAISummary(storeCode, filterType),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-3">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-primary text-xs font-medium border border-indigo-100 animate-ai-shimmer">
          <Sparkles className="w-3 h-3" />
          AI Generated
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">
        {(() => {
          const text = extractSummaryParagraph(data.summary);
          return storeName
            ? text.replace(new RegExp(`store ${storeCode}`, 'gi'), storeName)
            : text;
        })()}
      </p>
    </div>
  );
}

// ── DPI Driver Card ─────────────────────────────────────────────────

function DriverCard({ driver }: { driver: NPSDPIDriver }): React.ReactNode {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* eslint-disable-next-line design-system/prefer-section-header -- compact driver card header, not a page section */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 leading-tight pr-2">{driver.displayName}</h4>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-1 rounded-full text-gray-400 cursor-help">
              <Info className="w-3.5 h-3.5" />
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium mb-1">{driver.displayName}</p>
            <p className="text-xs mb-1"><span className="font-medium text-green-400">Promoters:</span> {driver.promoterPercent}% of respondents who selected this driver gave a promoter score (9–10).</p>
            <p className="text-xs"><span className="font-medium text-red-400">Detractors:</span> {driver.detractorPercent}% gave a detractor score (0–6).</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-baseline gap-4">
        <div>
          <span className={cn('text-xl font-bold', driver.dpi >= 0 ? 'text-green-600' : 'text-red-600')}>
            {driver.dpi > 0 ? '+' : ''}{driver.dpi}
          </span>
          <p className="text-xs text-gray-500 mt-0.5">Driver Score</p>
        </div>
        <div>
          <span className="text-xl font-bold text-gray-900">{driver.selectedPercent}%</span>
          <p className="text-xs text-gray-500 mt-0.5">Selected</p>
        </div>
      </div>
    </div>
  );
}

// ── Customer Experience Performance ─────────────────────────────────

function DPISection({ storeCode }: { storeCode: string }): React.ReactNode {
  const { data, isLoading, error } = useQuery({
    queryKey: npsKeys.dpi(storeCode),
    queryFn: () => fetchNPSDPI(storeCode),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-4 w-48 mb-4" />
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- skeleton placeholders, not MetricCards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <AlertCircle className="w-4 h-4" />
          <span>Unable to load experience data</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* eslint-disable-next-line design-system/prefer-section-header -- custom header with total-responses meta */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 whitespace-nowrap">Customer Experience Performance</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-0.5 rounded-full text-gray-400 cursor-help">
                <Info className="w-3.5 h-3.5" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium mb-2">Customer Experience Drivers</p>
              <p className="mb-2 text-xs"><span className="font-medium">Driver Score</span> — Net score for this driver: Promoter % minus Detractor % among respondents who selected it. Higher is better.</p>
              <p className="text-xs"><span className="font-medium">Selected</span> — % of all respondents who flagged this factor as influencing their experience.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <span className="shrink-0 text-xs text-gray-500 tabular-nums">{data.totalRespondents} Responses</span>
      </div>
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- DPI driver cards, not standard MetricCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.drivers.map((driver) => (
          <DriverCard key={driver.category} driver={driver} />
        ))}
      </div>
    </div>
  );
}

// ── Recent Customer Feedback ────────────────────────────────────────

function FeedbackSection({ storeCode }: { storeCode: string }): React.ReactNode {
  const [sortType, setSortType] = useState<FeedbackSort>('newest');
  const [withComments, setWithComments] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;
  const isMobile = useIsMobile();

  const config = SORT_CONFIG[sortType];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: npsKeys.feedbacks(storeCode, page, config.sort, config.order, config.npsMin, config.npsMax),
    queryFn: () => fetchNPSFeedbacks(storeCode, page, limit, config.sort, config.order, config.npsMin, config.npsMax),
    staleTime: 5 * 60 * 1000,
  });

  const handleSortChange = useCallback((newSort: FeedbackSort) => {
    setSortType(newSort);
    setPage(1);
  }, []);

  const handleToggleComments = useCallback((checked: boolean) => {
    setWithComments(checked);
    setPage(1);
  }, []);

  const feedbacks: NPSFeedbackItem[] = data?.data ?? [];
  // "With comments" is a desktop-only view filter — never applied on mobile.
  const displayedFeedbacks =
    !isMobile && withComments
      ? feedbacks.filter((f) => f.otherFeedback != null && f.otherFeedback.trim() !== '')
      : feedbacks;
  const pagination = data?.pagination;

  return (
    <div>
      {/* eslint-disable-next-line design-system/prefer-section-header -- custom header with filter chips */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Recent Customer Feedback</h3>
        {error && (
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Retry
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {(['newest', 'highest', 'lowest'] as const).map((key) => (
          <button
            key={key}
            onClick={() => handleSortChange(key)}
            className={cn(
              'text-xs font-medium px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap',
              sortType === key
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
            )}
          >
            {key === 'newest' ? 'Newest' : key === 'highest' ? 'Highest rating (10-7)' : 'Lowest rating (0-6)'}
          </button>
        ))}
        {/* Desktop-only "With comments" view filter, pinned to the far right. */}
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <span className="text-xs font-medium text-gray-600">With comments</span>
          <Switch
            checked={withComments}
            onCheckedChange={handleToggleComments}
            aria-label="Show only feedback with comments"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : displayedFeedbacks.length === 0 ? (
        <EmptyState
          title="No feedback found"
          description={
            withComments
              ? 'No feedback with comments on this page'
              : 'No customer feedback available for this filter'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="divide-y divide-gray-100">
            {displayedFeedbacks.map((item) => (
              <div key={item.feedbackId} className="p-3">
                {/* eslint-disable-next-line design-system/prefer-section-header -- feedback card row with score badge + date, not a section header */}
                <div className="flex items-center justify-between mb-1.5">
                  <Badge className={cn('text-xs', getScoreColor(item.npsScore))}>
                    Score: {item.npsScore}
                  </Badge>
                  <span className="text-xs text-gray-500">{formatDate(new Date(item.responseDate))}</span>
                </div>
                {item.otherFeedback && (
                  <p className="text-sm text-gray-700">{item.otherFeedback}</p>
                )}
              </div>
            ))}
          </div>
          {pagination && pagination.totalPages > 1 && (
            /* eslint-disable-next-line design-system/prefer-section-header -- pagination footer (page counter + prev/next), not a section header */
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-2">
              <span className="text-xs tabular-nums text-gray-600">
                Page {page} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  aria-label="Next page"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Panel ──────────────────────────────────────────────────────

interface NPSViewPanelProps {
  storeCode: string;
  storeName?: string;
}

export function NPSViewPanel({ storeCode, storeName }: NPSViewPanelProps): React.ReactNode {
  return (
    <div className="space-y-4">
      <AISummarySection storeCode={storeCode} storeName={storeName} />
      <DPISection storeCode={storeCode} />
      <FeedbackSection storeCode={storeCode} />
    </div>
  );
}
