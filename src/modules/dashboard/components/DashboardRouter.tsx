import { useAuthStore } from '@/hooks/useAuthStore';
import { DashboardPage } from '../pages/DashboardPage';
import { CategoryDirectorDashboardPage } from '@/modules/category-director/pages/CategoryDirectorDashboardPage';
import { SourcingDashboardPage } from '@/modules/sourcing/pages/SourcingDashboardPage';

/**
 * Renders the dashboard for the current role at `/dashboard`.
 *
 * All three persona dashboards share the same URL so the L0/L1 sidebar stays
 * consistent across role switches — `/dashboard` is wired into the Command
 * product's L1 module list, so `getProductByRoute()` returns the Command
 * product and the L1 sidebar correctly shows Dashboard / Control Tower / AOP
 * / Intelligence for every role.
 *
 * Roles whose landing is `/home` (via getLandingRouteForRole) still land on
 * /home after login/role-switch. Visiting `/dashboard` intentionally always
 * renders a dashboard here — no bounce back to /home.
 */
export function DashboardRouter() {
  const roleSlug = useAuthStore((s) => s.activeRoleSlug);
  switch (roleSlug) {
    case 'category-head':
      return <CategoryDirectorDashboardPage />;
    case 'sourcing':
      return <SourcingDashboardPage />;
    case 'ceo':
    default:
      return <DashboardPage />;
  }
}
