import { useAuthStore } from '@/hooks/useAuthStore'
import { capabilitiesFor, roleHas, type BuyingCapability } from './buyingCapabilities'

/** Does the signed-in role hold this Buying capability? */
export function useBuyingCapability(cap: BuyingCapability): boolean {
  const roleSlug = useAuthStore((s) => s.activeRoleSlug)
  return roleHas(roleSlug, cap)
}

/** Every Buying capability the signed-in role holds. */
export function useBuyingCapabilities(): BuyingCapability[] {
  const roleSlug = useAuthStore((s) => s.activeRoleSlug)
  return capabilitiesFor(roleSlug)
}
