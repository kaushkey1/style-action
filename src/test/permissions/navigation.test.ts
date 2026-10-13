import { describe, expect, it } from 'vitest';
import { filterProductsByPermissions, isStyleActionsOnly } from '@/permissions/navigation';

const products = [
  { id: 'command' },
  { id: 'cortex' },
  { id: 'execute' },
  { id: 'style-actions' },
  { id: 'admin' },
];

describe('session-driven product navigation', () => {
  it('preserves existing products and their order when no permission is granted', () => {
    expect(filterProductsByPermissions(products, []).map((product) => product.id))
      .toEqual(['command', 'cortex', 'execute', 'admin']);
  });

  it('shows only Style Action when the session grants its exact permission', () => {
    expect(filterProductsByPermissions(products, ['STYLEACTION_FE_GET_PRLB8Z31J']))
      .toEqual([{ id: 'style-actions' }]);
  });

  it('still shows only Style Action when the session also contains other permissions', () => {
    expect(filterProductsByPermissions(products, ['dashboard.view', 'STYLEACTION_FE_GET_PRLB8Z31J', 'admin.edit']))
      .toEqual([{ id: 'style-actions' }]);
  });

  it('reads the permission slug from SIT session permission objects', () => {
    const permissions = [
      { permissionId: 43, slug: 'PURCHASE_ORDERS_FE_GET_PZX6OLUG5', allowedUrl: '^/procuro/po' },
      {
        permissionId: 4435,
        featureId: 552,
        description: 'view styleaction ( frontend )',
        slug: 'STYLEACTION_FE_GET_PRLB8Z31J',
        allowedUrl: '^/styleaction',
      },
    ];
    expect(filterProductsByPermissions(products, permissions))
      .toEqual([{ id: 'style-actions' }]);
    expect(filterProductsByPermissions(products, permissions.slice(0, 1)))
      .toEqual(products.filter((product) => product.id !== 'style-actions'));
  });

  it('does not grant access for an object without the exact permission slug', () => {
    expect(isStyleActionsOnly([{}, { slug: 'STYLEACTION_FE_GET_PRLB8Z31J_EXTRA' }])).toBe(false);
  });

  it('does not infer the permission from a role name or a partial match', () => {
    for (const permission of ['style-action-admin', 'style-actions.view', 'STYLEACTION_FE_GET', 'STYLEACTION_FE_GET_PRLB8Z31J_EXTRA', 'styleaction_fe_get_prlb8z31j']) {
      expect(isStyleActionsOnly([permission])).toBe(false);
      expect(filterProductsByPermissions(products, [permission]).some((product) => product.id === 'style-actions'))
        .toBe(false);
    }
  });

  it('restores normal navigation when the permission is removed without mutating the catalog', () => {
    const catalog = Object.freeze([...products]);
    expect(filterProductsByPermissions(catalog, ['STYLEACTION_FE_GET_PRLB8Z31J'])).toHaveLength(1);
    expect(filterProductsByPermissions(catalog, [])).toHaveLength(4);
    expect(catalog).toHaveLength(5);
  });
});
