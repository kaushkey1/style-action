/* eslint-disable design-system/prefer-section-header, design-system/prefer-metric-grid -- buy plan uses custom layouts */
import { useState, useMemo } from 'react';
import {
  Badge,
  Button,
  KpiLabel,
  SectionHeader,
  MetricGrid,
  EmptyState,
  FilterBar,
  FilterSelect,
  FilterSearch,
  FilterClear,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
} from '@/components/ui';
import {
  Bot,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  BarChart3,
  Target,
  Zap,
  Download,
  RefreshCw,
} from 'lucide-react';
import {formatCurrencyFromLakhs, cn, getFormattingConfig, getCurrencySymbol} from '@/lib/utils';
import {
  mockCoreReorderProposals,
  type BuyPlan,
  type CoreReorderProposal,
} from '../data/mockBuyPlan';
import { useSearch } from '@/hooks/useSearch';

// ─── Types & Constants ───────────────────────────────────────────────────────

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'Basics', label: 'Basics' },
  { value: 'Bottoms', label: 'Bottoms' },
  { value: 'Tops', label: 'Tops' },
  { value: 'Outerwear', label: 'Outerwear' },
];

const brandOptions = [
  { value: 'all', label: 'All Brands' },
  { value: 'Essentials', label: 'Essentials' },
  { value: 'Comfort Zone', label: 'Comfort Zone' },
  { value: 'Denim Basics', label: 'Denim Basics' },
  { value: 'Casual Comfort', label: 'Casual Comfort' },
  { value: 'Classic Polo', label: 'Classic Polo' },
];

const velocityOptions = [
  { value: 'all', label: 'All Velocity' },
  { value: 'high', label: 'High Velocity' },
  { value: 'medium', label: 'Medium Velocity' },
  { value: 'low', label: 'Low Velocity' },
];

