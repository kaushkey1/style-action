import { useId, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button, Skeleton, DrillMenu } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getInsightDrillTargets } from "@/lib/routing";
import { CarouselDots } from "@/components/CarouselDots";
import type { InsightData, Insight } from "../api/insightsApi";

// --- Status color for the left accent ---

const STATUS_DOT: Record<string, string> = {
  critical: "bg-red-500",
  red: "bg-red-500",
  warning: "bg-amber-500",
  amber: "bg-amber-500",
  "on-track": "bg-green-500",
  green: "bg-green-500",
};

const STATUS_LABEL: Record<string, string> = {
  critical: "Critical",
  red: "Critical",
  warning: "Watch",
  amber: "Watch",
  "on-track": "On Track",
  green: "On Track",
};

// --- Parse **bold** markers in summary text ---

function renderBoldText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
      : part,
  );
}

// --- Compact insight card (shown in banner) ---

function CompactInsightCard({ insight, delay, onOpen, drillFrom = "dashboard" }: { insight: Insight; delay: number; onOpen?: (id: string) => void; drillFrom?: string }) {
  const status = insight.status ?? "";
  const dotColor = STATUS_DOT[status] ?? "bg-gray-300";
  const statusText = STATUS_LABEL[status] ?? "";
  const displayValue = insight.display_value || insight.metric || insight.value;
  const title = insight.title || insight.headline;

  const content = (
    <>
      {statusText && (
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
              status === "on-track" || status === "green"
                ? "bg-green-50 text-green-600"
                : status === "warning" || status === "amber"
                  ? "bg-amber-50 text-amber-600"
                  : status === "critical" || status === "red"
                    ? "bg-red-50 text-red-600"
                    : "bg-gray-100 text-gray-500"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            {statusText}
          </span>
        </div>
      )}
      <p className="text-sm text-gray-900 leading-snug pr-6">{title}</p>
      {displayValue && <p className="text-xs text-gray-500 mt-2">{displayValue}</p>}
    </>
  );

  return (
    <div
      className="relative w-[85%] shrink-0 snap-start rounded-lg border border-gray-200 bg-gray-50/50 p-3 opacity-0 animate-fadeInUp transition-all duration-200 hover:border-gray-300 hover:shadow-sm sm:w-auto sm:shrink sm:flex-1"
      // eslint-disable-next-line no-restricted-syntax -- staggered entrance delay for insight cards
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(insight.id)}
          aria-label={`Open insight: ${title}`}
          className="block w-full text-left cursor-pointer rounded focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary-500/30"
        >
          {content}
        </button>
      ) : (
        content
      )}
      {/* Per-insight drill kebab — top-right; targets are contextual to each insight's scope */}
      <div className="absolute top-1.5 right-1.5">
        <DrillMenu rowLabel={title} targets={getInsightDrillTargets(insight, drillFrom)} />
      </div>
    </div>
  );
}

// --- Loading skeleton ---

export function InsightsBannerSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-4" />
      <div className="flex gap-3">
        <Skeleton className="h-28 flex-1 rounded-lg" />
        <Skeleton className="h-28 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

// --- Empty / error states ---

export function InsightsEmpty({ personaLabel }: { personaLabel: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
      Daily insights for {personaLabel} will appear here once generated.
    </div>
  );
}

export function InsightsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 flex items-center justify-between gap-2">
      <span className="text-sm text-gray-500">Unable to load insights.</span>
      <Button size="sm" variant="outline" onClick={onRetry} className="text-xs">
        Retry
      </Button>
    </div>
  );
}

// --- Main banner ---

interface InsightsBannerProps {
  data: InsightData;
  onViewAll?: () => void;
  /** Open a single insight on the destination page. Host supplies the route + from-context. Omit to render non-clickable cards. */
  onOpenInsight?: (id: string) => void;
  /** Source tag for the per-card drill kebab routes (e.g. 'dashboard', 'store-view'). */
  drillFrom?: string;
}

export function InsightsBanner({ data, onViewAll, onOpenInsight, drillFrom = "dashboard" }: InsightsBannerProps) {
  const contentId = useId();
  const [collapsed, setCollapsed] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const totalInsights = data.insights.length;
  const previewInsights = data.insights.slice(0, 2);
  const showPreview = previewInsights.length > 0;

  const actionButtons = (
    <div className="flex items-center gap-0.5 shrink-0">
      {onViewAll && totalInsights > 0 && (
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80 transition-colors px-1 py-2 sm:py-1 min-h-11 lg:min-h-0"
        >
          View all ({totalInsights})
        </button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 -mr-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:ring-0"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-controls={contentId}
        aria-label={collapsed ? "Expand morning briefing" : "Collapse morning briefing"}
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
    <div className={cn(
      "rounded-lg shadow-sm animate-fadeInUp",
      collapsed
        ? "pl-3 pr-1 py-1.5 border border-gray-200 bg-white"
        : "p-4 border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white"
    )}>
      {collapsed ? (
        /* Collapsed: compact single-row */
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Morning Briefing</span>
          {actionButtons}
        </div>
      ) : (
        /* Expanded: single row on desktop, two rows on mobile */
        <>
          <div className="flex items-center justify-between gap-2 mb-2 lg:mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-primary text-xs font-medium border border-indigo-100 animate-ai-shimmer shrink-0">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </span>
              <span className="hidden lg:inline text-xs font-medium text-gray-500 uppercase tracking-wider">Morning Briefing</span>
            </div>
            {actionButtons}
          </div>

          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 lg:hidden">Morning Briefing</h3>

          <div id={contentId}>
            <p className="text-lg font-semibold text-gray-900 leading-snug mb-1.5">{data.morning_question}</p>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">{renderBoldText(data.summary)}</p>

            {showPreview && (
              <>
                {/* Mobile: horizontal snap carousel with dots; sm+: equal-width row. */}
                <div
                  ref={carouselRef}
                  className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide sm:overflow-visible"
                >
                  {previewInsights.map((insight, idx) => (
                    <CompactInsightCard
                      key={insight.id}
                      insight={insight}
                      delay={200 + idx * 150}
                      onOpen={onOpenInsight}
                      drillFrom={drillFrom}
                    />
                  ))}
                </div>
                <CarouselDots scrollRef={carouselRef} count={previewInsights.length} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
