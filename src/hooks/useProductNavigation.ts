import { useMemo } from 'react';
import { products } from '@/data/navigationConfig';
import { useAuthStore } from '@/hooks/useAuthStore';
import { filterProductsByPermissions, isStyleActionsOnly } from '@/permissions/navigation';

export function useProductNavigation() {
  const permissions = useAuthStore((state) => state.frontEndPermissions);
  const visibleProducts = useMemo(
    () => filterProductsByPermissions(products, permissions),
    [permissions],
  );

  return { visibleProducts, styleActionsOnly: isStyleActionsOnly(permissions) };
}
