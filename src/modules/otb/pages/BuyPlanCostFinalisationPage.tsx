/* eslint-disable design-system/prefer-section-header -- cost finalisation uses custom layouts */
import { useState, useMemo } from 'react';
import {
  Badge,
  Button,
  SectionHeader,
  EmptyState,
  MetricGrid,
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
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  Calculator,
  Package,
} from 'lucide-react';
import {formatCurrencyFromLakhs, cn, getFormattingConfig, getCurrencySymbol} from '@/lib/utils';
import {
  mockBuyPlanDesigns,
  type BuyPlan,
  type BuyPlanDesign,
} from '../data/mockBuyPlan';
import { useSearch } from '@/hooks/useSearch';

// ─── Types & Constants ───────────────────────────────────────────────────────

interface CostBreakdown {
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  shippingCost: number;
  marginAmount: number;
  totalCost: number;
}

interface NegotiationHistory {
  id: string;
  date: string;
  action: string;
  user: string;
  oldPrice: number;
  newPrice: number;
  notes: string;
}

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'Dresses', label: 'Dresses' },
  { value: 'Tops', label: 'Tops' },
  { value: 'Bottoms', label: 'Bottoms' },
  { value: 'Outerwear', label: 'Outerwear' },
];

const brandOptions = [
  { value: 'all', label: 'All Brands' },
  { value: 'Trending Collections', label: 'Trending Collections' },
  { value: 'Classic Wear', label: 'Classic Wear' },
  { value: 'Urban Style', label: 'Urban Style' },
  { value: 'Bohemian Dreams', label: 'Bohemian Dreams' },
  { value: 'Summer Vibes', label: 'Summer Vibes' },
];

const costStatusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending-negotiation', label: 'Pending Negotiation' },
  { value: 'finalized', label: 'Cost Finalized' },
  { value: 'requires-approval', label: 'Requires Approval' },
];

// ─── Helper Functions ────────────────────────────────────────────────────────

function getCostStatus(design: BuyPlanDesign): {
  status: 'pending-negotiation' | 'finalized' | 'requires-approval';
  variant: 'warning' | 'success' | 'error';
  label: string;
} {
  if (design.marginPercent < 50) {
    return { status: 'requires-approval', variant: 'error', label: 'Low Margin' };
  }
  if (design.status === 'approved') {
    return { status: 'finalized', variant: 'success', label: 'Finalized' };
  }
  return { status: 'pending-negotiation', variant: 'warning', label: 'Negotiating' };
}

function generateCostBreakdown(design: BuyPlanDesign): CostBreakdown {
  const materialCost = design.costPerPiece * 0.65; // 65% of cost is materials
  const laborCost = design.costPerPiece * 0.20; // 20% is labor
  const overheadCost = design.costPerPiece * 0.10; // 10% overhead
  const shippingCost = design.costPerPiece * 0.05; // 5% shipping
  const marginAmount = design.retailPrice - design.costPerPiece;
  const totalCost = design.costPerPiece;

  return {
    materialCost,
    laborCost,
    overheadCost,
    shippingCost,
    marginAmount,
    totalCost,
  };
}

function generateNegotiationHistory(): NegotiationHistory[] {
  return [
    {
      id: '1',
      date: '2024-03-08',
      action: 'Initial Quote',
      user: 'Vendor',
      oldPrice: 0,
      newPrice: 950,
      notes: 'Initial pricing submitted by vendor',
    },
    {
      id: '2',
      date: '2024-03-09',
      action: 'Counter Offer',
      user: 'Buying Team',
      oldPrice: 950,
      newPrice: 850,
      notes: 'Negotiated reduction based on volume commitment',
    },
    {
      id: '3',
      date: '2024-03-10',
      action: 'Final Agreement',
      user: 'Vendor',
      oldPrice: 850,
      newPrice: 875,
      notes: 'Agreed on final price with quality specifications',
    },
  ];
}

// ─── Cost Summary Cards ──────────────────────────────────────────────────────

