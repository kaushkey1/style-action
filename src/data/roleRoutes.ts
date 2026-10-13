/**
 * Map of backend role slugs (returned by /v1.0/session as workspace.roleSlug)
 * to the landing dashboard URL each role should see. Used by TopBar after a
 * successful role switch. Roles not listed here fall back to /home.
 *
 * All three persona dashboards share the `/dashboard` URL — DashboardRouter
 * swaps the rendered component based on the active role. This keeps the L0/L1
 * sidebar consistent across role switches (only /dashboard is wired into the
 * Command product's L1 module list).
 *
 * Slug source of truth: BE session response. Confirmed slugs on SIT:
 *   ceo, category-head, sourcing.
 *
 * Note: the FE module is named `category-director` (post-WW rename), but the
 * BE role slug is `category-head` — do not change the slug on the FE side.
 */
export const ROLE_LANDING_ROUTES: Record<string, string> = {
  ceo: "/dashboard",
  "category-head": "/dashboard",
  sourcing: "/dashboard",
  "command-center-read-only": "/dashboard",
  "readonly-admin": "/dashboard",
};

export function getLandingRouteForRole(
  roleSlug: string | null | undefined,
): string {
  if (!roleSlug) return "/home";
  return ROLE_LANDING_ROUTES[roleSlug] ?? "/home";
}
