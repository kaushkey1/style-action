// ─── Merchandise Hierarchy Types ───────────────────────────────────────────

export interface MerchandiseHierarchy {
  segment: string;
  family: string;
  class: string;
  brick: string;
}

export interface AttributeProfile {
  silhouette: string[];
  fabricSplit: { fabric: string; percentage: number }[];
  prints: string[];
  colors: string[];
  pricePoint: { min: number; max: number; primary: string };
}

export interface HierarchyLevel {
  id: string;
  name: string;
  parent?: string;
  level: 'segment' | 'family' | 'class' | 'brick';
  optionCount: number;
  stockQty: number;
  revenue: number;
  sellThrough: number;
  attributes: AttributeProfile;
  children?: HierarchyLevel[];
}

export interface StoreSpacePlan {
  storeId: string;
  storeName: string;
  totalSFT: number;
  segments: SegmentSpaceAllocation[];
}

export interface SegmentSpaceAllocation {
  segmentId: string;
  segmentName: string;
  allocatedSFT: number;
  percentage: number;
  fixtures: FixtureAllocation[];
  plannedRevenue: number;
  actualRevenue?: number;
  efficiency: number;
}

export interface FixtureAllocation {
  fixtureType: string;
  count: number;
  sftPerFixture: number;
  totalSFT: number;
  maxCapacity: number;
  currentUtilization: number;
}

// ─── 8 Core Segments Based on POD Structure ────────────────────────────────

export const coreSegments = [
  'MC', // Men's Casuals
  'MF', // Men's Formals
  'WIW', // Women's Indian Wear
  'WWW', // Women's Western Wear
  'KW', // Kids Wear
  'FW', // Footwear
  'NA', // Non-Apparel
  'EB'  // External Brands
] as const;

export type CoreSegment = typeof coreSegments[number];

// ─── Merchandise Hierarchy Data ─────────────────────────────────────────────

