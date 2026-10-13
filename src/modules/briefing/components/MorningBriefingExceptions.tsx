import { useId, useRef, useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { CarouselDots } from '@/components/CarouselDots';
import { cn } from '@/lib/utils';
import { useRegisterRows } from '@/modules/review/hooks/useRegisterRows';
import { BriefingCard } from './BriefingCard';
import type { InsightData } from '@/modules/store-view/api/insightsApi';
import type { EndState } from '@/modules/review/components/register/registerTokens';

const SEVERITY_ORDER: Record<string, number> = { S1: 0, S2: 1, S3: 2, S4: 3 };

function renderBoldText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
      : part,
  );
}

interface MorningBriefingExceptionsProps {
  data: InsightData;
  onViewAll?: () => void;
}

export function MorningBriefingExceptions({ data, onViewAll }: MorningBriefingExceptionsProps): React.ReactNode {
  const contentId = useId();
  const [collapsed, setCollapsed] = useState(false);
  const [endStates, setEndStates] = useState<Record<string, EndState>>({});
  const carouselRef = useRef<HTMLDivElement>(null);

  const { rows, loading: exceptionsLoading, getException } = useRegisterRows();

  const topExceptions = useMemo(() => {
    const exceptions = rows
      .filter((r) => r.kind === 'exception')
      .sort((a, b) => {
        const aOrder = a.severity ? SEVERITY_ORDER[a.severity] ?? 99 : 99;
        const bOrder = b.severity ? SEVERITY_ORDER[b.severity] ?? 99 : 99;
        return aOrder - bOrder;
      })
      .slice(0, 3);

    return exceptions
      .map((row) => {
        const exc = getException(row.id);
        return exc ? { row, exception: exc } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [rows, getException]);

  const totalExceptions = rows.filter((r) => r.kind === 'exception').length;

  const setEndState = (id: string, state: EndState): void => {
    setEndStates((prev) => ({ ...prev, [id]: state }));
  };

  const actionButtons = (
    <div className="flex items-center gap-0.5 shrink-0">
      {onViewAll && totalExceptions > 0 && (
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center text-xs font-medium text-primary transition-colors hover:text-primary/80 px-1 py-2 sm:py-1 min-h-11 lg:min-h-0"
        >
          View all ({totalExceptions})
        </button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="-mr-1 h-9 w-9 min-h-11 min-w-11 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:ring-0 sm:min-h-9 sm:min-w-9"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-controls={contentId}
        aria-label={collapsed ? 'Expand morning briefing' : 'Collapse morning briefing'}
      >
        {collapsed ? (
          <ChevronDown className="h-4 w-4" aria-hidden />
        ) : (
          <ChevronUp className="h-4 w-4" aria-hidden />
        )}
      </Button>
    </div>
  );

  return (
    <div
      className={cn(
        'animate-fadeInUp rounded-lg shadow-sm',
        collapsed
          ? 'border border-gray-200 bg-white pl-3 pr-1 py-1.5'
          : 'border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-3',
      )}
    >
      {collapsed ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Morning Briefing</span>
          {actionButtons}
        </div>
      ) : (
        <>
          <div className="mb-1.5 flex items-center justify-between gap-2 lg:mb-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="animate-ai-shimmer inline-flex shrink-0 items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                AI Generated
              </span>
              <span className="hidden text-xs font-medium uppercase tracking-wider text-gray-500 lg:inline">
                Morning Briefing
              </span>
            </div>
            {actionButtons}
          </div>

          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500 lg:hidden">
            Morning Briefing
          </h3>

          <div id={contentId}>
            <p className="mb-1.5 text-base font-semibold leading-snug text-gray-900">{data.morning_question}</p>
            <p className="mb-3 text-sm leading-relaxed text-gray-500">{renderBoldText(data.summary)}</p>

            {exceptionsLoading ? (
              <>
                {/* Mobile: horizontal carousel. sm+: row. lg: grid. */}
                {/* eslint-disable-next-line design-system/prefer-metric-grid -- skeleton card row, not metric tiles */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide sm:flex-row sm:overflow-visible lg:grid lg:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-32 w-[85%] shrink-0 animate-pulse rounded-lg border border-gray-200 bg-gray-50 sm:w-auto sm:flex-1 lg:flex-none" />
                  ))}
                </div>
              </>
            ) : topExceptions.length > 0 ? (
              <>
                {/* Mobile: horizontal snap carousel with dots; sm+: 2-col grid; lg: 3-col. */}
                <div
                  ref={carouselRef}
                  // eslint-disable-next-line design-system/prefer-metric-grid -- exception decision cards, not metric tiles
                  className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3"
                >
                  {topExceptions.map(({ row, exception }) => (
                    <div key={row.id} className="w-[85%] shrink-0 snap-start sm:w-auto">
                      <BriefingCard
                        exception={exception}
                        endState={endStates[row.id] ?? row.endState}
                        onEndStateChange={(state) => setEndState(row.id, state)}
                      />
                    </div>
                  ))}
                </div>
                <CarouselDots scrollRef={carouselRef} count={topExceptions.length} />
              </>
            ) : (
              <p className="text-sm text-gray-500">No exceptions need your attention.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
