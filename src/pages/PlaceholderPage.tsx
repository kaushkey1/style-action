import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { getProductByRoute, getL1ModuleByRoute } from '@/data/navigationConfig';

export function PlaceholderPage() {
  const { pathname } = useLocation();
  const product = getProductByRoute(pathname);
  const l1Module = product ? getL1ModuleByRoute(product, pathname) : undefined;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fadeInUp">
      <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-gray-100 mb-4">
        {product ? (
          <product.icon className="w-8 h-8 text-gray-400" />
        ) : (
          <Construction className="w-8 h-8 text-gray-400" />
        )}
      </div>

      {product && (
        <p className="text-xs font-medium text-primary/60 uppercase tracking-wider mb-1">
          {product.label}
          {l1Module && ` / ${l1Module.label}`}
        </p>
      )}

      <h1 className="text-lg font-semibold text-gray-900 mb-2">Page Under Construction</h1>
      <p className="text-sm text-gray-500 max-w-md">
        This module is being built. The navigation structure is in place — content will be added soon.
      </p>

      <div className="mt-6 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
        <code className="text-xs text-gray-500 font-mono">{pathname}</code>
      </div>
    </div>
  );
}
