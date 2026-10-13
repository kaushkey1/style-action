import { useMemo } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { hasPermission, getModulePermissions } from './matrix';
import type { Action, ModuleSlug } from './matrix';

export function usePermission(
  module: ModuleSlug,
  action: Action,
): boolean {
  const roleSlug = useAuthStore((s) => s.activeRoleSlug);
  return useMemo(
    () => hasPermission(roleSlug, module, action),
    [roleSlug, module, action],
  );
}

export function usePermissions<A extends Action>(
  module: ModuleSlug,
  actions: readonly A[],
): Record<A, boolean> {
  const roleSlug = useAuthStore((s) => s.activeRoleSlug);
  return useMemo(() => {
    const result = {} as Record<A, boolean>;
    for (const action of actions) {
      result[action] = hasPermission(roleSlug, module, action);
    }
    return result;
  }, [roleSlug, module, actions]);
}

export function useModulePermissions(
  module: ModuleSlug,
): Record<Action, boolean> {
  const roleSlug = useAuthStore((s) => s.activeRoleSlug);
  return useMemo(
    () => getModulePermissions(roleSlug, module),
    [roleSlug, module],
  );
}
