// Mock data for Buy Plan - Fashion & Core/NOOS workflows

// ─── Types ──────────────────────────────────────────────────────────────

export type BuyPlanMode = 'fashion' | 'core';
export type BuyPlanStage = 'showback' | 'cost-finalisation';
export type ShowbackSubMode = 'normal' | 'presentation' | 'revision';
export type BuyPlanStatus = 'draft' | 'review' | 'approved' | 'cost-finalizing' | 'finalized';

export interface BuyPlan {
  id: string;
  name: string;
  mode: BuyPlanMode;
  stage: BuyPlanStage;
  status: BuyPlanStatus;
  season: string;
  category: string; // Fashion or Core
  totalBudget: number; // in Lakhs
  totalSpend: number; // in Lakhs
  designCount: number;
  brandCount: number;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  designs?: BuyPlanDesign[];
}

export interface BuyPlanDesign {
  id: string;
  buyPlanId: string;
  designName: string;
  brandName: string;
  category: string;
  subCategory: string;
  styleCode: string;
  imageUrl: string;
  costPerPiece: number; // in INR
  moq: number; // minimum order quantity
  proposedQty: number;
  totalCost: number; // in INR
  marginPercent: number;
  retailPrice: number; // in INR
  status: 'pending' | 'approved' | 'rejected' | 'revision';
  notes?: string;
  tags: string[];
  colorOptions: number;
  sizeRange: string;
  fabricComposition: string;
  vendorName: string;
  leadTime: number; // in days
  qualityGrade: 'A' | 'B' | 'C';
  trendinessScore: number; // 1-10
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CoreReorderProposal {
  id: string;
  articleCode: string;
  articleName: string;
  brandName: string;
  category: string;
  currentStock: number;
  averageSales: number; // per week
  weeksOfStock: number;
  reorderLevel: number;
  proposedQty: number;
  unitCost: number;
  totalCost: number;
  vendorName: string;
  leadTime: number;
  confidenceScore: number; // AI confidence 0-100
  riskFactors: string[];
  lastReorderDate: string;
  salesVelocity: 'high' | 'medium' | 'low';
  seasonality: 'peak' | 'normal' | 'off-peak';
}

// ─── Mock Data ──────────────────────────────────────────────────────────

// Fashion Buy Plans
export const mockFashionBuyPlans: BuyPlan[] = [
  {
    id: 'bp-fashion-ss24-fg3',
    name: 'SS24 Fashion Collection - FG3',
    mode: 'fashion',
    stage: 'showback',
    status: 'review',
    season: 'SS24',
    category: 'Fashion',
    totalBudget: 2500,
    totalSpend: 1850,
    designCount: 156,
    brandCount: 8,
    createdAt: '2024-02-15T10:30:00Z',
    updatedAt: '2024-03-01T14:20:00Z',
    dueDate: '2024-03-15T23:59:59Z',
  },
  {
    id: 'bp-fashion-ss24-fg4',
    name: 'SS24 Fashion Collection - FG4',
    mode: 'fashion',
    stage: 'cost-finalisation',
    status: 'cost-finalizing',
    season: 'SS24',
    category: 'Fashion',
    totalBudget: 1800,
    totalSpend: 1650,
    designCount: 89,
    brandCount: 5,
    createdAt: '2024-02-10T09:00:00Z',
    updatedAt: '2024-03-05T16:45:00Z',
    dueDate: '2024-03-20T23:59:59Z',
  },
];

// Core/NOOS Buy Plan (VMI Auto-Replenishment)
export const mockCoreBuyPlan: BuyPlan = {
  id: 'bp-core-fg2-weekly',
  name: 'Core/NOOS Weekly Replenishment - FG2',
  mode: 'core',
  stage: 'showback',
  status: 'approved',
  season: 'Year Round',
  category: 'Core',
  totalBudget: 5000,
  totalSpend: 4200,
  designCount: 0, // Core articles, not designs
  brandCount: 12,
  createdAt: '2024-02-01T00:00:00Z',
  updatedAt: '2024-03-11T08:00:00Z',
  dueDate: '2024-03-18T23:59:59Z',
};

// Fashion Designs for Showback
export const mockBuyPlanDesigns: BuyPlanDesign[] = [
  {
    id: 'design-001',
    buyPlanId: 'bp-fashion-ss24-fg3',
    designName: 'Floral Print Maxi Dress',
    brandName: 'Trending Collections',
    category: 'Dresses',
    subCategory: 'Maxi Dresses',
    styleCode: 'TC-MD-001',
    imageUrl: '/api/placeholder/300/400',
    costPerPiece: 850,
    moq: 500,
    proposedQty: 1200,
    totalCost: 1020000,
    marginPercent: 58.2,
    retailPrice: 1999,
    status: 'approved',
    tags: ['trending', 'floral', 'summer'],
    colorOptions: 3,
    sizeRange: 'XS-XXL',
    fabricComposition: '100% Viscose',
    vendorName: 'Textile Mills Ltd',
    leadTime: 45,
    qualityGrade: 'A',
    trendinessScore: 8,
    riskLevel: 'low',
  },
  {
    id: 'design-002',
    buyPlanId: 'bp-fashion-ss24-fg3',
    designName: 'Striped Linen Shirt',
    brandName: 'Classic Wear',
    category: 'Tops',
    subCategory: 'Shirts',
    styleCode: 'CW-SH-023',
    imageUrl: '/api/placeholder/300/400',
    costPerPiece: 650,
    moq: 800,
    proposedQty: 2000,
    totalCost: 1300000,
    marginPercent: 61.8,
    retailPrice: 1699,
    status: 'pending',
    tags: ['classic', 'stripes', 'linen'],
    colorOptions: 4,
    sizeRange: 'S-XL',
    fabricComposition: '70% Linen, 30% Cotton',
    vendorName: 'Garment Co Pvt Ltd',
    leadTime: 40,
    qualityGrade: 'A',
    trendinessScore: 6,
    riskLevel: 'medium',
  },
  {
    id: 'design-003',
    buyPlanId: 'bp-fashion-ss24-fg3',
    designName: 'Denim Wide Leg Jeans',
    brandName: 'Urban Style',
    category: 'Bottoms',
    subCategory: 'Jeans',
    styleCode: 'US-JN-045',
    imageUrl: '/api/placeholder/300/400',
    costPerPiece: 950,
    moq: 600,
    proposedQty: 1500,
    totalCost: 1425000,
    marginPercent: 52.6,
    retailPrice: 2499,
    status: 'revision',
    notes: 'Reduce cost by 8% to meet margin targets',
    tags: ['denim', 'wide-leg', 'trendy'],
    colorOptions: 2,
    sizeRange: '26-36',
    fabricComposition: '98% Cotton, 2% Elastane',
    vendorName: 'Denim Works',
    leadTime: 50,
    qualityGrade: 'B',
    trendinessScore: 9,
    riskLevel: 'high',
  },
  {
    id: 'design-004',
    buyPlanId: 'bp-fashion-ss24-fg3',
    designName: 'Embroidered Crop Top',
    brandName: 'Bohemian Dreams',
    category: 'Tops',
    subCategory: 'Crop Tops',
    styleCode: 'BD-CT-012',
    imageUrl: '/api/placeholder/300/400',
    costPerPiece: 750,
    moq: 400,
    proposedQty: 800,
    totalCost: 600000,
    marginPercent: 62.5,
    retailPrice: 1899,
    status: 'approved',
    tags: ['embroidered', 'boho', 'crop'],
    colorOptions: 3,
    sizeRange: 'XS-L',
    fabricComposition: '100% Cotton',
    vendorName: 'Artisan Crafts',
    leadTime: 35,
    qualityGrade: 'A',
    trendinessScore: 7,
    riskLevel: 'low',
  },
  {
    id: 'design-005',
    buyPlanId: 'bp-fashion-ss24-fg3',
    designName: 'High-Waisted Shorts',
    brandName: 'Summer Vibes',
    category: 'Bottoms',
    subCategory: 'Shorts',
    styleCode: 'SV-SH-089',
    imageUrl: '/api/placeholder/300/400',
    costPerPiece: 420,
    moq: 1000,
    proposedQty: 2500,
    totalCost: 1050000,
    marginPercent: 64.3,
    retailPrice: 1199,
    status: 'pending',
    tags: ['high-waisted', 'summer', 'casual'],
    colorOptions: 5,
    sizeRange: 'XS-XXL',
    fabricComposition: '95% Cotton, 5% Elastane',
    vendorName: 'Quick Fashion',
    leadTime: 30,
    qualityGrade: 'B',
    trendinessScore: 8,
    riskLevel: 'low',
  },
  {
    id: 'design-006',
    buyPlanId: 'bp-fashion-ss24-fg3',
    designName: 'Tie-Dye Kimono',
    brandName: 'Free Spirit',
    category: 'Outerwear',
    subCategory: 'Kimonos',
    styleCode: 'FS-KM-003',
    imageUrl: '/api/placeholder/300/400',
    costPerPiece: 680,
    moq: 300,
    proposedQty: 600,
    totalCost: 408000,
    marginPercent: 59.1,
    retailPrice: 1799,
    status: 'rejected',
    notes: 'Market research indicates low demand for tie-dye patterns in current season',
    tags: ['tie-dye', 'kimono', 'boho'],
    colorOptions: 2,
    sizeRange: 'One Size',
    fabricComposition: '100% Rayon',
    vendorName: 'Bohemian Textiles',
    leadTime: 42,
    qualityGrade: 'B',
    trendinessScore: 5,
    riskLevel: 'high',
  },
];

// Core Articles for VMI Auto-Replenishment
export const mockCoreReorderProposals: CoreReorderProposal[] = [
  {
    id: 'core-001',
    articleCode: 'FG2-WT-001',
    articleName: 'Basic White Cotton T-Shirt',
    brandName: 'Essentials',
    category: 'Basics',
    currentStock: 1250,
    averageSales: 180,
    weeksOfStock: 6.9,
    reorderLevel: 1800,
    proposedQty: 3000,
    unitCost: 185,
    totalCost: 555000,
    vendorName: 'Cotton Mills Ltd',
    leadTime: 21,
    confidenceScore: 92,
    riskFactors: [],
    lastReorderDate: '2024-02-18T00:00:00Z',
    salesVelocity: 'high',
    seasonality: 'normal',
  },
  {
    id: 'core-002',
    articleCode: 'FG2-BK-002',
    articleName: 'Black Basic Leggings',
    brandName: 'Comfort Zone',
    category: 'Bottoms',
    currentStock: 890,
    averageSales: 120,
    weeksOfStock: 7.4,
    reorderLevel: 1200,
    proposedQty: 2400,
    unitCost: 220,
    totalCost: 528000,
    vendorName: 'Active Wear Co',
    leadTime: 28,
    confidenceScore: 88,
    riskFactors: ['seasonal demand variation'],
    lastReorderDate: '2024-02-25T00:00:00Z',
    salesVelocity: 'medium',
    seasonality: 'peak',
  },
  {
    id: 'core-003',
    articleCode: 'FG2-DN-003',
    articleName: 'Classic Blue Denim Jeans',
    brandName: 'Denim Basics',
    category: 'Bottoms',
    currentStock: 450,
    averageSales: 95,
    weeksOfStock: 4.7,
    reorderLevel: 950,
    proposedQty: 1900,
    unitCost: 485,
    totalCost: 921500,
    vendorName: 'Denim Mills',
    leadTime: 35,
    confidenceScore: 85,
    riskFactors: ['lead time uncertainty', 'size distribution risk'],
    lastReorderDate: '2024-02-10T00:00:00Z',
    salesVelocity: 'medium',
    seasonality: 'normal',
  },
  {
    id: 'core-004',
    articleCode: 'FG2-GY-004',
    articleName: 'Grey Hooded Sweatshirt',
    brandName: 'Casual Comfort',
    category: 'Outerwear',
    currentStock: 320,
    averageSales: 65,
    weeksOfStock: 4.9,
    reorderLevel: 650,
    proposedQty: 1300,
    unitCost: 385,
    totalCost: 500500,
    vendorName: 'Fleece Factory',
    leadTime: 42,
    confidenceScore: 78,
    riskFactors: ['seasonal demand variation', 'size mix uncertainty'],
    lastReorderDate: '2024-01-28T00:00:00Z',
    salesVelocity: 'low',
    seasonality: 'off-peak',
  },
  {
    id: 'core-005',
    articleCode: 'FG2-NV-005',
    articleName: 'Navy Cotton Polo Shirt',
    brandName: 'Classic Polo',
    category: 'Tops',
    currentStock: 680,
    averageSales: 85,
    weeksOfStock: 8.0,
    reorderLevel: 850,
    proposedQty: 1700,
    unitCost: 265,
    totalCost: 450500,
    vendorName: 'Polo Garments',
    leadTime: 25,
    confidenceScore: 90,
    riskFactors: [],
    lastReorderDate: '2024-03-01T00:00:00Z',
    salesVelocity: 'medium',
    seasonality: 'normal',
  },
];

// OTB Tracking Data per Brand (Fashion)
export const mockBrandOTBTracking = [
  {
    brandName: 'Trending Collections',
    allocatedBudget: 450, // Lakhs
    spentBudget: 385,
    utilization: 85.6,
    designCount: 24,
    avgMargin: 58.2,
  },
  {
    brandName: 'Classic Wear',
    allocatedBudget: 380,
    spentBudget: 315,
    utilization: 82.9,
    designCount: 18,
    avgMargin: 61.4,
  },
  {
    brandName: 'Urban Style',
    allocatedBudget: 520,
    spentBudget: 465,
    utilization: 89.4,
    designCount: 31,
    avgMargin: 52.8,
  },
  {
    brandName: 'Bohemian Dreams',
    allocatedBudget: 290,
    spentBudget: 245,
    utilization: 84.5,
    designCount: 15,
    avgMargin: 59.7,
  },
  {
    brandName: 'Summer Vibes',
    allocatedBudget: 340,
    spentBudget: 280,
    utilization: 82.4,
    designCount: 22,
    avgMargin: 63.1,
  },
  {
    brandName: 'Free Spirit',
    allocatedBudget: 220,
    spentBudget: 160,
    utilization: 72.7,
    designCount: 12,
    avgMargin: 55.3,
  },
];

// Critical Path Milestones
export const mockCriticalPath = [
  {
    stage: 'showback',
    title: 'Design Showback',
    dueDate: '2024-03-15',
    status: 'current' as const,
    completedTasks: 8,
    totalTasks: 12,
  },
  {
    stage: 'cost-finalisation',
    title: 'Cost Finalisation',
    dueDate: '2024-03-22',
    status: 'upcoming' as const,
    completedTasks: 0,
    totalTasks: 6,
  },
  {
    stage: 'po-creation',
    title: 'PO Creation',
    dueDate: '2024-03-29',
    status: 'upcoming' as const,
    completedTasks: 0,
    totalTasks: 4,
  },
];