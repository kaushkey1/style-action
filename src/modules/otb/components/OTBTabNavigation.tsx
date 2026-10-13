import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { cn, getActiveTenantId } from '@/lib/utils';

const OTB_TABS = [
  { id: 'brand', label: 'Brand', path: '/otb' },
  { id: 'category', label: 'Category', path: '/otb/category' },
  // TODO: Re-enable when Core/NOOS, Fashion, Utilization views are built
  // { id: 'core-noos', label: 'Core / NOOS', path: '/otb/core-noos' },
  // { id: 'fashion', label: 'Fashion', path: '/otb/fashion' },
  // { id: 'utilization', label: 'Utilization', path: '/otb/utilization' },
] as const;

/**
 * Shared OTB tab navigation bar.
 * Derives the active tab from the current URL path (no Zustand dependency).
 * Preserves `?store=` search params across tab navigations.
 */
export function OTBTabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRbl = getActiveTenantId() === 'rbl';

  // Derive active tab from current URL
  const pathname = location.pathname;
  let activeTab = 'brand';
  if (pathname.startsWith('/otb/category')) activeTab = 'category';
  else if (pathname === '/otb/core-noos') activeTab = 'core-noos';
  else if (pathname === '/otb/fashion') activeTab = 'fashion';
  else if (pathname === '/otb/utilization') activeTab = 'utilization';

  if (isRbl) return <div className="mb-4" />;

  return (
    <div className="flex items-center gap-1 border-b border-gray-200 mb-4">
      {OTB_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.path === null;

        return (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.path) {
                const storeParam = searchParams.get('store');
                const suffix = storeParam ? `?store=${encodeURIComponent(storeParam)}` : '';
                navigate(tab.path + suffix);
              }
            }}
            disabled={isDisabled}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              isActive
                ? 'border-primary text-primary'
                : isDisabled
                  ? 'border-transparent text-gray-400 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
            title={isDisabled ? 'Select a segment from the table below' : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
