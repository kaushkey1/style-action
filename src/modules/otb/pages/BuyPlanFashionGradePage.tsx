/* eslint-disable design-system/prefer-section-header, design-system/prefer-metric-grid -- buy plan fashion grade uses custom layouts */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, History, X } from 'lucide-react';
import { KpiCard } from '../../range/components/KpiCard';
import { EmptyState, ShimmerKpiGrid, ShimmerTable } from '@/components/ui';
import {cn, getCurrencySymbol} from '@/lib/utils';

interface FashionGradeSummary {
  id: string;
  name: string;
  options: number;
  quantity: number;
  otbAllocated: number;
  otbUsed: number;
  averageASP: number;
  revenue: number;
  margin: number;
  storeCount: number;
  pendingApprovals: number;
  completedPlans: number;
  totalPlans: number;
  status: 'On Track' | 'At Risk' | 'Behind Schedule';
  pipelineStatus: 'Buy Plan Review' | 'Costing' | 'Buy Plan Approval';
}

interface CategoryDetail {
  id: string;
  name: string;
  hit: string;
}

// Helper function to get full category name from code
const getCategoryName = (code: string): string => {
  const categoryMap: Record<string, string> = {
    // Men's Categories
    'MW-DNM': 'Men Western: Denim Bottoms',
    'MW-NDB': 'Men Western: Non-Denim Bottoms',
    'MW-CTS': 'Men Western: Casual T-shirts',
    'MW-CSH': 'Men Western: Casual Shirts',
    'MW-FSH': 'Men Western: Formal Shirts',
    'MW-FTS': 'Men Western: Formal Trouser & Suits',
    'MI-FST': 'Men Indian: Festive Wear',
    'MW-SPT': 'Men: Sports / Athleisure',

    // Women's Categories
    'WW-TOP': 'Women: Western Tops',
    'WW-DRS': 'Women: Western Dress, Jackets and Blazers',
    'WW-DNM': 'Women Western Denim Bottoms',
    'WW-NDB': 'Women Western Non-Denim Bottoms',
    'WW-KUR': 'Women Indian Kurta/SKD/Bottoms',
    'WW-SAR': 'Women Indian: Saree/Lehenga',
    'WIF-FST': 'Women Indian/Fusion: Festive SKD',
    'WW-SPT': 'Women: Sports / Athleisure',

    // Kids' Categories
    'KW-INF': 'Kids: Infant',
    'KW-BOY': 'Kids: Boys',
    'KW-GRL': 'Kids: Girls',
  };

  return categoryMap[code] || code;
};

// Updated mock category details with specific categories
const mockCategoryDetails: Record<string, CategoryDetail> = {
  // Men's Categories
  'MW-DNM': { id: 'MW-DNM', name: getCategoryName('MW-DNM'), hit: 'H5' },
  'MW-NDB': { id: 'MW-NDB', name: getCategoryName('MW-NDB'), hit: 'H5' },
  'MW-CTS': { id: 'MW-CTS', name: getCategoryName('MW-CTS'), hit: 'H5' },
  'MW-CSH': { id: 'MW-CSH', name: getCategoryName('MW-CSH'), hit: 'H5' },
  'MW-FSH': { id: 'MW-FSH', name: getCategoryName('MW-FSH'), hit: 'H5' },
  'MW-FTS': { id: 'MW-FTS', name: getCategoryName('MW-FTS'), hit: 'H5' },
  'MI-FST': { id: 'MI-FST', name: getCategoryName('MI-FST'), hit: 'H5' },
  'MW-SPT': { id: 'MW-SPT', name: getCategoryName('MW-SPT'), hit: 'H5' },

  // Women's Categories
  'WW-TOP': { id: 'WW-TOP', name: getCategoryName('WW-TOP'), hit: 'H5' },
  'WW-DRS': { id: 'WW-DRS', name: getCategoryName('WW-DRS'), hit: 'H5' },
  'WW-DNM': { id: 'WW-DNM', name: getCategoryName('WW-DNM'), hit: 'H5' },
  'WW-NDB': { id: 'WW-NDB', name: getCategoryName('WW-NDB'), hit: 'H5' },
  'WW-KUR': { id: 'WW-KUR', name: getCategoryName('WW-KUR'), hit: 'H5' },
  'WW-SAR': { id: 'WW-SAR', name: getCategoryName('WW-SAR'), hit: 'H6' },
  'WIF-FST': { id: 'WIF-FST', name: getCategoryName('WIF-FST'), hit: 'H6' },
  'WW-SPT': { id: 'WW-SPT', name: getCategoryName('WW-SPT'), hit: 'H6' },

  // Kids' Categories
  'KW-INF': { id: 'KW-INF', name: getCategoryName('KW-INF'), hit: 'H1' },
  'KW-BOY': { id: 'KW-BOY', name: getCategoryName('KW-BOY'), hit: 'H1' },
  'KW-GRL': { id: 'KW-GRL', name: getCategoryName('KW-GRL'), hit: 'H1' },

  // Keep backward compatibility for testing
  'MW': { id: 'MW', name: 'Menswear', hit: 'H5' },
  'WW': { id: 'WW', name: 'Womenswear', hit: 'H6' },
  'KW': { id: 'KW', name: 'Kidswear', hit: 'H1' },
};

