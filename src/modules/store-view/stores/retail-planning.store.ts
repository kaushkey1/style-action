import { create } from 'zustand';
import type {
  RetailPlanningState,
  RetailPlanningActions,
  StoreSegment,
  Fixture,
  FixtureOptimization,
  InventoryItem,
  InventoryForecast,
  OTBPlanMonth,
  OTBBudget,
  FloorPlan,
  SpaceAllocation,
  MonthlyProjection,
  FashionCategory,
} from '../types/retail-planning.types';

// Mock Data Generators
const generateMockSegments = (): StoreSegment[] => [
  {
    id: '1',
    name: 'Phoenix Palladium Mumbai',
    type: 'flagship',
    region: 'West',
    sqft: 25000,
    monthlyRevenue: 103750000,
    footTraffic: 45000,
    conversionRate: 28,
    avgTransactionValue: 15355,
    performanceScore: 92,
  },
  {
    id: '2',
    name: 'Select Citywalk Delhi',
    type: 'standard',
    region: 'North',
    sqft: 12000,
    monthlyRevenue: 56440000,
    footTraffic: 28000,
    conversionRate: 24,
    avgTransactionValue: 12035,
    performanceScore: 78,
  },
  {
    id: '3',
    name: 'VR Mall Chennai',
    type: 'outlet',
    region: 'South',
    sqft: 8000,
    monthlyRevenue: 26560000,
    footTraffic: 35000,
    conversionRate: 32,
    avgTransactionValue: 6225,
    performanceScore: 71,
  },
  {
    id: '4',
    name: 'Ambience Mall Gurugram',
    type: 'popup',
    region: 'North',
    sqft: 2500,
    monthlyRevenue: 7885000,
    footTraffic: 8000,
    conversionRate: 35,
    avgTransactionValue: 10375,
    performanceScore: 85,
  },
  {
    id: '5',
    name: 'Forum Mall Bangalore',
    type: 'standard',
    region: 'South',
    sqft: 10000,
    monthlyRevenue: 43160000,
    footTraffic: 22000,
    conversionRate: 26,
    avgTransactionValue: 11205,
    performanceScore: 74,
  },
];

const generateMockFixtures = (): Fixture[] => [
  { id: 'f1', name: 'Premium Rack A', type: 'rack', category: 'womens-apparel', capacity: 120, currentUtilization: 85, salesPerSqft: 37350, cost: 207500, location: 'Front Zone' },
  { id: 'f2', name: 'Wall Display 1', type: 'wall', category: 'accessories', capacity: 80, currentUtilization: 92, salesPerSqft: 56440, cost: 149400, location: 'Entrance' },
  { id: 'f3', name: 'Center Table', type: 'table', category: 'basics', capacity: 200, currentUtilization: 45, salesPerSqft: 18260, cost: 99600, location: 'Center' },
  { id: 'f4', name: 'Shoe Shelf Unit', type: 'shelf', category: 'footwear', capacity: 60, currentUtilization: 78, salesPerSqft: 43160, cost: 265600, location: 'Back Zone' },
  { id: 'f5', name: 'Mannequin Group', type: 'mannequin', category: 'outerwear', capacity: 8, currentUtilization: 100, salesPerSqft: 73870, cost: 373500, location: 'Window' },
  { id: 'f6', name: 'Endcap Display', type: 'endcap', category: 'denim', capacity: 45, currentUtilization: 68, salesPerSqft: 31540, cost: 78850, location: 'Aisle End' },
  { id: 'f7', name: 'Activewear Rack', type: 'rack', category: 'activewear', capacity: 100, currentUtilization: 95, salesPerSqft: 42330, cost: 182600, location: 'Sports Zone' },
  { id: 'f8', name: 'Mens Wall Unit', type: 'wall', category: 'mens-apparel', capacity: 90, currentUtilization: 72, salesPerSqft: 28220, cost: 166000, location: 'Left Wing' },
];

