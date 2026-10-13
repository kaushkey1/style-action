import { useNavigate, useLocation } from 'react-router-dom';
import { Home, HeadphonesIcon, CheckSquare } from 'lucide-react';
import { useNavigationStore } from '@/hooks/useNavigationStore';
import { useScreenConfig } from '@/hooks/useScreenConfig';
import { useProductNavigation } from '@/hooks/useProductNavigation';
import {
  ACTIVE_PRODUCT_IDS,
  getActiveModules,
  getProductByRoute,
  getExternalUrl,
  type L0Product,
  type L1Module,
} from '@/data/navigationConfig';

const MODULE_ID_TO_CONFIG_KEY: Record<string, string> = {
  'command-dashboard': 'dashboard',
  'cortex-store-view': 'store_view',
  'cortex-otb': 'otb',
  'cortex-range': 'range',
  'cortex-buy-plan': 'buy_plan',
  'cortex-po-review': 'po_review',
  'cortex-distribution-plan': 'dp',
  'cortex-planogram': 'planogram',
  'cortex-showroom': 'design_studio',
  'execute-inventory': 'inventory',
  'execute-calendar': 'calendar',
};

// ─── Shared nav item button ────────────────────────────────────────────────

export { NavItem } from './ConsoleNavItem';
import { NavItem } from './ConsoleNavItem';

// ─── ConsoleSidebar ────────────────────────────────────────────────────────

interface ConsoleSidebarProps {
  mode: 'l0' | 'l1';
  activeProduct?: L0Product | null;
}

export function ConsoleSidebar({ mode, activeProduct }: ConsoleSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeProductId, setActiveProduct } = useNavigationStore();
  const screenConfig = useScreenConfig();

  const { visibleProducts: permittedProducts } = useProductNavigation();
  const visibleProducts = permittedProducts.filter((p) => ACTIVE_PRODUCT_IDS.has(p.id));

  const handleSelectProduct = (product: L0Product) => {
    if (product.opensInNewTab) {
      window.open(product.externalUrl || product.defaultRoute, '_blank');
      return;
    }
    setActiveProduct(product.id);
    navigate(product.defaultRoute);
  };

  const handleGoHome = () => {
    setActiveProduct(null);
    navigate('/home');
  };

  const handleSelectL1 = (module: L1Module) => {
    if (module.opensInNewTab) {
      window.open(module.externalUrl || module.route, '_blank');
      return;
    }
    navigate(module.route);
  };

  // Determine which product is active based on current route
  const routeProduct = getProductByRoute(location.pathname);
  const currentActiveId = activeProductId ?? routeProduct?.id ?? null;

  return (
    <aside
      className="fixed left-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] w-[76px] bg-[#141414] hidden lg:flex flex-col z-50"
      role="navigation"
      aria-label={mode === 'l0' ? 'Product navigation' : `${activeProduct?.label ?? 'Product'} modules`}
    >
      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-hide">
        {mode === 'l0' ? (
          <>
            {/* Console Home */}
            <NavItem
              icon={Home}
              label="Home"
              isActive={location.pathname === '/home' || (activeProductId === null && location.pathname === '/home')}
              onClick={handleGoHome}
            />
            <div className="h-px bg-white/10 mx-2 my-1.5" />

            {/* Visible products */}
            {visibleProducts.map((product) => (
              <NavItem
                key={product.id}
                icon={product.icon}
                label={product.label}
                tooltip={product.label}
                isActive={currentActiveId === product.id}
                onClick={() => handleSelectProduct(product)}
                opensInNewTab={product.opensInNewTab}
              />
            ))}

            {/* More overflow — hidden while only 3 modules are active */}
          </>
        ) : (
          /* L1 mode — Console link + modules for the active product */
          <>
            <NavItem
              icon={Home}
              label="Home"
              tooltip="Console Home"
              onClick={handleGoHome}
            />
            <div className="h-px bg-white/10 mx-2 my-1.5" />
            {(activeProduct ? getActiveModules(activeProduct) : []).filter((module) => {
              const configKey = MODULE_ID_TO_CONFIG_KEY[module.id];
              if (!configKey) return true;
              const defaultEnabled = module.id !== 'cortex-po-review';
              return screenConfig?.modules[configKey]?.enabled ?? defaultEnabled;
            }).map((module) => {
            const modulePath = module.route.split('?')[0];
            const isModuleActive = location.pathname === modulePath ||
              (!module.end && location.pathname.startsWith(modulePath + '/')) ||
              module.l2Features?.some(
                (f) => {
                  const fPath = f.route.split('?')[0];
                  return location.pathname === fPath || location.pathname.startsWith(fPath + '/');
                }
              );

            return (
              <div key={module.id}>
                {module.group && (
                  <p className="px-2 pt-3 pb-1 text-[9px] font-semibold tracking-widest text-white/30 uppercase select-none">
                    {module.group}
                  </p>
                )}
                <NavItem
                  icon={module.icon}
                  label={module.label}
                  tooltip={module.tooltip ?? module.label}
                  isActive={isModuleActive}
                  onClick={() => handleSelectL1(module)}
                  opensInNewTab={module.opensInNewTab}
                  beta={module.beta}
                />
              </div>
            );
          })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 py-2 px-2 space-y-0.5">
        <NavItem
          icon={CheckSquare}
          label="Tasks"
          tooltip="Tasks"
          isActive={location.pathname.startsWith('/tasks')}
          onClick={() => navigate('/tasks')}
        />
        <NavItem
          icon={HeadphonesIcon}
          label="Support"
          tooltip="Support"
          onClick={() => { window.open(getExternalUrl('instadesk') ?? '#', '_blank'); }}
        />
      </div>
    </aside>
  );
}
