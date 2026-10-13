import { sharedDevelopmentLogin } from '@/modules/designs/sessionIntegration';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Building2,
  Home,
  Grip,
  Layers,
  Check,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui";
import { useNavigationStore } from "@/hooks/useNavigationStore";
import { useProductNavigation } from "@/hooks/useProductNavigation";
import { TasksTopBarIcon } from "@/modules/tasks/components/TasksTopBarIcon";
import {
  type L0Product,
  getProductDefaultRoute,
} from "@/data/navigationConfig";
import { getLandingRouteForRole } from "@/data/roleRoutes";
import { useAuthStore } from "@/hooks/useAuthStore";
import { trackEvent } from "@/hooks/useAnalyticsIdentify";
import { cn } from "@/lib/utils";

/** Format role slug for display: "ceo" → "CEO", "business-head" → "Business Head". */
function formatRoleSlug(slug: string): string {
  if (slug === 'ceo') return 'CEO';
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const navigate = useNavigate();
  const { visibleProducts } = useProductNavigation();
  const activeProductId = useNavigationStore((s) => s.activeProductId);
  const setActiveProduct = useNavigationStore((s) => s.setActiveProduct);

  const user = useAuthStore((s) => s.user);
  const organizations = useAuthStore((s) => s.organizations);
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const activeRoleSlug = useAuthStore((s) => s.activeRoleSlug);
  const availableRoles = useAuthStore((s) => s.availableRoles);
  const isSwitching = useAuthStore((s) => s.isSwitching);
  const switchOrganization = useAuthStore((s) => s.switchOrganization);
  const switchRole = useAuthStore((s) => s.switchRole);
  const logout = useAuthStore((s) => s.logout);
  const { error: showLogoutError } = useToast();

  const activeOrg = organizations.find((o) => o.orgId === activeOrgId);

  const handleLogoClick = () => {
    setActiveProduct(null);
    navigate("/home");
  };

  const handleSelectProduct = (product: L0Product) => {
    trackEvent(`product_switch_${product.id}`);
    if (product.opensInNewTab) {
      window.open(product.externalUrl || product.defaultRoute, "_blank");
      return;
    }
    setActiveProduct(product.id);
    navigate(getProductDefaultRoute(product));
  };

  const handleOrgSwitch = async (orgId: number) => {
    if (orgId === activeOrgId || isSwitching) return;
    trackEvent('org_switch');
    const success = await switchOrganization(orgId);
    if (success) {
      window.location.reload();
    }
  };

  const handleRoleSwitch = async (roleSlug: string) => {
    if (roleSlug === activeRoleSlug || isSwitching) return;
    trackEvent(`role_switch_${roleSlug}`);
    const success = await switchRole(roleSlug);
    if (success) {
      // Navigate to the role's landing dashboard with a full reload —
      // preserves cache-invalidation behavior of the previous reload() call.
      window.location.assign(getLandingRouteForRole(roleSlug));
    }
  };

  const handleLogout = async () => {
    trackEvent('logout');
    if (sharedDevelopmentLogin) {
      try { await logout(); }
      catch { showLogoutError('Could not sign out everywhere. Please try again.'); return; }
    } else { logout(); }
    navigate("/login");
  };

  return (
    <header className="h-[calc(3.5rem+env(safe-area-inset-top,0px))] pt-safe bg-[#141414] flex items-center px-4 gap-2 lg:gap-4">
      {/* Hamburger — hidden on mobile, desktop sidebar handles navigation */}

      {/* Logo + product name */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className="flex items-center gap-3 select-none rounded-lg cursor-pointer min-h-11 lg:min-h-0 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-white/50"
          onClick={() => {
            if (window.innerWidth < 1024) navigate("/dashboard");
            else handleLogoClick();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (window.innerWidth < 1024) navigate("/dashboard");
              else handleLogoClick();
            }
          }}
          aria-label="Go to Dashboard"
        >
          {activeProductId ? (
            <>
              <img
                src="/impetus-logo.svg"
                alt="Impetus"
                className="h-5 w-auto object-contain transition-opacity hover:opacity-80"
              />
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-white hidden sm:block">
                  {title}
                </h1>
                {subtitle && (
                  <>
                    <span className="text-white/20 text-sm">|</span>
                    <p className="text-xs text-white/50">{subtitle}</p>
                  </>
                )}
              </div>
            </>
          ) : (
            <img
              src="/impetus-logo.svg"
              alt="Impetus"
              className="h-5 w-auto object-contain"
            />
          )}
        </div>
      </div>

      {/* Command bar — hidden for now */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        {/* App switcher dropdown — hidden (navigation via L1 sidebar) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="hidden w-8 h-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-white/50"
              aria-label="All products"
            >
              <Grip className="w-5 h-5 text-white/70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[340px] p-0"
          >
            {/* Console Home link */}
            <DropdownMenuItem
              onSelect={handleLogoClick}
              className="flex items-center gap-2 px-4 py-2.5 cursor-pointer"
            >
              <Home className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-900">
                Console Home
              </span>
            </DropdownMenuItem>
            <div className="h-px bg-gray-100" />

            {/* Product grid */}
            {/* eslint-disable-next-line design-system/prefer-metric-grid -- product nav grid, not metrics */}
            <div className="grid grid-cols-4 gap-1 px-3 py-3">
              {visibleProducts.map((product) => (
                <Tooltip key={product.id}>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      onSelect={() => handleSelectProduct(product)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer",
                        activeProductId === product.id
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700",
                      )}
                    >
                      <product.icon className="w-5 h-5 shrink-0" />
                      <span className="text-[10px] leading-tight text-center truncate w-full">
                        {product.label}
                      </span>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{product.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tasks icon — mobile only, left of profile avatar */}
        <TasksTopBarIcon />

        {/* Profile avatar — mobile only, opens ProfileBottomSheet. Always rightmost. */}
        <button
          className="lg:hidden w-11 h-11 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer"
          onClick={() => useNavigationStore.getState().setProfileSheetOpen(true)}
          aria-label="User menu"
        >
          <span className="text-xs font-medium text-white/80">
            {user
              ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
              : "??"}
          </span>
        </button>

        {/* Profile dropdown — desktop only */}
        <div className="hidden lg:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative w-10 h-10 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors cursor-pointer focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary"
                aria-label="User menu"
              >
                <span className="absolute -inset-0.5" aria-hidden="true" />
                <span className="text-xs font-medium text-white/80">
                  {user
                    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
                    : "??"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              <DropdownMenuLabel>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user ? `${user.firstName} ${user.lastName}` : "\u2014"}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email ?? ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Switch Organization — submenu */}
              {organizations.length > 1 ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isSwitching}>
                    <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                    <div className="flex flex-col">
                      <span>
                        {isSwitching ? "Switching..." : "Switch Organization"}
                      </span>
                      {activeOrg && !isSwitching && (
                        <span className="text-[10px] text-gray-400 leading-tight">
                          {activeOrg.orgName}
                        </span>
                      )}
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {organizations.map((org) => {
                      const isActive = org.orgId === activeOrgId;
                      return (
                        <DropdownMenuItem
                          key={org.orgId}
                          onSelect={() => handleOrgSwitch(org.orgId)}
                          disabled={isSwitching}
                          className={cn(
                            "cursor-pointer",
                            isSwitching && "opacity-50 cursor-wait",
                          )}
                        >
                          <span className="flex-1">{org.orgName}</span>
                          {isActive && (
                            <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : (
                <DropdownMenuItem disabled>
                  <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex flex-col">
                    <span>Switch Organization</span>
                    {activeOrg && (
                      <span className="text-[10px] text-gray-400 leading-tight">
                        {activeOrg.orgName}
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              )}

              {/* Switch Role — submenu showing current role as trigger */}
              {availableRoles.length > 1 ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={isSwitching}>
                    <Layers className="w-4 h-4 text-gray-500" />
                    {activeRoleSlug
                      ? formatRoleSlug(activeRoleSlug)
                      : "Switch Role"}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                    {availableRoles.map((role) => {
                      const isActive = role.roleSlug === activeRoleSlug;
                      return (
                        <DropdownMenuItem
                          key={role.urmId}
                          onSelect={() => handleRoleSwitch(role.roleSlug)}
                          disabled={isSwitching}
                          className={cn(
                            "cursor-pointer",
                            isSwitching && "opacity-50 cursor-wait",
                          )}
                        >
                          <span className="flex-1">
                            {formatRoleSlug(role.roleSlug)}
                          </span>
                          {isActive && (
                            <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : (
                <DropdownMenuItem disabled>
                  <Layers className="w-4 h-4 text-gray-500" />
                  {activeRoleSlug ? formatRoleSlug(activeRoleSlug) : "Role"}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                <LogOut className="w-4 h-4" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
