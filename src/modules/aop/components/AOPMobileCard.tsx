import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AOPMobileCardProps {
  title: string;
  metrics: { label: ReactNode; value: ReactNode }[];
  onClick: () => void;
  className?: string;
  /** Optional status/RAG badge shown right of the title. */
  badge?: ReactNode;
  /** Show chevron icon on the right. Default true. Set false for leaf-level cards. */
  showChevron?: boolean;
}

export function AOPMobileCard({ title, metrics, onClick, className, badge, showChevron = true }: AOPMobileCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left bg-white rounded-lg border border-gray-200 p-3",
        "hover:border-primary/30 hover:shadow-md transition-all duration-200",
        "focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">{title}</h3>
          {badge}
        </div>
        {showChevron && <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {metrics.map((m, idx) => (
          <div key={typeof m.label === "string" ? m.label : idx}>
            <span className="text-xs text-gray-500 flex items-center gap-1">{m.label}</span>
            <span className="text-sm font-medium text-gray-900 tabular-nums">{m.value}</span>
          </div>
        ))}
      </div>
    </button>
  );
}
