import { sharedDevelopmentLogin } from '@/modules/designs/sessionIntegration';
import { useToast } from '@/hooks/useToast';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ChevronDown, ExternalLink, Home, LogOut, Check, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { BetaBadge } from '@/components/ui';
import { useNavigationStore } from '@/hooks/useNavigationStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useModuleEnabled } from '@/hooks/useScreenConfig';
import { useProductNavigation } from '@/hooks/useProductNavigation';
import { unenrollBiometric } from '@/modules/auth/api/biometric';
import {
  type L0Product,
  type L1Module,
  getProductDefaultRoute,
  getExternalUrl,
} from '@/data/navigationConfig';

interface MobileSplitDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSplitDrawer({ isOpen, onClose }: MobileSplitDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeProductId, setActiveProduct } = useNavigationStore();
  const isPoReviewEnabled = useModuleEnabled('po_review', false);
  const activeRoleSlug = useAuthStore((s) => s.activeRoleSlug);
  const availableRoles = useAuthStore((s) => s.availableRoles);
  const isSwitching = useAuthStore((s) => s.isSwitching);
  const switchRole = useAuthStore((s) => s.switchRole);
  const logout = useAuthStore((s) => s.logout);
  const { error: showLogoutError } = useToast();
  const { visibleProducts } = useProductNavigation();
  const [selectedProductState, setSelectedProduct] = useState<L0Product | null>(null);
  const selectedProduct = selectedProductState && visibleProducts.some((product) => product.id === selectedProductState.id)
    ? selectedProductState
    : null;
  const [isRoleListOpen, setIsRoleListOpen] = useState(false);

  const formatRoleSlug = (slug: string): string =>
    slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  // Close on route change
  useEffect(() => {
    if (isOpen) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Reset to L1 when closed
  useEffect(() => {
    if (!isOpen) {
      // Small delay so exit animation completes before resetting
      const t = setTimeout(() => {
        setSelectedProduct(null);
        setIsRoleListOpen(false);
      }, 300);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isOpen]);

  // Escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  const handleSelectProduct = (product: L0Product) => {
    if (product.opensInNewTab) {
      const url = getExternalUrl(product.id) || product.externalUrl || product.defaultRoute;
      window.open(url, '_blank');
      return;
    }
    // If product has modules, drill into Level 2
    if (product.l1Modules.length > 0) {
      setSelectedProduct(product);
    } else {
      setActiveProduct(product.id);
      navigate(getProductDefaultRoute(product));
    }
  };

  const handleSelectModule = (mod: L1Module) => {
    if (mod.opensInNewTab) {
      const url = getExternalUrl(mod.id) || mod.externalUrl || mod.route;
      window.open(url, '_blank');
      return;
    }
    if (selectedProduct) {
      setActiveProduct(selectedProduct.id);
    }
    navigate(mod.route);
  };

  const handleBack = () => {
    setSelectedProduct(null);
  };

  const handleLogout = async () => {
    if (sharedDevelopmentLogin) {
      try { await logout(); }
      catch { showLogoutError('Could not sign out everywhere. Please try again.'); return; }
      unenrollBiometric();
    } else {
      unenrollBiometric();
      logout();
    }
    onClose();
    navigate('/login');
  };

  const handleRoleSwitch = async (roleSlug: string) => {
    if (roleSlug === activeRoleSlug || isSwitching) return;
    const success = await switchRole(roleSlug);
    if (success) {
      onClose();
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Navigation drawer">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            className="absolute top-0 left-0 bottom-0 bg-white flex flex-col overflow-hidden pt-12"
            // eslint-disable-next-line no-restricted-syntax -- CSS min() for responsive drawer width
            style={{ width: 'min(320px, 85vw)' }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              {selectedProduct ? (
                /* Level 2 — Modules for selected product */
                <motion.div
                  key="l2"
                  className="flex flex-col flex-1 min-h-0"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                >
                  {/* Header */}
                  <div className="flex items-center px-4 py-3 border-b border-gray-100 shrink-0">
                    <button
                      onClick={handleBack}
                      className="min-h-10 flex items-center gap-1 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors min-w-0"
                      aria-label={`Back to ${selectedProduct.label}`}
                    >
                      <ChevronLeft className="w-5 h-5 shrink-0 -ml-1.5" />
                      <span className="text-sm font-semibold truncate">{selectedProduct.label}</span>
                    </button>
                  </div>

                  {/* Module list */}
                  <div className="flex-1 overflow-y-auto py-1">
                    {selectedProduct.l1Modules.filter((mod) => mod.id !== 'cortex-po-review' || isPoReviewEnabled).map((mod) => {
                      const isActive = location.pathname === mod.route ||
                        location.pathname.startsWith(mod.route + '/');
                      const Icon = mod.icon;
                      return (
                        <button
                          key={mod.id}
                          onClick={() => handleSelectModule(mod)}
                          className={cn(
                            'flex items-center gap-3 w-full px-4 py-3 text-left min-h-12 transition-colors',
                            isActive
                              ? 'bg-primary/5 text-primary font-medium'
                              : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100',
                          )}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-sm flex-1 truncate">{mod.label}</span>
                          {mod.beta && <BetaBadge size="sm" className="shrink-0" />}
                          {mod.opensInNewTab && (
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                /* Level 1 — All products */
                <motion.div
                  key="l1"
                  className="flex flex-col flex-1 min-h-0"
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                >
                  {/* Product list */}
                  <div className="flex-1 overflow-y-auto py-1">
                    {/* Console Home */}
                    <button
                      onClick={() => {
                        setActiveProduct(null);
                        navigate('/home');
                      }}
                      className={cn(
                        'flex items-center gap-3 w-full px-4 py-3 text-left min-h-12 transition-colors',
                        !activeProductId
                          ? 'bg-primary/5 text-primary font-medium'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100',
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        !activeProductId ? 'bg-primary/10' : 'bg-gray-100',
                      )}>
                        <Home className={cn('w-4 h-4', !activeProductId ? 'text-primary' : 'text-gray-500')} />
                      </div>
                      <span className="text-sm flex-1 truncate">Console Home</span>
                    </button>
                    <div className="h-px bg-gray-100 mx-4" />
                    {visibleProducts.filter((p) => !p.opensInNewTab).map((product) => {
                      const isActive = activeProductId === product.id;
                      const Icon = product.icon;

                      return (
                        <button
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className={cn(
                            'flex items-center gap-3 w-full px-4 py-3 text-left min-h-12 transition-colors',
                            isActive
                              ? 'bg-primary/5 text-primary font-medium'
                              : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100',
                          )}
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                            isActive ? 'bg-primary/10' : 'bg-gray-100',
                          )}>
                            <Icon className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-gray-500')} />
                          </div>
                          <span className="text-sm flex-1 truncate">{product.label}</span>
                          {product.opensInNewTab ? (
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          ) : product.l1Modules.length > 0 ? (
                            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
            <div className="shrink-0 border-t border-gray-100 bg-white px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
              <div className="px-2 py-1">
                <button
                  type="button"
                  onClick={() => {
                    if (availableRoles.length > 1) setIsRoleListOpen((v) => !v);
                  }}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2.5 text-left rounded-lg border border-gray-100 text-gray-700 transition-colors',
                    availableRoles.length > 1 && 'hover:bg-gray-50 active:bg-gray-100',
                  )}
                  aria-expanded={availableRoles.length > 1 ? isRoleListOpen : undefined}
                  aria-label={availableRoles.length > 1 ? 'Toggle role list' : 'Current role'}
                >
                  <Layers className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Role</span>
                  <span className="text-sm font-medium text-gray-700 flex-1 truncate">
                    {activeRoleSlug ? formatRoleSlug(activeRoleSlug) : 'No role assigned'}
                  </span>
                  {availableRoles.length > 1 && (
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-gray-400 shrink-0 transition-transform',
                        isRoleListOpen && 'rotate-180',
                      )}
                    />
                  )}
                </button>

                {availableRoles.length > 1 && isRoleListOpen && (
                  <div className="mt-1.5 rounded-lg border border-gray-100 overflow-hidden max-h-44 overflow-y-auto">
                    {availableRoles.map((role) => {
                      const isActive = role.roleSlug === activeRoleSlug;
                      return (
                        <button
                          key={role.urmId}
                          type="button"
                          onClick={() => void handleRoleSwitch(role.roleSlug)}
                          disabled={isSwitching}
                          className={cn(
                            'flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm transition-colors',
                            isActive
                              ? 'bg-primary/5 text-primary font-medium'
                              : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100',
                            isSwitching && 'opacity-60 cursor-wait',
                          )}
                        >
                          <span className="flex-1 truncate">{formatRoleSlug(role.roleSlug)}</span>
                          {isActive && <Check className="w-4 h-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-left min-h-12 rounded-lg text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" aria-hidden />
                <span className="text-sm font-medium">Log out</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
