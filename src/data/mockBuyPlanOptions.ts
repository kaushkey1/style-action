// Mock data for Buy Plan with Style/Option structure

// ─── Types ──────────────────────────────────────────────────────────────

export type BuyPlanStatus =
  | 'draft'              // Buy Plan Review - Quantity editable
  | 'pending_costing'    // Sent for costing
  | 'costing_received'   // Costing received - MRP editable, cost and margin visible
  | 'pending_approval'   // Sent for approval
  | 'approved'           // Approved - Ready for Distribution Plan
  | 'partial_dp';        // Some options sent to DP, others pending

export type FashionGrade =
  | 'Core'
  | 'Fashion'
  | 'Ultimate'
  | 'Fashion Basics';

// A Style represents the design, fabric, pattern etc. without color
export interface Style {
  id: string;
  name: string;
  styleCode: string;
  brand: string;
  category: string; // Shirts, T-shirts, Tops, etc.
  attributes: {
    fabric: string;
    fit?: string;
    pattern?: string;
    silhouette?: string;
    sleeve?: string;
    neckline?: string;
  };
  baseImageUrl?: string; // Optional base image without color
}

// An Option is a Style + Color combination (SKU)
export interface Option {
  id: string;
  styleId: string;
  style: Style;
  color: string;
  colorCode: string;
  hexCode: string;
  imageUrl: string;

  // Quantities
  suggestedQty: number;
  plannedQty: number;

  // Pricing
  asp: number; // Average Selling Price
  mrp?: number; // Maximum Retail Price (post-costing)
  cost?: number; // Confirmed cost (post-costing)

  // Margins
  targetMargin: number;
  actualMargin?: number; // Post-costing
  intakeMargin?: number; // Calculated from cost and MRP

  // Status
  isActive: boolean;
  isExpanded?: boolean; // For UI state
  sentToDP?: boolean; // Whether this option has been sent to Distribution Plan
  dpDate?: string; // Date when sent to DP

  // Additional details
  sizes?: string[]; // Available sizes
  storeAllocation?: number; // Number of stores
  expectedRevenue?: number;
  intakeValue?: number;
}

export interface OptionsBuyPlan {
  id: string;
  category: string;
  categoryCode: string; // MW, WW, KW, ACC
  fashionGrade: FashionGrade;
  hit: string; // H1-H6, 07-12
  options: Option[];

  // Summary
  totalOtb: number;
  otbUsed: number;
  status: BuyPlanStatus;
}

// ─── Mock Data Generation ────────────────────────────────────────────────

const mockStyles: Style[] = [
  {
    id: 'STY-001',
    name: 'Classic Oxford Shirt',
    styleCode: 'OXF-2024-01',
    brand: 'DNMX',
    category: 'Men Western: Formal Shirts',
    attributes: {
      fabric: '100% Cotton Oxford',
      fit: 'Regular Fit',
      pattern: 'Solid',
      sleeve: 'Full Sleeve',
    }
  },
  {
    id: 'STY-002',
    name: 'Casual Linen Shirt',
    styleCode: 'LIN-2024-02',
    brand: 'John Players',
    category: 'Men Western: Casual Shirts',
    attributes: {
      fabric: 'Linen Blend',
      fit: 'Relaxed Fit',
      pattern: 'Textured',
      sleeve: 'Full Sleeve',
    }
  },
  {
    id: 'STY-003',
    name: 'Polo T-Shirt',
    styleCode: 'POL-2024-03',
    brand: 'Netplay',
    category: 'Men Western: Casual T-shirts',
    attributes: {
      fabric: 'Cotton Pique',
      fit: 'Slim Fit',
      pattern: 'Solid',
      neckline: 'Polo Collar',
    }
  },
  {
    id: 'STY-004',
    name: 'Graphic Tee',
    styleCode: 'GRP-2024-04',
    brand: 'DNMX',
    category: 'Men Western: Casual T-shirts',
    attributes: {
      fabric: '100% Cotton',
      fit: 'Regular Fit',
      pattern: 'Graphic Print',
      neckline: 'Round Neck',
    }
  }
];

const colors = [
  { name: 'White', code: 'WHT', hex: '#FFFFFF' },
  { name: 'Black', code: 'BLK', hex: '#000000' },
  { name: 'Navy Blue', code: 'NVY', hex: '#1e3a5f' },
  { name: 'Sky Blue', code: 'SKY', hex: '#87CEEB' },
  { name: 'Light Grey', code: 'LGR', hex: '#D3D3D3' },
  { name: 'Olive Green', code: 'OLV', hex: '#708238' },
  { name: 'Burgundy', code: 'BGD', hex: '#800020' },
  { name: 'Khaki', code: 'KHK', hex: '#C3B091' },
];

