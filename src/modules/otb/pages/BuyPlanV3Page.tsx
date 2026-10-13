import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Card,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  FilterBar,
  FilterSelect,
  EmptyState,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from '@/components/ui';
import { ExternalLink } from 'lucide-react';
import {
  mockBrandBuyPlans,
  getBuyPlanStats,
  getOtbUsagePercentage,
  getStatusBadgeConfig,
  getFashionGradeBadgeClass,
  getTotalExpectedRevenue,
  getAverageASP,
} from '@/data/mockBuyPlanV3';
import { cn, formatCurrency } from '@/lib/utils';
import { useBuyPlanFilters, useCategories } from '../api/buyPlanHooks';

export function BuyPlanV3Page() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('view') || 'category';

  // Category View filters
  const [categoryHitMonth, setCategoryHitMonth] = useState<string>('all');
  const [categoryPod, setCategoryPod] = useState<string>('all');
  const [categoryFG, setCategoryFG] = useState<string>('all');

  // Brand View filters
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [brandSegment, setBrandSegment] = useState<string>('all');
  const [brandFamily, setBrandFamily] = useState<string>('all');
  const [brandHitMonth, setBrandHitMonth] = useState<string>('all');

  const handleTabChange = (value: string) => {
    setSearchParams({ view: value });
  };

  const handleBuyPlanClick = (id: string) => {
    navigate(`/buy-plans/${id}?view=${activeTab}`);
  };

  return (
    <div className="space-y-4 animate-fadeInUp">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList variant="underline">
          <TabsTrigger value="category">Category View</TabsTrigger>
          <TabsTrigger value="brand">Brand View</TabsTrigger>
        </TabsList>

        <TabsContent value="category" className="space-y-4">
          <CategoryView
            hitMonth={categoryHitMonth}
            setHitMonth={setCategoryHitMonth}
            pod={categoryPod}
            setPod={setCategoryPod}
            fashionGrade={categoryFG}
            setFashionGrade={setCategoryFG}
            onBuyPlanClick={handleBuyPlanClick}
          />
        </TabsContent>

        <TabsContent value="brand" className="space-y-4">
          <BrandView
            brand={brandFilter}
            setBrand={setBrandFilter}
            segment={brandSegment}
            setSegment={setBrandSegment}
            family={brandFamily}
            setFamily={setBrandFamily}
            hitMonth={brandHitMonth}
            setHitMonth={setBrandHitMonth}
            onBuyPlanClick={handleBuyPlanClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Category View Component
function CategoryView({
  hitMonth,
  setHitMonth,
  pod,
  setPod,
  fashionGrade,
  setFashionGrade,
  onBuyPlanClick,
}: {
  hitMonth: string;
  setHitMonth: (value: string) => void;
  pod: string;
  setPod: (value: string) => void;
  fashionGrade: string;
  setFashionGrade: (value: string) => void;
  onBuyPlanClick: (id: string) => void;
}) {
  // Fetch filters via React Query
  const { data: apiFilters } = useBuyPlanFilters();

  // Build query params for categories
  const categoryParams = useMemo(() => {
    const params: Record<string, string | number | undefined> = {
      page: 1,
      page_size: 100,
    };
    if (hitMonth !== 'all') params.hit = hitMonth;
    if (pod !== 'all') params.category_group = pod;
    if (fashionGrade !== 'all') params.status = fashionGrade;
    return params;
  }, [hitMonth, pod, fashionGrade]);

  // Fetch categories via React Query
  const { data: categoriesData, isLoading: loading } = useCategories(categoryParams);
  const categories = categoriesData?.categories ?? [];

  // Filter dropdown options from API
  const uniqueHits = apiFilters?.hits ?? [];
  const uniqueGroups = apiFilters?.category_groups ?? [];
  const uniqueStatuses = apiFilters?.statuses ?? [];

  const statusBadgeVariant = (status: string) => {
    if (status === 'Completed') return 'success' as const;
    if (status === 'New') return 'default' as const;
    return 'warning' as const;
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4">
          <FilterBar>
            <FilterSelect
              value={hitMonth}
              onChange={setHitMonth}
              placeholder="All Hits"
              options={[
                { value: 'all', label: 'All Hits' },
                ...uniqueHits.map(h => ({ value: h, label: h }))
              ]}
              searchable
            />

            <FilterSelect
              value={pod}
              onChange={setPod}
              placeholder="All Category Groups"
              options={[
                { value: 'all', label: 'All Category Groups' },
                ...uniqueGroups.map(g => ({ value: g, label: g }))
              ]}
              searchable
            />

            <FilterSelect
              value={fashionGrade}
              onChange={setFashionGrade}
              placeholder="All Statuses"
              options={[
                { value: 'all', label: 'All Statuses' },
                ...uniqueStatuses.map(s => ({ value: s, label: s }))
              ]}
              searchable
            />
          </FilterBar>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
          ) : categories.length === 0 ? (
            <EmptyState description="No categories match your filters" className="mt-4" />
          ) : (
            <DataTable className="mt-4">
          <DataTableHeader>
            <DataTableHead>Category</DataTableHead>
            <DataTableHead>Hit</DataTableHead>
            <DataTableHead align="right">Expected Revenue</DataTableHead>
            <DataTableHead align="right">Total OTB</DataTableHead>
            <DataTableHead align="right">OTB Used</DataTableHead>
            <DataTableHead align="center">Options</DataTableHead>
            <DataTableHead align="right">ASP</DataTableHead>
            <DataTableHead align="right">Margin %</DataTableHead>
            <DataTableHead>Status</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {categories.map((cat) => (
                <DataTableRow
                  key={cat.id}
                  className="cursor-pointer"
                  onClick={() => onBuyPlanClick(cat.code)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onBuyPlanClick(cat.code);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <DataTableCell>
                    <div>
                      <div className="font-medium text-gray-900">{cat.name}</div>
                      <div className="text-xs text-gray-500">{cat.code}</div>
                    </div>
                  </DataTableCell>
                  <DataTableCell>{cat.hit}</DataTableCell>
                  <DataTableCell align="right" className="font-medium text-primary">
                    {formatCurrency(cat.expected_revenue)}
                  </DataTableCell>
                  <DataTableCell align="right">{formatCurrency(cat.total_otb)}</DataTableCell>
                  <DataTableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{formatCurrency(cat.used_otb)}</span>
                      <span className="text-xs text-gray-500">({cat.otb_usage_percentage}%)</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell align="center">{cat.total_options}</DataTableCell>
                  <DataTableCell align="right">{formatCurrency(cat.average_asp)}</DataTableCell>
                  <DataTableCell align="right">{cat.margin_percentage}%</DataTableCell>
                  <DataTableCell>
                    <Badge variant={statusBadgeVariant(cat.status)} size="sm">
                      {cat.status}
                    </Badge>
                  </DataTableCell>
                </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
          )}
        </div>
      </Card>
    </div>
  );
}

// Brand View Component
function BrandView({
  brand,
  setBrand,
  segment,
  setSegment,
  family,
  setFamily,
  hitMonth,
  setHitMonth,
  onBuyPlanClick,
}: {
  brand: string;
  setBrand: (value: string) => void;
  segment: string;
  setSegment: (value: string) => void;
  family: string;
  setFamily: (value: string) => void;
  hitMonth: string;
  setHitMonth: (value: string) => void;
  onBuyPlanClick: (id: string) => void;
}) {
  // Get unique values for filters
  const uniqueBrands = Array.from(new Set(mockBrandBuyPlans.map(bp => bp.brand)));
  const uniqueSegments = Array.from(new Set(mockBrandBuyPlans.map(bp => bp.segment)));
  const uniqueFamilies = Array.from(new Set(mockBrandBuyPlans.map(bp => bp.family)));
  const uniqueHitMonths = Array.from(new Set(mockBrandBuyPlans.map(bp => bp.hitMonthDisplay)));

  // Filter buy plans
  const filteredPlans = mockBrandBuyPlans.filter(bp => {
    const matchesBrand = brand === 'all' || bp.brand === brand;
    const matchesSegment = segment === 'all' || bp.segment === segment;
    const matchesFamily = family === 'all' || bp.family === family;
    const matchesHitMonth = hitMonth === 'all' || bp.hitMonthDisplay === hitMonth;

    return matchesBrand && matchesSegment && matchesFamily && matchesHitMonth;
  });

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4">
          <FilterBar>
            <FilterSelect
              value={brand}
              onChange={setBrand}
              placeholder="All Brands"
              options={[
                { value: 'all', label: 'All Brands' },
                ...uniqueBrands.map(brandName => ({ value: brandName, label: brandName }))
              ]}
              searchable
            />

            <FilterSelect
              value={segment}
              onChange={setSegment}
              placeholder="All Segments"
              options={[
                { value: 'all', label: 'All Segments' },
                ...uniqueSegments.map(seg => ({ value: seg, label: seg }))
              ]}
              searchable
            />

            <FilterSelect
              value={family}
              onChange={setFamily}
              placeholder="All Families"
              options={[
                { value: 'all', label: 'All Families' },
                ...uniqueFamilies.map(fam => ({ value: fam, label: fam }))
              ]}
              searchable
            />

            <FilterSelect
              value={hitMonth}
              onChange={setHitMonth}
              placeholder="All Hit Months"
              options={[
                { value: 'all', label: 'All Hit Months' },
                ...uniqueHitMonths.map(month => ({ value: month, label: month }))
              ]}
              searchable
            />
          </FilterBar>

          {filteredPlans.length === 0 ? (
            <EmptyState description="No buy plans match your filters" className="mt-4" />
          ) : (
            <DataTable className="mt-4">
          <DataTableHeader>
            <DataTableHead>Buy Plan</DataTableHead>
            <DataTableHead>Brand</DataTableHead>
            <DataTableHead>Segment</DataTableHead>
            <DataTableHead>Family</DataTableHead>
            <DataTableHead>Fashion Grade</DataTableHead>
            <DataTableHead>Hit Month</DataTableHead>
            <DataTableHead align="right">Expected AOP Revenue</DataTableHead>
            <DataTableHead align="right">Total OTB</DataTableHead>
            <DataTableHead align="right">OTB Consumed</DataTableHead>
            <DataTableHead align="center">Options</DataTableHead>
            <DataTableHead align="right">ASP</DataTableHead>
            <DataTableHead>Range Plan</DataTableHead>
            <DataTableHead>Status</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {filteredPlans.map((plan) => {
              const stats = getBuyPlanStats(plan);
              const otbUsage = getOtbUsagePercentage(plan);
              const statusConfig = getStatusBadgeConfig(plan.status);
              const avgSellingPrice = getAverageASP(plan);

              return (
                <DataTableRow
                  key={plan.id}
                  className="cursor-pointer"
                  onClick={() => onBuyPlanClick(plan.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onBuyPlanClick(plan.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                >
                  <DataTableCell>
                    <span className="font-medium text-gray-900">BP-{plan.id.slice(-3)}</span>
                  </DataTableCell>
                  <DataTableCell className="font-medium text-gray-900">{plan.brand}</DataTableCell>
                  <DataTableCell>{plan.segment}</DataTableCell>
                  <DataTableCell>{plan.family}</DataTableCell>
                  <DataTableCell>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', getFashionGradeBadgeClass(plan.fashionGrade))}>
                      {plan.fashionGrade}
                    </span>
                  </DataTableCell>
                  <DataTableCell>{plan.hitMonthDisplay}</DataTableCell>
                  <DataTableCell align="right" className="font-medium text-primary">
                    {formatCurrency(getTotalExpectedRevenue(plan))}
                  </DataTableCell>
                  <DataTableCell align="right">{formatCurrency(plan.otbAllocated)}</DataTableCell>
                  <DataTableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{formatCurrency(stats.totalValue)}</span>
                      <span className="text-xs text-gray-500">({otbUsage.toFixed(0)}%)</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell align="center">{stats.totalOptions}</DataTableCell>
                  <DataTableCell align="right">{formatCurrency(avgSellingPrice)}</DataTableCell>
                  <DataTableCell onClick={(e) => e.stopPropagation()}>
                    <Link
                      to={`/range/${plan.rangePlanId}`}
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {plan.rangePlan}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant={statusConfig.label === 'Draft' ? 'default' : statusConfig.label === 'Approved' ? 'success' : 'warning'} size="sm">
                      {statusConfig.label}
                    </Badge>
                  </DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>
        </DataTable>
          )}
        </div>
      </Card>
    </div>
  );
}