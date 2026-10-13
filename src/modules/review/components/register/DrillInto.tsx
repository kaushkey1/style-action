import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { getRegisterDrillTargets } from './drillTargets';

/** Inline "Drill into" chip row for the detail pane. On mobile it becomes a
    2-per-row grid inside a bordered container, matching the AI Analysis /
    Suggested solution / Feedback cards; desktop keeps the compact chip row. */
export function DrillInto({ category }: { category: string }): React.ReactNode {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const targets = getRegisterDrillTargets(category);
  if (targets.length === 0) return null;

  if (isMobile) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Drill into</p>
        <div className="grid grid-cols-2 gap-2">
          {targets.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(t.to)}
                className="flex min-h-11 w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-left">{t.label}</span>
                <ArrowUpRight className="h-3 w-3 shrink-0 text-gray-400" aria-hidden />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-gray-500">Drill into</p>
      <div className="flex flex-wrap gap-1.5">
        {targets.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => navigate(t.to)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 min-h-11 lg:min-h-0 text-xs text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary/40"
            >
              <Icon className="h-3.5 w-3.5 text-gray-400" aria-hidden />
              {t.label}
              <ArrowUpRight className="h-3 w-3 text-gray-400" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
  );
}
