import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  // ChevronRight,
  Target,
} from "lucide-react";
import { Badge, Button, BottomSheet } from "@/components/ui";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { InsightData, Insight, AgentAction } from "../api/insightsApi";

const STATUS_BADGE: Record<string, { variant: "error" | "warning" | "success"; label: string }> = {
  critical: { variant: "error", label: "Critical" },
  warning: { variant: "warning", label: "Warning" },
  "on-track": { variant: "success", label: "On Track" },
};

// --- Deep link heuristic ---

// function guessDeepLink(insight: Insight): { label: string; path: string } | null {
//   const h = insight.headline.toLowerCase();
//   if (h.includes('inventory') || h.includes('aged') || h.includes('stock'))
//     return { label: 'Go to Inventory & Lifecycle', path: '/?tab=lifecycle' };
//   if (h.includes('gm') || h.includes('margin') || h.includes('category'))
//     return { label: 'Go to Category Performance', path: '/?tab=pnl' };
//   if (h.includes('store') || h.includes('format'))
//     return { label: 'Go to Store Rankings', path: '/?tab=store-rankings' };
//   return null;
// }

// --- Sidebar insight card ---

function SidebarInsightCard({ insight }: { insight: Insight }) {
  const status = insight.status ? STATUS_BADGE[insight.status] : null;
  // const link = guessDeepLink(insight);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {/* Badges */}
      {(status || insight.tag) && (
        <div className="flex items-center gap-2 mb-2">
          {status && (
            <Badge variant={status.variant} size="sm">
              {status.label}
            </Badge>
          )}
          {insight.tag && (
            <Badge variant="outline" size="sm">
              {insight.tag}
            </Badge>
          )}
        </div>
      )}

      {/* Headline */}
      <h4 className="text-sm font-semibold text-gray-900 mb-2">{insight.headline}</h4>

      {/* Detail */}
      <p className="text-sm text-gray-500 mb-3 leading-relaxed">{insight.detail}</p>

      {/* Metric */}
      {insight.metric && <p className="text-xs text-gray-400 mb-3">{insight.metric}</p>}

      {/* Action recommendation */}
      {insight.action && (
        <div className="bg-gray-50 rounded-md px-3 py-2.5 flex items-start gap-2 mb-3">
          <Target className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
          <span className="text-sm text-gray-700">{insight.action}</span>
        </div>
      )}

      {/* Deep link */}
      {/* {link && (
        <a
          href={link.path}
          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-700"
        >
          <ChevronRight className="w-3.5 h-3.5" />
          {link.label}
        </a>
      )} */}

      {/* Delta */}
      {insight.delta && <p className="text-xs text-gray-400 italic mt-2">{insight.delta}</p>}
    </div>
  );
}

// --- Agent action card ---

function AgentActionCard({ action }: { action: AgentAction }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-900 mb-1.5">
        <span className="font-semibold">{action.agent_name}</span> &mdash; {action.action}
      </p>
      <Badge variant="success" size="sm">
        {action.outcome}
      </Badge>
    </div>
  );
}

// --- Main sidebar ---

interface InsightsSidebarProps {
  data: InsightData;
  open: boolean;
  onClose: () => void;
}

function InsightsContent({ data }: { data: InsightData }): React.ReactNode {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 leading-relaxed">{data.summary}</div>

      {/* All Insights */}
      {data.insights.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">All Insights</h3>
          <div className="space-y-4">
            {data.insights.map((insight) => (
              <SidebarInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Agent Overnight Actions */}
      {data.agent_actions.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Agent Overnight Actions</h3>
          <div className="space-y-3">
            {data.agent_actions.map((action, i) => (
              <AgentActionCard key={i} action={action} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function InsightsSidebar({ data, open, onClose }: InsightsSidebarProps) {
  const isMobile = useIsMobile();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape (desktop sidebar only)
  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isMobile]);

  // Focus trap: focus panel on open (desktop only)
  useEffect(() => {
    if (open && !isMobile) panelRef.current?.focus();
  }, [open, isMobile]);

  // Lock page scroll while sidebar is open.
  useEffect(() => {
    if (!open) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  if (!open) return null;

  // Mobile: BottomSheet
  if (isMobile) {
    return (
      <BottomSheet isOpen={open} onClose={onClose} title="All Insights" maxHeight="85vh">
        <InsightsContent data={data} />
      </BottomSheet>
    );
  }

  // Desktop: Right sidebar (existing behavior)
  return createPortal(
    <>
      {/* Overlay */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- overlay dismiss */}
      <div className="fixed inset-0 bg-black/40 z-40 animate-fadeIn" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label="Business Insights"
        className="fixed top-0 right-0 h-dvh w-full max-w-[480px] bg-white z-50 shadow-xl flex flex-col animate-slideInRight outline-none"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-lg font-bold text-gray-900">Business Insights</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-1 -mr-1">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">{data.morning_question}</p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <InsightsContent data={data} />
        </div>
      </div>
    </>,
    document.body,
  );
}