export const merchandiseHierarchy: HierarchyLevel[] = [
  // Men's Casuals
  {
    id: 'MC',
    name: "Men's Casuals",
    level: 'segment',
    optionCount: 428,
    stockQty: 89650,
    revenue: 18900000,
    sellThrough: 72,
    attributes: {
      silhouette: ['Slim Fit', 'Regular Fit', 'Relaxed Fit'],
      fabricSplit: [
        { fabric: 'Cotton', percentage: 45 },
        { fabric: 'Cotton Blend', percentage: 30 },
        { fabric: 'Linen', percentage: 15 },
        { fabric: 'Synthetic', percentage: 10 }
      ],
      prints: ['Solid', 'Stripes', 'Checks', 'Geometric'],
      colors: ['Navy', 'White', 'Gray', 'Black', 'Blue', 'Green'],
      pricePoint: { min: 499, max: 2999, primary: '₹799-1499' }
    },
    children: [
      {
        id: 'MC_SHIRTS',
        name: 'Shirts',
        parent: 'MC',
        level: 'family',
        optionCount: 180,
        stockQty: 37800,
        revenue: 8200000,
        sellThrough: 75,
        attributes: {
          silhouette: ['Slim Fit', 'Regular Fit'],
          fabricSplit: [
            { fabric: 'Cotton', percentage: 60 },
            { fabric: 'Cotton Blend', percentage: 25 },
            { fabric: 'Linen', percentage: 15 }
          ],
          prints: ['Solid', 'Stripes', 'Checks'],
          colors: ['White', 'Blue', 'Gray', 'Navy'],
          pricePoint: { min: 699, max: 1999, primary: '₹899-1499' }
        },
        children: [
          {
            id: 'MC_CASUAL_SHIRTS',
            name: 'Casual Shirts',
            parent: 'MC_SHIRTS',
            level: 'class',
            optionCount: 120,
            stockQty: 25200,
            revenue: 5400000,
            sellThrough: 78,
            attributes: {
              silhouette: ['Slim Fit', 'Regular Fit'],
              fabricSplit: [
                { fabric: 'Cotton', percentage: 65 },
                { fabric: 'Cotton Blend', percentage: 35 }
              ],
              prints: ['Solid', 'Stripes', 'Checks'],
              colors: ['Blue', 'Gray', 'Navy', 'Green'],
              pricePoint: { min: 699, max: 1499, primary: '₹899-1299' }
            },
            children: [
              {
                id: 'MC_OXFORD_SHIRTS',
                name: 'Oxford Shirts',
                parent: 'MC_CASUAL_SHIRTS',
                level: 'brick',
                optionCount: 45,
                stockQty: 9450,
                revenue: 1890000,
                sellThrough: 82,
                attributes: {
                  silhouette: ['Slim Fit', 'Regular Fit'],
                  fabricSplit: [{ fabric: 'Cotton Oxford', percentage: 100 }],
                  prints: ['Solid', 'Micro Checks'],
                  colors: ['White', 'Blue', 'Gray'],
                  pricePoint: { min: 899, max: 1299, primary: '₹999-1199' }
                }
              }
            ]
          }
        ]
      },
      {
        id: 'MC_TSHIRTS',
        name: 'T-Shirts',
        parent: 'MC',
        level: 'family',
        optionCount: 160,
        stockQty: 33600,
        revenue: 6720000,
        sellThrough: 68,
        attributes: {
          silhouette: ['Slim Fit', 'Regular Fit', 'Oversized'],
          fabricSplit: [
            { fabric: 'Cotton', percentage: 70 },
            { fabric: 'Cotton Blend', percentage: 30 }
          ],
          prints: ['Solid', 'Graphics', 'Text'],
          colors: ['White', 'Black', 'Navy', 'Gray', 'Red'],
          pricePoint: { min: 499, max: 1299, primary: '₹699-999' }
        }
      }
    ]
  },

  // Women's Western Wear
  {
    id: 'WWW',
    name: "Women's Western Wear",
    level: 'segment',
    optionCount: 452,
    stockQty: 94920,
    revenue: 22800000,
    sellThrough: 69,
    attributes: {
      silhouette: ['A-Line', 'Straight', 'Flare', 'Bodycon', 'Oversized'],
      fabricSplit: [
        { fabric: 'Cotton', percentage: 35 },
        { fabric: 'Polyester', percentage: 25 },
        { fabric: 'Viscose', percentage: 20 },
        { fabric: 'Blends', percentage: 20 }
      ],
      prints: ['Solid', 'Floral', 'Geometric', 'Abstract', 'Stripes'],
      colors: ['Black', 'White', 'Pink', 'Blue', 'Red', 'Green'],
      pricePoint: { min: 599, max: 3999, primary: '₹999-2499' }
    },
    children: [
      {
        id: 'WWW_TOPS',
        name: 'Tops',
        parent: 'WWW',
        level: 'family',
        optionCount: 185,
        stockQty: 38850,
        revenue: 9700000,
        sellThrough: 72,
        attributes: {
          silhouette: ['Straight', 'A-Line', 'Crop'],
          fabricSplit: [
            { fabric: 'Cotton', percentage: 40 },
            { fabric: 'Viscose', percentage: 35 },
            { fabric: 'Polyester', percentage: 25 }
          ],
          prints: ['Solid', 'Floral', 'Geometric'],
          colors: ['White', 'Black', 'Pink', 'Blue'],
          pricePoint: { min: 599, max: 1999, primary: '₹899-1499' }
        }
      },
      {
        id: 'WWW_DRESSES',
        name: 'Dresses',
        parent: 'WWW',
        level: 'family',
        optionCount: 140,
        stockQty: 29400,
        revenue: 8820000,
        sellThrough: 66,
        attributes: {
          silhouette: ['A-Line', 'Bodycon', 'Shift'],
          fabricSplit: [
            { fabric: 'Polyester', percentage: 45 },
            { fabric: 'Cotton', percentage: 30 },
            { fabric: 'Viscose', percentage: 25 }
          ],
          prints: ['Floral', 'Solid', 'Abstract'],
          colors: ['Black', 'Red', 'Blue', 'Pink'],
          pricePoint: { min: 999, max: 3999, primary: '₹1499-2999' }
        }
      }
    ]
  },

  // Women's Indian Wear
  {
    id: 'WIW',
    name: "Women's Indian Wear",
    level: 'segment',
    optionCount: 483,
    stockQty: 101430,
    revenue: 25200000,
    sellThrough: 74,
    attributes: {
      silhouette: ['Straight Cut', 'A-Line', 'Anarkali', 'High-Low'],
      fabricSplit: [
        { fabric: 'Cotton', percentage: 50 },
        { fabric: 'Viscose', percentage: 25 },
        { fabric: 'Rayon', percentage: 15 },
        { fabric: 'Silk Blend', percentage: 10 }
      ],
      prints: ['Floral', 'Ethnic', 'Block Print', 'Embroidered'],
      colors: ['Maroon', 'Navy', 'Pink', 'Yellow', 'Green', 'White'],
      pricePoint: { min: 799, max: 4999, primary: '₹1199-2999' }
    },
    children: [
      {
        id: 'WIW_KURTAS',
        name: 'Kurtas',
        parent: 'WIW',
        level: 'family',
        optionCount: 220,
        stockQty: 46200,
        revenue: 13860000,
        sellThrough: 76,
        attributes: {
          silhouette: ['Straight Cut', 'A-Line'],
          fabricSplit: [
            { fabric: 'Cotton', percentage: 60 },
            { fabric: 'Viscose', percentage: 40 }
          ],
          prints: ['Floral', 'Block Print', 'Embroidered'],
          colors: ['Maroon', 'Navy', 'Pink', 'Yellow'],
          pricePoint: { min: 799, max: 2999, primary: '₹1199-1999' }
        }
      }
    ]
  },

  // Kids Wear
  {
    id: 'KW',
    name: 'Kids Wear',
    level: 'segment',
    optionCount: 390,
    stockQty: 81900,
    revenue: 14040000,
    sellThrough: 68,
    attributes: {
      silhouette: ['Regular Fit', 'Relaxed Fit', 'Slim Fit'],
      fabricSplit: [
        { fabric: 'Cotton', percentage: 70 },
        { fabric: 'Cotton Blend', percentage: 30 }
      ],
      prints: ['Solid', 'Graphics', 'Cartoon', 'Stripes'],
      colors: ['Blue', 'Pink', 'Yellow', 'Red', 'Green', 'White'],
      pricePoint: { min: 299, max: 1999, primary: '₹599-999' }
    }
  },

  // Footwear
  {
    id: 'FW',
    name: 'Footwear',
    level: 'segment',
    optionCount: 185,
    stockQty: 38850,
    revenue: 11655000,
    sellThrough: 65,
    attributes: {
      silhouette: ['Casual', 'Formal', 'Sport', 'Ethnic'],
      fabricSplit: [
        { fabric: 'Synthetic Leather', percentage: 60 },
        { fabric: 'Canvas', percentage: 25 },
        { fabric: 'Mesh', percentage: 15 }
      ],
      prints: ['Solid', 'Textured'],
      colors: ['Black', 'Brown', 'White', 'Blue', 'Tan'],
      pricePoint: { min: 699, max: 3999, primary: '₹1299-2499' }
    }
  }
];

