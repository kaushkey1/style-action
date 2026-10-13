/* eslint-disable design-system/prefer-section-header -- distribution plan category uses custom layouts */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, TruckIcon, Package, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import {
  PageHeader,
  FilterSelect,
  MetricGrid,
  MetricCard,
} from '@/components/ui';
import { StatusBadge } from '../../range/components/StatusBadge';
import { cn } from '@/lib/utils';

interface CategoryDistributionSummary {
  id: string;
  categoryCode: string;
  categoryName: string;
  hitMonth: string;
  totalStores: number;
  totalSKUs: number;
  totalQuantity: number;
  allocatedQuantity: number;
  allocationRate: number;
  p1Quantity: number;
  p3Quantity: number;
  storeCoverage: number;
  storesWithShortfall: number;
  avgFillRate: number;
  status: 'New' | 'Ongoing' | 'Completed';
}

// Helper function to get full category name
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

// Mock data for category-level distribution summaries with specific categories
const mockCategoryDistributions: CategoryDistributionSummary[] = [
  // Men's categories
  {
    id: 'DP-MW-DNM-001',
    categoryCode: 'MW-DNM',
    categoryName: getCategoryName('MW-DNM'),
    hitMonth: 'H5',
    totalStores: 420,
    totalSKUs: 456,
    totalQuantity: 250000,
    allocatedQuantity: 237500,
    allocationRate: 95.0,
    p1Quantity: 178125,
    p3Quantity: 59375,
    storeCoverage: 98.5,
    storesWithShortfall: 8,
    avgFillRate: 92.3,
    status: 'Completed'
  },
  {
    id: 'DP-MW-CTS-001',
    categoryCode: 'MW-CTS',
    categoryName: getCategoryName('MW-CTS'),
    hitMonth: 'H5',
    totalStores: 420,
    totalSKUs: 678,
    totalQuantity: 450000,
    allocatedQuantity: 423000,
    allocationRate: 94.0,
    p1Quantity: 317250,
    p3Quantity: 105750,
    storeCoverage: 97.8,
    storesWithShortfall: 10,
    avgFillRate: 91.5,
    status: 'Ongoing'
  },
  {
    id: 'DP-MW-CSH-001',
    categoryCode: 'MW-CSH',
    categoryName: getCategoryName('MW-CSH'),
    hitMonth: 'H5',
    totalStores: 420,
    totalSKUs: 543,
    totalQuantity: 380000,
    allocatedQuantity: 349600,
    allocationRate: 92.0,
    p1Quantity: 262200,
    p3Quantity: 87400,
    storeCoverage: 95.2,
    storesWithShortfall: 12,
    avgFillRate: 89.8,
    status: 'Ongoing'
  },
  // Women's categories
  {
    id: 'DP-WW-TOP-001',
    categoryCode: 'WW-TOP',
    categoryName: getCategoryName('WW-TOP'),
    hitMonth: 'H5',
    totalStores: 420,
    totalSKUs: 890,
    totalQuantity: 520000,
    allocatedQuantity: 494000,
    allocationRate: 95.0,
    p1Quantity: 370500,
    p3Quantity: 123500,
    storeCoverage: 99.1,
    storesWithShortfall: 4,
    avgFillRate: 93.5,
    status: 'Completed'
  },
  {
    id: 'DP-WW-DRS-001',
    categoryCode: 'WW-DRS',
    categoryName: getCategoryName('WW-DRS'),
    hitMonth: 'H5',
    totalStores: 420,
    totalSKUs: 654,
    totalQuantity: 340000,
    allocatedQuantity: 312800,
    allocationRate: 92.0,
    p1Quantity: 234600,
    p3Quantity: 78200,
    storeCoverage: 96.5,
    storesWithShortfall: 9,
    avgFillRate: 90.2,
    status: 'Ongoing'
  },
  {
    id: 'DP-WW-KUR-001',
    categoryCode: 'WW-KUR',
    categoryName: getCategoryName('WW-KUR'),
    hitMonth: 'H5',
    totalStores: 420,
    totalSKUs: 432,
    totalQuantity: 280000,
    allocatedQuantity: 252000,
    allocationRate: 90.0,
    p1Quantity: 189000,
    p3Quantity: 63000,
    storeCoverage: 94.8,
    storesWithShortfall: 15,
    avgFillRate: 88.5,
    status: 'New'
  },
  // Kids' categories
  {
    id: 'DP-KW-BOY-001',
    categoryCode: 'KW-BOY',
    categoryName: getCategoryName('KW-BOY'),
    hitMonth: 'H5',
    totalStores: 380,
    totalSKUs: 567,
    totalQuantity: 320000,
    allocatedQuantity: 294400,
    allocationRate: 92.0,
    p1Quantity: 220800,
    p3Quantity: 73600,
    storeCoverage: 95.2,
    storesWithShortfall: 11,
    avgFillRate: 89.8,
    status: 'Ongoing'
  },
  {
    id: 'DP-KW-GRL-001',
    categoryCode: 'KW-GRL',
    categoryName: getCategoryName('KW-GRL'),
    hitMonth: 'H5',
    totalStores: 380,
    totalSKUs: 589,
    totalQuantity: 340000,
    allocatedQuantity: 306000,
    allocationRate: 90.0,
    p1Quantity: 229500,
    p3Quantity: 76500,
    storeCoverage: 93.5,
    storesWithShortfall: 14,
    avgFillRate: 88.2,
    status: 'New'
  },
  // Additional categories for H6
  {
    id: 'DP-MW-FSH-002',
    categoryCode: 'MW-FSH',
    categoryName: getCategoryName('MW-FSH'),
    hitMonth: 'H6',
    totalStores: 420,
    totalSKUs: 345,
    totalQuantity: 180000,
    allocatedQuantity: 165600,
    allocationRate: 92.0,
    p1Quantity: 124200,
    p3Quantity: 41400,
    storeCoverage: 96.5,
    storesWithShortfall: 7,
    avgFillRate: 90.2,
    status: 'New'
  },
  {
    id: 'DP-WW-DNM-002',
    categoryCode: 'WW-DNM',
    categoryName: getCategoryName('WW-DNM'),
    hitMonth: 'H6',
    totalStores: 420,
    totalSKUs: 456,
    totalQuantity: 380000,
    allocatedQuantity: 342000,
    allocationRate: 90.0,
    p1Quantity: 256500,
    p3Quantity: 85500,
    storeCoverage: 94.8,
    storesWithShortfall: 12,
    avgFillRate: 88.5,
    status: 'New'
  }
];