const generateMockInventory = (): InventoryItem[] => [
  { id: 'i1', sku: 'WA-DRS-001', name: 'Summer Floral Dress', category: 'womens-apparel', subcategory: 'Dresses', currentStock: 245, reorderPoint: 100, leadTimeDays: 14, unitCost: 2324, retailPrice: 7387, weeklyVelocity: 42, weeksOfSupply: 5.8, status: 'optimal' },
  { id: 'i2', sku: 'ACC-BAG-012', name: 'Leather Crossbody', category: 'accessories', subcategory: 'Bags', currentStock: 38, reorderPoint: 50, leadTimeDays: 21, unitCost: 3735, retailPrice: 12367, weeklyVelocity: 12, weeksOfSupply: 3.2, status: 'low' },
  { id: 'i3', sku: 'FW-SNK-008', name: 'Running Sneakers', category: 'footwear', subcategory: 'Athletic', currentStock: 520, reorderPoint: 150, leadTimeDays: 28, unitCost: 4316, retailPrice: 10707, weeklyVelocity: 35, weeksOfSupply: 14.9, status: 'overstock' },
  { id: 'i4', sku: 'MA-TSH-003', name: 'Classic Polo', category: 'mens-apparel', subcategory: 'Shirts', currentStock: 12, reorderPoint: 80, leadTimeDays: 10, unitCost: 1245, retailPrice: 4067, weeklyVelocity: 28, weeksOfSupply: 0.4, status: 'critical' },
  { id: 'i5', sku: 'DN-JNS-005', name: 'Slim Fit Jeans', category: 'denim', subcategory: 'Jeans', currentStock: 180, reorderPoint: 100, leadTimeDays: 18, unitCost: 2656, retailPrice: 8134, weeklyVelocity: 25, weeksOfSupply: 7.2, status: 'optimal' },
  { id: 'i6', sku: 'AW-LEG-002', name: 'Yoga Leggings', category: 'activewear', subcategory: 'Bottoms', currentStock: 95, reorderPoint: 120, leadTimeDays: 12, unitCost: 1494, retailPrice: 5644, weeklyVelocity: 38, weeksOfSupply: 2.5, status: 'low' },
  { id: 'i7', sku: 'OW-JKT-004', name: 'Puffer Jacket', category: 'outerwear', subcategory: 'Jackets', currentStock: 340, reorderPoint: 80, leadTimeDays: 35, unitCost: 5395, retailPrice: 15687, weeklyVelocity: 8, weeksOfSupply: 42.5, status: 'overstock' },
  { id: 'i8', sku: 'BS-TEE-001', name: 'Essential Tee', category: 'basics', subcategory: 'T-Shirts', currentStock: 890, reorderPoint: 400, leadTimeDays: 7, unitCost: 664, retailPrice: 2075, weeklyVelocity: 120, weeksOfSupply: 7.4, status: 'optimal' },
];

const generateMockForecasts = (): InventoryForecast[] => {
  const categories: FashionCategory[] = ['womens-apparel', 'mens-apparel', 'accessories', 'footwear', 'outerwear', 'activewear', 'denim', 'basics'];
  return categories.map((category) => ({
    category,
    currentStock: Math.floor(Math.random() * 1000) + 200,
    projectedDemand: Array.from({ length: 12 }, () => Math.floor(Math.random() * 500) + 100),
    recommendedOrder: Math.floor(Math.random() * 300) + 50,
    forecastConfidence: Math.random() * 0.3 + 0.7,
    seasonalityFactor: Math.random() * 0.5 + 0.75,
  }));
};

const generateMockOTBPlan = (): OTBPlanMonth[] => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June'];
  const categories: FashionCategory[] = ['womens-apparel', 'mens-apparel', 'accessories', 'footwear', 'activewear', 'denim'];

  return months.map((month) => {
    const budgets: OTBBudget[] = categories.map((category) => {
      const plannedSales = Math.floor(Math.random() * 16600000) + 8300000;
      const plannedMarkdown = plannedSales * (Math.random() * 0.15 + 0.05);
      const plannedEOM = plannedSales * (Math.random() * 0.4 + 0.3);
      const actualBOM = plannedEOM * (Math.random() * 0.2 + 0.9);
      const onOrder = plannedSales * (Math.random() * 0.3 + 0.1);
      const openToBuy = plannedSales + plannedMarkdown + plannedEOM - actualBOM - onOrder;

      return {
        category,
        plannedSales,
        plannedMarkdown,
        plannedEOM,
        actualBOM,
        onOrder,
        openToBuy,
        percentUsed: ((actualBOM + onOrder) / (plannedSales + plannedMarkdown + plannedEOM)) * 100,
      };
    });

    return {
      month,
      year: 2026,
      budgets,
      totalPlannedSales: budgets.reduce((sum, b) => sum + b.plannedSales, 0),
      totalOTB: budgets.reduce((sum, b) => sum + b.openToBuy, 0),
    };
  });
};