// ─── Store Space Planning Data ──────────────────────────────────────────────

export const mockStoreSpacePlans: StoreSpacePlan[] = [
  {
    storeId: '5943',
    storeName: 'Infinity Malad',
    totalSFT: 8450,
    segments: [
      {
        segmentId: 'MC',
        segmentName: "Men's Casuals",
        allocatedSFT: 1343,
        percentage: 15.9,
        plannedRevenue: 18900000,
        actualRevenue: 18200000,
        efficiency: 96.3,
        fixtures: [
          { fixtureType: '4-Way Rack', count: 12, sftPerFixture: 9, totalSFT: 108, maxCapacity: 48, currentUtilization: 85 },
          { fixtureType: 'Straight Rack 4ft', count: 8, sftPerFixture: 16, totalSFT: 128, maxCapacity: 64, currentUtilization: 92 },
          { fixtureType: 'Wall Unit 8ft', count: 4, sftPerFixture: 32, totalSFT: 128, maxCapacity: 80, currentUtilization: 88 }
        ]
      },
      {
        segmentId: 'WWW',
        segmentName: "Women's Western Wear",
        allocatedSFT: 1445,
        percentage: 17.1,
        plannedRevenue: 22800000,
        actualRevenue: 21600000,
        efficiency: 94.7,
        fixtures: [
          { fixtureType: '4-Way Rack', count: 10, sftPerFixture: 9, totalSFT: 90, maxCapacity: 40, currentUtilization: 78 },
          { fixtureType: 'Display Table', count: 4, sftPerFixture: 16, totalSFT: 64, maxCapacity: 16, currentUtilization: 100 },
          { fixtureType: 'Wall Unit 8ft', count: 4, sftPerFixture: 32, totalSFT: 128, maxCapacity: 80, currentUtilization: 82 }
        ]
      },
      {
        segmentId: 'WIW',
        segmentName: "Women's Indian Wear",
        allocatedSFT: 1546,
        percentage: 18.3,
        plannedRevenue: 25200000,
        actualRevenue: 24800000,
        efficiency: 98.4,
        fixtures: [
          { fixtureType: 'Wall Unit 4ft', count: 8, sftPerFixture: 16, totalSFT: 128, maxCapacity: 80, currentUtilization: 95 },
          { fixtureType: 'Display Table', count: 6, sftPerFixture: 16, totalSFT: 96, maxCapacity: 24, currentUtilization: 90 }
        ]
      },
      {
        segmentId: 'KW',
        segmentName: 'Kids Wear',
        allocatedSFT: 1183,
        percentage: 14.0,
        plannedRevenue: 14040000,
        actualRevenue: 13500000,
        efficiency: 96.2,
        fixtures: [
          { fixtureType: 'Gondola 4ft', count: 10, sftPerFixture: 16, totalSFT: 160, maxCapacity: 80, currentUtilization: 88 },
          { fixtureType: 'Nested Table', count: 10, sftPerFixture: 16, totalSFT: 160, maxCapacity: 60, currentUtilization: 75 }
        ]
      },
      {
        segmentId: 'FW',
        segmentName: 'Footwear',
        allocatedSFT: 678,
        percentage: 8.0,
        plannedRevenue: 11655000,
        actualRevenue: 10800000,
        efficiency: 92.7,
        fixtures: [
          { fixtureType: 'Slatwall Panel 4ft', count: 8, sftPerFixture: 16, totalSFT: 128, maxCapacity: 80, currentUtilization: 70 }
        ]
      }
    ]
  }
];