const mockFashionGrades: Record<string, FashionGradeSummary[]> = {
  // Men Western: Denim Bottoms
  'MW-DNM': [
    {
      id: 'CORE',
      name: 'Core',
      options: 156,
      quantity: 87500,
      otbAllocated: 4200000,
      otbUsed: 3570000,
      averageASP: 2099,
      revenue: 18366250,
      margin: 58,
      storeCount: 420,
      pendingApprovals: 2,
      completedPlans: 18,
      totalPlans: 20,
      status: 'On Track',
      pipelineStatus: 'Costing'
    },
    {
      id: 'FASHION',
      name: 'Fashion',
      options: 234,
      quantity: 125000,
      otbAllocated: 5600000,
      otbUsed: 4760000,
      averageASP: 2799,
      revenue: 34987500,
      margin: 56,
      storeCount: 385,
      pendingApprovals: 3,
      completedPlans: 22,
      totalPlans: 25,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Review'
    },
    {
      id: 'ULTIMATE',
      name: 'Ultimate',
      options: 66,
      quantity: 37500,
      otbAllocated: 2200000,
      otbUsed: 1870000,
      averageASP: 3499,
      revenue: 13121250,
      margin: 54,
      storeCount: 180,
      pendingApprovals: 1,
      completedPlans: 8,
      totalPlans: 10,
      status: 'At Risk',
      pipelineStatus: 'Buy Plan Approval'
    }
  ],

  // Men Western: Casual T-shirts
  'MW-CTS': [
    {
      id: 'CORE',
      name: 'Core',
      options: 423,
      quantity: 210000,
      otbAllocated: 4000000,
      otbUsed: 3400000,
      averageASP: 699,
      revenue: 14679000,
      margin: 68,
      storeCount: 420,
      pendingApprovals: 5,
      completedPlans: 35,
      totalPlans: 40,
      status: 'On Track',
      pipelineStatus: 'Costing'
    },
    {
      id: 'FASHION',
      name: 'Fashion',
      options: 347,
      quantity: 175000,
      otbAllocated: 4500000,
      otbUsed: 3825000,
      averageASP: 999,
      revenue: 17482500,
      margin: 65,
      storeCount: 385,
      pendingApprovals: 4,
      completedPlans: 28,
      totalPlans: 33,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Review'
    },
    {
      id: 'FASHION_BASICS',
      name: 'Fashion Basics',
      options: 122,
      quantity: 35000,
      otbAllocated: 1500000,
      otbUsed: 1275000,
      averageASP: 599,
      revenue: 2096500,
      margin: 70,
      storeCount: 420,
      pendingApprovals: 1,
      completedPlans: 10,
      totalPlans: 12,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Review'
    }
  ],

  // Women: Western Tops
  'WW-TOP': [
    {
      id: 'CORE',
      name: 'Core',
      options: 312,
      quantity: 152000,
      otbAllocated: 3850000,
      otbUsed: 3080000,
      averageASP: 1199,
      revenue: 18224800,
      margin: 66,
      storeCount: 420,
      pendingApprovals: 4,
      completedPlans: 28,
      totalPlans: 32,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Approval'
    },
    {
      id: 'FASHION',
      name: 'Fashion',
      options: 456,
      quantity: 190000,
      otbAllocated: 5600000,
      otbUsed: 4480000,
      averageASP: 1799,
      revenue: 34181000,
      margin: 63,
      storeCount: 385,
      pendingApprovals: 6,
      completedPlans: 38,
      totalPlans: 45,
      status: 'On Track',
      pipelineStatus: 'Costing'
    },
    {
      id: 'ULTIMATE',
      name: 'Ultimate',
      options: 93,
      quantity: 30000,
      otbAllocated: 1100000,
      otbUsed: 880000,
      averageASP: 2499,
      revenue: 7497000,
      margin: 60,
      storeCount: 180,
      pendingApprovals: 2,
      completedPlans: 8,
      totalPlans: 11,
      status: 'At Risk',
      pipelineStatus: 'Buy Plan Review'
    },
    {
      id: 'FASHION_BASICS',
      name: 'Fashion Basics',
      options: 62,
      quantity: 8000,
      otbAllocated: 450000,
      otbUsed: 360000,
      averageASP: 899,
      revenue: 719200,
      margin: 68,
      storeCount: 350,
      pendingApprovals: 1,
      completedPlans: 4,
      totalPlans: 6,
      status: 'On Track',
      pipelineStatus: 'Costing'
    }
  ],

  // Kids: Boys
  'KW-BOY': [
    {
      id: 'CORE',
      name: 'Core',
      options: 287,
      quantity: 120000,
      otbAllocated: 3150000,
      otbUsed: 2362500,
      averageASP: 799,
      revenue: 9588000,
      margin: 70,
      storeCount: 385,
      pendingApprovals: 3,
      completedPlans: 16,
      totalPlans: 20,
      status: 'On Track',
      pipelineStatus: 'Costing'
    },
    {
      id: 'FASHION',
      name: 'Fashion',
      options: 312,
      quantity: 135000,
      otbAllocated: 3825000,
      otbUsed: 2868750,
      averageASP: 1099,
      revenue: 14836500,
      margin: 68,
      storeCount: 350,
      pendingApprovals: 4,
      completedPlans: 18,
      totalPlans: 23,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Approval'
    },
    {
      id: 'FASHION_BASICS',
      name: 'Fashion Basics',
      options: 113,
      quantity: 45000,
      otbAllocated: 2025000,
      otbUsed: 1518750,
      averageASP: 599,
      revenue: 2695500,
      margin: 72,
      storeCount: 385,
      pendingApprovals: 2,
      completedPlans: 8,
      totalPlans: 10,
      status: 'At Risk',
      pipelineStatus: 'Buy Plan Review'
    }
  ],

  // Women: Western Dress, Jackets and Blazers
  'WW-DRS': [
    {
      id: 'CORE',
      name: 'Core',
      options: 234,
      quantity: 95000,
      otbAllocated: 4550000,
      otbUsed: 3640000,
      averageASP: 2499,
      revenue: 23740500,
      margin: 64,
      storeCount: 420,
      pendingApprovals: 3,
      completedPlans: 20,
      totalPlans: 23,
      status: 'On Track',
      pipelineStatus: 'Costing'
    },
    {
      id: 'FASHION',
      name: 'Fashion',
      options: 378,
      quantity: 120000,
      otbAllocated: 6550000,
      otbUsed: 5240000,
      averageASP: 3299,
      revenue: 39588000,
      margin: 61,
      storeCount: 385,
      pendingApprovals: 5,
      completedPlans: 30,
      totalPlans: 35,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Review'
    },
    {
      id: 'ULTIMATE',
      name: 'Ultimate',
      options: 66,
      quantity: 25000,
      otbAllocated: 1900000,
      otbUsed: 1520000,
      averageASP: 4999,
      revenue: 12497500,
      margin: 57,
      storeCount: 180,
      pendingApprovals: 1,
      completedPlans: 7,
      totalPlans: 9,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Approval'
    }
  ],

  // Kids: Infant
  'KW-INF': [
    {
      id: 'CORE',
      name: 'Core',
      options: 312,
      quantity: 140000,
      otbAllocated: 2800000,
      otbUsed: 2100000,
      averageASP: 599,
      revenue: 8386000,
      margin: 72,
      storeCount: 385,
      pendingApprovals: 4,
      completedPlans: 20,
      totalPlans: 25,
      status: 'On Track',
      pipelineStatus: 'Costing'
    },
    {
      id: 'FASHION',
      name: 'Fashion',
      options: 267,
      quantity: 120000,
      otbAllocated: 3600000,
      otbUsed: 2700000,
      averageASP: 899,
      revenue: 10788000,
      margin: 68,
      storeCount: 350,
      pendingApprovals: 3,
      completedPlans: 18,
      totalPlans: 22,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Approval'
    },
    {
      id: 'FASHION_BASICS',
      name: 'Fashion Basics',
      options: 44,
      quantity: 20000,
      otbAllocated: 600000,
      otbUsed: 450000,
      averageASP: 399,
      revenue: 798000,
      margin: 75,
      storeCount: 385,
      pendingApprovals: 1,
      completedPlans: 4,
      totalPlans: 5,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Review'
    }
  ],

  // Men Western: Casual Shirts
  'MW-CSH': [
    {
      id: 'CORE',
      name: 'Core',
      options: 234,
      quantity: 88000,
      otbAllocated: 3150000,
      otbUsed: 2677500,
      averageASP: 1599,
      revenue: 14071200,
      margin: 62,
      storeCount: 420,
      pendingApprovals: 3,
      completedPlans: 19,
      totalPlans: 22,
      status: 'On Track',
      pipelineStatus: 'Costing'
    },
    {
      id: 'FASHION',
      name: 'Fashion',
      options: 321,
      quantity: 110000,
      otbAllocated: 4500000,
      otbUsed: 3825000,
      averageASP: 1999,
      revenue: 21989000,
      margin: 60,
      storeCount: 385,
      pendingApprovals: 4,
      completedPlans: 24,
      totalPlans: 28,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Review'
    },
    {
      id: 'ULTIMATE',
      name: 'Ultimate',
      options: 90,
      quantity: 22000,
      otbAllocated: 1350000,
      otbUsed: 1147500,
      averageASP: 2799,
      revenue: 6157800,
      margin: 58,
      storeCount: 180,
      pendingApprovals: 1,
      completedPlans: 6,
      totalPlans: 8,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Approval'
    }
  ],

  // Keep backward compatibility data
  'MW': [
    {
      id: 'CORE',
      name: 'Core',
      options: 862,
      quantity: 437500,
      otbAllocated: 15750000,
      otbUsed: 13387500,
      averageASP: 1599,
      revenue: 69956250,
      margin: 65,
      storeCount: 420,
      pendingApprovals: 3,
      completedPlans: 45,
      totalPlans: 50,
      status: 'On Track',
      pipelineStatus: 'Costing'
    },
    {
      id: 'FASHION',
      name: 'Fashion',
      options: 1382,
      quantity: 500000,
      otbAllocated: 18000000,
      otbUsed: 15300000,
      averageASP: 1999,
      revenue: 99950000,
      margin: 60,
      storeCount: 385,
      pendingApprovals: 5,
      completedPlans: 58,
      totalPlans: 65,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Review'
    },
    {
      id: 'ULTIMATE',
      name: 'Ultimate',
      options: 345,
      quantity: 125000,
      otbAllocated: 4500000,
      otbUsed: 3600000,
      averageASP: 3299,
      revenue: 41237500,
      margin: 55,
      storeCount: 180,
      pendingApprovals: 2,
      completedPlans: 14,
      totalPlans: 18,
      status: 'At Risk',
      pipelineStatus: 'Buy Plan Approval'
    },
    {
      id: 'FASHION_BASICS',
      name: 'Fashion Basics',
      options: 867,
      quantity: 187500,
      otbAllocated: 6750000,
      otbUsed: 5962500,
      averageASP: 999,
      revenue: 18731250,
      margin: 68,
      storeCount: 420,
      pendingApprovals: 2,
      completedPlans: 28,
      totalPlans: 32,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Review'
    }
  ],
  'WW': [
    {
      id: 'CORE',
      name: 'Core',
      options: 824,
      quantity: 435000,
      otbAllocated: 15600000,
      otbUsed: 12480000,
      averageASP: 1799,
      revenue: 78256500,
      margin: 68,
      storeCount: 420,
      pendingApprovals: 4,
      completedPlans: 48,
      totalPlans: 52,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Approval'
    },
    {
      id: 'FASHION',
      name: 'Fashion',
      options: 1854,
      quantity: 652500,
      otbAllocated: 23400000,
      otbUsed: 19890000,
      averageASP: 2399,
      revenue: 156534750,
      margin: 63,
      storeCount: 385,
      pendingApprovals: 8,
      completedPlans: 75,
      totalPlans: 85,
      status: 'On Track',
      pipelineStatus: 'Costing'
    },
    {
      id: 'ULTIMATE',
      name: 'Ultimate',
      options: 494,
      quantity: 174000,
      otbAllocated: 6240000,
      otbUsed: 4680000,
      averageASP: 3999,
      revenue: 69582600,
      margin: 58,
      storeCount: 180,
      pendingApprovals: 3,
      completedPlans: 22,
      totalPlans: 28,
      status: 'At Risk',
      pipelineStatus: 'Buy Plan Review'
    },
    {
      id: 'FASHION_BASICS',
      name: 'Fashion Basics',
      options: 948,
      quantity: 188500,
      otbAllocated: 6760000,
      otbUsed: 4550000,
      averageASP: 1199,
      revenue: 22601150,
      margin: 70,
      storeCount: 420,
      pendingApprovals: 3,
      completedPlans: 22,
      totalPlans: 30,
      status: 'Behind Schedule',
      pipelineStatus: 'Buy Plan Review'
    }
  ],
  'KW': [
    {
      id: 'CORE',
      name: 'Core',
      options: 893,
      quantity: 392000,
      otbAllocated: 11200000,
      otbUsed: 8960000,
      averageASP: 799,
      revenue: 31320800,
      margin: 70,
      storeCount: 385,
      pendingApprovals: 8,
      completedPlans: 32,
      totalPlans: 42,
      status: 'At Risk',
      pipelineStatus: 'Costing'
    },
    {
      id: 'FASHION',
      name: 'Fashion',
      options: 782,
      quantity: 343000,
      otbAllocated: 9800000,
      otbUsed: 7350000,
      averageASP: 999,
      revenue: 34265700,
      margin: 65,
      storeCount: 350,
      pendingApprovals: 10,
      completedPlans: 28,
      totalPlans: 40,
      status: 'At Risk',
      pipelineStatus: 'Buy Plan Approval'
    },
    {
      id: 'ULTIMATE',
      name: 'Ultimate',
      options: 112,
      quantity: 49000,
      otbAllocated: 1400000,
      otbUsed: 980000,
      averageASP: 1599,
      revenue: 7835100,
      margin: 60,
      storeCount: 120,
      pendingApprovals: 2,
      completedPlans: 8,
      totalPlans: 11,
      status: 'On Track',
      pipelineStatus: 'Costing'
    },
    {
      id: 'FASHION_BASICS',
      name: 'Fashion Basics',
      options: 447,
      quantity: 196000,
      otbAllocated: 5600000,
      otbUsed: 2310000,
      averageASP: 599,
      revenue: 11740400,
      margin: 72,
      storeCount: 385,
      pendingApprovals: 5,
      completedPlans: 21,
      totalPlans: 32,
      status: 'Behind Schedule',
      pipelineStatus: 'Buy Plan Review'
    }
  ],
  'ACC': [
    {
      id: 'CORE',
      name: 'Core',
      options: 704,
      quantity: 337500,
      otbAllocated: 6750000,
      otbUsed: 5062500,
      averageASP: 599,
      revenue: 20216250,
      margin: 72,
      storeCount: 350,
      pendingApprovals: 2,
      completedPlans: 28,
      totalPlans: 30,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Approval'
    },
    {
      id: 'FASHION',
      name: 'Fashion',
      options: 470,
      quantity: 225000,
      otbAllocated: 4500000,
      otbUsed: 3375000,
      averageASP: 899,
      revenue: 20227500,
      margin: 68,
      storeCount: 320,
      pendingApprovals: 3,
      completedPlans: 18,
      totalPlans: 22,
      status: 'On Track',
      pipelineStatus: 'Costing'
    },
    {
      id: 'ULTIMATE',
      name: 'Ultimate',
      options: 125,
      quantity: 60000,
      otbAllocated: 1200000,
      otbUsed: 840000,
      averageASP: 1299,
      revenue: 7794000,
      margin: 65,
      storeCount: 150,
      pendingApprovals: 1,
      completedPlans: 7,
      totalPlans: 9,
      status: 'On Track',
      pipelineStatus: 'Buy Plan Approval'
    },
    {
      id: 'FASHION_BASICS',
      name: 'Fashion Basics',
      options: 268,
      quantity: 127500,
      otbAllocated: 2550000,
      otbUsed: 1222500,
      averageASP: 499,
      revenue: 6362250,
      margin: 75,
      storeCount: 350,
      pendingApprovals: 2,
      completedPlans: 12,
      totalPlans: 17,
      status: 'Behind Schedule',
      pipelineStatus: 'Costing'
    }
  ]
};

