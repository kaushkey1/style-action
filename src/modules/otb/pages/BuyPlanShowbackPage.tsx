/* eslint-disable design-system/prefer-section-header -- showback uses custom layouts */
import { useState, useMemo } from 'react';
import {
  Badge,
  Button,
  SectionHeader,
  MetricGrid,
  EmptyState,
  FilterBar,
  FilterSelect,
  FilterSearch,
  FilterClear,
  Modal,
  ModalFooter,
} from '@/components/ui';
import {
  Eye,
  Presentation,
  Edit,
  Download,
  Share2,
  ShoppingBag,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Palette,
  Tag,
} from 'lucide-react';
import {formatCurrencyFromLakhs, cn, getFormattingConfig, getCurrencySymbol} from '@/lib/utils';
import {
  mockBuyPlanDesigns,
  mockBrandOTBTracking,
  type BuyPlan,
  type BuyPlanDesign,
  type ShowbackSubMode,
} from '../data/mockBuyPlan';
import { useSearch } from '@/hooks/useSearch';

// ─── Types & Constants ───────────────────────────────────────────────────────

const statusConfig = {
  pending: { label: 'Pending Review', variant: 'warning' as const, icon: Clock },
  approved: { label: 'Approved', variant: 'success' as const, icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'error' as const, icon: X },
  revision: { label: 'Needs Revision', variant: 'default' as const, icon: AlertTriangle },
};

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
  { value: 'Free Spirit', label: 'Free Spirit' },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'revision', label: 'Needs Revision' },
];

// ─── Sub-mode Toggle ─────────────────────────────────────────────────────────

interface SubModeToggleProps {
  subMode: ShowbackSubMode;
  setSubMode: (mode: ShowbackSubMode) => void;
  designCount: number;
}

