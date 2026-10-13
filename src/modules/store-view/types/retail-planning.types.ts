// Store Segment Types
export interface StoreSegment {
  id: string;
  name: string;
  type: 'flagship' | 'standard' | 'outlet' | 'popup';
  region: string;
  sqft: number;
  monthlyRevenue: number;
  footTraffic: number;
  conversionRate: number;
  avgTransactionValue: number;
  performanceScore: number;
}

// Fixture Types
export interface Fixture {
  id: string;
  name: string;
  type: 'rack' | 'shelf' | 'table' | 'mannequin' | 'wall' | 'endcap';
  category: FashionCategory;
  capacity: number;
  currentUtilization: number;
  salesPerSqft: number;
  cost: number;
  location: string;
}

export interface FixtureOptimization {
  fixtureId: string;
  currentCategory: FashionCategory;
  recommendedCategory: FashionCategory;
  potentialRevenueLift: number;
  reason: string;
}

// Inventory Types
export type FashionCategory =
  | 'womens-apparel'
  | 'mens-apparel'
  | 'accessories'
  | 'footwear'
  | 'outerwear'
  | 'activewear'
  | 'denim'
  | 'basics';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: FashionCategory;
  subcategory: string;
  currentStock: number;
  reorderPoint: number;
  leadTimeDays: number;
  unitCost: number;
  retailPrice: number;
  weeklyVelocity: number;
  weeksOfSupply: number;
  status: 'optimal' | 'low' | 'overstock' | 'critical';
}

export interface InventoryForecast {
  category: FashionCategory;
  currentStock: number;
  projectedDemand: number[];
  recommendedOrder: number;
  forecastConfidence: number;
  seasonalityFactor: number;
}

// OTB (Open-to-Buy) Types
export interface OTBBudget {
  category: FashionCategory;
  plannedSales: number;
  plannedMarkdown: number;
  plannedEOM: number;
  actualBOM: number;
  onOrder: number;
  openToBuy: number;
  percentUsed: number;
}

export interface OTBPlanMonth {
  month: string;
  year: number;
  budgets: OTBBudget[];
  totalPlannedSales: number;
  totalOTB: number;
}

// Space Allocation Types
export interface SpaceAllocation {
  category: FashionCategory;
  currentSqft: number;
  recommendedSqft: number;
  salesPerSqft: number;
  profitMargin: number;
  seasonalPriority: 'high' | 'medium' | 'low';
  growthTrend: number;
}

export interface FloorPlan {
  id: string;
  storeName: string;
  totalSqft: number;
  allocations: SpaceAllocation[];
  lastUpdated: Date;
}

// Financial Projections Types
export interface FinancialMetrics {
  grossRevenue: number;
  netRevenue: number;
  cogs: number;
  grossMargin: number;
  operatingExpenses: number;
  netProfit: number;
  inventoryTurnover: number;
  gmroi: number; // Gross Margin Return on Investment
  sellThroughRate: number;
}

export interface MonthlyProjection {
  month: string;
  year: number;
  metrics: FinancialMetrics;
  vsLastYear: {
    revenue: number;
    margin: number;
    traffic: number;
  };
}

// Dashboard State
export interface RetailPlanningState {
  // Store Segments
  segments: StoreSegment[];
  selectedSegmentId: string | null;

  // Fixtures
  fixtures: Fixture[];
  optimizations: FixtureOptimization[];

  // Inventory
  inventory: InventoryItem[];
  forecasts: InventoryForecast[];

  // OTB
  otbPlan: OTBPlanMonth[];
  selectedOTBMonth: string;

  // Space
  floorPlans: FloorPlan[];
  selectedFloorPlanId: string | null;

  // Financial
  projections: MonthlyProjection[];

  // UI State
  activeTab: 'fixtures' | 'space';
  isLoading: boolean;
  error: string | null;
}

// Action Types
export interface RetailPlanningActions {
  // Store Segments
  setSegments: (segments: StoreSegment[]) => void;
  selectSegment: (id: string | null) => void;
  updateSegment: (id: string, updates: Partial<StoreSegment>) => void;

  // Fixtures
  setFixtures: (fixtures: Fixture[]) => void;
  updateFixture: (id: string, updates: Partial<Fixture>) => void;
  generateOptimizations: () => void;
  applyOptimization: (optimization: FixtureOptimization) => void;

  // Inventory
  setInventory: (inventory: InventoryItem[]) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  generateForecasts: () => void;
  placeReorder: (itemId: string, quantity: number) => void;

  // OTB
  setOTBPlan: (plan: OTBPlanMonth[]) => void;
  selectOTBMonth: (month: string) => void;
  updateOTBBudget: (month: string, category: FashionCategory, updates: Partial<OTBBudget>) => void;
  recalculateOTB: () => void;

  // Space
  setFloorPlans: (plans: FloorPlan[]) => void;
  selectFloorPlan: (id: string | null) => void;
  updateSpaceAllocation: (planId: string, category: FashionCategory, sqft: number) => void;
  optimizeSpaceAllocation: (planId: string) => void;

  // Financial
  setProjections: (projections: MonthlyProjection[]) => void;
  recalculateProjections: () => void;

  // UI
  setActiveTab: (tab: RetailPlanningState['activeTab']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Initialize
  initializeDashboard: () => void;
}