const generateMockFloorPlan = (): FloorPlan[] => {
  const categories: FashionCategory[] = ['womens-apparel', 'mens-apparel', 'accessories', 'footwear', 'outerwear', 'activewear', 'denim', 'basics'];

  const allocations: SpaceAllocation[] = categories.map((category) => ({
    category,
    currentSqft: Math.floor(Math.random() * 2000) + 500,
    recommendedSqft: Math.floor(Math.random() * 2000) + 500,
    salesPerSqft: Math.floor(Math.random() * 33200) + 16600,
    profitMargin: Math.random() * 0.3 + 0.3,
    seasonalPriority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
    growthTrend: Math.random() * 0.4 - 0.1,
  }));

  return [
    {
      id: 'fp1',
      storeName: 'Phoenix Palladium Mumbai',
      totalSqft: 25000,
      allocations,
      lastUpdated: new Date(),
    },
  ];
};

const generateMockProjections = (): MonthlyProjection[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return months.map((month) => {
    const grossRevenue = Math.floor(Math.random() * 41500000) + 66400000;
    const cogs = grossRevenue * (Math.random() * 0.1 + 0.4);
    const operatingExpenses = grossRevenue * (Math.random() * 0.1 + 0.2);

    return {
      month,
      year: 2026,
      metrics: {
        grossRevenue,
        netRevenue: grossRevenue * 0.95,
        cogs,
        grossMargin: (grossRevenue - cogs) / grossRevenue,
        operatingExpenses,
        netProfit: grossRevenue - cogs - operatingExpenses,
        inventoryTurnover: Math.random() * 4 + 4,
        gmroi: Math.random() * 2 + 2,
        sellThroughRate: Math.random() * 0.3 + 0.5,
      },
      vsLastYear: {
        revenue: Math.random() * 0.3 - 0.1,
        margin: Math.random() * 0.2 - 0.05,
        traffic: Math.random() * 0.25 - 0.1,
      },
    };
  });
};

// Initial State
const initialState: RetailPlanningState = {
  segments: [],
  selectedSegmentId: null,
  fixtures: [],
  optimizations: [],
  inventory: [],
  forecasts: [],
  otbPlan: [],
  selectedOTBMonth: 'March',
  floorPlans: [],
  selectedFloorPlanId: null,
  projections: [],
  activeTab: 'space',
  isLoading: false,
  error: null,
};