const riskLevelOptions = [
  { value: 'all', label: 'All Risk Levels' },
  { value: 'low', label: 'Low Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'high', label: 'High Risk' },
];

// ─── Helper Functions ────────────────────────────────────────────────────────

function getStockStatusColor(weeksOfStock: number): string {
  if (weeksOfStock >= 8) return 'text-green-700';
  if (weeksOfStock >= 4) return 'text-amber-700';
  return 'text-red-700';
}

function getVelocityBadgeVariant(velocity: string): 'success' | 'warning' | 'default' {
  switch (velocity) {
    case 'high': return 'success';
    case 'medium': return 'warning';
    case 'low': return 'default';
    default: return 'default';
  }
}

function getConfidenceBadgeVariant(score: number): 'success' | 'warning' | 'error' {
  if (score >= 85) return 'success';
  if (score >= 70) return 'warning';
  return 'error';
}

function getRiskLevel(proposal: CoreReorderProposal): 'low' | 'medium' | 'high' {
  if (proposal.riskFactors.length === 0 && proposal.confidenceScore >= 85) return 'low';
  if (proposal.riskFactors.length <= 1 && proposal.confidenceScore >= 70) return 'medium';
  return 'high';
}

// ─── VMI Summary Cards ───────────────────────────────────────────────────────

function VMISummaryCards({ buyPlan }: { buyPlan?: BuyPlan }) {
  if (!buyPlan) return null;

  const proposals = mockCoreReorderProposals;
  const totalValue = proposals.reduce((sum, p) => sum + p.totalCost, 0);
  const lowStockCount = proposals.filter(p => p.weeksOfStock < 4).length;
  const avgConfidence = proposals.reduce((sum, p) => sum + p.confidenceScore, 0) / proposals.length;
  const automationRate = 78; // Mock automation rate

  return (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
      <SectionHeader
        title={<><Bot className="w-5 h-5 text-blue-600 mr-2" /><KpiLabel abbr="VMI" /> Auto-Replenishment System</>}
        subtitle="Last updated: 2 hours ago"
        actions={
          <Badge variant="info" size="sm">
            <Zap className="w-3 h-3" />
            Active
          </Badge>
        }
        className="mb-4"
      />

      {/* Metrics Grid */}
      <MetricGrid columns={4}>
        <div className="bg-white rounded-lg border border-blue-200 p-3">
          <div className="flex items-center justify-between gap-1 mb-2">
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900">Total Value</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrencyFromLakhs(totalValue / 100000)}</p>
          <p className="text-xs text-gray-500 mt-1">{proposals.length} articles</p>
        </div>

        <div className="bg-white rounded-lg border border-blue-200 p-3">
          <div className="flex items-center justify-between gap-1 mb-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900">Low Stock</span>
            </div>
            <Badge variant="error" size="sm">Urgent</Badge>
          </div>
          <p className="text-2xl font-bold text-red-700">{lowStockCount}</p>
          <p className="text-xs text-gray-500 mt-1">&lt;4 weeks stock</p>
        </div>

        <div className="bg-white rounded-lg border border-blue-200 p-3">
          <div className="flex items-center justify-between gap-1 mb-2">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900">AI Confidence</span>
            </div>
            <Badge variant="success" size="sm">High</Badge>
          </div>
          <p className="text-2xl font-bold text-green-700">{avgConfidence.toFixed(0)}%</p>
          <p className="text-xs text-gray-500 mt-1">average score</p>
        </div>

        <div className="bg-white rounded-lg border border-blue-200 p-3">
          <div className="flex items-center justify-between gap-1 mb-2">
            <div className="flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-900">Automation</span>
            </div>
            <Badge variant="success" size="sm">Enabled</Badge>
          </div>
          <p className="text-2xl font-bold text-blue-700">{automationRate}%</p>
          <p className="text-xs text-gray-500 mt-1">auto-approved</p>
        </div>
      </MetricGrid>

      {/* System Info */}
      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <p className="text-sm text-blue-900 font-medium mb-1">System Overview</p>
        <p className="text-xs text-blue-800">
          VMI system automatically monitors stock levels, revenue velocity, and seasonal trends to generate optimized reorder proposals.
          High-confidence recommendations (85%+) are auto-approved for seamless replenishment.
        </p>
      </div>
    </div>
  );
}

// ─── Core Articles Table ─────────────────────────────────────────────────────

interface CoreArticlesTableProps {
  proposals: CoreReorderProposal[];
}

function CoreArticlesTable({ proposals }: CoreArticlesTableProps) {
  if (proposals.length === 0) {
    return <EmptyState description="No reorder proposals match your current filters" />;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <DataTable>
        <DataTableHeader>
          <DataTableHead>Article</DataTableHead>
          <DataTableHead>Brand</DataTableHead>
          <DataTableHead align="center">Current Stock</DataTableHead>
          <DataTableHead align="center">Revenue Velocity</DataTableHead>
          <DataTableHead align="center">Weeks of Stock</DataTableHead>
          <DataTableHead align="right">Unit Cost</DataTableHead>
          <DataTableHead align="center">Proposed Qty</DataTableHead>
          <DataTableHead align="right">Total Cost</DataTableHead>
          <DataTableHead align="center">Confidence</DataTableHead>
          <DataTableHead align="center">Status</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {proposals.map((proposal) => {
            const stockColor = getStockStatusColor(proposal.weeksOfStock);
            const velocityVariant = getVelocityBadgeVariant(proposal.salesVelocity);
            const confidenceVariant = getConfidenceBadgeVariant(proposal.confidenceScore);

            return (
              <DataTableRow key={proposal.id} className="hover:bg-gray-50">
                <DataTableCell>
                  <div>
                    <p className="font-medium text-gray-900">{proposal.articleName}</p>
                    <p className="text-xs text-gray-500">{proposal.articleCode}</p>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <span className="text-sm text-gray-700">{proposal.brandName}</span>
                </DataTableCell>
                <DataTableCell align="center">
                  <span className="font-mono text-sm">{proposal.currentStock.toLocaleString(getFormattingConfig().locale)}</span>
                </DataTableCell>
                <DataTableCell align="center">
                  <Badge variant={velocityVariant} size="sm">
                    {proposal.salesVelocity}
                  </Badge>
                </DataTableCell>
                <DataTableCell align="center">
                  <span className={cn('font-semibold', stockColor)}>
                    {proposal.weeksOfStock.toFixed(1)}w
                  </span>
                </DataTableCell>
                <DataTableCell align="right" className="font-mono">
                  {getCurrencySymbol()}{proposal.unitCost.toLocaleString(getFormattingConfig().locale)}
                </DataTableCell>
                <DataTableCell align="center">
                  <span className="font-mono text-sm font-semibold">
                    {proposal.proposedQty.toLocaleString(getFormattingConfig().locale)}
                  </span>
                </DataTableCell>
                <DataTableCell align="right" className="font-mono">
                  {formatCurrencyFromLakhs(proposal.totalCost / 100000)}
                </DataTableCell>
                <DataTableCell align="center">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant={confidenceVariant} size="sm">
                      {proposal.confidenceScore}%
                    </Badge>
                    {proposal.riskFactors.length > 0 && (
                      <span className="text-xs text-amber-600">{proposal.riskFactors.length} risk(s)</span>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell align="center">
                  {proposal.confidenceScore >= 85 ? (
                    <Badge variant="success" size="sm">
                      <CheckCircle className="w-3 h-3" />
                      Auto-Approved
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      <Clock className="w-3 h-3" />
                      Review Required
                    </Badge>
                  )}
                </DataTableCell>
              </DataTableRow>
            );
          })}
        </DataTableBody>
      </DataTable>

      {/* Footer Summary */}
      <div className="bg-gray-50 border-t border-gray-200 p-3">
        { }
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Total Value: <span className="font-semibold text-gray-900">
              {formatCurrencyFromLakhs(proposals.reduce((sum, p) => sum + p.totalCost, 0) / 100000)}
            </span>
          </span>
          <span className="text-gray-600">
            Auto-Approved: <span className="font-semibold text-green-700">
              {proposals.filter(p => p.confidenceScore >= 85).length}
            </span> of {proposals.length}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Risk Analysis Panel ─────────────────────────────────────────────────────

function RiskAnalysisPanel({ proposals }: { proposals: CoreReorderProposal[] }) {
  const riskDistribution = {
    low: proposals.filter(p => getRiskLevel(p) === 'low').length,
    medium: proposals.filter(p => getRiskLevel(p) === 'medium').length,
    high: proposals.filter(p => getRiskLevel(p) === 'high').length,
  };

  const commonRisks = proposals
    .flatMap(p => p.riskFactors)
    .reduce((acc, risk) => {
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topRisks = Object.entries(commonRisks)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Risk Analysis" subtitle="AI-identified risk factors across proposals" className="mb-4" />

      <div className="grid grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Risk Distribution</h4>
          <div className="space-y-3">
            {/* eslint-disable design-system/prefer-section-header -- badge+value rows, not section headers */}
            <div className="flex items-center justify-between">
              <Badge variant="success" dot size="sm">Low Risk</Badge>
              <span className="font-semibold text-green-700">{riskDistribution.low}</span>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="warning" dot size="sm">Medium Risk</Badge>
              <span className="font-semibold text-amber-700">{riskDistribution.medium}</span>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="destructive" dot size="sm">High Risk</Badge>
              <span className="font-semibold text-red-700">{riskDistribution.high}</span>
            </div>
            {/* eslint-enable design-system/prefer-section-header */}
          </div>
        </div>

        {/* Common Risk Factors */}
        <div>
          { }
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Common Risk Factors</h4>
          <div className="space-y-2">
            {topRisks.length > 0 ? (
              topRisks.map(([risk, count]) => (
                // eslint-disable-next-line design-system/prefer-section-header -- risk factor row
                <div key={risk} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{risk}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {count} articles
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No risk factors identified</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface BuyPlanCorePageProps {
  buyPlan?: BuyPlan;
}

export function BuyPlanCorePage({ buyPlan }: BuyPlanCorePageProps) {
  const [category, setCategory] = useState('all');
  const [brand, setBrand] = useState('all');
  const [velocity, setVelocity] = useState('all');
  const [riskLevel, setRiskLevel] = useState('all');

  // Search and filter
  const search = useSearch(mockCoreReorderProposals, { fields: ['articleName', 'articleCode', 'brandName'] });

  // Apply filters manually
  const finalFiltered = useMemo(() => {
    let result = search.results;

    if (category !== 'all') {
      result = result.filter(p => p.category === category);
    }
    if (brand !== 'all') {
      result = result.filter(p => p.brandName === brand);
    }
    if (velocity !== 'all') {
      result = result.filter(p => p.salesVelocity === velocity);
    }
    if (riskLevel !== 'all') {
      result = result.filter(p => getRiskLevel(p) === riskLevel);
    }

    return result;
  }, [search.results, category, brand, velocity, riskLevel]);

  const hasActiveFilters = category !== 'all' || brand !== 'all' || velocity !== 'all' || riskLevel !== 'all' || search.query;
  const clearFilters = () => {
    setCategory('all');
    setBrand('all');
    setVelocity('all');
    setRiskLevel('all');
    search.setQuery('');
  };

  // Status summary
  const statusSummary = useMemo(() => {
    const total = mockCoreReorderProposals.length;
    const autoApproved = mockCoreReorderProposals.filter(p => p.confidenceScore >= 85).length;
    const reviewRequired = total - autoApproved;
    const lowStock = mockCoreReorderProposals.filter(p => p.weeksOfStock < 4).length;
    return { total, autoApproved, reviewRequired, lowStock };
  }, []);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Core/NOOS Replenishment"
        subtitle="Auto-replenishment for core articles using VMI"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button size="sm">
              <RefreshCw className="w-4 h-4" />
              Refresh Proposals
            </Button>
          </div>
        }
      />

      <VMISummaryCards buyPlan={buyPlan} />

      {/* Filters */}
      <FilterBar>
        <FilterSelect
          value={category}
          onChange={setCategory}
          options={categoryOptions}
          placeholder="Category"
          searchable
        />
        <FilterSelect
          value={brand}
          onChange={setBrand}
          options={brandOptions}
          placeholder="Brand"
          searchable
        />
        <FilterSelect
          value={velocity}
          onChange={setVelocity}
          options={velocityOptions}
          placeholder="Revenue Velocity"
          searchable
        />
        <FilterSelect
          value={riskLevel}
          onChange={setRiskLevel}
          options={riskLevelOptions}
          placeholder="Risk Level"
          searchable
        />
        <FilterSearch
          value={search.query}
          onChange={search.setQuery}
          placeholder="Search articles..."
        />
        {hasActiveFilters && <FilterClear onClear={clearFilters} />}
      </FilterBar>

      {/* Inline summary strip */}
      <p className="text-xs text-gray-500 px-1">
        {statusSummary.total} articles • {statusSummary.autoApproved} auto-approved • {statusSummary.reviewRequired} review required • {statusSummary.lowStock} low stock
      </p>

      { }
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="col-span-2">
          <CoreArticlesTable proposals={finalFiltered} />
        </div>
        <div>
          <RiskAnalysisPanel proposals={finalFiltered} />
        </div>
      </div>
    </div>
  );
}