import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Calculator, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge, DrillMenu } from '@/components/ui';
import { getInsightDrillTargets } from '@/lib/routing';
import { useFeedbackCardAffordance } from './feedback/FeedbackCardAffordance';
import type { Insight } from '@/modules/store-view/api/insightsApi';

const STATUS_VARIANT: Record<string, 'error' | 'warning' | 'success' | 'default'> = {
  critical: 'error',
  red: 'error',
  warning: 'warning',
  amber: 'warning',
  'on-track': 'success',
  green: 'success',
  grey: 'default',
};

const TAG_CONFIG: Record<string, { label: string; variant: 'warning' | 'info' | 'success' }> = {
  'needs-decision': { label: 'Needs Decision', variant: 'warning' },
  decision: { label: 'Needs Decision', variant: 'warning' },
  monitoring: { label: 'Monitoring', variant: 'info' },
  'auto-handled': { label: 'Auto-Handled', variant: 'success' },
};

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps): React.ReactNode {
  const [calcExpanded, setCalcExpanded] = useState(false);
  const tagCfg = insight.tag ? TAG_CONFIG[insight.tag] : null;
  const { trigger, inlineForm, bottomSheet } = useFeedbackCardAffordance(insight.id);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the card into view when the accordion expands so the new
  // content doesn't get cut off below the viewport. `block: 'nearest'` is
  // a no-op when the card already fits, and aligns the bottom edge with
  // the viewport bottom when the expanded content overflows.
  useEffect(() => {
    if (!calcExpanded || !rootRef.current) return;
    const el = rootRef.current;
    const frame = requestAnimationFrame(() => {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [calcExpanded]);

  const displayTitle = insight.title || insight.headline;
  const displayDetail = insight.description || insight.detail;
  const displayValue = insight.display_value || insight.value || insight.metric;
  const statusVariant = insight.status ? STATUS_VARIANT[insight.status] ?? 'default' : 'default';

  return (
    <div ref={rootRef} data-insight-anchor={insight.id} className="border-b border-gray-100 last:border-b-0 bg-white group transition-colors">
      <div className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
        {/* Status indicator */}
        {insight.status && (
          <div className="mt-1 shrink-0">
            <Badge variant={statusVariant} dot size="sm">{' '}</Badge>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            {insight.calc ? (
              <button
                type="button"
                onClick={() => setCalcExpanded((v) => !v)}
                className="text-left text-base font-medium text-gray-900 line-clamp-2 flex-1 hover:text-primary-700 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary-500/30 rounded"
                aria-expanded={calcExpanded}
              >
                {displayTitle}
              </button>
            ) : (
              <p className="text-base font-medium text-gray-900 line-clamp-2 flex-1">{displayTitle}</p>
            )}
          </div>

          {displayDetail && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{displayDetail}</p>
          )}

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {tagCfg && (
              <Badge variant={tagCfg.variant} size="sm">
                {tagCfg.label}
              </Badge>
            )}
            {insight.sub_domain && (
              <Badge variant="outline" size="sm">
                {insight.sub_domain}
              </Badge>
            )}
            {insight.category && (
              <Badge variant="outline" size="sm">
                {insight.category}
              </Badge>
            )}
            {insight.relevant_segments?.map((seg) => (
              <Badge key={seg} variant="outline" size="sm">
                {seg}
              </Badge>
            ))}
            {insight.relevant_formats?.map((fmt) => (
              <Badge key={fmt} variant="outline" size="sm">
                {fmt}
              </Badge>
            ))}
          </div>

          {/* How is it Derived? — toggle (min touch target 44px via min-h + padding) */}
          {insight.calc && (
            <button
              onClick={() => setCalcExpanded(!calcExpanded)}
              className="flex items-center gap-1.5 mt-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors min-h-[44px] md:min-h-0 py-2 md:py-0"
              aria-expanded={calcExpanded}
              aria-label="How is it Derived?"
            >
              {calcExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              How is it Derived?
            </button>
          )}

          {insight.action && !insight.calc && (
            <p className="text-sm text-gray-500 mt-1.5">{insight.action}</p>
          )}
        </div>

        {/* Right gutter: kebab (top-right, right-most action) + value + delta + feedback */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <DrillMenu rowLabel={displayTitle} targets={getInsightDrillTargets(insight, 'review')} />
          {displayValue && (
            <span className={cn(
              'text-sm font-bold tabular-nums tracking-tight',
              statusVariant === 'error'
                ? 'text-red-700'
                : statusVariant === 'warning'
                  ? 'text-amber-700'
                  : statusVariant === 'success'
                    ? 'text-green-700'
                    : 'text-gray-900',
            )}>
              {displayValue}
            </span>
          )}
          {insight.delta && (
            <span className="text-sm text-gray-500 tabular-nums">
              {insight.delta}
            </span>
          )}
          {trigger}
        </div>
      </div>

      {/* Expandable calc section */}
      {calcExpanded && insight.calc && (
        <div className="mx-4 mb-4 border-l-2 border-gray-200 pl-4 space-y-3">
          {/* What this metric means */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm font-semibold text-gray-900">What this metric means</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {insight.calc.what}
            </p>
          </div>

          {/* How we calculate it */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Calculator className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm font-semibold text-gray-900">How we calculate it</span>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
              <p className="text-sm text-gray-700 font-mono leading-relaxed">
                {insight.calc.plain}
              </p>
            </div>
          </div>

          {/* Worked example */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-sm font-semibold text-gray-900">Worked example with today&apos;s numbers</span>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {insight.calc.example}
              </p>
            </div>
          </div>
        </div>
      )}

      {inlineForm}
      {bottomSheet}
    </div>
  );
}