export default function BuyPlanFashionGradePage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedGradeAudit, setSelectedGradeAudit] = useState<string>('');

  const category = categoryId ? mockCategoryDetails[categoryId] : null;
  const fashionGrades = categoryId ? mockFashionGrades[categoryId] || [] : [];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 300);
  }, [categoryId]);

  // Calculate totals
  const totals = fashionGrades.reduce((acc, grade) => ({
    options: acc.options + grade.options,
    quantity: acc.quantity + grade.quantity,
    otbAllocated: acc.otbAllocated + grade.otbAllocated,
    otbUsed: acc.otbUsed + grade.otbUsed,
    revenue: acc.revenue + grade.revenue,
    completedPlans: acc.completedPlans + grade.completedPlans,
    totalPlans: acc.totalPlans + grade.totalPlans,
    pendingApprovals: acc.pendingApprovals + grade.pendingApprovals
  }), { options: 0, quantity: 0, otbAllocated: 0, otbUsed: 0, revenue: 0, completedPlans: 0, totalPlans: 0, pendingApprovals: 0 });

  const otbUsagePercentage = totals.otbAllocated > 0 ? Math.round((totals.otbUsed / totals.otbAllocated) * 100) : 0;
  const planCompletionPercentage = totals.totalPlans > 0 ? Math.round((totals.completedPlans / totals.totalPlans) * 100) : 0;

  // Mock audit trail data
  const getAuditTrailData = (grade: string) => {
    const auditData = {
      CORE: {
        workflowId: 'BP085000455502AWSS2026H5',
        createdDate: '2024-03-15 09:30 AM',
        lastModified: '2024-03-18 02:45 PM',
        status: 'Approved',
        approvedBy: 'Rajesh Kumar',
        approvalDate: '2024-03-18 03:00 PM',
        changes: [
          { field: 'Buy Options', from: '850', to: '862', user: 'Priya Sharma', date: '2024-03-16 10:00 AM' },
          { field: 'OTB Allocation', from: '₹15.5 Cr', to: '₹15.75 Cr', user: 'Amit Patel', date: '2024-03-17 11:30 AM' },
          { field: 'ASP Target', from: '₹1,499', to: '₹1,599', user: 'Priya Sharma', date: '2024-03-17 02:00 PM' }
        ]
      },
      FASHION: {
        workflowId: 'BP085000455503AWSS2026H5',
        createdDate: '2024-03-14 10:00 AM',
        lastModified: '2024-03-19 11:30 AM',
        status: 'Under Review',
        approvedBy: '-',
        approvalDate: '-',
        changes: [
          { field: 'Fashion Mix', from: '38%', to: '40%', user: 'Vikram Singh', date: '2024-03-15 09:00 AM' },
          { field: 'Buy Options', from: '1,350', to: '1,382', user: 'Neha Gupta', date: '2024-03-16 03:00 PM' },
          { field: 'Store Coverage', from: '370', to: '385', user: 'Vikram Singh', date: '2024-03-18 10:00 AM' }
        ]
      }
    };
    return auditData[grade as keyof typeof auditData] || auditData.CORE;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 h-[92px]" />
        <div className="px-6 py-6 space-y-6">
          <ShimmerKpiGrid />
          <ShimmerTable rows={4} />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          title="Category not found"
          description="The category you're looking for doesn't exist."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="h-[52px] px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/buy-plans')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Go back to Category Overview</span>
            </button>
          </div>
          {category.hit && (
            <div className="text-sm font-semibold text-primary-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3.5 py-1.5">
              {category.hit}
            </div>
          )}
        </div>

        {/* Tab */}
        <div className="h-[40px] px-6 flex items-center">
          <div className="flex gap-6 items-center">
            <button className="px-1 py-3 border-b-2 text-sm font-medium transition-colors border-indigo-700 text-primary-700">
              Fashion Grades
            </button>
            <span className="text-sm text-gray-500">
              — {category.name}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          <KpiCard
            label="OTB Utilization"
            value={otbUsagePercentage.toString()}
            unit="%"
            status={otbUsagePercentage >= 80 ? 'Optimal' : otbUsagePercentage >= 70 ? 'Monitor' : 'At Risk'}
            target={`${getCurrencySymbol()}${(totals.otbUsed / 10000000).toFixed(1)} Cr / ${getCurrencySymbol()}${(totals.otbAllocated / 10000000).toFixed(1)} Cr`}
            progressValue={otbUsagePercentage}
          />
          <KpiCard
            label="Plan Progress"
            value={planCompletionPercentage.toString()}
            unit="%"
            status={planCompletionPercentage >= 80 ? 'On Track' : planCompletionPercentage >= 60 ? 'Monitor' : 'At Risk'}
            target={`${totals.completedPlans} / ${totals.totalPlans} plans`}
            progressValue={planCompletionPercentage}
          />
          <KpiCard
            label="Total Options"
            value={totals.options.toLocaleString()}
            unit=""
            status="Healthy"
            target={`${totals.pendingApprovals} pending approvals`}
          />
          <KpiCard
            label="Expected Revenue"
            value={`${getCurrencySymbol()}${(totals.revenue / 10000000).toFixed(1)}`}
            unit="Cr"
            status="On Track"
            target={`${(totals.quantity / 1000).toFixed(0)} K units`}
          />
        </div>

        {/* Fashion Grades Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Fashion Grades</h3>
            <p className="text-xs text-gray-400 mt-0.5">Performance by fashion grade within {category.name}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <th className="text-left px-4 py-2.5">BUY PLAN ID</th>
                  <th className="text-left px-4 py-2.5">FASHION GRADE</th>
                  <th className="text-right px-4 py-2.5">OPTIONS</th>
                  <th className="text-right px-4 py-2.5">BUY QTY</th>
                  <th className="text-right px-4 py-2.5">OTB USAGE</th>
                  <th className="text-right px-4 py-2.5">AVG ASP</th>
                  <th className="text-right px-4 py-2.5">REVENUE</th>
                  <th className="text-right px-4 py-2.5">MARGIN %</th>
                  <th className="text-center px-4 py-2.5">STORES</th>
                  <th className="text-left px-4 py-2.5">STATUS</th>
                  <th className="w-[40px]"></th>
                  <th className="w-[28px]"></th>
                </tr>
              </thead>
              <tbody>
                {fashionGrades.map((grade) => {
                  const buyPlanId = `BP-${categoryId}-2024-${category?.hit || 'H5'}-${grade.id}`;
                  return (
                    <tr
                      key={grade.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={(e) => {
                        if (!(e.target as HTMLElement).closest('.audit-btn')) {
                          // Navigate to the new Options-based Buy Plan detail page
                          navigate(`/buy-plans/options/${buyPlanId}`);
                        }
                      }}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-primary">{buyPlanId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold",
                            grade.id === 'CORE' ? "bg-blue-100 text-blue-700" :
                            grade.id === 'FASHION' ? "bg-purple-100 text-purple-700" :
                            grade.id === 'ULTIMATE' ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-700"
                          )}>
                            {grade.id === 'FASHION_BASICS' ? 'FB' : grade.id.slice(0, 3)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900">{grade.name}</span>
                          </div>
                        </div>
                      </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-900">{grade.options.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-900">
                        {grade.quantity >= 1000000
                          ? `${(grade.quantity / 1000000).toFixed(1)}M`
                          : `${(grade.quantity / 1000).toFixed(0)} K`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round((grade.otbUsed / grade.otbAllocated) * 100)}%
                        </span>
                        <span className="text-xs text-gray-500">
                          {getCurrencySymbol()}{(grade.otbUsed / 10000000).toFixed(2)} Cr
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-900">{getCurrencySymbol()}{grade.averageASP.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {getCurrencySymbol()}{(grade.revenue / 10000000).toFixed(2)} Cr
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-900">{grade.margin}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-900">{grade.storeCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                        grade.pipelineStatus === 'Buy Plan Review' ? "bg-indigo-50 text-primary-700" :
                        grade.pipelineStatus === 'Costing' ? "bg-amber-50 text-amber-700" :
                        "bg-green-50 text-green-700"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          grade.pipelineStatus === 'Buy Plan Review' ? "bg-indigo-500" :
                          grade.pipelineStatus === 'Costing' ? "bg-amber-500" :
                          "bg-green-500"
                        )} />
                        {grade.pipelineStatus || 'Buy Plan Review'}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <button
                        className="audit-btn p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGradeAudit(grade.id);
                          setShowAuditModal(true);
                        }}
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Audit Trail Modal */}
      {showAuditModal && selectedGradeAudit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Buy Plan History</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedGradeAudit === 'FASHION_BASICS' ? 'Fashion Basics' :
                   selectedGradeAudit.charAt(0) + selectedGradeAudit.slice(1).toLowerCase()} Grade - {category.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAuditModal(false);
                  setSelectedGradeAudit('');
                }}
                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
              {(() => {
                const auditData = getAuditTrailData(selectedGradeAudit);
                return (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Workflow ID</p>
                          <p className="text-sm font-mono text-gray-900">{auditData.workflowId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            auditData.status === 'Approved' ? "bg-green-100 text-green-700" :
                            auditData.status === 'Under Review' ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-700"
                          )}>
                            {auditData.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Created Date</p>
                          <p className="text-sm text-gray-900">{auditData.createdDate}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Last Modified</p>
                          <p className="text-sm text-gray-900">{auditData.lastModified}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Approved By</p>
                          <p className="text-sm text-gray-900">{auditData.approvedBy}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Approval Date</p>
                          <p className="text-sm text-gray-900">{auditData.approvalDate}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Change History</h3>
                      <div className="space-y-3">
                        {auditData.changes.map((change: { field: string; from: string; to: string; user: string; date: string }, index: number) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{change.field}</span>
                                <span className="text-xs text-gray-500">modified</span>
                              </div>
                              <span className="text-xs text-gray-500">{change.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded">{change.from}</span>
                              <span className="text-gray-400">→</span>
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded">{change.to}</span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              By {change.user}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowAuditModal(false);
                  setSelectedGradeAudit('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}