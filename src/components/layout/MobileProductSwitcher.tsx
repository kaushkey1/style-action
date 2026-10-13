import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui';
import { useNavigationStore } from '@/hooks/useNavigationStore';
import { products, externalRedirects, type L0Product } from '@/data/navigationConfig';
import { useToast } from '@/hooks/useToast';
import { useProductNavigation } from '@/hooks/useProductNavigation';

interface MobileProductSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductGroup {
  label: string;
  products: L0Product[];
}

const productGroups: ProductGroup[] = [
  { label: 'Core', products: products.filter((p) => ['command', 'intelligence', 'cortex', 'execute', 'style-actions', 'nextwave'].includes(p.id)) },
  { label: 'Supply Chain', products: products.filter((p) => ['costing-engine', 'procuro', 'uvp', 'intellimake', 'intellipack'].includes(p.id)) },
  { label: 'Store Ops', products: products.filter((p) => ['intellistore', 'pulsepoint', 'digital-twin'].includes(p.id)) },
  { label: 'Manufacturing', products: products.filter((p) => ['intellitrim', 'intelliloom', 'intellimasters'].includes(p.id)) },
  { label: 'Other', products: products.filter((p) => ['recon', 'analytics', 'admin'].includes(p.id)) },
];

export function MobileProductSwitcher({ isOpen, onClose }: MobileProductSwitcherProps) {
  const navigate = useNavigate();
  const { activeProductId, setActiveProduct } = useNavigationStore();
  const toast = useToast();
  const { visibleProducts, styleActionsOnly } = useProductNavigation();
  const visibleProductIds = new Set(visibleProducts.map((product) => product.id));
  const visibleGroups = productGroups.map((group) => ({
    ...group,
    products: group.products.filter((product) => visibleProductIds.has(product.id)),
  }));

  const handleSelectProduct = (product: L0Product) => {
    if (product.opensInNewTab) {
      toast.info(`Opening ${product.label} in browser...`);
      window.open(product.externalUrl || product.defaultRoute, '_blank');
      onClose();
      return;
    }
    setActiveProduct(product.id);
    navigate(product.defaultRoute);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Switch Product">
      <div className="space-y-4 pb-4">
        {visibleGroups.map((group) => {
          if (group.products.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group.label}</p>
              {/* eslint-disable-next-line design-system/prefer-metric-grid -- product nav grid, not metrics */}
              <div className="grid grid-cols-3 gap-2">
                {group.products.map((product) => {
                  const Icon = product.icon;
                  const isActive = activeProductId === product.id;
                  return (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-lg min-h-12 transition-colors',
                        'focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary',
                        isActive
                          ? 'border-2 border-primary bg-primary/5'
                          : 'border border-gray-200 hover:bg-gray-50 active:bg-gray-100',
                      )}
                    >
                      <Icon className="w-6 h-6 shrink-0 text-gray-600" />
                      <span className="text-xs text-center leading-tight text-gray-700 truncate w-full">
                        {product.label}
                      </span>
                      {product.opensInNewTab && (
                        <ExternalLink className="w-3 h-3 text-gray-400 absolute top-1 right-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* External integrations */}
        {!styleActionsOnly && externalRedirects.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">External</p>
            <div className="flex gap-2 flex-wrap">
              {externalRedirects.map((ext) => (
                <a
                  key={ext.id}
                  href={ext.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 min-h-10"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  {ext.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
