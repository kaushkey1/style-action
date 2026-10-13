import { Fragment, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ExternalLink,
  BookOpen,
  HeadphonesIcon,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { useNavigationStore } from "@/hooks/useNavigationStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useProductNavigation } from "@/hooks/useProductNavigation";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useModuleEnabled } from "@/hooks/useScreenConfig";
import { products, ACTIVE_PRODUCT_IDS, getActiveModules, getExternalUrl, type L0Product, type L1Module, getProductDefaultRoute } from "@/data/navigationConfig";

// ─── Product group sections (Design, Buy) ─────────────────────────────────
// Added 2026-06-02 (merge from origin/master, commit 9dc94312). Each group
// renders its products as ACTIVE cards under a group label.

const PRODUCT_GROUPS: { label: string; ids: string[] }[] = [
  { label: 'Design', ids: ['nextwave', 'digital-twin', 'designs'] },
  { label: 'Buy', ids: ['costing-engine', 'procuro', 'uvp', 'recon'] },
];
import { MyTasksSection } from "../components/MyTasksSection";


// ─── Coming Soon products ─────────────────────────────────────────────────
// Originally added in commit 555bd96a (MPTS-13072). These products live in
// `products` but are excluded from `ACTIVE_PRODUCT_IDS` — they render in their
// own greyed-out section with a "Coming Soon" badge to telegraph the roadmap.
// Products already shown under a PRODUCT_GROUPS section are filtered out at
// render time so nothing appears twice.

const COMING_SOON_IDS = new Set(["nextwave", "digital-twin", "intellitrim", "recon", "intelliloom"]);
// ─── Top modules helper ────────────────────────────────────────────────────

const HOME_CARD_HIDDEN_MODULES = new Set([
  "cortex-store-view",
  "jarvis-cx",
  "jarvis-store-view",
  "jarvis-store-readiness",
  "jarvis-churn",
]);

// Nav module id for the "Sales Plan" launcher quick-link, gated by the
// org_config `modules.aop.enabled` flag (visible to superdry only).
const AOP_NAV_MODULE_ID = "cortex-aop-planning";

function getTopModules(
  product: L0Product,
  hiddenModuleIds?: ReadonlySet<string>,
  count = 4,
): L1Module[] {
  const modules = getActiveModules(product).filter(
    (m) => !HOME_CARD_HIDDEN_MODULES.has(m.id) && !hiddenModuleIds?.has(m.id),
  );
  if (modules.length === 0) return [];
  return modules.slice(0, count);
}

// ─── Product Card ──────────────────────────────────────────────────────────

function ProductCard({
  product,
  onSelect,
  onSelectModule,
  disabled,
  hiddenModuleIds,
}: {
  product: L0Product;
  onSelect: (p: L0Product) => void;
  onSelectModule: (m: L1Module) => void;
  disabled?: boolean;
  hiddenModuleIds?: ReadonlySet<string>;
}) {
  const topModules = getTopModules(product, hiddenModuleIds);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div
        className={cn(
          "rounded-lg border border-gray-200 bg-white",
          "hover:border-primary/30 hover:shadow-md transition-[border-color,box-shadow] duration-200",
        )}
      >
        {/* Header: tappable, navigates to product */}
        <button
          onClick={() => onSelect(product)}
          className={cn(
            "w-full text-left p-4",
            "focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2 rounded-t-lg",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
              <product.icon className="w-5 h-5 text-primary/70" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{product.label}</h3>
                {product.opensInNewTab && <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />}
              </div>
              <p className="text-xs text-gray-500">{product.l1Modules.length} modules</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{product.description}</p>
        </button>

        {/* Module stack */}
        {topModules.length > 0 ? (
          <div className="border-t border-gray-100">
            {topModules.map((module, i) => {
              const ModIcon = module.icon;
              return (
                <Fragment key={module.id}>
                  {i > 0 && <div className="border-t border-gray-100 mx-4" />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectModule(module);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 min-h-12",
                      "focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2",
                      i === topModules.length - 1 && "rounded-b-lg",
                    )}
                  >
                    <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                      <ModIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-700 flex-1">{module.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                </Fragment>
              );
            })}
          </div>
        ) : product.l1Modules.length > 0 && (
          <div className="border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(product);
              }}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 min-h-12 rounded-b-lg",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              )}
            >
              <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                <product.icon className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm text-gray-700 flex-1">Modules</span>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-lg border group flex flex-col",
        disabled
          ? "border-gray-200 bg-gray-50 pointer-events-none"
          : "border-gray-200 bg-white hover:border-primary/30 hover:shadow-md transition-all duration-200",
      )}
    >
      {disabled && (
        <span className="absolute top-2.5 right-2.5 text-xs font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full z-10">
          Coming Soon
        </span>
      )}
      <button
        onClick={() => onSelect(product)}
        className={cn(
          "flex flex-col items-start p-4 w-full text-left flex-1",
          "focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2 rounded-lg",
        )}
      >
        <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center mb-3 transition-colors">
          <product.icon className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
            {product.label}
          </h3>
          {product.opensInNewTab && <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />}
        </div>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[2lh]">{product.description}</p>
      </button>

      {/* Module shortcuts */}
      {topModules.length > 0 ? (
        <div className="flex items-center gap-1.5 px-4 pb-4 pt-0 flex-nowrap overflow-hidden">
          {topModules.map((module) => (
            <Button
              key={module.id}
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelectModule(module);
              }}
              className="group/btn text-xs text-gray-500 hover:border-primary/30 hover:text-primary hover:bg-primary/5 h-7 px-2 gap-1 shrink-0"
            >
              {module.label}
              <ChevronRight className="w-3 h-3 transition-opacity group-hover/btn:hidden" />
              <ArrowRight className="w-3 h-3 hidden transition-opacity group-hover/btn:inline-block" />
            </Button>
          ))}
        </div>
      ) : product.l1Modules.length > 0 && (
        <div className="flex items-center gap-1.5 px-4 pb-4 pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="group/btn text-xs text-gray-500 hover:border-primary/30 hover:text-primary hover:bg-primary/5 h-7 px-2 gap-1 shrink-0"
          >
            Modules
            <ChevronRight className="w-3 h-3 transition-opacity group-hover/btn:hidden" />
            <ArrowRight className="w-3 h-3 hidden transition-opacity group-hover/btn:inline-block" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Resource Card ─────────────────────────────────────────────────────────

function ResourceCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-white",
        "hover:border-primary/30 hover:shadow-md transition-all duration-200 text-left group",
        "focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2",
      )}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors shrink-0">
        <Icon className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
}

