import { useMemo } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { hasPermission } from './matrix';
import type { Action, ModuleSlug } from './matrix';

interface PermissionCheck {
  module: ModuleSlug;
  action: Action;
}

interface SinglePermissionProps {
  module: ModuleSlug;
  action: Action;
  permissions?: never;
}

interface MultiPermissionProps {
  module?: never;
  action?: never;
  permissions: PermissionCheck[];
}

type PermissionGateProps = (SinglePermissionProps | MultiPermissionProps) & {
  children: React.ReactNode;
  mode?: 'hide' | 'disable';
  require?: 'all' | 'any';
  fallback?: React.ReactNode;
};

export function PermissionGate({
  children,
  mode = 'hide',
  require = 'all',
  fallback = null,
  ...rest
}: PermissionGateProps): React.ReactNode {
  const roleSlug = useAuthStore((s) => s.activeRoleSlug);

  const allowed = useMemo(() => {
    const checks: PermissionCheck[] =
      'permissions' in rest && rest.permissions
        ? rest.permissions
        : [{ module: rest.module!, action: rest.action! }];

    if (require === 'any') {
      return checks.some((c) => hasPermission(roleSlug, c.module, c.action));
    }
    return checks.every((c) => hasPermission(roleSlug, c.module, c.action));
  }, [roleSlug, rest, require]);

  if (allowed) {
    return <>{children}</>;
  }

  if (mode === 'disable') {
    return (
      <div className="pointer-events-none opacity-50" aria-disabled="true">
        {children}
      </div>
    );
  }

  return <>{fallback}</>;
}