// ─── Drill-down Helper Functions ────────────────────────────────────────────

export function getHierarchyByLevel(level: 'segment' | 'family' | 'class' | 'brick'): HierarchyLevel[] {
  function collectByLevel(items: HierarchyLevel[], targetLevel: string): HierarchyLevel[] {
    const result: HierarchyLevel[] = [];

    for (const item of items) {
      if (item.level === targetLevel) {
        result.push(item);
      }
      if (item.children) {
        result.push(...collectByLevel(item.children, targetLevel));
      }
    }

    return result;
  }

  return collectByLevel(merchandiseHierarchy, level);
}

export function getChildrenByParentId(parentId: string): HierarchyLevel[] {
  function findAndGetChildren(items: HierarchyLevel[]): HierarchyLevel[] {
    for (const item of items) {
      if (item.id === parentId) {
        return item.children || [];
      }
      if (item.children) {
        const result = findAndGetChildren(item.children);
        if (result.length > 0) return result;
      }
    }
    return [];
  }

  return findAndGetChildren(merchandiseHierarchy);
}

export function getHierarchyPath(itemId: string): HierarchyLevel[] {
  function findPath(items: HierarchyLevel[], path: HierarchyLevel[] = []): HierarchyLevel[] | null {
    for (const item of items) {
      const currentPath = [...path, item];

      if (item.id === itemId) {
        return currentPath;
      }

      if (item.children) {
        const result = findPath(item.children, currentPath);
        if (result) return result;
      }
    }
    return null;
  }

  return findPath(merchandiseHierarchy) || [];
}