// ─── Console Home Page ─────────────────────────────────────────────────────

export function ConsoleHomePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const setActiveProduct = useNavigationStore((s) => s.setActiveProduct);
  const user = useAuthStore((s) => s.user);
  const { visibleProducts } = useProductNavigation();

  const handleSelectProduct = (product: L0Product) => {
    if (product.opensInNewTab) {
      window.open(product.externalUrl || product.defaultRoute, "_blank");
      return;
    }
    setActiveProduct(product.id);
    navigate(getProductDefaultRoute(product));
  };

  const handleSelectModule = (module: L1Module, productId: string) => {
    if (module.opensInNewTab) {
      window.open(module.externalUrl || module.route, "_blank");
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (product?.opensInNewTab) {
      window.open(product.externalUrl || module.route, "_blank");
      return;
    }
    setActiveProduct(productId);
    navigate(module.route);
  };

  // Active modules — only the products ready for users
  // Hide external-only products (PLM) on mobile since they lack mobile-responsive UIs
  const activeProducts = visibleProducts.filter((p) =>
    ACTIVE_PRODUCT_IDS.has(p.id) && !(isMobile && p.opensInNewTab) && (p.id !== 'designs' || Boolean(p.externalUrl)),
  );

  // Sales Plan launcher quick-link is gated to orgs with modules.aop.enabled
  // (superdry only). Defaults to visible when org config is absent/loading.
  const isAopEnabled = useModuleEnabled("aop");
  const isPoReviewEnabled = useModuleEnabled("po_review", false);
  const hiddenModuleIds = useMemo<ReadonlySet<string>>(
    () => new Set([
      ...(!isAopEnabled ? [AOP_NAV_MODULE_ID] : []),
      ...(!isPoReviewEnabled ? ["cortex-po-review"] : []),
    ]),
    [isAopEnabled, isPoReviewEnabled],
  );

  // Coming-soon products — render in order of appearance in `products` (which
  // is the source-of-truth ordering for the L0 list). Filter out anything
  // already surfaced by a PRODUCT_GROUPS section to avoid duplicates.
  const productGroupIds = new Set(PRODUCT_GROUPS.flatMap((g) => g.ids));
  const comingSoonProducts = visibleProducts.filter(
    (p) => COMING_SOON_IDS.has(p.id) && !productGroupIds.has(p.id),
  );

  return (
    <div className="max-w-7xl mx-auto animate-fadeInUp">
      {/* Greeting Banner */}
      {/* eslint-disable-next-line design-system/prefer-section-header -- greeting banner, not a section header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Welcome back{user ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your command center is ready. Select a platform to get started.</p>
        </div>
      </div>

      {/* My Tasks — top 3 critical tasks for the current user */}
      <MyTasksSection />

      {/* Modules — only active products */}
      {/* eslint-disable-next-line no-restricted-syntax -- animationDelay requires inline style */}
      <section className="mb-8 animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Modules</h2>
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- product nav grid, not metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={handleSelectProduct}
              onSelectModule={(m) => handleSelectModule(m, product.id)}
              hiddenModuleIds={hiddenModuleIds}
            />
          ))}
        </div>
      </section>

      {/* Product Group Sections (Design, Buy) — rendered as active cards. */}
      {PRODUCT_GROUPS.map((group, gi) => {
        const groupProducts = group.ids
          .map((id) => visibleProducts.find((p) => p.id === id))
          .filter((p): p is L0Product => p != null);
        if (groupProducts.length === 0) return null;
        return (
          // eslint-disable-next-line no-restricted-syntax -- animationDelay requires inline style
          <section key={group.label} className="mb-8 animate-fadeInUp" style={{ animationDelay: `${(gi + 2) * 0.1}s` }}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{group.label}</h2>
            {/* eslint-disable-next-line design-system/prefer-metric-grid -- product nav grid, not metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={handleSelectProduct}
                  onSelectModule={(m) => handleSelectModule(m, product.id)}
                  hiddenModuleIds={hiddenModuleIds}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* Coming Soon — roadmap products not already shown in a group above. */}
      {comingSoonProducts.length > 0 && (
        /* eslint-disable-next-line no-restricted-syntax -- animationDelay requires inline style */
        <section className="mb-8 animate-fadeInUp" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Coming Soon</h2>
          {/* eslint-disable-next-line design-system/prefer-metric-grid -- product nav grid, not metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {comingSoonProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                disabled
                onSelect={handleSelectProduct}
                onSelectModule={(m) => handleSelectModule(m, product.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Resources & Support */}
      {/* eslint-disable-next-line no-restricted-syntax -- animationDelay requires inline style */}
      <section className="mb-8 animate-fadeInUp" style={{ animationDelay: "0.5s" }}>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resources & Support</h2>
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- resource cards, not metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ResourceCard
            icon={BookOpen}
            title="Documentation"
            description="Product guides and API reference"
            onClick={() => navigate("/docs/space-planning")}
          />
          <ResourceCard
            icon={HeadphonesIcon}
            title="InstaDesk"
            description="Contact support team"
            onClick={() => { window.open(getExternalUrl('instadesk') ?? '#', '_blank'); }}
          />
        </div>
      </section>
    </div>
  );
}
