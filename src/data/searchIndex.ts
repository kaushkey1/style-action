import type { LucideIcon } from 'lucide-react';
import { products } from './navigationConfig';

export interface SearchItem {
  id: string;
  type: 'product' | 'module' | 'feature';
  label: string;
  icon: LucideIcon;
  path: string;
  route: string;
  productId?: string;
  external?: boolean;
  keywords?: string[];
}

/** Build a flat searchable index from the navigation hierarchy */
function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];

  for (const product of products) {
    items.push({
      id: product.id,
      type: 'product',
      label: product.label,
      icon: product.icon,
      path: product.label,
      route: product.defaultRoute,
      external: product.opensInNewTab,
      keywords: [product.shortLabel, product.description],
    });

    for (const l1 of product.l1Modules) {
      items.push({
        id: l1.id,
        type: 'module',
        label: l1.label,
        icon: l1.icon,
        path: `${product.label} > ${l1.label}`,
        route: l1.route,
        productId: product.id,
        external: l1.opensInNewTab,
        keywords: l1.tooltip ? [l1.tooltip] : [],
      });

      if (l1.l2Features) {
        for (const l2 of l1.l2Features) {
          items.push({
            id: l2.id,
            type: 'feature',
            label: l2.label,
            icon: l2.icon ?? l1.icon,
            path: `${product.label} > ${l1.label} > ${l2.label}`,
            route: l2.route,
            productId: product.id,
          });
        }
      }
    }
  }

  return items;
}

export const searchIndex: SearchItem[] = buildSearchIndex();