// Store
export const useRetailPlanningStore = create<RetailPlanningState & RetailPlanningActions>((set, get) => ({
  ...initialState,

  // Store Segments Actions
  setSegments: (segments) => set({ segments }),

  selectSegment: (id) => set({ selectedSegmentId: id }),

  updateSegment: (id, updates) =>
    set((state) => ({
      segments: state.segments.map((seg) => (seg.id === id ? { ...seg, ...updates } : seg)),
    })),

  // Fixtures Actions
  setFixtures: (fixtures) => set({ fixtures }),

  updateFixture: (id, updates) =>
    set((state) => ({
      fixtures: state.fixtures.map((fix) => (fix.id === id ? { ...fix, ...updates } : fix)),
    })),

  generateOptimizations: () => {
    const { fixtures } = get();
    const optimizations: FixtureOptimization[] = [];

    fixtures.forEach((fixture) => {
      if (fixture.currentUtilization < 60) {
        const highPerformingCategories: FashionCategory[] = ['accessories', 'activewear', 'footwear'];
        const randomIndex = Math.floor(Math.random() * highPerformingCategories.length);
        const recommended = highPerformingCategories[randomIndex] as FashionCategory;

        if (recommended && recommended !== fixture.category) {
          optimizations.push({
            fixtureId: fixture.id,
            currentCategory: fixture.category,
            recommendedCategory: recommended,
            potentialRevenueLift: Math.floor(Math.random() * 1245000) + 415000,
            reason: `Low utilization (${fixture.currentUtilization}%) - ${recommended} shows higher demand in this zone`,
          });
        }
      }
    });

    set({ optimizations });
  },

  applyOptimization: (optimization) =>
    set((state) => ({
      fixtures: state.fixtures.map((fix) =>
        fix.id === optimization.fixtureId ? { ...fix, category: optimization.recommendedCategory } : fix
      ),
      optimizations: state.optimizations.filter((opt) => opt.fixtureId !== optimization.fixtureId),
    })),

  // Inventory Actions
  setInventory: (inventory) => set({ inventory }),

  updateInventoryItem: (id, updates) =>
    set((state) => ({
      inventory: state.inventory.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    })),

  generateForecasts: () => {
    set({ forecasts: generateMockForecasts() });
  },

  placeReorder: (itemId, quantity) => {
    const { inventory } = get();
    const item = inventory.find((i) => i.id === itemId);

    if (item) {
      const newStock = item.currentStock + quantity;
      const newWeeksOfSupply = newStock / item.weeklyVelocity;
      let newStatus: InventoryItem['status'] = 'optimal';

      if (newWeeksOfSupply < 2) newStatus = 'critical';
      else if (newWeeksOfSupply < 4) newStatus = 'low';
      else if (newWeeksOfSupply > 12) newStatus = 'overstock';

      set((state) => ({
        inventory: state.inventory.map((i) =>
          i.id === itemId
            ? {
                ...i,
                currentStock: newStock,
                weeksOfSupply: newWeeksOfSupply,
                status: newStatus,
              }
            : i
        ),
      }));
    }
  },

  // OTB Actions
  setOTBPlan: (plan) => set({ otbPlan: plan }),

  selectOTBMonth: (month) => set({ selectedOTBMonth: month }),

  updateOTBBudget: (month, category, updates) =>
    set((state) => ({
      otbPlan: state.otbPlan.map((plan) =>
        plan.month === month
          ? {
              ...plan,
              budgets: plan.budgets.map((budget) => (budget.category === category ? { ...budget, ...updates } : budget)),
            }
          : plan
      ),
    })),

  recalculateOTB: () => {
    set((state) => ({
      otbPlan: state.otbPlan.map((plan) => ({
        ...plan,
        budgets: plan.budgets.map((budget) => {
          const openToBuy = budget.plannedSales + budget.plannedMarkdown + budget.plannedEOM - budget.actualBOM - budget.onOrder;
          const percentUsed = ((budget.actualBOM + budget.onOrder) / (budget.plannedSales + budget.plannedMarkdown + budget.plannedEOM)) * 100;
          return { ...budget, openToBuy, percentUsed };
        }),
        totalPlannedSales: plan.budgets.reduce((sum, b) => sum + b.plannedSales, 0),
        totalOTB: plan.budgets.reduce((sum, b) => sum + b.openToBuy, 0),
      })),
    }));
  },

  // Space Actions
  setFloorPlans: (plans) => set({ floorPlans: plans }),

  selectFloorPlan: (id) => set({ selectedFloorPlanId: id }),

  updateSpaceAllocation: (planId, category, sqft) =>
    set((state) => ({
      floorPlans: state.floorPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              allocations: plan.allocations.map((alloc) => (alloc.category === category ? { ...alloc, currentSqft: sqft } : alloc)),
              lastUpdated: new Date(),
            }
          : plan
      ),
    })),

  optimizeSpaceAllocation: (planId) => {
    const { floorPlans } = get();
    const plan = floorPlans.find((p) => p.id === planId);

    if (plan) {
      const totalSqft = plan.totalSqft;
      const allocations = plan.allocations.map((alloc) => {
        const performanceScore = alloc.salesPerSqft * alloc.profitMargin * (alloc.growthTrend + 1);
        return { ...alloc, performanceScore };
      });

      const totalScore = allocations.reduce((sum, a) => sum + a.performanceScore, 0);

      const optimizedAllocations = allocations.map((alloc) => {
        const share = alloc.performanceScore / totalScore;
        return {
          ...alloc,
          recommendedSqft: Math.floor(totalSqft * share),
        };
      });

      set((state) => ({
        floorPlans: state.floorPlans.map((p) =>
          p.id === planId
            ? {
                ...p,
                allocations: optimizedAllocations,
                lastUpdated: new Date(),
              }
            : p
        ),
      }));
    }
  },

  // Financial Actions
  setProjections: (projections) => set({ projections }),

  recalculateProjections: () => {
    const { inventory, segments } = get();

    const totalInventoryValue = inventory.reduce((sum, item) => sum + item.currentStock * item.unitCost, 0);
    const avgMargin = inventory.reduce((sum, item) => sum + (item.retailPrice - item.unitCost) / item.retailPrice, 0) / inventory.length;
    const totalStoreRevenue = segments.reduce((sum, seg) => sum + seg.monthlyRevenue, 0);

    set((state) => ({
      projections: state.projections.map((proj) => ({
        ...proj,
        metrics: {
          ...proj.metrics,
          grossRevenue: totalStoreRevenue * (1 + Math.random() * 0.1),
          grossMargin: avgMargin,
          inventoryTurnover: (totalStoreRevenue * 12) / totalInventoryValue,
        },
      })),
    }));
  },

  // UI Actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  // Initialize
  initializeDashboard: () => {
    set({ isLoading: true });

    // Simulate API loading
    setTimeout(() => {
      set({
        segments: generateMockSegments(),
        fixtures: generateMockFixtures(),
        inventory: generateMockInventory(),
        forecasts: generateMockForecasts(),
        otbPlan: generateMockOTBPlan(),
        floorPlans: generateMockFloorPlan(),
        projections: generateMockProjections(),
        selectedFloorPlanId: 'fp1',
        isLoading: false,
      });
    }, 500);
  },
}));
