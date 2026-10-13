import { useId, useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ProductInsight, ProductInsightsData } from '../data/mockProductInsights';

const STATUS_STYLE: Record<string, { dot: string; tag: string; label: string }> = {
  critical: { dot: 'bg-red-500', tag: 'bg-red-50 text-red-600', label: 'Critical' },
  warning: { dot: 'bg-amber-500', tag: 'bg-amber-50 text-amber-600', label: 'Watch' },
  'on-track': { dot: 'bg-green-500', tag: 'bg-green-50 text-green-600', label: 'On Track' },
};

function CompactCard({ insight, delay }: { insight: ProductInsight; delay: number }): React.ReactNode {
  const style = insight.status ? STATUS_STYLE[insight.status] : null;

  return (
    <div
      className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 sm:flex-1 opacity-0 animate-fadeInUp hover:border-gray-300 hover:shadow-sm transition-all duration-200"
      // eslint-disable-next-line no-restricted-syntax -- staggered entrance delay for insight cards
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {style && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium uppercase tracking-wider', style.tag)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
            {style.label}
          </span>
        </div>
      )}
      <p className="text-sm text-gray-900 leading-snug">{insight.headline}</p>
      {insight.metric && (
        <p className="text-xs text-gray-400 mt-2">{insight.metric}</p>
      )}
    </div>
  );
}

export function ProductInsightsBanner({ question, summary, insights }: ProductInsightsData): React.ReactNode {
  const contentId = useId();
  const [collapsed, setCollapsed] = useState(false);
  const previewInsights = insights.slice(0, 3);

  const toggleBtn = (
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
  );

  return (
    <div className={cn(
      'rounded-lg shadow-sm animate-fadeInUp',
      collapsed
        ? 'pl-3 pr-1 py-1.5 border border-gray-200 bg-white'
        : 'p-4 border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white',
    )}>
      {collapsed ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">AI Product Insights</span>
          {toggleBtn}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 mb-2 lg:mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-primary text-xs font-medium border border-indigo-100 animate-ai-shimmer shrink-0">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </span>
              <span className="hidden lg:inline text-xs font-medium text-gray-500 uppercase tracking-wider">Product Insights</span>
            </div>
            {toggleBtn}
          </div>

          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 lg:hidden">Product Insights</h3>

          <div id={contentId}>
            <p className="text-lg font-semibold text-gray-900 leading-snug mb-1.5">{question}</p>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">{summary}</p>

            {previewInsights.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2">
                {previewInsights.map((insight, idx) => (
                  <CompactCard key={insight.id} insight={insight} delay={200 + idx * 150} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

