import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  Badge,
  Card,
  EmptyState,
  FilterBar,
  FilterSelect,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  MetricGrid,
  MetricCard,
} from '@/components/ui';
import {
  CheckCircle,
  TruckIcon,
  Clock,
  Package,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import {
  mockDistributionPlans,
  getStatusBadgeConfig,
  type AllocationStatus,
} from '@/data/mockDistributionPlan';
import { mockCategoryBuyPlans, mockBrandBuyPlans } from '@/data/mockBuyPlanV3';

export function DistributionPlanPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<AllocationStatus | 'all'>('all');

  // Helper to get buy plan name
  const getBuyPlanName = (buyPlanId: string) => {
    const categoryPlan = mockCategoryBuyPlans.find(p => p.id === buyPlanId);
    if (categoryPlan) {
      return categoryPlan.pod.name; // e.g., "Menswear Shirts"
    }
    const brandPlan = mockBrandBuyPlans.find(p => p.id === buyPlanId);
    if (brandPlan) {
      return `${brandPlan.brand} - ${brandPlan.family}`; // e.g., "DNMX - Shirts"
    }
    return buyPlanId;
  };

  const filteredPlans = mockDistributionPlans.filter(plan => {
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesStatus;
  });

  // Calculate summary metrics
  const totalPlans = mockDistributionPlans.length;
  const activePlans = mockDistributionPlans.filter(p => p.status === 'in_progress').length;
  const totalOptions = mockDistributionPlans.reduce((sum, p) => sum + p.metrics.totalOptions, 0);
  const totalAllocatedQty = mockDistributionPlans.reduce((sum, p) => sum + p.metrics.totalAllocatedQty, 0);
  const avgAllocationRate = mockDistributionPlans.reduce((sum, p) => sum + p.metrics.allocationRate, 0) / totalPlans;

  const handlePlanClick = (planId: string) => {
    navigate(`/distribution-plans/${planId}`);
  };

  return (
    <div className="space-y-4 animate-fadeInUp">
      <PageHeader title="Distribution Plans" />

      <MetricGrid columns={5}>
        <MetricCard
          icon={TruckIcon}
          label="Total Plans"
          value={totalPlans.toString()}
        />
        <MetricCard
          icon={Clock}
          label="Active Plans"
          value={activePlans.toString()}
        />
        <MetricCard
          icon={Package}
          label="Total Options"
          value={totalOptions.toLocaleString()}
        />
        <MetricCard
          icon={BarChart3}
          label="Units Allocated"
          value={totalAllocatedQty.toLocaleString()}
        />
        <MetricCard
          icon={TrendingUp}
          label="Avg Allocation"
          value={`${avgAllocationRate.toFixed(1)}%`}
        />
      </MetricGrid>

      <Card>
        <div className="p-4">
          <FilterBar>
            <FilterSelect
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as AllocationStatus | 'all')}
              placeholder="All Statuses"
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'pending_approval', label: 'Pending Approval' },
                { value: 'approved', label: 'Approved' },
                { value: 'executed', label: 'Executed' },
              ]}
            />
          </FilterBar>

          {filteredPlans.length === 0 ? (
            <EmptyState description="No distribution plans match your current filters" className="mt-4" />
          ) : (
            <DataTable className="mt-4">
              <DataTableHeader>
                <DataTableHead>Plan Name</DataTableHead>
                <DataTableHead align="center">Stores</DataTableHead>
                <DataTableHead align="center">SKUs</DataTableHead>
                <DataTableHead align="right">Total Quantity</DataTableHead>
                <DataTableHead align="right">Allocated</DataTableHead>
                <DataTableHead align="right">Coverage</DataTableHead>
                <DataTableHead align="center">P1/P3 Split</DataTableHead>
                <DataTableHead>Hit Month</DataTableHead>
                <DataTableHead>Linked Buy Plan</DataTableHead>
                <DataTableHead>Last Modified</DataTableHead>
                <DataTableHead>Status</DataTableHead>
              </DataTableHeader>
              <DataTableBody>
                {filteredPlans.map(plan => {
                  const statusConfig = getStatusBadgeConfig(plan.status);
                  const p1Percentage = plan.metrics.p1Qty ?
                    (plan.metrics.p1Qty / (plan.metrics.p1Qty + plan.metrics.p3Qty) * 100).toFixed(0) :
                    '0';

                  return (
                    <DataTableRow
                      key={plan.id}
                      className="cursor-pointer"
                      onClick={() => handlePlanClick(plan.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePlanClick(plan.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                    >
                      <DataTableCell>
                        <div>
                          <div className="font-medium text-gray-900">{plan.name}</div>
                          <div className="text-xs text-gray-500">{plan.id}</div>
                        </div>
                      </DataTableCell>
                      <DataTableCell align="center">
                        <span className="font-medium">{plan.metrics.totalStores}</span>
                      </DataTableCell>
                      <DataTableCell align="center">
                        <span className="font-medium">{plan.metrics.totalOptions}</span>
                      </DataTableCell>
                      <DataTableCell align="right">
                        <span className="font-medium">{plan.metrics.totalBuyQty.toLocaleString()}</span>
                      </DataTableCell>
                      <DataTableCell align="right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">{plan.metrics.totalAllocatedQty.toLocaleString()}</span>
                          {plan.metrics.storesWithShortfall > 0 && (
                            <Badge variant="warning" size="sm">
                              {plan.metrics.storesWithShortfall} stores short
                            </Badge>
                          )}
                        </div>
                      </DataTableCell>
                      <DataTableCell align="right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{plan.metrics.allocationRate.toFixed(1)}%</span>
                            {plan.metrics.allocationRate >= 90 && (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">of target</span>
                        </div>
                      </DataTableCell>
                      <DataTableCell align="center">
                        {plan.metrics.p1Qty > 0 && (
                          <div className="flex flex-col items-center text-xs">
                            <span className="font-medium">{p1Percentage}% / {100 - parseInt(p1Percentage)}%</span>
                            <span className="text-gray-500">P1 / P3</span>
                          </div>
                        )}
                      </DataTableCell>
                      <DataTableCell>
                        <span className="text-xs text-gray-700">{plan.hitMonth}</span>
                      </DataTableCell>
                      <DataTableCell>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/buy-plans/${plan.buyPlanId}`);
                          }}
                          className="text-xs text-primary-600 hover:text-primary-700 hover:underline text-left"
                        >
                          {getBuyPlanName(plan.buyPlanId)}
                        </button>
                      </DataTableCell>
                      <DataTableCell>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-700 whitespace-nowrap">
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {new Date(plan.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </DataTableCell>
                      <DataTableCell>
                        <Badge variant={statusConfig.variant} size="sm">
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