export default function DistributionPlanCategoryPage() {
  const navigate = useNavigate();
  const [hitFilter, setHitFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<CategoryDistributionSummary[]>([]);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setCategories(mockCategoryDistributions);
    }, 500);
  }, []);

  const filteredCategories = categories.filter(cat => {
    if (statusFilter !== 'all' && cat.status !== statusFilter) return false;
    if (hitFilter !== 'all' && cat.hitMonth !== hitFilter) return false;
    if (categoryFilter !== 'all' && cat.categoryCode !== categoryFilter) return false;
    return true;
  });

  // Calculate totals for metrics
  const totals = filteredCategories.reduce((acc, cat) => ({
    totalStores: Math.max(acc.totalStores, cat.totalStores),
    totalSKUs: acc.totalSKUs + cat.totalSKUs,
    totalQuantity: acc.totalQuantity + cat.totalQuantity,
    allocatedQuantity: acc.allocatedQuantity + cat.allocatedQuantity,
    avgAllocationRate: acc.avgAllocationRate + cat.allocationRate,
    storesWithShortfall: acc.storesWithShortfall + cat.storesWithShortfall
  }), { totalStores: 0, totalSKUs: 0, totalQuantity: 0, allocatedQuantity: 0, avgAllocationRate: 0, storesWithShortfall: 0 });

  const avgAllocationRate = filteredCategories.length > 0 ?
    totals.avgAllocationRate / filteredCategories.length : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <StatusBadge status="New" />;
      case 'Ongoing':
        return <StatusBadge status="Ongoing" />;
      case 'Completed':
        return <StatusBadge status="Completed" />;
      default:
        return <StatusBadge status="New" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Distribution Plans"
        tabs={[
          { label: 'Category Overview', isActive: true }
        ]}
      />

      <div className="px-6 py-6 space-y-6">
        {/* Metrics */}
        <MetricGrid columns={5}>
          <MetricCard
            icon={TruckIcon}
            label="Total Stores"
            value={totals.totalStores.toString()}
          />
          <MetricCard
            icon={Package}
            label="Total SKUs"
            value={totals.totalSKUs.toLocaleString()}
          />
          <MetricCard
            icon={BarChart3}
            label="Units Allocated"
            value={(totals.allocatedQuantity / 1000000).toFixed(1) + 'M'}
          />
          <MetricCard
            icon={TrendingUp}
            label="Avg Allocation"
            value={avgAllocationRate.toFixed(1) + '%'}
          />
          <MetricCard
            icon={AlertCircle}
            label="Stores with Shortfall"
            value={totals.storesWithShortfall.toString()}
            trend={totals.storesWithShortfall > 20 ? 'down' : 'up'}
          />
        </MetricGrid>

        {/* Categories Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Categories</h3>
                <p className="text-xs text-gray-400 mt-0.5">Click on a category to view fashion grades</p>
              </div>
              <div className="flex items-center gap-2">
                <FilterSelect
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  placeholder="Category"
                  options={[
                    { value: 'all', label: 'All Categories' },
                    // Men's
                    { value: 'MW-DNM', label: 'Men: Denim' },
                    { value: 'MW-NDB', label: 'Men: Non-Denim' },
                    { value: 'MW-CTS', label: 'Men: T-shirts' },
                    { value: 'MW-CSH', label: 'Men: Casual Shirts' },
                    { value: 'MW-FSH', label: 'Men: Formal Shirts' },
                    { value: 'MW-FTS', label: 'Men: Formal Trouser' },
                    { value: 'MI-FST', label: 'Men: Festive' },
                    { value: 'MW-SPT', label: 'Men: Sports' },
                    // Women's
                    { value: 'WW-TOP', label: 'Women: Tops' },
                    { value: 'WW-DRS', label: 'Women: Dress' },
                    { value: 'WW-DNM', label: 'Women: Denim' },
                    { value: 'WW-NDB', label: 'Women: Non-Denim' },
                    { value: 'WW-KUR', label: 'Women: Kurta' },
                    { value: 'WW-SAR', label: 'Women: Saree' },
                    { value: 'WIF-FST', label: 'Women: Fusion' },
                    { value: 'WW-SPT', label: 'Women: Sports' },
                    // Kids
                    { value: 'KW-INF', label: 'Kids: Infant' },
                    { value: 'KW-BOY', label: 'Kids: Boys' },
                    { value: 'KW-GRL', label: 'Kids: Girls' }
                  ]}
                  searchable
                />
                <FilterSelect
                  value={hitFilter}
                  onChange={setHitFilter}
                  placeholder="Hit"
                  options={[
                    { value: 'all', label: 'All Hits' },
                    { value: 'H1', label: 'H1' },
                    { value: 'H2', label: 'H2' },
                    { value: 'H3', label: 'H3' },
                    { value: 'H4', label: 'H4' },
                    { value: 'H5', label: 'H5' },
                    { value: 'H6', label: 'H6' },
                    { value: '07', label: '07' },
                    { value: '08', label: '08' },
                    { value: '09', label: '09' },
                    { value: '10', label: '10' },
                    { value: '11', label: '11' },
                    { value: '12', label: '12' }
                  ]}
                  searchable
                />
                <FilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder="Status"
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'New', label: 'New' },
                    { value: 'Ongoing', label: 'Ongoing' },
                    { value: 'Completed', label: 'Completed' }
                  ]}
                  searchable
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <th className="text-left px-4 py-2.5">CATEGORY</th>
                  <th className="text-left px-4 py-2.5">HIT</th>
                  <th className="text-center px-4 py-2.5">STORES</th>
                  <th className="text-center px-4 py-2.5">SKUs</th>
                  <th className="text-right px-4 py-2.5">TOTAL QTY</th>
                  <th className="text-right px-4 py-2.5">ALLOCATED</th>
                  <th className="text-right px-4 py-2.5">COVERAGE</th>
                  <th className="text-center px-4 py-2.5">P1/P3 SPLIT</th>
                  <th className="text-left px-4 py-2.5">STATUS</th>
                  <th className="w-[28px]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map(category => {
                  const p1Percentage = ((category.p1Quantity / (category.p1Quantity + category.p3Quantity)) * 100).toFixed(0);

                  return (
                    <tr
                      key={category.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/distribution-plans/category/${category.categoryCode}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-8 h-8 rounded-lg text-[10px] font-bold flex items-center justify-center",
                            category.status === 'Completed' ? "bg-green-50 text-green-700" :
                            category.status === 'Ongoing' ? "bg-blue-50 text-blue-700" :
                            category.status === 'New' ? "bg-amber-50 text-amber-700" :
                            "bg-gray-50 text-gray-700"
                          )}>
                            {category.categoryCode}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{category.categoryName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{category.hitMonth}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium text-gray-900">{category.totalStores}</span>
                          <span className="text-xs text-gray-500">{category.storeCoverage}% covered</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-900">{category.totalSKUs.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {category.totalQuantity >= 1000000
                            ? `${(category.totalQuantity / 1000000).toFixed(1)}M`
                            : `${(category.totalQuantity / 1000).toFixed(0)} K`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium text-gray-900">
                            {category.allocatedQuantity >= 1000000
                              ? `${(category.allocatedQuantity / 1000000).toFixed(1)}M`
                              : `${(category.allocatedQuantity / 1000).toFixed(0)} K`}
                          </span>
                          <span className="text-xs text-gray-500">{category.allocationRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium text-gray-900">{category.avgFillRate}%</span>
                          <span className="text-xs text-gray-500">fill rate</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium text-gray-900">{p1Percentage}% / {100 - parseInt(p1Percentage)}%</span>
                          <span className="text-xs text-gray-500">P1 / P3</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(category.status)}
                      </td>
                      <td className="px-2 py-3">
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
    </div>
  );
}