function CostSummaryCards({ buyPlan }: { buyPlan?: BuyPlan }) {
  if (!buyPlan) return null;

  const designs = mockBuyPlanDesigns.filter(d => d.buyPlanId === buyPlan.id);
  const totalCost = designs.reduce((sum, d) => sum + d.totalCost, 0);
  const avgMargin = designs.reduce((sum, d) => sum + d.marginPercent, 0) / designs.length;
  const pendingCount = designs.filter(d => getCostStatus(d).status === 'pending-negotiation').length;
  const totalSavings = 125000; // Mock savings amount

  return (
    <MetricGrid columns={4}>
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">Total Cost</span>
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{formatCurrencyFromLakhs(totalCost / 100000)}</p>
        <p className="text-xs text-gray-500 mt-1">across all designs</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">Avg Margin</span>
          </div>
          <Badge variant="success" size="sm">Above Target</Badge>
        </div>
        <p className="text-2xl font-bold text-green-700">{avgMargin.toFixed(1)}%</p>
        <p className="text-xs text-gray-500 mt-1">target: 55%</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">Pending</span>
          </div>
        </div>
        <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
        <p className="text-xs text-gray-500 mt-1">cost negotiations</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">Savings</span>
          </div>
          <Badge variant="success" size="sm">Negotiated</Badge>
        </div>
        <p className="text-2xl font-bold text-green-700">{formatCurrencyFromLakhs(totalSavings / 100000)}</p>
        <p className="text-xs text-gray-500 mt-1">vs initial quotes</p>
      </div>
    </MetricGrid>
  );
}

// ─── Expandable Design Row ───────────────────────────────────────────────────

interface ExpandableDesignRowProps {
  design: BuyPlanDesign;
  isExpanded: boolean;
  onToggle: () => void;
}

