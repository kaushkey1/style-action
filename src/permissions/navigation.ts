/** Permission key expected from the session API for the dedicated Style Actions workspace. */
export const STYLE_ACTIONS_VIEW_PERMISSION = 'STYLEACTION_FE_GET_PRLB8Z31J';
export const STYLE_ACTIONS_PRODUCT_ID = 'style-actions';

type NavigationPermission = string | { slug?: string };

export function isStyleActionsOnly(permissions: readonly NavigationPermission[]): boolean {
  return permissions.some((permission) =>
    (typeof permission === 'string' ? permission : permission?.slug) === STYLE_ACTIONS_VIEW_PERMISSION,
  );
}

/** Keep existing navigation unless the session selects the Style Actions workspace. */
export function filterProductsByPermissions<T extends { id: string }>(
  products: readonly T[],
  permissions: readonly NavigationPermission[],
): T[] {
  const styleActionsOnly = isStyleActionsOnly(permissions);
  return products.filter((product) =>
    styleActionsOnly
      ? product.id === STYLE_ACTIONS_PRODUCT_ID
      : product.id !== STYLE_ACTIONS_PRODUCT_ID,
  );
}