function generateOptions(styles: Style[], status: BuyPlanStatus = 'draft', idPrefix: string = ''): Option[] {
  const options: Option[] = [];

  styles.forEach((style, styleIndex) => {
    // Each style has 3 color options - fixed for consistency
    const numColors = 3;
    // Ensure we get unique colors for each style
    const startIndex = (styleIndex * 3) % colors.length;
    const selectedColors: Array<{ name: string; code: string; hex: string }> = [];
    for (let i = 0; i < numColors; i++) {
      const colorIndex = (startIndex + i) % colors.length;
      const color = colors[colorIndex];
      if (color) {
        selectedColors.push(color);
      }
    }

    selectedColors.forEach((color, colorIndex) => {
      const basePrice = 1500 + (styleIndex * 200);
      const quantity = 5000 + (styleIndex * 1000) + (colorIndex * 500); // Deterministic quantity

      // Add cost and MRP for costing_received or later stages
      const hasCost = ['costing_received', 'pending_approval', 'approved', 'partial_dp'].includes(status);
      const cost = hasCost ? Math.round(basePrice * 0.45) : undefined; // 45% of ASP as cost
      const mrp = hasCost ? Math.round(basePrice * 1.8) : undefined; // 180% of ASP as MRP
      const actualMargin = hasCost && cost && mrp ? ((mrp - cost) / mrp) * 100 : undefined;

      const optionId = `${idPrefix}OPT-${style.id}-${color.code}`;
      options.push({
        id: optionId,
        styleId: style.id,
        style: style,
        color: color.name,
        colorCode: color.code,
        hexCode: color.hex,
        imageUrl: `https://picsum.photos/seed/${style.id}-${color.code}/400/500`,

        suggestedQty: quantity,
        plannedQty: quantity,

        asp: basePrice + (colorIndex * 100),
        mrp: mrp ? Math.round(mrp) : undefined,
        cost: cost ? Math.round(cost) : undefined,

        targetMargin: 55 + (Math.random() * 10),
        actualMargin: actualMargin,
        intakeMargin: actualMargin,

        isActive: true,
        isExpanded: false,

        // Mark some as sent to DP for partial_dp status
        sentToDP: status === 'partial_dp' && styleIndex < 2 && colorIndex === 0,
        dpDate: status === 'partial_dp' && styleIndex < 2 && colorIndex === 0 ? '2024-03-20' : undefined,

        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        storeAllocation: 250 + Math.floor(Math.random() * 150),
        expectedRevenue: quantity * basePrice / 100000, // In lakhs
        intakeValue: cost && quantity ? (cost * quantity) / 100000 : undefined,
      });
    });
  });

  return options;
}

// Generate different mock data based on the ID to show different statuses
export function getMockOptionsBuyPlan(id?: string): OptionsBuyPlan {
  // Map different IDs to different statuses for demonstration
  const statusMap: Record<string, BuyPlanStatus> = {
    'BP-MW-2024-H5-FASHION': 'draft',
    'BP-MW-2024-H5-CORE': 'costing_received',
    'BP-MW-2024-H5-ULTIMATE': 'approved',
    'BP-MW-2024-H5-FASHION_BASICS': 'draft',
    'BP-WW-2024-H6-FASHION': 'pending_costing',
    'BP-WW-2024-H6-CORE': 'approved',
    'BP-KW-2024-H1-CORE': 'pending_costing',
    'BP-KW-2024-H1-FASHION': 'approved',
    'BP-ACC-2024-10-CORE': 'approved',
    'BP-ACC-2024-10-FASHION': 'costing_received',
  };

  const buyPlanId = id || 'BP-MW-2024-H5-FASHION';
  const status = statusMap[buyPlanId] || 'draft';

  // Parse category and fashion grade from ID
  const parts = buyPlanId.split('-');
  const categoryCode = parts[1] || 'MW';
  const fashionGrade = parts[5]?.replace('_', ' ') || 'Fashion';

  const categoryNames: Record<string, string> = {
    'MW': 'Men Western',
    'WW': 'Women Western',
    'KW': 'Kids',
    'ACC': 'Accessories'
  };

  return {
    id: buyPlanId,
    category: categoryNames[categoryCode] || 'Menswear',
    categoryCode,
    fashionGrade: fashionGrade.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') as FashionGrade,
    hit: parts[4] || 'H5',
    options: generateOptions(mockStyles, status),
    totalOtb: 45000000, // 4.5 Cr
    otbUsed: 38250000, // 3.825 Cr
    status,
  };
}

export const mockOptionsBuyPlan = getMockOptionsBuyPlan();

// Helper functions
export function getOptionRevenue(option: Option): number {
  return option.plannedQty * option.asp;
}

export function getOptionMargin(option: Option): number {
  if (option.actualMargin !== undefined) {
    return option.actualMargin;
  }
  return option.targetMargin;
}

export function getTotalActiveOptions(plan: OptionsBuyPlan): number {
  return plan.options.filter(opt => opt.isActive).length;
}

export function getTotalQuantity(plan: OptionsBuyPlan): number {
  return plan.options
    .filter(opt => opt.isActive)
    .reduce((sum, opt) => sum + opt.plannedQty, 0);
}

export function getTotalRevenue(plan: OptionsBuyPlan): number {
  return plan.options
    .filter(opt => opt.isActive)
    .reduce((sum, opt) => sum + getOptionRevenue(opt), 0);
}