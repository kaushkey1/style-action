import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ConsoleSidebar } from "./ConsoleSidebar";
import { TopBar } from "./TopBar";
import { L2Panel, L2PanelToggle } from "./L2Panel";
import { ProductSubPanel } from "./ProductSubPanel";

import { MobileSplitDrawer } from "./MobileSplitDrawer";
import { MobileSearchOverlay } from "./MobileSearchOverlay";
import { MobileBottomBar } from "./MobileBottomBar";
import { ProfileBottomSheet } from "./ProfileBottomSheet";
import { MobileAIChat } from "./MobileAIChat";
// MobileAIInsightStrip removed — Ask Impetus not ready
import { ActionHistoryPanel } from "@/modules/dashboard/components/ActionHistoryPanel";
import { GlossaryModal } from "@/modules/glossary/GlossaryModal";
import { useAnalyticsIdentify } from "@/hooks/useAnalyticsIdentify";
import { useNavigationStore } from "@/hooks/useNavigationStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { usePersonaStore } from "@/hooks/usePersonaStore";
import { useScreenConfig } from "@/hooks/useScreenConfig";
import { useProductNavigation } from "@/hooks/useProductNavigation";
import {
  getProductByRoute,
  getL1ModuleByRoute,
} from "@/data/navigationConfig";
import type { PersonaId } from "@/data/personaConfig";
import { ToastContainer } from "@/components/ui";
import { ConsoleFrame } from "./ConsoleFrame";

const PERSONA_ID_SET: ReadonlySet<PersonaId> = new Set([
  "apex",
  "ceo",
  "category",
  "category-director",
  "sourcing",
  "marketing",
  "regional",
  "ops",
  "admin",
]);

export function ConsoleLayout() {
  const location = useLocation();
  useAnalyticsIdentify();
  useScreenConfig();
  const { visibleProducts } = useProductNavigation();
  const {
    activeProductId,
    setActiveProduct,
    isMobileMenuOpen,
    closeMobileMenu,
    isSearchOpen,
    setSearchOpen,
    setProductSwitcherOpen,
    setProfileSheetOpen,
  } = useNavigationStore();

  // Sync active product with URL
  useEffect(() => {
    if (location.pathname === "/home") {
      setActiveProduct(null);
      return;
    }
    const routeProduct = getProductByRoute(location.pathname);
    setActiveProduct(routeProduct?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Close all mobile overlays on route change
  useEffect(() => {
    closeMobileMenu();
    setSearchOpen(false);
    setProductSwitcherOpen(false);
    setProfileSheetOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Dynamic browser tab title based on current route
  useEffect(() => {
    const PAGE_TITLES: Record<string, string> = {
      "/home": "Home",
      "/dashboard": "Dashboard",
      "/command/aop": "AOP",
      "/aop": "AOP",
      "/review": "Action Register",
      "/agents": "Agents",
      "/agents-brain": "Brain",
      "/knowledge-base": "Brain",
      "/command/intelligence": "Intelligence",
      "/store-view": "Store View",
      "/otb": "OTB",
      "/range": "Range",
      "/inventory": "Inventory",
      "/style-actions-product": "Style Action",
      "/calendar": "Calendar",
      "/showroom": "Style Bank",
      "/admin": "Admin",
      "/designs": "Design",
      "/category-director": "Category Director",
      "/sourcing": "Sourcing",
    };
    const match = Object.keys(PAGE_TITLES).find((k) => location.pathname.startsWith(k));
    document.title = match
      ? `${PAGE_TITLES[match]} | Impetus`
      : "Impetus Command Center";
  }, [location.pathname]);

  // Mirror auth role into the persona store so insight/reset code paths that
  // read usePersonaStore stay in sync with TopBar's "Switch Role". Only
  // applies when the role slug names a valid PersonaId (e.g. business-head
  // does not, so the persona stays put).
  const activeRoleSlug = useAuthStore((s) => s.activeRoleSlug);
  const setPersona = usePersonaStore((s) => s.setPersona);
  useEffect(() => {
    if (activeRoleSlug && PERSONA_ID_SET.has(activeRoleSlug as PersonaId)) {
      setPersona(activeRoleSlug as PersonaId);
    }
  }, [activeRoleSlug, setPersona]);

  const activeProduct = activeProductId
    ? (visibleProducts.find((product) => product.id === activeProductId) ?? null)
    : null;
  const isConsoleHome = location.pathname === "/home";
  // Products with useSubPanel keep the dark rail in L0 (all products visible)
  // and show their L1 modules in a separate white sub-panel instead.
  const usesSubPanel = activeProduct?.useSubPanel === true;
  // A product with no submodules opens directly and keeps the product icons visible.
  const sidebarMode = isConsoleHome || !activeProduct || usesSubPanel || activeProduct.l1Modules.length === 0 ? "l0" : "l1";

  // Determine active L1 module for L2 panel
  const activeL1Module = activeProduct
    ? (getL1ModuleByRoute(activeProduct, location.pathname) ?? null)
    : null;

  return (
    <ConsoleFrame
      topBar={<TopBar title={activeProduct?.label ?? "Impetus Console"} />}
      sidebar={<ConsoleSidebar mode={sidebarMode} activeProduct={activeProduct} />}
      panels={<>
        {usesSubPanel && activeProduct && <ProductSubPanel product={activeProduct} />}
        {!usesSubPanel && <L2Panel activeL1Module={activeL1Module} />}
        {!usesSubPanel && <L2PanelToggle activeL1Module={activeL1Module} />}
      </>}
      overlays={<>
        <MobileSplitDrawer isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
        <MobileSearchOverlay isOpen={isSearchOpen} onClose={() => setSearchOpen(false)} />
        <MobileBottomBar />
        <ProfileBottomSheet />
        <MobileAIChat />
        <ActionHistoryPanel />
        <GlossaryModal />
        <ToastContainer />
      </>}
    ><Outlet /></ConsoleFrame>
  );
}
