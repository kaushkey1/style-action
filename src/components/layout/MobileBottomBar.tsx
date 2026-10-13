import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calculator, Store, TowerControl, Layers, Shirt } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useProductNavigation } from '@/hooks/useProductNavigation';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
  { id: 'review', label: 'Actions', icon: TowerControl, route: '/review' },
  { id: 'aop', label: 'AOP', icon: Calculator, route: '/command/aop' },
  { id: 'store-view', label: 'Store', icon: Store, route: '/command/store-view' },
  { id: 'categories', label: 'Categories', icon: Layers, route: '/categories' },
] as const;

const styleActionsTabs = [
  { id: 'style-actions', label: 'Style Action', icon: Shirt, route: '/style-actions-product' },
] as const;

export function MobileBottomBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { styleActionsOnly } = useProductNavigation();
  const visibleTabs = styleActionsOnly ? styleActionsTabs : tabs;

  if (!isMobile) return null;
  // Tasks is reached from any product (not just Command), so it hides the
  // Command bottom nav and uses its own back affordance + sticky Create bar.
  if (location.pathname.startsWith('/tasks')) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 pb-safe"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-14">
        {visibleTabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.route);
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.route)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 min-h-12 px-0.5 transition-colors',
                isActive ? 'text-primary' : 'text-gray-400',
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className={cn('text-xs leading-tight font-medium truncate max-w-full', isActive && 'font-semibold')}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
