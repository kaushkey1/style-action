import { Badge } from '@/components/ui';

import type { CatalogStatus, InstanceStatus } from '../data/extensionTypes';

type BadgeVariant = 'success' | 'error' | 'warning' | 'default' | 'primary';

const INSTANCE_VARIANT_MAP: Record<InstanceStatus, BadgeVariant> = {
  enabled: 'success',
  disabled: 'default',
  suspended: 'error',
};

const CATALOG_VARIANT_MAP: Record<CatalogStatus, BadgeVariant> = {
  active: 'success',
  deprecated: 'warning',
  disabled: 'default',
};

interface ExtensionStatusBadgeProps {
  status: InstanceStatus | CatalogStatus;
  variant?: 'instance' | 'catalog';
}

export function ExtensionStatusBadge({
  status,
  variant = 'instance',
}: ExtensionStatusBadgeProps): React.ReactNode {
  const map = variant === 'catalog' ? CATALOG_VARIANT_MAP : INSTANCE_VARIANT_MAP;
  const badgeVariant = (map as Record<string, BadgeVariant>)[status] ?? 'default';

  return (
    <Badge variant={badgeVariant} size="sm" dot>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
