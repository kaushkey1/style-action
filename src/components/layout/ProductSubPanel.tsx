import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getActiveModules } from '@/data/navigationConfig';
import type { L0Product } from '@/data/navigationConfig';

interface ProductSubPanelProps {
  product: L0Product;
}

export function ProductSubPanel({ product }: ProductSubPanelProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const modules = getActiveModules(product);

  return (
    <aside
      className="w-[220px] shrink-0 bg-white border-r border-gray-200 hidden lg:flex flex-col"
      role="navigation"
      aria-label={`${product.label} navigation`}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2">
        <product.icon className="w-5 h-5 text-gray-600 shrink-0" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-gray-900">{product.label}</h2>
      </div>

      {/* Module list */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {modules.map((module) => {
          const modulePath = module.route.split('?')[0];
          const isActive =
            location.pathname === modulePath ||
            (!module.end && location.pathname.startsWith(modulePath + '/'));

          return (
            <div key={module.id}>
              {module.group && (
                <p className="px-3 pt-4 pb-1 text-[10px] font-semibold tracking-widest text-gray-400 uppercase select-none">
                  {module.group}
                </p>
              )}
              <button
                onClick={() => navigate(module.route)}
                className={cn(
                  'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left transition-colors',
                  'focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-1',
                  isActive
                    ? 'bg-primary/5 text-primary font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <module.icon
                  className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : 'text-gray-400')}
                  aria-hidden="true"
                />
                <span className="text-sm truncate">{module.label}</span>
              </button>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
