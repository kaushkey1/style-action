import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileSearch, type SearchScope } from '@/hooks/useMobileSearch';
import { useNavigationStore } from '@/hooks/useNavigationStore';
import { getProductById, getProductDefaultRoute } from '@/data/navigationConfig';
import type { SearchItem } from '@/data/searchIndex';

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const scopeOptions: { value: SearchScope; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'product', label: 'Products' },
  { value: 'module', label: 'Modules' },
  { value: 'feature', label: 'Features' },
];

const typeBadgeColors: Record<string, string> = {
  product: 'bg-blue-100 text-blue-700',
  module: 'bg-green-100 text-green-700',
  feature: 'bg-purple-100 text-purple-700',
};

export function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
  const navigate = useNavigate();
  const { setActiveProduct } = useNavigationStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    query, setQuery, clearQuery,
    scope, setScope,
    results, recentSearches,
    addToRecent, removeFromRecent,
    hasQuery,
  } = useMobileSearch();

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        clearQuery();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose, clearQuery]);

  if (!isOpen) return null;

  const handleSelect = (item: SearchItem) => {
    addToRecent(item);
    if (item.external) {
      window.open(item.route, '_blank');
    } else {
      if (item.productId) setActiveProduct(item.productId);
      // For product-type results, navigate to first L1 module route
      if (item.type === 'product' && item.productId) {
        const product = getProductById(item.productId);
        if (product) {
          navigate(getProductDefaultRoute(product));
          clearQuery();
          onClose();
          return;
        }
      }
      navigate(item.route);
    }
    clearQuery();
    onClose();
  };

  const handleClose = () => {
    clearQuery();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-[#141414] px-4 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] flex items-center gap-3">
        <button
          onClick={handleClose}
          className="min-w-10 min-h-10 flex items-center justify-center text-white/70 hover:text-white rounded-lg"
          aria-label="Close search"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          {/* eslint-disable-next-line no-restricted-syntax -- dark-bg search input requires custom styling outside Input component */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, modules, features..."
            className="w-full h-10 pl-10 pr-8 text-base bg-white/10 text-white placeholder:text-white/40 rounded-lg border-0 focus:outline-none focus-kb:ring-2 focus-kb:ring-white/20"
          />
          {query && (
            <button
              onClick={clearQuery}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white min-w-8 min-h-8 flex items-center justify-center"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scope chips */}
      <div className="chip-scroll px-4 py-2 border-b border-gray-100">
        {scopeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setScope(opt.value)}
            className={cn(
              'min-h-8 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              scope === opt.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Results / Recent / Empty */}
      <div className="flex-1 overflow-y-auto">
        {hasQuery ? (
          results.length > 0 ? (
            <ul className="py-2">
              {results.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleSelect(item)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-12"
                    >
                      <Icon className="w-5 h-5 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{item.label}</p>
                        <p className="text-xs text-gray-500 truncate">{item.path}</p>
                      </div>
                      <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', typeBadgeColors[item.type] ?? 'bg-gray-100 text-gray-600')}>
                        {item.type}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500 mb-4">No results for &ldquo;{query}&rdquo;</p>
              <button
                onClick={() => {
                  clearQuery();
                  onClose();
                  // TODO: open AI chat with query pre-filled
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium min-h-11"
              >
                <Sparkles className="w-4 h-4" />
                Ask Impetus instead
              </button>
            </div>
          )
        ) : (
          <>
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="py-3">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent</p>
                <ul>
                  {recentSearches.map((item) => {
                    return (
                      <li key={item.id} className="flex items-center">
                        <button
                          onClick={() => handleSelect(item)}
                          className="flex items-center gap-3 flex-1 px-4 py-2.5 text-left hover:bg-gray-50 min-h-11"
                        >
                          <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{item.label}</span>
                          <span className="text-xs text-gray-400 truncate ml-auto shrink-0">{item.path}</span>
                        </button>
                        <button
                          onClick={() => removeFromRecent(item.id)}
                          className="px-3 py-2.5 text-gray-400 hover:text-gray-500 min-w-10 min-h-10 flex items-center justify-center"
                          aria-label={`Remove ${item.label} from recent`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Quick actions */}
            <div className="px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Exceptions', route: '/exceptions' },
                  { label: 'Calendar', route: '/calendar' },
                  { label: 'Inventory', route: '/inventory' },
                  { label: 'Approvals', route: '/approvals' },
                ].map((action) => (
                  <button
                    key={action.route}
                    onClick={() => {
                      navigate(action.route);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-3 py-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 min-h-11"
                  >
                    {action.label}
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
