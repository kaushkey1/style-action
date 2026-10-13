import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useNavigationStore } from '@/hooks/useNavigationStore';
import { useFeatureFlag } from '@/hooks/useScreenConfig';
import type { L1Module } from '@/data/navigationConfig';

interface L2PanelProps {
  activeL1Module: L1Module | null;
}

function useHasVisibleL2Features(activeL1Module: L1Module | null): boolean {
  const showReviewExceptionView = useFeatureFlag('otb', 'show_review_exception_view');
  const showTestScaleView = useFeatureFlag('buy_plan', 'show_test_scale_view', false);

  return Boolean(activeL1Module?.l2Features?.length)
    && (activeL1Module?.id !== 'cortex-otb' || showReviewExceptionView)
    && (activeL1Module?.id !== 'cortex-buy-plan' || showTestScaleView);
}

export function L2Panel({ activeL1Module }: L2PanelProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isL2PanelCollapsed } = useNavigationStore();

  const hasL2Features = useHasVisibleL2Features(activeL1Module);

  if (!hasL2Features || isL2PanelCollapsed) return null;

  const fullPath = location.pathname + location.search;

  return (
    <aside
      className="w-[200px] shrink-0 bg-white border-r border-gray-200 hidden lg:flex flex-col"
      role="navigation"
      aria-label={`${activeL1Module!.label} sub-features`}
    >
      {/* Header */}
      { }
      <div className="px-3 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
          {activeL1Module!.label}
        </h3>
      </div>

      {/* L2 features list */}
      <nav className="flex-1 overflow-y-auto py-1.5 px-2">
        {activeL1Module!.l2Features!.map((feature) => {
          const isActive = feature.route.includes('?')
            ? fullPath === feature.route
            : location.pathname === feature.route || (
                location.pathname.startsWith(feature.route + '/') &&
                !activeL1Module!.l2Features!.some(
                  (other) => other.id !== feature.id &&
                    other.route.length > feature.route.length &&
                    location.pathname.startsWith(other.route)
                )
              );

          return (
            <button
              key={feature.id}
              onClick={() => navigate(feature.route)}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-colors',
                'focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2',
                isActive
                  ? 'bg-primary/5 text-primary font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {feature.icon && <feature.icon className="w-4 h-4 shrink-0" />}
              <span className="text-sm truncate">{feature.label}</span>
            </button>
          );
        })}
      </nav>

    </aside>
  );
}

// Floating collapse/expand button — rendered separately in ConsoleLayout
export function L2PanelToggle({ activeL1Module }: L2PanelProps) {
  const { isL2PanelCollapsed, toggleL2Panel } = useNavigationStore();
  const hasL2Features = useHasVisibleL2Features(activeL1Module);
  if (!hasL2Features) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleL2Panel}
      className={cn(
        'absolute z-40 w-5 h-8 bg-white border border-gray-200 border-l-0 rounded-r-lg rounded-l-none shadow-sm hover:bg-gray-50 hidden lg:flex',
        isL2PanelCollapsed ? 'left-0 bottom-12' : 'left-[200px] bottom-12',
      )}
      aria-label={isL2PanelCollapsed ? 'Expand sub-features panel' : 'Collapse sub-features panel'}
    >
      {isL2PanelCollapsed ? (
        <ChevronRight className="w-3 h-3 text-gray-400" />
      ) : (
        <ChevronLeft className="w-3 h-3 text-gray-400" />
      )}
    </Button>
  );
}
