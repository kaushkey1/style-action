import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui";

interface StoreMobileCardProps {
  title: string;
  metrics: { label: ReactNode; value: ReactNode }[];
  /** Navigate to the store detail page (also fired by tapping the card body). */
  onView: () => void;
  /** Open the drill-down bottom sheet for this store. */
  onDrill: () => void;
  /** Optional status/RAG badge shown right of the title. */
  badge?: ReactNode;
}

/**
 * Mobile store card — maps the desktop table row actions to a card:
 * tapping the body (or "View store") opens the store detail page; "Drill down"
 * opens the drill bottom sheet. Footer mirrors the Action Register card pattern.
 */
export function StoreMobileCard({
  title,
  metrics,
  onView,
  onDrill,
  badge,
}: StoreMobileCardProps): React.ReactNode {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      <div
        role="button"
        tabIndex={0}
        aria-label={`View ${title}`}
        onClick={onView}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onView();
          }
        }}
        className="cursor-pointer p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900">{title}</h3>
          {badge}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {metrics.map((m, idx) => (
            <div key={typeof m.label === "string" ? m.label : idx}>
              <span className="flex items-center gap-1 text-xs text-gray-500">{m.label}</span>
              <span className="block text-sm font-medium text-gray-900 tabular-nums">{m.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 p-3">
        <Button
          variant="outline"
          size="md"
          className="relative min-h-10 flex-1"
          onClick={onDrill}
        >
          <span className="absolute inset-x-0 top-1/2 h-11 -translate-y-1/2 lg:hidden" aria-hidden />
          Drill down
        </Button>
        <Button
          variant="primary"
          size="md"
          className="relative min-h-10 flex-1"
          onClick={onView}
        >
          <span className="absolute inset-x-0 top-1/2 h-11 -translate-y-1/2 lg:hidden" aria-hidden />
          <Eye className="h-3.5 w-3.5" />
          View store
        </Button>
      </div>
    </div>
  );
}