function SubModeToggle({ subMode, setSubMode, designCount }: SubModeToggleProps) {
  return (
     
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setSubMode('normal')}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${subMode === 'normal'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          <Eye className="w-4 h-4" />
          Normal View
        </button>
        <button
          onClick={() => setSubMode('presentation')}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${subMode === 'presentation'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          <Presentation className="w-4 h-4" />
          Presentation Mode
        </button>
        <button
          onClick={() => setSubMode('revision')}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${subMode === 'revision'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          <Edit className="w-4 h-4" />
          Revision Mode
        </button>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-500">
          {designCount} designs selected
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── OTB Summary Cards ───────────────────────────────────────────────────────

function OTBSummaryCards({ buyPlan }: { buyPlan?: BuyPlan }) {
  if (!buyPlan) return null;

  const utilizationPct = (buyPlan.totalSpend / buyPlan.totalBudget) * 100;

  return (
    <MetricGrid columns={4}>
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">Total Budget</span>
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{formatCurrencyFromLakhs(buyPlan.totalBudget)}</p>
        <p className="text-xs text-gray-500 mt-1">allocated for {buyPlan.season}</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">Current Spend</span>
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{formatCurrencyFromLakhs(buyPlan.totalSpend)}</p>
        <p className="text-xs text-gray-500 mt-1">{utilizationPct.toFixed(1)}% utilization</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">Designs</span>
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{buyPlan.designCount}</p>
        <p className="text-xs text-gray-500 mt-1">across {buyPlan.brandCount} brands</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">Avg Margin</span>
          </div>
          <Badge variant="success" size="sm">On Track</Badge>
        </div>
        <p className="text-2xl font-bold text-gray-900">58.7%</p>
        <p className="text-xs text-gray-500 mt-1">target: 55%</p>
      </div>
    </MetricGrid>
  );
}

// ─── Brand OTB Tracking Table ────────────────────────────────────────────────

function BrandOTBTable() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <SectionHeader title="OTB Tracking by Brand" subtitle="Budget allocation and utilization" className="mb-0" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Brand</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Allocated</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Spent</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Utilization</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Designs</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockBrandOTBTracking.map((brand) => (
              <tr key={brand.brandName} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <span className="font-medium text-gray-900">{brand.brandName}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-sm">
                  {formatCurrencyFromLakhs(brand.allocatedBudget)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-sm">
                  {formatCurrencyFromLakhs(brand.spentBudget)}
                </td>
                <td className="px-3 py-2 text-center">
                  <Badge
                    variant={
                      brand.utilization >= 80 ? 'success' :
                      brand.utilization >= 70 ? 'warning' : 'destructive'
                    }
                    dot
                    size="sm"
                  >
                    {brand.utilization.toFixed(1)}%
                  </Badge>
                </td>
                <td className="px-3 py-2 text-center text-sm text-gray-600">
                  {brand.designCount}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={cn(
                    'font-medium text-sm',
                    brand.avgMargin >= 55 ? 'text-green-700' : 'text-amber-700'
                  )}>
                    {brand.avgMargin.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Design Card Component ───────────────────────────────────────────────────

interface DesignCardProps {
  design: BuyPlanDesign;
  subMode: ShowbackSubMode;
  onSelect?: (design: BuyPlanDesign) => void;
}

function DesignCard({ design, subMode, onSelect }: DesignCardProps) {
  const status = statusConfig[design.status];
  const StatusIcon = status.icon;

  const marginClass = design.marginPercent >= 55 ? 'text-green-700' : 'text-amber-700';

  if (subMode === 'presentation') {
    return (
      <button
        className="bg-black rounded-lg overflow-hidden relative w-full text-left"
        onClick={() => onSelect?.(design)}
        aria-label={`View details for ${design.designName}`}
      >
        <img
          src={design.imageUrl}
          alt={design.designName}
          className="w-full aspect-[3/4] object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h3 className="text-white font-semibold text-lg mb-1">{design.designName}</h3>
          <p className="text-gray-500 text-sm">{design.brandName}</p>
          { }
          <div className="flex items-center justify-between mt-2">
            <span className="text-white font-bold text-xl">{getCurrencySymbol()}{design.retailPrice.toLocaleString(getFormattingConfig().locale)}</span>
            <Badge variant={status.variant} size="sm">{status.label}</Badge>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      className="bg-white rounded-lg border border-gray-200 p-3 hover:border-primary/30 hover:shadow-md transition-all duration-200 w-full text-left"
      onClick={() => onSelect?.(design)}
      aria-label={`View details for ${design.designName}`}
    >
      {/* Header: Name and Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
          {design.designName}
        </h3>
        <Badge variant={status.variant} size="sm">
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </Badge>
      </div>

      {/* Image */}
      <div className="mb-3">
        <img
          src={design.imageUrl}
          alt={design.designName}
          className="w-full h-48 object-cover rounded-lg bg-gray-100"
        />
      </div>

      {/* Brand and Category */}
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
          {design.brandName}
        </span>
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
          {design.category}
        </span>
      </div>

      {/* Key Metrics */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Retail Price:</span>
          <span className="font-semibold text-gray-900">{getCurrencySymbol()}{design.retailPrice.toLocaleString(getFormattingConfig().locale)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Cost/Piece:</span>
          <span className="font-mono text-gray-900">{getCurrencySymbol()}{design.costPerPiece.toLocaleString(getFormattingConfig().locale)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Margin:</span>
          <span className={cn('font-semibold', marginClass)}>
            {design.marginPercent.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Cost:</span>
          <span className="font-mono text-gray-900">{formatCurrencyFromLakhs(design.totalCost / 100000)}</span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {design.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="px-1.5 py-0.5 text-xs text-gray-600 bg-gray-100 rounded">
            {tag}
          </span>
        ))}
      </div>

      {/* Footer: Quality info */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span>Quality: {design.qualityGrade}</span>
          <span>•</span>
          <span>Risk: {design.riskLevel}</span>
        </div>
        <span>{design.leadTime} days</span>
      </div>

      {/* Revision Notes (if any) */}
      {design.notes && subMode === 'revision' && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
          <p className="text-xs text-amber-800">{design.notes}</p>
        </div>
      )}
    </button>
  );
}

// ─── Design Grid ─────────────────────────────────────────────────────────────

interface DesignGridProps {
  designs: BuyPlanDesign[];
  subMode: ShowbackSubMode;
}

function DesignGrid({ designs, subMode }: DesignGridProps) {
  const [selectedDesign, setSelectedDesign] = useState<BuyPlanDesign | null>(null);

  if (designs.length === 0) {
    return <EmptyState description="No designs match your current filters" />;
  }

  return (
    <>
      <div className={cn(
        'grid gap-3',
        subMode === 'presentation' ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      )}>
        {designs.map((design) => (
          <DesignCard
            key={design.id}
            design={design}
            subMode={subMode}
            onSelect={setSelectedDesign}
          />
        ))}
      </div>

      {/* Design Detail Modal */}
      {selectedDesign && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDesign(null)}
          size="lg"
        >
          <div className="p-4">
            <div className="flex items-start gap-6">
              <img
                src={selectedDesign.imageUrl}
                alt={selectedDesign.designName}
                className="w-64 h-80 object-cover rounded-lg bg-gray-100"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedDesign.designName}</h2>
                    <p className="text-gray-600">{selectedDesign.brandName} • {selectedDesign.category}</p>
                  </div>
                  <Badge variant={statusConfig[selectedDesign.status].variant}>
                    {statusConfig[selectedDesign.status].label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Retail Price</p>
                    <p className="text-lg font-bold">{getCurrencySymbol()}{selectedDesign.retailPrice.toLocaleString(getFormattingConfig().locale)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Cost per Piece</p>
                    <p className="text-lg font-bold">{getCurrencySymbol()}{selectedDesign.costPerPiece.toLocaleString(getFormattingConfig().locale)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Margin</p>
                    <p className={cn('text-lg font-bold', selectedDesign.marginPercent >= 55 ? 'text-green-700' : 'text-amber-700')}>
                      {selectedDesign.marginPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Total Investment</p>
                    <p className="text-lg font-bold">{formatCurrencyFromLakhs(selectedDesign.totalCost / 100000)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Fabric</p>
                    <p className="text-sm text-gray-900">{selectedDesign.fabricComposition}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Size Range</p>
                    <p className="text-sm text-gray-900">{selectedDesign.sizeRange}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Vendor</p>
                    <p className="text-sm text-gray-900">{selectedDesign.vendorName}</p>
                  </div>
                  {selectedDesign.notes && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Notes</p>
                      <p className="text-sm text-amber-800 bg-amber-50 p-2 rounded">{selectedDesign.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setSelectedDesign(null)}>
              Close
            </Button>
            <Button>
              Add to Favorites
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface BuyPlanShowbackPageProps {
  buyPlan?: BuyPlan;
}

export function BuyPlanShowbackPage({ buyPlan }: BuyPlanShowbackPageProps) {
  const [subMode, setSubMode] = useState<ShowbackSubMode>('normal');
  const [category, setCategory] = useState('all');
  const [brand, setBrand] = useState('all');
  const [status, setStatus] = useState('all');

  // Search and filter
  const search = useSearch(mockBuyPlanDesigns, { fields: ['designName', 'brandName', 'tags'] });

  // Apply filters manually
  const filteredDesigns = useMemo(() => {
    let result = search.results;

    if (category !== 'all') {
      result = result.filter(d => d.category === category);
    }
    if (brand !== 'all') {
      result = result.filter(d => d.brandName === brand);
    }
    if (status !== 'all') {
      result = result.filter(d => d.status === status);
    }

    return result;
  }, [search.results, category, brand, status]);

  const hasActiveFilters = category !== 'all' || brand !== 'all' || status !== 'all' || search.query;
  const clearFilters = () => {
    setCategory('all');
    setBrand('all');
    setStatus('all');
    search.setQuery('');
  };

  // Get status summary for inline summary strip
  const statusSummary = useMemo(() => {
    const counts = {
      total: mockBuyPlanDesigns.length,
      pending: mockBuyPlanDesigns.filter(d => d.status === 'pending').length,
      approved: mockBuyPlanDesigns.filter(d => d.status === 'approved').length,
      revision: mockBuyPlanDesigns.filter(d => d.status === 'revision').length,
      rejected: mockBuyPlanDesigns.filter(d => d.status === 'rejected').length,
    };
    return counts;
  }, []);

  return (
    <div className="space-y-4">
      <SubModeToggle
        subMode={subMode}
        setSubMode={setSubMode}
        designCount={filteredDesigns.length}
      />

      {subMode !== 'presentation' && <OTBSummaryCards buyPlan={buyPlan} />}

      {subMode !== 'presentation' && <BrandOTBTable />}

      {/* Design Section */}
      <div className="space-y-3">
        {subMode !== 'presentation' && (
          <>
            <SectionHeader
              title="Design Collection"
              subtitle={`${buyPlan?.season || 'SS24'} designs for review and approval`}
            />

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
                value={status}
                onChange={setStatus}
                options={statusOptions}
                placeholder="Status"
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
              {statusSummary.total} designs • {statusSummary.approved} approved • {statusSummary.pending} pending • {statusSummary.revision} revision needed
            </p>
          </>
        )}

        <DesignGrid designs={filteredDesigns} subMode={subMode} />
      </div>
    </div>
  );
}