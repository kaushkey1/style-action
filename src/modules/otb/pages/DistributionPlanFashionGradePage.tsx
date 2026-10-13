/* eslint-disable design-system/prefer-section-header -- distribution plan fashion grade uses custom layouts */
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ChevronRight, TruckIcon, Package, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import {
  PageHeader,
  FilterSelect,
  MetricGrid,
  MetricCard,
  ShimmerTable
} from '@/components/ui';
import { StatusBadge } from '../../range/components/StatusBadge';
import { cn } from '@/lib/utils';

interface FashionGradeDistribution {
  id: string;
  categoryCode: string;
  categoryName: string;
  fashionGrade: 'Core' | 'Fashion' | 'Ultimate' | 'Fashion Basics';
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
  linkedBuyPlan: string;
}

// Helper to get category name from code
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
    // Legacy codes (for backward compatibility)
    'MW': 'Menswear',
    'WW': 'Womenswear',
    'KW': 'Kidswear',
    'ACC': 'Accessories'
  };
  return categoryMap[code] || code;
};

// Generate mock data for fashion grades
const generateFashionGradeData = (categoryCode: string): FashionGradeDistribution[] => {
  const categoryName = getCategoryName(categoryCode);
  const grades: Array<'Core' | 'Fashion' | 'Ultimate' | 'Fashion Basics'> = ['Core', 'Fashion', 'Ultimate', 'Fashion Basics'];
  const hits = ['H5', 'H6', 'H1', 'H2'];
  const statuses: Array<'New' | 'Ongoing' | 'Completed'> = ['Completed', 'Ongoing', 'New'];

  const data: FashionGradeDistribution[] = [];

  grades.forEach((grade, gradeIndex) => {
    hits.forEach((hit, hitIndex) => {
      if (Math.random() > 0.3) { // Not all combinations exist
        const baseQty = (gradeIndex === 0 ? 400000 : gradeIndex === 1 ? 350000 : gradeIndex === 2 ? 200000 : 150000);
        const totalQuantity = baseQty + (hitIndex * 50000);
        const allocationRate = 92 + Math.random() * 6;
        const allocatedQuantity = Math.floor(totalQuantity * (allocationRate / 100));
        const p1Ratio = 0.7 + Math.random() * 0.1;

        data.push({
          id: `DP-${categoryCode}-${hit}-${grade.replace(' ', '_').toUpperCase()}`,
          categoryCode,
          categoryName,
          fashionGrade: grade,
          hitMonth: hit,
          totalStores: 350 + Math.floor(Math.random() * 70),
          totalSKUs: 800 + Math.floor(Math.random() * 400),
          totalQuantity,
          allocatedQuantity,
          allocationRate,
          p1Quantity: Math.floor(allocatedQuantity * p1Ratio),
          p3Quantity: Math.floor(allocatedQuantity * (1 - p1Ratio)),
          storeCoverage: 94 + Math.random() * 5,
          storesWithShortfall: Math.floor(Math.random() * 20),
          avgFillRate: 88 + Math.random() * 8,
          status: statuses[Math.floor(Math.random() * statuses.length)] || 'New',
          linkedBuyPlan: `BP-${categoryCode}-2024-${hit}-${grade.replace(' ', '_').toUpperCase()}`
        });
      }
    });
  });

  return data;
};

