import type { Product } from '../types/types';
import type { ShowroomStyle, Colorway } from '../types/showroom-types';
import type { ApiGarment } from './api';

// ── Helpers ───────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function hashStr(str: string): number {
  return str.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
}

// Map garment category to a POD
const CATEGORY_POD_MAP: Record<string, { id: string; name: string; segment: string }> = {
  'T-Shirts': { id: 'MW-2', name: 'Men Casual', segment: 'mens-casual' },
  'Shirts': { id: 'MW-1', name: 'Men Formal', segment: 'mens-formal' },
  'Jeans': { id: 'MW-2', name: 'Men Casual', segment: 'mens-casual' },
  'Trousers': { id: 'MW-1', name: 'Men Formal', segment: 'mens-formal' },
  'Dresses': { id: 'WW-1', name: 'Women Western', segment: 'womens-western' },
  'Blazers': { id: 'MW-1', name: 'Men Formal', segment: 'mens-formal' },
  'Co-Ords': { id: 'WW-1', name: 'Women Western', segment: 'womens-western' },
  'Kurtas': { id: 'WW-2', name: 'Women Ethnic', segment: 'womens-ethnic' },
  'Sarees': { id: 'WW-2', name: 'Women Ethnic', segment: 'womens-ethnic' },
  'Jackets': { id: 'MW-2', name: 'Men Casual', segment: 'mens-casual' },
};

const DEFAULT_POD = { id: 'MW-2', name: 'Men Casual', segment: 'mens-casual' };

// ── Product normalizer ────────────────────────────────────────────────────

export function normalizeGarmentToProduct(garment: ApiGarment): Product {
  const images: string[] = [];
  if (garment.images.garment) images.push(garment.images.garment);
  if (garment.images.sheet) images.push(garment.images.sheet);
  if (garment.images.artwork) images.push(garment.images.artwork);
  if (garment.images.swatch) images.push(garment.images.swatch);

  const primaryImage = garment.images.garment || '';
  const costPerUnit = garment.cost_per_unit ?? 0;
  // Estimate MRP as ~2.5x cost (typical retail markup)
  const mrp = costPerUnit > 0 ? Math.round(costPerUnit * 2.5) : 0;

  return {
    id: garment.garment_id,
    sku: garment.garment_id.slice(0, 8).toUpperCase(),
    name: toTitleCase(garment.garment_type || garment.category),
    description: garment.key_details || garment.prompt || '',
    brand: garment.brand_name,
    brandId: slugify(garment.brand_name),
    collection: garment.segment,
    collectionId: slugify(garment.segment),
    season: garment.theme_name || 'SS26',
    category: garment.category,
    images,
    primaryImage,
    thumbnailImage: primaryImage,
    colors: garment.colors ?? [],
    price: {
      mrp,
      currency: 'INR',
      wholesale_tiers: [],
    },
    sizes: [],
    materials: [garment.fabric, garment.fabric_composition].filter(Boolean).join(' — '),
    inventory: { available: true, quantity: 0, status: 'virtual' },
    metadata: {
      slide: 0,
      extracted: '',
      dimensions: { width: 0, height: 0 },
      tags: garment.added_services ?? [],
      aiTags: '',
    },
    ratings: { average: 0, count: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ── ShowroomStyle normalizer ──────────────────────────────────────────────

export function normalizeGarmentToShowroomStyle(
  garment: ApiGarment,
  index: number,
): ShowroomStyle {
  const product = normalizeGarmentToProduct(garment);
  const hash = hashStr(garment.garment_id);
  const pod = CATEGORY_POD_MAP[garment.category] ?? DEFAULT_POD;

  const costPerUnit = garment.cost_per_unit ?? 0;
  const mrp = product.price.mrp;
  const asp = Math.round(mrp * 0.85);
  const margin = costPerUnit > 0 ? Math.round(((asp - costPerUnit) / asp) * 100) : 55;
  const marginPass = margin >= 53;

  const priceTiers = ['entry', 'mid', 'premium'] as const;
  const fashionGrades = ['core', 'fashion'] as const;

  // Build colorways from the colors array
  const colorways: Colorway[] = (garment.colors ?? []).map((color, i) => ({
    id: `${garment.garment_id}-cw-${i + 1}`,
    name: color,
    colorHex: '#888888',
    images: product.images,
    fabricSwatches: garment.images.swatch ? [garment.images.swatch] : [],
    available: true,
  }));

  const style: ShowroomStyle = {
    product,

    source: 'daas',
    curationStage: 'pool',
    shortlistStatus: {
      designer: 'pending',
      buyer: 'pending',
      categoryHead: 'pending',
    },

    commercial: {
      mrp,
      asp,
      unitCost: costPerUnit,
      margin,
      marginPass,
    },

    podId: pod.id,
    podName: pod.name,
    segmentId: pod.segment,
    subCategoryId: slugify(garment.category),
    priceTier: priceTiers[hash % 3]!,
    fashionGrade: fashionGrades[index % 2]!,

    silhouetteDescription: garment.key_details || '',
    fabricType: garment.fabric || '',
    fabricSwatches: garment.images.swatch ? [garment.images.swatch] : [],
    unitCost: costPerUnit || null,

    colorways,
    activeColorwayId: null,
    moodBoardIds: [],

    agentFlags: {
      marginAlert: !marginPass,
      gapFill: hash % 7 === 0,
      conflictFlag: false,
      autoSurfaced: false,
    },
  };

  // Map BOM when available (detail fetch)
  if (garment.bom_result) {
    style.bom = {
      fabricCost: garment.bom_result.fabric_cost,
      trimsCost: garment.bom_result.trims_cost,
      cmtCost: garment.bom_result.labor_cost,
      logisticsCost: 0,
      totalLandedCost: costPerUnit,
    };
  }

  return style;
}
