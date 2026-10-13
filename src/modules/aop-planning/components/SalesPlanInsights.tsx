import { useId, useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Sparkles } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useSalesPlanInsights } from '../api/salesPlanInsights';
import type { Insight } from '@/modules/store-view/api/insightsApi';

const STATUS_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  red: 'bg-red-500',
  warning: 'bg-amber-500',
  amber: 'bg-amber-500',
  'on-track': 'bg-green-500',
  green: 'bg-green-500',
};

const STATUS_LABEL: Record<string, string> = {
  critical: 'Critical',
  red: 'Critical',
  warning: 'Watch',
  amber: 'Watch',
  'on-track': 'On Track',
  green: 'On Track',
};

function renderBoldText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
      : part,
  );
}

function CompactInsightCard({ insight }: { insight: Insight }): React.ReactNode {
  const status = insight.status ?? '';
  const dotColor = STATUS_DOT[status] ?? 'bg-gray-300';
  const statusText = STATUS_LABEL[status] ?? '';
  const displayValue = insight.display_value || insight.metric || insight.value;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 sm:flex-1 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
      {statusText && (
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium uppercase tracking-wider',
              status === 'on-track' || status === 'green'
                ? 'bg-green-50 text-green-600'
                : status === 'warning' || status === 'amber'
                  ? 'bg-amber-50 text-amber-600'
                  : status === 'critical' || status === 'red'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-gray-100 text-gray-500',
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
            {statusText}
          </span>
        </div>
      )}
      <p className="text-sm text-gray-900 leading-snug">{insight.title || insight.headline}</p>
      {displayValue && <p className="text-xs text-gray-500 mt-2">{displayValue}</p>}
    </div>
  );
}

interface SalesPlanInsightsProps {
  cycleId: string | undefined;
}

export function SalesPlanInsights({ cycleId }: SalesPlanInsightsProps): React.ReactNode {
  const contentId = useId();
  const [collapsed, setCollapsed] = useState(false);
  const { data, isLoading, isGenerating, error, refresh } = useSalesPlanInsights(cycleId);

  const insights = data?.insights ?? [];
  const previewInsights = insights.slice(0, 3);
  const morningQuestion = data?.morning_question ?? '';
  const summary = data?.summary ?? '';

  if (isLoading || isGenerating) {
    return (
      <div className="rounded-lg border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-primary text-xs font-medium border border-indigo-100 shrink-0">
            <Sparkles className="w-3 h-3 animate-spin" />
            {isGenerating ? 'Generating insights…' : 'Loading…'}
          </span>
        </div>
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex flex-col sm:flex-row gap-2">
          <Skeleton className="h-20 sm:flex-1 rounded-lg" />
          <Skeleton className="h-20 sm:flex-1 rounded-lg" />
          <Skeleton className="h-20 sm:flex-1 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
        {/* eslint-disable-next-line design-system/prefer-section-header -- compact insights banner, not a page section */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-red-600">Failed to load AI insights</p>
          <Button type="button" variant="outline" size="sm" onClick={refresh} className="shrink-0">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" aria-hidden />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (insights.length === 0) return null;

  const actionButtons = (
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        type="button"
        onClick={refresh}
        disabled={isGenerating}
        className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors px-1 py-2 sm:py-1 disabled:opacity-50"
        aria-label="Regenerate AI insights"
      >
        <RefreshCw className={cn('w-3.5 h-3.5', isGenerating && 'animate-spin')} aria-hidden />
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 -mr-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:ring-0"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-controls={contentId}
        aria-label={collapsed ? 'Expand AI insights' : 'Collapse AI insights'}
      >
        {collapsed ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronUp className="h-4 w-4" aria-hidden />}
      </Button>
    </div>
  );

  return (
    <div
      className={cn(
        'rounded-lg shadow-sm',
        collapsed
          ? 'pl-3 pr-1 py-1.5 border border-gray-200 bg-white'
          : 'p-4 border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white',
      )}
      aria-label="Sales Plan AI Insights"
    >
      {collapsed ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">AI Insights</span>
          {actionButtons}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 mb-2 lg:mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-primary text-xs font-medium border border-indigo-100 shrink-0">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </span>
              <span className="hidden lg:inline text-xs font-medium text-gray-500 uppercase tracking-wider">AI Insights</span>
            </div>
            {actionButtons}
          </div>

          <div id={contentId}>
            {morningQuestion && (
              <p className="text-lg font-semibold text-gray-900 leading-snug mb-1.5">{morningQuestion}</p>
            )}
            {summary && (
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{renderBoldText(summary)}</p>
            )}
            {previewInsights.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2">
                {previewInsights.map((insight) => (
                  <CompactInsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