export default function DistributionPlanFashionGradePage() {
  const navigate = useNavigate();
  const { categoryCode } = useParams<{ categoryCode: string }>();
  const [loading, setLoading] = useState(true);
  const [hitFilter, setHitFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [fashionGrades, setFashionGrades] = useState<FashionGradeDistribution[]>([]);

  const categoryName = getCategoryName(categoryCode || 'MW-CTS');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setFashionGrades(generateFashionGradeData(categoryCode || 'MW-CTS'));
      setLoading(false);
    }, 500);
  }, [categoryCode]);

  const filteredGrades = fashionGrades.filter(grade => {
    if (statusFilter !== 'all' && grade.status !== statusFilter) return false;
    if (hitFilter !== 'all' && grade.hitMonth !== hitFilter) return false;
    if (gradeFilter !== 'all' && grade.fashionGrade !== gradeFilter) return false;
    return true;
  });

  // Calculate totals for metrics
  const totals = filteredGrades.reduce((acc, grade) => ({
    totalStores: Math.max(acc.totalStores, grade.totalStores),
    totalSKUs: acc.totalSKUs + grade.totalSKUs,
    totalQuantity: acc.totalQuantity + grade.totalQuantity,
    allocatedQuantity: acc.allocatedQuantity + grade.allocatedQuantity,
    avgAllocationRate: acc.avgAllocationRate + grade.allocationRate,
    storesWithShortfall: acc.storesWithShortfall + grade.storesWithShortfall
  }), { totalStores: 0, totalSKUs: 0, totalQuantity: 0, allocatedQuantity: 0, avgAllocationRate: 0, storesWithShortfall: 0 });

  const avgAllocationRate = filteredGrades.length > 0 ?
    totals.avgAllocationRate / filteredGrades.length : 0;

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

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case 'Core':
        return 'bg-blue-50 text-blue-700';
      case 'Fashion':
        return 'bg-purple-50 text-purple-700';
      case 'Ultimate':
        return 'bg-amber-50 text-amber-700';
      case 'Fashion Basics':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 h-[92px]" />
        <div className="px-6 py-6">
          <ShimmerTable rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Distribution Plans"
        backTo={{ label: 'Distribution Plans', path: '/distribution-plans' }}
        tabs={[
          { label: 'Fashion Grades', isActive: true }
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
            trend={totals.storesWithShortfall > 30 ? 'down' : 'up'}
          />
        </MetricGrid>

        {/* Fashion Grades Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Fashion Grades - {categoryName}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Click on a row to view detailed distribution plan</p>
              </div>
              <div className="flex items-center gap-2">
                <FilterSelect
                  value={gradeFilter}
                  onChange={setGradeFilter}
                  placeholder="Fashion Grade"
                  options={[
                    { value: 'all', label: 'All Grades' },
                    { value: 'Core', label: 'Core' },
                    { value: 'Fashion', label: 'Fashion' },
                    { value: 'Ultimate', label: 'Ultimate' },
                    { value: 'Fashion Basics', label: 'Fashion Basics' }
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
                    { value: 'H6', label: 'H6' }
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
                  <th className="text-left px-4 py-2.5">DISTRIBUTION PLAN ID</th>
                  <th className="text-left px-4 py-2.5">FASHION GRADE</th>
                  <th className="text-left px-4 py-2.5">HIT</th>
                  <th className="text-center px-4 py-2.5">STORES</th>
                  <th className="text-center px-4 py-2.5">SKUs</th>
                  <th className="text-right px-4 py-2.5">TOTAL QTY</th>
                  <th className="text-right px-4 py-2.5">ALLOCATED</th>
                  <th className="text-right px-4 py-2.5">COVERAGE</th>
                  <th className="text-center px-4 py-2.5">P1/P3 SPLIT</th>
                  <th className="text-left px-4 py-2.5">LINKED BUY PLAN</th>
                  <th className="text-left px-4 py-2.5">STATUS</th>
                  <th className="w-[28px]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map(grade => {
                  const p1Percentage = ((grade.p1Quantity / (grade.p1Quantity + grade.p3Quantity)) * 100).toFixed(0);

                  return (
                    <tr
                      key={grade.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/distribution-plans/${grade.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-primary">{grade.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium",
                          getGradeBadgeColor(grade.fashionGrade)
                        )}>
                          {grade.fashionGrade}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{grade.hitMonth}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium text-gray-900">{grade.totalStores}</span>
                          <span className="text-xs text-gray-500">{grade.storeCoverage.toFixed(1)}% covered</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-900">{grade.totalSKUs.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {grade.totalQuantity >= 1000000
                            ? `${(grade.totalQuantity / 1000000).toFixed(1)}M`
                            : `${(grade.totalQuantity / 1000).toFixed(0)} K`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium text-gray-900">
                            {grade.allocatedQuantity >= 1000000
                              ? `${(grade.allocatedQuantity / 1000000).toFixed(1)}M`
                              : `${(grade.allocatedQuantity / 1000).toFixed(0)} K`}
                          </span>
                          <span className="text-xs text-gray-500">{grade.allocationRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium text-gray-900">{grade.avgFillRate.toFixed(1)}%</span>
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
                        <Link
                          to={`/buy-plans/options/${grade.linkedBuyPlan}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-primary hover:text-primary-800 hover:underline"
                        >
                          {grade.linkedBuyPlan}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(grade.status)}
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