function ExpandableDesignRow({ design, isExpanded, onToggle }: ExpandableDesignRowProps) {
  const costStatus = getCostStatus(design);
  const costBreakdown = generateCostBreakdown(design);
  const negotiationHistory = generateNegotiationHistory();

  const marginClass = design.marginPercent >= 55
    ? 'text-green-700'
    : design.marginPercent >= 50
    ? 'text-amber-700'
    : 'text-red-700';

  return (
    <>
      {/* Main Row */}
      <DataTableRow
        onClick={onToggle}
        className="cursor-pointer hover:bg-gray-50"
      >
        <DataTableCell>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            <div>
              <p className="font-medium text-gray-900">{design.designName}</p>
              <p className="text-xs text-gray-500">{design.styleCode}</p>
            </div>
          </div>
        </DataTableCell>
        <DataTableCell>
          <span className="text-sm text-gray-700">{design.brandName}</span>
        </DataTableCell>
        <DataTableCell>
          <span className="text-sm text-gray-700">{design.category}</span>
        </DataTableCell>
        <DataTableCell align="right" className="font-mono">
          {getCurrencySymbol()}{design.costPerPiece.toLocaleString(getFormattingConfig().locale)}
        </DataTableCell>
        <DataTableCell align="right" className="font-mono">
          {getCurrencySymbol()}{design.retailPrice.toLocaleString(getFormattingConfig().locale)}
        </DataTableCell>
        <DataTableCell align="center">
          <span className={cn('font-semibold', marginClass)}>
            {design.marginPercent.toFixed(1)}%
          </span>
        </DataTableCell>
        <DataTableCell align="right" className="font-mono">
          {formatCurrencyFromLakhs(design.totalCost / 100000)}
        </DataTableCell>
        <DataTableCell align="center">
          <Badge variant={costStatus.variant} size="sm">
            {costStatus.label}
          </Badge>
        </DataTableCell>
      </DataTableRow>

      {/* Expanded Details */}
      {isExpanded && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="bg-gray-50 border-t border-gray-100 p-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Cost Breakdown */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Cost Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Materials:</span>
                      <span className="font-mono">{getCurrencySymbol()}{costBreakdown.materialCost.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Labor:</span>
                      <span className="font-mono">{getCurrencySymbol()}{costBreakdown.laborCost.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Overhead:</span>
                      <span className="font-mono">{getCurrencySymbol()}{costBreakdown.overheadCost.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-mono">{getCurrencySymbol()}{costBreakdown.shippingCost.toFixed(0)}</span>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gray-900">Total Cost:</span>
                      <span className="font-mono">{getCurrencySymbol()}{costBreakdown.totalCost.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gray-900">Margin:</span>
                      <span className={cn('font-mono', marginClass)}>
                        {getCurrencySymbol()}{costBreakdown.marginAmount.toFixed(0)} ({design.marginPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Negotiation History */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Negotiation History</h4>
                  <div className="space-y-3">
                    {negotiationHistory.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          { }
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{entry.action}</span>
                            <span className="text-xs text-gray-500">{entry.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>by {entry.user}</span>
                            {entry.oldPrice > 0 && (
                              <>
                                <span>•</span>
                                <span className="line-through">{getCurrencySymbol()}{entry.oldPrice}</span>
                                <span>→</span>
                                <span className="font-medium">{getCurrencySymbol()}{entry.newPrice}</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{entry.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4" />
                  View PO Draft
                </Button>
                <Button size="sm">
                  Finalize Cost
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Cost Finalization Table ─────────────────────────────────────────────────

interface CostFinalizationTableProps {
  designs: BuyPlanDesign[];
}

function CostFinalizationTable({ designs }: CostFinalizationTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (designId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(designId)) {
        newSet.delete(designId);
      } else {
        newSet.add(designId);
      }
      return newSet;
    });
  };

  if (designs.length === 0) {
    return <EmptyState description="No designs available for cost finalization" />;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <DataTable>
        <DataTableHeader>
          <DataTableHead>Design</DataTableHead>
          <DataTableHead>Brand</DataTableHead>
          <DataTableHead>Category</DataTableHead>
          <DataTableHead align="right">Cost/Piece</DataTableHead>
          <DataTableHead align="right">Retail Price</DataTableHead>
          <DataTableHead align="center">Margin</DataTableHead>
          <DataTableHead align="right">Total Cost</DataTableHead>
          <DataTableHead align="center">Status</DataTableHead>
        </DataTableHeader>
        <DataTableBody>
          {designs.map((design) => (
            <ExpandableDesignRow
              key={design.id}
              design={design}
              isExpanded={expandedRows.has(design.id)}
              onToggle={() => toggleRow(design.id)}
            />
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface BuyPlanCostFinalisationPageProps {
  buyPlan?: BuyPlan;
}

export function BuyPlanCostFinalisationPage({ buyPlan }: BuyPlanCostFinalisationPageProps) {
  const [category, setCategory] = useState('all');
  const [brand, setBrand] = useState('all');
  const [costStatus, setCostStatus] = useState('all');

  // Filter only designs for this buy plan and approved status (ready for cost finalization)
  const buyPlanDesigns = mockBuyPlanDesigns.filter(d =>
    buyPlan ? d.buyPlanId === buyPlan.id : true
  );

  // Search and filter
  const search = useSearch(buyPlanDesigns, { fields: ['designName', 'brandName'] });

  // Apply filters manually
  const finalFiltered = useMemo(() => {
    let result = search.results;

    if (category !== 'all') {
      result = result.filter(d => d.category === category);
    }
    if (brand !== 'all') {
      result = result.filter(d => d.brandName === brand);
    }
    if (costStatus !== 'all') {
      result = result.filter(d => getCostStatus(d).status === costStatus);
    }

    return result;
  }, [search.results, category, brand, costStatus]);

  const hasActiveFilters = category !== 'all' || brand !== 'all' || costStatus !== 'all' || search.query;
  const clearFilters = () => {
    setCategory('all');
    setBrand('all');
    setCostStatus('all');
    search.setQuery('');
  };

  // Status summary
  const statusSummary = useMemo(() => {
    const total = buyPlanDesigns.length;
    const finalized = buyPlanDesigns.filter(d => getCostStatus(d).status === 'finalized').length;
    const pending = buyPlanDesigns.filter(d => getCostStatus(d).status === 'pending-negotiation').length;
    const approval = buyPlanDesigns.filter(d => getCostStatus(d).status === 'requires-approval').length;
    return { total, finalized, pending, approval };
  }, [buyPlanDesigns]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Cost Finalisation"
        subtitle="Review and finalize pricing for approved designs"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
              Export Cost Sheet
            </Button>
            <Button size="sm">
              <Package className="w-4 h-4" />
              Generate POs
            </Button>
          </div>
        }
      />

      <CostSummaryCards buyPlan={buyPlan} />

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
          value={costStatus}
          onChange={setCostStatus}
          options={costStatusOptions}
          placeholder="Cost Status"
          searchable
        />
        <FilterSearch
          value={search.query}
          onChange={search.setQuery}
          placeholder="Search designs..."
        />
        {hasActiveFilters && <FilterClear onClear={clearFilters} />}
      </FilterBar>

      {/* Inline summary strip */}
      <p className="text-xs text-gray-500 px-1">
        {statusSummary.total} designs • {statusSummary.finalized} finalized • {statusSummary.pending} pending negotiation • {statusSummary.approval} require approval
      </p>

      <CostFinalizationTable designs={finalFiltered} />
    </div>
  );
}